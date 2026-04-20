"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import { CARGOS_NEW_SCALE } from "@/lib/cargo-scale";
import EvidenciaUpload from "@/components/EvidenciaUpload";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SessionData {
  displayName: string;
  role: "admin" | "user";
}

interface ActividadDB {
  id: number;
  numero: number;
  actividad: string | null;
  fecha: string | null;
  responsables: string | null;
  recursos: string | null;
  impacto: string | null;
  segu_fecha: string | null;
  segu_responsable: string | null;
  segu_evidencia: string | null;
  segu_tiene_riesgos: string | null;
  segu_cuales: string | null;
  segu_nro_accion_mejora: string | null;
}

interface RegistroDB {
  id: number;
  consecutivo: string;
  fecha_documentacion: string;
  proposito: string | null;
  descripcion_cambio: string | null;
  cambio_planeado: string | null;
  tipo_cambio: string | null;
  consecuencias: string | null;
  estado: string;
  created_at: string;
}

interface ActividadEdit {
  actividad: string;
  fecha: string;
  responsables: { nombre: string; cargo: string }[];
  recursos: string[];
  impacto: string;
  seguFecha: string;
  seguResponsable: string;
  seguEvidencia: string;
  seguTieneRiesgos: string;
  seguCuales: string;
  seguNroAccionMejora: string;
}

interface EditState {
  fechaDocumentacion: string;
  proposito: string;
  descripcionCambio: string;
  cambioPlaneado: string;
  tipoCambio: string;
  consecuencias: string;
  estado: string;
  actividades: ActividadEdit[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const toStr = (v: string | null | undefined) => v ?? "";

function parseResponsables(raw: string | null | undefined): { nombre: string; cargo: string }[] {
  if (!raw) return [{ nombre: "", cargo: "" }];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((r: { nombre?: string; cargo?: string }) => ({
        nombre: r.nombre ?? "",
        cargo: r.cargo ?? "",
      }));
    }
    return [{ nombre: raw, cargo: "" }];
  } catch {
    return [{ nombre: raw, cargo: "" }];
  }
}

function parseRecursos(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* not JSON */ }
  return raw.split(", ").filter(Boolean);
}

function dbActToEdit(a: ActividadDB): ActividadEdit {
  return {
    actividad:           toStr(a.actividad),
    fecha:               a.fecha ? a.fecha.slice(0, 10) : "",
    responsables:        parseResponsables(a.responsables),
    recursos:            parseRecursos(a.recursos),
    impacto:             toStr(a.impacto),
    seguFecha:           a.segu_fecha ? a.segu_fecha.slice(0, 10) : "",
    seguResponsable:     toStr(a.segu_responsable),
    seguEvidencia:       toStr(a.segu_evidencia),
    seguTieneRiesgos:    toStr(a.segu_tiene_riesgos),
    seguCuales:          toStr(a.segu_cuales),
    seguNroAccionMejora: toStr(a.segu_nro_accion_mejora),
  };
}

const newActividad = (): ActividadEdit => ({
  actividad: "", fecha: "", responsables: [{ nombre: "", cargo: "" }], recursos: [], impacto: "",
  seguFecha: "", seguResponsable: "", seguEvidencia: "",
  seguTieneRiesgos: "", seguCuales: "", seguNroAccionMejora: "",
});

// ─── Style constants ────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789] bg-white transition";
const labelCls = "block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1";

// ─── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Abierta:          "bg-amber-100 text-amber-700 border-amber-200",
    "En seguimiento": "bg-blue-100 text-blue-700 border-blue-200",
    Cerrada:          "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

function SectionCard({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <span className="shrink-0 text-xs font-bold text-white bg-[#105789] rounded px-2 py-0.5">{number}</span>
        <h3 className="font-bold text-xs uppercase tracking-widest text-[#105789]">{title}</h3>
      </div>
      <div className="px-4 sm:px-6 py-5">{children}</div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-sm text-slate-800 font-medium leading-snug">
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

const parseEvidencias = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.flatMap((v): string[] => {
        if (typeof v === "string" && v.trim()) return [v];
        if (typeof v === "object" && v !== null && "u" in v) {
          const u = (v as { u?: unknown }).u;
          if (typeof u === "string" && u.trim()) return [u];
        }
        return [];
      });
    }
  } catch {
    // Legacy format (single string)
  }
  return value.trim() ? [value] : [];
};

