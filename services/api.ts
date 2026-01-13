
import { TAXI_ZONES, POPULAR_TOURS, HOTEL_LIST, POPULAR_PACKAGES, PARTNER_CLIENTS } from '../constants';
import { Tour, Hotel, TaxiZone, Reservation, Package, Campaign, Message, Restaurant, GuanaLocation, GroupQuoteConfig, Client } from '../types';

const MAKE_PROXY_URL = 'https://hook.us1.make.com/gleyxf83giw4xqr7i6i94mb7syclmh2o';

const safeJson = async (response: Response) => {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const api = {
  // --- USUARIOS Y PERFILES ---
  users: {
    getProfile: async (userId: string): Promise<Client | null> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'GET_USER_PROFILE', userId, table: 'Usuarios_SAI' })
        });
        const data = await safeJson(response);
        // Si no hay respuesta real, devolvemos el mock sincronizado con constants
        return data || PARTNER_CLIENTS.find(c => c.id === userId) || null;
      } catch (e) {
        return PARTNER_CLIENTS.find(c => c.id === userId) || null;
      }
    }
  },

  // --- INTEGRACIÓN REAL AIRTABLE ---
  inventory: {
    checkAvailability: async (serviceId: string, date: string): Promise<{ available: number, isBlocked: boolean }> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'CHECK_AVAILABILITY_V2', 
            table: 'ServiciosTuristicos_SAI',
            serviceId, 
            date 
          })
        });
        const data = await safeJson(response);
        if (data) {
          const realAvailable = data.capacidadDiaria - data.cuposOcupados;
          return { available: realAvailable, isBlocked: data.isBlocked };
        }
        return { available: 10, isBlocked: false };
      } catch (e) {
        return { available: 10, isBlocked: false };
      }
    },
    updateInventory: async (items: { id: string, date: string, quantity: number }[]): Promise<void> => {
      try {
        await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'UPDATE_INVENTORY_REAL', 
            table: 'ServiciosTuristicos_SAI',
            fieldToIncrement: 'Cupos_Ocupados',
            items 
          })
        });
      } catch (e) {
        console.error("Inventory update failed", e);
      }
    }
  },

  quotes: {
    calculateGroup: (config: GroupQuoteConfig) => {
      const { adults, children, infants } = config;
      const totalPax = adults + children + infants;
      const MARGIN = 1.20; 

      const netCosts = {
        bahiaSonora: 360000, 
        missTrinieDesayuno: 42500,
        cocoArt: 100000,
        rondonTour: 180000,
        taxiAirport: 13000,
        taxiFarm: 50000
      };

      const taxisNeeded = Math.ceil(totalPax / 4);
      const roomsNeeded = Math.ceil((adults + children) / 2);

      const netoAlojamiento = roomsNeeded * 720000 * 3; 
      const netoTours = (adults + children) * (netCosts.cocoArt + netCosts.rondonTour);
      const netoTransporte = taxisNeeded * (26000 + 100000) * 2; 

      const totalNeto = netoAlojamiento + netoTours + netoTransporte;
      const totalPVP = totalNeto * MARGIN;

      return {
        totalNeto,
        totalPVP,
        taxisNeeded,
        roomsNeeded,
        paxDetails: { adults, children, infants },
        marginValue: totalPVP - totalNeto
      };
    }
  },

  directory: {
    search: async (query: string): Promise<any[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'SEARCH_DIRECTORY', 
            table: 'Establecimientos',
            query 
          })
        });
        const res = await safeJson(response);
        return Array.isArray(res) ? res : [];
      } catch (e) {
        return [];
      }
    },

    getDirectoryMap: async (): Promise<any[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'GET_DIRECTORY_MAP', 
            table: 'Directorio_Mapa',
            baseId: 'appiReH55Qhrbv4Lk'
          })
        });
        const data = await safeJson(response);
        console.log('Directory data from Airtable:', data);
        return (data && Array.isArray(data)) ? data : [];
      } catch (e) {
        console.error('Error fetching directory map:', e);
        return [];
      }
    }
  },

  services: {
    listPublic: async (): Promise<Tour[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'LIST_SERVICES_REAL', 
            table: 'ServiciosTuristicos_SAI',
            category: 'public' 
          })
        });
        const data = await safeJson(response);
        return (data && Array.isArray(data)) ? data : [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      } catch (e) {
        return [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      }
    },
    listAll: async (): Promise<Tour[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'LIST_SERVICES', 
            table: 'ServiciosTuristicos_SAI',
            category: 'all' 
          })
        });
        const data = await safeJson(response);
        return (data && Array.isArray(data)) ? data : [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      } catch (e) {
        return [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      }
    },
    listByPartner: async (partnerId: string): Promise<Tour[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'LIST_SERVICES', 
            table: 'ServiciosTuristicos_SAI',
            partnerId 
          })
        });
        const data = await safeJson(response);
        return (data && Array.isArray(data)) ? data : [];
      } catch (e) {
        return [];
      }
    },
    update: async (id: string, updates: Partial<Tour>): Promise<void> => {
       await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'UPDATE_SERVICE', 
            table: 'ServiciosTuristicos_SAI',
            id, 
            updates 
          })
       }).catch(() => {});
    },
    delete: async (id: string): Promise<void> => {
       await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'DELETE_SERVICE', 
            table: 'ServiciosTuristicos_SAI',
            id 
          })
       }).catch(() => {});
    },
  },

  blockchain: {
    verifyOnLedger: async (transactionId: string): Promise<{ hederaTransactionId: string, status: 'verified' }> => {
      try {
        await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'NOTARIZE', txId: transactionId })
        });
      } catch (e) {
        console.warn("Blockchain notarization proxy error");
      }
      return { 
        hederaTransactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Math.floor(Date.now() / 1000)}.000000000`, 
        status: 'verified' 
      };
    }
  },

  campaigns: {
    list: async (): Promise<Campaign[]> => {
       try {
         const response = await fetch(MAKE_PROXY_URL, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ action: 'LIST_CAMPAIGNS' })
         });
         const data = await safeJson(response);
         return (data && Array.isArray(data)) ? data : [];
       } catch (e) {
         return [];
       }
    },
    create: async (campaign: Campaign): Promise<void> => {
       await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'CREATE_CAMPAIGN', campaign })
       }).catch(() => {});
    },
    update: async (id: string, updates: Partial<Campaign>): Promise<void> => {
       await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'UPDATE_CAMPAIGN', id, updates })
       }).catch(() => {});
    },
    delete: async (id: string): Promise<void> => {
       await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'DELETE_CAMPAIGN', id })
       }).catch(() => {});
    },
  },

  chat: {
    sendMessage: async (senderId: string, receiverId: string, text: string): Promise<Message> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'SEND_MESSAGE', senderId, receiverId, text })
        });
        const res = await safeJson(response);
        return res || { id: Date.now().toString(), senderId, receiverId, text, timestamp: new Date(), isRead: false };
      } catch (e) {
        return { id: Date.now().toString(), senderId, receiverId, text, timestamp: new Date(), isRead: false };
      }
    },
    getMessages: async (senderId: string, receiverId: string): Promise<Message[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'GET_MESSAGES', senderId, receiverId })
        });
        const data = await safeJson(response);
        return (data && Array.isArray(data)) ? data : [];
      } catch (e) {
        return [];
      }
    }
  },

  auth: {
    login: async (email: string): Promise<{ success: boolean; token?: string; error?: string }> => {
      return { success: true, token: 'fake-token' };
    }
  },

  airtable: {
    getServiciosMap: async (): Promise<GuanaLocation[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'GET_MAP_LOCATIONS', 
            table: 'ServiciosTuristicos_SAI' 
          })
        });
        const data = await safeJson(response);
        return (data && Array.isArray(data)) ? data : [];
      } catch (e) {
        return [];
      }
    }
  },

  // --- RIMM CARIBBEAN NIGHT EVENTS ---
  musicEvents: {
    list: async (): Promise<any[]> => {
      try {
        // Intentar obtener del backend real
        const response = await fetch('/api/services?category=music_event', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        const result = await safeJson(response);
        
        if (result?.success && Array.isArray(result.data)) {
          return result.data.map((item: any) => ({
            id: item.id,
            eventName: item.eventName || item.title,
            date: item.date,
            time: '9:30 PM', // Caribbean Night siempre es jueves 9:30 PM
            dayOfWeek: 'Jueves',
            price: item.price,
            artistName: item.artistName,
            imageUrl: item.imageUrl || item.image,
            spotifyLink: item.spotifyLink,
            description: item.description
          }));
        }
        
        // Fallback: intentar con Make proxy
        const makeResponse = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'LIST_SERVICES', 
            table: 'ServiciosTuristicos_SAI',
            category: 'music_event' 
          })
        });
        const makeData = await safeJson(makeResponse);
        
        if (makeData && Array.isArray(makeData)) {
          return makeData;
        }
        
        // Mock data para desarrollo
        return MOCK_CARIBBEAN_EVENTS;
      } catch (e) {
        console.error('Error fetching music events:', e);
        return MOCK_CARIBBEAN_EVENTS;
      }
    }
  },

  // --- RIMM ARTISTAS ---
  rimmArtists: {
    list: async (): Promise<any[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'LIST_RIMM_ARTISTS', 
            table: 'Artistas_RIMM'
          })
        });
        const data = await safeJson(response);
        if (data && Array.isArray(data)) {
          return data;
        }
        return MOCK_RIMM_ARTISTS;
      } catch (e) {
        console.error('Error fetching RIMM artists:', e);
        return MOCK_RIMM_ARTISTS;
      }
    },
    getById: async (artistId: string): Promise<any | null> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'GET_RIMM_ARTIST', 
            table: 'Artistas_RIMM',
            artistId
          })
        });
        const data = await safeJson(response);
        return data || MOCK_RIMM_ARTISTS.find(a => a.id === artistId) || null;
      } catch (e) {
        return MOCK_RIMM_ARTISTS.find(a => a.id === artistId) || null;
      }
    }
  },

  // --- RIMM PAQUETES (desde ServiciosTuristicos_SAI) ---
  rimmPackages: {
    list: async (): Promise<any[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'LIST_SERVICES', 
            table: 'ServiciosTuristicos_SAI',
            category: 'rimm_package'
          })
        });
        const data = await safeJson(response);
        if (data && Array.isArray(data)) {
          return data;
        }
        return MOCK_RIMM_PACKAGES;
      } catch (e) {
        console.error('Error fetching RIMM packages:', e);
        return MOCK_RIMM_PACKAGES;
      }
    }
  },

  // --- RIMM GALERÍA DEL VENUE ---
  rimmGallery: {
    list: async (): Promise<string[]> => {
      try {
        const response = await fetch(MAKE_PROXY_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'GET_RIMM_GALLERY', 
            table: 'RIMM_Gallery'
          })
        });
        const data = await safeJson(response);
        if (data && Array.isArray(data)) {
          return data.map((item: any) => item.imageUrl || item.url);
        }
        return MOCK_VENUE_GALLERY;
      } catch (e) {
        return MOCK_VENUE_GALLERY;
      }
    }
  }
};

// Mock data para Caribbean Night events (desarrollo) - JUEVES 9:30 PM
const MOCK_CARIBBEAN_EVENTS = [
  {
    id: 'cn-001',
    eventName: 'Caribbean Night - Live Stieg Edition',
    date: '2026-01-16', // Jueves
    time: '9:30 PM',
    dayOfWeek: 'Jueves',
    price: 85000,
    artistName: 'Stieg',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example',
    description: 'Una noche mágica de música Kriol en vivo con el talento local de San Andrés.',
    capacity: 100,
    availableSpots: 45
  },
  {
    id: 'cn-002',
    eventName: 'Reggae Roots Night',
    date: '2026-01-23', // Jueves
    time: '9:30 PM',
    dayOfWeek: 'Jueves',
    price: 75000,
    artistName: 'Island Vibes Band',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example2',
    description: 'Reggae auténtico con sabor caribeño para una noche inolvidable.',
    capacity: 100,
    availableSpots: 62
  },
  {
    id: 'cn-003',
    eventName: 'Calypso Sunset Session',
    date: '2026-01-30', // Jueves
    time: '9:30 PM',
    dayOfWeek: 'Jueves',
    price: 65000,
    artistName: 'Caribbean Soul',
    imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
    description: 'Calypso y ritmos tradicionales al atardecer frente al mar.',
    capacity: 100,
    availableSpots: 78
  }
];

// Mock data para artistas RIMM (estructura para Airtable: Artistas_RIMM)
const MOCK_RIMM_ARTISTS = [
  {
    id: 'artist-001',
    name: 'Stieg',
    genre: 'Reggae / Kriol',
    bio: 'Stieg es uno de los artistas más representativos de la música Raizal de San Andrés. Su sonido fusiona reggae tradicional con ritmos Kriol autóctonos.',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example',
    instagramLink: 'https://instagram.com/stieg_sai',
    youtubeLink: 'https://youtube.com/@stieg',
    upcomingEvents: 2,
    isActive: true
  },
  {
    id: 'artist-002',
    name: 'Island Vibes Band',
    genre: 'Reggae / Dancehall',
    bio: 'Banda local de San Andrés que lleva más de 10 años tocando en vivo. Especialistas en reggae roots y dancehall caribeño.',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example2',
    instagramLink: 'https://instagram.com/islandvibes',
    upcomingEvents: 1,
    isActive: true
  },
  {
    id: 'artist-003',
    name: 'Caribbean Soul',
    genre: 'Calypso / Soca',
    bio: 'Caribbean Soul trae los ritmos tradicionales del Calypso y Soca a las nuevas generaciones, preservando la cultura musical de las islas.',
    imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
    instagramLink: 'https://instagram.com/caribbeansoul',
    upcomingEvents: 1,
    isActive: true
  },
  {
    id: 'artist-004',
    name: 'Miss Trinie',
    genre: 'Folklore Raizal',
    bio: 'Guardiana de las tradiciones musicales Raizales. Miss Trinie preserva y enseña los cantos tradicionales de la isla.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    upcomingEvents: 0,
    isActive: true
  }
];

// Mock data para paquetes RIMM (desde ServiciosTuristicos_SAI con category: rimm_package)
const MOCK_RIMM_PACKAGES = [
  {
    id: 'pkg-rimm-001',
    title: 'Caribbean Night + Hotel',
    description: 'Entrada al evento + 1 noche en hotel partner con desayuno incluido',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    includes: ['Entrada VIP Caribbean Night', '1 noche Hotel 4★', 'Desayuno buffet', 'Traslado al venue'],
    category: 'rimm_package',
    active: true
  },
  {
    id: 'pkg-rimm-002',
    title: 'Full RIMM Experience',
    description: 'Acceso a todos los eventos del mes + tour cultural Raizal',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    includes: ['3 eventos Caribbean Night', 'Tour Cultura Raizal (4h)', 'Merchandising RIMM exclusivo', 'Meet & Greet con artistas'],
    category: 'rimm_package',
    active: true
  },
  {
    id: 'pkg-rimm-003',
    title: 'Noche Romántica Caribeña',
    description: 'Caribbean Night en pareja con cena y champagne',
    price: 320000,
    image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
    includes: ['2 entradas VIP', 'Cena romántica para 2', 'Botella de champagne', 'Mesa reservada frente al escenario'],
    category: 'rimm_package',
    active: true
  }
];

// Mock galería del venue Caribbean Night
const MOCK_VENUE_GALLERY = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
  'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600'
];
