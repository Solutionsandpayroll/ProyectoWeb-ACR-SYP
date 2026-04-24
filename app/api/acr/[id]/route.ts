import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getRequestSession, isAdminSession } from '@/lib/auth';

const toSafeNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeEvidencia = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      // Preserve both plain-string entries and object entries {u, n} from EvidenciaUpload
      const files = parsed
        .filter((v) => {
          if (typeof v === 'string') return v.trim().length > 0;
          if (typeof v === 'object' && v !== null && 'u' in v) {
            const u = (v as { u?: unknown }).u;
            return typeof u === 'string' && u.trim().length > 0;
          }
          return false;
        })
        .slice(0, 3);

      if (files.length === 0) return null;
      // Always serialize as JSON array to preserve {u,n} objects
      return JSON.stringify(files);
    }
  } catch {
    // Legacy single-value format
  }

  return trimmed;
};

// ─── GET: fetch a single ACR with all related data ───────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    // 1. Main record
    const [registro] = await sql`SELECT * FROM acr_registros WHERE id = ${id}`;
    if (!registro) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

    // 2. Correction activities + responsables
    const actividades_correccion = await sql`
      SELECT * FROM actividades_correccion WHERE acr_id = ${id} ORDER BY orden
    `;
    for (const act of actividades_correccion) {
      const resps = await sql`
        SELECT * FROM responsables_correccion WHERE actividad_id = ${act.id} ORDER BY orden
      `;
      act.responsables = resps;
    }

    // 3. Causes
    const [causas_acr] = await sql`SELECT * FROM causas_acr WHERE acr_id = ${id}`;
    const causas_inmediatas = await sql`
      SELECT descripcion FROM causas_inmediatas WHERE acr_id = ${id} ORDER BY orden
    `;
    const causas_raiz = await sql`
      SELECT descripcion FROM causas_raiz WHERE acr_id = ${id} ORDER BY orden
    `;

    // 4. Plan activities + responsables
    const actividades_plan = await sql`
      SELECT * FROM actividades_plan WHERE acr_id = ${id} ORDER BY orden
    `;
    for (const act of actividades_plan) {
      const resps = await sql`
        SELECT * FROM responsables_plan WHERE actividad_plan_id = ${act.id} ORDER BY tipo DESC, id
      `;
      // Group into pairs: ejecucion + seguimiento
      const ejec = resps.filter((r: Record<string, unknown>) => r.tipo === 'ejecucion');
      const segu = resps.filter((r: Record<string, unknown>) => r.tipo === 'seguimiento');
      act.responsables_ejecucion  = ejec;
      act.responsables_seguimiento = segu;
    }

    // 5. Costs
    const [costos] = await sql`SELECT * FROM costos_asociados WHERE acr_id = ${id}`;

    return NextResponse.json({
      data: {
        registro,
        actividades_correccion,
        causas: {
          inmediatas: causas_inmediatas.map((c: Record<string, unknown>) => c.descripcion as string),
          raiz:       causas_raiz.map((c: Record<string, unknown>) => c.descripcion as string),
        },
        actividades_plan,
        costos: costos ?? {},
      },
    });
  } catch (error) {
    console.error('GET /api/acr/[id] error:', error);
    return NextResponse.json({ error: 'Error al obtener el registro' }, { status: 500 });
  }
}

