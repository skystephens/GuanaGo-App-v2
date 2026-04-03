/**
 * GuanaGO Cache Service v2.0
 * Sistema de caché local avanzado para datos de la app
 * Estrategia: Stale-While-Revalidate + Fallback Data
 * 
 * Flujo:
 * 1. Cargar datos de fallback local (instantáneo)
 * 2. Verificar caché de localStorage
 * 3. Si caché fresco → usar caché
 * 4. Si caché viejo → usar caché + actualizar en background
 * 5. Si sin caché → usar fallback + fetch API
 */

import { Tour, GuanaLocation, TaxiZone } from '../types';

// Tipos de datos que se pueden cachear
export type CacheKey = 
  | 'services_turisticos'    // Tours, hoteles, paquetes
  | 'directory_map'          // Puntos del mapa (farmacias, cajeros, restaurantes, etc.)
  | 'artistas_rimm'          // Artistas de Caribbean Night
  | 'taxi_zones'             // Zonas de taxi
  | 'user_profile'           // Perfil del usuario
  | 'reservations'           // Reservaciones del usuario
  | 'caribbean_events'       // Eventos Caribbean Night
  | 'rimm_packages';         // Paquetes RIMM

interface CacheEntry<T> {
  data: T;
  timestamp: number;         // Cuándo se guardó
  version: string;           // Versión del caché
  source: 'api' | 'fallback' | 'local'; // De dónde vino el dato
  etag?: string;             // Para validación condicional
}

interface CacheMetadata {
  lastUpdate: Record<CacheKey, number>;
  appVersion: string;
  lastSync: number;
}

const CACHE_PREFIX = 'guanago_cache_';
const CACHE_VERSION = '2.4.0'; // Fuerza re-fetch: ImagenWP con múltiples URLs separadas por coma
const METADATA_KEY = 'guanago_cache_metadata';

// Tiempo máximo antes de considerar datos "viejos" (en ms)
// ⚠️ Airtable signed URLs (attachments) expiran en ~1 hora — TTL debe ser < 60 min
const MAX_AGE: Record<CacheKey, number> = {
  services_turisticos: 1000 * 60 * 55,        // 55 min — bajo la expiración de URLs de Airtable (~1h)
  directory_map: 1000 * 60 * 55,              // 55 min — mismo motivo (fotos de puntos)
  artistas_rimm: 1000 * 60 * 55,              // 55 min
  taxi_zones: 1000 * 60 * 60 * 24 * 7,       // 7 días (sin imágenes, no cambia)
  user_profile: 1000 * 60 * 30,              // 30 minutos
  reservations: 1000 * 60 * 5,               // 5 minutos (cambian frecuente)
  caribbean_events: 1000 * 60 * 55,           // 55 min
  rimm_packages: 1000 * 60 * 55              // 55 min
};

// =========================================================
// 📦 DATOS DE FALLBACK LOCAL - Se cargan instantáneamente
// =========================================================

