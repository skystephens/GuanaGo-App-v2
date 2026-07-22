import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Send, Trash2, Calendar, Users, DollarSign, Clock,
  CheckCircle2, AlertCircle, FileText, Search, Filter, User, Mail, Phone,
  Download, Eye, Loader2, Bot, ChevronDown, ChevronUp, Sparkles, Link2,
  CreditCard, X, Pencil, Check, CalendarDays, MapPin, MessageSquare, Info,
} from 'lucide-react';
import QuotationMapView, { MapAccommodation } from '../../components/quotation/QuotationMapView';
import DynamicItineraryBuilder from './DynamicItineraryBuilder';
import { AppRoute, Cotizacion, CotizacionItem, Tour, QuoteStatus, QUOTE_STATUS_CONFIG, QuoteDisplayConfig, DEFAULT_QUOTE_DISPLAY_CONFIG } from '../../types';
import {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  addCotizacionItem,
  updateCotizacion,
  deleteCotizacionItem,
  updateCotizacionItem,
  validateScheduleConflicts,
  validateCapacity,
  validateOperatingDay
} from '../../services/quotesService';
import { cachedApi } from '../../services/cachedApi';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ─── Date helpers ─────────────────────────────────────────────────────────────
/** Convierte YYYY-MM-DD a Date local (evita el offset UTC de new Date("YYYY-MM-DD")) */
function safeDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const parsed = new Date(d + 'T12:00:00');
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ─── Backend URL ──────────────────────────────────────────────────────────────
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

// ─── Agente Cotizador ─────────────────────────────────────────────────────────

interface AgentMsg { role: 'user' | 'assistant'; content: string; }

interface ParsedQuoteAction {
  nombre?: string;
  email?: string;
  telefono?: string;
  fechaInicio?: string;
  fechaFin?: string;
  adultos?: number;
  ninos?: number;
  bebes?: number;
  notasInternas?: string;
}

/**
 * Intenta extraer datos estructurados del mensaje del agente.
 * El agente puede responder con un bloque JSON así:
 * ACTION:create_quote:{"nombre":"...","fechaInicio":"...","adultos":2}
 */
function parseAgentAction(text: string): ParsedQuoteAction | null {
  try {
    const match = text.match(/ACTION:create_quote:(\{[^}]+\})/);
    if (match) return JSON.parse(match[1]) as ParsedQuoteAction;
  } catch { /* ignored */ }
  return null;
}

const QUICK_ACTIONS = [
  { label: 'Resumen cotizaciones', icon: '📊', prompt: 'Dame un resumen rápido del estado de las cotizaciones activas.' },
  { label: 'Nueva cotización', icon: '✏️', prompt: 'Quiero crear una nueva cotización. Pregúntame los datos necesarios.' },
  { label: 'Recomendaciones', icon: '💡', prompt: 'Tengo un grupo de 4 adultos para 5 días en San Andrés. ¿Qué servicios me recomiendas incluir en la cotización?' },
  { label: 'Precio estimado', icon: '💰', prompt: '¿Cuál sería el precio estimado para un paquete de 5 días para 2 adultos incluyendo hotel, tours acuáticos y traslado?' },
];

interface AgenteCotizadorProps {
  cotizaciones: Cotizacion[];
  services: Tour[];
  onPreFillForm: (data: ParsedQuoteAction) => void;
  onSwitchToCreate: () => void;
}

