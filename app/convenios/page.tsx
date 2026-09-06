'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle2, AlertTriangle, ArrowLeft, Store, Building2, Compass } from 'lucide-react';
import Link from 'next/link';

export default function ConveniosPage() {
  const hoy = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    tipo_ingreso: 'Convenio / Delegación', // Convenio, Salon, Cafeteria, Operador
    fecha: hoy,
    temporada: 'Verano',
    institucion: '',
    responsable: '',
    contacto: '',
    cantidad_personas: 0,
    precio_unitario: 0,
    total_facturado: 0,
    medio_pago: 'Transferencia',
    estado_pago: 'Pendiente',
    observaciones: ''
  });

  const [lista, setLista] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    // Si es convenio u operador, calculamos por cantidad * precio. Si es salón o cafetería, el total se puede ingresar directo o calcular.
    if (form.tipo_ingreso === 'Convenio / Delegación' || form.tipo_ingreso === 'Operador Turístico') {
      const tot = Number(form.cantidad_personas || 0) * Number(form.precio_unitario || 0);
      setForm(prev => ({ ...prev, total_facturado: tot }));
    }
  }, [form.cantidad_personas, form.precio_unitario, form.tipo_ingreso]);

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

      setMensaje({ tipo: 'exito', texto: `Registro de tipo [${form.tipo_ingreso}] guardado exitosamente.` });
      setForm({
        tipo_ingreso: form.tipo_ingreso,
        fecha: hoy,
        temporada: form.temporada,
        institucion: '',
        responsable: '',
        contacto: '',
        cantidad_personas: 0,
        precio_unitario: 0,
        total_facturado: 0,
        medio_pago: 'Transferencia',
        estado_pago: 'Pendiente',
        observaciones: ''
      });
      cargarConvenios();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error: ${err.message || 'Error de red'}` });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
          </Link>
          <span className="text-xs text-slate-400">Control de Ingresos y Convenios (Director)</span>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
            {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {mensaje.texto}
          </div>
        )}

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Centro de Carga de Ingresos</h2>
            <p className="text-xs text-slate-400 mt-0.5">Gestión centralizada para Delegaciones, Salón, Cafetería y Operadores Turísticos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Selector del tipo de ingreso */}
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Seleccione Categoría de Ingreso</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'Convenio / Delegación', label: 'Colegios / Delegación', icon: Users },
                  { id: 'Operador Turístico', label: 'Operador Turístico', icon: Compass },
                  { id: 'Arriendo de Salón', label: 'Arriendo de Salón', icon: Building2 },
                  { id: 'Cafetería', label: 'Cafetería (Ventas)', icon: Store },
                ].map((item) => {
                  const Icon = item.icon;
                  const activo = form.tipo_ingreso === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setForm(prev => ({ ...prev, tipo_ingreso: item.id }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition gap-1.5 ${activo ? 'bg-teal-950/80 border-teal-500 text-teal-200 shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                    >
                      <Icon className={`w-5 h-5 ${activo ? 'text-teal-400' : 'text-slate-500'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Registro</label>
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
                  <option value="Verano">☀️ Verano (Alta)</option>
                  <option value="Invierno">❄️ Invierno (Baja)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {form.tipo_ingreso === 'Cafetería' ? 'Detalle / Turno / Caja' : form.tipo_ingreso === 'Arriendo de Salón' ? 'Nombre del Evento / Solicitante' : 'Institución / Operador'}
                </label>
                <input
                  type="text"
                  name="institucion"
                  placeholder={form.tipo_ingreso === 'Cafetería' ? 'Ej: Venta Diaria / Turno Tarde' : form.tipo_ingreso === 'Arriendo de Salón' ? 'Ej: Capacitación Empresa X' : 'Ej: Turistik / Colegio Santa Marta'}
                  value={form.institucion}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {form.tipo_ingreso !== 'Cafetería' && form.tipo_ingreso !== 'Arriendo de Salón' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Responsable / Guía</label>
                  <input
                    type="text"
                    name="responsable"
                    placeholder="Nombre de quien lidera o coordina"
                    value={form.responsable}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / Contacto</label>
                  <input
                    type="text"
                    name="contacto"
                    placeholder="+56 9..."
                    value={form.contacto}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Sección de Montos Dinámica */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
              <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
                {form.tipo_ingreso === 'Cafetería' || form.tipo_ingreso === 'Arriendo de Salón' ? 'Monto Consolidado' : 'Tarifa & Afluencia'}
              </span>
              
              {form.tipo_ingreso === 'Cafetería' || form.tipo_ingreso === 'Arriendo de Salón' ? (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monto Total Recaudado ($ CLP)</label>
                  <input
                    type="number"
                    name="total_facturado"
                    min="0"
                    value={form.total_facturado}
                    onChange={(e) => setForm(prev => ({ ...prev, total_facturado: Number(e.target.value) }))}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-teal-400 font-bold font-mono"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">N° Personas / Pasajeros</label>
                    <input
                      type="number"
                      name="cantidad_personas"
                      min="1"
                      value={form.cantidad_personas}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Precio Unitario / Comisión ($ CLP)</label>
                    <input
                      type="number"
                      name="precio_unitario"
                      min="0"
                      value={form.precio_unitario}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Total Liquidado ($ CLP)</label>
                    <input
                      type="text"
                      readOnly
                      value={`$${Number(form.total_facturado).toLocaleString('es-CL')}`}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-teal-400 font-bold font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estado de Pago</label>
                <select
                  name="estado_pago"
                  value={form.estado_pago}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Pendiente">⏳ Factura Pendiente / Crédito</option>
                  <option value="Pagado">✅ Pagado al Contado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Medio de Pago</label>
                <select
                  name="medio_pago"
                  value={form.medio_pago}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo Mesón / Caja</option>
                  <option value="Transbank / Redcompra">Transbank / Redcompra</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Orden de Compra">Orden de Compra</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Observaciones / Notas del Excel</label>
              <textarea
                name="observaciones"
                rows={2}
                value={form.observaciones}
                onChange={handleChange}
                placeholder="Detalles traídos desde la planilla del director..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {cargando ? 'Registrando en Sistema...' : `Guardar Ingreso (${form.tipo_ingreso})`}
            </button>
          </form>
        </div>

        {/* Tabla unificada de ingresos */}
        {lista.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Historial Consolidado de Ingresos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Categoría</th>
                    <th className="py-2 px-2">Detalle / Institución</th>
                    <th className="py-2 px-2">Asistentes</th>
                    <th className="py-2 px-2">Total</th>
                    <th className="py-2 px-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lista.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-2">{c.fecha}</td>
                      <td className="py-2 px-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 border border-slate-600">
                          {c.tipo_ingreso || 'Convenio / Delegación'}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-semibold text-white">{c.institucion}</td>
                      <td className="py-2 px-2">{c.cantidad_personas ? `${c.cantidad_personas} pers.` : '-'}</td>
                      <td className="py-2 px-2 font-mono text-teal-300">${Number(c.total_facturado).toLocaleString('es-CL')}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${c.estado_pago === 'Pagado' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                          {c.estado_pago}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}