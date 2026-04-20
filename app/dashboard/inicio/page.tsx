"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

type ModuleKey = "acr" | "gds";
const MODULE_STORAGE_KEY = "sp-active-module";

export default function InicioPage() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(MODULE_STORAGE_KEY) as ModuleKey | null;
    setActiveModule(stored ?? null);
  }, []);

  const handleSelectModule = (module: ModuleKey) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MODULE_STORAGE_KEY, module);
    }
    setActiveModule(module);
    router.push(module === "acr" ? "/dashboard" : "/dashboard/formulario-gds");
  };

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Inicio"
        subtitle="Selecciona el módulo con el que deseas trabajar"
      />

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid gap-5 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => handleSelectModule("acr")}
          className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#105789]/30 hover:shadow-lg cursor-pointer"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#105789]/10 text-[#105789]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Módulo ACR</h2>
          <p className="mt-2 text-sm text-slate-600">
            Accede al dashboard, formulario, historial, análisis y controles relacionados con ACR.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#105789] group-hover:translate-x-1 transition-transform">
            Entrar a ACR →
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectModule("gds")}
          className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-600/30 hover:shadow-lg cursor-pointer"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2a4 4 0 014-4h6m0 0l-3-3m3 3l-3 3M5 3h6a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Módulo GDC</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ingresa al espacio inicial de GDC para empezar a construir el nuevo flujo del módulo.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
            Entrar a GDC →
          </span>
        </button>
        </div>
      </main>
    </div>
  );
}
