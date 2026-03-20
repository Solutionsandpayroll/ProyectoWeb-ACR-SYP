"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import EvidenciaUpload from "@/components/EvidenciaUpload";
import Header from "@/components/Header";
import { getCargosForFechaRegistro, getSalarioPorCargo } from "@/lib/cargo-scale";

// â”€â”€â”€ Salary Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const calcCostoByRegistroDate = (cargo: string, horas: number, fechaRegistro?: string): number => {
  const salario = getSalarioPorCargo(cargo, fechaRegistro ?? null);
  if (!salario || !horas) return 0;
  return Math.round((salario / 180) * horas);
};

const parseDecimalInput = (value: string): number | "" => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return "";
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : "";
};

// â”€â”€â”€ Option Lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

const RECURSOS_OPTS: { value: string; icon: string }[] = [
  { value: "Financieros",  icon: "💰" },
  { value: "Tecnológicos", icon: "💻" },
  { value: "Humanos",      icon: "👥" },
];

interface RespCorr {
  nombre: string | null; cargo: string | null;
  horas: number; fecha_inicio: string | null; fecha_fin: string | null; costo: number;
}
interface ActCorr {
  id: number; actividad: string; recursos: string[]; costo_total: number;
  responsables: RespCorr[];
  evidencia: string | null;
  observaciones: string | null;
}
interface RespPlanRow {
  nombre: string | null; cargo: string | null;
  horas: number; fecha_inicio: string | null; fecha_fin: string | null; costo: number; estado: string;
}
interface ActPlan {
  id: number; descripcion: string; causas_asociadas: string[]; costo_total: number;
  responsables_ejecucion:  RespPlanRow[];
  responsables_seguimiento: RespPlanRow[];
  evidencia: string | null;
  observaciones: string | null;
}
interface ApiData {
  registro: {
    id: number; consecutivo: string; fuente: string; proceso: string;
    cliente: string | null; fecha_apertura: string; fecha_registro: string | null; fecha_limite: string | null;
    tipo_accion: string; tratamiento: string | null; evaluacion_riesgo: string | null;
    descripcion: string | null; estado: string; created_at: string;
    eficacia_accion_adecuada:  string | null;
    eficacia_no_conformidades: string | null;
    eficacia_nuevos_riesgos:   string | null;
    eficacia_cambios_sgi:      string | null;
    fecha_cierre: string | null;
    responsable_cierre: string | null;
  };
  actividades_correccion: ActCorr[];
  causas: { inmediatas: string[]; raiz: string[] };
  actividades_plan: ActPlan[];
  costos: {
    costo_correccion: number; costo_plan_accion: number; costo_plan_seguimiento: number;
    perdida_ingresos: number; multas_sanciones: number; otros_costos_internos: number;
    descuentos_cliente: number; otros_costos: number; costo_total: number;
  };
}

interface SessionData {
  role: "admin" | "user";
}

// â”€â”€â”€ Edit types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type CorrRespEdit = {
  nombre: string; cargo: string; horas: number | "";
  fechaInicio: string; fechaFin: string;
};
type CorrActEdit = { actividad: string; recursos: string[]; responsables: CorrRespEdit[]; evidencia: string; observaciones: string };

type PlanRespEdit = {
  nombreEjecucion: string; cargoEjecucion: string; horasEjecucion: number | "";
  fechaInicioEjecucion: string; fechaFinEjecucion: string;
  nombreSeguimiento: string; cargoSeguimiento: string; horasSeguimiento: number | "";
  fechaSeguimiento: string; estadoSeguimiento: string;
};
type PlanActEdit = { descripcion: string; causasAsociadas: string[]; responsables: PlanRespEdit[]; evidencia: string; observaciones: string };

type EditData = {
  fuente: string; proceso: string; cliente: string;
  fechaApertura: string; fechaRegistro: string; fechaLimite: string;
  tipoAccion: string; tratamiento: string; evaluacionRiesgo: string;
  descripcion: string; estado: string;
  actividadesCorreccion: CorrActEdit[];
  causasInmediatas: string[]; causasRaiz: string[];
  actividadesPlan: PlanActEdit[];
  costosExtra: {
    perdidaIngresos: number; multasSanciones: number; otrosCostosInternos: number;
    descuentosCliente: number; otrosCostos: number;
  };
  eficaciaAccionAdecuada:  string;
  eficaciaNoConformidades: string;
  eficaciaNuevosRiesgos:   string;
  eficaciaCambiosSgi:      string;
  fechaCierre: string;
  responsableCierre: string;
};

// â”€â”€â”€ Factories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const newCorrResp = (): CorrRespEdit => ({ nombre: "", cargo: "", horas: "", fechaInicio: "", fechaFin: "" });
const newCorrAct  = (): CorrActEdit  => ({ actividad: "", recursos: [], responsables: [newCorrResp()], evidencia: "", observaciones: "" });
const newPlanResp = (): PlanRespEdit => ({
  nombreEjecucion: "", cargoEjecucion: "", horasEjecucion: "",
  fechaInicioEjecucion: "", fechaFinEjecucion: "",
  nombreSeguimiento: "", cargoSeguimiento: "", horasSeguimiento: "",
  fechaSeguimiento: "", estadoSeguimiento: "Abierta",
});
const newPlanAct = (): PlanActEdit => ({ descripcion: "", causasAsociadas: [], responsables: [newPlanResp()], evidencia: "", observaciones: "" });

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtCOP = (n: number) =>
  n > 0 ? n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }) : "â€”";

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "â€”";

const toInputDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");

const parseEvidencias = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    }
  } catch {
    // Legacy format (single string)
  }
  return value.trim() ? [value] : [];
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveEvidenceHref = (evidencia: string): string => {
  if (isAbsoluteUrl(evidencia)) {
    return `/api/evidencias/download?url=${encodeURIComponent(evidencia)}`;
  }
  return evidencia;
};

function initEditData(d: ApiData): EditData {
  const reg = d.registro;
  return {
    fuente:          reg.fuente       ?? "",
    proceso:         reg.proceso      ?? "",
    cliente:         reg.cliente      ?? "",
    fechaApertura:   toInputDate(reg.fecha_apertura),
    fechaRegistro:   toInputDate(reg.fecha_registro),
    fechaLimite:     toInputDate(reg.fecha_limite),
    tipoAccion:      reg.tipo_accion  ?? "",
    tratamiento:     reg.tratamiento  ?? "",
    evaluacionRiesgo: reg.evaluacion_riesgo ?? "",
    descripcion:     reg.descripcion  ?? "",
    estado:          reg.estado       ?? "Abierta",

    actividadesCorreccion: d.actividades_correccion.length > 0
      ? d.actividades_correccion.map((a) => ({
          actividad: a.actividad,
          recursos:  Array.isArray(a.recursos) ? a.recursos : [],
          evidencia:  a.evidencia  ?? "",
          observaciones: a.observaciones ?? "",
          responsables: a.responsables.map((r) => ({
            nombre:     r.nombre ?? "",
            cargo:      r.cargo  ?? "",
            horas:      Number(r.horas) as number | "",
            fechaInicio: toInputDate(r.fecha_inicio),
            fechaFin:    toInputDate(r.fecha_fin),
          })),
        }))
      : [newCorrAct()],

    causasInmediatas: d.causas.inmediatas.length > 0 ? [...d.causas.inmediatas, ""] : ["", ""],
    causasRaiz:       d.causas.raiz.length > 0       ? [...d.causas.raiz, ""]       : ["", ""],

    actividadesPlan: d.actividades_plan.length > 0
      ? d.actividades_plan.map((a) => {
          const ejec = a.responsables_ejecucion  ?? [];
          const segu = a.responsables_seguimiento ?? [];
          const count = Math.max(ejec.length, segu.length, 1);
          return {
            descripcion:     a.descripcion,
            causasAsociadas: Array.isArray(a.causas_asociadas) ? a.causas_asociadas : [],
            evidencia:       a.evidencia       ?? "",
            observaciones:   a.observaciones   ?? "",
            responsables: Array.from({ length: count }, (_, k) => ({
              nombreEjecucion:      ejec[k]?.nombre ?? "",
              cargoEjecucion:       ejec[k]?.cargo  ?? "",
              horasEjecucion:       Number(ejec[k]?.horas ?? 0) as number | "",
              fechaInicioEjecucion: toInputDate(ejec[k]?.fecha_inicio),
              fechaFinEjecucion:    toInputDate(ejec[k]?.fecha_fin),
              nombreSeguimiento:    segu[k]?.nombre ?? "",
              cargoSeguimiento:     segu[k]?.cargo  ?? "",
              horasSeguimiento:     Number(segu[k]?.horas ?? 0) as number | "",
              fechaSeguimiento:     toInputDate(segu[k]?.fecha_inicio),
              estadoSeguimiento:    segu[k]?.estado ?? "Abierta",
            })),
          };
        })
      : [newPlanAct()],

    costosExtra: {
      perdidaIngresos:     Number(d.costos.perdida_ingresos      ?? 0),
      multasSanciones:     Number(d.costos.multas_sanciones       ?? 0),
      otrosCostosInternos: Number(d.costos.otros_costos_internos  ?? 0),
      descuentosCliente:   Number(d.costos.descuentos_cliente      ?? 0),
      otrosCostos:         Number(d.costos.otros_costos           ?? 0),
    },
    eficaciaAccionAdecuada:  reg.eficacia_accion_adecuada  ?? "",
    eficaciaNoConformidades: reg.eficacia_no_conformidades ?? "",
    eficaciaNuevosRiesgos:   reg.eficacia_nuevos_riesgos   ?? "",
    eficaciaCambiosSgi:      reg.eficacia_cambios_sgi      ?? "",
    fechaCierre:             toInputDate(reg.fecha_cierre),
    responsableCierre:       reg.responsable_cierre ?? "",
  };
}

