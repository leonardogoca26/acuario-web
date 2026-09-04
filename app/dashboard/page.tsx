'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  Building2, 
  Ticket, 
  Calendar 
} from 'lucide-react';
import Link from 'next/link';

interface MetricasTotales {
  ingresosBoleteria: number;
  ingresosConvenios: number;
  ingresosTotales: number;
  visitantesBoleteria: number;
  asistentesConvenios: number;
  visitantesTotales: number;
  egresosTotales: number;
  resultadoOperacional: number;
  ticketPromedio: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [rangoMes, setRangoMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [metricas, setMetricas] = useState<MetricasTotales>({
    ingresosBoleteria: 0,
    ingresosConvenios: 0,
    ingresosTotales: 0,
    visitantesBoleteria: 0,
    asistentesConvenios: 0,
    visitantesTotales: 0,
    egresosTotales: 0,
    resultadoOperacional: 0,
    ticketPromedio: 0
  });

  const [gastosPorCategoria, setGastosPorCategoria] = useState<{ categoria: string; total: number }[]>([]);

  const cargarDatos = async (mesSeleccionado: string) => {
    setLoading(true);
    const primerDia = `${mesSeleccionado}-01`;
    const ultimoDia = `${mesSeleccionado}-31`;

    // 1. Consultar Boletería
    const { data: dataBoleteria } = await supabase
      .from('cierres_diarios')
      .select('total_visitantes, total_ingresos, estado')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia)
      .eq('estado', 'activo');

    // 2. Consultar Convenios
    const { data: dataConvenios } = await supabase
      .from('convenios_eventos')
      .select('total_asistentes, total_facturado')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);

    // 3. Consultar Egresos
    const { data: dataEgresos } = await supabase
      .from('egresos')
      .select('monto, categoria')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);

    // Cálculos Boletería
    const ingBol = dataBoleteria?.reduce((acc, cur) => acc + Number(cur.total_ingresos || 0), 0) || 0;
    const visBol = dataBoleteria?.reduce((acc, cur) => acc + Number(cur.total_visitantes || 0), 0) || 0;

    // Cálculos Convenios
    const ingConv = dataConvenios?.reduce((acc, cur) => acc + Number(cur.total_facturado || 0), 0) || 0;
    const asistConv = dataConvenios?.reduce((acc, cur) => acc + Number(cur.total_asistentes || 0), 0) || 0;

    // Totales de afluencia e ingresos
    const totalIng = ingBol + ingConv;
    const totalVis = visBol + asistConv;

    // Cálculos Egresos
    const totalEgr = dataEgresos?.reduce((acc, cur) => acc + Number(cur.monto || 0), 0) || 0;

    // Agrupar gastos por categoría
    const mapaCategorias: { [key: string]: number } = {};
    dataEgresos?.forEach((eg) => {
      mapaCategorias[eg.categoria] = (mapaCategorias[eg.categoria] || 0) + Number(eg.monto || 0);
    });

    const desgloseGastos = Object.entries(mapaCategorias)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    setGastosPorCategoria(desgloseGastos);

    setMetricas({
      ingresosBoleteria: ingBol,
      ingresosConvenios: ingConv,
      ingresosTotales: totalIng,
      visitantesBoleteria: visBol,
      asistentesConvenios: asistConv,
      visitantesTotales: totalVis,
      egresosTotales: totalEgr,
      resultadoOperacional: totalIng - totalEgr,
      ticketPromedio: totalVis > 0 ? Math.round(totalIng / totalVis) : 0
    });

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos(rangoMes);
  }, [rangoMes]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Barra superior de navegación y filtro */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5 transition">
            <ArrowLeft className="w-4 h-4" /> Menú Principal
          </Link>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Período:</span>
            <input
              type="month"
              value={rangoMes}
              onChange={(e) => setRangoMes(e.target.value)}
              className="text-xs font-bold text-slate-800 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Cabecera */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 bg-slate-800 px-2.5 py-1 rounded">
            Panel de Control Financiero
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Resumen Ejecutivo del Parque</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Consolidado de Boletería General, Convenios Institucionales y Costos Operativos del período.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 font-medium">Cargando métricas consolidadas...</div>
        ) : (
          <>
            {/* KPI Cards Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Ingreso Total</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ${metricas.ingresosTotales.toLocaleString('es-CL')}
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                  <span>Boletería: ${metricas.ingresosBoleteria.toLocaleString('es-CL')}</span>
                  <span>Convenios: ${metricas.ingresosConvenios.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Afluencia Total</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {metricas.visitantesTotales.toLocaleString('es-CL')} <span className="text-sm font-medium text-slate-500">personas</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                  <span>Mesón: {metricas.visitantesBoleteria}</span>
                  <span>Delegaciones: {metricas.asistentesConvenios}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Egresos Operativos</span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-700">
                  ${metricas.egresosTotales.toLocaleString('es-CL')}
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  Gastos del plan de cuentas
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Margen Operacional</span>
                  <div className={`p-2 rounded-lg ${metricas.resultadoOperacional >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-2xl font-black ${metricas.resultadoOperacional >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ${metricas.resultadoOperacional.toLocaleString('es-CL')}
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  Ticket Promedio: <strong>${metricas.ticketPromedio.toLocaleString('es-CL')} / persona</strong>
                </div>
              </div>

            </div>

            {/* Comparativa Boletería vs Convenios y Desglose de Gastos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Resumen Comercial */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800">Composición de Ingresos y Asistencia</h2>
                
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 text-white rounded-lg">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Boletería General (Mesón)</div>
                        <div className="text-xs text-slate-500">{metricas.visitantesBoleteria} visitantes particulares</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-blue-900">${metricas.ingresosBoleteria.toLocaleString('es-CL')}</div>
                      <div className="text-[11px] text-slate-500">
                        {metricas.ingresosTotales > 0 ? Math.round((metricas.ingresosBoleteria / metricas.ingresosTotales) * 100) : 0}% del total
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-lg">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Convenios & Delegaciones</div>
                        <div className="text-xs text-slate-500">{metricas.asistentesConvenios} asistentes en grupos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-indigo-900">${metricas.ingresosConvenios.toLocaleString('es-CL')}</div>
                      <div className="text-[11px] text-slate-500">
                        {metricas.ingresosTotales > 0 ? Math.round((metricas.ingresosConvenios / metricas.ingresosTotales) * 100) : 0}% del total
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400">
                  * Las delegaciones institucionales muestran el monto pactado/facturado del período.
                </div>
              </div>

              {/* Ranking de Gastos Operativos */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800">Mayores Costos del Período</h2>
                
                {gastosPorCategoria.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No hay registros de gastos para el período seleccionado.</p>
                ) : (
                  <div className="space-y-3">
                    {gastosPorCategoria.slice(0, 5).map((g) => {
                      const porcentaje = metricas.egresosTotales > 0 ? Math.round((g.total / metricas.egresosTotales) * 100) : 0;
                      return (
                        <div key={g.categoria} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{g.categoria}</span>
                            <span>${g.total.toLocaleString('es-CL')} ({porcentaje}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${porcentaje}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </div>
    </main>
  );
}