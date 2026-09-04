'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ConvenioRegistro {
  id: string;
  fecha: string;
  institucion_nombre: string;
  tipo_institucion: string;
  total_asistentes: number;
  total_facturado: number;
  condicion_pago: string;
}

export default function ConveniosPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [historial, setHistorial] = useState<ConvenioRegistro[]>([]);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    institucion_nombre: '',
    tipo_institucion: 'Colegio',
    cantidad_alumnos_ninos: 0,
    cantidad_adultos_guias: 0,
    valor_acordado_por_persona: 0,
    total_facturado: 0,
    condicion_pago: 'Por Cobrar',
    medio_pago: 'Transferencia',
    numero_factura: '',
    observaciones: ''
  });

  const totalAsistentes = Number(formData.cantidad_alumnos_ninos) + Number(formData.cantidad_adultos_guias);

  const handleAsistentesOValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Number(value);

    const updated = {
      ...formData,
      [name]: numericValue
    };

    if (name === 'cantidad_alumnos_ninos' || name === 'cantidad_adultos_guias' || name === 'valor_acordado_por_persona') {
      const asist = (name === 'cantidad_alumnos_ninos' ? numericValue : updated.cantidad_alumnos_ninos) +
                    (name === 'cantidad_adultos_guias' ? numericValue : updated.cantidad_adultos_guias);
      const precio = name === 'valor_acordado_por_persona' ? numericValue : updated.valor_acordado_por_persona;
      
      if (precio > 0) {
        updated.total_facturado = asist * precio;
      }
    }

    setFormData(updated);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const cargarHistorial = async () => {
    const { data } = await supabase
      .from('convenios_eventos')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(10);
    if (data) setHistorial(data as ConvenioRegistro[]);
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (totalAsistentes <= 0) {
      setStatus({ type: 'error', message: 'Debes registrar al menos un asistente.' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('convenios_eventos').insert([
      {
        fecha: formData.fecha,
        institucion_nombre: formData.institucion_nombre,
        tipo_institucion: formData.tipo_institucion,
        cantidad_alumnos_ninos: formData.cantidad_alumnos_ninos,
        cantidad_adultos_guias: formData.cantidad_adultos_guias,
        valor_acordado_por_persona: formData.valor_acordado_por_persona,
        total_facturado: formData.total_facturado,
        condicion_pago: formData.condicion_pago,
        medio_pago: formData.medio_pago,
        numero_factura: formData.numero_factura,
        observaciones: formData.observaciones
      }
    ]);

    if (error) {
      setStatus({ type: 'error', message: `Error al registrar: ${error.message}` });
    } else {
      setStatus({ type: 'success', message: 'Convenio ingresado con éxito.' });
      cargarHistorial();
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        institucion_nombre: '',
        tipo_institucion: 'Colegio',
        cantidad_alumnos_ninos: 0,
        cantidad_adultos_guias: 0,
        valor_acordado_por_persona: 0,
        total_facturado: 0,
        condicion_pago: 'Por Cobrar',
        medio_pago: 'Transferencia',
        numero_factura: '',
        observaciones: ''
      });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver a Boletería
          </Link>
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-medium">
            Panel de Dirección / Convenios
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <header className="border-b border-slate-100 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Registro de Delegaciones y Convenios</h1>
            <p className="text-sm text-slate-500">Gestión de afluencia de colegios, universidades y operadores turísticos</p>
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
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Entidad</label>
                <select
                  name="tipo_institucion"
                  value={formData.tipo_institucion}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 outline-none"
                >
                  <option value="Colegio">Colegio / Escuela</option>
                  <option value="Universidad">Universidad / CFT</option>
                  <option value="Operador Turístico">Operador Turístico / Agencia</option>
                  <option value="Empresa / Convenio">Empresa / Convenio</option>
                  <option value="Municipalidad">Municipalidad / Adulto Mayor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Institución</label>
                <input
                  type="text"
                  name="institucion_nombre"
                  placeholder="Ej: Colegio San Mateo"
                  value={formData.institucion_nombre}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 outline-none"
                  required
                />
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
              <h2 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">Nómina de Asistentes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estudiantes / Pasajeros</label>
                  <input
                    type="number"
                    name="cantidad_alumnos_ninos"
                    min="0"
                    value={formData.cantidad_alumnos_ninos}
                    onChange={handleAsistentesOValorChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Profesores / Guías</label>
                  <input
                    type="number"
                    name="cantidad_adultos_guias"
                    min="0"
                    value={formData.cantidad_adultos_guias}
                    onChange={handleAsistentesOValorChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total Delegación</label>
                  <div className="w-full bg-indigo-100 rounded-lg p-2 font-bold text-indigo-900">{totalAsistentes} pers.</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Valores Comerciales ($ CLP)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Precio Unitario ($)</label>
                  <input
                    type="number"
                    name="valor_acordado_por_persona"
                    min="0"
                    value={formData.valor_acordado_por_persona}
                    onChange={handleAsistentesOValorChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total a Cobrar</label>
                  <input
                    type="number"
                    name="total_facturado"
                    min="0"
                    value={formData.total_facturado}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_facturado: Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white font-bold text-emerald-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Condición Pago</label>
                  <select
                    name="condicion_pago"
                    value={formData.condicion_pago}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
                  >
                    <option value="Pagado">Pagado</option>
                    <option value="Por Cobrar">Por Cobrar (Crédito)</option>
                    <option value="Prepago">Prepago</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">N° Factura / Boleta</label>
                  <input
                    type="text"
                    name="numero_factura"
                    placeholder="Ej: F-101"
                    value={formData.numero_factura}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                rows={2}
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Datos de contacto, fecha de vencimiento acordada, etc."
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Guardando...' : 'Registrar Convenio'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Últimos Convenios Registrados</h2>
          {historial.length === 0 ? (
            <p className="text-sm text-slate-400">No hay convenios registrados todavía.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Institución</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Asistentes</th>
                    <th className="py-2 px-3">Monto</th>
                    <th className="py-2 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historial.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-3">{c.fecha}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{c.institucion_nombre}</td>
                      <td className="py-2 px-3">{c.tipo_institucion}</td>
                      <td className="py-2 px-3">{c.total_asistentes} pers.</td>
                      <td className="py-2 px-3 font-medium">${Number(c.total_facturado).toLocaleString('es-CL')}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.condicion_pago === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.condicion_pago}
                        </span>
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