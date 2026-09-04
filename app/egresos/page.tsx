'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface EgresoItem {
  id: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  medio_pago: string;
  numero_documento: string;
}

const ITEMS_GASTO_ACUARIO = [
  'Alimento',
  'Arriendos',
  'Casino (artículos aseo, café, etc.)',
  'Combustible',
  'Comunicaciones (teléfonos, internet)',
  'Contabilidad',
  'Créditos bancarios / Cuotas',
  'Electricidad',
  'Equipos, bombas, filtros',
  'Fletes',
  'Herramientas',
  'Mantenciones y reparaciones',
  'Materiales (pegamento, fitting, cables)',
  'Patentes y seguros',
  'Personal (sueldos, imposiciones)',
  'Publicidad',
  'Regularización, topografía y arquitectura',
  'Relaciones públicas',
  'Varios'
];

export default function EgresosPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [historial, setHistorial] = useState<EgresoItem[]>([]);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: ITEMS_GASTO_ACUARIO[0],
    descripcion: '',
    monto: 0,
    medio_pago: 'Transferencia',
    numero_documento: ''
  });

  const cargarHistorial = async () => {
    const { data } = await supabase
      .from('egresos')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(15);
    if (data) setHistorial(data as EgresoItem[]);
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monto' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (formData.monto <= 0) {
      setStatus({ type: 'error', message: 'El monto debe ser mayor a $0.' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('egresos').insert([
      {
        fecha: formData.fecha,
        categoria: formData.categoria,
        descripcion: formData.descripcion || formData.categoria,
        monto: formData.monto,
        medio_pago: formData.medio_pago,
        numero_documento: formData.numero_documento
      }
    ]);

    if (error) {
      setStatus({ type: 'error', message: `Error al registrar: ${error.message}` });
    } else {
      setStatus({ type: 'success', message: 'Gasto guardado correctamente.' });
      cargarHistorial();
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        categoria: ITEMS_GASTO_ACUARIO[0],
        descripcion: '',
        monto: 0,
        medio_pago: 'Transferencia',
        numero_documento: ''
      });
    }
    setLoading(false);
  };

  const eliminarEgreso = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de gasto?')) return;
    const { error } = await supabase.from('egresos').delete().eq('id', id);
    if (!error) cargarHistorial();
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver a Boletería
          </Link>
          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full font-medium">
            Control de Costos Operativos
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <header className="border-b border-slate-100 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Registro de Gastos del Acuario</h1>
            <p className="text-sm text-slate-500">Plan de cuentas operativo mensual</p>
          </header>

          {status && (
            <div className={`p-4 mb-6 rounded-lg text-sm font-medium flex items-center gap-2 ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-rose-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ítem de Gasto</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-rose-600"
                >
                  {ITEMS_GASTO_ACUARIO.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monto ($ CLP)</label>
                <input
                  type="number"
                  name="monto"
                  min="0"
                  value={formData.monto}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-rose-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medio de Pago</label>
                <select
                  name="medio_pago"
                  value={formData.medio_pago}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Efectivo Caja">Efectivo de Caja</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="PAC/PAC Cuota">PAC Bancario / Cuota</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">N° Factura / Proveedor</label>
                <input
                  type="text"
                  name="numero_documento"
                  placeholder="Ej: Factura 1102 - SAESA"
                  value={formData.numero_documento}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detalle / Glosa</label>
              <textarea
                name="descripcion"
                rows={2}
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Detalle específico del gasto..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-700 hover:bg-rose-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Últimos Gastos Registrados</h2>
          {historial.length === 0 ? (
            <p className="text-sm text-slate-400">No hay gastos ingresados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Ítem</th>
                    <th className="py-2.5 px-3">Detalle / Doc</th>
                    <th className="py-2.5 px-3">Medio</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historial.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.fecha}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{item.categoria}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{item.descripcion}</div>
                        {item.numero_documento && <div className="text-xs text-slate-400">{item.numero_documento}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500">{item.medio_pago}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                        ${Number(item.monto).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => eliminarEgreso(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}