export const FALLBACK_DIRECTORY: GuanaLocation[] = [
  // FARMACIAS / DROGUERÍAS
  { id: 'd1', name: 'Droguería Alemana Central', latitude: 12.5847, longitude: -81.7006, category: 'Droguería', price: 0, description: 'Medicamentos y productos de salud', phone: '+57 8 512 3456' },
  { id: 'd2', name: 'Droguería San Andrés', latitude: 12.5810, longitude: -81.7030, category: 'Droguería', price: 0, description: 'Farmacia 24 horas', phone: '+57 8 512 7890' },
  { id: 'd3', name: 'Droguería La Económica', latitude: 12.5820, longitude: -81.6995, category: 'Droguería', price: 0, description: 'Precios accesibles' },
  
  // CAJEROS / BANCOS
  { id: 'd4', name: 'Cajero Bancolombia Peatonal', latitude: 12.5855, longitude: -81.6990, category: 'Cajero', price: 0, description: 'Retiros hasta $3M' },
  { id: 'd5', name: 'Cajero Servibanca Éxito', latitude: 12.5860, longitude: -81.6980, category: 'Cajero', price: 0, description: 'Retiros y depósitos' },
  { id: 'd6', name: 'Banco Davivienda', latitude: 12.5840, longitude: -81.7002, category: 'Cajero', price: 0, description: 'Servicios bancarios completos' },
  { id: 'd7', name: 'Banco Popular Centro', latitude: 12.5850, longitude: -81.7010, category: 'Cajero', price: 0, description: 'Cambio de divisas' },
  
  // RESTAURANTES
  { id: 'd8', name: 'Restaurante La Regatta', latitude: 12.5830, longitude: -81.7015, category: 'Restaurante', price: 45000, description: 'Mariscos y cocina caribeña', rating: 4.7 },
  { id: 'd9', name: 'Café Juan Valdez', latitude: 12.5870, longitude: -81.6970, category: 'Cafetería', price: 15000, description: 'El mejor café colombiano', rating: 4.5 },
  { id: 'd10', name: 'Miss Celia Restaurant', latitude: 12.5565, longitude: -81.7185, category: 'Restaurante', price: 55000, description: 'Gastronomía raizal auténtica', rating: 4.9 },
  { id: 'd11', name: 'Donde Francesca', latitude: 12.5845, longitude: -81.7005, category: 'Restaurante', price: 40000, description: 'Comida italiana y mariscos', rating: 4.6 },
  { id: 'd12', name: 'Restaurante El Muelle', latitude: 12.5836, longitude: -81.7020, category: 'Restaurante', price: 50000, description: 'Vista al mar', rating: 4.4 },
  { id: 'd13', name: 'Capitol Burger', latitude: 12.5852, longitude: -81.6998, category: 'Restaurante', price: 25000, description: 'Las mejores hamburguesas', rating: 4.3 },
  { id: 'd14', name: 'La Pizzería', latitude: 12.5848, longitude: -81.6993, category: 'Restaurante', price: 30000, description: 'Pizza artesanal', rating: 4.2 },
  { id: 'd15', name: 'Niko\'s Seafood', latitude: 12.5842, longitude: -81.7012, category: 'Restaurante', price: 65000, description: 'Mariscos premium', rating: 4.8 },
  
  // HOTELES
  { id: 'd16', name: 'Hotel Sunrise Beach', latitude: 12.5898, longitude: -81.6955, category: 'Hotel', price: 180000, description: 'Frente al mar, piscina', rating: 4.5 },
  { id: 'd17', name: 'Decameron San Luis', latitude: 12.5560, longitude: -81.7190, category: 'Hotel', price: 350000, description: 'All inclusive resort', rating: 4.3 },
  { id: 'd18', name: 'Hotel Arena Blanca', latitude: 12.5880, longitude: -81.6965, category: 'Hotel', price: 150000, description: 'Económico y céntrico', rating: 4.0 },
  { id: 'd19', name: 'Posada Nativa Casa Bella', latitude: 12.5570, longitude: -81.7175, category: 'Hospedaje', price: 90000, description: 'Experiencia raizal', rating: 4.7 },
  { id: 'd20', name: 'Hotel Cocoplum', latitude: 12.5850, longitude: -81.6988, category: 'Hotel', price: 200000, description: 'Playa privada', rating: 4.6 },
  { id: 'd21', name: 'Hotel Sol Caribe', latitude: 12.5565, longitude: -81.7180, category: 'Hotel', price: 280000, description: 'Resort familiar', rating: 4.4 },
  
  // TIENDAS Y COMPRAS
  { id: 'd22', name: 'Centro Comercial New Point', latitude: 12.5843, longitude: -81.6995, category: 'Tienda', price: 0, description: 'Zona duty free' },
  { id: 'd23', name: 'Éxito San Andrés', latitude: 12.5865, longitude: -81.6982, category: 'Supermercado', price: 0, description: 'Supermercado completo' },
  { id: 'd24', name: 'Licores Típicos', latitude: 12.5841, longitude: -81.7008, category: 'Tienda', price: 0, description: 'Ron y licores locales' },
  { id: 'd25', name: 'Artesanías Raizal', latitude: 12.5849, longitude: -81.7001, category: 'Tienda', price: 0, description: 'Souvenirs auténticos' },
  
  // PUNTOS TURÍSTICOS
  { id: 'd26', name: 'Playa Spratt Bight', latitude: 12.5885, longitude: -81.6950, category: 'Playa', price: 0, description: 'Playa principal de la isla' },
  { id: 'd27', name: 'Rocky Cay', latitude: 12.5420, longitude: -81.7050, category: 'Playa', price: 0, description: 'Snorkel natural' },
  { id: 'd28', name: 'Cueva de Morgan', latitude: 12.5280, longitude: -81.7280, category: 'Atracción', price: 18000, description: 'Historia pirata' },
  { id: 'd29', name: 'Hoyo Soplador', latitude: 12.5180, longitude: -81.7350, category: 'Atracción', price: 10000, description: 'Fenómeno natural' },
  { id: 'd30', name: 'Acuario San Andrés', latitude: 12.5580, longitude: -81.7170, category: 'Atracción', price: 20000, description: 'Tour marino' },
  { id: 'd31', name: 'West View', latitude: 12.5250, longitude: -81.7320, category: 'Atracción', price: 15000, description: 'Piscina natural y snorkel' },
  { id: 'd32', name: 'La Piscinita', latitude: 12.5220, longitude: -81.7340, category: 'Atracción', price: 12000, description: 'Peces de colores' },
  
  // TRANSPORTE
  { id: 'd33', name: 'Aeropuerto Gustavo Rojas Pinilla', latitude: 12.5827, longitude: -81.7085, category: 'Transporte', price: 0, description: 'Aeropuerto internacional' },
  { id: 'd34', name: 'Muelle Turístico', latitude: 12.5832, longitude: -81.7028, category: 'Transporte', price: 0, description: 'Lanchas a Johnny Cay' },
  { id: 'd35', name: 'Punto de Mulas', latitude: 12.5855, longitude: -81.6985, category: 'Transporte', price: 0, description: 'Alquiler de motos' },
  
  // SALUD
  { id: 'd36', name: 'Hospital Amor de Patria', latitude: 12.5800, longitude: -81.7050, category: 'Hospital', price: 0, description: 'Urgencias 24h', phone: '+57 8 512 0000' },
  { id: 'd37', name: 'Centro Médico del Caribe', latitude: 12.5835, longitude: -81.7005, category: 'Hospital', price: 0, description: 'Consulta externa' },
  
  // ENTRETENIMIENTO
  { id: 'd38', name: 'RIMM Caribbean Night', latitude: 12.5845, longitude: -81.7010, category: 'Entretenimiento', price: 85000, description: 'Música en vivo caribeña', rating: 4.9 },
  { id: 'd39', name: 'Blue Deep Bar', latitude: 12.5852, longitude: -81.6995, category: 'Bar', price: 30000, description: 'Cócteles y música', rating: 4.5 },
  { id: 'd40', name: 'Coco Loco Beach Bar', latitude: 12.5890, longitude: -81.6960, category: 'Bar', price: 25000, description: 'Bar de playa', rating: 4.6 }
];

