import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Plus, RefreshCw, Download, Save, X, Edit3,
  Trash2, Search, FileText, Cpu, GitBranch, BookOpen,
  Map, Code2, MoreVertical, CheckCircle, Clock, AlertTriangle,
  Copy, Eye, EyeOff, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  getProcedimientosRAG,
  createProcedimientoRAG,
  updateProcedimientoRAG,
  deleteProcedimientoRAG,
  type ProcedimientoRAG
} from '../../services/airtableService';
import { AppRoute } from '../../types';

// ─── Cache localStorage ───────────────────────────────────────────────────────
const CACHE_KEY      = 'guanago_rag_cache_v1';
const CACHE_MAX_AGE  = 6 * 60 * 60 * 1000; // 6 horas en ms

interface CacheEntry { docs: ProcedimientoRAG[]; syncedAt: number }

const loadCache = (): CacheEntry | null => {
  try { const r = localStorage.getItem(CACHE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
};
const saveCache = (docs: ProcedimientoRAG[]) =>
  localStorage.setItem(CACHE_KEY, JSON.stringify({ docs, syncedAt: Date.now() }));

const clearCache = () => localStorage.removeItem(CACHE_KEY);

const cacheAge = (syncedAt: number): string => {
  const ms = Date.now() - syncedAt;
  const m  = Math.floor(ms / 60000);
  const h  = Math.floor(m / 60);
  if (h > 0) return `hace ${h}h ${m % 60}m`;
  if (m > 0) return `hace ${m} min`;
  return 'recién';
};

// ─── Config visual por tipo ───────────────────────────────────────────────────
const TIPO_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  'SOP':           { label: 'SOP',            color: 'text-emerald-400', bg: 'bg-emerald-900/40 border-emerald-700', icon: <BookOpen size={13} /> },
  'Spec Técnica':  { label: 'Spec Técnica',   color: 'text-blue-400',    bg: 'bg-blue-900/40 border-blue-700',      icon: <Code2 size={13} /> },
  'Decisión':      { label: 'Decisión',       color: 'text-purple-400',  bg: 'bg-purple-900/40 border-purple-700',  icon: <GitBranch size={13} /> },
  'User Flow':     { label: 'User Flow',      color: 'text-cyan-400',    bg: 'bg-cyan-900/40 border-cyan-700',      icon: <Map size={13} /> },
  'API Docs':      { label: 'API Docs',       color: 'text-orange-400',  bg: 'bg-orange-900/40 border-orange-700',  icon: <Cpu size={13} /> },
  'Research':      { label: 'Research',       color: 'text-yellow-400',  bg: 'bg-yellow-900/40 border-yellow-700',  icon: <Search size={13} /> },
  'Contexto IA':   { label: 'Contexto IA',    color: 'text-pink-400',    bg: 'bg-pink-900/40 border-pink-700',      icon: <FileText size={13} /> },
};

const TIPOS = Object.keys(TIPO_CFG);

const EMBEDDING_CFG: Record<string, { label: string; color: string }> = {
  'Procesado':  { label: 'Procesado',  color: 'text-green-400' },
  'Pendiente':  { label: 'Pendiente',  color: 'text-yellow-400' },
  'Error':      { label: 'Error',      color: 'text-red-400' },
};

// ─── Modal crear/editar ──────────────────────────────────────────────────────
interface ModalProps {
  proc?: ProcedimientoRAG;
  onSave: (data: Omit<ProcedimientoRAG, 'id'>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const ModalProc: React.FC<ModalProps> = ({ proc, onSave, onClose, saving }) => {
  const [titulo,   setTitulo]   = useState(proc?.titulo   ?? '');
  const [tipo,     setTipo]     = useState(proc?.tipo     ?? 'SOP');
  const [contenido,setContenido]= useState(proc?.contenido ?? '');
  const [modulos,  setModulos]  = useState(proc?.modulos  ?? '');
  const [tags,     setTags]     = useState(proc?.tags     ?? '');
  const [version,  setVersion]  = useState(proc?.version  ?? '1.0');
  const [autor,    setAutor]    = useState(proc?.autor    ?? 'GuanaGO Admin');
  const [idDoc,    setIdDoc]    = useState(proc?.idDocumento ?? '');
  const [preview,  setPreview]  = useState(false);

  const handleSave = async () => {
    if (!titulo.trim() || !contenido.trim()) return;
    await onSave({ titulo, tipo, contenido, modulos, tags, version, autor, idDocumento: idDoc || undefined });
  };

  const tipoCfg = TIPO_CFG[tipo] ?? TIPO_CFG['SOP'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={tipoCfg.color}>{tipoCfg.icon}</span>
            <h2 className="font-bold text-white text-sm">{proc ? 'Editar documento' : 'Nuevo documento RAG'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(p => !p)}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors
                ${preview ? 'bg-cyan-800 text-cyan-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {preview ? <EyeOff size={13} /> : <Eye size={13} />}
              {preview ? 'Editar' : 'Preview'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* ID + Título */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">ID (ej: SOP-001)</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-cyan-600"
                placeholder="SOP-001" value={idDoc} onChange={e => setIdDoc(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Título *</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-600"
                placeholder="Ej: Proceso de onboarding de Aliados" value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus />
            </div>
          </div>

          {/* Tipo + Versión + Autor */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Tipo</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-600"
                value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Versión</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-600"
                value={version} onChange={e => setVersion(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Autor</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-600"
                value={autor} onChange={e => setAutor(e.target.value)} />
            </div>
          </div>

          {/* Módulos + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Módulos relacionados</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-600"
                placeholder="Frontend | Backend | Pagos" value={modulos} onChange={e => setModulos(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Tags</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-600"
                placeholder="aliados | onboarding | qr" value={tags} onChange={e => setTags(e.target.value)} />
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500 font-bold uppercase">Contenido Markdown *</label>
              <span className="text-xs text-gray-600">{contenido.length} chars</span>
            </div>
            {preview ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-64 max-h-80 overflow-y-auto prose prose-invert prose-sm max-w-none">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{contenido || '(sin contenido)'}</pre>
              </div>
            ) : (
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-600 font-mono resize-none"
                placeholder={`# Título del procedimiento\n\n## Objetivo\nDescribe qué se logra con este procedimiento.\n\n## Pasos\n1. Paso uno\n2. Paso dos\n\n## Notas\n- Consideraciones adicionales`}
                rows={12} value={contenido} onChange={e => setContenido(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!titulo.trim() || !contenido.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Guardando...' : proc ? 'Guardar cambios' : 'Crear en Airtable'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Generador de contexto para Claude ──────────────────────────────────────
const generarContextoClaude = (procs: ProcedimientoRAG[], torreData?: any): string => {
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const sops   = procs.filter(p => p.tipo === 'SOP');
  const specs  = procs.filter(p => p.tipo === 'Spec Técnica');
  const flows  = procs.filter(p => p.tipo === 'User Flow');
  const decs   = procs.filter(p => p.tipo === 'Decisión');

  let md = `# CLAUDE.md — Contexto GuanaGO / GuiaSAI
> Generado automáticamente el ${fecha}

## ¿Qué es este proyecto?
GuanaGO es una plataforma PWA de turismo comunitario para San Andrés & Providencia, Colombia.
- **GuiaSAI** → Canal B2B (agencias de viajes, cotizador instantáneo)
- **GuanaGO** → Canal B2C (turistas y residentes)

## Stack técnico
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express en Render.com (puerto 5000)
- DB: Airtable (base: appiReH55Qhrbv4Lk)
- Hosting frontend: Render (puerto 3006 en dev)
- Automatización: Make.com (planeado)
- IA: Groq + Gemini (chatbot básico activo)

## Cómo trabajar en este proyecto
1. Leer PRIMERO este archivo
2. Revisar \`ESTADO_PROYECTO_2026.md\` para estado actual de módulos
3. Consultar la Torre de Control en Admin → Torre de Control
4. Los procedimientos SOPs están en la tabla \`Procedimientos_RAG\` de Airtable

## Módulos implementados
| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Home B2C | ✅ Activo | Tours, hoteles, mapa, carrito, wallet |
| Portal Socios | ✅ Activo | Dashboard partner, scanner QR, reservas |
| Panel Admin | ✅ Activo | KPIs, usuarios, finanzas, backend sync |
| Caribbean Night | ✅ Activo | Eventos RIMM, artistas, entradas |
| Mapa Interactivo | ✅ Activo | Mapbox + Directorio_Mapa Airtable |
| Carrito & Checkout | ⚠ Parcial | UI completa, pasarela de pago pendiente |
| Push Notifications | ❌ Pendiente | Firebase instalado, FCM no configurado |
| Pasarela Wompi/PayU | ❌ Pendiente | Prioritario para lanzamiento |

## Tablas Airtable principales
\`\`\`
ServiciosTuristicos_SAI  → Tours, hoteles, paquetes
Directorio_Mapa          → Puntos de interés en el mapa
Rimm_musicos             → Artistas Caribbean Night
Leads                    → Usuarios registrados
Reservas                 → Reservaciones
GUANA_Transacciones      → Historial puntos
Procedimientos_RAG       → SOPs y documentos de contexto (ESTE ARCHIVO)
Tareas_To_do             → Tareas del proyecto
\`\`\`

## Variables de entorno requeridas
\`\`\`bash
VITE_AIRTABLE_API_KEY=pat_...
VITE_AIRTABLE_BASE_ID=appiReH55Qhrbv4Lk
VITE_MAPBOX_API_KEY=pk_...
GROQ_API_KEY=gsk_...
\`\`\`

---

## SOPs activos (${sops.length} procedimientos)
${sops.length === 0 ? '_Sin SOPs creados aún._' : sops.map(s =>
  `### ${s.idDocumento ? `[${s.idDocumento}] ` : ''}${s.titulo}\n` +
  `**Tipo:** SOP | **Tags:** ${s.tags || 'N/A'} | **Módulos:** ${s.modulos || 'N/A'}\n\n` +
  s.contenido
).join('\n\n---\n\n')}

---

## Specs Técnicas (${specs.length})
${specs.length === 0 ? '_Sin specs._' : specs.map(s =>
  `### ${s.idDocumento ? `[${s.idDocumento}] ` : ''}${s.titulo}\n${s.contenido}`
).join('\n\n---\n\n')}

---

## Flujos de Usuario (${flows.length})
${flows.length === 0 ? '_Sin flujos._' : flows.map(s =>
  `### ${s.titulo}\n${s.contenido}`
).join('\n\n---\n\n')}

---

## Decisiones de arquitectura (${decs.length})
${decs.length === 0 ? '_Sin decisiones registradas._' : decs.map(s =>
  `### ${s.titulo}\n${s.contenido}`
).join('\n\n---\n\n')}

---
_Fin del contexto. Total documentos RAG: ${procs.length}_
`;
  return md;
};

// ─── Componente principal ────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const AdminProcedimientosRAG: React.FC<Props> = ({ onBack }) => {
  // ── Estado inicial desde cache (sin llamada a Airtable) ──────────────────
  const cache = useMemo(() => loadCache(), []);

  const [docs,       setDocs]       = useState<ProcedimientoRAG[]>(cache?.docs ?? []);
  const [syncedAt,   setSyncedAt]   = useState<number | null>(cache?.syncedAt ?? null);
  const [syncing,    setSyncing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [busqueda,   setBusqueda]   = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [modal,      setModal]      = useState<{ proc?: ProcedimientoRAG } | null>(null);
  const [menuId,     setMenuId]     = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<ProcedimientoRAG | null>(null);
  const [generando,  setGenerando]  = useState(false);
  const [copiado,    setCopiado]    = useState(false);

  // ── Sincronizar con Airtable (solo cuando se solicita explícitamente) ─────
  const sincronizar = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const data = await getProcedimientosRAG();
      setDocs(data);
      saveCache(data);
      setSyncedAt(Date.now());
    } catch {
      setError('Error al conectar con Airtable. Verifica VITE_AIRTABLE_API_KEY en .env');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Auto-sync solo si cache está vacío o expiró (>6h)
  useEffect(() => {
    const cacheVacia  = !cache || cache.docs.length === 0;
    const cacheExpirada = cache && (Date.now() - cache.syncedAt) > CACHE_MAX_AGE;
    if (cacheVacia || cacheExpirada) sincronizar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar menú al click afuera
  useEffect(() => {
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // CRUD
  const handleSave = async (data: Omit<ProcedimientoRAG, 'id'>, procId?: string) => {
    setSaving(true);
    try {
      if (procId) {
        await updateProcedimientoRAG(procId, data);
        setDocs(prev => { const n = prev.map(d => d.id === procId ? { ...d, ...data } : d); saveCache(n); return n; });
      } else {
        const nuevo = await createProcedimientoRAG(data);
        if (nuevo) setDocs(prev => { const n = [nuevo, ...prev]; saveCache(n); return n; });
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (proc: ProcedimientoRAG) => {
    const ok = await deleteProcedimientoRAG(proc.id);
    if (ok) setDocs(prev => { const n = prev.filter(d => d.id !== proc.id); saveCache(n); return n; });
    setConfirmDel(null);
  };

  // Exportar CLAUDE.md
  const exportarContexto = () => {
    setGenerando(true);
    const md = generarContextoClaude(docs);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CLAUDE.md';
    a.click();
    URL.revokeObjectURL(a.href);
    setTimeout(() => setGenerando(false), 800);
  };

  const copiarContexto = async () => {
    const md = generarContextoClaude(docs);
    await navigator.clipboard.writeText(md);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Filtrado
  const docsFiltrados = docs.filter(d => {
    const matchTipo = filtroTipo === 'todos' || d.tipo === filtroTipo;
    const q = busqueda.toLowerCase();
    const matchQ = !q || d.titulo.toLowerCase().includes(q) || d.contenido.toLowerCase().includes(q) || (d.tags ?? '').toLowerCase().includes(q);
    return matchTipo && matchQ;
  });

  const conteoTipos = TIPOS.reduce((acc, t) => ({ ...acc, [t]: docs.filter(d => d.tipo === t).length }), {} as Record<string, number>);

  return (
    <div className="bg-gray-950 min-h-screen text-white pb-28 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold leading-none">Procedimientos RAG</h1>
          <p className="text-gray-500 text-xs truncate">
            {docs.length} docs · cache local
            {syncedAt ? <span className="text-gray-600"> · sync {cacheAge(syncedAt)}</span> : <span className="text-yellow-600"> · sin sync</span>}
          </p>
        </div>
        <button
          onClick={sincronizar}
          disabled={syncing}
          title="Sincronizar con Airtable"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-50 text-xs border border-gray-700">
          <RefreshCw size={13} className={syncing ? 'animate-spin text-cyan-400' : ''} />
          {syncing ? 'Sync…' : 'Sync'}
        </button>
        <button onClick={() => setModal({})}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-xs font-bold text-white">
          <Plus size={14} /> Nuevo
        </button>
      </header>

      {/* Generador de contexto Claude */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-gradient-to-r from-purple-950 to-blue-950 border border-purple-700 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu size={15} className="text-purple-400" /> Generador de Contexto para Claude Code
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                Exporta un <strong className="text-white">CLAUDE.md</strong> con todos los SOPs, specs y el estado del proyecto.
                Claude Code lo leerá automáticamente al iniciar cada sesión.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={exportarContexto} disabled={generando}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-xl text-xs font-bold text-white disabled:opacity-50">
              <Download size={13} className={generando ? 'animate-bounce' : ''} />
              {generando ? 'Generando...' : 'Descargar CLAUDE.md'}
            </button>
            <button onClick={copiarContexto}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors
                ${copiado ? 'bg-green-800 border-green-600 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}>
              {copiado ? <CheckCircle size={13} /> : <Copy size={13} />}
              {copiado ? '¡Copiado!' : 'Copiar al portapapeles'}
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            Coloca el archivo descargado en: <code className="text-gray-500">GuanaGo-App-Enero-main/CLAUDE.md</code>
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 bg-red-950 border border-red-700 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Filtros por tipo */}
      <div className="px-4 pb-2 pt-1 flex gap-2 overflow-x-auto">
        <button onClick={() => setFiltroTipo('todos')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors
            ${filtroTipo === 'todos' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
          Todos ({docs.length})
        </button>
        {TIPOS.filter(t => conteoTipos[t] > 0 || filtroTipo === t).map(t => {
          const cfg = TIPO_CFG[t];
          return (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors flex items-center gap-1
                ${filtroTipo === t ? `${cfg.bg} ${cfg.color} border-current` : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              {cfg.icon} {t} ({conteoTipos[t] ?? 0})
            </button>
          );
        })}
      </div>

      {/* Búsqueda */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600"
            placeholder="Buscar por título, contenido o tags..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="px-4 space-y-2">
        {syncing && (
          <div className="py-12 text-center text-gray-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-sm">Cargando desde Airtable...</p>
          </div>
        )}

        {!syncing && docsFiltrados.length === 0 && (
          <div className="py-12 text-center text-gray-600">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{busqueda || filtroTipo !== 'todos' ? 'Sin resultados para ese filtro' : 'No hay documentos en Procedimientos_RAG'}</p>
            <button onClick={() => setModal({})} className="mt-3 text-cyan-500 text-sm hover:underline">
              + Crear el primer documento
            </button>
          </div>
        )}

        {!syncing && docsFiltrados.map(doc => {
          const tipoCfg = TIPO_CFG[doc.tipo] ?? TIPO_CFG['SOP'];
          const expanded = expandedId === doc.id;

          return (
            <div key={doc.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              {/* Fila principal */}
              <div className="flex items-start gap-3 p-3">
                <button className="flex-shrink-0 mt-0.5 text-gray-600 hover:text-gray-400"
                  onClick={() => setExpandedId(expanded ? null : doc.id)}>
                  {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.idDocumento && (
                      <span className="text-xs font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded flex-shrink-0">
                        {doc.idDocumento}
                      </span>
                    )}
                    <span className="font-semibold text-sm text-white">{doc.titulo}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 flex-shrink-0 ${tipoCfg.bg} ${tipoCfg.color}`}>
                      {tipoCfg.icon} {doc.tipo}
                    </span>
                    {doc.embeddingStatus && (
                      <span className={`text-[10px] flex items-center gap-0.5 flex-shrink-0 ${EMBEDDING_CFG[doc.embeddingStatus]?.color ?? 'text-gray-500'}`}>
                        {doc.embeddingStatus === 'Procesado' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {doc.embeddingStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {doc.modulos && <span className="text-xs text-gray-500">{doc.modulos}</span>}
                    {doc.tags && (
                      <span className="text-xs text-gray-600">
                        {doc.tags.split('|').map(t => t.trim()).filter(Boolean).map(t =>
                          <span key={t} className="mr-1">#{t}</span>
                        )}
                      </span>
                    )}
                    {doc.version && <span className="text-xs text-gray-700">v{doc.version}</span>}
                  </div>
                </div>

                {/* Menú */}
                <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setMenuId(menuId === doc.id ? null : doc.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-600 hover:text-gray-400">
                    <MoreVertical size={14} />
                  </button>
                  {menuId === doc.id && (
                    <div className="absolute right-0 top-7 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl z-20 min-w-36">
                      <button onClick={() => { setModal({ proc: doc }); setMenuId(null); }}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-200 hover:bg-gray-700 w-full">
                        <Edit3 size={12} className="text-yellow-400" /> Editar
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(doc.contenido);
                          setMenuId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-200 hover:bg-gray-700 w-full">
                        <Copy size={12} className="text-blue-400" /> Copiar Markdown
                      </button>
                      <button onClick={() => { setConfirmDel(doc); setMenuId(null); }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-700 w-full border-t border-gray-700">
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido expandido */}
              {expanded && (
                <div className="border-t border-gray-800 p-4 bg-gray-800/30">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                    {doc.contenido || '(sin contenido)'}
                  </pre>
                  {doc.autor && (
                    <p className="text-gray-600 text-xs mt-2">Autor: {doc.autor} · {doc.ultimaActualizacion}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón nuevo al final */}
      {!syncing && (
        <div className="px-4 pt-3">
          <button onClick={() => setModal({})}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-700 hover:border-cyan-700 text-gray-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
            <Plus size={16} /> Nuevo documento RAG
          </button>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal !== null && (
        <ModalProc
          proc={modal.proc}
          saving={saving}
          onSave={(data) => handleSave(data, modal.proc?.id)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-1">¿Eliminar documento?</h3>
            <p className="text-gray-400 text-sm mb-1">
              <strong className="text-white">"{confirmDel.titulo}"</strong>
            </p>
            <p className="text-gray-500 text-xs mb-5">Se eliminará de Airtable permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-bold hover:bg-gray-700">Cancelar</button>
              <button onClick={() => handleDelete(confirmDel)} className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProcedimientosRAG;
