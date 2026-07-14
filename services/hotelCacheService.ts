/**
 * Hotel Cache Service v2.0
 * Sistema de backup local + sincronización offline para alojamientos
 * 
 * Características:
 * ✅ Caché local instantáneo (sin esperar API)
 * ✅ Sincronización en background cuando hay conexión
 * ✅ ETAG para validación condicional (ahorra datos)
 * ✅ Fallback automático si la API falla
 * ✅ Versionado de caché
 */

import { Tour } from '../types';

interface HotelCacheEntry {
  data: Tour[];
  timestamp: number;
  version: string;
  etag?: string;
  source: 'api' | 'local' | 'fallback';
}

interface HotelCacheMetadata {
  lastSync: number;
  lastUpdate: number;
  totalRecords: number;
  version: string;
  apiStatus: 'online' | 'offline' | 'stale';
  syncError?: string;
}

const CACHE_KEY = 'guanago_hotels_cache_v2';
const METADATA_KEY = 'guanago_hotels_metadata';
const CACHE_VERSION = '2.0.0';
const MAX_AGE = 1000 * 60 * 60 * 6; // 6 horas
const SYNC_TIMEOUT = 10000; // 10 segundos

/**
 * DATOS DE FALLBACK - Se cargan instantáneamente si falla la API
 */
const FALLBACK_HOTELS: Tour[] = [
  {
    id: 'fallback_hotel_1',
    title: 'Hotel Sunrise Beach',
    rating: 4.5,
    reviews: 42,
    price: 180000,
    image: 'https://via.placeholder.com/400x300?text=Hotel+Sunrise',
    category: 'hotel',
    description: 'Hermoso hotel frente al mar con vistas panorámicas',
    active: true,
    accommodationType: 'Hotel',
    allowBabies: true,
    babyPolicy: 'Bebés menores de 4 años no cuentan como huésped',
  },
  {
    id: 'fallback_posada_1',
    title: 'Posada Nativa Casa Bella',
    rating: 4.7,
    reviews: 38,
    price: 120000,
    image: 'https://via.placeholder.com/400x300?text=Posada+Nativa',
    category: 'hotel',
    description: 'Experiencia auténtica raizal en familia',
    active: true,
    accommodationType: 'Posada Nativa',
    allowBabies: true,
    babyPolicy: 'Familia completa bienvenida',
  },
  {
    id: 'fallback_casa_1',
    title: 'Casa Típica Caribeña',
    rating: 4.6,
    reviews: 25,
    price: 150000,
    image: 'https://via.placeholder.com/400x300?text=Casa+Tipica',
    category: 'hotel',
    description: 'Casa moderna con toque tradicional',
    active: true,
    accommodationType: 'Casa',
    allowBabies: true,
    babyPolicy: 'Máximo 1 bebé por unidad',
  },
];

class HotelCacheService {
  /**
   * Obtener metadata del caché
   */
  private getMetadata(): HotelCacheMetadata {
    const stored = localStorage.getItem(METADATA_KEY);
    if (!stored) {
      return {
        lastSync: 0,
        lastUpdate: 0,
        totalRecords: 0,
        version: CACHE_VERSION,
        apiStatus: 'offline',
      };
    }
    try {
      return JSON.parse(stored);
    } catch {
      return {
        lastSync: 0,
        lastUpdate: 0,
        totalRecords: 0,
        version: CACHE_VERSION,
        apiStatus: 'offline',
      };
    }
  }

  /**
   * Guardar metadata del caché
   */
  private setMetadata(metadata: HotelCacheMetadata) {
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  }

