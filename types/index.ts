// ──────────────────────────────────────────────────
// Domain Types – Solutions & Payroll / Sistema ACR
// ──────────────────────────────────────────────────

export type AcrStatus = "Abierta" | "Cerrada" | "Parcial";

export type UserRole = "admin" | "usuario";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Shape returned by GET /api/acr */
export interface AcrRecord {
  id: number;
  consecutivo: string;
  fuente: string;
  proceso: string;
  cliente: string | null;
  fecha_apertura: string;
  fecha_limite: string | null;
  tipo_accion: string;
  evaluacion_riesgo: string | null;
  descripcion: string | null;
  estado: AcrStatus;
  created_at: string;
  costo_total: number;
}

export interface DashboardStats {
  totalAcr: number;
  openAcr: number;
  closedAcr: number;
  totalEconomicImpact: number;
}

// API response wrappers
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
