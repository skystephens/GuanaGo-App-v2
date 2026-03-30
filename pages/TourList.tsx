import React, { useEffect, useState } from 'react';
import { ArrowLeft, Filter, Anchor, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';
import { POPULAR_TOURS } from '../constants';
import ServiceCatalogCard from '../components/ServiceCatalogCard';
import { getFromCache, saveToCache } from '../services/cacheService';

interface TourListProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const TAGS = ['Todos', 'Acuáticos', 'Culturales', 'Aventura', 'Gastronomía', 'Ecoturismo'];

const TourList: React.FC<TourListProps> = ({ onBack, onNavigate }) => {
  const [tours, setTours]         = useState<Tour[]>([]);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [activeTag, setActiveTag] = useState('Todos');

  useEffect(() => { fetchTours(); }, []);

  const fetchTours = async (force = false) => {
    // 1. Caché primero
    if (!force) {
      const cached = getFromCache<Tour[]>('services_turisticos');
      const tours = cached?.filter(s => s.category === 'tour' && s.active !== false) || [];
      if (tours.length > 0) {
        setTours(tours);
        setLoading(false);
        refreshBackground();
        return;
      }
    }

    // 2. Sin caché: carga desde API
    setLoading(true);
    try {
      const all = await api.services.listPublic();
      const tourServices = all.filter(s => s.category === 'tour' && s.active !== false);
      setTours(tourServices.length > 0 ? tourServices : POPULAR_TOURS);
      if (all.length > 0) saveToCache('services_turisticos', all);
    } catch {
      setTours(POPULAR_TOURS);
    } finally {
      setLoading(false);
    }
  };

  const refreshBackground = async () => {
    setSyncing(true);
    try {
      const all = await api.services.listPublic();
      const tourServices = all.filter(s => s.category === 'tour' && s.active !== false);
      if (tourServices.length > 0) {
        setTours(tourServices);
        saveToCache('services_turisticos', all);
      }
    } finally {
      setSyncing(false);
    }
  };

  const filteredTours = activeTag === 'Todos'
    ? tours
    : tours.filter(t =>
        t.title?.toLowerCase().includes(activeTag.toLowerCase()) ||
        t.description?.toLowerCase().includes(activeTag.toLowerCase())
      );

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft size={20} className="text-gray-800" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Tours y Actividades</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{filteredTours.length} disponibles</span>
            <button
              onClick={() => fetchTours(true)}
              disabled={syncing || loading}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-40"
              title="Sincronizar con Airtable"
            >
              <RefreshCw size={16} className={`text-gray-500 ${syncing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTag === tag
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:border-emerald-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Anchor size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-bold text-center">No hay tours en esta categoría</p>
            {activeTag !== 'Todos' && (
              <button onClick={() => setActiveTag('Todos')} className="mt-3 text-emerald-600 font-semibold text-sm">
                Ver todos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredTours.map(tour => (
              <ServiceCatalogCard
                key={tour.id}
                service={tour}
                onViewDetails={() => onNavigate(AppRoute.TOUR_DETAIL, tour)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourList;
