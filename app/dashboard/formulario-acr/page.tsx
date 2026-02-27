"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";

// ─── Salary Table ───────────────────────────────────────────────────────────────
const CARGOS: { cargo: string; salario: number }[] = [
  { cargo: "Director General", salario: 19217000 },
  { cargo: "Director de operaciones", salario: 19217000 },
  { cargo: "Gerente de Nomina y ADP", salario: 8000000 },
  { cargo: "Gerente Comercial", salario: 8000000 },
  { cargo: "Lider de Administración de personal", salario: 6158000 },
  { cargo: "Lider de Gestión Humana", salario: 6158000 },
  { cargo: "Lider de Employer of Record Colombia", salario: 6158000 },
  { cargo: "Lider Outsourcing de Tesoreria", salario: 6158000 },
  { cargo: "Profesional SGI", salario: 5119000 },
  { cargo: "Profesional de Nomina", salario: 5119000 },
  { cargo: "Profesional Back office Sucursales", salario: 5119000 },
  { cargo: "Analista Administrativo y financiero", salario: 4183000 },
  { cargo: "Analista de Nómina", salario: 4183000 },
  { cargo: "Analista Administración de personal", salario: 4183000 },
  { cargo: "Analista de EoR", salario: 4183000 },
  { cargo: "Tecnico de Automatización", salario: 4183000 },
  { cargo: "Asistente Administrativo y Financiero", salario: 3335000 },
  { cargo: "Asistente Comercial", salario: 3335000 },
  { cargo: "Asistente de Comunicación y Marketing", salario: 3335000 },
  { cargo: "Asistente de Nómina", salario: 3335000 },
  { cargo: "Asistente Administración de Personal", salario: 3335000 },
  { cargo: "Asistente de EoR", salario: 3335000 },
  { cargo: "Asistente de tesorería", salario: 3335000 },
  { cargo: "Auxiliar de nomina", salario: 2627000 },
];

const calcCosto = (cargo: string, horas: number): number => {
  const found = CARGOS.find((c) => c.cargo === cargo);
  if (!found || !horas) return 0;
  return Math.round((found.salario / 180) * horas);
};

const fmtCurrency = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// ─── Option Lists ───────────────────────────────────────────────────────────────
const FUENTES = [
  "Auditoría interna",
  "Auditoría externa",
  "Queja del cliente",
  "Revisión por la dirección",
  "Hallazgo de proceso",
  "Indicadores de gestión",
  "Salidas no conformes",
  "Análisis de datos",
  "Oportunidad de mejora",
];

const PROCESOS = [
  "Gestión de nómina",
  "Administración de personal",
  "Gestión comercial",
  "Tesorería",
  "Gestión Humana",
  "Employer of Record (EoR)",
  "Back office sucursales",
  "Tecnología y automatización",
  "Comunicación y marketing",
  "Administración y finanzas",
  "Dirección general",
];

const TRATAMIENTOS = [
  "Reproceso",
  "Reclasificación",
  "Corrección",
  "Devolución al proveedor",
  "Rechazo / Descarte",
];

const EVALUACION_RIESGO = ["Bajo", "Medio", "Alto", "Crítico"];

const ESTADOS_ACTIVIDAD = ["Abierta", "Cerrada", "Parcial"];

// ─── Types ──────────────────────────────────────────────────────────────────────
interface ResponsableCorreccion {
  nombre: string;
  cargo: string;
  horas: number | "";
  fechaInicio: string;
  fechaFin: string;
}

interface ActividadCorreccion {
  actividad: string;
  recursosFinancieros: string;
  recursosTecnologicos: string;
  recursosHumanos: string;
  responsables: ResponsableCorreccion[];
}

interface ResponsablePlan {
  nombreEjecucion: string;
  cargoEjecucion: string;
  horasEjecucion: number | "";
  fechaInicioEjecucion: string;
  fechaFinEjecucion: string;
  nombreSeguimiento: string;
  cargoSeguimiento: string;
  fechaSeguimiento: string;
  estadoSeguimiento: string;
  horasSeguimiento: number | "";
  evidencia: string;
}

