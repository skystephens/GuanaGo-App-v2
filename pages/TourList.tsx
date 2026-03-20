
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Filter, Star, Clock, Anchor, MapPin, Users, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';
import { POPULAR_TOURS } from '../constants';
import ServiceBookingCard from '../components/ServiceBookingCard';

interface TourListProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const TourList: React.FC<TourListProps> = ({ onBack, onNavigate }) => {
  // Iniciar con tours de fallback para que siempre haya contenido visible
  const [tours, setTours] = useState<Tour[]>(POPULAR_TOURS);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState('Todos');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     // Cargar tours de API en segundo plano
     api.services.listPublic()
       .then(allServices => {
         // Filtrar solo tours activos
         const tourServices = allServices.filter(s => s.category === 'tour' && s.active !== false);
         console.log('Tours cargados de API:', tourServices.length);
         if (tourServices.length > 0) {
           setTours(tourServices);
         } else {
           console.log('ℹ️ API sin tours, manteniendo tours de fallback');
         }
       })
       .catch(err => {
         console.log('ℹ️ API unavailable, usando tours de fallback:', err);
       });
  }, []);

  const tags = ['Todos', 'Acuáticos', 'Culturales', 'Aventura', 'Gastronomía', 'Ecoturismo'];
  
  // Filtrar tours por tag (basado en descripción o título)
  const filteredTours = activeTag === 'Todos' 
    ? tours 
    : tours.filter(t => 
        t.title?.toLowerCase().includes(activeTag.toLowerCase()) || 
        t.description?.toLowerCase().includes(activeTag.toLowerCase())
      );

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
       {/* Header */}
       <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <ArrowLeft size={20} className="text-gray-800" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Tours y Actividades</h1>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{filteredTours.length} disponibles</span>
            <button className="p-2 text-gray-500 hover:text-green-600">
               <Filter size={20} />
            </button>
         </div>
       </div>

       <div className="p-6">
          {/* Descripción */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              Descubre las mejores experiencias turísticas en San Andrés. Reserva directamente con proveedores locales certificados.
            </p>
          </div>

          {/* Tags */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
             {tags.map((tag) => (
                <button 
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeTag === tag 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
                  }`}
                >
                  {tag}
                </button>
             ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-red-700 font-medium text-sm mt-2 underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* List */}
          <div className="grid grid-cols-1 gap-6">
             {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 border-3 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Cargando tours desde San Andrés...</p>
                </div>
             ) : filteredTours.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Anchor size={48} className="mb-2 opacity-20" />
                    <p className="text-center">No hay tours disponibles en esta categoría.</p>
                    {activeTag !== 'Todos' && (
                      <button 
                        onClick={() => setActiveTag('Todos')}
                        className="mt-3 text-green-600 font-medium text-sm"
                      >
                        Ver todos los tours
                      </button>
                    )}
                </div>
             ) : (
                filteredTours.map(tour => (
                    <ServiceBookingCard
                      key={tour.id}
                      service={tour}
                      onViewDetails={() => onNavigate(AppRoute.TOUR_DETAIL, tour)}
                    />
                ))
             )}
          </div>
       </div>
    </div>
  );
};

export default TourList;
