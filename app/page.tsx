import Link from 'next/link';
import { Ticket, Users, Receipt, BarChart3, ShieldCheck } from 'lucide-react';

export default function Home() {
  const modulos = [
    {
      titulo: 'Boletería Diaria',
      descripcion: 'Registro de caja, visitantes por boleto general, cuadre de medios de pago y folios.',
      href: '/boleteria',
      icono: Ticket,
      color: 'bg-blue-500',
      badge: 'Cajeros & Turnos',
      textColor: 'text-blue-600'
    },
    {
      titulo: 'Convenios & Delegaciones',
      descripcion: 'Control de afluencia de colegios, universidades, operadores turísticos y facturación a crédito.',
      href: '/convenios',
      icono: Users,
      color: 'bg-indigo-600',
      badge: 'Dirección & Ventas',
      textColor: 'text-indigo-600'
    },
    {
      titulo: 'Gastos & Egresos',
      descripcion: 'Registro de compras, alimento fauna, mantención de filtros/bombas, sueldos y servicios.',
      href: '/egresos',
      icono: Receipt,
      color: 'bg-rose-600',
      badge: 'Administración',
      textColor: 'text-rose-600'
    },
    {
      titulo: 'Dashboard Ejecutivo',
      descripcion: 'Reportería financiera general, afluencia consolidada, ticket promedio y márgenes.',
      href: '/dashboard',
      icono: BarChart3,
      color: 'bg-emerald-600',
      badge: 'Gerencia General',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        
        {/* Cabecera Corporativa */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-xs font-medium text-cyan-400">
            <ShieldCheck className="w-4 h-4" /> Plataforma de Gestión Operativa & Financiera
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Aqua<span className="text-cyan-400">Control</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Selecciona el módulo correspondiente a tu rol u operación del día.
          </p>
        </div>

        {/* Tarjetas de Navegación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modulos.map((m) => {
            const Icon = m.icono;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group relative bg-slate-800/60 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${m.color} text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-900/60 border border-slate-700 px-2.5 py-1 rounded-full">
                      {m.badge}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition">
                      {m.titulo}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      {m.descripcion}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center text-xs font-bold text-slate-300 group-hover:text-cyan-400 gap-1">
                  Acceder al módulo <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer simple */}
        <div className="text-center text-xs text-slate-500 pt-6 border-t border-slate-800">
          AquaControl v1.0 • Sistema Centralizado de Parque Acuario
        </div>

      </div>
    </main>
  );
}
