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
  WifiOff, ChevronRight, Pencil, Eye, RotateCcw, Check,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { auth } from '../../lib/firebase';
import { loadDocContent, saveDocContent } from '../../services/docsContentService';
import GuanaPointsTab from './GuanaPointsTab';
import type { Phase, ExtraDoc, ContextDoc } from '../../services/commandCenterService';
import {
  loadRoadmapPhases, saveRoadmapPhases,
  loadExtraDocs, addExtraDoc, deleteExtraDoc,
  loadContextDocs, saveContextDoc as saveCtxDoc,
  updateContextDoc, deleteContextDoc,
} from '../../services/commandCenterService';
import type { ProjectTask, TaskStatus, TaskPriority, TaskCategory } from '../../types';

// ── Constantes ────────────────────────────────────────────────────────────────

const SKY_EMAIL = 'skysk8ing@gmail.com';
const AT_KEY    = import.meta.env.VITE_AIRTABLE_API_KEY;
const AT_BASE   = import.meta.env.VITE_AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AT_URL    = `https://api.airtable.com/v0/${AT_BASE}`;

type Tab = 'tareas' | 'avance' | 'rag' | 'ecosistema' | 'estrategia' | 'sistema' | 'traduccion' | 'docs';
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

async function atPatch(table: string, id: string, fields: Record<string, any>) {
  if (!AT_KEY) throw new Error('No AT_KEY');
  const res = await fetch(`${AT_URL}/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`AT PATCH ${res.status}`);
  return res.json();
}

async function atPost(table: string, fields: Record<string, any>) {
  if (!AT_KEY) throw new Error('No AT_KEY');
  const res = await fetch(`${AT_URL}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }] }),
  });
  if (!res.ok) throw new Error(`AT POST ${res.status}`);
  return (await res.json()).records?.[0];
}

async function atDeleteRec(table: string, id: string) {
  if (!AT_KEY) throw new Error('No AT_KEY');
  await fetch(`${AT_URL}/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${AT_KEY}` },
  });
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

const RAG_TABLE = 'Procedimientos_RAG';
const AUDIENCIAS = [{ value: 'chatbot_publico', label: 'Público (chatbot)' }, { value: 'admin_interno', label: 'Interno (admin)' }];
const EMPTY_RAG: Omit<RagRecord, 'id'> = { titulo: '', categoria: '', audiencia: 'chatbot_publico', activo: true, contenido: '', triggers: '' };

