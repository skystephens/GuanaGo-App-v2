/**
 * AdminVouchers — Panel unificado de Vouchers & Reservas
 * GuanaGO Super Admin · Abril 2026
 *
 * Datos: Airtable "Generador_vouchers" (base appij4vUx7GZEwf5x) via backend
 * IA:    Claude agent en modo admin para asistencia operativa
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  ArrowLeft, Search, Plus, Loader2, Bot, Send, ChevronDown, ChevronUp, ChevronLeft,
  Sparkles, CheckCircle2, Clock, XCircle, RefreshCw, MapPin, Users,
  Calendar, Phone, Mail, Eye, X, ChevronRight, FileText, Pencil, Copy,
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
  tourId: string;
  ultimaModificacion: string;
}

interface VoucherFormData {
  titular: string;
  reservaNum: string;
  telefono: string;
  email: string;
  pax: string;
  fecha: string;
  hora: string;
  puntoEncuentro: string;
  observaciones: string;
  tourName: string;
  tourId: string;
  estado: string;
}

interface Servicio {
  id: string;
  nombre: string;
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
  titular: '', reservaNum: '', telefono: '', email: '', pax: '',
  fecha: '', hora: '', puntoEncuentro: '', observaciones: '',
  tourName: '', tourId: '', estado: 'Pendiente',
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


// ─────────────────────────────────────────────────────────────────────────────
// VoucherCalendar — vista calendario (semana / mes / trimestre)
// ─────────────────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** Normaliza la fecha del voucher a YYYY-MM-DD.
 *  Airtable (Generador_vouchers) guarda 'Fecha de Inicio' como MM/DD/YYYY;
 *  el formulario HTML usa YYYY-MM-DD. Acepta ambos + fallback Date(). */
function normFecha(raw: string): string {
  if (!raw) return '';
  const s = String(raw).trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : ymdLocal(d);
}
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); // lunes = inicio
  r.setHours(0, 0, 0, 0);
  return r;
}

