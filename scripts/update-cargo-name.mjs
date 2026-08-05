import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Count before
  const r1 = await sql`SELECT COUNT(*) as cnt FROM responsables_correccion WHERE cargo = 'Profesional de Backoffice Sucursales'`;
  const r2 = await sql`SELECT COUNT(*) as cnt FROM responsables_plan WHERE cargo = 'Profesional de Backoffice Sucursales'`;
  console.log(`Antes: responsables_correccion=${r1[0].cnt}, responsables_plan=${r2[0].cnt}`);

  // Update
  const u1 = await sql`UPDATE responsables_correccion SET cargo = 'Profesional de Backoffice Sucursales (valor analista)' WHERE cargo = 'Profesional de Backoffice Sucursales'`;
  const u2 = await sql`UPDATE responsables_plan SET cargo = 'Profesional de Backoffice Sucursales (valor analista)' WHERE cargo = 'Profesional de Backoffice Sucursales'`;
  console.log(`Actualizado: responsables_correccion=${u1.count}, responsables_plan=${u2.count}`);

  // Verify
  const v1 = await sql`SELECT COUNT(*) as cnt FROM responsables_correccion WHERE cargo = 'Profesional de Backoffice Sucursales (valor analista)'`;
  const v2 = await sql`SELECT COUNT(*) as cnt FROM responsables_plan WHERE cargo = 'Profesional de Backoffice Sucursales (valor analista)'`;
  console.log(`Después (nuevo nombre): responsables_correccion=${v1[0].cnt}, responsables_plan=${v2[0].cnt}`);

  console.log('\n✅ Listo.');
}

main().catch(console.error);
