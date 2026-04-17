import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  TrendingUp, Users, DollarSign, Activity, Calendar,
  Package as PackageIcon, ChevronRight, Server, Music,
  Palette, Handshake, ClipboardList, Clock, FileText,
  TowerControl, LayoutGrid, Brain, Route, Map, BarChart3,
  Bot, Send, Sparkles, Loader2, ChevronDown, ChevronUp,
  X, CheckCircle2, AlertCircle, Receipt, Ticket,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { api } from '../../services/api';
import type { Reservation } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
}

interface BriefingMsg {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Torre data desde localStorage ───────────────────────────────────────────

const TORRE_KEY = 'guanago_torre_v3';

function loadTorreContext() {
  try {
    const raw = localStorage.getItem(TORRE_KEY);
    if (!raw) return null;
    const secciones: any[] = JSON.parse(raw);
    const allTareas = secciones.flatMap((s: any) => s.tareas || []);
    const total = allTareas.length;
    const completadas = allTareas.filter((t: any) => t.estado === 'completado').length;
    const criticas = allTareas.filter((t: any) => t.prioridad === 'critica' && t.estado !== 'completado').length;
    const bloqueadas = allTareas.filter((t: any) => t.estado === 'bloqueado').length;
    const tareasUrgentes = allTareas
      .filter((t: any) => t.prioridad === 'critica' && t.estado !== 'completado')
      .slice(0, 5)
      .map((t: any) => ({ titulo: t.titulo, estado: t.estado, prioridad: t.prioridad }));
    return {
      stats: { total, completadas, criticas, bloqueadas, proyectos: secciones.length },
      tareasUrgentes,
    };
  } catch { return null; }
}

// ─── Quick actions para el agente ────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: '¿Qué priorizo hoy?', icon: '🎯', prompt: '¿Cuáles son las 3 tareas más críticas en las que debo enfocarme hoy? Sé muy directo y conciso.' },
  { label: 'Bloqueos', icon: '🚧', prompt: 'Identifica los principales bloqueos del proyecto. ¿Qué está frenando el avance?' },
  { label: 'Resumen ANATO', icon: '✈️', prompt: '¿Cómo estamos de cara a ANATO? ¿Qué falta para tener un demo funcional?' },
  { label: 'Ideas 30 días', icon: '💡', prompt: 'Dame 3 ideas concretas para generar ingresos en los próximos 30 días con lo que ya tenemos.' },
];

// ─── Componente: Agente Briefing ──────────────────────────────────────────────

