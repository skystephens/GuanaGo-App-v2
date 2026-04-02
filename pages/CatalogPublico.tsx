import React, { useEffect, useState } from 'react';
import {
  Search, Anchor, Bed, Package as PackageIcon, Car, MapPin,
  Tag, RefreshCw, ChevronRight, Star, X
} from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';
import { getFromCache, saveToCache } from '../services/cacheService';
import { GUANA_LOGO } from '../constants';
import { getPrecioB2C, getUnidad } from '../services/pricing';

interface CatalogPublicoProps {
  onNavigate: (route: AppRoute, data?: any) => void;
  onBack?: () => void;
}

type Categoria = 'Todos' | 'tour' | 'hotel' | 'package' | 'taxi';

const CATEGORIAS: { id: Categoria; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Todos',   label: 'Todos',       icon: <MapPin size={14} />,        color: 'bg-gray-800 text-white' },
  { id: 'tour',    label: 'Tours',       icon: <Anchor size={14} />,        color: 'bg-emerald-600 text-white' },
  { id: 'hotel',   label: 'Alojamiento', icon: <Bed size={14} />,           color: 'bg-teal-600 text-white' },
  { id: 'package', label: 'Paquetes',    icon: <PackageIcon size={14} />,   color: 'bg-amber-500 text-white' },
  { id: 'taxi',    label: 'Traslados',   icon: <Car size={14} />,           color: 'bg-yellow-500 text-white' },
];

const BADGE_COLOR: Record<string, string> = {
  tour: 'bg-emerald-600', hotel: 'bg-teal-600', package: 'bg-amber-500', taxi: 'bg-yellow-500',
};

const FALLBACK_IMG: Record<string, string> = {
  tour:    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  hotel:   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  package: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  taxi:    'https://images.unsplash.com/photo-1549924231-f129b911e442?w=600&q=80',
};

// ── Helpers ─────────────────────────────────────────────────────
function capturarPromotor(): string | null {
  // Leer ?ref= de la URL y persistir en sessionStorage
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    sessionStorage.setItem('promotor_ref', ref.toUpperCase());
    return ref.toUpperCase();
  }
  return sessionStorage.getItem('promotor_ref');
}


// ── Componente principal ─────────────────────────────────────────
const CatalogPublico: React.FC<CatalogPublicoProps> = ({ onNavigate, onBack }) => {
  const [services, setServices]     = useState<Tour[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [categoria, setCategoria]   = useState<Categoria>('Todos');
  const [search, setSearch]         = useState('');
  const [promotorRef, setPromotorRef] = useState<string | null>(null);

  // ── Capturar código de promotor al montar ────────────────────
  useEffect(() => {
    setPromotorRef(capturarPromotor());
    fetchServices();
  }, []);

  const fetchServices = async (force = false) => {
    if (!force) {
      const cached = getFromCache<Tour[]>('services_turisticos');
      if (cached && cached.length > 0) {
        setServices(cached.filter(s => s.active !== false));
        setLoading(false);
        refreshBackground();
        return;
      }
    }
    setLoading(true);
    try {
      const all = await api.services.listPublic();
      const activos = (all || []).filter(s => s.active !== false);
      setServices(activos);
      if (all && all.length > 0) saveToCache('services_turisticos', all);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBackground = async () => {
    setSyncing(true);
    try {
      const all = await api.services.listPublic();
      if (all && all.length > 0) {
        setServices(all.filter(s => s.active !== false));
        saveToCache('services_turisticos', all);
      }
    } finally {
      setSyncing(false);
    }
  };

  const limpiarPromotor = () => {
    sessionStorage.removeItem('promotor_ref');
    setPromotorRef(null);
  };

  // ── Filtrado ─────────────────────────────────────────────────
  const filtered = services.filter(s => {
    const matchCat = categoria === 'Todos' || s.category === categoria;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Navegación a detalle ──────────────────────────────────────
  const irADetalle = (service: Tour) => {
    const dataConRef = { ...service, promotorRef };
    if (service.category === 'hotel') onNavigate(AppRoute.HOTEL_DETAIL, dataConRef);
    else if (service.category === 'package') onNavigate(AppRoute.PACKAGE_DETAIL, dataConRef);
    else onNavigate(AppRoute.TOUR_DETAIL, dataConRef);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-5 pt-10 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <ChevronRight size={18} className="rotate-180 text-gray-600" />
            </button>
          )}
          <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center p-1 border border-emerald-100 shadow-sm shrink-0">
            <img src={GUANA_LOGO} alt="GuanaGO" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">San Andrés Isla</p>
            <h1 className="text-lg font-black text-gray-900 leading-none">Catálogo de Experiencias</h1>
          </div>
          <button
            onClick={() => fetchServices(true)}
            disabled={syncing}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw size={15} className={`text-gray-500 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Banner promotor */}
        {promotorRef && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-800">Código promotor activo: <span className="font-black">{promotorRef}</span></span>
            </div>
            <button onClick={limpiarPromotor} className="text-amber-500 hover:text-amber-700">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Buscador */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tours, hoteles, paquetes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-gray-400"
          />
        </div>
      </header>

      {/* ── Filtros de categoría ─────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoria(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all
              ${categoria === cat.id ? cat.color + ' shadow-md scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Indicador de canal ───────────────────────────────────── */}
      <div className="px-5 pb-3 pt-1">
        <p className="text-[11px] text-gray-400">
          Precios incluyen servicio de concierge, coordinación logística y asistencia al viajero.
          {promotorRef && <span className="text-amber-600 font-semibold"> · Reserva con tu promotor activo.</span>}
        </p>
      </div>

      {/* ── Grid de servicios ────────────────────────────────────── */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MapPin size={40} className="mb-3 opacity-30" />
            <p className="font-semibold">Sin resultados</p>
            <p className="text-xs mt-1">Prueba con otra categoría o término</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(service => {
              const cat = service.category || 'tour';
              const img = service.image || FALLBACK_IMG[cat] || FALLBACK_IMG.tour;
              const precioFinal = getPrecioB2C(service);
              const badge = BADGE_COLOR[cat] || 'bg-gray-500';
              const catLabel = CATEGORIAS.find(c => c.id === cat)?.label || 'Servicio';

              return (
                <div
                  key={service.id}
                  onClick={() => irADetalle(service)}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer border border-gray-100 flex flex-col active:scale-[0.98]"
                >
                  {/* Imagen */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={img}
                      alt={service.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG[cat] || FALLBACK_IMG.tour; }}
                    />
                    <div className={`absolute top-3 left-3 ${badge} text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide`}>
                      {catLabel}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold">
                      <Star size={10} fill="currentColor" className="text-yellow-400" />
                      {(service.rating || 4.5).toFixed(1)}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{service.title}</h3>

                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <MapPin size={11} />
                      <span className="truncate">San Andrés Isla</span>
                    </div>

                    {service.description && (
                      <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{service.description}</p>
                    )}

                    {/* Precio */}
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                      <div>
                        {precioFinal > 0 ? (
                          <>
                            <span className="text-emerald-600 font-black text-base">
                              ${precioFinal.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-1">
                              {service.moneda || 'COP'} {getUnidad(cat)}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs font-semibold">Consultar precio</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        Ver más <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer informativo ───────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="px-5 pt-6 pb-2">
          <p className="text-center text-xs text-gray-400">
            {filtered.length} experiencia{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''} · San Andrés Isla, Colombia
          </p>
        </div>
      )}
    </div>
  );
};

export default CatalogPublico;
