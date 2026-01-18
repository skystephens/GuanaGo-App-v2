/**
 * Planifica - Página de Reservas por Categoría
 * Muestra Tours, Hoteles y Traslados con productos para reservar
 */

import React, { useState, useEffect } from 'react';
import { 
  Anchor, Bed, Car, Star, Clock, Users, ChevronRight, 
  Search, Filter, Loader2, ShoppingCart, MapPin, Calendar,
  Sparkles, TrendingUp, Heart, ArrowRight
} from 'lucide-react';
import { cachedApi } from '../services/cachedApi';
import { FALLBACK_SERVICES, FALLBACK_TAXI_ZONES } from '../services/cacheService';
import { Tour, TaxiZone, AppRoute } from '../types';
import { useCart } from '../context/CartContext';

type CategoryType = 'all' | 'tour' | 'hotel' | 'taxi' | 'package';

interface PlannerProps {
  onNavigate: (route: AppRoute, data?: any) => void;
  initialCategory?: CategoryType;
}

const Planner: React.FC<PlannerProps> = ({ onNavigate, initialCategory = 'all' }) => {
  const [services, setServices] = useState<Tour[]>([]);
  const [taxiZones, setTaxiZones] = useState<TaxiZone[]>(FALLBACK_TAXI_ZONES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryType>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccommodationType, setSelectedAccommodationType] = useState<string | null>(null);
  const { addToCart, itemCount } = useCart();

  // Cargar datos usando el sistema de caché
  // 🔥 Forzar refresh desde Airtable
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('📡 Planner: Cargando servicios con forceRefresh...');
        const [servicesData, taxiData] = await Promise.all([
          cachedApi.getServices({ forceRefresh: true }), // Forzar Airtable
          cachedApi.getTaxiZones()
        ]);
        console.log('✅ Planner: Servicios recibidos:', servicesData.length);
        console.log('🖼️ Primeros 3 servicios con imágenes:', servicesData.slice(0, 3).map(s => ({ title: s.title, image: s.image })));
        setServices(servicesData.filter(s => s.active !== false));
        setTaxiZones(taxiData);
      } catch (error) {
        console.error('❌ Error cargando servicios:', error);
        setServices(FALLBACK_SERVICES.filter(s => s.active));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Categorías principales
  const categories = [
    { id: 'all', label: 'Todos', icon: <Sparkles size={18} />, color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
    { id: 'tour', label: 'Tours', icon: <Anchor size={18} />, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { id: 'hotel', label: 'Alojamientos', icon: <Bed size={18} />, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'taxi', label: 'Traslados', icon: <Car size={18} />, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { id: 'package', label: 'Paquetes', icon: <TrendingUp size={18} />, color: 'bg-gradient-to-r from-rose-500 to-red-500' },
  ];

  // Obtener tipos de alojamiento únicos
  const accommodationTypes = Array.from(
    new Set(
      services
        .filter(s => s.category === 'hotel')
        .map(s => (s as any).accommodationType || 'Hotel')
    )
  ).sort();

  // Filtrar servicios
  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAccommodationType = 
      activeCategory !== 'hotel' ||
      !selectedAccommodationType ||
      (service as any).accommodationType === selectedAccommodationType;
    return matchesCategory && matchesSearch && matchesAccommodationType;
  });

  // Destacados (rating > 4.7)
  const featured = services.filter(s => s.rating >= 4.7).slice(0, 4);

  // Navegar a detalle según categoría
  const handleServiceClick = (service: Tour) => {
    if (service.category === 'hotel') {
      onNavigate(AppRoute.HOTEL_DETAIL, service);
    } else if (service.category === 'package') {
      onNavigate(AppRoute.PACKAGE_DETAIL, service);
    } else {
      onNavigate(AppRoute.TOUR_DETAIL, service);
    }
  };

  // Navegar a taxi
  const handleTaxiClick = () => {
    onNavigate(AppRoute.TAXI_DETAIL);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-32 font-sans">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Planifica</h1>
            <p className="text-xs text-gray-400 font-medium">Tu aventura en San Andrés</p>
          </div>
          <button 
            onClick={() => onNavigate(AppRoute.CHECKOUT)}
            className="relative bg-emerald-50 p-3 rounded-2xl border border-emerald-100"
          >
            <ShoppingCart size={22} className="text-emerald-600" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="¿Qué quieres hacer hoy?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as CategoryType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? `${cat.color} text-white shadow-lg`
                  : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Destacados - Solo si está en "Todos" */}
        {activeCategory === 'all' && featured.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                Destacados
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {featured.map((item) => {
                const fallbackImage = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80';
                return (
                <div
                  key={item.id}
                  onClick={() => handleServiceClick(item)}
                  className="min-w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="relative h-40 bg-gray-100">
                    <img 
                      src={item.image || fallbackImage} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold">{item.rating || 4.5}</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <span className="text-white font-bold text-sm">{item.title}</span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-emerald-600 font-black text-lg">${(item.price || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-400">{item.duration || 'Por noche'}</span>
                  </div>
                </div>
              )})}
            </div>
          </section>
        )}

        {/* Sección de Traslados - Si está seleccionado */}
        {activeCategory === 'taxi' && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Car size={20} className="text-amber-500" />
                Zonas de Traslado
              </h2>
              <button 
                onClick={handleTaxiClick}
                className="text-emerald-600 text-xs font-bold flex items-center gap-1"
              >
                Calcular tarifa <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {taxiZones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={handleTaxiClick}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className={`w-12 h-12 ${zone.color} rounded-xl flex items-center justify-center`}>
                    <Car size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">{zone.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1">{zone.sectors}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-black text-sm">${zone.priceSmall.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">1-4 personas</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón grande para ir a calculadora */}
            <button
              onClick={handleTaxiClick}
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            >
              <Car size={20} />
              Calcular mi traslado
            </button>
          </section>
        )}

        {/* Lista de Servicios */}
        {activeCategory !== 'taxi' && (
          <section>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">
                  {activeCategory === 'all' ? 'Todos los servicios' : 
                   activeCategory === 'tour' ? 'Tours y experiencias' :
                   activeCategory === 'hotel' ? 'Alojamientos' :
                   activeCategory === 'package' ? 'Paquetes todo incluido' : 'Servicios'}
                </h2>
                <span className="text-xs text-gray-400 font-medium">
                  {filteredServices.length} opciones
                </span>
              </div>
              
              {/* Filtro de tipos de alojamiento */}
              {activeCategory === 'hotel' && accommodationTypes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedAccommodationType(null)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedAccommodationType === null
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    Ver todos
                  </button>
                  {accommodationTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedAccommodationType(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedAccommodationType === type
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-3xl h-56 animate-pulse border border-gray-100"></div>
                ))}
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={`${service.id}-${service.image || 'no-img'}`}
                    service={service}
                    onClick={() => handleServiceClick(service)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold text-sm">No encontramos resultados</p>
                <p className="text-gray-300 text-xs mt-1">Prueba con otra búsqueda</p>
              </div>
            )}
          </section>
        )}

        {/* CTA Final */}
        <section className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white">
          <h3 className="font-black text-lg mb-2">¿Necesitas ayuda?</h3>
          <p className="text-emerald-100 text-sm mb-4">
            Nuestro asistente Guana Go puede ayudarte a planificar tu viaje perfecto.
          </p>
          <button
            onClick={() => onNavigate(AppRoute.HOME)}
            className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-all"
          >
            <Sparkles size={16} />
            Hablar con Guana Go
          </button>
        </section>
      </div>
    </div>
  );
};

