import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, MapPin, Star, Wifi, Droplets, Calendar, Users, Search, ChevronDown, X } from 'lucide-react';
import { hotelCacheService } from '../services/hotelCacheService';
import { Tour, AppRoute } from '../types';
import ServiceBookingCard from '../components/ServiceBookingCard';

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
  accommodationType: string | null;
}

const ACCOMMODATION_TYPES = [
  'Hotel',
  'Aparta Hotel',
  'Apartamentos',
  'Casa',
  'Habitacion',
  'Hostal',
  'Posada Nativa',
  'Hotel boutique'
];

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
    accommodationType: null,
  });

  // Cargar alojamientos desde Airtable
  useEffect(() => {
    loadAccommodations();
  }, []);

  const loadAccommodations = async () => {
    setLoading(true);
    try {
      // Usar nuevo servicio de caché con soporte offline
      const result = await hotelCacheService.getHotels(false);
      
      console.log('🏨 Alojamientos cargados:', {
        cantidad: result.data.length,
        fuente: result.source,
        fresco: result.isFresh,
        estado: result.metadata.apiStatus
      });
      
      // Filtrar solo alojamientos
      let hotels = result.data.filter(service => {
        const isHotel = service.category === 'hotel' || (service.tipo && service.tipo.toLowerCase().includes('alojamiento'));
        return isHotel;
      });
      
      // 🔧 Asegurar que cada hotel tiene las propiedades requeridas por Detail.tsx
      hotels = hotels.map(hotel => ({
        ...hotel,
        // Asegurar que siempre hay una imagen principal
        image: hotel.image || hotel.images?.[0] || hotel.gallery?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        // Asegurar que siempre hay un título
        title: hotel.title || hotel.nombre || hotel.name || 'Alojamiento',
        // Asegurar que siempre hay una descripción
        description: hotel.description || hotel.descripcion || 'Alojamiento en San Andrés',
        // Asegurar que siempre hay un price
        price: hotel.price || 0,
        // Asegurar que hay rating
        rating: hotel.rating || 4.5,
        // Asegurar que hay reviews
        reviews: hotel.reviews || 10,
        // Asegurar que hay categoría
        category: 'hotel'
      }));
      
      console.log('🏨 Alojamientos encontrados:', hotels.length);
      console.log('🏨 Primer alojamiento:', hotels[0]);
      setAccommodations(hotels);
      setFilteredAccommodations(hotels);
    } catch (error) {
      console.error('❌ Error cargando alojamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = accommodations;

    // Filtrar por tipo de alojamiento
    if (filters.accommodationType) {
      filtered = filtered.filter(hotel => {
        return hotel.accommodationType === filters.accommodationType;
      });
    }

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

          {/* Tipo de Alojamiento */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-2">Tipo de Alojamiento</label>
            <select
              value={filters.accommodationType || ''}
              onChange={(e) => handleFilterChange('accommodationType', e.target.value || null)}
              className="w-full bg-gray-50 border-2 border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-900 focus:border-amber-500 focus:bg-white outline-none"
            >
              <option value="">Todos los tipos</option>
              {ACCOMMODATION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
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
              <ServiceBookingCard
                key={hotel.id}
                service={hotel}
                onViewDetails={() => onNavigate(AppRoute.HOTEL_DETAIL, hotel)}
              />
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