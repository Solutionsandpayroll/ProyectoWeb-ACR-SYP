import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { transporter, EMAIL_FROM } from '@/lib/email';
import { buildAcrNotificacionHtml } from '@/lib/email-templates/acr-notificacion';

/**
 * POST /api/cron/notificaciones-acr
 *
 * Sends a reminder email every 15 days to the responsible persons of open ACRs.
 * Protected by Authorization: Bearer <CRON_SECRET>.
 *
 * Trigger this endpoint with a scheduler (Vercel Cron, GitHub Actions, cron-job.org, etc.)
 * every day — the query filters only ACRs that haven't been notified in the last 15 days.
 *
 * Vercel Cron example (vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/notificaciones-acr", "schedule": "0 8 * * *" }]
 * }
 * (Vercel Cron uses GET; change the method check below if needed.)
 */
export async function POST(req: NextRequest) {
  // ── Auth check ───────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    // ── Query ACRs that need a notification ────────────────────────────────
    // Conditions:
    //   1. Not closed (estado != 'Cerrada')
    //   2. Has at least one email configured
    //   3. Has never been notified OR last notification was > 15 days ago
    const acrs = await sql`
      SELECT
        r.id,
        r.consecutivo,
        r.tipo_accion,
        r.proceso,
        r.cliente,
        r.estado,
        c.resp_ejecucion,
        c.resp_ejecucion_email,
        c.resp_seguimiento,
        c.resp_seguimiento_email,
        (
          SELECT MAX(rp.fecha_fin)
          FROM actividades_plan ap
          JOIN responsables_plan rp ON rp.actividad_plan_id = ap.id
          WHERE ap.acr_id = r.id AND rp.tipo = 'ejecucion'
        ) AS cierre_estimado
      FROM acr_registros r
      JOIN control_acciones_seguimiento c ON c.acr_id = r.id
      WHERE r.estado != 'Cerrada'
        AND (c.resp_ejecucion_email IS NOT NULL OR c.resp_seguimiento_email IS NOT NULL)
        AND (
          c.ultima_notificacion IS NULL
          OR c.ultima_notificacion < NOW() - INTERVAL '15 days'
        )
    `;

    if (acrs.length === 0) {
      return NextResponse.json({ message: 'No hay ACRs pendientes de notificación.', sent: 0 });
    }

    const results: { acr_id: number; consecutivo: string; emails: string[]; errors: string[] }[] = [];

    for (const acr of acrs) {
      const sentEmails: string[] = [];
      const errors: string[] = [];

      const cierreEstimado = acr.cierre_estimado
        ? new Date(acr.cierre_estimado).toLocaleDateString('es-CO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
        : null;

      const acrUrl = `${appUrl}/dashboard/historial-acr/${acr.id}`;
      const subject = `[ACR] Recordatorio — ${acr.tipo_accion} ${acr.consecutivo} sigue ${acr.estado}`;

      // ── Email al responsable del proceso ──────────────────────────────────
      if (acr.resp_ejecucion_email) {
        try {
          const html = buildAcrNotificacionHtml({
            consecutivo:        acr.consecutivo,
            tipo_accion:        acr.tipo_accion,
            proceso:            acr.proceso,
            cliente:            acr.cliente ?? '',
            estado:             acr.estado,
            cierre_estimado:    cierreEstimado,
            responsable_nombre: acr.resp_ejecucion ?? 'Responsable',
            rol:                'proceso',
            acr_url:            acrUrl,
          });
          await transporter.sendMail({
            from:    EMAIL_FROM,
            to:      acr.resp_ejecucion_email,
            subject,
            html,
          });
          sentEmails.push(acr.resp_ejecucion_email);
        } catch (e) {
          errors.push(`resp_ejecucion (${acr.resp_ejecucion_email}): ${(e as Error).message}`);
        }
      }

      // ── Email al responsable de seguimiento ───────────────────────────────
      if (acr.resp_seguimiento_email && acr.resp_seguimiento_email !== acr.resp_ejecucion_email) {
        try {
          const html = buildAcrNotificacionHtml({
            consecutivo:        acr.consecutivo,
            tipo_accion:        acr.tipo_accion,
            proceso:            acr.proceso,
            cliente:            acr.cliente ?? '',
            estado:             acr.estado,
            cierre_estimado:    cierreEstimado,
            responsable_nombre: acr.resp_seguimiento ?? 'Responsable',
            rol:                'seguimiento',
            acr_url:            acrUrl,
          });
          await transporter.sendMail({
            from:    EMAIL_FROM,
            to:      acr.resp_seguimiento_email,
            subject,
            html,
          });
          sentEmails.push(acr.resp_seguimiento_email);
        } catch (e) {
          errors.push(`resp_seguimiento (${acr.resp_seguimiento_email}): ${(e as Error).message}`);
        }
      }

      // ── Actualizar última notificación si se envió al menos un email ──────
      if (sentEmails.length > 0) {
        await sql`
          UPDATE control_acciones_seguimiento
          SET ultima_notificacion = NOW()
          WHERE acr_id = ${acr.id}
        `;
      }

      results.push({ acr_id: acr.id, consecutivo: acr.consecutivo, emails: sentEmails, errors });
    }

    const totalSent = results.reduce((n, r) => n + r.emails.length, 0);
    console.log(`[cron/notificaciones-acr] Enviados ${totalSent} emails en ${results.length} ACRs.`);

    return NextResponse.json({ sent: totalSent, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[cron/notificaciones-acr] Error:', msg);
    return NextResponse.json({ error: 'Error interno al enviar notificaciones', detail: msg }, { status: 500 });
  }
}

// Allow Vercel Cron (which uses GET) to also trigger this route
export { POST as GET };
