import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// ─── GET /api/control-acciones ────────────────────────────────────────────────
// Without ?year  → { years: number[] }           (distinct years)
// With ?year=YYYY → { data: ControlRow[] }        (rows for that year)
export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");

  try {
    // ── Return available years ────────────────────────────────────────────
    if (!year) {
      const rows = await sql`
        SELECT DISTINCT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS year
        FROM acr_registros
        WHERE COALESCE(fecha_registro, created_at::date) IS NOT NULL
        ORDER BY year DESC
      `;
      const years = rows.map((r) => r.year as number);
      return NextResponse.json({ years });
    }

    if (!/^\d{4}$/.test(year)) {
      return NextResponse.json({ error: "Parámetro year inválido" }, { status: 400 });
    }

    // ── Return rows for the given year ────────────────────────────────────
    const registros = await sql`
      SELECT
        r.id,
        r.consecutivo,
        r.tipo_accion,
        r.fecha_apertura,
        r.fecha_registro,
        r.proceso,
        r.fuente,
        r.cliente,
        r.estado,
        r.evaluacion_riesgo,
        -- Manual fields from control_acciones_seguimiento; fall back to plan responsables
        COALESCE(
          cas.resp_ejecucion,
          (
            SELECT rp.nombre
            FROM actividades_plan ap
            JOIN responsables_plan rp ON rp.actividad_plan_id = ap.id
            WHERE ap.acr_id = r.id AND rp.tipo = 'ejecucion'
            ORDER BY rp.id
            LIMIT 1
          )
        ) AS resp_ejecucion,
        COALESCE(
          cas.resp_seguimiento,
          (
            SELECT rp.nombre
            FROM actividades_plan ap
            JOIN responsables_plan rp ON rp.actividad_plan_id = ap.id
            WHERE ap.acr_id = r.id AND rp.tipo = 'seguimiento'
            ORDER BY rp.id
            LIMIT 1
          )
        ) AS resp_seguimiento,
        cas.eficaz,
        cas.fecha_verificacion_eficacia,
        cas.observaciones,
        cas.resp_ejecucion_email,
        cas.resp_seguimiento_email,
        cas.ultima_notificacion,
        cas.cierre_estimado
      FROM acr_registros r
      LEFT JOIN control_acciones_seguimiento cas ON cas.acr_id = r.id
      WHERE EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date)) = ${parseInt(year)}
      ORDER BY r.consecutivo ASC, r.created_at ASC
    `;

    return NextResponse.json({ data: registros });
  } catch (error) {
    console.error("GET /api/control-acciones error:", error);
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 });
  }
}

// ─── PATCH /api/control-acciones ──────────────────────────────────────────────
// Body: { acr_id: number, resp_ejecucion?, resp_seguimiento?, eficaz?, fecha_verificacion_eficacia?, observaciones? }
// Upserts the manual tracking fields for the given ACR.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { acr_id, resp_ejecucion, resp_seguimiento, eficaz, fecha_verificacion_eficacia, observaciones,
            resp_ejecucion_email, resp_seguimiento_email, cierre_estimado } = body;

    if (!acr_id || typeof acr_id !== "number") {
      return NextResponse.json({ error: "acr_id requerido" }, { status: 400 });
    }

    await sql`
      INSERT INTO control_acciones_seguimiento
        (acr_id, resp_ejecucion, resp_seguimiento, eficaz, fecha_verificacion_eficacia, observaciones,
         resp_ejecucion_email, resp_seguimiento_email, cierre_estimado, updated_at)
      VALUES
        (${acr_id}, ${resp_ejecucion ?? null}, ${resp_seguimiento ?? null},
         ${eficaz ?? null}, ${fecha_verificacion_eficacia ?? null}, ${observaciones ?? null},
         ${resp_ejecucion_email ?? null}, ${resp_seguimiento_email ?? null}, ${cierre_estimado ?? null}, NOW())
      ON CONFLICT (acr_id) DO UPDATE SET
        resp_ejecucion              = EXCLUDED.resp_ejecucion,
        resp_seguimiento            = EXCLUDED.resp_seguimiento,
        eficaz                      = EXCLUDED.eficaz,
        fecha_verificacion_eficacia = EXCLUDED.fecha_verificacion_eficacia,
        observaciones               = EXCLUDED.observaciones,
        resp_ejecucion_email        = EXCLUDED.resp_ejecucion_email,
        resp_seguimiento_email      = EXCLUDED.resp_seguimiento_email,
        cierre_estimado             = EXCLUDED.cierre_estimado,
        updated_at                  = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/control-acciones error:", error);
    return NextResponse.json({ error: "Error al guardar cambios" }, { status: 500 });
  }
}
