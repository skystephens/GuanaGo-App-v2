/**
 * Airtable Service - Conexión directa a Airtable sin Make.com
 * Usa la API REST oficial de Airtable
 */

// Configuración de Airtable desde variables de entorno
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Debug: Mostrar si las credenciales están configuradas
console.log('🔧 Airtable Config:', {
  hasApiKey: !!AIRTABLE_API_KEY,
  apiKeyLength: AIRTABLE_API_KEY.length,
  hasBaseId: !!AIRTABLE_BASE_ID,
  baseIdValue: AIRTABLE_BASE_ID || '(vacío)'
});

// Nombres de las tablas
const TABLES = {
  DIRECTORIO: 'Directorio_Mapa',
  SERVICIOS: 'ServiciosTuristicos_SAI',
  LEADS: 'Leads',
  RIMM_MUSICOS: 'Rimm_musicos',
  RETOS: 'Retos_GUANA' // Tabla de retos y desafíos
};

// Interfaz para usuario con GUANA Points
export interface GuanaUser {
  id: string;
  guanaId: string;
  nombre: string;
  email: string;
  telefono?: string;
  whatsapp?: string;
  saldoGuana: number;
  puntosAcumulados: number;
  puntosCanjeados: number;
  nivel: 'Explorador' | 'Aventurero' | 'Experto' | 'Leyenda';
  retosCompletados: number;
  qrEscaneados: number;
  fechaRegistro: string;
}

// Interfaz para retos GUANA
export interface GuanaReto {
  id: string;
  titulo: string;
  descripcion: string;
  puntosRecompensa: number;
  tipo: 'qr_scan' | 'ruta' | 'compra' | 'referido' | 'social';
  icono: string;
  activo: boolean;
  vecesCompletado?: number;
  dificultad: 'facil' | 'medio' | 'dificil';
}

// Interfaz genérica para registros de Airtable
interface AirtableRecord<T = any> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableResponse<T = any> {
  records: AirtableRecord<T>[];
  offset?: string;
}

// Headers para las peticiones
const getHeaders = () => ({
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
});

/**
 * Función genérica para obtener registros de cualquier tabla
 */
async function fetchTable<T = any>(
  tableName: string, 
  options: {
    filterByFormula?: string;
    maxRecords?: number;
    view?: string;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
  } = {}
): Promise<AirtableRecord<T>[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable credentials not configured');
    return [];
  }

  try {
    const params = new URLSearchParams();
    
    if (options.filterByFormula) {
      params.append('filterByFormula', options.filterByFormula);
    }
    if (options.maxRecords) {
      params.append('maxRecords', options.maxRecords.toString());
    }
    if (options.view) {
      params.append('view', options.view);
    }
    if (options.sort) {
      options.sort.forEach((s, i) => {
        params.append(`sort[${i}][field]`, s.field);
        params.append(`sort[${i}][direction]`, s.direction);
      });
    }

    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(tableName)}?${params.toString()}`;
    
    console.log(`📡 Fetching from Airtable: ${tableName}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Airtable API Error:', response.status, errorData);
      throw new Error(`Airtable Error: ${response.status}`);
    }

    const data: AirtableResponse<T> = await response.json();
    console.log(`✅ Fetched ${data.records.length} records from ${tableName}`);
    
    return data.records;
  } catch (error) {
    console.error(`❌ Error fetching ${tableName}:`, error);
    throw error;
  }
}

/**
 * Obtener todos los puntos del directorio (Directorio_Mapa)
 */
