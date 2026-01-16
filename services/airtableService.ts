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
  // Sistema de Usuarios y Empresas
  USUARIOS: 'Leads',              // Tabla Leads renombrada conceptualmente a Usuarios
  LEADS: 'Leads',                 // Alias legacy para compatibilidad
  EMPRESAS: 'Directorio_Mapa',    // Directorio_Mapa también funciona como Empresas/Aliados
  DIRECTORIO: 'Directorio_Mapa',  // Alias para el mapa
  
  // Servicios turísticos
  SERVICIOS: 'ServiciosTuristicos_SAI',
  
  // RIMM Caribbean Night
  RIMM_MUSICOS: 'Rimm_musicos',
  
  // Sistema GUANA Points
  RETOS: 'Retos_GUANA',
  TRANSACCIONES: 'GUANA_Transacciones',
  
  // Gestión de artistas y NFTs
  ARTISTAS_PORTAFOLIO: 'Artistas_Portafolio',
  PRODUCTOS_ARTISTA: 'Productos_Artista',
  VENTAS_ARTISTA: 'Ventas_Artista'
};

import type { GuanaUser, UserRole, EstablishmentType } from '../types';

// Interfaz para Empresa/Aliado (tabla Directorio_Mapa)
export interface GuanaEmpresa {
  id: string;
  nombre: string;
  categoria: string;                   // Hotel, Restaurante, etc.
  
  // Ubicación
  latitud: number;
  longitud: number;
  direccion: string;
  
  // Contacto
  telefono?: string;
  email?: string;
  website?: string;
  horario?: string;
  
  // Media
  imagen?: string;
  descripcion?: string;
  rating?: number;
  
  // Datos de Aliado GuanaGO (campos nuevos)
  responsableId?: string;              // Link a Leads/Usuarios
  responsableNombre?: string;          // Nombre del contacto
  rnt?: string;                        // Registro Nacional de Turismo
  camaraComercio?: string;             // NIT
  esAliadoGuanaGO: boolean;            // Tiene convenio activo
  comisionPactada?: number;            // % que paga a GuanaGO
  saldoPuntosEmpresa?: number;         // GUANA Points de la empresa
  estadoAliado: 'prospecto' | 'activo' | 'pausado' | 'inactivo';
  walletHedera?: string;               // Para pagos crypto
  
  // Metadata
  fechaRegistro?: string;
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

// =========================================================
// 🔗 GUANA POINTS - TRANSACCIONES CON SOPORTE HEDERA
// =========================================================

// Tipos de transacción
export type TransactionType = 'ganado' | 'canjeado' | 'bono' | 'expirado' | 'transferido';

// Conceptos de transacción
export type TransactionConcept = 
  | 'reto_qr' 
  | 'compra_tour' 
  | 'referido' 
  | 'bienvenida' 
  | 'canje_descuento' 
  | 'canje_premio'
  | 'reto_ruta'
  | 'reto_social'
  | 'bonus_especial'
  | 'correccion';

// Estado de blockchain
export type BlockchainStatus = 'pending' | 'confirmed' | 'failed' | 'not_required';

// Interfaz para transacciones GUANA Points
export interface GuanaTransaction {
  id: string;                          // ID del registro en Airtable
  idTransaccion: string;               // ID legible (TXN-XXXX)
  guanaId: string;                     // ID del usuario
  usuarioNombre?: string;              // Nombre del usuario (para display)
  tipo: TransactionType;               // ganado, canjeado, etc.
  monto: number;                       // Cantidad de puntos
  saldoAnterior: number;               // Saldo antes
  saldoNuevo: number;                  // Saldo después
  concepto: TransactionConcept;        // reto_qr, compra_tour, etc.
  descripcion: string;                 // Detalle legible
  retoId?: string;                     // Link a reto (si aplica)
  servicioId?: string;                 // Link a servicio (si aplica)
  fecha: string;                       // ISO timestamp
  validado: boolean;                   // Confirmado
  
