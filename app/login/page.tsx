"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scaleX(0); transform-origin: left; }
          to   { opacity: 1; transform: scaleX(1); transform-origin: left; }
        }
        .anim       { animation: fadeUp  0.75s cubic-bezier(.22,.68,0,1.1) both; }
        .anim-left  { animation: fadeLeft 0.8s cubic-bezier(.22,.68,0,1.1) both; }
        .anim-line  { animation: scaleIn 0.7s cubic-bezier(.22,.68,0,1.1) both; }
        .anim-panel { animation: fadeIn  0.9s ease both; }
        .btn-login:not(:disabled):hover {
          filter: brightness(1.12);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(13,63,110,0.38);
        }
        .btn-login:not(:disabled):active {
          transform: scale(0.97) translateY(0);
          box-shadow: 0 2px 8px rgba(13,63,110,0.25);
        }
      `}</style>
      {/* ── Left panel — brand ── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden anim-panel"
        style={{ background: "linear-gradient(160deg, #0d3f6e 0%, #0a2d50 60%, #071e38 100%)" }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
        {/* Glow circles */}
        <div
          className="absolute -bottom-32 -right-32 w-120 h-120 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #4a9fd4 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-20 -left-20 w-64 h-64 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #4a9fd4 0%, transparent 70%)" }}
        />

        {/* Logo + name */}
        <div className="relative flex items-center gap-3 anim-left" style={{ animationDelay: "0.1s" }}>
          <Image
            src="/Logo_syp_original.png"
            alt="Solutions & Payroll"
            width={38}
            height={38}
            className="object-contain brightness-0 invert opacity-90"
            priority
          />
          <span className="text-white/80 text-sm font-semibold tracking-widest uppercase">
            Solutions &amp; Payroll
          </span>
        </div>

        {/* Tagline */}
        <div className="relative space-y-5">
          <div className="w-10 h-0.5 bg-[#4a9fd4] anim-line" style={{ animationDelay: "0.25s" }} />
          <h2 className="anim-left" style={{ animationDelay: "0.35s" }}>
            <span className="block text-white/80 text-3xl font-light leading-tight tracking-tight">
              Gestión de
            </span>
            <span className="block text-white text-4xl font-bold leading-tight tracking-tight">
              Análisis de Causa<br />Raíz (ACR)
            </span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm anim-left" style={{ animationDelay: "0.5s" }}>
            Plataforma integral para la identificación, análisis y seguimiento de incidentes.
          </p>
        </div>

        {/* Trust badges */}
        <div className="relative flex items-center gap-6 anim" style={{ animationDelay: "0.65s" }}>
          {[
            { label: "Seguridad", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            { label: "Escalable", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
            { label: "Confiable", icon: "M5 13l4 4L19 7" },
          ].map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#4a9fd4]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              <span className="text-white/40 text-xs tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <Image
            src="/Logo_syp_original.png"
            alt="Solutions & Payroll"
            width={52}
            height={52}
            className="object-contain mb-3"
            priority
          />
          <p className="text-slate-500 text-xs font-medium tracking-widest uppercase">
            Solutions &amp; Payroll
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 anim" style={{ animationDelay: "0.05s" }}>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Bienvenido</h1>
            <p className="text-slate-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5 anim" style={{ animationDelay: "0.15s" }}>
              <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3f6e]/20 focus:border-[#0d3f6e] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 anim" style={{ animationDelay: "0.25s" }}>
              <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3f6e]/20 focus:border-[#0d3f6e] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between anim" style={{ animationDelay: "0.35s" }}>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-[#0d3f6e]" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Recordarme</span>
              </label>
              <button type="button" className="text-xs text-[#0d3f6e] hover:text-[#0a2d50] font-medium hover:underline transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-login anim w-full mt-2 py-3 px-4 rounded-xl text-white text-sm font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#0d3f6e]/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{
                animationDelay: "0.45s",
                background: isLoading
                  ? "#5a94b8"
                  : "linear-gradient(135deg, #1569a8 0%, #0d3f6e 100%)",
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-300 mt-10">
            © {new Date().getFullYear()} Solutions &amp; Payroll — Uso exclusivo interno
          </p>
        </div>
      </div>
    </div>
  );
}