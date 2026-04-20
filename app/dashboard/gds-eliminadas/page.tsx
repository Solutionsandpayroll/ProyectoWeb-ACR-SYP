"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

interface GdsEliminada {
  id: number;
  gds_registro_id: number;
  consecutivo: string;
  fecha_documentacion: string;
  tipo_cambio: string | null;
  estado: string | null;
  eliminado_en: string;
  razon_eliminacion: string | null;
}

interface SessionData {
  displayName: string;
  role: "admin" | "user";
}

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function GdsEliminadasPage() {
  const [records, setRecords]   = useState<GdsEliminada[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [session, setSession]   = useState<SessionData | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const verifySession = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        const currentSession = json.session ?? null;
        if (!cancelled) setSession(currentSession);
        if (!currentSession) { router.replace("/login"); return false; }
        if (currentSession.role !== "admin") { router.replace("/dashboard"); return false; }
        return true;
      } catch {
        router.replace("/login");
        return false;
      }
    };

    const fetchDeleted = async () => {
      const allowed = await verifySession();
      if (!allowed || cancelled) return;
      try {
        const response = await fetch("/api/gds-eliminadas");
        if (!response.ok) throw new Error("Error al cargar GDC eliminadas");
        const data = await response.json();
        if (!cancelled) setRecords(data.records || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchDeleted();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      <Header
        title="GDC Eliminadas"
        subtitle="Histórico de registros GDC eliminados para trazabilidad y auditoría"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard/historial-gds")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#105789] transition mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al historial
        </button>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#105789] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando GDC eliminadas…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && records.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 px-6 py-12 text-center">
            <svg className="w-10 h-10 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <p className="text-slate-600 font-medium">No hay GDC eliminadas en el histórico</p>
            <p className="text-slate-400 text-xs mt-1">Los registros eliminados aparecerán aquí.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && records.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 860 }}>
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Consecutivo", "Tipo de Cambio", "Estado", "Fecha Doc.", "Eliminado En", "Razón"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono font-semibold text-[#105789]">
                        {record.consecutivo}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {record.tipo_cambio ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          record.estado === "Cerrada"
                            ? "bg-emerald-100 text-emerald-700"
                            : record.estado === "En seguimiento"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {record.estado ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{fmtDate(record.fecha_documentacion)}</td>
                      <td className="px-5 py-3 text-slate-600">
                        <span className="block">{fmtDate(record.eliminado_en)}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(record.eliminado_en).toLocaleTimeString("es-ES")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                        {record.razon_eliminacion ?? <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="mt-6 text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="font-semibold mb-2">📋 Información de Trazabilidad</p>
          <p>Este histórico contiene todos los registros GDC eliminados. Cada entrada incluye:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Información del GDC eliminado (consecutivo, tipo, estado)</li>
            <li>Fecha y hora exacta de eliminación</li>
            <li>Razón de la eliminación ingresada por el usuario</li>
          </ul>
          {session && (
            <p className="mt-2 font-medium text-[#105789]">
              Sesión activa: {session.displayName} (Admin)
            </p>
          )}
        </div>

      </main>
    </div>
  );
}
