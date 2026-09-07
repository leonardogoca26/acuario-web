'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Ticket, 
  Users, 
  Receipt, 
  BarChart3, 
  ArrowRight
} from 'lucide-react';

export default function HomeMenuPage() {
  const modulos = [
    {
      titulo: 'Boletería Diaria',
      badge: 'CAJA & MESÓN',
      badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-800',
      icono: Ticket,
      colorIconoBg: 'bg-sky-500',
      descripcion: 'Arqueo de turnos, venta general de mesón, folios correlativos y cuadre por medio de pago.',
      href: '/boleteria',
      hoverBorder: 'hover:border-sky-500/60 hover:shadow-sky-500/10'
    },
    {
      titulo: 'Convenios & Delegaciones',
      badge: 'COMERCIAL',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      icono: Users,
      colorIconoBg: 'bg-emerald-500',
      descripcion: 'Gestión de colegios, giras de estudio, universidades y operadores turísticos a crédito.',
      href: '/convenios',
      hoverBorder: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10'
    },
    {
      titulo: 'Egresos & Costos',
      badge: 'ADMINISTRACIÓN',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
      icono: Receipt,
      colorIconoBg: 'bg-amber-500',
      descripcion: 'Alimento fauna lacustre, bombas, filtros, químicos de estanques y gastos operativos.',
      href: '/egresos',
      hoverBorder: 'hover:border-amber-500/60 hover:shadow-amber-500/10'
    },
    {
      titulo: 'Dashboard Ejecutivo',
      badge: 'GERENCIA',
      badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-800',
      icono: BarChart3,
      colorIconoBg: 'bg-teal-500',
      descripcion: 'Consolidado financiero general, afluencia total mensual, ticket promedio y márgenes.',
      href: '/dashboard',
      hoverBorder: 'hover:border-teal-500/60 hover:shadow-teal-500/10'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#070d18] text-slate-100 flex flex-col justify-between overflow-hidden">
      
      {/* Fondo Acuático con Capa de Oscurecimiento */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105 pointer-events-none transition-all duration-700"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(10, 30, 60, 0.4), rgba(7, 13, 24, 0.95)), url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=80')`
        }}
      />

      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Marca / Ubicación */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-800 flex items-center justify-center text-lg shadow-inner">
              🐠
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block">
                Control Operativo
              </span>
              <span className="text-[10px] text-slate-400">
                Entre Lagos • Puyehue
              </span>
            </div>
          </div>

          {/* Menú Superior Rápido */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs font-semibold">
            <Link 
              href="/boleteria" 
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              Boletería
            </Link>
            <Link 
              href="/convenios" 
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              Convenios
            </Link>
            <Link 
              href="/egresos" 
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              Egresos
            </Link>
            <Link 
              href="/dashboard" 
              className="ml-2 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 transition transform active:scale-95"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* 2. CUERPO PRINCIPAL */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        
        {/* Etiqueta Superior */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-sky-500/30 text-[10px] font-extrabold uppercase tracking-widest text-sky-300 mb-4 backdrop-blur-sm shadow-inner">
          Parque Acuario Puyehue
        </div>

        {/* Título y Subtítulo Central */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl leading-tight">
          Sistema de Gestión Operacional
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-300/80 max-w-xl leading-relaxed">
          Módulos integrados para la recaudación en mesón, convenios educativos y fiscalización de costos.
        </p>

        {/* Cuadrícula de 4 Tarjetas de Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-10 text-left">
          {modulos.map((mod, idx) => {
            const Icono = mod.icono;
            return (
              <Link
                key={idx}
                href={mod.href}
                className={`group relative bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900 ${mod.hoverBorder} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`w-9 h-9 rounded-xl ${mod.colorIconoBg} flex items-center justify-center text-white shadow-md shadow-black/40 group-hover:scale-105 transition-transform`}>
                      <Icono className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${mod.badgeColor} tracking-wider uppercase`}>
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-sky-300 transition-colors">
                    {mod.titulo}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {mod.descripcion}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs font-bold text-sky-400 group-hover:text-sky-300 transition-colors">
                  <span>Ingresar al módulo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

      </main>

      {/* 3. PIE DE PÁGINA */}
      <footer className="relative z-10 w-full border-t border-slate-800/60 bg-slate-950/40 backdrop-blur-sm py-4 text-center text-[10px] text-slate-500 font-mono">
        Sistema de Control Interno © {new Date().getFullYear()} Parque Acuario Puyehue
      </footer>

    </div>
  );
}