  // Campos Hedera Hashgraph
  hederaTxHash?: string;               // Hash de transacción en Hedera
  hederaConsensusTimestamp?: string;   // Timestamp de consenso Hedera
  hederaTokenId?: string;              // Token ID (0.0.XXXXX)
  blockchainStatus: BlockchainStatus;  // Estado de sync con blockchain
  blockchainMemo?: string;             // Metadata/memo en blockchain
}

// Datos para crear una nueva transacción
export interface CreateTransactionData {
  guanaId: string;
  tipo: TransactionType;
  monto: number;
  concepto: TransactionConcept;
  descripcion: string;
  retoId?: string;
  servicioId?: string;
  // Para futuro Hedera
  syncToBlockchain?: boolean;
}

// =========================================================
// 🎵 SISTEMA DE GESTIÓN DE ARTISTAS Y NFTs
// =========================================================

// Estado de gestión del artista
export type EstadoGestion = 'prospecto' | 'en_negociacion' | 'activo' | 'pausado' | 'terminado';

// Tipos de productos de artista
export type TipoProducto = 
  | 'nft_musica' 
  | 'nft_video' 
  | 'nft_arte'
  | 'usb_coleccion' 
  | 'vinilo'
  | 'poster_firmado'
  | 'cena_artista' 
  | 'tour_privado' 
  | 'clase_musica'
  | 'meet_greet' 
  | 'backstage'
  | 'vip_caribbean'
  | 'ensayo_abierto'
  | 'sesion_fotos'
  | 'mencion_cancion';

// Categorías de productos
export type CategoriaProducto = 'digital' | 'fisico' | 'experiencia' | 'acceso';

// Estado de pago
export type EstadoPago = 'pendiente' | 'pagado' | 'reembolsado' | 'fallido';

// Métodos de pago
export type MetodoPago = 'efectivo' | 'tarjeta' | 'nequi' | 'daviplata' | 'guana_points' | 'crypto';

// Interfaz para artista en portafolio (gestión comercial)
export interface ArtistaPortafolio {
  id: string;                          // ID de Airtable
  artistaId: string;                   // Link a Rimm_musicos
  nombreArtistico: string;             // Nombre para display
  estadoGestion: EstadoGestion;        // Estado del acuerdo
  porcentajeArtista: number;           // % que recibe artista (default 70)
  porcentajeGuanaGO: number;           // % GuanaGO (default 15)
  porcentajeCluster: number;           // % Clúster RIMM (default 15)
  contratoFirmado: boolean;            // ✅ Si hay contrato
  documentoContrato?: string;          // URL del PDF
  fechaInicio?: string;                // Inicio de alianza
  fechaFin?: string;                   // Fin (si aplica)
  walletHedera?: string;               // 0.0.XXXXX
  walletTradicional?: string;          // Nequi, cuenta banco
  productosActivos: number;            // Count de productos
  ventasTotales: number;               // Suma de ventas $
  gananciasArtista: number;            // Total ganado por artista
  gananciasGuanaGO: number;            // Tu comisión total
  notasPrivadas?: string;              // Notas internas
  contactoManager?: string;            // Representante
  telefono?: string;                   // Contacto directo
  fechaCreacion: string;               // Created time
}

// Interfaz para productos de artista
export interface ProductoArtista {
  id: string;                          // ID de Airtable
  nombre: string;                      // Nombre del producto
  artistaId: string;                   // Link a Artistas_Portafolio
  artistaNombre?: string;              // Nombre del artista (lookup)
  tipo: TipoProducto;                  // nft_musica, cena_artista, etc.
  categoria: CategoriaProducto;        // digital, fisico, experiencia, acceso
  descripcion: string;                 // Descripción para turista
  precioCOP: number;                   // Precio en pesos
  precioUSD?: number;                  // Para extranjeros
  precioGUANA?: number;                // En puntos GUANA
  costoProduccion?: number;            // Para calcular margen
  stock: number;                       // -1 = ilimitado
  stockVendido: number;                // Cuántos vendidos
  imagenPrincipal?: string;            // URL imagen
  galeria?: string[];                  // Más imágenes
  archivoDigital?: string;             // URL del archivo
  ipfsCID?: string;                    // Hash IPFS
  hederaTokenId?: string;              // Token NFT minteado
  hederaSerial?: number;               // Serial del NFT
  royaltyPorcentaje: number;           // % en reventas (default 10)
  duracion?: string;                   // Para experiencias: "3 horas"
  ubicacion?: string;                  // Dónde se realiza
  capacidad?: number;                  // Cuántas personas
  disponibilidad?: string[];           // Días disponibles
  requiereReserva: boolean;            // Con anticipación
  diasAnticipacion?: number;           // Mínimo días
  activo: boolean;                     // Visible en app
  destacado: boolean;                  // Aparece primero
  fechaCreacion: string;               // Created time
}

// Interfaz para ventas de artista
export interface VentaArtista {
  id: string;                          // ID de Airtable
  idVenta: string;                     // VTA-0001
  productoId: string;                  // Link a Productos_Artista
  productoNombre?: string;             // Nombre producto (lookup)
  artistaNombre?: string;              // Nombre artista (lookup)
  compradorId: string;                 // Link a Leads
  compradorNombre?: string;            // Nombre comprador
  compradorEmail?: string;             // Email comprador
  fecha: string;                       // Created time
  cantidad: number;                    // Default 1
  precioUnitario: number;              // Del producto
  precioTotal: number;                 // cantidad * precio
  metodoPago: MetodoPago;              // efectivo, crypto, etc.
  estadoPago: EstadoPago;              // pendiente, pagado
  montoArtista: number;                // Calculado
  montoGuanaGO: number;                // Tu comisión
  montoCluster: number;                // Para RIMM
  estadoPagoArtista: EstadoPago;       // Si ya se le pagó
  fechaPagoArtista?: string;           // Cuándo se le pagó
  hederaTxHash?: string;               // Hash blockchain
  hederaTimestamp?: string;            // Timestamp consenso
  nftTransferido: boolean;             // Si ya se transfirió NFT
  experienciaFecha?: string;           // Para experiencias
  experienciaCompletada: boolean;      // Si ya se realizó
  ratingCliente?: number;              // 1-5 estrellas
  comentarioCliente?: string;          // Feedback
  notas?: string;                      // Notas internas
}

// Datos para crear un producto
export interface CreateProductoData {
  nombre: string;
  artistaId: string;
  tipo: TipoProducto;
  categoria: CategoriaProducto;
  descripcion: string;
  precioCOP: number;
  precioGUANA?: number;
  stock?: number;
  imagenPrincipal?: string;
  duracion?: string;
  ubicacion?: string;
  capacidad?: number;
  requiereReserva?: boolean;
  diasAnticipacion?: number;
  experienciaFecha?: string;
}

// Datos para registrar una venta
export interface CreateVentaData {
  productoId: string;
  compradorId: string;
  cantidad?: number;
  metodoPago: MetodoPago;
  precioTotal: number;
  experienciaFecha?: string;
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
  
  // Helpers para imágenes provenientes de distintos campos posibles
  const extractImageUrls = (f: any): string[] => {
    const candidates = [
      f['Imagen'], f['Imagen Principal'], f['Imagen_Principal'], f['Image'], f['Images'],
      f['Foto'], f['Fotos'], f['Galeria'], f['Galería'], f['Gallery']
    ];
    const urls: string[] = [];
    candidates.forEach((c: any) => {
      if (!c) return;
      if (Array.isArray(c)) {
        c.forEach((item: any) => {
          const u = item?.url || (typeof item === 'string' ? item : null);
          if (u) urls.push(u);
        });
      } else if (typeof c === 'string') {
        urls.push(c);
      }
    });
    // Eliminar duplicados
    return Array.from(new Set(urls));
  };

