"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { AcrRecord, AcrStatus } from "@/types";

// Mock data — replace with Neon DB query via API route
const mockData: AcrRecord[] = [
  { id: "ACR-001", title: "Revisión de nómina — Q1 2025", description: "Corrección en cálculo de horas extra", responsible: "Carlos Mendez", amount: 12500, status: "Cerrada", date: "2025-02-10", createdAt: "2025-02-01", updatedAt: "2025-02-10" },
  { id: "ACR-002", title: "Auditoría procesos internos", description: "Mejora en flujos de aprobación", responsible: "Ana Torres", amount: 8200, status: "Abierta", date: "2025-02-20", createdAt: "2025-02-15", updatedAt: "2025-02-20" },
  { id: "ACR-003", title: "Corrección facturas proveedor", description: "Diferencia detectada en pagos", responsible: "Luis García", amount: 3700, status: "Abierta", date: "2025-02-22", createdAt: "2025-02-22", updatedAt: "2025-02-22" },
  { id: "ACR-004", title: "Error en reporte fiscal Q4", description: "Inconsistencia en declaraciones", responsible: "María Ruiz", amount: 21000, status: "Cerrada", date: "2025-01-15", createdAt: "2025-01-10", updatedAt: "2025-01-15" },
  { id: "ACR-005", title: "Actualización política vacaciones", description: "Ajuste a nuevo reglamento", responsible: "Pedro Soto", amount: 0, status: "Abierta", date: "2025-02-25", createdAt: "2025-02-25", updatedAt: "2025-02-25" },
];

export default function HistorialAcrPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AcrStatus | "Todos">("Todos");

  const filtered = mockData.filter((acr) => {
    const matchSearch =
      acr.title.toLowerCase().includes(search.toLowerCase()) ||
      acr.responsible.toLowerCase().includes(search.toLowerCase()) ||
      acr.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || acr.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col flex-1">
      <Header title="Historial ACR" subtitle="Todos los registros de Acciones Correctivas y de Mejora" />

      <main className="flex-1 p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por ID, título o responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {(["Todos", "Abierta", "Cerrada"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                  filterStatus === s
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-300 hover:border-blue-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{filtered.length}</span> registro(s) encontrado(s)
            </p>
            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Título</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Responsable</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Monto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No se encontraron registros con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((acr) => (
                    <tr key={acr.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{acr.id}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800">{acr.title}</p>
                        <p className="text-xs text-slate-400 hidden sm:block">{acr.description}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{acr.responsible}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={acr.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-700 hidden lg:table-cell">
                        {acr.amount > 0 ? `$${acr.amount.toLocaleString("es-MX")}` : <span className="text-slate-400 font-normal">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 hidden xl:table-cell">
                        {new Date(acr.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
