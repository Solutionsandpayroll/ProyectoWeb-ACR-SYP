"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import EvidenciaUpload from "@/components/EvidenciaUpload";
import { getCargosForFechaRegistro, getSalarioPorCargo } from "@/lib/cargo-scale";

// ─── Salary Table ───────────────────────────────────────────────────────────────
const CARGO_MANUAL = "Otro/Externo";

const calcCosto = (cargo: string, horas: number, fechaRegistro?: string): number => {
  const salario = getSalarioPorCargo(cargo, fechaRegistro ?? null);
  if (!salario || !horas) return 0;
  return Math.round((salario / 180) * horas);
};

/** For Otro/Externo uses manual hourly price; otherwise uses salary table. */
const calcCostoOE = (
  cargo: string,
  horas: number,
  precioHoraManual: number | "",
  fechaRegistro?: string,
): number => {
  if (cargo === CARGO_MANUAL) return Math.round(Number(precioHoraManual || 0) * (Number(horas) || 0));
  return calcCosto(cargo, horas, fechaRegistro);
};

const parseDecimalInput = (value: string): number | "" => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return "";
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : "";
};

const fmtCurrency = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const getConsecutivoNumber = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const match = value.match(/(\d+)(?!.*\d)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

// ─── Option Lists ───────────────────────────────────────────────────────────────
const FUENTES = [
  "Hallazgos (no conformidades u oportunidades de mejora) encontrados en las auditorías internas o externas de calidad y SST",
  "Identificación de Riesgos",
  "Revisión por la dirección",
  "Quejas presentadas por los clientes",
  "Salidas no conformes",
  "Reuniones con el cliente",
  "Revisión del proceso",
  "Evaluaciones de desempeño",
  "Resultados de los indicadores",
];

const PROCESOS = [
  "Direccionamiento Estratégico",
  "Gestión Comercial y de Mercadeo",
  "Administración de Nómina",
  "Administración de Personal",
  "Selección de Personal",
  "Gestión de Servicio al Cliente",
  "Gestión Administrativa y Financiera",
  "Gestión de Talento Humano",
  "Employer of Record",
  "Employer of Record Sucursales",
  "Gestión Integral",
  "Outsourcing de tesorería",
];

const TRATAMIENTOS = [
  "No Aplica",
  "Concesión: Autorización para utilizar o liberar una salida que No es conforme con los requisitos especificados",
  "Liberación: Autorización para proseguir con la siguiente etapa de un proceso",
  "Corrección: Acción tomada para eliminar una No Conformidad detectada",
  "Anulación: Acción tomada para declarar inválido la emisión de un documento, factura o similar",
  "Otros",
];

const EVALUACION_RIESGO = [
  "Riesgo leve - no afecto al cliente - no afecta el contrato (Es poco factible que ocurra)",
  "Riesgo Moderado - insatisfacción del cliente - no afecta el contrato",
  "Riesgo intolerable - afecto la continuidad del contrato",
  "No Aplica",
];

const ESTADOS_ACTIVIDAD = ["Abierta", "Cerrada", "Parcial"];

// ─── Types ──────────────────────────────────────────────────────────────────────
interface ResponsableCorreccion {
  nombre: string;
  cargo: string;
  horas: number | "";
  precioHoraManual: number | "";
  fechaInicio: string;
  fechaFin: string;
}

interface ActividadCorreccion {
  actividad: string;
  recursos: string[];
  responsables: ResponsableCorreccion[];
  evidencia: string;
  observaciones: string;
}

interface ResponsablePlan {
  nombreEjecucion: string;
  cargoEjecucion: string;
  horasEjecucion: number | "";
  precioHoraManualEjec: number | "";
  fechaInicioEjecucion: string;
  fechaFinEjecucion: string;
  nombreSeguimiento: string;
  cargoSeguimiento: string;
  fechaSeguimiento: string;
  estadoSeguimiento: string;
  horasSeguimiento: number | "";
  precioHoraManualSeg: number | "";
  evidencia: string;
}

interface ActividadPlan {
  descripcion: string;
  causasAsociadas: string[];
  responsables: ResponsablePlan[];
  evidencia: string;
  observaciones: string;
}

// ─── Default Factories ──────────────────────────────────────────────────────────
const newResponsableCorreccion = (): ResponsableCorreccion => ({
  nombre: "",
  cargo: "",
  horas: "",
  precioHoraManual: "",
  fechaInicio: "",
  fechaFin: "",
});

const newActividadCorreccion = (): ActividadCorreccion => ({
  actividad: "",
  recursos: [],
  responsables: [newResponsableCorreccion()],
  evidencia: "",
  observaciones: "",
});

const newResponsablePlan = (): ResponsablePlan => ({
  nombreEjecucion: "",
  cargoEjecucion: "",
  horasEjecucion: "",
  precioHoraManualEjec: "",
  fechaInicioEjecucion: "",
  fechaFinEjecucion: "",
  nombreSeguimiento: "",
  cargoSeguimiento: "",
  fechaSeguimiento: "",
  estadoSeguimiento: "",
  horasSeguimiento: "",
  precioHoraManualSeg: "",
  evidencia: "",
});

const newActividadPlan = (): ActividadPlan => ({
  descripcion: "",
  causasAsociadas: [],
  responsables: [newResponsablePlan()],
  evidencia: "",
  observaciones: "",
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
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 md:px-7 py-4">
        <SectionHeader number={number} title={title} subtitle={subtitle} />
      </div>
      <div className="px-4 sm:px-6 md:px-7 py-5 sm:py-6">{children}</div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function FormularioAcrPage() {
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear().toString();

  // ── Consecutive number - auto-calculated from database ──
  const [consecutivo, setConsecutivo] = useState("");
  const [consecutivoLoading, setConsecutivoLoading] = useState(true);

  // Load the next consecutive number on component mount
  useEffect(() => {
    const loadConsecutivo = async () => {
      try {
        const res = await fetch(`/api/acr/next-consecutive?year=${currentYear}`);
        if (res.ok) {
          const data = await res.json();
          setConsecutivo(data.nextConsecutivo);
        } else {
          // Fallback if API fails
          setConsecutivo("001");
        }
      } catch (error) {
        console.error("Error loading consecutivo:", error);
        setConsecutivo("001");
      } finally {
        setConsecutivoLoading(false);
      }
    };
    loadConsecutivo();
  }, [currentYear]);

  // Sync loaded consecutivo with info state
  useEffect(() => {
    if (consecutivo) {
      setInfo(prev => ({ ...prev, consecutivo }));
    }
  }, [consecutivo]);

  // ── Section 1 ──
  const [info, setInfo] = useState({
    consecutivo: "",
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

  const cargosDisponibles = useMemo(
    () => getCargosForFechaRegistro(info.fechaRegistro),
    [info.fechaRegistro]
  );

  const calcCostoActual = (cargo: string, horas: number, precioHoraManual?: number | "") =>
    calcCostoOE(cargo, horas, precioHoraManual ?? "", info.fechaRegistro);

  const showLegacyCausasSelector = useMemo(() => {
    const consecutiveNumber = getConsecutivoNumber(info.consecutivo);
    return consecutiveNumber !== null && consecutiveNumber <= 12;
  }, [info.consecutivo]);

  // ── Section 2 ──
  const [correccionActs, setCorreccionActs] = useState<ActividadCorreccion[]>([
    newActividadCorreccion(),
    newActividadCorreccion(),
    newActividadCorreccion(),
  ]);

  // ── Section 3 ──
  const [causasAnalisis, setCausasAnalisis] = useState("");
  const [causasInmediatas, setCausasInmediatas] = useState<string[]>(["Causa inmediata 1...", "Causa inmediata 2..."]);
  const [causasRaiz, setCausasRaiz] = useState<string[]>(["Causa raíz 1...", "Causa raíz 2..."]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [show5Porques, setShow5Porques] = useState(false);

  const handleRellenarPrueba = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const dateStr = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    };

    const NOMBRES = ["Carlos Martínez", "Laura Gómez", "Andrés Pérez", "Sandra López", "Felipe Torres", "Diana Ríos"];
    const CLIENTES = ["Distritech Colombia SAS", "Grupo Empresarial XYZ", "Inversiones Norte SAS", "Comercializadora Alianza", "Tech Solutions Ltda"];
    const DESCRIPCIONES = [
      "Se identificó un error en el proceso de liquidación de nómina que generó pagos incorrectos a 12 colaboradores del cliente, afectando la confianza en el servicio y generando reclamaciones formales.",
      "El impuesto de ICA correspondiente al segundo bimestre no fue pagado en la fecha límite debido a falta de soporte adjunto en la solicitud y ausencia de seguimiento por parte del equipo de tesorería.",
      "Durante la auditoría interna trimestral se detectaron inconsistencias en las afiliaciones a ARL de nuevos ingresos, con un retraso promedio de 15 días hábiles respecto al plazo legal.",
      "Se presentó una no conformidad en el proceso de selección de personal: tres candidatos fueron contratados sin completar el proceso de verificación de referencias y antecedentes establecido en el procedimiento.",
    ];
    const ANALISIS_EJEMPLOS = [
      "Análisis 5 Porqués:\nPor qué 1: No se realizó la verificación de soportes antes del pago → El procedimiento no establece un checklist obligatorio.\nPor qué 2: El procedimiento carece de checklist → No fue actualizado en la última revisión del SGI.\nPor qué 3: No fue actualizado → No existe responsable designado para el mantenimiento de procedimientos.\nPor qué 4: Sin responsable designado → La asignación de roles no fue formalizada en el organigrama.\nPor qué 5: Roles no formalizados → Ausencia de política de gestión por procesos con responsables claros.\n\nCausas Inmediatas:\n- Falta de verificación de soportes previo al pago.\n- Ausencia de checklist en el procedimiento.\n\nCausas Raíz:\n- No existe responsable formal del mantenimiento de procedimientos.\n- Ausencia de política de gestión por procesos.",
    ];

    const fuenteSeleccionada = pick(FUENTES);
    const procesoSeleccionado = pick(PROCESOS);
    const tipoAccion = pick(["Correctiva", "De mejora"]);
    const tratamiento = fuenteSeleccionada === "Salidas no conformes" ? pick(TRATAMIENTOS.slice(1)) : "";
    const cargoEj = pick(cargosDisponibles.map((c) => c.cargo));
    const cargoSeg = pick(cargosDisponibles.map((c) => c.cargo));
    const horasEj = randInt(4, 20);
    const horasSeg = randInt(2, 10);

    setInfo({
      consecutivo,
      fuente: fuenteSeleccionada,
      proceso: procesoSeleccionado,
      cliente: pick(CLIENTES),
      fechaIncidente: dateStr(-randInt(5, 30)),
      fechaRegistro: dateStr(0),
      tipoAccion,
      tratamiento,
      evaluacionRiesgo: pick(EVALUACION_RIESGO),
      descripcion: pick(DESCRIPCIONES),
    });

    setCorreccionActs([
      {
        actividad: "Revisión y corrección inmediata de los registros afectados.",
        recursos: ["Humanos", "Tecnol\u00f3gicos"],
        evidencia: "",
        observaciones: "",
        responsables: [{
          nombre: pick(NOMBRES),
          cargo: cargoEj,
          horas: horasEj,
          precioHoraManual: "",
          fechaInicio: dateStr(1),
          fechaFin: dateStr(5),
        }],
      },
      {
        actividad: "Comunicación formal al cliente con el informe de corrección.",
        recursos: ["Humanos"],
        evidencia: "",
        observaciones: "",
        responsables: [{
          nombre: pick(NOMBRES),
          cargo: pick(cargosDisponibles.map((c) => c.cargo)),
          horas: randInt(2, 8),
          precioHoraManual: "",
          fechaInicio: dateStr(2),
          fechaFin: dateStr(6),
        }],
      },
    ]);

    setCausasAnalisis(pick(ANALISIS_EJEMPLOS));
    setCausasInmediatas([
      "Falta de verificación de soportes antes de ejecutar el proceso.",
      "Ausencia de puntos de control en las etapas críticas del procedimiento.",
    ]);
    setCausasRaiz([
      "Inexistencia de mecanismos de trazabilidad y responsables formales.",
      "Cultura organizacional que no vincula errores procedimentales con correctivos.",
    ]);

    setPlanActs([{
      descripcion: "Actualizar y socializar el procedimiento incluyendo checklist de verificación y responsables formales por etapa.",
      causasAsociadas: ["ci-0", "ci-1", "cr-0"],
      evidencia: "",
      observaciones: "",
      responsables: [{
        nombreEjecucion: pick(NOMBRES),
        cargoEjecucion: cargoEj,
        horasEjecucion: horasEj,
        precioHoraManualEjec: "",
        fechaInicioEjecucion: dateStr(3),
        fechaFinEjecucion: dateStr(20),
        nombreSeguimiento: pick(NOMBRES),
        cargoSeguimiento: cargoSeg,
        fechaSeguimiento: dateStr(25),
        estadoSeguimiento: "Abierta",
        horasSeguimiento: horasSeg,
        precioHoraManualSeg: "",
        evidencia: "Procedimiento actualizado, acta de socialización firmada.",
      }],
    }]);

    setCostos({
      perdidaIngresos: String(randInt(500000, 5000000)),
      multasSanciones: "0",
      otrosCostosInternos: String(randInt(200000, 1000000)),
      descuentosCliente: "0",
      otrosCostos: "0",
    });
  };

  const handleGenerarIA = async () => {    const situacion = info.descripcion.trim();
    if (!situacion) {
      setAiError("Completa primero el campo 'Descripción del problema' en Sección 1 para generar el análisis.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/gemini-analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situacion }),
      });
      const data = await res.json();
      console.log("[IA] Respuesta recibida:", data);
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      if (data.finishReason && data.finishReason !== "STOP") {
        console.warn("[IA] Respuesta posiblemente truncada. finishReason:", data.finishReason);
      }
      setCausasAnalisis(data.analisis);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Error al generar el análisis.");
    } finally {
      setAiLoading(false);
    }
  };

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

  type ModalState = 'idle' | 'loading' | 'success' | 'error';
  const [modalState,       setModalState]       = useState<ModalState>('idle');
  const [savedConsecutivo, setSavedConsecutivo] = useState('');
  const [modalError,       setModalError]       = useState<string | null>(null);

  const isSubmitting = modalState === 'loading';

  // ── Reset all form fields to initial state ──
  const resetForm = () => {
    // Reload the next consecutive from API
    const loadNextConsecutivo = async () => {
      try {
        const res = await fetch(`/api/acr/next-consecutive?year=${currentYear}`);
        if (res.ok) {
          const data = await res.json();
          setConsecutivo(data.nextConsecutivo);
        }
      } catch (error) {
        console.error("Error reloading consecutivo:", error);
      }
    };
    loadNextConsecutivo();

    setInfo({
      consecutivo:      "",
      fuente:           '',
      proceso:          '',
      cliente:          '',
      fechaIncidente:   '',
      fechaRegistro:    new Date().toISOString().split('T')[0],
      tipoAccion:       '',
      tratamiento:      '',
      evaluacionRiesgo: '',
      descripcion:      '',
    });
    setCorreccionActs([newActividadCorreccion(), newActividadCorreccion(), newActividadCorreccion()]);
    setCausasAnalisis('');
    setCausasInmediatas(['', '']);
    setCausasRaiz(['', '']);
    setPlanActs([newActividadPlan()]);
    setCostos({ perdidaIngresos: '', multasSanciones: '', otrosCostosInternos: '', descuentosCliente: '', otrosCostos: '' });
  };

  // ── Calculated totals ──
  const totalCorreccion = useMemo(
    () =>
      correccionActs.reduce(
        (sum, act) =>
          sum +
          act.responsables.reduce(
            (s, r) => s + calcCostoActual(r.cargo, Number(r.horas) || 0, r.precioHoraManual),
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
              s + calcCostoActual(r.cargoEjecucion, Number(r.horasEjecucion) || 0, r.precioHoraManualEjec),
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
              calcCostoActual(r.cargoSeguimiento, Number(r.horasSeguimiento) || 0, r.precioHoraManualSeg),
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
    setModalState('loading');
    setModalError(null);

    try {
      // ── Build payload ────────────────────────────────────────────────────
      const payload = {
        // Section 1
        consecutivo:      info.consecutivo,
        fuente:           info.fuente,
        proceso:          info.proceso,
        cliente:          info.cliente || null,
        fechaApertura:    info.fechaIncidente,
        fechaRegistro:    info.fechaRegistro,
        tipoAccion:       info.tipoAccion,
        tratamiento:      info.tratamiento || null,
        evaluacionRiesgo: info.evaluacionRiesgo || null,
        descripcion:      info.descripcion || null,

        // Section 2
        actividadesCorreccion: correccionActs
          .filter((a) => a.actividad.trim())
          .map((a) => ({
            actividad:   a.actividad,
            recursos:    a.recursos,
            evidencia:   a.evidencia   || null,
            observaciones: a.observaciones || null,
            costoTotal: a.responsables.reduce(
              (s, r) => s + calcCostoActual(r.cargo, Number(r.horas) || 0, r.precioHoraManual), 0
            ),
            responsables: a.responsables.map((r) => ({
              nombre:      r.nombre      || null,
              cargo:       r.cargo       || null,
              horas:       Number(r.horas) || 0,
              fechaInicio: r.fechaInicio || null,
              fechaFin:    r.fechaFin    || null,
              costo:       calcCostoActual(r.cargo, Number(r.horas) || 0, r.precioHoraManual),
            })),
          })),

        // Section 3
        causasInmediatas: causasInmediatas.filter((c) => c.trim()),
        causasRaiz:       causasRaiz.filter((c) => c.trim()),

        // Section 4
        actividadesPlan: planActs
          .filter((a) => a.descripcion.trim())
          .map((a) => ({
            descripcion:     a.descripcion,
            causasAsociadas: a.causasAsociadas,
            evidencia:       a.evidencia   || null,
            observaciones:   a.observaciones || null,
            costoTotal: a.responsables.reduce(
              (s, r) =>
                s +
                calcCostoActual(r.cargoEjecucion,    Number(r.horasEjecucion)    || 0, r.precioHoraManualEjec) +
                calcCostoActual(r.cargoSeguimiento,  Number(r.horasSeguimiento)  || 0, r.precioHoraManualSeg),
              0
            ),
            responsables: a.responsables.map((r) => ({
              nombreEjecucion:     r.nombreEjecucion     || null,
              cargoEjecucion:      r.cargoEjecucion      || null,
              horasEjecucion:      Number(r.horasEjecucion)   || 0,
              fechaInicioEjecucion: r.fechaInicioEjecucion || null,
              fechaFinEjecucion:   r.fechaFinEjecucion    || null,
              costoEjecucion:      calcCostoActual(r.cargoEjecucion, Number(r.horasEjecucion) || 0, r.precioHoraManualEjec),
              nombreSeguimiento:   r.nombreSeguimiento    || null,
              cargoSeguimiento:    r.cargoSeguimiento     || null,
              horasSeguimiento:    Number(r.horasSeguimiento) || 0,
              fechaSeguimiento:    r.fechaSeguimiento     || null,
              estadoSeguimiento:   r.estadoSeguimiento    || 'Abierta',
              costoSeguimiento:    calcCostoActual(r.cargoSeguimiento, Number(r.horasSeguimiento) || 0, r.precioHoraManualSeg),
            })),
          })),

        // Section 5
        costosAsociados: {
          costoCorreccion:      totalCorreccion,
          costoPlanAccion:      totalPlanEjecucion,
          costoPlanSeguimiento: totalPlanSeguimiento,
          perdidaIngresos:      Number(costos.perdidaIngresos)     || 0,
          multasSanciones:      Number(costos.multasSanciones)     || 0,
          otrosCostosInternos:  Number(costos.otrosCostosInternos) || 0,
          descuentosCliente:    Number(costos.descuentosCliente)   || 0,
          otrosCostos:          Number(costos.otrosCostos)         || 0,
        },
      };

      const res = await fetch('/api/acr', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Error al guardar el registro');
      }

      setSavedConsecutivo(payload.consecutivo);
      setModalState('success');
      resetForm();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error inesperado al guardar');
      setModalState('error');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Formulario ACR"
        subtitle="Registra una nueva Acción Correctiva o de Mejora"
      />

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Modals rendered via portal-like overlay */}

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
                      <div className={readonlyCls + " flex items-center justify-between"}>
                        <span>{consecutivoLoading ? "Cargando..." : info.consecutivo || "—"}</span>
                        {consecutivoLoading && (
                          <span className="text-xs text-slate-400">(auto)</span>
                        )}
                      </div>
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
                      <input className={inputCls} type="date" value={info.fechaRegistro} readOnly disabled />
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
                        <div className="flex flex-col gap-2 pt-1">
                          {[
                            { value: "Financieros", icon: "💰" },
                            { value: "Tecnológicos", icon: "💻" },
                            { value: "Humanos", icon: "👥" },
                          ].map(({ value, icon }) => {
                            const checked = act.recursos.includes(value);
                            return (
                              <label
                                key={value}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                  checked
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? act.recursos.filter((r) => r !== value)
                                      : [...act.recursos, value];
                                    setCorreccionActs((prev) =>
                                      prev.map((a, i) =>
                                        i === aIdx ? { ...a, recursos: next } : a
                                      )
                                    );
                                  }}
                                  className="accent-blue-600 w-4 h-4"
                                />
                                <span className="text-sm font-medium">{icon} {value}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Evidencia y Observaciones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Evidencia</label>
                        <EvidenciaUpload
                          value={act.evidencia}
                          onChange={(url) => updateActCorr(aIdx, "evidencia", url)}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Observaciones</label>
                        <input
                          className={inputCls}
                          type="text"
                          placeholder="Observaciones adicionales..."
                          value={act.observaciones}
                          onChange={(e) => updateActCorr(aIdx, "observaciones", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Responsables */}
                    <div className="space-y-3">
                      {act.responsables.map((resp, rIdx) => {
                        const costo = calcCostoActual(
                          resp.cargo,
                          Number(resp.horas) || 0,
                          resp.precioHoraManual
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
                                  {cargosDisponibles.map((c) => (
                                    <option key={c.cargo} value={c.cargo}>
                                      {c.cargo}
                                    </option>
                                  ))}
                                </select>
                                {resp.cargo === CARGO_MANUAL && (
                                  <input
                                    className={`${inputCls} mt-1`}
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Precio por hora (COP)"
                                    value={resp.precioHoraManual}
                                    onChange={(e) =>
                                      updateRespCorr(aIdx, rIdx, "precioHoraManual", parseDecimalInput(e.target.value))
                                    }
                                  />
                                )}
                              </div>
                              <div>
                                <label className={labelCls}>Tiempo (h)</label>
                                <input
                                  className={inputCls}
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  value={resp.horas}
                                  onChange={(e) =>
                                    updateRespCorr(
                                      aIdx,
                                      rIdx,
                                      "horas",
                                      parseDecimalInput(e.target.value)
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
                        className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800"
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
                    className="cursor-pointer px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition disabled:opacity-40"
                  >
                    + Agregar actividad
                  </button>
                  {correccionActs.length > 1 && (
                    <button
                      type="button"
                      onClick={removeActCorr}
                      className="cursor-pointer px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition"
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

                {/* ── Acordeón 5 Porqués ── */}
                <div className="border border-blue-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShow5Porques((v) => !v)}
                    className="cursor-pointer w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition text-left"
                  >
                    <span className="text-sm font-semibold text-blue-800">📚 ¿Qué es la metodología de los 5 Por Qué?</span>
                    <svg
                      className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${show5Porques ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Grid-rows trick: animates height from 0 → auto smoothly */}
                  <div
                    className="transition-all duration-300 ease-in-out overflow-hidden"
                    style={{ display: "grid", gridTemplateRows: show5Porques ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 py-4 bg-white text-sm text-slate-700 space-y-4 border-t border-blue-100">
                        <p>
                          La técnica de los <strong>5 Por Qué</strong> es una herramienta de análisis de causa raíz desarrollada por
                          Sakichi Toyoda y utilizada ampliamente en el Sistema de Producción Toyota. Su objetivo es identificar la
                          causa raíz de un problema preguntando <em>"¿Por qué?"</em> sucesivamente hasta llegar a la raíz del problema.
                        </p>

                        <div>
                          <p className="font-semibold text-slate-800 mb-2">¿Cómo funciona?</p>
                          <ol className="list-decimal list-inside space-y-1 text-slate-600">
                            <li><strong>Identifique el problema:</strong> Describa claramente la situación o incidente.</li>
                            <li><strong>Pregunte "¿Por qué ocurrió?":</strong> Identifique la causa inmediata.</li>
                            <li><strong>Repita "¿Por qué?":</strong> Para cada respuesta, pregunte nuevamente "¿Por qué?"</li>
                            <li><strong>Continúe hasta 5 veces:</strong> O hasta que identifique la causa raíz.</li>
                            <li><strong>Implemente acciones correctivas:</strong> Enfocadas en la causa raíz, no en los síntomas.</li>
                          </ol>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 space-y-2">
                          <p className="font-semibold text-slate-800">Ejemplo práctico:</p>
                          <p className="text-slate-600 text-xs italic">
                            Durante los meses de enero a marzo de 2025, se presentaron errores recurrentes en la liquidación de nómina
                            del cliente Empresa XYZ, específicamente en valores de horas extras y recargos nocturnos. Los archivos fueron
                            enviados al cliente sin validación final, generando tres reprocesos consecutivos, retrasos en los pagos y
                            múltiples reclamaciones formales. Como consecuencia, el cliente manifestó pérdida de confianza en el servicio
                            y decidió cancelar el contrato en marzo de 2025.
                          </p>
                          <div className="space-y-1 text-xs text-slate-700 pt-1">
                            <p><span className="font-semibold text-blue-700">¿Por qué 1?</span> Porque se enviaron archivos de nómina con errores en los cálculos.</p>
                            <p><span className="font-semibold text-blue-700">¿Por qué 2?</span> Porque los datos liquidados no fueron verificados antes del envío al cliente.</p>
                            <p><span className="font-semibold text-blue-700">¿Por qué 3?</span> Porque no existe una actividad obligatoria de doble verificación dentro del proceso operativo.</p>
                            <p><span className="font-semibold text-blue-700">¿Por qué 4?</span> Porque el procedimiento documentado de nómina no define puntos de control, responsables ni checklist de validación.</p>
                            <p><span className="font-semibold text-blue-700">¿Por qué 5?</span> <span className="text-slate-500">(Causa raíz)</span> Porque los procedimientos no han sido actualizados con base en incidentes anteriores ni en lecciones aprendidas del servicio.</p>
                          </div>
                          <p className="text-xs font-semibold text-emerald-700 pt-1">
                            ✅ Causa Raíz Identificada: Falta de actualización y mejora continua de los procedimientos operativos con base en incidentes y lecciones aprendidas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Análisis de causa */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>Análisis de causa</label>
                    <button
                      type="button"
                      onClick={handleGenerarIA}
                      disabled={aiLoading}
                      className="cursor-pointer text-sm font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-2 border border-purple-300 rounded-lg px-4 py-2 transition hover:bg-purple-50 bg-purple-50/50 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {aiLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          Generando análisis...
                        </>
                      ) : (
                        <><span className="text-base">🤖</span> Generar análisis con IA</>
                      )}
                    </button>
                  </div>
                  {aiError && (
                    <p className="text-xs text-red-600 mb-1 bg-red-50 border border-red-200 rounded px-2 py-1">{aiError}</p>
                  )}
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
                          className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          + Agregar
                        </button>
                      )}
                      {causasInmediatas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCausasInmediatas((p) => p.slice(0, -1))}
                          className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700"
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
                          className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          + Agregar
                        </button>
                      )}
                      {causasRaiz.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCausasRaiz((p) => p.slice(0, -1))}
                          className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700"
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
                      {showLegacyCausasSelector && (
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
                      )}
                    </div>

                    {/* Evidencia y Observaciones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Evidencia</label>
                        <EvidenciaUpload
                          value={act.evidencia}
                          onChange={(url) => updateActPlan(aIdx, "evidencia", url)}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Observaciones</label>
                        <input
                          className={inputCls}
                          type="text"
                          placeholder="Observaciones adicionales..."
                          value={act.observaciones}
                          onChange={(e) => updateActPlan(aIdx, "observaciones", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Responsables del plan */}
                    {act.responsables.map((resp, rIdx) => {
                      const costoEjec = calcCostoActual(
                        resp.cargoEjecucion,
                        Number(resp.horasEjecucion) || 0,
                        resp.precioHoraManualEjec
                      );
                      const costoSeg = calcCostoActual(
                        resp.cargoSeguimiento,
                        Number(resp.horasSeguimiento) || 0,
                        resp.precioHoraManualSeg
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
                                  {cargosDisponibles.map((c) => (
                                    <option key={c.cargo} value={c.cargo}>{c.cargo}</option>
                                  ))}
                                </select>
                                {resp.cargoEjecucion === CARGO_MANUAL && (
                                  <input
                                    className={`${inputCls} mt-1`}
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Precio por hora (COP)"
                                    value={resp.precioHoraManualEjec}
                                    onChange={(e) =>
                                      updateRespPlan(aIdx, rIdx, "precioHoraManualEjec", parseDecimalInput(e.target.value))
                                    }
                                  />
                                )}
                              </div>
                              <div>
                                <label className={labelCls}>Horas</label>
                                <input
                                  className={inputCls}
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  value={resp.horasEjecucion}
                                  onChange={(e) =>
                                    updateRespPlan(
                                      aIdx, rIdx, "horasEjecucion",
                                      parseDecimalInput(e.target.value)
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
                                  {cargosDisponibles.map((c) => (
                                    <option key={c.cargo} value={c.cargo}>{c.cargo}</option>
                                  ))}
                                </select>
                                {resp.cargoSeguimiento === CARGO_MANUAL && (
                                  <input
                                    className={`${inputCls} mt-1`}
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Precio por hora (COP)"
                                    value={resp.precioHoraManualSeg}
                                    onChange={(e) =>
                                      updateRespPlan(aIdx, rIdx, "precioHoraManualSeg", parseDecimalInput(e.target.value))
                                    }
                                  />
                                )}
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
                                  step="any"
                                  placeholder="0"
                                  value={resp.horasSeguimiento}
                                  onChange={(e) =>
                                    updateRespPlan(
                                      aIdx, rIdx, "horasSeguimiento",
                                      parseDecimalInput(e.target.value)
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
                      className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800"
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
                    className="cursor-pointer px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition"
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
                className="cursor-pointer px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Limpiar formulario
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
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

      {/* ══ LOADING MODAL ══ */}
      {modalState === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center gap-5 min-w-70">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-semibold text-base">Guardando ACR...</p>
              <p className="text-slate-400 text-sm mt-1">Por favor espera un momento</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ SUCCESS MODAL ══ */}
      {modalState === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="relative bg-white rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 min-w-[320px] max-w-sm w-full"
            style={{ animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            <button
              type="button"
              onClick={() => { setModalState('idle'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              aria-label="Cerrar"
              className="absolute top-4 right-4 w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition flex items-center justify-center cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Checkmark circle */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-slate-800 font-bold text-lg">¡ACR Guardada!</h3>
              <p className="text-slate-500 text-sm mt-1">El registro fue creado exitosamente.</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2">
                <span className="text-xs text-slate-500 font-medium">Consecutivo</span>
                <span className="text-sm font-bold text-blue-700 tracking-wide">{savedConsecutivo}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => { setModalState('idle'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer"
              >
                Crear otro ACR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ERROR MODAL ══ */}
      {modalState === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 min-w-[320px] max-w-sm w-full"
            style={{ animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {/* X circle */}
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-slate-800 font-bold text-lg">Error al guardar</h3>
              <p className="text-slate-500 text-sm mt-1">{modalError}</p>
            </div>

            <button
              onClick={() => setModalState('idle')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition"
            >
              Cerrar y revisar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