  const extractPrimaryImage = (f: any): string => {
    const all = extractImageUrls(f);
    return all[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800';
  };

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
      
      // Imágenes (detección automática de múltiples campos)
      image: extractPrimaryImage(f),
      images: extractImageUrls(f),
      gallery: extractImageUrls(f),
      
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
      // Las claves image, images y gallery ya están definidas antes, no repetir aquí
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
 * Mapear registro de Lead/Usuario a GuanaUser
 * Soporta sistema multi-rol: la misma persona puede ser turista y operador
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

  // Mapear rol (puede ser string o array en Airtable)
  const roleField = f.Role || f.Rol || 'Turista';
  const role = Array.isArray(roleField) ? roleField[0] : roleField;
  
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
    fechaRegistro: f.Fecha || record.createdTime || new Date().toISOString(),
    // Nuevos campos multi-rol
    role: (role as UserRole) || 'Turista',
    establishmentType: f.Establishment_Type || f.Tipo_Establecimiento || undefined,
    businessId: f.Business_ID || f.Empresa_ID || undefined,
    esRaizal: f.Es_Raizal === true || f.Es_Raizal === 'true',
    cedulaRut: f.Cedula_RUT || f.Cedula || undefined,
    verificado: f.Verificado === true || f.Verificado === 'true',
    ultimaActividad: f.Ultima_Actividad || f.Last_Activity || undefined
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

// ==================== FUNCIONES MULTI-ROL ====================

/**
 * Obtener usuarios por rol
 * Útil para dashboard de admin: "mostrar todos los operadores"
 */
export async function getUsersByRole(role: UserRole): Promise<GuanaUser[]> {
  try {
    const records = await fetchTable(TABLES.USUARIOS, {
      filterByFormula: `{Role} = '${role}'`
    });
    
    return records.map(mapLeadToUser);
  } catch (error) {
    console.error(`❌ Error getting users by role ${role}:`, error);
    return [];
  }
}

/**
 * Obtener usuarios verificados (para aliados/socios activos)
 */
export async function getVerifiedUsers(): Promise<GuanaUser[]> {
  try {
    const records = await fetchTable(TABLES.USUARIOS, {
      filterByFormula: `{Verificado} = TRUE()`
    });
    
    return records.map(mapLeadToUser);
  } catch (error) {
    console.error('❌ Error getting verified users:', error);
    return [];
  }
}

/**
 * Actualizar rol de usuario
 * Permite que un turista se convierta en operador/aliado
 */
export async function updateUserRole(
  recordId: string,
  newRole: UserRole,
  additionalFields?: {
    establishmentType?: EstablishmentType;
    businessId?: string;
    cedulaRut?: string;
  }
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    const fields: any = {
      Role: newRole,
      Ultima_Actividad: new Date().toISOString()
    };

    if (additionalFields?.establishmentType) {
      fields.Establishment_Type = additionalFields.establishmentType;
    }
    if (additionalFields?.businessId) {
      fields.Business_ID = additionalFields.businessId;
    }
    if (additionalFields?.cedulaRut) {
      fields.Cedula_RUT = additionalFields.cedulaRut;
    }

    const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.USUARIOS)}/${recordId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ fields })
    });

    if (!response.ok) throw new Error('Failed to update role');
    
    console.log(`✅ User role updated to: ${newRole}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return false;
  }
}

// ==================== FUNCIONES EMPRESAS (Directorio_Mapa) ====================

/**
 * Mapear registro de Directorio_Mapa a GuanaEmpresa
 */
function mapRecordToEmpresa(record: any): GuanaEmpresa {
  const f = record.fields;
  
  // Mapear estado de aliado
  let estadoAliado: GuanaEmpresa['estadoAliado'] = 'prospecto';
  const estadoField = f.Estado_Aliado || f.Estado || '';
  if (['activo', 'pausado', 'inactivo', 'prospecto'].includes(estadoField.toLowerCase())) {
    estadoAliado = estadoField.toLowerCase() as GuanaEmpresa['estadoAliado'];
  } else if (f.Es_Aliado === true || f.Es_Aliado === 'true') {
    estadoAliado = 'activo';
  }

  return {
    id: record.id,
    nombre: f.Nombre || f.nombre || '',
    categoria: f.Categoria || f.Tipo || 'Otro',
    descripcion: f.Descripcion || f.descripcion || '',
    direccion: f.Direccion || f.direccion || '',
    
    // Ubicación
    latitud: parseFloat(f.Lat || f.Latitud || '0') || 0,
    longitud: parseFloat(f.Lng || f.Longitud || '0') || 0,
    
    // Contacto
    telefono: f.Telefono || f.telefono || '',
    email: f.Email || f.email || '',
    website: f.Website || f.Sitio_Web || '',
    horario: f.Horarios || f.Horario || '',
    
    // Media
    imagen: f.Imagen_URL || f.Foto || '',
    rating: parseFloat(f.Calificacion || f.Rating || '0') || 0,
    
    // Datos de Aliado GuanaGO
    responsableId: f.Responsable_ID || f.Operador_ID || undefined,
    responsableNombre: f.Responsable_Nombre || f.Contacto || undefined,
    rnt: f.RNT || undefined,
    camaraComercio: f.Camara_Comercio || f.NIT || undefined,
    esAliadoGuanaGO: f.Es_Aliado === true || f.Es_Aliado === 'true' || f.Es_Socio === true,
    comisionPactada: parseFloat(f.Comision_Porcentaje || f.Comision || '0') || undefined,
    saldoPuntosEmpresa: parseFloat(f.Saldo_Puntos || '0') || undefined,
    estadoAliado: estadoAliado,
    walletHedera: f.Wallet_Hedera || undefined,
    
    // Metadata
    fechaRegistro: f.Fecha_Registro || record.createdTime || undefined
  };
}

/**
 * Obtener todas las empresas/establecimientos
 */
export async function getEmpresas(options?: {
  categoria?: string;
  soloAliados?: boolean;
  soloSocios?: boolean;
  soloVerificados?: boolean;
}): Promise<GuanaEmpresa[]> {
  try {
    const filters: string[] = [];
    
    if (options?.categoria) {
      filters.push(`{Categoria} = '${options.categoria}'`);
    }
    if (options?.soloAliados) {
      filters.push(`{Es_Aliado} = TRUE()`);
    }
    if (options?.soloSocios) {
      filters.push(`{Es_Socio} = TRUE()`);
    }
    if (options?.soloVerificados) {
      filters.push(`{Verificado} = TRUE()`);
    }

    const filterByFormula = filters.length > 0 
      ? (filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`)
      : undefined;

    const records = await fetchTable(TABLES.EMPRESAS, { filterByFormula });
    return records.map(mapRecordToEmpresa);
  } catch (error) {
    console.error('❌ Error getting empresas:', error);
    return [];
  }
}

