/**
 * AdminCopaDelegacion — Panel GuíaSAI para operar cada delegación de la
 * Copa de la Isla. Fiel al prototipo de Sky (marcador estilo voley,
 * tarifas visibles, carga masiva) pero conectado a Airtable + Wompi real.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Plus, Save, Send, Link as LinkIcon, Trash2, Copy, Check } from 'lucide-react';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

const FECHAS_EVENTO: Record<string, { checkin: string; checkout: string }> = {
  'Copa de la Isla': { checkin: '2026-12-17', checkout: '2026-12-22' },
  'Seven Colors SAI': { checkin: '2026-10-06', checkout: '2026-10-12' },
};

interface Props { onBack: () => void }

interface Del {
  id: string; club: string; ciudad: string; coordinador: string; whatsapp: string;
  metaPax: number; checkin: string; checkout: string; codigoAcceso: string;
  serviciosActivos: string[]; publicado: boolean; estado: string; evento: string;
  viajerosCount: number; pax: number; noches: number; total: number; abono: number;
}
interface Tarifa { id: string; servicioId: string; nombre: string; unidad: string; multiplicador: string; descripcion: string; precioVenta: number; proveedor: string }
interface Viajero { id: string; nombre: string; documento: string; telefono: string; subgrupo: string; rol: string; estadoPago: string }

const AdminCopaDelegacion: React.FC<Props> = ({ onBack }) => {
  const [dels, setDels] = useState<Del[]>([]);
  const [catalogo, setCatalogo] = useState<Tarifa[]>([]);
  const [selId, setSelId] = useState<string>('');
  const [viajeros, setViajeros] = useState<Viajero[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [nuevo, setNuevo] = useState({ club: '', ciudad: '', coordinador: '', whatsapp: '', metaPax: '31', checkin: '2026-12-17', checkout: '2026-12-22', evento: 'Copa de la Isla' });
  const [filtroEvento, setFiltroEvento] = useState<string>('Todos');
  const [bulk, setBulk] = useState({ texto: '', subgrupo: '' });
  const [nombreP, setNombreP] = useState({ nombre: '', doc: '', tel: '', sub: '', rol: 'Jugador' });
  const [copiado, setCopiado] = useState(false);
  const [pagoLink, setPagoLink] = useState<{ checkoutUrl: string; whatsappTexto: string } | null>(null);

  const sel = dels.find(d => d.id === selId) || null;
  const eventosConocidos = Array.from(new Set(['Copa de la Isla', 'Seven Colors SAI', ...dels.map(d => d.evento)]));
  const delsFiltradas = filtroEvento === 'Todos' ? dels : dels.filter(d => d.evento === filtroEvento);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [d1, d2] = await Promise.all([
        fetch(`${API}/api/copa/delegaciones`).then(r => r.json()),
        fetch(`${API}/api/copa/catalogo`).then(r => r.json()),
      ]);
      if (Array.isArray(d1)) { setDels(d1); if (!selId && d1[0]) setSelId(d1[0].id); }
      if (Array.isArray(d2)) setCatalogo(d2);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const cargarViajeros = async (id: string) => {
    if (!id) return;
    try {
      const r = await fetch(`${API}/api/copa/delegaciones/${id}/viajeros`);
      const d = await r.json();
      if (Array.isArray(d)) setViajeros(d);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { cargarTodo(); }, []);
  useEffect(() => { if (selId) { cargarViajeros(selId); setPagoLink(null); } }, [selId]);

  const patchDel = async (id: string, cambios: any) => {
    setSavingId(id);
    try {
      await fetch(`${API}/api/copa/delegaciones/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios),
      });
      await cargarTodo();
    } finally { setSavingId(null); }
  };

  const toggleServicio = (servicioId: string) => {
    if (!sel) return;
    const activos = sel.serviciosActivos.includes(servicioId)
      ? sel.serviciosActivos.filter(s => s !== servicioId)
      : [...sel.serviciosActivos, servicioId];
    patchDel(sel.id, { serviciosActivos: activos });
  };

  const crearDelegacion = async () => {
    if (!nuevo.club.trim()) { setMsg('Falta el nombre del club'); return; }
    const r = await fetch(`${API}/api/copa/delegaciones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nuevo, metaPax: Number(nuevo.metaPax) }),
    });
    const d = await r.json();
    if (d.id) {
      setNuevo(p => ({ ...p, club: '', ciudad: '', coordinador: '', whatsapp: '' }));
      await cargarTodo();
      setSelId(d.id);
      setMsg('Delegación creada ✅');
    }
  };

  const agregarViajero = async () => {
    if (!nombreP.nombre.trim() || !sel) return;
    await fetch(`${API}/api/copa/delegaciones/${sel.id}/viajeros`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombreP.nombre, documento: nombreP.doc, telefono: nombreP.tel, subgrupo: nombreP.sub || 'Sin subgrupo', rol: nombreP.rol }),
    });
    setNombreP({ nombre: '', doc: '', tel: '', sub: nombreP.sub, rol: nombreP.rol });
    await cargarViajeros(sel.id);
    await cargarTodo();
  };

  const importarBulk = async () => {
    if (!sel) return;
    const lineas = bulk.texto.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lineas.length) return;
    const r = await fetch(`${API}/api/copa/delegaciones/${sel.id}/viajeros/bulk`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineas, subgrupo: bulk.subgrupo || 'Sin subgrupo' }),
    });
    const d = await r.json();
    setMsg(`${d.creados || 0} viajeros importados ✅`);
    setBulk({ texto: '', subgrupo: bulk.subgrupo });
    await cargarViajeros(sel.id);
    await cargarTodo();
  };

  const cambiarPago = async (viajeroId: string, estadoPago: string) => {
    await fetch(`${API}/api/copa/viajeros/${viajeroId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estadoPago }),
    });
    if (sel) { await cargarViajeros(sel.id); await cargarTodo(); }
  };

  const quitarViajero = async (viajeroId: string) => {
    await fetch(`${API}/api/copa/viajeros/${viajeroId}`, { method: 'DELETE' });
    if (sel) { await cargarViajeros(sel.id); await cargarTodo(); }
  };

  const publicar = async () => {
    if (!sel) return;
    await patchDel(sel.id, { publicado: true });
    setMsg('Publicado — el coordinador ya puede ver su portal con el código ✅');
  };

  const generarLinkPago = async () => {
    if (!sel) return;
    const r = await fetch(`${API}/api/copa/delegaciones/${sel.id}/pago-link`, { method: 'POST' });
    const d = await r.json();
    if (d.checkoutUrl) setPagoLink(d);
    else setMsg(d.error || 'No se pudo generar el link');
  };

  const copiarCodigo = () => {
    if (!sel) return;
    navigator.clipboard.writeText(sel.codigoAcceso);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };

  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(''), 3000); return () => clearTimeout(t); } }, [msg]);

  if (loading) return <div className="min-h-screen bg-[#F5EFE3] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6600]" size={28} /></div>;

  return (
    <div className="min-h-screen bg-[#F5EFE3] text-[#111820]" style={{ fontFamily: "'Archivo', sans-serif" }}>
      {/* Header */}
      <div className="bg-[#05263B] text-[#F5EFE3] px-4 pt-10 pb-5 border-b-4 border-[#FF6600]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft size={15} /></button>
            <p className="text-[10px] font-mono tracking-widest uppercase text-[#FF6600]">Panel interno GuíaSAI · Copa de la Isla</p>
          </div>
          <h1 className="text-2xl font-black uppercase mb-3">Delegaciones</h1>

          {/* Filtro por evento */}
          <div className="flex gap-1.5 mb-2.5 overflow-x-auto">
            {['Todos', ...eventosConocidos.filter((e, i, a) => a.indexOf(e) === i)].map(ev => (
              <button key={ev} onClick={() => setFiltroEvento(ev)}
                className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wide font-bold transition-colors ${
                  filtroEvento === ev ? 'bg-[#FF6600] text-white' : 'bg-white/5 text-[#5E7E92] hover:bg-white/10'}`}>
                {ev}
              </button>
            ))}
          </div>

          {/* Selector de delegación */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {delsFiltradas.map(d => (
              <button key={d.id} onClick={() => setSelId(d.id)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selId === d.id ? 'bg-[#FF6600] text-white' : 'bg-white/10 text-[#9FB6C4] hover:bg-white/20'}`}>
                {d.club} {d.publicado && '✓'}
              </button>
            ))}
            {delsFiltradas.length === 0 && <p className="text-xs text-[#5E7E92] py-2">Sin delegaciones en este evento todavía.</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {msg && <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-semibold rounded-lg px-4 py-2.5">{msg}</div>}

        {/* Crear nueva delegación */}
        <div className="bg-white border border-[#E7DFCE] rounded-lg shadow-sm overflow-hidden">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">+ Nueva delegación</h2>
          <div className="p-4">
            <p className="text-xs text-[#6B7785] mb-3">Elige a qué torneo pertenece — las fechas de llegada/salida se autocompletan (Copa de la Isla: 17-22 dic · Seven Colors SAI: 6-12 oct), pero puedes ajustarlas por delegación. El coordinador solo verá la info de <b>este</b> evento en su portal — nunca se mezclan cifras entre torneos.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <select value={nuevo.evento} onChange={e => {
                  const ev = e.target.value;
                  const f = FECHAS_EVENTO[ev];
                  setNuevo(p => ({ ...p, evento: ev, ...(f ? { checkin: f.checkin, checkout: f.checkout } : {}) }));
                }} className="col-span-2 border-2 border-[#FF6600] rounded px-2.5 py-2 text-sm font-bold text-[#8A4B00] bg-[#FFF8F3]">
                {eventosConocidos.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
              <input placeholder="O escribe un torneo nuevo" onBlur={e => { if (e.target.value.trim()) setNuevo(p => ({ ...p, evento: e.target.value.trim() })); }} className="col-span-2 border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
              <input placeholder="Club" value={nuevo.club} onChange={e => setNuevo(p => ({ ...p, club: e.target.value }))} className="col-span-2 border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
              <input placeholder="Ciudad" value={nuevo.ciudad} onChange={e => setNuevo(p => ({ ...p, ciudad: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
              <input placeholder="Pax esperados" type="number" value={nuevo.metaPax} onChange={e => setNuevo(p => ({ ...p, metaPax: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
              <input placeholder="Coordinador" value={nuevo.coordinador} onChange={e => setNuevo(p => ({ ...p, coordinador: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
              <input placeholder="WhatsApp (57...)" value={nuevo.whatsapp} onChange={e => setNuevo(p => ({ ...p, whatsapp: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
              <input type="date" value={nuevo.checkin} onChange={e => setNuevo(p => ({ ...p, checkin: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
              <input type="date" value={nuevo.checkout} onChange={e => setNuevo(p => ({ ...p, checkout: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
            </div>
          </div>
          <div className="px-4 pb-4"><button onClick={crearDelegacion} className="flex items-center gap-1.5 bg-[#05263B] text-white font-bold text-sm px-4 py-2 rounded"><Plus size={14} /> Crear delegación</button></div>
        </div>

        {sel && (
          <>
            {/* Marcador */}
            <div className="grid grid-cols-3 gap-0.5 bg-[#0A3A55] rounded-t-lg overflow-hidden">
              {[
                ['Inscritos', sel.viajerosCount, sel.metaPax],
                ['Datos completos', viajeros.filter(v => v.nombre && v.documento && v.telefono).length, sel.viajerosCount],
                ['Con abono', viajeros.filter(v => v.estadoPago !== 'Pendiente').length, sel.viajerosCount],
              ].map(([label, v, m]: any) => (
                <div key={label} className="bg-[#03293F] p-3">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-[#5E7E92] mb-1">{label}</p>
                  <p className="text-2xl font-black text-[#F5EFE3] tabular-nums">{v}<span className="text-xs text-[#5E7E92] font-mono"> / {m}</span></p>
                  <div className="h-1 bg-[#0A3A55] mt-2 rounded overflow-hidden"><div className="h-full bg-[#FF6600]" style={{ width: `${m ? Math.min(100, v / m * 100) : 0}%` }} /></div>
                </div>
              ))}
            </div>

            {/* Datos + código */}
            <div className="bg-white border border-[#E7DFCE] rounded-b-lg -mt-1 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="inline-block bg-[#0E7C86] text-white text-[9px] font-mono uppercase tracking-wide px-2 py-0.5 rounded mb-1">{sel.evento}</span>
                  <p className="font-bold text-base">{sel.club} <span className="text-[#6B7785] font-normal text-sm">· {sel.ciudad}</span></p>
                  <p className="text-xs text-[#6B7785]">{sel.coordinador} · {sel.checkin} → {sel.checkout} · {sel.noches} noches</p>
                </div>
                <button onClick={copiarCodigo} className="flex items-center gap-1.5 bg-[#F5EFE3] border border-[#E7DFCE] px-3 py-2 rounded font-mono text-xs font-bold">
                  {copiado ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />} {sel.codigoAcceso}
                </button>
              </div>
            </div>

            {/* Tarifas y servicios activos */}
            <div className="bg-white border-2 border-[#FF6600] rounded-lg overflow-hidden">
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#8A4B00] bg-[#FFF3E9] px-4 py-3">Servicios · tarifas del catálogo global</h2>
              <div className="p-4 space-y-2">
                {catalogo.map(t => {
                  const on = sel.serviciosActivos.includes(t.servicioId);
                  return (
                    <label key={t.id} className={`flex gap-3 items-start p-3 border rounded cursor-pointer transition-colors ${on ? 'border-[#FF6600] bg-[#FFF8F3]' : 'border-[#E7DFCE] hover:border-[#0E7C86]'}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleServicio(t.servicioId)} className="mt-1 w-4 h-4 accent-[#FF6600]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{t.nombre}</p>
                        <p className="text-xs text-[#6B7785]">{t.descripcion}</p>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <p className="font-bold text-sm">{cop(t.precioVenta)}</p>
                        <p className="text-[10px] text-[#6B7785]">{t.unidad}</p>
                      </div>
                    </label>
                  );
                })}
                {catalogo.length === 0 && <p className="text-sm text-[#6B7785] text-center py-4">Cargando catálogo de tarifas...</p>}
              </div>
            </div>

            {/* Cotización */}
            <div className="bg-white border border-[#E7DFCE] rounded-lg overflow-hidden">
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Cotización</h2>
              <div className="p-4">
                <p className="text-xs text-[#6B7785] mb-3"><b>Publicar</b> activa el portal del coordinador con el código {sel.codigoAcceso} (solo lectura). <b>Generar link de pago</b> crea un cobro Wompi por el 30% de abono — cópialo o envíalo directo por WhatsApp.</p>
                {sel.total === 0 ? <p className="text-sm text-[#6B7785]">Sin servicios activos con tarifa.</p> : (
                  <>
                    <div className="flex justify-between items-baseline pt-2 border-t-2 border-[#05263B] mt-2">
                      <span className="text-[11px] uppercase font-bold text-[#6B7785]">Total grupo</span>
                      <b className="text-2xl font-black text-[#05263B] tabular-nums">{cop(sel.total)}</b>
                    </div>
                    <div className="bg-[#FFF8F3] border border-[#FFD9BF] rounded p-3 mt-3 text-xs">
                      Abono 30% para bloquear: <b className="font-mono">{cop(sel.abono)}</b><br />
                      Saldo: <b className="font-mono">{cop(sel.total - sel.abono)}</b>
                    </div>
                  </>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={publicar} disabled={savingId === sel.id} className="flex items-center gap-1.5 bg-[#FF6600] text-white font-bold text-sm px-4 py-2.5 rounded disabled:opacity-50">
                    <Send size={14} /> {sel.publicado ? 'Ya publicado — republicar' : 'Publicar al coordinador'}
                  </button>
                  <button onClick={generarLinkPago} disabled={!sel.abono} className="flex items-center gap-1.5 bg-[#05263B] text-white font-bold text-sm px-4 py-2.5 rounded disabled:opacity-40">
                    <LinkIcon size={14} /> Generar link de pago (abono 30%)
                  </button>
                </div>
                {pagoLink && (
                  <div className="mt-3 bg-[#E8F1F2] border border-[#B9D8DB] rounded p-3 text-xs">
                    <p className="font-bold text-[#0A5C64] mb-1">Link generado ✅</p>
                    <a href={pagoLink.checkoutUrl} target="_blank" rel="noopener noreferrer" className="text-[#0E7C86] underline break-all">{pagoLink.checkoutUrl}</a>
                    <button onClick={() => { navigator.clipboard.writeText(pagoLink.whatsappTexto); setMsg('Mensaje de WhatsApp copiado ✅'); }} className="block mt-2 text-[#05263B] font-bold underline">Copiar mensaje para WhatsApp</button>
                  </div>
                )}
              </div>
            </div>

            {/* Viajeros */}
            <div className="bg-white border border-[#E7DFCE] rounded-lg overflow-hidden">
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Jugadores y acompañantes · {viajeros.length}</h2>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                  <input placeholder="Nombre" value={nombreP.nombre} onChange={e => setNombreP(p => ({ ...p, nombre: e.target.value }))} className="col-span-2 border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
                  <input placeholder="Documento" value={nombreP.doc} onChange={e => setNombreP(p => ({ ...p, doc: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
                  <input placeholder="Celular" value={nombreP.tel} onChange={e => setNombreP(p => ({ ...p, tel: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
                  <input placeholder="Subgrupo" value={nombreP.sub} onChange={e => setNombreP(p => ({ ...p, sub: e.target.value }))} className="border border-[#E7DFCE] rounded px-2.5 py-2 text-sm" />
                </div>
                <button onClick={agregarViajero} className="bg-[#FF6600] text-white font-bold text-xs px-4 py-2 rounded mb-4">Agregar</button>

                <details className="mb-4">
                  <summary className="text-xs font-bold text-[#0E7C86] cursor-pointer">Carga masiva (una línea por persona: Nombre; documento; celular)</summary>
                  <textarea value={bulk.texto} onChange={e => setBulk(p => ({ ...p, texto: e.target.value }))} rows={4}
                    placeholder={"María Pérez; 1010203040; 3001234567\nLuis Gómez; 1020304050; 3007654321"}
                    className="w-full border border-[#E7DFCE] rounded px-2.5 py-2 text-xs font-mono mt-2" />
                  <input placeholder="Subgrupo (opcional)" value={bulk.subgrupo} onChange={e => setBulk(p => ({ ...p, subgrupo: e.target.value }))} className="w-full border border-[#E7DFCE] rounded px-2.5 py-2 text-sm mt-2" />
                  <button onClick={importarBulk} className="bg-[#05263B] text-white font-bold text-xs px-4 py-2 rounded mt-2">Importar lista</button>
                </details>

                <div className="overflow-x-auto -mx-4">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-[#E7DFCE] text-[10px] uppercase text-[#6B7785]"><th className="text-left px-4 py-2">Nombre</th><th className="text-left px-2 py-2">Subgrupo</th><th className="text-left px-2 py-2">Pago</th><th className="px-2 py-2"></th></tr></thead>
                    <tbody>
                      {viajeros.map(v => (
                        <tr key={v.id} className="border-b border-[#F2EEE5]">
                          <td className="px-4 py-2"><b>{v.nombre}</b><br /><span className="text-[#6B7785]">{v.telefono}</span></td>
                          <td className="px-2 py-2">{v.subgrupo}</td>
                          <td className="px-2 py-2">
                            <select value={v.estadoPago} onChange={e => cambiarPago(v.id, e.target.value)} className="text-xs border border-[#E7DFCE] rounded px-1.5 py-1">
                              <option value="Pendiente">Sin abono</option>
                              <option value="Abono">Abonó</option>
                              <option value="Pago total">Pagado</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 text-right"><button onClick={() => quitarViajero(v.id)}><Trash2 size={13} className="text-[#C4452F]" /></button></td>
                        </tr>
                      ))}
                      {viajeros.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-[#6B7785]">Sin viajeros cargados todavía.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <p className="text-center text-[10px] font-mono text-[#6B7785] pb-8">GuíaSAI S.A.S. · RNT 48674 · #LaivStieg</p>
    </div>
  );
};

export default AdminCopaDelegacion;