export const FALLBACK_SERVICES: Tour[] = [
  {
    id: 't1',
    title: 'Tour de Snorkel en Cayo Bolívar',
    rating: 4.8,
    reviews: 256,
    price: 85000,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
    gallery: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600', 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=600'],
    category: 'tour',
    description: 'Explora los arrecifes de coral más impresionantes del Caribe. Incluye equipo de snorkel, almuerzo típico y bebidas.',
    duration: '6 horas',
    active: true
  },
  {
    id: 't2',
    title: 'Paseo a Johnny Cay',
    rating: 4.9,
    reviews: 412,
    price: 55000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'],
    category: 'tour',
    description: 'Visita la isla más icónica de San Andrés. Playa de arena blanca, música reggae y comida local.',
    duration: '4 horas',
    active: true
  },
  {
    id: 't3',
    title: 'Tour del Acuario y Haynes Cay',
    rating: 4.7,
    reviews: 328,
    price: 70000,
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600',
    gallery: ['https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600'],
    category: 'tour',
    description: 'Nada con mantarrayas y tiburones nodriza en aguas cristalinas. Almuerzo de mariscos incluido.',
    duration: '5 horas',
    active: true
  },
  {
    id: 't4',
    title: 'Tour Vuelta a la Isla',
    rating: 4.6,
    reviews: 189,
    price: 45000,
    image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600',
    gallery: ['https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600'],
    category: 'tour',
    description: 'Recorre todos los puntos turísticos: Hoyo Soplador, Cueva de Morgan, West View, La Piscinita.',
    duration: '4 horas',
    active: true
  },
  {
    id: 't5',
    title: 'Kayak en el Mar de los 7 Colores',
    rating: 4.8,
    reviews: 156,
    price: 65000,
    image: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=600',
    gallery: ['https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=600'],
    category: 'tour',
    description: 'Aventura en kayak por las aguas turquesas de San Andrés. Incluye instructor y refrigerio.',
    duration: '3 horas',
    active: true
  },
  {
    id: 't6',
    title: 'Buceo Certificado 2 Tanques',
    rating: 4.9,
    reviews: 98,
    price: 250000,
    image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600',
    gallery: ['https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600'],
    category: 'tour',
    description: 'Buceo para certificados en los mejores spots: Blue Hole, Trampa Turtle y El Avión.',
    duration: '4 horas',
    active: true
  },
  {
    id: 't7',
    title: 'Tour Gastronómico Raizal',
    rating: 4.7,
    reviews: 87,
    price: 120000,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    gallery: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600'],
    category: 'tour',
    description: 'Degusta los sabores auténticos de la cocina raizal: rondón, crab back, y coconut rice.',
    duration: '3 horas',
    active: true,
    isRaizal: true
  },
  {
    id: 't8',
    title: 'Sunset Catamaran Party',
    rating: 4.8,
    reviews: 234,
    price: 95000,
    image: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=600',
    gallery: ['https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=600'],
    category: 'tour',
    description: 'Fiesta en catamarán con barra libre, DJ y el mejor atardecer del Caribe.',
    duration: '3 horas',
    active: true
  },
  // HOTELES
  {
    id: 'h1',
    title: 'Hotel Boutique del Mar',
    rating: 4.9,
    reviews: 188,
    price: 150000,
    image: 'https://picsum.photos/id/164/800/600',
    category: 'hotel',
    description: 'Estancia de lujo frente al mar con todas las comodidades.',
    active: true
  },
  {
    id: 'h2',
    title: 'Posada Nativa San Luis',
    rating: 4.7,
    reviews: 95,
    price: 90000,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
    category: 'hotel',
    description: 'Experiencia raizal auténtica en San Luis.',
    active: true,
    isRaizal: true
  },
  {
    id: 'h3',
    title: 'Hotel Sol Caribe Campo',
    rating: 4.5,
    reviews: 312,
    price: 280000,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600',
    category: 'hotel',
    description: 'Resort all-inclusive con piscina y playa privada.',
    active: true
  }
];

