import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/acr/next-consecutive?year=2026
 * Returns the next consecutive number (numeric padding: 001, 002, ..., 011, 012, etc.)
 * Format: "012" (just the number padded to 3 digits)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Get the maximum consecutive number
    // Consecutivos are stored as numeric strings: "001", "002", ..., "011", etc.
    const result = await sql`
      SELECT 
        MAX(
          CAST(consecutivo AS INTEGER)
        ) as max_num
      FROM acr_registros
      WHERE consecutivo ~ '^[0-9]{1,3}$'
    `;

    const maxNum = result[0]?.max_num || 0;
    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(3, '0');

    return NextResponse.json({
      nextConsecutivo: paddedNum,
      year,
      nextNumber: nextNum
    });
  } catch (error) {
    console.error('GET /api/acr/next-consecutive error:', error);
    return NextResponse.json(
      { error: 'Error al obtener el próximo consecutivo' },
      { status: 500 }
    );
  }
}
