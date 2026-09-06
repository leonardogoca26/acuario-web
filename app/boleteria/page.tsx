'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertTriangle, ArrowLeft, Calculator } from 'lucide-react';
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
    observaciones: ''
  });

  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  // Cálculos automáticos de personas, ingresos y arqueo
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
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: `Error al guardar: ${err.message || 'Error desconocido'}` });
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

      </div>
    </div>
  );
}