"use client";

import { NavigationGuardProvider } from "@/lib/navigation-guard-context";
import { ReactNode } from "react";

export default function DashboardProvider({ children }: { children: ReactNode }) {
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>;
}