/**
 * Obtener empresa por ID
 */
export async function getEmpresaById(empresaId: string): Promise<GuanaEmpresa | null> {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.EMPRESAS)}/${empresaId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) return null;

    const record = await response.json();
    return mapRecordToEmpresa(record);
  } catch (error) {
    console.error('❌ Error getting empresa:', error);
    return null;
  }
}

/**
 * Obtener empresas por responsable (operador/aliado)
 * Para mostrar "mis establecimientos" en el dashboard del operador
 */
export async function getEmpresasByResponsable(responsableId: string): Promise<GuanaEmpresa[]> {
  try {
    const records = await fetchTable(TABLES.EMPRESAS, {
      filterByFormula: `{Responsable_ID} = '${responsableId}'`
    });
    
    return records.map(mapRecordToEmpresa);
  } catch (error) {
    console.error('❌ Error getting empresas by responsable:', error);
    return [];
  }
}

/**
 * Registrar nuevo establecimiento como aliado
 */
export async function registerEmpresaAliada(empresaData: {
  nombre: string;
  categoria: string;
  direccion: string;
  telefono?: string;
  email?: string;
  responsableId: string;
  lat?: number;
  lng?: number;
}): Promise<GuanaEmpresa | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.EMPRESAS)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            Nombre: empresaData.nombre,
            Categoria: empresaData.categoria,
            Direccion: empresaData.direccion,
            Telefono: empresaData.telefono || '',
            Email: empresaData.email || '',
            Responsable_ID: empresaData.responsableId,
            Lat: empresaData.lat || 0,
            Lng: empresaData.lng || 0,
            Es_Aliado: true,
            Verificado: false, // Requiere aprobación
            Activo: true,
            Fecha_Registro: new Date().toISOString()
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Error registering empresa: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Empresa aliada registrada:', data.records[0].id);
    return mapRecordToEmpresa(data.records[0]);
  } catch (error) {
    console.error('❌ Error registering empresa:', error);
    throw error;
  }
}

// ==================== FIN FUNCIONES MULTI-ROL/EMPRESAS ====================

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

// =========================================================
// 💰 TRANSACCIONES GUANA POINTS - CON SOPORTE HEDERA
// =========================================================

/**
 * Crear una nueva transacción de GUANA Points
 * Registra en Airtable y opcionalmente sincroniza con Hedera
 */
export async function createTransaction(
  data: CreateTransactionData
): Promise<GuanaTransaction | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ Airtable no configurado');
    return null;
  }

  try {
    // 1. Obtener usuario y saldo actual
    const user = await getUserByGuanaId(data.guanaId);
    if (!user) {
      throw new Error(`Usuario no encontrado: ${data.guanaId}`);
    }

    const saldoAnterior = user.saldoGuana;
    let saldoNuevo: number;

    // 2. Calcular nuevo saldo según tipo
    if (data.tipo === 'ganado' || data.tipo === 'bono') {
      saldoNuevo = saldoAnterior + data.monto;
    } else if (data.tipo === 'canjeado' || data.tipo === 'transferido') {
      if (saldoAnterior < data.monto) {
        throw new Error(`Saldo insuficiente: ${saldoAnterior} < ${data.monto}`);
      }
      saldoNuevo = saldoAnterior - data.monto;
    } else {
      // expirado
      saldoNuevo = Math.max(0, saldoAnterior - data.monto);
    }

    // 3. Generar ID de transacción único
    const txnId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // 4. Crear registro en Airtable
    const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.TRANSACCIONES)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: {
          Id_Transaccion: txnId,
          Guana_ID: data.guanaId,
          Tipo: data.tipo,
          Monto: data.monto,
          Saldo_Anterior: saldoAnterior,
          Saldo_Nuevo: saldoNuevo,
          Concepto: data.concepto,
          Descripcion: data.descripcion,
          Reto_ID: data.retoId || '',
          Servicio_ID: data.servicioId || '',
          Validado: true,
          // Hedera fields - pending hasta que se implemente
          Blockchain_Status: data.syncToBlockchain ? 'pending' : 'not_required',
          Hedera_TxHash: '',
          Hedera_Consensus_Timestamp: '',
          Hedera_Token_ID: '',
          Blockchain_Memo: JSON.stringify({
            guanaId: data.guanaId,
            concepto: data.concepto,
            timestamp: new Date().toISOString()
          })
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error creando transacción');
    }

    const result = await response.json();
    
    // 5. Actualizar saldo del usuario
    await updateGuanaBalance(
      user.id, 
      data.monto, 
      (data.tipo === 'ganado' || data.tipo === 'bono') ? 'add' : 'subtract'
    );

    console.log(`✅ Transacción creada: ${txnId} | ${data.tipo} ${data.monto} GUANA`);
    
    return mapRecordToTransaction(result);
  } catch (error) {
    console.error('❌ Error creando transacción:', error);
    throw error;
  }
}

/**
 * Obtener historial de transacciones de un usuario
 */
export async function getTransactionHistory(
  guanaId: string,
  options?: { limit?: number; offset?: string }
): Promise<{ transactions: GuanaTransaction[]; offset?: string }> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return { transactions: [] };
  }

  try {
    const limit = options?.limit || 50;
    let url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.TRANSACCIONES)}?` +
      `filterByFormula={Guana_ID}="${guanaId}"` +
      `&sort[0][field]=Fecha&sort[0][direction]=desc` +
      `&pageSize=${limit}`;
    
    if (options?.offset) {
      url += `&offset=${options.offset}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching transactions');
    }

    const data = await response.json();
    const transactions = data.records.map(mapRecordToTransaction);

    console.log(`📋 ${transactions.length} transacciones para ${guanaId}`);
    return { 
      transactions, 
      offset: data.offset 
    };
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    return { transactions: [] };
  }
}

/**
 * Obtener una transacción por ID
 */
