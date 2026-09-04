'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Wallet, 
  Sun, 
  Snowflake, 
  Layers, 
  ArrowLeft,
  Calendar,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtroTemporada, setFiltroTemporada] = useState<'Todas' | 'Verano' | 'Invierno'>('Todas');
  const [fechaDesde, setFechaDesde] = useState(inicioMes);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  const [aplicarFechas, setAplicarFechas] = useState(true);
  const [cargando, setCargando] = useState(true);

  const [metricas, setMetricas] = useState({
    ingresosBoleteria: 0,
    ingresosConvenios: 0,
    ingresosTotales: 0,
    afluenciaBoleteria: 0,
    afluenciaConvenios: 0,
    afluenciaTotal: 0,
    ticketPromedio: 0,
    totalEgresos: 0,
    margenOperacional: 0
  });

  const [ultimosMovimientos, setUltimosMovimientos] = useState<any[]>([]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Boletería
      let queryBoleteria = supabase
        .from('boleteria')
        .select('*')
        .neq('estado', 'anulado');

      if (filtroTemporada !== 'Todas') {
        queryBoleteria = queryBoleteria.eq('temporada', filtroTemporada);
      }
      if (aplicarFechas) {
        if (fechaDesde) queryBoleteria = queryBoleteria.gte('fecha', fechaDesde);
        if (fechaHasta) queryBoleteria = queryBoleteria.lte('fecha', fechaHasta);
      }

      const { data: dataBoleteria } = await queryBoleteria;

      // 2. Convenios
      let queryConvenios = supabase
        .from('convenios')
        .select('*');

      if (filtroTemporada !== 'Todas') {
        queryConvenios = queryConvenios.eq('temporada', filtroTemporada);
      }
      if (aplicarFechas) {
        if (fechaDesde) queryConvenios = queryConvenios.gte('fecha', fechaDesde);
        if (fechaHasta) queryConvenios = queryConvenios.lte('fecha', fechaHasta);
      }

      const { data: dataConvenios } = await queryConvenios;

      // 3. Egresos
      let totalGastos = 0;
      try {
        let queryEgresos = supabase.from('egresos').select('*');
        if (aplicarFechas) {
          if (fechaDesde) queryEgresos = queryEgresos.gte('fecha', fechaDesde);
          if (fechaHasta) queryEgresos = queryEgresos.lte('fecha', fechaHasta);
        }
        const { data: dataEgresos } = await queryEgresos;
        if (dataEgresos) {
          totalGastos = dataEgresos.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
        }
      } catch (e) {
        console.warn('Tabla egresos no disponible');
      }

      const totalVentaBoleteria = (dataBoleteria || []).reduce(
        (acc, item) => acc + Number(item.total_bruto || 0), 0
      );
      const totalPersonasBoleteria = (dataBoleteria || []).reduce(
        (acc, item) => acc + Number(item.total_personas || 0), 0
      );

      const totalVentaConvenios = (dataConvenios || []).reduce(
        (acc, item) => acc + Number(item.total_facturado || 0), 0
      );
      const totalPersonasConvenios = (dataConvenios || []).reduce(
        (acc, item) => acc + Number(item.cantidad_personas || 0), 0
      );

      const totalIngresos = totalVentaBoleteria + totalVentaConvenios;
      const totalPersonas = totalPersonasBoleteria + totalPersonasConvenios;
      const ticketProm = totalPersonas > 0 ? Math.round(totalIngresos / totalPersonas) : 0;
      const margen = totalIngresos - totalGastos;

      setMetricas({
        ingresosBoleteria: totalVentaBoleteria,
        ingresosConvenios: totalVentaConvenios,
        ingresosTotales: totalIngresos,
        afluenciaBoleteria: totalPersonasBoleteria,
        afluenciaConvenios: totalPersonasConvenios,
        afluenciaTotal: totalPersonas,
        ticketPromedio: ticketProm,
        totalEgresos: totalGastos,
        margenOperacional: margen
      });

      const movimientosBoleteria = (dataBoleteria || []).map(b => ({
        tipo: 'Boletería',
        detalle: `Turno ${b.turno} (#${b.id})`,
        fecha: b.fecha,
        temporada: b.temporada,
        monto: Number(b.total_bruto || 0),
        personas: Number(b.total_personas || 0)
      }));

      const movimientosConvenios = (dataConvenios || []).map(c => ({
        tipo: 'Convenio',
        detalle: c.institucion,
        fecha: c.fecha,
        temporada: c.temporada,
        monto: Number(c.total_facturado || 0),
        personas: Number(c.cantidad_personas || 0)
      }));

      const unificados = [...movimientosBoleteria, ...movimientosConvenios]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setUltimosMovimientos(unificados);

    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroTemporada, fechaDesde, fechaHasta, aplicarFechas]);

  const resetFechas = () => {
    setFechaDesde('');
    setFechaHasta('');
    setAplicarFechas(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition mb-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
            </Link>
            <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Ejecutivo y Operacional</h1>
            <p className="text-xs text-slate-400">Consolidado general de recaudación, estacionalidad y público</p>
          </div>

          {/* Selector de Temporada */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setFiltroTemporada('Todas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Todas' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Todas
            </button>
            <button
              onClick={() => setFiltroTemporada('Verano')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Verano' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Sun className="w-3.5 h-3.5" /> Verano (Alta)
            </button>
            <button
              onClick={() => setFiltroTemporada('Invierno')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Invierno' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Snowflake className="w-3.5 h-3.5" /> Invierno (Baja)
            </button>
          </div>
        </div>

        {/* Barra de Filtro de Fechas */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span>Rango de Consulta:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setAplicarFechas(true);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setAplicarFechas(true);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <button
              onClick={resetFechas}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
              title="Quitar límite de fechas"
            >
              <RotateCcw className="w-3 h-3" /> Histórico Completo
            </button>
          </div>
        </div>

        {/* Tarjetas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Ingresos Totales</span>
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-mono font-black text-white">
                ${metricas.ingresosTotales.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                <span>Boletería: ${metricas.ingresosBoleteria.toLocaleString('es-CL')}</span>
                <span>Conv: ${metricas.ingresosConvenios.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Afluencia Total</span>
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-mono font-black text-white">
                {metricas.afluenciaTotal.toLocaleString('es-CL')} <span className="text-sm font-sans font-normal text-slate-400">visitantes</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                <span>Mesón: {metricas.afluenciaBoleteria}</span>
                <span>Grupos: {metricas.afluenciaConvenios}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Ticket Promedio</span>
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-mono font-black text-white">
                ${metricas.ticketPromedio.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Gasto estimado por visitante
              </div>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Margen Bruto</span>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-mono font-black text-white">
                ${metricas.margenOperacional.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Egresos reg.: ${metricas.totalEgresos.toLocaleString('es-CL')}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Detallada */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detalle de Operaciones en el Periodo</h3>
            <span className="text-xs text-slate-400 font-medium">
              {ultimosMovimientos.length} registros encontrados
            </span>
          </div>

          {cargando ? (
            <div className="text-center py-8 text-xs text-slate-400">Consultando base de datos...</div>
          ) : ultimosMovimientos.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No hay registros para este rango de fechas o temporada seleccionada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="py-2.5 px-2">Tipo</th>
                    <th className="py-2.5 px-2">Fecha</th>
                    <th className="py-2.5 px-2">Temporada</th>
                    <th className="py-2.5 px-2">Detalle / Turno</th>
                    <th className="py-2.5 px-2">Público</th>
                    <th className="py-2.5 px-2 text-right">Monto Recaudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ultimosMovimientos.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${m.tipo === 'Boletería' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono">{m.fecha}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.temporada === 'Verano' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'}`}>
                          {m.temporada || 'Verano'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-white">{m.detalle}</td>
                      <td className="py-2.5 px-2 font-mono">{m.personas} pers.</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-teal-300">
                        ${m.monto.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}