interface ActividadPlan {
  descripcion: string;
  causasAsociadas: string[];
  responsables: ResponsablePlan[];
}

// ─── Default Factories ──────────────────────────────────────────────────────────
const newResponsableCorreccion = (): ResponsableCorreccion => ({
  nombre: "",
  cargo: "",
  horas: "",
  fechaInicio: "",
  fechaFin: "",
});

const newActividadCorreccion = (): ActividadCorreccion => ({
  actividad: "",
  recursosFinancieros: "",
  recursosTecnologicos: "",
  recursosHumanos: "",
  responsables: [newResponsableCorreccion()],
});

const newResponsablePlan = (): ResponsablePlan => ({
  nombreEjecucion: "",
  cargoEjecucion: "",
  horasEjecucion: "",
  fechaInicioEjecucion: "",
  fechaFinEjecucion: "",
  nombreSeguimiento: "",
  cargoSeguimiento: "",
  fechaSeguimiento: "",
  estadoSeguimiento: "",
  horasSeguimiento: "",
  evidencia: "",
});

const newActividadPlan = (): ActividadPlan => ({
  descripcion: "",
  causasAsociadas: [],
  responsables: [newResponsablePlan()],
});

// ─── Shared Style Constants ─────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";
const readonlyCls =
  "w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-sm font-medium select-none";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

