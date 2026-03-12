"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KV { label: string; value: number }
interface TableRow { proceso: string; subcategoria: string; conteo: number }
interface AnalyticsData {
  porTipoAccion: KV[];
  porProceso: KV[];
  porCliente: KV[];
  porEstado: KV[];
  costoPorProceso: KV[];
  porProcesoYFuente: TableRow[];
  totalCosto: number;
  totalRows: number;
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY = "#1d3a6e";
const PINK = "#e51148";
const ESTADO_COLORS: Record<string, string> = {
  Cerrada: NAVY,
  Abierta: PINK,
  Parcial: "#1d3a6e",
};

const SimpleTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-800">{payload[0].value}</p>
    </div>
  );
};

const CostTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-800">{payload[0].value} mill.</p>
    </div>
  );
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">{title}</h3>
      {children}
    </div>
  );
}

function HorizontalBar({ data, color }: { data: KV[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-1.5 flex-1">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-36 text-slate-600 truncate text-right shrink-0">{d.label}</span>
          <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-5 text-slate-500 shrink-0 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

const renderDonutLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number;
  percent: number; name: string;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function PanelAnalisisPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/panel-analisis")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar datos");
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Panel de Análisis" subtitle={`Tablero de Acciones Correctivas y de Mejora · ${currentYear}`} />

      <main className="flex-1 p-6 space-y-5 overflow-auto">
        {/* ── Dashboard header strip ─────────────────────────── */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Tablero de Acciones Correctivas y de Mejora</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{currentYear}</p>
          </div>
          <div className="bg-slate-800 text-white rounded-xl px-6 py-3 text-right min-w-50">
            <p className="text-xl font-bold leading-tight">
              {loading || !data
                ? "—"
                : data.totalCosto >= 1_000_000
                ? `${(data.totalCosto / 1_000_000).toLocaleString("es-CO", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mill.`
                : `$${data.totalCosto.toLocaleString("es-CO")}`}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">Costo total de ACR {currentYear}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-slate-500 text-sm">Cargando métricas…</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">{error}</div>
        )}

        {data && !loading && (
          <>
            {/* ── Row 1: 3 charts ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Chart 1: Cantidad de acciones (vertical bar) */}
              <ChartCard title="Cantidad de acciones">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.porTipoAccion} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.porTipoAccion.map((entry, i) => (
                        <Cell key={entry.label} fill={i % 2 === 0 ? NAVY : PINK} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-1">
                  {data.porTipoAccion.map((d, i) => (
                    <div key={d.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: i % 2 === 0 ? NAVY : PINK }} />
                      {d.label}
                    </div>
                  ))}
                </div>
              </ChartCard>

              {/* Chart 2: Cantidad por Proceso */}
              <ChartCard title="Cantidad de acciones por Proceso">
                <HorizontalBar data={data.porProceso} color={PINK} />
              </ChartCard>

              {/* Chart 3: Cantidad por Cliente */}
              <ChartCard title="Cantidad de ACR por cliente">
                <HorizontalBar data={data.porCliente} color={NAVY} />
              </ChartCard>
            </div>

            {/* ── Row 2: donut + cost bar + table ──────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Chart 4: Estado (donut) */}
              <ChartCard title="Estado de las acciones">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.porEstado}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      labelLine={false}
                      label={renderDonutLabel}
                    >
                      {data.porEstado.map((entry) => (
                        <Cell key={entry.label} fill={ESTADO_COLORS[entry.label] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="square"
                      iconSize={10}
                      formatter={(value, entry) => {
                        const e = entry as unknown as { payload: KV };
                        return <span className="text-xs text-slate-600">{value} ({e.payload.value})</span>;
                      }}
                    />
                    <Tooltip formatter={(v: number, name: string) => [`${v}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Chart 5: Costo por Proceso */}
              <ChartCard title="Costo por Proceso (millones)">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.costoPorProceso} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} interval={0} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v: number) => `${v}m`} />
                    <Tooltip content={<CostTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.costoPorProceso.map((entry, i) => (
                        <Cell key={entry.label} fill={i % 2 === 0 ? PINK : NAVY} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Table: Proceso × Subcategoría × Conteo */}
              <ChartCard title="Proceso · Subcategoría · Recuento">
                <div className="flex-1 overflow-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-1.5 pr-2 text-slate-500 font-semibold">Proceso</th>
                        <th className="text-left py-1.5 pr-2 text-slate-500 font-semibold">Subcategoría</th>
                        <th className="text-right py-1.5 text-slate-500 font-semibold">No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.porProcesoYFuente.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          <td className="py-1 pr-2 text-slate-700 max-w-27.5 truncate">{row.proceso}</td>
                          <td className="py-1 pr-2 text-slate-600 max-w-32.5 truncate">{row.subcategoria}</td>
                          <td className="py-1 text-right font-semibold text-slate-800">{row.conteo}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-300 bg-slate-50">
                        <td className="py-1.5 pr-2 font-bold text-slate-800" colSpan={2}>Total</td>
                        <td className="py-1.5 text-right font-bold text-slate-800">{data.totalRows}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

