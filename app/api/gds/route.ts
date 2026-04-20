import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// ─── GET: list all GDS records ─────────────────────────────────────────────
export async function GET() {
  try {
    const registros = await sql`
      SELECT
        r.id,
        r.consecutivo,
        r.fecha_documentacion,
        r.proposito,
        r.descripcion_cambio,
        r.cambio_planeado,
        r.tipo_cambio,
        r.consecuencias,
        r.estado,
        r.created_at
      FROM gds_registros r
      ORDER BY r.created_at DESC
    `;
    return NextResponse.json({ data: registros });
  } catch (error) {
    console.error('GET /api/gds error:', error);
    return NextResponse.json({ error: 'Error al obtener registros GDS' }, { status: 500 });
  }
}

// ─── POST: create a new GDS record with activities ────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      consecutivo,
      fechaDocumentacion,
      proposito,
      descripcionCambio,
      cambioPlaneado,
      tipoCambio,
      consecuencias,
      actividades = [],
    } = body;

    if (!consecutivo || !fechaDocumentacion) {
      return NextResponse.json(
        { error: 'El consecutivo y la fecha de documentación son requeridos.' },
        { status: 400 }
      );
    }

    // Insert main record
    const [registro] = await sql`
      INSERT INTO gds_registros (
        consecutivo,
        fecha_documentacion,
        proposito,
        descripcion_cambio,
        cambio_planeado,
        tipo_cambio,
        consecuencias,
        estado
      ) VALUES (
        ${consecutivo},
        ${fechaDocumentacion},
        ${proposito || null},
        ${descripcionCambio || null},
        ${cambioPlaneado || null},
        ${tipoCambio || null},
        ${consecuencias || null},
        'Abierta'
      )
      RETURNING id, consecutivo
    `;

    // Insert activities
    if (actividades.length > 0) {
      for (let i = 0; i < actividades.length; i++) {
        const a = actividades[i];
        await sql`
          INSERT INTO gds_actividades (
            gds_registro_id,
            numero,
            actividad,
            fecha,
            responsables,
            recursos,
            impacto,
            segu_fecha,
            segu_responsable,
            segu_evidencia,
            segu_tiene_riesgos,
            segu_cuales,
            segu_nro_accion_mejora
          ) VALUES (
            ${registro.id},
            ${i + 1},
            ${a.actividad || null},
            ${a.fecha || null},
            ${a.responsables || null},
            ${a.recursos || null},
            ${a.impacto || null},
            ${a.seguFecha || null},
            ${a.seguResponsable || null},
            ${a.seguEvidencia || null},
            ${a.seguTieneRiesgos || null},
            ${a.seguCuales || null},
            ${a.seguNroAccionMejora || null}
          )
        `;
      }
    }

    return NextResponse.json({ success: true, id: registro.id, consecutivo: registro.consecutivo });
  } catch (error: unknown) {
    console.error('POST /api/gds error:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Ya existe un registro GDS con ese consecutivo.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Error al guardar el registro GDS.' }, { status: 500 });
  }
}
