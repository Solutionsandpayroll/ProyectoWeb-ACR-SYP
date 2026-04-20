"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { CARGOS_NEW_SCALE } from "@/lib/cargo-scale";
import EvidenciaUpload from "@/components/EvidenciaUpload";

// ─── Style Constants ─────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 md:px-7 py-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {number}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-6 md:px-7 py-5 sm:py-6">{children}</div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Responsable {
  nombre: string;
  cargo: string;
}

interface ActividadPlan {
  // Plan
  actividad: string;
  fecha: string;
  responsables: Responsable[];
  recursos: string[];
  impacto: string;
  // Seguimiento
  seguFecha: string;
  seguResponsable: string;
  seguEvidencia: string;
  seguTieneRiesgos: string;
  seguCuales: string;
  seguNroAccionMejora: string;
}

const newActividad = (): ActividadPlan => ({
  actividad: "",
  fecha: "",
  responsables: [{ nombre: "", cargo: "" }],
  recursos: [],
  impacto: "",
  seguFecha: "",
  seguResponsable: "",
  seguEvidencia: "",
  seguTieneRiesgos: "",
  seguCuales: "",
  seguNroAccionMejora: "",
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FormularioGdsPage() {
  const today = new Date().toISOString().split("T")[0];

  // ── Consecutivo ──
  const [consecutivo, setConsecutivo] = useState("");
  useEffect(() => {
    fetch("/api/gds/next-consecutive")
      .then((r) => r.json())
      .then((d) => setConsecutivo(d.nextConsecutivo ?? "001"))
      .catch(() => setConsecutivo("001"));
  }, []);

  // ── Section 1 — Información General ──
  const [info, setInfo] = useState({
    fechaDocumentacion: today,
    proposito: "",
    descripcionCambio: "",
    cambioPlaneado: "",
    tipoCambio: "",
    consecuencias: "",
  });

  const setInfoField = (key: string, value: string) =>
    setInfo((p) => ({ ...p, [key]: value }));

  // ── Section 2 — Plan de Acción ──
  const [actividades, setActividades] = useState<ActividadPlan[]>([newActividad()]);

  const updateActividad = (i: number, key: keyof Omit<ActividadPlan, "responsables" | "recursos">, val: string) =>
    setActividades((prev) => prev.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)));

  const addResponsable = (actIdx: number) =>
    setActividades((prev) =>
      prev.map((a, i) =>
        i === actIdx
          ? { ...a, responsables: [...a.responsables, { nombre: "", cargo: "" }] }
          : a
      )
    );

  const removeResponsable = (actIdx: number, respIdx: number) =>
    setActividades((prev) =>
      prev.map((a, i) =>
        i === actIdx
          ? { ...a, responsables: a.responsables.filter((_, j) => j !== respIdx) }
          : a
      )
    );

  const updateResponsable = (
    actIdx: number,
    respIdx: number,
    key: "nombre" | "cargo",
    val: string
  ) =>
    setActividades((prev) =>
      prev.map((a, i) =>
        i === actIdx
          ? {
              ...a,
              responsables: a.responsables.map((r, j) =>
                j === respIdx ? { ...r, [key]: val } : r
              ),
            }
          : a
      )
    );

  const addActividad = () => {
    if (actividades.length < 20) setActividades((prev) => [...prev, newActividad()]);
  };

  const removeActividad = (i: number) => {
    if (actividades.length > 1) setActividades((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ── Submit ──
  type ModalState = "idle" | "loading" | "success" | "error";
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [savedConsecutivo, setSavedConsecutivo] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setInfo({ fechaDocumentacion: today, proposito: "", descripcionCambio: "", cambioPlaneado: "", tipoCambio: "", consecuencias: "" });
    setActividades([newActividad()]);
    fetch("/api/gds/next-consecutive")
      .then((r) => r.json())
      .then((d) => setConsecutivo(d.nextConsecutivo ?? "001"))
      .catch(() => {});
  };

  const handleSubmit = async () => {
    setModalState("loading");
    setSubmitError(null);
    try {
      const res = await fetch("/api/gds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consecutivo,
          fechaDocumentacion: info.fechaDocumentacion,
          proposito: info.proposito || null,
          descripcionCambio: info.descripcionCambio || null,
          cambioPlaneado: info.cambioPlaneado || null,
          tipoCambio: info.tipoCambio || null,
          consecuencias: info.consecuencias || null,
          actividades: actividades.map((a) => {
            const filled = a.responsables.filter((r) => r.nombre.trim() || r.cargo.trim());
            return {
              ...a,
              responsables: filled.length > 0 ? JSON.stringify(filled) : null,
              recursos: a.recursos.length > 0 ? a.recursos.join(", ") : null,
            };
          }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      setSavedConsecutivo(json.consecutivo ?? consecutivo);
      setModalState("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error inesperado");
      setModalState("error");
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Formulario GDC"
        subtitle={
          consecutivo
            ? `Consecutivo: #${consecutivo} — Gestión del cambio`
            : "Gestión del cambio — documentación y seguimiento"
        }
      />

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {/* ── Sección 1: Información General ─────────────────────────────── */}
        <SectionCard number="1" title="Información General">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

            {/* Fecha de documentación */}
            <div>
              <label className={labelCls}>Fecha de documentación del cambio</label>
              <input
                type="date"
                className={inputCls}
                value={info.fechaDocumentacion}
                onChange={(e) => setInfoField("fechaDocumentacion", e.target.value)}
              />
            </div>

            {/* ¿Es un cambio planeado? */}
            <div>
              <label className={labelCls}>¿Es un cambio planeado?</label>
              <select
                className={inputCls}
                value={info.cambioPlaneado}
                onChange={(e) => setInfoField("cambioPlaneado", e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* ¿Qué tipo de cambio es? */}
            <div>
              <label className={labelCls}>¿Qué tipo de cambio es?</label>
              <select
                className={inputCls}
                value={info.tipoCambio}
                onChange={(e) => setInfoField("tipoCambio", e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Interno">Interno</option>
                <option value="Externo">Externo</option>
              </select>
            </div>

            {/* ¿Por qué se da el cambio? */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>¿Por qué se da el cambio? ¿Cuál es el propósito?</label>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Describe el motivo y propósito del cambio..."
                value={info.proposito}
                onChange={(e) => setInfoField("proposito", e.target.value)}
              />
            </div>

            {/* Descripción del cambio */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>Descripción del cambio</label>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Describe en detalle el cambio que se va a realizar o se realizó..."
                value={info.descripcionCambio}
                onChange={(e) => setInfoField("descripcionCambio", e.target.value)}
              />
            </div>

            {/* Consecuencias */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>¿Qué consecuencias trae este cambio?</label>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Describe las consecuencias esperadas o identificadas de este cambio..."
                value={info.consecuencias}
                onChange={(e) => setInfoField("consecuencias", e.target.value)}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Sección 2: Plan de Acción + Seguimiento ────────────────────── */}
        <SectionCard
          number="2"
          title="Plan de Acción"
          subtitle="Actividades para gestionar el cambio y su seguimiento"
        >
          {/* Nota de matrices */}
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Nota sobre actualización de matrices:</p>
            <p>• Riesgos asociados a SST → actualizar la <strong>matriz de identificación de peligros</strong>.</p>
            <p>• Riesgos asociados a la prestación del servicio → actualizar la <strong>matriz de riesgos de S&amp;P</strong>.</p>
          </div>

          {/* Leyenda de niveles de impacto */}
          <div className="mb-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Definición de niveles de evaluación del impacto</p>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Alto</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Inmediata.</strong> No existe ningún tipo de control implementado. La acción de control está determinada entre <strong>15 a 30 días</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Medio</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A pesar de contar con uno o varios controles, no se consideran suficientes para asegurar que las actividades sean resistentes al cambio. La acción de control está determinada entre <strong>un mes a seis meses</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Bajo</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Los controles son suficientes para soportar el cambio que se presente. Las acciones de control están determinadas para verificación <strong>al menos una vez al año</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {actividades.map((act, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden"
              >
                {/* Activity header row */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-100 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Actividad {i + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeActividad(i)}
                    disabled={actividades.length === 1}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Eliminar actividad"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-4 py-4 space-y-4">
                  {/* Plan fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className={labelCls}>Actividad</label>
                      <textarea
                        rows={2}
                        className={inputCls}
                        placeholder="Describe la actividad..."
                        value={act.actividad}
                        onChange={(e) => updateActividad(i, "actividad", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Fecha</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={act.fecha}
                        onChange={(e) => updateActividad(i, "fecha", e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-2 mb-2">
                        <label className={labelCls + " mb-0"}>Recursos Necesarios</label>
                        <span className="text-[10px] text-slate-400 italic">haz clic para seleccionar</span>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {([
                          { op: "Tecnológicos", icon: "💻" },
                          { op: "Financieros",  icon: "💰" },
                          { op: "Humanos",      icon: "👥" },
                        ] as const).map(({ op, icon }) => {
                          const checked = act.recursos.includes(op);
                          return (
                            <label
                              key={op}
                              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                                checked
                                  ? "border-[#105789] bg-[#105789]/5 text-[#105789]"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...act.recursos, op]
                                    : act.recursos.filter((r) => r !== op);
                                  setActividades((prev) =>
                                    prev.map((a, idx) => idx === i ? { ...a, recursos: next } : a)
                                  );
                                }}
                                className="sr-only"
                              />
                              <span className="text-lg leading-none">{icon}</span>
                              <span className="text-sm font-semibold">{op}</span>
                              {checked && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Evaluación del Impacto</label>
                      <select
                        className={inputCls}
                        value={act.impacto}
                        onChange={(e) => updateActividad(i, "impacto", e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Alto">Alto</option>
                        <option value="Medio">Medio</option>
                        <option value="Bajo">Bajo</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className={labelCls}>Responsables</label>
                        <button
                          type="button"
                          onClick={() => addResponsable(i)}
                          disabled={act.responsables.length >= 5}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          + Agregar responsable
                        </button>
                      </div>
                      <div className="space-y-2">
                        {act.responsables.map((r, ri) => (
                          <div key={ri} className="flex gap-2 items-end">
                            <div className="flex-1">
                              {ri === 0 && (
                                <p className="text-[10px] font-medium text-slate-400 mb-1">Nombre</p>
                              )}
                              <input
                                type="text"
                                className={inputCls}
                                placeholder="Nombre del responsable..."
                                value={r.nombre}
                                onChange={(e) => updateResponsable(i, ri, "nombre", e.target.value)}
                              />
                            </div>
                            <div className="flex-1">
                                  {ri === 0 && (
                                    <p className="text-[10px] font-medium text-slate-400 mb-1">Cargo / Rol</p>
                                  )}
                                  <select
                                    className={inputCls}
                                    value={r.cargo}
                                    onChange={(e) => updateResponsable(i, ri, "cargo", e.target.value)}
                                  >
                                    <option value="">Seleccionar cargo...</option>
                                    {CARGOS_NEW_SCALE.map((c) => (
                                      <option key={c.cargo} value={c.cargo}>{c.cargo}</option>
                                    ))}
                                  </select>
                                </div>
                            <button
                              type="button"
                              onClick={() => removeResponsable(i, ri)}
                              disabled={act.responsables.length === 1}
                              className="mb-0.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition shrink-0 disabled:opacity-0 disabled:cursor-default"
                              aria-label="Eliminar responsable"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Seguimiento sub-section */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Seguimiento al Plan de Acción</p>
                    </div>
                    <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>Fecha de seguimiento</label>
                        <input
                          type="date"
                          className={inputCls}
                          value={act.seguFecha}
                          onChange={(e) => updateActividad(i, "seguFecha", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Responsable</label>
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="Nombre..."
                          value={act.seguResponsable}
                          onChange={(e) => updateActividad(i, "seguResponsable", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Evidencia</label>
                        <EvidenciaUpload
                          value={act.seguEvidencia}
                          onChange={(url) => updateActividad(i, "seguEvidencia", url)}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>¿Se identifican o modifican riesgos operacionales y/o de SST?</label>
                        <select
                          className={inputCls}
                          value={act.seguTieneRiesgos}
                          onChange={(e) => updateActividad(i, "seguTieneRiesgos", e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Sí">Sí</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>¿Cuáles?</label>
                        <textarea
                          rows={2}
                          className={inputCls}
                          placeholder="Describa los riesgos identificados o modificados..."
                          value={act.seguCuales}
                          onChange={(e) => updateActividad(i, "seguCuales", e.target.value)}
                          disabled={act.seguTieneRiesgos === "No"}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>N.º Acción de mejora</label>
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="Ej. ACR-001"
                          value={act.seguNroAccionMejora}
                          onChange={(e) => updateActividad(i, "seguNroAccionMejora", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add activity */}
            <button
              type="button"
              onClick={addActividad}
              disabled={actividades.length >= 20}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-base leading-none">+</span>
              Agregar actividad
            </button>
          </div>
        </SectionCard>

        {/* ── Submit ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <p className="text-xs text-slate-500">
            Los campos no son obligatorios durante esta fase inicial del módulo GDC.
          </p>
          <button
            type="button"
            disabled={modalState === "loading"}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSubmit}
          >
            {modalState === "loading" ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {modalState === "loading" ? "Guardando…" : "Guardar registro GDC"}
          </button>
        </div>
      </main>

      {/* ── Success Modal ───────────────────────────────────────────────────── */}
      {modalState === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">¡Registro guardado!</h2>
            <p className="text-sm text-slate-600 text-center">
              El registro GDC con consecutivo{" "}
              <span className="font-mono font-semibold text-blue-700">#{savedConsecutivo}</span> fue guardado exitosamente.
            </p>
            <div className="flex gap-3 mt-2 w-full">
              <button
                onClick={() => { setModalState("idle"); resetForm(); }}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Crear otro GDC
              </button>
              <button
                onClick={() => { setModalState("idle"); resetForm(); }}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Modal ─────────────────────────────────────────────────────── */}
      {modalState === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Error al guardar</h2>
            <p className="text-sm text-slate-600 text-center">{submitError ?? "Ocurrió un error inesperado."}</p>
            <button
              onClick={() => setModalState("idle")}
              className="w-full px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

