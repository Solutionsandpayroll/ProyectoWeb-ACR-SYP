"use client";

import { useEffect, useMemo, useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface SessionData {
  displayName: string;
  role: "admin" | "user";
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
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

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = useMemo(() => {
    if (!session?.displayName) return "?";
    return session.displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [session]);

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* User profile area */}
      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{session?.displayName ?? "Sesión activa"}</p>
            <p className="text-xs text-slate-500">{session?.role === "admin" ? "Administrador" : "Usuario"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
