import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// ─── GET: list all ACR records ─────────────────────────────────────────────
export async function GET() {
  try {
    const registros = await sql`
      SELECT
        r.id,
        r.consecutivo,
        r.fuente,
        r.proceso,
        r.cliente,
        r.fecha_apertura,
        r.fecha_limite,
        r.tipo_accion,
        r.evaluacion_riesgo,
        r.descripcion,
        r.estado,
        r.created_at,
        COALESCE(c.costo_total, 0) AS costo_total
      FROM acr_registros r
      LEFT JOIN costos_asociados c ON c.acr_id = r.id
      ORDER BY r.created_at DESC
    `;
    return NextResponse.json({ data: registros });
  } catch (error) {
    console.error('GET /api/acr error:', error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}

// ─── POST: create a new ACR record with all sections ──────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Section 1
      consecutivo,
      fuente,
      proceso,
      cliente,
      fechaApertura,
      fechaLimite,
      tipoAccion,
      tratamiento,
      evaluacionRiesgo,
      descripcion,
      // Section 2
      actividadesCorreccion = [],
      // Section 3
      analisisCausas,
      causasInmediatas = [],
      causasRaiz = [],
      // Section 4
      actividadesPlan = [],
      // Section 5
      costosAsociados = {},
    } = body;

    // Validate required fields
    if (!consecutivo || !fuente || !proceso || !fechaApertura || !tipoAccion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: consecutivo, fuente, proceso, fechaApertura, tipoAccion' },
        { status: 400 }
      );
    }

    // ── Insert main record ─────────────────────────────────────────────────
    const [registro] = await sql`
      INSERT INTO acr_registros (
        consecutivo, fuente, proceso, cliente,
        fecha_apertura, fecha_limite, tipo_accion,
        tratamiento, evaluacion_riesgo, descripcion
      ) VALUES (
        ${consecutivo}, ${fuente}, ${proceso}, ${cliente ?? null},
        ${fechaApertura}, ${fechaLimite ?? null}, ${tipoAccion},
        ${tratamiento ?? null}, ${evaluacionRiesgo ?? null}, ${descripcion ?? null}
      )
      RETURNING id
    `;
    const acrId = registro.id;

    // ── Section 2: Correction activities ──────────────────────────────────
    for (let i = 0; i < actividadesCorreccion.length; i++) {
      const act = actividadesCorreccion[i];
      const [actRow] = await sql`
        INSERT INTO actividades_correccion (acr_id, orden, actividad, recursos, costo_total)
        VALUES (${acrId}, ${i + 1}, ${act.actividad}, ${act.recursos ?? []}, ${act.costoTotal ?? 0})
        RETURNING id
      `;
      const actId = actRow.id;

      for (let j = 0; j < (act.responsables ?? []).length; j++) {
        const resp = act.responsables[j];
        await sql`
          INSERT INTO responsables_correccion (
            actividad_id, orden, nombre, cargo, horas, fecha_inicio, fecha_fin, costo
          ) VALUES (
            ${actId}, ${j + 1}, ${resp.nombre ?? null}, ${resp.cargo ?? null},
            ${resp.horas ?? 0}, ${resp.fechaInicio ?? null}, ${resp.fechaFin ?? null},
            ${resp.costo ?? 0}
          )
        `;
      }
    }

    // ── Section 3: Causes ─────────────────────────────────────────────────
    await sql`
      INSERT INTO causas_acr (acr_id, analisis) VALUES (${acrId}, ${analisisCausas ?? null})
    `;

    for (let i = 0; i < causasInmediatas.length; i++) {
      if (causasInmediatas[i]?.trim()) {
        await sql`
          INSERT INTO causas_inmediatas (acr_id, orden, descripcion)
          VALUES (${acrId}, ${i + 1}, ${causasInmediatas[i]})
        `;
      }
    }

    for (let i = 0; i < causasRaiz.length; i++) {
      if (causasRaiz[i]?.trim()) {
        await sql`
          INSERT INTO causas_raiz (acr_id, orden, descripcion)
          VALUES (${acrId}, ${i + 1}, ${causasRaiz[i]})
        `;
      }
    }

    // ── Section 4: Action Plan ────────────────────────────────────────────
    for (let i = 0; i < actividadesPlan.length; i++) {
      const act = actividadesPlan[i];
      const [planRow] = await sql`
        INSERT INTO actividades_plan (acr_id, orden, descripcion, causas_asociadas, costo_total)
        VALUES (${acrId}, ${i + 1}, ${act.descripcion}, ${act.causasAsociadas ?? []}, ${act.costoTotal ?? 0})
        RETURNING id
      `;
      const planId = planRow.id;

      // Each responsable row has both ejecucion and seguimiento data
      for (let k = 0; k < (act.responsables ?? []).length; k++) {
        const r = act.responsables[k];

        // Ejecución row
        await sql`
          INSERT INTO responsables_plan (
            actividad_plan_id, tipo, nombre, cargo, horas, fecha_inicio, fecha_fin, costo, estado
          ) VALUES (
            ${planId}, 'ejecucion',
            ${r.nombreEjecucion    ?? null}, ${r.cargoEjecucion    ?? null},
            ${r.horasEjecucion     ?? 0},
            ${r.fechaInicioEjecucion ?? null}, ${r.fechaFinEjecucion ?? null},
            ${r.costoEjecucion     ?? 0}, 'Abierta'
          )
        `;

        // Seguimiento row
        await sql`
          INSERT INTO responsables_plan (
            actividad_plan_id, tipo, nombre, cargo, horas, fecha_inicio, fecha_fin, costo, estado
          ) VALUES (
            ${planId}, 'seguimiento',
            ${r.nombreSeguimiento   ?? null}, ${r.cargoSeguimiento   ?? null},
            ${r.horasSeguimiento    ?? 0},
            ${r.fechaSeguimiento    ?? null}, ${r.fechaSeguimiento   ?? null},
            ${r.costoSeguimiento    ?? 0}, ${r.estadoSeguimiento  ?? 'Abierta'}
          )
        `;
      }
    }

    // ── Section 5: Associated costs ───────────────────────────────────────
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
      Number(costoCorreccion) +
      Number(costoPlanAccion) +
      Number(costoPlanSeguimiento) +
      Number(perdidaIngresos) +
      Number(multasSanciones) +
      Number(otrosCostosInternos) +
      Number(descuentosCliente) +
      Number(otrosCostos);

    await sql`
      INSERT INTO costos_asociados (
        acr_id,
        costo_correccion, costo_plan_accion, costo_plan_seguimiento,
        perdida_ingresos, multas_sanciones, otros_costos_internos,
        descuentos_cliente, otros_costos, costo_total
      ) VALUES (
        ${acrId},
        ${costoCorreccion}, ${costoPlanAccion}, ${costoPlanSeguimiento},
        ${perdidaIngresos}, ${multasSanciones}, ${otrosCostosInternos},
        ${descuentosCliente}, ${otrosCostos}, ${costoTotal}
      )
    `;

    return NextResponse.json({ success: true, id: acrId, consecutivo }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/acr error:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar el registro';
    // Detect duplicate consecutivo
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'El consecutivo ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
