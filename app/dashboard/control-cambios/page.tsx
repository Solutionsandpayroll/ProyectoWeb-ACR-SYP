"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";

interface Cambio {
  id: number;
  version: string;
  fecha: string;
  descripcion: string;
  autor: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ControlCambiosPage() {
  const [cambios, setCambios]   = useState<Cambio[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [version, setVersion]   = useState("");
  const [fecha, setFecha]       = useState(today());
  const [descripcion, setDesc]  = useState("");
  const [autor, setAutor]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/control-cambios");
      if (!res.ok) throw new Error("Error al cargar los datos.");
      const data = await res.json();
      setCambios(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!version.trim() || !descripcion.trim() || !fecha) {
      setFormError("Versión, fecha y descripción son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/control-cambios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: version.trim(), fecha, descripcion: descripcion.trim(), autor: autor.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar.");
      setVersion(""); setFecha(today()); setDesc(""); setAutor("");
      setShowForm(false);
      await fetchData();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch("/api/control-cambios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Error al eliminar.");
      setDeletingId(null);
      await fetchData();
    } catch {
      setDeletingId(null);
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
      day: "2-digit", month: "long", year: "numeric",
    });

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-slate-50">
      <Header title="Control de Cambios" />

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Control de Cambios del Formato ACR</h1>
            <p className="text-sm text-slate-500 mt-1">
              Historial de versiones y modificaciones al formato GIN.
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(null); }}
            className="flex items-center gap-2 bg-[#105789] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#0d4570] transition shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? "Cancelar" : "Registrar cambio"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4"
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#105789]">Nuevo registro de cambio</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Versión *
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] bg-white"
                  type="text"
                  placeholder="ej. VG06"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Fecha *
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] bg-white"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Autor / Responsable
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] bg-white"
                  type="text"
                  placeholder="Nombre del responsable"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Descripción del cambio *
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] bg-white resize-none"
                rows={3}
                placeholder="Describe brevemente qué se modificó en el formato..."
                value={descripcion}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            {formError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="text-sm text-slate-600 hover:text-slate-800 font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="text-sm font-semibold bg-[#105789] text-white px-5 py-2 rounded-lg hover:bg-[#0d4570] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "Guardando..." : "Guardar registro"}
              </button>
            </div>
          </form>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="inline-block w-8 h-8 border-4 border-[#105789] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-5 py-4">{error}</div>
        ) : cambios.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">No hay registros de cambios aún.</p>
            <p className="text-xs mt-1">Haz clic en "Registrar cambio" para agregar el primero.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-22 top-0 bottom-0 w-px bg-slate-200" />

            <div className="space-y-0">
              {cambios.map((c, idx) => (
                <div key={c.id} className="relative flex gap-6 pb-8 last:pb-0">
                  {/* Version badge */}
                  <div className="shrink-0 w-22 pt-0.5 flex flex-col items-end gap-1 pr-5">
                    <span className="inline-block text-xs font-bold text-[#105789] bg-[#105789]/10 border border-[#105789]/20 rounded-md px-2 py-0.5 font-mono tracking-wide">
                      {c.version}
                    </span>
                  </div>

                  {/* Timeline dot */}
                  <div
                    className={`absolute left-21 top-1.5 w-3 h-3 rounded-full border-2 z-10 ${
                      idx === 0
                        ? "bg-[#105789] border-[#105789]"
                        : "bg-white border-slate-300"
                    }`}
                  />

                  {/* Card */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-xs text-slate-500 font-medium">
                            📅 {fmtDate(c.fecha)}
                          </span>
                          {c.autor && (
                            <span className="text-xs text-slate-400">
                              · ✏️ {c.autor}
                            </span>
                          )}
                          {idx === 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
                              Última versión
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.descripcion}</p>
                      </div>

                      {/* Delete */}
                      {deletingId === c.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500">¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-xs text-white bg-red-500 hover:bg-red-600 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-slate-600 hover:text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(c.id)}
                          className="opacity-0 group-hover:opacity-100 transition text-slate-300 hover:text-red-500 shrink-0 cursor-pointer"
                          title="Eliminar registro"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