export async function getDirectoryPoints() {
  const records = await fetchTable(TABLES.DIRECTORIO);
  
  return records.map(record => ({
    id: record.id,
    nombre: record.fields.Nombre || record.fields.nombre || '',
    name: record.fields.Nombre || record.fields.nombre || '',
    categoria: record.fields.Categoria || record.fields.categoria || '',
    category: record.fields.Categoria || record.fields.categoria || '',
    latitude: parseFloat(record.fields.Latitud || record.fields.latitude || record.fields.lat || 0),
    longitude: parseFloat(record.fields.Longitud || record.fields.longitude || record.fields.lng || 0),
    lat: parseFloat(record.fields.Latitud || record.fields.latitude || record.fields.lat || 0),
    lng: parseFloat(record.fields.Longitud || record.fields.longitude || record.fields.lng || 0),
    telefono: record.fields.Telefono || record.fields.telefono || record.fields.Phone || '',
    phone: record.fields.Telefono || record.fields.telefono || record.fields.Phone || '',
    direccion: record.fields.Direccion || record.fields.direccion || record.fields.Address || '',
    address: record.fields.Direccion || record.fields.direccion || record.fields.Address || '',
    horario: record.fields.Horario || record.fields.horario || record.fields.Hours || '',
    hours: record.fields.Horario || record.fields.horario || record.fields.Hours || '',
    descripcion: record.fields.Descripcion || record.fields.descripcion || '',
    description: record.fields.Descripcion || record.fields.descripcion || '',
    imagen: record.fields.Imagen?.[0]?.url || record.fields.imagen || '',
    image: record.fields.Imagen?.[0]?.url || record.fields.imagen || '',
    website: record.fields.Website || record.fields.website || '',
    rating: record.fields.Rating || record.fields.rating || 0,
    ...record.fields
  }));
}

/**
 * Obtener todos los servicios turísticos (Tours, Hoteles, etc.)
 * Ajustado para la estructura real de ServiciosTuristicos_SAI
 */
export async function getServices(category?: string) {
  let filterFormula = '';
  
  if (category && category !== 'all') {
    // Filtrar por tipo de servicio si se especifica
    filterFormula = `FIND('${category}', LOWER({Tipo de Servicio}))`;
  }
  
  const records = await fetchTable(TABLES.SERVICIOS, {
    filterByFormula: filterFormula || undefined
  });
  
  return records.map(record => {
    // Mapeo ajustado a los campos reales de Airtable
    const f = record.fields;
    
    // Determinar categoría basada en "Tipo de Servicio"
    const tipoServicio = (f['Tipo de Servicio'] || '').toLowerCase();
    let category = 'tour';
    if (tipoServicio.includes('hotel')) category = 'hotel';
    else if (tipoServicio.includes('traslado') || tipoServicio.includes('taxi')) category = 'taxi';
    else if (tipoServicio.includes('paquete')) category = 'package';
    
    // Precio: usar "Precio" o "Precio Costo"
    const precio = parseFloat(
      String(f['Precio'] || f['Precio actualizado'] || f['Precio Costo'] || '0')
        .replace(/[^0-9.]/g, '')
    ) || 0;
    
    return {
      id: record.id,
      // Nombre del servicio
      title: f['Servicio'] || f['Nombre alternativo'] || f['Nombre'] || '',
      name: f['Servicio'] || f['Nombre alternativo'] || f['Nombre'] || '',
      nombre: f['Servicio'] || f['Nombre alternativo'] || f['Nombre'] || '',
      
      // Categoría
      category: category,
      categoria: category,
      type: f['Tipo de Servicio'] || 'Tour',
      tipo: f['Tipo de Servicio'] || 'Tour',
      
      // Descripción
      description: f['Descripcion'] || f['Itinerario'] || '',
      descripcion: f['Descripcion'] || f['Itinerario'] || '',
      
      // Precio
      price: precio,
      precio: precio,
      
      // Ubicación (isla: San Andres o Providencia)
      location: f['Ubicacion'] || 'San Andrés',
      ubicacion: f['Ubicacion'] || 'San Andrés',
      isla: f['Ubicacion'] || 'San Andrés',
      
      // Punto de encuentro (solo para reservas confirmadas)
      meetingPoint: f['Punto de encuentro - Lugar de recogida "Pickup at hotel"'] || f['Punto de Encuentro'] || '',
      puntoEncuentro: f['Punto de encuentro - Lugar de recogida "Pickup at hotel"'] || f['Punto de Encuentro'] || '',
      
      // Imágenes
      image: f['Imagen']?.[0]?.url || f['Fotos']?.[0]?.url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      images: f['Imagen']?.map((img: any) => img.url) || f['Fotos']?.map((img: any) => img.url) || [],
      gallery: f['Imagen']?.map((img: any) => img.url) || f['Fotos']?.map((img: any) => img.url) || [],
      
      // Horarios de operación
      schedule: f['Horarios de Operacion'] || f['Horarios de Operación'] || '',
      horario: f['Horarios de Operacion'] || f['Horarios de Operación'] || '',
      operatingHours: f['Horarios de Operacion'] || f['Horarios de Operación'] || '',
      
      // Duración del tour
      duration: f['Duracion'] || f['Duración'] || '',
      duracion: f['Duracion'] || f['Duración'] || '',
      
      // Días de operación
      operatingDays: f['Dias_Operacion'] || f['Dias'] || f['Días'] || '',
      diasOperacion: f['Dias_Operacion'] || f['Dias'] || f['Días'] || '',
      
      // Capacidad
      capacity: parseInt(f['Capacidad'] || '10') || 10,
      capacidad: parseInt(f['Capacidad'] || '10') || 10,
      
      // Qué incluye
      includes: f['que Incluye'] || f['Incluye'] || f['Que Incluye'] || '',
      incluye: f['que Incluye'] || f['Incluye'] || f['Que Incluye'] || '',
      
      // Categoría de actividad (Cultura, Aventura, Relax, etc.)
      activityCategory: f['Categoria'] || '',
      categoriaActividad: f['Categoria'] || '',
      tags: Array.isArray(f['Categoria']) ? f['Categoria'] : (f['Categoria'] ? [f['Categoria']] : []),
      
      // Tipo de servicio (Tour, Alojamiento, Paquete)
      serviceType: f['Tipo de Servicio'] || 'Tour',
      tipoServicio: f['Tipo de Servicio'] || 'Tour',
      
      // Estado
      active: f['Publicado'] === true,
      disponible: f['Publicado'] === true,
      
      // Rating (default alto para tours nuevos)
      rating: parseFloat(f['Rating'] || '4.5') || 4.5,
      reviews: parseInt(f['Reviews'] || '0') || Math.floor(Math.random() * 50) + 10,
      
      // ID interno
      internalId: f['ID'] || record.id,
      
      // Proveedor
      provider: f['Nombre Operador Aliado']?.[0] || 'GuanaGO',
      
      // Spread de campos adicionales
      ...f
    };
  }).filter(s => s.active && (s.ubicacion === 'San Andres' || s.ubicacion === 'San Andrés' || !s.ubicacion)); // Solo servicios publicados de San Andrés
}