export const FALLBACK_TAXI_ZONES: TaxiZone[] = [
  { 
    id: 'z1', 
    name: 'Zona 1 - Centro / North End', 
    sectors: 'Centro, North End, El Cliff, Peatonal, Aeropuerto, Spratt Bight',
    priceSmall: 25000,  // 1-4 pasajeros (desde aeropuerto)
    priceLarge: 35000,  // 5+ pasajeros (van/microbús)
    color: 'bg-yellow-400' 
  },
  { 
    id: 'z2', 
    name: 'Zona 2 - San Luis', 
    sectors: 'San Luis, Sound Bay, Rocky Cay, Bahía Sonora',
    priceSmall: 30000,  // desde aeropuerto
    priceLarge: 45000,
    color: 'bg-green-500' 
  },
  { 
    id: 'z3', 
    name: 'Zona 3 - La Loma / El Cove', 
    sectors: 'La Loma, El Cove, Orange Hill, Brooks Hill',
    priceSmall: 40000,  // desde aeropuerto
    priceLarge: 60000,
    color: 'bg-pink-500' 
  },
  { 
    id: 'z4', 
    name: 'Zona 4 - Sur / Punta Sur', 
    sectors: 'Punta Sur, South End, Tom Hooker, El Acuario',
    priceSmall: 70000,  // desde aeropuerto
    priceLarge: 100000,
    color: 'bg-blue-400' 
  },
  { 
    id: 'z5', 
    name: 'Zona 5 - West View / Cove', 
    sectors: 'West View, Cueva de Morgan, Big Pond, Linval',
    priceSmall: 55000,  // desde aeropuerto
    priceLarge: 80000,
    color: 'bg-red-500' 
  }
];

