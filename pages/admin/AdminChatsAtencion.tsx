import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, MessageSquare, Clock, CheckCircle2, XCircle,
  RefreshCw, ChevronDown, ChevronUp, User, AlertTriangle,
  FileText, Send, Loader2,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface ChatRecord {
  id: string;
  fields: {
    Fecha?: string;
    Estado?: 'pendiente' | 'revisado' | 'resuelto';
    Mensaje_Usuario?: string;
    Historial_Conversacion?: string;
    Respuesta_IA_Tentativa?: string;
    Usuario_ID?: string;
    Usuario_Nombre?: string;
    Origen?: string;
    Revisado_Por?: string;
    Notas_Internas?: string;
  };
}

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

type FiltroEstado = 'todos' | 'pendiente' | 'revisado' | 'resuelto';

const API = '/api/chatbot/atencion';

function estadoBadge(estado?: string) {
  if (estado === 'pendiente')
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/60 text-red-400 border border-red-700">Pendiente</span>;
  if (estado === 'revisado')
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-900/60 text-yellow-400 border border-yellow-700">Revisado</span>;
  if (estado === 'resuelto')
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/60 text-green-400 border border-green-700">Resuelto</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-500">—</span>;
}

function formatFecha(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function parseHistorial(raw?: string): { role: string; content: string }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [{ role: 'info', content: raw }]; }
}

// ─── Panel de detalle de un chat ─────────────────────────────────────────────

