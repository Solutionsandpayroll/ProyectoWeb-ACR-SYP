import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solutions & Payroll — Sistema ACR",
  description: "Sistema interno de gestión de Acciones Correctivas y de Mejora",
  icons: {
    icon: "/Logo_syp_original.png",
    apple: "/Logo_syp_original.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
