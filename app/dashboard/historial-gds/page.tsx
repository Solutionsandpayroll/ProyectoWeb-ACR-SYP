"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";

// ─── Types ────────────────────────────────────────────────────────────────────
type GdsEstado = "Abierta" | "Cerrada";

interface GdsRecord {
  id: number;
  consecutivo: string;
  fecha_documentacion: string;
  proposito: string | null;
  descripcion_cambio: string | null;
  cambio_planeado: string | null;
  tipo_cambio: string | null;
  consecuencias: string | null;
  estado: GdsEstado;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: GdsEstado }) {
  const map: Record<GdsEstado, string> = {
    Abierta: "bg-amber-100 text-amber-700 border-amber-200",
    Cerrada: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.Abierta}`}
    >
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[80, 160, 90, 90, 80, 110].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3.5 rounded bg-slate-200 animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HistorialGdsPage() {
  const [records, setRecords]           = useState<GdsRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [filterEstado, setFilterEstado] = useState<GdsEstado | "Todos">("Todos");
  const [filterTipo, setFilterTipo]     = useState("Todos");
  const [filterAnio, setFilterAnio]     = useState("Todos");
  const [sortBy, setSortBy]             = useState<"fecha" | "consecutivo">("fecha");

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/gds");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al cargar el historial");
      setRecords(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // ── Derived ────────────────────────────────────────────────────────────
  const tipoOptions = useMemo(() => {
    const unique = [...new Set(records.map((r) => r.tipo_cambio).filter(Boolean) as string[])].sort();
    return ["Todos", ...unique];
  }, [records]);

  const anios = useMemo(() => {
    const unique = [
      ...new Set(records.map((r) => String(new Date(r.fecha_documentacion).getFullYear()))),
    ].sort((a, b) => Number(b) - Number(a));
    return ["Todos", ...unique];
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = records.filter((r) => {
      const matchSearch =
        r.consecutivo.toLowerCase().includes(q) ||
        (r.proposito ?? "").toLowerCase().includes(q) ||
        (r.tipo_cambio ?? "").toLowerCase().includes(q) ||
        (r.descripcion_cambio ?? "").toLowerCase().includes(q);
      const matchEstado = filterEstado === "Todos" || r.estado === filterEstado;
      const matchTipo   = filterTipo   === "Todos" || r.tipo_cambio === filterTipo;
      const matchAnio   = filterAnio   === "Todos" ||
        String(new Date(r.fecha_documentacion).getFullYear()) === filterAnio;
      return matchSearch && matchEstado && matchTipo && matchAnio;
    });
    return [...list].sort((a, b) => {
      if (sortBy === "fecha")
        return new Date(b.fecha_documentacion).getTime() - new Date(a.fecha_documentacion).getTime();
      if (sortBy === "consecutivo")
        return a.consecutivo.localeCompare(b.consecutivo);
      return 0;
    });
  }, [records, search, filterEstado, filterTipo, filterAnio, sortBy]);

  // Summary stats scoped to year filter
  const base = filterAnio === "Todos"
    ? records
    : records.filter((r) => String(new Date(r.fecha_documentacion).getFullYear()) === filterAnio);
  const totalAbierta = base.filter((r) => r.estado === "Abierta").length;
  const totalCerrada  = base.filter((r) => r.estado === "Cerrada").length;

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Historial GDC"
        subtitle="Todos los registros de Gestión del Cambio"
      />

      <main className="flex-1 p-4 sm:p-6 space-y-6">

        {/* ── Summary cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: filterAnio === "Todos" ? "Total registros" : `Total ${filterAnio}`,
              value: loading ? "—" : base.length,
              color: "text-slate-800",
            },
            { label: "Abiertas", value: loading ? "—" : totalAbierta, color: "text-amber-600" },
            { label: "Cerradas", value: loading ? "—" : totalCerrada, color: "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
              <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
              <p className={`text-lg font-bold ${color}`}>
                {loading
                  ? <span className="inline-block w-16 h-5 bg-slate-200 animate-pulse rounded" />
                  : value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Year tabs ──────────────────────────────────────────────────── */}
        {!loading && anios.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Año</span>
            {anios.map((a) => {
              const count =
                a === "Todos"
                  ? records.length
                  : records.filter(
                      (r) => String(new Date(r.fecha_documentacion).getFullYear()) === a
                    ).length;
              return (
                <button
                  key={a}
                  onClick={() => setFilterAnio(a)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition cursor-pointer ${
                    filterAnio === a
                      ? "bg-[#105789] text-white border-[#105789] shadow-sm"
                      : "bg-white text-slate-600 border-slate-300 hover:border-[#105789] hover:text-[#105789]"
                  }`}
                >
                  {a}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      filterAnio === a ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por consecutivo, propósito, tipo cambio…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-transparent transition"
            />
          </div>

          {/* Estado pills */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {(["Todos", "Abierta", "Cerrada"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterEstado(s)}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                  filterEstado === s
                    ? "bg-[#105789] text-white border-[#105789] shadow-sm"
                    : "bg-white text-slate-600 border-slate-300 hover:border-[#105789]/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Tipo cambio dropdown */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#105789]/30 transition shrink-0"
          >
            {tipoOptions.map((t) => <option key={t}>{t}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#105789]/30 transition shrink-0"
          >
            <option value="fecha">Más recientes</option>
            <option value="consecutivo">Consecutivo</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchRecords}
            disabled={loading}
            title="Recargar datos"
            className="p-2.5 rounded-lg border border-slate-300 bg-white text-slate-500 hover:text-[#105789] hover:border-[#105789]/30 transition disabled:opacity-40 shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3.5">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchRecords}
              className="ml-auto text-sm underline hover:no-underline font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {loading ? (
                <span className="inline-block w-32 h-3.5 bg-slate-200 animate-pulse rounded" />
              ) : (
                <>
                  <span className="font-semibold text-slate-800">{filtered.length}</span>{" "}
                  registro(s) encontrado(s)
                </>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-175">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Consecutivo
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Propósito / Descripción
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                    Tipo cambio
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                    ¿Planeado?
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">
                    Fecha documentación
                  </th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {/* Skeletons */}
                {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

                {/* Empty state */}
                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium text-slate-500">
                          {records.length === 0
                            ? "Aún no hay registros GDC en la base de datos"
                            : "Ningún registro coincide con los filtros aplicados"}
                        </p>
                        {records.length === 0 && (
                          <a
                            href="/dashboard/formulario-gds"
                            className="text-xs text-[#105789] hover:underline font-medium"
                          >
                            Crear el primer GDC →
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-[#105789] bg-blue-50 border border-blue-100 rounded px-2 py-0.5">
                        {r.consecutivo}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {r.proposito ?? <span className="text-slate-400 italic">Sin propósito</span>}
                      </p>
                      {r.descripcion_cambio && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{r.descripcion_cambio}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 hidden md:table-cell">
                      {r.tipo_cambio ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 hidden lg:table-cell">
                      {r.cambio_planeado ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.estado} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 hidden xl:table-cell whitespace-nowrap">
                      {fmtDate(r.fecha_documentacion)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/historial-gds/${r.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#105789] border border-[#105789]/30 rounded-lg px-3 py-1.5 hover:bg-[#105789] hover:text-white transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