export const FALLBACK_ARTISTS = [
  {
    id: 'artist-001',
    name: 'Stieg',
    genre: 'Reggae / Kriol',
    bio: 'Stieg es uno de los artistas más representativos de la música Raizal de San Andrés.',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example',
    isActive: true
  },
  {
    id: 'artist-002',
    name: 'Island Vibes Band',
    genre: 'Reggae / Dancehall',
    bio: 'Banda local de San Andrés especializada en reggae roots y dancehall.',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    isActive: true
  },
  {
    id: 'artist-003',
    name: 'Caribbean Soul',
    genre: 'Calypso / Soca',
    bio: 'Ritmos tradicionales del Calypso y Soca para las nuevas generaciones.',
    imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
    isActive: true
  }
];

export const FALLBACK_CARIBBEAN_EVENTS = [
  {
    id: 'cn-001',
    eventName: 'Caribbean Night - Live Stieg Edition',
    date: '2026-01-16',
    time: '9:30 PM',
    dayOfWeek: 'Jueves',
    price: 85000,
    artistName: 'Stieg',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    description: 'Música Kriol en vivo con el talento local de San Andrés.',
    capacity: 100,
    availableSpots: 45
  },
  {
    id: 'cn-002',
    eventName: 'Reggae Roots Night',
    date: '2026-01-23',
    time: '9:30 PM',
    dayOfWeek: 'Jueves',
    price: 75000,
    artistName: 'Island Vibes Band',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    description: 'Reggae auténtico con sabor caribeño.',
    capacity: 100,
    availableSpots: 62
  }
];

// =========================================================
// 🔧 FUNCIONES PRINCIPALES DEL CACHE
// =========================================================

/**
 * Obtener datos de fallback local (inmediato, sin red)
 */
export function getFallbackData<T>(key: CacheKey): T | null {
  switch (key) {
    case 'directory_map':
      return FALLBACK_DIRECTORY as unknown as T;
    case 'services_turisticos':
      return FALLBACK_SERVICES as unknown as T;
    case 'taxi_zones':
      return FALLBACK_TAXI_ZONES as unknown as T;
    case 'artistas_rimm':
      return FALLBACK_ARTISTS as unknown as T;
    case 'caribbean_events':
      return FALLBACK_CARIBBEAN_EVENTS as unknown as T;
    default:
      return null;
  }
}

/**
 * Guardar datos en caché
 */
