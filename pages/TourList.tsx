
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Filter, Star, Clock, Anchor, MapPin, Users, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';

interface TourListProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const TourList: React.FC<TourListProps> = ({ onBack, onNavigate }) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('Todos');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     setLoading(true);
     setError(null);
     api.services.listPublic()
       .then(allServices => {
         // Filtrar solo tours activos
         const tourServices = allServices.filter(s => s.category === 'tour' && s.active !== false);
         console.log('Tours cargados:', tourServices.length);
         setTours(tourServices);
         setLoading(false);
       })
       .catch(err => {
         console.error('Error cargando tours:', err);
         setError('No se pudieron cargar los tours');
         setLoading(false);
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
                    <div 
                      key={tour.id} 
                      onClick={() => onNavigate(AppRoute.TOUR_DETAIL, tour)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img 
                          src={tour.image} 
                          alt={tour.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400';
                          }}
                        />
                        {/* Badge de rating */}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                          <Star size={14} className="text-yellow-400 fill-current" />
                          <span className="text-sm font-bold text-gray-900">{tour.rating || 4.5}</span>
                        </div>
                        {/* Badge raizal */}
                        {tour.isRaizal && (
                          <div className="absolute top-3 left-3 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                            ⭐ Raizal
                          </div>
                        )}
                        {/* Overlay gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-green-600 transition-colors">
                          {tour.title}
                        </h3>
                        
                        {/* Descripción */}
                        {tour.description && (
                          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                            {tour.description}
                          </p>
                        )}
                        
                        {/* Info row */}
                        <div className="flex flex-wrap items-center gap-3 text-gray-500 text-xs mb-4">
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-green-500" />
                            <span>{tour.duration || '4 horas'}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-green-500" />
                            <span>San Andrés</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-green-500" />
                            <span>Disponible</span>
                          </div>
                        </div>
                        
                        {/* Price and CTA */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <span className="text-xs text-gray-400 block">Desde</span>
                            <span className="text-2xl font-bold text-green-600">
                              ${typeof tour.price === 'number' ? tour.price.toLocaleString('es-CO') : tour.price}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">COP</span>
                          </div>
                          <button className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold group-hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2">
                            <Users size={16} />
                            Reservar
                          </button>
                        </div>
                      </div>
                    </div>
                ))
             )}
          </div>
       </div>
    </div>
  );
};

export default TourList;
