/**
 * CotizadorB2C — Wizard público de cotización para clientes B2C
 * Botón flotante → modal paso a paso → guarda Lead + CotizacionesGG en Airtable
 *
 * ORDEN DE PASOS: Fechas+Pax → Datos → Actividades → Alojamiento → Resumen
 */

import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  MessageSquare, X, ChevronRight, ChevronLeft,
  Plus, Minus, Check, Phone, User, Mail, FileText,
  Anchor, Bed, Loader2, Send, Calendar, Users,
  Car, Package as PackageIcon, MapPin, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { cachedApi } from '../services/cachedApi';
import { createLead } from '../services/airtableService';
import { createCotizacion, addCotizacionItem } from '../services/quotesService';
import { getPrecioB2C } from '../services/pricing';
import { Tour, AppRoute } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

// Fechas primero — el usuario espera poder elegir fechas desde el inicio
type Step = 'dates' | 'contact' | 'tours' | 'hotels' | 'summary' | 'done';
const STEPS: Step[] = ['dates', 'contact', 'tours', 'hotels', 'summary', 'done'];

const STEP_LABELS: Record<Step, string> = {
  dates:   'Fechas',
  contact: 'Tus datos',
  tours:   'Actividades',
  hotels:  'Alojamiento',
  summary: 'Resumen',
  done:    'Listo',
};

// ─── Constantes Paso 4 (Alojamiento) ─────────────────────────────────────────

const COLECCIONES = ['Todas', 'Island Room', 'Posada Raizal', 'Come Noh', 'Seaflower Hotel'] as const;
const COLECCION_COLORS: Record<string, string> = {
  'Island Room':    '#16a37a',
  'Posada Raizal':  '#d9930a',
  'Come Noh':       '#D32F2F',
  'Seaflower Hotel':'#7a3fb0',
};
const ADDONS_LIST = [
  { key: 'transfer', emoji: '🚌', nombre: 'Traslado aeropuerto',         detalle: 'Por trayecto · compartido', precio: 60000,  porPax: false },
  { key: 'tour',     emoji: '⛵', nombre: 'Tour Acuario + Johnny Cay',    detalle: 'Por persona',               precio: 120000, porPax: true  },
  { key: 'comida',   emoji: '🍽️', nombre: 'Comida a domicilio (aliado)',  detalle: 'Por persona · evita salir', precio: 45000,  porPax: true  },
  { key: 'vehiculo', emoji: '🛵', nombre: 'Alquiler vehículo / mula',     detalle: 'Por día',                   precio: 180000, porPax: false },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcNights(fechaInicio: string, fechaFin: string): number {
  if (!fechaInicio || !fechaFin) return 1;
  const d1 = new Date(fechaInicio);
  const d2 = new Date(fechaFin);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}

function fmtCOP(n: number): string {
  if (!n || n <= 0) return 'A consultar';
  return '$' + n.toLocaleString('es-CO') + ' COP';
}

function getServicePrice(svc: any): number {
  return svc.precioB2C || svc.precioActualizado || svc.precioBase || svc.price || 0;
}

/** Precio escalonado por número de huéspedes para alojamientos */
function getHotelPriceByPax(svc: any, totalPax: number): number {
  // precio2-4hues tienen placeholder 700k en ~25 registros — ignorar ese valor literal
  const safe = (n: number) => (n > 0 && n !== 700000) ? n : 0;
  if (totalPax >= 6 && svc.precio6hues > 0) return svc.precio6hues;
  if (totalPax >= 5 && svc.precio5hues > 0) return svc.precio5hues;
  if (totalPax >= 4 && safe(svc.precio4hues)) return safe(svc.precio4hues);
  if (totalPax === 3 && safe(svc.precio3hues)) return safe(svc.precio3hues);
  if (totalPax <= 2 && safe(svc.precio2hues)) return safe(svc.precio2hues);
  return getServicePrice(svc);
}

/** Precio base "desde" para tarjeta pública de alojamiento */
function getDesdePrecio(svc: any): number {
  const opts = [svc.precioB2C, svc.price].filter((p: number) => p > 0);
  return opts.length ? Math.min(...opts) : 0;
}

/** Precio de unidad completa para grupos (solo si cap ≥ 5) */
function getCompletoPrice(svc: any, desde: number): number | null {
  if ((svc.capacidadMaxima || 0) < 5) return null;
  const completo = [svc.precio6hues, svc.precio5hues].find((p: number) => p > 0 && p > desde);
  return completo || null;
}

/** Título opaco para cards públicas — NO expone nombre real */
function getOpaqueTitle(svc: any): string {
  const tipo = svc.tipoAlojamiento || 'Alojamiento';
  const cap  = svc.capacidadMaxima;
  return cap ? `${tipo} · hasta ${cap} huéspedes` : tipo;
}

function getServiceImage(svc: any): string {
  return svc.image || svc.imageUrl || svc.foto || '';
}

function getServiceName(svc: any): string {
  return svc.title || svc.nombre || svc.name || '';
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'tour':    return <Anchor size={14} />;
    case 'hotel':   return <Bed size={14} />;
    case 'taxi':    return <Car size={14} />;
    case 'package': return <PackageIcon size={14} />;
    default:        return <MapPin size={14} />;
  }
}

