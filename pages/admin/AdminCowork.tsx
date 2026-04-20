import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Package2, Bot, Users, Send, Loader2,
  Copy, Check, TrendingUp, ChevronDown, ChevronUp,
  Search, RefreshCw, Sparkles, ShoppingCart,
  Calculator, Info, Hotel, Car, Plane, Plus, Minus, Trash2, X,
  CheckSquare, Brain, LayoutDashboard, Star, Circle,
  AlertTriangle, Activity, Wifi, WifiOff, ExternalLink,
  StickyNote, Lightbulb, Zap,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

type Tab = 'catalogo' | 'asistente' | 'grupos' | 'torre' | 'cerebro' | 'dashboard';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CatItem {
  id: string;
  tabla: 'tours' | 'alojamientos' | 'traslados' | 'tiquetes';
  nombre: string;
  tipo: string;
  capacidad?: string | number | null;
  precioNeto: number;
  precioPorPersona?: number;
  precioNeto2?: number | null;
  precioNeto3?: number | null;
  precioNeto4?: number | null;
  precioAdulto?: string;
  precioNino?: string;
  origen?: string;
  destino?: string;
  aerolinea?: string;
  canalesOTA: string[];
  unidad: 'persona' | 'noche' | 'traslado';
}

interface CatalogoCompleto {
  tours: CatItem[];
  alojamientos: CatItem[];
  traslados: CatItem[];
  tiquetes: CatItem[];
}

interface QuoteItem {
  id: string;
  nombre: string;
  tabla: string;
  tipo: string;
  precioNeto: number;
  qty: number;
  unidad: string;
}

