'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, 
  Sun, 
  Snowflake, 
  Layers, 
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  List,
  Printer,
  Landmark,
  PlusCircle,
  X,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardUnificadoPage() {
  const hoyStr = new Date().toISOString().split('T')[0];
  const inicioMesStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [seccion, setSeccion] = useState<'operativo' | 'flujocaja' | 'graficas' | 'cobranza'>('operativo');
  const [vistaOperativa, setVistaOperativa] = useState<'calendario' | 'lista'>('calendario');
  const [filtroTemporada, setFiltroTemporada] = useState<'Todas' | 'Verano (Alta)' | 'Invierno (Baja)'>('Todas');
  
  const [fechaDesde, setFechaDesde] = useState(inicioMesStr);
  const [fechaHasta, setFechaHasta] = useState(hoyStr);
  const [aplicarFechas, setAplicarFechas] = useState(true);
  const [cargando, setCargando] = useState(true);

  // Paginación
  const [paginaSocio, setPaginaSocio] = useState(1);
  const [paginaCartola, setPaginaCartola] = useState(1);
  const registrosPorPagina = 30;

  // Acordeón expandible
  const [expandirIngresos, setExpandirIngresos] = useState(false);
  const [expandirEgresos, setExpandirEgresos] = useState(false);

  // Calendario
  const fechaActual = new Date();
  const [mesActual, setMesActual] = useState(fechaActual.getMonth());
  const [anioActual, setAnioActual] = useState(fechaActual.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Datos base
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [convenios, setConvenios] = useState<any[]>([]);
  const [abonosBanco, setAbonosBanco] = useState<any[]>([]);
  const [egresos, setEgresos] = useState<any[]>([]);
  const [historicoMensual, setHistoricoMensual] = useState<any[]>([]);

  // Modal abono bancario
  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);
  const [guardandoAbono, setGuardandoAbono] = useState(false);
  const [formFechaAbono, setFormFechaAbono] = useState(hoyStr);
  const [formTipoAbono, setFormTipoAbono] = useState('Liquidación Transbank');
  const [formMontoAbono, setFormMontoAbono] = useState('');
  const [formOrigenAbono, setFormOrigenAbono] = useState('');
  const [formObsAbono, setFormObsAbono] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Cierre Boletería
      let queryBol = supabase.from('cierre_boleteria').select('*');
      if (filtroTemporada !== 'Todas') queryBol = queryBol.eq('temporada', filtroTemporada);
      if (aplicarFechas) {
        if (fechaDesde) queryBol = queryBol.gte('fecha', fechaDesde);
        if (fechaHasta) queryBol = queryBol.lte('fecha', fechaHasta);
      }
      const { data: dataBol } = await queryBol;

      // 2. Convenios
      let queryConv = supabase.from('convenios').select('*');
      if (aplicarFechas) {
        if (fechaDesde) queryConv = queryConv.gte('fecha', fechaDesde);
        if (fechaHasta) queryConv = queryConv.lte('fecha', fechaHasta);
      }
      const { data: dataConv } = await queryConv;

      // 3. Cartola Banco
      let queryBanco = supabase.from('cartola_banco').select('*');
      if (aplicarFechas) {
        if (fechaDesde) queryBanco = queryBanco.gte('fecha', fechaDesde);
        if (fechaHasta) queryBanco = queryBanco.lte('fecha', fechaHasta);
      }
      const { data: dataBanco } = await queryBanco.order('fecha', { ascending: false });

      // 4. Egresos
      let dataEgr: any[] = [];
      const { data: resEgr, error: errEgr } = await supabase.from('egresos').select('*');
      if (!errEgr && resEgr) {
        dataEgr = resEgr;
      } else {
        const { data: resGas } = await supabase.from('gastos').select('*');
        if (resGas) dataEgr = resGas;
      }

      const listaEgresosNormalizada = dataEgr
        .filter(e => (e.estado || '').toLowerCase() !== 'anulado')
        .map(e => {
          const fStr = e.fecha || (e.created_at ? e.created_at.split('T')[0] : hoyStr);
          const mNum = Number(e.monto || e.valor || e.total || 0);
          return {
            id: e.id,
            fecha: fStr,
            categoria: e.categoria || e.tipo || 'Gasto General',
            descripcion: e.descripcion || e.detalle || 'Egreso registrado',
            monto: mNum
          };
        })
        .filter(e => {
          if (!aplicarFechas) return true;
          if (fechaDesde && e.fecha < fechaDesde) return false;
          if (fechaHasta && e.fecha > fechaHasta) return false;
          return true;
        });

      // 5. Histórico Mensual
      const { data: dataHist } = await supabase
        .from('historico_mensual')
        .select('*')
        .order('anio', { ascending: true })
        .order('mes', { ascending: true });

      setHistoricoMensual(dataHist || []);

      const listaBol = (dataBol || []).filter(b => (b.estado || '').toLowerCase() !== 'anulado');
      const listaConv = (dataConv || []).filter(c => (c.estado || '').toLowerCase() !== 'anulado');

      const mBol = listaBol.map(b => ({
        tipo: 'Boletería',
        subtipo: 'Boletería & Entradas',
        id: b.id,
        detalle: `Turno ${b.turno || 'Completo'} - Cajero: ${b.cajero || 'Principal'} (#${b.id})`,
        fecha: b.fecha,
        temporada: b.temporada,
        monto: Number(b.total_ingresos || 0),
        personas: Number(b.total_personas || 0),
        efectivo: Number(b.efectivo || 0),
        pos_compra_aqui: Number(b.pos_compra_aqui || 0),
        pos_transbank: Number(b.pos_transbank || 0),
        transferencia: Number(b.transferencias || 0),
        credito: 0
      }));

      const mConv = listaConv.map(c => {
        const monto = Number(c.total_recaudado || c.monto || c.total || 0);
        return {
          tipo: 'Convenio',
          subtipo: c.tipo_ingreso || 'Convenios & Delegaciones',
          id: c.id,
          detalle: c.nombre_institucion || 'Institución / Convenio',
          fecha: c.fecha,
          temporada: 'Verano (Alta)',
          monto: monto,
          personas: Number(c.total_personas || 0),
          efectivo: 0,
          pos_compra_aqui: 0,
          pos_transbank: 0,
          transferencia: monto,
          credito: (c.estado_pago || '').toLowerCase() === 'pendiente' ? monto : 0
        };
      });

      setMovimientos([...mBol, ...mConv].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      setConvenios(listaConv);
      setAbonosBanco(dataBanco || []);
      setEgresos(listaEgresosNormalizada);
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

  const handleGuardarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMontoAbono || Number(formMontoAbono) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    setGuardandoAbono(true);
    try {
      const payload: any = {
        fecha: formFechaAbono,
        tipo_abono: formTipoAbono,
        monto: Number(formMontoAbono),
        origen_cliente: formOrigenAbono || null,
        observacion: formObsAbono || null
      };

      const { error } = await supabase.from('cartola_banco').insert([payload]);
      if (error) throw error;

      setModalAbonoAbierto(false);
      setFormMontoAbono('');
      setFormOrigenAbono('');
      setFormObsAbono('');
      cargarDatos();
    } catch (err: any) {
      console.error('Error al guardar abono:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardandoAbono(false);
    }
  };

  const handleEliminarAbono = async (id: number) => {
    const confirmar = window.confirm('¿Estás seguro de anular/eliminar este movimiento bancario? Se descontará del flujo de caja de inmediato.');
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('cartola_banco').delete().eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch (err: any) {
      alert('Error al eliminar el abono: ' + err.message);
    }
  };

  // Totales Operativos
  const totalIngresos = movimientos.reduce((acc, m) => acc + m.monto, 0);
  const totalPublico = movimientos.reduce((acc, m) => acc + m.personas, 0);

  // Totales Flujo de Caja
  const totalEfectivoCaja = movimientos.reduce((acc, m) => acc + (m.efectivo || 0), 0);
  const totalAbonosCartola = abonosBanco.reduce((acc, a) => acc + Number(a.monto || 0), 0);
  const totalTransfConvenios = movimientos.filter(m => m.tipo === 'Convenio' && m.credito === 0).reduce((acc, m) => acc + m.monto, 0);
  const totalIngresoRealCaja = totalEfectivoCaja + totalAbonosCartola + totalTransfConvenios;

  const totalAbonoTransbank = abonosBanco.filter(a => a.tipo_abono === 'Liquidación Transbank').reduce((acc, a) => acc + Number(a.monto || 0), 0);
  const totalAbonoCompraAqui = abonosBanco.filter(a => a.tipo_abono === 'Liquidación Compra Aquí').reduce((acc, a) => acc + Number(a.monto || 0), 0);

  const totalEgresosReales = egresos.reduce((acc, e) => acc + Number(e.monto || 0), 0);
  const saldoNetoOperativo = totalIngresoRealCaja - totalEgresosReales;

  // CÁLCULO 100% REAL Y MATEMÁTICO (SIN NÚMEROS FIJOS)
  const saldoCajaHoyEstimado = totalIngresoRealCaja - totalEgresosReales;
  const cobrosPendientesPorEntrar = convenios
    .filter(c => (c.estado_pago || '').toLowerCase() === 'pendiente')
    .reduce((acc, c) => acc + Number(c.total_recaudado || c.monto || c.total || 0), 0);
  const liquidezProyectada30Dias = saldoCajaHoyEstimado + cobrosPendientesPorEntrar;

  // Promedios
  const diasUnicosOperados = Array.from(new Set(movimientos.map(m => m.fecha))).length;
  const personasPromedioDia = diasUnicosOperados > 0 ? Math.round(totalPublico / diasUnicosOperados) : 0;
  const ingresosPromedioDia = diasUnicosOperados > 0 ? Math.round(totalIngresos / diasUnicosOperados) : 0;
  const mesesUnicosOperados = Math.max(1, new Set(movimientos.map(m => m.fecha.substring(0, 7))).size);
  const promedioMensual = Math.round(totalIngresos / mesesUnicosOperados);

  // Desgloses por Canal
  const recBoleteria = movimientos.filter(m => m.tipo === 'Boletería').reduce((acc, m) => acc + m.monto, 0);
  const recColegios = movimientos.filter(m => m.subtipo === 'Convenios & Delegaciones').reduce((acc, m) => acc + m.monto, 0);
  const recOperadores = movimientos.filter(m => m.subtipo === 'Operador Turístico').reduce((acc, m) => acc + m.monto, 0);
  const recSalon = movimientos.filter(m => m.subtipo === 'Arriendo de Salón').reduce((acc, m) => acc + m.monto, 0);
  const recCafeteria = movimientos.filter(m => m.subtipo === 'Cafetería').reduce((acc, m) => acc + m.monto, 0);

  // Desgloses por Medio de Pago
  const recEfectivo = movimientos.reduce((acc, m) => acc + (m.efectivo || 0), 0);
  const recCompraAqui = movimientos.reduce((acc, m) => acc + (m.pos_compra_aqui || 0), 0);
  const recTransbank = movimientos.reduce((acc, m) => acc + (m.pos_transbank || 0), 0);
  const recTransf = movimientos.reduce((acc, m) => acc + (m.transferencia || 0), 0);
  const recCredito = movimientos.reduce((acc, m) => acc + (m.credito || 0), 0);

  // Visitantes por Canal
  const visBoleteria = movimientos.filter(m => m.tipo === 'Boletería').reduce((acc, m) => acc + m.personas, 0);
  const visColegios = movimientos.filter(m => m.subtipo === 'Convenios & Delegaciones').reduce((acc, m) => acc + m.personas, 0);
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

  // Cálculo de matriz anual
  const { categoriasIngresosFiltradas, categoriasEgresosFiltradas, totalesIngresosMes, totalesEgresosMes, margenNetoMes, totalAnualIngresos, totalAnualEgresos, totalAnualMargen, porcentajeMargenAnual } = useMemo(() => {
    const mapaIngresosCat: Record<string, number[]> = {};
    const mapaEgresosCat: Record<string, number[]> = {};

    const totIngMes = Array(12).fill(0);
    const totEgrMes = Array(12).fill(0);

    movimientos.forEach(m => {
      if (!m.fecha) return;
      const mesIdx = new Date(m.fecha + 'T12:00:00').getMonth();
      const cat = m.subtipo || m.tipo || 'Varios';
      if (!mapaIngresosCat[cat]) mapaIngresosCat[cat] = Array(12).fill(0);
      mapaIngresosCat[cat][mesIdx] += m.monto;
      totIngMes[mesIdx] += m.monto;
    });

    egresos.forEach(e => {
      if (!e.fecha) return;
      const mesIdx = new Date(e.fecha + 'T12:00:00').getMonth();
      const cat = e.categoria || 'Gastos Generales';
      const monto = Number(e.monto || 0);
      if (!mapaEgresosCat[cat]) mapaEgresosCat[cat] = Array(12).fill(0);
      mapaEgresosCat[cat][mesIdx] += monto;
      totEgrMes[mesIdx] += monto;
    });

    const catIngFiltradas = Object.keys(mapaIngresosCat)
      .map(cat => {
        const valores = mapaIngresosCat[cat];
        const total = valores.reduce((acc, v) => acc + v, 0);
        return { cat, valores, total };
      })
      .filter(item => item.total > 0);

    const catEgrFiltradas = Object.keys(mapaEgresosCat)
      .map(cat => {
        const valores = mapaEgresosCat[cat];
        const total = valores.reduce((acc, v) => acc + v, 0);
        return { cat, valores, total };
      })
      .filter(item => item.total > 0);

    const margenMes = totIngMes.map((ing, i) => ing - totEgrMes[i]);
    const totAnualIng = totIngMes.reduce((a, b) => a + b, 0);
    const totAnualEgr = totEgrMes.reduce((a, b) => a + b, 0);
    const totAnualMarg = totAnualIng - totAnualEgr;
    const pctMarg = totAnualIng > 0 ? Math.round((totAnualMarg / totAnualIng) * 100) : 0;

    return {
      categoriasIngresosFiltradas: catIngFiltradas,
      categoriasEgresosFiltradas: catEgrFiltradas,
      totalesIngresosMes: totIngMes,
      totalesEgresosMes: totEgrMes,
      margenNetoMes: margenMes,
      totalAnualIngresos: totAnualIng,
      totalAnualEgresos: totAnualEgr,
      totalAnualMargen: totAnualMarg,
      porcentajeMargenAnual: pctMarg
    };
  }, [movimientos, egresos]);

  // Sábana diaria
  const mapaConciliacion: Record<string, any> = {};
  movimientos.forEach(m => {
    if (!mapaConciliacion[m.fecha]) {
      mapaConciliacion[m.fecha] = {
        fecha: m.fecha,
        efectivo: 0,
        venta_tarjetas: 0,
        abono_transbank: 0,
        abono_compra_aqui: 0,
        abonos_otros: 0,
        transferencias: 0,
        egresos: 0,
        personas: 0
      };
    }
    mapaConciliacion[m.fecha].efectivo += (m.efectivo || 0);
    mapaConciliacion[m.fecha].venta_tarjetas += (m.pos_compra_aqui || 0) + (m.pos_transbank || 0);
    mapaConciliacion[m.fecha].transferencias += (m.transferencia || 0);
    mapaConciliacion[m.fecha].personas += m.personas;
  });

  abonosBanco.forEach(a => {
    if (!mapaConciliacion[a.fecha]) {
      mapaConciliacion[a.fecha] = {
        fecha: a.fecha,
        efectivo: 0,
        venta_tarjetas: 0,
        abono_transbank: 0,
        abono_compra_aqui: 0,
        abonos_otros: 0,
        transferencias: 0,
        egresos: 0,
        personas: 0
      };
    }
    if (a.tipo_abono === 'Liquidación Transbank') {
      mapaConciliacion[a.fecha].abono_transbank += Number(a.monto || 0);
    } else if (a.tipo_abono === 'Liquidación Compra Aquí') {
      mapaConciliacion[a.fecha].abono_compra_aqui += Number(a.monto || 0);
    } else {
      mapaConciliacion[a.fecha].abonos_otros += Number(a.monto || 0);
    }
  });

  egresos.forEach(e => {
    if (!mapaConciliacion[e.fecha]) {
      mapaConciliacion[e.fecha] = {
        fecha: e.fecha,
        efectivo: 0,
        venta_tarjetas: 0,
        abono_transbank: 0,
        abono_compra_aqui: 0,
        abonos_otros: 0,
        transferencias: 0,
        egresos: 0,
        personas: 0
      };
    }
    mapaConciliacion[e.fecha].egresos += Number(e.monto || 0);
  });

  const listaConciliacionOrdenada = Object.values(mapaConciliacion).map((row: any) => {
    const totalEntradaReal = row.efectivo + row.abono_transbank + row.abono_compra_aqui + row.abonos_otros + row.transferencias;
    const saldoNetoDia = totalEntradaReal - row.egresos;
    return { ...row, ingreso_real: totalEntradaReal, saldo_neto: saldoNetoDia };
  }).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Paginación Sábana Diaria
  const totalPaginasSocio = Math.ceil(listaConciliacionOrdenada.length / registrosPorPagina) || 1;
  const listaSocioPaginada = useMemo(() => {
    const inicio = (paginaSocio - 1) * registrosPorPagina;
    return listaConciliacionOrdenada.slice(inicio, inicio + registrosPorPagina);
  }, [listaConciliacionOrdenada, paginaSocio]);

  // Paginación Cartola
  const totalPaginasCartola = Math.ceil(abonosBanco.length / registrosPorPagina) || 1;
  const listaCartolaPaginada = useMemo(() => {
    const inicio = (paginaCartola - 1) * registrosPorPagina;
    return abonosBanco.slice(inicio, inicio + registrosPorPagina);
  }, [abonosBanco, paginaCartola]);

  // Gráficos multianuales
  const { matrizIngresosAnual, matrizPersonasAnual, maxIngresoMillones, maxPersonasMes } = useMemo(() => {
    const aniosDisponibles = [2022, 2023, 2024, 2025, 2026];
    const mapaIng: Record<number, number[]> = {};
    const mapaPer: Record<number, number[]> = {};

    aniosDisponibles.forEach(a => {
      mapaIng[a] = Array(12).fill(0);
      mapaPer[a] = Array(12).fill(0);
    });

    historicoMensual.forEach(h => {
      if (mapaIng[h.anio] && h.mes >= 1 && h.mes <= 12) {
        mapaIng[h.anio][h.mes - 1] = Number(h.total_ingresos || 0);
        mapaPer[h.anio][h.mes - 1] = Number(h.total_personas || 0);
      }
    });

    let maxIng = 25000000;
    let maxPer = 3500;

    aniosDisponibles.forEach(a => {
      mapaIng[a].forEach(val => { if (val > maxIng) maxIng = val; });
      mapaPer[a].forEach(val => { if (val > maxPer) maxPer = val; });
    });

    return {
      matrizIngresosAnual: mapaIng,
      matrizPersonasAnual: mapaPer,
      maxIngresoMillones: maxIng,
      maxPersonasMes: maxPer
    };
  }, [historicoMensual]);

  const coloresAnios: Record<number, { bg: string; text: string }> = {
    2022: { bg: 'bg-blue-600', text: 'text-blue-400' },
    2023: { bg: 'bg-amber-600', text: 'text-amber-400' },
    2024: { bg: 'bg-slate-400', text: 'text-slate-300' },
    2025: { bg: 'bg-yellow-400', text: 'text-yellow-300' },
    2026: { bg: 'bg-sky-400', text: 'text-sky-300' }
  };

  // Cartera Aging
  const hoyObj = new Date();
  const carteraConDias = convenios.map(c => {
    const fVisita = new Date(c.fecha);
    const diffDias = Math.floor((hoyObj.getTime() - fVisita.getTime()) / (1000 * 3600 * 24));
    const facturado = Number(c.total_recaudado || c.monto || c.total || 0);
    const esPendiente = (c.estado_pago || '').toLowerCase() === 'pendiente';
    const pendiente = esPendiente ? facturado : 0;
    return { ...c, diffDias, facturado, pendiente, esPendiente };
  });

  const conveniosPendientes = carteraConDias.filter(c => c.esPendiente);
  const totalCartera = carteraConDias.reduce((acc, c) => acc + c.facturado, 0);
  const totalPendiente = conveniosPendientes.reduce((acc, c) => acc + c.pendiente, 0);
  const totalVencido = conveniosPendientes.filter(c => c.diffDias > 30).reduce((acc, c) => acc + c.pendiente, 0);
  const pctVencido = totalPendiente > 0 ? Math.round((totalVencido / totalPendiente) * 100) : 0;

  const tramo0_30 = conveniosPendientes.filter(c => c.diffDias <= 30).reduce((acc, c) => acc + c.pendiente, 0);
  const tramo31_60 = conveniosPendientes.filter(c => c.diffDias > 30 && c.diffDias <= 60).reduce((acc, c) => acc + c.pendiente, 0);
  const tramo61_90 = conveniosPendientes.filter(c => c.diffDias > 60 && c.diffDias <= 90).reduce((acc, c) => acc + c.pendiente, 0);
  const tramo90Mas = conveniosPendientes.filter(c => c.diffDias > 90).reduce((acc, c) => acc + c.pendiente, 0);

  // Impresión
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
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { display: flex; align-items: center; gap: 16px; }
            .brand img { height: 56px; width: auto; object-fit: contain; }
            .title h1 { font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase; }
            .title p { font-size: 11px; color: #64748b; margin: 3px 0 0 0; }
            .meta { text-align: right; font-size: 11px; }
            .summary-cards { display: flex; gap: 10px; margin-bottom: 24px; }
            .card { flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
            .card span { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; }
            .card .val { font-size: 16px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 3px; }
            .grid { display: flex; gap: 20px; margin-bottom: 24px; }
            .col { flex: 1; }
            h2 { font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin: 0 0 10px 0; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            td { padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
            td.num { text-align: right; font-family: monospace; font-weight: 600; }
            .total-row td { font-weight: 800; border-top: 1px solid #0f172a; border-bottom: none; padding-top: 8px; }
            .footer-info { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
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
            <div class="card"><span>Recaudación Total</span><div class="val">$${totalIngresos.toLocaleString('es-CL')}</div></div>
            <div class="card"><span>Afluencia Total</span><div class="val">${totalPublico} pers.</div></div>
            <div class="card"><span>Promedio Día ($)</span><div class="val">$${ingresosPromedioDia.toLocaleString('es-CL')}</div></div>
            <div class="card"><span>Personas/Día</span><div class="val">${personasPromedioDia} pers.</div></div>
            <div class="card"><span>Promedio Mes</span><div class="val">$${promedioMensual.toLocaleString('es-CL')}</div></div>
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
          <div class="footer-info">Documento Oficial generado por Sistema de Control Parque Acuario Puyehue</div>
          <script>
            const img = document.getElementById('logoImg');
            const dispararImpresion = () => { window.print(); };
            if (img && !img.complete) { img.onload = dispararImpresion; img.onerror = dispararImpresion; } else { dispararImpresion(); }
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

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
            <Landmark className="w-4 h-4" /> Flujo de Caja & Proyección
          </button>
          <button
            onClick={() => setSeccion('graficas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'graficas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" /> Gráficas Generales & Histórico
          </button>
          <button
            onClick={() => setSeccion('cobranza')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${seccion === 'cobranza' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clock className="w-4 h-4" /> Clientes & Cobranza
          </button>
        </div>

        {/* VISTA 1: EJECUTIVO & OPERACIONAL */}
        {seccion === 'operativo' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-sky-400" /> Rango:</span>
                <div className="flex items-center gap-2"><span className="text-xs text-slate-400">Desde:</span><input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setAplicarFechas(true); }} className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-sky-500" /></div>
                <div className="flex items-center gap-2"><span className="text-xs text-slate-400">Hasta:</span><input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setAplicarFechas(true); }} className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-sky-500" /></div>
                <button onClick={resetFechas} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"><RotateCcw className="w-3 h-3" /> Ver Todo</button>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button onClick={() => setVistaOperativa('calendario')} className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${vistaOperativa === 'calendario' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}><CalendarIcon className="w-3.5 h-3.5" /> Calendario</button>
                <button onClick={() => setVistaOperativa('lista')} className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${vistaOperativa === 'lista' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}><List className="w-3.5 h-3.5" /> Lista</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow"><span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Días Operados</span><div className="text-xl font-mono font-black text-white mt-0.5">{diasUnicosOperados} <span className="text-xs font-normal text-slate-400">días</span></div><div className="text-[9px] text-slate-400 mt-0.5">Jornadas con movimiento</div></div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow"><span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Personas Promedio Día</span><div className="text-xl font-mono font-black text-sky-300 mt-0.5">{personasPromedioDia} <span className="text-xs font-normal text-slate-400">pers.</span></div><div className="text-[9px] text-slate-400 mt-0.5">Afluencia media diaria</div></div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow"><span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Ingreso Promedio Día</span><div className="text-xl font-mono font-black text-teal-300 mt-0.5">${ingresosPromedioDia.toLocaleString('es-CL')}</div><div className="text-[9px] text-slate-400 mt-0.5">Venta media por jornada</div></div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 shadow"><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Promedio Mes</span><div className="text-xl font-mono font-black text-indigo-300 mt-0.5">${promedioMensual.toLocaleString('es-CL')}</div><div className="text-[9px] text-slate-400 mt-0.5">Rendimiento mensualizado</div></div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-4">
                <div><span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Control Financiero de Ingresos</span><h3 className="text-base font-bold text-white">Recaudación Consolidada y Medios de Pago</h3></div>
                <div className="text-right"><span className="text-xs text-slate-400">Total Período:</span><div className="text-2xl font-mono font-black text-teal-300">${totalIngresos.toLocaleString('es-CL')}</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-sky-400 tracking-wider">Por Canal / Origen</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">🎟️ Boletería & Tienda:</span><span className="font-mono font-bold text-white">${recBoleteria.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">🏫 Colegios / Delegaciones:</span><span className="font-mono font-bold text-white">${recColegios.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">🚌 Operadores Turísticos:</span><span className="font-mono font-bold text-white">${recOperadores.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">🏢 Arriendo de Salón:</span><span className="font-mono font-bold text-white">${recSalon.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1"><span className="text-slate-300">☕ Cafetería:</span><span className="font-mono font-bold text-white">${recCafeteria.toLocaleString('es-CL')}</span></div>
                  </div>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">Por Medio de Pago</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">💵 Efectivo en Caja:</span><span className="font-mono font-bold text-white">${recEfectivo.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">💳 POS Compra Aquí:</span><span className="font-mono font-bold text-white">${recCompraAqui.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">💳 POS Transbank:</span><span className="font-mono font-bold text-white">${recTransbank.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800"><span className="text-slate-300">🏦 Transferencias Bancarias:</span><span className="font-mono font-bold text-white">${recTransf.toLocaleString('es-CL')}</span></div>
                    <div className="flex justify-between items-center py-1"><span className="text-rose-300">📑 Cuentas por Cobrar / Cheques:</span><span className="font-mono font-bold text-rose-300">${recCredito.toLocaleString('es-CL')}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-4">
                <div><span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Afluencia y Visitantes</span><h3 className="text-base font-bold text-white">Desglose de Personas por Canal de Acceso</h3></div>
                <div className="text-right"><span className="text-xs text-slate-400">Público Total:</span><div className="text-2xl font-mono font-black text-sky-300">{totalPublico} <span className="text-sm font-normal text-slate-400">visitantes</span></div></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl"><div className="text-[10px] uppercase font-bold text-slate-400">🎟️ Taquilla Boletería</div><div className="text-lg font-mono font-bold text-white mt-0.5">{visBoleteria} pers.</div></div>
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl"><div className="text-[10px] uppercase font-bold text-slate-400">🏫 Delegaciones Escolares</div><div className="text-lg font-mono font-bold text-white mt-0.5">{visColegios} pers.</div></div>
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl"><div className="text-[10px] uppercase font-bold text-slate-400">🚌 Operadores Turísticos</div><div className="text-lg font-mono font-bold text-white mt-0.5">{visOperadores} pers.</div></div>
              </div>
            </div>

            {vistaOperativa === 'calendario' && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
                  <h3 className="text-sm font-black text-white capitalize">{nombresMeses[mesActual]} {anioActual}</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { if (mesActual === 0) { setMesActual(11); setAnioActual(anioActual - 1); } else { setMesActual(mesActual - 1); } setDiaSeleccionado(null); }} className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => { if (mesActual === 11) { setMesActual(0); setAnioActual(anioActual + 1); } else { setMesActual(mesActual + 1); } setDiaSeleccionado(null); }} className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-300"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 mb-2 uppercase">
                  <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: desfaseSemana }).map((_, i) => (<div key={`emp-${i}`} className="min-h-[75px] bg-slate-900/30 rounded-xl" />))}
                  {Array.from({ length: diasEnMes }).map((_, i) => {
                    const dNum = i + 1;
                    const fStr = `${anioActual}-${(mesActual + 1).toString().padStart(2, '0')}-${dNum.toString().padStart(2, '0')}`;
                    const dataD = mapaPorFecha[fStr];
                    const hasV = Boolean(dataD && dataD.monto > 0);
                    const isSel = diaSeleccionado === fStr;
                    return (
                      <div key={fStr} onClick={() => hasV && setDiaSeleccionado(fStr)} className={`min-h-[75px] p-2 rounded-xl border flex flex-col justify-between transition ${isSel ? 'border-sky-400 bg-sky-950/60 ring-2 ring-sky-500/40' : hasV ? 'border-slate-700 bg-slate-900 hover:border-sky-500 cursor-pointer' : 'border-slate-800/60 bg-slate-900/40 opacity-60'}`}>
                        <span className={`text-xs font-bold ${hasV ? 'text-white' : 'text-slate-500'}`}>{dNum}</span>
                        {hasV ? (<div><div className="text-[11px] font-mono font-bold text-teal-300">${Math.round(dataD.monto).toLocaleString('es-CL')}</div><div className="text-[10px] text-slate-400">{dataD.personas} p.</div></div>) : (<span className="text-[10px] text-slate-600 italic">-</span>)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {vistaOperativa === 'lista' && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Movimientos en el Rango Seleccionado ({movimientos.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="border-b border-slate-700 text-slate-400">
                      <tr><th className="py-2.5 px-2">Tipo</th><th className="py-2.5 px-2">Fecha</th><th className="py-2.5 px-2">Detalle / Turno</th><th className="py-2.5 px-2">Público</th><th className="py-2.5 px-2 text-right">Monto Recaudado</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {movimientos.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${m.tipo === 'Boletería' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-teal-950 text-teal-300 border border-teal-800'}`}>{m.tipo}</span></td>
                          <td className="py-2.5 px-2 font-mono">{m.fecha}</td>
                          <td className="py-2.5 px-2 font-semibold text-white">{m.detalle}</td>
                          <td className="py-2.5 px-2 font-mono">{m.personas} pers.</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-teal-300">${m.monto.toLocaleString('es-CL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: FLUJO DE CAJA REAL */}
        {seccion === 'flujocaja' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-emerald-400" /> Período Flujo:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Desde:</span>
                  <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setAplicarFechas(true); }} className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Hasta:</span>
                  <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setAplicarFechas(true); }} className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500" />
                </div>
                <button onClick={resetFechas} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"><RotateCcw className="w-3 h-3" /> Ver Todo</button>
              </div>
              <button onClick={() => setModalAbonoAbierto(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition">
                <PlusCircle className="w-4 h-4" /> Registrar Abono / Cartola
              </button>
            </div>

            {/* Radiografía Posición Neta */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Total Ingresos Reales</span><TrendingUp className="w-4 h-4 text-teal-400" /></div>
                <div className="text-2xl font-mono font-black text-white mt-1">${totalIngresoRealCaja.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Efectivo + Abonos TB/CA + Transf.</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Egresos del Período</span><TrendingDown className="w-4 h-4 text-rose-400" /></div>
                <div className="text-2xl font-mono font-black text-rose-400 mt-1">-${totalEgresosReales.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">{egresos.length} gastos contabilizados</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Saldo Neto Operativo</span><Wallet className="w-4 h-4 text-amber-400" /></div>
                <div className={`text-2xl font-mono font-black mt-1 ${saldoNetoOperativo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${saldoNetoOperativo.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Margen de caja del rango</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Proyección Caja 30 Días</span><AlertTriangle className="w-4 h-4 text-sky-400" /></div>
                <div className={`text-2xl font-mono font-black mt-1 ${liquidezProyectada30Dias >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>${liquidezProyectada30Dias.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Caja hoy + Cobranza pendiente</div>
              </div>
            </div>

            {/* Matriz Anual Acordeón */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Estacionalidad & Presupuesto Anual</span>
                  <h3 className="text-sm font-black text-white">Proyección y Balance Mensualizado (Ingresos vs Egresos)</h3>
                  <p className="text-[11px] text-slate-400">Haz clic en Ingresos o Egresos para desplegar categorías activas</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-slate-300">
                    Margen Anual: <strong className={`font-bold ${totalAnualMargen >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{porcentajeMargenAnual}%</strong>
                  </div>
                  <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-slate-300">
                    Utilidad Libre: <strong className={`font-bold ${totalAnualMargen >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>${totalAnualMargen.toLocaleString('es-CL')}</strong>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-[11px] text-slate-400 uppercase">
                      <th className="text-left py-2 px-2.5 font-sans font-bold">Concepto</th>
                      <th className="py-2 px-2">Ene</th><th className="py-2 px-2">Feb</th><th className="py-2 px-2">Mar</th><th className="py-2 px-2">Abr</th><th className="py-2 px-2">May</th><th className="py-2 px-2">Jun</th><th className="py-2 px-2">Jul</th><th className="py-2 px-2">Ago</th><th className="py-2 px-2">Sep</th><th className="py-2 px-2">Oct</th><th className="py-2 px-2">Nov</th><th className="py-2 px-2">Dic</th>
                      <th className="py-2 px-3 text-white font-bold bg-slate-950/60 border-l border-slate-700">Total Anual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr onClick={() => setExpandirIngresos(!expandirIngresos)} className="hover:bg-slate-700/40 cursor-pointer select-none transition">
                      <td className="text-left py-2.5 px-2.5 font-sans font-bold text-teal-300 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">{expandirIngresos ? '▼' : '►'}</span> (+) Ingresos
                      </td>
                      {totalesIngresosMes.map((val, idx) => (<td key={idx} className={`py-2 px-2 ${val > 0 ? 'text-slate-200 font-semibold' : 'text-slate-600 italic'}`}>{val > 0 ? val.toLocaleString('es-CL') : '-'}</td>))}
                      <td className="py-2 px-3 font-bold text-teal-300 bg-slate-950/60 border-l border-slate-700">${totalAnualIngresos.toLocaleString('es-CL')}</td>
                    </tr>
                    {expandirIngresos && (
                      categoriasIngresosFiltradas.length === 0 ? (
                        <tr className="bg-slate-900/40 text-[11px] text-slate-500 italic"><td colSpan={14} className="text-left py-2 pl-6">No hay registros detallados en el período</td></tr>
                      ) : (
                        categoriasIngresosFiltradas.map((item, idx) => (
                          <tr key={idx} className="bg-slate-900/40 text-[11px] text-slate-400 hover:bg-slate-900/70">
                            <td className="text-left py-1.5 pl-6 font-sans truncate max-w-[150px]">• {item.cat}</td>
                            {item.valores.map((v, i) => (<td key={i} className={`py-1.5 px-2 ${v > 0 ? 'text-slate-300' : 'text-slate-600 italic'}`}>{v > 0 ? v.toLocaleString('es-CL') : '-'}</td>))}
                            <td className="py-1.5 px-3 bg-slate-950/40 border-l border-slate-700 font-semibold text-teal-200">${item.total.toLocaleString('es-CL')}</td>
                          </tr>
                        ))
                      )
                    )}
                    <tr onClick={() => setExpandirEgresos(!expandirEgresos)} className="hover:bg-slate-700/40 cursor-pointer select-none transition">
                      <td className="text-left py-2.5 px-2.5 font-sans font-bold text-rose-300 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">{expandirEgresos ? '▼' : '►'}</span> (-) Egresos
                      </td>
                      {totalesEgresosMes.map((val, idx) => (<td key={idx} className={`py-2 px-2 ${val > 0 ? 'text-rose-300 font-semibold' : 'text-slate-600 italic'}`}>{val > 0 ? val.toLocaleString('es-CL') : '-'}</td>))}
                      <td className="py-2 px-3 font-bold text-rose-300 bg-slate-950/60 border-l border-slate-700">-${totalAnualEgresos.toLocaleString('es-CL')}</td>
                    </tr>
                    {expandirEgresos && (
                      categoriasEgresosFiltradas.length === 0 ? (
                        <tr className="bg-slate-900/40 text-[11px] text-slate-500 italic"><td colSpan={14} className="text-left py-2 pl-6">No hay registros detallados en el período</td></tr>
                      ) : (
                        categoriasEgresosFiltradas.map((item, idx) => (
                          <tr key={idx} className="bg-slate-900/40 text-[11px] text-slate-400 hover:bg-slate-900/70">
                            <td className="text-left py-1.5 pl-6 font-sans truncate max-w-[150px]">• {item.cat}</td>
                            {item.valores.map((v, i) => (<td key={i} className={`py-1.5 px-2 ${v > 0 ? 'text-slate-300' : 'text-slate-600 italic'}`}>{v > 0 ? v.toLocaleString('es-CL') : '-'}</td>))}
                            <td className="py-1.5 px-3 bg-slate-950/40 border-l border-slate-700 font-semibold text-rose-300">-${item.total.toLocaleString('es-CL')}</td>
                          </tr>
                        ))
                      )
                    )}
                    <tr className="bg-slate-900/90 font-bold border-t-2 border-slate-700">
                      <td className="text-left py-2.5 px-2.5 font-sans text-white">(=) Margen Neto</td>
                      {margenNetoMes.map((val, idx) => (
                        <td key={idx} className={`py-2 px-2 ${val > 0 ? 'text-emerald-400' : val < 0 ? 'text-rose-400' : 'text-slate-600 italic'}`}>
                          {val !== 0 ? (val > 0 ? `+${val.toLocaleString('es-CL')}` : val.toLocaleString('es-CL')) : '-'}
                        </td>
                      ))}
                      <td className={`py-2 px-3 font-black bg-slate-950 border-l border-slate-700 ${totalAnualMargen >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalAnualMargen >= 0 ? `+$${totalAnualMargen.toLocaleString('es-CL')}` : `-$${Math.abs(totalAnualMargen).toLocaleString('es-CL')}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sábana Diaria (Paginada) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sábana Diaria de Entradas, Salidas y Saldo Neto</h3>
                  <p className="text-xs text-slate-400">Radiografía día a día: Dinero líquido entrado vs pagos realizados</p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Mostrando {listaSocioPaginada.length} de {listaConciliacionOrdenada.length} días
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300 font-mono">
                  <thead className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2 text-right">Efectivo</th>
                      <th className="py-2 px-2 text-right text-teal-300">Abono Transbank</th>
                      <th className="py-2 px-2 text-right text-teal-300">Abono Compra Aquí</th>
                      <th className="py-2 px-2 text-right text-indigo-300">Transf. / Varios</th>
                      <th className="py-2 px-2 text-right text-emerald-400 font-bold bg-slate-950/40">Total Entrado</th>
                      <th className="py-2 px-2 text-right text-rose-400 font-bold">(-) Egresos</th>
                      <th className="py-2 px-2 text-right text-white font-black bg-slate-900/80">(=) Saldo Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {listaSocioPaginada.length === 0 ? (
                      <tr><td colSpan={8} className="py-6 text-center text-slate-500 italic">No hay movimientos registrados en el período seleccionado.</td></tr>
                    ) : (
                      listaSocioPaginada.map((row: any, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-2 font-bold text-white">{row.fecha}</td>
                          <td className="py-2 px-2 text-right">${row.efectivo.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right text-teal-300">${row.abono_transbank.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right text-teal-300">${row.abono_compra_aqui.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right text-indigo-300">${(row.abonos_otros + row.transferencias).toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-400 bg-slate-950/40">+${row.ingreso_real.toLocaleString('es-CL')}</td>
                          <td className="py-2 px-2 text-right font-bold text-rose-400">{row.egresos > 0 ? `-$${row.egresos.toLocaleString('es-CL')}` : '-'}</td>
                          <td className={`py-2 px-2 text-right font-black bg-slate-900/80 ${row.saldo_neto >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>${row.saldo_neto.toLocaleString('es-CL')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controles de Paginación Sábana Diaria */}
              {totalPaginasSocio > 1 && (
                <div className="flex justify-between items-center pt-3 border-t border-slate-700 text-xs">
                  <span className="text-slate-400">Página {paginaSocio} de {totalPaginasSocio}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPaginaSocio(p => Math.max(1, p - 1))}
                      disabled={paginaSocio === 1}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 font-bold"
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => setPaginaSocio(p => Math.min(totalPaginasSocio, p + 1))}
                      disabled={paginaSocio === totalPaginasSocio}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 font-bold"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TABLA DE MOVIMIENTOS BANCARIOS REGISTRADOS */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Abonos y Liquidaciones Bancarias Cargadas</h3>
                  <p className="text-xs text-slate-400">Listado de ingresos a cartola registrados con opción de anulación directa</p>
                </div>
                <span className="text-xs font-mono text-slate-400">{abonosBanco.length} movimientos</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300 font-mono">
                  <thead className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2">Tipo de Abono</th>
                      <th className="py-2 px-2">Origen / Emisor</th>
                      <th className="py-2 px-2">Observación / Ref.</th>
                      <th className="py-2 px-2 text-right">Monto Depositado</th>
                      <th className="py-2 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {listaCartolaPaginada.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                          No hay abonos bancarios registrados en este rango de fechas.
                        </td>
                      </tr>
                    ) : (
                      listaCartolaPaginada.map((abono: any) => (
                        <tr key={abono.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-2 font-bold text-white">{abono.fecha}</td>
                          <td className="py-2 px-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {abono.tipo_abono}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-sans text-slate-200">{abono.origen_cliente || '-'}</td>
                          <td className="py-2 px-2 font-sans text-slate-400">{abono.observacion || '-'}</td>
                          <td className="py-2 px-2 text-right font-bold text-teal-300">
                            ${Number(abono.monto || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleEliminarAbono(abono.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                              title="Anular este abono de la cartola"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controles de Paginación Cartola */}
              {totalPaginasCartola > 1 && (
                <div className="flex justify-between items-center pt-3 border-t border-slate-700 text-xs">
                  <span className="text-slate-400">Página {paginaCartola} de {totalPaginasCartola}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPaginaCartola(p => Math.max(1, p - 1))}
                      disabled={paginaCartola === 1}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 font-bold"
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => setPaginaCartola(p => Math.min(totalPaginasCartola, p + 1))}
                      disabled={paginaCartola === totalPaginasCartola}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 font-bold"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VISTA 3: GRÁFICAS GENERALES & SUITE HISTÓRICA */}
        {seccion === 'graficas' && (
          <div className="space-y-8">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Histórico de Ingresos</span>
                  <h3 className="text-base font-black text-white">Histórico de Ingresos por Mes y Año (2022 - 2026)</h3>
                  <p className="text-xs text-slate-400">Comparativa de recaudación mensual en millones de pesos entre todas las temporadas</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  {[2022, 2023, 2024, 2025, 2026].map(anio => (
                    <span key={anio} className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded ${coloresAnios[anio].bg} inline-block`} /> {anio}
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-700">
                {nombresMeses.map((mes, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {[2022, 2023, 2024, 2025, 2026].map(anio => {
                        const val = matrizIngresosAnual[anio]?.[idx] || 0;
                        const pct = val > 0 ? Math.min(100, Math.round((val / maxIngresoMillones) * 100)) : 0;
                        return (
                          <div 
                            key={anio}
                            style={{ height: `${pct}%` }} 
                            className={`w-1/5 ${coloresAnios[anio].bg} hover:brightness-125 rounded-t transition-all`}
                            title={`${anio} - ${mes}: $${val.toLocaleString('es-CL')}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">{mes.substring(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Afluencia y Demanda</span>
                  <h3 className="text-base font-black text-white">N° de Visitantes Mensuales (2022 - 2026)</h3>
                  <p className="text-xs text-slate-400">Evolución de público por mes: picos de verano y vacaciones de invierno</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  {[2022, 2023, 2024, 2025, 2026].map(anio => (
                    <span key={anio} className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded ${coloresAnios[anio].bg} inline-block`} /> {anio}
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-700">
                {nombresMeses.map((mes, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {[2022, 2023, 2024, 2025, 2026].map(anio => {
                        const val = matrizPersonasAnual[anio]?.[idx] || 0;
                        const pct = val > 0 ? Math.min(100, Math.round((val / maxPersonasMes) * 100)) : 0;
                        return (
                          <div 
                            key={anio}
                            style={{ height: `${pct}%` }} 
                            className={`w-1/5 ${coloresAnios[anio].bg} hover:brightness-125 rounded-t transition-all`}
                            title={`${anio} - ${mes}: ${val} visitantes`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">{mes.substring(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">1. Matriz Numérica: Ingresos por Año ($)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-[11px] text-slate-400 uppercase">
                        <th className="text-left py-2 px-2 font-sans">Año</th>
                        <th className="py-2 px-2">Ene</th><th className="py-2 px-2">Feb</th><th className="py-2 px-2">Mar</th><th className="py-2 px-2">Abr</th><th className="py-2 px-2">May</th><th className="py-2 px-2">Jun</th><th className="py-2 px-2">Jul</th><th className="py-2 px-2">Ago</th><th className="py-2 px-2">Sep</th><th className="py-2 px-2">Oct</th><th className="py-2 px-2">Nov</th><th className="py-2 px-2">Dic</th>
                        <th className="py-2 px-3 text-white font-bold bg-slate-950/60 border-l border-slate-700">Total Anual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[2022, 2023, 2024, 2025, 2026].map(anio => {
                        const fila = matrizIngresosAnual[anio] || Array(12).fill(0);
                        const totalAnio = fila.reduce((a, b) => a + b, 0);
                        return (
                          <tr key={anio} className="hover:bg-slate-900/40">
                            <td className="text-left py-2 px-2 font-sans font-bold text-white flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${coloresAnios[anio].bg}`} /> {anio}</td>
                            {fila.map((val, i) => (<td key={i} className={`py-2 px-2 ${val > 0 ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                              {val > 0 ? val.toLocaleString('es-CL') : '-'}
                            </td>))}
                            <td className="py-2 px-3 font-bold text-teal-300 bg-slate-950/60 border-l border-slate-700">${totalAnio.toLocaleString('es-CL')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">2. Matriz Numérica: Visitantes por Año (N° Personas)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-[11px] text-slate-400 uppercase">
                        <th className="text-left py-2 px-2 font-sans">Año</th>
                        <th className="py-2 px-2">Ene</th><th className="py-2 px-2">Feb</th><th className="py-2 px-2">Mar</th><th className="py-2 px-2">Abr</th><th className="py-2 px-2">May</th><th className="py-2 px-2">Jun</th><th className="py-2 px-2">Jul</th><th className="py-2 px-2">Ago</th><th className="py-2 px-2">Sep</th><th className="py-2 px-2">Oct</th><th className="py-2 px-2">Nov</th><th className="py-2 px-2">Dic</th>
                        <th className="py-2 px-3 text-white font-bold bg-slate-950/60 border-l border-slate-700">Total Personas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[2022, 2023, 2024, 2025, 2026].map(anio => {
                        const fila = matrizPersonasAnual[anio] || Array(12).fill(0);
                        const totalAnio = fila.reduce((a, b) => a + b, 0);
                        return (
                          <tr key={anio} className="hover:bg-slate-900/40">
                            <td className="text-left py-2 px-2 font-sans font-bold text-white flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${coloresAnios[anio].bg}`} /> {anio}</td>
                            {fila.map((val, i) => (<td key={i} className={`py-2 px-2 ${val > 0 ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                              {val > 0 ? val.toLocaleString('es-CL') : '-'}
                            </td>))}
                            <td className="py-2 px-3 font-bold text-sky-300 bg-slate-950/60 border-l border-slate-700">{totalAnio.toLocaleString('es-CL')} pers.</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 4: CLIENTES & COBRANZA */}
        {seccion === 'cobranza' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Facturado</span>
                <div className="text-2xl font-mono font-black text-white mt-1">${totalCartera.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Convenios e instituciones</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Total Pagado / En Banco</span>
                <div className="text-2xl font-mono font-black text-teal-300 mt-1">${(totalCartera - totalPendiente).toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Cobrado efectivamente</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Por Cobrar Total</span>
                <div className="text-2xl font-mono font-black text-amber-400 mt-1">${totalPendiente.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-slate-400 mt-1">Facturas abiertas</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Vencido (+30 días)</span>
                <div className="text-2xl font-mono font-black text-rose-400 mt-1">${totalVencido.toLocaleString('es-CL')}</div>
                <div className="text-[10px] text-rose-300 mt-1">{pctVencido}% en riesgo</div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 border-b border-slate-700 pb-2">
                Clasificación de Antigüedad de Deuda (Aging)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">0 a 30 Días (Al día)</span>
                  <div className="text-base font-bold text-white mt-1">${tramo0_30.toLocaleString('es-CL')}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400">31 a 60 Días</span>
                  <div className="text-base font-bold text-amber-300 mt-1">${tramo31_60.toLocaleString('es-CL')}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-orange-400">61 a 90 Días</span>
                  <div className="text-base font-bold text-orange-300 mt-1">${tramo61_90.toLocaleString('es-CL')}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-rose-400">+90 Días (Mora crítica)</span>
                  <div className="text-base font-bold text-rose-400 mt-1">${tramo90Mas.toLocaleString('es-CL')}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Instituciones y Facturas Pendientes de Cobro ({conveniosPendientes.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300 font-mono">
                  <thead className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-2">Institución / Cliente</th>
                      <th className="py-2.5 px-2">Fecha Visita</th>
                      <th className="py-2.5 px-2 text-center">Días Transcurridos</th>
                      <th className="py-2.5 px-2 text-right">Monto Adeudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {conveniosPendientes.length === 0 ? (
                      <tr><td colSpan={4} className="py-6 text-center text-slate-500 italic">No hay facturas pendientes de cobro en cartera.</td></tr>
                    ) : (
                      conveniosPendientes.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-2 font-sans font-semibold text-white">{c.nombre_institucion}</td>
                          <td className="py-2 px-2">{c.fecha}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.diffDias > 30 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}`}>
                              {c.diffDias} días
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-amber-400">
                            ${c.pendiente.toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL REGISTRAR ABONO BANCARIO */}
        {modalAbonoAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button onClick={() => setModalAbonoAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4"><Landmark className="w-5 h-5 text-emerald-400" /><h3 className="text-base font-bold text-white">Registrar Ingreso de Banco / Cartola</h3></div>
              <form onSubmit={handleGuardarAbono} className="space-y-4 text-xs">
                <div><label className="block text-slate-400 mb-1 font-semibold">Fecha Contable de Depósito</label><input type="date" required value={formFechaAbono} onChange={(e) => setFormFechaAbono(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" /></div>
                <div><label className="block text-slate-400 mb-1 font-semibold">Tipo de Abono</label><select value={formTipoAbono} onChange={(e) => setFormTipoAbono(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"><option value="Liquidación Transbank">Liquidación Transbank</option><option value="Liquidación Compra Aquí">Liquidación Compra Aquí</option><option value="Pago Factura / Convenio">Pago Factura / Convenio</option><option value="Transferencia Varia / Anticipo">Transferencia Varia / Anticipo</option></select></div>
                <div><label className="block text-slate-400 mb-1 font-semibold">Monto Líquido Depositado ($)</label><input type="number" required placeholder="Ej: 594432" value={formMontoAbono} onChange={(e) => setFormMontoAbono(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm font-bold" /></div>
                <div><label className="block text-slate-400 mb-1 font-semibold">Origen / Emisor (Opcional)</label><input type="text" placeholder="Ej: Transbank, Municipalidad, Banco..." value={formOrigenAbono} onChange={(e) => setFormOrigenAbono(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white" /></div>
                <div><label className="block text-slate-400 mb-1 font-semibold">Observación / N° Comprobante</label><input type="text" placeholder="Ej: Abono ventas fin de semana" value={formObsAbono} onChange={(e) => setFormObsAbono(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white" /></div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800"><button type="button" onClick={() => setModalAbonoAbierto(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">Cancelar</button><button type="submit" disabled={guardandoAbono} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg disabled:opacity-50">{guardandoAbono ? 'Guardando...' : 'Guardar en Cartola'}</button></div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}