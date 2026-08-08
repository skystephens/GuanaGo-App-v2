/**
 * AdminCopaDelegaciones — Gestión de delegaciones de la Copa de la Isla.
 * Editar datos de cada equipo y vincular manualmente sus cotizaciones reales
 * (evita que un organizador con el mismo WhatsApp en varios equipos mezcle
 * cotizaciones entre delegaciones distintas en el portal público).
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Search, X, Trash2, Plus, Save, Link2, ExternalLink, Copy } from 'lucide-react';
import { AppRoute } from '../../types';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

interface Delegacion {
  id: string; club: string; ciudad: string; coordinador: string; whatsapp: string;
  metaPax: number; checkin: string; checkout: string; codigoAcceso: string;
  publicado: boolean; estado: string; evento: string;
  cotizacionesVinculadas: string[];
  viajerosCount?: number; pax?: number; total?: number; abono?: number; saldo?: number;
}
interface CotRef { id: string; nombre: string; estado: string; total: number }

interface Props { onBack: () => void; onNavigate: (route: AppRoute) => void; }

export default function AdminCopaDelegaciones({ onBack }: Props) {
  const [delegaciones, setDelegaciones] = useState<Delegacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionada, setSeleccionada] = useState<Delegacion | null>(null);

  const cargar = () => {
    setLoading(true);
    fetch(`${API}/api/copa/delegaciones`).then(r => r.json()).then(d => Array.isArray(d) && setDelegaciones(d)).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  if (seleccionada) {
    return (
      <DetalleDelegacion
        delegacion={seleccionada}
        onBack={() => { setSeleccionada(null); cargar(); }}
        onSaved={(d) => setSeleccionada(d)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><ArrowLeft size={16} /></button>
        <div>
          <h1 className="font-bold text-lg">Delegaciones Copa de la Isla</h1>
          <p className="text-[11px] text-gray-500">{delegaciones.length} equipos</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-600" size={28} /></div>
        ) : delegaciones.map(d => (
          <button key={d.id} onClick={() => setSeleccionada(d)} className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-3.5 hover:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{d.club}</p>
                <p className="text-[11px] text-gray-500">{d.ciudad} · {d.viajerosCount ?? 0}/{d.metaPax} pax · código {d.codigoAcceso || '—'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.cotizacionesVinculadas?.length > 0 ? (
                  <span className="text-[9px] font-bold bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1"><Link2 size={9} /> {d.cotizacionesVinculadas.length}</span>
                ) : (
                  <span className="text-[9px] font-bold bg-orange-900/40 text-orange-400 px-2 py-1 rounded-full">Sin vincular</span>
                )}
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${d.publicado ? 'bg-teal-900/40 text-teal-400' : 'bg-gray-800 text-gray-500'}`}>{d.publicado ? 'Publicado' : 'Oculto'}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetalleDelegacion({ delegacion, onBack, onSaved }: { delegacion: Delegacion; onBack: () => void; onSaved: (d: Delegacion) => void }) {
  const [form, setForm] = useState(delegacion);
  const [saving, setSaving] = useState(false);
  const [cotVinculadas, setCotVinculadas] = useState<CotRef[]>([]);
  const [cargandoCot, setCargandoCot] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<CotRef[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (form.cotizacionesVinculadas?.length > 0) {
      fetch(`${API}/api/copa/cotizaciones-por-id?ids=${form.cotizacionesVinculadas.join(',')}`)
        .then(r => r.json()).then(d => Array.isArray(d) && setCotVinculadas(d)).finally(() => setCargandoCot(false));
    } else {
      setCargandoCot(false);
    }
  }, []);

  useEffect(() => {
    if (busqueda.trim().length < 2) { setResultados([]); return; }
    setBuscando(true);
    const t = setTimeout(() => {
      fetch(`${API}/api/copa/cotizaciones-buscar?q=${encodeURIComponent(busqueda)}`)
        .then(r => r.json()).then(d => Array.isArray(d) && setResultados(d)).finally(() => setBuscando(false));
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const guardarCampos = async (cambios: Partial<Delegacion>) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/copa/delegaciones/${form.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const actualizada = { ...form, ...cambios };
      setForm(actualizada);
      onSaved(actualizada);
    } catch (e: any) {
      alert('Error guardando: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const vincular = (cot: CotRef) => {
    if (form.cotizacionesVinculadas.includes(cot.id)) return;
    const nuevos = [...form.cotizacionesVinculadas, cot.id];
    setCotVinculadas(prev => [...prev, cot]);
    setBusqueda(''); setResultados([]);
    guardarCampos({ cotizacionesVinculadas: nuevos });
  };

  const desvincular = (id: string) => {
    const nuevos = form.cotizacionesVinculadas.filter(x => x !== id);
    setCotVinculadas(prev => prev.filter(c => c.id !== id));
    guardarCampos({ cotizacionesVinculadas: nuevos });
  };

  const link = `${window.location.origin}${window.location.pathname}?copa=${form.codigoAcceso}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><ArrowLeft size={16} /></button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-lg truncate">{form.club}</h1>
          <p className="text-[11px] text-gray-500">{saving ? 'Guardando...' : 'Los cambios se guardan al instante'}</p>
        </div>
        {saving && <Loader2 size={16} className="animate-spin text-gray-500" />}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Datos básicos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase">Datos del equipo</p>
          <Campo label="Club"><input defaultValue={form.club} onBlur={e => e.target.value !== form.club && guardarCampos({ club: e.target.value })} className="input" /></Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Ciudad"><input defaultValue={form.ciudad} onBlur={e => e.target.value !== form.ciudad && guardarCampos({ ciudad: e.target.value })} className="input" /></Campo>
            <Campo label="Coordinador"><input defaultValue={form.coordinador} onBlur={e => e.target.value !== form.coordinador && guardarCampos({ coordinador: e.target.value })} className="input" /></Campo>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="WhatsApp"><input defaultValue={form.whatsapp} onBlur={e => e.target.value !== form.whatsapp && guardarCampos({ whatsapp: e.target.value })} className="input" /></Campo>
            <Campo label="Meta pax"><input type="number" defaultValue={form.metaPax} onBlur={e => Number(e.target.value) !== form.metaPax && guardarCampos({ metaPax: Number(e.target.value) })} className="input" /></Campo>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Check-in"><input type="date" defaultValue={form.checkin} onBlur={e => e.target.value !== form.checkin && guardarCampos({ checkin: e.target.value })} className="input" /></Campo>
            <Campo label="Check-out"><input type="date" defaultValue={form.checkout} onBlur={e => e.target.value !== form.checkout && guardarCampos({ checkout: e.target.value })} className="input" /></Campo>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.publicado} onChange={e => guardarCampos({ publicado: e.target.checked })} className="accent-teal-600" />
            Publicado (visible en el portal)
          </label>
        </div>

        {/* Link del portal */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Link del portal — código {form.codigoAcceso}</p>
          <div className="flex items-center gap-2">
            <input readOnly value={link} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-[11px] text-gray-300 truncate" />
            <button onClick={() => navigator.clipboard.writeText(link)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"><Copy size={13} /></button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="p-2 bg-teal-700 hover:bg-teal-600 rounded-lg"><ExternalLink size={13} /></a>
          </div>
        </div>

        {/* Cotizaciones vinculadas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">Cotizaciones vinculadas</p>
          <p className="text-[11px] text-gray-500 mb-3">Solo estas se muestran en el portal público de este equipo — sin importar el teléfono.</p>

          {cargandoCot ? (
            <Loader2 size={16} className="animate-spin text-gray-500" />
          ) : cotVinculadas.length === 0 ? (
            <p className="text-sm text-gray-600 mb-3">Ninguna vinculada todavía.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {cotVinculadas.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 bg-gray-800 rounded-lg p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{c.nombre}</p>
                    <p className="text-[10px] text-gray-500">{c.estado} · {cop(c.total)}</p>
                  </div>
                  <button onClick={() => desvincular(c.id)} className="text-gray-500 hover:text-red-400 shrink-0 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar cotización por nombre del cliente..."
              className="w-full pl-8 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
            />
            {buscando && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-500" />}
          </div>
          {resultados.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
              {resultados.map(c => (
                <button key={c.id} onClick={() => vincular(c)} disabled={form.cotizacionesVinculadas.includes(c.id)}
                  className="w-full flex items-center justify-between gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg p-2.5 text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{c.nombre}</p>
                    <p className="text-[10px] text-gray-500">{c.estado} · {cop(c.total)}</p>
                  </div>
                  <Plus size={14} className="text-teal-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`.input { width: 100%; padding: 0.55rem 0.75rem; background: #111827; border: 1px solid #374151; border-radius: 0.5rem; color: white; font-size: 0.8rem; } .input:focus { outline: none; border-color: #0d9488; }`}</style>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">{label}</label>
      {children}
    </div>
  );
}
