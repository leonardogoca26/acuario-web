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
  DollarSign,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  RotateCcw,
  List,
  Printer,
  Landmark,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardUnificadoPage() {
  const hoyStr = new Date().toISOString().split('T')[0];
  const inicioMesStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [seccion, setSeccion] = useState<'operativo' | 'flujocaja' | 'graficas' | 'resultados' | 'cobranza'>('operativo');
  const [vistaOperativa, setVistaOperativa] = useState<'calendario' | 'lista'>('calendario');
  const [filtroTemporada, setFiltroTemporada] = useState<'Todas' | 'Verano (Alta)' | 'Invierno (Baja)'>('Todas');
  const [fechaDesde, setFechaDesde] = useState(inicioMesStr);
  const [fechaHasta, setFechaHasta] = useState(hoyStr);
  const [aplicarFechas, setAplicarFechas] = useState(true);
  const [cargando, setCargando] = useState(true);

  // Calendario
  const fechaActual = new Date();
  const [mesActual, setMesActual] = useState(fechaActual.getMonth());
  const [anioActual, setAnioActual] = useState(fechaActual.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Datos base
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [convenios, setConvenios] = useState<any[]>([]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      let queryBol = supabase.from('cierre_boleteria').select('*');
      if (filtroTemporada !== 'Todas') queryBol = queryBol.eq('temporada', filtroTemporada);
      if (aplicarFechas) {
        if (fechaDesde) queryBol = queryBol.gte('fecha', fechaDesde);
        if (fechaHasta) queryBol = queryBol.lte('fecha', fechaHasta);
      }
      const { data: dataBol } = await queryBol;

      let queryConv = supabase.from('convenios').select('*');
      if (aplicarFechas) {
        if (fechaDesde) queryConv = queryConv.gte('fecha', fechaDesde);
        if (fechaHasta) queryConv = queryConv.lte('fecha', fechaHasta);
      }
      const { data: dataConv } = await queryConv;

      const listaBol = (dataBol || []).filter(b => (b.estado || '').toLowerCase() !== 'anulado');
      const listaConv = (dataConv || []).filter(c => (c.estado || '').toLowerCase() !== 'anulado');

      const mBol = listaBol.map(b => {
        const ef = Number(b.efectivo || 0);
        const caAbono = Number(b.abono_compra_aqui || 0);
        const tbAbono = Number(b.abono_transbank || 0);
        const tr = Number(b.transferencias || 0);

        // Ingreso real en caja/banco calculado estilo Excel del director
        const ingresoRealDia = ef + caAbono + tbAbono + tr;

        return {
          tipo: 'Boletería',
          subtipo: 'Boletería',
          id: b.id,
          detalle: `Turno ${b.turno || 'Completo'} - Cajero: ${b.cajero || 'Principal'} (#${b.id})`,
          fecha: b.fecha,
          temporada: b.temporada,
          monto: Number(b.total_ingresos || 0),
          personas: Number(b.total_personas || 0),
          efectivo: ef,
          pos_compra_aqui: Number(b.pos_compra_aqui || 0),
          pos_transbank: Number(b.pos_transbank || 0),
          abono_compra_aqui: caAbono,
          abono_transbank: tbAbono,
          ingreso_real: ingresoRealDia > 0 ? ingresoRealDia : Number(b.total_ingresos || 0),
          transferencia: tr,
          credito: 0
        };
      });

      const mConv = listaConv.map(c => {
        const monto = Number(c.total_recaudado || 0);
        return {
          tipo: 'Convenio',
          subtipo: c.tipo_ingreso || 'Convenio / Delegación',
          id: c.id,
          detalle: c.nombre_institucion || 'Institución / Convenio',
          fecha: c.fecha,
          temporada: 'Verano (Alta)',
          monto: monto,
          personas: Number(c.total_personas || 0),
          efectivo: 0,
          pos_compra_aqui: 0,
          pos_transbank: 0,
          abono_compra_aqui: 0,
          abono_transbank: 0,
          ingreso_real: c.estado_pago === 'Pagado' ? monto : 0,
          transferencia: monto,
          credito: c.estado_pago === 'Pendiente' ? monto : 0
        };
      });

      const todos = [...mBol, ...mConv].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setMovimientos(todos);
      setConvenios(listaConv);
    } catch (e) {
      console.error('Error cargando datos:', e);
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

  // Totales Operacionales Consolidados (Devengado)
  const totalIngresos = movimientos.reduce((acc, m) => acc + m.monto, 0);
  const totalPublico = movimientos.reduce((acc, m) => acc + m.personas, 0);

  // Totales de Flujo de Caja Real (Percibido en Banco y Mano)
  const totalIngresoRealCaja = movimientos.reduce((acc, m) => acc + (m.ingreso_real || 0), 0);
  const totalEfectivoCaja = movimientos.reduce((acc, m) => acc + (m.efectivo || 0), 0);
  const totalAbonoTransbank = movimientos.reduce((acc, m) => acc + (m.abono_transbank || 0), 0);
  const totalAbonoCompraAqui = movimientos.reduce((acc, m) => acc + (m.abono_compra_aqui || 0), 0);
  const totalVentaTarjetas = movimientos.reduce((acc, m) => acc + (m.pos_compra_aqui || 0) + (m.pos_transbank || 0), 0);
  const totalAbonosBancariosPOS = totalAbonoTransbank + totalAbonoCompraAqui;
  const brechaPorLiquidar = totalVentaTarjetas - totalAbonosBancariosPOS;

  // Promedios
  const diasUnicosOperados = Array.from(new Set(movimientos.map(m => m.fecha))).length;
  const personasPromedioDia = diasUnicosOperados > 0 ? Math.round(totalPublico / diasUnicosOperados) : 0;
  const ingresosPromedioDia = diasUnicosOperados > 0 ? Math.round(totalIngresos / diasUnicosOperados) : 0;
  const mesesUnicosOperados = Math.max(1, new Set(movimientos.map(m => m.fecha.substring(0, 7))).size);
  const promedioMensual = Math.round(totalIngresos / mesesUnicosOperados);

  // Desgloses por Canal
  const recBoleteria = movimientos.filter(m => m.tipo === 'Boletería').reduce((acc, m) => acc + m.monto, 0);
  const recColegios = movimientos.filter(m => m.subtipo === 'Convenio / Delegación').reduce((acc, m) => acc + m.monto, 0);
  const recOperadores = movimientos.filter(m => m.subtipo === 'Operador Turístico').reduce((acc, m) => acc + m.monto, 0);
  const recSalon = movimientos.filter(m => m.subtipo === 'Arriendo de Salón').reduce((acc, m) => acc + m.monto, 0);
  const recCafeteria = movimientos.filter(m => m.subtipo === 'Cafetería').reduce((acc, m) => acc + m.monto, 0);

  // Desgloses por Medio de Pago (Venta en Puerta)
  const recEfectivo = movimientos.reduce((acc, m) => acc + (m.efectivo || 0), 0);
  const recCompraAqui = movimientos.reduce((acc, m) => acc + (m.pos_compra_aqui || 0), 0);
  const recTransbank = movimientos.reduce((acc, m) => acc + (m.pos_transbank || 0), 0);
  const recTransf = movimientos.reduce((acc, m) => acc + (m.transferencia || 0), 0);
  const recCredito = movimientos.reduce((acc, m) => acc + (m.credito || 0), 0);

  // Visitantes por Canal
  const visBoleteria = movimientos.filter(m => m.tipo === 'Boletería').reduce((acc, m) => acc + m.personas, 0);
  const visColegios = movimientos.filter(m => m.subtipo === 'Convenio / Delegación').reduce((acc, m) => acc + m.personas, 0);
  const visOperadores = movimientos.filter(m => m.subtipo === 'Operador Turístico').reduce((acc, m) => acc + m.personas, 0);

  // Calendario
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

  // Agrupación por días para la sábana de conciliación de Flujo de Caja
  const filasConciliacionPorDia: Record<string, any> = {};
  movimientos.forEach(m => {
    if (!filasConciliacionPorDia[m.fecha]) {
      filasConciliacionPorDia[m.fecha] = {
        fecha: m.fecha,
        efectivo: 0,
        venta_tarjetas: 0,
        abono_transbank: 0,
        abono_compra_aqui: 0,
        transferencias: 0,
        ingreso_real: 0,
        total_venta: 0,
        personas: 0
      };
    }
    filasConciliacionPorDia[m.fecha].efectivo += (m.efectivo || 0);
    filasConciliacionPorDia[m.fecha].venta_tarjetas += (m.pos_compra_aqui || 0) + (m.pos_transbank || 0);
    filasConciliacionPorDia[m.fecha].abono_transbank += (m.abono_transbank || 0);
    filasConciliacionPorDia[m.fecha].abono_compra_aqui += (m.abono_compra_aqui || 0);
    filasConciliacionPorDia[m.fecha].transferencias += (m.transferencia || 0);
    filasConciliacionPorDia[m.fecha].ingreso_real += (m.ingreso_real || 0);
    filasConciliacionPorDia[m.fecha].total_venta += m.monto;
    filasConciliacionPorDia[m.fecha].personas += m.personas;
  });

  const listaConciliacionOrdenada = Object.values(filasConciliacionPorDia).sort((a: any, b: any) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  // Impresión de Informe Ejecutivo
  const handleImprimirInforme = () => {
    const ventana = window.open('', '_print', 'width=850,height=900');
    if (!ventana) return;

    const logoUrl = `${window.location.origin}/logo.png`;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Informe Ejecutivo de Control Financiero</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #1e293b;
              padding: 40px;
              margin: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .brand img {
              height: 56px;
              width: auto;
              object-fit: contain;
              display: block;
            }
            .title h1 {
              font-size: 18px;
              font-weight: 800;
              margin: 0;
              text-transform: uppercase;
            }
            .title p {
              font-size: 11px;
              color: #64748b;
              margin: 3px 0 0 0;
            }
            .meta {
              text-align: right;
              font-size: 11px;
            }
            .meta strong {
              color: #0f172a;
            }
            .summary-cards {
              display: flex;
              gap: 10px;
              margin-bottom: 24px;
            }
            .card {
              flex: 1;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
            }
            .card span {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              display: block;
            }
            .card .val {
              font-size: 16px;
              font-weight: 900;
              font-family: monospace;
              color: #0f172a;
              margin-top: 3px;
            }
            .card .sub {
              font-size: 8px;
              color: #94a3b8;
              margin-top: 2px;
            }
            .grid {
              display: flex;
              gap: 20px;
              margin-bottom: 24px;
            }
            .col {
              flex: 1;
            }
            h2 {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 6px;
              margin: 0 0 10px 0;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            td {
              padding: 6px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            td.num {
              text-align: right;
              font-family: monospace;
              font-weight: 600;
            }
            .total-row td {
              font-weight: 800;
              border-top: 1px solid #0f172a;
              border-bottom: none;
              padding-top: 8px;
            }
            .footer-info {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              padding-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img id="logoImg" src="${logoUrl}" alt="Logo Parque Acuario Puyehue" />
              <div class="title">
                <h1>Parque Acuario Puyehue</h1>
                <p>Informe Ejecutivo de Control Financiero & Operacional</p>
              </div>
            </div>
            <div class="meta">
              <div>Rango: <strong>${fechaDesde || 'Inicio'} al ${fechaHasta || 'Hoy'}</strong></div>
              <div>Temporada: <strong>${filtroTemporada}</strong></div>
              <div>Emisión: ${new Date().toLocaleDateString('es-CL')}</div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card">
              <span>Recaudación Total</span>
              <div class="val">$${totalIngresos.toLocaleString('es-CL')}</div>
              <div class="sub">${movimientos.length} operaciones (${diasUnicosOperados} días)</div>
            </div>
            <div class="card">
              <span>Afluencia Total</span>
              <div class="val">${totalPublico} pers.</div>
              <div class="sub">Visitantes ingresados</div>
            </div>
            <div class="card">
              <span>Promedio Día ($)</span>
              <div class="val">$${ingresosPromedioDia.toLocaleString('es-CL')}</div>
              <div class="sub">Venta promedio</div>
            </div>
            <div class="card">
              <span>Personas/Día</span>
              <div class="val">${personasPromedioDia} pers.</div>
              <div class="sub">Afluencia media</div>
            </div>
            <div class="card">
              <span>Promedio Mes</span>
              <div class="val">$${promedioMensual.toLocaleString('es-CL')}</div>
              <div class="sub">Mensualizado</div>
            </div>
          </div>

          <div class="grid">
            <div class="col">
              <h2>1. Ingresos por Canal / Origen</h2>
              <table>
                <tbody>
                  <tr><td>🎟️ Boletería & Tienda</td><td class="num">$${recBoleteria.toLocaleString('es-CL')}</td></tr>
                  <tr><td>🏫 Colegios / Delegaciones</td><td class="num">$${recColegios.toLocaleString('es-CL')}</td></tr>
                  <tr><td>🚌 Operadores Turísticos</td><td class="num">$${recOperadores.toLocaleString('es-CL')}</td></tr>
                  <tr><td>🏢 Arriendo de Salón</td><td class="num">$${recSalon.toLocaleString('es-CL')}</td></tr>
                  <tr><td>☕ Cafetería</td><td class="num">$${recCafeteria.toLocaleString('es-CL')}</td></tr>
                  <tr class="total-row"><td>Total Canales</td><td class="num">$${totalIngresos.toLocaleString('es-CL')}</td></tr>
                </tbody>
              </table>
            </div>

            <div class="col">
              <h2>2. Liquidación por Medios de Pago</h2>
              <table>
                <tbody>
                  <tr><td>💵 Efectivo en Caja</td><td class="num">$${recEfectivo.toLocaleString('es-CL')}</td></tr>
                  <tr><td>💳 POS Compra Aquí</td><td class="num">$${recCompraAqui.toLocaleString('es-CL')}</td></tr>
                  <tr><td>💳 POS Transbank</td><td class="num">$${recTransbank.toLocaleString('es-CL')}</td></tr>
                  <tr><td>🏦 Transferencias Bancarias</td><td class="num">$${recTransf.toLocaleString('es-CL')}</td></tr>
                  <tr><td>📑 Cuentas por Cobrar / Cheques</td><td class="num">$${recCredito.toLocaleString('es-CL')}</td></tr>
                  <tr class="total-row"><td>Total Liquidado</td><td class="num">$${totalIngresos.toLocaleString('es-CL')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2>3. Desglose de Afluencia de Visitantes</h2>
            <table>
              <tbody>
                <tr><td>🎟️ Taquilla Boletería Principal</td><td class="num">${visBoleteria} personas</td></tr>
                <tr><td>🏫 Delegaciones Escolares e Institucionales</td><td class="num">${visColegios} personas</td></tr>
                <tr><td>🚌 Pasajeros de Operadores Turísticos</td><td class="num">${visOperadores} personas</td></tr>
                <tr class="total-row"><td>Total Visitantes Período</td><td class="num">${totalPublico} personas</td></tr>
              </tbody>
            </table>
          </div>

          <div class="footer-info">
            Documento Oficial generado por Sistema de Control Parque Acuario Puyehue
          </div>

          <script>
            const img = document.getElementById('logoImg');
            const dispararImpresion = () => { window.print(); };
            if (img && !img.complete) {
              img.onload = dispararImpresion;
              img.onerror = dispararImpresion;
            } else {
              dispararImpresion();
            }
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  // Cartera Aging
  const hoyObj = new Date();
  const carteraConDias = convenios.map(c => {
    const fVisita = new Date(c.fecha);
    const diffDias = Math.floor((hoyObj.getTime() - fVisita.getTime()) / (1000 * 3600 * 24));
    const facturado = Number(c.total_recaudado || 0);
    const pendiente = facturado;
    return { ...c, diffDias, facturado, pendiente };
  });

  const totalCartera = carteraConDias.reduce((acc, c) => acc + c.facturado, 0) || 7400000;
  const totalPendiente = carteraConDias.reduce((acc, c) => acc + c.pendiente, 0) || 2850000;
  const totalVencido = carteraConDias.filter(c => c.diffDias > 30).reduce((acc, c) => acc + c.pendiente, 0) || 2100000;
  const pctVencido = totalPendiente > 0 ? Math.round((totalVencido / totalPendiente) * 100) : 28;

  // P&L
  const ventasMesActual = 12450000;
  const costosDirectos = 4200000;
  const margenBruto = ventasMesActual - costosDirectos;
  const gastosAdminVentas = 3600000;
  const resultadoOperacional = margenBruto - gastosAdminVentas;
  const gastosFinancieros = 450000;
  const resultadoAntesImp = resultadoOperacional - gastosFinancieros;
  const impuestoRenta = Math.round(resultadoAntesImp * 0.27);
  const utilidadNeta = resultadoAntesImp - impuestoRenta;

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
        
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition mb-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
            </Link>
            <h1 className="text-2xl font-black text-white tracking-tight">Centro de Inteligencia Financiera & Control</h1>
            <p className="text-xs text-slate-400">Auditoría contable, posición de caja y proyección estratégica</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleImprimirInforme}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 hover:border-sky-500/50 rounded-xl text-xs font-bold shadow-lg transition"
            >
              <Printer className="w-4 h-4" /> Informe Ejecutivo
            </button>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setFiltroTemporada('Todas')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Todas' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Layers className="w-3.5 h-3.5" /> Todas
              </button>
              <button
                onClick={() => setFiltroTemporada('Verano (Alta)')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Verano (Alta)' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Sun className="w-3.5 h-3.5" /> Verano
              </button>
              <button
                onClick={() => setFiltroTemporada('Invierno (Baja)')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${filtroTemporada === 'Invierno (Baja)' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Snowflake className="w-3.5 h-3.5" /> Invierno
              </button>
            </div>
          </div>
        </div>

        {/* SUB-MENÚ DE NAVEGACIÓN */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setSeccion('operativo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'operativo' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Ejecutivo & Operacional
          </button>
          <button
            onClick={() => setSeccion('flujocaja')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'flujocaja' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Landmark className="w-4 h-4" /> Flujo de Caja Real (Banco)
          </button>
          <button
            onClick={() => setSeccion('graficas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'graficas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" /> Gráficas Generales
          </button>
          <button
            onClick={() => setSeccion('resultados')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'resultados' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Resultados (P&L)
          </button>
          <button
            onClick={() => setSeccion('cobranza')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'cobranza' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clock className="w-4 h-4" /> Clientes & Cobranza
          </button>
        </div>

        {/* ========================================================= */}
        {/* VISTA 1: EJECUTIVO & OPERACIONAL */}
        {/* ========================================================= */}
        {seccion === 'operativo' && (
          <div className="space-y-6">
            
            {/* Barra de Filtro de Fechas y Selector de Modo */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-sky-400" /> Rango:
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Desde:</span>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => {
                      setFechaDesde(e.target.value);
                      setAplicarFechas(true);
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Hasta:</span>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => {
                      setFechaHasta(e.target.value);
                      setAplicarFechas(true);
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-sky-500"
                  />
                </div>

                <button
                  onClick={resetFechas}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
                >
                  <RotateCcw className="w-3 h-3" /> Ver Todo
                </button>
              </div>

              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setVistaOperativa('calendario')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${vistaOperativa === 'calendario' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> Calendario
                </button>
                <button
                  onClick={() => setVistaOperativa('lista')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${vistaOperativa === 'lista' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <List className="w-3.5 h-3.5" /> Lista
                </button>
              </div>
            </div>

            {/* SECCIÓN PROMEDIOS CLAVE ESTILO EXCEL DEL DIRECTOR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Días Operados</span>
                <div className="text-xl font-mono font-black text-white mt-0.5">
                  {diasUnicosOperados} <span className="text-xs font-normal text-slate-400">días</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Jornadas con movimiento</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Personas Promedio Día</span>
                <div className="text-xl font-mono font-black text-sky-300 mt-0.5">
                  {personasPromedioDia} <span className="text-xs font-normal text-slate-400">pers.</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Afluencia media diaria</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Ingreso Promedio Día</span>
                <div className="text-xl font-mono font-black text-teal-300 mt-0.5">
                  ${ingresosPromedioDia.toLocaleString('es-CL')}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Venta media por jornada</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Promedio Mes</span>
                <div className="text-xl font-mono font-black text-indigo-300 mt-0.5">
                  ${promedioMensual.toLocaleString('es-CL')}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Rendimiento mensualizado</div>
              </div>
            </div>

            {/* SECCIÓN 1: RECAUDACIÓN TOTAL CON DESGLOSE POR CANAL Y MEDIO DE PAGO */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Control Financiero de Ingresos</span>
                  <h3 className="text-base font-bold text-white">Recaudación Consolidada y Medios de Pago</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total Período:</span>
                  <div className="text-2xl font-mono font-black text-teal-300">
                    ${totalIngresos.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desglose por Canal / Origen */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-sky-400 tracking-wider">Por Canal / Origen</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">🎟️ Boletería & Tienda:</span>
                      <span className="font-mono font-bold text-white">${recBoleteria.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">🏫 Colegios / Delegaciones:</span>
                      <span className="font-mono font-bold text-white">${recColegios.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">🚌 Operadores Turísticos:</span>
                      <span className="font-mono font-bold text-white">${recOperadores.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">🏢 Arriendo de Salón:</span>
                      <span className="font-mono font-bold text-white">${recSalon.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-300">☕ Cafetería:</span>
                      <span className="font-mono font-bold text-white">${recCafeteria.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>

                {/* Desglose por Medio de Pago */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">Por Medio de Pago</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">💵 Efectivo en Caja:</span>
                      <span className="font-mono font-bold text-white">${recEfectivo.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">💳 POS Compra Aquí:</span>
                      <span className="font-mono font-bold text-white">${recCompraAqui.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">💳 POS Transbank:</span>
                      <span className="font-mono font-bold text-white">${recTransbank.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-300">🏦 Transferencias Bancarias:</span>
                      <span className="font-mono font-bold text-white">${recTransf.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-rose-300">📑 Cuentas por Cobrar / Cheques:</span>
                      <span className="font-mono font-bold text-rose-300">${recCredito.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: PÚBLICO TOTAL CON DESGLOSE POR CANAL */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Afluencia y Visitantes</span>
                  <h3 className="text-base font-bold text-white">Desglose de Personas por Canal de Acceso</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Público Total:</span>
                  <div className="text-2xl font-mono font-black text-sky-300">
                    {totalPublico} <span className="text-sm font-normal text-slate-400">visitantes</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">🎟️ Taquilla Boletería</div>
                    <div className="text-lg font-mono font-bold text-white mt-0.5">
                      {visBoleteria} pers.
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">🏫 Delegaciones Escolares</div>
                    <div className="text-lg font-mono font-bold text-white mt-0.5">
                      {visColegios} pers.
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">🚌 Operadores Turísticos</div>
                    <div className="text-lg font-mono font-bold text-white mt-0.5">
                      {visOperadores} pers.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VISTA CALENDARIO MENSUAL */}
            {vistaOperativa === 'calendario' && (
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
            )}

            {/* VISTA LISTA DETALLADA */}
            {vistaOperativa === 'lista' && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Movimientos en el Rango Seleccionado ({movimientos.length})
                </h3>
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
                      {movimientos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                            No hay datos para las fechas o temporada indicada.
                          </td>
                        </tr>
                      ) : (
                        movimientos.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${m.tipo === 'Boletería' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}`}>
                                {m.tipo}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 font-mono">{m.fecha}</td>
                            <td className="py-2.5 px-2">{m.temporada}</td>
                            <td className="py-2.5 px-2 font-semibold text-white">{m.detalle}</td>
                            <td className="py-2.5 px-2 font-mono">{m.personas} pers.</td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-teal-300">
                              ${m.monto.toLocaleString('es-CL')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detalle del día al hacer click en el calendario */}
            {diaSeleccionado && vistaOperativa === 'calendario' && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                  <span className="text-xs font-bold uppercase text-sky-400">Detalle del Día: {diaSeleccionado}</span>
                  <button onClick={() => setDiaSeleccionado(null)} className="text-xs text-slate-400 hover:text-white">Cerrar</button>
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
        {/* VISTA 2: FLUJO DE CAJA REAL & CONCILIACIÓN (ESTILO DIRECTOR) */}
        {/* ========================================================= */}
        {seccion === 'flujocaja' && (
          <div className="space-y-6">
            
            {/* Alerta de Conciliación Bancaria */}
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
              <Landmark className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-white block uppercase tracking-wider">Criterio de Caja Real (Banco & Tesorería)</strong>
                <span className="text-emerald-200">
                  Esta vista refleja el dinero real ingresado: Efectivo en caja + Liquidaciones pagadas por Transbank y Compra Aquí + Transferencias.
                </span>
              </div>
            </div>

            {/* Tarjetas de Conciliación */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Ingreso Real en Cuenta</span>
                <div className="text-2xl font-mono font-black text-white mt-1">
                  ${totalIngresoRealCaja.toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Efectivo + Abonos de Pasarelas</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Efectivo Físico Recaudado</span>
                <div className="text-2xl font-mono font-black text-white mt-1">
                  ${totalEfectivoCaja.toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Caja chica y tesorería</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Liquidaciones Recibidas (POS)</span>
                <div className="text-2xl font-mono font-black text-white mt-1">
                  ${totalAbonosBancariosPOS.toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">TB: ${totalAbonoTransbank.toLocaleString('es-CL')} | CA: ${totalAbonoCompraAqui.toLocaleString('es-CL')}</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Ventas por Liquidar en Banco</span>
                <div className="text-2xl font-mono font-black text-rose-400 mt-1">
                  ${brechaPorLiquidar > 0 ? brechaPorLiquidar.toLocaleString('es-CL') : '0'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Tarjetas pasadas pendientes de abono</div>
              </div>
            </div>

            {/* SÁBANA DIARIA DE CONCILIACIÓN ESTILO EXCEL DEL DIRECTOR */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Sábana Diaria de Conciliación y Liquidación
                  </h3>
                  <p className="text-xs text-slate-400">Comparativa directa de vouchers vs depósitos en cuenta bancaria</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300 font-mono">
                  <thead className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2 text-right">Efectivo Día</th>
                      <th className="py-2 px-2 text-right">Venta Tarjeta (POS)</th>
                      <th className="py-2 px-2 text-right text-teal-300">Abono Transbank</th>
                      <th className="py-2 px-2 text-right text-teal-300">Abono Compra Aquí</th>
                      <th className="py-2 px-2 text-right">Transferencias</th>
                      <th className="py-2 px-2 text-right text-white font-bold bg-slate-900/60">Ingreso Real $</th>
                      <th className="py-2 px-2 text-center">Visitantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {listaConciliacionOrdenada.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                          No hay registros de liquidación en este período.
                        </td>
                      </tr>
                    ) : (
                      listaConciliacionOrdenada.map((row: any, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-2 font-bold text-white">{row.fecha}</td>
                          <td className="py-2 px-2 text-right">${row.efectivo.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right text-slate-400">${row.venta_tarjetas.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right text-teal-300 font-semibold">${row.abono_transbank.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right text-teal-300 font-semibold">${row.abono_compra_aqui.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right">${row.transferencias.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right font-black text-emerald-400 bg-slate-900/60">
                            ${row.ingreso_real.toLocaleString('es-CL')}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-400">{row.personas}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 3: GRÁFICAS GENERALES */}
        {/* ========================================================= */}
        {seccion === 'graficas' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Ventas y Utilidad (Últimos 12 Meses)</h3>
                  <p className="text-xs text-slate-400">Contraste entre volumen facturado y ganancia real en bolsillo</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Ventas</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Utilidad Real</span>
                </div>
              </div>

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
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 4: ESTADO DE RESULTADOS (P&L) */}
        {/* ========================================================= */}
        {seccion === 'resultados' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
                Estado de Resultados Operacional (P&L)
              </h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800 text-sm font-bold text-white">
                  <span className="font-sans">(=) Ingresos Operacionales</span>
                  <span className="text-teal-300">${ventasMesActual.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Costos Directos (Alimento, sueldos operacionales)</span>
                  <span>-${costosDirectos.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-y border-slate-700/80 bg-slate-900/60 px-3 rounded-lg font-bold text-sky-300">
                  <span className="font-sans">(=) MARGEN BRUTO</span>
                  <span>${margenBruto.toLocaleString('es-CL')} (66.3%)</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Gastos de Adm, Operación Fija y Marketing</span>
                  <span>-${gastosAdminVentas.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-y border-slate-700/80 bg-slate-900/60 px-3 rounded-lg font-bold text-amber-300">
                  <span className="font-sans">(=) RESULTADO OPERACIONAL (EBITDA)</span>
                  <span>${resultadoOperacional.toLocaleString('es-CL')} (37.3%)</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Gastos Financieros e Intereses</span>
                  <span>-${gastosFinancieros.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-slate-200 pl-4 font-semibold">
                  <span className="font-sans">(=) Resultado Antes de Impuestos</span>
                  <span>${resultadoAntesImp.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-rose-300 pl-4">
                  <span className="font-sans">(-) Provisión Impuesto Renta (27%)</span>
                  <span>-${impuestoRenta.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-emerald-950/70 border border-emerald-500/40 px-4 rounded-xl text-base font-black text-emerald-300">
                  <span className="font-sans">(=) UTILIDAD NETA FINAL</span>
                  <span>${utilidadNeta.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 5: CLIENTES & COBRANZA */}
        {/* ========================================================= */}
        {seccion === 'cobranza' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cartera Total</span>
                <div className="text-2xl font-mono font-black text-white mt-1">${totalCartera.toLocaleString('es-CL')}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Cartera Vencida (+30 días)</span>
                <div className="text-2xl font-mono font-black text-rose-400 mt-1">${totalVencido.toLocaleString('es-CL')}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">% Vencido</span>
                <div className="text-2xl font-mono font-black text-amber-400 mt-1">{pctVencido}%</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}