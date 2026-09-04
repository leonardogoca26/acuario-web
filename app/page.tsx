import Link from 'next/link';
import { Ticket, Users, Receipt, BarChart3, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  const modulos = [
    {
      titulo: 'Boletería Diaria',
      descripcion: 'Arqueo de turnos, venta general de mesón, folios correlativos y cuadre por medio de pago.',
      href: '/boleteria',
      icono: Ticket,
      badge: 'Caja & Mesón',
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-400/30',
      iconColor: 'bg-sky-500 text-white',
      borderHover: 'hover:border-sky-400'
    },
    {
      titulo: 'Convenios & Delegaciones',
      descripcion: 'Gestión de colegios, giras de estudio, universidades y operadores turísticos a crédito.',
      href: '/convenios',
      icono: Users,
      badge: 'Comercial',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
      iconColor: 'bg-teal-500 text-white',
      borderHover: 'hover:border-teal-400'
    },
    {
      titulo: 'Egresos & Costos',
      descripcion: 'Alimento fauna lacustre, bombas, filtros, químicos de estanques y gastos operativos.',
      href: '/egresos',
      icono: Receipt,
      badge: 'Administración',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
      iconColor: 'bg-amber-500 text-white',
      borderHover: 'hover:border-amber-400'
    },
    {
      titulo: 'Dashboard Ejecutivo',
      descripcion: 'Consolidado financiero general, afluencia total mensual, ticket promedio y márgenes.',
      href: '/dashboard',
      icono: BarChart3,
      badge: 'Gerencia',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
      iconColor: 'bg-emerald-500 text-white',
      borderHover: 'hover:border-emerald-400'
    }
  ];

  return (
    <main className="relative min-h-[calc(100vh-65px)] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden bg-slate-950">
      
      {/* Fondo acuático sumergido similar a su sitio web */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=80')`
        }}
      />
      {/* Velo degradado para contraste y legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/95" />

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Cabecera */}
        <div className="text-center space-y-3">
          <span className="inline-block bg-sky-900/60 border border-sky-400/30 text-sky-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            Parque Acuario Puyehue
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
            Sistema de Gestión Operacional
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed drop-shadow-sm">
            Módulos integrados para la recaudación en mesón, convenios educativos y fiscalización de costos.
          </p>
        </div>

        {/* Tarjetas de acceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modulos.map((m) => {
            const Icon = m.icono;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`group bg-slate-900/80 backdrop-blur-md border border-slate-700/60 ${m.borderHover} rounded-xl p-5 transition-all duration-200 hover:bg-slate-900/95 shadow-lg flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${m.iconColor} shadow-md group-hover:scale-105 transition`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-sky-300 transition">
                      {m.titulo}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                      {m.descripcion}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center text-xs font-bold text-sky-400 group-hover:text-sky-300 gap-1 transition">
                  Ingresar al módulo <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs pt-4 border-t border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Servidor en línea • Sincronización automática</span>
        </div>

      </div>
    </main>
  );
}