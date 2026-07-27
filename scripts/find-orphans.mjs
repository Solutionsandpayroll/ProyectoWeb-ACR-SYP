import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('🔍 Buscando archivos huérfanos...\n');

  // 1. Get all blob files (reuse the list approach but simpler)
  const { list } = await import('@vercel/blob');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const allBlobs = [];
  let cursor;
  do {
    const result = await list({ token, cursor, limit: 100 });
    for (const b of result.blobs) {
      allBlobs.push({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt });
    }
    cursor = result.cursor;
  } while (cursor);

  console.log(`Total archivos en Vercel Blob: ${allBlobs.length}\n`);

  // 2. Extract all URLs from database
  const dbUrls = new Set();

  const extractUrls = (jsonStr) => {
    if (!jsonStr) return;
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'object' && item.u) dbUrls.add(item.u.trim());
          else if (typeof item === 'string' && item.trim()) dbUrls.add(item.trim());
        }
      }
    } catch {
      if (jsonStr.trim()) dbUrls.add(jsonStr.trim());
    }
  };

  const tables = [
    { table: 'actividades_plan', col: 'evidencia', parentCol: 'acr_id', parentTable: 'acr_registros', parentKey: 'id', parentSelect: 'consecutivo, proceso' },
    { table: 'actividades_correccion', col: 'evidencia', parentCol: 'acr_id', parentTable: 'acr_registros', parentKey: 'id', parentSelect: 'consecutivo, proceso' },
    { table: 'gds_actividades', col: 'segu_evidencia', parentCol: 'gds_registro_id', parentTable: 'gds_registros', parentKey: 'id', parentSelect: 'consecutivo, titulo' },
  ];

  for (const { table, col, parentCol } of tables) {
    try {
      const rows = await sql.unsafe(`SELECT id, ${col} as ev FROM ${table} WHERE ${col} IS NOT NULL AND ${col} != ''`);
      for (const r of rows) {
        extractUrls(r.ev);
      }
    } catch (e) {
      // table might not exist
    }
  }

  console.log(`URLs en BD: ${dbUrls.size}\n`);

  // 3. Find orphans
  const orphans = allBlobs.filter(b => !dbUrls.has(b.url));

  console.log(`📎 ARCHIVOS HUÉRFANOS (${orphans.length}):\n`);
  console.log(`${'Fecha'.padEnd(22)} ${'Tamaño'.padEnd(10)} ${'Nombre'}`);
  console.log('-'.repeat(100));

  for (const b of orphans) {
    const fecha = b.uploadedAt.toISOString().replace('T', ' ').substring(0, 19);
    const size = b.size === 0 ? '0 KB' : b.size < 1024 ? `${b.size} B` : `${(b.size / 1024).toFixed(1)} KB`;
    const name = b.pathname.replace(/^evidencias\/\d+_/, '');
    console.log(`${fecha}  ${size.padEnd(10)} ${name}`);
  }

  console.log(`\n✅ Total huérfanos: ${orphans.length}`);
}

main().catch(console.error);
