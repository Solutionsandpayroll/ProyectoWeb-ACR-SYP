"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ControlRow {
  id: number;
  consecutivo: string;
  tipo_accion: string;
  fecha_apertura: string | null;
  fecha_registro: string | null;
  fecha_limite: string | null;
  proceso: string;
  fuente: string;
  cliente: string;
  estado: string;
  evaluacion_riesgo: string;
  resp_ejecucion: string | null;
  resp_seguimiento: string | null;
  cierre_estimado: string | null;
  eficaz: string | null;
  fecha_verificacion_eficacia: string | null;
  observaciones: string | null;
  resp_ejecucion_email: string | null;
  resp_seguimiento_email: string | null;
  ultima_notificacion: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const estadoColor = (estado: string) => {
  if (!estado) return "bg-slate-100 text-slate-400";
  const e = estado.toLowerCase();
  if (e === "abierta")  return "bg-orange-50 text-orange-600";
  if (e === "cerrada")  return "bg-emerald-50 text-emerald-700";
  if (e === "parcial")  return "bg-blue-50 text-blue-600";
  return "bg-slate-100 text-slate-500";
};

const estadoDot = (estado: string) => {
  if (!estado) return "bg-slate-300";
  const e = estado.toLowerCase();
  if (e === "abierta") return "bg-orange-500";
  if (e === "cerrada") return "bg-emerald-500";
  if (e === "parcial") return "bg-blue-500";
  return "bg-slate-400";
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ControlAccionesPage() {
  const currentYear = new Date().getFullYear();

  const [years, setYears]               = useState<number[]>([currentYear]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [filter, setFilter]             = useState<"all" | "Abierta" | "Cerrada" | "Parcial">("all");
  const [newYear, setNewYear]           = useState("");
  const [addingYear, setAddingYear]     = useState(false);

  const [rows, setRows]       = useState<ControlRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState<Record<number, "saving" | "saved" | "error">>({});

  // Ref so debounce callbacks can read latest rows without stale closures
  const rowsRef = useRef<ControlRow[]>([]);
  rowsRef.current = rows;
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // ── Fetch available years on mount ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/control-acciones")
      .then((r) => r.json())
      .then((data) => {
        if (data.years && Array.isArray(data.years) && data.years.length > 0) {
          setYears(data.years);
          setSelectedYear(data.years[0]);
        }
      })
      .catch(console.error);
  }, []);

  // ── Fetch rows whenever year changes ────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/control-acciones?year=${selectedYear}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRows(data.data ?? []);
      })
      .catch((e) => setError(e.message ?? "Error al cargar"))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  // ── Persist a row to the DB (called by debounce) ─────────────────────────
  const saveRow = useCallback(async (rowId: number) => {
    const row = rowsRef.current.find((r) => r.id === rowId);
    if (!row) return;
    setSaving((prev) => ({ ...prev, [rowId]: "saving" }));
    try {
      const res = await fetch("/api/control-acciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acr_id: row.id,
          resp_ejecucion:              row.resp_ejecucion,
          resp_seguimiento:            row.resp_seguimiento,
          eficaz:                      row.eficaz,
          fecha_verificacion_eficacia: row.fecha_verificacion_eficacia,
          observaciones:               row.observaciones,
          resp_ejecucion_email:        row.resp_ejecucion_email,
          resp_seguimiento_email:      row.resp_seguimiento_email,
        }),
      });
      setSaving((prev) => ({ ...prev, [rowId]: res.ok ? "saved" : "error" }));
      setTimeout(() => setSaving((prev) => { const n = { ...prev }; delete n[rowId]; return n; }), 2000);
    } catch {
      setSaving((prev) => ({ ...prev, [rowId]: "error" }));
    }
  }, []);

  // ── Update local state + debounce save ───────────────────────────────────
  const updateRow = useCallback((rowId: number, updates: Partial<ControlRow>) => {
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, ...updates } : r));
    if (saveTimers.current[rowId]) clearTimeout(saveTimers.current[rowId]);
    saveTimers.current[rowId] = setTimeout(() => saveRow(rowId), 800);
  }, [saveRow]);

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.estado === filter);
  }, [rows, filter]);

  const stats = useMemo(() => ({
    total:    rows.length,
    abiertas: rows.filter((r) => r.estado === "Abierta").length,
    cerradas: rows.filter((r) => r.estado === "Cerrada").length,
    parciales: rows.filter((r) => r.estado === "Parcial").length,
    sinEstado: rows.filter((r) => !r.estado).length,
  }), [rows]);

  const handleAddYear = () => {
    const y = parseInt(newYear);
    if (!y || y < 2000 || y > 2100) return;
    if (!years.includes(y)) {
      setYears((prev) => [...prev, y].sort((a, b) => b - a));
    }
    setSelectedYear(y);
    setNewYear("");
    setAddingYear(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Control de Acciones"
        subtitle="Seguimiento anual de Acciones Correctivas y de Mejora · GIN V07"
      />

      <main className="flex-1 p-6 w-full max-w-350 mx-auto min-w-0">

        {/* ── Year selector bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Año:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`cursor-pointer px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  selectedYear === y
                    ? "bg-[#105789] text-white border-[#105789] shadow"
                    : "bg-white text-slate-600 border-slate-300 hover:border-[#105789] hover:text-[#105789]"
                }`}
              >
                {y}
              </button>
            ))}

            {/* Add year */}
            {addingYear ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddYear()}
                  placeholder="Ej: 2027"
                  className="w-24 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#105789]"
                  autoFocus
                />
                <button
                  onClick={handleAddYear}
                  className="cursor-pointer px-3 py-1 text-sm font-semibold bg-[#105789] text-white rounded-lg hover:bg-[#0d3f6e] transition"
                >
                  Crear
                </button>
                <button
                  onClick={() => { setAddingYear(false); setNewYear(""); }}
                  className="cursor-pointer px-3 py-1 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingYear(true)}
                className="cursor-pointer px-3 py-1.5 text-sm font-semibold text-[#105789] border border-dashed border-[#105789]/40 rounded-full hover:bg-[#105789]/5 transition"
              >
                + Añadir año
              </button>
            )}
          </div>
        </div>

        {/* ── Page title ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 mb-2">
            GIN V07 · Sistema de Gestión · {selectedYear}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Control de Acciones <span className="text-[#105789]">Correctivas</span> y/o de Mejora
          </h2>
          <p className="text-sm text-slate-400 mt-1">Registro y seguimiento del estado de acciones — Año {selectedYear}</p>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total registros",  value: stats.total,    color: "text-slate-800" },
            { label: "Abiertas",         value: stats.abiertas, color: "text-orange-500" },
            { label: "Cerradas",         value: stats.cerradas, color: "text-emerald-600" },
            { label: "En proceso",       value: stats.parciales + stats.sinEstado, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-0">

          {/* Table header row */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-wrap gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Acciones registradas — {selectedYear}
            </span>
            <div className="flex gap-2 flex-wrap">
              {(["all", "Abierta", "Cerrada", "Parcial"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`cursor-pointer px-3 py-1 rounded text-xs font-semibold border transition-all ${
                    filter === f
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {f === "all" ? "Todos" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                <span className="w-5 h-5 border-2 border-slate-300 border-t-[#105789] rounded-full animate-spin" />
                Cargando registros...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16 text-red-500 text-sm gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            ) : (
            <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#105789", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}>
                    {["No.", "Tipo", "Apertura", "Proceso", "Resp. Proceso", "Resp. Seguimiento", "Fuente", "Estado", "Eficaz", "Cierre estimado", "Fecha verif. eficacia", "Cliente", "Observaciones"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-white text-xs font-mono uppercase tracking-wider whitespace-nowrap border-r border-white/10 last:border-r-0"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 text-white text-xs font-mono uppercase tracking-wider">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-14 text-slate-300 italic text-sm">
                        {rows.length === 0
                          ? `No hay registros ACR para el año ${selectedYear}. Los registros creados en ${selectedYear} aparecerán aquí automáticamente.`
                          : "No hay registros que coincidan con el filtro seleccionado."}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, i) => (
                      <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                        {/* No. */}
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 font-semibold whitespace-nowrap">
                          {String(i + 1).padStart(3, "0")}
                        </td>
                        {/* Tipo */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                            row.tipo_accion === "Correctiva"
                              ? "text-orange-600 bg-orange-50 border-orange-200"
                              : "text-blue-700 bg-blue-50 border-blue-200"
                          }`}>
                            {row.tipo_accion || "—"}
                          </span>
                        </td>
                        {/* Apertura */}
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {fmtDate(row.fecha_registro)}
                        </td>
                        {/* Proceso */}
                        <td className="px-4 py-3 text-slate-700 max-w-50">
                          <div className="font-medium text-xs leading-snug">{row.proceso || "—"}</div>
                        </td>
                        {/* Resp. Proceso — editable */}
                        <td className="px-3 py-2 min-w-44">
                          <input
                            type="text"
                            value={row.resp_ejecucion ?? ""}
                            onChange={(e) => updateRow(row.id, { resp_ejecucion: e.target.value || null })}
                            placeholder="Sin asignar"
                            className="w-full text-xs font-semibold text-slate-700 placeholder:text-slate-300 placeholder:italic bg-transparent border border-transparent rounded px-1.5 py-1 hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:border-[#105789]/40 focus:bg-blue-50/40 transition-all"
                          />
                          <input
                            type="email"
                            value={row.resp_ejecucion_email ?? ""}
                            onChange={(e) => updateRow(row.id, { resp_ejecucion_email: e.target.value || null })}
                            placeholder="correo@empresa.com"
                            className="w-full mt-0.5 text-[11px] text-slate-400 placeholder:text-slate-200 bg-transparent border border-transparent rounded px-1.5 py-0.5 hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:border-[#105789]/40 focus:bg-blue-50/40 transition-all"
                          />
                        </td>
                        {/* Resp. Seguimiento — editable */}
                        <td className="px-3 py-2 min-w-44">
                          <input
                            type="text"
                            value={row.resp_seguimiento ?? ""}
                            onChange={(e) => updateRow(row.id, { resp_seguimiento: e.target.value || null })}
                            placeholder="Sin asignar"
                            className="w-full text-xs text-slate-600 placeholder:text-slate-300 placeholder:italic bg-transparent border border-transparent rounded px-1.5 py-1 hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:border-[#105789]/40 focus:bg-blue-50/40 transition-all"
                          />
                          <input
                            type="email"
                            value={row.resp_seguimiento_email ?? ""}
                            onChange={(e) => updateRow(row.id, { resp_seguimiento_email: e.target.value || null })}
                            placeholder="correo@empresa.com"
                            className="w-full mt-0.5 text-[11px] text-slate-400 placeholder:text-slate-200 bg-transparent border border-transparent rounded px-1.5 py-0.5 hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:border-[#105789]/40 focus:bg-blue-50/40 transition-all"
                          />
                        </td>
                        {/* Fuente */}
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-45">
                          <div className="leading-snug">{row.fuente || "—"}</div>
                        </td>
                        {/* Estado */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.estado ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${estadoColor(row.estado)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estadoDot(row.estado)}`} />
                              {row.estado}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs italic">—</span>
                          )}
                        </td>
                        {/* Eficaz — editable */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <select
                            value={row.eficaz ?? ""}
                            onChange={(e) => updateRow(row.id, { eficaz: e.target.value || null })}
                            className={`cursor-pointer text-xs font-bold border border-transparent rounded px-1.5 py-1 focus:outline-none focus:border-[#105789]/40 transition-all ${
                              row.eficaz === "Sí"
                                ? "bg-emerald-50 text-emerald-700 hover:border-emerald-200"
                                : row.eficaz === "No"
                                ? "bg-red-50 text-red-600 hover:border-red-200"
                                : "bg-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <option value="">—</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                          </select>
                        </td>
                        {/* Cierre estimado */}
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {fmtDate(row.cierre_estimado ?? row.fecha_limite)}
                        </td>
                        {/* Fecha verificación eficacia — editable */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="date"
                            value={row.fecha_verificacion_eficacia ?? ""}
                            onChange={(e) => updateRow(row.id, { fecha_verificacion_eficacia: e.target.value || null })}
                            className="text-xs font-mono text-slate-500 bg-transparent border border-transparent rounded px-1.5 py-1 hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:border-[#105789]/40 focus:bg-blue-50/40 transition-all"
                          />
                        </td>
                        {/* Cliente */}
                        <td className="px-4 py-3 text-xs font-semibold text-[#105789] whitespace-nowrap">
                          {row.cliente || "—"}
                        </td>
                        {/* Observaciones — editable */}
                        <td className="px-3 py-2 min-w-48">
                          <input
                            type="text"
                            value={row.observaciones ?? ""}
                            onChange={(e) => updateRow(row.id, { observaciones: e.target.value || null })}
                            placeholder="—"
                            className="w-full text-xs text-slate-500 placeholder:text-slate-300 bg-transparent border border-transparent rounded px-1.5 py-1 hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:border-[#105789]/40 focus:bg-blue-50/40 transition-all"
                          />
                        </td>
                        {/* Ver + save status */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <Link
                              href={`/dashboard/historial-acr/${row.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#105789] hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Ver
                            </Link>
                            {saving[row.id] === "saving" && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span className="w-2.5 h-2.5 border border-slate-300 border-t-[#105789] rounded-full animate-spin" />
                                Guardando
                              </span>
                            )}
                            {saving[row.id] === "saved" && (
                              <span className="text-[10px] text-emerald-500">✓ Guardado</span>
                            )}
                            {saving[row.id] === "error" && (
                              <span className="text-[10px] text-red-500">Error</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer row */}
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 font-mono flex items-center justify-between flex-wrap gap-2">
            <span>
              Control de Acciones Correctivas y/o de Mejora · GIN V07 · {selectedYear}
            </span>
            <span>
              {filteredRows.length} de {rows.length} registro{rows.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
