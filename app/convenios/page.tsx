'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ConveniosPage() {
  const hoy = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
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
    const tot = Number(form.cantidad_personas || 0) * Number(form.precio_unitario || 0);
    setForm(prev => ({ ...prev, total_facturado: tot }));
  }, [form.cantidad_personas, form.precio_unitario]);

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

      setMensaje({ tipo: 'exito', texto: `Convenio con ${form.institucion} registrado exitosamente.` });
      setForm({
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
          <span className="text-xs text-slate-400">Convenios y Delegaciones</span>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
            {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {mensaje.texto}
          </div>
        )}

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Registro de Visita Institucional</h2>
            <p className="text-xs text-slate-400 mt-0.5">Control comercial de colegios, delegaciones y operadores con tarifa acordada</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Visita</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Institución / Colegio</label>
                <input
                  type="text"
                  name="institucion"
                  placeholder="Ej: Colegio Santa Marta"
                  value={form.institucion}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profesor / Encargado</label>
                <input
                  type="text"
                  name="responsable"
                  placeholder="Nombre de quien lidera el grupo"
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

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
              <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">Tarifa Acordada & Afluencia</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">N° Asistentes (Alumnos/Guías)</label>
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
                  <label className="block text-xs text-slate-400 mb-1">Precio Unitario ($ CLP)</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Medio de Pago Comprometido</label>
                <select
                  name="medio_pago"
                  value={form.medio_pago}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Orden de Compra">Orden de Compra / Municipalidad</option>
                  <option value="Efectivo">Efectivo Mesón</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                rows={2}
                value={form.observaciones}
                onChange={handleChange}
                placeholder="Detalles sobre número de factura, exenciones o servicios de cafetería incluidos..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {cargando ? 'Registrando...' : 'Registrar Delegación'}
            </button>
          </form>
        </div>

        {/* Tabla de convenios */}
        {lista.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Convenios Registrados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Temporada</th>
                    <th className="py-2 px-2">Institución</th>
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
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.temporada === 'Verano' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-sky-950 text-sky-300 border border-sky-800'}`}>
                          {c.temporada || 'Verano'}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-semibold text-white">{c.institucion}</td>
                      <td className="py-2 px-2">{c.cantidad_personas} pers.</td>
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