const getEvidenciaName = (url: string, rawValue: string | null | undefined): string => {
  if (rawValue) {
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "object" && item !== null && "u" in item && (item as { u: string }).u === url) {
            const n = (item as { u: string; n?: string }).n;
            if (n?.trim()) return n;
          }
        }
      }
    } catch {}
  }
  const raw = decodeURIComponent(url.split("/").pop() ?? url);
  const extMatch = raw.match(/(\.[^.]+)$/);
  const ext = extMatch?.[1] ?? "";
  let base = raw.slice(0, raw.length - ext.length);
  base = base.replace(/-[A-Za-z0-9]{15,}$/, "");
  base = base.replace(/^\d{10,14}_/, "");
  base = base.replace(/_+/g, " ").trim();
  return (base + ext) || raw;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveEvidenceHref = (evidencia: string): string => {
  if (isAbsoluteUrl(evidencia)) {
    return `/api/evidencias/download?url=${encodeURIComponent(evidencia)}`;
  }
  return evidencia;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function GdsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id as string;

  const [registro,    setRegistro]    = useState<RegistroDB | null>(null);
  const [actividades, setActividades] = useState<ActividadDB[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  const [isEditing,  setIsEditing]  = useState(false);
  const [edit,       setEdit]       = useState<EditState | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason,    setDeleteReason]    = useState("");
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);

  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isExitModalMounted,   setIsExitModalMounted]   = useState(false);
  const [isExitModalVisible,   setIsExitModalVisible]   = useState(false);
  const [pendingExitAction,    setPendingExitAction]    = useState<"back" | "cancel" | null>(null);
  const [initialEdit,          setInitialEdit]          = useState<EditState | null>(null);
  const [session,              setSession]              = useState<SessionData | null>(null);

  const isAdmin = session?.role === "admin";

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res  = await fetch(`/api/gds/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Error al cargar el registro");
        setRegistro(json.registro);
        setActividades(json.actividades ?? []);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setSession(json.session ?? null);
      } catch {
        if (!cancelled) setSession(null);
      }
    };
    void fetchSession();
    return () => { cancelled = true; };
  }, []);

  // ── Edit ─────────────────────────────────────────────────────────────────
  const startEditing = () => {
    if (!registro) return;
    const editState: EditState = {
      fechaDocumentacion: registro.fecha_documentacion.slice(0, 10),
      proposito:          toStr(registro.proposito),
      descripcionCambio:  toStr(registro.descripcion_cambio),
      cambioPlaneado:     toStr(registro.cambio_planeado),
      tipoCambio:         toStr(registro.tipo_cambio),
      consecuencias:      toStr(registro.consecuencias),
      estado:             registro.estado,
      actividades:        actividades.length > 0 ? actividades.map(dbActToEdit) : [newActividad()],
    };
    setEdit(editState);
    setInitialEdit(JSON.parse(JSON.stringify(editState)));
    setSaveOk(false);
    setSaveError(null);
    setIsEditing(true);
  };

  const setField = (key: keyof Omit<EditState, "actividades">, val: string) =>
    setEdit((p) => p ? { ...p, [key]: val } : p);

  const setActField = (i: number, key: keyof Omit<ActividadEdit, "responsables" | "recursos">, val: string) =>
    setEdit((p) => {
      if (!p) return p;
      return { ...p, actividades: p.actividades.map((a, idx) => idx === i ? { ...a, [key]: val } : a) };
    });

  const addActResponsable = (actIdx: number) =>
    setEdit((p) => {
      if (!p) return p;
      return {
        ...p,
        actividades: p.actividades.map((a, i) =>
          i === actIdx
            ? { ...a, responsables: [...a.responsables, { nombre: "", cargo: "" }] }
            : a
        ),
      };
    });

  const removeActResponsable = (actIdx: number, respIdx: number) =>
    setEdit((p) => {
      if (!p) return p;
      return {
        ...p,
        actividades: p.actividades.map((a, i) =>
          i === actIdx
            ? { ...a, responsables: a.responsables.filter((_, j) => j !== respIdx) }
            : a
        ),
      };
    });

  const updateActResponsable = (actIdx: number, respIdx: number, key: "nombre" | "cargo", val: string) =>
    setEdit((p) => {
      if (!p) return p;
      return {
        ...p,
        actividades: p.actividades.map((a, i) =>
          i === actIdx
            ? {
                ...a,
                responsables: a.responsables.map((r, j) =>
                  j === respIdx ? { ...r, [key]: val } : r
                ),
              }
            : a
        ),
      };
    });

  const addAct = () =>
    setEdit((p) => p ? { ...p, actividades: [...p.actividades, newActividad()] } : p);

  const removeAct = (i: number) =>
    setEdit((p) => {
      if (!p || p.actividades.length <= 1) return p;
      return { ...p, actividades: p.actividades.filter((_, idx) => idx !== i) };
    });

  const handleSave = async () => {
    if (!edit) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const res = await fetch(`/api/gds/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaDocumentacion: edit.fechaDocumentacion,
          proposito:          edit.proposito || null,
          descripcionCambio:  edit.descripcionCambio || null,
          cambioPlaneado:     edit.cambioPlaneado || null,
          tipoCambio:         edit.tipoCambio || null,
          consecuencias:      edit.consecuencias || null,
          estado:             edit.estado,
          actividades:        edit.actividades.map((a) => {
            const filled = a.responsables.filter((r) => r.nombre.trim() || r.cargo.trim());
            return { ...a, responsables: filled.length > 0 ? JSON.stringify(filled) : null, recursos: a.recursos.join(", ") || null };
          }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      const refetch     = await fetch(`/api/gds/${id}`);
      const refetchJson = await refetch.json();
      setRegistro(refetchJson.registro);
      setActividades(refetchJson.actividades ?? []);
      setIsEditing(false);
      setInitialEdit(null);
      setSaveOk(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  // ── Exit modal helpers ───────────────────────────────────────────────────
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing || !edit || !initialEdit) return false;
    return JSON.stringify(edit) !== JSON.stringify(initialEdit);
  }, [isEditing, edit, initialEdit]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (showExitConfirmModal) {
      setIsExitModalMounted(true);
      requestAnimationFrame(() => setIsExitModalVisible(true));
    } else if (isExitModalMounted) {
      setIsExitModalVisible(false);
      timeoutId = setTimeout(() => setIsExitModalMounted(false), 200);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [showExitConfirmModal, isExitModalMounted]);

  const closeEditMode = () => {
    setIsEditing(false);
    setSaveError(null);
    setInitialEdit(null);
    setShowExitConfirmModal(false);
    setPendingExitAction(null);
  };

  const requestExit = (action: "back" | "cancel") => {
    if (isEditing && hasUnsavedChanges) {
      setPendingExitAction(action);
      setShowExitConfirmModal(true);
      return;
    }
    if (action === "cancel") { closeEditMode(); return; }
    router.back();
  };

  const handleExitWithoutSaving = () => {
    if (pendingExitAction === "cancel") { closeEditMode(); return; }
    setShowExitConfirmModal(false);
    setPendingExitAction(null);
    router.back();
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    if (!saveError) {
      if (pendingExitAction === "back") router.back();
      setShowExitConfirmModal(false);
      setPendingExitAction(null);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteReason.trim()) { setDeleteError("Debes indicar la razón de eliminación."); return; }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/gds/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razonEliminacion: deleteReason.trim() }),
      });
      if (!res.ok) throw new Error("Error al eliminar el registro");
      setShowDeleteModal(false);
      setTimeout(() => router.push("/dashboard/historial-gds"), 800);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Cargando…" subtitle="Obteniendo registro GDC" />
        <main className="flex-1 p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm h-32 animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  if (fetchError || !registro) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Error" subtitle="No se pudo cargar el registro" />
        <main className="flex-1 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {fetchError ?? "Registro no encontrado"}
          </div>
          <button onClick={() => router.back()} className="mt-4 text-sm text-[#105789] hover:underline font-medium">
            ← Volver al historial
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="no-print">
        <Header
          title={`Registro GDC #${registro.consecutivo}`}
          subtitle={`Documentado el ${fmtDate(registro.fecha_documentacion)}`}
        />
      </div>

      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="no-print flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => requestExit("back")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#105789] transition font-medium cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al historial
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {saveOk && !isEditing && (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                ✓ Cambios guardados
              </span>
            )}

            {!isEditing ? (
              <>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-white text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar a PDF
                </button>
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 bg-[#105789] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0d4570] transition shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar GDC
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar GDC
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => requestExit("cancel")}
                  disabled={saving}
                  className="text-sm font-semibold text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#105789] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0d4570] transition shadow-sm disabled:opacity-60"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
              </>
            )}
          </div>
        </div>

        {saveError && (
          <div className="no-print px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {saveError}
          </div>
        )}

        {/* ════════════════════════ DOCUMENT (view + print) ════════════════ */}
        <div id="gds-document" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print:overflow-visible print:shadow-none print:border-none">

          {/* Document header — same style as ACR */}
          <div
            className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ backgroundColor: "#105789", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Image
                src="/Titulo_empresa_v2.png"
                alt="Logo"
                width={180}
                height={64}
                className="object-contain w-36 sm:w-45"
                unoptimized
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <div className="hidden sm:block w-px h-10 bg-white/20" />
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">
                  Gestión del Cambio · GIN · V04
                </p>
                <p className="text-white font-bold text-xl font-mono">{registro.consecutivo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <StatusBadge status={registro.estado} />
              <span className="text-white/60 text-xs">
                Creado: {fmtDate(registro.created_at)}
              </span>
            </div>
          </div>

          {/* ════════════════════════════════════ VIEW MODE ════════════════ */}
          {!isEditing && (
            <>
              <SectionCard number="1" title="Información General">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <ReadField label="Consecutivo"            value={registro.consecutivo} />
                  <ReadField label="Fecha documentación"    value={fmtDate(registro.fecha_documentacion)} />
                  <ReadField label="Estado"                 value={registro.estado} />
                  <ReadField label="¿Cambio planeado?"      value={registro.cambio_planeado} />
                  <ReadField label="Tipo de cambio"         value={registro.tipo_cambio} />
                  <ReadField label="Propósito"              value={registro.proposito} />
                  <ReadField label="Descripción del cambio" value={registro.descripcion_cambio} />
                  <ReadField label="Consecuencias"          value={registro.consecuencias} />
                </div>
              </SectionCard>

              <SectionCard number="2" title="Plan de Acción y Seguimiento">
                {actividades.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No hay actividades registradas.</p>
                ) : (
                  <div className="space-y-5">
                    {actividades.map((a, i) => (
                      <div key={a.id} className="rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                          <span className="text-xs font-bold text-white bg-[#105789] rounded px-2 py-0.5">{i + 1}</span>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Actividad</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <ReadField label="Actividad"   value={a.actividad} />
                          <ReadField label="Fecha"        value={fmtDate(a.fecha)} />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Responsables</span>
                            {(() => {
                              const resp = parseResponsables(a.responsables).filter(r => r.nombre || r.cargo);
                              if (resp.length === 0) return <span className="text-sm text-slate-300 font-medium">—</span>;
                              return (
                                <div className="space-y-0.5">
                                  {resp.map((r, ri) => (
                                    <div key={ri} className="text-sm text-slate-800 font-medium leading-snug">
                                      {r.nombre || "—"}
                                      {r.cargo && <span className="text-xs text-slate-500 font-normal"> · {r.cargo}</span>}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                          <ReadField label="Recursos"     value={a.recursos} />
                          <ReadField label="Impacto"      value={a.impacto} />
                        </div>
                        <div className="border-t border-slate-100 bg-blue-50/40 px-4 py-3">
                          <p className="text-[10px] font-bold text-[#105789] uppercase tracking-widest mb-3">Seguimiento al Plan</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ReadField label="Fecha seguimiento"   value={fmtDate(a.segu_fecha)} />
                            <ReadField label="Responsable"          value={a.segu_responsable} />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Evidencia</span>
                              {parseEvidencias(a.segu_evidencia).length > 0 ? (
                                <div className="space-y-1">
                                  {parseEvidencias(a.segu_evidencia).map((ev, idx) => (
                                    (ev.startsWith("/uploads/") || isAbsoluteUrl(ev)) ? (
                                      <a
                                        key={`${ev}-${idx}`}
                                        href={resolveEvidenceHref(ev)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-[#105789] hover:underline font-medium"
                                      >
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828A4 4 0 0012.172 4L5.586 10.586a6 6 0 008.485 8.485L20 13" /></svg>
                                        {getEvidenciaName(ev, a.segu_evidencia)}
                                      </a>
                                    ) : (
                                      <p key={`${ev}-${idx}`} className="text-sm text-slate-800 font-medium">{ev}</p>
                                    )
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </div>
                            <ReadField label="¿Tiene riesgos?"      value={a.segu_tiene_riesgos} />
                            <ReadField label="¿Cuáles riesgos?"     value={a.segu_cuales} />
                            <ReadField label="N.º Acción de mejora" value={a.segu_nro_accion_mejora} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* ════════════════════════════════════ EDIT MODE ════════════════ */}
          {isEditing && edit && (
            <>
              <SectionCard number="1" title="Información General">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Fecha documentación</label>
                    <input type="date" className={inputCls} value={edit.fechaDocumentacion}
                      onChange={(e) => setField("fechaDocumentacion", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Estado</label>
                    <select className={inputCls} value={edit.estado}
                      onChange={(e) => setField("estado", e.target.value)}>
                      <option>Abierta</option>
                      <option>Cerrada</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>¿Cambio planeado?</label>
                    <select className={inputCls} value={edit.cambioPlaneado}
                      onChange={(e) => setField("cambioPlaneado", e.target.value)}>
                      <option value="">Seleccionar…</option>
                      <option>Sí</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tipo de cambio</label>
                    <select className={inputCls} value={edit.tipoCambio}
                      onChange={(e) => setField("tipoCambio", e.target.value)}>
                      <option value="">Seleccionar…</option>
                      <option>Interno</option>
                      <option>Externo</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Propósito</label>
                    <textarea rows={2} className={inputCls} value={edit.proposito}
                      onChange={(e) => setField("proposito", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Descripción del cambio</label>
                    <textarea rows={2} className={inputCls} value={edit.descripcionCambio}
                      onChange={(e) => setField("descripcionCambio", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Consecuencias</label>
                    <textarea rows={2} className={inputCls} value={edit.consecuencias}
                      onChange={(e) => setField("consecuencias", e.target.value)} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard number="2" title="Plan de Acción y Seguimiento">
                <div className="space-y-5">
                  {edit.actividades.map((a, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white bg-[#105789] rounded px-2 py-0.5">{i + 1}</span>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Actividad</span>
                        </div>
                        {edit.actividades.length > 1 && (
                          <button type="button" onClick={() => removeAct(i)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">
                            Eliminar
                          </button>
                        )}
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Actividad</label>
                          <input type="text" className={inputCls} value={a.actividad}
                            onChange={(e) => setActField(i, "actividad", e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>
                            Fecha
                            {!isAdmin && <span className="ml-1 text-[9px] text-slate-400 font-normal normal-case tracking-normal">(solo admin)</span>}
                          </label>
                          <input type="date" className={inputCls + (!isAdmin ? " opacity-60 cursor-not-allowed" : "")} value={a.fecha}
                            disabled={!isAdmin}
                            onChange={(e) => setActField(i, "fecha", e.target.value)} />
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
                              const checked = a.recursos.includes(op);
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
                                        ? [...a.recursos, op]
                                        : a.recursos.filter((r) => r !== op);
                                      setEdit((p) => p ? {
                                        ...p,
                                        actividades: p.actividades.map((act, idx) =>
                                          idx === i ? { ...act, recursos: next } : act
                                        ),
                                      } : p);
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
                          <label className={labelCls}>Nivel de impacto</label>
                          <select className={inputCls} value={a.impacto}
                            onChange={(e) => setActField(i, "impacto", e.target.value)}>
                            <option value="">Seleccionar…</option>
                            <option>Alto</option>
                            <option>Medio</option>
                            <option>Bajo</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={labelCls}>Responsables</label>
                            <button
                              type="button"
                              onClick={() => addActResponsable(i)}
                              disabled={a.responsables.length >= 5}
                              className="text-[11px] font-medium text-[#105789] hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              + Agregar responsable
                            </button>
                          </div>
                          <div className="space-y-2">
                            {a.responsables.map((r, ri) => (
                              <div key={ri} className="flex gap-2 items-end">
                                <div className="flex-1">
                                  {ri === 0 && <p className="text-[10px] font-medium text-slate-400 mb-1">Nombre</p>}
                                  <input type="text" className={inputCls} placeholder="Nombre del responsable..."
                                    value={r.nombre}
                                    onChange={(e) => updateActResponsable(i, ri, "nombre", e.target.value)} />
                                </div>
                                <div className="flex-1">
                                  {ri === 0 && <p className="text-[10px] font-medium text-slate-400 mb-1">Cargo / Rol</p>}
                                  <select className={inputCls} value={r.cargo}
                                    onChange={(e) => updateActResponsable(i, ri, "cargo", e.target.value)}>
                                    <option value="">Seleccionar cargo...</option>
                                    {CARGOS_NEW_SCALE.map((c) => (
                                      <option key={c.cargo} value={c.cargo}>{c.cargo}</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeActResponsable(i, ri)}
                                  disabled={a.responsables.length === 1}
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
                      <div className="border-t border-slate-100 bg-blue-50/40 px-4 py-4">
                        <p className="text-[10px] font-bold text-[#105789] uppercase tracking-widest mb-3">Seguimiento al Plan</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className={labelCls}>
                              Fecha seguimiento
                              {!isAdmin && !!(initialEdit?.actividades[i]?.seguFecha) && (
                                <span className="ml-1 text-[9px] text-slate-400 font-normal normal-case tracking-normal">(solo admin)</span>
                              )}
                            </label>
                            <input
                              type="date"
                              className={inputCls + (!isAdmin && !!(initialEdit?.actividades[i]?.seguFecha) ? " opacity-60 cursor-not-allowed" : "")}
                              value={a.seguFecha}
                              disabled={!isAdmin && !!(initialEdit?.actividades[i]?.seguFecha)}
                              onChange={(e) => setActField(i, "seguFecha", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Responsable</label>
                            <input type="text" className={inputCls} value={a.seguResponsable}
                              onChange={(e) => setActField(i, "seguResponsable", e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>Evidencia</label>
                            <EvidenciaUpload
                              value={a.seguEvidencia}
                              onChange={(url) => setActField(i, "seguEvidencia", url)}
                              maxFiles={5}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>¿Tiene riesgos?</label>
                            <select className={inputCls} value={a.seguTieneRiesgos}
                              onChange={(e) => setActField(i, "seguTieneRiesgos", e.target.value)}>
                              <option value="">Seleccionar…</option>
                              <option>Sí</option>
                              <option>No</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>¿Cuáles riesgos?</label>
                            <input type="text" className={inputCls} value={a.seguCuales}
                              onChange={(e) => setActField(i, "seguCuales", e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>N.º Acción de mejora</label>
                            <input type="text" className={inputCls} value={a.seguNroAccionMejora}
                              onChange={(e) => setActField(i, "seguNroAccionMejora", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addAct} disabled={edit.actividades.length >= 20}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-[#105789] hover:text-[#105789] transition disabled:opacity-40">
                    + Agregar actividad
                  </button>
                </div>
              </SectionCard>
            </>
          )}

        </div>{/* end #gds-document */}

      </main>

      {/* ════════════════════════ Delete Modal ════════════════════════════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-[calc(100%-2rem)] sm:w-96">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Eliminar GDC</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-slate-700">
                ¿Está seguro que desea eliminar el registro GDC <strong>{registro.consecutivo}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                Esta acción es irreversible, pero el registro será archivado en el histórico de GDC eliminadas para trazabilidad.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razón de eliminación <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Describa por qué se elimina este registro GDC..."
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
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !deleteReason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                )}
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════ Exit Confirm Modal ════════════════════════ */}
      {isExitModalMounted && (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isExitModalVisible ? "opacity-100" : "opacity-0"}`}>
          <div className={`bg-white rounded-2xl shadow-2xl max-w-xl w-[95vw] transition-all duration-200 ${isExitModalVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1"}`}>
            <div className="px-8 py-5 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Cambios sin guardar</h2>
              </div>
            </div>
            <div className="px-8 py-6">
              <p className="text-slate-600 text-base leading-relaxed">
                Tiene cambios pendientes que no han sido guardados. Por favor, seleccione una opción para continuar.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-slate-600">Los cambios no guardados se perderán si sale sin guardar</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
              <div className="flex gap-3 justify-end flex-nowrap">
                <button
                  onClick={() => { setShowExitConfirmModal(false); setPendingExitAction(null); }}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  Seguir editando
                </button>
                <button
                  onClick={handleExitWithoutSaving}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                  Salir sin guardar
                </button>
                <button
                  onClick={handleSaveAndExit}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#105789] rounded-lg hover:bg-[#0d4570] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#105789] focus:ring-offset-2"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
                  Guardar y salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