function VoucherCalendar({ vouchers, onSelect }: {
  vouchers: VoucherRecord[];
  onSelect: (v: VoucherRecord) => void;
}) {
  const [vista, setVista] = useState<'semana' | 'mes' | 'trimestre'>('mes');
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const hoyStr = ymdLocal(new Date());

  // Mapa fecha → vouchers (ordenados por hora)
  const porFecha = useMemo(() => {
    const map: Record<string, VoucherRecord[]> = {};
    vouchers.forEach(v => {
      const f = normFecha(v.fecha);
      if (!f) return;
      (map[f] = map[f] || []).push(v);
    });
    Object.values(map).forEach(l => l.sort((a, b) => (a.hora || '').localeCompare(b.hora || '')));
    return map;
  }, [vouchers]);

  const navegar = (dir: -1 | 1) => {
    const d = new Date(cursor);
    if (vista === 'semana') d.setDate(d.getDate() + dir * 7);
    else if (vista === 'mes') d.setMonth(d.getMonth() + dir, 1);
    else d.setMonth(d.getMonth() + dir * 3, 1);
    setCursor(d);
  };

  const titulo = (() => {
    if (vista === 'semana') {
      const ini = startOfWeek(cursor);
      const fin = new Date(ini); fin.setDate(fin.getDate() + 6);
      return `${ini.getDate()} ${MESES[ini.getMonth()].slice(0, 3)} – ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)} ${fin.getFullYear()}`;
    }
    if (vista === 'mes') return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const m2 = new Date(cursor); m2.setMonth(m2.getMonth() + 2);
    return `${MESES[cursor.getMonth()].slice(0, 3)} – ${MESES[m2.getMonth()].slice(0, 3)} ${m2.getFullYear()}`;
  })();

  const Chip = ({ v, conHora }: { v: VoucherRecord; conHora?: boolean }) => {
    const cfg = ESTADO_CFG[v.estado] ?? ESTADO_CFG['Pendiente'];
    return (
      <button
        onClick={() => onSelect(v)}
        title={`#${v.reservaNum} · ${v.titular} · ${v.tourName}${v.hora ? ' · ' + v.hora : ''} · ${v.estado}`}
        className={`w-full text-left px-1.5 py-0.5 rounded-md text-[9px] font-bold truncate ${cfg.bg} ${cfg.text} hover:brightness-125 transition-all`}
      >
        {conHora && v.hora ? `${v.hora} · ` : ''}#{v.reservaNum} {v.titular}
      </button>
    );
  };

  // 42 celdas (6 semanas) desde el lunes anterior al día 1; recorta la fila final si sobra
  const celdasMes = (base: Date): Date[] => {
    const ini = startOfWeek(new Date(base.getFullYear(), base.getMonth(), 1));
    const celdas = Array.from({ length: 42 }, (_, i) => { const d = new Date(ini); d.setDate(d.getDate() + i); return d; });
    return celdas.slice(35).every(d => d.getMonth() !== base.getMonth()) ? celdas.slice(0, 35) : celdas;
  };

  const CeldaDia = ({ d, mesRef }: { d: Date; mesRef: number }) => {
    const key = ymdLocal(d);
    const lista = porFecha[key] || [];
    const esHoy = key === hoyStr;
    const otroMes = d.getMonth() !== mesRef;
    return (
      <div className={`min-h-[72px] border border-gray-800 rounded-lg p-1 flex flex-col gap-0.5 ${otroMes ? 'opacity-30' : ''} ${esHoy ? 'ring-1 ring-orange-500 bg-orange-950/20' : 'bg-gray-900'}`}>
        <span className={`text-[9px] font-bold ${esHoy ? 'text-orange-400' : 'text-gray-500'}`}>{d.getDate()}</span>
        {lista.slice(0, 3).map(v => <Chip key={v.id} v={v} />)}
        {lista.length > 3 && (
          <span className="text-[8px] text-gray-500 font-bold px-1">+{lista.length - 3} más</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-3 space-y-3">
      {/* Barra de control */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={() => navegar(-1)} className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setCursor(d); }}
            className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300"
          >
            Hoy
          </button>
          <button onClick={() => navegar(1)} className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ChevronRight size={13} />
          </button>
          <span className="text-xs font-bold text-white ml-2 capitalize">{titulo}</span>
        </div>
        <div className="flex gap-1">
          {(['semana', 'mes', 'trimestre'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                vista === v ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Vista SEMANA */}
      {vista === 'semana' && (() => {
        const ini = startOfWeek(cursor);
        const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(ini); d.setDate(d.getDate() + i); return d; });
        return (
          <div className="grid grid-cols-7 gap-1">
            {dias.map((d, i) => {
              const key = ymdLocal(d);
              const lista = porFecha[key] || [];
              const esHoy = key === hoyStr;
              return (
                <div key={key} className={`min-h-[120px] border border-gray-800 rounded-lg p-1 flex flex-col gap-0.5 ${esHoy ? 'ring-1 ring-orange-500 bg-orange-950/20' : 'bg-gray-900'}`}>
                  <span className={`text-[9px] font-bold text-center pb-0.5 ${esHoy ? 'text-orange-400' : 'text-gray-500'}`}>
                    {DIAS_SEMANA[i]} {d.getDate()}
                  </span>
                  {lista.map(v => <Chip key={v.id} v={v} conHora />)}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Vista MES */}
      {vista === 'mes' && (
        <div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map(d => (
              <span key={d} className="text-[9px] font-bold text-gray-600 text-center uppercase">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celdasMes(cursor).map(d => <CeldaDia key={ymdLocal(d)} d={d} mesRef={cursor.getMonth()} />)}
          </div>
        </div>
      )}

      {/* Vista TRIMESTRE */}
      {vista === 'trimestre' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map(offset => {
            const base = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
            return (
              <div key={offset}>
                <p className="text-[10px] font-bold text-gray-400 text-center mb-1 capitalize">
                  {MESES[base.getMonth()]} {base.getFullYear()}
                </p>
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {DIAS_SEMANA.map(d => (
                    <span key={d} className="text-[7px] font-bold text-gray-600 text-center">{d[0]}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {celdasMes(base).map(d => {
                    const key = ymdLocal(d);
                    const n = (porFecha[key] || []).length;
                    const esHoy = key === hoyStr;
                    const otroMes = d.getMonth() !== base.getMonth();
                    return (
                      <button
                        key={key}
                        onClick={() => { if (n > 0) { setCursor(new Date(d)); setVista('semana'); } }}
                        title={n > 0 ? `${n} reserva${n > 1 ? 's' : ''} — clic para ver la semana` : undefined}
                        className={`aspect-square rounded flex flex-col items-center justify-center text-[8px] font-bold transition-colors ${
                          otroMes ? 'opacity-20 text-gray-600' :
                          n > 0 ? 'bg-orange-600/80 text-white hover:bg-orange-500 cursor-pointer' :
                          esHoy ? 'ring-1 ring-orange-500 text-orange-400' : 'bg-gray-900 text-gray-500'
                        }`}
                      >
                        {d.getDate()}
                        {n > 0 && <span className="text-[6px] leading-none">{n}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VoucherCard({ voucher, onSelect, onUpdateEstado, onEdit, onDuplicate }: {
  voucher: VoucherRecord;
  onSelect: (v: VoucherRecord) => void;
  onUpdateEstado: (id: string, estado: string) => void;
  onEdit: (v: VoucherRecord) => void;
  onDuplicate: (v: VoucherRecord) => void;
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

      {/* Teléfono (solo admin — no aparece en VoucherModal) */}
      {voucher.telefono && (
        <div className="px-4 pb-1 flex items-center gap-1.5">
          <Phone size={11} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500 font-medium truncate">{voucher.telefono}</p>
        </div>
      )}

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
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between gap-2">
        <button
          onClick={e => {
            e.stopPropagation();
            const url = `https://app.guiasanandresislas.com/voucher/${voucher.id}`;
            navigator.clipboard.writeText(url)
              .then(() => alert('¡Enlace copiado! Compártelo con el cliente.'))
              .catch(() => window.open(url, '_blank'));
          }}
          className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-700 transition-colors shrink-0"
          title="Copiar enlace del voucher"
        >
          <ChevronRight size={12} /> Compartir enlace
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); onDuplicate(voucher); }}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors"
            title="Duplicar voucher"
          >
            <Copy size={12} className="text-gray-500 hover:text-blue-600" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit(voucher); }}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 flex items-center justify-center transition-colors"
            title="Editar voucher"
          >
            <Pencil size={12} className="text-gray-500 hover:text-orange-600" />
          </button>
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
  const [form, setForm]         = useState<VoucherFormData>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingServ, setLoadingServ] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/reservations/vouchers/civitatis-servicios`)
      .then(r => r.json())
      .then(d => { if (d.success) setServicios(d.data || []); })
      .catch(() => {})
      .finally(() => setLoadingServ(false));
  }, []);

  const set = (k: keyof VoucherFormData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleTourChange = (id: string) => {
    const s = servicios.find(x => x.id === id);
    setForm(f => ({ ...f, tourId: id, tourName: s?.nombre || '' }));
  };

  const handleSave = async () => {
    if (!form.titular || !form.reservaNum || !form.fecha || !form.tourName) {
      setError('Completa: Titular, Reserva #, Tour y Fecha');
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

          {/* Titular */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Titular *</label>
            <input
              type="text"
              value={form.titular}
              onChange={e => set('titular', e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
            />
          </div>

          {/* Reserva # */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Reserva # *</label>
            <input
              type="text"
              value={form.reservaNum}
              onChange={e => set('reservaNum', e.target.value)}
              placeholder="Ej: CIV-2026-00123"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
            />
          </div>

          {/* Tour / Servicio — dropdown de Airtable */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Tour / Servicio *</label>
            {loadingServ ? (
              <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                <Loader2 size={13} className="animate-spin text-orange-400" /> Cargando servicios…
              </div>
            ) : (
              <select
                value={form.tourId}
                onChange={e => handleTourChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              >
                <option value="">— Selecciona un tour —</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha / Hora / Pax */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Fecha *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => set('fecha', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Hora</label>
              <input
                type="time"
                value={form.hora}
                onChange={e => set('hora', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Pax</label>
              <input
                type="number"
                min="1"
                value={form.pax}
                onChange={e => set('pax', e.target.value)}
                placeholder="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>

          {/* Teléfono / Email */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => set('telefono', e.target.value)}
                placeholder="+57 …"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>

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

          {/* Observaciones */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
              rows={3}
              placeholder="Necesidades especiales, alergias, solicitudes del cliente…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-orange-600"
            />
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

// ─── Formulario editar voucher ────────────────────────────────────────────────

function EditarVoucherModal({ voucher, onClose, onSaved }: {
  voucher: VoucherRecord;
  onClose: () => void;
  onSaved: (v: VoucherRecord) => void;
}) {
  const [form, setForm] = useState<VoucherFormData>({
    titular:        voucher.titular        || '',
    reservaNum:     voucher.reservaNum     || '',
    telefono:       voucher.telefono       || '',
    email:          voucher.email          || '',
    pax:            voucher.pax            || '',
    fecha:          voucher.fecha          || '',
    hora:           voucher.hora           || '',
    puntoEncuentro: voucher.puntoEncuentro || '',
    observaciones:  voucher.observaciones  || '',
    tourName:       voucher.tourName       || '',
    tourId:         voucher.tourId         || '',
    estado:         voucher.estado         || 'Pendiente',
  });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [servicios, setServicios]   = useState<Servicio[]>([]);
  const [loadingServ, setLoadingServ] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/reservations/vouchers/civitatis-servicios`)
      .then(r => r.json())
      .then(d => { if (d.success) setServicios(d.data || []); })
      .catch(() => {})
      .finally(() => setLoadingServ(false));
  }, []);

  const set = (k: keyof VoucherFormData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleTourChange = (id: string) => {
    const s = servicios.find(x => x.id === id);
    setForm(f => ({ ...f, tourId: id, tourName: s?.nombre || '' }));
  };

  const handleSave = async () => {
    if (!form.titular || !form.reservaNum || !form.fecha || !form.tourName) {
      setError('Completa: Titular, Reserva #, Tour y Fecha');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/reservations/vouchers/${voucher.id}`, {
        method: 'PATCH',
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
            <Pencil size={16} className="text-orange-400" />
            <h2 className="font-bold text-white">Editar Voucher</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
            <X size={13} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">

          {/* Titular */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Titular *</label>
            <input
              type="text"
              value={form.titular}
              onChange={e => set('titular', e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
            />
          </div>

          {/* Reserva # */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Reserva # *</label>
            <input
              type="text"
              value={form.reservaNum}
              onChange={e => set('reservaNum', e.target.value)}
              placeholder="Ej: CIV-2026-00123"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
            />
          </div>

          {/* Tour / Servicio */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Tour / Servicio *</label>
            {loadingServ ? (
              <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                <Loader2 size={13} className="animate-spin text-orange-400" /> Cargando servicios…
              </div>
            ) : (
              <select
                value={form.tourId}
                onChange={e => handleTourChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              >
                <option value="">— Selecciona un tour —</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            )}
            {/* Si el tour actual no está en el dropdown, lo mostramos como referencia */}
            {!loadingServ && form.tourId === '' && form.tourName && (
              <p className="mt-1 text-[10px] text-gray-500">Tour actual: <span className="text-orange-400">{form.tourName}</span></p>
            )}
          </div>

          {/* Fecha / Hora / Pax */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Fecha *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => set('fecha', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Hora</label>
              <input
                type="time"
                value={form.hora}
                onChange={e => set('hora', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Pax</label>
              <input
                type="number"
                min="1"
                value={form.pax}
                onChange={e => set('pax', e.target.value)}
                placeholder="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>

          {/* Teléfono / Email */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => set('telefono', e.target.value)}
                placeholder="+57 …"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>

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

          {/* Observaciones */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
              rows={3}
              placeholder="Necesidades especiales, alergias, solicitudes del cliente…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-orange-600"
            />
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
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
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
  const [editingVoucher, setEditingVoucher] = useState<VoucherRecord | null>(null);
  const [updatingId, setUpdatingId]       = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

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

  const handleVoucherUpdated = (updated: VoucherRecord) => {
    setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v));
    setEditingVoucher(null);
  };

  const handleDuplicate = async (original: VoucherRecord) => {
    setDuplicatingId(original.id);
    try {
      const body: VoucherFormData = {
        titular:        original.titular,
        reservaNum:     `COPIA-${original.reservaNum}`,
        telefono:       original.telefono        || '',
        email:          original.email           || '',
        pax:            original.pax             || '',
        fecha:          original.fecha           || '',
        hora:           original.hora            || '',
        puntoEncuentro: original.puntoEncuentro  || '',
        observaciones:  original.observaciones   || '',
        tourName:       original.tourName        || '',
        tourId:         original.tourId          || '',
        estado:         'Pendiente',
      };
      const res = await fetch(`${API}/api/reservations/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setVouchers(prev => [data.data, ...prev]);
      }
    } catch {
      // silencioso
    } finally {
      setDuplicatingId(null);
    }
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
      const hoy = ymdLocal(new Date());
      return vouchers.filter(v => normFecha(v.fecha) === hoy).length;
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

        {/* Calendario de reservas */}
        <VoucherCalendar vouchers={filtered} onSelect={setSelected} />

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
                onEdit={setEditingVoucher}
                onDuplicate={handleDuplicate}
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
      {editingVoucher && (
        <EditarVoucherModal
          voucher={editingVoucher}
          onClose={() => setEditingVoucher(null)}
          onSaved={handleVoucherUpdated}
        />
      )}
    </div>
  );
};

export default AdminVouchers;
