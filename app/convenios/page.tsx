'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertTriangle, ArrowLeft, Printer, Ban } from 'lucide-react';
import Link from 'next/link';

export default function ConveniosPage() {
  const hoy = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    fecha: hoy,
    tipo_ingreso: 'Convenio / Delegación',
    nombre_institucion: '',
    adultos: 0,
    ninos: 0,
    total_personas: 0,
    valor_unitario_adulto: 0,
    valor_unitario_nino: 0,
    total_recaudado: 0,
    responsable: '',
    observaciones: '',
    estado: 'Activo'
  });

  const [lista, setLista] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  // Cargar historial de convenios / ingresos
  const cargarConvenios = async () => {
    try {
      const { data, error } = await supabase
        .from('convenios')
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
    cargarConvenios();
  }, []);

  // Cálculos automáticos según el tipo de ingreso
  useEffect(() => {
    let totalPers = 0;
    let totalRec = 0;

    if (form.tipo_ingreso === 'Convenio / Delegación' || form.tipo_ingreso === 'Operador Turístico') {
      const adultos = Number(form.adultos || 0);
      const ninos = Number(form.ninos || 0);
      totalPers = adultos + ninos;
      totalRec = (adultos * Number(form.valor_unitario_adulto || 0)) + (ninos * Number(form.valor_unitario_nino || 0));
    } else {
      // Para Arriendo de Salón o Cafetería, el total recaudado se ingresa directo en valor_unitario_adulto como monto total
      totalRec = Number(form.valor_unitario_adulto || 0);
    }

    setForm(prev => ({
      ...prev,
      total_personas: totalPers,
      total_recaudado: totalRec
    }));
  }, [form.tipo_ingreso, form.adultos, form.ninos, form.valor_unitario_adulto, form.valor_unitario_nino]);

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
        .from('convenios')
        .insert([form]);

      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: 'Registro guardado exitosamente.' });
      cargarConvenios();
      
      // Limpiar campos principales
      setForm(prev => ({
        ...prev,
        nombre_institucion: '',
        adultos: 0,
        ninos: 0,
        valor_unitario_adulto: 0,
        valor_unitario_nino: 0,
        observaciones: ''
      }));
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al guardar: ${err.message || 'Desconocido'}` });
    } finally {
      setCargando(false);
    }
  };

  // Función para anular lógicamente
  const handleAnular = async (id: number) => {
    if (!confirm('¿Estás seguro de anular este registro? Se mantendrá en el historial como anulado.')) return;

    try {
      const { error } = await supabase
        .from('convenios')
        .update({ estado: 'Anulado' })
        .eq('id', id);

      if (error) throw error;
      setMensaje({ tipo: 'exito', texto: `Registro #${id} anulado correctamente.` });
      cargarConvenios();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al anular: ${err.message}` });
    }
  };

  // Función para imprimir comprobante formal
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
          <title>Comprobante Ingreso #${item.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #111; max-width: 400px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 15px; }
            .header h1 { font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; }
            .header p { font-size: 11px; margin: 2px 0; color: #555; }
            .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px dashed #777; margin: 12px 0 6px 0; padding-bottom: 2px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .total { font-weight: bold; border-top: 1px solid #111; margin-top: 8px; padding-top: 6px; font-size: 14px; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Acuario - Control de Ingresos</h1>
            <p>Comprobante Folio # ${item.id}</p>
            <p>Fecha: ${item.fecha}</p>
          </div>

          <div class="row"><span>Categoría:</span><strong>${item.tipo_ingreso}</strong></div>
          <div class="row"><span>Institución / Cliente:</span><strong>${item.nombre_institucion}</strong></div>
          <div class="row"><span>Responsable:</span><span>${item.responsable || 'N/A'}</span></div>

          ${(item.tipo_ingreso === 'Convenio / Delegación' || item.tipo_ingreso === 'Operador Turístico') ? `
            <div class="section-title">Detalle de Asistencia</div>
            <div class="row"><span>Adultos:</span><span>${item.adultos} ($${Number(item.valor_unitario_adulto || 0).toLocaleString('es-CL')} c/u)</span></div>
            <div class="row"><span>Niños / Estudiantes:</span><span>${item.ninos} ($${Number(item.valor_unitario_nino || 0).toLocaleString('es-CL')} c/u)</span></div>
            <div class="row"><span>Total Personas:</span><strong>${item.total_personas} pers.</strong></div>
          ` : ''}

          <div class="section-title">Recaudación</div>
          <div class="row total">
            <span>Total Recaudado:</span>
            <span>$${Number(item.total_recaudado || 0).toLocaleString('es-CL')}</span>
          </div>

          ${item.observaciones ? `<div class="section-title">Observaciones</div><p style="font-size:11px; margin:4px 0;">${item.observaciones}</p>` : ''}

          <div class="footer">
            <p>Documento generado por Sistema Acuario Web</p>
            <p>Firma Autorizada: ______________________</p>
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
          <span className="text-xs text-slate-400">Panel de Dirección - Ingresos y Acuerdos</span>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
            {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {mensaje.texto}
          </div>
        )}

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Registro de Ingresos y Convenios</h2>
            <p className="text-xs text-slate-400 mt-0.5">Control centralizado para Delegaciones, Operadores, Salón y Cafetería</p>
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
                <label className="block text-xs font-semibold text-sky-400 mb-1">Tipo de Ingreso</label>
                <select
                  name="tipo_ingreso"
                  value={form.tipo_ingreso}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-sky-500/50 rounded-lg px-3 py-2 text-sm text-sky-300 font-bold focus:outline-none focus:border-sky-400"
                >
                  <option value="Convenio / Delegación">🏫 Convenio / Delegación</option>
                  <option value="Operador Turístico">🚌 Operador Turístico</option>
                  <option value="Arriendo de Salón">🏢 Arriendo de Salón</option>
                  <option value="Cafetería">☕ Cafetería</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Responsable / Director</label>
                <input
                  type="text"
                  name="responsable"
                  value={form.responsable}
                  onChange={handleChange}
                  placeholder="Ej. Dirección / Administrador"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Institución / Cliente / Motivo</label>
              <input
                type="text"
                name="nombre_institucion"
                value={form.nombre_institucion}
                onChange={handleChange}
                required
                placeholder="Ej. Colegio San Javier / Tour Mayor / Arriendo Cumpleaños"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Campos dinámicos según el tipo seleccionado */}
            {(form.tipo_ingreso === 'Convenio / Delegación' || form.tipo_ingreso === 'Operador Turístico') ? (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-4">
                <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">Desglose de Asistencia y Tarifas</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Cantidad Adultos</label>
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
                    <label className="block text-xs text-slate-400 mb-1">Valor Unitario Adulto ($)</label>
                    <input
                      type="number"
                      name="valor_unitario_adulto"
                      min="0"
                      value={form.valor_unitario_adulto}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Cantidad Niños / Estudiantes</label>
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
                    <label className="block text-xs text-slate-400 mb-1">Valor Unitario Niño ($)</label>
                    <input
                      type="number"
                      name="valor_unitario_nino"
                      min="0"
                      value={form.valor_unitario_nino}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-4">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">Monto Total Recaudado ({form.tipo_ingreso})</span>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monto Total en CLP ($)</label>
                  <input
                    type="number"
                    name="valor_unitario_adulto"
                    min="0"
                    value={form.valor_unitario_adulto}
                    onChange={handleChange}
                    placeholder="Ej. 150000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Resumen Total */}
            <div className="p-4 bg-teal-950/30 border border-teal-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-300 font-semibold uppercase tracking-wider">Total Recaudado Calculado:</span>
                {(form.tipo_ingreso === 'Convenio / Delegación' || form.tipo_ingreso === 'Operador Turístico') && (
                  <p className="text-xs text-slate-400 mt-0.5">Asistencia total: {form.total_personas} personas</p>
                )}
              </div>
              <span className="text-lg font-bold font-mono text-teal-400">${form.total_recaudado.toLocaleString('es-CL')}</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Observaciones / Acuerdos</label>
              <textarea
                name="observaciones"
                rows={2}
                value={form.observaciones}
                onChange={handleChange}
                placeholder="Detalles del acuerdo, forma de pago o notas del director..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {cargando ? 'Guardando Registro...' : 'Registrar Ingreso'}
            </button>
          </form>
        </div>

        {/* Historial de Convenios con Folio, Estado y Acciones */}
        {lista.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Historial y Correlativo de Ingresos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="py-2 px-2">N° Folio</th>
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Categoría</th>
                    <th className="py-2 px-2">Cliente / Institución</th>
                    <th className="py-2 px-2">Total Recaudado</th>
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
                        <td className="py-2 px-2 font-semibold text-amber-300">{item.tipo_ingreso}</td>
                        <td className="py-2 px-2 text-white">{item.nombre_institucion}</td>
                        <td className="py-2 px-2 font-mono text-teal-300">${Number(item.total_recaudado).toLocaleString('es-CL')}</td>
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
                                title="Anular Registro"
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