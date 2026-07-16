/**
 * CopaPortal — Portal público del Coordinador de delegación.
 * Acceso solo por código (?copa=CODIGO). Solo lectura — sin login.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle, RefreshCw } from 'lucide-react';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

interface Snapshot {
  actualizado: string;
  evento: string;
  delegacion: { club: string; ciudad: string; lider: string; meta: number; inn: string; out: string };
  pax: number; noches: number; inscritos: number; completos: number; abonados: number;
  total: number; abono: number; saldo: number;
  servicios: { id: string; titulo: string; detalle: string; valor: number; origen?: string }[];
  personas: { nombre: string; doc: string; rol: string; sub: string; datos: boolean; pago: string }[];
}

const CopaPortal: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('copa');
    if (c) { setCodigo(c); buscar(c); }
  }, []);

  const buscar = async (c?: string) => {
    const cod = (c || codigo).trim().toUpperCase();
    if (!cod) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/copa/portal/${cod}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'No se pudo cargar'); setData(null); return; }
      setData(d);
    } catch { setError('No se pudo conectar'); }
    finally { setLoading(false); }
  };

  const set = (v: number, m: number) => ({ pct: m ? Math.min(100, v / m * 100) : 0, ok: m > 0 && v >= m });

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5EFE3] flex items-center justify-center p-5" style={{ fontFamily: "'Archivo', sans-serif" }}>
        <div className="bg-white border border-[#E7DFCE] rounded-lg shadow-sm max-w-sm w-full overflow-hidden">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Portal del Coordinador</h2>
          <div className="p-5">
            <p className="text-sm text-[#6B7785] mb-3">Ingresa el código de 6 letras que te envió GuíaSAI para ver el avance de tu delegación.</p>
            <div className="bg-[#E8F1F2] border border-[#B9D8DB] rounded p-3 mb-4 text-xs text-[#0A5C64] leading-relaxed">
              <b>¿Qué puedes hacer aquí?</b>
              <ul className="mt-1.5 space-y-1 list-disc list-inside">
                <li>Ver cuántos viajeros están inscritos y con datos completos</li>
                <li>Ver los servicios contratados (alojamiento, traslados, tours) y su valor</li>
                <li>Consultar el total, el abono del 30% y el saldo restante</li>
                <li>Ver tus vouchers cuando el pago quede completo</li>
                <li>Escribir directo a GuíaSAI por WhatsApp si algo no cuadra</li>
              </ul>
              <p className="mt-2 text-[11px] text-[#5E7E92]">Este portal es de solo lectura — los cambios los hace GuíaSAI desde su panel interno.</p>
            </div>
            <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="EJEMPLO"
              maxLength={6} className="w-full border border-[#E7DFCE] rounded px-3 py-2.5 text-center font-mono text-lg font-bold tracking-widest mb-3" />
            {error && <p className="text-[#C4452F] text-xs font-semibold mb-3">{error}</p>}
            <button onClick={() => buscar()} disabled={loading} className="w-full bg-[#05263B] text-white font-bold text-sm py-3 rounded disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Ver mi delegación
            </button>
          </div>
        </div>
      </div>
    );
  }

  const d = data.delegacion;
  const s1 = set(data.inscritos, d.meta), s2 = set(data.completos, data.inscritos), s3 = set(data.abonados, data.inscritos);
  const pctPago = data.inscritos ? data.abonados / data.inscritos : 0;
  const estadoServ = pctPago >= 1 ? { c: 'bg-emerald-50 text-emerald-700', t: 'Confirmado' } : pctPago > 0 ? { c: 'bg-teal-50 text-teal-700', t: 'En trámite' } : { c: 'bg-orange-50 text-orange-700', t: 'Pendiente de abono' };

  return (
    <div className="min-h-screen bg-[#F5EFE3] text-[#111820] pb-10" style={{ fontFamily: "'Archivo', sans-serif" }}>
      <div className="bg-[#05263B] text-[#F5EFE3] px-4 pt-8 pb-4 border-b-4 border-[#FF6600]">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-mono tracking-widest uppercase text-[#FF6600] mb-1">Portal del Coordinador · {data.evento}</p>
          <h1 className="text-2xl font-black uppercase mb-1">{d.club}</h1>
          <p className="text-xs font-mono text-[#9FB6C4] mb-3">{d.ciudad} · {data.pax} viajeros · {d.inn} al {d.out} · {data.noches} noches</p>
          <div className="grid grid-cols-3 gap-0.5">
            {[['Inscritos', data.inscritos, d.meta, s1], ['Datos completos', data.completos, data.inscritos, s2], ['Con abono', data.abonados, data.inscritos, s3]].map(([label, v, m, s]: any) => (
              <div key={label} className="bg-[#03293F] p-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#5E7E92] mb-1">{label}</p>
                <p className="text-xl font-black tabular-nums" style={{ color: s.ok ? '#7FD8A8' : '#F5EFE3' }}>{v}<span className="text-xs text-[#5E7E92] font-mono"> / {m}</span></p>
                <div className="h-1 bg-[#0A3A55] mt-2 rounded overflow-hidden"><div className="h-full transition-all" style={{ width: `${s.pct}%`, background: s.ok ? '#1E6B4F' : '#FF6600' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        <div className="bg-[#1E6B4F] text-[#EAF5EF] rounded p-4 border-l-4 border-[#FF6600]">
          <p className="font-black uppercase text-sm mb-1">Wi da piipl fram di sii</p>
          <p className="text-[13.5px]">Tu grupo no se hospeda en la isla: entra a la isla. Cada peso que pagan queda en familias, cocineras, conductores y artesanos raizales.</p>
        </div>

        <div className="bg-white border border-[#E7DFCE] rounded overflow-hidden">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Estado de pago</h2>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-[#E7DFCE] rounded p-3"><p className="text-[9.5px] font-mono uppercase text-[#6B7785] mb-1">Total del grupo</p><p className="text-xl font-black text-[#05263B]">{cop(data.total)}</p></div>
              <div className="border border-[#FFD9BF] bg-[#FFF8F3] rounded p-3"><p className="text-[9.5px] font-mono uppercase text-[#6B7785] mb-1">Abono 30%</p><p className="text-xl font-black text-[#FF6600]">{cop(data.abono)}</p></div>
              <div className="border border-[#CFE6D8] bg-[#F3F8F5] rounded p-3"><p className="text-[9.5px] font-mono uppercase text-[#6B7785] mb-1">Saldo restante</p><p className="text-xl font-black text-[#1E6B4F]">{cop(data.saldo)}</p></div>
            </div>
            <div className="bg-[#FFF4E5] border border-[#FFD9A0] border-l-4 border-l-[#FF6600] rounded p-3 mt-3 text-[13px]"><b className="text-[#8A4B00]">Diciembre se llena de verdad.</b> El cupo se bloquea con abono, no con intención.</div>
          </div>
        </div>

        <div className="bg-white border border-[#E7DFCE] rounded overflow-hidden">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Servicios contratados</h2>
          {data.servicios.length ? (
            <table className="w-full text-xs">
              <thead><tr className="text-[9.5px] uppercase text-[#6B7785] border-b border-[#E7DFCE]"><th className="text-left px-4 py-2">Servicio</th><th className="text-left px-2 py-2">Detalle</th><th className="text-left px-2 py-2">Estado</th><th className="text-right px-4 py-2">Valor</th></tr></thead>
              <tbody>{data.servicios.map(s => (
                <tr key={s.id} className="border-b border-[#F2EEE5] last:border-0">
                  <td className="px-4 py-2.5 font-bold">{s.titulo}{s.origen === 'catalogo' && <span className="block text-[9px] font-mono text-[#0E7C86] font-normal">Actividad GuiaSAI</span>}</td>
                  <td className="px-2 py-2.5 text-[#6B7785] font-mono text-[11px]">{s.detalle}</td>
                  <td className="px-2 py-2.5"><span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${estadoServ.c}`}>{estadoServ.t}</span></td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{cop(s.valor)}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="text-center text-sm text-[#6B7785] py-6">Sin servicios contratados todavía.</p>}
        </div>

        <div className="bg-white border border-[#E7DFCE] rounded overflow-hidden">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Tu grupo · {data.personas.length} personas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-[9.5px] uppercase text-[#6B7785] border-b border-[#E7DFCE]"><th className="text-left px-4 py-2">Nombre</th><th className="text-left px-2 py-2">Rol</th><th className="text-left px-2 py-2">Datos</th><th className="text-left px-2 py-2">Pago</th></tr></thead>
              <tbody>{data.personas.map((p, i) => (
                <tr key={i} className="border-b border-[#F2EEE5] last:border-0">
                  <td className="px-4 py-2"><b>{p.nombre}</b><br /><span className="text-[#6B7785] font-mono text-[11px]">{p.doc}</span></td>
                  <td className="px-2 py-2">{p.rol}<br /><span className="text-[11px] text-[#6B7785]">{p.sub}</span></td>
                  <td className="px-2 py-2">{p.datos ? <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">completo</span> : <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700">falta dato</span>}</td>
                  <td className="px-2 py-2">{p.pago === 'pago' ? <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">pagado</span> : p.pago === 'abono' ? <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">abonó</span> : <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">sin abono</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-2">
          <a href={`https://wa.me/573153836043?text=${encodeURIComponent(`Hola GuíaSAI, soy ${d.lider} de ${d.club}. Quiero revisar el estado de nuestra reserva para la Copa de la Isla.`)}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#FF6600] text-white font-bold text-sm py-3 rounded"><MessageCircle size={14} /> Escribir a GuíaSAI</a>
          <button onClick={() => buscar(codigo)} className="flex items-center justify-center gap-1.5 bg-white border border-[#E7DFCE] text-[#05263B] font-bold text-sm px-4 rounded"><RefreshCw size={13} /> Actualizar</button>
        </div>
      </div>
      <p className="text-center text-[10px] font-mono text-[#6B7785] pt-8">GuíaSAI S.A.S. · RNT 48674 · #LaivStieg · Operador logístico de la Copa de la Isla</p>
    </div>
  );
};

export default CopaPortal;
