/**
 * TourPrivado — Planificador de tour privado B2C
 * Flujo de 4 pasos para grupos de viajeros que quieren diseñar
 * su estadía en San Andrés con un anfitrión local.
 *
 * Paso 0: Configurar grupo (fechas, personas)
 * Paso 1: Elegir alojamiento (tipo → propiedad → habitación con croquis)
 * Paso 2: Añadir actividades y tours
 * Paso 3: Resumen + propuesta de precio + contactar anfitrión vía WhatsApp
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Users, Calendar, Home, MapPin,
  Star, Plus, Minus, Check, Phone, MessageCircle, ChevronRight,
  X, Bed, Activity, FileText, Sparkles, Building2, TreePalm,
  Hotel, DoorOpen,
} from 'lucide-react';
import BedVisualizer, { BedType } from '../components/grupo/BedVisualizer';
import { getAccommodations, getTours, calculateAccommodationPrice, calculateTourPrice } from '../services/airtableService';
import { AppRoute } from '../types';

// ─── Configuración ────────────────────────────────────────────────────────────

/** Número de WhatsApp del anfitrión/host (configurable) */
const HOST_WHATSAPP = '573219999999';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface GroupConfig {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  babies: number;
  groupName: string;
}

interface RoomOption {
  id: string;
  name: string;
  bedType: BedType;
  capacity: number;
  pricePerNight: number;
  description?: string;
}

interface SelectedAccommodation {
  acc: any;
  room: RoomOption;
  nights: number;
  subtotal: number;
}

// ─── Tipos de alojamiento ─────────────────────────────────────────────────────

interface AccTypeConfig {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  roomCount: string;
  /** Valores que pueden aparecer en el campo accommodationType de Airtable */
  airtableValues: string[];
  gradient: string;
  bgLight: string;
  border: string;
  text: string;
}