/** Resumen de camas para un alojamiento */
function bedSummary(svc: any): string {
  const parts: string[] = [];
  if (svc.camaKing > 0)      parts.push(`${svc.camaKing} King`);
  if (svc.camaQueen > 0)     parts.push(`${svc.camaQueen} Queen`);
  if (svc.camasDobles > 0)   parts.push(`${svc.camasDobles} doble${svc.camasDobles > 1 ? 's' : ''}`);
  if (svc.camasSencillas > 0) parts.push(`${svc.camasSencillas} senc.`);
  return parts.join(' · ');
}

// ─── Counter ─────────────────────────────────────────────────────────────────

const Counter: React.FC<{
  label: string; sublabel?: string; value: number; min?: number; max?: number;
  onChange: (v: number) => void;
}> = ({ label, sublabel, value, min = 0, max = 30, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-full border-2 border-emerald-400 text-emerald-600 flex items-center justify-center hover:bg-emerald-50 transition-colors disabled:opacity-30"
        disabled={value <= min}
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center font-bold text-gray-800 text-base">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-30"
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

// ─── Service Card ─────────────────────────────────────────────────────────────

const ServiceCard: React.FC<{
  svc: any; selected: boolean; pax: number; nights?: number;
  onToggle: () => void; priceLabel?: string;
}> = ({ svc, selected, pax, nights = 1, onToggle, priceLabel }) => {
  const isHotel = priceLabel === 'noche' || svc.category === 'hotel';
  const price   = isHotel ? getHotelPriceByPax(svc, pax) : getServicePrice(svc);
  const total   = price > 0 ? price * (isHotel ? nights : pax) : 0;
  const image   = getServiceImage(svc);
  const name    = getServiceName(svc);
  const capMax  = svc.capacidadMaxima || 0;
  const capText = svc.capacidad || (capMax > 0 ? `${capMax} personas` : '');
  const camas   = isHotel ? bedSummary(svc) : '';

  // Amenidades visibles (máx 4)
  const amenidades: string[] = [];
  if (isHotel) {
    if (svc.vistaAlMar)    amenidades.push('🌊 Vista al mar');
    if (svc.accesoPiscina) amenidades.push('🏊 Piscina');
    if (svc.accesoJacuzzi) amenidades.push('♨️ Jacuzzi');
    if (svc.tieneCocina)   amenidades.push('🍳 Cocina');
    if (svc.accesoBar)     amenidades.push('🍹 Bar');
  }

  return (
    <div
      onClick={onToggle}
      className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200 active:scale-95 ${
        selected
          ? 'border-emerald-500 shadow-lg shadow-emerald-100'
          : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-300 ${selected ? 'scale-105' : ''}`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            {getCategoryIcon(svc.category || '')}
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <Check size={20} className="text-white" />
            </div>
          </div>
        )}
        {svc.isRaizal && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Raizal
          </span>
        )}
        {/* Badge de capacidad */}
        {isHotel && capMax > 0 && (
          <span className={`absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            pax > capMax
              ? 'bg-red-500 text-white'
              : 'bg-black/60 text-white'
          }`}>
            <Users size={9} />
            {capText || `${capMax} pers.`}
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{name}</h4>
        {/* Tipo de alojamiento */}
        {svc.tipoAlojamiento && (
          <p className="text-[10px] text-gray-400 mt-0.5">{svc.tipoAlojamiento}</p>
        )}
        {/* Camas */}
        {camas && (
          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Bed size={9} /> {camas}
          </p>
        )}
        {!camas && svc.duration && (
          <p className="text-[10px] text-gray-400 mt-0.5">{svc.duration}</p>
        )}
        {/* Amenidades */}
        {amenidades.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {amenidades.slice(0, 3).map(a => (
              <span key={a} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}
        {/* Alerta capacidad excedida */}
        {isHotel && capMax > 0 && pax > capMax && (
          <p className="text-[9px] text-red-500 font-semibold mt-1 flex items-center gap-0.5">
            <AlertCircle size={9} /> Capacidad excedida para {pax} personas
          </p>
        )}
        <div className="flex items-end justify-between mt-2 gap-1">
          {price > 0 ? (
            <div>
              <p className="text-[10px] text-gray-400">desde</p>
              <p className="text-xs font-bold text-emerald-600 leading-tight">{fmtCOP(price)}</p>
              <p className="text-[10px] text-gray-400">/ {priceLabel || 'persona'}</p>
            </div>
          ) : (
            <p className="text-[10px] text-emerald-600 font-medium">Consultar precio</p>
          )}
          {total > 0 && selected && (
            <div className="text-right">
              <p className="text-[10px] text-gray-400">total</p>
              <p className="text-xs font-bold text-emerald-700">{fmtCOP(total)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface CotizadorB2CProps {
  onNavigate?: (route: AppRoute, data?: any) => void;
}

export interface CotizadorB2CHandle {
  open: () => void;
}

const CotizadorB2C = forwardRef<CotizadorB2CHandle, CotizadorB2CProps>(({ onNavigate }, ref) => {
  const [isOpen,         setIsOpen]         = useState(false);
  const [step,           setStep]           = useState<Step>('dates');
  const [loading,        setLoading]        = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saveError,      setSaveError]      = useState('');
  const [services,       setServices]       = useState<Tour[]>([]);
  const [alojamientos,   setAlojamientos]   = useState<any[]>([]);
  const catalogLoadedRef = useRef(false);

  // Form — contact
  const [telefono,      setTelefono]      = useState('');
  const [nombre,        setNombre]        = useState('');
  const [email,         setEmail]         = useState('');
  const [notas,         setNotas]         = useState('');
  const [requerimiento, setRequerimiento] = useState<string[]>([]);

  // Form — dates + pax
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin,    setFechaFin]    = useState('');
  const [adultos,     setAdultos]     = useState(2);
  const [ninos,       setNinos]       = useState(0);
  const [bebes,       setBebes]       = useState(0);

  // Selections
  const [selectedTours,  setSelectedTours]  = useState<Set<string>>(new Set());
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());

  // Paso 4 — filtros de alojamiento
  const [filtroColeccion, setFiltroColeccion] = useState<string>('Todas');
  const [filtroVistaMar,  setFiltroVistaMar]  = useState(false);
  const [filtroCocina,    setFiltroCocina]    = useState(false);
  const [filtroPiscina,   setFiltroPiscina]   = useState(false);
  const [filtroPrecioMax, setFiltroPrecioMax] = useState(1800000);

  // Bottom sheet de adicionales
  const [sheetAloj,      setSheetAloj]      = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});

  const loadCatalog = useCallback(async () => {
    if (catalogLoadedRef.current) return;
    setCatalogLoading(true);
    try {
      const [svcs, alojs] = await Promise.all([
        cachedApi.getServices(),
        cachedApi.getAlojamientos(),
      ]);
      setServices(
        (svcs || [])
          .filter((s: Tour) => s.active && s.category !== 'hotel')
          .sort((a: Tour, b: Tour) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0))
          .slice(0, 24)
      );
      setAlojamientos((alojs || []).filter((a: any) => a.active !== false));
      catalogLoadedRef.current = true;
    } catch (err) {
      console.error('Error cargando catálogo cotizador:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const open = () => {
    setIsOpen(true);
    setStep('dates');
    setSaveError('');
    loadCatalog();
  };

  useImperativeHandle(ref, () => ({ open }), []);

  const close = () => setIsOpen(false);

  const reset = () => {
    setStep('dates');
    setTelefono(''); setNombre(''); setEmail(''); setNotas('');
    setRequerimiento([]);
    setFechaInicio(''); setFechaFin('');
    setAdultos(2); setNinos(0); setBebes(0);
    setSelectedTours(new Set()); setSelectedHotels(new Set());
    setFiltroColeccion('Todas'); setFiltroVistaMar(false); setFiltroCocina(false);
    setFiltroPiscina(false); setFiltroPrecioMax(1800000);
    setSheetAloj(null); setSelectedAddons({});
    setSaveError('');
  };

  // Permite abrir desde cualquier parte de la app via evento
  React.useEffect(() => {
    const handler = () => open();
    window.addEventListener('guanago:open-cotizador', handler);
    return () => window.removeEventListener('guanago:open-cotizador', handler);
  }, []);

  const stepIndex      = STEPS.indexOf(step);
  const totalVisible   = 5; // dates, contact, tours, hotels, summary

  const canProceed = (): boolean => {
    if (step === 'dates')   return !!fechaInicio && !!fechaFin && new Date(fechaFin) > new Date(fechaInicio);
    if (step === 'contact') return telefono.trim().length >= 7;
    return true;
  };

  const goNext = () => {
    if (STEPS[stepIndex + 1]) setStep(STEPS[stepIndex + 1]);
  };

  const goBack = () => {
    if (step === 'dates') { close(); return; }
    if (STEPS[stepIndex - 1]) setStep(STEPS[stepIndex - 1]);
  };

  const toggleTour  = (id: string) => setSelectedTours(prev  => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleHotel = (id: string) => setSelectedHotels(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleReq   = (r: string)  => setRequerimiento(prev  => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const pax    = adultos + ninos;
  const nights = calcNights(fechaInicio, fechaFin);

  const calcTotal = () => {
    let total = 0;
    services.filter(s => selectedTours.has(s.id)).forEach(s => {
      const p = getServicePrice(s);
      if (p > 0) total += p * pax;
    });
    alojamientos.filter(a => selectedHotels.has(a.id)).forEach(a => {
      const p = getDesdePrecio(a) || getHotelPriceByPax(a, pax);
      if (p > 0) total += p * nights;
    });
    ADDONS_LIST.forEach(addon => {
      if (selectedAddons[addon.key]) {
        total += addon.porPax ? addon.precio * pax : addon.precio;
      }
    });
    return total;
  };

  const submit = async () => {
    setLoading(true);
    setSaveError('');
    try {
      const req = requerimiento.join(', ');
      const msg = [
        req && `Interés: ${req}`,
        notas && `Notas: ${notas}`,
        `Fechas: ${fechaInicio} → ${fechaFin}`,
        `Pax: ${adultos} adultos, ${ninos} niños, ${bebes} bebés`,
      ].filter(Boolean).join(' | ');

      // 1. Lead en tabla Leads
      try {
        await createLead({
          nombre: nombre || 'Cliente Web',
          email:  email  || '',
          telefono,
          mensaje: msg,
          origen:  'Cotizador B2C GuanaGO',
        });
      } catch (leadErr) {
        console.warn('⚠️ Lead no guardado:', leadErr);
        // Continuamos — el lead no es bloqueante
      }

      // 2. Cotización en CotizacionesGG
      // IMPORTANTE: estado 'Draft' con D mayúscula — así lo espera el Select de Airtable
      const hotelesNombres = alojamientos.filter((a: any) => selectedHotels.has(a.id)).map((a: any) => getServiceName(a)).join(', ');
      const notasB2C = `[B2C Web] ${[req, notas, hotelesNombres && `Aloj: ${hotelesNombres}`].filter(Boolean).join(' | ')}`.trim();

      const cotizacion = await createCotizacion({
        nombre:       nombre || 'Cliente Web',
        email:        email  || '',
        telefono,
        fechaInicio,
        fechaFin,
        adultos,
        ninos,
        bebes,
        fechaCreacion: new Date().toISOString(),
        estado:        'Draft' as any,   // Airtable Select: 'Draft' con mayúscula
        precioTotal:   calcTotal(),
        notasInternas: notasB2C,
      });

      if (!cotizacion) {
        throw new Error('No se pudo crear la cotización en Airtable. Verifica la conexión e intenta de nuevo.');
      }

      // 3. Items
      const allItemPromises = [
        ...services.filter(s => selectedTours.has(s.id)).map(s => {
          const price = getServicePrice(s);
          return addCotizacionItem({
            cotizacionId:   cotizacion.id,
            servicioId:     s.id,
            servicioNombre: getServiceName(s),
            servicioTipo:   'tour',
            fecha:          fechaInicio,
            adultos, ninos, bebes,
            valorUnitario:  price,
            personas:       pax,
            cantidad:       1,
            precioUnitario: price,
            subtotal:       price * pax,
            esPersonalizado: false,
            status:         'disponible',
          });
        }),
        ...alojamientos.filter(a => selectedHotels.has(a.id)).map(a => {
          const price = getDesdePrecio(a) || getHotelPriceByPax(a, pax);
          return addCotizacionItem({
            cotizacionId:   cotizacion.id,
            servicioId:     a.id,
            servicioNombre: getOpaqueTitle(a),  // título opaco al cliente
            servicioTipo:   'hotel',
            fecha:          fechaInicio,
            fechaFin,
            adultos, ninos, bebes,
            valorUnitario:  price,
            personas:       1,
            cantidad:       nights,
            precioUnitario: price,
            subtotal:       price * nights,
            esPersonalizado: false,
            status:         'disponible',
          });
        }),
        // Adicionales seleccionados en el bottom sheet
        ...ADDONS_LIST.filter(addon => selectedAddons[addon.key]).map(addon => {
          const precio = addon.porPax ? addon.precio * pax : addon.precio;
          return addCotizacionItem({
            cotizacionId:   cotizacion.id,
            servicioNombre: addon.nombre,
            servicioTipo:   addon.key === 'transfer' || addon.key === 'vehiculo' ? 'transfer' : 'tour',
            fecha:          fechaInicio,
            adultos, ninos, bebes,
            valorUnitario:  addon.precio,
            personas:       addon.porPax ? pax : 1,
            cantidad:       1,
            precioUnitario: addon.precio,
            subtotal:       precio,
            esPersonalizado: true,
            status:         'disponible',
          });
        }),
      ];

      await Promise.allSettled(allItemPromises);
      setStep('done');

    } catch (err: any) {
      console.error('❌ Error guardando cotización B2C:', err);
      setSaveError(err?.message || 'Error al guardar. Verifica tu conexión y vuelve a intentar.');
    } finally {
      setLoading(false);
    }
  };

  const total              = calcTotal();
  const toursSeleccionados = services.filter(s => selectedTours.has(s.id));
  const hotelesSeleccionados = alojamientos.filter(a => selectedHotels.has(a.id));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={open}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg shadow-emerald-200 px-4 py-3 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all duration-200"
          aria-label="Cotizar viaje"
        >
          <MessageSquare size={20} />
          <span className="text-sm font-bold">¡Cotiza aquí!</span>
        </button>
      )}

      {/* Modal — full screen */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ maxHeight: '100dvh', overflowY: 'hidden' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex-shrink-0">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">Cotiza tu viaje</h2>
                  <p className="text-xs text-emerald-100">San Andrés · GuanaGO</p>
                </div>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress */}
            {step !== 'done' && (
              <div className="px-4 pb-3">
                <div className="flex gap-1 mb-1.5">
                  {STEPS.slice(0, totalVisible).map((s, i) => (
                    <div
                      key={s}
                      className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        i <= stepIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-emerald-100">
                  Paso {Math.min(stepIndex + 1, totalVisible)} de {totalVisible} — {STEP_LABELS[step]}
                </p>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 pb-2 max-w-lg mx-auto">

              {/* ── STEP: dates (PRIMERO) ── */}
              {step === 'dates' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Cuándo nos visitas?</h3>
                    <p className="text-sm text-gray-500 mt-1">Elige tus fechas y cuántas personas viajan.</p>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <Calendar size={14} className="inline mr-1 text-emerald-500" />
                        Fecha de llegada *
                      </label>
                      <input
                        type="date"
                        value={fechaInicio}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => {
                          setFechaInicio(e.target.value);
                          if (fechaFin && e.target.value >= fechaFin) setFechaFin('');
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none bg-white"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <Calendar size={14} className="inline mr-1 text-emerald-500" />
                        Fecha de salida *
                      </label>
                      <input
                        type="date"
                        value={fechaFin}
                        min={fechaInicio
                          ? new Date(new Date(fechaInicio).getTime() + 86400000).toISOString().split('T')[0]
                          : new Date().toISOString().split('T')[0]}
                        onChange={e => setFechaFin(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none bg-white"
                        disabled={!fechaInicio}
                      />
                    </div>
                    {fechaInicio && fechaFin && (
                      <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-semibold">
                        <Check size={14} />
                        {nights} {nights === 1 ? 'noche' : 'noches'} en San Andrés Islas
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-emerald-500" />
                      <h4 className="text-sm font-bold text-gray-700">Pasajeros</h4>
                    </div>
                    <Counter label="Adultos" sublabel="18+ años"  value={adultos} min={1} onChange={setAdultos} />
                    <Counter label="Niños"   sublabel="4-17 años" value={ninos}   min={0} onChange={setNinos} />
                    <Counter label="Bebés"   sublabel="0-3 años"  value={bebes}   min={0} onChange={setBebes} />
                  </div>
                </div>
              )}

              {/* ── STEP: contact ── */}
              {step === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Cómo te contactamos?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Te enviamos la cotización por WhatsApp. Solo necesitamos tu teléfono.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Teléfono / WhatsApp <span className="text-emerald-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        placeholder="+57 300 123 4567"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nombre <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ¿Qué necesitas? <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Tours', 'Alojamiento', 'Paquete completo', 'Traslado aeropuerto', 'Tour privado'].map(r => (
                        <button
                          key={r}
                          onClick={() => toggleReq(r)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                            requerimiento.includes(r)
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Notas adicionales <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3 top-3.5 text-gray-400" />
                      <textarea
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        placeholder="Ej: Celebramos aniversario, viajamos con niños pequeños..."
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP: tours ── */}
              {step === 'tours' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Qué actividades te interesan?</h3>
                    <p className="text-sm text-gray-500 mt-1">Selecciona uno o varios — puedes combinarlos.</p>
                  </div>

                  {selectedTours.size > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-sm text-emerald-700 font-medium">
                      <Check size={14} />
                      {selectedTours.size} {selectedTours.size === 1 ? 'actividad seleccionada' : 'actividades seleccionadas'}
                    </div>
                  )}

                  {catalogLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={24} className="text-emerald-500 animate-spin" />
                      <span className="ml-3 text-gray-400 text-sm">Cargando catálogo...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {services.map(svc => (
                        <ServiceCard
                          key={svc.id} svc={svc}
                          selected={selectedTours.has(svc.id)} pax={pax}
                          onToggle={() => toggleTour(svc.id)}
                        />
                      ))}
                      {services.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-400">
                          <Anchor size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Sin actividades disponibles</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={goNext} className="w-full text-center text-sm text-gray-400 py-2 hover:text-emerald-500 transition-colors">
                    Saltar este paso →
                  </button>
                </div>
              )}

              {/* ── STEP: hotels (Paso 4 — ¿Dónde te quedas?) ── */}
              {step === 'hotels' && (() => {
                const alojaFiltrados = alojamientos.filter((a: any) => {
                  if (filtroColeccion !== 'Todas' && a.coleccion !== filtroColeccion) return false;
                  if (filtroVistaMar  && !a.vistaAlMar)    return false;
                  if (filtroCocina    && !a.tieneCocina)   return false;
                  if (filtroPiscina   && !a.accesoPiscina) return false;
                  if ((a.capacidadMaxima || 0) > 0 && a.capacidadMaxima < pax) return false;
                  const desde = getDesdePrecio(a);
                  if (desde > 0 && desde > filtroPrecioMax) return false;
                  return true;
                });

                return (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">¿Dónde te quedas?</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Toca una tarjeta para agregar extras a tu viaje.</p>
                    </div>

                    {/* Chips de Colección */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                      {COLECCIONES.map(c => (
                        <button
                          key={c}
                          onClick={() => setFiltroColeccion(c)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                            filtroColeccion === c
                              ? 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Chips de amenidades */}
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: 'vistaMar', label: '🌊 Vista al mar',  val: filtroVistaMar, set: setFiltroVistaMar },
                        { key: 'cocina',   label: '🍳 Cocina',        val: filtroCocina,   set: setFiltroCocina },
                        { key: 'piscina',  label: '🏊 Piscina',       val: filtroPiscina,  set: setFiltroPiscina },
                      ].map(({ key, label, val, set }) => (
                        <button
                          key={key}
                          onClick={() => set(!val)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                            val
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Precio máx */}
                    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-gray-500">Precio máx / noche</label>
                        <span className="text-xs font-bold text-emerald-600 font-mono">{fmtCOP(filtroPrecioMax)}</span>
                      </div>
                      <input
                        type="range" min={80000} max={1800000} step={20000}
                        value={filtroPrecioMax}
                        onChange={e => setFiltroPrecioMax(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    {/* Contador */}
                    <p className="text-xs text-gray-400 font-medium">
                      {alojaFiltrados.length} alojamiento{alojaFiltrados.length !== 1 ? 's' : ''} · precios por noche para {pax} persona{pax !== 1 ? 's' : ''}
                    </p>

                    {/* Selección actual */}
                    {selectedHotels.size > 0 && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs text-emerald-700 font-semibold">
                        <Check size={13} />
                        {selectedHotels.size} {selectedHotels.size === 1 ? 'alojamiento seleccionado' : 'alojamientos seleccionados'} · toca para ver extras
                      </div>
                    )}

                    {catalogLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="text-emerald-500 animate-spin" />
                        <span className="ml-3 text-gray-400 text-sm">Cargando alojamientos...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {alojaFiltrados.map((aloj: any) => {
                          const desde    = getDesdePrecio(aloj);
                          const completo = getCompletoPrice(aloj, desde);
                          const colColor = COLECCION_COLORS[aloj.coleccion] || '#999';
                          const isSelected = selectedHotels.has(aloj.id);
                          const amenList = [
                            { label: '🌊 Vista', val: !!aloj.vistaAlMar },
                            { label: '🍳 Cocina', val: !!aloj.tieneCocina },
                            { label: '🏊 Piscina', val: !!aloj.accesoPiscina },
                          ];

                          return (
                            <div
                              key={aloj.id}
                              onClick={() => setSheetAloj(aloj)}
                              className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200 active:scale-95 flex flex-col bg-white ${
                                isSelected
                                  ? 'border-emerald-500 shadow-lg shadow-emerald-100'
                                  : 'border-gray-200 hover:border-emerald-300'
                              }`}
                            >
                              {/* Foto */}
                              <div className="h-24 relative overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
                                {aloj.image ? (
                                  <img src={aloj.image} alt="" className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Bed size={28} className="text-emerald-300" />
                                  </div>
                                )}
                                {/* Badge colección */}
                                {aloj.coleccion && (
                                  <span className="absolute top-1.5 left-1.5 text-[9px] font-black text-white px-1.5 py-0.5 rounded-md"
                                    style={{ background: colColor }}>
                                    {aloj.coleccion}
                                  </span>
                                )}
                                {/* Badge capacidad */}
                                {aloj.capacidadMaxima > 0 && (
                                  <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    pax > aloj.capacidadMaxima ? 'bg-red-500 text-white' : 'bg-black/55 text-white'
                                  }`}>
                                    {aloj.capacidadMaxima} pax
                                  </span>
                                )}
                                {/* Check de seleccionado */}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                                      <Check size={16} className="text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="p-2.5 flex flex-col gap-1 flex-1">
                                <p className="text-[11px] font-bold text-gray-800 leading-tight">{getOpaqueTitle(aloj)}</p>
                                {true && (
                                  <div className="flex flex-wrap gap-1">
                                    {amenList.map(a => (
                                      <span key={a.label} className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                                        a.val ? 'text-emerald-700 bg-emerald-50' : 'text-gray-300 bg-gray-50'
                                      }`}>{a.label}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-auto pt-1">
                                  {desde > 0 ? (
                                    <>
                                      <p className="text-[9px] text-gray-400">desde</p>
                                      <p className="text-sm font-black text-emerald-600 font-mono leading-tight">${desde.toLocaleString('es-CO')}</p>
                                      {completo && (
                                        <p className="text-[9px] text-gray-400 mt-0.5">o completo: ${completo.toLocaleString('es-CO')}/n</p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-[10px] text-emerald-500 font-medium">A consultar</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {alojaFiltrados.length === 0 && (
                          <div className="col-span-2 text-center py-12 text-gray-400">
                            <Bed size={28} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Sin resultados con esos filtros</p>
                            <button onClick={() => { setFiltroColeccion('Todas'); setFiltroVistaMar(false); setFiltroCocina(false); setFiltroPiscina(false); setFiltroPrecioMax(1800000); }}
                              className="mt-2 text-xs text-emerald-500 underline">Limpiar filtros</button>
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={goNext} className="w-full text-center text-sm text-gray-400 py-2 hover:text-emerald-500 transition-colors">
                      Saltar este paso →
                    </button>
                  </div>
                );
              })()}

              {/* ── STEP: summary ── */}
              {step === 'summary' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Resumen de tu viaje</h3>
                    <p className="text-sm text-gray-500 mt-1">Revisa y solicita tu cotización.</p>
                  </div>

                  {/* Fechas + pax */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Calendar size={13} className="text-emerald-500" /> Viaje
                    </h4>
                    {fechaInicio && (
                      <p className="text-sm text-gray-700">
                        📅 {new Date(fechaInicio + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        {' → '}
                        {new Date(fechaFin + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}<span className="font-semibold">{nights} {nights === 1 ? 'noche' : 'noches'}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      👥 {adultos} adulto{adultos !== 1 ? 's' : ''}
                      {ninos > 0 && `, ${ninos} niño${ninos !== 1 ? 's' : ''}`}
                      {bebes > 0 && `, ${bebes} bebé${bebes !== 1 ? 's' : ''}`}
                    </p>
                  </div>

                  {/* Contacto */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-500" /> Contacto
                    </h4>
                    <p className="text-sm text-gray-700 font-semibold">{telefono}</p>
                    {nombre && <p className="text-sm text-gray-500">{nombre}</p>}
                    {email  && <p className="text-sm text-gray-500">{email}</p>}
                    {requerimiento.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {requerimiento.map(r => (
                          <span key={r} className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tours */}
                  {toursSeleccionados.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Anchor size={13} className="text-emerald-500" /> Actividades ({toursSeleccionados.length})
                      </h4>
                      {toursSeleccionados.map(s => {
                        const p = getServicePrice(s);
                        return (
                          <div key={s.id} className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-700 flex-1 pr-2 text-xs">{getServiceName(s)}</span>
                            <span className="text-emerald-600 font-semibold text-xs whitespace-nowrap">
                              {p > 0 ? fmtCOP(p * pax) : 'A consultar'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Hotels */}
                  {hotelesSeleccionados.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Bed size={13} className="text-emerald-500" /> Alojamiento ({hotelesSeleccionados.length})
                      </h4>
                      {hotelesSeleccionados.map((a: any) => {
                        const p      = getDesdePrecio(a) || getHotelPriceByPax(a, pax);
                        const capMax = a.capacidadMaxima || 0;
                        const colColor = COLECCION_COLORS[a.coleccion] || '';
                        return (
                          <div key={a.id} className="py-1.5">
                            <div className="flex items-center gap-2">
                              {a.coleccion && colColor && (
                                <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded flex-shrink-0"
                                  style={{ background: colColor }}>{a.coleccion}</span>
                              )}
                              <span className="text-gray-700 flex-1 pr-2 text-xs font-medium">{getOpaqueTitle(a)}</span>
                              <span className="text-emerald-600 font-semibold text-xs whitespace-nowrap">
                                {p > 0 ? fmtCOP(p * nights) : 'A consultar'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 pl-0.5">
                              {capMax > 0 && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${pax > capMax ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                  <Users size={9} /> hasta {capMax} pers.{pax > capMax && ' ⚠️'}
                                </span>
                              )}
                              {p > 0 && nights > 0 && (
                                <span className="text-[10px] text-gray-400">{fmtCOP(p)}/noche · {nights} {nights === 1 ? 'noche' : 'noches'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Adicionales */}
                  {ADDONS_LIST.some(a => selectedAddons[a.key]) && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Plus size={13} className="text-emerald-500" /> Adicionales
                      </h4>
                      {ADDONS_LIST.filter(a => selectedAddons[a.key]).map(addon => {
                        const precio = addon.porPax ? addon.precio * pax : addon.precio;
                        return (
                          <div key={addon.key} className="flex items-center justify-between text-xs py-1">
                            <span className="text-gray-700">{addon.emoji} {addon.nombre}</span>
                            <span className="text-emerald-600 font-semibold">{fmtCOP(precio)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {toursSeleccionados.length === 0 && hotelesSeleccionados.length === 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
                      No seleccionaste servicios — un asesor te ayudará a armar tu paquete.
                    </div>
                  )}

                  {total > 0 && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-emerald-100 text-xs font-medium">Estimado total</p>
                          <p className="text-2xl font-black">{fmtCOP(total)}</p>
                          <p className="text-emerald-100 text-xs mt-0.5">
                            {pax} personas · {nights} noches · tarifa B2C · sujeto a disponibilidad
                          </p>
                        </div>
                        <div className="bg-black/20 rounded-xl px-3 py-2 text-center flex-shrink-0">
                          <p className="text-amber-300 font-black text-base leading-none">{Math.round(total / 1000).toLocaleString('es-CO')}</p>
                          <p className="text-[9px] text-white/80 mt-0.5">GuanaPoints</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {notas && (
                    <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
                      <FileText size={13} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <span className="italic text-xs">"{notas}"</span>
                    </div>
                  )}

                  {/* Error visible al intentar guardar */}
                  {saveError && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700 font-semibold">Error al enviar</p>
                        <p className="text-xs text-red-500 mt-0.5">{saveError}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP: done ── */}
              {step === 'done' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-2 space-y-6 py-8">
                  <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">¡Solicitud enviada!</h3>
                    <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                      Un asesor de GuanaGO te escribirá por WhatsApp a{' '}
                      <span className="font-bold text-emerald-600">{telefono}</span>{' '}
                      en las próximas horas con tu propuesta personalizada.
                    </p>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-4 w-full text-left space-y-2">
                    <p className="text-sm font-bold text-emerald-700">¿Qué sigue?</p>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Recibirás tu cotización detallada por WhatsApp</li>
                      <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Puedes ajustar servicios y fechas con tu asesor</li>
                      <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Confirma y paga de forma segura</li>
                    </ul>
                  </div>

                  <a
                    href={`https://wa.me/573206620695?text=${encodeURIComponent(`Hola GuanaGO! Acabo de cotizar mi viaje a San Andrés. Mi número: ${telefono}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#1da851] transition-colors w-full justify-center"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.04.514 3.963 1.415 5.642L0 24l6.545-1.386A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.36-.214-3.727.979.995-3.633-.234-.374A9.818 9.818 0 1112 21.818z"/>
                    </svg>
                    Escribir por WhatsApp
                  </a>

                  <div className="flex items-center gap-3 w-full">
                    {onNavigate && (
                      <button
                        onClick={() => { close(); onNavigate(AppRoute.MIS_COTIZACIONES, { telefono }); }}
                        className="flex-1 text-sm text-emerald-600 font-semibold border-2 border-emerald-200 py-2.5 rounded-full hover:bg-emerald-50 transition-colors"
                      >
                        Ver mis cotizaciones
                      </button>
                    )}
                    <button
                      onClick={() => { reset(); close(); }}
                      className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2.5"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer nav */}
          {step !== 'done' && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-3 max-w-lg mx-auto">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={16} />
                  {step === 'dates' ? 'Cancelar' : 'Atrás'}
                </button>
                <div className="flex-1" />
                {step === 'summary' ? (
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                    ) : saveError ? (
                      <><RefreshCw size={16} /> Reintentar</>
                    ) : (
                      <><Send size={16} /> Solicitar cotización</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Bottom Sheet — Adicionales de alojamiento ── */}
          {sheetAloj && (
            <>
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                style={{ zIndex: 5 }}
                onClick={() => setSheetAloj(null)}
              />
              {/* Sheet panel */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-y-auto"
                style={{ zIndex: 6, maxHeight: '88%' }}
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Header del sheet */}
                <div className="px-4 pb-2 sticky top-0 bg-white pt-2">
                  <h2 className="text-lg font-black text-gray-800">{getOpaqueTitle(sheetAloj)}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sheetAloj.coleccion && (
                      <span
                        className="inline-block text-white text-[9px] font-black px-1.5 py-0.5 rounded mr-1"
                        style={{ background: COLECCION_COLORS[sheetAloj.coleccion] || '#999' }}
                      >
                        {sheetAloj.coleccion}
                      </span>
                    )}
                    desde {fmtCOP(getDesdePrecio(sheetAloj))}/noche · hasta {sheetAloj.capacidadMaxima || '?'} huéspedes
                  </p>
                </div>

                {/* Adicionales */}
                <div className="px-4 pt-2 pb-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Servicios adicionales</p>
                  {ADDONS_LIST.map(addon => {
                    const isOn = !!selectedAddons[addon.key];
                    const precio = addon.porPax ? addon.precio * pax : addon.precio;
                    return (
                      <button
                        key={addon.key}
                        onClick={() => setSelectedAddons(prev => ({ ...prev, [addon.key]: !prev[addon.key] }))}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 mb-2 transition-all text-left ${
                          isOn ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                          {addon.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{addon.nombre}</p>
                          <p className="text-[11px] text-gray-400">{addon.detalle}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-black text-gray-700">{fmtCOP(precio)}</p>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ml-auto mt-1 ${
                            isOn ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'
                          }`}>
                            {isOn && <Check size={11} className="text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Nota */}
                <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    📱 <strong>Tu WhatsApp es tu cuenta.</strong> Al solicitar la cotización, si ya cotizaste antes, esta queda bajo el mismo cliente. Un asesor la revisa y te envía el <strong>link de pago seguro</strong>.
                  </p>
                </div>

                {/* Spacer para el footer fijo */}
                <div className="h-24" />
              </div>

              {/* Footer fijo del sheet */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3"
                style={{ zIndex: 7 }}
              >
                <div>
                  <p className="text-[10px] text-gray-400">
                    {Math.round((getDesdePrecio(sheetAloj) + ADDONS_LIST.reduce((s, a) => s + (selectedAddons[a.key] ? (a.porPax ? a.precio * pax : a.precio) : 0), 0)) / 1000).toLocaleString('es-CO')} GuanaPoints
                  </p>
                  <p className="text-lg font-black text-gray-800">
                    {fmtCOP(getDesdePrecio(sheetAloj) + ADDONS_LIST.reduce((s, a) => s + (selectedAddons[a.key] ? (a.porPax ? a.precio * pax : a.precio) : 0), 0))}
                  </p>
                  <p className="text-[10px] text-gray-400">estimado 1ª noche + extras</p>
                </div>
                <button
                  onClick={() => {
                    toggleHotel(sheetAloj.id);
                    setSheetAloj(null);
                  }}
                  className="bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-emerald-600 active:scale-95 transition-all flex-shrink-0"
                >
                  {selectedHotels.has(sheetAloj.id) ? 'Quitar selección' : 'Agregar a mi viaje'}
                </button>
              </div>
            </>
          )}

        </div>
      )}
    </>
  );
});

CotizadorB2C.displayName = 'CotizadorB2C';

export default CotizadorB2C;
