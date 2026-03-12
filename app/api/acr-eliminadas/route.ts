import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
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