// â”€â”€â”€ Style constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] bg-white transition";
const labelCls = "block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1";

// â”€â”€â”€ UI sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SecTitle({ n, label }: { n: number; label: string }) {
  return (
    <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
      <span className="text-xs font-bold text-white bg-[#105789] rounded px-2 py-0.5">{n}</span>
      <span className="text-xs font-bold uppercase tracking-widest text-[#105789]">{label}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-sm text-slate-800 font-medium leading-snug">{value || <span className="text-slate-300">â€”</span>}</span>
    </div>
  );
}

function CargoSelect({ value, onChange, cargos }: { value: string; onChange: (v: string) => void; cargos: { cargo: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">Cargo...</option>
      {cargos.map((c) => <option key={c.cargo} value={c.cargo}>{c.cargo}</option>)}
    </select>
  );
}

const ESTADOS_ACR  = ["Abierta", "Cerrada", "Parcial"];
const TIPOS_ACCION = ["Correctiva", "De mejora"];
const ESTADOS_PLAN = ["Abierta", "Cerrada", "Parcial"];

const CARGO_EN_MAP: Record<string, string> = {
  "Director General": "General Director",
  "Director de operaciones": "Operations Director",
  "Gerente de Nomina y ADP": "Payroll and ADP Manager",
  "Gerente Comercial": "Commercial Manager",
  "Lider de Administración de personal": "Personnel Administration Lead",
  "Lider de Gestión Humana": "Human Management Lead",
  "Lider de Employer of Record Colombia": "Employer of Record Colombia Lead",
  "Lider Outsourcing de Tesoreria": "Treasury Outsourcing Lead",
  "Profesional SGI": "IMS Professional",
  "Profesional de Nomina": "Payroll Professional",
  "Profesional Back office Sucursales": "Branch Back Office Professional",
  "Analista Administrativo y financiero": "Administrative and Financial Analyst",
  "Analista de Nómina": "Payroll Analyst",
  "Analista Administración de personal": "Personnel Administration Analyst",
  "Analista de EoR": "EoR Analyst",
  "Tecnico de Automatización": "Automation Technician",
  "Asistente Administrativo y Financiero": "Administrative and Financial Assistant",
  "Asistente Comercial": "Commercial Assistant",
  "Asistente de Comunicación y Marketing": "Communication and Marketing Assistant",
  "Asistente de Nómina": "Payroll Assistant",
  "Asistente Administración de Personal": "Personnel Administration Assistant",
  "Asistente de EoR": "EoR Assistant",
  "Asistente de tesorería": "Treasury Assistant",
  "Auxiliar de nomina": "Payroll Assistant",
  "Aprendiz": "Apprentice",
  "Practicante": "Intern",
};

const ESTADO_EN_MAP: Record<string, string> = {
  "Abierta": "Open",
  "Cerrada": "Closed",
  "Parcial": "Partial",
  "En progreso": "In progress",
  "Completado": "Completed",
};

const RECURSO_EN_MAP: Record<string, string> = {
  "Financieros": "Financial",
  "Tecnológicos": "Technological",
  "Humanos": "Human Resources",
};

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AcrDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params?.id as string;

  const [data,       setData]       = useState<ApiData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditing,  setIsEditing]  = useState(false);
  const [editData,   setEditData]   = useState<EditData | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [saveOk,     setSaveOk]     = useState(false);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [translating,  setTranslating]  = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAcr, setDeletingAcr] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [session, setSession] = useState<SessionData | null>(null);

  const isAdmin = session?.role === "admin";
  const canEditExecutionDates = session?.role === "admin";

  // Helper: returns translated text if available, otherwise the original
  const tr = (key: string, val: string | null | undefined): string =>
    translations?.[key] ?? val ?? "";

  // Helper for fixed UI labels (no API call needed)
  const fx = (es: string, en: string): string => (translations ? en : es);
  const cargoLabel = (cargo: string | null | undefined): string => {
    if (!cargo) return "—";
    if (!translations) return cargo;
    return CARGO_EN_MAP[cargo] ?? cargo;
  };
  const estadoLabel = (estado: string | null | undefined): string => {
    if (!estado) return "—";
    if (!translations) return estado;
    return ESTADO_EN_MAP[estado] ?? estado;
  };
  const recursoLabel = (recurso: string | null | undefined): string => {
    if (!recurso) return "—";
    if (!translations) return recurso;
    return RECURSO_EN_MAP[recurso] ?? recurso;
  };
  const yesNoLabel = (value: "SI" | "NO"): string => {
    if (!translations) return value;
    return value === "SI" ? "YES" : "NO";
  };

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const res  = await fetch(`/api/acr/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al cargar");
      setData(json.data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let cancelled = false;

    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setSession(json.session ?? null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      }
    };

    void fetchSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEdit = () => {
    if (!data) return;
    setEditData(initEditData(data));
    setSaveError(null); setSaveOk(false); setIsEditing(true); setEstadoError(null);
  };
  const handleCancel = () => { setIsEditing(false); setSaveError(null); setEstadoError(null); };

  const handleDelete = async () => {
    if (!data) return;
    if (!deleteReason.trim()) { setDeleteError('Debes indicar la razón de eliminación.'); return; }
    setDeletingAcr(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/acr/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razonEliminacion: deleteReason.trim() })
      });
      if (!response.ok) throw new Error('Error al eliminar el ACR');
      setShowDeleteModal(false);
      // Redirect to historial after 1 second
      setTimeout(() => router.push('/dashboard/historial-acr'), 1000);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setDeletingAcr(false);
    }
  };

  // ── Translation ───────────────────────────────────────────────────────────
  const handleTranslate = async () => {
    if (!data) return;
    if (translations) { setTranslations(null); setTranslateError(null); return; }
    setTranslating(true);
    setTranslateError(null);
    const reg = data.registro;
    // Build a keyed list of texts to translate
    const entries: { key: string; text: string }[] = [
      { key: "descripcion",      text: reg.descripcion      ?? "" },
      { key: "tratamiento",      text: reg.tratamiento      ?? "" },
      { key: "evaluacionRiesgo", text: reg.evaluacion_riesgo ?? "" },
      { key: "fuente",           text: reg.fuente            ?? "" },
      { key: "proceso",          text: reg.proceso           ?? "" },
      { key: "cliente",          text: reg.cliente           ?? "" },
      { key: "tipoAccion",       text: reg.tipo_accion       ?? "" },
      ...data.causas.inmediatas.map((c, i) => ({ key: `causaInm_${i}`, text: c })),
      ...data.causas.raiz.map((c, i) => ({ key: `causaRaiz_${i}`, text: c })),
      ...data.actividades_correccion.flatMap((a, i) => [
        { key: `corrAct_${i}`,      text: a.actividad    ?? "" },
        { key: `corrActObs_${i}`,   text: a.observaciones ?? "" },
      ]),
      ...data.actividades_plan.flatMap((a, i) => [
        { key: `planAct_${i}`,      text: a.descripcion  ?? "" },
        { key: `planActObs_${i}`,   text: a.observaciones ?? "" },
        ...(a.causas_asociadas ?? []).map((c: string, j: number) => ({
          key: `planCausa_${i}_${j}`, text: c,
        })),
      ]),
    ];
    const keys  = entries.map((e) => e.key);
    const texts = entries.map((e) => e.text);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, target: "EN-US" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al traducir");
      const map: Record<string, string> = {};
      keys.forEach((k, i) => { map[k] = json.results[i] ?? texts[i]; });
      setTranslations(map);
    } catch (e) {
      setTranslateError(e instanceof Error ? e.message : "Error al traducir");
    } finally {
      setTranslating(false);
    }
  };

  const fechaRegistroEscala = editData?.fechaRegistro || toInputDate(data?.registro?.fecha_registro);
  const cargosDisponibles = useMemo(
    () => getCargosForFechaRegistro(fechaRegistroEscala),
    [fechaRegistroEscala]
  );
  const calcCosto = useCallback(
    (cargo: string, horas: number) => calcCostoByRegistroDate(cargo, horas, fechaRegistroEscala),
    [fechaRegistroEscala]
  );

  // â”€â”€ Calculated totals (reactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalCorreccion = useMemo(() => {
    if (!editData) return 0;
    return editData.actividadesCorreccion.reduce(
      (sum, act) => sum + act.responsables.reduce(
        (s, r) => s + calcCosto(r.cargo, Number(r.horas) || 0), 0
      ), 0
    );
  }, [editData, calcCosto]);

  const totalPlanEjecucion = useMemo(() => {
    if (!editData) return 0;
    return editData.actividadesPlan.reduce(
      (sum, act) => sum + act.responsables.reduce(
        (s, r) => s + calcCosto(r.cargoEjecucion, Number(r.horasEjecucion) || 0), 0
      ), 0
    );
  }, [editData, calcCosto]);

  const totalPlanSeguimiento = useMemo(() => {
    if (!editData) return 0;
    return editData.actividadesPlan.reduce(
      (sum, act) => sum + act.responsables.reduce(
        (s, r) => s + calcCosto(r.cargoSeguimiento, Number(r.horasSeguimiento) || 0), 0
      ), 0
    );
  }, [editData, calcCosto]);

  const totalExtra = useMemo(() => {
    if (!editData) return 0;
    const c = editData.costosExtra;
    return c.perdidaIngresos + c.multasSanciones + c.otrosCostosInternos + c.descuentosCliente + c.otrosCostos;
  }, [editData]);

  const grandTotal = totalCorreccion + totalPlanEjecucion + totalPlanSeguimiento + totalExtra;

  const totalCorreccionVista = useMemo(() => {
    if (!data) return 0;
    return data.actividades_correccion.reduce(
      (sum, act) =>
        sum +
        (act.responsables ?? []).reduce(
          (s, r) => s + calcCosto(r.cargo ?? "", Number(r.horas) || 0),
          0
        ),
      0
    );
  }, [data, calcCosto]);

  const totalPlanEjecucionVista = useMemo(() => {
    if (!data) return 0;
    return data.actividades_plan.reduce(
      (sum, act) =>
        sum +
        (act.responsables_ejecucion ?? []).reduce(
          (s, r) => s + calcCosto(r.cargo ?? "", Number(r.horas) || 0),
          0
        ),
      0
    );
  }, [data, calcCosto]);

  const totalPlanSeguimientoVista = useMemo(() => {
    if (!data) return 0;
    return data.actividades_plan.reduce(
      (sum, act) =>
        sum +
        (act.responsables_seguimiento ?? []).reduce(
          (s, r) => s + calcCosto(r.cargo ?? "", Number(r.horas) || 0),
          0
        ),
      0
    );
  }, [data, calcCosto]);

  const totalExtraVista = useMemo(() => {
    if (!data) return 0;
    return (
      Number(data.costos.perdida_ingresos ?? 0) +
      Number(data.costos.multas_sanciones ?? 0) +
      Number(data.costos.otros_costos_internos ?? 0) +
      Number(data.costos.descuentos_cliente ?? 0) +
      Number(data.costos.otros_costos ?? 0)
    );
  }, [data]);

  const grandTotalVista =
    totalCorreccionVista + totalPlanEjecucionVista + totalPlanSeguimientoVista + totalExtraVista;

  // â”€â”€ AllCausas for plan checkboxes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allCausas = useMemo(() => {
    if (!editData) return [];
    const out: { label: string; value: string }[] = [];
    editData.causasInmediatas.forEach((c, i) => {
      if (c.trim()) out.push({ label: `CI${i + 1}: ${c}`, value: `ci-${i}` });
    });
    editData.causasRaiz.forEach((c, i) => {
      if (c.trim()) out.push({ label: `CR${i + 1}: ${c}`, value: `cr-${i}` });
    });
    return out;
  }, [editData]);

  // â”€â”€ Save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSave = async () => {
    if (!editData) return;
    // Block saving as Cerrada if any activity is missing both evidencia and observaciones
    if (editData.estado === "Cerrada") {
      const corrIncompleta = editData.actividadesCorreccion.some(
        (a) => !a.evidencia?.trim() && !a.observaciones?.trim()
      );
      const planIncompleta = editData.actividadesPlan.some(
        (a) => !a.evidencia?.trim() && !a.observaciones?.trim()
      );
      if (corrIncompleta || planIncompleta) {
        setSaveError(
          "No se puede guardar como Cerrada: todas las actividades deben tener al menos Evidencia o Observaciones completadas."
        );
        return;
      }
    }
    setSaving(true); setSaveError(null); setSaveOk(false);
    try {
      const payload = {
        fuente:           editData.fuente,
        proceso:          editData.proceso,
        cliente:          editData.cliente || null,
        fechaApertura:    editData.fechaApertura,
        fechaRegistro:    editData.fechaRegistro || null,
        fechaLimite:      editData.fechaLimite || null,
        tipoAccion:       editData.tipoAccion,
        tratamiento:      editData.tratamiento || null,
        evaluacionRiesgo: editData.evaluacionRiesgo || null,
        descripcion:      editData.descripcion || null,
        estado:           editData.estado,
        actividadesCorreccion: editData.actividadesCorreccion
          .filter((a) => a.actividad.trim())
          .map((a) => ({
            actividad:  a.actividad,
            recursos:   a.recursos,
            evidencia:  a.evidencia  || null,
            observaciones: a.observaciones || null,
            costoTotal: a.responsables.reduce((s, r) => s + calcCosto(r.cargo, Number(r.horas) || 0), 0),
            responsables: a.responsables.map((r) => ({
              nombre:     r.nombre     || null,
              cargo:      r.cargo      || null,
              horas:      Number(r.horas) || 0,
              fechaInicio: r.fechaInicio || null,
              fechaFin:    r.fechaFin   || null,
              costo:       calcCosto(r.cargo, Number(r.horas) || 0),
            })),
          })),
        causasInmediatas: editData.causasInmediatas.filter((c) => c.trim()),
        causasRaiz:       editData.causasRaiz.filter((c) => c.trim()),
        actividadesPlan: editData.actividadesPlan
          .filter((a) => a.descripcion.trim())
          .map((a) => ({
            descripcion:     a.descripcion,
            causasAsociadas: a.causasAsociadas,
            evidencia:       a.evidencia       || null,
            observaciones:   a.observaciones   || null,
            costoTotal: a.responsables.reduce(
              (s, r) =>
                s +
                calcCosto(r.cargoEjecucion,  Number(r.horasEjecucion)  || 0) +
                calcCosto(r.cargoSeguimiento, Number(r.horasSeguimiento) || 0),
              0
            ),
            responsables: a.responsables.map((r) => ({
              nombreEjecucion:      r.nombreEjecucion      || null,
              cargoEjecucion:       r.cargoEjecucion       || null,
              horasEjecucion:       Number(r.horasEjecucion) || 0,
              fechaInicioEjecucion: r.fechaInicioEjecucion || null,
              fechaFinEjecucion:    r.fechaFinEjecucion    || null,
              costoEjecucion:       calcCosto(r.cargoEjecucion, Number(r.horasEjecucion) || 0),
              nombreSeguimiento:    r.nombreSeguimiento    || null,
              cargoSeguimiento:     r.cargoSeguimiento     || null,
              horasSeguimiento:     Number(r.horasSeguimiento) || 0,
              fechaSeguimiento:     r.fechaSeguimiento     || null,
              estadoSeguimiento:    r.estadoSeguimiento    || "Abierta",
              costoSeguimiento:     calcCosto(r.cargoSeguimiento, Number(r.horasSeguimiento) || 0),
            })),
          })),
        costosAsociados: {
          costoCorreccion:      totalCorreccion,
          costoPlanAccion:      totalPlanEjecucion,
          costoPlanSeguimiento: totalPlanSeguimiento,
          perdidaIngresos:      editData.costosExtra.perdidaIngresos,
          multasSanciones:      editData.costosExtra.multasSanciones,
          otrosCostosInternos:  editData.costosExtra.otrosCostosInternos,
          descuentosCliente:    editData.costosExtra.descuentosCliente,
          otrosCostos:          editData.costosExtra.otrosCostos,
        },
        eficaciaAccionAdecuada:  editData.eficaciaAccionAdecuada  || null,
        eficaciaNoConformidades: editData.eficaciaNoConformidades || null,
        eficaciaNuevosRiesgos:   editData.eficaciaNuevosRiesgos   || null,
        eficaciaCambiosSgi:      editData.eficaciaCambiosSgi      || null,
        fechaCierre:             editData.fechaCierre || null,
        responsableCierre:       editData.responsableCierre || null,
      };
      const res = await fetch(`/api/acr/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      setSaveOk(true);
      setIsEditing(false);
      await fetchData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const setED = (patch: Partial<EditData>) =>
    setEditData((prev) => (prev ? { ...prev, ...patch } : null));

  const updCorrAct = (ai: number, patch: Partial<CorrActEdit>) => {
    if (!editData) return;
    const arr = editData.actividadesCorreccion.map((a, i) => i === ai ? { ...a, ...patch } : a);
    setED({ actividadesCorreccion: arr });
  };
  const updCorrResp = (ai: number, ri: number, patch: Partial<CorrRespEdit>) => {
    if (!editData) return;
    const arr = editData.actividadesCorreccion.map((a, i) => {
      if (i !== ai) return a;
      return { ...a, responsables: a.responsables.map((r, j) => j === ri ? { ...r, ...patch } : r) };
    });
    setED({ actividadesCorreccion: arr });
  };
  const updPlanAct = (ai: number, patch: Partial<PlanActEdit>) => {
    if (!editData) return;
    const arr = editData.actividadesPlan.map((a, i) => i === ai ? { ...a, ...patch } : a);
    setED({ actividadesPlan: arr });
  };
  const updPlanResp = (ai: number, ri: number, patch: Partial<PlanRespEdit>) => {
    if (!editData) return;
    const arr = editData.actividadesPlan.map((a, i) => {
      if (i !== ai) return a;
      return { ...a, responsables: a.responsables.map((r, j) => j === ri ? { ...r, ...patch } : r) };
    });
    setED({ actividadesPlan: arr });
  };
  const toggleCausa = (ai: number, val: string) => {
    if (!editData) return;
    const current = editData.actividadesPlan[ai].causasAsociadas;
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    updPlanAct(ai, { causasAsociadas: next });
  };
  const toggleRecurso = (ai: number, val: string) => {
    if (!editData) return;
    const current = editData.actividadesCorreccion[ai].recursos;
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    updCorrAct(ai, { recursos: next });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col flex-1">
      <Header title={fx("Detalle ACR", "ACR Detail")} subtitle={fx("Cargando...", "Loading...")} />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#105789] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (fetchError || !data) return (
    <div className="flex flex-col flex-1">
      <Header title={fx("Detalle ACR", "ACR Detail")} subtitle={fx("Error", "Error")} />
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <p className="text-red-600 font-medium">{fetchError ?? fx("Registro no encontrado", "Record not found")}</p>
        <button onClick={() => router.back()} className="text-sm text-[#105789] hover:underline cursor-pointer">← {fx("Volver al historial", "Back to history")}</button>
      </div>
    </div>
  );

  const reg = data.registro;
  const ed  = editData;

  const estadoColor: Record<string, string> = {
    Abierta: "bg-amber-100 text-amber-700 border-amber-300",
    Cerrada: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Parcial: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="no-print">
        <Header
          title={`ACR ${reg.consecutivo}`}
          subtitle={`${tr("proceso", reg.proceso)} · ${tr("tipoAccion", reg.tipo_accion)}`}
        />
      </div>

      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="no-print flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#105789] transition-colors font-medium cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {fx("Volver al historial", "Back to history")}
          </button>

          <div className="flex items-center gap-3 flex-wrap justify-end w-full sm:w-auto">
            {saveOk && !isEditing && (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                ✓ {fx("Cambios guardados", "Changes saved")}
              </span>
            )}
            {!isEditing ? (
              <>
                <button
                  onClick={handleTranslate}
                  disabled={translating}
                  className="no-print flex items-center gap-2 bg-white text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                  title={translations ? "Ver en español" : "Translate to English (DeepL)"}
                >
                  {translating ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <span className="text-base leading-none">🌐</span>
                  )}
                  {translating ? "Traduciendo..." : translations ? "Ver en español" : "Translate to English"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="no-print flex items-center gap-2 bg-white text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {fx("Exportar a PDF", "Export to PDF")}
                </button>
                <button
                  onClick={handleEdit}
                  className="no-print flex items-center gap-2 bg-[#105789] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0d3f6e] transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {fx("Editar ACR", "Edit ACR")}
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="no-print flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {fx("Eliminar ACR", "Delete ACR")}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleCancel} disabled={saving} className="text-sm font-semibold text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                  {fx("Cancelar", "Cancel")}
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#105789] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0d3f6e] transition-colors shadow-sm disabled:opacity-60">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {saving ? fx("Guardando...", "Saving...") : fx("Guardar cambios", "Save changes")}
                </button>
              </>
            )}
          </div>
        </div>

        {saveError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {saveError}
          </div>
        )}

        {translateError && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{translateError}</span>
          </div>
        )}

        {/* ── Document ────────────────────────────────────────────────────── */}
        <div id="acr-document" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print:overflow-visible">

          {/* Document header */}
          <div
            className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ backgroundColor: "#105789", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Image
                src="/Titulo_empresa_v2.png"
                alt="ACR"
                width={180}
                height={64}
                className="object-contain w-36 sm:w-45"
                unoptimized
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <div className="hidden sm:block w-px h-10 bg-white/20" />
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">{fx("Acciones Correctivas y de Mejora · GIN · V07", "Corrective and Improvement Actions · GIN · V07")}</p>
                <p className="text-white font-bold text-xl font-mono">{reg.consecutivo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {isEditing && ed ? (
                <>
                  <select
                    value={ed.estado}
                    onChange={(e) => {
                      if (!isAdmin) return;
                      const next = e.target.value;
                      if (next === "Cerrada") {
                        const corrIncompleta = ed.actividadesCorreccion.some(
                          (a) => !a.evidencia?.trim() && !a.observaciones?.trim()
                        );
                        const planIncompleta = ed.actividadesPlan.some(
                          (a) => !a.evidencia?.trim() && !a.observaciones?.trim()
                        );
                        if (corrIncompleta || planIncompleta) {
                          setEstadoError(
                            "Para cerrar el ACR todas las actividades deben tener al menos Evidencia o Observaciones completadas."
                          );
                          return;
                        }
                      }
                      setEstadoError(null);
                      setED({ estado: next });
                    }}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Solo Admin puede cambiar el estado del ACR" : undefined}
                    className={`text-sm font-semibold border-2 border-white/30 bg-white/10 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      !isAdmin ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {ESTADOS_ACR.map((s) => <option key={s} className="text-slate-800">{s}</option>)}
                  </select>
                  {estadoError && (
                    <p className="text-xs text-amber-200 bg-amber-900/40 border border-amber-400/40 rounded px-2 py-1 max-w-xs text-center leading-snug">
                      {estadoError}
                    </p>
                  )}
                </>
              ) : (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${estadoColor[reg.estado] ?? "bg-slate-100 text-slate-600"}`}>
                  {estadoLabel(reg.estado)}
                </span>
              )}
              <span className="text-white/60 text-xs">
                {fx("Creado", "Created")}: {fmtDate(reg.created_at)}
              </span>
            </div>
          </div>

          {/* ── SECTION 1: Datos Generales ───────────────────────────────── */}
          <SecTitle n={1} label={fx("Datos Generales", "General Information")} />
          <div className="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 border-b border-slate-200">
            {isEditing && ed ? (
              <>
                <div>
                  <label className={labelCls}>Consecutivo</label>
                  <input value={reg.consecutivo} readOnly className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </div>
                <div>
                  <label className={labelCls}>Fuente</label>
                  <select value={ed.fuente} onChange={(e) => setED({ fuente: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {FUENTES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Proceso</label>
                  <select value={ed.proceso} onChange={(e) => setED({ proceso: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {PROCESOS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tipo de acción</label>
                  <select value={ed.tipoAccion} onChange={(e) => setED({ tipoAccion: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_ACCION.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fecha del incidente</label>
                  <input type="date" value={ed.fechaApertura} onChange={(e) => setED({ fechaApertura: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fecha de registro</label>
                  <input type="date" value={ed.fechaRegistro} className={inputCls} readOnly disabled />
                </div>
                <div>
                  <label className={labelCls}>Fecha límite</label>
                  <input type="date" value={ed.fechaLimite} onChange={(e) => setED({ fechaLimite: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cliente</label>
                  <input value={ed.cliente} onChange={(e) => setED({ cliente: e.target.value })} placeholder="—" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Evaluación del riesgo</label>
                  <select value={ed.evaluacionRiesgo} onChange={(e) => setED({ evaluacionRiesgo: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {EVALUACION_RIESGO.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </div>
                {ed.fuente === "Salidas no conformes" && (
                  <div className="col-span-2">
                    <label className={labelCls}>Tratamiento</label>
                    <select value={ed.tratamiento} onChange={(e) => setED({ tratamiento: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {TRATAMIENTOS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <>
                <Field label={fx("Consecutivo", "Consecutive ID")} value={reg.consecutivo} />
                <Field label={fx("Proceso", "Process")} value={tr("proceso", reg.proceso)} />
                <Field label={fx("Fecha del incidente", "Incident date")} value={fmtDate(reg.fecha_apertura)} />
                <Field label={fx("Fecha de registro", "Registration date")} value={fmtDate(reg.fecha_registro)} />
                <Field label={fx("Fuente", "Source")} value={tr("fuente", reg.fuente)} />
                <Field label={fx("Cliente", "Client")} value={tr("cliente", reg.cliente)} />
                <Field label={fx("Tipo de acción", "Action type")} value={tr("tipoAccion", reg.tipo_accion)} />
                <Field label={fx("Evaluación del riesgo", "Risk assessment")} value={tr("evaluacionRiesgo", reg.evaluacion_riesgo)} />
                {reg.fuente === "Salidas no conformes" && (
                  <Field label={fx("Tratamiento", "Treatment")} value={tr("tratamiento", reg.tratamiento)} />
                )}
              </>
            )}
          </div>

          {/* ── SECTION 2: Descripción ──────────────────────────────────── */}
          <SecTitle n={2} label={fx("Descripción de la Situación", "Situation Description")} />
          <div className="px-4 sm:px-6 py-5 border-b border-slate-200">
            {isEditing && ed ? (
              <textarea
                value={ed.descripcion}
                rows={4}
                onChange={(e) => setED({ descripcion: e.target.value })}
                placeholder={fx("Descripción de la situación...", "Situation description...")}
                className={inputCls}
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {tr("descripcion", reg.descripcion) || <span className="text-slate-300">{fx("Sin descripción", "No description")}</span>}
              </p>
            )}
          </div>

          {/* ── SECTION 3: Corrección ───────────────────────────────────── */}
          <SecTitle n={3} label={fx("Corrección", "Correction")} />
          <div className="px-4 sm:px-6 py-5 border-b border-slate-200 space-y-4">
            {isEditing && ed ? (
              <>
                {ed.actividadesCorreccion.map((act, ai) => (
                  <div key={ai} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between gap-3 border-b border-slate-200">
                      <span className="text-xs font-bold text-[#105789] uppercase tracking-wide">Actividad {ai + 1}</span>
                      <button
                        onClick={() => setED({ actividadesCorreccion: ed.actividadesCorreccion.filter((_, i) => i !== ai) })}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Eliminar
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className={labelCls}>Actividad</label>
                        <textarea rows={2} value={act.actividad} onChange={(e) => updCorrAct(ai, { actividad: e.target.value })} placeholder="Describe la actividad..." className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Recursos</label>
                        <div className="flex gap-5 mt-1">
                          {RECURSOS_OPTS.map(({ value, icon }) => (
                            <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={act.recursos.includes(value)}
                                onChange={() => toggleRecurso(ai, value)}
                                className="w-4 h-4 accent-[#105789]"
                              />
                              <span>{icon} {recursoLabel(value)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#105789] text-white">
                              {["Nombre", "Cargo", "Horas", "Fecha inicio", "Fecha fin", "Costo estimado", ""].map((h) => (
                                <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {act.responsables.map((r, ri) => (
                              <tr key={ri} className="border-b border-slate-100">
                                <td className="px-2 py-1.5">
                                  <input className="w-32 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789]" value={r.nombre} placeholder="Nombre" onChange={(e) => updCorrResp(ai, ri, { nombre: e.target.value })} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <CargoSelect value={r.cargo} onChange={(v) => updCorrResp(ai, ri, { cargo: v })} cargos={cargosDisponibles} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input type="number" step="any" min="0" className="w-16 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789]" value={r.horas} onChange={(e) => updCorrResp(ai, ri, { horas: parseDecimalInput(e.target.value) })} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input type="date" className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789]" value={r.fechaInicio} onChange={(e) => updCorrResp(ai, ri, { fechaInicio: e.target.value })} />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input type="date" className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789]" value={r.fechaFin} onChange={(e) => updCorrResp(ai, ri, { fechaFin: e.target.value })} />
                                </td>
                                <td className="px-2 py-1.5 font-mono text-slate-700 whitespace-nowrap">
                                  {fmtCOP(calcCosto(r.cargo, Number(r.horas) || 0))}
                                </td>
                                <td className="px-2 py-1.5">
                                  <button onClick={() => updCorrAct(ai, { responsables: act.responsables.filter((_, j) => j !== ri) })} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button onClick={() => updCorrAct(ai, { responsables: [...act.responsables, newCorrResp()] })} className="text-xs text-[#105789] border border-dashed border-[#105789]/40 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors">
                        + Agregar responsable
                      </button>
                      {act.responsables.length > 0 && (
                        <p className="text-xs text-slate-500 text-right">
                          Subtotal corrección: <span className="font-mono font-semibold text-slate-700">{fmtCOP(act.responsables.reduce((s, r) => s + calcCosto(r.cargo, Number(r.horas) || 0), 0))}</span>
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className={labelCls}>Evidencia</label>
                          <EvidenciaUpload
                            value={act.evidencia}
                            onChange={(url) => updCorrAct(ai, { evidencia: url })}
                            maxFiles={3}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Observaciones</label>
                          <input className={inputCls} type="text" placeholder="Observaciones adicionales..."
                            value={act.observaciones} onChange={(e) => updCorrAct(ai, { observaciones: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setED({ actividadesCorreccion: [...ed.actividadesCorreccion, newCorrAct()] })} className="text-sm text-[#105789] border border-dashed border-[#105789]/40 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                  + Agregar actividad de corrección
                </button>
              </>
            ) : (
              data.actividades_correccion.length === 0
                ? <p className="text-sm text-slate-400 italic">{fx("Sin actividades de corrección registradas", "No correction activities registered")}</p>
                : <div className="space-y-4">
                    {data.actividades_correccion.map((act, ai) => (
                      <div key={act.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-start justify-between">
                          <p className="text-sm font-semibold text-slate-800">{tr(`corrAct_${ai}`, act.actividad)}</p>
                          {Array.isArray(act.recursos) && act.recursos.length > 0 && (
                            <span className="text-xs text-slate-500 ml-3 shrink-0">{act.recursos.map((r) => recursoLabel(r)).join(", ")}</span>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-[#105789]/10 border-b border-slate-200">
                                {[fx("Nombre", "Name"), fx("Cargo", "Position"), fx("Horas", "Hours"), fx("Fecha inicio", "Start date"), fx("Fecha fin", "End date"), fx("Costo", "Cost")].map((h) => (
                                  <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {act.responsables.map((r, ri) => (
                                <tr key={ri} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 text-slate-800 font-medium">{r.nombre ?? "—"}</td>
                                  <td className="px-4 py-2 text-slate-600">{cargoLabel(r.cargo)}</td>
                                  <td className="px-4 py-2 text-slate-600">{r.horas}</td>
                                  <td className="px-4 py-2 text-slate-500">{fmtDate(r.fecha_inicio)}</td>
                                  <td className="px-4 py-2 text-slate-500">{fmtDate(r.fecha_fin)}</td>
                                  <td className="px-4 py-2 font-mono text-slate-700">{fmtCOP(calcCosto(r.cargo ?? "", Number(r.horas) || 0))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(act.evidencia || act.observaciones) && (
                          <div className="px-4 py-3 border-t border-slate-100 grid grid-cols-2 gap-4">
                            {parseEvidencias(act.evidencia).length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{fx("Evidencia", "Evidence")}</span>
                                <div className="mt-0.5 space-y-1">
                                  {parseEvidencias(act.evidencia).map((ev, idx) => (
                                    (ev.startsWith("/uploads/") || isAbsoluteUrl(ev)) ? (
                                      <a
                                        key={`${ev}-${idx}`}
                                        href={resolveEvidenceHref(ev)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-[#105789] hover:underline font-medium"
                                      >
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828A4 4 0 0012.172 4L5.586 10.586a6 6 0 008.485 8.485L20 13" /></svg>
                                        {decodeURIComponent(ev.split("/").pop() ?? ev)}
                                      </a>
                                    ) : (
                                      <p key={`${ev}-${idx}`} className="text-sm text-slate-700">{ev}</p>
                                    )
                                  ))}
                                </div>
                              </div>
                            )}
                            {act.observaciones && (
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{fx("Observaciones", "Observations")}</span>
                                <p className="text-sm text-slate-700 mt-0.5">{tr(`corrActObs_${ai}`, act.observaciones)}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
            )}
          </div>

          {/* ── SECTION 4: Causas ───────────────────────────────────────── */}
          <SecTitle n={4} label={fx("Identificación de Causas", "Cause Identification")} />
          <div className="px-4 sm:px-6 py-5 border-b border-slate-200 space-y-4">
            {isEditing && ed ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#105789] mb-3">{fx("Causas Inmediatas", "Immediate Causes")}</p>
                    <div className="space-y-2">
                      {ed.causasInmediatas.map((c, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-xs font-bold text-slate-400 mt-2">{i + 1}.</span>
                          <textarea rows={2} value={c} onChange={(e) => { const arr = [...ed.causasInmediatas]; arr[i] = e.target.value; setED({ causasInmediatas: arr }); }} placeholder="Causa inmediata..." className="flex-1 text-sm border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] resize-none" />
                        </div>
                      ))}
                      <button onClick={() => setED({ causasInmediatas: [...ed.causasInmediatas, ""] })} className="text-xs text-[#105789] hover:underline">+ Agregar causa</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-3">Causas Raíz</p>
                    <div className="space-y-2">
                      {ed.causasRaiz.map((c, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-xs font-bold text-slate-400 mt-2">{i + 1}.</span>
                          <textarea rows={3} value={c} onChange={(e) => { const arr = [...ed.causasRaiz]; arr[i] = e.target.value; setED({ causasRaiz: arr }); }} placeholder="Causa raíz..." className="flex-1 text-sm border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] resize-none" />
                        </div>
                      ))}
                      <button onClick={() => setED({ causasRaiz: [...ed.causasRaiz, ""] })} className="text-xs text-[#105789] hover:underline">+ Agregar causa raíz</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#105789] mb-3">Causas Inmediatas</p>
                    <ol className="space-y-2">
                      {data.causas.inmediatas.map((c, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-xs font-bold text-slate-400 mt-0.5">{i + 1}.</span>
                          <span>{tr(`causaInm_${i}`, c)}</span>
                        </li>
                      ))}
                      {data.causas.inmediatas.length === 0 && <p className="text-slate-400 text-sm italic">{fx("No registradas", "Not registered")}</p>}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-3">{fx("Causas Raíz", "Root Causes")}</p>
                    <ol className="space-y-2">
                      {data.causas.raiz.map((c, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-xs font-bold text-red-400 mt-0.5">{i + 1}.</span>
                          <span>{tr(`causaRaiz_${i}`, c)}</span>
                        </li>
                      ))}
                      {data.causas.raiz.length === 0 && <p className="text-slate-400 text-sm italic">{fx("No registradas", "Not registered")}</p>}
                    </ol>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── SECTION 5: Plan de Acción ───────────────────────────────── */}
          <SecTitle n={5} label={fx("Plan de Acción", "Action Plan")} />
          <div className="px-4 sm:px-6 py-5 border-b border-slate-200 space-y-4">
            {isEditing && ed ? (
              <>
                {ed.actividadesPlan.map((act, ai) => (
                  <div key={ai} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                      <span className="text-xs font-bold text-[#105789] uppercase tracking-wide">Actividad {ai + 1}</span>
                      <button onClick={() => setED({ actividadesPlan: ed.actividadesPlan.filter((_, i) => i !== ai) })} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Eliminar
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className={labelCls}>Actividad a desarrollar</label>
                        <textarea rows={2} value={act.descripcion} onChange={(e) => updPlanAct(ai, { descripcion: e.target.value })} placeholder="Describe la actividad..." className={inputCls} />
                      </div>
                      {allCausas.length > 0 && (
                        <div>
                          <label className={labelCls}>Causas asociadas</label>
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            {allCausas.map(({ label, value }) => (
                              <label key={value} className="flex items-start gap-1.5 text-xs cursor-pointer select-none">
                                <input type="checkbox" checked={act.causasAsociadas.includes(value)} onChange={() => toggleCausa(ai, value)} className="mt-0.5 w-4 h-4 accent-[#105789] shrink-0" />
                                <span className="text-slate-700">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {act.responsables.map((r, ri) => (
                        <div key={ri} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Responsable {ri + 1}</span>
                            <button onClick={() => updPlanAct(ai, { responsables: act.responsables.filter((_, k) => k !== ri) })} className="text-xs text-red-400 hover:text-red-600 font-medium">Eliminar</button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wide">Ejecución</p>
                              <input placeholder="Nombre" value={r.nombreEjecucion} onChange={(e) => updPlanResp(ai, ri, { nombreEjecucion: e.target.value })} className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#105789]" />
                              <CargoSelect value={r.cargoEjecucion} onChange={(v) => updPlanResp(ai, ri, { cargoEjecucion: v })} cargos={cargosDisponibles} />
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-slate-400">Horas</label>
                                  <input type="number" step="any" min="0" value={r.horasEjecucion} onChange={(e) => updPlanResp(ai, ri, { horasEjecucion: parseDecimalInput(e.target.value) })} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789]" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-slate-400">Inicio</label>
                                  <input
                                    type="date"
                                    value={r.fechaInicioEjecucion}
                                    onChange={(e) => updPlanResp(ai, ri, { fechaInicioEjecucion: e.target.value })}
                                    disabled={!canEditExecutionDates}
                                    title={!canEditExecutionDates ? "Solo Admin puede editar esta fecha" : undefined}
                                    className={`w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789] ${!canEditExecutionDates ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-slate-400">Fin</label>
                                  <input
                                    type="date"
                                    value={r.fechaFinEjecucion}
                                    onChange={(e) => updPlanResp(ai, ri, { fechaFinEjecucion: e.target.value })}
                                    disabled={!canEditExecutionDates}
                                    title={!canEditExecutionDates ? "Solo Admin puede editar esta fecha" : undefined}
                                    className={`w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789] ${!canEditExecutionDates ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">Costo estimado: <span className="font-mono font-semibold text-blue-700">{fmtCOP(calcCosto(r.cargoEjecucion, Number(r.horasEjecucion) || 0))}</span></p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wide">Seguimiento</p>
                              <input placeholder="Nombre" value={r.nombreSeguimiento} onChange={(e) => updPlanResp(ai, ri, { nombreSeguimiento: e.target.value })} className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#105789]" />
                              <CargoSelect value={r.cargoSeguimiento} onChange={(v) => updPlanResp(ai, ri, { cargoSeguimiento: v })} cargos={cargosDisponibles} />
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-slate-400">Horas</label>
                                  <input type="number" step="any" min="0" value={r.horasSeguimiento} onChange={(e) => updPlanResp(ai, ri, { horasSeguimiento: parseDecimalInput(e.target.value) })} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789]" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-slate-400">Fecha</label>
                                  <input type="date" value={r.fechaSeguimiento} onChange={(e) => updPlanResp(ai, ri, { fechaSeguimiento: e.target.value })} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789]" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-slate-400">Estado</label>
                                  <select value={r.estadoSeguimiento} onChange={(e) => updPlanResp(ai, ri, { estadoSeguimiento: e.target.value })} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#105789] bg-white">
                                    {ESTADOS_PLAN.map((s) => <option key={s}>{s}</option>)}
                                  </select>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">Costo estimado: <span className="font-mono font-semibold text-emerald-700">{fmtCOP(calcCosto(r.cargoSeguimiento, Number(r.horasSeguimiento) || 0))}</span></p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => updPlanAct(ai, { responsables: [...act.responsables, newPlanResp()] })} className="text-xs text-[#105789] border border-dashed border-[#105789]/40 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors">
                        + Agregar responsable
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className={labelCls}>Evidencia</label>
                          <EvidenciaUpload
                            value={act.evidencia}
                            onChange={(url) => updPlanAct(ai, { evidencia: url })}
                            maxFiles={3}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Observaciones</label>
                          <input className={inputCls} type="text" placeholder="Observaciones adicionales..."
                            value={act.observaciones} onChange={(e) => updPlanAct(ai, { observaciones: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setED({ actividadesPlan: [...ed.actividadesPlan, newPlanAct()] })} className="text-sm text-[#105789] border border-dashed border-[#105789]/40 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                  + Agregar actividad al plan
                </button>
              </>
            ) : (
              data.actividades_plan.length === 0
                ? <p className="text-sm text-slate-400 italic">{fx("Sin actividades en el plan de acción", "No activities in the action plan")}</p>
                : <div className="space-y-4">
                    {data.actividades_plan.map((act, ai) => {
                      const ejec = act.responsables_ejecucion  ?? [];
                      const segu = act.responsables_seguimiento ?? [];
                      return (
                        <div key={act.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <p className="text-sm font-semibold text-slate-800">{tr(`planAct_${ai}`, act.descripcion)}</p>
                            {Array.isArray(act.causas_asociadas) && act.causas_asociadas.length > 0 && (
                              <div className="mt-2.5 border-t border-slate-200 pt-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{fx("Causas asociadas", "Associated causes")}</p>
                                <ul className="space-y-1">
                                  {act.causas_asociadas.map((c, i) => {
                                    let text = c;
                                    let trKey = `planCausa_${ai}_${i}`;
                                    if (c.startsWith("ci-")) {
                                      const idx = parseInt(c.slice(3), 10);
                                      text = data.causas.inmediatas[idx] ?? c;
                                      trKey = `causaInm_${idx}`;
                                    } else if (c.startsWith("cr-")) {
                                      const idx = parseInt(c.slice(3), 10);
                                      text = data.causas.raiz[idx] ?? c;
                                      trKey = `causaRaiz_${idx}`;
                                    }
                                    return (
                                      <li key={i} className="flex gap-2 text-xs text-slate-700">
                                        <span className="shrink-0 w-4 h-4 rounded-full bg-[#105789]/10 text-[#105789] font-bold flex items-center justify-center text-[9px] mt-0.5">{i + 1}</span>
                                        <span className="leading-snug">{tr(trKey, text)}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            <div className="p-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">{fx("Ejecución", "Execution")}</p>
                              <div className="space-y-3">
                                {ejec.map((r, i) => (
                                  <div key={i} className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                    <div><span className="text-slate-400 font-semibold">{fx("Nombre", "Name")}: </span><span className="text-slate-800">{r.nombre ?? "—"}</span></div>
                                    <div><span className="text-slate-400 font-semibold">{fx("Cargo", "Position")}: </span><span className="text-slate-700">{cargoLabel(r.cargo)}</span></div>
                                    <div><span className="text-slate-400 font-semibold">{fx("Horas", "Hours")}: </span><span className="text-slate-700">{r.horas}h</span></div>
                                    <div><span className="text-slate-400 font-semibold">{fx("Costo", "Cost")}: </span><span className="font-mono text-blue-700">{fmtCOP(calcCosto(r.cargo ?? "", Number(r.horas) || 0))}</span></div>
                                    {r.fecha_inicio && (
                                      <div className="col-span-2"><span className="text-slate-400 font-semibold">{fx("Período", "Period")}: </span><span className="text-slate-600">{fmtDate(r.fecha_inicio)} → {fmtDate(r.fecha_fin)}</span></div>
                                    )}
                                  </div>
                                ))}
                                {ejec.length === 0 && <p className="text-xs text-slate-300">—</p>}
                              </div>
                            </div>
                            <div className="p-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">{fx("Seguimiento", "Follow-up")}</p>
                              <div className="space-y-3">
                                {segu.map((r, i) => (
                                  <div key={i} className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                    <div><span className="text-slate-400 font-semibold">{fx("Nombre", "Name")}: </span><span className="text-slate-800">{r.nombre ?? "—"}</span></div>
                                    <div><span className="text-slate-400 font-semibold">{fx("Cargo", "Position")}: </span><span className="text-slate-700">{cargoLabel(r.cargo)}</span></div>
                                    <div><span className="text-slate-400 font-semibold">{fx("Horas", "Hours")}: </span><span className="text-slate-700">{r.horas}h</span></div>
                                    <div><span className="text-slate-400 font-semibold">{fx("Costo", "Cost")}: </span><span className="font-mono text-emerald-700">{fmtCOP(calcCosto(r.cargo ?? "", Number(r.horas) || 0))}</span></div>
                                    <div className="col-span-2 flex items-center gap-1.5"><span className="text-slate-400 font-semibold">{fx("Estado", "Status")}: </span>
                                      <span className={`inline-block font-semibold rounded px-1.5 py-0.5 ${
                                        r.estado === "Completado" ? "bg-emerald-100 text-emerald-700" :
                                        r.estado === "En progreso" ? "bg-blue-100 text-blue-700" :
                                        "bg-amber-100 text-amber-700"
                                      }`}>{estadoLabel(r.estado)}</span>
                                    </div>
                                    {r.fecha_inicio && (
                                      <div className="col-span-2"><span className="text-slate-400 font-semibold">{fx("Fecha", "Date")}: </span><span className="text-slate-600">{fmtDate(r.fecha_inicio)}</span></div>
                                    )}
                                  </div>
                                ))}
                                {segu.length === 0 && <p className="text-xs text-slate-300">—</p>}
                              </div>
                            </div>
                          </div>
                          {(act.evidencia || act.observaciones) && (
                            <div className="px-4 py-3 border-t border-slate-100 grid grid-cols-2 gap-4">
                              {parseEvidencias(act.evidencia).length > 0 && (
                                <div>
                                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{fx("Evidencia", "Evidence")}</span>
                                  <div className="mt-0.5 space-y-1">
                                    {parseEvidencias(act.evidencia).map((ev, idx) => (
                                      (ev.startsWith("/uploads/") || isAbsoluteUrl(ev)) ? (
                                        <a
                                          key={`${ev}-${idx}`}
                                          href={resolveEvidenceHref(ev)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 text-sm text-[#105789] hover:underline font-medium"
                                        >
                                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828A4 4 0 0012.172 4L5.586 10.586a6 6 0 008.485 8.485L20 13" /></svg>
                                          {decodeURIComponent(ev.split("/").pop() ?? ev)}
                                        </a>
                                      ) : (
                                        <p key={`${ev}-${idx}`} className="text-sm text-slate-700">{ev}</p>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )}
                              {act.observaciones && (
                                <div>
                                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{fx("Observaciones", "Observations")}</span>
                                  <p className="text-sm text-slate-700 mt-0.5">{tr(`planActObs_${ai}`, act.observaciones)}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
            )}
          </div>

          {/* ── SECTION 6: Revisión de Eficacia ────────────────────────── */}
          <SecTitle n={6} label={fx("REVISIÓN DE LA EFICACIA DE LAS ACCIONES TOMADAS (Responsable del SGI)", "REVIEW OF THE EFFECTIVENESS OF ACTIONS TAKEN (IMS Responsible)")} />
          <div className="px-4 sm:px-6 py-5 border-b border-slate-200">
            {(() => {
              const PREGUNTAS: { key: keyof Pick<EditData, 'eficaciaAccionAdecuada' | 'eficaciaNoConformidades' | 'eficaciaNuevosRiesgos' | 'eficaciaCambiosSgi'>; label: string }[] = [
                { key: 'eficaciaAccionAdecuada',  label: fx('¿La acción tomada fue adecuada, conveniente y eficaz?', 'Was the action taken adequate, appropriate, and effective?') },
                { key: 'eficaciaNoConformidades', label: fx('¿Existen no conformidades similares o que potencialmente puedan ocurrir?', 'Are there similar nonconformities or potential nonconformities that could occur?') },
                { key: 'eficaciaNuevosRiesgos',   label: fx('¿Es necesario incluir nuevos riesgos?', 'Is it necessary to include new risks?') },
                { key: 'eficaciaCambiosSgi',      label: fx('¿Es necesario realizar cambios en el sistema de gestión integral?', 'Is it necessary to make changes to the integrated management system?') },
              ];
              const DB_KEY_MAP: Record<string, string | null> = {
                eficaciaAccionAdecuada:  reg.eficacia_accion_adecuada,
                eficaciaNoConformidades: reg.eficacia_no_conformidades,
                eficaciaNuevosRiesgos:   reg.eficacia_nuevos_riesgos,
                eficaciaCambiosSgi:      reg.eficacia_cambios_sgi,
              };
              return (
                <div className="space-y-3">
                  {isEditing && ed ? (
                    PREGUNTAS.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg border border-slate-100 bg-slate-50/50">
                        <span className="text-sm text-slate-700 leading-snug flex-1">{label}</span>
                        <div className="flex items-center gap-4 shrink-0">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={key}
                              value="SI"
                              checked={ed[key] === 'SI'}
                              onChange={() => setED({ [key]: 'SI' } as Partial<EditData>)}
                              className="w-4 h-4 accent-[#105789]"
                            />
                            <span className="text-sm font-semibold text-emerald-700">{yesNoLabel("SI")}</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={key}
                              value="NO"
                              checked={ed[key] === 'NO'}
                              onChange={() => setED({ [key]: 'NO' } as Partial<EditData>)}
                              className="w-4 h-4 accent-[#105789]"
                            />
                            <span className="text-sm font-semibold text-red-600">{yesNoLabel("NO")}</span>
                          </label>
                        </div>
                      </div>
                    ))
                  ) : (
                    PREGUNTAS.map(({ key, label }) => {
                      const val = DB_KEY_MAP[key];
                      return (
                        <div key={key} className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg border border-slate-100 bg-slate-50/50">
                          <span className="text-sm text-slate-700 leading-snug flex-1">{label}</span>
                          {val === 'SI' ? (
                            <span className="shrink-0 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-300">{yesNoLabel("SI")}</span>
                          ) : val === 'NO' ? (
                            <span className="shrink-0 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border bg-red-100 text-red-600 border-red-300">{yesNoLabel("NO")}</span>
                          ) : (
                            <span className="shrink-0 text-slate-300 text-sm">—</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── SECTION 7: Costos ───────────────────────────────────────── */}
          <SecTitle n={7} label={fx("Costos Asociados a la ACR", "Costs Associated with the ACR")} />
          <div className="px-4 sm:px-6 py-5">
            {isEditing && ed ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {([
                    [fx("Costo corrección", "Correction cost"),  totalCorreccion      ],
                    [fx("Costo plan acción", "Action plan cost"), totalPlanEjecucion   ],
                    [fx("Costo seguimiento", "Follow-up cost"), totalPlanSeguimiento ],
                  ] as [string, number][]).map(([label, val]) => (
                    <div key={label} className="border border-blue-100 rounded-lg p-3.5 bg-blue-50/50">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1">{label}</p>
                      <p className="text-sm font-mono font-bold text-blue-800">{fmtCOP(val)}</p>
                      <p className="text-[9px] text-blue-400 mt-0.5">{fx("Calculado automáticamente", "Calculated automatically")}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {([
                    [fx("Pérdida de ingresos", "Revenue loss"),    "perdidaIngresos"    ],
                    [fx("Multas / sanciones", "Fines / penalties"),      "multasSanciones"    ],
                    [fx("Otros costos internos", "Other internal costs"),   "otrosCostosInternos"],
                    [fx("Descuentos cliente", "Client discounts"),      "descuentosCliente"  ],
                    [fx("Otros costos", "Other costs"),            "otrosCostos"        ],
                  ] as [string, keyof EditData["costosExtra"]][]).map(([label, key]) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <input
                        type="number" min="0"
                        value={ed.costosExtra[key]}
                        onChange={(e) => setED({ costosExtra: { ...ed.costosExtra, [key]: Number(e.target.value) } })}
                        className={`${inputCls} font-mono`}
                      />
                    </div>
                  ))}
                </div>
                <div className="bg-[#105789] rounded-lg px-5 py-3 flex items-center justify-between">
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-widest">{fx("Total estimado", "Estimated total")}</span>
                  <span className="text-white font-bold font-mono text-lg">{fmtCOP(grandTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  [fx("Costo corrección", "Correction cost"),      totalCorreccionVista      ],
                  [fx("Costo plan acción", "Action plan cost"),     totalPlanEjecucionVista     ],
                  [fx("Costo seguimiento", "Follow-up cost"),     totalPlanSeguimientoVista],
                  [fx("Pérdida de ingresos", "Revenue loss"),   data.costos.perdida_ingresos      ],
                  [fx("Multas / sanciones", "Fines / penalties"),    data.costos.multas_sanciones      ],
                  [fx("Otros costos internos", "Other internal costs"), data.costos.otros_costos_internos ],
                  [fx("Descuentos cliente", "Client discounts"),    data.costos.descuentos_cliente     ],
                  [fx("Otros costos", "Other costs"),          data.costos.otros_costos          ],
                ] as [string, number][]).map(([label, val]) => (
                  <div key={label} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {Number(val) > 0 ? fmtCOP(Number(val)) : <span className="text-slate-300 font-normal">—</span>}
                    </p>
                  </div>
                ))}
                <div
                  className="col-span-2 md:col-span-4 rounded-lg px-5 py-3 flex items-center justify-between mt-2"
                  style={{ backgroundColor: "#105789", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
                >
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-widest">{fx("Costo Total ACR", "Total ACR Cost")}</span>
                  <span className="text-white font-bold font-mono text-lg">
                    {fmtCOP(grandTotalVista)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 8: Cierre de la Acción ─────────────────────────── */}
          <SecTitle n={8} label={fx("CIERRE DE LA ACCIÓN IMPLEMENTADA  (Responsable del SGI)", "ACTION CLOSURE (SGI Responsible)")} />
          <div className="px-4 sm:px-6 py-5">
            {isEditing && ed ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>{fx("Fecha de cierre", "Closure date")}</label>
                  <input
                    type="date"
                    value={ed.fechaCierre}
                    onChange={(e) => setED({ fechaCierre: e.target.value })}
                    disabled={session?.role !== "admin"}
                    title={session?.role !== "admin" ? "Solo Admin puede cerrar ACRs" : undefined}
                    className={`${inputCls} ${session?.role !== "admin" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>{fx("Responsable del cierre", "Closure responsible")}</label>
                  <input
                    type="text"
                    value={ed.responsableCierre}
                    onChange={(e) => setED({ responsableCierre: e.target.value })}
                    placeholder={fx("Nombre de la persona responsable", "Name of responsible person")}
                    disabled={session?.role !== "admin"}
                    title={session?.role !== "admin" ? "Solo Admin puede cerrar ACRs" : undefined}
                    className={`${inputCls} ${session?.role !== "admin" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">{fx("Fecha de cierre", "Closure date")}</p>
                  <p className="text-sm text-slate-800 font-medium">{reg.fecha_cierre ? fmtDate(reg.fecha_cierre) : <span className="text-slate-300">—</span>}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">{fx("Responsable del cierre", "Closure responsible")}</p>
                  <p className="text-sm text-slate-800 font-medium">{reg.responsable_cierre ?? <span className="text-slate-300">—</span>}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-[calc(100%-2rem)] sm:w-96">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Eliminar ACR</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <p className="text-sm text-slate-700">
                  ¿Está seguro que desea eliminar el ACR <strong>{data?.registro.consecutivo}</strong>?
                </p>
                <p className="text-xs text-slate-500">
                  Esta acción es irreversible, pero el registro será archivado en el histórico de ACRs eliminadas para trazabilidad.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Razón de eliminación <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Describa por qué se elimina este ACR..."
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>
                {deleteError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {deleteError}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteReason(""); setDeleteError(null); }}
                  disabled={deletingAcr}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingAcr || !deleteReason.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingAcr && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  )}
                  {deletingAcr ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
