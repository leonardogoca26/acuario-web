'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Ticket, 
  Users, 
  Receipt, 
  BarChart3, 
  ArrowRight,
  Lock,
  Unlock,
  ShieldAlert,
  X
} from 'lucide-react';

export default function HomeMenuPage() {
  const [rol, setRol] = useState<'cajero' | 'director'>('cajero');
  const [modalPinAbierto, setModalPinAbierto] = useState(false);
  const [pinIngresado, setPinIngresado] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  // Cargar rol persistente
  useEffect(() => {
    const rolGuardado = localStorage.getItem('perfil_usuario_acuario');
    if (rolGuardado === 'director') {
      setRol('director');
    }
  }, []);

  const handleCambiarADirector = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN de seguridad para la gerencia (puedes cambiar '2026' por tu clave deseada)
    if (pinIngresado === '2026') {
      setRol('director');
      localStorage.setItem('perfil_usuario_acuario', 'director');
      setModalPinAbierto(false);
      setPinIngresado('');
      setErrorPin(false);
    } else {
      setErrorPin(true);
    }
  };

  const handleCerrarModoDirector = () => {
    setRol('cajero');
    localStorage.setItem('perfil_usuario_acuario', 'cajero');
  };

  const modulos = [
    {
      titulo: 'Boletería Diaria',
      badge: 'CAJA & MESÓN',
      badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-800',
      icono: Ticket,
      colorIconoBg: 'bg-sky-500',
      descripcion: 'Arqueo de turnos, venta general de mesón, folios correlativos y cuadre por medio de pago.',
      href: '/boleteria',
      hoverBorder: 'hover:border-sky-500/60 hover:shadow-sky-500/10',
      permitido: true
    },
    {
      titulo: 'Convenios & Delegaciones',
      badge: 'COMERCIAL',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      icono: Users,
      colorIconoBg: 'bg-emerald-500',
      descripcion: 'Gestión de colegios, giras de estudio, universidades y operadores turísticos a crédito.',
      href: '/convenios',
      hoverBorder: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
      permitido: true
    },
    {
      titulo: 'Egresos & Costos',
      badge: 'ADMINISTRACIÓN',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
      icono: Receipt,
      colorIconoBg: 'bg-amber-500',
      descripcion: 'Alimento fauna lacustre, bombas, filtros, químicos de estanques y gastos operativos.',
      href: '/egresos',
      hoverBorder: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
      permitido: rol === 'director'
    },
    {
      titulo: 'Dashboard Ejecutivo',
      badge: 'GERENCIA',
      badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-800',
      icono: BarChart3,
      colorIconoBg: 'bg-teal-500',
      descripcion: 'Consolidado financiero general, afluencia total mensual, ticket promedio y márgenes.',
      href: '/dashboard',
      hoverBorder: 'hover:border-teal-500/60 hover:shadow-teal-500/10',
      permitido: rol === 'director'
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#070d18] text-slate-100 flex flex-col justify-between overflow-hidden">
      
      {/* Fondo Acuático con Capa de Oscurecimiento */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105 pointer-events-none transition-all duration-700"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(10, 30, 60, 0.4), rgba(7, 13, 24, 0.95)), url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=80')`
        }}
      />

      {/* CUERPO PRINCIPAL */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center items-center text-center">
        
        {/* Selector de Perfil Superior */}
        <div className="flex items-center gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
            <span>Perfil:</span>
            <strong className={`uppercase font-bold ${rol === 'director' ? 'text-teal-400' : 'text-sky-400'}`}>
              {rol === 'director' ? 'Director General' : 'Cajero / Mesón'}
            </strong>
          </div>

          {rol === 'cajero' ? (
            <button
              onClick={() => setModalPinAbierto(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition shadow"
            >
              <Lock className="w-3 h-3" /> Acceso Director
            </button>
          ) : (
            <button
              onClick={handleCerrarModoDirector}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 transition shadow"
            >
              <Unlock className="w-3 h-3" /> Modo Cajero
            </button>
          )}
        </div>

        {/* Título y Subtítulo Central */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl leading-tight">
          Sistema de Gestión Operacional
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-300/80 max-w-xl leading-relaxed">
          {rol === 'cajero' 
            ? 'Módulos autorizados para venta en mesón y recepción de convenios.' 
            : 'Módulos integrados para la recaudación en mesón, convenios educativos y fiscalización de costos.'}
        </p>

        {/* Cuadrícula de 4 Tarjetas de Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-10 text-left">
          {modulos.map((mod, idx) => {
            const Icono = mod.icono;

            // Si está permitido, es un Link normal
            if (mod.permitido) {
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
            }

            // Si NO está permitido (Bloqueado para cajero)
            return (
              <div
                key={idx}
                onClick={() => setModalPinAbierto(true)}
                className="relative bg-slate-950/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-5 opacity-55 cursor-pointer hover:opacity-75 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full border border-slate-800 text-slate-500 tracking-wider uppercase">
                      Exclusivo Dirección
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-400">
                    {mod.titulo}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Acceso restringido para el perfil cajero. Desbloquea con clave de dirección para ingresar.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-xs font-bold text-amber-500/80">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Requiere PIN de Gerencia</span>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Modal Ingreso PIN Director */}
      {modalPinAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xs p-6 shadow-2xl relative">
            <button
              onClick={() => { setModalPinAbierto(false); setErrorPin(false); setPinIngresado(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-700 mx-auto flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Desbloqueo de Dirección</h3>
              <p className="text-[11px] text-slate-400">Ingresa la clave de gerencia para habilitar Egresos y Dashboard</p>
            </div>

            <form onSubmit={handleCambiarADirector} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="PIN (por ej. 2026)"
                  value={pinIngresado}
                  onChange={(e) => { setPinIngresado(e.target.value); setErrorPin(false); }}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl py-2 text-white outline-none"
                />
                {errorPin && (
                  <p className="text-[10px] text-rose-400 font-bold text-center mt-1 flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Clave incorrecta
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setModalPinAbierto(false); setErrorPin(false); setPinIngresado(''); }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIE DE PÁGINA */}
      <footer className="relative z-10 w-full border-t border-slate-800/60 bg-slate-950/40 backdrop-blur-sm py-4 text-center text-[10px] text-slate-500 font-mono">
        Sistema de Control Interno © {new Date().getFullYear()} Parque Acuario Puyehue
      </footer>

    </div>
  );
}