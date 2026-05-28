// pages/admin/GuanaGOCommandCenter.tsx
// Hub unificado de gestión de proyecto — reemplaza AdminSkyPanel, AdminTasks,
// DashboardAvance, AdminTorreControl y AdminControlPanel.
// Multi-rol: sky (todo), marta (avance+ecosistema+estrategia), admin (tareas+avance).

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, RefreshCw, Plus, X, Save, Edit3, Trash2,
  CheckCircle2, Clock, AlertCircle, Circle, Pause,
  BarChart3, Brain, Users, FileText, Activity,
  ChevronDown, ChevronUp, Search, Filter, Send, Loader2,
  CheckSquare, Target, Zap, Globe, Server, Database, Wifi,
  WifiOff, ChevronRight,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { auth } from '../../lib/firebase';
import {
  getTareas, createTarea, updateTarea, deleteTarea,
} from '../../services/airtableService';
import type { ProjectTask, TaskStatus, TaskPriority, TaskCategory } from '../../types';

// ── Constantes ────────────────────────────────────────────────────────────────

const SKY_EMAIL = 'skysk8ing@gmail.com';
const AT_KEY    = import.meta.env.VITE_AIRTABLE_API_KEY;
const AT_BASE   = import.meta.env.VITE_AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AT_URL    = `https://api.airtable.com/v0/${AT_BASE}`;

