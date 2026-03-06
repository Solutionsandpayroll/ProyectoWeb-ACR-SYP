import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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
          analisis:   causas_acr?.analisis ?? null,
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
    const body = await request.json();
    const {
      fuente,
      proceso,
      cliente,
      fechaApertura,
      fechaLimite,
      tipoAccion,
      tratamiento,
      evaluacionRiesgo,
      descripcion,
      estado,
      actividadesCorreccion = [],
      analisisCausas,
      causasInmediatas = [],
      causasRaiz = [],
      actividadesPlan = [],
      costosAsociados = {},
    } = body;

    // ── Update main record ────────────────────────────────────────────────
    await sql`
      UPDATE acr_registros SET
        fuente           = ${fuente        ?? null},
        proceso          = ${proceso       ?? null},
        cliente          = ${cliente       ?? null},
        fecha_apertura   = ${fechaApertura ?? null},
        fecha_limite     = ${fechaLimite   ?? null},
        tipo_accion      = ${tipoAccion    ?? null},
        tratamiento      = ${tratamiento   ?? null},
        evaluacion_riesgo = ${evaluacionRiesgo ?? null},
        descripcion      = ${descripcion   ?? null},
        estado           = ${estado        ?? 'Abierta'}
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
        INSERT INTO actividades_correccion (acr_id, orden, actividad, recursos, costo_total)
        VALUES (${id}, ${i + 1}, ${act.actividad}, ${act.recursos ?? []}, ${act.costoTotal ?? 0})
        RETURNING id
      `;
      for (let j = 0; j < (act.responsables ?? []).length; j++) {
        const resp = act.responsables[j];
        if (!resp.nombre?.trim()) continue;
        await sql`
          INSERT INTO responsables_correccion
            (actividad_id, orden, nombre, cargo, horas, fecha_inicio, fecha_fin, costo)
          VALUES
            (${actRow.id}, ${j + 1},
             ${resp.nombre ?? null}, ${resp.cargo ?? null},
             ${resp.horas  ?? 0},   ${resp.fechaInicio ?? null},
             ${resp.fechaFin ?? null}, ${resp.costo ?? 0})
        `;
      }
    }

    // ── Section 3: update causes ──────────────────────────────────────────
    await sql`
      UPDATE causas_acr SET analisis = ${analisisCausas ?? null} WHERE acr_id = ${id}
    `;
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
        INSERT INTO actividades_plan (acr_id, orden, descripcion, causas_asociadas, costo_total)
        VALUES (${id}, ${i + 1}, ${act.descripcion}, ${act.causasAsociadas ?? []}, ${act.costoTotal ?? 0})
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
             ${r.horasEjecucion       ?? 0},
             ${r.fechaInicioEjecucion ?? null}, ${r.fechaFinEjecucion   ?? null},
             ${r.costoEjecucion       ?? 0},    'Abierta')
        `;
        await sql`
          INSERT INTO responsables_plan
            (actividad_plan_id, tipo, nombre, cargo, horas, fecha_inicio, fecha_fin, costo, estado)
          VALUES
            (${planRow.id}, 'seguimiento',
             ${r.nombreSeguimiento ?? null}, ${r.cargoSeguimiento ?? null},
             ${r.horasSeguimiento  ?? 0},
             ${r.fechaSeguimiento  ?? null}, ${r.fechaSeguimiento  ?? null},
             ${r.costoSeguimiento  ?? 0},   ${r.estadoSeguimiento ?? 'Abierta'})
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
      Number(costoCorreccion) + Number(costoPlanAccion) + Number(costoPlanSeguimiento) +
      Number(perdidaIngresos) + Number(multasSanciones) + Number(otrosCostosInternos) +
      Number(descuentosCliente) + Number(otrosCostos);

    // Upsert in case row doesn't exist
    await sql`
      INSERT INTO costos_asociados
        (acr_id, costo_correccion, costo_plan_accion, costo_plan_seguimiento,
         perdida_ingresos, multas_sanciones, otros_costos_internos,
         descuentos_cliente, otros_costos, costo_total)
      VALUES
        (${id}, ${costoCorreccion}, ${costoPlanAccion}, ${costoPlanSeguimiento},
         ${perdidaIngresos}, ${multasSanciones}, ${otrosCostosInternos},
         ${descuentosCliente}, ${otrosCostos}, ${costoTotal})
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
