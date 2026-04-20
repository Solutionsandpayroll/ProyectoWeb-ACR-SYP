import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// ─── GET: single GDS record + its activities ──────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const [registro] = await sql`
      SELECT
        id, consecutivo, fecha_documentacion, proposito,
        descripcion_cambio, cambio_planeado, tipo_cambio,
        consecuencias, estado, created_at, updated_at
      FROM gds_registros
      WHERE id = ${numId}
    `;

    if (!registro) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const actividades = await sql`
      SELECT
        id, numero, actividad, fecha, responsables, recursos, impacto,
        segu_fecha, segu_responsable, segu_evidencia,
        segu_tiene_riesgos, segu_cuales, segu_nro_accion_mejora
      FROM gds_actividades
      WHERE gds_registro_id = ${numId}
      ORDER BY numero ASC
    `;

    return NextResponse.json({ registro, actividades });
  } catch (error) {
    console.error('GET /api/gds/[id] error:', error);
    return NextResponse.json({ error: 'Error al obtener el registro' }, { status: 500 });
  }
}

// ─── PUT: update a GDS record + replace its activities ───────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      fechaDocumentacion,
      proposito,
      descripcionCambio,
      cambioPlaneado,
      tipoCambio,
      consecuencias,
      estado,
      actividades = [],
    } = body;

    // Update main record
    const [updated] = await sql`
      UPDATE gds_registros SET
        fecha_documentacion = ${fechaDocumentacion},
        proposito           = ${proposito || null},
        descripcion_cambio  = ${descripcionCambio || null},
        cambio_planeado     = ${cambioPlaneado || null},
        tipo_cambio         = ${tipoCambio || null},
        consecuencias       = ${consecuencias || null},
        estado              = ${estado || 'Abierta'},
        updated_at          = now()
      WHERE id = ${numId}
      RETURNING id, consecutivo
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Replace activities: delete old ones and insert new ones
    await sql`DELETE FROM gds_actividades WHERE gds_registro_id = ${numId}`;

    if (actividades.length > 0) {
      for (let i = 0; i < actividades.length; i++) {
        const a = actividades[i];
        await sql`
          INSERT INTO gds_actividades (
            gds_registro_id, numero, actividad, fecha, responsables, recursos, impacto,
            segu_fecha, segu_responsable, segu_evidencia,
            segu_tiene_riesgos, segu_cuales, segu_nro_accion_mejora
          ) VALUES (
            ${numId}, ${i + 1},
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

    return NextResponse.json({ success: true, id: updated.id, consecutivo: updated.consecutivo });
  } catch (error) {
    console.error('PUT /api/gds/[id] error:', error);
    return NextResponse.json({ error: 'Error al actualizar el registro' }, { status: 500 });
  }
}

// ─── DELETE: archive then remove a GDS record ─────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const razon: string = typeof body?.razonEliminacion === 'string' ? body.razonEliminacion.trim() : '';

    // Fetch the record first so we can archive it
    const [registro] = await sql`
      SELECT id, consecutivo, fecha_documentacion, tipo_cambio, estado
      FROM gds_registros WHERE id = ${numId}
    `;
    if (!registro) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const actividades = await sql`
      SELECT * FROM gds_actividades WHERE gds_registro_id = ${numId}
    `;

    // Archive to gds_eliminadas
    await sql`
      INSERT INTO gds_eliminadas (
        gds_registro_id, consecutivo, fecha_documentacion,
        tipo_cambio, estado, datos_completos
      ) VALUES (
        ${numId},
        ${registro.consecutivo},
        ${registro.fecha_documentacion},
        ${registro.tipo_cambio ?? null},
        ${registro.estado ?? null},
        ${JSON.stringify({ registro, actividades, razon })}
      )
    `;

    // Delete the record (actividades cascade via FK)
    await sql`DELETE FROM gds_registros WHERE id = ${numId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/gds/[id] error:', error);
    return NextResponse.json({ error: 'Error al eliminar el registro' }, { status: 500 });
  }
}