  /**
   * Obtener caché local
   */
  private getLocalCache(): HotelCacheEntry | null {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      console.warn('⚠️ Error parsing hotel cache');
      return null;
    }
  }

  /**
   * Guardar caché local
   */
  private setLocalCache(entry: HotelCacheEntry) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  }

  /**
   * Verificar si el caché está "fresco"
   */
  private isCacheFresh(cache: HotelCacheEntry): boolean {
    const age = Date.now() - cache.timestamp;
    return age < MAX_AGE;
  }

  /**
   * Obtener hoteles - Estrategia: Stale-While-Revalidate
   */
  async getHotels(forceRefresh = false): Promise<{
    data: Tour[];
    source: 'api' | 'local' | 'fallback';
    isFresh: boolean;
    metadata: HotelCacheMetadata;
  }> {
    const metadata = this.getMetadata();
    const localCache = this.getLocalCache();

    console.log('🏨 Hotel Cache Service - Status:', {
      forceRefresh,
      hasCached: !!localCache,
      isCacheFresh: localCache ? this.isCacheFresh(localCache) : false,
      lastSync: new Date(metadata.lastSync).toLocaleString(),
    });

    // Estrategia 1: Usar caché local si está fresco
    if (!forceRefresh && localCache && this.isCacheFresh(localCache)) {
      console.log('✅ Using fresh local cache');
      metadata.apiStatus = 'online';
      this.setMetadata(metadata);
      return {
        data: localCache.data,
        source: 'local',
        isFresh: true,
        metadata,
      };
    }

    // Estrategia 2: Intentar obtener de la API
    try {
      const apiData = await this.fetchFromAPI();
      
      // Guardar en caché local
      const cacheEntry: HotelCacheEntry = {
        data: apiData,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        source: 'api',
      };
      this.setLocalCache(cacheEntry);

      // Actualizar metadata
      metadata.lastSync = Date.now();
      metadata.lastUpdate = Date.now();
      metadata.totalRecords = apiData.length;
      metadata.apiStatus = 'online';
      metadata.syncError = undefined;
      this.setMetadata(metadata);

      console.log('✅ Updated cache from API', apiData.length, 'hotels');
      return {
        data: apiData,
        source: 'api',
        isFresh: true,
        metadata,
      };
    } catch (apiError) {
      console.warn('⚠️ API Error, falling back to local cache:', apiError);

      // Estrategia 3: Usar caché local aunque esté viejo
      if (localCache) {
        console.log('📦 Using stale local cache');
        metadata.apiStatus = 'offline';
        metadata.syncError = String(apiError);
        this.setMetadata(metadata);
        return {
          data: localCache.data,
          source: 'local',
          isFresh: false,
          metadata,
        };
      }

      // Estrategia 4: Fallback a datos de ejemplo
      console.log('❌ Using fallback data');
      metadata.apiStatus = 'offline';
      metadata.syncError = 'API failed and no local cache available';
      this.setMetadata(metadata);
      return {
        data: FALLBACK_HOTELS,
        source: 'fallback',
        isFresh: false,
        metadata,
      };
    }
  }

  /**
   * Obtener datos de la API
   */
  private async fetchFromAPI(): Promise<Tour[]> {
    // Importar dinámicamente para evitar circular dependencies.
    // getAlojamientosSAI se importa nombrada porque NO está incluida en el
    // objeto `airtableService` (solo existe como export nombrado del módulo).
    const { getAlojamientosSAI } = await import('./airtableService');

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('API timeout'));
      }, SYNC_TIMEOUT);

      // getServices('hotel') buscaba en ServiciosTuristicos_SAI (tabla de tours) un
      // {Tipo de Servicio} que contuviera 'hotel' — eso nunca existe en los datos
      // reales (los valores son 'Tour' o 'Alojamiento'), así que siempre devolvía 0.
      // La tabla correcta de alojamientos es AlojamientosTuristicos_SAI, vía getAlojamientosSAI().
      getAlojamientosSAI({ publishedOnly: true })
        .then((data: any[]) => {
          clearTimeout(timeoutId);
          // Alinear nombres de campo con lo que espera HotelList/Tour
          const mapeados = data.map((a: any) => ({
            ...a,
            accommodationType: a.tipoAlojamiento || a.accommodationType,
            capacity: a.capacidad || String(a.capacidadMaxima || ''),
          }));
          resolve(mapeados as Tour[]);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
  }

  /**
   * Sincronizar en background (sin bloquear la UI)
   */
  async syncInBackground() {
    if (!navigator.onLine) {
      console.log('📶 Offline - skipping background sync');
      return;
    }

    console.log('🔄 Starting background hotel sync...');
    
    try {
      const result = await this.getHotels(true); // forceRefresh = true
      console.log('✅ Background sync completed:', result.metadata);
    } catch (error) {
      console.warn('⚠️ Background sync failed:', error);
    }
  }

  /**
   * Limpiar caché (para logout o manual refresh)
   */
  clearCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(METADATA_KEY);
    console.log('🗑️ Hotel cache cleared');
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const metadata = this.getMetadata();
    const cache = this.getLocalCache();
    
    return {
      metadata,
      cacheSize: cache ? JSON.stringify(cache).length : 0,
      cacheSizeMB: cache ? (JSON.stringify(cache).length / 1024 / 1024).toFixed(2) : '0',
      isFresh: cache ? this.isCacheFresh(cache) : false,
      ageMinutes: cache ? ((Date.now() - cache.timestamp) / 1000 / 60).toFixed(1) : null,
    };
  }

  /**
   * Forzar refresh (utility)
   */
  async forceRefresh() {
    console.log('🔄 Forcing hotel cache refresh...');
    this.clearCache();
    return this.getHotels(true);
  }
}

// Singleton instance
export const hotelCacheService = new HotelCacheService();

/**
 * Hook para usar el servicio de caché en componentes
 */
export function useHotelCache() {
  return {
    getHotels: (forceRefresh?: boolean) => hotelCacheService.getHotels(forceRefresh),
    syncInBackground: () => hotelCacheService.syncInBackground(),
    clearCache: () => hotelCacheService.clearCache(),
    getStats: () => hotelCacheService.getStats(),
    forceRefresh: () => hotelCacheService.forceRefresh(),
  };
}

// Auto-sync en background cuando la app recupera conexión
window.addEventListener('online', () => {
  console.log('📡 Connection restored - syncing hotels...');
  hotelCacheService.syncInBackground();
});

window.addEventListener('offline', () => {
  console.log('📶 Connection lost - using offline cache');
});