export async function getTransactionById(txnId: string): Promise<GuanaTransaction | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.TRANSACCIONES)}?` +
      `filterByFormula={Id_Transaccion}="${txnId}"`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Transaction not found');
    }

    const data = await response.json();
    if (data.records.length === 0) {
      return null;
    }

    return mapRecordToTransaction(data.records[0]);
  } catch (error) {
    console.error('❌ Error obteniendo transacción:', error);
    return null;
  }
}

/**
 * Actualizar estado de blockchain de una transacción
 * (Para usar cuando Hedera confirme la transacción)
 */
export async function updateTransactionBlockchainStatus(
  recordId: string,
  hederaData: {
    txHash: string;
    consensusTimestamp: string;
    tokenId: string;
    status: BlockchainStatus;
  }
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.TRANSACCIONES)}/${recordId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          fields: {
            Hedera_TxHash: hederaData.txHash,
            Hedera_Consensus_Timestamp: hederaData.consensusTimestamp,
            Hedera_Token_ID: hederaData.tokenId,
            Blockchain_Status: hederaData.status
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update blockchain status');
    }

    console.log(`🔗 Blockchain status updated: ${recordId} → ${hederaData.status}`);
    return true;
  } catch (error) {
    console.error('❌ Error actualizando blockchain status:', error);
    return false;
  }
}

/**
 * Obtener transacciones pendientes de sincronizar con blockchain
 */
export async function getPendingBlockchainTransactions(): Promise<GuanaTransaction[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return [];
  }

  try {
    const url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.TRANSACCIONES)}?` +
      `filterByFormula={Blockchain_Status}="pending"` +
      `&sort[0][field]=Fecha&sort[0][direction]=asc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching pending transactions');
    }

    const data = await response.json();
    return data.records.map(mapRecordToTransaction);
  } catch (error) {
    console.error('❌ Error obteniendo transacciones pendientes:', error);
    return [];
  }
}

/**
 * Resumen de transacciones de un usuario
 */
export async function getTransactionSummary(guanaId: string): Promise<{
  totalGanado: number;
  totalCanjeado: number;
  transaccionesCount: number;
  ultimaTransaccion?: GuanaTransaction;
}> {
  const { transactions } = await getTransactionHistory(guanaId, { limit: 100 });
  
  let totalGanado = 0;
  let totalCanjeado = 0;
  
  transactions.forEach(tx => {
    if (tx.tipo === 'ganado' || tx.tipo === 'bono') {
      totalGanado += tx.monto;
    } else if (tx.tipo === 'canjeado' || tx.tipo === 'transferido') {
      totalCanjeado += tx.monto;
    }
  });

  return {
    totalGanado,
    totalCanjeado,
    transaccionesCount: transactions.length,
    ultimaTransaccion: transactions[0]
  };
}

/**
 * Helper: Mapear registro de Airtable a GuanaTransaction
 */
function mapRecordToTransaction(record: any): GuanaTransaction {
  const f = record.fields;
  return {
    id: record.id,
    idTransaccion: f.Id_Transaccion || '',
    guanaId: f.Guana_ID || '',
    usuarioNombre: f.Usuario_Nombre || undefined,
    tipo: f.Tipo || 'ganado',
    monto: parseInt(f.Monto) || 0,
    saldoAnterior: parseInt(f.Saldo_Anterior) || 0,
    saldoNuevo: parseInt(f.Saldo_Nuevo) || 0,
    concepto: f.Concepto || 'bienvenida',
    descripcion: f.Descripcion || '',
    retoId: f.Reto_ID || undefined,
    servicioId: f.Servicio_ID || undefined,
    fecha: f.Fecha || record.createdTime,
    validado: Boolean(f.Validado),
    // Hedera
    hederaTxHash: f.Hedera_TxHash || undefined,
    hederaConsensusTimestamp: f.Hedera_Consensus_Timestamp || undefined,
    hederaTokenId: f.Hedera_Token_ID || undefined,
    blockchainStatus: f.Blockchain_Status || 'not_required',
    blockchainMemo: f.Blockchain_Memo || undefined
  };
}

// =========================================================
// 🎵 FUNCIONES DE GESTIÓN DE ARTISTAS Y NFTs
// =========================================================

/**
 * Obtener todos los artistas en portafolio
 */
export async function getArtistasPortafolio(
  options?: { estado?: EstadoGestion; limit?: number }
): Promise<ArtistaPortafolio[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return [];
  }

  try {
    let url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.ARTISTAS_PORTAFOLIO)}?`;
    
    if (options?.estado) {
      url += `filterByFormula={Estado_Gestion}="${options.estado}"&`;
    }
    if (options?.limit) {
      url += `pageSize=${options.limit}&`;
    }
    url += `sort[0][field]=Fecha_Creacion&sort[0][direction]=desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching artistas portafolio');
    }

    const data = await response.json();
    return data.records.map(mapRecordToArtistaPortafolio);
  } catch (error) {
    console.error('❌ Error obteniendo artistas portafolio:', error);
    return [];
  }
}

/**
 * Obtener un artista del portafolio por ID
 */
export async function getArtistaPortafolioById(id: string): Promise<ArtistaPortafolio | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.ARTISTAS_PORTAFOLIO)}/${id}`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Artista not found');
    }

    const record = await response.json();
    return mapRecordToArtistaPortafolio(record);
  } catch (error) {
    console.error('❌ Error obteniendo artista:', error);
    return null;
  }
}

/**
 * Crear/agregar artista al portafolio
 */
