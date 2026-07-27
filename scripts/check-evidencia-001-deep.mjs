import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('🔍 Investigación profunda ACR 001 (ID: 9)...\n');

  // 1. Full details of plan activities #2 and #3
  const plan = await sql`
    SELECT id, orden, descripcion, evidencia, observaciones, created_at,
           pg_column_size(evidencia) as evidencia_bytes
    FROM actividades_plan
    WHERE acr_id = 9
    ORDER BY orden
  `;

  console.log('📋 Actividades del Plan (detalle completo):');
  for (const act of plan) {
    console.log(`\n  Actividad #${act.orden} (ID: ${act.id})`);
    console.log(`  created_at: ${act.created_at}`);
    console.log(`  evidencia_bytes: ${act.evidencia_bytes}`);
    console.log(`  evidencia (raw): ${JSON.stringify(act.evidencia)}`);
    console.log(`  observaciones: ${JSON.stringify(act.observaciones)}`);
  }

  // 2. Check responsables_plan table for evidence
  const respPlan = await sql`
    SELECT rp.*, ap.orden as actividad_orden
    FROM responsables_plan rp
    JOIN actividades_plan ap ON rp.actividad_plan_id = ap.id
    WHERE ap.acr_id = 9
    ORDER BY ap.orden, rp.id
  `;

  console.log(`\n\n👥 Responsables Plan (${respPlan.length}):`);
  for (const r of respPlan) {
    console.log(`  Act #${r.actividad_orden} | Responsable: ${r.nombre} | Cargo: ${r.cargo}`);
    console.log(`    Evidencia: ${JSON.stringify(r.evidencia || '')}`);
    console.log(`    Fecha inicio: ${r.fecha_inicio} | Fecha fin: ${r.fecha_fin}`);
    console.log(`    created_at: ${r.created_at}`);
  }

  // 3. Check control_cambios for this ACR
  try {
    const cambios = await sql`
      SELECT * FROM control_cambios
      WHERE acr_id = 9
      ORDER BY created_at DESC
      LIMIT 20
    `;
    console.log(`\n\n📝 Control de Cambios (${cambios.length}):`);
    for (const c of cambios) {
      console.log(`  ${c.created_at} | ${c.campo}: "${c.valor_anterior}" → "${c.valor_nuevo}" | Por: ${c.modificado_por}`);
    }
  } catch {
    console.log('\n📝 Control de Cambios: tabla no existe o error');
  }

  // 4. Check if there are more ACRs with consecutive "001" (maybe different years)
  const all001 = await sql`
    SELECT id, consecutivo, proceso, estado, fecha_apertura, fecha_registro,
           EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date)) as year
    FROM acr_registros
    WHERE consecutivo = '001'
    ORDER BY id DESC
  `;
  console.log(`\n\n📑 Todos los ACR con consecutivo "001" (${all001.length}):`);
  for (const a of all001) {
    console.log(`  ID: ${a.id} | Año: ${a.year} | Proceso: ${a.proceso} | Estado: ${a.estado}`);
  }

  // 5. Check acr_eliminadas for any deleted 001
  try {
    const eliminadas = await sql`
      SELECT id, consecutivo, proceso, estado, razon_eliminacion, eliminado_en, datos_completos
      FROM acr_eliminadas
      WHERE consecutivo = '001'
      ORDER BY eliminado_en DESC
    `;
    console.log(`\n\n🗑️ ACR 001 eliminadas (${eliminadas.length}):`);
    for (const e of eliminadas) {
      console.log(`  ID: ${e.id} | Eliminado: ${e.eliminado_en} | Razón: ${e.razon_eliminacion}`);
      if (e.datos_completos) {
        try {
          const datos = typeof e.datos_completos === 'string' ? JSON.parse(e.datos_completos) : e.datos_completos;
          if (datos.actividades_plan) {
            console.log(`    → Tenía ${datos.actividades_plan.length} actividades de plan`);
            datos.actividades_plan.forEach((ap, i) => {
              console.log(`       #${i+1}: Evidencia: ${ap.evidencia ? 'SÍ' : 'NO'}`);
            });
          }
        } catch {}
      }
    }
  } catch (e) {
    console.log(`\n🗑️ ACR eliminadas: ${e.message}`);
  }

  console.log('\n✅ Fin de la investigación.');
}

main().catch(console.error);
