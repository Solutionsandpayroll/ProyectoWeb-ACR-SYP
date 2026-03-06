import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { sql } from "@/lib/db";

async function getRecentAcr() {
  const rows = await sql`
    SELECT consecutivo, proceso, cliente, estado, fecha_apertura
    FROM acr_registros
    ORDER BY created_at DESC
    LIMIT 3
  `;
  return rows as {
    consecutivo: string;
    proceso: string;
    cliente: string | null;
    estado: string;
    fecha_apertura: string;
  }[];
}

export default async function DashboardPage() {
  const recentAcr = await getRecentAcr();
  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Panel de Control"
        subtitle="Bienvenido al Sistema de Gestión ACR"
      />

      <main className="flex-1 p-8 space-y-8">
        {/* Stats grid */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Resumen General
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <StatCard
              title="Total ACR"
              value="3"
              description="Registros activos en el sistema"
              accentColor="blue"
              trend={{ value: "2 nuevas", positive: true }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <StatCard
              title="ACR Abiertas"
              value="2"
              description="Pendientes de resolución"
              accentColor="amber"
              trend={{ value: "+1", positive: false }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="ACR Cerradas"
              value="1"
              description="Resueltas satisfactoriamente"
              accentColor="green"
              trend={{ value: "33%", positive: true }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Recent ACR table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              ACR Recientes
            </h2>
            <Link
              href="/dashboard/historial-acr"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Ver todo →
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Consecutivo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proceso</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Apertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAcr.map((acr) => (
                  <tr key={acr.consecutivo} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{acr.consecutivo}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{acr.proceso}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{acr.cliente ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={acr.estado as "Abierta" | "Cerrada" | "Parcial"} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700 font-medium hidden lg:table-cell">
                      {new Date(acr.fecha_apertura).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {recentAcr.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No hay registros aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard/formulario-acr"
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Nueva ACR</p>
                <p className="text-xs text-slate-400">Registra una acción nueva</p>
              </div>
            </Link>
            <Link
              href="/dashboard/historial-acr"
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Ver Historial</p>
                <p className="text-xs text-slate-400">Consulta todos los registros</p>
              </div>
            </Link>
            <Link
              href="/dashboard/panel-analisis"
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Análisis</p>
                <p className="text-xs text-slate-400">Métricas y reportes</p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
