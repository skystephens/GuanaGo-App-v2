/**
 * AdminVouchers — Panel unificado de Vouchers & Reservas
 * GuanaGO Super Admin · Abril 2026
 *
 * Datos: Airtable "Generador_vouchers" (base appij4vUx7GZEwf5x) via backend
 * IA:    Claude agent en modo admin para asistencia operativa
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, Search, Plus, Loader2, Bot, Send, ChevronDown, ChevronUp,
  Sparkles, CheckCircle2, Clock, XCircle, RefreshCw, MapPin, Users,
  Calendar, Phone, Mail, Eye, X, ChevronRight, FileText,
} from 'lucide-react';
import { AppRoute } from '../../types';

// ─── API base ─────────────────────────────────────────────────────────────────

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoucherRecord {
  id: string;
  titular: string;
  reservaNum: string;
  pax: string;
  fecha: string;
  hora: string;
  puntoEncuentro: string;
  observaciones: string;
  notasAdicionales: string;
  tourName: string;
  estado: string;
  estadoVoucher: string;
  telefono: string;
  email: string;
  ultimaModificacion: string;
}

interface VoucherFormData {
  titular: string;
  telefono: string;
  email: string;
  pax: string;
  fecha: string;
  hora: string;
  puntoEncuentro: string;
  observaciones: string;
  tourName: string;
  estado: string;
}

interface AgentMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface AdminVouchersProps {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS = ['Pendiente', 'Reserva Confirmada', 'Abono Realizado', 'Realizado', 'Cancelado', 'No llego el cliente'];
const PUNTOS  = [
  'MUELLE CASA DE LA CULTURA',
  'MUELLE PORTOFINO',
  'MUELLE TONY',
  'AEROPUERTO GUSTAVO ROJAS PINILLA',
  'HOTEL DEL CLIENTE',
  'OTRO',
];

const ESTADO_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  'Pendiente':           { label: 'Pendiente',          bg: 'bg-yellow-900/40',  text: 'text-yellow-400',  icon: <Clock size={11} /> },
  'Reserva Confirmada':  { label: 'Confirmada',         bg: 'bg-green-900/40',   text: 'text-green-400',   icon: <CheckCircle2 size={11} /> },
  'Abono Realizado':     { label: 'Abono',              bg: 'bg-blue-900/40',    text: 'text-blue-400',    icon: <CheckCircle2 size={11} /> },
  'Realizado':           { label: 'Realizado',          bg: 'bg-indigo-900/40',  text: 'text-indigo-400',  icon: <CheckCircle2 size={11} /> },
  'Cancelado':           { label: 'Cancelado',          bg: 'bg-red-900/40',     text: 'text-red-400',     icon: <XCircle size={11} /> },
  'No llego el cliente': { label: 'No llegó',           bg: 'bg-orange-900/40',  text: 'text-orange-400',  icon: <XCircle size={11} /> },
};

const EMPTY_FORM: VoucherFormData = {
  titular: '', telefono: '', email: '', pax: '',
  fecha: '', hora: '', puntoEncuentro: '', observaciones: '', tourName: '', estado: 'Pendiente',
};

const AGENT_PROMPTS = [
  { label: '¿Qué reservas tienen hoy?', icon: '📅', prompt: '¿Cuántas reservas hay programadas para hoy? Dame el resumen rápido.' },
  { label: 'Pendientes urgentes',        icon: '⚡', prompt: 'Lista las reservas PENDIENTES más urgentes (por fecha más próxima). ¿Cuál debo confirmar primero?' },
  { label: 'Sugerencia de mejora',       icon: '💡', prompt: 'Con los datos de los vouchers, ¿qué patrones ves? ¿Hay algo que podamos mejorar operativamente?' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFecha(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}


// ─── Agente IA ────────────────────────────────────────────────────────────────

function AgenteVouchers({ vouchers }: { vouchers: VoucherRecord[] }) {
  const [msgs, setMsgs]         = useState<AgentMsg[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(true);
  const [convId]                = useState(() => `vchr-${Date.now()}`);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const buildContext = useCallback(() => {
    const total      = vouchers.length;
    const pendientes = vouchers.filter(v => v.estado === 'Pendiente').length;
    const hoy        = new Date().toISOString().slice(0, 10);
    const hoyList    = vouchers.filter(v => v.fecha === hoy).map(v => `${v.titular} — ${v.tourName} @ ${v.hora}`).join('; ') || 'ninguna';
    const proximos   = vouchers
      .filter(v => v.fecha >= hoy && v.estado !== 'Cancelado')
      .slice(0, 5)
      .map(v => `${v.fecha} · ${v.titular} · ${v.tourName} · ${v.estado}`)
      .join('\n');
    return `\n\n[CONTEXTO VOUCHERS]\nTotal: ${total} | Pendientes: ${pendientes}\nHoy (${hoy}): ${hoyList}\nPróximos:\n${proximos}`;
  }, [vouchers]);

  const send = useCallback(async (text: string, isAuto = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: AgentMsg = { role: 'user', content: trimmed };
    const history = isAuto ? [] : [...msgs, userMsg];

    if (!isAuto) {
      setMsgs(prev => [...prev, userMsg]);
      setInput('');
    }
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed + buildContext(),
          mode: 'admin',
          conversation_id: convId,
          history,
        }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: 'assistant', content: data.reply || '...' }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: '⚠️ Error al contactar al agente.' }]);
    } finally {
      setLoading(false);
    }
  }, [msgs, loading, convId, buildContext]);

  return (
    <div className="bg-gradient-to-br from-orange-950/60 via-gray-900 to-gray-900 rounded-2xl border border-orange-800/40 overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Bot size={15} className="text-orange-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Asistente de Operaciones</p>
            <p className="text-[10px] text-gray-500">Claude · Modo admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {msgs.length > 0 && (
            <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
              {msgs.length} msgs
            </span>
          )}
          {open ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-orange-900/30">
          {/* Quick prompts */}
          {msgs.length === 0 && (
            <div className="px-3 pt-3 pb-2 flex gap-2 flex-wrap">
              {AGENT_PROMPTS.map(p => (
                <button
                  key={p.label}
                  onClick={() => send(p.prompt, false)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-orange-900/30 border border-orange-800/40 text-orange-300 hover:bg-orange-800/40 transition-colors disabled:opacity-50"
                >
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {msgs.length > 0 && (
            <div className="px-3 pt-3 max-h-48 overflow-y-auto space-y-2.5">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-200 border border-gray-700'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl flex items-center gap-2">
                    <Loader2 size={11} className="text-orange-400 animate-spin" />
                    <span className="text-[10px] text-gray-500">Analizando reservas…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Pregunta sobre las reservas…"
              disabled={loading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-600 disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-500 flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Voucher Card ─────────────────────────────────────────────────────────────

function VoucherCard({ voucher, onSelect, onUpdateEstado }: {
  voucher: VoucherRecord;
  onSelect: (v: VoucherRecord) => void;
  onUpdateEstado: (id: string, estado: string) => void;
}) {
  const cfg = ESTADO_CFG[voucher.estado] ?? ESTADO_CFG['Pendiente'];

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
      onClick={() => onSelect(voucher)}
    >
      {/* Header naranja */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 relative">
        <p className="text-[9px] font-bold uppercase tracking-widest text-orange-100 mb-1">
          Experiencia Reservada
        </p>
        <h3 className="font-bold text-base text-white uppercase leading-tight pr-20 truncate">
          {voucher.tourName || 'Servicio turístico'}
        </h3>
        {voucher.reservaNum && (
          <p className="text-[10px] text-orange-200 mt-0.5 font-mono"># {voucher.reservaNum}</p>
        )}
        <span className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase ${cfg.bg} ${cfg.text} border border-white/20`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Titular */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Titular de Reserva</p>
        <p className="text-sm font-bold text-gray-900 uppercase truncate">{voucher.titular || '—'}</p>
      </div>

      {/* Grid datos */}
      <div className="grid grid-cols-2 gap-2 px-4 py-2">
        <div className="border border-gray-200 rounded-xl p-2">
          <p className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">ID Reserva</p>
          <p className="text-xs font-bold text-orange-500">{voucher.reservaNum || '—'}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-2">
          <p className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">Pax</p>
          <p className="text-xs font-bold text-gray-800">{voucher.pax || '—'}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-2">
          <p className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">Fecha</p>
          <p className="text-xs font-bold text-gray-800">{fmtFecha(voucher.fecha) || '—'}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-2">
          <p className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">Hora de Encuentro</p>
          <p className="text-xs font-bold text-teal-600">{voucher.hora || '—'}</p>
        </div>
      </div>

      {/* Punto encuentro */}
      {voucher.puntoEncuentro && (
        <div className="mx-4 mb-3 border-l-4 border-orange-500 pl-3 py-2 bg-orange-50 rounded-r-xl">
          <p className="text-[8px] text-orange-600 uppercase font-bold mb-0.5">◆ Punto de Encuentro</p>
          <p className="text-[11px] font-bold text-orange-800 uppercase leading-tight">{voucher.puntoEncuentro}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span>+57 315 383 6043</span>
          <span>guiasanandresislas.com</span>
        </div>
        <select
          value={voucher.estado}
          onChange={e => { e.stopPropagation(); onUpdateEstado(voucher.id, e.target.value); }}
          className="text-[10px] bg-gray-100 border border-gray-200 rounded-lg px-1.5 py-1 text-gray-600 focus:outline-none focus:border-orange-500"
          onClick={e => e.stopPropagation()}
        >
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Modal detalle ─────────────────────────────────────────────────────────────

function VoucherModal({ voucher, onClose, onUpdateEstado }: {
  voucher: VoucherRecord;
  onClose: () => void;
  onUpdateEstado: (id: string, estado: string) => void;
}) {
  const [showEstados, setShowEstados] = useState(false);
  const cfg = ESTADO_CFG[voucher.estado] ?? ESTADO_CFG['Pendiente'];

  const mapsUrl = voucher.puntoEncuentro
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(voucher.puntoEncuentro + ', San Andrés, Colombia')}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header naranja ── */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-6 relative">
          {/* X cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <X size={13} className="text-white" />
          </button>
          {/* Badge estado activo — top right, debajo del X */}
          <button
            onClick={() => setShowEstados(v => !v)}
            className={`absolute top-12 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border border-white/30 transition-all ${cfg.bg} ${cfg.text}`}
          >
            {cfg.icon} {cfg.label} ▾
          </button>
          <p className="text-[9px] uppercase tracking-widest text-orange-100 font-bold mb-1">
            Experiencia Reservada
          </p>
          <h2 className="text-xl font-black text-white uppercase leading-tight pr-24">
            {voucher.tourName || 'Servicio turístico'}
          </h2>
          {voucher.reservaNum && (
            <p className="text-[11px] text-orange-200 mt-1 font-mono"># {voucher.reservaNum}</p>
          )}
          {/* Dropdown de cambio de estado */}
          {showEstados && (
            <div className="mt-3 flex gap-1.5 flex-wrap">
              {ESTADOS.filter(s => s !== voucher.estado).map(s => {
                const c = ESTADO_CFG[s];
                return (
                  <button
                    key={s}
                    onClick={() => { onUpdateEstado(voucher.id, s); onClose(); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border bg-black/20 text-white/70 border-white/10 hover:bg-black/40 hover:text-white transition-all"
                  >
                    {c.icon} {c.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Titular */}
          <div>
            <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest mb-1">
              Titular de Reserva
            </p>
            <p className="text-lg font-black text-gray-900 uppercase leading-tight">
              {voucher.titular || '—'}
            </p>
          </div>

          {/* Grid 2×2 */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'ID Reserva',       value: voucher.reservaNum,      cls: 'text-orange-500 text-base' },
              { label: 'Pax',              value: voucher.pax,             cls: 'text-gray-900 text-base' },
              { label: 'Fecha',            value: fmtFecha(voucher.fecha), cls: 'text-gray-900 text-sm' },
              { label: 'Hora de Encuentro', value: voucher.hora,           cls: 'text-teal-600 text-base font-black' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="border border-gray-200 rounded-2xl p-3">
                <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest mb-1">{label}</p>
                <p className={`font-bold leading-tight ${cls}`}>{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Punto de encuentro */}
          {voucher.puntoEncuentro && (
            <div className="border-l-4 border-orange-500 pl-3 py-2.5 bg-orange-50 rounded-r-2xl">
              <p className="text-[9px] uppercase text-orange-500 font-bold tracking-widest mb-1">◆ Punto de Encuentro</p>
              <p className="text-sm font-black text-orange-800 uppercase leading-snug">{voucher.puntoEncuentro}</p>
            </div>
          )}

          {/* Notas / observaciones */}
          {voucher.observaciones && (
            <div className="border-l-4 border-amber-400 pl-3 py-2 bg-amber-50 rounded-r-2xl">
              <p className="text-[9px] uppercase text-amber-600 font-bold tracking-widest mb-1">⚠ Nota</p>
              <p className="text-xs text-amber-800 leading-relaxed">{voucher.observaciones}</p>
            </div>
          )}

          {/* CTA: Cómo llegar */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #2FA9B8 0%, #1d8a97 100%)' }}
            >
              <MapPin size={16} />
              CÓMO LLEGAR AL PUNTO
            </a>
          )}

          {/* CTA: Compartir enlace del voucher */}
          <button
            onClick={() => {
              const url = `https://www.guanago.travel/voucher/${voucher.id}`;
              navigator.clipboard.writeText(url).then(() => alert('¡Enlace copiado! Compártelo con el cliente.')).catch(() => {
                window.open(url, '_blank');
              });
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors mt-2"
          >
            <ChevronRight size={15} />
            COMPARTIR ENLACE DEL VOUCHER
          </button>

        </div>

        {/* Footer GuíaSAI */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Phone size={11} />
            <span>+57 315 383 6043</span>
          </div>
          <span className="text-[11px] text-gray-400">guiasanandresislas.com</span>
          <span className="text-[10px] text-gray-400 font-bold">RNT: 48674</span>
        </div>
      </div>
    </div>
  );
}

// ─── Formulario nuevo voucher ─────────────────────────────────────────────────

function NuevoVoucherModal({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: (v: VoucherRecord) => void;
}) {
  const [form, setForm]     = useState<VoucherFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof VoucherFormData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.titular || !form.fecha || !form.tourName) {
      setError('Completa: Titular, Tour y Fecha');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/reservations/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onSaved(data.data);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-orange-400" />
            <h2 className="font-bold text-white">Nuevo Voucher</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
            <X size={13} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Campos */}
          {([
            { key: 'titular',    label: 'Titular *',  type: 'text',  placeholder: 'Nombre del cliente' },
            { key: 'tourName',   label: 'Tour / Servicio *', type: 'text', placeholder: 'Nombre del tour' },
            { key: 'fecha',      label: 'Fecha *',    type: 'date',  placeholder: '' },
            { key: 'hora',       label: 'Hora',       type: 'time',  placeholder: '' },
            { key: 'pax',        label: 'Pax',        type: 'text',  placeholder: 'Ej: 4' },
            { key: 'telefono',   label: 'Teléfono',   type: 'tel',   placeholder: '+57 ...' },
            { key: 'email',      label: 'Email',      type: 'email', placeholder: '' },
            { key: 'observaciones', label: 'Observaciones', type: 'text', placeholder: 'Notas especiales…' },
          ] as { key: keyof VoucherFormData; label: string; type: string; placeholder: string }[]).map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
              />
            </div>
          ))}

          {/* Punto de encuentro */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Punto de Encuentro</label>
            <select
              value={form.puntoEncuentro}
              onChange={e => set('puntoEncuentro', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
            >
              <option value="">Seleccionar…</option>
              {PUNTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Estado</label>
            <div className="flex gap-2 flex-wrap">
              {ESTADOS.map(s => {
                const c = ESTADO_CFG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('estado', s)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                      form.estado === s
                        ? `${c.bg} ${c.text} border-current/30`
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 border border-gray-700 hover:border-gray-600">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Guardando…' : 'Crear Voucher'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminVouchers: React.FC<AdminVouchersProps> = ({ onBack, onNavigate }) => {
  const [vouchers, setVouchers]           = useState<VoucherRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterEstado, setFilterEstado]   = useState<string>('Todos');
  const [sortFecha, setSortFecha]         = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected]           = useState<VoucherRecord | null>(null);
  const [showForm, setShowForm]           = useState(false);
  const [updatingId, setUpdatingId]       = useState<string | null>(null);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/reservations/vouchers`);
      const data = await res.json();
      setVouchers(data.data || []);
    } catch {
      // fallback silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVouchers(); }, [loadVouchers]);

  const handleUpdateEstado = async (id: string, estado: string) => {
    setUpdatingId(id);
    try {
      const res  = await fetch(`${API}/api/reservations/vouchers/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (res.ok) {
        setVouchers(prev => prev.map(v => v.id === id ? data.data : v));
        if (selected?.id === id) setSelected(data.data);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVoucherSaved = (newV: VoucherRecord) => {
    setVouchers(prev => [newV, ...prev]);
    setShowForm(false);
  };

  // Filtros + orden por fecha
  const filtered = vouchers
    .filter(v => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        v.titular.toLowerCase().includes(q) ||
        v.tourName.toLowerCase().includes(q) ||
        v.reservaNum.toLowerCase().includes(q) ||
        v.puntoEncuentro.toLowerCase().includes(q);
      const matchEstado = filterEstado === 'Todos' || v.estado === filterEstado;
      return matchSearch && matchEstado;
    })
    .sort((a, b) => {
      const da = a.fecha || '';
      const db = b.fecha || '';
      return sortFecha === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });

  // Stats
  const stats = {
    total:      vouchers.length,
    pendientes: vouchers.filter(v => v.estado === 'Pendiente').length,
    confirmados:vouchers.filter(v => v.estado === 'Reserva Confirmada').length,
    hoy: (() => {
      const hoy = new Date().toISOString().slice(0, 10);
      return vouchers.filter(v => v.fecha === hoy).length;
    })(),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm">Vouchers & Reservas</h1>
          <p className="text-[10px] text-gray-500">
            {loading ? 'Cargando…' : `${filtered.length} de ${vouchers.length} vouchers`}
          </p>
        </div>
        <button
          onClick={loadVouchers}
          disabled={loading}
          className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold transition-colors"
        >
          <Plus size={13} /> Nuevo
        </button>
      </header>

      <div className="px-4 py-4 space-y-4 pb-10">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total',       value: stats.total,       color: 'text-white' },
            { label: 'Pendientes',  value: stats.pendientes,  color: 'text-yellow-400' },
            { label: 'Confirmados', value: stats.confirmados, color: 'text-green-400' },
            { label: 'Hoy',         value: stats.hoy,         color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-gray-600 uppercase font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Agente IA */}
        <AgenteVouchers vouchers={vouchers} />

        {/* Búsqueda y filtros */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente, tour, reserva…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Todos', ...ESTADOS].map(s => {
              const cfg = s === 'Todos' ? null : ESTADO_CFG[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilterEstado(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
                    filterEstado === s
                      ? s === 'Todos'
                        ? 'bg-orange-600 text-white'
                        : `${cfg!.bg} ${cfg!.text} border border-current/20`
                      : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {s}
                </button>
              );
            })}
            <button
              onClick={() => setSortFecha(s => s === 'desc' ? 'asc' : 'desc')}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-gray-800 border border-orange-700 text-orange-400 hover:bg-orange-900/30 transition-colors"
            >
              <Calendar size={10} />
              {sortFecha === 'desc' ? 'Fecha ↓' : 'Fecha ↑'}
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-600">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando vouchers…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🎫</div>
            <p className="text-gray-600 text-sm">
              {search || filterEstado !== 'Todos' ? 'Sin resultados para este filtro' : 'No hay vouchers aún'}
            </p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-orange-400 text-sm font-bold hover:text-orange-300">
              Crear el primero →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(v => (
              <VoucherCard
                key={v.id}
                voucher={v}
                onSelect={setSelected}
                onUpdateEstado={handleUpdateEstado}
              />
            ))}
          </div>
        )}

        {/* Navegar a cotizaciones */}
        <button
          onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-emerald-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-emerald-400" />
            <div className="text-left">
              <p className="text-sm font-bold">Ir a Cotizaciones</p>
              <p className="text-[10px] text-gray-600">Crear y gestionar cotizaciones B2B</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-600" />
        </button>

      </div>

      {/* Modales */}
      {selected && (
        <VoucherModal
          voucher={selected}
          onClose={() => setSelected(null)}
          onUpdateEstado={handleUpdateEstado}
        />
      )}
      {showForm && (
        <NuevoVoucherModal
          onClose={() => setShowForm(false)}
          onSaved={handleVoucherSaved}
        />
      )}
    </div>
  );
};

export default AdminVouchers;
