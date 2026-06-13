/**
 * CotizadorB2C — Wizard público de cotización para clientes B2C
 * Botón flotante → modal paso a paso → guarda Lead + CotizacionesGG en Airtable
 *
 * ORDEN DE PASOS: Fechas+Pax → Datos → Actividades → Alojamiento → Resumen
 */

import React, { useState, useCallback, useRef } from 'react';
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
  if (totalPax >= 6 && svc.precio6hues > 0) return svc.precio6hues;
  if (totalPax >= 5 && svc.precio5hues > 0) return svc.precio5hues;
  if (totalPax >= 4 && svc.precio4hues > 0) return svc.precio4hues;
  if (totalPax === 3 && svc.precio3hues > 0) return svc.precio3hues;
  if (totalPax <= 2 && svc.precio2hues > 0) return svc.precio2hues;
  return getServicePrice(svc);
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

const CotizadorB2C: React.FC<CotizadorB2CProps> = ({ onNavigate }) => {
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
      setAlojamientos((alojs || []).filter((a: any) => a.active !== false).slice(0, 20));
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

  const close = () => setIsOpen(false);

  const reset = () => {
    setStep('dates');
    setTelefono(''); setNombre(''); setEmail(''); setNotas('');
    setRequerimiento([]);
    setFechaInicio(''); setFechaFin('');
    setAdultos(2); setNinos(0); setBebes(0);
    setSelectedTours(new Set()); setSelectedHotels(new Set());
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
      const p = getHotelPriceByPax(a, pax);
      if (p > 0) total += p * nights;
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
      const notasB2C = `[B2C Web] ${[req, notas].filter(Boolean).join(' | ')}`.trim();

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
          const price = getServicePrice(a);
          return addCotizacionItem({
            cotizacionId:   cotizacion.id,
            servicioId:     a.id,
            servicioNombre: getServiceName(a),
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

              {/* ── STEP: hotels ── */}
              {step === 'hotels' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Dónde te quedas?</h3>
                    <p className="text-sm text-gray-500 mt-1">Precios por noche · {nights} {nights === 1 ? 'noche' : 'noches'} para {pax} personas.</p>
                  </div>

                  {selectedHotels.size > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-sm text-emerald-700 font-medium">
                      <Check size={14} />
                      {selectedHotels.size} {selectedHotels.size === 1 ? 'alojamiento seleccionado' : 'alojamientos seleccionados'}
                    </div>
                  )}

                  {catalogLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={24} className="text-emerald-500 animate-spin" />
                      <span className="ml-3 text-gray-400 text-sm">Cargando alojamientos...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {alojamientos.map((aloj: any) => (
                        <ServiceCard
                          key={aloj.id} svc={aloj}
                          selected={selectedHotels.has(aloj.id)} pax={pax} nights={nights}
                          onToggle={() => toggleHotel(aloj.id)} priceLabel="noche"
                        />
                      ))}
                      {alojamientos.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-400">
                          <Bed size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Sin alojamientos disponibles</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={goNext} className="w-full text-center text-sm text-gray-400 py-2 hover:text-emerald-500 transition-colors">
                    Saltar este paso →
                  </button>
                </div>
              )}

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
                      {hotelesSeleccionados.map(a => {
                        const p = getHotelPriceByPax(a, pax);
                        const capMax = a.capacidadMaxima || 0;
                        return (
                          <div key={a.id} className="py-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700 flex-1 pr-2 text-xs font-medium">{getServiceName(a)}</span>
                              <span className="text-emerald-600 font-semibold text-xs whitespace-nowrap">
                                {p > 0 ? fmtCOP(p * nights) : 'A consultar'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {a.tipoAlojamiento && (
                                <span className="text-[10px] text-gray-400">{a.tipoAlojamiento}</span>
                              )}
                              {capMax > 0 && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${pax > capMax ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                  <Users size={9} /> hasta {capMax} pers.
                                  {pax > capMax && ' ⚠️'}
                                </span>
                              )}
                              {p > 0 && nights > 0 && (
                                <span className="text-[10px] text-gray-400">{fmtCOP(p)}/noche</span>
                              )}
                            </div>
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
                      <p className="text-emerald-100 text-xs font-medium">Estimado total</p>
                      <p className="text-2xl font-black">{fmtCOP(total)}</p>
                      <p className="text-emerald-100 text-xs mt-0.5">
                        {pax} personas · {nights} noches · tarifa B2C · sujeto a disponibilidad
                      </p>
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

        </div>
      )}
    </>
  );
};

export default CotizadorB2C;
