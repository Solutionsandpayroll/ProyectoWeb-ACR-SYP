"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { PieLabelRenderProps } from "recharts/types/polar/Pie";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KV { label: string; value: number }
interface TableRow { proceso: string; subcategoria: string; conteo: number }
interface AnalyticsData {
  availableYears: number[];
  porTipoAccion: KV[];
  porProceso: KV[];
  porCliente: KV[];
  porEstado: KV[];
  costoPorProceso: KV[];
  porProcesoYFuente: TableRow[];
  totalCosto: number;
  totalRows: number;
}

interface YearRow { anio: number; value: number }
interface TipoAccionRow { anio: number; tipo_accion: string; value: number }
interface EstadoRow { anio: number; estado: string; value: number }
interface CompareData {
  availableYears: number[];
  totalPorAnio: YearRow[];
  costoPorAnio: YearRow[];
  tipoAccionPorAnio: TipoAccionRow[];
  estadoPorAnio: EstadoRow[];
}

type ViewMode = "single" | "all" | "compare";
type PivotRow = Record<string, string | number>;

// ─── Pivot helper ─────────────────────────────────────────────────────────────
function pivotByYear(
  rows: Array<{ anio: number } & Record<string, unknown>>,
  colKey: string,
  valueKey: string
): PivotRow[] {
  const map = new Map<number, PivotRow>();
  for (const row of rows) {
    if (!map.has(row.anio)) map.set(row.anio, { anio: String(row.anio) });
    const entry = map.get(row.anio)!;
    entry[String(row[colKey])] = Number(row[valueKey]);
  }
  return Array.from(map.values());
}