// Componente de tarjeta de servicio
const ServiceCard: React.FC<{ service: Tour; onClick: () => void }> = ({ service, onClick }) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Resetear imageError cuando cambie la URL de la imagen (después de sincronizar)
  React.useEffect(() => {
    setImageError(false);
  }, [service.image]);
  
  const getCategoryBadge = (category: string, accommodationType?: string) => {
    switch (category) {
      case 'tour': return { label: 'Tour', color: 'bg-blue-500' };
      case 'hotel': return { label: accommodationType || 'Alojamiento', color: 'bg-purple-500' };
      case 'package': return { label: 'Paquete', color: 'bg-rose-500' };
      default: return { label: 'Servicio', color: 'bg-gray-500' };
    }
  };

  const badge = getCategoryBadge(service.category, (service as any).accommodationType);
  
  // Imagen con fallback - PRIORIZAR service.image sobre imageError
  const getImageUrl = () => {
    // Si hay imagen y NO hubo error, usarla
    if (service.image && !imageError) {
      return service.image;
    }
    
    // Fallbacks por categoría (solo si no hay imagen o hubo error)
    const fallbacks: Record<string, string> = {
      tour: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
      hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
      package: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
      taxi: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80',
    };
    return fallbacks[service.category] || fallbacks.tour;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
    >
      <div className="relative h-32 bg-gray-100">
        <img 
          src={getImageUrl()} 
          alt={service.title} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div className={`absolute top-2 right-2 ${badge.color} text-white px-2 py-1 rounded-lg`}>
          <span className="text-[8px] font-black uppercase">{badge.label}</span>
        </div>
        {service.isRaizal && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-lg">
            <span className="text-[8px] font-black">🌴 RAIZAL</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-xs leading-tight line-clamp-2 mb-2">{service.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <Star size={12} className="text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-gray-600">{service.rating || 4.5}</span>
          <span className="text-xs text-gray-400">({service.reviews || 0})</span>
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="text-emerald-600 font-black text-sm">${(service.price || 0).toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 block">
              {service.category === 'hotel' ? '/noche' : '/persona'}
            </span>
          </div>
          {service.duration && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Clock size={10} />
              {service.duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planner;
