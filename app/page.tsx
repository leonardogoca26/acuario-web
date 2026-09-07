'use client';

import Link from 'next/link';
import { 
  BarChart3, 
  Ticket, 
  Receipt, 
  Users, 
  Landmark, 
  ArrowRight,
  ShieldCheck,
  Building2,
  CalendarDays
} from 'lucide-react';

export default function HomeMenuPage() {
  const fechaHoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const modulos = [
    {
      titulo: 'Centro Financiero & Dashboard',
      descripcion: 'Control ejecutivo de caja, conciliación bancaria, proyecciones y comparativa histórica 2022-2026.',
      href: '/dashboard',
      icono: BarChart3,
      colorIcono: 'text-sky-400',
      bordeHover: 'hover:border-sky-500/50',
      badge: 'Principal',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-800'
    },
    {
      titulo: 'Cierre de Boletería',
      descripcion: 'Rendición de turnos diarios en taquilla, arqueo de efectivo y transacciones de terminales POS.',
      href: '/boleteria',
      icono: Ticket,
      colorIcono: 'text-emerald-400',
      bordeHover: 'hover:border-emerald-500/50',
      badge: 'Operativo',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
    },
    {
      titulo: 'Convenios & Delegaciones',
      descripcion: 'Registro de visitas grupales, colegios, operadores turísticos y gestión de cobro.',
      href: '/convenios',
      icono: Users,
      colorIcono: 'text-amber-400',
      bordeHover: 'hover:border-amber-500/50',
      badge: 'Comercial',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
    },
    {
      titulo: 'Gastos & Egresos',
      descripcion: 'Carga y clasificación de egresos operacionales, compras, mantención y pago de proveedores.',
      href: '/egresos',
      icono: Receipt,
      colorIcono: 'text-rose-400',
      bordeHover: 'hover:border-rose-500/50',
      badge: 'Tesorería',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Cabecera Corporativa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Parque Acuario Puyehue</h1>
              <p className="text-xs text-slate-400">Sistema de Control Operacional & Tesorería Central</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <CalendarDays className="w-4 h-4 text-sky-400" />
            <span className="capitalize">{fechaHoy}</span>
          </div>
        </div>

        {/* Mensaje de Estado */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Módulos de Gestión</h2>
          <p className="text-xs text-slate-400">Selecciona el área de trabajo para operar o consultar métricas</p>
        </div>

        {/* Tarjetas de Accesos Directos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modulos.map((mod, idx) => {
            const Icono = mod.icono;
            return (
              <Link
                key={idx}
                href={mod.href}
                className={`group bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 ${mod.bordeHover} flex flex-col justify-between min-h-[160px]`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <Icono className={`w-5 h-5 ${mod.colorIcono}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
                        {mod.titulo}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${mod.badgeColor} uppercase tracking-wider`}>
                        {mod.badge}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {mod.descripcion}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Panel Inferior de Seguridad y Enlace Rápido al Flujo de Caja */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-400">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <span>Base de datos protegida y sincronizada en tiempo real con Supabase.</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-bold transition shrink-0"
          >
            <Landmark className="w-4 h-4" /> Ir directo a Flujo de Caja &rarr;
          </Link>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full pt-8 text-center text-[11px] text-slate-500 border-t border-slate-800/80 mt-10">
        Parque Acuario Puyehue &bull; Sistema de Control Interno
      </div>
    </div>
  );
}