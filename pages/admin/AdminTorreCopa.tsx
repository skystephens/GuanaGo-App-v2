/**
 * AdminTorreCopa — Torre de operación interna [CONFIDENCIAL].
 * Consolida margen real, cuentas por pagar a aliados y estructura de
 * costos (venta vs. neto) de todas las delegaciones de la Copa de la Isla.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

interface Props { onBack: () => void }
interface Del { id: string; club: string; viajerosCount: number; noches: number; total: number; costoNeto: number; margen: number; margenPct: number; abono: number; estado: string; publicado: boolean; serviciosActivos: string[]; evento: string }
interface Tarifa { id: string; servicioId: string; nombre: string; unidad: string; precioVenta: number; precioNeto: number; proveedor: string }

const AdminTorreCopa: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<'resumen' | 'delegaciones' | 'pagar' | 'costos'>('resumen');
  const [dels, setDels] = useState<Del[]>([]);
  const [catalogo, setCatalogo] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [filtroEvento, setFiltroEvento] = useState('Todos');
  const [editCat, setEditCat] = useState<Record<string, { precioVenta: string; precioNeto: string; proveedor: string }>>({});

  const cargar = async () => {
    setLoading(true);
    try {
      const [d1, d2] = await Promise.all([
        fetch(`${API}/api/copa/delegaciones`).then(r => r.json()),
        fetch(`${API}/api/copa/catalogo`).then(r => r.json()),
      ]);
      if (Array.isArray(d1)) setDels(d1);
      if (Array.isArray(d2)) {
        setCatalogo(d2);
        setEditCat(Object.fromEntries(d2.map((t: Tarifa) => [t.id, { precioVenta: String(t.precioVenta), precioNeto: String(t.precioNeto), proveedor: t.proveedor }])));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const eventos = ['Todos', ...Array.from(new Set(dels.map(d => d.evento || 'Copa de la Isla')))];
  const delsVista = filtroEvento === 'Todos' ? dels : dels.filter(d => (d.evento || 'Copa de la Isla') === filtroEvento);

  const venta = delsVista.reduce((a, d) => a + d.total, 0);
  const costo = delsVista.reduce((a, d) => a + d.costoNeto, 0);
  const margen = venta - costo;
  const margenPct = venta ? Math.round(margen / venta * 100) : 0;

  // Cuentas por pagar: agrupar por proveedor a través de todas las delegaciones activas
  const porPagar: Record<string, { monto: number; servicios: Set<string>; unidades: number }> = {};
  delsVista.forEach(d => {
    d.serviciosActivos.forEach(sid => {
      const t = catalogo.find(c => c.servicioId === sid);
      if (!t || !t.precioNeto) return;
      const mult = t.unidad.includes('noche') ? d.viajerosCount * d.noches : d.viajerosCount;
      const prov = t.proveedor || 'Sin asignar';
      porPagar[prov] = porPagar[prov] || { monto: 0, servicios: new Set(), unidades: 0 };
      porPagar[prov].monto += mult * t.precioNeto;
      porPagar[prov].servicios.add(t.nombre);
      porPagar[prov].unidades += mult;
    });
  });
  const filasPagar = Object.entries(porPagar).sort((a, b) => b[1].monto - a[1].monto);
  const totalPagar = filasPagar.reduce((a, [, v]) => a + v.monto, 0);

  const guardarCatalogo = async () => {
    const cambios = catalogo.map(t => ({
      id: t.id,
      precioVenta: Number(editCat[t.id]?.precioVenta) || 0,
      precioNeto: Number(editCat[t.id]?.precioNeto) || 0,
      proveedor: editCat[t.id]?.proveedor || '',
    }));
    const r = await fetch(`${API}/api/copa/catalogo`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cambios }),
    });
    if (r.ok) { setMsg('Tarifas actualizadas ✅'); await cargar(); }
    else setMsg('Error guardando');
    setTimeout(() => setMsg(''), 3000);
  };

  const TABS = [
    ['resumen', 'P&L'], ['delegaciones', 'Delegaciones'], ['pagar', 'Cuentas por pagar'], ['costos', 'Estructura de costos'],
  ] as const;

  if (loading) return <div className="min-h-screen bg-[#F5EFE3] flex items-center justify-center"><Loader2 className="animate-spin text-[#C4452F]" size={28} /></div>;

  return (
    <div className="min-h-screen bg-[#F5EFE3] text-[#111820] pb-10" style={{ fontFamily: "'Archivo', sans-serif" }}>
      <div className="bg-[#05263B] text-[#F5EFE3] px-4 pt-8 pb-4 border-b-4 border-[#C4452F]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft size={15} /></button>
            <span className="inline-block bg-[#C4452F] text-white text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded">Confidencial · Uso interno</span>
          </div>
          <h1 className="text-2xl font-black uppercase mb-3">Torre de operación — Copa de la Isla</h1>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-0.5 rounded overflow-hidden">
            {[['Venta', cop(venta), '#F5EFE3'], ['Costo aliados', cop(costo), '#F5EFE3'], ['Margen bruto', cop(margen), '#7FD8A8'],
              ['Margen %', `${margenPct}%`, '#FF6600'], ['Delegaciones', String(delsVista.length), '#F5EFE3'], ['Por pagar isla', cop(totalPagar), '#FF8B7A']]
              .map(([k, v, c]) => (
              <div key={k} className="bg-[#03293F] p-2.5">
                <p className="text-[8.5px] font-mono uppercase tracking-wider text-[#5E7E92] mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{k}</p>
                <p className="text-base font-black tabular-nums" style={{ color: c }}>{v}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-4 flex-wrap">
            {eventos.map(ev => (
              <button key={ev} onClick={() => setFiltroEvento(ev)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wide font-bold transition-colors ${
                  filtroEvento === ev ? 'bg-[#FF6600] text-white' : 'bg-white/5 text-[#5E7E92] hover:bg-white/10'}`}>
                {ev}
              </button>
            ))}
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {TABS.map(([v, label]) => (
              <button key={v} onClick={() => setTab(v as any)}
                className={`px-3.5 py-2 text-[11px] font-bold font-mono uppercase tracking-wide rounded-t ${tab === v ? 'bg-white text-[#05263B]' : 'bg-white/10 text-[#9FB6C4]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5 space-y-4">
        {msg && <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-semibold rounded-lg px-4 py-2.5">{msg}</div>}

        {tab === 'resumen' && (
          <div className="bg-white border border-[#E7DFCE] rounded overflow-hidden">
            <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Estado de resultados del evento</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[#F2EEE5]"><td className="px-4 py-3">Venta total (todas las delegaciones)</td><td className="px-4 py-3 text-right font-mono font-bold">{cop(venta)}</td></tr>
                <tr className="border-b border-[#F2EEE5]"><td className="px-4 py-3">Costo a aliados (neto)</td><td className="px-4 py-3 text-right font-mono text-[#C4452F]">-{cop(costo)}</td></tr>
                <tr><td className="px-4 py-3 font-bold">Margen bruto GuíaSAI</td><td className="px-4 py-3 text-right font-mono font-black text-[#1E6B4F] text-base">{cop(margen)} <span className="text-xs text-[#6B7785]">({margenPct}%)</span></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'delegaciones' && (
          <div className="bg-white border border-[#E7DFCE] rounded overflow-hidden">
            <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Rentabilidad por delegación</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-[9.5px] uppercase text-[#6B7785] border-b-2 border-[#05263B]"><th className="text-left px-4 py-2">Delegación</th><th className="text-right px-2 py-2">Pax</th><th className="text-right px-2 py-2">Venta</th><th className="text-right px-2 py-2">Costo</th><th className="text-right px-2 py-2">Margen</th><th className="text-right px-4 py-2">%</th></tr></thead>
                <tbody>{dels.map(d => (
                  <tr key={d.id} className="border-b border-[#F2EEE5]">
                    <td className="px-4 py-2.5"><b>{d.club}</b><br /><span className="text-[#6B7785] font-mono text-[10.5px]">{d.viajerosCount} pax · {d.noches} noches</span></td>
                    <td className="px-2 py-2.5 text-right font-mono">{d.viajerosCount}</td>
                    <td className="px-2 py-2.5 text-right font-mono font-bold">{cop(d.total)}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-[#C4452F]">{cop(d.costoNeto)}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-[#1E6B4F]">{cop(d.margen)}</td>
                    <td className="px-4 py-2.5 text-right"><span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${d.margenPct >= 25 ? 'bg-emerald-50 text-emerald-700' : d.margenPct >= 15 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>{d.margenPct}%</span></td>
                  </tr>
                ))}
                {delsVista.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#6B7785]">Sin delegaciones en este evento todavía.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'pagar' && (
          <div className="bg-white border border-[#E7DFCE] rounded overflow-hidden">
            <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Cuentas por pagar a aliados</h2>
            <p className="text-xs text-[#6B7785] px-4 pt-3">Esto también es la <b>derrama económica</b> hacia la isla, para presentar a la Secretaría de Turismo.</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs">
                <thead><tr className="text-[9.5px] uppercase text-[#6B7785] border-b-2 border-[#05263B]"><th className="text-left px-4 py-2">Aliado / proveedor</th><th className="text-left px-2 py-2">Concepto</th><th className="text-right px-2 py-2">Unid.</th><th className="text-right px-4 py-2">A pagar</th></tr></thead>
                <tbody>
                  {filasPagar.map(([k, v]) => (
                    <tr key={k} className="border-b border-[#F2EEE5]">
                      <td className="px-4 py-2.5 font-bold">{k}</td>
                      <td className="px-2 py-2.5 text-[#6B7785]">{[...v.servicios].join(' · ')}</td>
                      <td className="px-2 py-2.5 text-right font-mono">{v.unidades}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">{cop(v.monto)}</td>
                    </tr>
                  ))}
                  {filasPagar.length > 0 && (
                    <tr className="border-t-2 border-[#05263B]"><td colSpan={3} className="px-4 py-3 font-black">TOTAL DERRAMA A LA ISLA</td><td className="px-4 py-3 text-right font-mono font-black text-[#1E6B4F] text-base">{cop(totalPagar)}</td></tr>
                  )}
                  {filasPagar.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-[#6B7785]">Sin costos asignados todavía.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'costos' && (
          <div className="bg-white border border-[#E7DFCE] rounded overflow-hidden">
            <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Estructura de costos · Venta vs. neto aliado</h2>
            <p className="text-xs text-[#6B7785] px-4 pt-3">El <b>precio venta</b> es lo que ve el cliente. El <b>neto</b> es lo que le pagas al aliado.</p>
            <div className="p-4 space-y-2">
              {catalogo.map(t => {
                const ec = editCat[t.id] || { precioVenta: '0', precioNeto: '0', proveedor: '' };
                const mg = (Number(ec.precioVenta) || 0) - (Number(ec.precioNeto) || 0);
                const pc = Number(ec.precioVenta) ? Math.round(mg / Number(ec.precioVenta) * 100) : 0;
                return (
                  <div key={t.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center border-b border-[#F2EEE5] pb-2">
                    <div className="col-span-2 md:col-span-1"><p className="font-bold text-xs">{t.nombre}</p><p className="text-[10px] text-[#6B7785] font-mono">{t.unidad}</p></div>
                    <input type="number" value={ec.precioVenta} onChange={e => setEditCat(p => ({ ...p, [t.id]: { ...ec, precioVenta: e.target.value } }))} className="border border-[#E7DFCE] rounded px-2 py-1.5 text-xs font-mono text-right" placeholder="Venta" />
                    <input type="number" value={ec.precioNeto} onChange={e => setEditCat(p => ({ ...p, [t.id]: { ...ec, precioNeto: e.target.value } }))} className="border border-[#E7DFCE] rounded px-2 py-1.5 text-xs font-mono text-right" placeholder="Neto" />
                    <input value={ec.proveedor} onChange={e => setEditCat(p => ({ ...p, [t.id]: { ...ec, proveedor: e.target.value } }))} className="border border-[#E7DFCE] rounded px-2 py-1.5 text-xs" placeholder="Proveedor" />
                    <div className={`text-right font-mono text-xs font-bold ${pc >= 25 ? 'text-[#1E6B4F]' : pc >= 15 ? 'text-[#FF6600]' : 'text-[#C4452F]'}`}>{cop(mg)}<br /><span className="font-normal text-[10px]">{pc}%</span></div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 pt-0"><button onClick={guardarCatalogo} className="bg-[#05263B] text-white font-bold text-sm px-5 py-2.5 rounded flex items-center gap-2"><RefreshCw size={13} /> Guardar tarifas</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTorreCopa;
