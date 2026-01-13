
import React, { useEffect, useState } from 'react';
import { Search, MapPin, Anchor, Bed, Package as PackageIcon, ShoppingBag, Car, Map, Utensils, Loader2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';
import { GUANA_LOGO } from '../constants';
import CaribbeanNightSection from '../components/CaribbeanNightSection';

interface HomeProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [services, setServices] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Conexión real con Airtable vía API gestionada por el Admin
      const data = await api.services.listPublic();
      // Solo mostramos los servicios que el Admin marcó como activos
      setServices(data?.filter(s => s.active) || []); 
    } catch (error) {
      console.error("Error al sincronizar con el catálogo central", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      setIsSearching(true);
      const results = await api.directory.search(q);
      if (results && Array.isArray(results)) {
         // Integración de resultados de búsqueda
      }
      setIsSearching(false);
    } else if (q.length === 0) {
       fetchData();
    }
  };

  const filteredServices = services.filter(item => 
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hotel': return <Bed size={10} />;
      case 'package': return <PackageIcon size={10} />;
      case 'tour': return <Anchor size={10} />;
      case 'handicraft': return <ShoppingBag size={10} />;
      case 'taxi': return <Car size={10} />;
      default: return <MapPin size={10} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hotel': return 'bg-blue-500';
      case 'package': return 'bg-purple-500';
      case 'tour': return 'bg-green-500';
      case 'handicraft': return 'bg-orange-500';
      case 'taxi': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
     switch (category) {
        case 'hotel': return 'Hotel';
        case 'package': return 'Paquete';
        case 'tour': return 'Tour';
        case 'handicraft': return 'Tienda';
        case 'taxi': return 'Transporte';
        default: return 'Servicio';
     }
  };

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'package', label: 'Paquetes' },
    { id: 'tour', label: 'Tours' },
    { id: 'hotel', label: 'Hoteles' },
    { id: 'taxi', label: 'Taxis' },
    { id: 'handicraft', label: 'Tienda' }
  ];

  return (
    <div className="pb-24 relative min-h-screen bg-gray-50">
      <header className="px-6 pt-12 pb-4 bg-white flex items-center gap-3">
         <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center p-1 border border-emerald-100 shadow-sm">
            <img src={GUANA_LOGO} alt="Guana Go" className="w-full h-full object-contain" />
         </div>
         <div>
            <h1 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Explora SAI</h1>
            <h2 className="text-xl font-bold text-gray-800 leading-none">Guana Go</h2>
         </div>
      </header>

      <div className="px-6">
        <div className="relative mt-2 mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {isSearching ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <Search size={20} className="text-gray-400" />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Busca experiencias en la isla..."
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
          />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Categorías</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
             {categories.map((cat) => (
               <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat.id)} 
                  className={`px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all shadow-sm border ${
                    selectedCategory === cat.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-100 hover:border-emerald-200'
                  }`}
               >
                  {cat.label}
               </button>
             ))}
          </div>
        </div>

        {/* RIMM Caribbean Night Section */}
        <CaribbeanNightSection onNavigate={onNavigate} />

        <div>
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-gray-800">
                {selectedCategory === 'all' ? 'Recomendados para ti' : `Lo mejor en ${categories.find(c => c.id === selectedCategory)?.label}`}
             </h3>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
               {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-3xl h-52 animate-pulse border border-gray-100"></div>
               ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-4">
              {filteredServices.length > 0 ? filteredServices.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col cursor-pointer border border-gray-100 hover:shadow-md transition-all active:scale-95" 
                  onClick={() => {
                     if (item.category === 'hotel') onNavigate(AppRoute.HOTEL_DETAIL, item);
                     else if (item.category === 'package') onNavigate(AppRoute.PACKAGE_DETAIL, item);
                     else onNavigate(AppRoute.TOUR_DETAIL, item);
                  }}
                >
                  <div className="h-32 w-full relative">
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                     <div className={`absolute top-2 right-2 ${getCategoryColor(item.category)} text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm`}>
                        {getCategoryIcon(item.category)}
                        <span className="text-[8px] font-black uppercase">{getCategoryLabel(item.category)}</span>
                     </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                     <h4 className="font-bold text-gray-800 text-xs leading-tight line-clamp-2 mb-2">{item.title}</h4>
                     <div className="mt-auto">
                        <span className="text-emerald-600 font-black text-sm">${item.price.toLocaleString()}</span>
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