/**
 * Obtener solo Tours
 */
export async function getTours() {
  return getServices('tour');
}

/**
 * Obtener solo Hoteles
 */
export async function getHotels() {
  return getServices('hotel');
}

/**
 * Obtener solo Paquetes
 */
export async function getPackages() {
  return getServices('paquete');
}

/**
 * Obtener artistas/músicos de RIMM Caribbean Night
 */
export async function getArtists() {
  const records = await fetchTable(TABLES.RIMM_MUSICOS);
  
  return records.map(record => ({
    id: record.id,
    name: record.fields.Nombre || record.fields.nombre || record.fields.Name || '',
    genre: record.fields.Genero || record.fields.genero || record.fields.Genre || 'Reggae',
    bio: record.fields.Bio || record.fields.bio || record.fields.Biografia || record.fields.Description || '',
    imageUrl: record.fields.Imagen?.[0]?.url || record.fields.imagen || record.fields.Image?.[0]?.url || record.fields.Foto?.[0]?.url || '',
    spotifyLink: record.fields.Spotify || record.fields.spotify || record.fields.SpotifyLink || '',
    instagramLink: record.fields.Instagram || record.fields.instagram || record.fields.InstagramLink || '',
    youtubeLink: record.fields.Youtube || record.fields.youtube || record.fields.YoutubeLink || '',
    upcomingEvents: parseInt(record.fields.EventosProximos || record.fields.UpcomingEvents || '0') || 0,
    isActive: record.fields.Activo !== false && record.fields.Active !== false,
    // Campos adicionales
    pais: record.fields.Pais || record.fields.pais || record.fields.Country || 'Colombia',
    ciudad: record.fields.Ciudad || record.fields.ciudad || record.fields.City || 'San Andrés',
    rating: parseFloat(record.fields.Rating || record.fields.rating || '0') || 0,
    seguidores: parseInt(record.fields.Seguidores || record.fields.Followers || '0') || 0,
    ...record.fields
  }));
}

/**
 * Crear un nuevo lead en Airtable
 */
