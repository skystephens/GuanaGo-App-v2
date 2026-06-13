/**
 * CotizadorB2C — Wizard público de cotización para clientes B2C
 * Botón flotante → modal paso a paso → guarda Lead + CotizacionesGG en Airtable
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  MessageSquare, X, ChevronRight, ChevronLeft,
  Plus, Minus, Check, Phone, User, Mail, FileText,
  Anchor, Bed, Loader2, Send, Calendar, Users,
  Car, Package as PackageIcon, MapPin, CheckCircle2,
} from 'lucide-react';
import { cachedApi } from '../services/cachedApi';
import { createLead } from '../services/airtableService';
import { createCotizacion, addCotizacionItem } from '../services/quotesService';
import { getPrecioB2C } from '../services/pricing';
import { Tour, AppRoute } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'contact' | 'dates' | 'tours' | 'hotels' | 'summary' | 'done';
const STEPS: Step[] = ['contact', 'dates', 'tours', 'hotels', 'summary', 'done'];

const STEP_LABELS: Record<Step, string> = {
  contact: 'Tus datos',
  dates: 'Fechas',
  tours: 'Actividades',
  hotels: 'Alojamiento',
  summary: 'Resumen',
  done: 'Listo',
};

interface SelectedItem {
  service: Tour | any;
}

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

function getServiceImage(svc: any): string {
  return svc.image || svc.imageUrl || svc.foto || '';
}

function getServiceName(svc: any): string {
  return svc.title || svc.nombre || svc.name || '';
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'tour': return <Anchor size={14} />;
    case 'hotel': return <Bed size={14} />;
    case 'taxi': return <Car size={14} />;
    case 'package': return <PackageIcon size={14} />;
    default: return <MapPin size={14} />;
  }
}

// ─── Counter sub-component ────────────────────────────────────────────────────

const Counter: React.FC<{
  label: string; value: number; min?: number; max?: number;
  onChange: (v: number) => void;
}> = ({ label, value, min = 0, max = 30, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-600 flex items-center justify-center hover:bg-emerald-50 transition-colors disabled:opacity-30"
        disabled={value <= min}
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center font-bold text-gray-800">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-30"
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
  const price = getServicePrice(svc);
  const total = price > 0 ? price * (priceLabel === 'noche' ? nights : pax) : 0;
  const image = getServiceImage(svc);
  const name = getServiceName(svc);

  return (
    <div
      onClick={onToggle}
      className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200 active:scale-95 ${
        selected
          ? 'border-emerald-500 shadow-lg shadow-emerald-100'
          : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover transition-all duration-300 ${selected ? 'scale-105' : ''}`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
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
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
            Raizal
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{name}</h4>
        {svc.duration && (
          <p className="text-xs text-gray-500 mt-0.5">{svc.duration}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {price > 0 ? (
            <div>
              <p className="text-xs text-gray-400">desde</p>
              <p className="text-sm font-bold text-emerald-600">{fmtCOP(price)}</p>
              <p className="text-xs text-gray-400">/ {priceLabel || 'persona'}</p>
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-medium">Consultar precio</p>
          )}
          {total > 0 && selected && (
            <div className="text-right">
              <p className="text-xs text-gray-400">total</p>
              <p className="text-sm font-bold text-emerald-700">{fmtCOP(total)}</p>
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
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('contact');
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [services, setServices] = useState<Tour[]>([]);
  const [alojamientos, setAlojamientos] = useState<any[]>([]);
  const catalogLoadedRef = useRef(false);

  // Form state
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [requerimiento, setRequerimiento] = useState<string[]>([]);

  // Dates + pax
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos] = useState(0);
  const [bebes, setBebes] = useState(0);

  // Selections
  const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set());
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
      setAlojamientos(
        (alojs || [])
          .filter((a: any) => a.active !== false)
          .slice(0, 20)
      );
      catalogLoadedRef.current = true;
    } catch (err) {
      console.error('Error cargando catálogo cotizador:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const open = () => {
    setIsOpen(true);
    setStep('contact');
    loadCatalog();
  };

  // Permite que cualquier parte de la app abra el cotizador via evento
  React.useEffect(() => {
    const handler = () => open();
    window.addEventListener('guanago:open-cotizador', handler);
    return () => window.removeEventListener('guanago:open-cotizador', handler);
  }, []);

  const close = () => setIsOpen(false);

  const reset = () => {
    setStep('contact');
    setTelefono('');
    setNombre('');
    setEmail('');
    setNotas('');
    setRequerimiento([]);
    setFechaInicio('');
    setFechaFin('');
    setAdultos(2);
    setNinos(0);
    setBebes(0);
    setSelectedTours(new Set());
    setSelectedHotels(new Set());
  };

  const stepIndex = STEPS.indexOf(step);
  const totalVisibleSteps = 5; // contact, dates, tours, hotels, summary

  const canProceed = () => {
    if (step === 'contact') return telefono.trim().length >= 7;
    if (step === 'dates') return !!fechaInicio && !!fechaFin && new Date(fechaFin) > new Date(fechaInicio);
    return true;
  };

  const goNext = () => {
    const nextIdx = stepIndex + 1;
    if (STEPS[nextIdx]) setStep(STEPS[nextIdx]);
  };

  const goBack = () => {
    if (step === 'contact') { close(); return; }
    const prevIdx = stepIndex - 1;
    if (STEPS[prevIdx]) setStep(STEPS[prevIdx]);
  };

  const toggleTour = (id: string) => {
    setSelectedTours(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleHotel = (id: string) => {
    setSelectedHotels(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleReq = (r: string) => {
    setRequerimiento(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const pax = adultos + ninos;
  const nights = calcNights(fechaInicio, fechaFin);

  const calcTotal = () => {
    let total = 0;
    services.filter(s => selectedTours.has(s.id)).forEach(s => {
      const p = getServicePrice(s);
      if (p > 0) total += p * pax;
    });
    alojamientos.filter(a => selectedHotels.has(a.id)).forEach(a => {
      const p = getServicePrice(a);
      if (p > 0) total += p * nights;
    });
    return total;
  };

  const submit = async () => {
    setLoading(true);
    try {
      // 1. Create lead
      const req = requerimiento.length > 0 ? requerimiento.join(', ') : '';
      const msg = [
        req && `Interés: ${req}`,
        notas && `Notas: ${notas}`,
        `Fechas: ${fechaInicio || '?'} → ${fechaFin || '?'}`,
        `Pax: ${adultos} adultos, ${ninos} niños, ${bebes} bebés`,
      ].filter(Boolean).join(' | ');

      await createLead({
        nombre: nombre || 'Cliente Web',
        email: email || '',
        telefono,
        mensaje: msg,
        origen: 'Cotizador B2C GuanaGO',
      });

      // 2. Create cotización header
      const cotizacion = await createCotizacion({
        nombre: nombre || 'Cliente Web',
        email: email || '',
        telefono,
        fechaInicio: fechaInicio || new Date().toISOString().split('T')[0],
        fechaFin: fechaFin || new Date().toISOString().split('T')[0],
        adultos,
        ninos,
        bebes,
        fechaCreacion: new Date().toISOString(),
        estado: 'draft',
        precioTotal: calcTotal(),
        notasInternas: notas || req || '',
      });

      // 3. Add tour items
      if (cotizacion) {
        const tourItems = services
          .filter(s => selectedTours.has(s.id))
          .map(s => {
            const price = getServicePrice(s);
            return addCotizacionItem({
              cotizacionId: cotizacion.id,
              servicioId: s.id,
              servicioNombre: getServiceName(s),
              servicioTipo: 'tour',
              fecha: fechaInicio,
              adultos,
              ninos,
              bebes,
              valorUnitario: price,
              personas: pax,
              cantidad: 1,
              precioUnitario: price,
              subtotal: price * pax,
              esPersonalizado: false,
              status: 'disponible',
            });
          });

        const hotelItems = alojamientos
          .filter(a => selectedHotels.has(a.id))
          .map(a => {
            const price = getServicePrice(a);
            return addCotizacionItem({
              cotizacionId: cotizacion.id,
              servicioId: a.id,
              servicioNombre: getServiceName(a),
              servicioTipo: 'hotel',
              fecha: fechaInicio,
              fechaFin,
              adultos,
              ninos,
              bebes,
              valorUnitario: price,
              personas: 1,
              cantidad: nights,
              precioUnitario: price,
              subtotal: price * nights,
              esPersonalizado: false,
              status: 'disponible',
            });
          });

        await Promise.allSettled([...tourItems, ...hotelItems]);
      }

      setStep('done');
    } catch (err) {
      console.error('Error enviando cotización B2C:', err);
      // Still show success to avoid confusing the user
      setStep('done');
    } finally {
      setLoading(false);
    }
  };

  const total = calcTotal();
  const toursSeleccionados = services.filter(s => selectedTours.has(s.id));
  const hotelesSeleccionados = alojamientos.filter(a => selectedHotels.has(a.id));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Button */}
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

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 pt-safe-top">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">Cotiza tu viaje</h2>
                  <p className="text-xs text-emerald-100">San Andrés Islas · GuanaGO</p>
                </div>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar — only show for non-done steps */}
            {step !== 'done' && (
              <div className="pb-4">
                <div className="flex items-center gap-1 mb-2">
                  {STEPS.slice(0, totalVisibleSteps).map((s, i) => (
                    <div
                      key={s}
                      className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        i <= stepIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-emerald-100">
                  Paso {Math.min(stepIndex + 1, totalVisibleSteps)} de {totalVisibleSteps} — {STEP_LABELS[step]}
                </p>
              </div>
            )}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 max-w-lg mx-auto">

              {/* STEP: contact */}
              {step === 'contact' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Cómo te contactamos?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Solo necesitamos tu teléfono para enviarte la cotización por WhatsApp.
                    </p>
                  </div>

                  {/* Phone — required */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Teléfono / WhatsApp <span className="text-emerald-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        placeholder="+57 300 123 4567"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Name — optional */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nombre <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email — optional */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Quick chips — what do you need? */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ¿Qué necesitas? <span className="text-gray-400 font-normal">(puedes elegir varios)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Tours', 'Alojamiento', 'Paquete completo', 'Traslado desde aeropuerto', 'Tour privado'].map(r => (
                        <button
                          key={r}
                          onClick={() => toggleReq(r)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
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

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      ¿Algo más que debamos saber? <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3 top-3.5 text-gray-400" />
                      <textarea
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        placeholder="Ej: Viajamos con niños, necesitamos silla de ruedas, celebramos aniversario..."
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: dates */}
              {step === 'dates' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Cuándo nos visitas?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Selecciona tus fechas de viaje y cuántas personas son.
                    </p>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        <Calendar size={14} className="inline mr-1" />
                        Fecha de llegada
                      </label>
                      <input
                        type="date"
                        value={fechaInicio}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setFechaInicio(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        <Calendar size={14} className="inline mr-1" />
                        Fecha de salida
                      </label>
                      <input
                        type="date"
                        value={fechaFin}
                        min={fechaInicio || new Date().toISOString().split('T')[0]}
                        onChange={e => setFechaFin(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:outline-none bg-white"
                      />
                    </div>
                    {fechaInicio && fechaFin && new Date(fechaFin) > new Date(fechaInicio) && (
                      <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-sm font-medium">
                        <Check size={14} />
                        {nights} {nights === 1 ? 'noche' : 'noches'} en San Andrés
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={16} className="text-emerald-500" />
                      <h4 className="text-sm font-bold text-gray-700">Pasajeros</h4>
                    </div>
                    <Counter label="Adultos (18+ años)" value={adultos} min={1} onChange={setAdultos} />
                    <Counter label="Niños (4-17 años)" value={ninos} min={0} onChange={setNinos} />
                    <Counter label="Bebés (0-3 años)" value={bebes} min={0} onChange={setBebes} />
                    <p className="text-xs text-gray-400 mt-3">
                      Total: {adultos + ninos + bebes} {adultos + ninos + bebes === 1 ? 'persona' : 'personas'}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP: tours */}
              {step === 'tours' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Qué actividades te interesan?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Elige los tours y actividades que quieras incluir — puedes seleccionar varios.
                    </p>
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
                      <span className="ml-3 text-gray-500 text-sm">Cargando catálogo...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {services.map(svc => (
                        <ServiceCard
                          key={svc.id}
                          svc={svc}
                          selected={selectedTours.has(svc.id)}
                          pax={pax}
                          onToggle={() => toggleTour(svc.id)}
                        />
                      ))}
                      {services.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-400">
                          <Anchor size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No hay actividades disponibles por ahora</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={goNext}
                    className="w-full text-center text-sm text-gray-400 py-2 hover:text-emerald-500 transition-colors"
                  >
                    Saltar este paso →
                  </button>
                </div>
              )}

              {/* STEP: hotels */}
              {step === 'hotels' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">¿Dónde te quedas?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Explora nuestro catálogo de alojamientos. Precios por noche.
                    </p>
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
                      <span className="ml-3 text-gray-500 text-sm">Cargando alojamientos...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {alojamientos.map((aloj: any) => (
                        <ServiceCard
                          key={aloj.id}
                          svc={aloj}
                          selected={selectedHotels.has(aloj.id)}
                          pax={pax}
                          nights={nights}
                          onToggle={() => toggleHotel(aloj.id)}
                          priceLabel="noche"
                        />
                      ))}
                      {alojamientos.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-400">
                          <Bed size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No hay alojamientos disponibles por ahora</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={goNext}
                    className="w-full text-center text-sm text-gray-400 py-2 hover:text-emerald-500 transition-colors"
                  >
                    Saltar este paso →
                  </button>
                </div>
              )}

              {/* STEP: summary */}
              {step === 'summary' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Resumen de tu viaje</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Revisa tu cotización antes de enviarla.
                    </p>
                  </div>

                  {/* Client info */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <User size={14} className="text-emerald-500" />
                      Tus datos
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={13} className="text-gray-400" />
                      {telefono}
                    </div>
                    {nombre && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={13} className="text-gray-400" />
                        {nombre}
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={13} className="text-gray-400" />
                        {email}
                      </div>
                    )}
                    {requerimiento.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {requerimiento.map(r => (
                          <span key={r} className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trip info */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-500" />
                      Viaje
                    </h4>
                    {fechaInicio && (
                      <div className="text-sm text-gray-600">
                        📅 {new Date(fechaInicio + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                        {' → '}
                        {new Date(fechaFin + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      👥 {adultos} adulto{adultos !== 1 ? 's' : ''}{ninos > 0 ? `, ${ninos} niño${ninos !== 1 ? 's' : ''}` : ''}{bebes > 0 ? `, ${bebes} bebé${bebes !== 1 ? 's' : ''}` : ''}
                    </div>
                    {nights > 0 && fechaInicio && fechaFin && (
                      <div className="text-sm text-gray-600">🌙 {nights} {nights === 1 ? 'noche' : 'noches'}</div>
                    )}
                  </div>

                  {/* Tours */}
                  {toursSeleccionados.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Anchor size={14} className="text-emerald-500" />
                        Actividades ({toursSeleccionados.length})
                      </h4>
                      <div className="space-y-2">
                        {toursSeleccionados.map(s => {
                          const p = getServicePrice(s);
                          return (
                            <div key={s.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 flex-1 pr-2">{getServiceName(s)}</span>
                              <span className="text-emerald-600 font-semibold whitespace-nowrap">
                                {p > 0 ? fmtCOP(p * pax) : 'A consultar'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hotels */}
                  {hotelesSeleccionados.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Bed size={14} className="text-emerald-500" />
                        Alojamiento ({hotelesSeleccionados.length})
                      </h4>
                      <div className="space-y-2">
                        {hotelesSeleccionados.map(a => {
                          const p = getServicePrice(a);
                          return (
                            <div key={a.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 flex-1 pr-2">{getServiceName(a)}</span>
                              <span className="text-emerald-600 font-semibold whitespace-nowrap">
                                {p > 0 ? fmtCOP(p * nights) : 'A consultar'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {toursSeleccionados.length === 0 && hotelesSeleccionados.length === 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
                      No seleccionaste servicios — un asesor te contactará para ayudarte a armar tu paquete personalizado.
                    </div>
                  )}

                  {/* Total */}
                  {total > 0 && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-xs font-medium">Estimado total</p>
                          <p className="text-2xl font-black">{fmtCOP(total)}</p>
                          <p className="text-emerald-100 text-xs mt-0.5">
                            {pax} personas · {nights} noches · tarifa B2C
                          </p>
                        </div>
                        <div className="text-4xl opacity-20">🏝️</div>
                      </div>
                      <p className="text-xs text-emerald-100 mt-3">
                        * Precio estimado. Un asesor confirmará disponibilidad y precio final.
                      </p>
                    </div>
                  )}

                  {notas && (
                    <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
                      <FileText size={13} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <span className="italic">&ldquo;{notas}&rdquo;</span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: done */}
              {step === 'done' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">¡Solicitud enviada!</h3>
                    <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                      Recibimos tu cotización. Un asesor de GuanaGO te escribirá por WhatsApp a{' '}
                      <span className="font-bold text-emerald-600">{telefono}</span>{' '}
                      en las próximas horas con tu propuesta personalizada.
                    </p>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-4 w-full text-left space-y-2">
                    <p className="text-sm font-bold text-emerald-700">¿Qué sigue?</p>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Recibirás tu cotización detallada por WhatsApp</li>
                      <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Podrás ajustar servicios y fechas con tu asesor</li>
                      <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Confirma y paga de forma segura</li>
                    </ul>
                  </div>

                  <a
                    href={`https://wa.me/573001234567?text=${encodeURIComponent(`Hola! Acabo de cotizar mi viaje a San Andrés en GuanaGO. Mi número: ${telefono}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#1da851] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.04.514 3.963 1.415 5.642L0 24l6.545-1.386A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.36-.214-3.727.979.995-3.633-.234-.374A9.818 9.818 0 1112 21.818z"/>
                    </svg>
                    Escribir por WhatsApp
                  </a>

                  <div className="flex gap-3 w-full">
                    {onNavigate && (
                      <button
                        onClick={() => {
                          close();
                          onNavigate(AppRoute.MIS_COTIZACIONES, { telefono });
                        }}
                        className="flex-1 text-sm text-emerald-600 font-semibold border-2 border-emerald-200 py-2.5 rounded-full hover:bg-emerald-50 transition-colors"
                      >
                        Ver mis cotizaciones
                      </button>
                    )}
                    <button
                      onClick={() => { reset(); close(); }}
                      className="text-sm text-gray-400 hover:text-emerald-500 transition-colors px-4"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Footer navigation ── */}
          {step !== 'done' && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 safe-area-bottom">
              <div className="flex items-center gap-3 max-w-lg mx-auto">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={16} />
                  {step === 'contact' ? 'Cancelar' : 'Atrás'}
                </button>

                <div className="flex-1" />

                {step === 'summary' ? (
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Solicitar cotización
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Siguiente
                    <ChevronRight size={16} />
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
