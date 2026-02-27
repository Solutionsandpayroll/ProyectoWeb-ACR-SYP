import Header from "@/components/Header";
import StatCard from "@/components/StatCard";

const metrics = [
  { label: "Tiempo promedio de cierre", value: "8.4 días", delta: "-1.2 días", positive: true },
  { label: "Tasa de resolución", value: "40%", delta: "+5%", positive: true },
  { label: "ACR con impacto económico", value: "4 / 5", delta: "", positive: true },
  { label: "Monto promedio por ACR", value: "$6,120", delta: "+$320", positive: false },
];

export default function PanelAnalisisPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Panel de Análisis" subtitle="Métricas, indicadores y reportes del sistema ACR" />

      <main className="flex-1 p-8 space-y-8">
        {/* KPI grid */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Indicadores Clave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Total ACR"
              value="5"
              description="Acumulado histórico"
              accentColor="blue"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <StatCard
              title="Tasa de Resolución"
              value="40%"
              description="ACR cerradas vs. total"
              accentColor="green"
              trend={{ value: "+5%", positive: true }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Tiempo Promedio"
              value="8.4 días"
              description="Desde apertura hasta cierre"
              accentColor="amber"
              trend={{ value: "1.2 días menos", positive: true }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Impacto Total"
              value="$30,600"
              description="Suma de montos registrados"
              accentColor="red"
              trend={{ value: "$6,200", positive: false }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Charts area */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Gráficos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart placeholder 1 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">ACR por Estado</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribución Abiertas / Cerradas</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">Feb 2025</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Abiertas</span><span>3 (60%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Cerradas</span><span>2 (40%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: "40%" }} />
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Integra Recharts o Chart.js para visualización avanzada
              </div>
            </div>

            {/* Chart placeholder 2 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Impacto Económico por Mes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Monto acumulado mensual</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">2025</span>
              </div>
              <div className="flex items-end gap-3 h-32 px-2">
                {[{ month: "Nov", value: 35 }, { month: "Dic", value: 52 }, { month: "Ene", value: 28 }, { month: "Feb", value: 80 }].map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-600 rounded-t-md opacity-80 hover:opacity-100 transition" style={{ height: `${d.value}%` }} />
                    <span className="text-xs text-slate-400">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Conectará con datos reales vía Neon PostgreSQL
              </div>
            </div>
          </div>
        </section>

        {/* Metrics detail */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Métricas Detalladas</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Métrica</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor Actual</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Variación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.map((m) => (
                  <tr key={m.label} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 text-slate-700 font-medium">{m.label}</td>
                    <td className="px-6 py-3.5 text-slate-800 font-bold">{m.value}</td>
                    <td className="px-6 py-3.5">
                      {m.delta && (
                        <span className={`text-xs font-semibold ${m.positive ? "text-emerald-600" : "text-red-500"}`}>
                          {m.positive ? "↑" : "↓"} {m.delta}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
