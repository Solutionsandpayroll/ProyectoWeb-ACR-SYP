import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getRequestSession, isAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'No tienes permiso para ver ACRs eliminadas.' }, { status: 403 });
  }
  try {
    const records = await sql`
      SELECT 
        id, acr_original_id, consecutivo, fuente, proceso, cliente, 
        fecha_apertura, tipo_accion, estado, eliminado_en, razon_eliminacion
      FROM acr_eliminadas
      ORDER BY eliminado_en DESC
      LIMIT 100
    `;

    return NextResponse.json({ records });
  } catch (error) {
    console.error('GET /api/acr-eliminadas error:', error);
    return NextResponse.json(
      { error: 'Error al obtener ACRs eliminadas' },
      { status: 500 }
    );
  }
}
