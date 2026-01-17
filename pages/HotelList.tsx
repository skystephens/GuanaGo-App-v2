import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, MapPin, Star, Wifi, Droplets, Calendar, Users, Search, ChevronDown, X } from 'lucide-react';
import { cachedApi } from '../services/cachedApi';
import { Tour, AppRoute } from '../types';

interface HotelListProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

// Interfaces para filtros de búsqueda
interface SearchFilters {
  checkIn: string;
  checkOut: string;
  guests: number;
  singleBeds: number;
  doubleBeds: number;
  hasKitchen: boolean | null;
}

const HotelList: React.FC<HotelListProps> = ({ onBack, onNavigate }) => {
  const [accommodations, setAccommodations] = useState<Tour[]>([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchPanel, setShowSearchPanel] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guests: 1,
    singleBeds: 0,
    doubleBeds: 1,
    hasKitchen: null,
  });

  // Cargar alojamientos desde Airtable
  useEffect(() => {
    loadAccommodations();
  }, []);

  const loadAccommodations = async () => {
    setLoading(true);
    try {
      const data = await cachedApi.getServices({ forceRefresh: true });
      // Filtrar solo alojamientos (Tipo de Servicio = "Alojamiento")
      const hotels = data.filter(
        service => service.category === 'hotel' || (service.tipo && service.tipo.toLowerCase().includes('alojamiento'))
      );
      setAccommodations(hotels);
      setFilteredAccommodations(hotels);
    } catch (error) {
      console.error('Error cargando alojamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = accommodations;

    // Filtrar por capacidad de huéspedes
    if (filters.guests > 0) {
      filtered = filtered.filter(hotel => {
        const capacity = parseInt(hotel.capacity || '0');
        return capacity >= filters.guests;
      });
    }

    // Filtro por rango de fechas (disponibilidad)
    // TODO: Implementar lógica de disponibilidad cuando esté disponible en Airtable

    setFilteredAccommodations(filtered);
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Calcular noches
  const calculateNights = () => {
    const checkInDate = new Date(filters.checkIn);
    const checkOutDate = new Date(filters.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, nights);
  };

  const nights = calculateNights();

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-800" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Alojamientos</h1>
        </div>
        <button 
          onClick={() => setShowSearchPanel(!showSearchPanel)}
          className="p-2 text-gray-500 hover:text-emerald-600"
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Panel de búsqueda avanzada */}
      {showSearchPanel && (
        <div className="bg-white border-b border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Buscar alojamiento</h2>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">
                <Calendar size={14} className="inline mr-1" />
                Entrada
              </label>
              <input
                type="date"
                value={filters.checkIn}
                onChange={(e) => handleFilterChange('checkIn', e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white outline-none"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">
                <Calendar size={14} className="inline mr-1" />
                Salida
              </label>
              <input
                type="date"
                value={filters.checkOut}
                onChange={(e) => handleFilterChange('checkOut', e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white outline-none"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          {/* Huéspedes y acomodación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">
                <Users size={14} className="inline mr-1" />
                Huéspedes
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={filters.guests}
                onChange={(e) => handleFilterChange('guests', parseInt(e.target.value))}
                className="w-full bg-gray-50 border-2 border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Noches</label>
              <div className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-lg px-3 py-2.5 text-sm font-bold text-emerald-700 flex items-center">
                {nights} {nights === 1 ? 'noche' : 'noches'}
              </div>
            </div>
          </div>

          {/* Camas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Camas sencillas</label>
              <input
                type="number"
                min="0"
                max="10"
                value={filters.singleBeds}
                onChange={(e) => handleFilterChange('singleBeds', parseInt(e.target.value))}
                className="w-full bg-gray-50 border-2 border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Camas dobles</label>
              <input
                type="number"
                min="0"
                max="10"
                value={filters.doubleBeds}
                onChange={(e) => handleFilterChange('doubleBeds', parseInt(e.target.value))}
                className="w-full bg-gray-50 border-2 border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Cocina */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-2">Cocina</label>
            <select
              value={filters.hasKitchen === null ? '' : filters.hasKitchen ? 'si' : 'no'}
              onChange={(e) => 
                handleFilterChange(
                  'hasKitchen',
                  e.target.value === '' ? null : e.target.value === 'si'
                )
              }
              className="w-full bg-gray-50 border-2 border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white outline-none"
            >
              <option value="">Sin preferencia</option>
              <option value="si">Con cocina</option>
              <option value="no">Sin cocina</option>
            </select>
          </div>

          {/* Botón buscar */}
          <button
            onClick={applyFilters}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <Search size={16} />
            Buscar alojamientos
          </button>
        </div>
      )}

      <div className="p-6">
        {/* Resumen de búsqueda */}
        {!showSearchPanel && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start justify-between">
            <div className="text-sm">
              <p className="text-emerald-900 font-bold mb-1">
                {filters.checkIn} → {filters.checkOut} • {filters.guests} huéspedes
              </p>
              <p className="text-emerald-700 text-xs">
                {nights} {nights === 1 ? 'noche' : 'noches'} • {filters.doubleBeds} camas dobles • {filters.singleBeds} sencillas
              </p>
            </div>
            <button
              onClick={() => setShowSearchPanel(true)}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : filteredAccommodations.length > 0 ? (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 font-medium">
              {filteredAccommodations.length} alojamiento{filteredAccommodations.length !== 1 ? 's' : ''} disponible{filteredAccommodations.length !== 1 ? 's' : ''}
            </p>
            {filteredAccommodations.map(hotel => (
              <div
                key={hotel.id}
                onClick={() => onNavigate(AppRoute.HOTEL_DETAIL, hotel)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              >
                <div className="h-48 relative bg-gray-100">
                  <img
                    src={hotel.image}
                    alt={hotel.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
                    }}
                  />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-1 text-white">
                    <MapPin size={12} />
                    <span className="text-xs font-medium truncate max-w-[200px]">
                      {hotel.location || 'San Andrés'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight flex-1 mr-2">
                      {hotel.title}
                    </h3>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md">
                        <Star size={12} className="text-green-600 fill-current" />
                        <span className="text-xs font-bold text-green-700">
                          {hotel.rating || 4.5}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 mb-3">
                    <p>Capacidad: {hotel.capacity} huésped{hotel.capacity !== '1' ? 'es' : ''}</p>
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 line-clamp-1 flex-1 mr-4">
                      {hotel.description}
                    </p>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-xl font-bold text-gray-900">
                        ${(parseInt(hotel.price?.toString() || '0') * nights).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 block">
                        ${hotel.price?.toLocaleString() || 'N/A'} / noche
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-sm">No encontramos alojamientos</p>
            <p className="text-gray-300 text-xs mt-1">Intenta cambiar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelList;