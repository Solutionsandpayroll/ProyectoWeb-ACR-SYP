import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function extractUrls(jsonStr) {
  if (!jsonStr) return [];
  const urls = [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === 'object' && item !== null && typeof item.u === 'string' && item.u.trim()) {
          urls.push(item.u.trim());
        } else if (typeof item === 'string' && item.trim()) {
          urls.push(item.trim());
        }
      }
    }
  } catch {
    if (typeof jsonStr === 'string' && jsonStr.trim()) urls.push(jsonStr.trim());
  }
  return urls;
}

async function main() {
  console.log('Obteniendo URLs de la BD...\n');

  const dbUrls = new Set();
  let totalDbRecords = 0;

  try {
    const rows1 = await sql`SELECT id, acr_id, evidencia FROM actividades_plan WHERE evidencia IS NOT NULL`;
    for (const r of rows1) {
      totalDbRecords++;
      for (const u of extractUrls(r.evidencia)) dbUrls.add(u);
    }
    console.log(`actividades_plan: ${rows1.length} registros con evidencia`);
  } catch(e) { console.log(`actividades_plan: ERROR - ${e.message}`); }

  try {
    const rows2 = await sql`SELECT id, acr_id, evidencia FROM actividades_correccion WHERE evidencia IS NOT NULL`;
    for (const r of rows2) {
      totalDbRecords++;
      for (const u of extractUrls(r.evidencia)) dbUrls.add(u);
    }
    console.log(`actividades_correccion: ${rows2.length} registros con evidencia`);
  } catch(e) { console.log(`actividades_correccion: ERROR - ${e.message}`); }

  try {
    const rows3 = await sql`SELECT id, gds_registro_id, segu_evidencia FROM gds_actividades WHERE segu_evidencia IS NOT NULL`;
    for (const r of rows3) {
      totalDbRecords++;
      for (const u of extractUrls(r.segu_evidencia)) dbUrls.add(u);
    }
    console.log(`gds_actividades: ${rows3.length} registros con evidencia`);
  } catch(e) { console.log(`gds_actividades: ERROR - ${e.message}`); }

  console.log(`\nTotal registros con evidencia en BD: ${totalDbRecords}`);
  console.log(`Total URLs únicas en BD: ${dbUrls.size}\n`);

  // Get blobs
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

  const orphans = allBlobs.filter(b => !dbUrls.has(b.url));
  const linked = allBlobs.length - orphans.length;

  console.log(`Archivos en Blob: ${allBlobs.length} | Vinculados: ${linked} | Huérfanos: ${orphans.length}\n`);

  if (orphans.length > 0) {
    console.log(`📎 ARCHIVOS HUÉRFANOS:\n`);
    console.log(`${'Fecha (UTC)'.padEnd(22)} ${'Tamaño'.padEnd(10)} ${'Nombre'}`);
    console.log('-'.repeat(100));
    for (const b of orphans) {
      const fecha = b.uploadedAt.toISOString().replace('T', ' ').substring(0, 19);
      const size = b.size < 1024 ? `${b.size} B` : `${(b.size / 1024).toFixed(1)} KB`;
      const name = b.pathname.replace(/^evidencias\/\d+_/, '');
      console.log(`${fecha}  ${size.padEnd(10)} ${name}`);
    }
  }
}

main().catch(console.error);