export function saveToCache<T>(key: CacheKey, data: T, source: 'api' | 'fallback' | 'local' = 'api'): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      source
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    updateMetadata(key);
    console.log(`💾 Cache guardado: ${key} (${Array.isArray(data) ? data.length + ' items' : 'object'}) [${source}]`);
    // Notificar a componentes que hay data nueva disponible (solo si viene de API real)
    if (source === 'api') {
      window.dispatchEvent(new CustomEvent('guanago:cache-updated', { detail: { key } }));
    }
  } catch (error) {
    console.warn(`⚠️ Error guardando cache ${key}:`, error);
    // Si localStorage está lleno, limpiar datos viejos
    cleanOldCache();
  }
}

/**
 * Obtener datos del caché local (localStorage)
 */
export function getFromCache<T>(key: CacheKey): T | null {
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);
    
    // Verificar versión
    if (entry.version !== CACHE_VERSION) {
      console.log(`🔄 Cache ${key} tiene versión antigua, ignorando`);
      return null;
    }

    console.log(`📦 Cache cargado: ${key} (${entry.source}, ${getTimeAgo(entry.timestamp)})`);
    return entry.data;
  } catch (error) {
    console.warn(`⚠️ Error leyendo cache ${key}:`, error);
    return null;
  }
}

/**
 * Obtener datos con estrategia inteligente:
 * 1. Si hay caché fresco → retorna caché
 * 2. Si hay caché viejo → retorna caché + actualiza en background
 * 3. Si no hay caché → retorna fallback + intenta API
 */
export async function getDataWithFallback<T>(
  key: CacheKey,
  fetchFromApi: () => Promise<T | null>,
  options?: { forceRefresh?: boolean }
): Promise<{ data: T; source: 'cache' | 'api' | 'fallback'; isStale: boolean }> {
  
  const cached = getFromCache<T>(key);
  const isFresh = isCacheFresh(key);
  const fallback = getFallbackData<T>(key);
  
  // Si hay caché fresco y no forzamos refresh
  if (cached && isFresh && !options?.forceRefresh) {
    console.log(`✅ Usando caché fresco: ${key}`);
    return { data: cached, source: 'cache', isStale: false };
  }
  
  // Si hay caché viejo, lo usamos pero actualizamos en background
  if (cached && !options?.forceRefresh) {
    console.log(`⏳ Usando caché viejo: ${key}, actualizando en background...`);
    
    // Actualizar en background sin bloquear
    fetchFromApi().then(freshData => {
      if (freshData) {
        saveToCache(key, freshData, 'api');
        console.log(`🔄 Cache ${key} actualizado en background`);
      }
    }).catch(err => {
      console.warn(`⚠️ Error actualizando ${key} en background:`, err);
    });
    
    return { data: cached, source: 'cache', isStale: true };
  }
  
  // No hay caché fresco - intentar API
  try {
    console.log(`🌐 Fetching ${key} desde API...`);
    const apiData = await fetchFromApi();
    
    if (apiData) {
      saveToCache(key, apiData, 'api');
      return { data: apiData, source: 'api', isStale: false };
    }
  } catch (error) {
    console.warn(`❌ Error fetching ${key} desde API:`, error);
  }
  
  // PRIORIDAD 1: Caché viejo que tengamos (datos reales de Airtable)
  // Esto asegura que se use la última carga exitosa antes del fallback demo
  if (cached) {
    console.log(`📦 Usando caché anterior (sin API): ${key}`);
    return { data: cached, source: 'cache', isStale: true };
  }
  
  // PRIORIDAD 2: Solo usar fallback demo si NUNCA ha habido datos
  if (fallback) {
    console.log(`🏠 Usando datos demo (primera carga): ${key}`);
    // No guardar fallback en caché para evitar que se confunda con datos reales
    return { data: fallback, source: 'fallback', isStale: true };
  }
  
  throw new Error(`No hay datos disponibles para ${key}`);
}

