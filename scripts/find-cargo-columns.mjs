import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Find tables with cargo column
  const cols = await sql`
    SELECT column_name, table_name
    FROM information_schema.columns
    WHERE column_name = 'cargo' AND table_schema = 'public'
  `;
  console.log('Tablas con columna "cargo":', JSON.stringify(cols, null, 2));

  // Count how many rows have the old name
  for (const col of cols) {
    const result = await sql.unsafe(`
      SELECT COUNT(*) as count FROM ${col.table_name}
      WHERE cargo = 'Profesional de Backoffice Sucursales'
    `);
    console.log(`${col.table_name}.cargo: ${result[0].count} filas con nombre antiguo`);
  }

  console.log('\nEjecutar UPDATE? Ejecuta manualmente con:');
  console.log(`UPDATE responsables_correccion SET cargo = 'Profesional de Backoffice Sucursales (valor analista)' WHERE cargo = 'Profesional de Backoffice Sucursales';`);
  console.log(`UPDATE responsables_plan SET cargo = 'Profesional de Backoffice Sucursales (valor analista)' WHERE cargo = 'Profesional de Backoffice Sucursales';`);
}

main().catch(console.error);
