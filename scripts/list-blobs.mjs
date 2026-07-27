import { list } from '@vercel/blob';

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { console.log('❌ No BLOB_READ_WRITE_TOKEN'); return; }

  console.log('📦 Listando archivos en Vercel Blob...\n');

  let cursor;
  let total = 0;
  const allBlobs = [];

  do {
    const result = await list({ token, cursor, limit: 100 });
    for (const blob of result.blobs) {
      allBlobs.push({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      });
      total++;
    }
    cursor = result.cursor;
    console.log(`  ... ${total} archivos listados`);
  } while (cursor);

  console.log(`\n✅ Total archivos: ${total}\n`);

  if (allBlobs.length === 0) {
    console.log('No hay archivos en el Blob store.');
    return;
  }

  const evidencias = allBlobs.filter(b => b.pathname.startsWith('evidencias/'));
  console.log(`📎 Archivos en "evidencias/": ${evidencias.length}\n`);

  for (const b of evidencias) {
    const ts = b.pathname.match(/^evidencias\/(\d+)_/)?.[1];
    const fecha = ts ? new Date(+ts) : null;
    const name = b.pathname.replace(/^evidencias\/\d+_/, '');
    console.log(`  ${fecha?.toISOString() || '????'} | ${(b.size / 1024).toFixed(1)} KB | ${name}`);
  }

  const otros = allBlobs.filter(b => !b.pathname.startsWith('evidencias/'));
  if (otros.length > 0) {
    console.log(`\n📂 Otros archivos: ${otros.length}`);
    for (const b of otros) {
      console.log(`  ${b.pathname} (${b.size} bytes, ${b.uploadedAt})`);
    }
  }
}

main().catch(console.error);