// ─── Sub-components ─────────────────────────────────────────────────────────────
function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

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
      <div className="bg-slate-50 border-b border-slate-200 px-7 py-4">
        <SectionHeader number={number} title={title} subtitle={subtitle} />
      </div>
      <div className="px-7 py-6">{children}</div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function FormularioAcrPage() {
  const today = new Date().toISOString().split("T")[0];
  const consecutivo = `ACR-${Date.now().toString().slice(-6)}`;

  // ── Section 1 ──
  const [info, setInfo] = useState({
    consecutivo,
    fuente: "",
    proceso: "",
    cliente: "",
    fechaIncidente: "",
    fechaRegistro: today,
    tipoAccion: "",
    tratamiento: "",
    evaluacionRiesgo: "",
    descripcion: "",
  });

  const setInfoField = (key: string, value: string) =>
    setInfo((p) => ({ ...p, [key]: value }));

  // ── Section 2 ──
  const [correccionActs, setCorreccionActs] = useState<ActividadCorreccion[]>([
    newActividadCorreccion(),
    newActividadCorreccion(),
    newActividadCorreccion(),
  ]);

  // ── Section 3 ──
  const [causasAnalisis, setCausasAnalisis] = useState("");
  const [causasInmediatas, setCausasInmediatas] = useState<string[]>(["", ""]);
  const [causasRaiz, setCausasRaiz] = useState<string[]>(["", ""]);

  // ── Section 4 ──
  const [planActs, setPlanActs] = useState<ActividadPlan[]>([
    newActividadPlan(),
  ]);

  // ── Section 5 ──
  const [costos, setCostos] = useState({
    perdidaIngresos: "",
    multasSanciones: "",
    otrosCostosInternos: "",
    descuentosCliente: "",
    otrosCostos: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Calculated totals ──
  const totalCorreccion = useMemo(
    () =>
      correccionActs.reduce(
        (sum, act) =>
          sum +
          act.responsables.reduce(
            (s, r) => s + calcCosto(r.cargo, Number(r.horas) || 0),
            0
          ),
        0
      ),
    [correccionActs]
  );

  const totalPlanEjecucion = useMemo(
    () =>
      planActs.reduce(
        (sum, act) =>
          sum +
          act.responsables.reduce(
            (s, r) =>
              s + calcCosto(r.cargoEjecucion, Number(r.horasEjecucion) || 0),
            0
          ),
        0
      ),
    [planActs]
  );

  const totalPlanSeguimiento = useMemo(
    () =>
      planActs.reduce(
        (sum, act) =>
          sum +
          act.responsables.reduce(
            (s, r) =>
              s +
              calcCosto(r.cargoSeguimiento, Number(r.horasSeguimiento) || 0),
            0
          ),
        0
      ),
    [planActs]
  );

  // ── Section 2 Handlers ──
  const updateActCorr = (
    i: number,
    key: keyof ActividadCorreccion,
    val: string
  ) =>
    setCorreccionActs((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [key]: val } : a))
    );

  const updateRespCorr = (
    aIdx: number,
    rIdx: number,
    key: keyof ResponsableCorreccion,
    val: string | number | ""
  ) =>
    setCorreccionActs((prev) =>
      prev.map((a, i) =>
        i === aIdx
          ? {
              ...a,
              responsables: a.responsables.map((r, j) =>
                j === rIdx ? { ...r, [key]: val } : r
              ),
            }
          : a
      )
    );

  const addRespCorr = (aIdx: number) =>
    setCorreccionActs((prev) =>
      prev.map((a, i) =>
        i === aIdx
          ? { ...a, responsables: [...a.responsables, newResponsableCorreccion()] }
          : a
      )
    );

  const removeRespCorr = (aIdx: number, rIdx: number) =>
    setCorreccionActs((prev) =>
      prev.map((a, i) =>
        i === aIdx && a.responsables.length > 1
          ? {
              ...a,
              responsables: a.responsables.filter((_, j) => j !== rIdx),
            }
          : a
      )
    );

  const addActCorr = () => {
    if (correccionActs.length < 15)
      setCorreccionActs((prev) => [...prev, newActividadCorreccion()]);
  };

  const removeActCorr = () => {
    if (correccionActs.length > 1)
      setCorreccionActs((prev) => prev.slice(0, -1));
  };

  // ── Section 4 Handlers ──
  const updateActPlan = (
    i: number,
    key: keyof ActividadPlan,
    val: unknown
  ) =>
    setPlanActs((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [key]: val } : a))
    );

  const updateRespPlan = (
    aIdx: number,
    rIdx: number,
    key: keyof ResponsablePlan,
    val: string | number | ""
  ) =>
    setPlanActs((prev) =>
      prev.map((a, i) =>
        i === aIdx
          ? {
              ...a,
              responsables: a.responsables.map((r, j) =>
                j === rIdx ? { ...r, [key]: val } : r
              ),
            }
          : a
      )
    );

  const addRespPlan = (aIdx: number) =>
    setPlanActs((prev) =>
      prev.map((a, i) =>
        i === aIdx
          ? { ...a, responsables: [...a.responsables, newResponsablePlan()] }
          : a
      )
    );

  const removeRespPlan = (aIdx: number, rIdx: number) =>
    setPlanActs((prev) =>
      prev.map((a, i) =>
        i === aIdx && a.responsables.length > 1
          ? { ...a, responsables: a.responsables.filter((_, j) => j !== rIdx) }
          : a
      )
    );

  const addActPlan = () =>
    setPlanActs((prev) => [...prev, newActividadPlan()]);

  const removeActPlan = (i: number) => {
    if (planActs.length > 1)
      setPlanActs((prev) => prev.filter((_, idx) => idx !== i));
  };

  const toggleCausa = (aIdx: number, causa: string) =>
    setPlanActs((prev) =>
      prev.map((a, i) => {
        if (i !== aIdx) return a;
        const has = a.causasAsociadas.includes(causa);
        return {
          ...a,
          causasAsociadas: has
            ? a.causasAsociadas.filter((c) => c !== causa)
            : [...a.causasAsociadas, causa],
        };
      })
    );

  const allCausas = useMemo(() => {
    const result: { label: string; value: string }[] = [];
    causasInmediatas.forEach((c, i) => {
      if (c.trim()) result.push({ label: `CI${i + 1}: ${c}`, value: `ci-${i}` });
    });
    causasRaiz.forEach((c, i) => {
      if (c.trim()) result.push({ label: `CR${i + 1}: ${c}`, value: `cr-${i}` });
    });
    return result;
  }, [causasInmediatas, causasRaiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsSubmitting(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Formulario ACR"
        subtitle="Registra una nueva Acción Correctiva o de Mejora"
      />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Success banner */}
          {submitted && (
            <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-5 py-3.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium">
                ACR registrada correctamente.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="ml-auto text-emerald-500 hover:text-emerald-700"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ══════════════════════════════════════════════
                SECCIÓN 1 — INFORMACIÓN GENERAL
            ══════════════════════════════════════════════ */}
            <SectionCard number="1" title="Información General">
              <div className="space-y-5">
                {/* 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  {/* Columna 1 */}
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Consecutivo</label>
                      <input className={readonlyCls} value={info.consecutivo} readOnly />
                    </div>
                    <div>
                      <label className={labelCls}>Fuente en la que se origina *</label>
                      <select
                        className={inputCls}
                        value={info.fuente}
                        onChange={(e) => setInfoField("fuente", e.target.value)}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {FUENTES.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Proceso *</label>
                      <select
                        className={inputCls}
                        value={info.proceso}
                        onChange={(e) => setInfoField("proceso", e.target.value)}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {PROCESOS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Columna 2 */}
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Cliente</label>
                      <input
                        className={inputCls}
                        type="text"
                        placeholder="Nombre del cliente"
                        value={info.cliente}
                        onChange={(e) => setInfoField("cliente", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Fecha del incidente *</label>
                      <input
                        className={inputCls}
                        type="date"
                        value={info.fechaIncidente}
                        onChange={(e) => setInfoField("fechaIncidente", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Fecha de registro</label>
                      <input className={readonlyCls} type="date" value={info.fechaRegistro} readOnly />
                    </div>
                  </div>

                  {/* Columna 3 */}
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Tipo de acción *</label>
                      <select
                        className={inputCls}
                        value={info.tipoAccion}
                        onChange={(e) => {
                          setInfoField("tipoAccion", e.target.value);
                          setInfoField("tratamiento", "");
                        }}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option>Correctiva</option>
                        <option>De mejora</option>
                      </select>
                    </div>
                    {info.fuente === "Salidas no conformes" && (
                      <div>
                        <label className={labelCls}>Tratamiento *</label>
                        <select
                          className={inputCls}
                          value={info.tratamiento}
                          onChange={(e) => setInfoField("tratamiento", e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          {TRATAMIENTOS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Evaluación del riesgo *</label>
                      <select
                        className={inputCls}
                        value={info.evaluacionRiesgo}
                        onChange={(e) => setInfoField("evaluacionRiesgo", e.target.value)}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {EVALUACION_RIESGO.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Descripción — ancho completo */}
                <div>
                  <label className={labelCls}>
                    Descripción de la situación *{" "}
                    <span className="font-normal text-slate-400">
                      (qué, cuándo, dónde, incumplimiento)
                    </span>
                  </label>
                  <textarea
                    className={inputCls + " resize-none"}
                    rows={4}
                    placeholder="Describe qué ocurrió, cuándo, dónde y el incumplimiento identificado..."
                    value={info.descripcion}
                    onChange={(e) => setInfoField("descripcion", e.target.value)}
                    required
                  />
                </div>
              </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════
                SECCIÓN 2 — CORRECCIÓN
            ══════════════════════════════════════════════ */}
            <SectionCard
              number="2"
              title="Corrección"
              subtitle={`${correccionActs.length} / 15 actividades`}
            >
              <div className="space-y-6">
                {correccionActs.map((act, aIdx) => (
                  <div
                    key={aIdx}
                    className="border border-slate-200 rounded-xl p-5 space-y-4"
                  >
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Actividad {aIdx + 1}
                    </p>

                    {/* Actividad + Recursos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}>Descripción de la actividad</label>
                        <textarea
                          className={inputCls + " resize-none"}
                          rows={3}
                          placeholder="Describe la actividad de corrección..."
                          value={act.actividad}
                          onChange={(e) =>
                            updateActCorr(aIdx, "actividad", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>Recursos</label>
                        <input
                          className={inputCls}
                          type="text"
                          placeholder="💰 Financieros"
                          value={act.recursosFinancieros}
                          onChange={(e) =>
                            updateActCorr(aIdx, "recursosFinancieros", e.target.value)
                          }
                        />
                        <input
                          className={inputCls}
                          type="text"
                          placeholder="💻 Tecnológicos"
                          value={act.recursosTecnologicos}
                          onChange={(e) =>
                            updateActCorr(aIdx, "recursosTecnologicos", e.target.value)
                          }
                        />
                        <input
                          className={inputCls}
                          type="text"
                          placeholder="👥 Humanos"
                          value={act.recursosHumanos}
                          onChange={(e) =>
                            updateActCorr(aIdx, "recursosHumanos", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Responsables */}
                    <div className="space-y-3">
                      {act.responsables.map((resp, rIdx) => {
                        const costo = calcCosto(
                          resp.cargo,
                          Number(resp.horas) || 0
                        );
                        return (
                          <div
                            key={rIdx}
                            className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100"
                          >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Responsable {rIdx + 1}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                              <div className="col-span-2">
                                <label className={labelCls}>Nombre</label>
                                <input
                                  className={inputCls}
                                  type="text"
                                  placeholder="Nombre completo"
                                  value={resp.nombre}
                                  onChange={(e) =>
                                    updateRespCorr(aIdx, rIdx, "nombre", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <label className={labelCls}>Cargo</label>
                                <select
                                  className={inputCls}
                                  value={resp.cargo}
                                  onChange={(e) =>
                                    updateRespCorr(aIdx, rIdx, "cargo", e.target.value)
                                  }
                                >
                                  <option value="">Seleccionar...</option>
                                  {CARGOS.map((c) => (
                                    <option key={c.cargo} value={c.cargo}>
                                      {c.cargo}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Tiempo (h)</label>
                                <input
                                  className={inputCls}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={resp.horas}
                                  onChange={(e) =>
                                    updateRespCorr(
                                      aIdx,
                                      rIdx,
                                      "horas",
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Fecha Inicio</label>
                                <input
                                  className={inputCls}
                                  type="date"
                                  value={resp.fechaInicio}
                                  onChange={(e) =>
                                    updateRespCorr(aIdx, rIdx, "fechaInicio", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Fecha Fin</label>
                                <input
                                  className={inputCls}
                                  type="date"
                                  value={resp.fechaFin}
                                  onChange={(e) =>
                                    updateRespCorr(aIdx, rIdx, "fechaFin", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <div>
                                <p className="text-xs text-slate-400 mb-0.5">Costo calculado</p>
                                <p className="text-sm font-semibold text-emerald-600">
                                  {costo > 0 ? fmtCurrency(costo) : "—"}
                                </p>
                              </div>
                              {act.responsables.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRespCorr(aIdx, rIdx)}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                  − Quitar responsable
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addRespCorr(aIdx)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        + Agregar responsable
                      </button>
                    </div>
                  </div>
                ))}

                {/* Controles de actividad */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={addActCorr}
                    disabled={correccionActs.length >= 15}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition disabled:opacity-40"
                  >
                    + Agregar actividad
                  </button>
                  {correccionActs.length > 1 && (
                    <button
                      type="button"
                      onClick={removeActCorr}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition"
                    >
                      − Quitar última
                    </button>
                  )}
                  <span className="ml-auto text-sm text-slate-600">
                    Total corrección:{" "}
                    <span className="font-semibold text-emerald-600">
                      {fmtCurrency(totalCorreccion)}
                    </span>
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════
                SECCIÓN 3 — CAUSAS PRINCIPALES
            ══════════════════════════════════════════════ */}
            <SectionCard number="3" title="Identificación de Causas Principales">
              <div className="space-y-5">
                {/* Análisis de causa */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>Análisis de causa</label>
                    <button
                      type="button"
                      className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1 border border-purple-200 rounded px-2 py-0.5 transition hover:bg-purple-50"
                    >
                      <span>🤖</span> Generar con IA
                    </button>
                  </div>
                  <textarea
                    className={inputCls + " resize-none"}
                    rows={5}
                    placeholder="Describe el análisis de causa raíz (5 Porqués, Ishikawa, etc.)..."
                    value={causasAnalisis}
                    onChange={(e) => setCausasAnalisis(e.target.value)}
                  />
                </div>

                {/* Causas Inmediatas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>
                      Causas Inmediatas{" "}
                      <span className="font-normal text-slate-400">(máx. 5)</span>
                    </label>
                    <div className="flex gap-3">
                      {causasInmediatas.length < 5 && (
                        <button
                          type="button"
                          onClick={() => setCausasInmediatas((p) => [...p, ""])}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          + Agregar
                        </button>
                      )}
                      {causasInmediatas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCausasInmediatas((p) => p.slice(0, -1))}
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          − Quitar
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: "0.75rem",
                      gridTemplateColumns: `repeat(${Math.min(causasInmediatas.length, 3)}, minmax(0, 1fr))`,
                    }}
                  >
                    {causasInmediatas.map((c, i) => (
                      <div key={i}>
                        <label className={labelCls}>CI {i + 1}</label>
                        <textarea
                          className={inputCls + " resize-none"}
                          rows={3}
                          placeholder={`Causa inmediata ${i + 1}...`}
                          value={c}
                          onChange={(e) =>
                            setCausasInmediatas((p) =>
                              p.map((v, j) => (j === i ? e.target.value : v))
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Causas Raíz */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>
                      Causas Raíz{" "}
                      <span className="font-normal text-slate-400">(máx. 5)</span>
                    </label>
                    <div className="flex gap-3">
                      {causasRaiz.length < 5 && (
                        <button
                          type="button"
                          onClick={() => setCausasRaiz((p) => [...p, ""])}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          + Agregar
                        </button>
                      )}
                      {causasRaiz.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCausasRaiz((p) => p.slice(0, -1))}
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          − Quitar
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: "0.75rem",
                      gridTemplateColumns: `repeat(${Math.min(causasRaiz.length, 3)}, minmax(0, 1fr))`,
                    }}
                  >
                    {causasRaiz.map((c, i) => (
                      <div key={i}>
                        <label className={labelCls}>CR {i + 1}</label>
                        <textarea
                          className={inputCls + " resize-none"}
                          rows={3}
                          placeholder={`Causa raíz ${i + 1}...`}
                          value={c}
                          onChange={(e) =>
                            setCausasRaiz((p) =>
                              p.map((v, j) => (j === i ? e.target.value : v))
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════
                SECCIÓN 4 — PLAN DE ACCIÓN
            ══════════════════════════════════════════════ */}
            <SectionCard
              number="4"
              title="Plan de Acción"
              subtitle={`${planActs.length} actividad(es)`}
            >
              <div className="space-y-6">
                {planActs.map((act, aIdx) => (
                  <div
                    key={aIdx}
                    className="border border-slate-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Actividad {aIdx + 1}
                      </p>
                      {planActs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeActPlan(aIdx)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          − Eliminar actividad
                        </button>
                      )}
                    </div>

                    {/* Descripción + Causas asociadas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}>Descripción de la actividad</label>
                        <textarea
                          className={inputCls + " resize-none"}
                          rows={3}
                          placeholder="Describe la actividad del plan de acción..."
                          value={act.descripcion}
                          onChange={(e) =>
                            updateActPlan(aIdx, "descripcion", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Causas asociadas</label>
                        {allCausas.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Define causas en la sección 3 para asociarlas aquí.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                            {allCausas.map((causa) => (
                              <label
                                key={causa.value}
                                className="flex items-start gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={act.causasAsociadas.includes(causa.value)}
                                  onChange={() => toggleCausa(aIdx, causa.value)}
                                  className="mt-0.5 accent-blue-600"
                                />
                                <span className="text-xs text-slate-700">
                                  {causa.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Responsables del plan */}
                    {act.responsables.map((resp, rIdx) => {
                      const costoEjec = calcCosto(
                        resp.cargoEjecucion,
                        Number(resp.horasEjecucion) || 0
                      );
                      const costoSeg = calcCosto(
                        resp.cargoSeguimiento,
                        Number(resp.horasSeguimiento) || 0
                      );
                      return (
                        <div
                          key={rIdx}
                          className="border border-slate-100 rounded-xl p-4 space-y-4 bg-slate-50/60"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Responsable {rIdx + 1}
                            </p>
                            {act.responsables.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRespPlan(aIdx, rIdx)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                              >
                                − Quitar
                              </button>
                            )}
                          </div>

                          {/* Fila Ejecución */}
                          <div>
                            <p className="text-xs font-semibold text-blue-500 mb-2 flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Ejecución
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                              <div className="col-span-2">
                                <label className={labelCls}>Nombre</label>
                                <input
                                  className={inputCls}
                                  type="text"
                                  placeholder="Resp. ejecución"
                                  value={resp.nombreEjecucion}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "nombreEjecucion", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <label className={labelCls}>Cargo</label>
                                <select
                                  className={inputCls}
                                  value={resp.cargoEjecucion}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "cargoEjecucion", e.target.value)
                                  }
                                >
                                  <option value="">Seleccionar...</option>
                                  {CARGOS.map((c) => (
                                    <option key={c.cargo} value={c.cargo}>{c.cargo}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Horas</label>
                                <input
                                  className={inputCls}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={resp.horasEjecucion}
                                  onChange={(e) =>
                                    updateRespPlan(
                                      aIdx, rIdx, "horasEjecucion",
                                      e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>F. Inicio</label>
                                <input
                                  className={inputCls}
                                  type="date"
                                  value={resp.fechaInicioEjecucion}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "fechaInicioEjecucion", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>F. Fin</label>
                                <input
                                  className={inputCls}
                                  type="date"
                                  value={resp.fechaFinEjecucion}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "fechaFinEjecucion", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              Costo:{" "}
                              <span className="font-semibold text-emerald-600">
                                {costoEjec > 0 ? fmtCurrency(costoEjec) : "—"}
                              </span>
                            </p>
                          </div>

                          {/* Fila Seguimiento */}
                          <div>
                            <p className="text-xs font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Seguimiento
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                              <div className="col-span-2">
                                <label className={labelCls}>Nombre</label>
                                <input
                                  className={inputCls}
                                  type="text"
                                  placeholder="Resp. seguimiento"
                                  value={resp.nombreSeguimiento}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "nombreSeguimiento", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <label className={labelCls}>Cargo</label>
                                <select
                                  className={inputCls}
                                  value={resp.cargoSeguimiento}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "cargoSeguimiento", e.target.value)
                                  }
                                >
                                  <option value="">Seleccionar...</option>
                                  {CARGOS.map((c) => (
                                    <option key={c.cargo} value={c.cargo}>{c.cargo}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>F. Seg.</label>
                                <input
                                  className={inputCls}
                                  type="date"
                                  value={resp.fechaSeguimiento}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "fechaSeguimiento", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Estado</label>
                                <select
                                  className={inputCls}
                                  value={resp.estadoSeguimiento}
                                  onChange={(e) =>
                                    updateRespPlan(aIdx, rIdx, "estadoSeguimiento", e.target.value)
                                  }
                                >
                                  <option value="">Seleccionar...</option>
                                  {ESTADOS_ACTIVIDAD.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Horas Seg.</label>
                                <input
                                  className={inputCls}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={resp.horasSeguimiento}
                                  onChange={(e) =>
                                    updateRespPlan(
                                      aIdx, rIdx, "horasSeguimiento",
                                      e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              Costo seg.:{" "}
                              <span className="font-semibold text-amber-600">
                                {costoSeg > 0 ? fmtCurrency(costoSeg) : "—"}
                              </span>
                            </p>
                          </div>

                          {/* Evidencia — ancho completo */}
                          <div>
                            <label className={labelCls}>Evidencia de verificación</label>
                            <input
                              className={inputCls}
                              type="text"
                              placeholder="Descripción de la evidencia..."
                              value={resp.evidencia}
                              onChange={(e) =>
                                updateRespPlan(aIdx, rIdx, "evidencia", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addRespPlan(aIdx)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      + Agregar responsable
                    </button>
                  </div>
                ))}

                {/* Controles de actividad */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={addActPlan}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition"
                  >
                    + Agregar actividad
                  </button>
                  <span className="ml-auto text-sm text-slate-600">
                    Ejecución:{" "}
                    <span className="font-semibold text-emerald-600">
                      {fmtCurrency(totalPlanEjecucion)}
                    </span>
                    &nbsp;·&nbsp; Seguimiento:{" "}
                    <span className="font-semibold text-amber-600">
                      {fmtCurrency(totalPlanSeguimiento)}
                    </span>
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════
                SECCIÓN 5 — COSTOS ASOCIADOS
            ══════════════════════════════════════════════ */}
            <SectionCard number="5" title="Costos Asociados">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1 */}
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>
                      Costos de la corrección{" "}
                      <span className="text-blue-500 font-normal">🤖 calculado</span>
                    </label>
                    <div className={readonlyCls}>{fmtCurrency(totalCorreccion)}</div>
                  </div>
                  <div>
                    <label className={labelCls}>Costo por pérdida de ingresos</label>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="$ 0"
                      value={costos.perdidaIngresos}
                      onChange={(e) =>
                        setCostos((p) => ({ ...p, perdidaIngresos: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Costos de las acciones correctivas{" "}
                      <span className="text-blue-500 font-normal">🤖 calculado</span>
                    </label>
                    <div className={readonlyCls}>{fmtCurrency(totalPlanEjecucion)}</div>
                  </div>
                  <div>
                    <label className={labelCls}>Multas / Sanciones</label>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="$ 0"
                      value={costos.multasSanciones}
                      onChange={(e) =>
                        setCostos((p) => ({ ...p, multasSanciones: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Columna 2 */}
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>
                      Costos de seguimiento{" "}
                      <span className="text-blue-500 font-normal">🤖 calculado</span>
                    </label>
                    <div className={readonlyCls}>{fmtCurrency(totalPlanSeguimiento)}</div>
                  </div>
                  <div>
                    <label className={labelCls}>Otros costos internos asociados a la NC</label>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="$ 0"
                      value={costos.otrosCostosInternos}
                      onChange={(e) =>
                        setCostos((p) => ({ ...p, otrosCostosInternos: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Descuentos realizados al cliente</label>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="$ 0"
                      value={costos.descuentosCliente}
                      onChange={(e) =>
                        setCostos((p) => ({ ...p, descuentosCliente: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Otros costos</label>
                    <input
                      className={inputCls}
                      type="text"
                      placeholder="$ 0"
                      value={costos.otrosCostos}
                      onChange={(e) =>
                        setCostos((p) => ({ ...p, otrosCostos: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ══ SUBMIT BAR ══ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-7 py-5 flex items-center justify-end gap-3 sticky bottom-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Deseas limpiar todo el formulario? Se perderán los datos ingresados.")) {
                    window.location.reload();
                  }
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Limpiar formulario
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Guardar ACR
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
