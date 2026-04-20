import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/gds/next-consecutive
 * Returns the next GDS consecutive number padded to 3 digits: "001", "002", etc.
 * Considers both active records and deleted (archived) records for traceability.
 */
export async function GET() {
  try {
    const [activeResult, deletedResult] = await Promise.all([
      sql`
        SELECT MAX(CAST(consecutivo AS INTEGER)) AS max_num
        FROM gds_registros
        WHERE consecutivo ~ '^[0-9]{1,}$'
      `,
      sql`
        SELECT MAX(CAST(consecutivo AS INTEGER)) AS max_num
        FROM gds_eliminadas
        WHERE consecutivo ~ '^[0-9]{1,}$'
      `,
    ]);

    const maxActive  = Number(activeResult[0]?.max_num  ?? 0);
    const maxDeleted = Number(deletedResult[0]?.max_num ?? 0);
    const nextNum    = Math.max(maxActive, maxDeleted) + 1;
    const paddedNum  = String(nextNum).padStart(3, '0');

    return NextResponse.json({ nextConsecutivo: paddedNum });
  } catch (error) {
    console.error('GET /api/gds/next-consecutive error:', error);
    return NextResponse.json({ error: 'Error al obtener el consecutivo' }, { status: 500 });
  }
}