function AgenteCotizador({ cotizaciones, services, onPreFillForm, onSwitchToCreate }: AgenteCotizadorProps) {
  const [msgs, setMsgs]       = useState<AgentMsg[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [convId]              = useState(() => `cot-${Date.now()}`);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const buildContext = useCallback(() => {
    const total   = cotizaciones.length;
    const borrador = cotizaciones.filter(c => c.estado === 'Draft').length;
    const enviadas = cotizaciones.filter(c => c.estado === 'Sent').length;
    const recientes = cotizaciones.slice(0, 3).map(c =>
      `${c.nombre} · ${c.adultos + (c.ninos || 0)} pax · $${(c.precioTotal || 0).toLocaleString('es-CO')}`
    ).join('; ');
    const catalogo = services.slice(0, 10).map(s =>
      `${s.title} (${s.category}) $${(s.price || 0).toLocaleString('es-CO')}`
    ).join(', ');
    return `\n\n[CONTEXTO COTIZACIONES]\nTotal: ${total} | Borrador: ${borrador} | Enviadas: ${enviadas}\nRecientes: ${recientes || 'ninguna'}\nCatálogo (primeros 10): ${catalogo || 'cargando…'}\n\nSi el usuario pide crear una cotización con datos concretos (nombre, fechas, pax), PRIMERO responde de forma amigable, LUEGO agrega en la última línea: ACTION:create_quote:{"nombre":"X","fechaInicio":"YYYY-MM-DD","adultos":N}`;
  }, [cotizaciones, services]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: AgentMsg = { role: 'user', content: trimmed };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed + buildContext(),
          mode: 'admin',
          conversation_id: convId,
          history: msgs.slice(-6),
        }),
      });
      const data = await res.json();
      const reply: string = data.reply || '…';

      // Parsear posible acción de creación de cotización
      const action = parseAgentAction(reply);
      const cleanReply = reply.replace(/ACTION:create_quote:\{[^}]+\}/g, '').trim();

      setMsgs(prev => [...prev, { role: 'assistant', content: cleanReply }]);

      if (action && Object.keys(action).length > 0) {
        onPreFillForm(action);
        setTimeout(() => onSwitchToCreate(), 600);
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: '⚠️ Error al contactar al agente.' }]);
    } finally {
      setLoading(false);
    }
  }, [msgs, loading, convId, buildContext, onPreFillForm, onSwitchToCreate]);

  return (
    <div className="bg-gradient-to-br from-blue-950/50 via-gray-900 to-gray-900 rounded-2xl border border-blue-800/40 overflow-hidden mb-6">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <Bot size={16} className="text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              Asistente de Cotizaciones
              <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">Claude</span>
            </p>
            <p className="text-[11px] text-gray-500">
              {open ? 'Haz clic para minimizar' : 'Crea cotizaciones por voz · Analiza precios · Recomienda servicios'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {msgs.length > 0 && !open && (
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">{msgs.length}</span>
          )}
          {open
            ? <ChevronUp size={15} className="text-gray-600" />
            : <ChevronDown size={15} className="text-gray-600" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-blue-900/30">
          {/* Quick actions */}
          {msgs.length === 0 && (
            <div className="px-4 pt-4 pb-2 space-y-2">
              <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Acciones rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => send(a.prompt)}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold bg-blue-900/30 border border-blue-800/40 text-blue-300 hover:bg-blue-800/40 transition-colors disabled:opacity-50 text-left"
                  >
                    <span className="text-base">{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensajes */}
          {msgs.length > 0 && (
            <div className="px-4 pt-4 max-h-56 overflow-y-auto space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-blue-600/20 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <Sparkles size={11} className="text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start items-center gap-2 pl-8">
                  <div className="bg-gray-800 border border-gray-700 px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
                    <Loader2 size={12} className="text-blue-400 animate-spin" />
                    <span className="text-[11px] text-gray-500">Preparando cotización…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-4">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder='Ej: "Cotización para María, 4 adultos, 20 al 25 de mayo…"'
              disabled={loading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
            >
              {loading
                ? <Loader2 size={14} className="animate-spin text-white" />
                : <Send size={14} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface AdminQuotesProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const AdminQuotes: React.FC<AdminQuotesProps> = ({ onBack, onNavigate }) => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [services, setServices] = useState<Tour[]>([]);
  const [expandedDescId, setExpandedDescId] = useState<string | null>(null);
  const [alojamientos, setAlojamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  
  // Estados para edición completa de items (fecha, pax)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<Partial<CotizacionItem>>({});

  // Estado para edición inline de precio (solo precio, sin abrir todo el editor)
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>('');
  const inlinePriceSavingRef = useRef(false); // evita doble-trigger Enter+blur

  // Filtro B2C / B2B en la lista
  const [filterSource, setFilterSource] = useState<'all' | 'b2c' | 'b2b'>('all');
  // Búsqueda por nombre o teléfono
  const [searchQuery, setSearchQuery] = useState('');
  // Configuración de visualización del link público
  const [displayConfig, setDisplayConfig] = useState<QuoteDisplayConfig>(DEFAULT_QUOTE_DISPLAY_CONFIG);
  // Estado de guardado de opción por ítem
  const [savingOpcionId, setSavingOpcionId] = useState<string | null>(null);
  // Cambio de estado inline en lista
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  // Filtro por estado en lista
  const [filterEstado, setFilterEstado] = useState<string>('all');
  // Orden de la lista por fecha de última realización (creación)
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  // Panel CRM / Seguimiento
  const [crmNote, setCrmNote] = useState('');
  const [savingCrmNote, setSavingCrmNote] = useState(false);

  // Estado para edición de datos básicos de la cotización (header)
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm]       = useState<{
    nombre: string; telefono: string; email: string;
    fechaInicio: string; fechaFin: string;
    adultos: number; ninos: number; bebes: number;
    opcion: string;
  }>({ nombre: '', telefono: '', email: '', fechaInicio: '', fechaFin: '', adultos: 0, ninos: 0, bebes: 0, opcion: '' });
  const [savingHeader, setSavingHeader]   = useState(false);

  // Inline edit personas / cantidad
  const [inlinePersonasId, setInlinePersonasId] = useState<string | null>(null);
  const [inlinePersonasValue, setInlinePersonasValue] = useState('');
  const inlinePersonasSavingRef = useRef(false);
  const [inlineCantidadId, setInlineCantidadId] = useState<string | null>(null);
  const [inlineCantidadValue, setInlineCantidadValue] = useState('');
  const inlineCantidadSavingRef = useRef(false);
  const [inlineTotalId, setInlineTotalId] = useState<string | null>(null);
  const [inlineTotalValue, setInlineTotalValue] = useState('');
  const inlineTotalSavingRef = useRef(false);

  // ── Itinerario ─────────────────────────────────────────────────────────────
  const [showItinerario, setShowItinerario] = useState(false);

  // ── Mapa de alojamientos ───────────────────────────────────────────────────
  const [showMapView, setShowMapView] = useState(false);

  // ── Notas inline ───────────────────────────────────────────────────────────
  const [editingNotas, setEditingNotas]   = useState(false);
  const [notasValue, setNotasValue]       = useState('');
  const [notasSaving, setNotasSaving]     = useState(false);

  const handleSaveNotas = async () => {
    if (!selectedCotizacion) return;
    setNotasSaving(true);
    try {
      await updateCotizacion(selectedCotizacion.id, { notasInternas: notasValue });
      setSelectedCotizacion(prev => prev ? { ...prev, notasInternas: notasValue } : prev);
      setEditingNotas(false);
    } catch {
      alert('Error guardando notas');
    } finally {
      setNotasSaving(false);
    }
  };

  // ── Wompi Payment Link (antes PayU — migrado jul-2026) ─────────────────────
  const [showPayModal, setShowPayModal]   = useState(false);
  const [payLoading, setPayLoading]       = useState(false);
  const [payResult, setPayResult]         = useState<{ pagoUrl: string; referenceCode: string; test: boolean } | null>(null);
  const [payAmount, setPayAmount]         = useState('');

  const handleGeneratePayLink = async () => {
    if (!selectedCotizacion) return;
    const amount = parseFloat(payAmount) || selectedCotizacion.precioTotal;
    if (!amount || amount <= 0) { alert('El total de la cotización es $0. Agrega servicios primero.'); return; }
    setPayLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cotizacionId: selectedCotizacion.id,
          amount,
          description: `Cotización GuíaSAI — ${selectedCotizacion.nombre}`,
          buyerName:  selectedCotizacion.nombre,
          buyerEmail: selectedCotizacion.email,
          buyerPhone: selectedCotizacion.telefono,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando link');
      setPayResult(data);
    } catch (err: any) {
      alert('❌ ' + err.message);
    } finally {
      setPayLoading(false);
    }
  };

  // Modo agregar item: catálogo o ítem libre
  const [addItemMode, setAddItemMode] = useState<'catalog' | 'free'>('catalog');
  const [freeItemForm, setFreeItemForm] = useState<{
    nombre: string; tipo: CotizacionItem['servicioTipo']; valorUnitario: string; personas: string; cantidad: string;
    aerolinea: string; origen: string; destino: string; tipoVuelo: string; notasTiquete: string;
    images: string[];
  }>({ nombre: '', tipo: 'tiquete', valorUnitario: '', personas: '2', cantidad: '1',
       aerolinea: 'JetSmart', origen: '', destino: 'ADZ', tipoVuelo: 'Ida y vuelta', notasTiquete: '',
       images: [] });
  const freeItemFileRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fechaInicio: '',
    fechaFin: '',
    adultos: 2,
    ninos: 0,
    bebes: 0,
    descuento: 0,
    notasInternas: ''
  });

  // Servicios disponibles filtrados
  const [searchService, setSearchService] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tour' | 'hotel' | 'taxi'>('all');

  useEffect(() => {
    loadCotizaciones();
    loadServices();
    cachedApi.getAlojamientos().then(data => setAlojamientos(data));
  }, []);

  // Diagnóstico del mapa — eliminar cuando el botón funcione
  useEffect(() => {
    if (items.length === 0) return;
    console.log('🗺️ MAP-DEBUG items:', items.map(i => ({
      nombre: i.servicioNombre, tipo: i.servicioTipo,
      personalizado: i.esPersonalizado, servicioId: i.servicioId
    })));
    console.log('🗺️ MAP-DEBUG alojamientos cargados:', alojamientos.length,
      alojamientos.slice(0,5).map(a => a.title));
    console.log('🗺️ MAP-DEBUG hotelItemsInQuote:', items.filter(item => {
      if (item.esPersonalizado) return false;
      if (item.servicioTipo === 'hotel') return true;
      return alojamientos.some(a =>
        a.id === item.servicioId ||
        (a.title || '').toLowerCase().trim() === item.servicioNombre.toLowerCase().trim()
      );
    }).map(i => i.servicioNombre));
  }, [items, alojamientos]);

  // Recalcular el total cuando cambien los items
  useEffect(() => {
    if (selectedCotizacion && items.length > 0) {
      const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      console.log(`💰 Total recalculado desde items: $${calculatedTotal}`);
      if (selectedCotizacion.precioTotal !== calculatedTotal) {
        setSelectedCotizacion({
          ...selectedCotizacion,
          precioTotal: calculatedTotal
        });
      }
    }
  }, [items]);

  const loadCotizaciones = async () => {
    setLoading(true);
    const data = await getCotizaciones();
    setCotizaciones(data);
    setLoading(false);
  };

  const loadServices = async (forceRefresh = false) => {
    // Usa caché local (localStorage, TTL 48h) — evita llamar Airtable en cada apertura
    // Pasa forceRefresh: true cuando se agrega un servicio nuevo en Airtable
    const data = await cachedApi.getServices(forceRefresh ? { forceRefresh: true } : undefined);
    setServices(data as unknown as Tour[]);
  };

  const refreshServices = async () => {
    setServices([]);
    await loadServices(true);
  };

  const handleCreateCotizacion = async () => {
    if (!formData.fechaInicio || !formData.fechaFin) {
      alert('Completa las fechas de viaje');
      return;
    }

    const newCotizacion: Omit<Cotizacion, 'id'> = {
      nombre: formData.nombre.trim() || `Cotización ${new Date().toLocaleDateString('es-CO')}`,
      email: formData.email,
      telefono: formData.telefono,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      adultos: formData.adultos,
      ninos: formData.ninos,
      bebes: formData.bebes,
      fechaCreacion: new Date().toISOString(),
      estado: 'Draft',
      precioTotal: 0,
      notasInternas: formData.notasInternas
    };

    const created = await createCotizacion(newCotizacion);
    if (created) {
      setSelectedCotizacion(created);
      setView('detail');
      loadCotizaciones();
    }
  };

  const handleAddService = async (service: Tour) => {
    if (!selectedCotizacion) {
      alert('Por favor selecciona una cotización primero');
      return;
    }

    try {
      console.log('📋 Agregando servicio:', service.title, 'a cotización:', selectedCotizacion.id);

    // Extraer horarios del servicio
    const horarios = (service as any).schedule || (service as any).horario || '';
    const horarioMatch = horarios.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    const horarioInicio = horarioMatch ? horarioMatch[1] : '';
    const horarioFin = horarioMatch ? horarioMatch[2] : '';

    // Validar horarios contra items existentes
    const validation = validateScheduleConflicts(
      {
        fecha: selectedCotizacion.fechaInicio,
        horarioInicio,
        horarioFin,
        servicioNombre: service.title
      } as Partial<CotizacionItem>,
      items
    );

    if (!validation.valid) {
      const proceed = confirm(`⚠️ Conflictos detectados:\n${validation.conflicts.join('\n')}\n\n¿Agregar de todas formas?`);
      if (!proceed) return;
    }

    // Validar capacidad — se avisa pero se permite continuar (grupos grandes,
    // cotización de eventos como Copa de la Isla / Seven Colors, etc. suelen
    // superar la capacidad "estándar" cargada en el servicio).
    const capacityCheck = validateCapacity(service, formData.adultos, formData.ninos, formData.bebes);
    if (!capacityCheck.valid) {
      const proceedCapacity = confirm(`⚠️ ${capacityCheck.message}\n\n¿Agregar de todas formas? (útil para grupos que superan la capacidad estándar del servicio)`);
      if (!proceedCapacity) return;
    }

    // Validar día de operación - verificar si el servicio opera en ALGÚN día del rango
    // Por ahora, solo mostrar advertencia pero permitir agregar (el cliente seleccionará el día específico después)
    const diasOperacion = (service as any).operatingDays || (service as any).diasOperacion || '';
    if (diasOperacion && diasOperacion.length > 0) {
      // Verificar si el día específico está dentro del rango de fechas
      const startDate = safeDate(selectedCotizacion.fechaInicio) ?? new Date();
      const endDate = safeDate(selectedCotizacion.fechaFin) ?? new Date();
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      // Buscar si hay algún día en el rango donde el servicio opera
      let hasOperatingDayInRange = false;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayName = dayNames[d.getDay()];
        if (diasOperacion.toLowerCase().includes(dayName.toLowerCase())) {
          hasOperatingDayInRange = true;
          break;
        }
      }
      
      if (!hasOperatingDayInRange) {
        const proceed = confirm(`⚠️ ${service.title} opera en: ${diasOperacion}\nNo hay coincidencia en el rango ${safeDate(selectedCotizacion.fechaInicio)?.toLocaleDateString() ?? '—'} - ${safeDate(selectedCotizacion.fechaFin)?.toLocaleDateString() ?? '—'}\n\n¿Agregar de todas formas?`);
        if (!proceed) return;
      }
    }

    const payingPeople = (selectedCotizacion.adultos || 0) + (selectedCotizacion.ninos || 0);
    const valorUnitario = service.price || (service as any).precio || 0;

    // Modelo Excel: subtotal = valorUnitario × personas × cantidad
    const category = service.category || (service as any).tipo || '';
    const isHotel = category === 'hotel';
    const isTaxi  = category === 'taxi';

    let personas = payingPeople || 1;
    let cantidad = 1;
    let fechaFin: string | undefined = undefined;

    if (isHotel) {
      const startDate = new Date(selectedCotizacion.fechaInicio);
      const endDate   = new Date(selectedCotizacion.fechaFin);
      cantidad = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      fechaFin = selectedCotizacion.fechaFin;
    } else if (isTaxi) {
      personas = 1;
      cantidad = 1;
    }

    const subtotal = valorUnitario * personas * cantidad;
    console.log(`💰 ${category || 'Tour'}: $${valorUnitario} × ${personas}pax × ${cantidad}u = $${subtotal}`);

    const newItem: Omit<CotizacionItem, 'id'> = {
      cotizacionId: selectedCotizacion.id,
      servicioId: service.id,
      servicioNombre: service.title || (service as any).nombre,
      servicioTipo: (service.category || (service as any).tipo) as CotizacionItem['servicioTipo'],
      fecha: selectedCotizacion.fechaInicio,
      fechaFin,
      horarioInicio,
      horarioFin,
      adultos: formData.adultos,
      ninos: formData.ninos,
      bebes: formData.bebes,
      valorUnitario,
      personas,
      cantidad,
      precioUnitario: valorUnitario,
      subtotal,
      esPersonalizado: false,
      status: validation.valid ? 'disponible' : 'conflicto',
      conflictos: validation.conflicts
    };

    console.log('📦 Enviando item a Airtable:', newItem);

    const created = await addCotizacionItem(newItem);
    if (created) {
      const updatedItems = [...items, created];
      setItems(updatedItems);
      
      // Actualizar precio total sumando todos los items
      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      console.log(`💰 Nuevo total de cotización: $${newTotal}`);
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
      
      // Recargar cotización
      const updated = await getCotizacionById(selectedCotizacion.id);
      if (updated) {
        setSelectedCotizacion(updated);
        setItems(updated.items || []);
      }
      // Sin alerta - el servicio se visualiza automáticamente en la sección de servicios incluidos
    } else {
      alert('❌ Error al agregar el servicio');
    }
    } catch (error) {
      console.error('❌ Error en handleAddService:', error);
      alert('❌ Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const success = await deleteCotizacionItem(itemId);
    if (success) {
      const newItems = items.filter(i => i.id !== itemId);
      setItems(newItems);
      
      // Actualizar precio total sumando todos los items restantes
      if (selectedCotizacion) {
        const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        console.log(`💰 Nuevo total después de eliminar: $${newTotal}`);
        await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
        
        const updated = await getCotizacionById(selectedCotizacion.id);
        if (updated) {
          setSelectedCotizacion(updated);
          setItems(updated.items || []);
        }
      }
    }
  };

  const handleFreeItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - freeItemForm.images.length;
    if (remaining <= 0) return;

    files.slice(0, remaining).forEach(file => {
      const img = new Image();
      const blobUrl = URL.createObjectURL(file);
      img.onload = async () => {
        // Redimensionar a máx 800px
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobUrl);

        try {
          // Subir a Firebase Storage → obtener URL pública permanente
          const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.75));
          const path = `cotizaciones/items/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
          const downloadUrl = await getDownloadURL(storageRef);
          setFreeItemForm(prev => ({ ...prev, images: [...prev.images, downloadUrl].slice(0, 4) }));
        } catch (err) {
          console.error('Error subiendo imagen a Firebase Storage:', err);
          // Fallback: usar base64 (solo sirve para el PDF en esta sesión, no se guardará en Airtable)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setFreeItemForm(prev => ({ ...prev, images: [...prev.images, dataUrl].slice(0, 4) }));
        }
      };
      img.src = blobUrl;
    });
    e.target.value = '';
  };

  const handleAddFreeItem = async () => {
    if (!selectedCotizacion) return;
    let nombre = freeItemForm.nombre.trim();

    // Tiquete: auto-build nombre from flight details
    if (freeItemForm.tipo === 'tiquete') {
      const orig = (freeItemForm.origen || '').toUpperCase().trim();
      const dest = (freeItemForm.destino || '').toUpperCase().trim();
      if (!orig || !dest) { alert('Ingresa origen y destino del vuelo'); return; }
      const notasPart = freeItemForm.notasTiquete.trim() ? ` | ${freeItemForm.notasTiquete.trim()}` : '';
      nombre = `✈️ ${freeItemForm.aerolinea} · ${orig}→${dest} · ${freeItemForm.tipoVuelo}${notasPart}`;
    }

    const valorUnitario = parseFloat(freeItemForm.valorUnitario);
    const personas = parseInt(freeItemForm.personas) || 1;
    const cantidad = parseInt(freeItemForm.cantidad) || 1;

    if (!nombre) { alert('Escribe el nombre del ítem'); return; }
    if (isNaN(valorUnitario) || valorUnitario <= 0) { alert('Ingresa un valor unitario válido'); return; }

    const subtotal = valorUnitario * personas * cantidad;

    const newItem: Omit<CotizacionItem, 'id'> = {
      cotizacionId: selectedCotizacion.id,
      servicioNombre: nombre,
      servicioTipo: freeItemForm.tipo,
      fecha: selectedCotizacion.fechaInicio,
      adultos: 0,
      ninos: 0,
      bebes: 0,
      valorUnitario,
      personas,
      cantidad,
      precioUnitario: valorUnitario,
      subtotal,
      esPersonalizado: true,
      images: freeItemForm.images.length > 0 ? freeItemForm.images : undefined,
      status: 'disponible',
      conflictos: []
    };

    const created = await addCotizacionItem(newItem);
    if (created) {
      const updatedItems = [...items, created];
      setItems(updatedItems);
      const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
      setSelectedCotizacion(prev => prev ? { ...prev, precioTotal: newTotal } : prev);
      setFreeItemForm({ nombre: '', tipo: 'tour', valorUnitario: '', personas: String((selectedCotizacion?.adultos || 0) + (selectedCotizacion?.ninos || 0) || 2), cantidad: '1',
        aerolinea: 'JetSmart', origen: '', destino: 'ADZ', tipoVuelo: 'Ida y vuelta', notasTiquete: '', images: [] });
    } else {
      alert('❌ Error al agregar el ítem');
    }
  };

  const handleOpenEditHeader = () => {
    if (!selectedCotizacion) return;
    setHeaderForm({
      nombre:      selectedCotizacion.nombre      || '',
      telefono:    selectedCotizacion.telefono    || '',
      email:       selectedCotizacion.email       || '',
      fechaInicio: selectedCotizacion.fechaInicio || '',
      fechaFin:    selectedCotizacion.fechaFin    || '',
      adultos:     selectedCotizacion.adultos     ?? 0,
      ninos:       selectedCotizacion.ninos       ?? 0,
      bebes:       selectedCotizacion.bebes       ?? 0,
      opcion:      (selectedCotizacion as any).opcion || '',
    });
    setEditingHeader(true);
  };

  const handleSaveHeader = async () => {
    if (!selectedCotizacion) return;
    setSavingHeader(true);
    try {
      const updates: any = {
        nombre:      headerForm.nombre.trim()  || selectedCotizacion.nombre,
        telefono:    headerForm.telefono.trim(),
        email:       headerForm.email.trim(),
        fechaInicio: headerForm.fechaInicio,
        fechaFin:    headerForm.fechaFin,
        adultos:     headerForm.adultos,
        ninos:       headerForm.ninos,
        bebes:       headerForm.bebes,
      };
      if (headerForm.opcion) updates.opcion = headerForm.opcion;
      await updateCotizacion(selectedCotizacion.id, updates);
      setSelectedCotizacion(prev => prev ? { ...prev, ...updates } : prev);
      setEditingHeader(false);
    } finally {
      setSavingHeader(false);
    }
  };

  const handleStartEditItem = (item: CotizacionItem) => {
    setEditingItemId(item.id);
    setEditingItemData({
      ...item,
      precioEditado: item.precioEditado || item.precioUnitario
    });
  };

  const handleSaveEditItem = async (itemId: string) => {
    if (!editingItemData || !selectedCotizacion) return;

    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const currentItem = items[itemIndex];

    // Modelo Excel: subtotal = valorUnitario × personas × cantidad
    const valUnit  = editingItemData.valorUnitario  ?? currentItem.valorUnitario  ?? currentItem.precioUnitario;
    const personas = editingItemData.personas        ?? currentItem.personas        ?? 1;
    const cantidad = editingItemData.cantidad        ?? currentItem.cantidad        ?? 1;
    const newSubtotal = valUnit * personas * cantidad;

    const updatedItem: CotizacionItem = {
      ...currentItem,
      ...editingItemData,
      valorUnitario: valUnit,
      personas,
      cantidad,
      precioUnitario: valUnit,
      precioEditado: undefined,
      subtotal: newSubtotal
    };

    // Guardar en Airtable — solo campos que cambiaron (evita 422 por linked records)
    const patchFields: Partial<CotizacionItem> = {
      valorUnitario: valUnit,
      personas,
      cantidad,
      subtotal: newSubtotal,
      ...(editingItemData.servicioNombre && editingItemData.servicioNombre !== currentItem.servicioNombre
        ? { servicioNombre: editingItemData.servicioNombre } : {}),
      // Imágenes: solo si cambiaron (ítems libres)
      ...(editingItemData.images !== undefined ? { images: editingItemData.images } : {}),
    };
    const saved = await updateCotizacionItem(itemId, patchFields);
    if (!saved) {
      alert('❌ Error al guardar el item');
      return;
    }

    const updatedItems = [...items];
    updatedItems[itemIndex] = updatedItem;
    setItems(updatedItems);

    // Actualizar precio total
    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });

    setEditingItemId(null);
    setEditingItemData({});
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemData({});
  };

  /** Guarda solo el precio editado inline, recalcula subtotal y persiste */
  const handleSaveInlinePrice = async (itemId: string) => {
    // Guard: evita doble-disparo cuando Enter y onBlur se ejecutan juntos
    if (inlinePriceSavingRef.current) return;
    inlinePriceSavingRef.current = true;

    if (!selectedCotizacion) { inlinePriceSavingRef.current = false; return; }
    const newPrice = parseFloat(inlinePriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setInlinePriceId(null);
      inlinePriceSavingRef.current = false;
      return;
    }

    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) { inlinePriceSavingRef.current = false; return; }
    const currentItem = items[itemIndex];

    // Modelo Excel: subtotal = valorUnitario × personas × cantidad
    const newSubtotal = newPrice * (currentItem.personas || 1) * (currentItem.cantidad || 1);

    const updatedItem: CotizacionItem = {
      ...currentItem,
      valorUnitario: newPrice,
      precioUnitario: newPrice,
      precioEditado: newPrice,
      subtotal: newSubtotal,
    };

    const saved = await updateCotizacionItem(itemId, { valorUnitario: newPrice, subtotal: newSubtotal });
    if (saved) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = updatedItem;
      setItems(updatedItems);
      const newTotal = updatedItems.reduce((sum, i) => sum + (i.subtotal || 0), 0);
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
      setSelectedCotizacion(prev => prev ? { ...prev, precioTotal: newTotal } : prev);
    }
    setInlinePriceId(null);
    inlinePriceSavingRef.current = false;
  };

  const handleSaveInlinePersonas = async (itemId: string) => {
    if (inlinePersonasSavingRef.current) return;
    inlinePersonasSavingRef.current = true;
    if (!selectedCotizacion) { inlinePersonasSavingRef.current = false; return; }
    const newPersonas = parseInt(inlinePersonasValue);
    if (isNaN(newPersonas) || newPersonas < 1) { setInlinePersonasId(null); inlinePersonasSavingRef.current = false; return; }
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) { inlinePersonasSavingRef.current = false; return; }
    const currentItem = items[itemIndex];
    const newSubtotal = currentItem.valorUnitario * newPersonas * currentItem.cantidad;
    const updatedItem: CotizacionItem = { ...currentItem, personas: newPersonas, subtotal: newSubtotal };
    const saved = await updateCotizacionItem(itemId, { personas: newPersonas, subtotal: newSubtotal });
    if (saved) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = updatedItem;
      setItems(updatedItems);
      const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
      setSelectedCotizacion(prev => prev ? { ...prev, precioTotal: newTotal } : prev);
    }
    setInlinePersonasId(null);
    inlinePersonasSavingRef.current = false;
  };

  const handleSaveInlineCantidad = async (itemId: string) => {
    if (inlineCantidadSavingRef.current) return;
    inlineCantidadSavingRef.current = true;
    if (!selectedCotizacion) { inlineCantidadSavingRef.current = false; return; }
    const newCantidad = parseInt(inlineCantidadValue);
    if (isNaN(newCantidad) || newCantidad < 1) { setInlineCantidadId(null); inlineCantidadSavingRef.current = false; return; }
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) { inlineCantidadSavingRef.current = false; return; }
    const currentItem = items[itemIndex];
    const newSubtotal = currentItem.valorUnitario * currentItem.personas * newCantidad;
    const updatedItem: CotizacionItem = { ...currentItem, cantidad: newCantidad, subtotal: newSubtotal };
    const saved = await updateCotizacionItem(itemId, { cantidad: newCantidad, subtotal: newSubtotal });
    if (saved) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = updatedItem;
      setItems(updatedItems);
      const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
      setSelectedCotizacion(prev => prev ? { ...prev, precioTotal: newTotal } : prev);
    }
    setInlineCantidadId(null);
    inlineCantidadSavingRef.current = false;
  };

  const handleSaveInlineTotal = async (itemId: string) => {
    if (inlineTotalSavingRef.current) return;
    inlineTotalSavingRef.current = true;
    if (!selectedCotizacion) { inlineTotalSavingRef.current = false; return; }
    const newTotal = parseFloat(inlineTotalValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(newTotal) || newTotal < 0) { setInlineTotalId(null); inlineTotalSavingRef.current = false; return; }
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) { inlineTotalSavingRef.current = false; return; }
    const currentItem = items[itemIndex];
    // Back-calculate valorUnitario from the new total
    const divisor = (currentItem.personas || 1) * (currentItem.cantidad || 1);
    const newValorUnitario = divisor > 0 ? newTotal / divisor : newTotal;
    const updatedItem: CotizacionItem = {
      ...currentItem,
      valorUnitario: newValorUnitario,
      precioUnitario: newValorUnitario,
      subtotal: newTotal,
    };
    const saved = await updateCotizacionItem(itemId, { valorUnitario: newValorUnitario, subtotal: newTotal });
    if (saved) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = updatedItem;
      setItems(updatedItems);
      const newQuoteTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newQuoteTotal });
      setSelectedCotizacion(prev => prev ? { ...prev, precioTotal: newQuoteTotal } : prev);
    }
    setInlineTotalId(null);
    inlineTotalSavingRef.current = false;
  };

  const handleSendQuote = async () => {
    if (!selectedCotizacion) return;
    if (!selectedCotizacion.email || !selectedCotizacion.telefono) {
      alert('Agrega el email y teléfono del cliente antes de enviar la cotización.');
      return;
    }
    if (items.length === 0) {
      alert('Agrega al menos un servicio antes de enviar la cotización.');
      return;
    }
    
    await updateCotizacion(selectedCotizacion.id, { estado: 'enviada' });
    alert('✅ Cotización enviada al cliente');
    loadCotizaciones();
    setView('list');
  };

  /** Cambia el estado de una cotización directamente desde la lista */
  const handleChangeStatus = async (cotId: string, newEstado: string) => {
    setUpdatingStatusId(cotId);
    setStatusDropdownId(null);
    try {
      await updateCotizacion(cotId, { estado: newEstado as any });
      setCotizaciones(prev => prev.map(c => c.id === cotId ? { ...c, estado: newEstado as any } : c));
      if (selectedCotizacion?.id === cotId) {
        setSelectedCotizacion(prev => prev ? { ...prev, estado: newEstado as any } : prev);
      }
    } catch (e) { console.error('Error cambiando estado:', e); }
    finally { setUpdatingStatusId(null); }
  };

  /** Agrega una nota de seguimiento CRM (se prepende al campo Notas internas con timestamp) */
  const handleAddCrmNote = async () => {
    if (!selectedCotizacion || !crmNote.trim()) return;
    setSavingCrmNote(true);
    const ts   = new Date().toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const entry = `[${ts}] ${crmNote.trim()}`;
    const prevNotas = selectedCotizacion.notasInternas || '';
    // Separar sección de seguimiento del resto
    const SEP = '\n--- Seguimiento ---\n';
    let base = prevNotas, log = '';
    if (prevNotas.includes(SEP)) {
      [base, log] = prevNotas.split(SEP);
    }
    const newLog   = entry + (log ? '\n' + log : '');
    const newNotas = base.trimEnd() + SEP + newLog;
    try {
      await updateCotizacion(selectedCotizacion.id, { notasInternas: newNotas });
      setSelectedCotizacion(prev => prev ? { ...prev, notasInternas: newNotas } : prev);
      setCrmNote('');
    } catch (e) { console.error('Error guardando nota CRM:', e); }
    finally { setSavingCrmNote(false); }
  };

  /** Actualiza la opción de un ítem (Incluido / A / B / C / D) en Airtable */
  const handleUpdateOpcion = async (itemId: string, opcion: string | undefined) => {
    setSavingOpcionId(itemId);
    try {
      await updateCotizacionItem(itemId, { opcion });
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, opcion } : i));
    } catch (e) {
      console.error('Error actualizando opción:', e);
    } finally {
      setSavingOpcionId(null);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedCotizacion) return;
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?cot=${selectedCotizacion.id}&showTotal=${displayConfig.showTotal ? '1' : '0'}&showOptionTotals=${displayConfig.showOptionTotals ? '1' : '0'}&showMap=${displayConfig.showMap ? '1' : '0'}&pdf=1`;
    window.open(url, '_blank');
  };

  const handlePreview = () => {
    if (!selectedCotizacion) return;
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?cot=${selectedCotizacion.id}&showTotal=${displayConfig.showTotal ? '1' : '0'}&showOptionTotals=${displayConfig.showOptionTotals ? '1' : '0'}&showMap=${displayConfig.showMap ? '1' : '0'}`;
    window.open(url, '_blank');
  };

  // Normaliza alojamientos al mismo shape que Tour para el catálogo
  const alojamientosAsTour = alojamientos.map((a: any) => ({
    ...a,
    title: a.title || a.nombre || a.name || '',
    category: 'hotel' as const,
    active: true,
  }));

  const allCatalogItems = [...services, ...alojamientosAsTour];

  // Palabras clave que identifican ítems de alojamiento
  const HOTEL_KEYWORDS = ['habitacion', 'habitación', 'hotel', 'hostal', 'posada',
    'aparta', 'suite', 'alojamiento', 'room', 'casa', 'cabaña', 'cabaña'];

  // Busca el alojamiento coincidente para un ítem: por ID → nombre exacto → nombre parcial
  const findAlojamiento = (item: CotizacionItem) => {
    if (item.servicioId) {
      const byId = alojamientos.find(a => a.id === item.servicioId);
      if (byId) return byId;
    }
    const nombre = item.servicioNombre.toLowerCase().trim();
    // Match exacto
    const exact = alojamientos.find(a =>
      (a.title || a.name || a.nombre || '').toLowerCase().trim() === nombre
    );
    if (exact) return exact;
    // Match parcial (el nombre del ítem contiene el título del alojamiento o viceversa)
    return alojamientos.find(a => {
      const t = (a.title || a.name || a.nombre || '').toLowerCase().trim();
      return t.length > 4 && (nombre.includes(t) || t.includes(nombre));
    });
  };

  // Un ítem es alojamiento si: tipo='hotel', tiene link a alojamiento, nombre coincide
  // o el nombre contiene palabras clave de alojamiento (fallback para ítems viejos)
  const isHotelItem = (item: CotizacionItem) => {
    if (item.esPersonalizado) return false;
    if (item.servicioTipo === 'hotel' || item.servicioTipo === 'Alojamiento' as any) return true;
    if (findAlojamiento(item)) return true;
    const n = item.servicioNombre.toLowerCase();
    return HOTEL_KEYWORDS.some(k => n.includes(k));
  };

  const hotelItemsInQuote = items.filter(isHotelItem);

  // Datos para el mapa (incluye items sin coordenadas — el mapa muestra estado vacío en ese caso)
  const accommodationsForMap: MapAccommodation[] = hotelItemsInQuote
    .map(item => {
      const alo = findAlojamiento(item);
      return {
        id: item.id,
        title: item.servicioNombre,
        latLon: alo?.latLon ?? '',
        status: item.status,
      };
    });

  const filteredServices = allCatalogItems.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchService.toLowerCase()) ||
                         (service as any).nombre?.toLowerCase().includes(searchService.toLowerCase());
    const matchesType = filterType === 'all' || service.category === filterType || (service as any).tipo === filterType;
    return matchesSearch && matchesType;
  });

  // Callbacks para el agente
  const handlePreFillForm = useCallback((data: ParsedQuoteAction) => {
    setFormData(prev => ({
      ...prev,
      nombre:        data.nombre       ?? prev.nombre,
      email:         data.email        ?? prev.email,
      telefono:      data.telefono     ?? prev.telefono,
      fechaInicio:   data.fechaInicio  ?? prev.fechaInicio,
      fechaFin:      data.fechaFin     ?? prev.fechaFin,
      adultos:       data.adultos      ?? prev.adultos,
      ninos:         data.ninos        ?? prev.ninos,
      bebes:         data.bebes        ?? prev.bebes,
      notasInternas: data.notasInternas ?? prev.notasInternas,
    }));
  }, []);

  // =========================================================
  // VISTA: LISTA DE COTIZACIONES
  // =========================================================
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Cotizaciones</h1>
                <p className="text-gray-400">Gestiona cotizaciones para clientes</p>
              </div>
            </div>
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Nueva Cotización
            </button>
          </div>

          {/* Agente IA */}
          <AgenteCotizador
            cotizaciones={cotizaciones}
            services={services}
            onPreFillForm={handlePreFillForm}
            onSwitchToCreate={() => setView('create')}
          />

          {/* Barra de búsqueda + Filtros B2C / B2B */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Orden por fecha de última realización */}
            {cotizaciones.length > 0 && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Ordenar:</span>
                <div className="flex items-center gap-1.5">
                  {([
                    { key: 'recent', label: 'Más recientes' },
                    { key: 'oldest', label: 'Más antiguas' },
                  ] as const).map(o => (
                    <button
                      key={o.key}
                      onClick={() => setSortOrder(o.key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        sortOrder === o.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Filtros por origen */}
            {cotizaciones.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'b2c', 'b2b'] as const).map(f => {
                  const labels = { all: 'Todas', b2c: '🌐 B2C Web', b2b: '👤 Staff' };
                  const counts = {
                    all: cotizaciones.length,
                    b2c: cotizaciones.filter(c => c.notasInternas?.includes('[B2C Web]')).length,
                    b2b: cotizaciones.filter(c => !c.notasInternas?.includes('[B2C Web]')).length,
                  };
                  return (
                    <button
                      key={f}
                      onClick={() => setFilterSource(f)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        filterSource === f
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {labels[f]}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterSource === f ? 'bg-white/20' : 'bg-gray-700'}`}>
                        {counts[f]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filtro pipeline por estado */}
          {cotizaciones.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pb-1">
              {(['all', 'Draft', 'Enviada', 'Aceptada', 'Rechazada'] as const).map(est => {
                const cfg = est === 'all' ? null : (QUOTE_STATUS_CONFIG as any)[est];
                const count = est === 'all'
                  ? cotizaciones.length
                  : cotizaciones.filter(c => (c.estado as string) === est || (c.estado as string) === est.toLowerCase()).length;
                return (
                  <button
                    key={est}
                    onClick={() => setFilterEstado(est)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      filterEstado === est
                        ? est === 'all'
                          ? 'bg-white text-gray-900 border-white'
                          : `${cfg?.color} ${cfg?.textColor} border-current`
                        : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {est === 'all' ? 'Todos' : cfg?.label}
                    <span className="font-bold">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Lista de cotizaciones */}
          <div className="grid gap-3">
            {(() => {
              const q = searchQuery.toLowerCase().trim();
              const displayedCotizaciones = cotizaciones
                .filter(c => {
                  if (filterSource === 'b2c') return c.notasInternas?.includes('[B2C Web]');
                  if (filterSource === 'b2b') return !c.notasInternas?.includes('[B2C Web]');
                  return true;
                })
                .filter(c => {
                  if (!q) return true;
                  return (
                    c.nombre?.toLowerCase().includes(q) ||
                    c.telefono?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q)
                  );
                })
                .filter(c => {
                  if (filterEstado === 'all') return true;
                  const est = (c.estado as string);
                  return est === filterEstado || est === filterEstado.toLowerCase();
                })
                .sort((a, b) => {
                  const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
                  const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
                  return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
                });

              if (loading) return (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-400 mt-4">Cargando cotizaciones...</p>
                </div>
              );
              if (cotizaciones.length === 0) return (
                <div className="text-center py-12 bg-gray-900 rounded-xl">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No hay cotizaciones todavía</p>
                  <button onClick={() => setView('create')} className="mt-4 text-blue-500 hover:text-blue-400">
                    Crear primera cotización
                  </button>
                </div>
              );
              if (displayedCotizaciones.length === 0) return (
                <div className="text-center py-12 bg-gray-900 rounded-xl">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Sin resultados para "{searchQuery || filterSource}"</p>
                </div>
              );

              return displayedCotizaciones.map(cot => {
                const statusConfig = QUOTE_STATUS_CONFIG[cot.estado] || QUOTE_STATUS_CONFIG['Draft'];
                const isB2C = cot.notasInternas?.includes('[B2C Web]');
                const createdAt = cot.fechaCreacion
                  ? new Date(cot.fechaCreacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                  : null;

                return (
                  <div
                    key={cot.id}
                    className={`bg-gray-900 rounded-xl border transition-colors ${isB2C ? 'border-emerald-800' : 'border-gray-800'} hover:border-gray-600`}
                  >
                    {/* Fila principal — clickeable */}
                    <div
                      onClick={async () => {
                        const full = await getCotizacionById(cot.id);
                        if (full) { setSelectedCotizacion(full); setItems(full.items || []); setView('detail'); }
                      }}
                      className="p-5 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {isB2C && (
                              <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-400 border border-emerald-700 rounded-full text-xs font-bold shrink-0">
                                B2C Web
                              </span>
                            )}
                            <h3 className="text-base font-semibold truncate">{cot.nombre}</h3>
                          </div>
                          {/* Teléfono / email */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-2">
                            {cot.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />{cot.telefono}
                              </span>
                            )}
                            {cot.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />{cot.email}
                              </span>
                            )}
                            {createdAt && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-3 h-3" />{createdAt}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs">
                                {safeDate(cot.fechaInicio)?.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) ?? '—'}
                                {' → '}
                                {safeDate(cot.fechaFin)?.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span className="text-xs">{cot.adultos + cot.ninos + cot.bebes} pax</span>
                            </div>
                            {cot.precioTotal > 0 && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-semibold text-white">${cot.precioTotal.toLocaleString('es-CO')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Badge de estado — clickeable para cambiar */}
                        <div className="relative shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); setStatusDropdownId(statusDropdownId === cot.id ? null : cot.id); }}
                            disabled={updatingStatusId === cot.id}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-opacity ${statusConfig.color} ${statusConfig.textColor} hover:opacity-80`}
                          >
                            {updatingStatusId === cot.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : statusConfig.label}
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>
                          {statusDropdownId === cot.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                              {(['Draft', 'Enviada', 'Aceptada', 'Rechazada'] as const).map(est => {
                                const cfg = (QUOTE_STATUS_CONFIG as any)[est];
                                const isActive = (cot.estado as string) === est || (cot.estado as string) === est.toLowerCase();
                                return (
                                  <button
                                    key={est}
                                    onClick={e => { e.stopPropagation(); handleChangeStatus(cot.id, est); }}
                                    className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-700 transition-colors ${isActive ? 'font-bold' : ''}`}
                                  >
                                    <span className={`w-2 h-2 rounded-full ${cfg?.color?.replace('bg-', 'bg-').replace('-100', '-400')}`} />
                                    {cfg?.label}
                                    {isActive && <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-400" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="border-t border-gray-800 px-5 py-2.5 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={async () => {
                          const full = await getCotizacionById(cot.id);
                          if (full) { setSelectedCotizacion(full); setItems(full.items || []); setView('detail'); }
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver detalle
                      </button>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            nombre:    cot.nombre || '',
                            telefono:  cot.telefono || '',
                            email:     cot.email || '',
                            adultos:   cot.adultos,
                            ninos:     cot.ninos,
                            bebes:     cot.bebes,
                            fechaInicio: '',
                            fechaFin:    '',
                            notasInternas: isB2C ? `Cliente B2C - cotización anterior #${cot.id.slice(-6)}` : '',
                          }));
                          setView('create');
                        }}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
                      >
                        <Plus className="w-3.5 h-3.5" /> Nueva cotización para este cliente
                      </button>
                      {cot.telefono && (
                        <a
                          href={`https://wa.me/${cot.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${cot.nombre || ''}, te contactamos de GuiaSAI respecto a tu cotización para San Andrés.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
                        >
                          <Phone className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VISTA: CREAR COTIZACIÓN
  // =========================================================
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('list')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Nueva Cotización</h1>
              <p className="text-gray-400">Información del cliente y fechas de viaje</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-gray-900 p-8 rounded-xl space-y-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nombre <span className="text-gray-600 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Sin nombre — se asignará automáticamente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Fechas de Viaje
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        fechaInicio: newStart,
                        fechaFin: prev.fechaFin && prev.fechaFin < newStart ? '' : prev.fechaFin,
                      }));
                    }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    min={formData.fechaInicio || undefined}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pasajeros */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pasajeros
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Adultos (18-99 años)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.adultos}
                    onChange={(e) => setFormData({ ...formData, adultos: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Niños (4-18 años)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ninos}
                    onChange={(e) => setFormData({ ...formData, ninos: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Bebés (0-3 años)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bebes}
                    onChange={(e) => setFormData({ ...formData, bebes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Notas internas */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Notas Internas (opcional)
              </label>
              <textarea
                value={formData.notasInternas}
                onChange={(e) => setFormData({ ...formData, notasInternas: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Notas para referencia interna..."
              />
            </div>

            {/* Botón crear */}
            <button
              onClick={handleCreateCotizacion}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Crear Cotización
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VISTA: DETALLE DE COTIZACIÓN
  // =========================================================
  if (view === 'detail' && selectedCotizacion) {
    const canSendQuote = Boolean(
      selectedCotizacion.email &&
      selectedCotizacion.telefono &&
      items.length > 0
    );

    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">

        {/* ── Modal editar header — fixed, fuera del flujo ── */}
        {editingHeader && (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
               onClick={e => { if (e.target === e.currentTarget) setEditingHeader(false); }}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold">Editar datos de la cotización</h3>
                <button onClick={() => setEditingHeader(false)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Nombre cliente / grupo *</label>
                  <input value={headerForm.nombre} onChange={e => setHeaderForm(p => ({...p, nombre: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Teléfono</label>
                    <input value={headerForm.telefono} onChange={e => setHeaderForm(p => ({...p, telefono: e.target.value}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Email</label>
                    <input value={headerForm.email} onChange={e => setHeaderForm(p => ({...p, email: e.target.value}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Fecha inicio</label>
                    <input type="date" value={headerForm.fechaInicio} onChange={e => setHeaderForm(p => ({...p, fechaInicio: e.target.value}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Fecha fin</label>
                    <input type="date" value={headerForm.fechaFin} min={headerForm.fechaInicio} onChange={e => setHeaderForm(p => ({...p, fechaFin: e.target.value}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['adultos', 'ninos', 'bebes'] as const).map(field => (
                    <div key={field}>
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">
                        {field === 'adultos' ? 'Adultos 18+' : field === 'ninos' ? 'Niños 4-17' : 'Bebés 0-3'}
                      </label>
                      <input type="number" min="0" value={headerForm[field]}
                        onChange={e => setHeaderForm(p => ({...p, [field]: parseInt(e.target.value) || 0}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Etiqueta de opción</label>
                  <input placeholder='Ej: "Opción A", "Hotel Económico"' value={headerForm.opcion}
                    onChange={e => setHeaderForm(p => ({...p, opcion: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600" />
                  <p className="text-[10px] text-gray-600 mt-1">Para agrupar alternativas: "Opción A · Hotel Prixma", "Opción B · Hotel Coral"</p>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={handleSaveHeader} disabled={savingHeader || !headerForm.nombre.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                  {savingHeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar cambios
                </button>
                <button onClick={() => setEditingHeader(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">

            {/* Izquierda: volver + nombre + botón editar */}
            <div className="flex items-start gap-4">
              <button onClick={() => setView('list')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors mt-1">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{selectedCotizacion.nombre}</h1>
                  {(selectedCotizacion as any).opcion && (
                    <span className="px-2 py-0.5 bg-purple-900/50 border border-purple-700/50 text-purple-300 rounded-full text-xs font-semibold">
                      {(selectedCotizacion as any).opcion}
                    </span>
                  )}
                  <button
                    onClick={handleOpenEditHeader}
                    title="Editar nombre, fechas y pasajeros"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-0.5">
                  {safeDate(selectedCotizacion.fechaInicio)?.toLocaleDateString('es-CO') ?? '—'}
                  {' – '}
                  {safeDate(selectedCotizacion.fechaFin)?.toLocaleDateString('es-CO') ?? '—'}
                  {' · '}
                  <span className="font-medium text-gray-300">
                    {(selectedCotizacion.adultos ?? 0)} adultos
                    {(selectedCotizacion.ninos ?? 0) > 0 && `, ${selectedCotizacion.ninos} niños`}
                    {(selectedCotizacion.bebes ?? 0) > 0 && `, ${selectedCotizacion.bebes} bebés`}
                  </span>
                  {selectedCotizacion.telefono && (
                    <span className="ml-2 text-gray-500">· {selectedCotizacion.telefono}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Derecha: estado + acciones */}
            <div className="flex flex-col items-end gap-2">
              {/* Pills de estado en detalle */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="text-[10px] text-gray-600 uppercase tracking-wide mr-1">Estado:</span>
                {(['Draft', 'Enviada', 'Aceptada', 'Rechazada'] as const).map(est => {
                  const cfg = (QUOTE_STATUS_CONFIG as any)[est];
                  const isActive = (selectedCotizacion.estado as string) === est || (selectedCotizacion.estado as string) === est.toLowerCase();
                  return (
                    <button
                      key={est}
                      onClick={() => handleChangeStatus(selectedCotizacion.id, est)}
                      disabled={updatingStatusId === selectedCotizacion.id}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        isActive
                          ? `${cfg.color} ${cfg.textColor} border-current scale-105 shadow-sm`
                          : 'text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {updatingStatusId === selectedCotizacion.id && isActive
                        ? '...'
                        : cfg?.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={() => setShowItinerario(true)} title="Itinerario"
                className="flex items-center gap-2 px-3 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg transition-colors font-medium text-sm">
                <CalendarDays className="w-4 h-4" /> Itinerario
              </button>
              <button onClick={() => { setPayResult(null); setPayAmount(String(selectedCotizacion.precioTotal || '')); setShowPayModal(true); }}
                title="Generar link de pago"
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors font-medium text-sm">
                <CreditCard className="w-4 h-4" /> Cobrar
              </button>
              <button onClick={() => {
                const base = window.location.origin + window.location.pathname;
                const url = `${base}?cot=${selectedCotizacion?.id}&showTotal=${displayConfig.showTotal ? '1' : '0'}&showOptionTotals=${displayConfig.showOptionTotals ? '1' : '0'}&showMap=${displayConfig.showMap ? '1' : '0'}`;
                navigator.clipboard.writeText(url).then(() => alert('✅ Link copiado:\n' + url));
              }}
                className="flex items-center gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors font-medium text-sm">
                <Link2 className="w-4 h-4" /> Link
              </button>
              <button onClick={handlePreview}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={handleSendQuote} disabled={!canSendQuote}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium text-sm disabled:opacity-50">
                <Send className="w-4 h-4" /> Enviar
              </button>
              </div>
            </div>
          </div>
          {!canSendQuote && (
            <p className="text-xs text-gray-500 mb-2">
              Completa email y teléfono del cliente y agrega al menos un servicio antes de enviar.
            </p>
          )}

          {/* ⚙️ Config del Link público */}
          <div className="flex items-center gap-4 mb-4 px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide shrink-0">Config del Link</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setDisplayConfig(c => ({ ...c, showTotal: !c.showTotal }))}
                className={`w-9 h-5 rounded-full transition-colors relative ${displayConfig.showTotal ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${displayConfig.showTotal ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-300">Mostrar total / resumen financiero</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setDisplayConfig(c => ({ ...c, showOptionTotals: !c.showOptionTotals }))}
                className={`w-9 h-5 rounded-full transition-colors relative ${displayConfig.showOptionTotals ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${displayConfig.showOptionTotals ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-300">Mostrar total por opción (A/B/C/D)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setDisplayConfig(c => ({ ...c, showMap: !c.showMap }))}
                className={`w-9 h-5 rounded-full transition-colors relative ${displayConfig.showMap ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${displayConfig.showMap ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-300">Mostrar botón "Ver en Mapa"</span>
            </label>
            <span className="text-[10px] text-gray-600 ml-auto hidden lg:block">
              Los cambios se aplican al Link y Preview
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Info + Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información del cliente */}
              <div className="bg-gray-900 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Información del Cliente</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{selectedCotizacion.nombre}</span>
                  </div>
                  {selectedCotizacion.email && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{selectedCotizacion.email}</span>
                    </div>
                  )}
                  {selectedCotizacion.telefono && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{selectedCotizacion.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {selectedCotizacion.adultos} adultos, {selectedCotizacion.ninos} niños, {selectedCotizacion.bebes} bebés
                    </span>
                  </div>
                </div>
              </div>

              {/* Items de la cotización — tabla estilo Excel */}
              <div className="bg-gray-900 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Servicios Incluidos ({items.length})</h3>
                  {hotelItemsInQuote.length > 0 && (
                    <button
                      onClick={() => setShowMapView(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-800/40 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Ver en Mapa ({hotelItemsInQuote.length})
                    </button>
                  )}
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                    <p>No hay servicios agregados</p>
                    <p className="text-sm">Agrega servicios desde el panel derecho</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Encabezado tabla */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 mb-1">
                      <span>Nombre</span>
                      <span className="text-right w-28">Valor Unit.</span>
                      <span className="text-right w-14">#Pax</span>
                      <span className="text-right w-16">#Cant</span>
                      <span className="text-right w-28">Total</span>
                      <span className="w-16"></span>
                    </div>

                    <div className="space-y-1">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`rounded-lg border ${
                            item.status === 'conflicto' ? 'border-orange-700/50 bg-orange-950/10' : 'border-transparent hover:border-gray-800'
                          }`}
                        >
                          {editingItemId === item.id ? (
                            // ── MODO EDICIÓN (formulario completo) ──
                            <div className="p-4 bg-gray-800 rounded-lg space-y-3">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{item.servicioNombre}</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-1">Fecha</label>
                                  <input type="date" value={editingItemData.fecha || ''} onChange={e => {
                                    const newStart = e.target.value;
                                    const currentEnd = editingItemData.fechaFin || item.fechaFin || '';
                                    setEditingItemData({ ...editingItemData, fecha: newStart, fechaFin: currentEnd && currentEnd < newStart ? '' : currentEnd });
                                  }} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm" />
                                </div>
                                {item.servicioTipo === 'hotel' && (
                                  <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Fecha Fin</label>
                                    <input type="date" min={editingItemData.fecha || item.fecha || undefined} value={editingItemData.fechaFin || item.fechaFin || ''} onChange={e => setEditingItemData({ ...editingItemData, fechaFin: e.target.value })} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm" />
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-1">Valor Unit. $</label>
                                  <input type="number" min="0" value={editingItemData.valorUnitario ?? item.valorUnitario} onChange={e => setEditingItemData({ ...editingItemData, valorUnitario: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1.5 bg-gray-700 border border-yellow-600/50 rounded text-white text-sm focus:border-yellow-500 focus:outline-none" />
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {[5, 10, 15, 20].map(pct => (
                                      <button key={pct} type="button" onClick={() => setEditingItemData({ ...editingItemData, valorUnitario: Math.round(item.valorUnitario * (1 - pct / 100)) })} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 hover:bg-yellow-800/40">-{pct}%</button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-1">#Personas</label>
                                  <input type="number" min="1" value={editingItemData.personas ?? item.personas} onChange={e => setEditingItemData({ ...editingItemData, personas: parseInt(e.target.value) || 1 })} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500 mb-1">#Cant / Noches</label>
                                  <input type="number" min="1" value={editingItemData.cantidad ?? item.cantidad} onChange={e => setEditingItemData({ ...editingItemData, cantidad: parseInt(e.target.value) || 1 })} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm" />
                                </div>
                              </div>
                              {/* Preview del nuevo total */}
                              <div className="text-right text-sm text-gray-400">
                                Nuevo total:{' '}
                                <span className="font-bold text-white">
                                  ${((editingItemData.valorUnitario ?? item.valorUnitario) * (editingItemData.personas ?? item.personas) * (editingItemData.cantidad ?? item.cantidad)).toLocaleString('es-CO')}
                                </span>
                              </div>

                              {/* Edición de imágenes (ítems libres o cualquiera con imágenes) */}
                              {(item.esPersonalizado || (item.images && item.images.length > 0)) && (
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Imágenes ({(editingItemData.images ?? item.images ?? []).length}/4)</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {(editingItemData.images ?? item.images ?? []).map((url, idx) => (
                                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                          onClick={() => setEditingItemData(p => ({ ...p, images: (p.images ?? item.images ?? []).filter((_, i) => i !== idx) }))}
                                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px] hover:bg-red-500"
                                        >✕</button>
                                      </div>
                                    ))}
                                    {(editingItemData.images ?? item.images ?? []).length < 4 && (
                                      <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-400 flex items-center justify-center cursor-pointer text-gray-500 hover:text-gray-300 transition-colors">
                                        <span className="text-xl">+</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                                          const files = Array.from(e.target.files || []);
                                          const current = editingItemData.images ?? item.images ?? [];
                                          const slots = 4 - current.length;
                                          const newUrls: string[] = [];
                                          for (const file of files.slice(0, slots)) {
                                            try {
                                              const blob = await new Promise<Blob>(res => {
                                                const img = new Image(); const bUrl = URL.createObjectURL(file);
                                                img.onload = () => { const MAX=800; const s=Math.min(1,MAX/Math.max(img.width,img.height)); const c=document.createElement('canvas'); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s); c.getContext('2d')!.drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(bUrl); c.toBlob(b=>res(b!),'image/jpeg',0.75); };
                                                img.src = bUrl;
                                              });
                                              const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                              const { storage: st } = await import('../../lib/firebase');
                                              const r = sRef(st, `cotizaciones/items/${Date.now()}_edit_${file.name.replace(/[^a-z0-9.]/gi,'_')}`);
                                              await uploadBytes(r, blob, { contentType: 'image/jpeg' });
                                              newUrls.push(await getDownloadURL(r));
                                            } catch { /* skip */ }
                                          }
                                          if (newUrls.length) setEditingItemData(p => ({ ...p, images: [...(p.images ?? item.images ?? []), ...newUrls].slice(0, 4) }));
                                          e.target.value = '';
                                        }} />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button onClick={() => handleSaveEditItem(item.id)} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-semibold transition-colors">Guardar</button>
                                <button onClick={handleCancelEditItem} className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-semibold transition-colors">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            // ── MODO VISUALIZACIÓN ──
                            <div className="px-3 py-2.5">
                              {/* Miniaturas de imágenes (si existen) */}
                              {item.images && item.images.length > 0 && (
                                <div className="flex gap-1.5 mb-2 flex-wrap">
                                  {item.images.map((url, idx) => (
                                    <img key={idx} src={url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-700 cursor-pointer hover:opacity-80"
                                      onClick={() => window.open(url, '_blank')} />
                                  ))}
                                </div>
                              )}
                              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center">
                              {/* Nombre */}
                              <div className="min-w-0 overflow-hidden">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <span className="font-medium text-sm truncate" title={item.servicioNombre}>{item.servicioNombre}</span>
                                  {item.esPersonalizado && (
                                    <span className="px-1.5 py-0.5 bg-purple-900/40 text-purple-400 rounded text-[9px] font-bold flex-shrink-0">LIBRE</span>
                                  )}
                                  {item.status === 'conflicto' && (
                                    <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                  )}
                                </div>
                                {(() => {
                                  const svc = services.find(s => s.id === item.servicioId) as any;
                                  if (!svc) return null;
                                  const desc = svc?.description || svc?.descripcion || '';
                                  const capacidad = svc?.capacidadMaxima || svc?.capacity || svc?.capacidad || 0;
                                  const diasOp = svc?.operatingDays || svc?.diasOperacion || '';
                                  if (!desc && !capacidad && !diasOp) return null;
                                  const isOpen = expandedDescId === item.id;
                                  return (
                                    <div className="mt-1">
                                      <button
                                        onClick={() => setExpandedDescId(isOpen ? null : item.id)}
                                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-emerald-400 font-semibold transition-colors"
                                      >
                                        <Info className="w-3 h-3" />
                                        {isOpen ? 'Ocultar info ▲' : 'Ver info del servicio ▼'}
                                      </button>
                                      {isOpen && (
                                        <div className="mt-1.5 p-2 bg-gray-800/60 border border-gray-700 rounded-lg space-y-1">
                                          {desc && <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>}
                                          {(capacidad > 0 || diasOp) && (
                                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500 pt-1 border-t border-gray-700/60">
                                              {capacidad > 0 && <span>👥 Capacidad máx.: <b className="text-gray-300">{capacidad} pax</b></span>}
                                              {diasOp && <span>📅 Opera: <b className="text-gray-300">{diasOp}</b></span>}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-600 uppercase">
                                    {item.servicioNombre?.startsWith('✈️') ? 'tiquete' : item.servicioTipo}
                                  </span>
                                  {item.fecha && (
                                    <span className="text-[10px] text-gray-600">
                                      {safeDate(item.fecha)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) ?? ''}
                                      {item.fechaFin && ` — ${safeDate(item.fechaFin)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) ?? ''}`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Valor Unitario — inline editable */}
                              <div className="w-28 text-right">
                                {inlinePriceId === item.id ? (
                                  <input
                                    type="number" autoFocus value={inlinePriceValue}
                                    onChange={e => setInlinePriceValue(e.target.value)}
                                    onBlur={() => handleSaveInlinePrice(item.id)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveInlinePrice(item.id); if (e.key === 'Escape') setInlinePriceId(null); }}
                                    className="w-full px-2 py-1 bg-gray-800 border border-yellow-500 rounded text-white text-sm font-bold text-right focus:outline-none"
                                  />
                                ) : (
                                  <button
                                    onClick={() => { setInlinePriceId(item.id); setInlinePriceValue(String(item.valorUnitario || 0)); }}
                                    title="Clic para editar valor unitario"
                                    className="text-sm text-gray-300 hover:text-yellow-300 transition-colors font-mono group"
                                  >
                                    ${(item.valorUnitario || 0).toLocaleString('es-CO')}
                                    <span className="text-[9px] text-gray-700 group-hover:text-yellow-500 ml-1">✏</span>
                                  </button>
                                )}
                              </div>

                              {/* #Personas — inline editable */}
                              <div className="w-14 text-right">
                                {inlinePersonasId === item.id ? (
                                  <input
                                    type="number" autoFocus min="1" value={inlinePersonasValue}
                                    onChange={e => setInlinePersonasValue(e.target.value)}
                                    onBlur={() => handleSaveInlinePersonas(item.id)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveInlinePersonas(item.id); if (e.key === 'Escape') setInlinePersonasId(null); }}
                                    className="w-full px-1 py-1 bg-gray-800 border border-blue-500 rounded text-white text-sm font-bold text-center focus:outline-none"
                                  />
                                ) : (
                                  <button
                                    onClick={() => { setInlinePersonasId(item.id); setInlinePersonasValue(String(item.personas || 1)); }}
                                    title="Clic para editar personas"
                                    className="text-sm text-gray-300 hover:text-blue-300 transition-colors group w-full text-right"
                                  >
                                    {item.personas || 1}
                                    <span className="text-[9px] text-gray-700 group-hover:text-blue-500 ml-1">✏</span>
                                  </button>
                                )}
                              </div>

                              {/* #Cantidad — inline editable */}
                              <div className="w-16 text-right">
                                {inlineCantidadId === item.id ? (
                                  <input
                                    type="number" autoFocus min="1" value={inlineCantidadValue}
                                    onChange={e => setInlineCantidadValue(e.target.value)}
                                    onBlur={() => handleSaveInlineCantidad(item.id)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineCantidad(item.id); if (e.key === 'Escape') setInlineCantidadId(null); }}
                                    className="w-full px-1 py-1 bg-gray-800 border border-emerald-500 rounded text-white text-sm font-bold text-center focus:outline-none"
                                  />
                                ) : (
                                  <button
                                    onClick={() => { setInlineCantidadId(item.id); setInlineCantidadValue(String(item.cantidad || 1)); }}
                                    title="Clic para editar cantidad/noches"
                                    className="text-sm text-gray-300 hover:text-emerald-300 transition-colors group w-full text-right"
                                  >
                                    {item.cantidad || 1}
                                    <span className="text-[9px] text-gray-700 group-hover:text-emerald-500 ml-1">✏</span>
                                  </button>
                                )}
                              </div>

                              {/* Total — inline editable directo */}
                              <div className="w-28 text-right">
                                {inlineTotalId === item.id ? (
                                  <input
                                    type="number" autoFocus value={inlineTotalValue}
                                    onChange={e => setInlineTotalValue(e.target.value)}
                                    onBlur={() => handleSaveInlineTotal(item.id)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineTotal(item.id); if (e.key === 'Escape') setInlineTotalId(null); }}
                                    className="w-full px-2 py-1 bg-gray-800 border border-green-500 rounded text-green-300 text-sm font-bold text-right focus:outline-none"
                                  />
                                ) : (
                                  <button
                                    onClick={() => { setInlineTotalId(item.id); setInlineTotalValue(String(item.subtotal)); }}
                                    title="Clic para editar total directamente"
                                    className="font-bold text-green-400 font-mono text-sm hover:text-yellow-300 transition-colors group w-full text-right"
                                  >
                                    ${item.subtotal.toLocaleString('es-CO')}
                                    <span className="text-[9px] text-gray-700 group-hover:text-yellow-500 ml-1">✏</span>
                                  </button>
                                )}
                              </div>

                              {/* Opción (para cotización con alternativas) */}
                              <div className="flex items-center gap-0.5">
                                {savingOpcionId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                                ) : (
                                  ['Incl.', 'A', 'B', 'C', 'D'].map(op => {
                                    const val    = op === 'Incl.' ? undefined : op;
                                    const active = (item.opcion ?? undefined) === val;
                                    const colors: Record<string, string> = {
                                      'Incl.': active ? 'bg-gray-600 text-white border-gray-500' : 'text-gray-600 border-gray-700',
                                      A: active ? 'bg-blue-600 text-white border-blue-500' : 'text-gray-600 border-gray-700',
                                      B: active ? 'bg-purple-600 text-white border-purple-500' : 'text-gray-600 border-gray-700',
                                      C: active ? 'bg-orange-600 text-white border-orange-500' : 'text-gray-600 border-gray-700',
                                      D: active ? 'bg-pink-600 text-white border-pink-500' : 'text-gray-600 border-gray-700',
                                    };
                                    return (
                                      <button
                                        key={op}
                                        onClick={() => handleUpdateOpcion(item.id, val)}
                                        title={op === 'Incl.' ? 'Siempre incluido (suma al total)' : `Opción ${op} (alternativa)`}
                                        className={`text-[9px] font-bold px-1 py-0.5 rounded border transition-colors ${colors[op]}`}
                                      >
                                        {op}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                              {/* Acciones */}
                              <div className="w-14 flex items-center justify-end gap-0.5">
                                <button onClick={() => handleStartEditItem(item)} title="Editar fechas / precio / imágenes" className="p-1.5 text-gray-600 hover:text-blue-400 rounded transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteItem(item.id)} title="Eliminar" className="p-1.5 text-gray-600 hover:text-red-400 rounded transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Fila total */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center px-3 py-2 border-t border-gray-700 mt-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total</span>
                      <span className="w-28"></span>
                      <span className="w-14"></span>
                      <span className="w-16"></span>
                      <span className={`w-28 text-right font-bold font-mono transition-colors ${displayConfig.showTotal ? 'text-white' : 'text-gray-600 line-through'}`}>
                        ${items.reduce((s, i) => s + i.subtotal, 0).toLocaleString('es-CO')}
                      </span>
                      <div className="w-16 flex items-center justify-end">
                        <button
                          onClick={() => setDisplayConfig(c => ({ ...c, showTotal: !c.showTotal }))}
                          title={displayConfig.showTotal ? 'Cliente VE el total — clic para ocultar' : 'Cliente NO ve el total — clic para mostrar'}
                          className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                            displayConfig.showTotal
                              ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700 hover:bg-emerald-800/40'
                              : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {displayConfig.showTotal ? '✓ Total' : '✗ Total'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas internas — editable inline */}
              <div className="bg-gray-900 p-5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-white">Notas Internas</h3>
                  {!editingNotas ? (
                    <button
                      onClick={() => { setNotasValue(selectedCotizacion.notasInternas || ''); setEditingNotas(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNotas}
                        disabled={notasSaving}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50"
                      >
                        {notasSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingNotas(false)}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
                {editingNotas ? (
                  <textarea
                    value={notasValue}
                    onChange={e => setNotasValue(e.target.value)}
                    rows={4}
                    autoFocus
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                    placeholder="Notas internas, instrucciones especiales, detalles del cliente..."
                  />
                ) : (
                  <p
                    onClick={() => { setNotasValue(selectedCotizacion.notasInternas || ''); setEditingNotas(true); }}
                    className={`text-sm leading-relaxed cursor-text rounded-lg px-1 py-1 hover:bg-gray-800 transition-colors ${selectedCotizacion.notasInternas ? 'text-gray-300' : 'text-gray-600 italic'}`}
                  >
                    {selectedCotizacion.notasInternas || 'Clic para agregar notas...'}
                  </p>
                )}
              </div>

              {/* Panel CRM — Seguimiento */}
              <div className="bg-gray-900 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-semibold text-white">Seguimiento CRM</h3>
                </div>

                {/* Input nueva nota */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={crmNote}
                    onChange={(e) => setCrmNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCrmNote(); } }}
                    placeholder="Agrega una nota de seguimiento..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddCrmNote}
                    disabled={!crmNote.trim() || savingCrmNote}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {savingCrmNote ? '...' : 'Guardar'}
                  </button>
                </div>

                {/* Timeline de notas */}
                {(() => {
                  const SEP = '\n--- Seguimiento ---\n';
                  const notas = selectedCotizacion.notasInternas || '';
                  const logSection = notas.includes(SEP) ? notas.split(SEP)[1] : '';
                  const entries = logSection
                    ? logSection.split('\n').filter(l => l.trim())
                    : [];
                  if (!entries.length) return (
                    <p className="text-xs text-gray-600 italic text-center py-2">Sin notas de seguimiento aún</p>
                  );
                  return (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {entries.map((entry, i) => {
                        const tsMatch = entry.match(/^\[(.+?)\]\s*/);
                        const ts = tsMatch ? tsMatch[1] : null;
                        const text = tsMatch ? entry.slice(tsMatch[0].length) : entry;
                        return (
                          <div key={i} className="flex gap-2.5">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                              {i < entries.length - 1 && <div className="w-px flex-1 bg-gray-700 my-1" />}
                            </div>
                            <div className="pb-2 flex-1">
                              {ts && <span className="text-xs text-gray-500 block mb-0.5">{ts}</span>}
                              <p className="text-sm text-gray-300 leading-snug">{text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Columna derecha: Agregar servicios */}
            <div className="space-y-6">
              {/* Total */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl">
                <div className="text-sm text-blue-100 mb-3">Resumen Financiero</div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-blue-100">Subtotal</span>
                    <span className="text-2xl font-bold text-white">${selectedCotizacion.precioTotal.toLocaleString('es-CO')}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-blue-400/30">
                    <label className="block text-xs text-blue-100 mb-2">Descuento (Opcional)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={selectedCotizacion.descuento || 0}
                        onChange={(e) => {
                          const newDescuento = parseFloat(e.target.value) || 0;
                          setSelectedCotizacion({
                            ...selectedCotizacion,
                            descuento: newDescuento
                          });
                        }}
                        onBlur={() => {
                          if (selectedCotizacion.descuento !== undefined) {
                            updateCotizacion(selectedCotizacion.id, { descuento: selectedCotizacion.descuento });
                          }
                        }}
                        placeholder="0"
                        className="flex-1 px-3 py-2 bg-blue-800/50 border border-blue-400 rounded text-white text-sm placeholder-blue-200"
                      />
                      <span className="flex items-center text-blue-100 text-sm">COP</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-blue-400/30">
                    <div className="flex justify-between items-baseline">
                      <span className="text-blue-100 font-semibold">Total Final</span>
                      <span className="text-3xl font-bold text-white">
                        ${(selectedCotizacion.precioTotal - (selectedCotizacion.descuento || 0)).toLocaleString('es-CO')}
                      </span>
                    </div>
                    {selectedCotizacion.descuento && selectedCotizacion.descuento > 0 && (
                      <div className="text-xs text-green-200 mt-1">
                        Descuento: ${selectedCotizacion.descuento.toLocaleString('es-CO')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel agregar items */}
              <div className="bg-gray-900 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Agregar Item</h3>

                {/* Tabs Catálogo / Ítem Libre */}
                <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setAddItemMode('catalog')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                      addItemMode === 'catalog' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Catálogo
                  </button>
                  <button
                    onClick={() => setAddItemMode('free')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                      addItemMode === 'free' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Ítem Libre
                  </button>
                </div>

                {addItemMode === 'catalog' ? (
                  <>
                    {/* Búsqueda */}
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchService}
                            onChange={(e) => setSearchService(e.target.value)}
                            placeholder="Buscar servicios..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={refreshServices}
                          title="Actualizar catálogo desde Airtable"
                          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                          <Loader2 className={`w-5 h-5 ${services.length === 0 ? 'animate-spin text-emerald-400' : ''}`} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 px-1">
                        {services.length} servicios · Caché 48h · Usa ↺ si agregaste uno nuevo en Airtable
                      </p>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(['all', 'tour', 'hotel', 'taxi'] as const).map(type => {
                        const labels: Record<string, string> = { 'all': 'Todos', 'tour': 'Tour', 'hotel': 'Alojam.', 'taxi': 'Taxi' };
                        return (
                          <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {labels[type]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Lista de servicios */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredServices.map(service => (
                        <div
                          key={service.id}
                          onClick={() => handleAddService(service)}
                          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="font-medium text-sm">{service.title || service.nombre}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">
                              {service.tipoAlojamiento || service.category || service.tipo || 'Servicio'}
                            </span>
                            <span className="text-sm font-semibold text-green-400">
                              ${(service.price || service.precio || 0).toLocaleString('es-CO')} /u
                            </span>
                          </div>
                        </div>
                      ))}
                      {filteredServices.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">No se encontraron servicios</div>
                      )}
                    </div>
                  </>
                ) : (
                  /* ── ÍTEM LIBRE ── */
                  <div className="space-y-3">
                    {/* Tipo primero */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Tipo de ítem</label>
                      <select
                        value={freeItemForm.tipo}
                        onChange={e => setFreeItemForm({ ...freeItemForm, tipo: e.target.value as CotizacionItem['servicioTipo'], nombre: '' })}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                      >
                        <option value="tiquete">✈️ Tiquete aéreo</option>
                        <option value="gestion">💼 Costos de gestión</option>
                        <option value="seguro">🛡️ Seguro de viaje</option>
                        <option value="transfer">🚐 Transfer / Traslado</option>
                        <option value="tour">🏄 Tour</option>
                        <option value="hotel">🏨 Alojamiento</option>
                        <option value="taxi">🚕 Taxi</option>
                        <option value="otro">📦 Otro</option>
                      </select>
                    </div>

                    {/* ── Campos específicos para TIQUETE ── */}
                    {freeItemForm.tipo === 'tiquete' && (
                      <div className="space-y-3 bg-blue-950/30 rounded-lg p-3 border border-blue-800/40">
                        <p className="text-[10px] text-blue-300 font-semibold uppercase tracking-wide">Detalles del vuelo</p>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Aerolínea</label>
                          <select
                            value={freeItemForm.aerolinea}
                            onChange={e => setFreeItemForm({ ...freeItemForm, aerolinea: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                          >
                            {['JetSmart', 'LATAM', 'Avianca', 'Copa Airlines', 'Wingo', 'Otra'].map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Origen (IATA)</label>
                            <input
                              type="text"
                              value={freeItemForm.origen}
                              onChange={e => setFreeItemForm({ ...freeItemForm, origen: e.target.value.toUpperCase() })}
                              placeholder="BOG / CLO / MDE"
                              maxLength={3}
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none uppercase"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Destino (IATA)</label>
                            <input
                              type="text"
                              value={freeItemForm.destino}
                              onChange={e => setFreeItemForm({ ...freeItemForm, destino: e.target.value.toUpperCase() })}
                              placeholder="ADZ"
                              maxLength={3}
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none uppercase"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Tipo de vuelo</label>
                          <select
                            value={freeItemForm.tipoVuelo}
                            onChange={e => setFreeItemForm({ ...freeItemForm, tipoVuelo: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option>Ida y vuelta</option>
                            <option>Solo ida</option>
                            <option>Solo regreso</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Notas (horario, # vuelo, etc.)</label>
                          <input
                            type="text"
                            value={freeItemForm.notasTiquete}
                            onChange={e => setFreeItemForm({ ...freeItemForm, notasTiquete: e.target.value })}
                            placeholder="Sal. 12:33 · Reg. 09:51 · 1 escala"
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Nombre manual (si no es tiquete) */}
                    {freeItemForm.tipo !== 'tiquete' && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Nombre del ítem *</label>
                        <input
                          type="text"
                          value={freeItemForm.nombre}
                          onChange={e => setFreeItemForm({ ...freeItemForm, nombre: e.target.value })}
                          placeholder={freeItemForm.tipo === 'gestion' ? 'Ej: Costos de gestión tiquetes' : 'Ej: Seguro de viaje Assist Card'}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Imágenes adjuntas (solo para ítems no-tiquete) */}
                    {freeItemForm.tipo !== 'tiquete' && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-semibold">
                          Imágenes del lugar <span className="text-gray-600 font-normal">(opcional · máx. 4)</span>
                        </label>
                        <input
                          ref={freeItemFileRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFreeItemImageUpload}
                        />
                        <div className="grid grid-cols-4 gap-2">
                          {freeItemForm.images.map((src, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group">
                              <img src={src} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFreeItemForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))}
                                className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} className="text-white" />
                              </button>
                            </div>
                          ))}
                          {freeItemForm.images.length < 4 && (
                            <button
                              type="button"
                              onClick={() => freeItemFileRef.current?.click()}
                              className="aspect-square rounded-lg border border-dashed border-gray-600 hover:border-purple-500 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-purple-400 transition-colors"
                            >
                              <Plus size={18} />
                              <span className="text-[10px]">Agregar</span>
                            </button>
                          )}
                        </div>
                        {freeItemForm.images.length > 0 && (
                          <p className="text-[10px] text-gray-600 mt-1">
                            {freeItemForm.images.length}/4 — aparecerán en el PDF de cotización
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-semibold">
                          {freeItemForm.tipo === 'tiquete' ? 'Precio/pax $' : 'Valor Unit. $'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={freeItemForm.valorUnitario}
                          onChange={e => setFreeItemForm({ ...freeItemForm, valorUnitario: e.target.value })}
                          placeholder="0"
                          className="w-full px-2 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-semibold">#Personas</label>
                        <input
                          type="number"
                          min="1"
                          value={freeItemForm.personas}
                          onChange={e => setFreeItemForm({ ...freeItemForm, personas: e.target.value })}
                          className="w-full px-2 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-semibold">#Cant</label>
                        <input
                          type="number"
                          min="1"
                          value={freeItemForm.cantidad}
                          onChange={e => setFreeItemForm({ ...freeItemForm, cantidad: e.target.value })}
                          className="w-full px-2 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Preview del total */}
                    {freeItemForm.valorUnitario && parseFloat(freeItemForm.valorUnitario) > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg text-sm">
                        <span className="text-gray-400">
                          ${parseFloat(freeItemForm.valorUnitario || '0').toLocaleString('es-CO')} × {freeItemForm.personas || 1}pax × {freeItemForm.cantidad || 1}
                        </span>
                        <span className="font-bold text-green-400">
                          = ${(parseFloat(freeItemForm.valorUnitario || '0') * parseInt(freeItemForm.personas || '1') * parseInt(freeItemForm.cantidad || '1')).toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleAddFreeItem}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {freeItemForm.tipo === 'tiquete' ? 'Agregar Tiquete Aéreo' : 'Agregar Ítem'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* ── Modal Mapa de Alojamientos ── */}
      {showMapView && (
        <QuotationMapView
          accommodations={accommodationsForMap}
          onClose={() => setShowMapView(false)}
        />
      )}

      {/* ── Panel Itinerario ── */}
      {showItinerario && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="flex-1 bg-black/60" onClick={() => setShowItinerario(false)} />
          {/* Panel */}
          <div className="w-full max-w-4xl bg-gray-950 overflow-y-auto flex flex-col">
            <div className="sticky top-0 z-10 bg-gray-900 px-6 py-3 flex items-center justify-between border-b border-gray-700">
              <div>
                <h3 className="font-bold text-white">📅 Itinerario</h3>
                <p className="text-xs text-gray-400">{selectedCotizacion.nombre} · {selectedCotizacion.fechaInicio} → {selectedCotizacion.fechaFin}</p>
              </div>
              <button onClick={() => setShowItinerario(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <DynamicItineraryBuilder
              initialStartDate={selectedCotizacion.fechaInicio || undefined}
              initialEndDate={selectedCotizacion.fechaFin || undefined}
              initialAdults={selectedCotizacion.adultos || 2}
              initialChildren={selectedCotizacion.ninos || 0}
              initialInfants={selectedCotizacion.bebes || 0}
            />
          </div>
        </div>
      )}

      {/* ── Modal Wompi: Generar Link de Pago ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75" onClick={() => setShowPayModal(false)}>
          <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Generar Link de Pago</h3>
                  <p className="text-xs text-gray-400">Wompi · Nequi / Tarjeta / PSE / Bancolombia</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!payResult ? (
                <>
                  {/* Cliente */}
                  <div className="bg-gray-800 rounded-xl p-4 space-y-1">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Cliente</p>
                    <p className="text-white font-semibold">{selectedCotizacion?.nombre}</p>
                    {selectedCotizacion?.email && <p className="text-gray-400 text-sm">{selectedCotizacion.email}</p>}
                    {selectedCotizacion?.telefono && <p className="text-gray-400 text-sm">{selectedCotizacion.telefono}</p>}
                  </div>

                  {/* Monto */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Monto a cobrar (COP)</label>
                    <input
                      type="number"
                      min="1"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="Ej: 938390"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white text-lg font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    {payAmount && parseFloat(payAmount) > 0 && (
                      <p className="text-emerald-400 text-sm mt-1 font-semibold">
                        ${parseFloat(payAmount).toLocaleString('es-CO')} COP
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Total cotización: ${(selectedCotizacion?.precioTotal || 0).toLocaleString('es-CO')} COP
                    </p>
                  </div>

                  <button
                    onClick={handleGeneratePayLink}
                    disabled={payLoading || !payAmount || parseFloat(payAmount) <= 0}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {payLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    {payLoading ? 'Generando...' : 'Generar Link de Pago'}
                  </button>
                </>
              ) : (
                <>
                  {/* Resultado */}
                  <div className="text-center py-2">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-white font-bold text-lg">¡Link de pago listo!</p>
                    {payResult.test && (
                      <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700 px-2 py-0.5 rounded-full">
                        Modo sandbox (prueba)
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-800 rounded-xl p-3 break-all">
                    <p className="text-emerald-400 text-sm font-mono">{payResult.pagoUrl}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(payResult.pagoUrl).then(() => alert('✅ Link copiado'))}
                      className="py-3 bg-purple-700 hover:bg-purple-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Copiar Link
                    </button>
                    <a
                      href={`https://wa.me/${(selectedCotizacion?.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedCotizacion?.nombre?.split(' ')[0]}, aquí está el link para realizar el pago de tu reserva con GuíaSAI:\n\n${payResult.pagoUrl}\n\n¡Pago 100% seguro con Wompi (Bancolombia)! 🔒`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 bg-green-700 hover:bg-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white no-underline"
                    >
                      💬 Enviar WA
                    </a>
                  </div>

                  <button
                    onClick={() => { setPayResult(null); }}
                    className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm text-gray-300"
                  >
                    Generar otro link
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

  return null;
};

export default AdminQuotes;
