import React, { useEffect, useState } from 'react';
import { MapPin, Anchor, Bed, Package as PackageIcon, Car, RefreshCw } from 'lucide-react';
import { cachedApi } from '../services/cachedApi';
import { AppRoute, Tour } from '../types';
import { GUANA_LOGO } from '../constants';
import CaribbeanNightSection from '../components/CaribbeanNightSection';
import GuanaPointsSection from '../components/GuanaPointsSection';

interface HomeProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [services, setServices] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | 'fallback'>('cache');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Usar sistema de caché - carga instantánea desde local
      const data = await cachedApi.getServices();
      // Solo mostramos los servicios que están activos
      setServices(data?.filter(s => s.active) || []);
      setDataSource('cache');
    } catch (error) {
      console.error("Error al cargar servicios", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await cachedApi.getServices({ forceRefresh: true });
      setServices(data?.filter(s => s.active) || []);
      setDataSource('api');
    } catch (error) {
      console.error("Error al refrescar", error);
    }
    setIsRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hotel': return <Bed size={10} />;
      case 'package': return <PackageIcon size={10} />;
      case 'tour': return <Anchor size={10} />;
      case 'taxi': return <Car size={10} />;
      default: return <MapPin size={10} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hotel': return 'bg-blue-500';
      case 'package': return 'bg-purple-500';
      case 'tour': return 'bg-green-500';
      case 'taxi': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
     switch (category) {
        case 'hotel': return 'Hotel';
        case 'package': return 'Paquete';
        case 'tour': return 'Tour';
        case 'taxi': return 'Transporte';
        default: return 'Servicio';
     }
  };

  return (
    <div className="pb-24 relative min-h-screen bg-gray-50">
      <header className="px-6 md:px-8 lg:px-12 pt-12 pb-4 bg-white flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="bg-emerald-50 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center p-1 border border-emerald-100 shadow-sm">
              <img src={GUANA_LOGO} alt="Guana Go" className="w-full h-full object-contain" />
           </div>
           <div>
              <h1 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Explora SAI</h1>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-none">Guana Go</h2>
           </div>
         </div>
         {/* Desktop: info adicional */}
         <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
           <span>🌴 San Andrés Isla</span>
           <span className="text-emerald-600 font-semibold">Tu guía turística</span>
         </div>
      </header>

      <div className="px-6 md:px-8 lg:px-12">
        {/* Sección Planifica tu Viaje - Accesos directos a categorías */}
        <div className="mb-8 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-black text-gray-400 uppercase tracking-widest">Planifica tu Viaje</h3>
            <button 
              onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY)}
              className="text-emerald-600 text-xs md:text-sm font-bold hover:underline"
            >
              Ver todo →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <button 
              onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY, { category: 'package' })}
              className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 md:p-6 rounded-2xl text-left shadow-md hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
            >
              <PackageIcon size={24} className="mb-2 md:mb-3" />
              <h4 className="font-bold text-sm md:text-base">Paquetes</h4>
              <p className="text-xs md:text-sm opacity-80">Todo incluido</p>
            </button>
            <button 
              onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY, { category: 'tour' })}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-4 md:p-6 rounded-2xl text-left shadow-md hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
            >
              <Anchor size={24} className="mb-2 md:mb-3" />
              <h4 className="font-bold text-sm md:text-base">Tours</h4>
              <p className="text-xs md:text-sm opacity-80">Explora la isla</p>
            </button>
            <button 
              onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY, { category: 'hotel' })}
              className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 md:p-6 rounded-2xl text-left shadow-md hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
            >
              <Bed size={24} className="mb-2 md:mb-3" />
              <h4 className="font-bold text-sm md:text-base">Alojamientos</h4>
              <p className="text-xs md:text-sm opacity-80">Donde quedarte</p>
            </button>
            <button 
              onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY, { category: 'taxi' })}
              className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-4 md:p-6 rounded-2xl text-left shadow-md hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
            >
              <Car size={24} className="mb-2 md:mb-3" />
              <h4 className="font-bold text-sm md:text-base">Traslados</h4>
              <p className="text-xs md:text-sm opacity-80">Movilidad fácil</p>
            </button>
          </div>
        </div>

        {/* GUANA Points - Preview compacto con link a sección completa */}
        <GuanaPointsSection onNavigate={onNavigate} isAuthenticated={false} userPoints={0} compact={true} />

        {/* RIMM Caribbean Night Section */}
        <CaribbeanNightSection onNavigate={onNavigate} />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-gray-800">Recomendados para ti</h3>
             <div className="flex items-center gap-2">
               <span className={`text-xs px-2 py-1 rounded-full ${
                 dataSource === 'api' ? 'bg-green-100 text-green-700' :
                 dataSource === 'cache' ? 'bg-blue-100 text-blue-700' :
                 'bg-yellow-100 text-yellow-700'
               }`}>
                 {dataSource === 'api' ? '🌐' : dataSource === 'cache' ? '💾' : '📦'}
               </span>
               <button
                 onClick={handleRefresh}
                 disabled={isRefreshing}
                 className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                 title="Actualizar servicios"
               >
                 <RefreshCw size={16} className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
               </button>
             </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
               {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-3xl h-52 md:h-64 animate-pulse border border-gray-100"></div>
               ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-4">
              {services.length > 0 ? services.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col cursor-pointer border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95 group" 
                  onClick={() => {
                     if (item.category === 'hotel') onNavigate(AppRoute.HOTEL_DETAIL, item);
                     else if (item.category === 'package') onNavigate(AppRoute.PACKAGE_DETAIL, item);
                     else onNavigate(AppRoute.TOUR_DETAIL, item);
                  }}
                >
                  <div className="h-32 md:h-40 lg:h-44 w-full relative overflow-hidden">
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                     <div className={`absolute top-2 right-2 ${getCategoryColor(item.category)} text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm`}>
                        {getCategoryIcon(item.category)}
                        <span className="text-[8px] md:text-[10px] font-black uppercase">{getCategoryLabel(item.category)}</span>
                     </div>
                  </div>
                  <div className="p-4 md:p-5 flex flex-col flex-1">
                     <h4 className="font-bold text-gray-800 text-xs md:text-sm leading-tight line-clamp-2 mb-2">{item.title}</h4>
                     <div className="mt-auto flex items-center justify-between">
                        <span className="text-emerald-600 font-black text-sm md:text-base">${item.price.toLocaleString()}</span>
                        <span className="hidden md:inline text-xs text-gray-400">Ver más →</span>
                     </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                       <MapPin size={32} />
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No hay servicios activos</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