function ChatDetalle({
  chat,
  onClose,
  onActualizar,
}: {
  chat: ChatRecord;
  onClose: () => void;
  onActualizar: (id: string, campos: object) => Promise<void>;
}) {
  const [notas, setNotas]       = useState(chat.fields.Notas_Internas || '');
  const [guardando, setGuardando] = useState(false);
  const [histExpanded, setHistExpanded] = useState(false);
  const historial = parseHistorial(chat.fields.Historial_Conversacion);

  const marcar = async (estado: 'revisado' | 'resuelto') => {
    setGuardando(true);
    await onActualizar(chat.id, {
      estado,
      notas_internas: notas,
      revisado_por: 'Admin',
    });
    setGuardando(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl md:rounded-2xl w-full md:max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-rose-400" />
            <span className="font-bold text-sm">Detalle del chat</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800">
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span>{formatFecha(chat.fields.Fecha)}</span>
            <span>·</span>
            {estadoBadge(chat.fields.Estado)}
            {chat.fields.Usuario_ID && <span>· ID: {chat.fields.Usuario_ID}</span>}
            {chat.fields.Origen && <span>· {chat.fields.Origen}</span>}
          </div>

          {/* Mensaje del usuario */}
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mensaje del usuario</p>
            <p className="text-sm text-white leading-relaxed">{chat.fields.Mensaje_Usuario || '—'}</p>
          </div>

          {/* Respuesta tentativa de la IA */}
          {chat.fields.Respuesta_IA_Tentativa && (
            <div className="bg-blue-950/40 rounded-xl p-3 border border-blue-800/50">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Respuesta tentativa IA</p>
              <p className="text-sm text-blue-200 leading-relaxed">{chat.fields.Respuesta_IA_Tentativa}</p>
            </div>
          )}

          {/* Historial colapsable */}
          {historial.length > 0 && (
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setHistExpanded(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 hover:bg-gray-750 transition-colors"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Historial ({historial.length} turnos)
                </span>
                {histExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              </button>
              {histExpanded && (
                <div className="p-3 space-y-2 max-h-56 overflow-y-auto bg-gray-900">
                  {historial.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-emerald-900/60 text-emerald-200'
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notas internas */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
              Notas internas
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Agrega contexto o resolución..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>

          {/* Acciones */}
          {chat.fields.Estado !== 'resuelto' && (
            <div className="flex gap-2 pt-1">
              {chat.fields.Estado === 'pendiente' && (
                <button
                  onClick={() => marcar('revisado')}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-yellow-700 bg-yellow-900/30 text-yellow-400 text-sm font-bold hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
                >
                  {guardando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Marcar revisado
                </button>
              )}
              <button
                onClick={() => marcar('resuelto')}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-700 bg-green-900/30 text-green-400 text-sm font-bold hover:bg-green-900/50 transition-colors disabled:opacity-50"
              >
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Marcar resuelto
              </button>
            </div>
          )}
          {chat.fields.Estado === 'resuelto' && (
            <p className="text-center text-xs text-green-500 py-2">✓ Este caso está resuelto</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

const AdminChatsAtencion: React.FC<Props> = ({ onBack }) => {
  const [chats, setChats]           = useState<ChatRecord[]>([]);
  const [loading, setLoading]       = useState(false);
  const [filtro, setFiltro]         = useState<FiltroEstado>('pendiente');
  const [chatAbierto, setChatAbierto] = useState<ChatRecord | null>(null);
  const [totalPendientes, setTotalPendientes] = useState<number | null>(null);

  const cargarChats = useCallback(async (estado: FiltroEstado) => {
    setLoading(true);
    try {
      const qs = estado !== 'todos' ? `?estado=${estado}` : '';
      const res = await fetch(`${API}/lista${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setChats(data.data || []);
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarPendientes = useCallback(async () => {
    try {
      const res = await fetch(`${API}/pendientes`);
      if (res.ok) {
        const data = await res.json();
        setTotalPendientes(data.total ?? 0);
      }
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargarChats(filtro);
    cargarPendientes();
  }, [filtro, cargarChats, cargarPendientes]);

  const actualizarChat = async (id: string, campos: object) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(campos),
      });
      if (res.ok) {
        await cargarChats(filtro);
        await cargarPendientes();
      }
    } catch { /* silencioso */ }
  };

  const FILTROS: { label: string; value: FiltroEstado }[] = [
    { label: 'Pendientes', value: 'pendiente' },
    { label: 'Revisados',  value: 'revisado' },
    { label: 'Resueltos',  value: 'resuelto' },
    { label: 'Todos',      value: 'todos' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">

      {/* Header */}
      <header className="px-4 pt-8 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-rose-400" />
            <h1 className="text-xl font-bold">Chat de Atención</h1>
            {totalPendientes !== null && totalPendientes > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalPendientes} pendiente{totalPendientes !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Consultas escaladas por la IA · Chats_Atencion en Airtable</p>
        </div>
        <button
          onClick={() => { cargarChats(filtro); cargarPendientes(); }}
          className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Filtros */}
      <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filtro === f.value
                ? 'bg-rose-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {f.label}
            {f.value === 'pendiente' && totalPendientes !== null && totalPendientes > 0 && (
              <span className="ml-1.5 bg-red-500/80 text-white text-[9px] px-1 rounded-full">{totalPendientes}</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="px-4 pb-24 space-y-2">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
            <Loader2 size={16} className="animate-spin" /> Cargando...
          </div>
        )}

        {!loading && chats.length === 0 && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
            <MessageSquare size={28} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              {filtro === 'pendiente' ? 'Sin chats pendientes. ¡Todo en orden! ✓' : 'Sin chats en esta categoría.'}
            </p>
          </div>
        )}

        {!loading && chats.map(chat => {
          const f = chat.fields;
          return (
            <button
              key={chat.id}
              onClick={() => setChatAbierto(chat)}
              className="w-full bg-gray-800 rounded-2xl border border-gray-700 hover:border-rose-700/60 transition-colors p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {estadoBadge(f.Estado)}
                    {f.Origen && (
                      <span className="text-[10px] text-gray-600">{f.Origen}</span>
                    )}
                  </div>
                  <p className="text-sm text-white font-medium leading-snug line-clamp-2">
                    {f.Mensaje_Usuario || '(sin mensaje)'}
                  </p>
                  {f.Respuesta_IA_Tentativa && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      IA: {f.Respuesta_IA_Tentativa}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-600">{formatFecha(f.Fecha)}</p>
                  {f.Usuario_ID ? (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <User size={10} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600">Registrado</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-700">Anónimo</span>
                  )}
                </div>
              </div>
              {f.Notas_Internas && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <p className="text-[10px] text-gray-500 line-clamp-1">
                    📝 {f.Notas_Internas}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info box */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none">
        <div className="max-w-2xl mx-auto bg-gray-950/90 border border-gray-800 rounded-2xl p-3 backdrop-blur pointer-events-auto">
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <AlertTriangle size={11} className="text-yellow-600 shrink-0" />
            <span>Los chats aparecen cuando la IA detecta baja confianza o el usuario menciona queja/reclamo/reembolso. La tabla es <span className="text-gray-500 font-mono">Chats_Atencion</span> en Airtable.</span>
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {chatAbierto && (
        <ChatDetalle
          chat={chatAbierto}
          onClose={() => setChatAbierto(null)}
          onActualizar={actualizarChat}
        />
      )}
    </div>
  );
};

export default AdminChatsAtencion;
