import Link from 'next/link';
import { Ticket, Users, Receipt, BarChart3, Fish, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  const modulos = [
    {
      titulo: 'Boletería Diaria',
      descripcion: 'Arqueo de turnos, folios correlativos, cuadre de mesón por efectivo, POS o transferencias.',
      href: '/boleteria',
      icono: Ticket,
      badge: 'Caja & Mesón',
      badgeColor: 'bg-sky-100 text-sky-800',
      iconColor: 'bg-sky-600 text-white',
      borderHover: 'hover:border-sky-400'
    },
    {
      titulo: 'Convenios & Delegaciones',
      descripcion: 'Control de visitas para colegios, universidades, giras de estudio y operadores turísticos a crédito.',
      href: '/convenios',
      icono: Users,
      badge: 'Dirección Comercial',
      badgeColor: 'bg-teal-100 text-teal-800',
      iconColor: 'bg-teal-600 text-white',
      borderHover: 'hover:border-teal-400'
    },
    {
      titulo: 'Egresos & Costos',
      descripcion: 'Alimento fauna local, mantención de filtros, químicos de estanques, electricidad y nómina sin IVA.',
      href: '/egresos',
      icono: Receipt,
      badge: 'Administración',
      badgeColor: 'bg-amber-100 text-amber-900',
      iconColor: 'bg-amber-600 text-white',
      borderHover: 'hover:border-amber-400'
    },
    {
      titulo: 'Dashboard Ejecutivo',
      descripcion: 'Consolidado financiero general, afluencia total mensual, ticket promedio y margen operacional.',
      href: '/dashboard',
      icono: BarChart3,
      badge: 'Gerencia',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      iconColor: 'bg-emerald-600 text-white',
      borderHover: 'hover:border-emerald-400'
    }
  ];

  return (
    <main className="min-h-[calc(100vh-61px)] bg-slate-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Encabezado Corporativo estilo acuariopuyehue.cl */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-sky-100/80 border border-sky-200 px-3.5 py-1 rounded-full text-xs font-bold text-sky-800">
            <Fish className="w-4 h-4 text-amber-500 fill-amber-400" />
            Acuario Puyehue • Entre Lagos
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-sky-950 tracking-tight">
            Sistema de Control Operacional
          </h1>
          
          <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
            Plataforma centralizada para la cuadratura de caja diaria, seguimiento de delegaciones escolares y control de costos de la fundación.
          </p>
        </div>

        {/* Tarjetas de Acceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modulos.map((m) => {
            const Icon = m.icono;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`group bg-white border border-slate-200/80 ${m.borderHover} rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${m.iconColor} shadow-sm group-hover:scale-105 transition`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition">
                      {m.titulo}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                      {m.descripcion}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center text-xs font-bold text-sky-600 group-hover:text-sky-800 gap-1 transition">
                  Abrir módulo <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pie con distintivo de seguridad */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs pt-4 border-t border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Datos sincronizados en tiempo real con la nube</span>
        </div>

      </div>
    </main>
  );
}