/**
 * Verificar si el caché está fresco (no expirado)
 */
export function isCacheFresh(key: CacheKey): boolean {
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (!stored) return false;

    const entry: CacheEntry<unknown> = JSON.parse(stored);
    const age = Date.now() - entry.timestamp;
    const maxAge = MAX_AGE[key];

    return age < maxAge;
  } catch {
    return false;
  }
}

/**
 * Obtener información del caché
 */
export function getCacheInfo(key: CacheKey): { 
  exists: boolean; 
  age: string; 
  source: string; 
  itemCount: number;
  isFresh: boolean;
} | null {
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (!stored) return null;

    const entry: CacheEntry<unknown> = JSON.parse(stored);
    const age = Date.now() - entry.timestamp;
    
    return {
      exists: true,
      age: getTimeAgo(entry.timestamp),
      source: entry.source,
      itemCount: Array.isArray(entry.data) ? entry.data.length : 1,
      isFresh: age < MAX_AGE[key]
    };
  } catch {
    return null;
  }
}

/**
 * Invalidar (borrar) un caché específico
 */
export function invalidateCache(key: CacheKey): void {
  localStorage.removeItem(CACHE_PREFIX + key);
  console.log(`🗑️ Cache invalidado: ${key}`);
}

/**
 * Invalidar todo el caché
 */
export function clearAllCache(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem(METADATA_KEY);
  console.log(`🗑️ Todo el cache limpiado (${keys.length} entries)`);
}

/**
 * Obtener estadísticas del caché
 */
export function getCacheStats(): {
  totalSize: string;
  entries: Record<CacheKey, { age: string; items: number; fresh: boolean } | null>;
} {
  const cacheKeys: CacheKey[] = [
    'services_turisticos',
    'directory_map',
    'artistas_rimm',
    'taxi_zones',
    'user_profile',
    'reservations'
  ];

  let totalBytes = 0;
  const entries: Record<string, { age: string; items: number; fresh: boolean } | null> = {};

  cacheKeys.forEach(key => {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (stored) {
      totalBytes += stored.length * 2; // UTF-16
      const info = getCacheInfo(key);
      entries[key] = info ? { age: info.age, items: info.itemCount, fresh: info.isFresh } : null;
    } else {
      entries[key] = null;
    }
  });

  return {
    totalSize: formatBytes(totalBytes),
    entries: entries as Record<CacheKey, { age: string; items: number; fresh: boolean } | null>
  };
}

/**
 * Forzar actualización de un tipo de datos
 */
export async function forceRefresh(key: CacheKey, fetchFunction: () => Promise<unknown>): Promise<void> {
  console.log(`🔄 Forzando actualización de ${key}...`);
  invalidateCache(key);
  try {
    const data = await fetchFunction();
    if (data) {
      saveToCache(key, data, 'api');
    }
  } catch (error) {
    console.error(`❌ Error actualizando ${key}:`, error);
    throw error;
  }
}

// --- Helpers ---

