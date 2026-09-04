'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer, AlertTriangle, CheckCircle2, History, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CierreItem {
  id: string;
  folio: number;
  turno: string;
  total_visitantes: number;
  total_ingresos: number;
  estado: string;
}

export default function BoleteriaPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; folio?: number } | null>(null);
  const [historialDia, setHistorialDia] = useState<CierreItem[]>([]);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno: 'Jornada Completa',
    cajero_nombre: 'Boletería Principal',
    adultos: 0,
    ninos: 0,
    monto_entradas: 0,
    monto_tienda: 0,
    pago_efectivo: 0,
    pago_tarjetas: 0,
    pago_transferencia: 0,
    observaciones: ''
  });

  const totalVisitantes = Number(formData.adultos) + Number(formData.ninos);
  const totalIngresos = Number(formData.monto_entradas) + Number(formData.monto_tienda);
  const totalMediosPago = Number(formData.pago_efectivo) + Number(formData.pago_tarjetas) + Number(formData.pago_transferencia);
  const diferenciaCuadre = totalIngresos - totalMediosPago;

  const cargarCierresDelDia = async (fecha: string) => {
    const { data } = await supabase
      .from('cierres_diarios')
      .select('*')
      .eq('fecha', fecha)
      .order('created_at', { ascending: false });

    if (data) setHistorialDia(data as CierreItem[]);
  };

  useEffect(() => {
    cargarCierresDelDia(formData.fecha);
  }, [formData.fecha]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'fecha' || name === 'turno' || name === 'cajero_nombre' || name === 'observaciones' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (diferenciaCuadre !== 0) {
      setStatus({
        type: 'error',
        message: `La caja no cuadra. Hay una diferencia de $${Math.abs(diferenciaCuadre).toLocaleString('es-CL')}.`
      });
      setLoading(false);
      return;
    }

    if (totalIngresos === 0 && totalVisitantes === 0) {
      setStatus({
        type: 'error',
        message: 'No puedes enviar un cierre en cero.'
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cierres_diarios')
      .insert([
        {
          fecha: formData.fecha,
          turno: formData.turno,
          cajero_nombre: formData.cajero_nombre,
          adultos: formData.adultos,
          ninos: formData.ninos,
          monto_entradas: formData.monto_entradas,
          monto_tienda: formData.monto_tienda,
          pago_efectivo: formData.pago_efectivo,
          pago_tarjetas: formData.pago_tarjetas,
          pago_transferencia: formData.pago_transferencia,
          observaciones: formData.observaciones,
          estado: 'activo'
        }
      ])
      .select('folio')
      .single();

    if (error) {
      setStatus({ type: 'error', message: `Error al guardar: ${error.message}` });
    } else {
      setStatus({ 
        type: 'success', 
        message: `¡Cierre registrado con éxito bajo el Folio #${data?.folio || 'N/A'}!`,
        folio: data?.folio 
      });
      cargarCierresDelDia(formData.fecha);
      setFormData((prev) => ({
        ...prev,
        adultos: 0,
        ninos: 0,
        monto_entradas: 0,
        monto_tienda: 0,
        pago_efectivo: 0,
        pago_tarjetas: 0,
        pago_transferencia: 0,
        observaciones: ''
      }));
    }
    setLoading(false);
  };

  const anularRegistro = async (id: string, folio: number) => {
    if (!confirm(`¿Estás seguro de anular el Cierre Folio #${folio}?`)) return;
    const { error } = await supabase.from('cierres_diarios').update({ estado: 'anulado' }).eq('id', id);
    if (!error) cargarCierresDelDia(formData.fecha);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5 transition">
            <ArrowLeft className="w-4 h-4" /> Volver al Menú Principal
          </Link>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">
            Terminal de Boletería
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <header className="border-b border-slate-100 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Cierre de Boletería</h1>
            <p className="text-sm text-slate-500">Parque Acuario - Control Diario de Caja y Afluencia</p>
          </header>

          {status && (
            <div
              className={`p-4 mb-6 rounded-lg text-sm font-medium flex items-center justify-between ${
                status.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                <span>{status.message}</span>
              </div>
              {status.folio && (
                <button 
                  onClick={() => window.print()} 
                  className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-700 px-3 py-1 rounded text-xs hover:bg-emerald-50"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir Comprobante
                </button>
              )}
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
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Turno</label>
                <select
                  name="turno"
                  value={formData.turno}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Jornada Completa">Jornada Completa</option>
                  <option value="Turno Mañana">Turno Mañana</option>
                  <option value="Turno Tarde">Turno Tarde</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cajero / Operador</label>
                <input
                  type="text"
                  name="cajero_nombre"
                  value={formData.cajero_nombre}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Afluencia de Público</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Adultos</label>
                  <input
                    type="number"
                    name="adultos"
                    min="0"
                    value={formData.adultos}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Niños</label>
                  <input
                    type="number"
                    name="ninos"
                    min="0"
                    value={formData.ninos}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total Personas</label>
                  <div className="w-full bg-slate-200 rounded-lg p-2 font-bold text-slate-700">{totalVisitantes}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Venta Bruta ($ CLP)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Boletería / Entradas</label>
                  <input
                    type="number"
                    name="monto_entradas"
                    min="0"
                    value={formData.monto_entradas}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tienda / Souvenirs</label>
                  <input
                    type="number"
                    name="monto_tienda"
                    min="0"
                    value={formData.monto_tienda}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total Ingresos</label>
                  <div className="w-full bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-2 font-bold">
                    ${totalIngresos.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Arqueo por Medio de Pago ($ CLP)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Efectivo Físico</label>
                  <input
                    type="number"
                    name="pago_efectivo"
                    min="0"
                    value={formData.pago_efectivo}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Transbank / Tarjetas</label>
                  <input
                    type="number"
                    name="pago_tarjetas"
                    min="0"
                    value={formData.pago_tarjetas}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Transferencias</label>
                  <input
                    type="number"
                    name="pago_transferencia"
                    min="0"
                    value={formData.pago_transferencia}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Declarado: <strong>${totalMediosPago.toLocaleString('es-CL')}</strong></span>
                <span className={diferenciaCuadre === 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {diferenciaCuadre === 0 ? '✓ Cuadre Exacto' : `⚠ Descuadre: $${diferenciaCuadre.toLocaleString('es-CL')}`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                rows={2}
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Detalle de anomalías, billetes retenidos, etc."
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Validando...' : 'Registrar y Generar Comprobante'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-800">Cierres Registrados Hoy ({formData.fecha})</h2>
          </div>

          {historialDia.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">No hay cierres registrados aún para esta fecha.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Folio</th>
                    <th className="py-2.5 px-3">Turno</th>
                    <th className="py-2.5 px-3">Público</th>
                    <th className="py-2.5 px-3">Total Venta</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historialDia.map((item) => (
                    <tr key={item.id} className={item.estado === 'anulado' ? 'opacity-40 bg-slate-50 line-through' : ''}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">#{item.folio}</td>
                      <td className="py-2.5 px-3">{item.turno}</td>
                      <td className="py-2.5 px-3">{item.total_visitantes} pers.</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">${Number(item.total_ingresos).toLocaleString('es-CL')}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.estado === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.estado === 'activo' && (
                          <button
                            onClick={() => anularRegistro(item.id, item.folio)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium ml-2"
                          >
                            Anular
                          </button>
                        )}
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