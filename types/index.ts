// ──────────────────────────────────────────────────
// Domain Types – Solutions & Payroll / Sistema ACR
// ──────────────────────────────────────────────────

export type AcrStatus = "Abierta" | "Cerrada";

export type UserRole = "admin" | "usuario";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AcrRecord {
  id: string;
  title: string;
  description: string;
  responsible: string;
  amount: number;
  status: AcrStatus;
  date: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalAcr: number;
  openAcr: number;
  closedAcr: number;
  totalEconomicImpact: number;
}

// API response wrappers (ready for future Neon integration)
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
