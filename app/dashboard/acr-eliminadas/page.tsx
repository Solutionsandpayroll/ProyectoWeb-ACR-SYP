"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

interface AcrEliminada {
  id: number;
  acr_original_id: number;
  consecutivo: string;
  fuente: string;
  proceso: string;
  cliente: string;
  fecha_apertura: string;
  tipo_accion: string;
  estado: string;
  eliminado_en: string;
  razon_eliminacion: string;
}

interface SessionData {
  displayName: string;
  role: "admin" | "user";
}

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function AcrEliminadasPage() {
  const [records, setRecords] = useState<AcrEliminada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const verifySession = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        const currentSession = json.session ?? null;
        if (!cancelled) {
          setSession(currentSession);
        }

        if (!currentSession) {
          router.replace("/login");
          return false;
        }

        if (currentSession.role !== "admin") {
          router.replace("/dashboard");
          return false;
        }

        return true;
      } catch {
        router.replace("/login");
        return false;
      }
    };

    const fetchDeleted = async () => {
      const allowed = await verifySession();
      if (!allowed) return;

      try {
        const response = await fetch("/api/acr-eliminadas");
        if (!response.ok) throw new Error("Error al cargar ACRs eliminadas");
        const data = await response.json();
        if (!cancelled) {
          setRecords(data.records || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void fetchDeleted();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      <Header title="ACRs Eliminadas" subtitle="Histórico de ACRs eliminadas para trazabilidad y auditoría" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#105789] transition-colors font-medium cursor-pointer mb-6 flex-wrap">
          <button
            onClick={() => router.push("/dashboard/historial-acr")}
            className="inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver al historial
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#105789] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando ACRs eliminadas...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 px-6 py-12 text-center">
            <p className="text-slate-600">
              No hay ACRs eliminadas en el histórico
            </p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 980 }}>
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">
                      Consecutivo
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">
                      Proceso
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">
                      Fecha Apertura
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">
                      Eliminado En
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">
                      Razón
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono font-semibold text-slate-800">
                        {record.consecutivo}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {record.proceso}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {record.cliente}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            record.tipo_accion === "Correctiva"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {record.tipo_accion}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {fmtDate(record.fecha_apertura)}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        <span className="text-xs">
                          {fmtDate(record.eliminado_en)}
                        </span>
                        <br />
                        <span className="text-xs text-slate-400">
                          {new Date(record.eliminado_en).toLocaleTimeString(
                            "es-ES"
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 max-w-xs truncate">
                        {record.razon_eliminacion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="font-semibold mb-2">📋 Información de Trazabilidad</p>
          <p>
            Este histórico contiene todos los ACRs eliminados. Cada registro
            incluye:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Información completa del ACR eliminado (para auditoría y
              referencia)
            </li>
            <li>Fecha y hora exacta de eliminación</li>
            <li>Razón de la eliminación</li>
            <li>Enlace al ACR original (ID) para recuperación si es necesario</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
