import React, { useState, useEffect } from 'react';
import { ArrowLeft, BedDouble, Compass, Car, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';
import ServiceCatalogCard from '../components/ServiceCatalogCard';
import { getFromCache, saveToCache } from '../services/cacheService';

interface PlannerProps {
  onNavigate?: (route: AppRoute, data?: any) => void;
  onBack?: () => void;
  initialCategory?: 'hotel' | 'tour' | 'package' | 'taxi';
}

type Tab = 'hotel' | 'tour' | 'taxi';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'hotel', label: 'Alojamientos', icon: <BedDouble size={16} /> },
  { key: 'tour',  label: 'Tours',         icon: <Compass size={16} />   },
  { key: 'taxi',  label: 'Traslados',     icon: <Car size={16} />       },
];

const Planner: React.FC<PlannerProps> = ({ onNavigate, onBack, initialCategory }) => {
  const startTab: Tab =
    initialCategory === 'hotel' ? 'hotel'
    : initialCategory === 'taxi' ? 'taxi'
    : 'tour';

  const [activeTab, setActiveTab] = useState<Tab>(startTab);
  const [allServices, setAllServices] = useState<Tour[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async (force = false) => {
    // 1. Caché primero
    if (!force) {
      const cached = getFromCache<Tour[]>('services_turisticos');
      if (cached && cached.length > 0) {
        setAllServices(cached.filter(s => s.active !== false));
        setLoading(false);
        refreshBackground();
        return;
      }
    }

    // 2. Sin caché: carga desde API
    setLoading(true);
    try {
      const services = await api.services.listPublic();
      const active = services.filter(s => s.active !== false);
      setAllServices(active);
      if (active.length > 0) saveToCache('services_turisticos', active);
    } catch {
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBackground = async () => {
    setSyncing(true);
    try {
      const services = await api.services.listPublic();
      const active = services.filter(s => s.active !== false);
      if (active.length > 0) {
        setAllServices(active);
        saveToCache('services_turisticos', active);
      }
    } finally {
      setSyncing(false);
    }
  };

  const filtered = allServices.filter(s => s.category === activeTab);

  const navigateTo = (service: Tour) => {
    if (!onNavigate) return;
    if (service.category === 'hotel')   onNavigate(AppRoute.HOTEL_DETAIL,   service);
    else if (service.category === 'taxi') onNavigate(AppRoute.TAXI_DETAIL,  service);
    else if (service.category === 'package') onNavigate(AppRoute.PACKAGE_DETAIL, service);
    else onNavigate(AppRoute.TOUR_DETAIL, service);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <ArrowLeft size={20} className="text-gray-800" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">Planifica tu viaje</h1>
              <p className="text-xs text-gray-400">San Andrés Isla</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{filtered.length} disponibles</span>
            <button
              onClick={() => fetchServices(true)}
              disabled={syncing || loading}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-40"
              title="Sincronizar"
            >
              <RefreshCw size={16} className={`text-gray-500 ${syncing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            {activeTab === 'hotel' ? <BedDouble size={48} className="mb-3 opacity-20" />
             : activeTab === 'taxi' ? <Car size={48} className="mb-3 opacity-20" />
             : <Compass size={48} className="mb-3 opacity-20" />}
            <p className="text-sm font-bold">No hay servicios disponibles</p>
            <button
              onClick={() => fetchServices(true)}
              className="mt-3 text-emerald-600 text-sm font-semibold"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {filtered.map(service => (
              <ServiceCatalogCard
                key={service.id}
                service={service}
                onViewDetails={() => navigateTo(service)}
                priceCOP={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Planner;
