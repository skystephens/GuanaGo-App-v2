import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  TrendingUp, Users, DollarSign, Activity, Calendar,
  Package as PackageIcon, ChevronRight, Server, Music,
  Palette, Handshake, Clock, FileText,
  LayoutGrid, Route, Map, Network, ExternalLink,
  Bot, Send, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Receipt, Briefcase, ListChecks,
  Menu, Wifi, WifiOff, Home, Settings, Globe, Layers, Trophy,
  CalendarDays, Crown, Gift, BarChart3, Store, MessageSquare,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { setInitialSection } from './AdminAliados';
import { api } from '../../services/api';
import { getTareas } from '../../services/airtableService';
import type { Reservation } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
  onPreview?: (role: import('../../types').UserRole) => void;
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
            onClick={e => { e.stopPropagation(); onNavigate(AppRoute.COMMAND_CENTER); }}
            className="text-[10px] text-violet-400 hover:text-violet-200 px-2 py-0.5 rounded border border-violet-700 hover:border-violet-500 transition-colors"
          >
            Command Center
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

const AdminDashboard: React.FC<DashboardProps> = ({ onNavigate, onPreview }) => {
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [showArchivo, setShowArchivo] = useState(false);
  const [loadingRes, setLoadingRes] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [atStats, setAtStats] = useState<{ total: number; criticas: number } | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [atStatus, setAtStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [chatsPendientes, setChatsPendientes] = useState<number | null>(null);

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

  // Cargar chats de atención pendientes (badge)
  const loadChatsPendientes = useCallback(async () => {
    try {
      const res = await fetch('/api/chatbot/atencion/pendientes');
      if (res.ok) {
        const data = await res.json();
        setChatsPendientes(data?.total ?? 0);
      }
    } catch { /* silencioso — no bloquear el dashboard */ }
  }, []);

  useEffect(() => {
    loadRecent();
    loadApprovals();
    loadChatsPendientes();
    const id = setInterval(() => {
      loadRecent();
      loadChatsPendientes();
    }, 60000);
    return () => clearInterval(id);
  }, [loadRecent, loadApprovals, loadChatsPendientes]);

  // Cargar tareas desde Airtable
  useEffect(() => {
    getTareas().then(tareas => {
      const total = tareas.length;
      const criticas = tareas.filter(t => t.prioridad === 'critica' && t.status !== 'terminado').length;
      setAtStats({ total, criticas });
      setAtStatus('ok');
    }).catch(() => setAtStatus('error'));
  }, []);

  // Tareas: Airtable tiene prioridad, localStorage como fallback
  const torreData = loadTorreContext();
  const tareasCount = atStats?.total ?? torreData?.stats.total ?? 0;
  const criticas = atStats?.criticas ?? torreData?.stats.criticas ?? 0;

  const SIDEBAR_ITEMS = [
    { label: 'INICIO', items: [
      { icon: <Home size={18} />, label: 'Dashboard', route: AppRoute.ADMIN_DASHBOARD },
    ]},
    { label: 'OPERACIONES', items: [
      { icon: <LayoutGrid size={18} />, label: 'Operaciones', route: AppRoute.ADMIN_OPERACIONES },
      { icon: <Calendar size={18} />, label: 'Reservas', route: AppRoute.ADMIN_RESERVATIONS },
      { icon: <Receipt size={18} />, label: 'Vouchers', route: AppRoute.ADMIN_VOUCHERS },
      { icon: <FileText size={18} />, label: 'Cotizaciones', route: AppRoute.ADMIN_QUOTES },
      { icon: <Clock size={18} />, label: 'Aprobaciones', route: AppRoute.ADMIN_APPROVALS },
      { icon: <TrendingUp size={18} />, label: 'Finanzas', route: AppRoute.ADMIN_FINANCE },
    ]},
    { label: 'SOCIOS & ALIADOS', items: [
      { icon: <Map size={18} />, label: 'Negocios Locales', route: AppRoute.ADMIN_NEGOCIOS_LOCALES },
      { icon: <Handshake size={18} />, label: 'Socios', route: AppRoute.ADMIN_SOCIOS },
      { icon: <Users size={18} />, label: 'Usuarios', route: AppRoute.ADMIN_USERS },
      { icon: <PackageIcon size={18} />, label: 'Servicios', route: AppRoute.ADMIN_SERVICES },
      { icon: <Music size={18} />, label: 'Caribbean', route: AppRoute.ADMIN_CARIBBEAN },
    ]},
    { label: 'PROYECTO', items: [
      { icon: <Layers size={18} />, label: 'Command Center', route: AppRoute.COMMAND_CENTER },
      { icon: <Globe size={18} />, label: 'Traducciones', route: AppRoute.ADMIN_TRADUCCION },
      { icon: <Briefcase size={18} />, label: 'Cowork IA', route: AppRoute.ADMIN_COWORK },
      { icon: <Trophy size={18} />, label: 'Dinámicas', route: AppRoute.ADMIN_DINAMICAS },
      { icon: <Map size={18} />, label: 'Zonas Taxi', route: AppRoute.ADMIN_TAXI_ZONE_EDITOR },
    ]},
    { label: 'ATENCIÓN', items: [
      { icon: <MessageSquare size={18} />, label: 'Chat Atención', route: AppRoute.ADMIN_CHATS_ATENCION },
    ]},
    { label: 'HERRAMIENTAS', items: [
      { icon: <Settings size={18} />, label: 'Herramientas', route: AppRoute.ADMIN_HERRAMIENTAS },
    ]},
  ];

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex">

      {/* ── Sidebar (always visible, collapsible) ── */}
      <aside className={`flex flex-col bg-gray-950 border-r border-gray-800 transition-all duration-200 shrink-0 ${sidebarExpanded ? 'w-52' : 'w-16'}`}>
        {/* Logo / toggle */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-800">
          {sidebarExpanded && <span className="text-xs font-bold text-teal-400 tracking-widest">GUANAGO</span>}
          <button onClick={() => setSidebarExpanded(v => !v)} className="p-1.5 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white ml-auto">
            <Menu size={18} />
          </button>
        </div>
        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          {SIDEBAR_ITEMS.map(group => (
            <div key={group.label}>
              {sidebarExpanded && (
                <p className="px-3 mb-1 text-[9px] font-bold text-gray-600 tracking-widest">{group.label}</p>
              )}
              {group.items.map(item => {
                const isChatAtencion = item.route === AppRoute.ADMIN_CHATS_ATENCION;
                const showBadge = isChatAtencion && chatsPendientes !== null && chatsPendientes > 0;
                return (
                  <button
                    key={item.label}
                    onClick={() => onNavigate(item.route)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800/70 transition-colors relative"
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <span className="shrink-0 relative">
                      {item.icon}
                      {showBadge && !sidebarExpanded && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                          {chatsPendientes > 9 ? '9+' : chatsPendientes}
                        </span>
                      )}
                    </span>
                    {sidebarExpanded && (
                      <span className="text-xs font-medium truncate flex-1">{item.label}</span>
                    )}
                    {sidebarExpanded && showBadge && (
                      <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {chatsPendientes > 9 ? '9+' : chatsPendientes}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        {/* Airtable status (bottom) */}
        <div className="px-3 py-3 border-t border-gray-800">
          {sidebarExpanded ? (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${atStatus === 'ok' ? 'bg-green-900/50 text-green-400' : atStatus === 'error' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
              {atStatus === 'ok' ? <Wifi size={10} /> : atStatus === 'error' ? <WifiOff size={10} /> : <Loader2 size={10} className="animate-spin" />}
              {atStatus === 'ok' ? 'Airtable OK' : atStatus === 'error' ? 'AT Error' : 'Conectando…'}
            </div>
          ) : (
            <div className="flex justify-center">
              {atStatus === 'ok' ? <Wifi size={14} className="text-green-400" /> : atStatus === 'error' ? <WifiOff size={14} className="text-red-400" /> : <Loader2 size={14} className="text-gray-500 animate-spin" />}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-24">

        {/* Header */}
        <header className="px-6 pt-10 pb-4 flex justify-between items-center">
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

        <div className="px-6 space-y-5 pt-2">

        {/* ══════════════════════════════════════════════
            AGENTE IA — Briefing automático al entrar
        ══════════════════════════════════════════════ */}
        <AgenteBriefing onNavigate={onNavigate} />

        {/* ══════════════════════════════════════════════
            STATS — Datos reales + Torre
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate(AppRoute.COMMAND_CENTER)}
            className="bg-gray-800 p-3.5 rounded-xl border border-gray-700 hover:border-blue-700 transition-colors text-left w-full"
          >
            <span className="text-gray-500 text-[10px] uppercase font-bold">
              Tareas {atStats ? '· Airtable' : '· Local'}
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xl font-bold">{tareasCount || '—'}</span>
              {criticas > 0 && <span className="text-red-400 text-xs font-bold">{criticas} críticas</span>}
            </div>
          </button>
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
              <MiniButton
                icon={<MessageSquare size={18} className="text-rose-400" />} label="Chat Atención"
                onClick={() => onNavigate(AppRoute.ADMIN_CHATS_ATENCION)}
                pulse={chatsPendientes !== null && chatsPendientes > 0 ? 'bg-red-500' : undefined}
                badge={chatsPendientes !== null && chatsPendientes > 0 ? String(chatsPendientes) : undefined}
                gradient="from-rose-900/60 to-pink-900/60" border="border-rose-800 hover:border-rose-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniButton
                icon={<Receipt size={18} className="text-orange-400" />} label="Vouchers"
                onClick={() => onNavigate(AppRoute.ADMIN_VOUCHERS)}
                pulse="bg-orange-500"
                gradient="from-orange-900/60 to-red-900/60" border="border-orange-700 hover:border-orange-500"
              />
              <MiniButton icon={<TrendingUp size={18} className="text-purple-400" />} label="Finanzas" onClick={() => onNavigate(AppRoute.ADMIN_FINANCE)} />
            </div>
          </Section>

          {/* ── 2. Socios & Usuarios ── */}
          <Section label="Socios & Usuarios" color="blue">
            <BigButton
              label="Gestión de Usuarios · CRM"
              sub="Registros Firebase · Roles · Leads Airtable"
              icon={<Users size={20} className="text-blue-400" />}
              gradient="from-blue-950 via-indigo-950 to-blue-950"
              border="border-blue-700 hover:border-blue-400"
              pulse="bg-blue-400"
              onClick={() => onNavigate(AppRoute.ADMIN_USERS)}
            />
            <div className="grid grid-cols-2 gap-2">
              <MiniButton icon={<Handshake size={18} className="text-emerald-400" />} label="Socios"
                onClick={() => onNavigate(AppRoute.ADMIN_SOCIOS)}
                pulse="bg-teal-500" gradient="from-emerald-900/60 to-teal-900/60" border="border-emerald-700 hover:border-emerald-500" />
              <MiniButton icon={<DollarSign size={18} className="text-green-400" />} label="Finanzas" onClick={() => onNavigate(AppRoute.ADMIN_FINANCE)} />
            </div>
          </Section>

          {/* ── 4. Contenido & Cultura ── */}
          <Section label="Contenido & Cultura" color="orange">
            <BigButton
              label="Calculadora de Traslados 🚕"
              sub="Aeropuerto-Hotel, vehiculos sedan, tarifa diurna/nocturna automatica"
              icon={<span className="text-lg">🚕</span>}
              gradient="from-amber-950 via-orange-950 to-amber-950"
              border="border-amber-600 hover:border-amber-400"
              pulse="bg-amber-400"
              onClick={() => onNavigate(AppRoute.ADMIN_TRASLADOS_CALC)}
            />
            <BigButton
              label="Delegaciones · Torneos 🏐"
              sub="Copa de la Isla + Seven Colors SAI — delegaciones, tarifas, viajeros, portal, link Wompi"
              icon={<span className="text-lg">🏐</span>}
              gradient="from-blue-950 via-cyan-950 to-blue-950"
              border="border-orange-600 hover:border-orange-400"
              pulse="bg-orange-400"
              onClick={() => onNavigate(AppRoute.ADMIN_COPA_DELEGACION)}
            />
            <BigButton
              label="Torre Torneos (interno) 🔒"
              sub="P&L por torneo o consolidado, margen real, cuentas por pagar, estructura de costos"
              icon={<span className="text-lg">📊</span>}
              gradient="from-red-950 via-slate-950 to-red-950"
              border="border-red-700 hover:border-red-500"
              pulse="bg-red-500"
              onClick={() => onNavigate(AppRoute.ADMIN_TORRE_COPA)}
            />
            <BigButton
              label="CRM · Torre Comercial 🏝️"
              sub="Tycoon GuiaSAI: departamentos en vivo, pipeline de leads, guiones de venta"
              icon={<span className="text-lg">🎯</span>}
              gradient="from-emerald-950 via-teal-950 to-emerald-950"
              border="border-emerald-600 hover:border-emerald-400"
              pulse="bg-emerald-400"
              onClick={() => onNavigate(AppRoute.ADMIN_CRM)}
            />
            <BigButton
              label="Editor del Home"
              sub="Edita la portada como en WordPress: hero, paisajes, bandera del día, textos"
              icon={<span className="text-lg">🖌️</span>}
              gradient="from-teal-950 via-cyan-950 to-teal-950"
              border="border-teal-600 hover:border-teal-400"
              pulse="bg-teal-400"
              onClick={() => onNavigate(AppRoute.ADMIN_EDITOR_HOME)}
            />
            <BigButton
              label="Campañas & Anuncios"
              sub="Copies prediseñados con data de Airtable · Bandera DIMAR · 80/20 · #LaivStieg"
              icon={<span className="text-lg">📣</span>}
              gradient="from-orange-950 via-rose-950 to-orange-950"
              border="border-orange-600 hover:border-orange-400"
              pulse="bg-orange-400"
              onClick={() => onNavigate(AppRoute.ADMIN_CAMPANAS)}
            />
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

          {/* ── 5. Herramientas ── */}
          <Section label="Herramientas" color="indigo">
            <BigButton
              label="Herramientas del Proyecto"
              sub="Mapa Mental · Lean Canvas · Backend · Torre de Control · Estado del Proyecto"
              icon={<Settings size={20} className="text-sky-400" />}
              gradient="from-sky-950 via-blue-950 to-sky-950"
              border="border-sky-700 hover:border-sky-400"
              pulse="bg-sky-400"
              onClick={() => onNavigate(AppRoute.ADMIN_HERRAMIENTAS)}
            />
          </Section>

          {/* ── 4. Hub de trabajo ── */}
          <Section label="Hub de trabajo" color="indigo">
            <BigButton
              label="Command Center"
              sub={`Tareas${criticas > 0 ? ` (${criticas} críticas)` : ''} · Avance · RAG · Ecosistema · Sistema`}
              icon={<span className="text-lg">⚡</span>}
              gradient="from-slate-900 via-blue-950 to-slate-900"
              border="border-blue-500 hover:border-blue-300"
              pulse="bg-blue-400"
              onClick={() => onNavigate(AppRoute.COMMAND_CENTER)}
            />
            <BigButton
              label="Cowork IA — B2B"
              sub="Cotizador OTA · Asistente · Tarifas netas agencias"
              icon={<Briefcase size={20} className="text-orange-400" />}
              gradient="from-orange-950 via-amber-950 to-orange-950"
              border="border-orange-700 hover:border-orange-400"
              pulse="bg-orange-400"
              onClick={() => onNavigate(AppRoute.ADMIN_COWORK)}
            />
            <div className="grid grid-cols-3 gap-2">
              <MiniButton
                icon={<Globe size={18} className="text-cyan-400" />} label="Vista por Rol"
                onClick={() => onNavigate(AppRoute.ADMIN_PREVIEW_ROLES)}
                pulse="bg-cyan-400" gradient="from-cyan-900/50 to-blue-900/50" border="border-cyan-700 hover:border-cyan-500"
              />
              <MiniButton
                icon={<Map size={18} className="text-cyan-400" />} label="Zonas Taxi"
                onClick={() => onNavigate(AppRoute.ADMIN_TAXI_ZONE_EDITOR)}
                pulse="bg-cyan-400" gradient="from-cyan-900/50 to-blue-900/50" border="border-cyan-700 hover:border-cyan-500"
              />
              <MiniButton
                icon={<Network size={18} className="text-emerald-400" />} label="Traducciones"
                onClick={() => onNavigate(AppRoute.ADMIN_TRADUCCION)}
                pulse="bg-emerald-400" gradient="from-emerald-900/50 to-teal-900/50" border="border-emerald-700 hover:border-emerald-500"
              />
            </div>

            {/* ── Preview rápido de perfiles ── */}
            <div className="mt-2 bg-gray-800/40 border border-gray-700 rounded-xl p-3">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                🧪 Test de perfiles (sin cambiar sesión)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate(AppRoute.PARTNER_DASHBOARD_PRO)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-900/30 border border-emerald-700/50 hover:border-emerald-500 rounded-lg text-xs text-emerald-300 font-semibold transition-colors"
                >
                  <Handshake size={13} /> Panel Aliado
                </button>
                <button
                  onClick={() => onPreview?.('Aliado')}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-900/50 border border-emerald-600/50 hover:border-emerald-400 rounded-lg text-xs text-emerald-200 font-semibold transition-colors"
                  title="Simula la sesión completa como Aliado"
                >
                  <Globe size={13} /> Como Aliado
                </button>
                <button
                  onClick={() => onPreview?.('Turista')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-700/50 hover:border-blue-500 rounded-lg text-xs text-blue-300 font-semibold transition-colors"
                >
                  <Globe size={13} /> Como Turista
                </button>
                <button
                  onClick={() => onPreview?.('Residente')}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 border border-purple-700/50 hover:border-purple-500 rounded-lg text-xs text-purple-300 font-semibold transition-colors"
                >
                  <Globe size={13} /> Como Residente
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                "Panel Aliado" → navega sin cambiar rol · "Como Aliado" → simula sesión completa con barra de salida
              </p>
            </div>
          </Section>

          {/* ── Archivo: secciones pausadas (no en uso a corto plazo) ── */}
          <div className="space-y-2">
            <button
              onClick={() => setShowArchivo(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-600 transition-colors"
            >
              <span className="text-base">🗄️</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-400">Archivo</p>
                <p className="text-[10px] text-gray-600">Aliados & Red · Dinámicas & Comunidad — secciones pausadas</p>
              </div>
              {showArchivo ? <ChevronUp size={15} className="text-gray-600" /> : <ChevronDown size={15} className="text-gray-600" />}
            </button>
            {showArchivo && (
              <div className="space-y-5 border border-gray-800 rounded-xl p-3 bg-gray-950/50 opacity-80">
            {/* ── 2b. Aliados & Red ── */}
            <Section label="Aliados & Red" color="orange">
              <div className="grid grid-cols-1 gap-2">
                {([
                  { id: 'disponibilidad', label: 'Disponibilidad',    icon: <CalendarDays size={16} className="text-cyan-400" />,   cls: 'border-cyan-800 hover:border-cyan-500',     grad: 'from-cyan-900/50 to-teal-900/50' },
                  { id: 'planes',         label: 'Planes Membresía',  icon: <Crown size={16} className="text-orange-400" />,         cls: 'border-orange-800 hover:border-orange-500', grad: 'from-orange-900/50 to-amber-900/50' },
                  { id: 'guanapoints',    label: 'GuanaPoints',       icon: <Gift size={16} className="text-yellow-400" />,          cls: 'border-yellow-800 hover:border-yellow-500', grad: 'from-yellow-900/40 to-amber-900/40' },
                  { id: 'estrategia',     label: 'Estrategia',        icon: <BarChart3 size={16} className="text-indigo-400" />,     cls: 'border-indigo-800 hover:border-indigo-500', grad: 'from-indigo-900/50 to-blue-900/50' },
                  { id: 'wifi',           label: 'WiFi Captivo',      icon: <Wifi size={16} className="text-teal-400" />,            cls: 'border-teal-800 hover:border-teal-500',     grad: 'from-teal-900/50 to-emerald-900/50' },
                  { id: 'documentos',     label: 'Documentos & Kits', icon: <FileText size={16} className="text-purple-400" />,      cls: 'border-purple-800 hover:border-purple-500', grad: 'from-purple-900/50 to-violet-900/50' },
                  { id: 'microsites',     label: 'Micrositios',       icon: <Store size={16} className="text-green-400" />,          cls: 'border-green-800 hover:border-green-500',   grad: 'from-green-900/50 to-emerald-900/50' },
                ] as const).map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => { setInitialSection(sec.id); onNavigate(AppRoute.ADMIN_ALIADOS); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-r ${sec.grad} ${sec.cls} transition-all text-left`}
                  >
                    {sec.icon}
                    <span className="text-sm font-bold text-white">{sec.label}</span>
                    <ChevronRight size={14} className="text-gray-600 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MiniButton
                  icon={<Map size={18} className="text-teal-400" />} label="Negocios Locales"
                  onClick={() => onNavigate(AppRoute.ADMIN_NEGOCIOS_LOCALES)}
                  pulse="bg-teal-500" gradient="from-teal-900/60 to-emerald-900/60" border="border-teal-800 hover:border-teal-500" />
                <MiniButton
                  icon={<Globe size={18} className="text-cyan-400" />} label="Ver página pública"
                  onClick={() => onNavigate(AppRoute.VINCULAR_COMERCIO)}
                  gradient="from-cyan-900/60 to-teal-900/60" border="border-cyan-800 hover:border-cyan-500" />
              </div>
            </Section>

            {/* ── 3. Dinámicas & Comunidad ── */}
            <Section label="Dinámicas & Comunidad" color="orange">
              <BigButton
                label="Dinámicas y Embajadores"
                sub="Concursos · Embajadores residentes y turistas · Rutas Raizal"
                icon={<Trophy size={20} className="text-orange-400" />}
                gradient="from-orange-950 via-amber-950 to-orange-950"
                border="border-orange-700 hover:border-orange-400"
                pulse="bg-orange-400"
                onClick={() => onNavigate(AppRoute.ADMIN_DINAMICAS)}
              />
            </Section>

              </div>
            )}
          </div>

        </div>
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
