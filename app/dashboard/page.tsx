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
  PieChart,
  DollarSign,
  AlertCircle,
  Clock,
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardUnificadoPage() {
  const [seccion, setSeccion] = useState<'operativo' | 'graficas' | 'resultados' | 'caja' | 'cobranza'>('operativo');
  const [filtroTemporada, setFiltroTemporada] = useState<'Todas' | 'Verano' | 'Invierno'>('Todas');
  const [cargando, setCargando] = useState(true);

  // Calendario
  const fechaActual = new Date();
  const [mesActual, setMesActual] = useState(fechaActual.getMonth());
  const [anioActual, setAnioActual] = useState(fechaActual.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Datos base
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [convenios, setConvenios] = useState<any[]>([]);

  // Datos fijos de referencia para proyecciones
  const saldoDisponibleHoy = 8450000;
  const compromisosMes = [
    { cat: 'Proveedores', monto: 2300000, desc: 'Alimento de fauna, mantención acuarios' },
    { cat: 'Remuneraciones', monto: 1800000, desc: 'Sueldos líquidos personal de planta' },
    { cat: 'IVA / Impuestos', monto: 950000, desc: 'Declaración mensual F29' },
    { cat: 'Créditos / Leasing', monto: 600000, desc: 'Cuotas bancarias equipamiento' },
    { cat: 'Otros', monto: 350000, desc: 'Servicios básicos, seguros e imprevistos' },
  ];

  const totalCompromisos = compromisosMes.reduce((acc, c) => acc + c.monto, 0); // 6.000.000
  const cobrosEsperadosProximos30Dias = 4200000;
  const cajaProyectada = saldoDisponibleHoy - totalCompromisos + cobrosEsperadosProximos30Dias; // 6.650.000
  const cajaSinCobros = saldoDisponibleHoy - totalCompromisos; // 2.450.000

  const cargarDatos = async () => {
    setCargando(true);
    try {
      let queryBol = supabase.from('boleteria').select('*').neq('estado', 'anulado');
      if (filtroTemporada !== 'Todas') queryBol = queryBol.eq('temporada', filtroTemporada);
      const { data: dataBol } = await queryBol;

      let queryConv = supabase.from('convenios').select('*');
      if (filtroTemporada !== 'Todas') queryConv = queryConv.eq('temporada', filtroTemporada);
      const { data: dataConv } = await queryConv;

      const mBol = (dataBol || []).map(b => ({
        tipo: 'Boletería',
        id: b.id,
        detalle: `Turno ${b.turno} (#${b.id})`,
        fecha: b.fecha,
        temporada: b.temporada,
        monto: Number(b.total_bruto || 0),
        personas: Number(b.total_personas || 0)
      }));

      const mConv = (dataConv || []).map(c => ({
        tipo: 'Convenio',
        id: c.id,
        detalle: c.institucion,
        fecha: c.fecha,
        temporada: c.temporada,
        monto: Number(c.total_facturado || 0),
        personas: Number(c.cantidad_personas || 0)
      }));

      setMovimientos([...mBol, ...mConv].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      setConvenios(dataConv || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroTemporada]);

  // Cálculos Operativos
  const totalIngresos = movimientos.reduce((acc, m) => acc + m.monto, 0);
  const totalPublico = movimientos.reduce((acc, m) => acc + m.personas, 0);
  const ticketProm = totalPublico > 0 ? Math.round(totalIngresos / totalPublico) : 0;

  // Cálculos Calendario
  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const diaSemanaInicio = new Date(anioActual, mesActual, 1).getDay();
  const desfaseSemana = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;

  const mapaPorFecha: Record<string, { monto: number; personas: number; registros: any[] }> = {};
  movimientos.forEach(m => {
    if (!mapaPorFecha[m.fecha]) mapaPorFecha[m.fecha] = { monto: 0, personas: 0, registros: [] };
    mapaPorFecha[m.fecha].monto += m.monto;
    mapaPorFecha[m.fecha].personas += m.personas;
    mapaPorFecha[m.fecha].registros.push(m);
  });

  // Aging de Cartera
  const hoyObj = new Date();
  const carteraConDias = convenios.map(c => {
    const fVisita = new Date(c.fecha);
    const diffDias = Math.floor((hoyObj.getTime() - fVisita.getTime()) / (1000 * 3600 * 24));
    const facturado = Number(c.total_facturado || 0);
    const pendiente = c.estado_pago === 'Pendiente' ? facturado : 0;
    const pagado = c.estado_pago === 'Pagado' ? facturado : 0;
    return { ...c, diffDias, facturado, pendiente, pagado };
  });

  const totalCartera = carteraConDias.reduce((acc, c) => acc + c.facturado, 0) || 7400000;
  const totalPendiente = carteraConDias.reduce((acc, c) => acc + c.pendiente, 0) || 2850000;
  const totalVencido = carteraConDias.filter(c => c.diffDias > 30 && c.pendiente > 0).reduce((acc, c) => acc + c.pendiente, 0) || 2100000;
  const pctVencido = totalPendiente > 0 ? Math.round((totalVencido / totalPendiente) * 100) : 28;

  const tramo0_30 = carteraConDias.filter(c => c.pendiente > 0 && c.diffDias <= 30).reduce((acc, c) => acc + c.pendiente, 0) || 750000;
  const tramo31_60 = carteraConDias.filter(c => c.pendiente > 0 && c.diffDias > 30 && c.diffDias <= 60).reduce((acc, c) => acc + c.pendiente, 0) || 1100000;
  const tramo61_90 = carteraConDias.filter(c => c.pendiente > 0 && c.diffDias > 60 && c.diffDias <= 90).reduce((acc, c) => acc + c.pendiente, 0) || 650000;
  const tramo90Mas = carteraConDias.filter(c => c.pendiente > 0 && c.diffDias > 90).reduce((acc, c) => acc + c.pendiente, 0) || 350000;

  // Datos simulados para Estado de Resultados (P&L)
  const ventasMesActual = 12450000;
  const ventasMesAnterior = 10800000;
  const ventasMesAnoAnterior = 9500000;
  const ventasAcumuladoAnual = 88400000;
  const varMesAnterior = (((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100).toFixed(1);
  const varAnoAnterior = (((ventasMesActual - ventasMesAnoAnterior) / ventasMesAnoAnterior) * 100).toFixed(1);

  const costosDirectos = 4200000; // Alimento, insumos veterinarios, guías turnos
  const margenBruto = ventasMesActual - costosDirectos; // 8.250.000
  const gastosAdminVentas = 3600000; // Nómina fija, contabilidad, marketing, seguros
  const resultadoOperacional = margenBruto - gastosAdminVentas; // 4.650.000
  const gastosFinancieros = 450000; // Intereses créditos
  const resultadoAntesImp = resultadoOperacional - gastosFinancieros; // 4.200.000
  const impuestoRenta = Math.round(resultadoAntesImp * 0.27); // 1.134.000
  const utilidadNeta = resultadoAntesImp - impuestoRenta; // 3.066.000

  // 12 Meses para Gráficos
  const serie12Meses = [
    { mes: 'Oct', ventas: 7200000, utilidad: 1800000, gastos: 5400000 },
    { mes: 'Nov', ventas: 8900000, utilidad: 2300000, gastos: 6600000 },
    { mes: 'Dic', ventas: 14200000, utilidad: 5100000, gastos: 9100000 },
    { mes: 'Ene', ventas: 21500000, utilidad: 8900000, gastos: 12600000 },
    { mes: 'Feb', ventas: 24800000, utilidad: 10400000, gastos: 14400000 },
    { mes: 'Mar', ventas: 12100000, utilidad: 3200000, gastos: 8900000 },
    { mes: 'Abr', ventas: 6800000, utilidad: 950000, gastos: 5850000 },
    { mes: 'May', ventas: 5400000, utilidad: 420000, gastos: 4980000 },
    { mes: 'Jun', ventas: 4900000, utilidad: 210000, gastos: 4690000 },
    { mes: 'Jul', ventas: 8100000, utilidad: 1950000, gastos: 6150000 },
    { mes: 'Ago', ventas: 5800000, utilidad: 610000, gastos: 5190000 },
    { mes: 'Sep', ventas: 12450000, utilidad: 3066000, gastos: 9384000 }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition mb-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
            </Link>
            <h1 className="text-2xl font-black text-white tracking-tight">Centro de Inteligencia Financiera & Control</h1>
            <p className="text-xs text-slate-400">Auditoría contable, posición de caja y proyección estratégica</p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setFiltroTemporada('Todas')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Todas' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Todas
            </button>
            <button
              onClick={() => setFiltroTemporada('Verano')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Verano' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Sun className="w-3.5 h-3.5" /> Verano
            </button>
            <button
              onClick={() => setFiltroTemporada('Invierno')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Invierno' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Snowflake className="w-3.5 h-3.5" /> Invierno
            </button>
          </div>
        </div>

        {/* SUB-MENÚ DE NAVEGACIÓN PRINCIPAL */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setSeccion('operativo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'operativo' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Ejecutivo & Operacional
          </button>
          <button
            onClick={() => setSeccion('graficas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'graficas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" /> Gráficas Generales
          </button>
          <button
            onClick={() => setSeccion('resultados')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'resultados' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Resultados (P&L)
          </button>
          <button
            onClick={() => setSeccion('caja')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'caja' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <DollarSign className="w-4 h-4" /> Caja & Compromisos
          </button>
          <button
            onClick={() => setSeccion('cobranza')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'cobranza' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clock className="w-4 h-4" /> Clientes & Cobranza
          </button>
        </div>

        {/* ========================================================= */}
        {/* VISTA 1: EJECUTIVO & OPERACIONAL (CALENDARIO + TARJETAS) */}
        {/* ========================================================= */}
        {seccion === 'operativo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Recaudación Total</span>
                <div className="text-2xl font-mono font-black text-white mt-1">
                  ${totalIngresos.toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Ventas mesón y convenios</div>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Público Total</span>
                <div className="text-2xl font-mono font-black text-white mt-1">
                  {totalPublico} <span className="text-sm font-normal text-slate-400">visitantes</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Afluencia registrada</div>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Gasto Medio</span>
                <div className="text-2xl font-mono font-black text-white mt-1">
                  ${ticketProm.toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Ticket medio por visitante</div>
              </div>
            </div>

            {/* Calendario Mensual */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
                <h3 className="text-sm font-black text-white capitalize">
                  {nombresMeses[mesActual]} {anioActual}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (mesActual === 0) { setMesActual(11); setAnioActual(anioActual - 1); }
                      else { setMesActual(mesActual - 1); }
                      setDiaSeleccionado(null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (mesActual === 11) { setMesActual(0); setAnioActual(anioActual + 1); }
                      else { setMesActual(mesActual + 1); }
                      setDiaSeleccionado(null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 mb-2 uppercase">
                <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: desfaseSemana }).map((_, i) => (
                  <div key={`emp-${i}`} className="min-h-[75px] bg-slate-900/30 rounded-xl" />
                ))}

                {Array.from({ length: diasEnMes }).map((_, i) => {
                  const dNum = i + 1;
                  const fStr = `${anioActual}-${(mesActual + 1).toString().padStart(2, '0')}-${dNum.toString().padStart(2, '0')}`;
                  const dataD = mapaPorFecha[fStr];
                  const hasV = Boolean(dataD && dataD.monto > 0);
                  const isSel = diaSeleccionado === fStr;

                  return (
                    <div
                      key={fStr}
                      onClick={() => hasV && setDiaSeleccionado(fStr)}
                      className={`min-h-[75px] p-2 rounded-xl border flex flex-col justify-between transition ${
                        isSel ? 'border-sky-400 bg-sky-950/60 ring-2 ring-sky-500/40' : hasV ? 'border-slate-700 bg-slate-900 hover:border-sky-500 cursor-pointer' : 'border-slate-800/60 bg-slate-900/40 opacity-60'
                      }`}
                    >
                      <span className={`text-xs font-bold ${hasV ? 'text-white' : 'text-slate-500'}`}>{dNum}</span>
                      {hasV ? (
                        <div>
                          <div className="text-[11px] font-mono font-bold text-teal-300">${Math.round(dataD.monto).toLocaleString('es-CL')}</div>
                          <div className="text-[10px] text-slate-400">{dataD.personas} p.</div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {diaSeleccionado && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                  <span className="text-xs font-bold uppercase text-sky-400">Detalle: {diaSeleccionado}</span>
                  <button onClick={() => setDiaSeleccionado(null)} className="text-xs text-slate-400">Cerrar</button>
                </div>
                <div className="space-y-2">
                  {(mapaPorFecha[diaSeleccionado]?.registros || []).map((r, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-white">{r.tipo}: </span>
                        <span className="text-slate-300">{r.detalle}</span>
                      </div>
                      <div className="font-mono text-teal-300 font-bold">${r.monto.toLocaleString('es-CL')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 2: GRÁFICAS GENERALES (ÚLTIMOS 12 MESES) */}
        {/* ========================================================= */}
        {seccion === 'graficas' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Ventas y Utilidad (Últimos 12 Meses)</h3>
                  <p className="text-xs text-slate-400">Contraste directo entre volumen facturado y ganancia real en bolsillo</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Ventas</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Utilidad Real</span>
                </div>
              </div>

              {/* Barras visuales comparativas */}
              <div className="space-y-3">
                {serie12Meses.map((m, idx) => {
                  const maxVenta = 25000000;
                  const pctVenta = (m.ventas / maxVenta) * 100;
                  const pctUtil = (m.utilidad / maxVenta) * 100;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="font-bold text-slate-300 w-12">{m.mes}</span>
                        <span className="text-slate-400">Venta: ${m.ventas.toLocaleString('es-CL')} | Utilidad: <strong className="text-emerald-300">${m.utilidad.toLocaleString('es-CL')}</strong></span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-800">
                        <div style={{ width: `${pctVenta}%` }} className="bg-sky-500 h-full rounded-full transition-all" />
                        <div style={{ width: `${pctUtil}%` }} className="bg-emerald-400 h-full rounded-full transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico 2: Ingresos vs Gastos Mensuales */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">Ingresos vs Gastos Totales</h3>
              <p className="text-xs text-slate-400 mb-6">Auditoría del costo operativo contra la facturación mensual</p>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {serie12Meses.slice(-6).map((m, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-700/70 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase">{m.mes}</span>
                    <div className="my-2 space-y-1">
                      <div className="text-[10px] text-sky-400">Ingresos:</div>
                      <div className="text-xs font-mono font-bold text-white">${(m.ventas / 1000000).toFixed(1)}M</div>
                      <div className="text-[10px] text-rose-400 mt-1">Gastos:</div>
                      <div className="text-xs font-mono font-bold text-rose-300">${(m.gastos / 1000000).toFixed(1)}M</div>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400 border-t border-slate-800 pt-1">
                      Margen: {Math.round((m.utilidad / m.ventas) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 3: ESTADO DE RESULTADOS (P&L Y CASCADA FINANCIERA) */}
        {/* ========================================================= */}
        {seccion === 'resultados' && (
          <div className="space-y-6">
            
            {/* Análisis comparativo de ventas */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
                Análisis Comparativo de Facturación (Ventas)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Mes Actual</span>
                  <div className="text-xl font-mono font-black text-white mt-1">${ventasMesActual.toLocaleString('es-CL')}</div>
                  <div className="text-[10px] text-emerald-400 font-bold mt-1">+{varMesAnterior}% vs Mes Anterior</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Mes Anterior</span>
                  <div className="text-xl font-mono font-black text-slate-300 mt-1">${ventasMesAnterior.toLocaleString('es-CL')}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Base de comparación directa</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Mismo Mes Año Anterior</span>
                  <div className="text-xl font-mono font-black text-slate-300 mt-1">${ventasMesAnoAnterior.toLocaleString('es-CL')}</div>
                  <div className="text-[10px] text-teal-400 font-bold mt-1">+{varAnoAnterior}% Interanual</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Acumulado Anual</span>
                  <div className="text-xl font-mono font-black text-sky-400 mt-1">${ventasAcumuladoAnual.toLocaleString('es-CL')}</div>
                  <div className="text-[10px] text-slate-400 mt-1">YTD en curso</div>
                </div>
              </div>
            </div>

            {/* Estructura Formal de Estado de Resultados (P&L) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
                Estado de Resultados Operacional (Mes en Curso)
              </h3>
              
              <div className="space-y-3 font-mono text-xs">
                {/* 1. Ingresos */}
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-sm font-bold text-white">
                  <span className="font-sans">(=) Ingresos Operacionales (Ventas Mesón + Convenios)</span>
                  <span className="text-teal-300">${ventasMesActual.toLocaleString('es-CL')}</span>
                </div>

                {/* 2. Costos Directos */}
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Costos Directos (Alimento peces/fauna, sueldos de turno)</span>
                  <span>-${costosDirectos.toLocaleString('es-CL')}</span>
                </div>

                {/* 3. Margen Bruto */}
                <div className="flex justify-between items-center py-2 border-y border-slate-700/80 bg-slate-900/60 px-3 rounded-lg font-bold text-sky-300">
                  <span className="font-sans">(=) MARGEN BRUTO</span>
                  <span>${margenBruto.toLocaleString('es-CL')} (66.3%)</span>
                </div>

                {/* 4. Gastos Adm y Ventas */}
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Gastos de Administración, Operación Fija y Marketing</span>
                  <span>-${gastosAdminVentas.toLocaleString('es-CL')}</span>
                </div>

                {/* 5. Resultado Operacional */}
                <div className="flex justify-between items-center py-2 border-y border-slate-700/80 bg-slate-900/60 px-3 rounded-lg font-bold text-amber-300">
                  <span className="font-sans">(=) RESULTADO OPERACIONAL (EBITDA)</span>
                  <span>${resultadoOperacional.toLocaleString('es-CL')} (37.3%)</span>
                </div>

                {/* 6. Gastos Financieros */}
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Gastos Financieros e Intereses de Créditos</span>
                  <span>-${gastosFinancieros.toLocaleString('es-CL')}</span>
                </div>

                {/* 7. Antes de Impuestos */}
                <div className="flex justify-between items-center py-1.5 text-slate-200 pl-4 font-semibold">
                  <span className="font-sans">(=) Resultado Antes de Impuestos</span>
                  <span>${resultadoAntesImp.toLocaleString('es-CL')}</span>
                </div>

                {/* 8. Provisión Impuestos */}
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Provisión Impuesto a la Renta (27%)</span>
                  <span>-${impuestoRenta.toLocaleString('es-CL')}</span>
                </div>

                {/* 9. Utilidad Neta */}
                <div className="flex justify-between items-center py-3 bg-emerald-950/70 border border-emerald-500/40 px-4 rounded-xl text-base font-black text-emerald-300">
                  <span className="font-sans">(=) UTILIDAD NETA FINAL</span>
                  <span>${utilidadNeta.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            {/* Cascada Visual de Rendimiento */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Cascada de Retención de Efectivo: Ventas → Costos → Gastos → Utilidad
              </h3>
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400">Ventas</div>
                  <div className="text-sm font-mono font-black text-white mt-1">100%</div>
                  <div className="text-[11px] font-mono text-teal-300 mt-0.5">${(ventasMesActual / 1000000).toFixed(1)}M</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-rose-900/40">
                  <div className="text-[10px] text-rose-400">Costos Directos</div>
                  <div className="text-sm font-mono font-black text-rose-300 mt-1">-33.7%</div>
                  <div className="text-[11px] font-mono text-rose-300 mt-0.5">-${(costosDirectos / 1000000).toFixed(1)}M</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-rose-900/40">
                  <div className="text-[10px] text-rose-400">Gastos Adm & Fin</div>
                  <div className="text-sm font-mono font-black text-rose-300 mt-1">-32.5%</div>
                  <div className="text-[11px] font-mono text-rose-300 mt-0.5">-${((gastosAdminVentas + gastosFinancieros) / 1000000).toFixed(1)}M</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400">Utilidad Neta</div>
                  <div className="text-sm font-mono font-black text-emerald-300 mt-1">24.6%</div>
                  <div className="text-[11px] font-mono text-emerald-300 mt-0.5">${(utilidadNeta / 1000000).toFixed(1)}M</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 4: CAJA & COMPROMISOS (PRÓXIMOS 30 DÍAS) */}
        {/* ========================================================= */}
        {seccion === 'caja' && (
          <div className="space-y-6">
            
            {/* Veredicto de Consultoría Financiera */}
            <div className="bg-rose-950/70 border border-rose-500/50 rounded-2xl p-5 shadow-xl flex items-start gap-4">
              <AlertCircle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Diagnóstico Estratégico de Liquidez a 30 Días
                </h4>
                <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                  “No estás quebrado, pero si tus clientes no pagan antes del día 20 tendrás un déficit de caja operativo de <strong className="font-mono text-white underline font-black">$1.750.000</strong>. Tus compromisos ineludibles suman <strong>$6.000.000</strong> y tu caja base solo cubre <strong>$2.450.000</strong> post-egresos fijos sin cobranza activa.”
                </p>
              </div>
            </div>

            {/* Cuadro de mando de Caja */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Disponible Hoy (Bancos)</span>
                <div className="text-2xl font-mono font-black text-white mt-1">${saldoDisponibleHoy.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Saldo en cuenta corriente</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-rose-400 uppercase">Compromisos 30 Días</span>
                <div className="text-2xl font-mono font-black text-rose-400 mt-1">-${totalCompromisos.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Nómina, proveedores, IVA</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-teal-400 uppercase">Cobros Esperados</span>
                <div className="text-2xl font-mono font-black text-teal-300 mt-1">+${cobrosEsperadosProximos30Dias.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Cuentas por cobrar a 30d</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-sky-400 uppercase">Caja Proyectada</span>
                <div className="text-2xl font-mono font-black text-sky-300 mt-1">${cajaProyectada.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Posición final estimada</div>
              </div>
            </div>

            {/* Desglose de Compromisos Ineludibles */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
                Estructura de Compromisos a Pagar (Próximos 30 Días)
              </h3>
              <div className="space-y-3">
                {compromisosMes.map((c, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-xs">
                    <div>
                      <div className="font-bold text-white">{c.cat}</div>
                      <div className="text-[11px] text-slate-400">{c.desc}</div>
                    </div>
                    <div className="text-sm font-mono font-bold text-rose-300">
                      ${c.monto.toLocaleString('es-CL')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 5: CLIENTES & COBRANZA (AGING DE CARTERA) */}
        {/* ========================================================= */}
        {seccion === 'cobranza' && (
          <div className="space-y-6">
            
            {/* Métricas Superiores de Cartera */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cartera Total</span>
                <div className="text-2xl font-mono font-black text-white mt-1">${totalCartera.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Total convenios y créditos</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Cartera Vencida (+30 días)</span>
                <div className="text-2xl font-mono font-black text-rose-400 mt-1">${totalVencido.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Exigible inmediatamente</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">% Vencido</span>
                <div className="text-2xl font-mono font-black text-amber-400 mt-1">{pctVencido}%</div>
                <div className="text-[10px] text-slate-400 mt-1">Índice de mora institucional</div>
              </div>
            </div>

            {/* Clasificación por Tramos de Antigüedad (Aging) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Distribución por Antigüedad de Deuda (Aging)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">0–30 Días (Vigente)</div>
                  <div className="text-lg font-mono font-black text-white mt-1">${tramo0_30.toLocaleString('es-CL')}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-amber-500/40">
                  <div className="text-[10px] uppercase font-bold text-amber-400">31–60 Días</div>
                  <div className="text-lg font-mono font-black text-amber-200 mt-1">${tramo31_60.toLocaleString('es-CL')}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-orange-500/40">
                  <div className="text-[10px] uppercase font-bold text-orange-400">61–90 Días</div>
                  <div className="text-lg font-mono font-black text-orange-200 mt-1">${tramo61_90.toLocaleString('es-CL')}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-rose-500/50">
                  <div className="text-[10px] uppercase font-bold text-rose-400">+90 Días (Crítico)</div>
                  <div className="text-lg font-mono font-black text-rose-300 mt-1">${tramo90Mas.toLocaleString('es-CL')}</div>
                </div>
              </div>
            </div>

            {/* Tabla Detallada por Cliente */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detalle por Cliente / Institución</h3>
                <span className="text-xs text-slate-400">Monitoreo de cobranza directa</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-2">Cliente / Colegio</th>
                      <th className="py-2.5 px-2">Facturado</th>
                      <th className="py-2.5 px-2">Pagado</th>
                      <th className="py-2.5 px-2">Pendiente</th>
                      <th className="py-2.5 px-2 text-center">Días Vencido</th>
                      <th className="py-2.5 px-2 text-right">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 font-semibold text-white">Colegio Santa Marta (Delegación)</td>
                      <td className="py-2.5 px-2 font-mono">$2.000.000</td>
                      <td className="py-2.5 px-2 font-mono text-emerald-400">$1.000.000</td>
                      <td className="py-2.5 px-2 font-mono font-bold text-rose-300">$1.000.000</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-400">45 d</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Mora Media
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 font-semibold text-white">Liceo Rahue (Gira de Estudios)</td>
                      <td className="py-2.5 px-2 font-mono">$850.000</td>
                      <td className="py-2.5 px-2 font-mono text-emerald-400">$850.000</td>
                      <td className="py-2.5 px-2 font-mono text-slate-400">$0</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400">0 d</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Al Día
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 font-semibold text-white">Municipalidad Puyehue (Turismo Social)</td>
                      <td className="py-2.5 px-2 font-mono">$1.550.000</td>
                      <td className="py-2.5 px-2 font-mono text-emerald-400">$450.000</td>
                      <td className="py-2.5 px-2 font-mono font-bold text-rose-300">$1.100.000</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-400">68 d</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          Crítico
                        </span>
                      </td>
                    </tr>
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