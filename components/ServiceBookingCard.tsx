import React, { useState } from 'react';
import { MapPin, Users, Calendar, ChevronRight, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Tour, AppRoute } from '../types';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80';

interface ServiceBookingCardProps {
  service: Tour & {
    nombre?: string;
    capacity?: string | number;
    capacidad?: number;
    accommodationType?: string;
    tipo?: string;
    location?: string;
    images?: string[];
    price?: number;
    pricePerNight?: Record<number, number>;
  };
  onViewDetails: () => void;
}

function getCategoryBadge(category: string, tipo?: string) {
  const label = tipo || category;
  // GuanaGO palette: emerald primary, teal accent, amber warm
  const colors: Record<string, string> = {
    hotel: 'bg-teal-600/90 text-white',
    tour: 'bg-emerald-600/90 text-white',
    package: 'bg-amber-500/90 text-white',
    taxi: 'bg-yellow-500/90 text-gray-900',
  };
  return { label, color: colors[category] || 'bg-gray-100 text-gray-600' };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
function sevenDaysStr() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

const ServiceBookingCard: React.FC<ServiceBookingCardProps> = ({ service, onViewDetails }) => {
  const { addToCart } = useCart();

  const isHotel = service.category === 'hotel';

  // Date state
  const [checkIn, setCheckIn] = useState(todayStr());
  const [checkOut, setCheckOut] = useState(sevenDaysStr());
  const [tourDate, setTourDate] = useState(tomorrowStr());

  // Guest state
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);

  const [added, setAdded] = useState(false);

  const imageUrl = service.image || (service.images && service.images[0]) || FALLBACK_IMAGE;
  const title = service.title || (service as any).nombre || 'Servicio';
  const location = service.location || 'San Andrés Isla';
  const capacity = service.capacity || (service as any).capacidad || '—';
  const badge = getCategoryBadge(service.category, (service as any).accommodationType || (service as any).tipo);

  function calcNights() {
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    const n = Math.ceil((co.getTime() - ci.getTime()) / 86400000);
    return n > 0 ? n : 1;
  }

  const nights = isHotel ? calcNights() : 1;
  const totalGuests = adults + children;
  const pricePerUnit = service.price || 0;
  const totalPrice = isHotel ? pricePerUnit * nights : pricePerUnit * adults;

  function handleAddToCart() {
    if (isHotel) {
      if (!checkIn || !checkOut) return;
      addToCart(service, totalGuests, checkIn, undefined, nights, totalPrice, babies);
    } else {
      if (!tourDate) return;
      addToCart(service, adults, tourDate, undefined, undefined, totalPrice, babies);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function Counter({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-90 transition-all"
        >
          <Minus size={12} />
        </button>
        <span className="text-sm font-bold text-gray-900 w-5 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-90 transition-all"
        >
          <Plus size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        />
        {/* Category badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${badge.color}`}>
          {badge.label}
        </div>
        {/* Location overlay */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1 text-white text-xs">
          <MapPin size={11} />
          <span>{location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + capacity */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900 leading-tight flex-1">{title}</h3>
          {capacity && (
            <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
              <Users size={13} />
              <span>{capacity} pax</span>
            </div>
          )}
        </div>

        {/* Description snippet */}
        {service.description && (
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{service.description}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-gray-900">
            ${pricePerUnit.toLocaleString('es-CO')}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            COP {isHotel ? '/ noche' : '/ persona'}
          </span>
        </div>

        {/* Booking section — GuanaGO green palette */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-3">

          {/* Dates */}
          {isHotel ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1.5 font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1.5 font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                <Calendar size={11} /> Fecha del tour
              </label>
              <input
                type="date"
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                className="w-full text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1.5 font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                style={{ colorScheme: 'light' }}
              />
            </div>
          )}

          {/* Night count for hotel */}
          {isHotel && (
            <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg py-1">
              {nights} {nights === 1 ? 'noche' : 'noches'}
            </div>
          )}

          {/* Guests */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">Adultos</span>
              <Counter value={adults} onChange={setAdults} min={1} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">Ninos</span>
              <Counter value={children} onChange={setChildren} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">Bebes</span>
              <Counter value={babies} onChange={setBabies} />
            </div>
          </div>

          {/* Total */}
          {totalPrice > 0 && (
            <div className="flex items-center justify-between border-t border-emerald-200 pt-2">
              <span className="text-xs text-gray-500 font-semibold">Total estimado</span>
              <span className="text-sm font-bold text-emerald-700">
                ${totalPrice.toLocaleString('es-CO')} COP
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              added
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-200'
            }`}
          >
            <ShoppingCart size={15} />
            {added ? 'Agregado!' : 'Agregar al Carrito'}
          </button>
          <button
            onClick={onViewDetails}
            className="px-3 py-2.5 rounded-xl text-sm font-bold border-2 border-orange-400 text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-1 active:scale-95"
          >
            Ver
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceBookingCard;