export async function addArtistaToPortafolio(data: {
  artistaId: string;
  nombreArtistico: string;
  porcentajeArtista?: number;
  porcentajeGuanaGO?: number;
  porcentajeCluster?: number;
  walletHedera?: string;
  walletTradicional?: string;
  telefono?: string;
  notasPrivadas?: string;
}): Promise<ArtistaPortafolio | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.ARTISTAS_PORTAFOLIO)}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fields: {
            Artista_ID: data.artistaId,
            Nombre_Artistico: data.nombreArtistico,
            Estado_Gestion: 'prospecto',
            Porcentaje_Artista: data.porcentajeArtista || 70,
            Porcentaje_GuanaGO: data.porcentajeGuanaGO || 15,
            Porcentaje_Cluster: data.porcentajeCluster || 15,
            Contrato_Firmado: false,
            Wallet_Hedera: data.walletHedera || '',
            Wallet_Tradicional: data.walletTradicional || '',
            Telefono: data.telefono || '',
            Notas_Privadas: data.notasPrivadas || '',
            Productos_Activos: 0,
            Ventas_Totales: 0,
            Ganancias_Artista: 0,
            Ganancias_GuanaGO: 0
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error adding artista');
    }

    const record = await response.json();
    console.log(`✅ Artista agregado al portafolio: ${data.nombreArtistico}`);
    return mapRecordToArtistaPortafolio(record);
  } catch (error) {
    console.error('❌ Error agregando artista:', error);
    throw error;
  }
}

/**
 * Actualizar estado de artista en portafolio
 */
export async function updateArtistaPortafolio(
  recordId: string,
  updates: Partial<{
    estadoGestion: EstadoGestion;
    contratoFirmado: boolean;
    porcentajeArtista: number;
    porcentajeGuanaGO: number;
    porcentajeCluster: number;
    walletHedera: string;
    walletTradicional: string;
    notasPrivadas: string;
  }>
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    const fields: any = {};
    if (updates.estadoGestion) fields.Estado_Gestion = updates.estadoGestion;
    if (updates.contratoFirmado !== undefined) fields.Contrato_Firmado = updates.contratoFirmado;
    if (updates.porcentajeArtista) fields.Porcentaje_Artista = updates.porcentajeArtista;
    if (updates.porcentajeGuanaGO) fields.Porcentaje_GuanaGO = updates.porcentajeGuanaGO;
    if (updates.porcentajeCluster) fields.Porcentaje_Cluster = updates.porcentajeCluster;
    if (updates.walletHedera) fields.Wallet_Hedera = updates.walletHedera;
    if (updates.walletTradicional) fields.Wallet_Tradicional = updates.walletTradicional;
    if (updates.notasPrivadas) fields.Notas_Privadas = updates.notasPrivadas;

    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.ARTISTAS_PORTAFOLIO)}/${recordId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ fields })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update artista');
    }

    console.log(`✅ Artista actualizado: ${recordId}`);
    return true;
  } catch (error) {
    console.error('❌ Error actualizando artista:', error);
    return false;
  }
}

// =========================================================
// 🛍️ PRODUCTOS DE ARTISTA
// =========================================================

/**
 * Obtener productos de un artista o todos
 */
export async function getProductosArtista(
  options?: { artistaId?: string; categoria?: CategoriaProducto; activos?: boolean; limit?: number }
): Promise<ProductoArtista[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return [];
  }

  try {
    let filterParts: string[] = [];
    
    if (options?.artistaId) {
      filterParts.push(`{Artista_ID}="${options.artistaId}"`);
    }
    if (options?.categoria) {
      filterParts.push(`{Categoria}="${options.categoria}"`);
    }
    if (options?.activos) {
      filterParts.push(`{Activo}=TRUE()`);
    }

    let url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.PRODUCTOS_ARTISTA)}?`;
    
    if (filterParts.length > 0) {
      const formula = filterParts.length === 1 
        ? filterParts[0] 
        : `AND(${filterParts.join(',')})`;
      url += `filterByFormula=${encodeURIComponent(formula)}&`;
    }
    
    if (options?.limit) {
      url += `pageSize=${options.limit}&`;
    }
    url += `sort[0][field]=Destacado&sort[0][direction]=desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching productos');
    }

    const data = await response.json();
    return data.records.map(mapRecordToProducto);
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    return [];
  }
}

/**
 * Obtener un producto por ID
 */
export async function getProductoById(id: string): Promise<ProductoArtista | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.PRODUCTOS_ARTISTA)}/${id}`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Producto not found');
    }

    const record = await response.json();
    return mapRecordToProducto(record);
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    return null;
  }
}

/**
 * Crear un nuevo producto de artista
 */
export async function createProducto(data: CreateProductoData): Promise<ProductoArtista | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.PRODUCTOS_ARTISTA)}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fields: {
            Nombre: data.nombre,
            Artista_ID: data.artistaId,
            Tipo: data.tipo,
            Categoria: data.categoria,
            Descripcion: data.descripcion,
            Precio_COP: data.precioCOP,
            Precio_GUANA: data.precioGUANA || 0,
            Stock: data.stock ?? -1,
            Stock_Vendido: 0,
            Imagen_Principal: data.imagenPrincipal || '',
            Duracion: data.duracion || '',
            Ubicacion: data.ubicacion || '',
            Capacidad: data.capacidad || 1,
            Requiere_Reserva: data.requiereReserva || false,
            Dias_Anticipacion: data.diasAnticipacion || 0,
            Royalty_Porcentaje: 10,
            Activo: true,
            Destacado: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error creating producto');
    }

    const record = await response.json();
    console.log(`✅ Producto creado: ${data.nombre}`);
    return mapRecordToProducto(record);
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    throw error;
  }
}

/**
 * Actualizar producto
 */
export async function updateProducto(
  recordId: string,
  updates: Partial<ProductoArtista>
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    const fields: any = {};
    if (updates.nombre) fields.Nombre = updates.nombre;
    if (updates.descripcion) fields.Descripcion = updates.descripcion;
    if (updates.precioCOP) fields.Precio_COP = updates.precioCOP;
    if (updates.precioGUANA) fields.Precio_GUANA = updates.precioGUANA;
    if (updates.stock !== undefined) fields.Stock = updates.stock;
    if (updates.imagenPrincipal) fields.Imagen_Principal = updates.imagenPrincipal;
    if (updates.ipfsCID) fields.IPFS_CID = updates.ipfsCID;
    if (updates.hederaTokenId) fields.Hedera_Token_ID = updates.hederaTokenId;
    if (updates.activo !== undefined) fields.Activo = updates.activo;
    if (updates.destacado !== undefined) fields.Destacado = updates.destacado;

    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.PRODUCTOS_ARTISTA)}/${recordId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ fields })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update producto');
    }

    console.log(`✅ Producto actualizado: ${recordId}`);
    return true;
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    return false;
  }
}

// =========================================================
// 💰 VENTAS DE ARTISTA
// =========================================================

/**
 * Registrar una venta
 */
export async function registrarVenta(data: CreateVentaData): Promise<VentaArtista | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  try {
    // 1. Obtener producto para calcular porcentajes
    const producto = await getProductoById(data.productoId);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // 2. Obtener artista para porcentajes
    const artista = await getArtistaPortafolioById(producto.artistaId);
    const porcArtista = artista?.porcentajeArtista || 70;
    const porcGuanaGO = artista?.porcentajeGuanaGO || 15;
    const porcCluster = artista?.porcentajeCluster || 15;

    // 3. Calcular montos
    const cantidad = data.cantidad || 1;
    const precioTotal = data.precioTotal;
    const montoArtista = Math.round(precioTotal * (porcArtista / 100));
    const montoGuanaGO = Math.round(precioTotal * (porcGuanaGO / 100));
    const montoCluster = Math.round(precioTotal * (porcCluster / 100));

    // 4. Generar ID de venta
    const ventaId = `VTA-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 5. Crear registro
    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.VENTAS_ARTISTA)}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fields: {
            ID_Venta: ventaId,
            Producto_ID: data.productoId,
            Comprador_ID: data.compradorId,
            Cantidad: cantidad,
            Precio_Total: precioTotal,
            Metodo_Pago: data.metodoPago,
            Estado_Pago: 'pendiente',
            Monto_Artista: montoArtista,
            Monto_GuanaGO: montoGuanaGO,
            Monto_Cluster: montoCluster,
            Estado_Pago_Artista: 'pendiente',
            NFT_Transferido: false,
            Experiencia_Fecha: data.experienciaFecha || '',
            Experiencia_Completada: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error registrando venta');
    }

    const record = await response.json();

    // 6. Actualizar stock del producto si no es ilimitado
    if (producto.stock !== -1) {
      await updateProducto(producto.id, {
        stock: Math.max(0, producto.stock - cantidad)
      });
    }

    console.log(`✅ Venta registrada: ${ventaId} | $${precioTotal.toLocaleString()}`);
    return mapRecordToVenta(record);
  } catch (error) {
    console.error('❌ Error registrando venta:', error);
    throw error;
  }
}

