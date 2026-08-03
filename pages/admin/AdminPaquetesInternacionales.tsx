/**
 * AdminPaquetesInternacionales — CRUD de la tabla Paquetes_Internacionales
 * Mismo patrón que AdminFinanzas: modal con botón de guardar en el header
 * (siempre visible, sin depender de scroll).
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Plus, X, Pencil, Trash2, Globe2 } from 'lucide-react';
import { AppRoute } from '../../types';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface Paquete {
  id: string; nombre: string; categoria: string; duracion: string; origen: string;
  salidas: string; precioDesde: number; precioSencilla: number | null; precioNino: number | null;
  flyerDrive: string; imagen: string; notas: string; operador: string; estado: string;
}

interface Props { onBack: () => void; onNavigate: (route: AppRoute) => void; }

const fmtUSD = (n: number | null) => n ? `US$${n.toLocaleString('en-US')}` : '—';

export default function AdminPaquetesInternacionales({ onBack }: Props) {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Paquete | 'nuevo' | null>(null);

  const cargar = () => {
    setLoading(true);
    fetch(`${API}/api/paquetes-internacionales/admin`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setPaquetes(d))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleDelete = async (p: Paquete) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const r = await fetch(`${API}/api/paquetes-internacionales/${p.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(await r.text());
      setModal(null);
      cargar();
    } catch (e) { alert('Error borrando: ' + e); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2"><Globe2 size={18} className="text-indigo-400" /> Paquetes Internacionales</h1>
            <p className="text-[11px] text-gray-500">{paquetes.filter(p => p.estado === 'Activo').length} activos de {paquetes.length} totales</p>
          </div>
        </div>
        <button onClick={() => setModal('nuevo')} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-xl text-xs font-bold">
          <Plus size={14} /> Nuevo
        </button>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-600" size={28} /></div>
        ) : paquetes.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">No hay paquetes cargados todavía.</div>
        ) : paquetes.map(p => (
          <button
            key={p.id}
            onClick={() => setModal(p)}
            className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-gray-700"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${p.estado === 'Activo' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                  {p.estado || 'Sin estado'}
                </span>
                <span className="text-[10px] text-indigo-400 font-bold">{p.categoria}</span>
              </div>
              <p className="font-bold text-sm truncate">{p.nombre}</p>
              <p className="text-[11px] text-gray-500">{p.duracion} · {p.origen}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-emerald-400">{fmtUSD(p.precioDesde)}</p>
              <Pencil size={12} className="text-gray-600 ml-auto mt-1" />
            </div>
          </button>
        ))}
      </div>

      {modal && (
        <ModalPaquete
          paquete={modal === 'nuevo' ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar(); }}
          onDelete={modal !== 'nuevo' ? () => handleDelete(modal) : undefined}
        />
      )}
    </div>
  );
}

function ModalPaquete({ paquete, onClose, onSaved, onDelete }: {
  paquete?: Paquete; onClose: () => void; onSaved: () => void; onDelete?: () => void;
}) {
  const esEdicion = !!paquete;
  const [form, setForm] = useState({
    nombre: paquete?.nombre || '',
    categoria: paquete?.categoria || 'Europa',
    duracion: paquete?.duracion || '',
    origen: paquete?.origen || 'Bogotá y Medellín',
    salidas: paquete?.salidas || '',
    precioDesde: paquete ? String(paquete.precioDesde) : '',
    precioSencilla: paquete?.precioSencilla ? String(paquete.precioSencilla) : '',
    precioNino: paquete?.precioNino ? String(paquete.precioNino) : '',
    flyerDrive: paquete?.flyerDrive || '',
    imagen: paquete?.imagen || '',
    notas: paquete?.notas || 'USD por persona; pago en COP a TRM. Doble/triple mismo valor.',
    operador: paquete?.operador || 'Mayorista (marca blanca)',
    estado: paquete?.estado || 'Activo',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nombre.trim()) { alert('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        precioDesde: parseFloat(form.precioDesde) || 0,
        precioSencilla: form.precioSencilla,
        precioNino: form.precioNino,
      };
      const url = esEdicion ? `${API}/api/paquetes-internacionales/${paquete!.id}` : `${API}/api/paquetes-internacionales`;
      const r = await fetch(url, {
        method: esEdicion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      onSaved();
    } catch (e) {
      alert('Error guardando: ' + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0 gap-2">
          <h2 className="font-bold text-white">{esEdicion ? 'Editar Paquete' : 'Nuevo Paquete'}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} {esEdicion ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><X size={13} /></button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <Campo label="Nombre del paquete *"><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Europa Sin Límite - 2027" className="input" /></Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Categoría">
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="input">
                <option>Europa</option><option>Asia</option><option>Medio Oriente</option><option>América</option><option>Otro</option>
              </select>
            </Campo>
            <Campo label="Duración"><input value={form.duracion} onChange={e => setForm({ ...form, duracion: e.target.value })} placeholder="16 días / 14 noches" className="input" /></Campo>
          </div>
          <Campo label="Origen"><input value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })} className="input" /></Campo>
          <Campo label="Salidas (separadas por |)"><textarea value={form.salidas} onChange={e => setForm({ ...form, salidas: e.target.value })} rows={2} placeholder="16 al 31 de mayo de 2027 | 17 al 01 de junio de 2027" className="input" /></Campo>
          <div className="grid grid-cols-3 gap-2">
            <Campo label="Desde doble (USD)"><input type="number" value={form.precioDesde} onChange={e => setForm({ ...form, precioDesde: e.target.value })} className="input" /></Campo>
            <Campo label="Sencilla (USD)"><input type="number" value={form.precioSencilla} onChange={e => setForm({ ...form, precioSencilla: e.target.value })} className="input" /></Campo>
            <Campo label="Niño (USD)"><input type="number" value={form.precioNino} onChange={e => setForm({ ...form, precioNino: e.target.value })} className="input" /></Campo>
          </div>
          <Campo label="Link del flyer (Google Drive)"><input value={form.flyerDrive} onChange={e => setForm({ ...form, flyerDrive: e.target.value })} placeholder="https://drive.google.com/..." className="input" /></Campo>
          <Campo label="Imagen (URL, opcional)"><input value={form.imagen} onChange={e => setForm({ ...form, imagen: e.target.value })} className="input" /></Campo>
          <Campo label="Operador / Aliado"><input value={form.operador} onChange={e => setForm({ ...form, operador: e.target.value })} className="input" /></Campo>
          <Campo label="Notas de tarifa"><textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} className="input" /></Campo>
          <Campo label="Estado">
            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="input">
              <option>Activo</option><option>Inactivo</option><option>Agotado</option>
            </select>
          </Campo>
          <p className="text-[10px] text-gray-500">Solo los paquetes con estado <b>Activo</b> se muestran en la app.</p>

          {esEdicion && onDelete && (
            <button onClick={onDelete} className="w-full py-2 mt-2 border border-red-900 text-red-400 hover:bg-red-950/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
              <Trash2 size={13} /> Eliminar este paquete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">{label}</label>
      {children}
      <style>{`.input { width: 100%; padding: 0.55rem 0.75rem; background: #111827; border: 1px solid #374151; border-radius: 0.5rem; color: white; font-size: 0.8rem; } .input:focus { outline: none; border-color: #6366f1; }`}</style>
    </div>
  );
}