type Tab = 'tareas' | 'avance' | 'rag' | 'ecosistema' | 'estrategia' | 'sistema';
type AccessLevel = 'sky' | 'marta' | 'admin';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pendiente:         { label: 'Pendiente',   color: 'text-gray-400',    bg: 'bg-gray-800/60',    border: 'border-gray-700',        dot: '#6b7280' },
  en_progreso:       { label: 'En progreso', color: 'text-blue-400',    bg: 'bg-blue-900/30',    border: 'border-blue-700/50',     dot: '#3b82f6' },
  completado:        { label: 'Completado',  color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-700/50',  dot: '#10b981' },
  terminado:         { label: 'Terminado',   color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-700/50',  dot: '#10b981' },
  bloqueado:         { label: 'Bloqueado',   color: 'text-red-400',     bg: 'bg-red-900/30',     border: 'border-red-700/50',      dot: '#ef4444' },
  urgente_pendiente: { label: 'Urgente',     color: 'text-orange-400',  bg: 'bg-orange-900/30',  border: 'border-orange-700/50',   dot: '#f97316' },
};
const STATUS_FALLBACK = STATUS_CFG['pendiente'];

const PRIO_CFG: Record<string, { label: string; color: string; dot: string }> = {
  critica: { label: 'Crítica', color: 'text-red-400',    dot: 'bg-red-500' },
  alta:    { label: 'Alta',    color: 'text-orange-400', dot: 'bg-orange-400' },
  media:   { label: 'Media',   color: 'text-yellow-400', dot: 'bg-yellow-400' },
  baja:    { label: 'Baja',    color: 'text-gray-500',   dot: 'bg-gray-600' },
};
const PRIO_FALLBACK = PRIO_CFG['media'];

const CAT_COLORS: Record<string, string> = {
  frontend: 'text-blue-300', backend: 'text-purple-300', comercial: 'text-green-300',
  contenido: 'text-yellow-300', infraestructura: 'text-cyan-300', diseño: 'text-pink-300',
  desarrollo: 'text-indigo-300',
};

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

// ── Helpers Airtable ──────────────────────────────────────────────────────────

async function atFetch(table: string, params = '') {
  if (!AT_KEY) return [];
  const res = await fetch(`${AT_URL}/${encodeURIComponent(table)}${params}`, {
    headers: { Authorization: `Bearer ${AT_KEY}` },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}`);
  const json = await res.json();
  return json.records ?? [];
}

// ── Subcomponentes utilitarios ────────────────────────────────────────────────

function Chip({ label, className }: { label: string; className?: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}

function ProgressBar({ value, max, color = 'bg-blue-500', label }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{label}</span>
          <span className="text-gray-300 font-semibold">{value}/{max} ({pct}%)</span>
        </div>
      )}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, colorClass = 'text-white', icon }: {
  label: string; value: string | number; sub?: string; colorClass?: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex-1 min-w-[110px]">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">{icon} {label}</div>
      <div className={`text-2xl font-bold leading-none ${colorClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Módulo Tareas ─────────────────────────────────────────────────────────────

function ModuloTareas({ access }: { access: AccessLevel }) {
  const [tasks, setTasks]           = useState<ProjectTask[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<TaskStatus | 'all'>('all');
  const [search, setSearch]         = useState('');
  const [editId, setEditId]         = useState<string | null>(null);
  const [showNew, setShowNew]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [newTask, setNewTask]       = useState<Partial<ProjectTask>>({
    status: 'pendiente', prioridad: 'media', categoria: 'desarrollo',
  });

  const canEdit = access === 'sky' || access === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTareas();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newTask.titulo?.trim()) return;
    setSaving(true);
    try {
      const created = await createTarea({
        ...newTask as Omit<ProjectTask, 'id'>,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        creadoPor: auth.currentUser?.email || 'admin',
      });
      if (created) { setTasks(prev => [created, ...prev]); setShowNew(false); setNewTask({ status: 'pendiente', prioridad: 'media', categoria: 'desarrollo' }); }
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (task: ProjectTask, next: TaskStatus) => {
    const updates: Partial<ProjectTask> = {
      status: next,
      updatedAt: new Date().toISOString().split('T')[0],
      ...(next === 'completado' ? { completedAt: new Date().toISOString().split('T')[0] } : {}),
    };
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
    await updateTarea(task.id, updates);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTarea(id);
  };

  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.descripcion?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const STATUS_ORDER: TaskStatus[] = ['en_progreso', 'pendiente', 'bloqueado', 'completado'];
  const sorted = [...filtered].sort((a, b) => {
    const si = STATUS_ORDER.indexOf(a.status), sj = STATUS_ORDER.indexOf(b.status);
    if (si !== sj) return si - sj;
    const PORD: Record<TaskPriority, number> = { critica: 0, alta: 1, media: 2, baja: 3 };
    return (PORD[a.prioridad] ?? 9) - (PORD[b.prioridad] ?? 9);
  });

  const counts = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div>
      {/* Barra de herramientas */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tarea..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600"
          />
        </div>
        {canEdit && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg">
            <Plus size={13} /> Nueva
          </button>
        )}
        <button onClick={load} disabled={loading} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filtros por status */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {([['all', 'Todas', tasks.length]] as [string, string, number][])
          .concat((['pendiente', 'en_progreso', 'bloqueado', 'completado', 'terminado', 'urgente_pendiente'] as string[])
            .filter(k => counts[k] > 0)
            .map(k => [k, STATUS_CFG[k]?.label ?? k, counts[k] || 0]))
          .map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key as TaskStatus | 'all')}
              className={`whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                filter === key
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {label} <span className="opacity-60 ml-0.5">{count}</span>
            </button>
          ))}
      </div>

      {/* Formulario nueva tarea */}
      {showNew && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-blue-400 mb-3">Nueva tarea</div>
          <input
            value={newTask.titulo || ''} onChange={e => setNewTask(p => ({ ...p, titulo: e.target.value }))}
            placeholder="Título *"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 mb-2 focus:outline-none focus:border-blue-600"
          />
          <textarea
            value={newTask.descripcion || ''} onChange={e => setNewTask(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción"
            rows={2}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 mb-2 resize-none focus:outline-none focus:border-blue-600"
          />
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(['prioridad', 'categoria', 'estimacionHoras'] as const).map(field => (
              field === 'estimacionHoras' ? (
                <input
                  key={field}
                  type="number" min="0"
                  value={newTask.estimacionHoras || ''}
                  onChange={e => setNewTask(p => ({ ...p, estimacionHoras: Number(e.target.value) || undefined }))}
                  placeholder="Horas"
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600"
                />
              ) : field === 'prioridad' ? (
                <select key={field} value={newTask.prioridad || 'media'} onChange={e => setNewTask(p => ({ ...p, prioridad: e.target.value as TaskPriority }))}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600">
                  {Object.entries(PRIO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <select key={field} value={newTask.categoria || 'desarrollo'} onChange={e => setNewTask(p => ({ ...p, categoria: e.target.value as TaskCategory }))}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600">
                  {['frontend','backend','comercial','contenido','infraestructura','diseño','desarrollo'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !newTask.titulo?.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
            <button onClick={() => setShowNew(false)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
          <Loader2 size={18} className="animate-spin mr-2" /> Cargando desde Airtable...
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">No hay tareas{search ? ' con ese filtro' : ''}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onUpdate={async (id, updates) => {
                setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
                await updateTarea(id, updates);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, canEdit, onStatusChange, onDelete, onUpdate }: {
  task: ProjectTask;
  canEdit: boolean;
  onStatusChange: (t: ProjectTask, s: TaskStatus) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ProjectTask>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState({ titulo: task.titulo, descripcion: task.descripcion || '' });

  const sc = STATUS_CFG[task.status] ?? STATUS_FALLBACK;
  const pc = PRIO_CFG[task.prioridad] ?? PRIO_FALLBACK;

  const NEXT_STATUS: Record<string, TaskStatus> = {
    pendiente: 'en_progreso', en_progreso: 'completado',
    completado: 'pendiente',  terminado: 'pendiente',
    bloqueado: 'pendiente',   urgente_pendiente: 'en_progreso',
  };

  return (
    <div className={`rounded-xl border ${sc.border} bg-gray-900/80 overflow-hidden`}>
      <div className="flex items-start gap-2 p-3 cursor-pointer" onClick={() => setExpanded(p => !p)}>
        {/* Dot de status */}
        <div className="mt-0.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full mt-1" style={{ background: sc.dot }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-gray-100 leading-tight flex-1">{task.titulo}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} title={pc.label} />
              {expanded ? <ChevronUp size={12} className="text-gray-600" /> : <ChevronDown size={12} className="text-gray-600" />}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Chip label={sc.label} className={`${sc.bg} ${sc.color}`} />
            <Chip label={task.categoria} className={`bg-gray-800 ${CAT_COLORS[task.categoria] || 'text-gray-400'}`} />
            {task.estimacionHoras && (
              <span className="text-[10px] text-gray-600">{task.estimacionHoras}h</span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 px-3 pb-3 pt-2.5">
          {editing ? (
            <div>
              <input
                value={draft.titulo} onChange={e => setDraft(p => ({ ...p, titulo: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 mb-2 focus:outline-none focus:border-blue-600"
              />
              <textarea
                value={draft.descripcion} onChange={e => setDraft(p => ({ ...p, descripcion: e.target.value }))}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 resize-none mb-2 focus:outline-none focus:border-blue-600"
              />
              <div className="flex gap-2">
                <button onClick={() => { onUpdate(task.id, { titulo: draft.titulo, descripcion: draft.descripcion }); setEditing(false); }}
                  className="flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  <Save size={11} /> Guardar
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-300 px-2">Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              {task.descripcion && (
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{task.descripcion}</p>
              )}
              {task.dependeDe && task.dependeDe.length > 0 && (
                <p className="text-[10px] text-red-400 mb-2">Depende de: {task.dependeDe.join(', ')}</p>
              )}
              {task.notasIA && (
                <p className="text-[10px] text-purple-400 bg-purple-950/30 border border-purple-900/40 rounded-lg p-2 mb-2">
                  🤖 {task.notasIA}
                </p>
              )}

              {canEdit && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onStatusChange(task, NEXT_STATUS[task.status] ?? 'pendiente')}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border ${sc.bg} ${sc.color} ${sc.border}`}
                  >
                    → {(STATUS_CFG[NEXT_STATUS[task.status]] ?? STATUS_FALLBACK).label}
                  </button>
                  {task.status !== 'bloqueado' && (
                    <button onClick={() => onStatusChange(task, 'bloqueado')}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-red-900/50 bg-red-950/30 text-red-400">
                      Bloquear
                    </button>
                  )}
                  <button onClick={() => setEditing(true)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white">
                    <Edit3 size={11} />
                  </button>
                  <button onClick={() => onDelete(task.id)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-700 text-red-500 hover:border-red-900">
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Módulo Avance ─────────────────────────────────────────────────────────────

function ModuloAvance() {
  const [stats, setStats]   = useState<any>(null);
  const [tasks, setTasks]   = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getTareas();
        setTasks(data);
        const total = data.length;
        const byStatus: Record<string, number> = {};
        const byPrio: Record<string, number> = {};
        const byCat: Record<string, number> = {};
        let hEst = 0, hReal = 0;
        data.forEach(t => {
          byStatus[t.status] = (byStatus[t.status] || 0) + 1;
          byPrio[t.prioridad] = (byPrio[t.prioridad] || 0) + 1;
          byCat[t.categoria] = (byCat[t.categoria] || 0) + 1;
          hEst  += t.estimacionHoras || 0;
          hReal += t.horasReales     || 0;
        });
        const completadas = byStatus.completado || 0;
        setStats({ total, completadas, byStatus, byPrio, byCat, hEst, hReal,
          pct: total ? Math.round((completadas / total) * 100) : 0 });
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-32 text-gray-500 text-sm"><Loader2 size={18} className="animate-spin mr-2" /> Calculando...</div>;
  if (!stats) return null;

  const criticals = tasks.filter(t => t.prioridad === 'critica' && t.status !== 'completado');
  const inProgress = tasks.filter(t => t.status === 'en_progreso');
  const blocked = tasks.filter(t => t.status === 'bloqueado');

  return (
    <div>
      {/* KPIs */}
      <div className="flex gap-2 flex-wrap mb-4">
        <StatCard icon={<CheckCircle2 size={10} />} label="Completadas" value={`${stats.pct}%`} sub={`${stats.completadas}/${stats.total}`} colorClass="text-emerald-400" />
        <StatCard icon={<AlertCircle size={10} />} label="Críticas" value={criticals.length} colorClass={criticals.length > 0 ? 'text-red-400' : 'text-gray-400'} />
        <StatCard icon={<Clock size={10} />} label="En progreso" value={inProgress.length} colorClass="text-blue-400" />
        <StatCard icon={<Pause size={10} />} label="Bloqueadas" value={blocked.length} colorClass={blocked.length > 0 ? 'text-orange-400' : 'text-gray-400'} />
      </div>

      {/* Progreso total */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-300">Progreso total del proyecto</span>
          <span className="text-sm font-bold text-emerald-400">{stats.pct}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-[11px] text-gray-500">
          <span>{stats.hEst}h estimadas</span>
          {stats.hReal > 0 && <span>{stats.hReal}h reales</span>}
        </div>
      </div>

      {/* Por status */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-4">
        <div className="text-xs font-semibold text-gray-400 mb-3">Por estado</div>
        {(['pendiente', 'en_progreso', 'completado', 'terminado', 'bloqueado', 'urgente_pendiente'] as string[])
          .filter(k => (stats.byStatus[k] || 0) > 0)
          .map(k => (
            <ProgressBar key={k} value={stats.byStatus[k] || 0} max={stats.total} label={STATUS_CFG[k]?.label ?? k}
              color={k === 'completado' || k === 'terminado' ? 'bg-emerald-500' : k === 'en_progreso' ? 'bg-blue-500' : k === 'bloqueado' ? 'bg-red-500' : k === 'urgente_pendiente' ? 'bg-orange-500' : 'bg-gray-600'} />
          ))}
      </div>

      {/* Por categoría */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-4">
        <div className="text-xs font-semibold text-gray-400 mb-3">Por categoría</div>
        {Object.entries(stats.byCat)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([cat, count]) => (
            <ProgressBar key={cat} value={count as number} max={stats.total} label={cat}
              color={cat === 'backend' ? 'bg-purple-500' : cat === 'frontend' ? 'bg-blue-500' : cat === 'comercial' ? 'bg-green-500' : 'bg-yellow-500'} />
          ))}
      </div>

      {/* Tareas críticas pendientes */}
      {criticals.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4">
          <div className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
            <AlertCircle size={12} /> {criticals.length} tarea{criticals.length > 1 ? 's' : ''} crítica{criticals.length > 1 ? 's' : ''} pendiente{criticals.length > 1 ? 's' : ''}
          </div>
          {criticals.map(t => (
            <div key={t.id} className="flex items-start gap-2 py-1.5 border-b border-red-900/30 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-200">{t.titulo}</div>
                {t.status === 'bloqueado' && <div className="text-[10px] text-orange-400">Bloqueada</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Módulo RAG ────────────────────────────────────────────────────────────────

interface RagRecord { id: string; titulo: string; categoria: string; audiencia: string; activo: boolean; contenido: string; triggers: string; }

function ModuloRAG() {
  const [records, setRecords] = useState<RagRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const recs = await atFetch('Procedimientos_RAG', '?pageSize=100&sort[0][field]=Categoria&sort[0][direction]=asc');
      setRecords(recs.map((r: any) => ({
        id: r.id,
        titulo: r.fields.Titulo || r.fields.titulo || 'Sin título',
        categoria: r.fields.Categoria || r.fields.categoria || 'General',
        audiencia: r.fields.Audiencia || r.fields.audiencia || 'chatbot_publico',
        activo: r.fields.Activo !== false,
        contenido: r.fields.Contenido_ES || r.fields.Contenido || r.fields.contenido || '',
        triggers: r.fields.Triggers_ES || r.fields.Triggers || '',
      })));
    } catch (e) {
      console.error('RAG load error:', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r =>
    !search || r.titulo.toLowerCase().includes(search.toLowerCase()) ||
    r.triggers.toLowerCase().includes(search.toLowerCase()) ||
    r.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const publicos  = filtered.filter(r => r.audiencia === 'chatbot_publico').length;
  const internos  = filtered.filter(r => r.audiencia !== 'chatbot_publico').length;

  return (
    <div>
      {/* Resumen */}
      <div className="flex gap-2 mb-4">
        <StatCard icon={<Brain size={10} />} label="Total RAG" value={records.length} sub="registros" colorClass="text-blue-400" />
        <StatCard icon={<Globe size={10} />} label="Públicos" value={publicos} sub="chatbot" colorClass="text-green-400" />
        <StatCard icon={<FileText size={10} />} label="Internos" value={internos} sub="admin" colorClass="text-purple-400" />
      </div>

      <ProgressBar value={records.length} max={50} label="Meta: 50 registros" color="bg-blue-500" />

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título o trigger..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin mr-2" /> Cargando...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.activo ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-200 truncate">{r.titulo}</div>
                  <div className="flex gap-1.5 mt-0.5">
                    <Chip label={r.categoria} className="bg-gray-700 text-gray-400" />
                    <Chip label={r.audiencia === 'chatbot_publico' ? 'público' : 'interno'}
                      className={r.audiencia === 'chatbot_publico' ? 'bg-green-900/40 text-green-400' : 'bg-purple-900/40 text-purple-400'} />
                  </div>
                </div>
                {expanded === r.id ? <ChevronUp size={12} className="text-gray-600 flex-shrink-0" /> : <ChevronDown size={12} className="text-gray-600 flex-shrink-0" />}
              </div>
              {expanded === r.id && (
                <div className="border-t border-gray-700 px-3 pb-3 pt-2.5">
                  {r.triggers && (
                    <div className="mb-2">
                      <div className="text-[10px] text-blue-400 font-semibold mb-1">Triggers</div>
                      <div className="text-[11px] text-gray-400">{r.triggers}</div>
                    </div>
                  )}
                  {r.contenido && (
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold mb-1">Contenido (ES)</div>
                      <div className="text-[11px] text-gray-300 leading-relaxed max-h-32 overflow-y-auto">{r.contenido}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Módulo Ecosistema ─────────────────────────────────────────────────────────

interface LeadRecord { id: string; nombre: string; tipo: string; estado: string; canal: string; whatsapp: string; }

function ModuloEcosistema() {
  const [leads, setLeads]     = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const recs = await atFetch('Leads',
          `?filterByFormula=OR({Tipo_Cliente}='Aliado',{Tipo_Cliente}='Operador',{Tipo_Cliente}='Socio')&pageSize=50&sort[0][field]=Estado_del_Lead&sort[0][direction]=asc`);
        setLeads(recs.map((r: any) => ({
          id: r.id,
          nombre:   r.fields.Nombre || r.fields.nombre || 'Sin nombre',
          tipo:     r.fields.Tipo_Cliente || 'Aliado',
          estado:   r.fields.Estado_del_Lead || 'Nuevo',
          canal:    r.fields.Canal_Preferido || r.fields.Fuente_del_Lead || '',
          whatsapp: r.fields.WhatsApp || r.fields.Telefono || '',
        })));
      } catch (e) {
        console.error('Ecosistema load error:', e);
      } finally { setLoading(false); }
    })();
  }, []);

  const byEstado = leads.reduce((acc, l) => { acc[l.estado] = (acc[l.estado] || 0) + 1; return acc; }, {} as Record<string, number>);
  const activos = leads.filter(l => l.estado === 'Activo' || l.estado === 'Aliado').length;

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        <StatCard icon={<Users size={10} />} label="Total aliados" value={leads.length} colorClass="text-blue-400" />
        <StatCard icon={<CheckCircle2 size={10} />} label="Activos" value={activos} sub={`de ${leads.length}`} colorClass="text-emerald-400" />
      </div>

      <ProgressBar value={activos} max={5} label="Meta: 5 aliados activos" color="bg-green-500" />

      {loading ? (
        <div className="flex items-center justify-center h-24 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin mr-2" /> Cargando...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm">No hay aliados/socios en Airtable aún</div>
      ) : (
        <div className="flex flex-col gap-2">
          {leads.map(l => (
            <div key={l.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 flex-shrink-0">
                {l.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-100 truncate">{l.nombre}</div>
                <div className="flex gap-1.5 mt-0.5">
                  <Chip label={l.tipo} className="bg-gray-700 text-gray-400" />
                  <Chip label={l.estado} className={
                    l.estado === 'Activo' || l.estado === 'Aliado' ? 'bg-emerald-900/40 text-emerald-400' :
                    l.estado === 'Nuevo' ? 'bg-blue-900/40 text-blue-400' : 'bg-gray-700 text-gray-400'
                  } />
                </div>
              </div>
              {l.whatsapp && (
                <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="text-[10px] text-green-400 border border-green-900/50 px-2 py-1 rounded-lg" onClick={e => e.stopPropagation()}>
                  WA
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Módulo Estrategia ─────────────────────────────────────────────────────────

interface DocEntry {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  url: string;
  color: string;
  emoji: string;
}

const ESTRATEGIA_DOCS: DocEntry[] = [
  { id: 'canvas',     title: 'Lean Canvas',          subtitle: 'Modelo de negocio · 9 bloques',         desc: '4 segmentos, propuesta de valor única, ventaja injusta.',             url: '/docs/16may-lean-canvas.html',         color: '#38BDF8', emoji: '🎯' },
  { id: 'economico',  title: 'Modelo Económico',      subtitle: 'GuanaPoints · Proyección · LTV/CAC',    desc: 'GuanaPoints, CAC por canal, LTV/CAC 28x, proyección $16M COP/mes.',   url: '/docs/16may-modelo-economico.html',    color: '#4ADE80', emoji: '💰' },
  { id: 'avance',     title: 'Avance Estratégico',    subtitle: 'Diagnóstico · Sprints · Visión',         desc: 'Estado del proyecto, sprints de desarrollo y decisiones mayo 2026.',  url: '/docs/09may-avance-estrategico.html',  color: '#00E5CC', emoji: '📊' },
  { id: 'paquetes',   title: 'Paquetes & Promos',     subtitle: 'Explorer · Cultural · VIP',              desc: '$180K / $280K / $480K. Sistema de aprobación y distribución.',         url: '/docs/16may-paquetes-promos.html',     color: '#F5831F', emoji: '🛍️' },
  { id: 'embajadores',title: 'Embajadores',           subtitle: '3 perfiles · Mecánica · Beneficios',    desc: 'Raizal, Residente OCCRE y Freelancer. 4 niveles de embajador.',        url: '/docs/16may-embajadores.html',         color: '#FFB74D', emoji: '🤝' },
  { id: 'onboarding', title: 'Onboarding Aliados',    subtitle: 'Flujo · Categorías · Pitch',             desc: '5 min, $0, 20% comisión, activo en 24h. Guía para socios.',           url: '/docs/16may-onboarding-aliados.html',  color: '#A78BFA', emoji: '🚀' },
];

const PHASES = [
  { label: 'Sem 1 — May 27–Jun 1', color: 'border-red-600',    title: 'Escrutinio + Contenido', items: ['Terminar escrutinio electoral', 'Poblar RAG: meta 35 registros', 'Cotización grupal volley', 'Command Center activo'] },
  { label: 'Sem 2 — Jun 2–8',      color: 'border-yellow-600', title: 'Código + Aliados',        items: ['Code al día en GitHub', 'Fix bugs (CotizacionView + imágenes)', 'Onboarding 5 aliados activos'] },
  { label: 'Sem 3 — Jun 9–15',     color: 'border-green-600',  title: 'MVP Turista',              items: ['Chatbot conectado a RAG', 'PWA manifest habilitado', '50 registros RAG'] },
  { label: 'Jun 20 — Soft launch', color: 'border-blue-600',   title: 'Lanzamiento turista',      items: ['guanago.travel instalable como PWA', '5 aliados activos'] },
  { label: 'Jun 30 — Público',     color: 'border-purple-600', title: 'Lanzamiento oficial',       items: ['Pasarela Wompi/PayU real', 'Perfil residente activo', 'WhatsApp Business GuanaGO'] },
];

const QUICK_LINKS = [
  { label: 'Airtable Base',  href: 'https://airtable.com/appiReH55Qhrbv4Lk', icon: '🗄️', desc: 'Base de datos principal' },
  { label: 'guanago.travel', href: 'https://guanago.travel',                  icon: '🌊', desc: 'App en producción' },
  { label: 'GitHub Repo',    href: 'https://github.com/skystephens/GuanaGo-App-v2', icon: '🐙', desc: 'Código fuente' },
  { label: 'Render',         href: 'https://dashboard.render.com',             icon: '⚡', desc: 'Backend deploy' },
  { label: 'Ecosistema',     href: '/mapa-ecosistema.html',                    icon: '🗺️', desc: 'Mapa del ecosistema' },
];

function ModuloEstrategia({ onNavigate }: { onNavigate: (r: AppRoute, d?: any) => void }) {
  const [docModal, setDocModal] = useState<DocEntry | null>(null);
  const [section, setSection]   = useState<'docs' | 'roadmap' | 'links'>('docs');

  const today    = new Date();
  const launch   = new Date('2026-06-30');
  const daysLeft = Math.max(0, Math.ceil((launch.getTime() - today.getTime()) / 86400000));

  return (
    <div>
      {/* Iframe modal */}
      {docModal && (
        <div className="fixed inset-0 z-50 bg-gray-950/95 flex flex-col">
          {/* Modal header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-shrink-0">
            <span className="text-base">{docModal.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-100 truncate">{docModal.title}</div>
              <div className="text-[10px] text-gray-500">{docModal.subtitle}</div>
            </div>
            <a href={docModal.url} target="_blank" rel="noreferrer"
              className="text-[11px] text-blue-400 border border-blue-800/50 px-2.5 py-1.5 rounded-lg hover:border-blue-600 flex items-center gap-1">
              <ChevronRight size={11} /> Nueva pestaña
            </a>
            <button onClick={() => setDocModal(null)}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <iframe
            src={docModal.url}
            className="flex-1 w-full border-0"
            title={docModal.title}
            loading="lazy"
          />
        </div>
      )}

      {/* Countdown + nav section */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{daysLeft}</div>
          <div className="text-[10px] text-gray-500">días al lanzamiento</div>
        </div>
        <button
          onClick={() => onNavigate(AppRoute.ADMIN_MAPA_MENTAL)}
          className="flex-1 bg-teal-950/40 border border-teal-800/40 hover:border-teal-600/60 rounded-xl p-3 text-center transition-colors"
        >
          <div className="text-xl mb-0.5">🗺️</div>
          <div className="text-[10px] font-semibold text-teal-400">Mapa Mental</div>
          <div className="text-[9px] text-gray-600">ReactFlow · full</div>
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-4 bg-gray-800/40 rounded-xl p-1">
        {([['docs', '📄 Documentos'], ['roadmap', '🗓️ Roadmap'], ['links', '🔗 Links']] as [typeof section, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)}
            className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all ${
              section === id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Documentos estratégicos */}
      {section === 'docs' && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-semibold">
            Canvas y documentos del modelo de negocio
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ESTRATEGIA_DOCS.map(doc => (
              <button
                key={doc.id}
                onClick={() => setDocModal(doc)}
                className="text-left bg-gray-800/60 border border-gray-700 hover:border-gray-500 rounded-xl p-3 transition-all active:scale-95"
              >
                <div className="text-xl mb-2">{doc.emoji}</div>
                <div className="text-xs font-bold text-gray-100 leading-tight mb-1">{doc.title}</div>
                <div className="text-[10px] text-gray-500 leading-tight">{doc.subtitle}</div>
                <div
                  className="mt-2 h-0.5 rounded-full w-8"
                  style={{ background: doc.color }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Roadmap */}
      {section === 'roadmap' && (
        <div className="flex flex-col gap-3">
          {PHASES.map((p, i) => (
            <div key={i} className={`border-l-2 ${p.color} pl-3`}>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{p.label}</div>
              <div className="text-xs font-semibold text-gray-200 mt-0.5 mb-1.5">{p.title}</div>
              {p.items.map((item, j) => (
                <div key={j} className="flex items-center gap-1.5 text-[11px] text-gray-400 py-0.5">
                  <Circle size={8} className="text-gray-700 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Links rápidos */}
      {section === 'links' && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
          {QUICK_LINKS.map((l, i) => (
            <a key={i} href={l.href} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/50 border-b border-gray-800 last:border-0 transition-colors">
              <span className="text-base w-6 text-center">{l.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-200">{l.label}</div>
                <div className="text-[10px] text-gray-500">{l.desc}</div>
              </div>
              <ChevronRight size={12} className="text-gray-600" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Módulo Sistema ─────────────────────────────────────────────────────────────

type CheckStatus = 'idle' | 'checking' | 'ok' | 'warn' | 'error';
interface SysCheck { label: string; status: CheckStatus; detail: string; }

function ModuloSistema({ onNavigate }: { onNavigate: (r: AppRoute, d?: any) => void }) {
  const [checks, setChecks] = useState<SysCheck[]>([
    { label: 'Backend API',     status: 'idle', detail: 'guanago-backend.onrender.com' },
    { label: 'Airtable',        status: 'idle', detail: 'base appiReH55Qhrbv4Lk' },
    { label: '/api/tasks',      status: 'idle', detail: 'Tareas_To_do' },
    { label: '/api/health',     status: 'idle', detail: 'Health endpoint' },
    { label: '/api/directory',  status: 'idle', detail: 'Directorio POIs' },
  ]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setChecks(prev => prev.map(c => ({ ...c, status: 'checking' as CheckStatus })));

    const update = (label: string, status: CheckStatus, detail: string) =>
      setChecks(prev => prev.map(c => c.label === label ? { ...c, status, detail } : c));

    // Backend raíz
    try {
      const t0 = Date.now();
      const r = await fetch('/api', { signal: AbortSignal.timeout(6000) });
      const json = await r.json();
      update('Backend API', r.ok ? 'ok' : 'error', `${Date.now() - t0}ms — v${json.version || '?'}`);
    } catch { update('Backend API', 'error', 'Sin respuesta'); }

    // Airtable directo
    try {
      const t0 = Date.now();
      const r = await fetch(`${AT_URL}/Tareas_To_do?maxRecords=1`, { headers: { Authorization: `Bearer ${AT_KEY}` }, signal: AbortSignal.timeout(8000) });
      update('Airtable', r.ok ? 'ok' : 'error', `${Date.now() - t0}ms`);
    } catch { update('Airtable', 'error', 'Sin respuesta'); }

    // /api/tasks
    try {
      const t0 = Date.now();
      const r = await fetch('/api/tasks?pageSize=1', { signal: AbortSignal.timeout(8000) });
      const json = await r.json();
      update('/api/tasks', r.ok ? 'ok' : 'warn', `${Date.now() - t0}ms — ${json.total ?? '?'} tareas`);
    } catch { update('/api/tasks', 'error', 'Sin respuesta'); }

    // /api/health
    try {
      const t0 = Date.now();
      const r = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      update('/api/health', r.ok ? 'ok' : 'warn', `${Date.now() - t0}ms`);
    } catch { update('/api/health', 'error', 'Sin respuesta'); }

    // /api/directory
    try {
      const t0 = Date.now();
      const r = await fetch('/api/directory?limit=1', { signal: AbortSignal.timeout(6000) });
      update('/api/directory', r.ok ? 'ok' : 'warn', `${Date.now() - t0}ms`);
    } catch { update('/api/directory', 'error', 'Sin respuesta'); }

    setRunning(false);
  };

  const icons: Record<CheckStatus, React.ReactNode> = {
    idle:     <Circle size={14} className="text-gray-600" />,
    checking: <Loader2 size={14} className="text-gray-400 animate-spin" />,
    ok:       <CheckCircle2 size={14} className="text-emerald-400" />,
    warn:     <AlertCircle size={14} className="text-yellow-400" />,
    error:    <AlertCircle size={14} className="text-red-400" />,
  };

  return (
    <div>
      <button onClick={run} disabled={running}
        className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-950/40 border border-blue-800/40 hover:border-blue-600/60 text-blue-400 text-sm font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
        {running ? <Loader2 size={15} className="animate-spin" /> : <Activity size={15} />}
        {running ? 'Verificando...' : 'Verificar todos los servicios'}
      </button>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
        {checks.map((c, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < checks.length - 1 ? 'border-b border-gray-800' : ''}`}>
            {icons[c.status]}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-200">{c.label}</div>
              <div className="text-[10px] text-gray-500 truncate">{c.detail}</div>
            </div>
            {c.status === 'ok' && <span className="text-[10px] text-emerald-400 font-semibold">OK</span>}
            {c.status === 'error' && <span className="text-[10px] text-red-400 font-semibold">ERROR</span>}
            {c.status === 'warn' && <span className="text-[10px] text-yellow-400 font-semibold">WARN</span>}
          </div>
        ))}
      </div>

      {/* Acceso rápido a herramientas de admin */}
      <div className="mt-4 bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-700">
          <div className="text-xs font-semibold text-gray-400">Herramientas</div>
        </div>
        <button onClick={() => onNavigate(AppRoute.ADMIN_TRADUCCION)}
          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-700/50 transition-colors text-left">
          <span className="text-lg">🌍</span>
          <div className="flex-1">
            <div className="text-xs font-semibold text-gray-200">Centro de Traducciones</div>
            <div className="text-[10px] text-gray-500">Traduce servicios EN/PT con Claude Haiku</div>
          </div>
          <ChevronRight size={13} className="text-gray-600" />
        </button>
      </div>

      <div className="mt-4 bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-400 mb-3">Variables de entorno</div>
        {[
          ['VITE_AIRTABLE_API_KEY', AT_KEY ? '✓ configurada' : '✗ faltante'],
          ['VITE_AIRTABLE_BASE_ID', AT_BASE ? '✓ ' + AT_BASE : '✗ faltante'],
          ['Render Backend', 'guanago-backend.onrender.com'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[11px] py-1 border-b border-gray-800 last:border-0">
            <span className="text-gray-500">{k}</span>
            <span className={v.startsWith('✓') ? 'text-emerald-400' : v.startsWith('✗') ? 'text-red-400' : 'text-gray-300'}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function GuanaGOCommandCenter({ onBack, onNavigate }: Props) {
  const userEmail = auth.currentUser?.email || '';
  const isSky    = userEmail === SKY_EMAIL;
  const isMarta  = userEmail.includes('marta') || userEmail.includes('porras');

  const access: AccessLevel = isSky ? 'sky' : isMarta ? 'marta' : 'admin';

  // Todos los admins tienen acceso completo al Command Center
  const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode; roles: AccessLevel[] }[] = [
    { id: 'tareas',     label: 'Tareas',      icon: <CheckSquare size={13} />,  roles: ['sky', 'admin', 'marta'] },
    { id: 'avance',     label: 'Avance',      icon: <BarChart3 size={13} />,    roles: ['sky', 'marta', 'admin'] },
    { id: 'rag',        label: 'RAG',         icon: <Brain size={13} />,        roles: ['sky', 'admin', 'marta'] },
    { id: 'ecosistema', label: 'Ecosistema',  icon: <Users size={13} />,        roles: ['sky', 'marta', 'admin'] },
    { id: 'estrategia', label: 'Estrategia',  icon: <Target size={13} />,       roles: ['sky', 'marta', 'admin'] },
    { id: 'sistema',    label: 'Sistema',     icon: <Activity size={13} />,     roles: ['sky', 'admin', 'marta'] },
  ];

  const tabs = ALL_TABS.filter(t => t.roles.includes(access));
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.id || 'avance');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold leading-tight">GuanaGO Command Center</h1>
            <p className="text-[10px] text-gray-500">
              {isSky ? '🌊 Sky · Superadmin' : isMarta ? '✈️ Marta · CEO' : '🔧 Admin'}
              {' · '}Sprint mayo–jun 2026
            </p>
          </div>
          <Zap size={16} className="text-blue-500" />
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-3 pb-2 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Contenido */}
      <div className="px-4 py-4 pb-10">
        {activeTab === 'tareas'     && <ModuloTareas access={access} />}
        {activeTab === 'avance'     && <ModuloAvance />}
        {activeTab === 'rag'        && <ModuloRAG />}
        {activeTab === 'ecosistema' && <ModuloEcosistema />}
        {activeTab === 'estrategia' && <ModuloEstrategia onNavigate={onNavigate} />}
        {activeTab === 'sistema'    && <ModuloSistema onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