/**
 * Obtener historial de ventas
 */
export async function getVentasArtista(
  options?: { artistaId?: string; compradorId?: string; estado?: EstadoPago; limit?: number }
): Promise<VentaArtista[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return [];
  }

  try {
    let filterParts: string[] = [];
    
    if (options?.estado) {
      filterParts.push(`{Estado_Pago}="${options.estado}"`);
    }

    let url = `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.VENTAS_ARTISTA)}?`;
    
    if (filterParts.length > 0) {
      url += `filterByFormula=${encodeURIComponent(filterParts[0])}&`;
    }
    
    if (options?.limit) {
      url += `pageSize=${options.limit}&`;
    }
    url += `sort[0][field]=Fecha&sort[0][direction]=desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching ventas');
    }

    const data = await response.json();
    return data.records.map(mapRecordToVenta);
  } catch (error) {
    console.error('❌ Error obteniendo ventas:', error);
    return [];
  }
}

/**
 * Actualizar estado de venta (confirmar pago, etc.)
 */
export async function updateVenta(
  recordId: string,
  updates: Partial<{
    estadoPago: EstadoPago;
    estadoPagoArtista: EstadoPago;
    fechaPagoArtista: string;
    hederaTxHash: string;
    nftTransferido: boolean;
    experienciaCompletada: boolean;
    ratingCliente: number;
    comentarioCliente: string;
  }>
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return false;
  }

  try {
    const fields: any = {};
    if (updates.estadoPago) fields.Estado_Pago = updates.estadoPago;
    if (updates.estadoPagoArtista) fields.Estado_Pago_Artista = updates.estadoPagoArtista;
    if (updates.fechaPagoArtista) fields.Fecha_Pago_Artista = updates.fechaPagoArtista;
    if (updates.hederaTxHash) fields.Hedera_TxHash = updates.hederaTxHash;
    if (updates.nftTransferido !== undefined) fields.NFT_Transferido = updates.nftTransferido;
    if (updates.experienciaCompletada !== undefined) fields.Experiencia_Completada = updates.experienciaCompletada;
    if (updates.ratingCliente) fields.Rating_Cliente = updates.ratingCliente;
    if (updates.comentarioCliente) fields.Comentario_Cliente = updates.comentarioCliente;

    const response = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(TABLES.VENTAS_ARTISTA)}/${recordId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ fields })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update venta');
    }

    console.log(`✅ Venta actualizada: ${recordId}`);
    return true;
  } catch (error) {
    console.error('❌ Error actualizando venta:', error);
    return false;
  }
}

/**
 * Obtener resumen de ventas (para dashboard)
 */
export async function getResumenVentas(artistaId?: string): Promise<{
  totalVentas: number;
  ventasCount: number;
  gananciasArtista: number;
  gananciasGuanaGO: number;
  gananciasCluster: number;
  pendientesPago: number;
}> {
  const ventas = await getVentasArtista({ artistaId, limit: 1000 });
  
  let totalVentas = 0;
  let gananciasArtista = 0;
  let gananciasGuanaGO = 0;
  let gananciasCluster = 0;
  let pendientesPago = 0;

  ventas.forEach(v => {
    if (v.estadoPago === 'pagado') {
      totalVentas += v.precioTotal;
      gananciasArtista += v.montoArtista;
      gananciasGuanaGO += v.montoGuanaGO;
      gananciasCluster += v.montoCluster;
    }
    if (v.estadoPagoArtista === 'pendiente' && v.estadoPago === 'pagado') {
      pendientesPago += v.montoArtista;
    }
  });

  return {
    totalVentas,
    ventasCount: ventas.length,
    gananciasArtista,
    gananciasGuanaGO,
    gananciasCluster,
    pendientesPago
  };
}

// =========================================================
// 🔧 HELPERS / MAPPERS
// =========================================================

function mapRecordToArtistaPortafolio(record: any): ArtistaPortafolio {
  const f = record.fields;
  return {
    id: record.id,
    artistaId: f.Artista_ID || '',
    nombreArtistico: f.Nombre_Artistico || '',
    estadoGestion: f.Estado_Gestion || 'prospecto',
    porcentajeArtista: parseFloat(f.Porcentaje_Artista) || 70,
    porcentajeGuanaGO: parseFloat(f.Porcentaje_GuanaGO) || 15,
    porcentajeCluster: parseFloat(f.Porcentaje_Cluster) || 15,
    contratoFirmado: Boolean(f.Contrato_Firmado),
    documentoContrato: f.Documento_Contrato?.[0]?.url || undefined,
    fechaInicio: f.Fecha_Inicio || undefined,
    fechaFin: f.Fecha_Fin || undefined,
    walletHedera: f.Wallet_Hedera || undefined,
    walletTradicional: f.Wallet_Tradicional || undefined,
    productosActivos: parseInt(f.Productos_Activos) || 0,
    ventasTotales: parseFloat(f.Ventas_Totales) || 0,
    gananciasArtista: parseFloat(f.Ganancias_Artista) || 0,
    gananciasGuanaGO: parseFloat(f.Ganancias_GuanaGO) || 0,
    notasPrivadas: f.Notas_Privadas || undefined,
    contactoManager: f.Contacto_Manager || undefined,
    telefono: f.Telefono || undefined,
    fechaCreacion: record.createdTime
  };
}

function mapRecordToProducto(record: any): ProductoArtista {
  const f = record.fields;
  return {
    id: record.id,
    nombre: f.Nombre || '',
    artistaId: f.Artista_ID || '',
    artistaNombre: f.Artista_Nombre || undefined,
    tipo: f.Tipo || 'nft_musica',
    categoria: f.Categoria || 'digital',
    descripcion: f.Descripcion || '',
    precioCOP: parseFloat(f.Precio_COP) || 0,
    precioUSD: parseFloat(f.Precio_USD) || undefined,
    precioGUANA: parseInt(f.Precio_GUANA) || undefined,
    costoProduccion: parseFloat(f.Costo_Produccion) || undefined,
    stock: parseInt(f.Stock) ?? -1,
    stockVendido: parseInt(f.Stock_Vendido) || 0,
    imagenPrincipal: f.Imagen_Principal?.[0]?.url || f.Imagen_Principal || undefined,
    galeria: f.Galeria?.map((g: any) => g.url) || undefined,
    archivoDigital: f.Archivo_Digital?.[0]?.url || undefined,
    ipfsCID: f.IPFS_CID || undefined,
    hederaTokenId: f.Hedera_Token_ID || undefined,
    hederaSerial: parseInt(f.Hedera_Serial) || undefined,
    royaltyPorcentaje: parseFloat(f.Royalty_Porcentaje) || 10,
    duracion: f.Duracion || undefined,
    ubicacion: f.Ubicacion || undefined,
    capacidad: parseInt(f.Capacidad) || undefined,
    disponibilidad: f.Disponibilidad || undefined,
    requiereReserva: Boolean(f.Requiere_Reserva),
    diasAnticipacion: parseInt(f.Dias_Anticipacion) || undefined,
    activo: Boolean(f.Activo),
    destacado: Boolean(f.Destacado),
    fechaCreacion: record.createdTime
  };
}

function mapRecordToVenta(record: any): VentaArtista {
  const f = record.fields;
  return {
    id: record.id,
    idVenta: f.ID_Venta || '',
    productoId: f.Producto_ID || '',
    productoNombre: f.Producto_Nombre || undefined,
    artistaNombre: f.Artista_Nombre || undefined,
    compradorId: f.Comprador_ID || '',
    compradorNombre: f.Comprador_Nombre || undefined,
    compradorEmail: f.Comprador_Email || undefined,
    fecha: f.Fecha || record.createdTime,
    cantidad: parseInt(f.Cantidad) || 1,
    precioUnitario: parseFloat(f.Precio_Unitario) || 0,
    precioTotal: parseFloat(f.Precio_Total) || 0,
    metodoPago: f.Metodo_Pago || 'efectivo',
    estadoPago: f.Estado_Pago || 'pendiente',
    montoArtista: parseFloat(f.Monto_Artista) || 0,
    montoGuanaGO: parseFloat(f.Monto_GuanaGO) || 0,
    montoCluster: parseFloat(f.Monto_Cluster) || 0,
    estadoPagoArtista: f.Estado_Pago_Artista || 'pendiente',
    fechaPagoArtista: f.Fecha_Pago_Artista || undefined,
    hederaTxHash: f.Hedera_TxHash || undefined,
    hederaTimestamp: f.Hedera_Timestamp || undefined,
    nftTransferido: Boolean(f.NFT_Transferido),
    experienciaFecha: f.Experiencia_Fecha || undefined,
    experienciaCompletada: Boolean(f.Experiencia_Completada),
    ratingCliente: parseInt(f.Rating_Cliente) || undefined,
    comentarioCliente: f.Comentario_Cliente || undefined,
    notas: f.Notas || undefined
  };
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
  
  // 💰 Transacciones GUANA Points (con soporte Hedera)
  createTransaction,
  getTransactionHistory,
  getTransactionById,
  getTransactionSummary,
  updateTransactionBlockchainStatus,
  getPendingBlockchainTransactions,
  
  // 🎵 Gestión de Artistas (Portafolio)
  getArtistasPortafolio,
  getArtistaPortafolioById,
  addArtistaToPortafolio,
  updateArtistaPortafolio,
  
  // 🛍️ Productos de Artista (NFTs, experiencias, etc.)
  getProductosArtista,
  getProductoById,
  createProducto,
  updateProducto,
  
  // 💵 Ventas de Artista
  registrarVenta,
  getVentasArtista,
  updateVenta,
  getResumenVentas,
  
  // Acceso genérico a tablas
  fetchTable,
  
  // Configuración
  isConfigured: () => Boolean(AIRTABLE_API_KEY && AIRTABLE_BASE_ID),
  tables: TABLES
};

