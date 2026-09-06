'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertTriangle, ArrowLeft, Calculator, Printer, Ban } from 'lucide-react';
import Link from 'next/link';

export default function BoleteriaPage() {
  const hoy = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    fecha: hoy,
    temporada: 'Verano (Alta)',
    turno: 'Turno Completo',
    cajero: 'Boletería Principal',
    adultos: 0,
    ninos: 0,
    total_personas: 0,
    ventas_boleteria: 0,
    ventas_tienda: 0,
    total_ingresos: 0,
    efectivo: 0,
    pos_compra_aqui: 0,
    pos_transbank: 0,
    transferencias: 0,
    total_arqueado: 0,
    diferencia: 0,
    observaciones: '',
    estado: 'Activo'
  });

  const [lista, setLista] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  // Cargar historial de cierres
  const cargarCierres = async () => {
    try {
      const { data, error } = await supabase
        .from('cierre_boleteria')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data) {
        setLista(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarCierres();
  }, []);

  // Cálculos automáticos
  useEffect(() => {
    const totalPers = Number(form.adultos || 0) + Number(form.ninos || 0);
    const totalIng = Number(form.ventas_boleteria || 0) + Number(form.ventas_tienda || 0);
    const totalArq = Number(form.efectivo || 0) + Number(form.pos_compra_aqui || 0) + Number(form.pos_transbank || 0) + Number(form.transferencias || 0);
    const diff = totalArq - totalIng;

    setForm(prev => ({
      ...prev,
      total_personas: totalPers,
      total_ingresos: totalIng,
      total_arqueado: totalArq,
      diferencia: diff
    }));
  }, [form.adultos, form.ninos, form.ventas_boleteria, form.ventas_tienda, form.efectivo, form.pos_compra_aqui, form.pos_transbank, form.transferencias]);

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
      const { error } = await supabase
        .from('cierre_boleteria')
        .insert([form]);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: 'Cierre de boletería registrado exitosamente.' });
      cargarCierres();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al guardar: ${err.message || 'Error desconocido'}` });
    } finally {
      setCargando(false);
    }
  };

  // Función para Anular registro (cambia el estado a 'Anulado' sin borrar el ID ni la fila)
  const handleAnular = async (id: number) => {
    if (!confirm('¿Estás seguro de anular este cierre? El registro se mantendrá en el historial como anulado.')) return;

    try {
      const { error } = await supabase
        .from('cierre_boleteria')
        .update({ estado: 'Anulado' })
        .eq('id', id);

      if (error) throw error;
      setMensaje({ tipo: 'exito', texto: `Cierre #${id} anulado correctamente.` });
      cargarCierres();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al anular: ${err.message}` });
    }
  };

  // Función para imprimir comprobante oficial
  const handleImprimir = (item: any) => {
    if (item.estado === 'Anulado') {
      alert('No se puede imprimir un comprobante anulado.');
      return;
    }

    const ventana = window.open('', '_print', 'width=700,height=700');
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Cierre de Boletería #${item.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #111; max-width: 400px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 15px; }
            .header h1 { font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; }
            .header p { font-size: 11px; margin: 2px 0; color: #555; }
            .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px dashed #777; margin: 12px 0 6px 0; padding-bottom: 2px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .total { font-weight: bold; border-top: 1px solid #111; margin-top: 8px; padding-top: 6px; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Acuario - Control de Caja</h1>
            <p>Comprobante de Cierre Diario # ${item.id}</p>
            <p>Fecha: ${item.fecha} | Turno: ${item.turno}</p>
          </div>

          <div class="row"><span>Cajero / Operador:</span><strong>${item.cajero}</strong></div>
          <div class="row"><span>Temporada:</span><span>${item.temporada}</span></div>

          <div class="section-title">Afluencia de Visitantes</div>
          <div class="row"><span>Total Personas:</span><strong>${item.total_personas} pers.</strong></div>

          <div class="section-title">Ventas Brutas ($ CLP)</div>
          <div class="row"><span>Boletería / Entradas:</span><span>$${Number(item.ventas_boleteria || 0).toLocaleString('es-CL')}</span></div>
          <div class="row"><span>Tienda / Recuerdos:</span><span>$${Number(item.ventas_tienda || 0).toLocaleString('es-CL')}</span></div>
          <div class="row total"><span>Total Ingresos:</span><span>$${Number(item.total_ingresos || 0).toLocaleString('es-CL')}</span></div>

          <div class="section-title">Arqueo por Medios ($ CLP)</div>
          <div class="row"><span>Efectivo en Caja:</span><span>$${Number(item.efectivo || 0).toLocaleString('es-CL')}</span></div>
          <div class="row"><span>POS Compra Aquí:</span><span>$${Number(item.pos_compra_aqui || 0).toLocaleString('es-CL')}</span></div>
          <div class="row"><span>POS Transbank:</span><span>$${Number(item.pos_transbank || 0).toLocaleString('es-CL')}</span></div>
          <div class="row"><span>Transferencias:</span><span>$${Number(item.transferencias || 0).toLocaleString('es-CL')}</span></div>
          <div class="row total"><span>Total Arqueado:</span><span>$${Number(item.total_arqueado || 0).toLocaleString('es-CL')}</span></div>

          <div class="section-title">Cuadre de Caja</div>
          <div class="row total">
            <span>Diferencia:</span>
            <span>${Number(item.diferencia) === 0 ? 'Cuadre Exacto ($0)' : `$${Number(item.diferencia).toLocaleString('es-CL')}`}</span>
          </div>

          ${item.observaciones ? `<div class="section-title">Observaciones</div><p style="font-size:11px; margin:4px 0;">${item.observaciones}</p>` : ''}

          <div class="footer">
            <p>Documento generado por Sistema Acuario Web</p>
            <p>Firma Operador: ______________________</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
          </Link>
          <span className="text-xs text-slate-400">Módulo de Boletería y Cajas</span>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
            {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {mensaje.texto}
          </div>
        )}

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Cierre de Boletería Diario</h2>
            <p className="text-xs text-slate-400 mt-0.5">Control de afluencia, cuadratura de ingresos por POS separados y arqueo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                <label className="block text-xs font-semibold text-amber-400 mb-1">Temporada</label>
                <select
                  name="temporada"
                  value={form.temporada}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="Verano (Alta)">☀️ Verano (Alta)</option>
                  <option value="Invierno (Baja)">❄️ Invierno (Baja)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Turno</label>
                <select
                  name="turno"
                  value={form.turno}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Turno Completo">Turno Completo</option>
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
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

            {/* Afluencia */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
              <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">Afluencia de Visitantes</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-sky-300 font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Ventas Brutas y Arqueo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
                <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">Ventas Brutas ($ CLP)</span>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Boletería / Entradas</label>
                  <input
                    type="number"
                    name="ventas_boleteria"
                    min="0"
                    value={form.ventas_boleteria}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tienda / Recuerdos</label>
                  <input
                    type="number"
                    name="ventas_tienda"
                    min="0"
                    value={form.ventas_tienda}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Total Ingresos:</span>
                  <span className="text-sm font-bold text-teal-400 font-mono">${form.total_ingresos.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">Arqueo por Medios ($ CLP)</span>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Efectivo en Caja</label>
                  <input
                    type="number"
                    name="efectivo"
                    min="0"
                    value={form.efectivo}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">POS Compra Aquí</label>
                    <input
                      type="number"
                      name="pos_compra_aqui"
                      min="0"
                      value={form.pos_compra_aqui}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">POS Transbank</label>
                    <input
                      type="number"
                      name="pos_transbank"
                      min="0"
                      value={form.pos_transbank}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Transferencias</label>
                  <input
                    type="number"
                    name="transferencias"
                    min="0"
                    value={form.transferencias}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Total Arqueado:</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">${form.total_arqueado.toLocaleString('es-CL')}</span>
                </div>
              </div>

            </div>

            {/* Balance de Cuadre */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${form.diferencia === 0 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Balance de Cuadre:</span>
              </div>
              <span className="text-sm font-bold font-mono">
                {form.diferencia === 0 ? '✓ Cuadre Exacto ($0)' : `${form.diferencia > 0 ? '+' : ''}$${form.diferencia.toLocaleString('es-CL')}`}
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Observaciones / Incidencias de Caja</label>
              <textarea
                name="observaciones"
                rows={2}
                value={form.observaciones}
                onChange={handleChange}
                placeholder="Detalle de diferencias, retiros de efectivo o notas del turno..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {cargando ? 'Guardando Cierre...' : 'Registrar Cierre de Boletería'}
            </button>
          </form>
        </div>

        {/* Tabla de Historial con Estado de Anulación */}
        {lista.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Historial y Correlativo de Cierres</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="py-2 px-2">N° Folio</th>
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Cajero</th>
                    <th className="py-2 px-2">Total Ingresos</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lista.map((item) => {
                    const esAnulado = item.estado === 'Anulado';
                    return (
                      <tr key={item.id} className={esAnulado ? 'opacity-50 bg-slate-950/40 line-through' : ''}>
                        <td className="py-2 px-2 font-mono font-bold text-sky-400">#{item.id}</td>
                        <td className="py-2 px-2">{item.fecha}</td>
                        <td className="py-2 px-2 font-semibold text-white">{item.cajero}</td>
                        <td className="py-2 px-2 font-mono text-teal-300">${Number(item.total_ingresos).toLocaleString('es-CL')}</td>
                        <td className="py-2 px-2">
                          <span className={`no-underline px-2 py-0.5 rounded text-[10px] font-bold uppercase ${esAnulado ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                            {item.estado || 'Activo'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center space-x-2">
                          {!esAnulado && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleImprimir(item)}
                                title="Imprimir Comprobante"
                                className="p-1.5 bg-sky-950 text-sky-300 hover:bg-sky-900 rounded border border-sky-800 transition"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAnular(item.id)}
                                title="Anular Turno"
                                className="p-1.5 bg-rose-950 text-rose-300 hover:bg-rose-900 rounded border border-rose-800 transition"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
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