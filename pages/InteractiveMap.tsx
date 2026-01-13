/**
 * InteractiveMap - Mapa del Directorio a pantalla completa
 * Con panel deslizable de lista y marcadores interactivos
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Utensils, Pill, DollarSign, Bed, Navigation, 
  Phone, Clock, ChevronRight, X, List, ChevronUp, 
  ChevronDown, ExternalLink, Coffee, ShoppingBag, Waves
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cachedApi } from '../services/cachedApi';
import { FALLBACK_DIRECTORY } from '../services/cacheService';

// Token de Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY || 
  'pk.eyJ1Ijoic2t5c2s4aW5nIiwiYSI6ImNqbTc1M2VncDA0a2Iza25vN2x5M29obXcifQ.RoIq-SsDb9l32j8Ydw4d2w';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface DirectoryItem {
  id: string;
  nombre?: string;
  name?: string;
  categoria?: string;
  category?: string;
  latitude?: number;
  lng?: number;
  longitude?: number;
  lat?: number;
  telefono?: string;
  phone?: string;
  direccion?: string;
  address?: string;
  horario?: string;
  hours?: string;
  descripcion?: string;
  description?: string;
  rating?: number;
  imagen?: string;
  image?: string;
  website?: string;
  [key: string]: any;
}

interface InteractiveMapProps {
  onBack?: () => void;
}

// San Andrés centro
const SAN_ANDRES_CENTER: [number, number] = [-81.7006, 12.5847];

const InteractiveMap: React.FC<InteractiveMapProps> = ({ onBack }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [directoryData, setDirectoryData] = useState<DirectoryItem[]>(FALLBACK_DIRECTORY as DirectoryItem[]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<DirectoryItem | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | 'fallback'>('fallback');

  const categories = [
    { id: 'Todos', icon: <MapPin size={16} />, label: 'Todos' },
    { id: 'Restaurante', icon: <Utensils size={16} />, label: 'Comida' },
    { id: 'Hotel', icon: <Bed size={16} />, label: 'Hoteles' },
    { id: 'Cajero', icon: <DollarSign size={16} />, label: 'Cajeros' },
    { id: 'Droguería', icon: <Pill size={16} />, label: 'Salud' },
    { id: 'Cafetería', icon: <Coffee size={16} />, label: 'Café' },
    { id: 'Tienda', icon: <ShoppingBag size={16} />, label: 'Tiendas' },
    { id: 'Playa', icon: <Waves size={16} />, label: 'Playas' },
  ];

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await cachedApi.getDirectory();
        if (data && data.length > 0) {
          setDirectoryData(data as DirectoryItem[]);
          setDataSource('cache');
        }
      } catch (err) {
        console.log('Usando fallback');
        setDataSource('fallback');
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: SAN_ANDRES_CENTER,
      zoom: 13,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    }), 'top-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Obtener estilo según categoría
  const getCategoryStyle = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('farmacia') || cat.includes('droguería') || cat.includes('salud') || cat.includes('hospital')) 
      return { color: '#ef4444', emoji: '💊', bg: 'bg-red-500' };
    if (cat.includes('cajero') || cat.includes('banco')) 
      return { color: '#3b82f6', emoji: '💰', bg: 'bg-blue-500' };
    if (cat.includes('hotel') || cat.includes('hospedaje') || cat.includes('alojamiento')) 
      return { color: '#10b981', emoji: '🏨', bg: 'bg-emerald-500' };
    if (cat.includes('restaurante') || cat.includes('comida')) 
      return { color: '#f97316', emoji: '🍽️', bg: 'bg-orange-500' };
    if (cat.includes('cafe') || cat.includes('cafetería')) 
      return { color: '#a855f7', emoji: '☕', bg: 'bg-purple-500' };
    if (cat.includes('tienda') || cat.includes('shop')) 
      return { color: '#ec4899', emoji: '🛍️', bg: 'bg-pink-500' };
    if (cat.includes('playa') || cat.includes('beach')) 
      return { color: '#06b6d4', emoji: '🏖️', bg: 'bg-cyan-500' };
    if (cat.includes('transporte') || cat.includes('taxi')) 
      return { color: '#8b5cf6', emoji: '🚕', bg: 'bg-violet-500' };
    if (cat.includes('aeropuerto')) 
      return { color: '#6366f1', emoji: '✈️', bg: 'bg-indigo-500' };
    if (cat.includes('atracción') || cat.includes('turismo')) 
      return { color: '#14b8a6', emoji: '🎯', bg: 'bg-teal-500' };
    return { color: '#6b7280', emoji: '📍', bg: 'bg-gray-500' };
  };

  // Filtrar lugares
  const filteredPlaces = directoryData.filter(place => {
    const name = (place.nombre || place.name || '').toLowerCase();
    const category = (place.categoria || place.category || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || 
                          category.includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'Todos') return matchesSearch;
    if (activeCategory === 'Cajero') return matchesSearch && (category.includes('cajero') || category.includes('banco'));
    if (activeCategory === 'Droguería') return matchesSearch && (category.includes('farmacia') || category.includes('droguería') || category.includes('salud'));
    if (activeCategory === 'Restaurante') return matchesSearch && (category.includes('restaurante') || category.includes('comida'));
    if (activeCategory === 'Hotel') return matchesSearch && (category.includes('hotel') || category.includes('hospedaje'));
    if (activeCategory === 'Cafetería') return matchesSearch && (category.includes('cafe') || category.includes('cafetería'));
    if (activeCategory === 'Tienda') return matchesSearch && category.includes('tienda');
    if (activeCategory === 'Playa') return matchesSearch && category.includes('playa');
    
    return matchesSearch && category.includes(activeCategory.toLowerCase());
  });

  // Actualizar marcadores
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredPlaces.forEach(place => {
      const lng = place.longitude || place.lng || 0;
      const lat = place.latitude || place.lat || 0;
      if (lng === 0 || lat === 0) return;

      const style = getCategoryStyle(place.categoria || place.category || '');
      
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: ${style.color};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
        ">
          ${style.emoji}
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedPlace(place);
        setPanelExpanded(false);
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 800
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [filteredPlaces]);

  // Abrir en Google Maps
  const openInGoogleMaps = (place: DirectoryItem) => {
    const lat = place.latitude || place.lat || 0;
    const lng = place.longitude || place.lng || 0;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  // Seleccionar lugar desde lista
  const handleSelectFromList = (place: DirectoryItem) => {
    const lng = place.longitude || place.lng || 0;
    const lat = place.latitude || place.lat || 0;
    
    setSelectedPlace(place);
    setPanelExpanded(false);
    
    if (mapRef.current && lng !== 0 && lat !== 0) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 800
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header compacto */}
      <header className="bg-white px-4 pt-10 pb-3 shadow-sm z-20">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-xl font-black text-gray-900 flex-1">Mapa</h1>
          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
            dataSource === 'api' ? 'bg-green-100 text-green-700' :
            dataSource === 'cache' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            📍 {filteredPlaces.length} lugares
          </span>
        </div>
        
        {/* Búsqueda */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Mapa a pantalla completa */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0" />
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel deslizable de lista */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] shadow-2xl transition-all duration-300 z-30 ${
          panelExpanded ? 'h-[70vh]' : 'h-auto'
        }`}
      >
        {/* Handle del panel */}
        <button 
          onClick={() => setPanelExpanded(!panelExpanded)}
          className="w-full py-3 flex flex-col items-center"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mb-2"></div>
          <div className="flex items-center gap-2 text-gray-500">
            <List size={16} />
            <span className="text-xs font-bold">{panelExpanded ? 'Cerrar lista' : 'Ver lista de lugares'}</span>
            {panelExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </button>

        {/* Lista expandida */}
        {panelExpanded && (
          <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
            <div className="space-y-2">
              {filteredPlaces.map(place => {
                const style = getCategoryStyle(place.categoria || place.category || '');
                return (
                  <button
                    key={place.id}
                    onClick={() => handleSelectFromList(place)}
                    className="w-full bg-gray-50 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-gray-100 transition-colors active:scale-[0.98]"
                  >
                    <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center text-xl`}>
                      {style.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">
                        {place.nombre || place.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {place.categoria || place.category}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                );
              })}
              
              {filteredPlaces.length === 0 && (
                <div className="py-12 text-center">
                  <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No hay lugares en esta categoría</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview cuando está colapsado */}
        {!panelExpanded && filteredPlaces.length > 0 && (
          <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {filteredPlaces.slice(0, 5).map(place => {
              const style = getCategoryStyle(place.categoria || place.category || '');
              return (
                <button
                  key={place.id}
                  onClick={() => handleSelectFromList(place)}
                  className="flex-shrink-0 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2 text-left hover:bg-gray-100"
                >
                  <span className="text-lg">{style.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate">
                    {place.nombre || place.name}
                  </span>
                </button>
              );
            })}
            {filteredPlaces.length > 5 && (
              <button
                onClick={() => setPanelExpanded(true)}
                className="flex-shrink-0 bg-emerald-50 text-emerald-600 rounded-xl px-3 py-2 text-xs font-bold"
              >
                +{filteredPlaces.length - 5} más
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedPlace && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end justify-center"
          onClick={() => setSelectedPlace(null)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con color */}
            <div 
              className="p-6 text-white relative"
              style={{ backgroundColor: getCategoryStyle(selectedPlace.categoria || selectedPlace.category || '').color }}
            >
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center"
              >
                <X size={18} />
              </button>
              
              <div className="text-4xl mb-3">
                {getCategoryStyle(selectedPlace.categoria || selectedPlace.category || '').emoji}
              </div>
              <h2 className="text-xl font-black pr-10">
                {selectedPlace.nombre || selectedPlace.name}
              </h2>
              <p className="text-sm opacity-80 mt-1">
                {selectedPlace.categoria || selectedPlace.category}
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {(selectedPlace.direccion || selectedPlace.address) && (
                  <div className="flex gap-3 items-start">
                    <MapPin size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{selectedPlace.direccion || selectedPlace.address}</span>
                  </div>
                )}
                {(selectedPlace.telefono || selectedPlace.phone) && (
                  <div className="flex gap-3 items-center">
                    <Phone size={18} className="text-emerald-500 flex-shrink-0" />
                    <a
                      href={`tel:${selectedPlace.telefono || selectedPlace.phone}`}
                      className="text-sm text-emerald-600 font-semibold"
                    >
                      {selectedPlace.telefono || selectedPlace.phone}
                    </a>
                  </div>
                )}
                {(selectedPlace.horario || selectedPlace.hours) && (
                  <div className="flex gap-3 items-center">
                    <Clock size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{selectedPlace.horario || selectedPlace.hours}</span>
                  </div>
                )}
              </div>

              {(selectedPlace.descripcion || selectedPlace.description) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-600">{selectedPlace.descripcion || selectedPlace.description}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => openInGoogleMaps(selectedPlace)}
                  className="flex-1 bg-emerald-600 text-white rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <Navigation size={16} />
                  Cómo llegar
                </button>
                {(selectedPlace.telefono || selectedPlace.phone) && (
                  <a
                    href={`tel:${selectedPlace.telefono || selectedPlace.phone}`}
                    className="w-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200"
                  >
                    <Phone size={20} className="text-gray-600" />
                  </a>
                )}
              </div>

              {/* Botón ver más */}
              <button className="w-full bg-gray-50 text-gray-600 rounded-2xl py-3 text-sm font-medium border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100">
                <ExternalLink size={16} />
                Ver más información
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