const ACCOMMODATION_TYPES: AccTypeConfig[] = [
  {
    id: 'hotel',
    label: 'Hotel',
    subtitle: '+40 habitaciones',
    description: 'Recepción 24h · Piscina · Servicios completos',
    icon: <Hotel size={22} />,
    roomCount: '+40 hab.',
    airtableValues: ['Hotel'],
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
  },
  {
    id: 'apartahotel',
    label: 'Aparta Hotel',
    subtitle: '3-10 apartamentos',
    description: 'Cocina equipada · Ambiente íntimo · Más privacidad',
    icon: <Building2 size={22} />,
    roomCount: '3-10 apart.',
    airtableValues: ['Aparta Hotel', 'Apartamentos'],
    gradient: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-700',
  },
  {
    id: 'airbnb',
    label: 'Airbnb / Casa Vacacional',
    subtitle: 'Casa completa',
    description: 'Total privacidad · Ambiente hogareño · Cocina y jardín',
    icon: <Home size={22} />,
    roomCount: 'Casa privada',
    airtableValues: ['Casa', 'Villa', 'Finca'],
    gradient: 'from-orange-400 to-amber-500',
    bgLight: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
  },
  {
    id: 'boutique',
    label: 'Apartamento Boutique',
    subtitle: '4-15 suites exclusivas',
    description: 'Diseño único · Atención personalizada · Experiencia curada',
    icon: <Sparkles size={22} />,
    roomCount: '4-15 suites',
    airtableValues: ['Hotel boutique', 'Hostal'],
    gradient: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50',
    border: 'border-pink-300',
    text: 'text-pink-700',
  },
  {
    id: 'posada',
    label: 'Posada Nativa',
    subtitle: '3-8 habitaciones raizales',
    description: 'Familia Raizal · Auténtico · Experiencia cultural única',
    icon: <TreePalm size={22} />,
    roomCount: '3-8 hab.',
    airtableValues: ['Posada Nativa', 'Habitacion'],
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
  },
  {
    id: 'otros',
    label: 'Otros',
    subtitle: 'Alternativas únicas',
    description: 'Hostales · Campings · Opciones especiales',
    icon: <DoorOpen size={22} />,
    roomCount: 'Variable',
    airtableValues: ['Hostal', 'Hostel', 'Otro'],
    gradient: 'from-gray-500 to-slate-500',
    bgLight: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera opciones de habitación a partir de los campos de precio de Airtable */
function generateRooms(acc: any): RoomOption[] {
  const rooms: RoomOption[] = [];
  const tipo: string = acc.accommodationType || 'Hotel';
  const base = acc.precioActualizado || acc.precioBase || 0;

  if (acc.precio1Huesped > 0) {
    rooms.push({
      id: `${acc.id}-single`,
      name: 'Habitación Sencilla',
      bedType: 'single',
      capacity: 1,
      pricePerNight: acc.precio1Huesped,
      description: 'Ideal para viajero individual',
    });
  }

  if (acc.precio2Huespedes > 0) {
    const bedType: BedType =
      tipo === 'Casa' || tipo === 'Villa' || tipo === 'Finca' ? 'queen' : 'double';
    rooms.push({
      id: `${acc.id}-double`,
      name: tipo === 'Casa' ? 'Habitación Principal' : 'Habitación Doble',
      bedType,
      capacity: 2,
      pricePerNight: acc.precio2Huespedes,
      description: 'Para 2 personas',
    });
  }

  if (acc.precio3Huespedes > 0) {
    rooms.push({
      id: `${acc.id}-triple`,
      name: 'Habitación Triple',
      bedType: 'twin',
      capacity: 3,
      pricePerNight: acc.precio3Huespedes,
      description: 'Cama doble + cama sencilla',
    });
  }

  if (acc.precio4Huespedes > 0) {
    rooms.push({
      id: `${acc.id}-family`,
      name: tipo === 'Casa' || tipo === 'Finca' ? 'Casa Completa' : 'Suite Familiar',
      bedType: 'triple',
      capacity: 4,
      pricePerNight: acc.precio4Huespedes,
      description: 'Múltiples camas · hasta 4 personas',
    });
  }

  // Si el alojamiento es una Casa completa sin campos de precio específicos
  if (
    rooms.length === 0 &&
    (tipo === 'Casa' || tipo === 'Villa' || tipo === 'Finca' || tipo === 'Aparta Hotel')
  ) {
    rooms.push({
      id: `${acc.id}-full`,
      name: tipo === 'Casa' || tipo === 'Finca' ? 'Casa Completa' : 'Apartamento Completo',
      bedType: 'triple',
      capacity: acc.capacidad || 4,
      pricePerNight: base,
      description: `Propiedad completa · hasta ${acc.capacidad || 4} personas`,
    });
  }

  // Fallback estándar
  if (rooms.length === 0) {
    rooms.push({
      id: `${acc.id}-standard`,
      name: 'Habitación Estándar',
      bedType: 'double',
      capacity: 2,
      pricePerNight: base,
      description: 'Configuración estándar',
    });
  }

  return rooms;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const n = Math.round(diff / (1000 * 60 * 60 * 24));
  return n > 0 ? n : 1;
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/** Indicador de progreso entre pasos */
const StepIndicator: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="flex items-center gap-1.5 py-3 px-4">
    {Array.from({ length: total }, (_, i) => (
      <React.Fragment key={i}>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            i < step
              ? 'bg-cyan-500 flex-1'
              : i === step
              ? 'bg-cyan-400 flex-[2]'
              : 'bg-gray-200 flex-1'
          }`}
        />
      </React.Fragment>
    ))}
  </div>
);

/** Botón contador +/- */
const CounterButton: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  sublabel?: string;
}> = ({ value, onChange, min = 0, max = 200, label, sublabel }) => (
  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
    <div>
      <span className="block font-semibold text-gray-800 text-sm">{label}</span>
      {sublabel && <span className="text-[11px] text-gray-400">{sublabel}</span>}
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all"
      >
        <Minus size={14} />
      </button>
      <span className="font-bold text-lg w-6 text-center tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

interface TourPrivadoProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const TourPrivado: React.FC<TourPrivadoProps> = ({ onBack }) => {
  // ── Estado global del planner ──────────────────────────────────────────────
  const [step, setStep] = useState(0);

  const [group, setGroup] = useState<GroupConfig>({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    babies: 0,
    groupName: '',
  });

  // Paso 1 — alojamiento
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [accLoading, setAccLoading] = useState(false);
  const [selectedAccType, setSelectedAccType] = useState<string | null>(null);
  const [roomModalAcc, setRoomModalAcc] = useState<any | null>(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState<SelectedAccommodation | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Paso 2 — actividades
  const [tours, setTours] = useState<any[]>([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [selectedTourIds, setSelectedTourIds] = useState<Set<string>>(new Set());

  // Paso 3 — negociación
  const [negotiationPct, setNegotiationPct] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const loadAccommodations = useCallback(async () => {
    setAccLoading(true);
    try {
      const data = await getAccommodations();
      setAccommodations(data);
    } catch {
      setAccommodations([]);
    } finally {
      setAccLoading(false);
    }
  }, []);

  const loadTours = useCallback(async () => {
    setToursLoading(true);
    try {
      const data = await getTours();
      setTours(data);
    } catch {
      setTours([]);
    } finally {
      setToursLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 1 && accommodations.length === 0) loadAccommodations();
    if (step === 2 && tours.length === 0) loadTours();
  }, [step, accommodations.length, tours.length, loadAccommodations, loadTours]);

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const nights = nightsBetween(group.checkIn, group.checkOut);
  const totalPax = group.adults + group.children;

  const accSubtotal = selectedAccommodation
    ? selectedAccommodation.room.pricePerNight * nights
    : 0;

  const toursSubtotal = tours
    .filter((t) => selectedTourIds.has(t.id))
    .reduce((sum, t) => sum + calculateTourPrice(t, totalPax), 0);

  const grossTotal = accSubtotal + toursSubtotal;
  const discount = Math.round(grossTotal * (negotiationPct / 100));
  const proposedTotal = grossTotal - discount;

  // ── Filtrado de alojamientos por tipo ──────────────────────────────────────
  const typeConfig = ACCOMMODATION_TYPES.find((t) => t.id === selectedAccType);
  const filteredAccommodations = typeConfig
    ? accommodations.filter((a) =>
        typeConfig.airtableValues.some(
          (v) => (a.accommodationType || '').toLowerCase() === v.toLowerCase()
        )
      )
    : accommodations;

  // Si no hay coincidencias exactas, mostrar todos (modo fallback amigable)
  const displayedAccommodations =
    filteredAccommodations.length > 0 ? filteredAccommodations : accommodations;

  // ── Manejo de selección de habitación ─────────────────────────────────────
  const handleRoomSelect = (acc: any, room: RoomOption) => {
    setSelectedRoomId(room.id);
    setSelectedAccommodation({
      acc,
      room,
      nights,
      subtotal: room.pricePerNight * nights,
    });
    setRoomModalAcc(null);
  };

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const selectedToursData = tours.filter((t) => selectedTourIds.has(t.id));

    const accLine = selectedAccommodation
      ? `🏠 *Alojamiento:* ${selectedAccommodation.acc.nombre}\n   Habitación: ${selectedAccommodation.room.name} (${selectedAccommodation.room.bedType})\n   ${nights} noches · ${formatCOP(accSubtotal)}`
      : '🏠 *Alojamiento:* Por definir';

    const tourLines =
      selectedToursData.length > 0
        ? selectedToursData
            .map(
              (t) =>
                `🌊 ${t.nombre} · ${formatCOP(calculateTourPrice(t, totalPax))} (${totalPax} pax)`
            )
            .join('\n')
        : '   Sin actividades seleccionadas aún';

    const negLine =
      negotiationPct > 0
        ? `\n💬 *Propuesta de ajuste:* ${negotiationPct}% descuento\n✅ *Total propuesto:* ${formatCOP(proposedTotal)}`
        : `\n✅ *Total estimado:* ${formatCOP(grossTotal)}`;

    const message = encodeURIComponent(
      `¡Hola! Quiero planificar un *tour privado en San Andrés* 🌴\n\n` +
        `*Grupo:* ${group.groupName || 'Mi grupo'}\n` +
        `*Personas:* ${group.adults} adultos${group.children > 0 ? `, ${group.children} niños` : ''}${group.babies > 0 ? `, ${group.babies} bebés` : ''}\n` +
        `*Fechas:* ${group.checkIn} → ${group.checkOut} (${nights} noches)\n\n` +
        `--- Selección ---\n${accLine}\n\n*Actividades:*\n${tourLines}\n\n` +
        `--- Precio ---\n💰 *Total base:* ${formatCOP(grossTotal)}${negLine}\n\n` +
        `Quedo atento/a para coordinar los detalles. ¡Gracias! 🤝`
    );

    setSubmitting(true);
    setTimeout(() => {
      window.open(`https://wa.me/${HOST_WHATSAPP}?text=${message}`, '_blank');
      setSubmitted(true);
      setSubmitting(false);
    }, 600);
  };

  // ── Renders por paso ───────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="p-5 space-y-5">
      <div className="text-center pt-2 pb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 mb-4 shadow-lg shadow-cyan-200">
          <TreePalm size={30} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Diseña tu estadía</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tour privado con anfitrión raizal · San Andrés & Providencia
        </p>
      </div>

      {/* Nombre del grupo */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Users size={13} /> Tu grupo
        </h3>

        <input
          type="text"
          placeholder="Nombre del grupo (opcional)"
          value={group.groupName}
          onChange={(e) => setGroup({ ...group, groupName: e.target.value })}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        />

        <CounterButton
          label="Adultos"
          sublabel="18+ años"
          value={group.adults}
          min={1}
          onChange={(v) => setGroup({ ...group, adults: v })}
        />
        <CounterButton
          label="Niños"
          sublabel="4-17 años"
          value={group.children}
          onChange={(v) => setGroup({ ...group, children: v })}
        />
        <CounterButton
          label="Bebés"
          sublabel="0-3 años"
          value={group.babies}
          onChange={(v) => setGroup({ ...group, babies: v })}
        />
      </div>

      {/* Fechas */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={13} /> Fechas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Llegada</label>
            <input
              type="date"
              value={group.checkIn}
              onChange={(e) => setGroup({ ...group, checkIn: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Salida</label>
            <input
              type="date"
              value={group.checkOut}
              onChange={(e) => setGroup({ ...group, checkOut: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
        {nights > 1 && (
          <p className="text-xs text-cyan-600 font-medium text-center">
            {nights} noches
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setStep(1)}
        disabled={group.adults < 1}
        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        Diseñar mi estadía <ArrowRight size={18} className="inline ml-1" />
      </button>
    </div>
  );

  const renderStep1 = () => (
    <div className="p-5 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">¿Dónde se hospedan?</h2>
        <p className="text-sm text-gray-500 mt-0.5">Elige el tipo de alojamiento</p>
      </div>

      {/* Tipo de alojamiento */}
      <div className="grid grid-cols-2 gap-3">
        {ACCOMMODATION_TYPES.map((type) => {
          const isSelected = selectedAccType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setSelectedAccType(type.id);
                setSelectedAccommodation(null);
                setSelectedRoomId(null);
              }}
              className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? `${type.bgLight} ${type.border} shadow-md`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br ${type.gradient} text-white shadow-sm`}
              >
                {type.icon}
              </div>
              <span className={`font-bold text-sm ${isSelected ? type.text : 'text-gray-800'}`}>
                {type.label}
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5">{type.subtitle}</span>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight line-clamp-2">
                {type.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Lista de propiedades */}
      {selectedAccType && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            {accLoading
              ? 'Cargando propiedades...'
              : `${displayedAccommodations.length} propiedades disponibles`}
          </h3>

          {accLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {displayedAccommodations.map((acc) => {
                const isSelected = selectedAccommodation?.acc.id === acc.id;
                return (
                  <div
                    key={acc.id}
                    className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
                      isSelected ? 'border-cyan-500 shadow-cyan-100' : 'border-gray-200'
                    }`}
                  >
                    {/* Imagen */}
                    {acc.imageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={acc.imageUrl}
                          alt={acc.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{acc.nombre}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {acc.estrellas > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                <Star size={11} fill="currentColor" />
                                {acc.estrellas}
                              </span>
                            )}
                            {acc.ubicacion && (
                              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                <MapPin size={11} />
                                {acc.ubicacion}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <span className="text-xs text-gray-400">desde</span>
                          <p className="text-sm font-bold text-cyan-600">
                            {formatCOP(
                              calculateAccommodationPrice(acc, totalPax)
                            )}
                          </p>
                          <span className="text-[10px] text-gray-400">/noche</span>
                        </div>
                      </div>

                      {acc.descripcion && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{acc.descripcion}</p>
                      )}

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={() => setRoomModalAcc(acc)}
                        className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check size={14} className="inline mr-1" />
                            {selectedAccommodation?.room.name} · Ver habitaciones
                          </>
                        ) : (
                          <>
                            <Bed size={14} className="inline mr-1" />
                            Ver habitaciones
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={!selectedAccommodation && selectedAccType !== null}
          className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md active:scale-[0.98] transition-all disabled:opacity-40"
        >
          Continuar <ArrowRight size={16} className="inline ml-1" />
        </button>
      </div>
      {!selectedAccommodation && (
        <button
          type="button"
          onClick={() => setStep(2)}
          className="w-full text-center text-xs text-gray-400 underline"
        >
          Continuar sin alojamiento
        </button>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="p-5 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Actividades & Tours</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Elige qué quieres vivir en San Andrés
        </p>
      </div>

      {toursLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tours.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Activity size={36} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay tours disponibles ahora</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => {
            const isSelected = selectedTourIds.has(tour.id);
            const tourPrice = calculateTourPrice(tour, totalPax);
            return (
              <div
                key={tour.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
                  isSelected ? 'border-cyan-500 shadow-cyan-100' : 'border-gray-200'
                }`}
              >
                {tour.imageUrl && (
                  <div className="h-36 overflow-hidden">
                    <img
                      src={tour.imageUrl}
                      alt={tour.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm">{tour.nombre}</h4>
                      {tour.descripcion && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {tour.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-cyan-600">{formatCOP(tourPrice)}</p>
                      <span className="text-[10px] text-gray-400">{totalPax} pax</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Set(selectedTourIds);
                      if (isSelected) next.delete(tour.id);
                      else next.add(tour.id);
                      setSelectedTourIds(next);
                    }}
                    className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check size={14} className="inline mr-1" />
                        Seleccionado
                      </>
                    ) : (
                      <>
                        <Plus size={14} className="inline mr-1" />
                        Añadir
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setStep(3)}
        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md active:scale-[0.98] transition-all"
      >
        Ver resumen <ArrowRight size={16} className="inline ml-1" />
      </button>
      <button
        type="button"
        onClick={() => setStep(3)}
        className="w-full text-center text-xs text-gray-400 underline"
      >
        Continuar sin actividades
      </button>
    </div>
  );

  const renderStep3 = () => {
    const selectedToursData = tours.filter((t) => selectedTourIds.has(t.id));

    if (submitted) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
            <Check size={36} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            Tu anfitrión recibió tu propuesta por WhatsApp. En breve te contactarán para
            coordinar los detalles de tu tour privado.
          </p>
          <div className="mt-6 p-4 bg-cyan-50 rounded-2xl border border-cyan-200 w-full max-w-xs">
            <p className="text-xs text-cyan-700 font-medium">
              Tiempo de respuesta promedio: menos de 2 horas
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-5 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tu propuesta</h2>
          <p className="text-sm text-gray-500 mt-0.5">Revisa y contacta al anfitrión</p>
        </div>

        {/* Resumen de selecciones */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={12} /> Resumen
          </h3>

          {/* Grupo */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Users size={15} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {group.groupName || 'Mi grupo'}
              </p>
              <p className="text-xs text-gray-400">
                {group.adults} adultos
                {group.children > 0 ? ` · ${group.children} niños` : ''}
                {group.babies > 0 ? ` · ${group.babies} bebés` : ''}
                {group.checkIn ? ` · ${nights} noches` : ''}
              </p>
            </div>
          </div>

          {/* Alojamiento */}
          {selectedAccommodation ? (
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Home size={15} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {selectedAccommodation.acc.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedAccommodation.room.name} · {nights} noches
                </p>
                <p className="text-xs text-cyan-600 font-semibold mt-0.5">
                  {formatCOP(accSubtotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-400 underline shrink-0"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <Home size={15} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 italic flex-1">Sin alojamiento seleccionado</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-cyan-500 underline"
              >
                Elegir
              </button>
            </div>
          )}

          {/* Tours */}
          {selectedToursData.length > 0 ? (
            <div className="space-y-2">
              {selectedToursData.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <Activity size={15} className="text-green-500" />
                  </div>
                  <p className="text-sm text-gray-700 flex-1 truncate">{t.nombre}</p>
                  <p className="text-xs text-cyan-600 font-semibold shrink-0">
                    {formatCOP(calculateTourPrice(t, totalPax))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <Activity size={15} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 italic flex-1">Sin actividades</p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-cyan-500 underline"
              >
                Añadir
              </button>
            </div>
          )}
        </div>

        {/* Panel de negociación */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-5 border border-cyan-100">
          <h3 className="text-xs font-bold text-cyan-700 uppercase tracking-widest mb-4">
            Propuesta de precio
          </h3>

          {/* Total base */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Total base</span>
            <span className="font-bold text-gray-900">{formatCOP(grossTotal)}</span>
          </div>

          {/* Slider de negociación */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Proponer descuento</span>
              <span
                className={`text-sm font-bold ${
                  negotiationPct > 0 ? 'text-cyan-600' : 'text-gray-400'
                }`}
              >
                {negotiationPct}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={negotiationPct}
              onChange={(e) => setNegotiationPct(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Sin descuento</span>
              <span>5%</span>
              <span>10%</span>
              <span>15%</span>
              <span>20%</span>
            </div>
          </div>

          {negotiationPct > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-cyan-200 mb-2">
              <span className="text-xs text-gray-500">Ahorro propuesto</span>
              <span className="text-sm font-semibold text-green-600">
                − {formatCOP(discount)}
              </span>
            </div>
          )}

          {/* Total propuesto */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-cyan-300 shadow-sm">
            <span className="font-semibold text-gray-700">
              {negotiationPct > 0 ? 'Total propuesto' : 'Total estimado'}
            </span>
            <span className="text-xl font-black text-cyan-600">
              {formatCOP(proposedTotal)}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 mt-2 text-center">
            El anfitrión confirmará el precio final · Negociación directa
          </p>
        </div>

        {/* CTA WhatsApp */}
        <button
          type="button"
          onClick={handleWhatsApp}
          disabled={submitting}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <MessageCircle size={22} />
              Contactar anfitrión por WhatsApp
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          <Phone size={11} className="inline mr-1" />
          Respuesta promedio: menos de 2 horas
        </p>
      </div>
    );
  };

  // ── Modal de habitaciones ──────────────────────────────────────────────────
  const renderRoomModal = () => {
    if (!roomModalAcc) return null;
    const rooms = generateRooms(roomModalAcc);

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{roomModalAcc.nombre}</h3>
              <p className="text-xs text-gray-400">
                {roomModalAcc.accommodationType} · Selecciona tu acomodación
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRoomModalAcc(null)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Galería */}
          {roomModalAcc.images?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
              {roomModalAcc.images.slice(0, 5).map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt={`${roomModalAcc.nombre} ${i + 1}`}
                  className="h-24 w-40 shrink-0 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}

          {/* Habitaciones */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Acomodaciones disponibles
            </h4>

            {/* Grid de camas */}
            <div className="grid grid-cols-3 gap-2">
              {rooms.map((room) => (
                <BedVisualizer
                  key={room.id}
                  bedType={room.bedType}
                  selected={selectedRoomId === room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  compact
                />
              ))}
            </div>

            {/* Detalle de la habitación seleccionada */}
            {selectedRoomId && (
              <div className="space-y-3">
                {rooms
                  .filter((r) => r.id === selectedRoomId)
                  .map((room) => (
                    <div
                      key={room.id}
                      className="bg-cyan-50 rounded-2xl p-4 border border-cyan-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{room.name}</p>
                          {room.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{room.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Capacidad: hasta {room.capacity} persona{room.capacity > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-cyan-600">
                            {formatCOP(room.pricePerNight)}
                          </p>
                          <p className="text-[10px] text-gray-400">/noche</p>
                          {nights > 1 && (
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {formatCOP(room.pricePerNight * nights)} total
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRoomSelect(roomModalAcc, room)}
                        className="mt-3 w-full py-2.5 rounded-xl font-bold text-white bg-cyan-500 hover:bg-cyan-600 active:scale-[0.98] transition-all"
                      >
                        <Check size={15} className="inline mr-1" />
                        Elegir esta acomodación
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render principal ───────────────────────────────────────────────────────
  const STEP_LABELS = ['Grupo', 'Alojamiento', 'Actividades', 'Propuesta'];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header fijo */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <button
            type="button"
            onClick={step === 0 ? onBack : () => setStep(step - 1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold text-cyan-600">{STEP_LABELS[step]}</p>
            <p className="text-[10px] text-gray-400">Paso {step + 1} de 4</p>
          </div>
          <div className="w-9" />
        </div>
        <StepIndicator step={step} total={4} />
      </div>

      {/* Contenido del paso actual */}
      <div className="pb-20">
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Modal de habitaciones */}
      {renderRoomModal()}
    </div>
  );
};

export default TourPrivado;
