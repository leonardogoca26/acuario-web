'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer, AlertTriangle, CheckCircle2, ArrowLeft, Ban } from 'lucide-react';
import Link from 'next/link';

interface CierreCaja {
  id?: string | number;
  folio?: number;
  fecha: string;
  turno: string;
  cajero: string;
  adultos: number;
  ninos: number;
  total_personas: number;
  venta_entradas: number;
  venta_tienda: number;
  total_bruto: number;
  efectivo: number;
  transbank: number;
  transferencias: number;
  total_declarado: number;
  diferencia: number;
  observaciones: string;
  estado?: string;
}

export default function BoleteriaPage() {
  const hoy = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<CierreCaja>({
    fecha: hoy,
    turno: 'Turno Completo',
    cajero: 'Boletería Principal',
    adultos: 0,
    ninos: 0,
    total_personas: 0,
    venta_entradas: 0,
    venta_tienda: 0,
    total_bruto: 0,
    efectivo: 0,
    transbank: 0,
    transferencias: 0,
    total_declarado: 0,
    diferencia: 0,
    observaciones: ''
  });

  const [historial, setHistorial] = useState<any[]>([]);
  const [ultimoCierre, setUltimoCierre] = useState<CierreCaja | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const totalP = Number(form.adultos || 0) + Number(form.ninos || 0);
    const totalV = Number(form.venta_entradas || 0) + Number(form.venta_tienda || 0);
    const totalD = Number(form.efectivo || 0) + Number(form.transbank || 0) + Number(form.transferencias || 0);
    const dif = totalD - totalV;

    setForm(prev => ({
      ...prev,
      total_personas: totalP,
      total_bruto: totalV,
      total_declarado: totalD,
      diferencia: dif
    }));
  }, [form.adultos, form.ninos, form.venta_entradas, form.venta_tienda, form.efectivo, form.transbank, form.transferencias]);

  const cargarHistorial = async () => {
    try {
      const { data, error } = await supabase
        .from('boleteria')
        .select('*')
        .eq('fecha', hoy)
        .order('id', { ascending: false });

      if (!error && data) {
        setHistorial(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const payload = {
        fecha: form.fecha,
        turno: form.turno,
        cajero: form.cajero,
        adultos: form.adultos,
        ninos: form.ninos,
        total_personas: form.total_personas,
        venta_entradas: form.venta_entradas,
        venta_tienda: form.venta_tienda,
        total_bruto: form.total_bruto,
        efectivo: form.efectivo,
        transbank: form.transbank,
        transferencias: form.transferencias,
        total_declarado: form.total_declarado,
        diferencia: form.diferencia,
        observaciones: form.observaciones,
        estado: 'activo'
      };

      const { data, error } = await supabase
        .from('boleteria')
        .insert([payload])
        .select();

      if (error) throw error;

      const guardado = data && data[0] ? data[0] : payload;
      setUltimoCierre(guardado);
      setMensaje({ tipo: 'exito', texto: `Cierre registrado con éxito bajo Folio #${guardado.id || '1'}` });

      cargarHistorial();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al guardar: ${err.message || 'Error de conexión'}` });
    } finally {
      setCargando(false);
    }
  };

  const handleAnular = async (id: number | string) => {
    const confirmar = window.confirm(`¿Confirmas anular el Cierre de Folio #${id}? Quedará registrado como nulo sin eliminar el registro histórico.`);
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('boleteria')
        .update({ estado: 'anulado' })
        .eq('id', id);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: `Folio #${id} marcado como ANULADO correctamente.` });
      cargarHistorial();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al anular: ${err.message || 'Error de red'}` });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6">
      
      {/* 1. DOCUMENTO DE IMPRESIÓN OFICIAL (SOLO VISIBLE AL IMPRIMIR) */}
      <div className="hidden print:block font-sans text-black p-4 max-w-2xl mx-auto bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-36 h-14">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/acuario.png" 
                alt="Parque Acuario Puyehue" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight uppercase">
                Acta de Arqueo y Cierre Diario
              </h1>
              <p className="text-xs text-slate-600 font-medium">Boletería • Control de Operaciones y Afluencia</p>
              <p className="text-[10px] text-slate-500">Ruta 215 Km 48 • Entre Lagos, Puyehue</p>
            </div>
          </div>

          <div className="text-center border-2 border-slate-900 px-4 py-2 rounded bg-slate-50 min-w-[120px]">
            <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Folio N°</div>
            <div className="text-xl font-mono font-black text-slate-950">
              #{ultimoCierre?.id || ultimoCierre?.folio || '1'}
            </div>
          </div>
        </div>

        {/* Metadatos */}
        <div className="grid grid-cols-3 gap-2 text-xs border border-slate-300 p-2.5 mb-4 bg-slate-50 rounded">
          <div><span className="font-bold text-slate-700">Fecha:</span> {form.fecha}</div>
          <div><span className="font-bold text-slate-700">Turno:</span> {form.turno}</div>
          <div><span className="font-bold text-slate-700">Responsable:</span> {form.cajero}</div>
        </div>

        {/* Afluencia */}
        <table className="w-full text-xs border-collapse border border-slate-300 mb-4">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
              <th className="p-1.5 text-left">Categoría Afluencia</th>
              <th className="p-1.5 text-right">Cantidad de Visitantes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-1.5">Adultos</td>
              <td className="p-1.5 text-right font-mono">{form.adultos}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1.5">Niños / Estudiantes</td>
              <td className="p-1.5 text-right font-mono">{form.ninos}</td>
            </tr>
            <tr className="font-bold bg-slate-50">
              <td className="p-1.5">Total Personas Ingresadas</td>
              <td className="p-1.5 text-right font-mono">{form.total_personas} pers.</td>
            </tr>
          </tbody>
        </table>

        {/* Ventas vs Arqueo */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-1.5 text-left">Detalle Ingresos</th>
                <th className="p-1.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-1.5">Boletería / Entradas</td>
                <td className="p-1.5 text-right font-mono">${Number(form.venta_entradas).toLocaleString('es-CL')}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1.5">Tienda / Souvenirs</td>
                <td className="p-1.5 text-right font-mono">${Number(form.venta_tienda).toLocaleString('es-CL')}</td>
              </tr>
              <tr className="font-bold bg-slate-50">
                <td className="p-1.5">Total Venta</td>
                <td className="p-1.5 text-right font-mono">${Number(form.total_bruto).toLocaleString('es-CL')}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-1.5 text-left">Medio de Pago</th>
                <th className="p-1.5 text-right">Declarado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-1.5">Efectivo Rendido</td>
                <td className="p-1.5 text-right font-mono">${Number(form.efectivo).toLocaleString('es-CL')}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1.5">Vouchers POS (Transbank)</td>
                <td className="p-1.5 text-right font-mono">${Number(form.transbank).toLocaleString('es-CL')}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1.5">Transferencias Bancarias</td>
                <td className="p-1.5 text-right font-mono">${Number(form.transferencias).toLocaleString('es-CL')}</td>
              </tr>
              <tr className="font-bold bg-slate-50">
                <td className="p-1.5">Total Arqueado</td>
                <td className="p-1.5 text-right font-mono">${Number(form.total_declarado).toLocaleString('es-CL')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Balance */}
        <div className={`p-2.5 rounded border text-xs flex justify-between items-center mb-4 ${form.diferencia === 0 ? 'bg-slate-50 border-slate-300' : 'bg-red-50 border-red-300 text-red-900 font-bold'}`}>
          <span className="font-bold">Diferencia de Cuadre:</span>
          <span className="font-mono text-sm font-black">
            {form.diferencia === 0 ? '$0 (Cuadre Exacto)' : `$${Number(form.diferencia).toLocaleString('es-CL')} (${form.diferencia > 0 ? 'Sobrante' : 'Faltante'})`}
          </span>
        </div>

        {form.observaciones && (
          <div className="border border-slate-200 p-2 text-[11px] mb-8 bg-slate-50">
            <span className="font-bold">Observaciones:</span> {form.observaciones}
          </div>
        )}

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-12 mt-12 pt-6 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">{form.cajero}</div>
            <div className="text-[10px] text-slate-500">Firma Cajero(a) Saliente</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Administración / Tesorería</div>
            <div className="text-[10px] text-slate-500">Recepción Conforme</div>
          </div>
        </div>
      </div>

      {/* 2. PANTALLA WEB NORMAL */}
      <div className="print:hidden max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
          </Link>
          <span className="text-xs text-slate-400">Terminal de Recaudación</span>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-xl border flex items-center justify-between ${mensaje.tipo === 'exito' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {mensaje.texto}
            </div>
            {mensaje.tipo === 'exito' && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow transition"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Acta Oficial
              </button>
            )}
          </div>
        )}

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Cierre de Boletería Diario</h2>
              <p className="text-xs text-slate-400 mt-0.5">Control de afluencia, cuadratura de ingresos y arqueo</p>
            </div>
            {ultimoCierre && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition"
              >
                <Printer className="w-4 h-4" /> Reimprimir Folio #{ultimoCierre.id}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Turno</label>
                <select
                  name="turno"
                  value={form.turno}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Turno Mañana">Turno Mañana</option>
                  <option value="Turno Tarde">Turno Tarde</option>
                  <option value="Turno Completo">Turno Completo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cajero / Operador</label>
                <input
                  type="text"
                  name="cajero"
                  value={form.cajero}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
              <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">Afluencia de Visitantes</span>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Adultos</label>
                  <input
                    type="number"
                    name="adultos"
                    min="0"
                    value={form.adultos}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Niños / Estudiantes</label>
                  <input
                    type="number"
                    name="ninos"
                    min="0"
                    value={form.ninos}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Total Personas</label>
                  <input
                    type="text"
                    readOnly
                    value={`${form.total_personas} pers.`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-emerald-400 font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
                <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">Ventas Brutas ($ CLP)</span>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Boletería / Entradas</label>
                  <input
                    type="number"
                    name="venta_entradas"
                    value={form.venta_entradas}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tienda / Recuerdos</label>
                  <input
                    type="number"
                    name="venta_tienda"
                    value={form.venta_tienda}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-300">Total Ingresos:</span>
                  <span className="text-teal-400 font-mono text-base">${form.total_bruto.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">Arqueo por Medios ($ CLP)</span>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Efectivo en Caja</label>
                  <input
                    type="number"
                    name="efectivo"
                    value={form.efectivo}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">POS / Tarjetas</label>
                    <input
                      type="number"
                      name="transbank"
                      value={form.transbank}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Transferencias</label>
                    <input
                      type="number"
                      name="transferencias"
                      value={form.transferencias}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-300">Total Arqueado:</span>
                  <span className="text-amber-400 font-mono text-base">${form.total_declarado.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold ${form.diferencia === 0 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'}`}>
              <span>Balance de Cuadre:</span>
              <span className="font-mono font-bold">
                {form.diferencia === 0 ? '✓ Cuadre Exacto ($0)' : `Descuadre: $${form.diferencia.toLocaleString('es-CL')}`}
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                rows={2}
                value={form.observaciones}
                onChange={handleChange}
                placeholder="Novedades de la jornada, billetes dañados o vouchers retenidos..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {cargando ? 'Registrando Cierre...' : 'Registrar y Generar Acta Oficial'}
            </button>
          </form>
        </div>

        {/* Historial diario con estado y botón de anulación */}
        {historial.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Cierres Registrados Hoy ({hoy})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="py-2 px-2">Folio</th>
                    <th className="py-2 px-2">Turno</th>
                    <th className="py-2 px-2">Público</th>
                    <th className="py-2 px-2">Total Venta</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {historial.map((c) => {
                    const esAnulado = c.estado === 'anulado';
                    return (
                      <tr key={c.id} className={esAnulado ? 'opacity-40 line-through bg-slate-900/30' : ''}>
                        <td className="py-2 px-2 font-mono text-sky-400 font-bold">#{c.id}</td>
                        <td className="py-2 px-2">{c.turno}</td>
                        <td className="py-2 px-2">{c.total_personas} pers.</td>
                        <td className="py-2 px-2 font-mono text-white">${Number(c.total_bruto).toLocaleString('es-CL')}</td>
                        <td className="py-2 px-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${esAnulado ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                            {c.estado || 'activo'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          {!esAnulado && (
                            <button
                              type="button"
                              onClick={() => handleAnular(c.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-2 py-1 rounded transition border border-rose-900/40"
                              title="Anular este registro de cierre"
                            >
                              <Ban className="w-3 h-3" /> Anular
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}