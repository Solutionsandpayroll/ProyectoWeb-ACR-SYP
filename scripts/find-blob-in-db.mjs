import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const url = 'https://yskonm9x86wyqvzo.private.blob.vercel-storage.com/evidencias/Documento_Solicitud_Conciliaci_n-mWUrULE4xnYZrrBVWR3ck5B1EjaoQT.pdf';

  console.log('🔍 Buscando el documento en toda la BD...\n');

  const tables = [
    'actividades_plan',
    'actividades_correccion',
    'gds_actividades',
  ];

  for (const table of tables) {
    try {
      const rows = await sql.unsafe(`
        SELECT id, acr_id ?? gds_registro_id as parent_id, evidencia ${table === 'gds_actividades' ? ', segu_evidencia' : ''}
        FROM ${table}
        WHERE ${table === 'gds_actividades' ? 'segu_evidencia' : 'evidencia'} LIKE '%' || $1 || '%'
        LIMIT 20
      `, [url]);

      if (rows.length > 0) {
        console.log(`✅ ENCONTRADO en ${table} (${rows.length} registro/s):`);
        for (const r of rows) {
          console.log(`   ID: ${r.id} | parent_id: ${r.parent_id}`);
          console.log(`   Evidencia: ${(r.evidencia || r.segu_evidencia || '').substring(0, 200)}`);
        }
      } else {
        console.log(`❌ NO en ${table}`);
      }
    } catch (e) {
      console.log(`⚠️ Error en ${table}: ${e.message}`);
    }
  }

  // Also try partial URL search (without random suffix)
  const baseUrl = 'Documento_Solicitud_Conciliaci_n';
  console.log(`\n🔍 Buscando por nombre de archivo "${baseUrl}"...\n`);

  for (const table of tables) {
    try {
      const rows = await sql.unsafe(`
        SELECT id, ${table === 'gds_actividades' ? 'gds_registro_id' : 'acr_id'} as parent_id,
               ${table === 'gds_actividades' ? 'segu_evidencia' : 'evidencia'} as ev
        FROM ${table}
        WHERE ${table === 'gds_actividades' ? 'segu_evidencia' : 'evidencia'} LIKE '%' || $1 || '%'
        LIMIT 20
      `, [baseUrl]);

      if (rows.length > 0) {
        console.log(`✅ Encontrado en ${table}:`);
        for (const r of rows) {
          console.log(`   ID: ${r.id} | parent_id: ${r.parent_id}`);
          const ev = r.ev || '';
          // Extract file names
          const matches = ev.match(/"n":"([^"]+)"/g);
          if (matches) {
            console.log(`   Archivos: ${matches.map(m => m.replace(/"n":"|"/g, '')).join(', ')}`);
          }
          console.log(`   Raw (200 chars): ${ev.substring(0, 200)}`);
        }
      } else {
        console.log(`❌ NO en ${table}`);
      }
    } catch (e) {
      console.log(`⚠️ Error en ${table}: ${e.message}`);
    }
  }

  console.log('\n✅ Fin.');
}

main().catch(console.error);
