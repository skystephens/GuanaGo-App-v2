import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Package2, Bot, Users, Send, Loader2,
  Copy, Check, TrendingUp, ChevronDown, ChevronUp,
  Search, Filter, RefreshCw, Building2, Sparkles,
  Calculator, DollarSign, Tag, Info,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

type Tab = 'catalogo' | 'asistente' | 'grupos';

interface Servicio {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number | null;
  descripcion: string;
  estado: string;
  precioNeto: number;
  precioOTA_turcom: number;
  precioOTA_civitatis: number;
  markupTurcom: number;
  markupCivitatis: number;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COP = (n: number) =>
  n ? `$${n.toLocaleString('es-CO')}` : '—';

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

const QUICK_PROMPTS = [
  { icon: '📋', label: 'Lista completa', prompt: 'Dame una lista completa de todos los servicios disponibles con precios netos para el OTA y el precio de venta sugerido (+23%).' },
  { icon: '✈️', label: 'Civitatis', prompt: '¿Qué servicios son más adecuados para Civitatis? ¿Cómo funciona la estructura de comisiones con ellos?' },
  { icon: '👥', label: 'Cotizar grupo', prompt: 'Quiero cotizar para una agencia: necesito un paquete para 80 personas en San Andrés, 3 días, con tours de día.' },
  { icon: '📑', label: 'Condiciones B2B', prompt: '¿Cuáles son las condiciones de pago y cancelación para agencias de viajes que trabajan con GuíaSAI?' },
];

// ─── Tab: Catálogo B2B ────────────────────────────────────────────────────────

function CatalogoTab() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cowork/catalogo-b2b');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cargando catálogo');
      setServicios(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tipos = Array.from(new Set(servicios.map(s => s.tipo).filter(Boolean))).sort();

  const filtered = servicios.filter(s => {
    const matchSearch = !search || s.nombre.toLowerCase().includes(search.toLowerCase());
    const matchTipo = !tipoFilter || s.tipo === tipoFilter;
    return matchSearch && matchTipo;
  });

  const copyPriceList = () => {
    const lines = [
      'CATÁLOGO B2B — TARIFAS NETAS 2026 | GuíaSAI / GuanaGO',
      '─'.repeat(70),
      ...filtered.map(s =>
        `${s.nombre} | ${s.tipo} | Neto: ${COP(s.precioNeto)} COP | tur.com +23%: ${COP(s.precioOTA_turcom)} | Civitatis +25%: ${COP(s.precioOTA_civitatis)} COP | Cap: ${s.capacidad ?? '?'} pax`
      ),
      '',
      `* Precios netos. tur.com agrega +23% | Civitatis agrega +25% al precio de venta al turista.`,
      `* Descuentos grupos: 50+ pax (-10%), 100+ (-15%), 150+ (-20%)`,
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setCopied('lista');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-3 flex gap-2.5">
        <Info size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 leading-relaxed">
          <strong>Precios netos para OTAs.</strong>{' '}
          <span className="text-amber-300">tur.com: +23%</span> · <span className="text-amber-300">Civitatis: +25%</span> sobre el neto para obtener precio de venta al turista.{' '}
          <span className="text-amber-400">No compartir estos precios con el público.</span>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[160px] relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar servicio..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-teal-600"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={e => setTipoFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-teal-600"
        >
          <option value="">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={copyPriceList}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors"
        >
          {copied === 'lista' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          {copied === 'lista' ? 'Copiado' : 'Copiar lista'}
        </button>
        <button
          onClick={load}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats rápidas */}
      {!loading && servicios.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-white">{filtered.length}</div>
            <div className="text-[10px] text-gray-500">servicios</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-teal-400">
              {filtered.length > 0 ? COP(Math.round(filtered.reduce((a, s) => a + s.precioNeto, 0) / filtered.length)) : '—'}
            </div>
            <div className="text-[10px] text-gray-500">neto promedio</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-orange-400">{tipos.length}</div>
            <div className="text-[10px] text-gray-500">categorías</div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-600">
          <Loader2 size={20} className="animate-spin mr-2" /> Cargando catálogo desde Airtable...
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-300">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm">
          {search || tipoFilter ? 'Sin resultados para ese filtro' : 'No hay servicios con "Precio actualizado" en Airtable'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <ServicioRow key={s.id} s={s} copied={copied} setCopied={setCopied} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServicioRow({ s, copied, setCopied }: {
  s: Servicio;
  copied: string | null;
  setCopied: (v: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const copyPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${s.nombre} | Neto: ${COP(s.precioNeto)} COP | tur.com: ${COP(s.precioOTA_turcom)} | Civitatis: ${COP(s.precioOTA_civitatis)} COP`;
    navigator.clipboard.writeText(text);
    setCopied(s.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-gray-700/30 transition-colors"
      >
        {/* Tipo badge */}
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${TIPO_BADGE[s.tipo] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
          {s.tipo || 'Servicio'}
        </span>

        {/* Nombre */}
        <span className="flex-1 text-sm font-bold text-white truncate">{s.nombre}</span>

        {/* Precios */}
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-bold text-teal-400">{COP(s.precioNeto)}</div>
          <div className="text-[10px] text-gray-500">neto OTA</div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-[10px] font-bold text-orange-400">{COP(s.precioOTA_turcom)}</div>
          <div className="text-[9px] text-gray-600">tur.com +23%</div>
          <div className="text-[10px] font-bold text-amber-300">{COP(s.precioOTA_civitatis)}</div>
          <div className="text-[9px] text-gray-600">Civitatis +25%</div>
        </div>

        {expanded ? <ChevronUp size={13} className="text-gray-600 flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-600 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-700/50 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Capacidad: </span>
              <span className="text-gray-200">{s.capacidad ? `${s.capacidad} pax` : 'No especificada'}</span>
            </div>
            <div>
              <span className="text-gray-500">Estado: </span>
              <span className={`font-medium ${s.estado === 'Activo' ? 'text-green-400' : 'text-yellow-400'}`}>{s.estado}</span>
            </div>
            {s.descripcion && (
              <div className="col-span-2 text-gray-400 italic leading-relaxed">{s.descripcion}</div>
            )}
          </div>
          <button
            onClick={copyPrice}
            className="flex items-center gap-1.5 text-[10px] bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-gray-300 transition-colors"
          >
            {copied === s.id ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            {copied === s.id ? 'Copiado' : 'Copiar precio'}
          </button>
        </div>
      )}
    </div>
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

// ─── Componente principal ─────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'catalogo',  label: 'Catálogo',   icon: <Package2 size={14} /> },
  { id: 'asistente', label: 'Asistente',  icon: <Bot size={14} /> },
  { id: 'grupos',    label: 'Grupos',     icon: <Users size={14} /> },
];

const AdminCowork: React.FC<Props> = ({ onBack }) => {
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
            <p className="text-xs text-gray-500">GuíaSAI / GuanaGO · Asistente de rentabilidad para OTAs</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-gray-800/60 border border-gray-700 rounded-xl p-1 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
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
        {tab === 'catalogo'  && <CatalogoTab />}
        {tab === 'asistente' && <AsistenteTab />}
        {tab === 'grupos'    && <GruposTab />}
      </div>
    </div>
  );
};

export default AdminCowork;