function RagForm({
  draft, setDraft, onSave, onCancel, saving, label,
}: {
  draft: Omit<RagRecord, 'id'>;
  setDraft: React.Dispatch<React.SetStateAction<Omit<RagRecord, 'id'>>>;
  onSave: () => void; onCancel: () => void; saving: boolean; label: string;
}) {
  const inp = 'w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600';
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Título *</label>
          <input className={inp} value={draft.titulo} onChange={e => setDraft(d => ({ ...d, titulo: e.target.value }))} placeholder="Nombre del procedimiento" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Categoría</label>
          <input className={inp} value={draft.categoria} onChange={e => setDraft(d => ({ ...d, categoria: e.target.value }))} placeholder="ej. Transporte" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Audiencia</label>
          <select className={inp} value={draft.audiencia} onChange={e => setDraft(d => ({ ...d, audiencia: e.target.value }))}>
            {AUDIENCIAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2 pb-1.5">
          <label className="text-[10px] text-gray-500">Activo</label>
          <button type="button" onClick={() => setDraft(d => ({ ...d, activo: !d.activo }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${draft.activo ? 'bg-emerald-600' : 'bg-gray-600'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${draft.activo ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <span className="text-[10px] text-gray-400">{draft.activo ? 'Sí' : 'No'}</span>
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Triggers (palabras clave)</label>
        <textarea className={`${inp} resize-none h-12`} value={draft.triggers} onChange={e => setDraft(d => ({ ...d, triggers: e.target.value }))} placeholder="taxi, transporte, movilizarme..." />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Contenido ES</label>
        <textarea className={`${inp} resize-none h-28`} value={draft.contenido} onChange={e => setDraft(d => ({ ...d, contenido: e.target.value }))} placeholder="Respuesta que dará el chatbot..." />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving || !draft.titulo.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold disabled:opacity-40 transition-colors">
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} {label}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-[11px] transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ModuloRAG() {
  const [records, setRecords]     = useState<RagRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<RagRecord, 'id'>>(EMPTY_RAG);
  const [showNew, setShowNew]     = useState(false);
  const [newDraft, setNewDraft]   = useState<Omit<RagRecord, 'id'>>(EMPTY_RAG);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const recs = await atFetch(RAG_TABLE, '?pageSize=100&sort[0][field]=Categoria&sort[0][direction]=asc');
      setRecords(recs.map((r: any) => ({
        id: r.id,
        titulo: r.fields.Titulo || r.fields.titulo || 'Sin título',
        categoria: r.fields.Categoria || r.fields.categoria || 'General',
        audiencia: r.fields.Audiencia || r.fields.audiencia || 'chatbot_publico',
        activo: r.fields.Activo !== false,
        contenido: r.fields.Contenido_ES || r.fields.Contenido || r.fields.contenido || '',
        triggers: r.fields.Triggers_ES || r.fields.Triggers || '',
      })));
    } catch (e) { console.error('RAG load:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (r: RagRecord) => {
    setEditId(r.id);
    setEditDraft({ titulo: r.titulo, categoria: r.categoria, audiencia: r.audiencia, activo: r.activo, contenido: r.contenido, triggers: r.triggers });
    setExpanded(r.id);
    setShowNew(false);
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await atPatch(RAG_TABLE, editId, { Titulo: editDraft.titulo, Categoria: editDraft.categoria, Audiencia: editDraft.audiencia, Activo: editDraft.activo, Contenido_ES: editDraft.contenido, Triggers_ES: editDraft.triggers });
      setRecords(rs => rs.map(r => r.id === editId ? { id: editId, ...editDraft } : r));
      setEditId(null);
      showToast('✓ Guardado en Airtable');
    } catch (e: any) { showToast('✗ ' + e.message); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    if (!newDraft.titulo.trim()) return;
    setSaving(true);
    try {
      const created = await atPost(RAG_TABLE, { Titulo: newDraft.titulo, Categoria: newDraft.categoria, Audiencia: newDraft.audiencia, Activo: newDraft.activo, Contenido_ES: newDraft.contenido, Triggers_ES: newDraft.triggers });
      if (created) setRecords(rs => [{ id: created.id, ...newDraft }, ...rs]);
      setShowNew(false);
      setNewDraft(EMPTY_RAG);
      showToast('✓ Registro creado');
    } catch (e: any) { showToast('✗ ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro del RAG?')) return;
    try {
      await atDeleteRec(RAG_TABLE, id);
      setRecords(rs => rs.filter(r => r.id !== id));
      showToast('✓ Eliminado');
    } catch (e: any) { showToast('✗ ' + e.message); }
  };

  const filtered = records.filter(r =>
    !search || r.titulo.toLowerCase().includes(search.toLowerCase()) ||
    r.triggers.toLowerCase().includes(search.toLowerCase()) ||
    r.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const publicos = filtered.filter(r => r.audiencia === 'chatbot_publico').length;
  const internos = filtered.filter(r => r.audiencia !== 'chatbot_publico').length;

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-xs text-gray-200 shadow-xl animate-pulse">
          {toast}
        </div>
      )}

      {/* Resumen + Nuevo */}
      <div className="flex gap-2 mb-3">
        <StatCard icon={<Brain size={10} />} label="Total RAG" value={records.length} sub="registros" colorClass="text-blue-400" />
        <StatCard icon={<Globe size={10} />} label="Públicos" value={publicos} sub="chatbot" colorClass="text-green-400" />
        <StatCard icon={<FileText size={10} />} label="Internos" value={internos} sub="admin" colorClass="text-purple-400" />
        <button
          onClick={() => { setShowNew(v => !v); setEditId(null); setExpanded(null); }}
          className={`flex-shrink-0 flex flex-col items-center justify-center px-3 rounded-xl border transition-colors text-[10px] font-semibold ${showNew ? 'bg-blue-900/40 border-blue-700 text-blue-400' : 'bg-gray-800/60 border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-800'}`}
        >
          <Plus size={14} className="mb-0.5" /> Nuevo
        </button>
      </div>

      <ProgressBar value={records.length} max={50} label="Meta: 50 registros" color="bg-blue-500" />

      {/* Formulario nuevo registro */}
      {showNew && (
        <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-3 mb-3">
          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-2">Nuevo registro RAG</div>
          <RagForm draft={newDraft} setDraft={setNewDraft} onSave={handleCreate} onCancel={() => { setShowNew(false); setNewDraft(EMPTY_RAG); }} saving={saving} label="Crear" />
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative mb-3">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título, trigger o categoría..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin mr-2" /> Cargando...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 p-3">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 cursor-pointer ${r.activo ? 'bg-emerald-500' : 'bg-gray-600'}`}
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)} />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                  <div className="text-xs font-semibold text-gray-200 truncate">{r.titulo}</div>
                  <div className="flex gap-1.5 mt-0.5">
                    <Chip label={r.categoria} className="bg-gray-700 text-gray-400" />
                    <Chip label={r.audiencia === 'chatbot_publico' ? 'público' : 'interno'}
                      className={r.audiencia === 'chatbot_publico' ? 'bg-green-900/40 text-green-400' : 'bg-purple-900/40 text-purple-400'} />
                  </div>
                </div>
                <button onClick={() => editId === r.id ? setEditId(null) : startEdit(r)}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${editId === r.id ? 'text-amber-400 bg-amber-900/30' : 'text-gray-600 hover:text-amber-400 hover:bg-amber-900/20'}`}>
                  <Pencil size={11} />
                </button>
                <div className="cursor-pointer flex-shrink-0 text-gray-600" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                  {expanded === r.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </div>
              {expanded === r.id && (
                <div className="border-t border-gray-700 px-3 pb-3 pt-2.5">
                  {editId === r.id ? (
                    <RagForm draft={editDraft} setDraft={setEditDraft} onSave={handleSave} onCancel={() => setEditId(null)} saving={saving} label="Guardar" />
                  ) : (
                    <>
                      {r.triggers && <div className="mb-2"><div className="text-[10px] text-blue-400 font-semibold mb-1">Triggers</div><div className="text-[11px] text-gray-400">{r.triggers}</div></div>}
                      {r.contenido && <div className="mb-2"><div className="text-[10px] text-gray-500 font-semibold mb-1">Contenido (ES)</div><div className="text-[11px] text-gray-300 leading-relaxed max-h-32 overflow-y-auto">{r.contenido}</div></div>}
                      <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-400 mt-1">
                        <Trash2 size={10} /> Eliminar registro
                      </button>
                    </>
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
  { id: 'guanapoints-financiero', title: 'Modelo Financiero GP', subtitle: 'Proyección 12m · Break-even · Token', desc: 'Kit físico, proyección mes a mes, break-even, token GP y simulador interactivo.', url: '/docs/guanapoints-financiero.html', color: '#00C5A3', emoji: '🪙' },
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

const PHASE_COLORS = [
  'border-red-600', 'border-orange-600', 'border-yellow-600', 'border-green-600',
  'border-blue-600', 'border-purple-600', 'border-teal-600', 'border-gray-600',
];

const DEFAULT_PHASES: Phase[] = PHASES.map((p, i) => ({ id: `default-${i}`, ...p }));

function PhaseEditor({ phase, onChange, onDelete }: {
  phase: Phase;
  onChange: (p: Phase) => void;
  onDelete: () => void;
}) {
  const [newItem, setNewItem] = useState('');
  const inp = 'bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600 w-full';
  return (
    <div className={`border-l-4 ${phase.color} pl-3 bg-gray-800/40 rounded-r-xl p-3`}>
      <div className="flex gap-2 mb-2">
        <input className={`${inp} flex-1`} value={phase.label} onChange={e => onChange({ ...phase, label: e.target.value })} placeholder="Etiqueta (ej. Sem 1 — Jun 1–7)" />
        <select className="bg-gray-900 border border-gray-700 rounded-lg px-2 text-xs text-gray-300 focus:outline-none focus:border-blue-600"
          value={phase.color} onChange={e => onChange({ ...phase, color: e.target.value })}>
          {PHASE_COLORS.map(c => <option key={c} value={c}>{c.replace('border-', '').replace('-600', '')}</option>)}
        </select>
        <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1 flex-shrink-0"><Trash2 size={12} /></button>
      </div>
      <input className={`${inp} mb-2`} value={phase.title} onChange={e => onChange({ ...phase, title: e.target.value })} placeholder="Título de la fase" />
      <div className="space-y-1 mb-2">
        {phase.items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-gray-700 text-[10px] flex-shrink-0">·</span>
            <input
              className="flex-1 bg-transparent border-b border-gray-700 text-[11px] text-gray-300 focus:outline-none focus:border-blue-600 py-0.5"
              value={item}
              onChange={e => { const items = [...phase.items]; items[i] = e.target.value; onChange({ ...phase, items }); }}
            />
            <button onClick={() => onChange({ ...phase, items: phase.items.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400 flex-shrink-0"><X size={10} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-blue-600"
          value={newItem} onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { onChange({ ...phase, items: [...phase.items, newItem.trim()] }); setNewItem(''); }}}
          placeholder="Nueva tarea... (Enter para agregar)"
        />
        <button onClick={() => { if (newItem.trim()) { onChange({ ...phase, items: [...phase.items, newItem.trim()] }); setNewItem(''); }}}
          className="px-2 py-1 rounded-lg bg-blue-800 text-blue-300 hover:bg-blue-700 text-[11px] flex-shrink-0">
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}

function ModuloEstrategia({ onNavigate }: { onNavigate: (r: AppRoute, d?: any) => void }) {
  const [docModal, setDocModal]   = useState<DocEntry | null>(null);
  const [section, setSection]     = useState<'docs' | 'guanapoints' | 'roadmap' | 'links'>('docs');

  // Editor state
  const [editMode, setEditMode]   = useState(false);
  const [editHtml, setEditHtml]   = useState('');
  const [savedHtml, setSavedHtml] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveOk, setSaveOk]       = useState(false);
  const [savedBy, setSavedBy]     = useState<string | null>(null);

  // Roadmap editable
  const [phases, setPhases]               = useState<Phase[]>([]);
  const [editingRoadmap, setEditingRoadmap] = useState(false);
  const [savingRoadmap, setSavingRoadmap]   = useState(false);
  const cachedPhases                        = useRef<Phase[]>([]);

  // Docs estratégicos extra
  const [extraDocs, setExtraDocs]     = useState<ExtraDoc[]>([]);
  const [showAddDoc, setShowAddDoc]   = useState(false);
  const [addDocDraft, setAddDocDraft] = useState({ emoji: '📄', title: '', subtitle: '', desc: '', url: '', color: '#6B8A9E' });
  const [savingDoc, setSavingDoc]     = useState(false);

  const today    = new Date();
  const launch   = new Date('2026-06-30');
  const daysLeft = Math.max(0, Math.ceil((launch.getTime() - today.getTime()) / 86400000));

  // Load saved content when a doc opens
  useEffect(() => {
    if (!docModal) { setSavedHtml(null); setEditMode(false); return; }
    setSavedHtml(null);
    setEditMode(false);
    setSaveOk(false);
    loadDocContent(docModal.id).then(data => {
      if (data) {
        setSavedHtml(data.html);
        setSavedBy(data.updatedBy ?? null);
      }
    });
  }, [docModal]);

  const handleStartEdit = async () => {
    if (!docModal) return;
    setLoadingEdit(true);
    try {
      const content = savedHtml ?? await fetch(docModal.url).then(r => r.text());
      setEditHtml(content);
      setEditMode(true);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!docModal) return;
    setSaving(true);
    try {
      const email = auth.currentUser?.email ?? 'admin';
      await saveDocContent(docModal.id, editHtml, email);
      setSavedHtml(editHtml);
      setSavedBy(email);
      setEditMode(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreOriginal = async () => {
    if (!docModal) return;
    setLoadingEdit(true);
    try {
      const original = await fetch(docModal.url).then(r => r.text());
      setEditHtml(original);
    } finally {
      setLoadingEdit(false);
    }
  };

  // Load roadmap phases from Firestore (fallback to hardcoded)
  useEffect(() => {
    loadRoadmapPhases()
      .then(ps => setPhases(ps ?? DEFAULT_PHASES))
      .catch(() => setPhases(DEFAULT_PHASES));
  }, []);

  // Load extra strategic docs from Firestore
  useEffect(() => {
    loadExtraDocs().then(setExtraDocs).catch(() => {});
  }, []);

  const handleSaveRoadmap = async () => {
    setSavingRoadmap(true);
    try {
      await saveRoadmapPhases(phases, auth.currentUser?.email ?? 'admin');
      setEditingRoadmap(false);
    } finally { setSavingRoadmap(false); }
  };

  const handleAddDoc = async () => {
    if (!addDocDraft.title.trim()) return;
    setSavingDoc(true);
    try {
      const doc = await addExtraDoc(
        { title: addDocDraft.title, subtitle: addDocDraft.subtitle, desc: addDocDraft.desc, url: addDocDraft.url, color: addDocDraft.color, emoji: addDocDraft.emoji },
        auth.currentUser?.email ?? 'admin',
      );
      setExtraDocs(eds => [...eds, doc]);
      setShowAddDoc(false);
      setAddDocDraft({ emoji: '📄', title: '', subtitle: '', desc: '', url: '', color: '#6B8A9E' });
    } finally { setSavingDoc(false); }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('¿Quitar este documento de la lista?')) return;
    await deleteExtraDoc(id);
    setExtraDocs(eds => eds.filter(e => e.id !== id));
  };

  return (
    <div>
      {/* Iframe / Editor modal */}
      {docModal && (
        <div className="fixed inset-0 z-50 bg-gray-950/95 flex flex-col">
          {/* Modal header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 flex-shrink-0">
            <span className="text-base">{docModal.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-100 truncate">{docModal.title}</div>
              <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                {docModal.subtitle}
                {savedHtml && !editMode && (
                  <span className="text-green-500 flex items-center gap-0.5">
                    <Check size={8} /> versión guardada
                  </span>
                )}
                {saveOk && (
                  <span className="text-green-400 flex items-center gap-0.5 animate-pulse">
                    <Check size={8} /> guardado
                  </span>
                )}
              </div>
            </div>

            {/* Edit / View toggle */}
            {!editMode ? (
              <button
                onClick={handleStartEdit}
                disabled={loadingEdit}
                className="text-[11px] text-amber-400 border border-amber-800/50 px-2.5 py-1.5 rounded-lg hover:border-amber-600 flex items-center gap-1 disabled:opacity-50"
              >
                {loadingEdit ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleRestoreOriginal}
                  disabled={loadingEdit}
                  title="Restaurar HTML original"
                  className="text-[11px] text-gray-400 border border-gray-700 px-2 py-1.5 rounded-lg hover:border-gray-500 flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  Original
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="text-[11px] text-blue-400 border border-blue-800/50 px-2.5 py-1.5 rounded-lg hover:border-blue-600 flex items-center gap-1"
                >
                  <Eye size={11} /> Vista
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-[11px] text-green-400 border border-green-700/60 px-2.5 py-1.5 rounded-lg hover:border-green-500 flex items-center gap-1 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                  Guardar
                </button>
              </div>
            )}

            {!editMode && (
              <a href={docModal.url} target="_blank" rel="noreferrer"
                className="text-[11px] text-gray-500 border border-gray-800 px-2 py-1.5 rounded-lg hover:border-gray-600 flex items-center gap-1">
                <ChevronRight size={11} />
              </a>
            )}
            <button onClick={() => setDocModal(null)}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0">
              <X size={14} />
            </button>
          </div>

          {/* Edit mode: HTML textarea editor */}
          {editMode ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-3 py-2 bg-gray-900/80 border-b border-gray-800 flex items-center gap-2 text-[10px] text-gray-500">
                <Pencil size={10} className="text-amber-400" />
                <span>Editando HTML de <strong className="text-gray-300">{docModal.title}</strong> — los cambios se guardan en la nube y sobreescriben el documento al visualizarlo</span>
              </div>
              <textarea
                className="flex-1 w-full bg-gray-950 text-gray-200 font-mono text-[12px] p-4 resize-none outline-none border-0 leading-relaxed"
                value={editHtml}
                onChange={e => setEditHtml(e.target.value)}
                spellCheck={false}
                style={{ tabSize: 2 }}
              />
              <div className="px-4 py-2 bg-gray-900/60 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-600">
                <span>{editHtml.length.toLocaleString()} caracteres</span>
                {savedBy && <span>Última edición: {savedBy}</span>}
              </div>
            </div>
          ) : (
            savedHtml ? (
              <iframe srcDoc={savedHtml} className="flex-1 w-full border-0" title={docModal.title} />
            ) : (
              <iframe src={docModal.url} className="flex-1 w-full border-0" title={docModal.title} loading="lazy" />
            )
          )}
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
      <div className="flex gap-1 mb-4 bg-gray-800/40 rounded-xl p-1 overflow-x-auto">
        {([['docs', '📄 Docs'], ['guanapoints', '🪙 GuanaPoints'], ['roadmap', '🗓️ Roadmap'], ['links', '🔗 Links']] as [typeof section, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)}
            className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all whitespace-nowrap min-w-fit px-2 ${
              section === id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Documentos estratégicos */}
      {section === 'docs' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              Canvas y documentos del modelo de negocio
            </div>
            <button onClick={() => setShowAddDoc(v => !v)}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-colors ${showAddDoc ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-emerald-400 hover:border-emerald-800'}`}>
              <Plus size={10} /> Agregar
            </button>
          </div>

          {showAddDoc && (
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 mb-3">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Nuevo documento estratégico</div>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Emoji</label>
                    <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600"
                      value={addDocDraft.emoji} onChange={e => setAddDocDraft(d => ({ ...d, emoji: e.target.value }))} placeholder="📄" maxLength={4} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Título *</label>
                    <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600"
                      value={addDocDraft.title} onChange={e => setAddDocDraft(d => ({ ...d, title: e.target.value }))} placeholder="Nombre del documento" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Subtítulo</label>
                    <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600"
                      value={addDocDraft.subtitle} onChange={e => setAddDocDraft(d => ({ ...d, subtitle: e.target.value }))} placeholder="Tema · Subtema" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Color (hex)</label>
                    <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600"
                      value={addDocDraft.color} onChange={e => setAddDocDraft(d => ({ ...d, color: e.target.value }))} placeholder="#00E5CC" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">URL del documento</label>
                  <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600"
                    value={addDocDraft.url} onChange={e => setAddDocDraft(d => ({ ...d, url: e.target.value }))} placeholder="/docs/mi-documento.html" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Descripción corta</label>
                  <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-600 resize-none h-12"
                    value={addDocDraft.desc} onChange={e => setAddDocDraft(d => ({ ...d, desc: e.target.value }))} placeholder="Breve descripción del contenido" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddDoc} disabled={savingDoc || !addDocDraft.title.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold disabled:opacity-40">
                    {savingDoc ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Agregar
                  </button>
                  <button onClick={() => { setShowAddDoc(false); setAddDocDraft({ emoji: '📄', title: '', subtitle: '', desc: '', url: '', color: '#6B8A9E' }); }}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-[11px]">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[...ESTRATEGIA_DOCS, ...extraDocs].map(d => {
              const isExtra = extraDocs.some(ed => ed.id === d.id);
              return (
                <div key={d.id} className="relative group">
                  <button onClick={() => setDocModal(d as DocEntry)}
                    className="w-full text-left bg-gray-800/60 border border-gray-700 hover:border-gray-500 rounded-xl p-3 transition-all active:scale-95">
                    <div className="text-xl mb-2">{d.emoji}</div>
                    <div className="text-xs font-bold text-gray-100 leading-tight mb-1">{d.title}</div>
                    <div className="text-[10px] text-gray-500 leading-tight">{d.subtitle}</div>
                    <div className="mt-2 h-0.5 rounded-full w-8" style={{ background: d.color }} />
                  </button>
                  {isExtra && (
                    <button onClick={() => handleDeleteDoc(d.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-gray-800 opacity-0 group-hover:opacity-100 hover:bg-red-900/40 text-gray-600 hover:text-red-400 transition-all">
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GuanaPoints — componente React interactivo */}
      {section === 'guanapoints' && (
        <div>
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-[#00C5A3] font-bold mb-0.5">GuanaGO · Sistema de Fidelización</p>
            <h3 className="text-sm font-extrabold text-gray-100">
              GuanaPoints <span className="text-[#00C5A3]">Ecosystem</span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Utility token · Mecánica aliados · Simulador · Roadmap agosto 2026</p>
          </div>
          <GuanaPointsTab />
        </div>
      )}

      {/* Roadmap */}
      {section === 'roadmap' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Roadmap de lanzamiento</div>
            {editingRoadmap ? (
              <div className="flex gap-1.5">
                <button onClick={handleSaveRoadmap} disabled={savingRoadmap}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50">
                  {savingRoadmap ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Guardar
                </button>
                <button onClick={() => { setPhases(cachedPhases.current); setEditingRoadmap(false); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gray-700 text-gray-300">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => { cachedPhases.current = phases.map(p => ({ ...p, items: [...p.items] })); setEditingRoadmap(true); }}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-800">
                <Pencil size={10} /> Editar
              </button>
            )}
          </div>

          {editingRoadmap ? (
            <div className="space-y-3">
              {phases.map((p, i) => (
                <PhaseEditor key={p.id} phase={p}
                  onChange={updated => setPhases(ps => ps.map((ph, j) => j === i ? updated : ph))}
                  onDelete={() => setPhases(ps => ps.filter((_, j) => j !== i))}
                />
              ))}
              <button onClick={() => setPhases(ps => [...ps, { id: Date.now().toString(), label: 'Nueva fase', color: 'border-gray-600', title: '', items: [] }])}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 text-[11px] transition-colors">
                <Plus size={12} /> Agregar fase
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {phases.map((p, i) => (
                <div key={p.id ?? i} className={`border-l-2 ${p.color} pl-3`}>
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

// ── Módulo Traducciones ───────────────────────────────────────────────────────

function ModuloTraduccion({ onNavigate }: { onNavigate: (r: AppRoute, d?: any) => void }) {
  const [status, setStatus]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState(false);
  const [msg, setMsg]           = useState('');
  const [limit, setLimit]       = useState(10);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/translate/status');
      setStatus(await r.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const translate = async (lang: 'EN' | 'PT' | 'ALL') => {
    setRunning(true);
    setMsg(`Traduciendo con Claude Haiku (lote ${limit})…`);
    try {
      const r = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, limit }),
      });
      const d = await r.json();
      setMsg(`✅ ${d.ok} traducidos · ${d.errors} errores`);
      loadStatus();
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally { setRunning(false); }
  };

  return (
    <div>
      {/* Acceso rápido a la vista completa */}
      <button
        onClick={() => onNavigate(AppRoute.ADMIN_TRADUCCION)}
        className="w-full flex items-center gap-3 bg-blue-950/40 border border-blue-800/40 hover:border-blue-600 rounded-xl p-3 mb-4 transition-colors text-left"
      >
        <Globe size={18} className="text-blue-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-300">Abrir Centro de Traducciones completo</div>
          <div className="text-[10px] text-gray-500">Ver todos los registros, editar manualmente, progreso detallado</div>
        </div>
        <ChevronRight size={14} className="text-gray-600" />
      </button>

      {/* KPIs */}
      {loading ? (
        <div className="flex items-center justify-center h-16 text-gray-500 text-sm">
          <Loader2 size={14} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : status ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(['EN', 'PT'] as const).map(l => {
            const s = status[l];
            return (
              <div key={l} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold">{l === 'EN' ? '🇬🇧 English' : '🇧🇷 Português'}</span>
                  <span className={s.pct === 100 ? 'text-emerald-400 font-bold' : 'text-yellow-400 font-bold'}>{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full ${l === 'EN' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${s.pct}%` }} />
                </div>
                <div className="text-[10px] text-gray-500">{s.translated}/{status.total} · {s.pending} pendientes</div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Controles batch */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
          <Zap size={12} className="text-yellow-400" /> Traducción automática con Claude
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          Lote de
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-xs focus:outline-none">
            {[5, 10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          registros
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['EN', 'PT', 'ALL'] as const).map(l => (
            <button key={l} onClick={() => translate(l)} disabled={running}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors ${
                l === 'EN' ? 'bg-blue-700 hover:bg-blue-600 text-white' :
                l === 'PT' ? 'bg-green-700 hover:bg-green-600 text-white' :
                'bg-purple-700 hover:bg-purple-600 text-white'
              }`}>
              {running ? <Loader2 size={11} className="animate-spin" /> : <Globe size={11} />}
              {l === 'ALL' ? 'EN + PT' : `Traducir ${l}`}
            </button>
          ))}
          <button onClick={loadStatus} disabled={loading} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 disabled:opacity-50">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        {msg && <p className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-2">{msg}</p>}
      </div>
    </div>
  );
}

// ── Módulo Docs ───────────────────────────────────────────────────────────────

interface DocFile {
  slug: string; nombre: string; ruta: string; titulo: string;
  carpeta: string; categoria: string; tamaño: number; modificado: string;
}

const CAT_COLOR: Record<string, string> = {
  'Roadmap':       'bg-yellow-900/40 text-yellow-300',
  'Aliados':       'bg-emerald-900/40 text-emerald-300',
  'Pagos':         'bg-green-900/40 text-green-300',
  'Integraciones': 'bg-blue-900/40 text-blue-300',
  'DevOps':        'bg-purple-900/40 text-purple-300',
  'Arquitectura':  'bg-cyan-900/40 text-cyan-300',
  'Contexto':      'bg-orange-900/40 text-orange-300',
  'Alojamientos':  'bg-teal-900/40 text-teal-300',
  'Otros':         'bg-gray-800 text-gray-400',
};

const CTX_CATS = ['Contexto', 'Estrategia', 'Técnico', 'Operativo', 'Comercial', 'Otro'];

function ModuloDocs() {
  const [docs, setDocs]         = useState<DocFile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('');
  const [selected, setSelected] = useState<{ slug: string; contenido: string; titulo: string } | null>(null);
  const [loadingDoc, setLD]     = useState(false);

  // Docs de contexto (Firestore)
  const [ctxDocs, setCtxDocs]           = useState<ContextDoc[]>([]);
  const [ctxSelected, setCtxSelected]   = useState<ContextDoc | null>(null);
  const [ctxEditing, setCtxEditing]     = useState(false);
  const [showNewCtx, setShowNewCtx]     = useState(false);
  const [ctxDraft, setCtxDraft]         = useState({ titulo: '', categoria: 'Contexto', contenido: '' });
  const [ctxEditDraft, setCtxEditDraft] = useState({ titulo: '', categoria: '', contenido: '' });
  const [savingCtx, setSavingCtx]       = useState(false);
  const [ctxToast, setCtxToast]         = useState('');

  const showCtxToast = (msg: string) => { setCtxToast(msg); setTimeout(() => setCtxToast(''), 2500); };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await fetch('/api/docs'); const d = await r.json(); setDocs(d.files || []); }
      catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    loadContextDocs().then(setCtxDocs).catch(() => {});
  }, []);

  const openDoc = async (slug: string, titulo: string) => {
    setLD(true);
    try {
      const r = await fetch(`/api/docs/${encodeURIComponent(slug)}`);
      const d = await r.json();
      setSelected({ slug, contenido: d.contenido || '', titulo });
    } finally { setLD(false); }
  };

  const handleCreateCtx = async () => {
    if (!ctxDraft.titulo.trim()) return;
    setSavingCtx(true);
    try {
      const created = await saveCtxDoc(ctxDraft, auth.currentUser?.email ?? 'admin');
      setCtxDocs(ds => [...ds, created]);
      setShowNewCtx(false);
      setCtxDraft({ titulo: '', categoria: 'Contexto', contenido: '' });
      showCtxToast('✓ Documento creado');
    } catch (e: any) { showCtxToast('✗ ' + e.message); }
    finally { setSavingCtx(false); }
  };

  const handleUpdateCtx = async () => {
    if (!ctxSelected) return;
    setSavingCtx(true);
    try {
      await updateContextDoc(ctxSelected.id, ctxEditDraft, auth.currentUser?.email ?? 'admin');
      const updated = { ...ctxSelected, ...ctxEditDraft };
      setCtxDocs(ds => ds.map(d => d.id === ctxSelected.id ? updated : d));
      setCtxSelected(updated);
      setCtxEditing(false);
      showCtxToast('✓ Actualizado');
    } catch (e: any) { showCtxToast('✗ ' + e.message); }
    finally { setSavingCtx(false); }
  };

  const handleDeleteCtx = async (id: string) => {
    if (!confirm('¿Eliminar este documento de contexto?')) return;
    await deleteContextDoc(id);
    setCtxDocs(ds => ds.filter(d => d.id !== id));
    setCtxSelected(null);
    showCtxToast('✓ Eliminado');
  };

  const categorias = [...new Set(docs.map(d => d.categoria))].sort();
  const filtered = docs.filter(d => {
    const matchSearch = !search || d.titulo.toLowerCase().includes(search.toLowerCase()) || d.nombre.toLowerCase().includes(search.toLowerCase()) || d.categoria.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!catFilter || d.categoria === catFilter);
  });

  const inpCtx = 'w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600';

  // Vista de doc de contexto seleccionado
  if (ctxSelected) {
    return (
      <div>
        {ctxToast && <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-xs text-gray-200 shadow-xl">{ctxToast}</div>}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => { setCtxSelected(null); setCtxEditing(false); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1.5 bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={12} /> Volver
          </button>
          <span className="flex-1 text-xs text-gray-300 font-semibold truncate">{ctxSelected.titulo}</span>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${CAT_COLOR[ctxSelected.categoria] || CAT_COLOR.Otros}`}>{ctxSelected.categoria}</span>
        </div>
        {ctxEditing ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Título</label>
                <input className={inpCtx} value={ctxEditDraft.titulo} onChange={e => setCtxEditDraft(d => ({ ...d, titulo: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Categoría</label>
                <select className={inpCtx} value={ctxEditDraft.categoria} onChange={e => setCtxEditDraft(d => ({ ...d, categoria: e.target.value }))}>
                  {CTX_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Contenido</label>
              <textarea className={`${inpCtx} resize-y min-h-[40vh]`} value={ctxEditDraft.contenido} onChange={e => setCtxEditDraft(d => ({ ...d, contenido: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleUpdateCtx} disabled={savingCtx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] disabled:opacity-40">
                {savingCtx ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Guardar
              </button>
              <button onClick={() => setCtxEditing(false)} className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-[11px]">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 overflow-auto max-h-[60vh] mb-3">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{ctxSelected.contenido}</pre>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCtxEditing(true); setCtxEditDraft({ titulo: ctxSelected.titulo, categoria: ctxSelected.categoria, contenido: ctxSelected.contenido }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/30 border border-amber-800/50 text-amber-400 text-[11px] hover:border-amber-600">
                <Pencil size={11} /> Editar
              </button>
              <button onClick={() => handleDeleteCtx(ctxSelected.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-900/40 text-red-400 text-[11px] hover:border-red-700">
                <Trash2 size={11} /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Vista de doc del proyecto seleccionado
  if (selected) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1.5 bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={12} /> Volver
          </button>
          <span className="text-xs text-gray-500 truncate flex-1">{selected.titulo}</span>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 overflow-auto max-h-[70vh]">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{selected.contenido}</pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      {ctxToast && <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-xs text-gray-200 shadow-xl">{ctxToast}</div>}

      {/* ── Sección: Docs de contexto (Firestore) ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">📝 Docs de contexto</div>
          <button onClick={() => setShowNewCtx(v => !v)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-colors ${showNewCtx ? 'bg-orange-900/30 border-orange-700 text-orange-400' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-orange-400 hover:border-orange-800'}`}>
            <Plus size={10} /> Nuevo
          </button>
        </div>

        {showNewCtx && (
          <div className="bg-orange-950/20 border border-orange-800/40 rounded-xl p-3 mb-3">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Título *</label>
                  <input className={inpCtx} value={ctxDraft.titulo} onChange={e => setCtxDraft(d => ({ ...d, titulo: e.target.value }))} placeholder="Nombre del documento" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Categoría</label>
                  <select className={inpCtx} value={ctxDraft.categoria} onChange={e => setCtxDraft(d => ({ ...d, categoria: e.target.value }))}>
                    {CTX_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Contenido (markdown, texto libre)</label>
                <textarea className={`${inpCtx} resize-y min-h-[120px]`} value={ctxDraft.contenido} onChange={e => setCtxDraft(d => ({ ...d, contenido: e.target.value }))} placeholder="Escribe el contenido del documento de contexto..." />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleCreateCtx} disabled={savingCtx || !ctxDraft.titulo.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-[11px] disabled:opacity-40">
                  {savingCtx ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Crear
                </button>
                <button onClick={() => { setShowNewCtx(false); setCtxDraft({ titulo: '', categoria: 'Contexto', contenido: '' }); }}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-[11px]">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {ctxDocs.length > 0 ? (
          <div className="space-y-1.5">
            {ctxDocs.map(d => (
              <button key={d.id} onClick={() => setCtxSelected(d)}
                className="w-full text-left bg-orange-950/20 border border-orange-900/40 hover:border-orange-700/60 rounded-xl px-3 py-2.5 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 text-[11px]">📝</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-200 truncate">{d.titulo}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{d.categoria} · {d.contenido.slice(0, 60).replace(/\n/g, ' ')}…</div>
                  </div>
                  <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-gray-600 text-center py-3 border border-dashed border-gray-800 rounded-xl">
            Sin docs de contexto. Crea el primero arriba.
          </div>
        )}
      </div>

      <div className="h-px bg-gray-800 mb-4" />

      {/* ── Archivos del proyecto ── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar docs del proyecto..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600" />
        </div>
        <select value={catFilter} onChange={e => setCat(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-600">
          <option value="">Todas</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
          <Loader2 size={16} className="animate-spin mr-2" /> Cargando...
        </div>
      ) : (
        <>
          <div className="text-[11px] text-gray-500 mb-3">{filtered.length} de {docs.length} archivos del proyecto</div>
          <div className="space-y-1.5">
            {filtered.map(doc => (
              <button key={doc.slug} onClick={() => openDoc(doc.slug, doc.titulo)}
                className="w-full text-left bg-gray-800/60 border border-gray-700 hover:border-gray-500 rounded-xl px-3 py-2.5 transition-colors">
                <div className="flex items-start gap-2">
                  <FileText size={12} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-200 truncate leading-tight">{doc.titulo}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${CAT_COLOR[doc.categoria] || CAT_COLOR.Otros}`}>{doc.categoria}</span>
                      <span className="text-[9px] text-gray-600">{doc.carpeta} · {doc.nombre}</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-gray-600 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
          {loadingDoc && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex items-center gap-3 text-sm text-gray-300">
                <Loader2 size={16} className="animate-spin" /> Cargando documento...
              </div>
            </div>
          )}
        </>
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

  const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode; roles: AccessLevel[] }[] = [
    { id: 'tareas',      label: 'Tareas',       icon: <CheckSquare size={13} />, roles: ['sky', 'admin', 'marta'] },
    { id: 'avance',      label: 'Avance',       icon: <BarChart3 size={13} />,   roles: ['sky', 'marta', 'admin'] },
    { id: 'rag',         label: 'RAG',          icon: <Brain size={13} />,       roles: ['sky', 'admin', 'marta'] },
    { id: 'ecosistema',  label: 'Ecosistema',   icon: <Users size={13} />,       roles: ['sky', 'marta', 'admin'] },
    { id: 'estrategia',  label: 'Estrategia',   icon: <Target size={13} />,      roles: ['sky', 'marta', 'admin'] },
    { id: 'traduccion',  label: 'Traducciones', icon: <Globe size={13} />,       roles: ['sky', 'admin', 'marta'] },
    { id: 'sistema',     label: 'Sistema',      icon: <Activity size={13} />,    roles: ['sky', 'admin', 'marta'] },
    { id: 'docs',        label: 'Docs',         icon: <FileText size={13} />,    roles: ['sky', 'admin', 'marta'] },
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
        {activeTab === 'tareas'      && <ModuloTareas access={access} />}
        {activeTab === 'avance'      && <ModuloAvance />}
        {activeTab === 'rag'         && <ModuloRAG />}
        {activeTab === 'ecosistema'  && <ModuloEcosistema />}
        {activeTab === 'estrategia'  && <ModuloEstrategia onNavigate={onNavigate} />}
        {activeTab === 'traduccion'  && <ModuloTraduccion onNavigate={onNavigate} />}
        {activeTab === 'sistema'     && <ModuloSistema onNavigate={onNavigate} />}
        {activeTab === 'docs'        && <ModuloDocs />}
      </div>
    </div>
  );
}
