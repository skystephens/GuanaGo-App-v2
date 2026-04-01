/**
 * AdminControlPanel — Panel de Control Unificado GuanaGO 2026
 * Tabs: Mapa Mental | Kanban | Estado del Sistema | Métricas
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Map, Kanban, Activity, BarChart3,
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock,
  Zap, Database, Server, Shield, Wifi, WifiOff,
  TrendingUp, Users, Package, BedDouble, Car, Compass,
  ChevronRight, Plus, Circle,
} from 'lucide-react';
import { AppRoute } from '../../types';
import AdminMapaMental from './AdminMapaMental';
import { getServices, getAllLeads } from '../../services/airtableService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  onBack?: () => void;
  onNavigate?: (route: AppRoute, data?: any) => void;
}

type Tab = 'mapa' | 'kanban' | 'sistema' | 'metricas';

// ─── From AdminTorreControl (shared types) ────────────────────────────────────
type EstadoTarea = 'pendiente' | 'en_progreso' | 'completado' | 'bloqueado';
interface TareaControl {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  estado: EstadoTarea;
  creadaEn: string;
}
interface SeccionControl {
  id: string;
  titulo: string;
  color?: string;
  tareas: TareaControl[];
}
const TORRE_KEY = 'guanago_torre_v3';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const loadTorre = (): SeccionControl[] => {
  try {
    const raw = localStorage.getItem(TORRE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
};

const saveTorre = (data: SeccionControl[]) =>
  localStorage.setItem(TORRE_KEY, JSON.stringify(data));

const ESTADO_CFG: Record<EstadoTarea, { label: string; color: string; bg: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'text-gray-400',   bg: 'bg-gray-800/60',   dot: '#6b7280' },
  en_progreso: { label: 'En progreso', color: 'text-blue-400',   bg: 'bg-blue-900/30',   dot: '#3b82f6' },
  completado:  { label: 'Completado',  color: 'text-emerald-400',bg: 'bg-emerald-900/30',dot: '#22c55e' },
  bloqueado:   { label: 'Bloqueado',   color: 'text-red-400',    bg: 'bg-red-900/30',    dot: '#ef4444' },
};

const PRIORIDAD_COLOR: Record<string, string> = {
  critica: 'bg-red-500',
  alta:    'bg-orange-400',
  media:   'bg-yellow-400',
  baja:    'bg-gray-500',
};

const KANBAN_COLS: EstadoTarea[] = ['pendiente', 'en_progreso', 'completado', 'bloqueado'];

// ─── Sistema checks ───────────────────────────────────────────────────────────
type CheckStatus = 'ok' | 'error' | 'checking' | 'warn';
interface SysCheck { label: string; status: CheckStatus; detail: string; icon: React.ReactNode }

// ─── Métricas ─────────────────────────────────────────────────────────────────
interface Metricas {
  totalServicios: number;
  tours: number;
  hoteles: number;
  traslados: number;
  paquetes: number;
  activos: number;
  leads: number;
  loading: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN TAB
// ═══════════════════════════════════════════════════════════════════════════════
const KanbanTab: React.FC<{ onNavigateTorre?: () => void }> = ({ onNavigateTorre }) => {
  const [secciones, setSecciones] = useState<SeccionControl[]>([]);
  const [dragging, setDragging]   = useState<{ seccionId: string; tareaId: string } | null>(null);

  useEffect(() => { setSecciones(loadTorre()); }, []);

  // Flatten all tasks for Kanban view
  const allTareas: (TareaControl & { seccionTitulo: string; seccionId: string })[] = secciones.flatMap(s =>
    s.tareas.map(t => ({ ...t, seccionTitulo: s.titulo, seccionId: s.id }))
  );

  const byEstado = (estado: EstadoTarea) => allTareas.filter(t => t.estado === estado);

  const changeEstado = (seccionId: string, tareaId: string, nuevoEstado: EstadoTarea) => {
    const updated = secciones.map(s => ({
      ...s,
      tareas: s.tareas.map(t => t.id === tareaId && s.id === seccionId ? { ...t, estado: nuevoEstado } : t)
    }));
    setSecciones(updated);
    saveTorre(updated);
  };

  const totalTareas = allTareas.length;
  const completadas = allTareas.filter(t => t.estado === 'completado').length;
  const progreso    = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

  if (totalTareas === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-4">
        <Kanban size={48} className="opacity-20" />
        <p className="text-sm font-bold">No hay tareas todavía</p>
        <p className="text-xs text-gray-500 text-center px-8">
          Agrega tareas desde la Torre de Control y aparecerán aquí organizadas por estado.
        </p>
        {onNavigateTorre && (
          <button
            onClick={onNavigateTorre}
            className="mt-2 px-4 py-2 bg-cyan-800/50 border border-cyan-700 rounded-xl text-cyan-300 text-xs font-bold flex items-center gap-2"
          >
            <Plus size={14} /> Ir a Torre de Control
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-bold">{completadas} / {totalTareas} tareas completadas</span>
          <span className="text-xs font-black text-emerald-400">{progreso}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-700"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Kanban columns — horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto px-4 pt-4 pb-2 snap-x">
        {KANBAN_COLS.map(col => {
          const tareas = byEstado(col);
          const cfg = ESTADO_CFG[col];
          return (
            <div key={col} className="snap-start shrink-0 w-64 flex flex-col gap-2">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${cfg.bg} border border-white/5`}>
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                <span className={`text-xs font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full bg-black/30 ${cfg.color}`}>
                  {tareas.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 min-h-[80px]">
                {tareas.length === 0 ? (
                  <div className="border border-dashed border-gray-800 rounded-xl h-16 flex items-center justify-center">
                    <span className="text-[10px] text-gray-700">Vacío</span>
                  </div>
                ) : tareas.map(t => (
                  <div key={t.id} className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-3 flex flex-col gap-2 hover:border-gray-600 transition-all">
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${PRIORIDAD_COLOR[t.prioridad]}`} />
                      <p className="text-xs font-semibold text-gray-200 leading-snug">{t.titulo}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-600 font-medium truncate max-w-[100px]">{t.seccionTitulo}</span>
                      {/* Quick estado change */}
                      <select
                        value={t.estado}
                        onChange={e => changeEstado(t.seccionId, t.id, e.target.value as EstadoTarea)}
                        className="text-[9px] bg-gray-900 border border-gray-700 rounded-lg px-1 py-0.5 text-gray-400 focus:outline-none"
                      >
                        {KANBAN_COLS.map(e => (
                          <option key={e} value={e}>{ESTADO_CFG[e].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Link to full Torre de Control */}
      {onNavigateTorre && (
        <div className="px-4 pt-2">
          <button
            onClick={onNavigateTorre}
            className="w-full py-3 rounded-xl border border-cyan-800/50 text-cyan-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-cyan-900/20 transition-colors"
          >
            Ver Torre de Control completa <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SISTEMA TAB
// ═══════════════════════════════════════════════════════════════════════════════
const SistemaTab: React.FC = () => {
  const [checks, setChecks] = useState<SysCheck[]>([
    { label: 'Airtable API',      status: 'checking', detail: 'Verificando...', icon: <Database size={16} /> },
    { label: 'Backend Render',    status: 'checking', detail: 'Verificando...', icon: <Server size={16} /> },
    { label: 'Firebase Auth',     status: 'checking', detail: 'Verificando...', icon: <Shield size={16} /> },
    { label: 'Caché Local',       status: 'checking', detail: 'Verificando...', icon: <Zap size={16} /> },
  ]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [running, setRunning]     = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const results: SysCheck[] = [
      { label: 'Airtable API',   status: 'checking', detail: 'Verificando...', icon: <Database size={16} /> },
      { label: 'Backend Render', status: 'checking', detail: 'Verificando...', icon: <Server size={16} /> },
      { label: 'Firebase Auth',  status: 'checking', detail: 'Verificando...', icon: <Shield size={16} /> },
      { label: 'Caché Local',    status: 'checking', detail: 'Verificando...', icon: <Zap size={16} /> },
    ];
    setChecks([...results]);

    // Check 1: Airtable
    try {
      const t0 = Date.now();
      const data = await getServices();
      const ms = Date.now() - t0;
      results[0] = { ...results[0], status: data.length > 0 ? 'ok' : 'warn', detail: `${data.length} servicios · ${ms}ms` };
    } catch (e: any) {
      results[0] = { ...results[0], status: 'error', detail: e?.message || 'Error de conexión' };
    }
    setChecks([...results]);

    // Check 2: Backend Render
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://www.guanago.travel';
      const t0 = Date.now();
      const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(6000) });
      const ms  = Date.now() - t0;
      results[1] = { ...results[1], status: res.ok ? 'ok' : 'warn', detail: `HTTP ${res.status} · ${ms}ms` };
    } catch {
      results[1] = { ...results[1], status: 'error', detail: 'Sin respuesta del backend' };
    }
    setChecks([...results]);

    // Check 3: Firebase (check if client SDK init)
    try {
      const hasCreds = !!import.meta.env.VITE_FIREBASE_API_KEY || !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
      results[2] = { ...results[2], status: hasCreds ? 'ok' : 'warn', detail: hasCreds ? 'Credenciales detectadas' : 'Variables VITE_FIREBASE_* no encontradas' };
    } catch {
      results[2] = { ...results[2], status: 'warn', detail: 'No verificado' };
    }
    setChecks([...results]);

    // Check 4: Cache
    try {
      const cacheKeys = ['guanago_cache_services_turisticos', 'guanago_cache_directory_map'];
      const cached = cacheKeys.filter(k => localStorage.getItem(k));
      const sizeKB  = Math.round(JSON.stringify(localStorage).length / 1024);
      results[3] = {
        ...results[3],
        status: cached.length > 0 ? 'ok' : 'warn',
        detail: `${cached.length}/${cacheKeys.length} claves activas · ~${sizeKB}KB`
      };
    } catch {
      results[3] = { ...results[3], status: 'error', detail: 'localStorage no disponible' };
    }
    setChecks([...results]);

    setLastCheck(new Date());
    setRunning(false);
  }, []);

  useEffect(() => { runChecks(); }, []);

  const StatusIcon: React.FC<{ status: CheckStatus }> = ({ status }) => {
    if (status === 'ok')       return <CheckCircle2 size={18} className="text-emerald-400" />;
    if (status === 'error')    return <XCircle size={18} className="text-red-400" />;
    if (status === 'warn')     return <AlertCircle size={18} className="text-yellow-400" />;
    return <RefreshCw size={16} className="text-gray-500 animate-spin" />;
  };

  const overall: CheckStatus = checks.some(c => c.status === 'error') ? 'error'
    : checks.some(c => c.status === 'checking') ? 'checking'
    : checks.some(c => c.status === 'warn') ? 'warn' : 'ok';

  const overallBg = overall === 'ok' ? 'from-emerald-900/40 to-teal-900/40 border-emerald-700/50'
    : overall === 'error' ? 'from-red-900/40 to-rose-900/40 border-red-700/50'
    : overall === 'warn'  ? 'from-yellow-900/40 to-amber-900/40 border-yellow-700/50'
    : 'from-gray-900/40 to-gray-800/40 border-gray-700/50';

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      {/* Overall status banner */}
      <div className={`bg-gradient-to-br ${overallBg} border rounded-2xl p-4 flex items-center gap-4`}>
        <div className="text-3xl">
          {overall === 'ok' ? '✅' : overall === 'error' ? '🔴' : overall === 'warn' ? '⚠️' : '⏳'}
        </div>
        <div className="flex-1">
          <p className="font-black text-white text-sm">
            {overall === 'ok' ? 'Todos los sistemas operativos'
              : overall === 'error' ? 'Hay errores críticos'
              : overall === 'warn' ? 'Advertencias detectadas'
              : 'Verificando...'}
          </p>
          {lastCheck && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Última verificación: {lastCheck.toLocaleTimeString('es-CO')}
            </p>
          )}
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={16} className={running ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Individual checks */}
      <div className="space-y-3">
        {checks.map((c, i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-center gap-3">
            <div className="text-gray-400">{c.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{c.label}</p>
              <p className="text-[11px] text-gray-400 truncate">{c.detail}</p>
            </div>
            <StatusIcon status={c.status} />
          </div>
        ))}
      </div>

      {/* Stack info */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Stack GuanaGO</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Frontend', 'React 19 + Vite + TS'],
            ['Backend', 'Node + Express · Render'],
            ['Base de datos', 'Airtable API REST'],
            ['Auth', 'Firebase Auth'],
            ['Automatización', 'Make.com webhooks'],
            ['Deploy', 'Render.com (free tier)'],
          ].map(([label, val]) => (
            <div key={label} className="bg-gray-800/50 rounded-xl px-3 py-2">
              <p className="text-[9px] text-gray-500 font-black uppercase">{label}</p>
              <p className="text-[11px] text-gray-300 font-semibold mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTRICAS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const MetricasTab: React.FC = () => {
  const [data, setData] = useState<Metricas>({
    totalServicios: 0, tours: 0, hoteles: 0, traslados: 0,
    paquetes: 0, activos: 0, leads: 0, loading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const [servicios, leadsData] = await Promise.all([getServices(), getAllLeads(200)]);
        setData({
          totalServicios: servicios.length,
          tours:     servicios.filter(s => s.category === 'tour').length,
          hoteles:   servicios.filter(s => s.category === 'hotel').length,
          traslados: servicios.filter(s => s.category === 'taxi').length,
          paquetes:  servicios.filter(s => s.category === 'package').length,
          activos:   servicios.filter(s => s.active !== false).length,
          leads:     leadsData?.length || 0,
          loading:   false,
        });
      } catch {
        setData(d => ({ ...d, loading: false }));
      }
    })();
  }, []);

  const MetricCard: React.FC<{
    label: string; value: number | string; icon: React.ReactNode;
    color: string; sub?: string;
  }> = ({ label, value, icon, color, sub }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 border border-white/5`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-black/20 rounded-xl">{icon}</div>
        {data.loading && <RefreshCw size={12} className="text-white/40 animate-spin mt-1" />}
      </div>
      <div className="text-2xl font-black text-white">{data.loading ? '—' : value}</div>
      <div className="text-xs font-bold text-white/70 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-white/40 mt-1">{sub}</div>}
    </div>
  );

  const activosPercent = data.totalServicios > 0
    ? Math.round((data.activos / data.totalServicios) * 100) : 0;

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Total Servicios"
          value={data.totalServicios}
          icon={<Package size={18} className="text-emerald-300" />}
          color="from-emerald-900/60 to-teal-900/60"
          sub="en Airtable"
        />
        <MetricCard
          label="Activos"
          value={`${data.activos} (${activosPercent}%)`}
          icon={<Zap size={18} className="text-yellow-300" />}
          color="from-yellow-900/60 to-amber-900/60"
          sub="publicados en la app"
        />
        <MetricCard
          label="Leads / Clientes"
          value={data.leads}
          icon={<Users size={18} className="text-blue-300" />}
          color="from-blue-900/60 to-indigo-900/60"
          sub="en CRM Airtable"
        />
        <MetricCard
          label="Tours"
          value={data.tours}
          icon={<Compass size={18} className="text-cyan-300" />}
          color="from-cyan-900/60 to-sky-900/60"
          sub="actividades"
        />
      </div>

      {/* Desglose por categoría */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Catálogo por categoría</p>
        <div className="space-y-3">
          {[
            { label: 'Alojamientos', value: data.hoteles,   icon: <BedDouble size={14} />, color: 'bg-teal-500',   cat: 'hotel' },
            { label: 'Tours',        value: data.tours,     icon: <Compass size={14} />,   color: 'bg-emerald-500',cat: 'tour'  },
            { label: 'Traslados',    value: data.traslados, icon: <Car size={14} />,        color: 'bg-yellow-500', cat: 'taxi'  },
            { label: 'Paquetes',     value: data.paquetes,  icon: <Package size={14} />,    color: 'bg-purple-500', cat: 'package' },
          ].map(row => {
            const pct = data.totalServicios > 0 ? (row.value / data.totalServicios) * 100 : 0;
            return (
              <div key={row.cat}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-gray-400">{row.icon}</div>
                  <span className="text-xs font-semibold text-gray-300 flex-1">{row.label}</span>
                  <span className="text-xs font-black text-white">{data.loading ? '—' : row.value}</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proyectos del ecosistema */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Ecosistema GuiaSAI</p>
        <div className="space-y-2">
          {[
            { nombre: 'GuanaGO',      url: 'guanago.travel',   estado: 'production', desc: 'App B2C turismo' },
            { nombre: 'GuiaSAI B2B',  url: 'guiasai.com',      estado: 'production', desc: 'Portal agencias' },
            { nombre: 'Trade Dashboard', url: 'local',         estado: 'local',      desc: 'Crypto personal' },
            { nombre: 'IglesiaTAFE',  url: 'local',            estado: 'dev',        desc: 'Ministerio digital' },
            { nombre: 'Agua App',     url: 'local',            estado: 'dev',        desc: 'Gestión agua' },
          ].map(p => (
            <div key={p.nombre} className="flex items-center gap-3 py-2 border-b border-gray-700/30 last:border-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                p.estado === 'production' ? 'bg-emerald-400' :
                p.estado === 'dev'        ? 'bg-blue-400' :
                                            'bg-yellow-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">{p.nombre}</p>
                <p className="text-[10px] text-gray-500">{p.desc}</p>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                p.estado === 'production' ? 'bg-emerald-900/50 text-emerald-400' :
                p.estado === 'dev'        ? 'bg-blue-900/50 text-blue-400' :
                                            'bg-yellow-900/50 text-yellow-400'
              }`}>
                {p.estado === 'production' ? '🚀 LIVE' : p.estado === 'dev' ? '🔧 DEV' : '💻 LOCAL'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'mapa',     label: 'Mapa',    icon: <Map size={14} />           },
  { key: 'kanban',   label: 'Kanban',  icon: <Kanban size={14} />  },
  { key: 'sistema',  label: 'Sistema', icon: <Activity size={14} />      },
  { key: 'metricas', label: 'Métricas',icon: <BarChart3 size={14} />     },
];

const AdminControlPanel: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [tab, setTab] = useState<Tab>('metricas');

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      {/* ── Header ────────────────────────────────── */}
      <header className="px-5 pt-12 pb-0 bg-gray-900 sticky top-0 z-20 border-b border-gray-800/60">
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-black leading-tight">Panel de Control</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">GuanaGO · Sky Stephens</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-black uppercase tracking-wide transition-all border-b-2 ${
                tab === t.key
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-600 hover:text-gray-400'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Tab content ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'mapa' && (
          <div className="h-[calc(100vh-140px)]">
            <AdminMapaMental onBack={() => setTab('metricas')} onNavigate={onNavigate} />
          </div>
        )}
        {tab === 'kanban' && (
          <KanbanTab
            onNavigateTorre={onNavigate ? () => onNavigate(AppRoute.ADMIN_TORRE_CONTROL) : undefined}
          />
        )}
        {tab === 'sistema' && <SistemaTab />}
        {tab === 'metricas' && <MetricasTab />}
      </div>
    </div>
  );
};

export default AdminControlPanel;
