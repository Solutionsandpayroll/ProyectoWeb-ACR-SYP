import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year'); // e.g. "2026" or "all"
    const mode      = searchParams.get('mode');  // "compare" or null

    // Always fetch available years for the year-selector UI
    const yearsRows = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio
      FROM acr_registros
      ORDER BY anio
    `;
    const availableYears = (yearsRows as Array<{ anio: number }>).map((r) => r.anio);

    /* ── COMPARE MODE ─────────────────────────────────────────────────────── */
    if (mode === 'compare') {
      const [totalPorAnio, costoPorAnio, tipoAccionPorAnio, estadoPorAnio] = await Promise.all([
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio,
                 COUNT(*)::int AS value
          FROM acr_registros
          GROUP BY anio ORDER BY anio
        `,
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int AS anio,
                 ROUND((COALESCE(SUM(c.costo_total), 0) / 1000000.0)::numeric, 3)::float AS value
          FROM acr_registros r
          LEFT JOIN costos_asociados c ON c.acr_id = r.id
          GROUP BY anio ORDER BY anio
        `,
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio,
                 tipo_accion,
                 COUNT(*)::int AS value
          FROM acr_registros
          GROUP BY anio, tipo_accion ORDER BY anio, value DESC
        `,
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio,
                 estado,
                 COUNT(*)::int AS value
          FROM acr_registros
          GROUP BY anio, estado ORDER BY anio, value DESC
        `,
      ]);

      return NextResponse.json({ mode: 'compare', availableYears, totalPorAnio, costoPorAnio, tipoAccionPorAnio, estadoPorAnio });
    }

    /* ── NORMAL MODE (single year or all) ────────────────────────────────── */
    const yearNum = yearParam && yearParam !== 'all' ? parseInt(yearParam, 10) : null;

    const [
      porTipoAccion,
      porProceso,
      porCliente,
      porEstado,
      costoPorProceso,
      porProcesoYFuente,
      costoTotal,
    ] = await Promise.all([
      yearNum !== null
        ? sql`SELECT tipo_accion AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY tipo_accion ORDER BY value DESC`
        : sql`SELECT tipo_accion AS label, COUNT(*)::int AS value FROM acr_registros
              GROUP BY tipo_accion ORDER BY value DESC`,

      yearNum !== null
        ? sql`SELECT proceso AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE proceso IS NOT NULL AND proceso <> ''
                AND EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY proceso ORDER BY value DESC LIMIT 15`
        : sql`SELECT proceso AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE proceso IS NOT NULL AND proceso <> ''
              GROUP BY proceso ORDER BY value DESC LIMIT 15`,

      yearNum !== null
        ? sql`SELECT cliente AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE cliente IS NOT NULL AND cliente <> ''
                AND EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY cliente ORDER BY value DESC LIMIT 15`
        : sql`SELECT cliente AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE cliente IS NOT NULL AND cliente <> ''
              GROUP BY cliente ORDER BY value DESC LIMIT 15`,

      yearNum !== null
        ? sql`SELECT estado AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY estado`
        : sql`SELECT estado AS label, COUNT(*)::int AS value FROM acr_registros GROUP BY estado`,

      yearNum !== null
        ? sql`SELECT r.proceso AS label,
                     ROUND((COALESCE(SUM(c.costo_total), 0) / 1000000.0)::numeric, 3)::float AS value
              FROM acr_registros r LEFT JOIN costos_asociados c ON c.acr_id = r.id
              WHERE r.proceso IS NOT NULL AND r.proceso <> ''
                AND EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int = ${yearNum}
              GROUP BY r.proceso ORDER BY value DESC LIMIT 10`
        : sql`SELECT r.proceso AS label,
                     ROUND((COALESCE(SUM(c.costo_total), 0) / 1000000.0)::numeric, 3)::float AS value
              FROM acr_registros r LEFT JOIN costos_asociados c ON c.acr_id = r.id
              WHERE r.proceso IS NOT NULL AND r.proceso <> ''
              GROUP BY r.proceso ORDER BY value DESC LIMIT 10`,

      yearNum !== null
        ? sql`SELECT proceso, fuente AS subcategoria, COUNT(*)::int AS conteo FROM acr_registros
              WHERE proceso IS NOT NULL AND fuente IS NOT NULL
                AND EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY proceso, fuente ORDER BY conteo DESC, proceso`
        : sql`SELECT proceso, fuente AS subcategoria, COUNT(*)::int AS conteo FROM acr_registros
              WHERE proceso IS NOT NULL AND fuente IS NOT NULL
              GROUP BY proceso, fuente ORDER BY conteo DESC, proceso`,

      yearNum !== null
        ? sql`SELECT COALESCE(SUM(c.costo_total), 0)::float AS total
              FROM acr_registros r LEFT JOIN costos_asociados c ON c.acr_id = r.id
              WHERE EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int = ${yearNum}`
        : sql`SELECT COALESCE(SUM(costo_total), 0)::float AS total FROM costos_asociados`,
    ]);

    const totalCosto = (costoTotal[0]?.total ?? 0) as number;
    const totalRows  = (porProcesoYFuente as Array<{ proceso: string; subcategoria: string; conteo: number }>)
      .reduce((acc, r) => acc + r.conteo, 0);

    return NextResponse.json({
      availableYears,
      porTipoAccion,
      porProceso,
      porCliente,
      porEstado,
      costoPorProceso,
      porProcesoYFuente,
      totalCosto,
      totalRows,
    });
  } catch (error) {
    console.error('GET /api/panel-analisis error:', error);
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
  }
}
