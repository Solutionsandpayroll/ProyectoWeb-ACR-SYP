"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Formulario ACR",
    href: "/dashboard/formulario-acr",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Historial ACR",
    href: "/dashboard/historial-acr",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: "Panel de Análisis",
    href: "/dashboard/panel-analisis",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Control de Acciones",
    href: "/dashboard/control-acciones",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        @keyframes sidebarFadeIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes navItemIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(59,130,246,0.5); }
          50%       { box-shadow: 0 0 14px rgba(59,130,246,0.9); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .sidebar-root {
          animation: sidebarFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nav-item {
          animation: navItemIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, background, color;
        }
        .nav-item:nth-child(1) { animation-delay: 0.06s; }
        .nav-item:nth-child(2) { animation-delay: 0.10s; }
        .nav-item:nth-child(3) { animation-delay: 0.14s; }
        .nav-item:nth-child(4) { animation-delay: 0.18s; }
        .nav-item:nth-child(5) { animation-delay: 0.22s; }

        .active-pill {
          animation: pulseGlow 2.6s ease-in-out infinite;
        }
        .brand-divider {
          position: relative;
          overflow: hidden;
        }
        .brand-divider::after {
          content: '';
          position: absolute;
          bottom: 0; left: -60%; right: -60%;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(59,130,246,0.25) 30%,
            rgba(148,163,184,0.12) 50%,
            rgba(59,130,246,0.25) 70%,
            transparent 100%
          );
          background-size: 200% auto;
          animation: shimmer 4s linear infinite;
        }
        .nav-icon {
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.18s ease;
        }
        .nav-item:hover .nav-icon {
          transform: scale(1.15);
        }
        .logout-btn {
          transition: background 0.2s ease, color 0.2s ease, transform 0.18s ease;
        }
        .logout-btn:hover {
          transform: translateX(2px);
        }
        .section-label {
          animation: navItemIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both;
        }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <aside
        className="sidebar-root fixed inset-y-0 left-0 w-72 flex flex-col z-10"
        style={{
          background: "linear-gradient(175deg, #0f172a 0%, #0b1120 60%, #0c1628 100%)",
          borderRight: "1px solid rgba(255,255,255,0.045)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.5), 1px 0 0 rgba(59,130,246,0.04)",
        }}
      >
        {/* Subtle background texture */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(59,130,246,0.055) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Brand */}
        <div
          className="brand-divider flex items-center justify-center px-4 py-3 relative"
        >
          <Image
            src="/Titulo_empresa_v2.png"
            alt="Solutions & Payroll"
            width={180}
            height={64}
            className="object-contain w-full h-auto"
            priority
          />
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-3 py-5 overflow-y-auto relative"
          style={{ scrollbarWidth: "none" }}
        >
          <p
            className="section-label text-[10px] font-semibold uppercase px-3 mb-3"
            style={{
              color: "rgba(148,163,184,0.35)",
              letterSpacing: "0.18em",
            }}
          >
            Gestión ACR
          </p>

          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const hovered = hoveredHref === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium"
                  style={{
                    color: active
                      ? "#e2e8f0"
                      : hovered
                      ? "rgba(226,232,240,0.88)"
                      : "rgba(148,163,184,0.65)",
                    background: active
                      ? "rgba(59,130,246,0.11)"
                      : hovered
                      ? "rgba(255,255,255,0.045)"
                      : "transparent",
                    transition: "background 0.2s ease, color 0.2s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={() => setHoveredHref(item.href)}
                  onMouseLeave={() => setHoveredHref(null)}
                >
                  {/* Active left bar */}
                  <span
                    className={active ? "active-pill" : ""}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: active ? "58%" : "0%",
                      background: "linear-gradient(180deg, #60a5fa, #3b82f6)",
                      borderRadius: "0 3px 3px 0",
                      transition: "height 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      opacity: active ? 1 : 0,
                    }}
                  />

                  {/* Hover left bar */}
                  {!active && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "2px",
                        height: hovered ? "40%" : "0%",
                        background: "rgba(148,163,184,0.3)",
                        borderRadius: "0 2px 2px 0",
                        transition: "height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    />
                  )}

                  {/* Icon */}
                  <span
                    className="nav-icon shrink-0 flex items-center"
                    style={{
                      color: active ? "#60a5fa" : hovered ? "rgba(148,163,184,0.9)" : "inherit",
                    }}
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span style={{ lineHeight: 1, letterSpacing: "0.01em" }}>
                    {item.label}
                  </span>

                  {/* Active dot indicator (top-right) */}
                  {active && (
                    <span
                      style={{
                        marginLeft: "auto",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#3b82f6",
                        boxShadow: "0 0 6px rgba(59,130,246,0.7)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-3 relative"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Link
            href="/login"
            className="logout-btn flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px]"
            style={{
              color: "rgba(148,163,184,0.45)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)";
              (e.currentTarget as HTMLElement).style.color = "rgba(252,165,165,0.85)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.45)";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4.25 w-4.25 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ transition: "transform 0.2s ease" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar sesión</span>
          </Link>
        </div>
      </aside>
    </>
  );
}