// Legacy — usado solo por GruposTab
interface Servicio {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number | null;
  precioNeto: number;
  precioOTA_turcom: number;
  precioOTA_civitatis: number;
  markupTurcom: number;
  markupCivitatis: number;
  canalesOTA: string[];
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COP = (n: number) =>
  n ? `$${n.toLocaleString('es-CO')}` : '—';

const OTA_BADGE: Record<string, string> = {
  'Civitatis':      'bg-red-900/60 text-red-300 border-red-700',
  'Tur.com':        'bg-purple-900/60 text-purple-300 border-purple-700',
  'Get Your Guide': 'bg-blue-900/60 text-blue-300 border-blue-600',
  'Airbnb':         'bg-cyan-900/60 text-cyan-300 border-cyan-700',
};

const TIPO_BADGE: Record<string, string> = {
  Tour:         'bg-teal-900/60 text-teal-300 border-teal-700',
  Alojamiento:  'bg-blue-900/60 text-blue-300 border-blue-700',
  Transporte:   'bg-orange-900/60 text-orange-300 border-orange-700',
  Paquete:      'bg-purple-900/60 text-purple-300 border-purple-700',
  Evento:       'bg-pink-900/60 text-pink-300 border-pink-700',
};

const DESCUENTOS = [
  { min: 150, pct: 20, label: '150+ pax — 20% off' },
  { min: 100, pct: 15, label: '100–149 pax — 15% off' },
  { min: 50,  pct: 10, label: '50–99 pax — 10% off' },
  { min: 1,   pct: 0,  label: '< 50 pax — precio estándar' },
];

function getDescuento(pax: number) {
  return DESCUENTOS.find(d => pax >= d.min) || DESCUENTOS[DESCUENTOS.length - 1];
}

const OTA_OPTIONS = [
  { id: 'turcom',    label: 'Tur.com',        markup: 1.23, pct: 23, color: 'text-purple-400' },
  { id: 'civitatis', label: 'Civitatis',       markup: 1.25, pct: 25, color: 'text-red-400' },
  { id: 'gyg',       label: 'Get Your Guide',  markup: 1.25, pct: 25, color: 'text-blue-400' },
  { id: 'airbnb',    label: 'Airbnb',          markup: 1.20, pct: 20, color: 'text-cyan-400' },
];

const CAT_TABS = [
  { id: 'tours',        label: 'Tours',        icon: <Package2 size={13} /> },
  { id: 'alojamientos', label: 'Alojamiento',  icon: <Hotel size={13} /> },
  { id: 'traslados',    label: 'Traslados',     icon: <Car size={13} /> },
  { id: 'tiquetes',     label: 'Tiquetes',      icon: <Plane size={13} /> },
] as const;

const QUICK_PROMPTS = [
  { icon: '📋', label: 'Lista completa', prompt: 'Dame una lista completa de todos los servicios disponibles con precios netos para el OTA y el precio de venta sugerido (+23%).' },
  { icon: '✈️', label: 'Civitatis', prompt: '¿Qué servicios son más adecuados para Civitatis? ¿Cómo funciona la estructura de comisiones con ellos?' },
  { icon: '👥', label: 'Cotizar grupo', prompt: 'Quiero cotizar para una agencia: necesito un paquete para 80 personas en San Andrés, 3 días, con tours de día.' },
  { icon: '📑', label: 'Condiciones B2B', prompt: '¿Cuáles son las condiciones de pago y cancelación para agencias de viajes que trabajan con GuíaSAI?' },
];

// ─── Tab: Cotizador Multi-tabla ───────────────────────────────────────────────

function CotizadorTab() {
  const [catalogo, setCatalogo] = useState<CatalogoCompleto>({ tours: [], alojamientos: [], traslados: [], tiquetes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catTab, setCatTab] = useState<'tours' | 'alojamientos' | 'traslados' | 'tiquetes'>('tours');
  const [search, setSearch] = useState('');
  const [selectedOTA, setSelectedOTA] = useState('turcom');
  const [pax, setPax] = useState(2);
  const [noches, setNoches] = useState(3);
  const [quote, setQuote] = useState<QuoteItem[]>([]);
  const [showQuote, setShowQuote] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/cowork/catalogo-completo');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setCatalogo(data.data || { tours: [], alojamientos: [], traslados: [], tiquetes: [] });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ota = OTA_OPTIONS.find(o => o.id === selectedOTA) || OTA_OPTIONS[0];
  const activeItems: CatItem[] = (catalogo[catTab] || []).filter(
    item => !search || item.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const addToQuote = (item: CatItem) => {
    setQuote(prev => {
      const ex = prev.find(q => q.id === item.id);
      if (ex) return prev.map(q => q.id === item.id ? { ...q, qty: q.qty + 1 } : q);
      return [...prev, { id: item.id, nombre: item.nombre, tabla: item.tabla, tipo: item.tipo, precioNeto: item.precioNeto, qty: 1, unidad: item.unidad }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setQuote(prev => prev.map(q => q.id === id ? { ...q, qty: Math.max(1, q.qty + delta) } : q));
  };

  const removeItem = (id: string) => setQuote(prev => prev.filter(q => q.id !== id));

  const totalNeto = quote.reduce((s, q) => s + q.precioNeto * q.qty, 0);
  const totalOTA  = Math.round(totalNeto * ota.markup);

  const copyQuote = () => {
    const lines = [
      `COTIZACIÓN B2B — GuíaSAI / GuanaGO`,
      `Canal OTA: ${ota.label} | Pax: ${pax} | Noches: ${noches}`,
      `${'─'.repeat(55)}`,
      ...quote.map(q => {
        const sub = q.precioNeto * q.qty;
        const subOTA = Math.round(sub * ota.markup);
        const u = q.unidad === 'noche' ? `${q.qty} noche(s)` : q.unidad === 'traslado' ? `${q.qty} traslado(s)` : `${q.qty} pax`;
        return `• ${q.nombre} × ${u}\n  Neto: ${COP(sub)} | ${ota.label} +${ota.pct}%: ${COP(subOTA)} COP`;
      }),
      `${'─'.repeat(55)}`,
      `Total neto GuíaSAI:  ${COP(totalNeto)} COP`,
      `Total venta ${ota.label} (+${ota.pct}%): ${COP(totalOTA)} COP`,
      ``,
      `* Precios netos confidenciales — solo para uso interno del OTA.`,
      `* Descuentos grupo disponibles: 50+ pax (-10%), 100+ (-15%), 150+ (-20%).`,
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totales = {
    tours:        catalogo.tours.length,
    alojamientos: catalogo.alojamientos.length,
    traslados:    catalogo.traslados.length,
    tiquetes:     catalogo.tiquetes.length,
  };

  return (
    <div className="space-y-3">
      {/* Banner confidencial */}
      <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-3 flex gap-2">
        <Info size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200 leading-relaxed">
          <strong>Precios netos B2B — confidenciales.</strong> No compartir con turistas finales.
        </p>
      </div>

      {/* Configuración: OTA + pax + noches */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-2">
        <p className="text-[10px] text-gray-500 uppercase font-bold">Configuración de cotización</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="col-span-2">
            <label className="text-[9px] text-gray-500 uppercase block mb-1">OTA / Agencia</label>
            <div className="flex gap-1 flex-wrap">
              {OTA_OPTIONS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOTA(o.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    selectedOTA === o.id
                      ? 'border-teal-500 bg-teal-900/40 text-teal-300'
                      : 'border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {o.label} <span className="opacity-60">+{o.pct}%</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">Pax</label>
            <input type="number" min={1} value={pax} onChange={e => setPax(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-600" />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">Noches</label>
            <input type="number" min={1} value={noches} onChange={e => setNoches(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-600" />
          </div>
        </div>
      </div>

      {/* Tabs de categoría */}
      <div className="flex bg-gray-800/60 border border-gray-700 rounded-xl p-1 gap-1">
        {CAT_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setCatTab(t.id); setSearch(''); }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              catTab === t.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="text-[9px] opacity-50">({totales[t.id]})</span>
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Buscar en ${CAT_TABS.find(t => t.id === catTab)?.label}...`}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600"
          />
        </div>
        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 text-gray-400 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        {quote.length > 0 && (
          <button
            onClick={() => setShowQuote(v => !v)}
            className="relative flex items-center gap-1.5 bg-teal-900/60 hover:bg-teal-800/60 border border-teal-600 rounded-lg px-3 py-2 text-xs text-teal-300 font-bold transition-colors"
          >
            <ShoppingCart size={13} />
            <span className="hidden sm:inline">Cotización</span>
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {quote.length}
            </span>
          </button>
        )}
      </div>

      {/* Lista de ítems */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-600">
          <Loader2 size={18} className="animate-spin mr-2" /> Cargando catálogo...
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-300">{error}</div>
      ) : activeItems.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          {search ? 'Sin resultados' : 'Sin datos en esta categoría'}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {activeItems.map(item => {
            const inQuote = quote.find(q => q.id === item.id);
            const precioOTA = item.precioNeto ? Math.round(item.precioNeto * ota.markup) : null;
            return (
              <div key={item.id}
                className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 flex items-center gap-3 hover:border-gray-600 transition-colors">
                {/* Tipo */}
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${TIPO_BADGE[item.tipo] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                  {item.tipo || '—'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.nombre}</p>
                  {(item.origen || item.aerolinea) && (
                    <p className="text-[10px] text-gray-500 truncate">
                      {item.origen}{item.destino ? ` → ${item.destino}` : ''}{item.aerolinea ? ` · ${item.aerolinea}` : ''}
                    </p>
                  )}
                  {item.canalesOTA?.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {item.canalesOTA.map(o => (
                        <span key={o} className={`text-[7px] font-bold px-1 rounded border ${OTA_BADGE[o] || 'bg-gray-700 text-gray-500 border-gray-600'}`}>
                          {o === 'Get Your Guide' ? 'GYG' : o}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Precio */}
                <div className="text-right flex-shrink-0">
                  {item.precioNeto > 0 ? (
                    <>
                      <div className="text-[10px] font-bold text-teal-400">{COP(item.precioNeto)}</div>
                      <div className="text-[9px] text-gray-600">neto</div>
                      {precioOTA && (
                        <>
                          <div className={`text-[10px] font-bold ${ota.color}`}>{COP(precioOTA)}</div>
                          <div className="text-[9px] text-gray-600">+{ota.pct}%</div>
                        </>
                      )}
                    </>
                  ) : item.precioAdulto ? (
                    <>
                      <div className="text-[10px] text-gray-300">{item.precioAdulto}</div>
                      <div className="text-[9px] text-gray-600">adulto ref.</div>
                    </>
                  ) : <span className="text-[10px] text-gray-600">a consultar</span>}
                </div>

                {/* Agregar */}
                {inQuote ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => changeQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors">
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-bold text-white w-4 text-center">{inQuote.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => addToQuote(item)}
                    disabled={item.precioNeto === 0 && !item.precioAdulto}
                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 flex-shrink-0"
                    style={{ background: '#00A8A0' }}>
                    <Plus size={13} className="text-white" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Panel de cotización */}
      {showQuote && quote.length > 0 && (
        <div className="bg-gray-800/80 border border-teal-700/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
              <ShoppingCart size={14} /> Cotización — {ota.label}
            </h3>
            <button onClick={() => setShowQuote(false)} className="text-gray-600 hover:text-gray-300">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {quote.map(q => {
              const sub = q.precioNeto * q.qty;
              return (
                <div key={q.id} className="flex items-center gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{q.nombre}</p>
                    <p className="text-gray-500 text-[10px]">
                      {q.qty} {q.unidad === 'noche' ? 'noche(s)' : q.unidad === 'traslado' ? 'traslado(s)' : 'pax'} · Neto: {COP(sub)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-bold ${ota.color}`}>{COP(Math.round(sub * ota.markup))}</div>
                    <div className="text-[9px] text-gray-600">+{ota.pct}%</div>
                  </div>
                  <button onClick={() => removeItem(q.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-700 pt-3 grid grid-cols-2 gap-2">
            <div className="bg-teal-950/40 rounded-xl p-2.5 text-center">
              <div className="text-base font-bold text-teal-400">{COP(totalNeto)}</div>
              <div className="text-[9px] text-gray-500">total neto GuíaSAI</div>
            </div>
            <div className="bg-orange-950/40 rounded-xl p-2.5 text-center">
              <div className={`text-base font-bold ${ota.color}`}>{COP(totalOTA)}</div>
              <div className="text-[9px] text-gray-500">total {ota.label} +{ota.pct}%</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyQuote}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-colors"
              style={{ background: '#F5831F' }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? '¡Copiado!' : 'Copiar cotización'}
            </button>
            <button
              onClick={() => setQuote([])}
              className="px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-800 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}</div>
  );
}

// ─── Tab: Asistente B2B ───────────────────────────────────────────────────────

function AsistenteTab() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId] = useState(() => `b2b-${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMsgs(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          mode: 'b2b',
          history: msgs.slice(-8).map(m => ({ role: m.role, content: m.content })),
          conversationId: convId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setMsgs(prev => [...prev, { role: 'assistant', content: data.response || '' }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Verifica que el servidor esté activo.' }]);
    } finally {
      setLoading(false);
    }
  }, [loading, msgs, convId]);

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header del agente */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-800/60 rounded-xl border border-gray-700 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#00A8A0' }}>
          <Bot size={15} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Asistente Comercial B2B</div>
          <div className="text-[10px] text-gray-500">Claude Sonnet · Modo agencias & OTAs · GuíaSAI</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-green-400">Online</span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
        {msgs.length === 0 && !loading && (
          <div className="py-4">
            <p className="text-xs text-gray-600 mb-3 text-center">Consultas frecuentes:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q.prompt)}
                  className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-teal-700 rounded-xl p-3 text-left transition-colors"
                >
                  <span className="text-base flex-shrink-0">{q.icon}</span>
                  <span className="text-[11px] text-gray-300 leading-tight">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: '#00A8A0' }}>
                <Bot size={12} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === 'assistant'
                ? 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                : 'text-white rounded-tr-none'
            }`}
              style={m.role === 'user' ? { background: '#003D5C' } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: '#00A8A0' }}>
              <Bot size={12} className="text-white" />
            </div>
            <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl rounded-tl-none">
              <Loader2 size={12} className="text-teal-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-gray-800">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Pregunta sobre tarifas, condiciones, cotizaciones..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
          style={{ background: '#00A8A0' }}
        >
          <Send size={13} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Calculadora Grupos ──────────────────────────────────────────────────

function GruposTab() {
  const [pax, setPax] = useState(50);
  const [precioNeto, setPrecioNeto] = useState(0);
  const [servNombre, setServNombre] = useState('');
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingServ, setLoadingServ] = useState(false);
  const [result, setResult] = useState<null | {
    pct: number; label: string;
    netoConDescuento: number;
    precioOTA_turcom: number; precioOTA_civitatis: number;
    totalNeto: number; totalTurcom: number; totalCivitatis: number;
  }>(null);

  // Cargar servicios para el selector
  useEffect(() => {
    setLoadingServ(true);
    fetch('/api/cowork/catalogo-b2b')
      .then(r => r.json())
      .then(d => setServicios(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingServ(false));
  }, []);

  const calcular = () => {
    if (!precioNeto || !pax) return;
    const descuento = getDescuento(pax);
    const netoConDescuento = Math.round(precioNeto * (1 - descuento.pct / 100));
    const precioOTA_turcom    = Math.round(netoConDescuento * 1.23);
    const precioOTA_civitatis = Math.round(netoConDescuento * 1.25);
    setResult({
      pct: descuento.pct,
      label: descuento.label,
      netoConDescuento,
      precioOTA_turcom,
      precioOTA_civitatis,
      totalNeto:      netoConDescuento * pax,
      totalTurcom:    precioOTA_turcom * pax,
      totalCivitatis: precioOTA_civitatis * pax,
    });
  };

  const selectServicio = (id: string) => {
    const s = servicios.find(x => x.id === id);
    if (s) {
      setPrecioNeto(s.precioNeto);
      setServNombre(s.nombre);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabla de descuentos */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-orange-400" />
          <h3 className="text-sm font-bold text-white">Descuentos por volumen</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DESCUENTOS.map((d, i) => (
            <div key={i} className={`rounded-lg p-2.5 border text-center ${
              pax >= d.min && (i === 0 || pax < DESCUENTOS[i - 1].min)
                ? 'border-teal-600 bg-teal-900/30'
                : 'border-gray-700 bg-gray-900/40'
            }`}>
              <div className={`text-lg font-bold ${d.pct > 0 ? 'text-teal-400' : 'text-gray-400'}`}>
                {d.pct > 0 ? `-${d.pct}%` : 'Base'}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calculator size={14} className="text-teal-400" />
          Calcular cotización grupo
        </h3>

        {/* Selector de servicio */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Servicio</label>
          <select
            onChange={e => selectServicio(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-600"
            disabled={loadingServ}
          >
            <option value="">Selecciona o ingresa precio manual →</option>
            {servicios.map(s => (
              <option key={s.id} value={s.id}>
                {s.nombre} — Neto: {COP(s.precioNeto)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Precio neto */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Precio neto (COP)</label>
            <input
              type="number"
              value={precioNeto || ''}
              onChange={e => setPrecioNeto(Number(e.target.value))}
              placeholder="ej: 85000"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Número de personas */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Personas (pax)</label>
            <input
              type="number"
              min={1}
              value={pax}
              onChange={e => setPax(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        <button
          onClick={calcular}
          disabled={!precioNeto || !pax}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
          style={{ background: '#F5831F' }}
        >
          Calcular precio grupo
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="bg-gray-800/60 border border-teal-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-teal-300">
              {servNombre || 'Servicio'} × {pax} personas
            </h3>
            {result.pct > 0 && (
              <span className="text-xs bg-teal-900/60 text-teal-300 border border-teal-700 px-2 py-0.5 rounded-full font-bold">
                -{result.pct}% grupo
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PrecioCard
              label="Neto por persona"
              value={COP(result.netoConDescuento)}
              sub="Lo que paga la agencia a GuíaSAI"
              color="teal"
            />
            <PrecioCard
              label={`Total neto × ${pax} pax`}
              value={COP(result.totalNeto)}
              sub="Ingreso total GuíaSAI"
              color="teal"
            />
            <PrecioCard
              label="tur.com por persona"
              value={COP(result.precioOTA_turcom)}
              sub="Venta al turista (+23%)"
              color="orange"
            />
            <PrecioCard
              label={`tur.com total × ${pax} pax`}
              value={COP(result.totalTurcom)}
              sub="Ingreso total tur.com"
              color="orange"
            />
            <PrecioCard
              label="Civitatis por persona"
              value={COP(result.precioOTA_civitatis)}
              sub="Venta al turista (+25%)"
              color="amber"
            />
            <PrecioCard
              label={`Civitatis total × ${pax} pax`}
              value={COP(result.totalCivitatis)}
              sub="Ingreso total Civitatis"
              color="amber"
            />
          </div>

          {result.pct > 0 && (
            <div className="text-[10px] text-gray-500 bg-gray-900/50 rounded-lg p-2">
              Descuento aplicado: {result.pct}% ({result.label}) · Precio base era {COP(precioNeto)} por persona
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrecioCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: 'teal' | 'orange' | 'amber';
}) {
  const c = color === 'teal'
    ? { text: 'text-teal-400', bg: 'bg-teal-950/40' }
    : color === 'amber'
    ? { text: 'text-amber-300', bg: 'bg-amber-950/40' }
    : { text: 'text-orange-400', bg: 'bg-orange-950/40' };
  return (
    <div className={`${c.bg} rounded-xl p-3`}>
      <div className={`text-base font-bold ${c.text}`}>{value}</div>
      <div className="text-[10px] text-white font-medium mt-0.5">{label}</div>
      <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">{sub}</div>
    </div>
  );
}

// ─── Torre tipos (comparte storage con AdminTorreControl) ────────────────────

type EstadoTarea = 'pendiente' | 'en_progreso' | 'completado' | 'bloqueado';
type Prioridad   = 'critica' | 'alta' | 'media' | 'baja';

interface TareaControl {
  id: string; titulo: string; descripcion: string;
  prioridad: Prioridad; estado: EstadoTarea; creadaEn: string;
}
interface SeccionControl {
  id: string; titulo: string; color: string; gradiente: string;
  tareas: TareaControl[];
}

const TORRE_KEY = 'guanago_torre_v3';
const loadTorre = (): SeccionControl[] => { try { return JSON.parse(localStorage.getItem(TORRE_KEY) || '[]'); } catch { return []; } };
const saveTorre = (d: SeccionControl[]) => localStorage.setItem(TORRE_KEY, JSON.stringify(d));

const ESTADO_DOT: Record<EstadoTarea, string> = {
  pendiente: '#6b7280', en_progreso: '#3b82f6', completado: '#22c55e', bloqueado: '#ef4444',
};
const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente: 'Pendiente', en_progreso: 'En progreso', completado: 'Completado', bloqueado: 'Bloqueado',
};
const PRIOR_COLOR: Record<Prioridad, string> = {
  critica: 'bg-red-500', alta: 'bg-orange-400', media: 'bg-yellow-400', baja: 'bg-gray-500',
};

// ─── Tab: Torre de Control (lite) ─────────────────────────────────────────────

function TorreTab({ onNavigate }: { onNavigate: (r: AppRoute) => void }) {
  const [secciones, setSecciones] = useState<SeccionControl[]>([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [addSeccion, setAddSeccion] = useState('');
  const [addTitulo, setAddTitulo]  = useState('');
  const [addPrior, setAddPrior]    = useState<Prioridad>('alta');

  useEffect(() => { setSecciones(loadTorre()); }, []);

  const all = secciones.flatMap(s => s.tareas.map(t => ({ ...t, seccionId: s.id, seccionTitulo: s.titulo })));
  const total = all.length;
  const completadas = all.filter(t => t.estado === 'completado').length;
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const urgentes = all.filter(t =>
    (t.prioridad === 'critica' || t.prioridad === 'alta') && t.estado !== 'completado'
  ).slice(0, 12);

  const cycleEstado = (seccionId: string, tareaId: string, actual: EstadoTarea) => {
    const ciclo: EstadoTarea[] = ['pendiente', 'en_progreso', 'completado', 'bloqueado'];
    const next = ciclo[(ciclo.indexOf(actual) + 1) % ciclo.length];
    const updated = secciones.map(s => ({
      ...s, tareas: s.tareas.map(t => t.id === tareaId && s.id === seccionId ? { ...t, estado: next } : t)
    }));
    setSecciones(updated); saveTorre(updated);
  };

  const addTask = () => {
    if (!addTitulo.trim() || !addSeccion) return;
    const updated = secciones.map(s => s.id !== addSeccion ? s : {
      ...s, tareas: [...s.tareas, {
        id: `t-${Date.now()}`, titulo: addTitulo.trim(), descripcion: '', prioridad: addPrior,
        estado: 'pendiente' as EstadoTarea, creadaEn: new Date().toISOString(),
      }],
    });
    setSecciones(updated); saveTorre(updated);
    setAddTitulo(''); setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white">Progreso del proyecto</span>
          <span className="text-sm font-bold text-teal-400">{progreso}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${progreso}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
          <span>{completadas} completadas</span>
          <span>{total - completadas} pendientes de {total}</span>
        </div>
      </div>

      {/* Urgentes */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
            <AlertTriangle size={11} className="text-orange-400" /> Urgentes / Alta prioridad
          </p>
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 font-bold">
            <Plus size={11} /> Nueva tarea
          </button>
        </div>

        {showAdd && (
          <div className="bg-gray-800/80 border border-teal-700/50 rounded-xl p-3 space-y-2">
            <select value={addSeccion} onChange={e => setAddSeccion(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-600">
              <option value="">Seleccionar sección</option>
              {secciones.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}
            </select>
            <input value={addTitulo} onChange={e => setAddTitulo(e.target.value)}
              placeholder="Título de la tarea..."
              onKeyDown={e => e.key === 'Enter' && addTask()}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600" />
            <div className="flex gap-2">
              {(['critica','alta','media','baja'] as Prioridad[]).map(p => (
                <button key={p} onClick={() => setAddPrior(p)}
                  className={`flex-1 text-[9px] font-bold py-1 rounded-lg capitalize transition-all border ${addPrior === p ? 'border-teal-500 text-teal-300 bg-teal-900/40' : 'border-gray-700 text-gray-500'}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={addTask}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                style={{ background: '#00A8A0' }}>Agregar</button>
              <button onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-700">Cancelar</button>
            </div>
          </div>
        )}

        {urgentes.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            {total === 0 ? 'Sin tareas. Ve a Torre de Control para crear secciones.' : '¡No hay urgentes pendientes! 🎉'}
          </div>
        ) : (
          urgentes.map(t => (
            <div key={t.id} className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIOR_COLOR[t.prioridad]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{t.titulo}</p>
                <p className="text-[10px] text-gray-500 truncate">{t.seccionTitulo}</p>
              </div>
              <button onClick={() => cycleEstado(t.seccionId, t.id, t.estado)}
                className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border transition-colors hover:border-teal-600"
                style={{ borderColor: ESTADO_DOT[t.estado], color: ESTADO_DOT[t.estado], background: `${ESTADO_DOT[t.estado]}18` }}>
                <Circle size={6} fill={ESTADO_DOT[t.estado]} />
                {ESTADO_LABEL[t.estado]}
              </button>
            </div>
          ))
        )}
      </div>

      <button onClick={() => onNavigate(AppRoute.ADMIN_TORRE_CONTROL)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-teal-400 border border-teal-800 hover:border-teal-600 transition-colors">
        <ExternalLink size={12} /> Ver Torre de Control completa
      </button>
    </div>
  );
}

// ─── Cerebro tipos (comparte storage con AdminCerebro) ───────────────────────

type NotaCategoria = 'reunión' | 'idea' | 'dev' | 'oportunidad' | 'contexto' | 'general';
type OporEstado   = 'identificada' | 'contactada' | 'negociación' | 'cerrada' | 'descartada';

interface Nota {
  id: string; titulo: string; contenido: string;
  categoria: NotaCategoria; proyecto: string;
  creadaEn: string; editadaEn: string; fijada: boolean;
}
interface Oportunidad {
  id: string; titulo: string; descripcion: string;
  proyecto: string; estado: OporEstado;
  valorEstimado?: string; siguientePaso: string; creadaEn: string;
}

const NOTAS_KEY = 'guanago_cerebro_notas_v1';
const OPORS_KEY = 'guanago_cerebro_oportunidades_v1';
const loadNotas = (): Nota[] => { try { return JSON.parse(localStorage.getItem(NOTAS_KEY) || '[]'); } catch { return []; } };
const loadOpors = (): Oportunidad[] => { try { return JSON.parse(localStorage.getItem(OPORS_KEY) || '[]'); } catch { return []; } };
const saveNotas = (d: Nota[]) => localStorage.setItem(NOTAS_KEY, JSON.stringify(d));
const saveOpors = (d: Oportunidad[]) => localStorage.setItem(OPORS_KEY, JSON.stringify(d));

const OPOR_COLOR: Record<OporEstado, string> = {
  identificada: 'text-blue-400 border-blue-700 bg-blue-900/30',
  contactada:   'text-yellow-400 border-yellow-700 bg-yellow-900/30',
  negociación:  'text-orange-400 border-orange-700 bg-orange-900/30',
  cerrada:      'text-emerald-400 border-emerald-700 bg-emerald-900/30',
  descartada:   'text-gray-500 border-gray-700 bg-gray-900/20',
};

// ─── Tab: Cerebro (lite) ──────────────────────────────────────────────────────

function CerebroTab({ onNavigate }: { onNavigate: (r: AppRoute) => void }) {
  const [inner, setInner]       = useState<'notas' | 'opors'>('notas');
  const [notas, setNotas]       = useState<Nota[]>([]);
  const [opors, setOpors]       = useState<Oportunidad[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo]     = useState('');
  const [contenido, setContenido] = useState('');
  const [categoria, setCategoria] = useState<NotaCategoria>('idea');
  const [oporTitulo, setOporTitulo]   = useState('');
  const [oporSig, setOporSig]         = useState('');
  const [oporEstado, setOporEstado]   = useState<OporEstado>('identificada');

  useEffect(() => {
    setNotas(loadNotas());
    setOpors(loadOpors());
  }, []);

  const addNota = () => {
    if (!titulo.trim()) return;
    const n: Nota = {
      id: `n-${Date.now()}`, titulo: titulo.trim(), contenido, categoria, proyecto: 'GuanaGO',
      creadaEn: new Date().toISOString(), editadaEn: new Date().toISOString(), fijada: false,
    };
    const updated = [n, ...notas];
    setNotas(updated); saveNotas(updated);
    setTitulo(''); setContenido(''); setShowForm(false);
  };

  const togglePin = (id: string) => {
    const updated = notas.map(n => n.id === id ? { ...n, fijada: !n.fijada } : n);
    setNotas(updated); saveNotas(updated);
  };

  const deleteNota = (id: string) => {
    const updated = notas.filter(n => n.id !== id);
    setNotas(updated); saveNotas(updated);
  };

  const addOpor = () => {
    if (!oporTitulo.trim()) return;
    const o: Oportunidad = {
      id: `o-${Date.now()}`, titulo: oporTitulo.trim(), descripcion: '', proyecto: 'GuanaGO',
      estado: oporEstado, siguientePaso: oporSig, creadaEn: new Date().toISOString(),
    };
    const updated = [o, ...opors];
    setOpors(updated); saveOpors(updated);
    setOporTitulo(''); setOporSig(''); setShowForm(false);
  };

  const cycleOpor = (id: string) => {
    const ciclo: OporEstado[] = ['identificada', 'contactada', 'negociación', 'cerrada', 'descartada'];
    const updated = opors.map(o => o.id === id ? { ...o, estado: ciclo[(ciclo.indexOf(o.estado) + 1) % ciclo.length] } : o);
    setOpors(updated); saveOpors(updated);
  };

  const visibleNotas = [...notas.filter(n => n.fijada), ...notas.filter(n => !n.fijada)].slice(0, 20);
  const visibleOpors = opors.filter(o => o.estado !== 'descartada' && o.estado !== 'cerrada').slice(0, 15);

  return (
    <div className="space-y-3">
      {/* Inner tabs */}
      <div className="flex gap-1 bg-gray-800/60 border border-gray-700 rounded-xl p-1">
        {[
          { id: 'notas', label: `Notas (${notas.length})`, icon: <StickyNote size={12} /> },
          { id: 'opors', label: `Oportunidades (${visibleOpors.length})`, icon: <Lightbulb size={12} /> },
        ].map(t => (
          <button key={t.id} onClick={() => { setInner(t.id as any); setShowForm(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              inner === t.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 font-bold">
          <Plus size={11} /> {inner === 'notas' ? 'Nueva nota' : 'Nueva oportunidad'}
        </button>
      </div>

      {/* Form: nota */}
      {showForm && inner === 'notas' && (
        <div className="bg-gray-800/80 border border-teal-700/50 rounded-xl p-3 space-y-2">
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de la nota"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600" />
          <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Contenido..."
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600 resize-none" />
          <div className="flex gap-1 flex-wrap">
            {(['idea','reunión','dev','oportunidad','contexto','general'] as NotaCategoria[]).map(c => (
              <button key={c} onClick={() => setCategoria(c)}
                className={`text-[9px] px-2 py-0.5 rounded-full border font-bold capitalize transition-all ${categoria === c ? 'border-teal-500 text-teal-300 bg-teal-900/40' : 'border-gray-700 text-gray-500'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addNota} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#00A8A0' }}>Guardar</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      {/* Form: oportunidad */}
      {showForm && inner === 'opors' && (
        <div className="bg-gray-800/80 border border-teal-700/50 rounded-xl p-3 space-y-2">
          <input value={oporTitulo} onChange={e => setOporTitulo(e.target.value)} placeholder="Nombre de la oportunidad"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600" />
          <input value={oporSig} onChange={e => setOporSig(e.target.value)} placeholder="Siguiente paso..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600" />
          <div className="flex gap-1 flex-wrap">
            {(['identificada','contactada','negociación','cerrada'] as OporEstado[]).map(e => (
              <button key={e} onClick={() => setOporEstado(e)}
                className={`text-[9px] px-2 py-0.5 rounded-full border font-bold capitalize transition-all ${oporEstado === e ? 'border-teal-500 text-teal-300 bg-teal-900/40' : 'border-gray-700 text-gray-500'}`}>
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addOpor} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#00A8A0' }}>Guardar</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      {/* Notas list */}
      {inner === 'notas' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {visibleNotas.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">Sin notas. ¡Crea tu primera!</div>
          ) : visibleNotas.map(n => (
            <div key={n.id} className={`bg-gray-800/60 rounded-xl p-3 border transition-colors ${n.fijada ? 'border-yellow-700/60' : 'border-gray-700/60'}`}>
              <div className="flex items-start gap-2">
                <button onClick={() => togglePin(n.id)} className={`flex-shrink-0 mt-0.5 ${n.fijada ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-500'}`}>
                  <Star size={12} fill={n.fijada ? 'currentColor' : 'none'} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{n.titulo}</p>
                  {n.contenido && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{n.contenido}</p>}
                  <span className="text-[9px] text-gray-600 capitalize mt-1 inline-block">{n.categoria}</span>
                </div>
                <button onClick={() => deleteNota(n.id)} className="text-gray-700 hover:text-red-400 flex-shrink-0">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Oportunidades list */}
      {inner === 'opors' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {visibleOpors.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">Sin oportunidades activas</div>
          ) : visibleOpors.map(o => (
            <div key={o.id} className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs font-bold text-white truncate">{o.titulo}</p>
                <button onClick={() => cycleOpor(o.id)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${OPOR_COLOR[o.estado]}`}>
                  {o.estado}
                </button>
              </div>
              {o.siguientePaso && (
                <p className="text-[11px] text-gray-400 flex items-start gap-1">
                  <Zap size={10} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  {o.siguientePaso}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => onNavigate(AppRoute.ADMIN_CEREBRO)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-teal-400 border border-teal-800 hover:border-teal-600 transition-colors">
        <ExternalLink size={12} /> Ver Cerebro completo
      </button>
    </div>
  );
}

// ─── Tab: Dashboard (KPIs + Sistema) ─────────────────────────────────────────

type CheckStatus = 'ok' | 'error' | 'checking' | 'warn';
interface SysCheck { label: string; status: CheckStatus; detail: string }

interface JarvisCtx {
  sesiones?: number;
  ultimaSesion?: string;
  resumenUltimaSesion?: string;
  modoUltimoUso?: string;
  notas?: Array<{ texto: string; categoria: string; fecha: string }>;
}

function DashboardTab({ onNavigate }: { onNavigate: (r: AppRoute) => void }) {
  const [checks, setChecks]   = useState<SysCheck[]>([
    { label: 'Backend API',    status: 'checking', detail: '' },
    { label: 'Airtable',       status: 'checking', detail: '' },
    { label: 'Agente Claude',  status: 'checking', detail: '' },
  ]);
  const [trm, setTrm]         = useState(() => { try { return parseFloat(localStorage.getItem('guanago_trm_v1') || '4200') || 4200; } catch { return 4200; } });
  const [copInput, setCopInput] = useState(100000);
  const [kpis, setKpis]       = useState({ servicios: 0, leads: 0, tareasTotal: 0, tareasOk: 0 });
  const [jarvis, setJarvis]   = useState<JarvisCtx | null>(null);

  useEffect(() => {
    // KPIs desde localStorage (Torre)
    const torre: SeccionControl[] = loadTorre();
    const allT = torre.flatMap(s => s.tareas);
    setKpis(prev => ({ ...prev, tareasTotal: allT.length, tareasOk: allT.filter(t => t.estado === 'completado').length }));

    // Memoria Jarvis desde Firestore (vía backend)
    fetch('/api/agent/jarvis-context')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setJarvis(d.data); })
      .catch(() => {});

    // System checks
    const runChecks = async () => {
      // Health check
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(4000) });
        setChecks(prev => prev.map(c => c.label === 'Backend API'
          ? { ...c, status: r.ok ? 'ok' : 'error', detail: r.ok ? `HTTP ${r.status}` : `HTTP ${r.status}` } : c));
      } catch {
        setChecks(prev => prev.map(c => c.label === 'Backend API' ? { ...c, status: 'error', detail: 'Sin respuesta' } : c));
      }
      // Config check (Airtable)
      try {
        const r = await fetch('/api/config-check', { signal: AbortSignal.timeout(4000) });
        const d = await r.json().catch(() => ({}));
        const ok = d.airtable?.hasApiKey && d.airtable?.hasBaseId;
        setChecks(prev => prev.map(c => c.label === 'Airtable'
          ? { ...c, status: ok ? 'ok' : 'warn', detail: ok ? 'API Key OK' : 'Sin credenciales' } : c));
      } catch {
        setChecks(prev => prev.map(c => c.label === 'Airtable' ? { ...c, status: 'warn', detail: 'No verificado' } : c));
      }
      // Agent check
      try {
        const r = await fetch('/api/cowork/catalogo-b2b', { signal: AbortSignal.timeout(5000) });
        const d = await r.json().catch(() => ({}));
        const cnt = d.total ?? 0;
        setChecks(prev => prev.map(c => c.label === 'Agente Claude'
          ? { ...c, status: r.ok ? 'ok' : 'warn', detail: r.ok ? `${cnt} servicios cargados` : `HTTP ${r.status}` } : c));
        if (r.ok) setKpis(prev => ({ ...prev, servicios: cnt }));
      } catch {
        setChecks(prev => prev.map(c => c.label === 'Agente Claude' ? { ...c, status: 'warn', detail: 'No verificado' } : c));
      }
    };
    runChecks();
  }, []);

  const saveTrm = (v: number) => { setTrm(v); localStorage.setItem('guanago_trm_v1', String(v)); };
  const usd = trm > 0 ? (copInput * 1.10 / trm).toFixed(2) : '0';
  const progreso = kpis.tareasTotal > 0 ? Math.round((kpis.tareasOk / kpis.tareasTotal) * 100) : 0;

  const statusIcon = (s: CheckStatus) => {
    if (s === 'ok')       return <Wifi size={13} className="text-emerald-400" />;
    if (s === 'error')    return <WifiOff size={13} className="text-red-400" />;
    if (s === 'warn')     return <AlertTriangle size={13} className="text-yellow-400" />;
    return <Loader2 size={13} className="animate-spin text-gray-500" />;
  };

  const SHORTCUTS = [
    { label: 'Torre',      route: AppRoute.ADMIN_TORRE_CONTROL,    icon: <CheckSquare size={14} className="text-blue-400" /> },
    { label: 'Cerebro',    route: AppRoute.ADMIN_CEREBRO,          icon: <Brain size={14} className="text-purple-400" /> },
    { label: 'Operaciones',route: AppRoute.ADMIN_OPERACIONES,      icon: <Activity size={14} className="text-teal-400" /> },
    { label: 'Control',    route: AppRoute.ADMIN_CONTROL_PANEL,    icon: <LayoutDashboard size={14} className="text-orange-400" /> },
  ];

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-teal-400">{kpis.servicios || '—'}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Servicios B2B</div>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{progreso}%</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Tareas completadas</div>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center col-span-2">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" style={{ width: `${progreso}%` }} />
          </div>
          <div className="text-[10px] text-gray-500">{kpis.tareasOk} de {kpis.tareasTotal} tareas completadas en la Torre</div>
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <p className="text-xs font-bold text-white mb-3 flex items-center gap-2">
          <Activity size={13} className="text-teal-400" /> Estado del sistema
        </p>
        <div className="space-y-2">
          {checks.map(c => (
            <div key={c.label} className="flex items-center gap-2">
              {statusIcon(c.status)}
              <span className="text-xs text-gray-300 flex-1">{c.label}</span>
              <span className="text-[10px] text-gray-500">{c.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TRM Calculator */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-white flex items-center gap-2">
          <TrendingUp size={13} className="text-orange-400" /> Calculadora TRM (COP → USD)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">TRM actual</label>
            <input type="number" value={trm} onChange={e => saveTrm(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-600" />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">Precio COP</label>
            <input type="number" value={copInput} onChange={e => setCopInput(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-600" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-teal-950/40 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-teal-400">${COP(Math.ceil(copInput * 1.10))}</div>
            <div className="text-[9px] text-gray-500">agencia COP (+10% buffer)</div>
          </div>
          <div className="bg-orange-950/40 rounded-xl p-3 text-center">
            <div className="text-base font-bold text-orange-400">US$ {usd}</div>
            <div className="text-[9px] text-gray-500">precio USD agencia</div>
          </div>
        </div>
      </div>

      {/* Memoria Jarvis */}
      <div className="bg-gray-800/60 border border-teal-900/60 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-teal-400 flex items-center gap-2">
          <Brain size={13} /> Memoria Jarvis
          {jarvis?.sesiones && (
            <span className="ml-auto text-[10px] text-gray-500">{jarvis.sesiones} sesiones</span>
          )}
        </p>
        {!jarvis ? (
          <p className="text-[11px] text-gray-600">Sin datos — Firestore no conectado o primera sesión.</p>
        ) : (
          <>
            {jarvis.ultimaSesion && (
              <p className="text-[11px] text-gray-400">
                Última sesión: <span className="text-gray-300">{new Date(jarvis.ultimaSesion).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                {jarvis.modoUltimoUso && <span className="ml-2 text-[10px] text-teal-600 uppercase">{jarvis.modoUltimoUso}</span>}
              </p>
            )}
            {jarvis.resumenUltimaSesion && (
              <p className="text-[11px] text-gray-400 italic">"{jarvis.resumenUltimaSesion}"</p>
            )}
            {jarvis.notas && jarvis.notas.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Últimas notas guardadas</p>
                {jarvis.notas.slice(-5).reverse().map((n, i) => {
                  const catColor: Record<string, string> = {
                    decision: 'text-orange-400', prioridad: 'text-yellow-400',
                    bloqueo: 'text-red-400', avance: 'text-green-400', nota: 'text-gray-400',
                  };
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <span className={`text-[9px] font-bold uppercase flex-shrink-0 mt-0.5 ${catColor[n.categoria] || 'text-gray-400'}`}>
                        {n.categoria}
                      </span>
                      <span className="text-[11px] text-gray-300 leading-tight">{n.texto}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Shortcuts */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Accesos rápidos</p>
        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.map(s => (
            <button key={s.label} onClick={() => onNavigate(s.route)}
              className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-gray-500 rounded-xl p-3 text-left transition-colors">
              {s.icon}
              <span className="text-xs font-bold text-gray-300">{s.label}</span>
              <ExternalLink size={10} className="text-gray-600 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'catalogo',  label: 'Cotizador',  icon: <ShoppingCart size={14} /> },
  { id: 'asistente', label: 'Asistente',  icon: <Bot size={14} /> },
  { id: 'grupos',    label: 'Grupos',     icon: <Users size={14} /> },
  { id: 'torre',     label: 'Torre',      icon: <CheckSquare size={14} /> },
  { id: 'cerebro',   label: 'Cerebro',    icon: <Brain size={14} /> },
  { id: 'dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={14} /> },
];

const AdminCowork: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [tab, setTab] = useState<Tab>('catalogo');

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">

      {/* Header */}
      <header className="px-4 pt-10 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Volver
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #003D5C, #00A8A0)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cowork B2B</h1>
            <p className="text-xs text-gray-500">GuíaSAI / GuanaGO · Hub de trabajo unificado</p>
          </div>
        </div>
      </header>

      {/* Tabs — scrollable para 6 tabs en móvil */}
      <div className="px-4 mb-4">
        <div className="flex overflow-x-auto bg-gray-800/60 border border-gray-700 rounded-xl p-1 gap-1 scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={tab === t.id ? { background: '#003D5C', border: '1px solid #00A8A0' } : undefined}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4">
        {tab === 'catalogo'  && <CotizadorTab />}
        {tab === 'asistente' && <AsistenteTab />}
        {tab === 'grupos'    && <GruposTab />}
        {tab === 'torre'     && <TorreTab onNavigate={onNavigate} />}
        {tab === 'cerebro'   && <CerebroTab onNavigate={onNavigate} />}
        {tab === 'dashboard' && <DashboardTab onNavigate={onNavigate} />}
      </div>
    </div>
  );
};

export default AdminCowork;
