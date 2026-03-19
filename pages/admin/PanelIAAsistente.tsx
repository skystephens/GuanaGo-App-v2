import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, Trash2, Download, Sparkles,
  AlertCircle, Loader2, ChevronDown,
} from 'lucide-react';
import type { SeccionControl, EstadoTarea } from './AdminTorreControl';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

interface Props {
  secciones: SeccionControl[];
}

// ─── Quick action prompts ─────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '¿Qué priorizar hoy?',        prompt: '¿Cuáles son las 3 tareas más críticas y urgentes en las que debo enfocarme hoy? Justifica con base en el estado actual del proyecto.' },
  { label: 'Analizar bloqueos',           prompt: 'Identifica todos los bloqueos y dependencias entre tareas. ¿Qué está frenando el avance del proyecto?' },
  { label: 'Resumen ejecutivo',           prompt: 'Dame un resumen ejecutivo del estado actual del proyecto GuanaGO: avance por sección, riesgos principales y próximos hitos.' },
  { label: 'Plan para lanzamiento',       prompt: 'Con base en las tareas pendientes, ¿cuál sería el plan mínimo para hacer un lanzamiento beta funcional? Ordena las acciones por dependencia.' },
  { label: 'Estrategia Firebase + IA',    prompt: 'Explícame paso a paso cómo implementar la arquitectura Firebase + Airtable + IA para GuanaGO, empezando por lo más crítico.' },
  { label: 'Ideas para monetizar',        prompt: 'Basándote en el estado del proyecto y las oportunidades registradas, dame 5 ideas concretas para generar ingresos en los próximos 30 días.' },
];

