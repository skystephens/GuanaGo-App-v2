import React, { useEffect, useState } from 'react';
import { ArrowLeft, Package, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';
import { POPULAR_PACKAGES } from '../constants';
import ServiceCatalogCard from '../components/ServiceCatalogCard';
import { getFromCache, saveToCache } from '../services/cacheService';

interface PackageListProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const PackageList: React.FC<PackageListProps> = ({ onBack, onNavigate }) => {
  const [packages, setPackages] = useState<Tour[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async (force = false) => {
    // 1. Caché primero
    if (!force) {
      const cached = getFromCache<Tour[]>('services_turisticos');
      const pkgs = cached?.filter(s => s.category === 'package' && s.active !== false) || [];
      if (pkgs.length > 0) {
        setPackages(pkgs);
        setLoading(false);
        refreshBackground();
        return;
      }
    }

    // 2. Sin caché: cargar desde API
    setLoading(true);
    try {
      const all = await api.services.listPublic();
      const pkgs = all.filter(s => s.category === 'package' && s.active !== false);
      // Si Airtable no tiene paquetes aún, usar los hardcoded como fallback
      setPackages(pkgs.length > 0 ? pkgs : (POPULAR_PACKAGES as unknown as Tour[]));
      if (all.length > 0) saveToCache('services_turisticos', all);
    } catch {
      setPackages(POPULAR_PACKAGES as unknown as Tour[]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBackground = async () => {
    setSyncing(true);
    try {
      const all = await api.services.listPublic();
      const pkgs = all.filter(s => s.category === 'package' && s.active !== false);
      if (pkgs.length > 0) {
        setPackages(pkgs);
        saveToCache('services_turisticos', all);
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-800" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Paquetes Turísticos</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{packages.length} disponibles</span>
          <button
            onClick={() => fetchPackages(true)}
            disabled={syncing || loading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-40"
            title="Sincronizar"
          >
            <RefreshCw size={16} className={`text-gray-500 ${syncing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        <p className="text-sm text-gray-500 mb-6 px-1">
          Encuentra la combinación perfecta de alojamiento y actividades para tu viaje.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">No hay paquetes disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {packages.map(pkg => (
              <ServiceCatalogCard
                key={pkg.id}
                service={pkg}
                onViewDetails={() => onNavigate(AppRoute.PACKAGE_DETAIL, pkg)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageList;