export async function createLead(leadData: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje?: string;
  origen?: string;
}) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable credentials not configured');
    return null;
  }

  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.LEADS)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            Nombre: leadData.nombre,
            Email: leadData.email,
            Telefono: leadData.telefono || '',
            Mensaje: leadData.mensaje || '',
            Origen: leadData.origen || 'Web App',
            Fecha: new Date().toISOString()
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Error creating lead: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Lead created:', data.records[0].id);
    return data.records[0];
  } catch (error) {
    console.error('❌ Error creating lead:', error);
    throw error;
  }
}

/**
 * Obtener usuario por email o teléfono (desde tabla Leads)
 */
export async function getUserByEmail(email: string): Promise<GuanaUser | null> {
  try {
    const records = await fetchTable(TABLES.LEADS, {
      filterByFormula: `{Email} = '${email}'`,
      maxRecords: 1
    });
    
    if (records.length === 0) return null;
    
    const r = records[0];
    return mapLeadToUser(r);
  } catch (error) {
    console.error('❌ Error getting user:', error);
    return null;
  }
}

/**
 * Obtener usuario por Guana_ID
 */
export async function getUserByGuanaId(guanaId: string): Promise<GuanaUser | null> {
  try {
    const records = await fetchTable(TABLES.LEADS, {
      filterByFormula: `{Guana_ID} = '${guanaId}'`,
      maxRecords: 1
    });
    
    if (records.length === 0) return null;
    
    return mapLeadToUser(records[0]);
  } catch (error) {
    console.error('❌ Error getting user by Guana_ID:', error);
    return null;
  }
}

/**
 * Mapear registro de Lead a usuario GUANA
 */
function mapLeadToUser(record: any): GuanaUser {
  const f = record.fields;
  const saldo = parseFloat(f.Saldo_GUANA || f['Saldo GUANA'] || '0') || 0;
  const acumulados = parseFloat(f.Puntos_Acumulados || f['Puntos Acumulados'] || '0') || 0;
  const canjeados = parseFloat(f.Puntos_Canjeados || f['Puntos Canjeados'] || '0') || 0;
  
  // Determinar nivel basado en puntos acumulados
  let nivel: GuanaUser['nivel'] = 'Explorador';
  if (acumulados >= 5000) nivel = 'Leyenda';
  else if (acumulados >= 2000) nivel = 'Experto';
  else if (acumulados >= 500) nivel = 'Aventurero';
  
  return {
    id: record.id,
    guanaId: f.Guana_ID || f.ID_Usuario || `GUANA-${record.id.substring(0, 8)}`,
    nombre: f.Nombre || f.nombre || '',
    email: f.Email || f.email || '',
    telefono: f.Telefono || f.telefono || f.Phone || '',
    whatsapp: f.WhatsApp || f.Whatsapp || f.Telefono || '',
    saldoGuana: saldo,
    puntosAcumulados: acumulados,
    puntosCanjeados: canjeados,
    nivel: nivel,
    retosCompletados: parseInt(f.Retos_Completados || '0') || 0,
    qrEscaneados: parseInt(f.QR_Escaneados || '0') || 0,
    fechaRegistro: f.Fecha || record.createdTime || new Date().toISOString()
  };
}

/**
 * Registrar nuevo usuario con GUANA Points
 */
export async function registerGuanaUser(userData: {
  nombre: string;
  email: string;
  telefono?: string;
  whatsapp?: string;
}): Promise<GuanaUser | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️ Airtable credentials not configured');
    return null;
  }

  // Generar Guana_ID único
  const guanaId = `GUANA-${Date.now().toString(36).toUpperCase()}`;
  
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.LEADS)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            Nombre: userData.nombre,
            Email: userData.email,
            Telefono: userData.telefono || '',
            WhatsApp: userData.whatsapp || userData.telefono || '',
            Guana_ID: guanaId,
            Saldo_GUANA: 100, // Bonus de bienvenida
            Puntos_Acumulados: 100,
            Puntos_Canjeados: 0,
            Retos_Completados: 0,
            QR_Escaneados: 0,
            Origen: 'App GuanaGO',
            Fecha: new Date().toISOString()
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Error registering user: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ User registered with Guana_ID:', guanaId);
    return mapLeadToUser(data.records[0]);
  } catch (error) {
    console.error('❌ Error registering user:', error);
    throw error;
  }
}

