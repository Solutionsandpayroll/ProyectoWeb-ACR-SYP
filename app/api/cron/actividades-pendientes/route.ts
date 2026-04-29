import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { transporter, EMAIL_FROM } from '@/lib/email';
import { buildActividadesPendientesHtml, buildActividadesPendientesText, ActividadPendienteItem } from '@/lib/email-templates/actividades-pendientes';
import { RESPONSABLE_EMAILS } from '@/lib/responsables';

/**
 * POST /api/cron/actividades-pendientes
 *
 * Sends one email per person per activity type (ejecucion / seguimiento)
 * listing all their pending plan activities (estado = 'Abierta' or 'Parcial')
 * across all non-closed ACRs.
 *
 * Protected by Authorization: Bearer <CRON_SECRET>
 * Optionally accepts ?force=1 to bypass the interval check.
 *
 * Example curl:
 *   curl -X POST https://acr.solutionsandpayroll.com/api/cron/actividades-pendientes \
 *     -H "Authorization: Bearer <CRON_SECRET>"
 */
export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const appUrl    = /^https?:\/\//i.test(rawAppUrl) ? rawAppUrl : `https://${rawAppUrl}`;
  const forceSend = ['1', 'true', 'yes'].includes(
    (req.nextUrl.searchParams.get('force') ?? '').toLowerCase()
  );
  const dryRun = ['1', 'true', 'yes'].includes(
    (req.nextUrl.searchParams.get('dryrun') ?? '').toLowerCase()
  );

  // Interval check (same pattern as notificaciones-acr)
  const configuredInterval = Number(process.env.ACTIVIDADES_INTERVAL_MINUTES ?? 10080); // default 7 days
  const notificationIntervalMinutes =
    Number.isFinite(configuredInterval) && configuredInterval > 0
      ? Math.floor(configuredInterval)
      : 10080;

  try {
    // ── Query all pending plan activities grouped by responsable + tipo ────
    // Conditions:
    //   - ACR not closed
    //   - responsables_plan.estado in ('Abierta', 'Parcial')
    //   - responsables_plan.nombre not null
    //   - Either forceSend OR last notification for this person exceeded the interval
    const rows = await sql`
      SELECT
        rp.nombre           AS responsable,
        rp.tipo,
        rp.estado           AS actividad_estado,
        ap.descripcion      AS actividad_descripcion,
        r.id                AS acr_id,
        r.consecutivo,
        r.proceso,
        r.cliente,
        r.estado            AS acr_estado,
        an.ultima_notificacion
      FROM responsables_plan rp
      JOIN actividades_plan ap ON ap.id = rp.actividad_plan_id
      JOIN acr_registros    r  ON r.id  = ap.acr_id
      LEFT JOIN actividades_notificaciones an
             ON an.responsable = rp.nombre AND an.tipo = rp.tipo
      WHERE rp.estado IN ('Abierta', 'Parcial')
        AND r.estado  != 'Cerrada'
        AND rp.nombre IS NOT NULL
        AND rp.nombre != ''
      ORDER BY rp.nombre, rp.tipo, r.consecutivo
    `;

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No hay actividades pendientes.', sent: 0 });
    }

    // ── Group rows by (responsable, tipo) ──────────────────────────────────
    type Key = string; // `${nombre}|${tipo}`
    const grouped = new Map<Key, {
      responsable: string;
      tipo: 'ejecucion' | 'seguimiento';
      ultimaNotificacion: Date | null;
      actividades: ActividadPendienteItem[];
    }>();

    for (const row of rows) {
      const key: Key = `${row.responsable}|${row.tipo}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          responsable:         row.responsable,
          tipo:                row.tipo as 'ejecucion' | 'seguimiento',
          ultimaNotificacion:  row.ultima_notificacion ? new Date(row.ultima_notificacion) : null,
          actividades: [],
        });
      }
      grouped.get(key)!.actividades.push({
        acr_id:                row.acr_id,
        consecutivo:           row.consecutivo,
        proceso:               row.proceso,
        cliente:               row.cliente ?? null,
        acr_estado:            row.acr_estado,
        actividad_descripcion: row.actividad_descripcion,
        actividad_estado:      row.actividad_estado,
        acr_url:               `${appUrl}/dashboard/historial-acr/${row.acr_id}`,
      });
    }

    const results: {
      responsable: string;
      tipo: string;
      email: string;
      sent: boolean;
      skipped?: boolean;
      error?: string;
    }[] = [];

    const now = new Date();

    for (const [, group] of grouped) {
      const { responsable, tipo, ultimaNotificacion, actividades } = group;

      // Look up email
      const email = RESPONSABLE_EMAILS[responsable];
      if (!email) {
        results.push({ responsable, tipo, email: '', sent: false, skipped: true });
        continue;
      }

      // Check interval unless force
      if (!forceSend && ultimaNotificacion) {
        const minutesSinceLast =
          (now.getTime() - ultimaNotificacion.getTime()) / 60000;
        if (minutesSinceLast < notificationIntervalMinutes) {
          results.push({ responsable, tipo, email, sent: false, skipped: true });
          continue;
        }
      }

      // Build and send email
      const tipoLabel = tipo === 'ejecucion' ? 'Ejecución' : 'Seguimiento';
      const subject   = `[ACR] Actividades Pendientes — ${tipoLabel}`;

      try {
        const html = buildActividadesPendientesHtml({ responsable_nombre: responsable, tipo, actividades });
        const text = buildActividadesPendientesText({ responsable_nombre: responsable, tipo, actividades });
        await transporter.sendMail({ from: EMAIL_FROM, to: email, subject, html, text });

        // Upsert last notification timestamp
        if (!dryRun) {
          await sql`
            INSERT INTO actividades_notificaciones (responsable, tipo, ultima_notificacion)
            VALUES (${responsable}, ${tipo}, NOW())
            ON CONFLICT (responsable, tipo)
            DO UPDATE SET ultima_notificacion = NOW()
          `;
        }

        results.push({ responsable, tipo, email, sent: true });
      } catch (e) {
        results.push({ responsable, tipo, email, sent: false, error: (e as Error).message });
      }
    }

    const totalSent = results.filter((r) => r.sent).length;
    console.log(`[cron/actividades-pendientes] Enviados ${totalSent} emails.`);

    return NextResponse.json({
      sent: totalSent,
      results,
      force: forceSend,
      dryRun,
      intervalMinutes: notificationIntervalMinutes,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[cron/actividades-pendientes] Error:', msg);
    return NextResponse.json(
      { error: 'Error interno al enviar notificaciones de actividades', detail: msg },
      { status: 500 }
    );
  }
}

// Allow GET for Vercel Cron compatibility
export { POST as GET };
