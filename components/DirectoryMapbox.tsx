import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, X, Phone, Clock, Navigation, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { cachedApi } from '../services/cachedApi';
import { FALLBACK_DIRECTORY } from '../services/cacheService';

// Token de Mapbox - usar variable de entorno o token público de demo
// IMPORTANTE: En Render, configurar VITE_MAPBOX_API_KEY en Environment Variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY || 
  'pk.eyJ1Ijoic2t5c2s4aW5nIiwiYSI6ImNqbTc1M2VncDA0a2Iza25vN2x5M29obXcifQ.RoIq-SsDb9l32j8Ydw4d2w';

// Verificar si el token es válido (tiene formato correcto)
const isValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.') && MAPBOX_TOKEN.length > 50;

if (isValidToken) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  console.log('🗺️ Mapbox token configurado:', MAPBOX_TOKEN.substring(0, 30) + '...');
} else {
  console.warn('⚠️ Token de Mapbox no válido. Verifica VITE_MAPBOX_API_KEY en .env.local');
}

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
  [key: string]: any;
}

interface DirectoryMapboxProps {
  activeCategory?: string;
  searchQuery?: string;
}

const DirectoryMapbox: React.FC<DirectoryMapboxProps> = ({ activeCategory = 'Todos', searchQuery = '' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [selectedMarker, setSelectedMarker] = useState<DirectoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Iniciar con datos de fallback inmediatamente para que siempre haya contenido
  const [directoryData, setDirectoryData] = useState<DirectoryItem[]>(FALLBACK_DIRECTORY as DirectoryItem[]);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | 'fallback'>('fallback');
  const [mapError, setMapError] = useState<string | null>(null);

  // San Andrés Isla centro
  const SAN_ANDRES_CENTER: [number, number] = [-81.7006, 12.5847];
  const DEFAULT_ZOOM = 13;

  // Cargar datos del directorio usando el sistema de caché
  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        console.log('📍 Cargando directorio con caché...');
        const data = await cachedApi.getDirectory();
        if (data && data.length > 0) {
          setDirectoryData(data as DirectoryItem[]);
          setDataSource('cache');
          console.log(`✅ Directorio cargado: ${data.length} items`);
        }
      } catch (err) {
        console.log('ℹ️ Usando datos de fallback local:', err);
        setDataSource('fallback');
      }
    };

    loadDirectoryData();
  }, []);

  // Función para refrescar datos manualmente
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await cachedApi.getDirectory({ forceRefresh: true });
      if (data && data.length > 0) {
        setDirectoryData(data as DirectoryItem[]);
        setDataSource('api');
        console.log(`🔄 Datos actualizados: ${data.length} items`);
      }
    } catch (err) {
      console.warn('Error al refrescar:', err);
    }
    setIsRefreshing(false);
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      console.log('🗺️ Initializing Mapbox...');
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: SAN_ANDRES_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      }), 'top-right');

      map.on('load', () => {
        console.log('✅ Map loaded successfully');
        setMapError(null);
        
        // Ocultar etiquetas de POIs (alojamientos, restaurantes, comercios, etc.)
        // Solo mostrar nombres de calles
        const layersToHide = [
          'poi-label',
          'poi-maki',
          'business-label',
          'establishment-label',
          'transit-label',
          'settlement-label',
          'settlement-subdivision-label',
          'water-label',
          'waterway-label'
        ];
        
        layersToHide.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', 'none');
              console.log(`✓ Ocultada capa: ${layerId}`);
            }
          } catch (e) {
            console.log(`ℹ️ Capa no encontrada: ${layerId}`);
          }
        });
      });

      map.on('error', (e) => {
        console.error('❌ Map error:', e);
        setMapError('Error al cargar el mapa');
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error('❌ Failed to initialize map:', err);
      setMapError('No se pudo inicializar el mapa');
    }
  }, []);

  // Obtener color según categoría
  const getCategoryColor = (category: string): string => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('farmacia') || cat.includes('droguería') || cat.includes('salud')) return '#ef4444';
    if (cat.includes('cajero') || cat.includes('banco')) return '#3b82f6';
    if (cat.includes('hotel') || cat.includes('hospedaje') || cat.includes('alojamiento')) return '#10b981';
    if (cat.includes('restaurante') || cat.includes('comida')) return '#f97316';
    if (cat.includes('transporte') || cat.includes('taxi')) return '#8b5cf6';
    if (cat.includes('tienda') || cat.includes('shop')) return '#ec4899';
    if (cat.includes('spa') || cat.includes('bienestar')) return '#14b8a6';
    if (cat.includes('cafe') || cat.includes('cafeteria')) return '#a855f7';
    return '#6b7280';
  };

  // Obtener emoji según categoría
  const getCategoryEmoji = (category: string): string => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('farmacia') || cat.includes('droguería') || cat.includes('salud')) return '💊';
    if (cat.includes('cajero') || cat.includes('banco')) return '💰';
    if (cat.includes('hotel') || cat.includes('hospedaje') || cat.includes('alojamiento')) return '🏨';
    if (cat.includes('restaurante') || cat.includes('comida')) return '🍽️';
    if (cat.includes('transporte') || cat.includes('taxi')) return '🚕';
    if (cat.includes('tienda') || cat.includes('shop')) return '🛍️';
    if (cat.includes('spa') || cat.includes('bienestar')) return '💆';
    if (cat.includes('cafe') || cat.includes('cafeteria')) return '☕';
    if (cat.includes('heladeria')) return '🍦';
    if (cat.includes('gasolinera')) return '⛽';
    if (cat.includes('hospital')) return '🏥';
    if (cat.includes('aeropuerto')) return '✈️';
    if (cat.includes('iglesia')) return '⛪';
    return '📍';
  };

  // Filtrar y agregar marcadores
  useEffect(() => {
    if (!mapRef.current || directoryData.length === 0) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filtrar datos
    const filtered = directoryData.filter((place) => {
      const name = (place.nombre || place.name || '').toLowerCase();
      const category = (place.categoria || place.category || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      
      if (activeCategory === 'Todos') return matchesSearch;
      if (activeCategory === 'Cajero') return matchesSearch && (category.includes('cajero') || category.includes('banco'));
      if (activeCategory === 'Droguería') return matchesSearch && (category.includes('farmacia') || category.includes('droguería'));
      if (activeCategory === 'Restaurante') return matchesSearch && category.includes('restaurante');
      if (activeCategory === 'Hotel') return matchesSearch && (category.includes('hotel') || category.includes('hospedaje') || category.includes('alojamiento'));
      
      return matchesSearch && category.includes(activeCategory.toLowerCase());
    });

    console.log(`📍 Adding ${filtered.length} markers to map`);

    // Agregar marcadores
    filtered.forEach((place) => {
      const lng = place.longitude || place.lng || 0;
      const lat = place.latitude || place.lat || 0;
      
      if (lng === 0 || lat === 0) return;

      const color = getCategoryColor(place.categoria || place.category || '');
      const emoji = getCategoryEmoji(place.categoria || place.category || '');

      // Crear elemento del marcador
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div style="
          background-color: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
          ${emoji}
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedMarker(place);
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 1000
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Ajustar vista si hay marcadores
    if (filtered.length > 0 && markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filtered.forEach((place) => {
        const lng = place.longitude || place.lng || 0;
        const lat = place.latitude || place.lat || 0;
        if (lng !== 0 && lat !== 0) {
          bounds.extend([lng, lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          padding: 60,
          maxZoom: 15,
          duration: 1000
        });
      }
    }
  }, [directoryData, activeCategory, searchQuery]);

  // Abrir en Google Maps
  const openInGoogleMaps = (place: DirectoryItem) => {
    const lat = place.latitude || place.lat || 0;
    const lng = place.longitude || place.lng || 0;
    const name = encodeURIComponent(place.nombre || place.name || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${name}`, '_blank');
  };

  // Si no hay token válido, mostrar mensaje de configuración
  if (!isValidToken) {
    return (
      <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <AlertCircle size={64} className="text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Configurar Mapbox</h3>
          <p className="text-gray-600 text-sm mb-4">
            Para visualizar el mapa, configura tu token de Mapbox en el archivo <code className="bg-gray-200 px-2 py-1 rounded">.env.local</code>
          </p>
          <div className="bg-gray-800 text-green-400 p-4 rounded-xl text-left text-xs font-mono">
            VITE_MAPBOX_API_KEY=pk.eyJ1...
          </div>
          <p className="text-gray-500 text-xs mt-4">
            Obtén tu token gratis en <a href="https://mapbox.com" target="_blank" className="text-emerald-600 underline">mapbox.com</a>
          </p>
          <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-emerald-700 font-bold text-sm">📍 {directoryData.length} lugares disponibles</p>
            <p className="text-emerald-600 text-xs">Los datos están listos, solo falta el mapa</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-emerald-600 font-bold text-sm">Cargando directorio...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 bg-red-50 z-20 flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-bold">{mapError}</p>
            <p className="text-red-400 text-sm mt-2">Verifica tu conexión a internet</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" style={{ minHeight: '400px' }} />

      {/* Contador de puntos y estado del caché */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-700">
          📍 {directoryData.length} lugares
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          dataSource === 'api' ? 'bg-green-100 text-green-700' :
          dataSource === 'cache' ? 'bg-blue-100 text-blue-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {dataSource === 'api' ? '🌐 Online' : 
           dataSource === 'cache' ? '💾 Cache' : 
           '📦 Local'}
        </span>
      </div>

      {/* Botón de refrescar */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="absolute top-3 right-14 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg z-10 hover:bg-white transition-colors disabled:opacity-50"
        title="Actualizar datos"
      >
        <RefreshCw 
          size={18} 
          className={`text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
      </button>

      {/* Modal de detalles */}
      {selectedMarker && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
            <div 
              className="p-6 text-white relative"
              style={{ backgroundColor: getCategoryColor(selectedMarker.categoria || selectedMarker.category || '') }}
            >
              <button
                onClick={() => setSelectedMarker(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/30 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="text-3xl mb-2">{getCategoryEmoji(selectedMarker.categoria || selectedMarker.category || '')}</div>
              <h2 className="text-xl font-black pr-8">{selectedMarker.nombre || selectedMarker.name}</h2>
              <p className="text-[11px] font-bold uppercase opacity-90 tracking-wider mt-1">
                {selectedMarker.categoria || selectedMarker.category}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {(selectedMarker.direccion || selectedMarker.address) && (
                  <div className="flex gap-3 items-start">
                    <MapPin size={16} className="text-emerald-500 flex-shrink-0 mt-1" />
                    <span className="text-sm text-gray-700">{selectedMarker.direccion || selectedMarker.address}</span>
                  </div>
                )}
                {(selectedMarker.telefono || selectedMarker.phone) && (
                  <div className="flex gap-3 items-center">
                    <Phone size={16} className="text-emerald-500 flex-shrink-0" />
                    <a
                      href={`tel:${selectedMarker.telefono || selectedMarker.phone}`}
                      className="text-sm text-emerald-600 font-semibold hover:underline"
                    >
                      {selectedMarker.telefono || selectedMarker.phone}
                    </a>
                  </div>
                )}
                {(selectedMarker.horario || selectedMarker.hours) && (
                  <div className="flex gap-3 items-center">
                    <Clock size={16} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{selectedMarker.horario || selectedMarker.hours}</span>
                  </div>
                )}
              </div>

              {(selectedMarker.descripcion || selectedMarker.description) && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-600">{selectedMarker.descripcion || selectedMarker.description}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => openInGoogleMaps(selectedMarker)}
                  className="flex-1 bg-emerald-600 text-white rounded-2xl py-3 text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation size={14} />
                  Cómo llegar
                </button>
                {(selectedMarker.telefono || selectedMarker.phone) && (
                  <a
                    href={`tel:${selectedMarker.telefono || selectedMarker.phone}`}
                    className="w-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Phone size={18} className="text-gray-600" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryMapbox;
