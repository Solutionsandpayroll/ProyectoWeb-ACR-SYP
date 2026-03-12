import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const [
      porTipoAccion,
      porProceso,
      porCliente,
      porEstado,
      costoPorProceso,
      porProcesoYFuente,
      costoTotal,
    ] = await Promise.all([
      // 1. Count by tipo_accion
      sql`
        SELECT tipo_accion AS label, COUNT(*)::int AS value
        FROM acr_registros
        GROUP BY tipo_accion
        ORDER BY value DESC
      `,
      // 2. Count by proceso
      sql`
        SELECT proceso AS label, COUNT(*)::int AS value
        FROM acr_registros
        WHERE proceso IS NOT NULL AND proceso <> ''
        GROUP BY proceso
        ORDER BY value DESC
        LIMIT 15
      `,
      // 3. Count by cliente
      sql`
        SELECT cliente AS label, COUNT(*)::int AS value
        FROM acr_registros
        WHERE cliente IS NOT NULL AND cliente <> ''
        GROUP BY cliente
        ORDER BY value DESC
        LIMIT 15
      `,
      // 4. Count by estado
      sql`
        SELECT estado AS label, COUNT(*)::int AS value
        FROM acr_registros
        GROUP BY estado
      `,
      // 5. Total cost by proceso (in millions)
      sql`
        SELECT r.proceso AS label,
               ROUND((COALESCE(SUM(c.costo_total), 0) / 1000000.0)::numeric, 3)::float AS value
        FROM acr_registros r
        LEFT JOIN costos_asociados c ON c.acr_id = r.id
        WHERE r.proceso IS NOT NULL AND r.proceso <> ''
        GROUP BY r.proceso
        ORDER BY value DESC
        LIMIT 10
      `,
      // 6. Count by (proceso, fuente) for the table
      sql`
        SELECT proceso, fuente AS subcategoria, COUNT(*)::int AS conteo
        FROM acr_registros
        WHERE proceso IS NOT NULL AND fuente IS NOT NULL
        GROUP BY proceso, fuente
        ORDER BY conteo DESC, proceso
      `,
      // 7. Grand total cost
      sql`
        SELECT COALESCE(SUM(costo_total), 0)::float AS total
        FROM costos_asociados
      `,
    ]);

    const totalCosto = (costoTotal[0]?.total ?? 0) as number;
    const totalRows = (porProcesoYFuente as Array<{ proceso: string; subcategoria: string; conteo: number }>)
      .reduce((acc, r) => acc + r.conteo, 0);

    return NextResponse.json({
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
