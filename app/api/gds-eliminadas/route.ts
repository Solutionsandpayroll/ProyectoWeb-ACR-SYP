import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getRequestSession, isAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json(
      { error: 'No tienes permiso para ver GDS eliminadas.' },
      { status: 403 }
    );
  }

  try {
    const records = await sql`
      SELECT
        id,
        gds_registro_id,
        consecutivo,
        fecha_documentacion,
        tipo_cambio,
        estado,
        eliminado_en,
        datos_completos->>'razon' AS razon_eliminacion
      FROM gds_eliminadas
      ORDER BY eliminado_en DESC
      LIMIT 200
    `;

    return NextResponse.json({ records });
  } catch (error) {
    console.error('GET /api/gds-eliminadas error:', error);
    return NextResponse.json(
      { error: 'Error al obtener GDS eliminadas' },
      { status: 500 }
    );
  }
}
