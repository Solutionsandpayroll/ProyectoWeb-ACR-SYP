import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const filterYear =
      yearParam && yearParam !== 'all' && !isNaN(Number(yearParam))
        ? Number(yearParam)
        : null;

    // ── Available years ──────────────────────────────────────────────────────
    const yearRows = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM fecha_documentacion)::int AS anio
      FROM gds_registros
      WHERE fecha_documentacion IS NOT NULL
      ORDER BY anio DESC
    `;
    const availableYears: number[] = yearRows.map((r) => r.anio as number);

    // ── Stats filtered by year ────────────────────────────────────────────────
    const estadoRows = filterYear
      ? await sql`
          SELECT estado, COUNT(*)::int AS total
          FROM gds_registros
          WHERE EXTRACT(YEAR FROM fecha_documentacion) = ${filterYear}
          GROUP BY estado
        `
      : await sql`
          SELECT estado, COUNT(*)::int AS total
          FROM gds_registros
          GROUP BY estado
        `;

    const tipoCambioRows = filterYear
      ? await sql`
          SELECT COALESCE(tipo_cambio, 'Sin especificar') AS tipo_cambio, COUNT(*)::int AS total
          FROM gds_registros
          WHERE EXTRACT(YEAR FROM fecha_documentacion) = ${filterYear}
          GROUP BY tipo_cambio
        `
      : await sql`
          SELECT COALESCE(tipo_cambio, 'Sin especificar') AS tipo_cambio, COUNT(*)::int AS total
          FROM gds_registros
          GROUP BY tipo_cambio
        `;

    const planeadoRows = filterYear
      ? await sql`
          SELECT COALESCE(cambio_planeado, 'Sin especificar') AS cambio_planeado, COUNT(*)::int AS total
          FROM gds_registros
          WHERE EXTRACT(YEAR FROM fecha_documentacion) = ${filterYear}
          GROUP BY cambio_planeado
        `
      : await sql`
          SELECT COALESCE(cambio_planeado, 'Sin especificar') AS cambio_planeado, COUNT(*)::int AS total
          FROM gds_registros
          GROUP BY cambio_planeado
        `;

    // ── Trend: total per year (always all years) ──────────────────────────────
    const trendRows = await sql`
      SELECT EXTRACT(YEAR FROM fecha_documentacion)::int AS anio, COUNT(*)::int AS total
      FROM gds_registros
      WHERE fecha_documentacion IS NOT NULL
      GROUP BY anio
      ORDER BY anio ASC
    `;

    // ── Recent (last 5) ───────────────────────────────────────────────────────
    const recentRows = filterYear
      ? await sql`
          SELECT consecutivo, estado, tipo_cambio, fecha_documentacion
          FROM gds_registros
          WHERE EXTRACT(YEAR FROM fecha_documentacion) = ${filterYear}
          ORDER BY created_at DESC
          LIMIT 5
        `
      : await sql`
          SELECT consecutivo, estado, tipo_cambio, fecha_documentacion
          FROM gds_registros
          ORDER BY created_at DESC
          LIMIT 5
        `;

    const totalFiltered = (estadoRows as { total: number }[]).reduce(
      (s, r) => s + r.total,
      0
    );

    return NextResponse.json({
      availableYears,
      totalFiltered,
      porEstado: estadoRows,
      porTipoCambio: tipoCambioRows,
      porPlaneado: planeadoRows,
      tendenciaAnual: trendRows,
      recientes: recentRows,
    });
  } catch (error) {
    console.error('GET /api/gds-dashboard error:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
