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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ListFilter
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [pestanaActiva, setPestanaActiva] = useState<'metricas' | 'calendario'>('calendario');
  const [filtroTemporada, setFiltroTemporada] = useState<'Todas' | 'Verano' | 'Invierno'>('Todas');
  const [cargando, setCargando] = useState(true);

  // Estado del calendario mensual
  const fechaActual = new Date();
  const [mesActual, setMesActual] = useState(fechaActual.getMonth());
  const [anioActual, setAnioActual] = useState(fechaActual.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

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

  const [todosLosMovimientos, setTodosLosMovimientos] = useState<any[]>([]);

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

      const { data: dataBoleteria } = await queryBoleteria;

      // 2. Convenios
      let queryConvenios = supabase
        .from('convenios')
        .select('*');

      if (filtroTemporada !== 'Todas') {
        queryConvenios = queryConvenios.eq('temporada', filtroTemporada);
      }

      const { data: dataConvenios } = await queryConvenios;

      // 3. Egresos
      let totalGastos = 0;
      try {
        const { data: dataEgresos } = await supabase.from('egresos').select('*');
        if (dataEgresos) {
          totalGastos = dataEgresos.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
        }
      } catch (e) {
        console.warn('Tabla egresos no disponible');
      }

      const totalVentaBoleteria = (dataBoleteria || []).reduce((acc, item) => acc + Number(item.total_bruto || 0), 0);
      const totalPersonasBoleteria = (dataBoleteria || []).reduce((acc, item) => acc + Number(item.total_personas || 0), 0);
      const totalVentaConvenios = (dataConvenios || []).reduce((acc, item) => acc + Number(item.total_facturado || 0), 0);
      const totalPersonasConvenios = (dataConvenios || []).reduce((acc, item) => acc + Number(item.cantidad_personas || 0), 0);

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
        id: b.id,
        detalle: `Turno ${b.turno} (#${b.id})`,
        fecha: b.fecha,
        temporada: b.temporada,
        monto: Number(b.total_bruto || 0),
        personas: Number(b.total_personas || 0)
      }));

      const movimientosConvenios = (dataConvenios || []).map(c => ({
        tipo: 'Convenio',
        id: c.id,
        detalle: c.institucion,
        fecha: c.fecha,
        temporada: c.temporada,
        monto: Number(c.total_facturado || 0),
        personas: Number(c.cantidad_personas || 0)
      }));

      const unificados = [...movimientosBoleteria, ...movimientosConvenios]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setTodosLosMovimientos(unificados);

    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroTemporada]);

  // Utilidades del calendario mensual
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const irMesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual(anioActual - 1);
    } else {
      setMesActual(mesActual - 1);
    }
    setDiaSeleccionado(null);
  };

  const irMesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual(anioActual + 1);
    } else {
      setMesActual(mesActual + 1);
    }
    setDiaSeleccionado(null);
  };

  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const diaSemanaInicio = new Date(anioActual, mesActual, 1).getDay();
  // Ajustar domingo (0) para formato lunes a domingo
  const desfaseSemana = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;

  // Mapear movimientos agrupados por fecha (YYYY-MM-DD)
  const mapaPorFecha: Record<string, { monto: number; personas: number; registros: any[] }> = {};
  todosLosMovimientos.forEach(m => {
    if (!mapaPorFecha[m.fecha]) {
      mapaPorFecha[m.fecha] = { monto: 0, personas: 0, registros: [] };
    }
    mapaPorFecha[m.fecha].monto += m.monto;
    mapaPorFecha[m.fecha].personas += m.personas;
    mapaPorFecha[m.fecha].registros.push(m);
  });

  const detallesDia = diaSeleccionado ? (mapaPorFecha[diaSeleccionado]?.registros || []) : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition mb-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
            </Link>
            <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Ejecutivo y Operacional</h1>
            <p className="text-xs text-slate-400">Control estacional y seguimiento diario por calendario</p>
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
              <Sun className="w-3.5 h-3.5" /> Verano
            </button>
            <button
              onClick={() => setFiltroTemporada('Invierno')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Invierno' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Snowflake className="w-3.5 h-3.5" /> Invierno
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Dashboard */}
        <div className="flex border-b border-slate-800 text-sm font-bold gap-6">
          <button
            onClick={() => setPestanaActiva('calendario')}
            className={`pb-3 flex items-center gap-2 transition ${pestanaActiva === 'calendario' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Vista Calendario Diario
          </button>
          <button
            onClick={() => setPestanaActiva('metricas')}
            className={`pb-3 flex items-center gap-2 transition ${pestanaActiva === 'metricas' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ListFilter className="w-4 h-4" /> Métricas Consolidadas
          </button>
        </div>

        {/* ========================================================= */}
        {/* VISTA 1: CALENDARIO INTERACTIVO */}
        {/* ========================================================= */}
        {pestanaActiva === 'calendario' && (
          <div className="space-y-6">
            
            {/* Controles del Calendario */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-white capitalize">
                    {nombresMeses[mesActual]} {anioActual}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    Filtro: {filtroTemporada}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={irMesAnterior}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300 transition"
                    title="Mes Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={irMesSiguiente}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300 transition"
                    title="Mes Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
                <div>Dom</div>
              </div>

              {/* Matriz de Días */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Espacios vacíos antes del día 1 */}
                {Array.from({ length: desfaseSemana }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[85px] bg-slate-900/30 rounded-xl border border-transparent" />
                ))}

                {/* Días reales del mes */}
                {Array.from({ length: diasEnMes }).map((_, i) => {
                  const diaNum = i + 1;
                  const diaStr = diaNum < 10 ? `0${diaNum}` : `${diaNum}`;
                  const mesStr = (mesActual + 1) < 10 ? `0${mesActual + 1}` : `${mesActual + 1}`;
                  const fechaDia = `${anioActual}-${mesStr}-${diaStr}`;
                  
                  const dataDia = mapaPorFecha[fechaDia];
                  const tieneVentas = Boolean(dataDia && dataDia.monto > 0);
                  const esSeleccionado = diaSeleccionado === fechaDia;

                  return (
                    <div
                      key={fechaDia}
                      onClick={() => tieneVentas && setDiaSeleccionado(fechaDia)}
                      className={`min-h-[85px] p-2 rounded-xl border transition flex flex-col justify-between text-left ${
                        esSeleccionado 
                          ? 'border-sky-400 bg-sky-950/60 ring-2 ring-sky-500/40' 
                          : tieneVentas 
                            ? 'border-slate-700 bg-slate-900 hover:border-sky-500/60 cursor-pointer' 
                            : 'border-slate-800/60 bg-slate-900/40 opacity-70'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${tieneVentas ? 'text-white' : 'text-slate-500'}`}>
                          {diaNum}
                        </span>
                        {tieneVentas && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        )}
                      </div>

                      {tieneVentas ? (
                        <div className="space-y-0.5 mt-1">
                          <div className="text-[11px] font-mono font-black text-teal-300 leading-tight">
                            ${Math.round(dataDia.monto).toLocaleString('es-CL')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {dataDia.personas} pers.
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600 italic">Sin mov.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detalle del Día Seleccionado en Calendario */}
            {diaSeleccionado && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Detalle del Día: <span className="font-mono text-sky-300">{diaSeleccionado}</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setDiaSeleccionado(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cerrar Detalle
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="border-b border-slate-700 text-slate-400">
                      <tr>
                        <th className="py-2 px-2">Tipo</th>
                        <th className="py-2 px-2">Detalle / Turno</th>
                        <th className="py-2 px-2">Temporada</th>
                        <th className="py-2 px-2">Público</th>
                        <th className="py-2 px-2 text-right">Recaudado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {detallesDia.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.tipo === 'Boletería' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}`}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-medium text-white">{item.detalle}</td>
                          <td className="py-2 px-2">{item.temporada}</td>
                          <td className="py-2 px-2 font-mono">{item.personas} pers.</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-teal-300">
                            ${item.monto.toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 2: TARJETAS MÉTRICAS GENERALES */}
        {/* ========================================================= */}
        {pestanaActiva === 'metricas' && (
          <div className="space-y-6">
            
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

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700 pb-3">
                Listado Consolidado
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-2">Tipo</th>
                      <th className="py-2.5 px-2">Fecha</th>
                      <th className="py-2.5 px-2">Temporada</th>
                      <th className="py-2.5 px-2">Detalle</th>
                      <th className="py-2.5 px-2">Público</th>
                      <th className="py-2.5 px-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {todosLosMovimientos.slice(0, 15).map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${m.tipo === 'Boletería' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}`}>
                            {m.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono">{m.fecha}</td>
                        <td className="py-2.5 px-2">{m.temporada}</td>
                        <td className="py-2.5 px-2 font-medium text-white">{m.detalle}</td>
                        <td className="py-2.5 px-2 font-mono">{m.personas} pers.</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-teal-300">
                          ${m.monto.toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}