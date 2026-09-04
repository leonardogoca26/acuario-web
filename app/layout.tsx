import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Acuario Puyehue | Sistema de Gestión y Control",
  description: "Plataforma operativa y financiera - Acuario Puyehue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}