import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, Trash2, Download, Sparkles,
  AlertCircle, Loader2, ChevronDown, Plus, X, Save,
  ShoppingCart, BarChart2, Map,
} from 'lucide-react';
import type { SeccionControl, TareaControl, Prioridad } from './AdminTorreControl';

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentMode = 'admin' | 'cotizador' | 'turista';

interface AgentAction {
  action: string;
  seccion?: string;
  titulo?: string;
  descripcion?: string;
  prioridad?: Prioridad;
  items?: any[];
  total?: number;
  personas?: number;
  cotizacionId?: string;
  filter?: string;
}

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  action?: AgentAction | null;
  mode?: AgentMode;
}

interface Props {
  secciones: SeccionControl[];
  onAddTarea?: (seccionId: string, tarea: TareaControl) => void;
}

interface MiniModalTarea {
  msgIndex: number;
  titulo: string;
  descripcion: string;
  seccionId: string;
  prioridad: Prioridad;
}

const genId = () => `ia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ─── Modo config ──────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<AgentMode, {
  label: string;
  placeholder: string;
  color: string;
  bg: string;
  border: string;
  quickActions: { label: string; prompt: string }[];
}> = {
  admin: {
    label: 'Estrategia CEO',
    placeholder: '¿Qué priorizo hoy? ¿Cómo avanzo en Firebase? ¿Cómo llego a ANATO?...',
    color: 'text-violet-300',
    bg: 'bg-violet-950/30',
    border: 'border-violet-600',
    quickActions: [
      { label: '¿Qué priorizar hoy?', prompt: '¿Cuales son las 3 tareas mas criticas y urgentes en las que debo enfocarme hoy? Justifica con base en el estado actual del proyecto.' },
      { label: 'Analizar bloqueos', prompt: 'Identifica todos los bloqueos y dependencias entre tareas. ¿Que esta frenando el avance del proyecto?' },
      { label: 'Resumen ejecutivo', prompt: 'Dame un resumen ejecutivo del estado actual del proyecto GuanaGO: avance por seccion, riesgos principales y proximos hitos.' },
      { label: 'Plan lanzamiento beta', prompt: 'Con base en las tareas pendientes, cual seria el plan minimo para hacer un lanzamiento beta funcional? Ordena las acciones por dependencia.' },
      { label: 'Estrategia Firebase + IA', prompt: 'Explicame paso a paso como implementar la arquitectura Firebase + Airtable + IA para GuanaGO, empezando por lo mas critico.' },
      { label: 'Ideas para monetizar', prompt: 'Basandote en el estado del proyecto y las oportunidades registradas, dame 5 ideas concretas para generar ingresos en los proximos 30 dias.' },
    ],
  },
  cotizador: {
    label: 'Cotizador',
    placeholder: 'Quiero cotizar un tour para 4 personas del 15 al 18 de abril...',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-600',
    quickActions: [
      { label: 'Tour snorkel 2 personas', prompt: 'Quiero cotizar un tour de snorkel para 2 adultos la proxima semana. ¿Que opciones tienen?' },
      { label: 'Paquete familia 4 noches', prompt: 'Necesito un paquete completo para familia de 4 (2 adultos, 2 ninos) por 4 noches en San Andres. Incluir hotel y tours.' },
      { label: 'Caribbean Night viernes', prompt: 'Quiero ir a la Caribbean Night el proximo viernes. Somos 6 personas adultas. ¿Cuanto cuesta?' },
      { label: 'Solo hotel 3 noches', prompt: 'Solo necesito alojamiento para 2 personas por 3 noches. ¿Que hoteles tienen disponibles?' },
    ],
  },
  turista: {
    label: 'Guia Turistico',
    placeholder: '¿Qué puedo hacer en San Andrés? ¿Cuál es la mejor playa?...',
    color: 'text-teal-300',
    bg: 'bg-teal-950/30',
    border: 'border-teal-600',
    quickActions: [
      { label: '¿Que hacer en San Andres?', prompt: 'Soy turista por primera vez en San Andres. ¿Que actividades no me puedo perder?' },
      { label: 'Cultura raizal', prompt: 'Cuentame sobre la cultura raizal de San Andres y Providencia. Gastronomia, musica y tradiciones.' },
      { label: 'Mejores playas', prompt: '¿Cuales son las mejores playas de San Andres? ¿Como llego a cada una?' },
      { label: 'Itinerario 5 dias', prompt: 'Armame un itinerario de 5 dias en San Andres para una pareja que le gusta el mar, la comida y la vida nocturna.' },
    ],
  },
};

// ─── Build context for admin mode ────────────────────────────────────────────

function buildAdminContext(secciones: SeccionControl[]) {
  const allTareas = secciones.flatMap(s => s.tareas);
  const total = allTareas.length;
  const completadas = allTareas.filter(t => t.estado === 'completado').length;
  const enProgreso = allTareas.filter(t => t.estado === 'en_progreso').length;
  const bloqueadas = allTareas.filter(t => t.estado === 'bloqueado').length;
  const criticas = allTareas.filter(t => t.prioridad === 'critica' && t.estado !== 'completado').length;
  const progresoPct = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const tareasUrgentes = allTareas
    .filter(t => t.prioridad === 'critica' && t.estado !== 'completado')
    .slice(0, 6)
    .map(t => ({ titulo: t.titulo, descripcion: t.descripcion || '', prioridad: t.prioridad, estado: t.estado }));

  return {
    stats: { total, completadas, enProgreso, bloqueadas, criticas, progresoPct, proyectos: secciones.length },
    tareasUrgentes,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PanelIAAsistente({ secciones, onAddTarea }: Props) {
  const [mode, setMode]           = useState<AgentMode>('admin');
  const [mensajes, setMensajes]   = useState<Mensaje[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showQuick, setShowQuick] = useState(true);
  const [miniModal, setMiniModal] = useState<MiniModalTarea | null>(null);
  const [tareaCreada, setTareaCreada] = useState<number | null>(null);
  const [convId]                  = useState(() => `conv-${Date.now()}`);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cfg = MODE_CONFIG[mode];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, loading]);

  // When mode changes, reset conversation
  const changeMode = (newMode: AgentMode) => {
    setMode(newMode);
    setMensajes([]);
    setError(null);
    setShowQuick(true);
  };

  const enviar = useCallback(async (texto: string) => {
    const trimmed = texto.trim();
    if (!trimmed || loading) return;

    const nuevoMensaje: Mensaje = { role: 'user', content: trimmed, ts: Date.now(), mode };
    const historial = [...mensajes, nuevoMensaje];
    setMensajes(historial);
    setInput('');
    setLoading(true);
    setError(null);
    setShowQuick(false);

    try {
      // Build context depending on mode
      const context = mode === 'admin' ? buildAdminContext(secciones) : {};

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          mode,
          history: historial.slice(-14).map(m => ({ role: m.role, content: m.content })),
          conversationId: convId,
          context,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

      const newMsg: Mensaje = {
        role: 'assistant',
        content: data.response || data.reply || '',
        ts: Date.now(),
        action: data.action || null,
        mode,
      };
      setMensajes(prev => [...prev, newMsg]);

      // Auto-open mini modal if agent suggests creating a task
      if (data.action?.action === 'create_task' && onAddTarea) {
        const idx = historial.length; // index of the new assistant message
        setMiniModal({
          msgIndex: idx,
          titulo: data.action.titulo || '',
          descripcion: data.action.descripcion || '',
          seccionId: data.action.seccion || secciones[0]?.id || '',
          prioridad: (data.action.prioridad as Prioridad) || 'alta',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el agente');
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [mensajes, loading, secciones, mode, convId, onAddTarea]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(input); }
  };

  const abrirMiniModal = (msgIndex: number, msg: Mensaje) => {
    const lineas = msg.content.split('\n').filter(l => l.trim().length > 10);
    setMiniModal({
      msgIndex,
      titulo: msg.action?.titulo || lineas[0]?.replace(/^[#\-*>\d.]+\s*/, '').slice(0, 80) || 'Tarea desde IA',
      descripcion: msg.action?.descripcion || `Generada por Asistente IA el ${new Date().toLocaleDateString('es-CO')}`,
      seccionId: msg.action?.seccion || secciones[0]?.id || '',
      prioridad: (msg.action?.prioridad as Prioridad) || 'alta',
    });
  };

  const confirmarTarea = () => {
    if (!miniModal || !onAddTarea) return;
    const tarea: TareaControl = {
      id: genId(),
      titulo: miniModal.titulo.trim(),
      descripcion: miniModal.descripcion,
      prioridad: miniModal.prioridad,
      estado: 'pendiente',
      creadaEn: new Date().toISOString(),
      notas: 'Creada por Agente IA desde Torre de Control',
    };
    onAddTarea(miniModal.seccionId, tarea);
    setTareaCreada(miniModal.msgIndex);
    setMiniModal(null);
    setTimeout(() => setTareaCreada(null), 3000);
  };

  const limpiar = () => { setMensajes([]); setError(null); setShowQuick(true); };

  const exportarChat = () => {
    const texto = mensajes.map(m =>
      `[${m.role === 'user' ? 'YO' : 'IA'}] ${new Date(m.ts).toLocaleTimeString('es-CO')}\n${m.content}\n`
    ).join('\n---\n\n');
    const blob = new Blob(
      [`# Chat IA — GuanaGO\n${new Date().toLocaleString('es-CO')}\n\n${texto}`],
      { type: 'text/markdown' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `chat-ia-guanago ${new Date().toISOString().slice(0, 10)}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 relative">

      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-gray-800">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
              <Bot size={14} className={cfg.color} />
            </div>
            <div>
              <span className="text-sm font-bold text-white">Agente IA GuanaGO</span>
              <span className="ml-2 text-xs text-gray-600">Llama 3.3 · {cfg.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mensajes.length > 0 && (
              <>
                <button onClick={exportarChat} title="Exportar chat" className="text-gray-600 hover:text-gray-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                  <Download size={14} />
                </button>
                <button onClick={limpiar} title="Nueva conversacion" className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex border-t border-gray-800/60">
          {(Object.keys(MODE_CONFIG) as AgentMode[]).map(m => {
            const c = MODE_CONFIG[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2
                  ${active ? `${c.color} border-current ${c.bg}` : 'text-gray-500 border-transparent hover:text-gray-300'}`}
              >
                {m === 'admin' && <BarChart2 size={11} />}
                {m === 'cotizador' && <ShoppingCart size={11} />}
                {m === 'turista' && <Map size={11} />}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">

        {/* Welcome */}
        {mensajes.length === 0 && (
          <div className="flex gap-3">
            <div className={`w-7 h-7 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Bot size={13} className={cfg.color} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl rounded-tl-none p-3 text-sm text-gray-300 leading-relaxed max-w-lg">
              {mode === 'admin' && <>
                Hola. Tengo acceso al estado actual de todos tus proyectos en la Torre de Control ({secciones.length} proyectos, {secciones.flatMap(s => s.tareas).length} tareas).
                Puedo ayudarte a priorizar, analizar bloqueos, planificar el lanzamiento y crear tareas directamente.
              </>}
              {mode === 'cotizador' && <>
                Hola, soy Guana Go. Puedo cotizar tours, hoteles y paquetes para San Andres y Providencia.
                Solo dime cuantas personas son, las fechas y que les gustaria hacer.
              </>}
              {mode === 'turista' && <>
                Hola! Soy Guana, tu guia turistico de San Andres y Providencia. ¿Primera vez en las islas?
                Preguntame lo que quieras: playas, tours, gastronomia, cultura raizal, itinerarios...
              </>}
              <span className="block mt-1 text-gray-500 text-xs">¿Por donde empezamos?</span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        {showQuick && (
          <div className="space-y-2">
            <button
              onClick={() => setShowQuick(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              <Sparkles size={11} /> Acciones rapidas
              <ChevronDown size={11} className={`transition-transform ${showQuick ? '' : 'rotate-180'}`} />
            </button>
            <div className="grid grid-cols-2 gap-2">
              {cfg.quickActions.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => enviar(qa.prompt)}
                  disabled={loading}
                  className={`text-left text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:${cfg.border} text-gray-400 hover:${cfg.color} rounded-lg px-3 py-2 transition-all disabled:opacity-40`}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {mensajes.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              m.role === 'user'
                ? 'bg-blue-900 border border-blue-700'
                : `${cfg.bg} border ${cfg.border}`
            }`}>
              {m.role === 'user'
                ? <User size={13} className="text-blue-300" />
                : <Bot size={13} className={cfg.color} />
              }
            </div>

            <div className="flex flex-col gap-1.5 max-w-[82%]">
              <div className={`rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-950 border border-blue-800 text-blue-100 rounded-tr-none'
                  : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
              }`}>
                {m.content}
                <span className="block mt-1 text-xs opacity-30">
                  {new Date(m.ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Action chips from agent */}
              {m.role === 'assistant' && m.action && (
                <div className="flex flex-wrap gap-1.5">
                  {m.action.action === 'save_cotizacion' && m.action.cotizacionId && (
                    <span className="text-[11px] bg-emerald-900/60 border border-emerald-700 text-emerald-300 px-2 py-1 rounded-lg">
                      Cotizacion {m.action.cotizacionId} guardada
                    </span>
                  )}
                  {m.action.action === 'show_catalog' && (
                    <span className="text-[11px] bg-teal-900/60 border border-teal-700 text-teal-300 px-2 py-1 rounded-lg">
                      Ver catalogo: {m.action.filter}
                    </span>
                  )}
                  {m.action.action === 'start_cotizacion' && (
                    <button
                      onClick={() => changeMode('cotizador')}
                      className="text-[11px] bg-emerald-900/60 border border-emerald-700 text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-800/60 transition-colors"
                    >
                      Ir al Cotizador
                    </button>
                  )}
                </div>
              )}

              {/* Crear tarea button — solo en respuestas del asistente en modo admin */}
              {m.role === 'assistant' && onAddTarea && (
                <button
                  onClick={() => abrirMiniModal(i, m)}
                  className={`self-start flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-all
                    ${tareaCreada === i
                      ? 'bg-green-900 border-green-700 text-green-300'
                      : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-violet-600 hover:text-violet-300'
                    }`}
                >
                  {tareaCreada === i ? '✓ Tarea creada' : <><Plus size={10} /> Crear tarea</>}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className={`w-7 h-7 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
              <Bot size={13} className={cfg.color} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 size={13} className={`${cfg.color} animate-spin`} />
              <span className="text-xs text-gray-500">
                {mode === 'admin' ? 'Analizando proyecto...' : mode === 'cotizador' ? 'Calculando cotizacion...' : 'Pensando...'}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-300">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        <div className={`flex items-end gap-2 bg-gray-900 border border-gray-700 focus-within:${cfg.border} rounded-xl px-3 py-2 transition-colors`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={cfg.placeholder}
            rows={2}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: 120, minHeight: 40 }}
          />
          <button
            onClick={() => enviar(input)}
            disabled={loading || !input.trim()}
            className={`flex-shrink-0 w-8 h-8 rounded-lg disabled:bg-gray-800 disabled:text-gray-600 text-white flex items-center justify-center transition-colors mb-0.5
              ${mode === 'admin' ? 'bg-violet-700 hover:bg-violet-600' : mode === 'cotizador' ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-teal-700 hover:bg-teal-600'}`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1.5 text-center">
          Enter para enviar · Shift+Enter nueva linea · Modo: {cfg.label}
        </p>
      </div>

      {/* ── Mini modal: crear tarea desde respuesta IA ── */}
      {miniModal && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 border border-violet-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <span className="text-sm font-bold text-violet-300 flex items-center gap-2">
                <Plus size={14} /> Nueva tarea desde Agente IA
              </span>
              <button onClick={() => setMiniModal(null)} className="text-gray-500 hover:text-gray-300 p-1">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Titulo</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600"
                  value={miniModal.titulo}
                  onChange={e => setMiniModal(p => p ? { ...p, titulo: e.target.value } : p)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Descripcion</label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 resize-none"
                  rows={2}
                  value={miniModal.descripcion}
                  onChange={e => setMiniModal(p => p ? { ...p, descripcion: e.target.value } : p)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Proyecto</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600"
                    value={miniModal.seccionId}
                    onChange={e => setMiniModal(p => p ? { ...p, seccionId: e.target.value } : p)}
                  >
                    {secciones.map(s => (
                      <option key={s.id} value={s.id}>{s.titulo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Prioridad</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600"
                    value={miniModal.prioridad}
                    onChange={e => setMiniModal(p => p ? { ...p, prioridad: e.target.value as Prioridad } : p)}
                  >
                    <option value="critica">Critica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setMiniModal(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">
                Cancelar
              </button>
              <button
                onClick={confirmarTarea}
                disabled={!miniModal.titulo.trim() || !miniModal.seccionId}
                className="flex-1 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Save size={14} /> Agregar a Torre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
