import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import DashboardYearSelect from "@/components/DashboardYearSelect";
import Link from "next/link";
import { sql } from "@/lib/db";

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

async function getGdsDashboardStats(year: number) {
  const [row] = await sql`
    SELECT
      COUNT(*)::int                                                       AS total,
      COUNT(*) FILTER (WHERE estado = 'Abierta')::int                    AS abiertas,
      COUNT(*) FILTER (WHERE estado = 'Cerrada')::int                    AS cerradas
    FROM gds_registros
    WHERE EXTRACT(YEAR FROM fecha_documentacion)::int = ${year}
  `;
  return {
    total:    toNumber(row?.total),
    abiertas: toNumber(row?.abiertas),
    cerradas: toNumber(row?.cerradas),
  };
}

async function getAvailableYears() {
  const rows = await sql`
    SELECT DISTINCT EXTRACT(YEAR FROM fecha_documentacion)::int AS year
    FROM gds_registros
    WHERE fecha_documentacion IS NOT NULL
    ORDER BY year DESC
  `;
  return rows.map((r) => toNumber(r.year)).filter((y) => y > 0);
}

async function getRecentGds() {
  const rows = await sql`
    SELECT consecutivo, tipo_cambio, estado, fecha_documentacion
    FROM gds_registros
    ORDER BY created_at DESC
    LIMIT 3
  `;
  return rows as {
    consecutivo: string;
    tipo_cambio: string | null;
    estado: string;
    fecha_documentacion: string;
  }[];
}

type SearchParams = { year?: string };

export default async function GdsDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const currentYear = new Date().getFullYear();
  const params      = searchParams ? await searchParams : undefined;
  const requested   = Number(params?.year);
  const selectedYear =
    Number.isFinite(requested) && requested > 0 ? requested : currentYear;

  const availableYears = await getAvailableYears();
  const years = Array.from(new Set([currentYear, ...availableYears])).sort((a, b) => b - a);

  const stats    = await getGdsDashboardStats(selectedYear);
  const recentGds = await getRecentGds();

  return (
    <div className="flex flex-col flex-1">
      <style>{`
        @keyframes dashboardFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-enter {
          opacity: 0;
          animation: dashboardFadeUp 0.55s cubic-bezier(.22,.68,0,1.08) forwards;
        }
      `}</style>
      <Header
        title="Panel de Control"
        subtitle="Bienvenido al Sistema de Gestión del Cambio (GDC)"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">

        {/*  Resumen General  */}
        <section className="dash-enter" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Resumen General
            </h2>
            <DashboardYearSelect years={years} selectedYear={selectedYear} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <div className="dash-enter" style={{ animationDelay: "0.12s" }}>
              <StatCard
                title="Total GDC"
                value={stats.total}
                description={`Registros del año ${selectedYear}`}
                accentColor="blue"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            </div>
            <div className="dash-enter" style={{ animationDelay: "0.18s" }}>
              <StatCard
                title="Abiertas"
                value={stats.abiertas}
                description={`Pendientes en ${selectedYear}`}
                accentColor="amber"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
            <div className="dash-enter" style={{ animationDelay: "0.22s" }}>
              <StatCard
                title="Cerradas"
                value={stats.cerradas}
                description={`Resueltas en ${selectedYear}`}
                accentColor="green"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/*  GDS Recientes  */}
        <section className="dash-enter" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              GDC Recientes
            </h2>
            <Link
              href="/dashboard/historial-gds"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Ver todo 
            </Link>
          </div>

          <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto dash-enter"
            style={{ animationDelay: "0.35s" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Consecutivo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo de Cambio</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Fecha Doc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentGds.map((g) => (
                  <tr key={g.consecutivo} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{g.consecutivo}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{g.tipo_cambio ?? ""}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={g.estado as "Abierta" | "Cerrada" | "Parcial"} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700 font-medium hidden lg:table-cell">
                      {new Date(g.fecha_documentacion).toLocaleDateString("es-CO", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {recentGds.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">
                      No hay registros aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/*  Acciones Rápidas  */}
        <section className="dash-enter" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/formulario-gds"
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group dash-enter"
              style={{ animationDelay: "0.46s" }}
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Nueva GDC</p>
                <p className="text-xs text-slate-400">Registra un cambio nuevo</p>
              </div>
            </Link>
            <Link
              href="/dashboard/historial-gds"
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group dash-enter"
              style={{ animationDelay: "0.52s" }}
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
          </div>
        </section>

      </main>
    </div>
  );
}
