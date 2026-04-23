import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Send, Trash2, Calendar, Users, DollarSign, Clock,
  CheckCircle2, AlertCircle, FileText, Search, Filter, User, Mail, Phone,
  Download, Eye, Loader2, Bot, ChevronDown, ChevronUp, Sparkles, Link2,
} from 'lucide-react';
import { AppRoute, Cotizacion, CotizacionItem, Tour, QuoteStatus, QUOTE_STATUS_CONFIG } from '../../types';
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
import { downloadQuotePDF, previewQuote } from '../../services/pdfService';

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
  const [alojamientos, setAlojamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  
  // Estados para edición completa de items (fecha, pax)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<Partial<CotizacionItem>>({});

  // Estado para edición inline de precio (solo precio, sin abrir todo el editor)
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>('');
  const inlinePriceSavingRef = useRef(false); // evita doble-trigger Enter+blur

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

  // Modo agregar item: catálogo o ítem libre
  const [addItemMode, setAddItemMode] = useState<'catalog' | 'free'>('catalog');
  const [freeItemForm, setFreeItemForm] = useState<{
    nombre: string; tipo: CotizacionItem['servicioTipo']; valorUnitario: string; personas: string; cantidad: string;
    aerolinea: string; origen: string; destino: string; tipoVuelo: string; notasTiquete: string;
  }>({ nombre: '', tipo: 'tiquete', valorUnitario: '', personas: '2', cantidad: '1',
       aerolinea: 'JetSmart', origen: '', destino: 'ADZ', tipoVuelo: 'Ida y vuelta', notasTiquete: '' });

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

    // Validar capacidad
    const capacityCheck = validateCapacity(service, formData.adultos, formData.ninos, formData.bebes);
    if (!capacityCheck.valid) {
      alert(capacityCheck.message);
      return;
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

    const payingPeople = formData.adultos + formData.ninos;
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
      setFreeItemForm({ nombre: '', tipo: 'tour', valorUnitario: '', personas: String(formData.adultos + formData.ninos || 2), cantidad: '1' });
    } else {
      alert('❌ Error al agregar el ítem');
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

    // Guardar en Airtable
    const saved = await updateCotizacionItem(itemId, updatedItem);
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

    const saved = await updateCotizacionItem(itemId, updatedItem);
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
    const saved = await updateCotizacionItem(itemId, updatedItem);
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
    const saved = await updateCotizacionItem(itemId, updatedItem);
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
    const saved = await updateCotizacionItem(itemId, updatedItem);
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

  const handleDownloadPDF = async () => {
    if (!selectedCotizacion) return;
    
    setGeneratingPDF(true);
    try {
      await downloadQuotePDF(selectedCotizacion, items, [...services, ...alojamientos]);
      alert('✅ PDF descargado exitosamente');
    } catch (error) {
      alert('❌ Error generando PDF. Inténtalo de nuevo.');
      console.error(error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePreview = () => {
    if (!selectedCotizacion) return;
    previewQuote(selectedCotizacion, items, [...services, ...alojamientos]);
  };

  // Normaliza alojamientos al mismo shape que Tour para el catálogo
  const alojamientosAsTour = alojamientos.map((a: any) => ({
    ...a,
    title: a.title || a.nombre || a.name || '',
    category: 'hotel' as const,
    active: true,
  }));

  const allCatalogItems = [...services, ...alojamientosAsTour];

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

          {/* Lista de cotizaciones */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-4">Cargando cotizaciones...</p>
              </div>
            ) : cotizaciones.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay cotizaciones todavía</p>
                <button
                  onClick={() => setView('create')}
                  className="mt-4 text-blue-500 hover:text-blue-400"
                >
                  Crear primera cotización
                </button>
              </div>
            ) : (
              cotizaciones.map(cot => {
                const statusConfig = QUOTE_STATUS_CONFIG[cot.estado] || QUOTE_STATUS_CONFIG['Draft'];
                return (
                  <div
                    key={cot.id}
                    onClick={async () => {
                      const full = await getCotizacionById(cot.id);
                      if (full) {
                        setSelectedCotizacion(full);
                        setItems(full.items || []);
                        setView('detail');
                      }
                    }}
                    className="bg-gray-900 p-6 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors border border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{cot.nombre}</h3>
                          <span className={`px-3 py-1 ${statusConfig.color} ${statusConfig.textColor} rounded-full text-sm font-medium`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {safeDate(cot.fechaInicio)?.toLocaleDateString() ?? '—'} - {safeDate(cot.fechaFin)?.toLocaleDateString() ?? '—'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {cot.adultos + cot.ninos + cot.bebes} pax
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            ${cot.precioTotal.toLocaleString('es-CO')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">{selectedCotizacion.nombre}</h1>
                <p className="text-gray-400">
                  {safeDate(selectedCotizacion.fechaInicio)?.toLocaleDateString() ?? '—'} - {safeDate(selectedCotizacion.fechaFin)?.toLocaleDateString() ?? '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const url = `https://www.guanago.travel/cotizacion/${selectedCotizacion?.id}`;
                  navigator.clipboard.writeText(url).then(() => alert('✅ Link copiado: ' + url));
                }}
                title="Copiar link público para compartir con el cliente"
                className="flex items-center gap-2 px-4 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors font-medium"
              >
                <Link2 className="w-5 h-5" />
                Copiar Link
              </button>
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                <Eye className="w-5 h-5" />
                Preview
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar PDF
                  </>
                )}
              </button>
              <button
                onClick={handleSendQuote}
                disabled={!canSendQuote}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
              >
                <Send className="w-5 h-5" />
                Enviar
              </button>
            </div>
            {!canSendQuote && (
              <p className="text-xs text-gray-400 mt-2">
                Completa email y teléfono del cliente y agrega al menos un servicio antes de enviar.
              </p>
            )}
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
                <h3 className="text-xl font-semibold mb-4">Servicios Incluidos ({items.length})</h3>
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
                                  <input type="date" value={editingItemData.fecha || ''} onChange={e => setEditingItemData({ ...editingItemData, fecha: e.target.value })} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm" />
                                </div>
                                {item.servicioTipo === 'hotel' && (
                                  <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Fecha Fin</label>
                                    <input type="date" value={editingItemData.fechaFin || item.fechaFin || ''} onChange={e => setEditingItemData({ ...editingItemData, fechaFin: e.target.value })} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm" />
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
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveEditItem(item.id)} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-semibold transition-colors">Guardar</button>
                                <button onClick={handleCancelEditItem} className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-semibold transition-colors">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            // ── MODO VISUALIZACIÓN (fila tabla Excel) ──
                            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center px-3 py-2.5">
                              {/* Nombre */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-sm truncate">{item.servicioNombre}</span>
                                  {item.esPersonalizado && (
                                    <span className="px-1.5 py-0.5 bg-purple-900/40 text-purple-400 rounded text-[9px] font-bold flex-shrink-0">LIBRE</span>
                                  )}
                                  {item.status === 'conflicto' && (
                                    <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-600 uppercase">{item.servicioTipo}</span>
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

                              {/* Acciones */}
                              <div className="w-16 flex items-center justify-end gap-0.5">
                                <button onClick={() => handleStartEditItem(item)} title="Editar" className="p-1.5 text-gray-600 hover:text-blue-400 rounded transition-colors">
                                  <Calendar className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteItem(item.id)} title="Eliminar" className="p-1.5 text-gray-600 hover:text-red-400 rounded transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
                      <span className="w-28 text-right font-bold text-white font-mono">
                        ${items.reduce((s, i) => s + i.subtotal, 0).toLocaleString('es-CO')}
                      </span>
                      <span className="w-16"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas internas */}
              {selectedCotizacion.notasInternas && (
                <div className="bg-gray-900 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold mb-2">Notas Internas</h3>
                  <p className="text-gray-400">{selectedCotizacion.notasInternas}</p>
                </div>
              )}
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
      </div>
    );
  }

  return null;
};

export default AdminQuotes;