function updateMetadata(key: CacheKey): void {
  try {
    const stored = localStorage.getItem(METADATA_KEY);
    const metadata: CacheMetadata = stored 
      ? JSON.parse(stored) 
      : { lastUpdate: {}, appVersion: CACHE_VERSION };
    
    metadata.lastUpdate[key] = Date.now();
    metadata.appVersion = CACHE_VERSION;
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch {
    // Ignorar errores de metadata
  }
}

function cleanOldCache(): void {
  console.log('🧹 Limpiando cache antiguo...');
  const cacheKeys: CacheKey[] = [
    'services_turisticos',
    'directory_map', 
    'artistas_rimm',
    'taxi_zones',
    'user_profile',
    'reservations'
  ];

  // Borrar los más viejos primero
  const entries = cacheKeys
    .map(key => {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (!stored) return null;
      try {
        const entry: CacheEntry<unknown> = JSON.parse(stored);
        return { key, timestamp: entry.timestamp, size: stored.length };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));

  // Borrar el más viejo
  if (entries.length > 0 && entries[0]) {
    invalidateCache(entries[0].key as CacheKey);
  }
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} horas`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// =========================================================
// 🚀 INICIALIZACIÓN Y SINCRONIZACIÓN
// =========================================================

/**
 * Inicializar el sistema de caché al arrancar la app
 * Precarga datos de fallback en localStorage si no existen
 */
export function initializeCache(): void {
  console.log('🚀 Inicializando sistema de caché GuanaGO...');
  
  const cacheKeys: CacheKey[] = [
    'services_turisticos',
    'directory_map',
    'taxi_zones',
    'artistas_rimm',
    'caribbean_events'
  ];
  
  let initialized = 0;
  
  cacheKeys.forEach(key => {
    const cached = getFromCache(key);
    if (!cached) {
      const fallback = getFallbackData(key);
      if (fallback) {
        saveToCache(key, fallback, 'local');
        initialized++;
      }
    }
  });
  
  console.log(`✅ Cache inicializado: ${initialized} datasets precargados`);
  console.log('📊 Estado del cache:', getCacheStats());
}

/**
 * Sincronizar todos los datos con la API (cuando hay conexión)
 */
export async function syncAllData(apiFetchers: Record<CacheKey, () => Promise<unknown>>): Promise<{
  success: string[];
  failed: string[];
}> {
  console.log('🔄 Sincronizando datos con servidor...');
  
  const success: string[] = [];
  const failed: string[] = [];
  
  for (const [key, fetcher] of Object.entries(apiFetchers)) {
    try {
      const data = await fetcher();
      if (data) {
        saveToCache(key as CacheKey, data, 'api');
        success.push(key);
      }
    } catch (error) {
      console.warn(`❌ Error sincronizando ${key}:`, error);
      failed.push(key);
    }
  }
  
  updateSyncTimestamp();
  console.log(`✅ Sincronización completada: ${success.length} éxito, ${failed.length} fallidos`);
  
  return { success, failed };
}

/**
 * Verificar si es necesario sincronizar (más de X tiempo desde última sync)
 */
export function needsSync(maxAgeHours: number = 6): boolean {
  try {
    const stored = localStorage.getItem(METADATA_KEY);
    if (!stored) return true;
    
    const metadata: CacheMetadata = JSON.parse(stored);
    const hoursSinceSync = (Date.now() - (metadata.lastSync || 0)) / (1000 * 60 * 60);
    
    return hoursSinceSync > maxAgeHours;
  } catch {
    return true;
  }
}

function updateSyncTimestamp(): void {
  try {
    const stored = localStorage.getItem(METADATA_KEY);
    const metadata: CacheMetadata = stored 
      ? JSON.parse(stored) 
      : { lastUpdate: {}, appVersion: CACHE_VERSION, lastSync: 0 };
    
    metadata.lastSync = Date.now();
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch {
    // Ignorar errores
  }
}

// =========================================================
// 📤 EXPORTACIÓN
// =========================================================

export default {
  // Core
  save: saveToCache,
  get: getFromCache,
  getWithFallback: getDataWithFallback,
  getFallback: getFallbackData,
  
  // Estado
  isFresh: isCacheFresh,
  getInfo: getCacheInfo,
  getStats: getCacheStats,
  
  // Gestión
  invalidate: invalidateCache,
  clearAll: clearAllCache,
  forceRefresh,
  
  // Inicialización
  initialize: initializeCache,
  syncAll: syncAllData,
  needsSync,
  
  // Datos de fallback
  fallback: {
    directory: FALLBACK_DIRECTORY,
    services: FALLBACK_SERVICES,
    taxiZones: FALLBACK_TAXI_ZONES,
    artists: FALLBACK_ARTISTS,
    events: FALLBACK_CARIBBEAN_EVENTS
  }
};