function AgenteBriefing({ onNavigate }: { onNavigate: (r: AppRoute) => void }) {
  const [mensajes, setMensajes] = useState<BriefingMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [convId] = useState(() => `brief-${Date.now()}`);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, loading]);

  const sendMessage = useCallback(async (text: string, isAuto = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: BriefingMsg = { role: 'user', content: trimmed };
    const history = isAuto ? [] : [...mensajes, userMsg];

    if (!isAuto) {
      setMensajes(prev => [...prev, userMsg]);
      setInput('');
    }
    setLoading(true);

    try {
      const context = loadTorreContext() || {};
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          mode: 'admin',
          history: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
          conversationId: convId,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setMensajes(prev => [...prev, { role: 'assistant', content: data.response || '' }]);
    } catch {
      setMensajes(prev => [...prev, {
        role: 'assistant',
        content: 'No pude conectar con el agente. Verifica que el servidor esté activo.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, mensajes, convId]);

  // Auto-briefing al entrar al dashboard (solo una vez)
  useEffect(() => {
    if (autoLoaded) return;
    setAutoLoaded(true);
    const torre = loadTorreContext();
    const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const prompt = torre
      ? `Es ${fecha}. Dame el briefing ejecutivo del proyecto en máximo 4 líneas: estado general, tarea más urgente y un riesgo a vigilar.`
      : `Es ${fecha}. Dame una bienvenida rápida y pregunta en qué área de GuanaGO trabajamos hoy.`;
    sendMessage(prompt, true);
  }, []);

  return (
    <div className="bg-gradient-to-br from-violet-950/60 via-indigo-950/60 to-violet-950/60 rounded-2xl border border-violet-700/50 overflow-hidden">
      {/* Header del agente */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-violet-200">GuanaIA — Agente Admin</span>
            <span className="text-[10px] text-violet-500 ml-2">Claude Sonnet</span>
          </div>
          {loading && <Loader2 size={12} className="text-violet-400 animate-spin ml-1" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onNavigate(AppRoute.ADMIN_TORRE_CONTROL); }}
            className="text-[10px] text-violet-400 hover:text-violet-200 px-2 py-0.5 rounded border border-violet-700 hover:border-violet-500 transition-colors"
          >
            Sesión completa
          </button>
          {expanded ? <ChevronUp size={14} className="text-violet-500" /> : <ChevronDown size={14} className="text-violet-500" />}
        </div>
      </button>

      {expanded && (
        <>
          {/* Mensajes */}
          <div className="px-4 pb-2 max-h-52 overflow-y-auto space-y-2.5">
            {mensajes.length === 0 && loading && (
              <div className="flex items-center gap-2 text-xs text-violet-400 py-2">
                <Loader2 size={13} className="animate-spin" />
                Preparando tu briefing del día...
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-5 h-5 bg-violet-700 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Bot size={11} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.role === 'assistant'
                    ? 'bg-violet-900/50 text-violet-100 rounded-tl-none'
                    : 'bg-indigo-700/60 text-indigo-100 rounded-tr-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && mensajes.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-violet-700 rounded-full flex-shrink-0 flex items-center justify-center">
                  <Bot size={11} className="text-white" />
                </div>
                <div className="px-3 py-2 bg-violet-900/50 rounded-xl rounded-tl-none">
                  <Loader2 size={12} className="text-violet-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          {mensajes.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.prompt)}
                  className="flex items-center gap-1 text-[10px] bg-violet-900/50 hover:bg-violet-800/60 border border-violet-700 hover:border-violet-500 text-violet-300 px-2.5 py-1 rounded-full transition-colors"
                >
                  <span>{q.icon}</span> {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Pregunta algo al agente..."
              className="flex-1 bg-violet-900/30 border border-violet-700 rounded-lg px-3 py-1.5 text-xs text-violet-100 placeholder-violet-600 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-7 h-7 bg-violet-700 hover:bg-violet-600 disabled:bg-violet-900/50 disabled:text-violet-700 rounded-lg flex items-center justify-center transition-colors"
            >
              <Send size={12} className="text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);

  // Cargar reservas recientes
  const loadRecent = useCallback(async () => {
    try {
      setLoadingRes(true);
      const list = await (api.reservations as any).listAll?.();
      const normalize = (raw: any): Reservation => ({
        id: raw.id || `res-${Date.now()}`,
        tourName: raw.tourName || raw.serviceName || raw.service?.name || 'Servicio',
        clientName: raw.clientName || raw.customerName || raw.customer?.name || 'Cliente',
        date: raw.date || raw.fecha || raw.createdAt || new Date().toISOString(),
        status: (raw.status || raw.estado || 'pending').toLowerCase(),
        people: raw.people || raw.pax || raw.quantity || 1,
        price: raw.price || raw.valor || raw.total || undefined,
        auditStatus: 'verified',
      });
      const normalized = Array.isArray(list) ? list.map(normalize) : [];
      setRecentReservations(normalized.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 3));
    } catch { setRecentReservations([]); }
    finally { setLoadingRes(false); }
  }, []);

  // Cargar aprobaciones pendientes
  const loadApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/accommodations/pending-count');
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data?.total ?? 0);
      }
    } catch { setPendingApprovals(null); }
  }, []);

  useEffect(() => {
    loadRecent();
    loadApprovals();
    const id = setInterval(loadRecent, 60000);
    return () => clearInterval(id);
  }, [loadRecent, loadApprovals]);

  // Leer tareas críticas de Torre (badge count)
  const torreData = loadTorreContext();
  const tareasCount = torreData?.stats.total ?? 0;
  const criticas = torreData?.stats.criticas ?? 0;

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
          <p className="text-gray-500 text-xs">GuanaGO · {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {criticas > 0 && (
            <div className="flex items-center gap-1 bg-red-900/50 border border-red-700 px-2 py-1 rounded-full">
              <AlertCircle size={11} className="text-red-400" />
              <span className="text-[10px] text-red-400 font-bold">{criticas} críticas</span>
            </div>
          )}
          <div className="bg-gray-800 p-2 rounded-full">
            <Activity size={18} className="text-green-500" />
          </div>
        </div>
      </header>

      <div className="px-6 space-y-5">

        {/* ══════════════════════════════════════════════
            AGENTE IA — Briefing automático al entrar
        ══════════════════════════════════════════════ */}
        <AgenteBriefing onNavigate={onNavigate} />

        {/* ══════════════════════════════════════════════
            STATS — Datos reales + Torre
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 p-3.5 rounded-xl border border-gray-700">
            <span className="text-gray-500 text-[10px] uppercase font-bold">Tareas Torre</span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold">{tareasCount || '—'}</span>
              {criticas > 0 && <span className="text-red-400 text-xs font-bold">{criticas} críticas</span>}
            </div>
          </div>
          <div className="bg-gray-800 p-3.5 rounded-xl border border-gray-700 relative">
            {pendingApprovals !== null && pendingApprovals > 0 && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
            <span className="text-gray-500 text-[10px] uppercase font-bold">Aprobaciones</span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold">{pendingApprovals ?? '—'}</span>
              {pendingApprovals !== null && pendingApprovals > 0 && (
                <span className="text-orange-400 text-xs font-bold">pendientes</span>
              )}
            </div>
          </div>
          <div className="bg-gray-800 p-3.5 rounded-xl border border-gray-700">
            <span className="text-gray-500 text-[10px] uppercase font-bold">Reservas</span>
            <div className="mt-1.5">
              <span className="text-xl font-bold">{recentReservations.length > 0 ? recentReservations.length : '—'}</span>
              <span className="text-gray-600 text-[10px] ml-1">recientes</span>
            </div>
          </div>
          <div className="bg-gray-800 p-3.5 rounded-xl border border-gray-700">
            <span className="text-gray-500 text-[10px] uppercase font-bold">Sistema</span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-500" />
              <span className="text-sm font-bold text-green-400">Online</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            RESERVAS RECIENTES
        ══════════════════════════════════════════════ */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              <h3 className="font-bold text-sm">Reservas Recientes</h3>
            </div>
            <button onClick={() => onNavigate(AppRoute.ADMIN_RESERVATIONS)} className="text-xs text-blue-400 hover:text-blue-300 font-bold">
              Ver todas →
            </button>
          </div>
          <div className="divide-y divide-gray-700/50">
            {loadingRes ? (
              <div className="p-4 flex items-center gap-2 text-xs text-gray-600">
                <Loader2 size={12} className="animate-spin" /> Cargando...
              </div>
            ) : recentReservations.length === 0 ? (
              <div className="p-4 text-xs text-gray-600">Sin reservas recientes</div>
            ) : recentReservations.map(res => (
              <div key={res.id} className="p-3.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{res.clientName}</p>
                  <p className="text-[11px] text-gray-500">{res.tourName}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    res.status === 'confirmed' ? 'bg-green-900/50 text-green-400' :
                    res.status === 'pending'   ? 'bg-yellow-900/50 text-yellow-400' :
                                                 'bg-red-900/50 text-red-400'
                  }`}>
                    {res.status === 'confirmed' ? 'Confirmada' : res.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                  </span>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(res.date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            MÓDULOS — 4 secciones organizadas
        ══════════════════════════════════════════════ */}
        <div className="space-y-5 pt-1">

          {/* ── 1. Operaciones & Logística ── */}
          <Section label="Operaciones & Logística" color="emerald">
            <BigButton
              label="Operaciones"
              sub="Catálogo · Channel Manager · CRM · Cotizaciones"
              icon={<LayoutGrid size={20} className="text-emerald-400" />}
              gradient="from-emerald-950 via-teal-950 to-emerald-950"
              border="border-emerald-700 hover:border-emerald-400"
              pulse="bg-emerald-400"
              onClick={() => onNavigate(AppRoute.ADMIN_OPERACIONES)}
            />
            <div className="grid grid-cols-4 gap-2">
              <MiniButton icon={<Calendar size={18} className="text-blue-400" />} label="Reservas" onClick={() => onNavigate(AppRoute.ADMIN_RESERVATIONS)} />
              <MiniButton
                icon={<Clock size={18} className="text-yellow-400" />} label="Aprobaciones"
                onClick={() => onNavigate(AppRoute.ADMIN_APPROVALS)}
                pulse="bg-orange-500"
                badge={pendingApprovals && pendingApprovals > 0 ? String(pendingApprovals) : undefined}
                gradient="from-yellow-900/60 to-orange-900/60" border="border-yellow-700 hover:border-yellow-500"
              />
              <MiniButton icon={<FileText size={18} className="text-emerald-400" />} label="Cotizaciones" onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)} />
              <MiniButton icon={<Route size={18} className="text-cyan-400" />} label="Itinerarios" onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MiniButton
                icon={<Receipt size={18} className="text-orange-400" />} label="Vouchers"
                onClick={() => onNavigate(AppRoute.ADMIN_VOUCHERS)}
                pulse="bg-orange-500"
                gradient="from-orange-900/60 to-red-900/60" border="border-orange-700 hover:border-orange-500"
              />
              <MiniButton
                icon={<Ticket size={18} className="text-amber-400" />} label="Civitatis"
                onClick={() => onNavigate(AppRoute.ADMIN_CIVITATIS)}
                gradient="from-amber-900/60 to-orange-900/60" border="border-amber-700 hover:border-amber-500"
              />
              <MiniButton icon={<TrendingUp size={18} className="text-purple-400" />} label="Finanzas" onClick={() => onNavigate(AppRoute.ADMIN_FINANCE)} />
            </div>
          </Section>

          {/* ── 2. Socios & Usuarios ── */}
          <Section label="Socios & Usuarios" color="blue">
            <div className="grid grid-cols-3 gap-2">
              <MiniButton icon={<Handshake size={18} className="text-emerald-400" />} label="Socios"
                onClick={() => onNavigate(AppRoute.ADMIN_SOCIOS)}
                pulse="bg-teal-500" gradient="from-emerald-900/60 to-teal-900/60" border="border-emerald-700 hover:border-emerald-500" />
              <MiniButton icon={<Users size={18} className="text-blue-400" />} label="Usuarios" onClick={() => onNavigate(AppRoute.ADMIN_USERS)} />
              <MiniButton icon={<DollarSign size={18} className="text-green-400" />} label="Finanzas" onClick={() => onNavigate(AppRoute.ADMIN_FINANCE)} />
            </div>
          </Section>

          {/* ── 3. Contenido & Cultura ── */}
          <Section label="Contenido & Cultura" color="orange">
            <div className="grid grid-cols-3 gap-2">
              <MiniButton icon={<PackageIcon size={18} className="text-orange-400" />} label="Servicios" onClick={() => onNavigate(AppRoute.ADMIN_SERVICES)} />
              <MiniButton icon={<Music size={18} className="text-orange-400" />} label="Caribbean"
                onClick={() => onNavigate(AppRoute.ADMIN_CARIBBEAN)}
                pulse="bg-cyan-500" gradient="from-orange-900/60 to-cyan-900/60" border="border-orange-700 hover:border-orange-500" />
              <MiniButton icon={<Palette size={18} className="text-pink-400" />} label="Artistas"
                onClick={() => onNavigate(AppRoute.ADMIN_ARTISTAS)}
                pulse="bg-pink-500" gradient="from-purple-900/60 to-pink-900/60" border="border-purple-700 hover:border-purple-500" />
            </div>
          </Section>

          {/* ── 4. Cerebro & Sistema ── */}
          <Section label="Cerebro & Sistema" color="indigo">
            <BigButton
              label="Panel de Control"
              sub="Métricas · Kanban · Mapa Mental · Sistema"
              icon={<BarChart3 size={20} className="text-emerald-400" />}
              gradient="from-emerald-950 via-teal-950 to-emerald-950"
              border="border-emerald-600 hover:border-emerald-400"
              pulse="bg-emerald-400"
              onClick={() => onNavigate(AppRoute.ADMIN_CONTROL_PANEL)}
            />
            <BigButton
              label="Cerebro"
              sub="Notas · Oportunidades · Trazabilidad · Contexto Claude"
              icon={<Brain size={20} className="text-indigo-400" />}
              gradient="from-indigo-950 via-violet-950 to-indigo-950"
              border="border-indigo-600 hover:border-indigo-400"
              onClick={() => onNavigate(AppRoute.ADMIN_CEREBRO)}
            />
            <BigButton
              label="SkyPanel Pro"
              sub="Torre de Control · Todos los proyectos · Airtable live"
              icon={<span className="text-lg">🌴</span>}
              gradient="from-slate-900 via-cyan-950 to-slate-900"
              border="border-cyan-500 hover:border-cyan-300"
              pulse="bg-cyan-300"
              onClick={() => onNavigate(AppRoute.ADMIN_SKY_PANEL)}
            />
            <BigButton
              label="Torre de Control"
              sub={`Checklist lanzamiento · Super Admin${criticas > 0 ? ` · ${criticas} tareas críticas` : ''}`}
              icon={<TowerControl size={18} className="text-cyan-400" />}
              gradient="from-cyan-900/60 via-blue-900/60 to-cyan-900/60"
              border="border-cyan-700 hover:border-cyan-500"
              pulse="bg-cyan-400"
              onClick={() => onNavigate(AppRoute.ADMIN_TORRE_CONTROL)}
            />
            <div className="grid grid-cols-3 gap-2">
              <MiniButton icon={<ClipboardList size={18} className="text-cyan-400" />} label="Tareas"
                onClick={() => onNavigate(AppRoute.ADMIN_TASKS)}
                pulse="bg-yellow-500" gradient="from-cyan-900/50 to-blue-900/50" border="border-cyan-800 hover:border-cyan-600"
                badge={criticas > 0 ? String(criticas) : undefined} />
              <MiniButton icon={<Server size={18} className="text-purple-400" />} label="Backend"
                onClick={() => onNavigate(AppRoute.ADMIN_BACKEND)}
                pulse="bg-green-500" gradient="from-purple-900/50 to-blue-900/50" border="border-purple-800 hover:border-purple-600" />
              <MiniButton icon={<Map size={18} className="text-purple-400" />} label="Estructura" onClick={() => onNavigate(AppRoute.ADMIN_STRUCTURE)} />
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
};

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function Section({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-800/50',
    blue: 'text-blue-600 bg-blue-800/50',
    orange: 'text-orange-600 bg-orange-800/50',
    indigo: 'text-indigo-600 bg-indigo-800/50',
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`h-px flex-1 ${colors[color]}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors[color].split(' ')[0]}`}>{label}</span>
        <span className={`h-px flex-1 ${colors[color]}`} />
      </div>
      {children}
    </div>
  );
}

function BigButton({ label, sub, icon, gradient, border, pulse, onClick }: {
  label: string; sub: string; icon: React.ReactNode;
  gradient: string; border: string; pulse?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-gradient-to-r ${gradient} p-4 rounded-xl border ${border} flex items-center gap-3 relative overflow-hidden transition-colors`}
    >
      {pulse && <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 ${pulse} rounded-full animate-pulse`} />}
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-left flex-1 min-w-0">
        <span className="text-sm font-bold text-white block">{label}</span>
        <span className="text-[11px] text-gray-400 truncate block">{sub}</span>
      </div>
      <ChevronRight size={15} className="text-gray-600 flex-shrink-0" />
    </button>
  );
}

function MiniButton({ icon, label, onClick, pulse, gradient, border, badge }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  pulse?: string; gradient?: string; border?: string; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${gradient ? `bg-gradient-to-br ${gradient}` : 'bg-gray-800'} p-3 rounded-xl border ${border || 'border-gray-700 hover:border-gray-600'} flex flex-col items-center gap-1.5 text-center relative overflow-hidden transition-colors`}
    >
      {pulse && <div className={`absolute top-1 right-1 w-1.5 h-1.5 ${pulse} rounded-full animate-pulse`} />}
      {badge && (
        <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {badge}
        </div>
      )}
      {icon}
      <span className="text-[10px] font-bold leading-tight">{label}</span>
    </button>
  );
}

export default AdminDashboard;
