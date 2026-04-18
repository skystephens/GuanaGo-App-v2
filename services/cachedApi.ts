/**
 * GuanaGO Cached API Service
 * Wrapper que integra la API con el sistema de caché local
 * AHORA CON CONEXIÓN DIRECTA A AIRTABLE
 * 
 * Uso:
 *   import { cachedApi } from './services/cachedApi';
 *   const services = await cachedApi.getServices(); // Carga instantánea desde caché
 *   const directory = await cachedApi.getDirectory(); // Datos siempre disponibles
 */

import { api } from './api';
import { airtableService, getAlojamientosSAI } from './airtableService';
import cache, { 
  getDataWithFallback,
  getFromCache,
  initializeCache, 
  needsSync,
  syncAllData,
  FALLBACK_DIRECTORY,
  FALLBACK_SERVICES,
  FALLBACK_TAXI_ZONES,
  FALLBACK_ARTISTS,
  FALLBACK_CARIBBEAN_EVENTS,
  CacheKey
} from './cacheService';
import { Tour, GuanaLocation, TaxiZone } from '../types';

// =========================================================
// 🎯 API CON CACHÉ INTEGRADO + AIRTABLE DIRECTO
// =========================================================

export const cachedApi = {
  /**
   * Obtener servicios turísticos (tours, hoteles, paquetes)
   * AHORA USA AIRTABLE DIRECTAMENTE - sin Make.com
   */
  getServices: async (options?: { forceRefresh?: boolean }): Promise<Tour[]> => {
    try {
      const result = await getDataWithFallback<Tour[]>(
        'services_turisticos',
        async () => {
          const isConfigured = airtableService.isConfigured();
          if (isConfigured) {
            const airtableData = await airtableService.getServices();
            if (airtableData && airtableData.length > 0) {
              return airtableData as unknown as Tour[];
            }
          }
          const data = await api.services.listPublic();
          return data.length > 0 ? data : null;
        },
        options
      );
      return result.data;
    } catch {
      const cached = getFromCache<Tour[]>('services_turisticos');
      return cached ?? FALLBACK_SERVICES;
    }
  },

  /**
   * Obtener directorio del mapa (farmacias, cajeros, restaurantes, etc.)
   * AHORA USA AIRTABLE DIRECTAMENTE
   */
  getDirectory: async (options?: { forceRefresh?: boolean }): Promise<GuanaLocation[]> => {
    try {
      const result = await getDataWithFallback<GuanaLocation[]>(
        'directory_map',
        async () => {
          if (airtableService.isConfigured()) {
            const airtableData = await airtableService.getDirectoryPoints();
            if (airtableData && airtableData.length > 0) {
              return airtableData as unknown as GuanaLocation[];
            }
          }
          const data = await api.directory.getDirectoryMap();
          if (data && data.length > 0) {
            return data.map((item: any) => ({
              id: item.id || item.Id,
              name: item.name || item.nombre || item.Name,
              latitude: parseFloat(item.latitude || item.lat || item.Latitude || 0),
              longitude: parseFloat(item.longitude || item.lng || item.Longitude || 0),
              category: item.category || item.categoria || item.Category || 'General',
              price: item.price || item.precio || 0,
              description: item.description || item.descripcion || '',
              phone: item.phone || item.telefono || '',
              address: item.address || item.direccion || '',
              hours: item.hours || item.horario || '',
              image: item.image || item.imagen || '',
              rating: item.rating || 0
            }));
          }
          return null;
        },
        options
      );
      return result.data;
    } catch {
      const cached = getFromCache<GuanaLocation[]>('directory_map');
      return cached ?? FALLBACK_DIRECTORY;
    }
  },

  /**
   * Obtener zonas de taxi
   */
  getTaxiZones: async (): Promise<TaxiZone[]> => {
    try {
      const result = await getDataWithFallback<TaxiZone[]>(
        'taxi_zones',
        async () => {
          // Por ahora las zonas son estáticas, pero preparado para API
          return FALLBACK_TAXI_ZONES;
        }
      );
      return result.data;
    } catch (error) {
      console.warn('⚠️ Error obteniendo zonas taxi:', error);
      const cached = getFromCache<TaxiZone[]>('taxi_zones');
      if (cached) return cached;
      return FALLBACK_TAXI_ZONES;
    }
  },

  /**
   * Obtener artistas RIMM - Caribbean Night
   * AHORA USA AIRTABLE DIRECTAMENTE (tabla Rimm_musicos)
   */
  getArtists: async (options?: { forceRefresh?: boolean }): Promise<any[]> => {
    try {
      const result = await getDataWithFallback<any[]>(
        'artistas_rimm',
        async () => {
          if (airtableService.isConfigured()) {
            const airtableData = await airtableService.getArtists();
            if (airtableData && airtableData.length > 0) return airtableData;
          }
          const data = await api.rimmArtists.list();
          return data.length > 0 ? data : null;
        },
        options
      );
      return result.data;
    } catch {
      const cached = getFromCache<any[]>('artistas_rimm');
      return cached ?? FALLBACK_ARTISTS;
    }
  },

  /**
   * Obtener eventos Caribbean Night
   */
  getCaribbeanEvents: async (options?: { forceRefresh?: boolean }): Promise<any[]> => {
    try {
      const result = await getDataWithFallback<any[]>(
        'caribbean_events',
        async () => {
          const data = await api.musicEvents.list();
          return data.length > 0 ? data : null;
        },
        options
      );
      return result.data;
    } catch (error) {
      console.warn('⚠️ Error obteniendo eventos:', error);
      const cached = getFromCache<any[]>('caribbean_events');
      if (cached) {
        console.log('📦 Usando caché anterior de eventos');
        return cached;
      }
      return FALLBACK_CARIBBEAN_EVENTS;
    }
  },

  /**
   * Búsqueda en directorio (con caché)
   */
  searchDirectory: async (query: string): Promise<GuanaLocation[]> => {
    const directory = await cachedApi.getDirectory();
    const lowerQuery = query.toLowerCase();
    
    return directory.filter(item => 
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.category?.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Obtener alojamientos desde AlojamientosTuristicos_SAI con caché 48h.
   * Devuelve objetos normalizados compatibles con Tour para lookup en pdfService.
   */
  getAlojamientos: async (options?: { forceRefresh?: boolean }): Promise<any[]> => {
    try {
      const result = await getDataWithFallback<any[]>(
        'alojamientos_sai' as CacheKey,
        async () => {
          const data = await getAlojamientosSAI();
          return data.length > 0 ? data : null;
        },
        options
      );
      return result.data;
    } catch (error) {
      console.warn('⚠️ Error obteniendo alojamientos:', error);
      const cached = getFromCache<any[]>('alojamientos_sai' as CacheKey);
      return cached ?? [];
    }
  },

  /**
   * Filtrar servicios por categoría
   */
  getServicesByCategory: async (category: 'tour' | 'hotel' | 'package'): Promise<Tour[]> => {
    const services = await cachedApi.getServices();
    return services.filter(s => s.category === category);
  },

  /**
   * Obtener directorio por categoría
   */
  getDirectoryByCategory: async (category: string): Promise<GuanaLocation[]> => {
    const directory = await cachedApi.getDirectory();
    return directory.filter(d => 
      d.category?.toLowerCase() === category.toLowerCase()
    );
  }
};

// =========================================================
// 🚀 FUNCIONES DE INICIALIZACIÓN
// =========================================================

/**
 * Inicializar el sistema de caché cuando arranca la app
 * Llamar en App.tsx o index.tsx
 */
export function initializeCachedApi(): void {
  initializeCache();
  if (needsSync(6)) syncInBackground();
}

/**
 * Sincronizar datos en background
 */
async function syncInBackground(): Promise<void> {
  try {
    await syncAllData({
      services_turisticos: () => api.services.listPublic(),
      directory_map: () => api.directory.getDirectoryMap(),
      artistas_rimm: () => api.rimmArtists.list(),
      caribbean_events: () => api.musicEvents.list(),
      taxi_zones: () => Promise.resolve(FALLBACK_TAXI_ZONES),
      user_profile: () => Promise.resolve(null),
      reservations: () => Promise.resolve(null),
      rimm_packages: () => api.rimmPackages.list()
    } as Record<CacheKey, () => Promise<unknown>>);
  } catch { /* silent */ }
}

/**
 * Forzar sincronización de todos los datos
 */
export async function forceFullSync(): Promise<{ success: string[]; failed: string[] }> {
  return syncInBackground().then(() => ({ success: ['all'], failed: [] }));
}

/**
 * Limpiar toda la caché local
 * Útil para forzar recarga de datos frescos desde Airtable
 */
export function clearAllCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('guanago_')) keysToRemove.push(key);
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// =========================================================
// 📤 HOOKS PARA REACT (opcional)
// =========================================================

/**
 * Hook helper para usar en componentes React
 * Ejemplo: const { data, loading, refresh } = useCachedData('directory');
 */
export function createCacheHook<T>(
  key: CacheKey,
  fetcher: () => Promise<T>
): () => { data: T | null; loading: boolean; refresh: () => void } {
  // Este es un helper para crear hooks personalizados
  // La implementación real del hook debe estar en el componente
  return () => ({
    data: cache.get<T>(key),
    loading: false,
    refresh: () => cache.forceRefresh(key, fetcher)
  });
}

export default cachedApi;