// ─── PUT: update an ACR record (delete + reinsert related tables) ────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const session = getRequestSession(request);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fuente,
      proceso,
      cliente,
      fechaApertura,
      fechaRegistro,
      tipoAccion,
      tratamiento,
      evaluacionRiesgo,
      descripcion,
      registradoPor,
      estado,
      actividadesCorreccion = [],
      causasInmediatas = [],
      causasRaiz = [],
      actividadesPlan = [],
      costosAsociados = {},
      eficaciaAccionAdecuada,
      eficaciaNoConformidades,
      eficaciaNuevosRiesgos,
      eficaciaCambiosSgi,
      fechaCierre,
      responsableCierre,
    } = body;

    const [currentRegistro] = await sql`
      SELECT estado, fecha_cierre, responsable_cierre
      FROM acr_registros
      WHERE id = ${id}
    `;

    if (!currentRegistro) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const isAdmin = isAdminSession(session);
    const nextEstado = isAdmin ? (estado ?? currentRegistro.estado ?? 'Abierta') : currentRegistro.estado;
    const nextFechaCierre = isAdmin ? (fechaCierre ?? null) : (currentRegistro.fecha_cierre ?? null);
    const nextResponsableCierre = isAdmin ? (responsableCierre ?? null) : (currentRegistro.responsable_cierre ?? null);

    // ── Update main record ────────────────────────────────────────────────
    await sql`
      UPDATE acr_registros SET
        fuente           = ${fuente        ?? null},
        proceso          = ${proceso       ?? null},
        cliente          = ${cliente       ?? null},
        fecha_apertura   = ${fechaApertura ?? null},
        fecha_registro   = ${fechaRegistro ?? null},
        tipo_accion      = ${tipoAccion    ?? null},
        tratamiento      = ${tratamiento   ?? null},
        evaluacion_riesgo = ${evaluacionRiesgo ?? null},
        descripcion      = ${descripcion   ?? null},
        registrado_por   = ${registradoPor ?? null},
        estado           = ${nextEstado},
        eficacia_accion_adecuada  = ${eficaciaAccionAdecuada  ?? null},
        eficacia_no_conformidades = ${eficaciaNoConformidades ?? null},
        eficacia_nuevos_riesgos   = ${eficaciaNuevosRiesgos   ?? null},
        eficacia_cambios_sgi      = ${eficaciaCambiosSgi      ?? null},
        fecha_cierre              = ${nextFechaCierre},
        responsable_cierre        = ${nextResponsableCierre}
      WHERE id = ${id}
    `;

    // ── Section 2: delete + reinsert correction activities ───────────────
    const oldCorr = await sql`SELECT id FROM actividades_correccion WHERE acr_id = ${id}`;
    for (const act of oldCorr) {
      await sql`DELETE FROM responsables_correccion WHERE actividad_id = ${act.id}`;
    }
    await sql`DELETE FROM actividades_correccion WHERE acr_id = ${id}`;

    for (let i = 0; i < actividadesCorreccion.length; i++) {
      const act = actividadesCorreccion[i];
      if (!act.actividad?.trim()) continue;
      const [actRow] = await sql`
        INSERT INTO actividades_correccion (acr_id, orden, actividad, recursos, costo_total, evidencia, observaciones)
        VALUES (${id}, ${i + 1}, ${act.actividad}, ${act.recursos ?? []}, ${act.costoTotal ?? 0}, ${normalizeEvidencia(act.evidencia)}, ${act.observaciones ?? null})
        RETURNING id
      `;
      for (let j = 0; j < (act.responsables ?? []).length; j++) {
        const resp = act.responsables[j];
        // Skip only completely empty rows (no nombre, no cargo, no horas)
        if (!resp.nombre?.trim() && !resp.cargo?.trim() && !toSafeNumber(resp.horas)) continue;
        await sql`
          INSERT INTO responsables_correccion
            (actividad_id, orden, nombre, cargo, horas, fecha_inicio, fecha_fin, costo)
          VALUES
            (${actRow.id}, ${j + 1},
             ${resp.nombre ?? null}, ${resp.cargo ?? null},
             ${toSafeNumber(resp.horas)},   ${resp.fechaInicio ?? null},
             ${resp.fechaFin ?? null}, ${toSafeNumber(resp.costo)})
        `;
      }
    }

    // ── Section 3: update causes ──────────────────────────────────────────
    await sql`DELETE FROM causas_inmediatas WHERE acr_id = ${id}`;
    for (let i = 0; i < causasInmediatas.length; i++) {
      if (causasInmediatas[i]?.trim()) {
        await sql`
          INSERT INTO causas_inmediatas (acr_id, orden, descripcion)
          VALUES (${id}, ${i + 1}, ${causasInmediatas[i]})
        `;
      }
    }
    await sql`DELETE FROM causas_raiz WHERE acr_id = ${id}`;
    for (let i = 0; i < causasRaiz.length; i++) {
      if (causasRaiz[i]?.trim()) {
        await sql`
          INSERT INTO causas_raiz (acr_id, orden, descripcion)
          VALUES (${id}, ${i + 1}, ${causasRaiz[i]})
        `;
      }
    }

    // ── Section 4: delete + reinsert plan activities ──────────────────────
    const oldPlan = await sql`SELECT id FROM actividades_plan WHERE acr_id = ${id}`;
    for (const act of oldPlan) {
      await sql`DELETE FROM responsables_plan WHERE actividad_plan_id = ${act.id}`;
    }
    await sql`DELETE FROM actividades_plan WHERE acr_id = ${id}`;

    for (let i = 0; i < actividadesPlan.length; i++) {
      const act = actividadesPlan[i];
      if (!act.descripcion?.trim()) continue;
      const [planRow] = await sql`
        INSERT INTO actividades_plan (acr_id, orden, descripcion, causas_asociadas, costo_total, evidencia, observaciones)
        VALUES (${id}, ${i + 1}, ${act.descripcion}, ${act.causasAsociadas ?? []}, ${act.costoTotal ?? 0}, ${normalizeEvidencia(act.evidencia)}, ${act.observaciones ?? null})
        RETURNING id
      `;
      for (let k = 0; k < (act.responsables ?? []).length; k++) {
        const r = act.responsables[k];
        await sql`
          INSERT INTO responsables_plan
            (actividad_plan_id, tipo, nombre, cargo, horas, fecha_inicio, fecha_fin, costo, estado)
          VALUES
            (${planRow.id}, 'ejecucion',
             ${r.nombreEjecucion      ?? null}, ${r.cargoEjecucion      ?? null},
             ${toSafeNumber(r.horasEjecucion)},
             ${r.fechaInicioEjecucion ?? null}, ${r.fechaFinEjecucion   ?? null},
             ${toSafeNumber(r.costoEjecucion)},    'Abierta')
        `;
        await sql`
          INSERT INTO responsables_plan
            (actividad_plan_id, tipo, nombre, cargo, horas, fecha_inicio, fecha_fin, costo, estado)
          VALUES
            (${planRow.id}, 'seguimiento',
             ${r.nombreSeguimiento ?? null}, ${r.cargoSeguimiento ?? null},
             ${toSafeNumber(r.horasSeguimiento)},
             ${r.fechaSeguimiento  ?? null}, ${r.fechaSeguimiento  ?? null},
             ${toSafeNumber(r.costoSeguimiento)},   ${r.estadoSeguimiento ?? 'Abierta'})
        `;
      }
    }

    // ── Section 5: update costs ───────────────────────────────────────────
    const {
      costoCorreccion      = 0,
      costoPlanAccion      = 0,
      costoPlanSeguimiento = 0,
      perdidaIngresos      = 0,
      multasSanciones      = 0,
      otrosCostosInternos  = 0,
      descuentosCliente    = 0,
      otrosCostos          = 0,
    } = costosAsociados;

    const costoTotal =
      toSafeNumber(costoCorreccion) + toSafeNumber(costoPlanAccion) + toSafeNumber(costoPlanSeguimiento) +
      toSafeNumber(perdidaIngresos) + toSafeNumber(multasSanciones) + toSafeNumber(otrosCostosInternos) +
      toSafeNumber(descuentosCliente) + toSafeNumber(otrosCostos);

    // Upsert in case row doesn't exist
    await sql`
      INSERT INTO costos_asociados
        (acr_id, costo_correccion, costo_plan_accion, costo_plan_seguimiento,
         perdida_ingresos, multas_sanciones, otros_costos_internos,
         descuentos_cliente, otros_costos, costo_total)
      VALUES
        (${id}, ${toSafeNumber(costoCorreccion)}, ${toSafeNumber(costoPlanAccion)}, ${toSafeNumber(costoPlanSeguimiento)},
        ${toSafeNumber(perdidaIngresos)}, ${toSafeNumber(multasSanciones)}, ${toSafeNumber(otrosCostosInternos)},
        ${toSafeNumber(descuentosCliente)}, ${toSafeNumber(otrosCostos)}, ${costoTotal})
      ON CONFLICT (acr_id) DO UPDATE SET
        costo_correccion      = EXCLUDED.costo_correccion,
        costo_plan_accion     = EXCLUDED.costo_plan_accion,
        costo_plan_seguimiento = EXCLUDED.costo_plan_seguimiento,
        perdida_ingresos      = EXCLUDED.perdida_ingresos,
        multas_sanciones      = EXCLUDED.multas_sanciones,
        otros_costos_internos = EXCLUDED.otros_costos_internos,
        descuentos_cliente    = EXCLUDED.descuentos_cliente,
        otros_costos          = EXCLUDED.otros_costos,
        costo_total           = EXCLUDED.costo_total
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/acr/[id] error:', error);
    return NextResponse.json({ error: 'Error al actualizar el registro' }, { status: 500 });
  }
}

// ─── DELETE: Archive ACR with all related data ─────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const body = await request.json().catch(() => ({}));
    const { razonEliminacion } = body;

    // 1. Fetch main record
    const [registro] = await sql`SELECT * FROM acr_registros WHERE id = ${id}`;
    if (!registro) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // 2. Archive to acr_eliminadas
    await sql`
      INSERT INTO acr_eliminadas
        (acr_original_id, consecutivo, fuente, proceso, cliente, fecha_apertura, 
         tipo_accion, tratamiento, evaluacion_riesgo, descripcion, 
         estado, datos_completos, razon_eliminacion, created_at, updated_at)
      VALUES
        (${id}, ${registro.consecutivo}, ${registro.fuente}, ${registro.proceso},
         ${registro.cliente}, ${registro.fecha_apertura},
         ${registro.tipo_accion}, ${registro.tratamiento}, ${registro.evaluacion_riesgo},
         ${registro.descripcion}, ${registro.estado}, 
         ${JSON.stringify(registro)},
         ${razonEliminacion || 'Sin especificar'},
         ${registro.created_at}, ${registro.updated_at})
    `;

    // 3. Delete all related data (order matters due to FKs)
    // Delete responsables_plan
    const actPlan = await sql`SELECT id FROM actividades_plan WHERE acr_id = ${id}`;
    for (const ap of actPlan) {
      await sql`DELETE FROM responsables_plan WHERE actividad_plan_id = ${ap.id}`;
    }
    // Delete actividades_plan
    await sql`DELETE FROM actividades_plan WHERE acr_id = ${id}`;

    // Delete responsables_correccion
    const actCorr = await sql`SELECT id FROM actividades_correccion WHERE acr_id = ${id}`;
    for (const ac of actCorr) {
      await sql`DELETE FROM responsables_correccion WHERE actividad_id = ${ac.id}`;
    }
    // Delete actividades_correccion
    await sql`DELETE FROM actividades_correccion WHERE acr_id = ${id}`;

    // Delete causes
    await sql`DELETE FROM causas_inmediatas WHERE acr_id = ${id}`;
    await sql`DELETE FROM causas_raiz WHERE acr_id = ${id}`;
    await sql`DELETE FROM causas_acr WHERE acr_id = ${id}`;

    // Delete costs
    await sql`DELETE FROM costos_asociados WHERE acr_id = ${id}`;

    // Delete control seguimiento
    await sql`DELETE FROM control_acciones_seguimiento WHERE acr_id = ${id}`;

    // Delete main ACR
    await sql`DELETE FROM acr_registros WHERE id = ${id}`;

    return NextResponse.json({ success: true, mensajeEliminado: `ACR "${registro.consecutivo}" eliminado y archivado correctamente` });
  } catch (error) {
    console.error('DELETE /api/acr/[id] error:', error);
    return NextResponse.json({ error: 'Error al eliminar el registro' }, { status: 500 });
  }
}