function uniqueCols(rows: Array<Record<string, unknown>>, colKey: string): string[] {
  return [...new Set(rows.map((r) => String(r[colKey])))];
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY = "#1d3a6e";
const PINK = "#e51148";
const YEAR_COLORS = ["#1d3a6e", "#e51148", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];
const ESTADO_COLORS: Record<string, string> = {
  Cerrada: NAVY,
  Abierta: PINK,
  Parcial: "#10b981",
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col">
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
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelRenderProps) => {
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    typeof midAngle !== "number" ||
    typeof innerRadius !== "number" ||
    typeof outerRadius !== "number" ||
    typeof percent !== "number"
  ) {
    return null;
  }
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
  const currentYear = new Date().getFullYear();
  const [viewMode, setViewMode]       = useState<ViewMode>("single");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [data, setData]               = useState<AnalyticsData | null>(null);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [classifying, setClassifying] = useState(false);
  const [classifyMessage, setClassifyMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let url = "/api/panel-analisis";
    if (viewMode === "compare") url += "?mode=compare";
    else if (viewMode === "single") url += `?year=${selectedYear}`;
    else url += "?year=all";

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar datos");
        return r.json();
      })
      .then((d) => {
        if (viewMode === "compare") {
          setCompareData(d as CompareData);
          setData(null);
        } else {
          setData(d as AnalyticsData);
          setCompareData(null);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [viewMode, selectedYear, refreshTick]);

  const handleClasificarSubcategorias = async (forceReclassifyAll = false) => {
    if (viewMode !== "single") return;
    setClassifying(true);
    setClassifyMessage(null);
    try {
      const res = await fetch("/api/panel-analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear, forceReclassifyAll }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "No se pudo clasificar subcategorias");

      const stats = payload.stats ?? {};
      setClassifyMessage(
        `Clasificacion completada (${selectedYear}): ${stats.reclassified ?? 0} reclasificados, ${stats.unchanged ?? 0} sin cambios, ${stats.reused ?? 0} reutilizados.`
      );
      setRefreshTick((v) => v + 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado al clasificar";
      setClassifyMessage(msg);
    } finally {
      setClassifying(false);
    }
  };

  const availableYears = data?.availableYears ?? compareData?.availableYears ?? [];

  // ── Derived compare data ───────────────────────────────────────────────────
  const compareTiposPivoted = useMemo(
    () =>
      compareData
        ? pivotByYear(
            compareData.tipoAccionPorAnio as unknown as Array<{ anio: number } & Record<string, unknown>>,
            "tipo_accion",
            "value"
          )
        : [],
    [compareData]
  );
  const compareEstadosPivoted = useMemo(
    () =>
      compareData
        ? pivotByYear(
            compareData.estadoPorAnio as unknown as Array<{ anio: number } & Record<string, unknown>>,
            "estado",
            "value"
          )
        : [],
    [compareData]
  );
  const tiposUnicos   = useMemo(() => uniqueCols(compareData?.tipoAccionPorAnio as unknown as PivotRow[] ?? [], "tipo_accion"), [compareData]);
  const estadosUnicos = useMemo(() => uniqueCols(compareData?.estadoPorAnio as unknown as PivotRow[] ?? [], "estado"),          [compareData]);

  const headerSubtitle =
    viewMode === "all"
      ? "Todos los años · Acciones Correctivas y de Mejora"
      : viewMode === "compare"
      ? "Comparativa entre años · Acciones Correctivas y de Mejora"
      : `Año ${selectedYear} · Acciones Correctivas y de Mejora`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Panel de Análisis" subtitle={headerSubtitle} />

      <main className="flex-1 p-4 sm:p-6 space-y-5 overflow-auto">
        {/* ── Year / mode selector ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1 shrink-0">Vista:</span>

            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm ${
                viewMode === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos los años
            </button>

            <button
              onClick={() => setViewMode("compare")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm ${
                viewMode === "compare"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ⇄ Comparar años
            </button>

            {availableYears.length > 0 && <div className="w-px h-5 bg-slate-300 mx-1 shrink-0" />}

            {availableYears.map((y, i) => (
              <button
                key={y}
                onClick={() => { setViewMode("single"); setSelectedYear(y); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm"
                style={
                  viewMode === "single" && selectedYear === y
                    ? { backgroundColor: YEAR_COLORS[i % YEAR_COLORS.length], color: "white" }
                    : { backgroundColor: "#f1f5f9", color: "#475569" }
                }
              >
                {y}
              </button>
            ))}
          </div>

          {viewMode === "single" && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleClasificarSubcategorias(false)}
                disabled={classifying}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#105789] text-white hover:bg-[#0f4e7a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm"
              >
                {classifying ? "Clasificando..." : "Dividir procesos en subcategorias (IA)"}
              </button>
              <button
                onClick={() => handleClasificarSubcategorias(true)}
                disabled={classifying}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm"
                title="Fuerza reclasificación completa del año"
              >
                Reclasificar todo el año
              </button>
              <span className="text-[11px] text-slate-500">
                Solo se reclasifican ACR nuevos o con cambios en descripcion/causas.
              </span>
            </div>
          )}

          {classifyMessage && (
            <p className="mt-2 text-xs text-slate-600">{classifyMessage}</p>
          )}
        </div>

        {/* ── Header summary strip (only in non-compare modes) ─────────── */}
        {viewMode !== "compare" && (
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 shadow-sm px-4 sm:px-6 py-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Tablero de Acciones Correctivas y de Mejora</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">
                {viewMode === "all" ? "Todos los años" : String(selectedYear)}
              </p>
            </div>
            <div className="bg-slate-800 text-white rounded-xl px-5 sm:px-6 py-3 text-right min-w-full sm:min-w-50">
              <p className="text-xl font-bold leading-tight">
                {loading || !data
                  ? "—"
                  : data.totalCosto >= 1_000_000
                  ? `${(data.totalCosto / 1_000_000).toLocaleString("es-CO", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mill.`
                  : `$${data.totalCosto.toLocaleString("es-CO")}`}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Costo total · {viewMode === "all" ? "Todos los años" : selectedYear}
              </p>
            </div>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-slate-500 text-sm">Cargando métricas…</span>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">{error}</div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            NORMAL VIEW  (single year  OR  all years)
        ══════════════════════════════════════════════════════════════════ */}
        {data && !loading && (
          <>
            {/* ── Row 1: 3 charts ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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

              <ChartCard title="Cantidad de acciones por Proceso">
                <HorizontalBar data={data.porProceso} color={PINK} />
              </ChartCard>

              <ChartCard title="Cantidad de ACR por cliente">
                <HorizontalBar data={data.porCliente} color={NAVY} />
              </ChartCard>
            </div>

            {/* ── Row 2: donut + cost bar + table ──────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
                    <Tooltip
                      formatter={(value, name) => [
                        `${typeof value === "number" ? value : Number(value ?? 0)}`,
                        String(name ?? ""),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

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

        {/* ══════════════════════════════════════════════════════════════════
            COMPARE VIEW
        ══════════════════════════════════════════════════════════════════ */}
        {compareData && !loading && viewMode === "compare" && (
          <>
            {/* ── Row 1: Total ACRs + Costo por año ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Total de ACRs por año">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={compareData.totalPorAnio.map((r) => ({ label: String(r.anio), value: r.value }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {compareData.totalPorAnio.map((r, i) => (
                        <Cell key={r.anio} fill={YEAR_COLORS[i % YEAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Costo total por año (millones)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={compareData.costoPorAnio.map((r) => ({ label: String(r.anio), value: r.value }))}
                    margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v: number) => `${v}m`} />
                    <Tooltip content={<CostTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {compareData.costoPorAnio.map((r, i) => (
                        <Cell key={r.anio} fill={YEAR_COLORS[i % YEAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Row 2: Tipo de acción + Estado (grouped / stacked) ────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Tipo de acción por año">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={compareTiposPivoted} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="anio" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    {tiposUnicos.map((tipo, i) => (
                      <Bar key={tipo} dataKey={tipo} fill={YEAR_COLORS[i % YEAR_COLORS.length]} radius={[3, 3, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Estado de las acciones por año">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={compareEstadosPivoted} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="anio" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    {estadosUnicos.map((estado) => (
                      <Bar
                        key={estado}
                        dataKey={estado}
                        fill={ESTADO_COLORS[estado] ?? "#94a3b8"}
                        stackId="estado"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Row 3: Summary table ─────────────────────────────────── */}
            <ChartCard title="Resumen comparativo por año">
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-4 text-slate-500 font-semibold">Año</th>
                      <th className="text-right py-2 pr-4 text-slate-500 font-semibold">Total ACRs</th>
                      {tiposUnicos.map((t) => (
                        <th key={t} className="text-right py-2 pr-4 text-slate-500 font-semibold">{t}</th>
                      ))}
                      {estadosUnicos.map((e) => (
                        <th key={e} className="text-right py-2 pr-4 text-slate-500 font-semibold">{e}</th>
                      ))}
                      <th className="text-right py-2 text-slate-500 font-semibold">Costo (mill.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.totalPorAnio.map((yearRow) => {
                      const costo = compareData.costoPorAnio.find((r) => r.anio === yearRow.anio)?.value ?? 0;
                      const tipoMap = Object.fromEntries(
                        compareData.tipoAccionPorAnio.filter((r) => r.anio === yearRow.anio).map((r) => [r.tipo_accion, r.value])
                      );
                      const estadoMap = Object.fromEntries(
                        compareData.estadoPorAnio.filter((r) => r.anio === yearRow.anio).map((r) => [r.estado, r.value])
                      );
                      return (
                        <tr key={yearRow.anio} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          <td className="py-1.5 pr-4 font-semibold text-slate-800">{yearRow.anio}</td>
                          <td className="py-1.5 pr-4 text-right font-bold text-slate-800">{yearRow.value}</td>
                          {tiposUnicos.map((t) => (
                            <td key={t} className="py-1.5 pr-4 text-right text-slate-600">{tipoMap[t] ?? 0}</td>
                          ))}
                          {estadosUnicos.map((e) => (
                            <td key={e} className="py-1.5 pr-4 text-right text-slate-600">{estadoMap[e] ?? 0}</td>
                          ))}
                          <td className="py-1.5 text-right text-slate-600">{costo}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </>
        )}
      </main>
    </div>
  );
}

