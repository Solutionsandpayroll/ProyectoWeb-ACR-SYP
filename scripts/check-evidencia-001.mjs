import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('🔍 Buscando ACR con consecutivo "001"...\n');

  const acr = await sql`
    SELECT id, consecutivo, fuente, proceso, estado, fecha_apertura, fecha_registro
    FROM acr_registros
    WHERE consecutivo = '001'
    ORDER BY id DESC
    LIMIT 5
  `;

  if (acr.length === 0) {
    console.log('❌ No se encontró ningún ACR con consecutivo "001"');
    return;
  }

  for (const r of acr) {
    console.log(`─────────────────────────────────────────────`);
    console.log(`ACR ID: ${r.id}  |  Consecutivo: ${r.consecutivo}`);
    console.log(`Proceso: ${r.proceso}  |  Estado: ${r.estado}`);
    console.log(`Fecha apertura: ${r.fecha_apertura}  |  Fecha registro: ${r.fecha_registro}`);

    const plan = await sql`
      SELECT id, orden, descripcion, evidencia, observaciones, costo_total
      FROM actividades_plan
      WHERE acr_id = ${r.id}
      ORDER BY orden
    `;

    console.log(`\n📋 Actividades del Plan de Acción: ${plan.length} encontradas`);

    if (plan.length === 0) {
      console.log('   (no hay actividades de plan para este ACR)');
      continue;
    }

    for (const act of plan) {
      console.log(`\n  ── Actividad #${act.orden} (ID: ${act.id}) ──`);
      console.log(`  Descripción: ${(act.descripcion || '').substring(0, 100)}...`);
      console.log(`  Observaciones: ${act.observaciones || '(vacío)'}`);

      const evRaw = act.evidencia;
      if (!evRaw) {
        console.log(`  📎 Evidencia: (sin archivos)`);
        continue;
      }

      console.log(`  📎 Evidencia (raw): ${evRaw.substring(0, 200)}`);

      try {
        const parsed = JSON.parse(evRaw);
        if (Array.isArray(parsed)) {
          console.log(`  Archivos (${parsed.length}):`);
          parsed.forEach((f, i) => {
            if (typeof f === 'object' && f.u) {
              console.log(`    ${i + 1}. Nombre: ${f.n || 'N/A'}`);
              console.log(`       URL: ${f.u}`);
            } else if (typeof f === 'string') {
              console.log(`    ${i + 1}. URL (legacy): ${f}`);
            }
          });
        }
      } catch {
        console.log(`  Formato: string suelto → ${evRaw}`);
      }
    }

    const corr = await sql`
      SELECT id, orden, actividad, evidencia, observaciones
      FROM actividades_correccion
      WHERE acr_id = ${r.id}
      ORDER BY orden
    `;

    console.log(`\n🔧 Actividades de Corrección: ${corr.length} encontradas`);
    for (const c of corr) {
      const hasEvidence = c.evidencia && c.evidencia.trim();
      console.log(`  #${c.orden} (ID:${c.id}): ${c.actividad?.substring(0, 60)}... → Evidencia: ${hasEvidence ? 'SÍ' : 'NO'}`);
    }
  }

  console.log(`\n✅ Revisión completada.`);
}

main().catch(console.error);
