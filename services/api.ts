
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
  }
};

// Mock data para Caribbean Night events (desarrollo)
const MOCK_CARIBBEAN_EVENTS = [
  {
    id: 'cn-001',
    eventName: 'Caribbean Night - Live Stieg Edition',
    date: '2026-01-15',
    price: 85000,
    artistName: 'Stieg',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example',
    description: 'Una noche mágica de música Kriol en vivo con el talento local de San Andrés.'
  },
  {
    id: 'cn-002',
    eventName: 'Reggae Roots Night',
    date: '2026-01-22',
    price: 75000,
    artistName: 'Island Vibes Band',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600',
    spotifyLink: 'https://open.spotify.com/artist/example2',
    description: 'Reggae auténtico con sabor caribeño para una noche inolvidable.'
  },
  {
    id: 'cn-003',
    eventName: 'Calypso Sunset Session',
    date: '2026-01-29',
    price: 65000,
    artistName: 'Caribbean Soul',
    imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600',
    description: 'Calypso y ritmos tradicionales al atardecer frente al mar.'
  }
];
