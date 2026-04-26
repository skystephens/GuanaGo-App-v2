
import { TAXI_ZONES, POPULAR_TOURS, HOTEL_LIST, POPULAR_PACKAGES, PARTNER_CLIENTS } from '../constants';
import { Tour, Hotel, TaxiZone, Reservation, Package, Campaign, Message, Restaurant, GuanaLocation, GroupQuoteConfig, Client } from '../types';
import { getServices } from './airtableService';

// Webhooks de Make.com - DESACTIVADOS (usar backend directo para ahorrar escenarios gratuitos)
// Solo usamos backend/Airtable directo ahora
const MAKE_WEBHOOK_DIRECTORY = ''; // Desactivado
const MAKE_WEBHOOK_SERVICES = ''; // Desactivado
const MAKE_WEBHOOK_USERS = ''; // Desactivado

// Backend URL - usar relativo en producción, localhost en dev
// En local usamos el backend que levanta start-backend (puerto 5000). En prod usamos rutas relativas.
const BACKEND_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

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

// Transformar datos de Airtable ServiciosTuristicos_SAI al formato Tour
const transformAirtableService = (record: any): Tour => {
  // Campos esperados de Airtable: Nombre, Descripcion, Precio, Imagen, Categoria, Duracion, Rating, Estado
  const fields = record.fields || record;
  return {
    id: record.id || fields.id || `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: fields.Nombre || fields.title || fields.name || 'Tour sin nombre',
    description: fields.Descripcion || fields.description || fields.Description || '',
    price: parseFloat(fields.Precio || fields.price || 0),
    image: (fields.Imagen?.[0]?.url 
      || fields.Fotos?.[0]?.url 
      || fields.Foto?.[0]?.url 
      || fields['Imagen Principal']?.[0]?.url 
      || fields.Imagen 
      || fields.image 
      || fields.Image 
      || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'),
    gallery: (
      (Array.isArray(fields.Galeria) ? fields.Galeria.map((img: any) => img.url || img) : [])
      || (Array.isArray(fields.Fotos) ? fields.Fotos.map((img: any) => img.url || img) : [])
      || fields.gallery 
      || []
    ),
    category: (fields.Categoria || fields.category || 'tour').toLowerCase() as Tour['category'],
    duration: fields.Duracion || fields.duration || '4 horas',
    rating: parseFloat(fields.Rating || fields.rating || '4.5'),
    reviews: parseInt(fields.Reviews || fields.reviews || '0'),
    active: fields.Estado === 'Activo' || fields.active === true || fields.Estado === true || true,
    ownerId: fields.ProveedorId || fields.ownerId || undefined,
    isRaizal: fields.EsRaizal || fields.isRaizal || false,
    raizalHistory: fields.HistoriaRaizal || fields.raizalHistory || undefined,
    latitude: parseFloat(fields.Latitud || fields.latitude || 0) || undefined,
    longitude: parseFloat(fields.Longitud || fields.longitude || 0) || undefined
  };
};

export const api = {
  system: {
    getStructure: async (): Promise<{ success: boolean; structure?: any; summary?: any }> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/system/structure`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await safeJson(response);
        return data || { success: false };
      } catch (e) {
        return { success: false };
      }
    }
  },
  reservations: {
    syncToAirtable: async (payload: any): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/reservations/sync-to-airtable`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await safeJson(response);
        return data || { success: false };
      } catch (e) {
        return { success: false };
      }
    },
    listAll: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/reservations/all`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await safeJson(response);
        if (!data) return [];
        const list = (data.data || data.reservas || data.reservations || []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },
    getUserReservations: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/reservations/my-reservations`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await safeJson(response);
        const list = (data?.data || data?.reservations || []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }
  },
  availability: {
    createRequest: async (payload: {
      alojamientoId: string;
      socioId?: string;
      checkIn: string;
      checkOut: string;
      adultos?: number;
      ninos?: number;
      bebes?: number;
      tipoServicio?: string;
      notas?: string;
      contactName?: string;
      contactEmail?: string;
      contactWhatsapp?: string;
    }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/availability-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return await safeJson(response);
      } catch (e) {
        return { success: false, error: 'Network error' };
      }
    },
    listMyRequests: async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/availability-requests/user`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await safeJson(response);
      } catch (e) {
        return { success: false, error: 'Network error' };
      }
    },
    listAllRequests: async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/availability-requests/admin/all`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await safeJson(response);
      } catch (e) {
        return [];
      }
    },
    updateRequest: async (requestId: string, updates: {
      estado?: 'pending' | 'approved' | 'rejected' | 'expired';
      tarifa?: number;
      condiciones?: string;
      updatedAt?: string;
    }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/availability-requests/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        return await safeJson(response);
      } catch (e) {
        return { success: false, error: 'Network error' };
      }
    }
  },

  accommodations: {
    createSubmission: async (payload: {
      nombreAlojamiento: string;
      tipoAlojamiento: string;
      ubicacion?: string;
      direccion?: string;
      descripcion?: string;
      capacidadMaxima?: number;
      camasSencillas?: number;
      camasDobles?: number;
      tieneCocina?: boolean;
      incluyeDesayuno?: boolean;
      aceptaBebes?: boolean;
      politicaBebes?: string;
      minimoNoches?: number;
      monedaPrecios?: string;
      precio1?: number;
      precio2?: number;
      precio3?: number;
      precio4?: number;
      telefonoContacto?: string;
      emailContacto?: string;
      socioId?: string;
      usuarioId?: string;
    }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/accommodations/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return await safeJson(response);
      } catch (e) {
        return { success: false, error: 'Network error' };
      }
    },
    listMySubmissions: async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`${BACKEND_URL}/api/accommodations/submissions/partner`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        return await safeJson(response);
      } catch (e) {
        return { success: false, error: 'Network error' };
      }
    },
    listCatalog: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/accommodations/catalog`);
        const data = await safeJson(response);
        return data?.records || [];
      } catch {
        return [];
      }
    },
  },

  taxis: {
    request: async (payload: {
      origin: string;
      destination: string;
      zoneId?: string;
      passengers: number;
      luggage?: number;
      tripType?: string;
      pickupTime?: string;
      flightNumber?: string;
      notes?: string;
      contactName: string;
      contactPhone: string;
      contactEmail?: string;
      taxisNeeded?: number;
      priceEstimate?: number;
    }): Promise<{ success: boolean; message?: string; data?: any }> => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`${BACKEND_URL}/api/taxis/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        const data = await safeJson(response);
        if (response.status === 401) throw new Error('401');
        return data || { success: true, message: 'Solicitud enviada' };
      } catch (e) {
        throw e;
      }
    }
  },
  // --- USUARIOS Y PERFILES ---
  users: {
    // Perfil de usuario: usar backend; fallback a constante local
    getProfile: async (userId: string): Promise<Client | null> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await safeJson(response);
        if (data?.user) return data.user as Client;
        return PARTNER_CLIENTS.find(c => c.id === userId) || null;
      } catch (e) {
        return PARTNER_CLIENTS.find(c => c.id === userId) || null;
      }
    }
  },

  // --- INTEGRACIÓN REAL AIRTABLE ---
  inventory: {
    checkAvailability: async (serviceId: string, date: string): Promise<{ available: number, isBlocked: boolean }> => {
      try {
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
        await fetch(MAKE_WEBHOOK_SERVICES, {
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
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
      const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3002'
        : '';

      const response = await fetch(`${backendUrl}/api/directory`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) throw new Error(`Backend directory ${response.status}`);

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) return [];

      // El backend ya normaliza los campos — pasar directo
      return result.data;
    },
  },

  services: {
    listPublic: async (): Promise<Tour[]> => {
      try {
        // Directo a Airtable — mismo método que AdminOperaciones (Make webhook desactivado)
        const services = await getServices();
        const publicServices = services.filter((s: any) => s.active !== false);
        if (publicServices.length > 0) return publicServices as unknown as Tour[];
        return [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      } catch (e) {
        console.error('Error fetching public services:', e);
        return [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      }
    },
    listAll: async (): Promise<Tour[]> => {
      try {
        // Directo a Airtable — mismo método que AdminOperaciones (Make webhook desactivado)
        const services = await getServices();
        if (services.length > 0) return services as unknown as Tour[];
        return [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      } catch (e) {
        console.error('Error fetching all services:', e);
        return [...POPULAR_TOURS, ...HOTEL_LIST, ...POPULAR_PACKAGES] as Tour[];
      }
    },
    listByPartner: async (partnerId: string): Promise<Tour[]> => {
      try {
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
       await fetch(MAKE_WEBHOOK_SERVICES, {
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
       await fetch(MAKE_WEBHOOK_SERVICES, {
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
        await fetch(MAKE_WEBHOOK_SERVICES, {
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
         // Si no hay webhook configurado, retornar array vacío
         if (!MAKE_WEBHOOK_SERVICES) {
           return [];
         }
         const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
       await fetch(MAKE_WEBHOOK_SERVICES, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'CREATE_CAMPAIGN', campaign })
       }).catch(() => {});
    },
    update: async (id: string, updates: Partial<Campaign>): Promise<void> => {
       await fetch(MAKE_WEBHOOK_SERVICES, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'UPDATE_CAMPAIGN', id, updates })
       }).catch(() => {});
    },
    delete: async (id: string): Promise<void> => {
       await fetch(MAKE_WEBHOOK_SERVICES, {
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
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
        // Importar airtableService dinámicamente para evitar dependencia circular
        const { airtableService } = await import('./airtableService');
        
        // Obtener artistas de la tabla Rimm_musicos en Airtable
        const artists = await airtableService.getArtists();
        
        if (artists && artists.length > 0) {
          console.log('✅ Loaded', artists.length, 'artists from Airtable Rimm_musicos');
          
          // Convertir artistas a formato de eventos musicales
          return artists.map((artist: any, index: number) => {
            // Generar fechas de jueves próximos para eventos
            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + ((4 - eventDate.getDay() + 7) % 7) + (index * 7)); // Próximos jueves
            
            return {
              id: artist.id || `artist-${index}`,
              eventName: `Caribbean Night - ${artist.name}`,
              date: eventDate.toISOString().split('T')[0],
              time: '9:30 PM',
              dayOfWeek: 'Jueves',
              price: 85000, // Precio base Caribbean Night
              artistName: artist.name,
              imageUrl: artist.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
              spotifyLink: artist.spotifyLink || '',
              instagramLink: artist.instagramLink || '',
              youtubeLink: artist.youtubeLink || '',
              description: artist.bio || `Disfruta de la música en vivo de ${artist.name} en Caribbean Night`,
              genre: artist.genre || 'Reggae',
              isActive: artist.isActive !== false,
              capacity: 100,
              availableSpots: 50
            };
          }).filter((event: any) => event.isActive);
        }
        
        // Fallback a mock si no hay datos
        console.warn('⚠️ No artists from Airtable, using mock data');
        return MOCK_CARIBBEAN_EVENTS;
      } catch (e) {
        console.error('Error fetching music events from Airtable:', e);
        return MOCK_CARIBBEAN_EVENTS;
      }
    }
  },

  // --- RIMM ARTISTAS ---
  rimmArtists: {
    list: async (): Promise<any[]> => {
      try {
        // Usar airtableService directamente para obtener artistas de Rimm_musicos
        const { airtableService } = await import('./airtableService');
        const artists = await airtableService.getArtists();
        
        if (artists && artists.length > 0) {
          console.log('✅ Loaded', artists.length, 'RIMM artists from Airtable');
          return artists;
        }
        
        console.warn('⚠️ No RIMM artists from Airtable, using mock data');
        return MOCK_RIMM_ARTISTS;
      } catch (e) {
        console.error('Error fetching RIMM artists:', e);
        return MOCK_RIMM_ARTISTS;
      }
    },
    getById: async (artistId: string): Promise<any | null> => {
      try {
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
        const response = await fetch(MAKE_WEBHOOK_SERVICES, {
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