/**
 * Actualizar saldo de GUANA Points
 */
export async function updateGuanaBalance(
  recordId: string, 
  puntos: number, 
  tipo: 'add' | 'subtract'
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    // Primero obtener el saldo actual
    const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.LEADS)}/${recordId}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('User not found');
    
    const data = await response.json();
    const saldoActual = parseFloat(data.fields.Saldo_GUANA || '0') || 0;
    const acumuladosActual = parseFloat(data.fields.Puntos_Acumulados || '0') || 0;
    const canjeadosActual = parseFloat(data.fields.Puntos_Canjeados || '0') || 0;
    
    const nuevoSaldo = tipo === 'add' ? saldoActual + puntos : Math.max(0, saldoActual - puntos);
    
    // Actualizar registro
    const updateResponse = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.LEADS)}/${recordId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: {
          Saldo_GUANA: nuevoSaldo,
          Puntos_Acumulados: tipo === 'add' ? acumuladosActual + puntos : acumuladosActual,
          Puntos_Canjeados: tipo === 'subtract' ? canjeadosActual + puntos : canjeadosActual
        }
      })
    });
    
    if (!updateResponse.ok) throw new Error('Failed to update balance');
    
    console.log(`✅ Balance updated: ${tipo === 'add' ? '+' : '-'}${puntos} GUANA`);
    return true;
  } catch (error) {
    console.error('❌ Error updating balance:', error);
    return false;
  }
}

/**
 * Obtener retos disponibles (mock por ahora, luego de Airtable)
 */
export function getAvailableRetos(): GuanaReto[] {
  // Retos predefinidos - pueden venir de Airtable después
  return [
    {
      id: 'reto-1',
      titulo: 'Primer Check-in',
      descripcion: 'Escanea tu primer QR en un establecimiento',
      puntosRecompensa: 50,
      tipo: 'qr_scan',
      icono: '📍',
      activo: true,
      dificultad: 'facil'
    },
    {
      id: 'reto-2',
      titulo: 'Explorador de Playas',
      descripcion: 'Visita 3 playas diferentes de San Andrés',
      puntosRecompensa: 150,
      tipo: 'ruta',
      icono: '🏖️',
      activo: true,
      dificultad: 'medio'
    },
    {
      id: 'reto-3',
      titulo: 'Foodie Local',
      descripcion: 'Prueba comida en 5 restaurantes del directorio',
      puntosRecompensa: 200,
      tipo: 'qr_scan',
      icono: '🍽️',
      activo: true,
      dificultad: 'medio'
    },
    {
      id: 'reto-4',
      titulo: 'Tour Completo',
      descripcion: 'Completa tu primer tour con GuanaGO',
      puntosRecompensa: 300,
      tipo: 'compra',
      icono: '🚤',
      activo: true,
      dificultad: 'facil'
    },
    {
      id: 'reto-5',
      titulo: 'Embajador Guana',
      descripcion: 'Refiere a un amigo que complete un tour',
      puntosRecompensa: 500,
      tipo: 'referido',
      icono: '🤝',
      activo: true,
      dificultad: 'dificil'
    },
    {
      id: 'reto-6',
      titulo: 'Caribbean Night',
      descripcion: 'Asiste a un evento de Caribbean Night',
      puntosRecompensa: 250,
      tipo: 'compra',
      icono: '🎵',
      activo: true,
      dificultad: 'medio'
    }
  ];
}

/**
 * Servicio principal de Airtable
 */
export const airtableService = {
  // Directorio
  getDirectoryPoints,
  
  // Servicios
  getServices,
  getTours,
  getHotels,
  getPackages,
  
  // RIMM Caribbean Night
  getArtists,
  
  // Leads
  createLead,
  
  // GUANA Points / Usuarios
  getUserByEmail,
  getUserByGuanaId,
  registerGuanaUser,
  updateGuanaBalance,
  getAvailableRetos,
  
  // Acceso genérico a tablas
  fetchTable,
  
  // Configuración
  isConfigured: () => Boolean(AIRTABLE_API_KEY && AIRTABLE_BASE_ID),
  tables: TABLES
};

export default airtableService;