// ─── Build system prompt from Torre de Control state ─────────────────────────
function buildSystemPrompt(secciones: SeccionControl[]): string {
  const totalTareas = secciones.reduce((a, s) => a + s.tareas.length, 0);
  const completadas = secciones.reduce((a, s) => a + s.tareas.filter(t => t.estado === 'completado').length, 0);
  const enProgreso  = secciones.reduce((a, s) => a + s.tareas.filter(t => t.estado === 'en_progreso').length, 0);
  const bloqueadas  = secciones.reduce((a, s) => a + s.tareas.filter(t => t.estado === 'bloqueado').length, 0);
  const criticas    = secciones.reduce((a, s) => a + s.tareas.filter(t => t.prioridad === 'critica' && t.estado !== 'completado').length, 0);
  const pct = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

  const seccionesDetalle = secciones.map(sec => {
    const comp = sec.tareas.filter(t => t.estado === 'completado').length;
    const tareasList = sec.tareas.map(t =>
      `    - [${t.estado.toUpperCase()}][${t.prioridad}] ${t.titulo}${t.notas ? ` | Nota: ${t.notas}` : ''}`
    ).join('\n');
    return `## ${sec.titulo} (${comp}/${sec.tareas.length} completadas)\n${tareasList}`;
  }).join('\n\n');

  return `Eres el Asistente de Proyecto de GuanaGO, una app de turismo para San Andrés y Providencia (Colombia).

Tienes acceso al estado actual de la Torre de Control del proyecto (${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}):

RESUMEN GLOBAL:
- Proyectos activos: ${secciones.length}
- Total tareas: ${totalTareas}
- Completadas: ${completadas} (${pct}%)
- En progreso: ${enProgreso}
- Bloqueadas: ${bloqueadas}
- Críticas pendientes: ${criticas}

STACK TÉCNICO:
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS (PWA)
- Backend: Node.js + Express en Render (puerto 5000)
- Base datos: Airtable (captura) → Firestore (runtime, en implementación)
- Auth: Firebase Auth (Google + email)
- IA en app: Groq API (Llama 3.3 70B) — esto eres tú
- Deploy: Render (backend) + GitHub Pages/Firebase Hosting (frontend)
- Automatización: Make.com (Airtable → Firestore sync)

ESTADO DE PROYECTOS:
${seccionesDetalle}

INSTRUCCIONES:
- Responde siempre en español
- Sé concreto y accionable — da pasos específicos, no generalidades
- Cuando propongas código, hazlo en TypeScript/React compatible con el stack actual
- Prioriza lo que genera valor para el lanzamiento beta
- Puedes referenciar tareas específicas por su nombre`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PanelIAAsistente({ secciones }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, loading]);

  const enviar = useCallback(async (texto: string) => {
    const trimmed = texto.trim();
    if (!trimmed || loading) return;

    const nuevoMensaje: Mensaje = { role: 'user', content: trimmed, ts: Date.now() };
    const historial = [...mensajes, nuevoMensaje];
    setMensajes(historial);
    setInput('');
    setLoading(true);
    setError(null);
    setShowQuick(false);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(secciones),
          messages: historial.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

      setMensajes(prev => [...prev, { role: 'assistant', content: data.reply, ts: Date.now() }]);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el asistente');
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [mensajes, loading, secciones]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(input);
    }
  };

  const limpiar = () => {
    setMensajes([]);
    setError(null);
    setShowQuick(true);
  };

  const exportarChat = () => {
    const texto = mensajes.map(m =>
      `[${m.role === 'user' ? 'YO' : 'IA'}] ${new Date(m.ts).toLocaleTimeString('es-CO')}\n${m.content}\n`
    ).join('\n---\n\n');
    const blob = new Blob([`# Chat IA — GuanaGO\n${new Date().toLocaleString('es-CO')}\n\n${texto}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chat-ia-guanago.md'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-violet-900 border border-violet-600 flex items-center justify-center">
            <Bot size={14} className="text-violet-300" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">Asistente GuanaGO</span>
            <span className="ml-2 text-xs text-gray-600">Llama 3.3 · contexto del proyecto en tiempo real</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mensajes.length > 0 && (
            <>
              <button onClick={exportarChat} title="Exportar chat" className="text-gray-600 hover:text-gray-400 p-1 transition-colors">
                <Download size={14} />
              </button>
              <button onClick={limpiar} title="Limpiar chat" className="text-gray-600 hover:text-red-400 p-1 transition-colors">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">

        {/* Welcome + quick actions */}
        {mensajes.length === 0 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-900 border border-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} className="text-violet-300" />
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl rounded-tl-none p-3 text-sm text-gray-300 leading-relaxed max-w-lg">
                Hola. Tengo acceso al estado actual de todos tus proyectos en la Torre de Control.
                Puedo ayudarte a priorizar, analizar bloqueos, planificar el lanzamiento, o cualquier cosa relacionada con GuanaGO.
                <span className="block mt-1 text-gray-500 text-xs">¿Por dónde empezamos?</span>
              </div>
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
              <Sparkles size={11} />
              Acciones rápidas
              <ChevronDown size={11} className={`transition-transform ${showQuick ? '' : 'rotate-180'}`} />
            </button>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => enviar(qa.prompt)}
                  disabled={loading}
                  className="text-left text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-violet-700 text-gray-400 hover:text-violet-300 rounded-lg px-3 py-2 transition-all disabled:opacity-40"
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
                : 'bg-violet-900 border border-violet-600'
            }`}>
              {m.role === 'user'
                ? <User size={13} className="text-blue-300" />
                : <Bot size={13} className="text-violet-300" />
              }
            </div>
            <div className={`rounded-xl p-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-blue-950 border border-blue-800 text-blue-100 rounded-tr-none'
                : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
            }`}>
              {m.content}
              <span className="block mt-1 text-xs opacity-30">
                {new Date(m.ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-900 border border-violet-600 flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-violet-300" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 size={13} className="text-violet-400 animate-spin" />
              <span className="text-xs text-gray-500">Analizando el proyecto...</span>
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

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        <div className="flex items-end gap-2 bg-gray-900 border border-gray-700 focus-within:border-violet-600 rounded-xl px-3 py-2 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre el proyecto… (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: 120, minHeight: 40 }}
          />
          <button
            onClick={() => enviar(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:bg-gray-800 disabled:text-gray-600 text-white flex items-center justify-center transition-colors mb-0.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1.5 text-center">
          El asistente tiene contexto de todos tus proyectos y tareas en tiempo real
        </p>
      </div>
    </div>
  );
}
