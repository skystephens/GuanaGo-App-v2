/**
 * PublicQuotePage — Cotización pública para el cliente
 * Accesible sin auth via ?cot=RECORD_ID
 * Config via params: showTotal=0|1, showMap=0|1
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Users, Phone, Mail, MapPin, Anchor, Bed,
  Car, Package as PackageIcon, Loader2, AlertCircle, MessageCircle,
  CheckCircle2, DollarSign, FileText, ArrowLeft, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { getCotizacionById } from '../services/quotesService';
import { cachedApi } from '../services/cachedApi';
import { Cotizacion, CotizacionItem, QuoteDisplayConfig, Tour } from '../types';
import QuotationMapView, { MapAccommodation } from '../components/quotation/QuotationMapView';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCOP(n: number): string {
  if (!n || n <= 0) return 'A confirmar';
  return '$' + n.toLocaleString('es-CO') + ' COP';
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
    return dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return d; }
}

function fmtDateShort(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    const dt = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
    return dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  } catch { return d; }
}

function calcNights(ini: string, fin: string): number {
  if (!ini || !fin) return 0;
  return Math.max(0, Math.round((new Date(fin).getTime() - new Date(ini).getTime()) / 86400000));
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  hotel:    <Bed size={15} className="text-blue-500" />,
  tour:     <Anchor size={15} className="text-emerald-500" />,
  taxi:     <Car size={15} className="text-amber-500" />,
  transfer: <Car size={15} className="text-amber-500" />,
  package:  <PackageIcon size={15} className="text-purple-500" />,
};

const OPCION_COLORS: Record<string, string> = {
  A: 'bg-blue-50 border-blue-200 text-blue-700',
  B: 'bg-purple-50 border-purple-200 text-purple-700',
  C: 'bg-orange-50 border-orange-200 text-orange-700',
  D: 'bg-pink-50 border-pink-200 text-pink-700',
};
const OPCION_HEADER: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-purple-500',
  C: 'bg-orange-500',
  D: 'bg-pink-500',
};

// ─── Lightbox ────────────────────────────────────────────────────────────────

const Lightbox: React.FC<{ imgs: string[]; idx: number; onClose: () => void; onPrev: () => void; onNext: () => void }> = ({
  imgs, idx, onClose, onPrev, onNext,
}) => {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Imagen principal */}
      <img
        src={imgs[idx]}
        alt={`Foto ${idx + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg select-none"
        onClick={e => e.stopPropagation()}
      />

      {/* Contador */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full">
        {idx + 1} / {imgs.length}
      </div>

      {/* Cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <X size={18} />
      </button>

      {/* Prev */}
      {idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next */}
      {idx < imgs.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Miniaturas */}
      {imgs.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto px-2">
          {imgs.map((url, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); }}
              onClickCapture={e => { e.stopPropagation(); }}
              className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" onClick={e => { e.stopPropagation(); }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ItemRow ─────────────────────────────────────────────────────────────────

const ItemRow: React.FC<{ item: CotizacionItem; services: Tour[] }> = ({ item, services }) => {
  const [expanded,    setExpanded]    = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showMap,     setShowMap]     = useState(false);

  const svc = services.find(s => s.id === item.servicioId) as any;

  const isHotel = item.servicioTipo === 'hotel';
  const imgs: string[] = (svc?.images?.length > 0 ? svc.images
    : svc?.gallery?.length > 0 ? svc.gallery
    : svc?.image ? [svc.image] : []) as string[];
  const description: string = svc?.description || svc?.descripcion || '';
  const ubicacion: string   = svc?.ubicacion || '';
  const latLon: string      = svc?.latLon || '';
  const tipo: string        = svc?.tipoAlojamiento || (isHotel ? 'HOTEL' : item.servicioTipo);
  const capacidad: number   = svc?.capacidadMaxima || 0;

  const mapAcc: MapAccommodation[] = latLon
    ? [{ id: item.servicioId || item.id, title: item.servicioNombre, latLon }]
    : [];

  const hasMap = mapAcc.length > 0;

  if (isHotel) {
    const show4   = imgs.slice(0, 4);
    const hasMore = imgs.length > 4;

    return (
      <>
        <div className="border-b border-gray-100 last:border-0 pt-3 pb-4">

          {/* Galería 4 fotos — clickeables */}
          {show4.length > 0 && (
            <div className="grid grid-cols-4 gap-1 rounded-xl overflow-hidden mb-3 h-24">
              {show4.map((url, i) => (
                <button key={i} onClick={() => setLightboxIdx(i)} className="w-full h-full overflow-hidden">
                  <img src={url} alt={item.servicioNombre}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-zoom-in" />
                </button>
              ))}
              {show4.length < 4 && Array.from({ length: 4 - show4.length }).map((_, i) => (
                <div key={`ph-${i}`} className="w-full h-full bg-gray-100" />
              ))}
            </div>
          )}

          {/* Nombre + precio */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {TIPO_ICON['hotel']}
              <span className="text-sm font-bold text-gray-800 leading-tight truncate">{item.servicioNombre}</span>
            </div>
            {item.subtotal > 0 && (
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-emerald-600">{fmtCOP(item.subtotal)}</p>
                {item.valorUnitario > 0 && item.cantidad > 0 && (
                  <p className="text-[10px] text-gray-400 whitespace-nowrap">
                    {fmtCOP(item.valorUnitario)} × {item.personas > 1 ? `${item.personas} × ` : ''}{item.cantidad}u
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">{tipo}</span>
            {item.personas > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={11} /> {item.personas} {item.personas === 1 ? 'persona' : 'personas'}
              </span>
            )}
            {item.cantidad > 0 && (
              <span className="text-xs text-gray-500">× {item.cantidad} {item.cantidad === 1 ? 'noche' : 'noches'}</span>
            )}
            {capacidad > 0 && <span className="text-[10px] text-gray-400">· cap. {capacidad} pax</span>}
          </div>

          {/* Descripción */}
          {description && (
            <p className={`text-xs text-gray-500 mt-2 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {description}
            </p>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {(description || hasMore) && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-700"
              >
                {expanded ? 'Ver menos ▲' : 'Ver más info e imágenes ▼'}
              </button>
            )}
            {hasMap ? (
              <button
                onClick={() => setShowMap(true)}
                className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:text-blue-600"
              >
                <MapPin size={11} />
                {ubicacion ? `Ver en mapa · ${ubicacion}` : 'Ver en mapa'}
              </button>
            ) : ubicacion ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} /> {ubicacion}
              </span>
            ) : null}
          </div>

          {/* Galería extra expandida */}
          {expanded && hasMore && (
            <div className="grid grid-cols-3 gap-1 mt-2 rounded-xl overflow-hidden">
              {imgs.slice(4).map((url, i) => (
                <button key={i} onClick={() => setLightboxIdx(i + 4)} className="w-full overflow-hidden">
                  <img src={url} alt={`${item.servicioNombre} foto ${i + 5}`}
                    className="w-full h-24 object-cover hover:scale-105 transition-transform duration-200 cursor-zoom-in" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxIdx !== null && imgs.length > 0 && (
          <Lightbox
            imgs={imgs}
            idx={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onPrev={() => setLightboxIdx(i => Math.max(0, (i ?? 0) - 1))}
            onNext={() => setLightboxIdx(i => Math.min(imgs.length - 1, (i ?? 0) + 1))}
          />
        )}

        {/* Mapa Mapbox */}
        {showMap && mapAcc.length > 0 && (
          <QuotationMapView accommodations={mapAcc} onClose={() => setShowMap(false)} />
        )}
      </>
    );
  }

  // ── Servicio no-hotel: fila simple ────────────────────────────────────────
  const img = imgs[0] || '';
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {img ? (
        <img src={img} alt={item.servicioNombre} className="w-14 h-14 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          {TIPO_ICON[item.servicioTipo] || <FileText size={15} className="text-gray-400" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-tight">{item.servicioNombre}</p>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{item.servicioTipo}</p>
        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
          {item.personas > 0 && <span>{item.personas} {item.personas === 1 ? 'persona' : 'personas'}</span>}
          {item.cantidad > 1 && <span>× {item.cantidad}</span>}
        </div>
      </div>
      {item.subtotal > 0 && (
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-emerald-600">{fmtCOP(item.subtotal)}</p>
          {item.valorUnitario > 0 && item.personas > 0 && (
            <p className="text-[10px] text-gray-400">{fmtCOP(item.valorUnitario)}/u</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  cotId: string;
  config: QuoteDisplayConfig;
  onBack?: () => void;
}

const PublicQuotePage: React.FC<Props> = ({ cotId, config, onBack }) => {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [items, setItems]           = useState<CotizacionItem[]>([]);
  const [services, setServices]     = useState<Tour[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cot, svcs, alojs] = await Promise.all([
          getCotizacionById(cotId),
          cachedApi.getServices(),
          cachedApi.getAlojamientos(),
        ]);
        if (!cot) throw new Error('Cotización no encontrada');
        setCotizacion(cot);
        setItems(cot.items || []);
        setServices([...(svcs || []), ...(alojs || [])]);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar la cotización');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cotId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="text-emerald-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Cargando tu cotización...</p>
      </div>
    </div>
  );

  if (error || !cotizacion) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <h2 className="font-bold text-gray-700 mb-2">No encontramos esta cotización</h2>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    </div>
  );

  const nights       = calcNights(cotizacion.fechaInicio, cotizacion.fechaFin);
  const totalPax     = cotizacion.adultos + cotizacion.ninos + cotizacion.bebes;

  // Separar ítems: incluidos (sin opcion o opcion='Incluido') vs alternativas (A/B/C/D)
  const itemsIncluidos   = items.filter(i => !i.opcion || i.opcion === 'Incluido');
  const opciones         = ['A', 'B', 'C', 'D'].filter(op => items.some(i => i.opcion === op));
  const totalIncluidos   = itemsIncluidos.reduce((s, i) => s + (i.subtotal || 0), 0);
  const descuento        = cotizacion.descuento || 0;
  const totalFinal       = Math.max(0, totalIncluidos - descuento);

  // Items en el mapa: solo los que tienen servicioId y tienen ubicación
  const hasMapItems = itemsIncluidos.length + opciones.length > 0;

  const whatsappMsg = encodeURIComponent(
    `Hola GuanaGO! Vi mi cotización para San Andrés (${fmtDateShort(cotizacion.fechaInicio)} → ${fmtDateShort(cotizacion.fechaFin)}) y tengo una pregunta.`
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-gray-50">

      {/* Header brand */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-5 pb-8">
        <div className="max-w-2xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-emerald-100 hover:text-white text-sm mb-3 transition-colors"
            >
              <ArrowLeft size={15} /> Mis Cotizaciones
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black tracking-tight">GuanaGO</span>
            <span className="text-emerald-200 text-sm">· San Andrés Islas</span>
          </div>
          <h1 className="text-xl font-bold mt-2">Tu cotización de viaje</h1>
          <p className="text-emerald-100 text-sm mt-0.5">
            Válida para {totalPax} {totalPax === 1 ? 'persona' : 'personas'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-24 space-y-4">

        {/* Card info viaje */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Calendar size={13} className="text-emerald-500" /> Tu viaje
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Calendar size={15} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {fmtDateShort(cotizacion.fechaInicio)} → {fmtDateShort(cotizacion.fechaFin)}
                  {nights > 0 && <span className="text-gray-400 font-normal"> · {nights} {nights === 1 ? 'noche' : 'noches'}</span>}
                </p>
                <p className="text-xs text-gray-400">{fmtDate(cotizacion.fechaInicio)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users size={15} className="text-blue-500" />
              </div>
              <p className="text-sm text-gray-700">
                {cotizacion.adultos} adulto{cotizacion.adultos !== 1 ? 's' : ''}
                {cotizacion.ninos > 0 && ` · ${cotizacion.ninos} niño${cotizacion.ninos !== 1 ? 's' : ''}`}
                {cotizacion.bebes > 0 && ` · ${cotizacion.bebes} bebé${cotizacion.bebes !== 1 ? 's' : ''}`}
              </p>
            </div>
            {cotizacion.nombre && cotizacion.nombre !== 'Cliente Web' && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Phone size={15} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-700">{cotizacion.nombre}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ítems incluidos */}
        {itemsIncluidos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-1">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                {opciones.length > 0 ? 'Servicios incluidos en todas las opciones' : 'Servicios incluidos'}
              </h2>
            </div>
            <div className="px-5">
              {itemsIncluidos.map(item => (
                <ItemRow key={item.id} item={item} services={services} />
              ))}
            </div>
          </div>
        )}

        {/* Secciones de alternativas */}
        {opciones.map(op => {
          const opItems  = items.filter(i => i.opcion === op);
          const opTotal  = opItems.reduce((s, i) => s + (i.subtotal || 0), 0);
          return (
            <div key={op} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 ${OPCION_COLORS[op]}`}>
              <div className={`px-5 py-3 flex items-center justify-between ${OPCION_HEADER[op]}`}>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Opción {op}
                </h2>
                {opTotal > 0 && config.showTotal && (
                  <span className="text-white font-bold text-sm">{fmtCOP(opTotal)}</span>
                )}
              </div>
              <div className="px-5">
                {opItems.map(item => (
                  <ItemRow key={item.id} item={item} services={services} />
                ))}
              </div>
              {opTotal > 0 && config.showTotal && (
                <div className="mx-5 mb-4 mt-2 bg-white rounded-xl border border-current p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Subtotal Opción {op}
                    {itemsIncluidos.length > 0 ? ' (+ servicios incluidos)' : ''}
                  </span>
                  <span className="font-bold text-sm">{fmtCOP(opTotal + totalIncluidos)}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Resumen financiero */}
        {config.showTotal && (itemsIncluidos.length > 0 || opciones.length === 0) && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} />
              <span className="text-sm font-medium text-emerald-100">
                {opciones.length > 0 ? 'Servicios incluidos (base)' : 'Total estimado'}
              </span>
            </div>
            <p className="text-3xl font-black mb-1">{fmtCOP(totalFinal)}</p>
            <p className="text-xs text-emerald-100">
              {totalPax} {totalPax === 1 ? 'persona' : 'personas'}
              {nights > 0 && ` · ${nights} ${nights === 1 ? 'noche' : 'noches'}`}
              {' · '}Sujeto a disponibilidad
            </p>
            {descuento > 0 && (
              <p className="text-xs text-emerald-200 mt-1">Descuento aplicado: {fmtCOP(descuento)}</p>
            )}
            {opciones.length > 0 && (
              <p className="text-xs text-emerald-100 mt-2 border-t border-emerald-400 pt-2">
                + Elige una opción de alojamiento de las secciones anteriores
              </p>
            )}
          </div>
        )}

        {/* Mapa */}
        {config.showMap && hasMapItems && (
          <a
            href={`https://maps.google.com/?q=San+Andrés+Isla,+Colombia`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MapPin size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Ver ubicaciones en el mapa</p>
              <p className="text-xs text-gray-400">San Andrés Isla, Colombia</p>
            </div>
          </a>
        )}

        {/* Sin servicios */}
        {items.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-amber-700 font-medium">Tu cotización está siendo preparada</p>
            <p className="text-xs text-amber-500 mt-1">Un asesor te contactará pronto con los detalles.</p>
          </div>
        )}

        {/* CTA WhatsApp */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-1">¿Tienes preguntas?</h3>
          <p className="text-xs text-gray-400 mb-3">Nuestro equipo en San Andrés está listo para ayudarte.</p>
          <a
            href={`https://wa.me/573206620695?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#1da851] transition-colors"
          >
            <MessageCircle size={16} />
            Chatear por WhatsApp
          </a>
          {cotizacion.email && (
            <a
              href={`mailto:info@guanago.travel?subject=Consulta cotización&body=Hola, tengo preguntas sobre mi cotización.`}
              className="flex items-center justify-center gap-2 w-full mt-2 bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Mail size={14} />
              Escribir por email
            </a>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          GuanaGO · Especialistas en turismo · San Andrés Islas, Colombia
        </p>
      </div>
    </div>
  );
};

export default PublicQuotePage;
