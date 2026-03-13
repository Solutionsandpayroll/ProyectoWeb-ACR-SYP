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
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* User profile area */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200"></div>

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
