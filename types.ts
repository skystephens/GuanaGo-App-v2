
export interface Tour {
  id: string;
  title: string;
  rating: number;
  reviews: number;
  price: number; 
  image: string;
  gallery?: string[]; 
  category: 'tour' | 'hotel' | 'taxi' | 'package' | 'handicraft';
  description?: string;
  duration?: string;
  ownerId?: string; 
  active: boolean;
  isRaizal?: boolean;
  raizalHistory?: string;
  latitude?: number;
  longitude?: number;
  requiresApproval?: boolean; // 🆕 Si el servicio requiere confirmación de socio
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: ItineraryActivity[];
}

export interface ItineraryActivity {
  id: string;
  time: string;
  title: string;
  provider: string;
  image: string;
  isRaizal?: boolean;
  status: 'confirmed' | 'pending';
  txId?: string;
}

export interface GroupQuoteConfig {
  adults: number;
  children: number;
  infants: number;
  margin: number; // e.g. 0.20 for 20%
}

export interface GuanaLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: 'Tour' | 'Hotel' | 'Restaurante' | 'Transporte';
  price?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  image: string;
  lat: number;
  lng: number;
  address: string;
  priceLevel: string; 
  description: string;
}

export interface Hotel extends Tour {
  address: string;
  amenities: string[];
  pricePerNight: Record<number, number>;  // {1: 150000, 2: 200000, ...}
  maxGuests: number;
  
  // 🆕 Tipo de alojamiento
  accommodationType?: 'Hotel' | 'Aparta Hotel' | 'Apartamentos' | 'Casa' | 'Habitacion' | 'Hostal' | 'Posada Nativa' | 'Hotel boutique';
  
  // 🆕 Política de bebés
  allowBabies?: boolean;
  babyPolicy?: string; // ej: "Menores de 4 años no cuentan como huésped"
  
  // 🆕 Detalles de camas y servicios
  singleBeds?: number;
  doubleBeds?: number;
  queenBeds?: number;
  kingBeds?: number;
  hasKitchen?: boolean;
  includesBreakfast?: boolean;
  hasPool?: boolean;
  hasJacuzzi?: boolean;
  hasBar?: boolean;
  minNights?: number;

  // 🆕 Plan de alimentación (PE/PC/PAM/PA/TI)
  mealPlanCode?: 'PE' | 'PC' | 'PAM' | 'PA' | 'TI';
  mealPlanDescription?: string;
  
  // 🆕 Multi-moneda
  currencyPrice?: string; // 'COP' | 'USD'
  
  // 🆕 Contacto
  phoneContact?: string;
  emailContact?: string;
  
  // 🆕 Formalidad empresarial
  rnt?: string; // Registro Nacional de Turismo
}

export interface Package extends Tour {
  nights: number;
  hotelName: string;
  includedTours: string[];
  transferIncluded: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  type: 'mission' | 'promotion' | 'discount' | 'contest';
  description: string;
  dateStr?: string; 
  startDate: string; 
  endDate: string;   
  reward?: string; 
  active: boolean;
}

export interface TaxiZone {
  id: string;
  name: string;
  sectors: string;
  priceSmall: number;
  priceLarge: number;
  color: string;
}

export type AuditStatus = 'pending' | 'verified' | 'failed';

export interface BlockchainAudit {
  hederaTransactionId?: string;
  consensusTimestamp?: string;
  auditStatus: AuditStatus;
}

export interface Transaction extends BlockchainAudit {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'credit' | 'debit';
  category?: 'reward' | 'redemption' | 'purchase';
}

export interface RewardItem {
  id: string;
  title: string;
  subtitle: string;
  cost: number;
  image: string;
  category: 'food' | 'adventure' | 'souvenir';
}

export interface Badge {
  id: string;
  icon: string;
  locked: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  reservations: number;
  image: string;
  role: 'tourist' | 'partner' | 'admin';
  status: 'active' | 'suspended' | 'pending'; 
  walletBalance: number;
  phone?: string;       
  location?: string;    
  address?: string;     
  city?: string;        
  country?: string;     
  joinedDate?: string;  
  documentId?: string;  
  rnt?: string;         
  responsible?: string; 
}

export interface Reservation extends BlockchainAudit {
  id: string;
  tourName: string;
  clientName: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  people: number;
  price?: number; 
}

export interface CartItem extends Tour {
  quantity: number; 
  date?: string;        // Para tours/traslados (fecha de actividad)
  time?: string;        // Para tours/traslados (hora)
  checkIn?: string;     // 🆕 Para hoteles (ISO date, check-in a las 3 PM)
  checkOut?: string;    // 🆕 Para hoteles (ISO date, check-out a las 1 PM)
  nights?: number;      // Para hoteles
  pax?: number;         // Personas/huéspedes
  babies?: number;      // Bebés (solo hoteles)
}

export interface Message {
  id: string;
  senderId: string; 
  receiverId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  isAdmin?: boolean; 
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (item: Tour | Hotel | Package, quantity: number, date?: string, time?: string, nights?: number, totalOverride?: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalPrice: number;
  itemCount: number;
}

export enum AppRoute {
  HOME = 'HOME',
  UNIFIED_PANEL = 'UNIFIED_PANEL',
  WALLET = 'WALLET',
  PROFILE = 'PROFILE',
  CHECKOUT = 'CHECKOUT',
  INTERACTIVE_MAP = 'INTERACTIVE_MAP',
  DIRECTORY = 'DIRECTORY',
  RESTAURANT_MAP = 'RESTAURANT_MAP',
  TOUR_LIST = 'TOUR_LIST',
  HOTEL_LIST = 'HOTEL_LIST',
  TAXI_LIST = 'TAXI_LIST',
  PACKAGE_LIST = 'PACKAGE_LIST', 
  MARKETPLACE = 'MARKETPLACE', 
  TOUR_DETAIL = 'TOUR_DETAIL',
  HOTEL_DETAIL = 'HOTEL_DETAIL',
  TAXI_DETAIL = 'TAXI_DETAIL',
  PACKAGE_DETAIL = 'PACKAGE_DETAIL',
  REVIEWS = 'REVIEWS',
  LOGIN = 'LOGIN',
  PARTNER_REGISTER = 'PARTNER_REGISTER',
  PARTNER_DASHBOARD = 'PARTNER_DASHBOARD',
  PARTNER_OPERATIONS = 'PARTNER_OPERATIONS',
  PARTNER_SCANNER = 'PARTNER_SCANNER',
  PARTNER_WALLET = 'PARTNER_WALLET',
  PARTNER_RESERVATIONS = 'PARTNER_RESERVATIONS',
  PARTNER_MY_SERVICES = 'PARTNER_MY_SERVICES',
  PARTNER_CREATE_SERVICE = 'PARTNER_CREATE_SERVICE',
  PARTNER_SERVICE_DETAIL = 'PARTNER_SERVICE_DETAIL',
  PARTNER_ACCOMMODATIONS = 'PARTNER_ACCOMMODATIONS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_FINANCE = 'ADMIN_FINANCE',
  ADMIN_SERVICES = 'ADMIN_SERVICES',
  ADMIN_APPROVALS = 'ADMIN_APPROVALS',
  ADMIN_RESERVATIONS = 'ADMIN_RESERVATIONS',
  ADMIN_STRUCTURE = 'ADMIN_STRUCTURE',
  ADMIN_BACKEND = 'ADMIN_BACKEND',
  ADMIN_TASKS = 'ADMIN_TASKS',
  ADMIN_QUOTES = 'ADMIN_QUOTES',
  ADMIN_CARIBBEAN = 'ADMIN_CARIBBEAN_NIGHT',
  ADMIN_ARTISTAS = 'ADMIN_ARTISTAS',
  ADMIN_SOCIOS = 'ADMIN_SOCIOS',
  GROUP_QUOTE = 'GROUP_QUOTE',
  MY_ITINERARY = 'MY_ITINERARY',
  DYNAMIC_ITINERARY = 'DYNAMIC_ITINERARY',
  RIMM_CLUSTER = 'RIMM_CLUSTER',
  MUSIC_EVENT_DETAIL = 'MUSIC_EVENT_DETAIL',
  ARTIST_DETAIL = 'ARTIST_DETAIL',
}

export type UserRole = 'tourist' | 'partner' | 'admin' | 'Socio' | 'SuperAdmin' | 'Aliado' | 'Operador' | 'Artista';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'urgente_pendiente' | 'terminado' | 'bloqueado';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'critica';
export type TaskCategory = 'backend' | 'frontend' | 'infraestructura' | 'diseno' | 'documentacion' | 'testing' | 'blockchain' | 'negocio';

export interface ProjectTask {
  id: string;
  titulo: string;
  descripcion: string;
  status: TaskStatus;
  prioridad: TaskPriority;
  categoria: TaskCategory;
  archivoReferencia?: string;
  seccionReferencia?: string;
  estimacionHoras?: number;
  horasReales?: number;
  creadoPor?: string;
  asignadoA?: string;
  createdAt?: string;
  updatedAt?: string;
  fechaVencimiento?: string;
  dependeDe?: string[];
  completedAt?: string;
  notasIA?: string;
}

export interface TaskStats {
  total: number;
  completadas: number;
  enProgreso: number;
  pendientes: number;
  bloqueadas: number;
  porcentajeCompletacion: number;
}

export const TASK_STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-gray-100', textColor: 'text-gray-700', icon: 'Circle' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100', textColor: 'text-blue-700', icon: 'Clock' },
  urgente_pendiente: { label: 'Urgente', color: 'bg-orange-100', textColor: 'text-orange-700', icon: 'AlertCircle' },
  terminado: { label: 'Terminado', color: 'bg-green-100', textColor: 'text-green-700', icon: 'CheckCircle2' },
  bloqueado: { label: 'Bloqueado', color: 'bg-red-100', textColor: 'text-red-700', icon: 'Pause' }
} as const;

export const TASK_PRIORITY_CONFIG = {
  baja: { label: 'Baja', color: 'bg-gray-50', textColor: 'text-gray-600', order: 1 },
  media: { label: 'Media', color: 'bg-yellow-50', textColor: 'text-yellow-600', order: 2 },
  alta: { label: 'Alta', color: 'bg-orange-50', textColor: 'text-orange-600', order: 3 },
  critica: { label: 'Crítica', color: 'bg-red-50', textColor: 'text-red-600', order: 4 }
} as const;

export const TASK_CATEGORY_CONFIG = {
  backend: { label: 'Backend', color: '#3B82F6', icon: 'Server' },
  frontend: { label: 'Frontend', color: '#8B5CF6', icon: 'Palette' },
  infraestructura: { label: 'Infraestructura', color: '#EF4444', icon: 'Zap' },
  diseno: { label: 'Diseño', color: '#EC4899', icon: 'Sparkles' },
  documentacion: { label: 'Documentación', color: '#10B981', icon: 'FileText' },
  testing: { label: 'Testing', color: '#F59E0B', icon: 'CheckCircle2' },
  blockchain: { label: 'Blockchain', color: '#6366F1', icon: 'Link2' },
  negocio: { label: 'Negocio', color: '#14B8A6', icon: 'Briefcase' }
} as const;

export interface Admin {
  id: string;
  nombre: string;
  email: string;
  pin: string;
  rol: UserRole;
  activo: boolean;
  permisos_especificos?: string[];
}

// =========================================================
// 📋 SISTEMA DE COTIZACIONES
// =========================================================

export type QuoteStatus = 'draft' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada';
export type QuoteItemStatus = 'disponible' | 'confirmado' | 'conflicto' | 'no_disponible';

export interface Cotizacion {
  id: string;
  nombre: string;                     // Nombre del cliente
  email?: string;                     // Email del cliente
  telefono?: string;                  // Teléfono del cliente
  fechaInicio: string;                // ISO date
  fechaFin: string;                   // ISO date
  adultos: number;                    // 18-99 años
  ninos: number;                      // 4-18 años
  bebes: number;                      // 0-3 años
  fechaCreacion: string;              // ISO timestamp
  estado: QuoteStatus;
  precioTotal: number;
  notasInternas?: string;
  items?: CotizacionItem[];           // Items de la cotización
}

export interface CotizacionItem {
  id: string;
  cotizacionId: string;               // Link a CotizacionesGG
  servicioId: string;                 // Link a ServiciosTuristicos_SAI
  servicioNombre: string;             // Nombre del servicio
  servicioTipo: 'tour' | 'hotel' | 'taxi' | 'package';  // Tipo
  fecha: string;                      // ISO date
  horarioInicio?: string;             // HH:MM
  horarioFin?: string;                // HH:MM
  adultos: number;
  ninos: number;
  bebes: number;
  precioUnitario: number;
  subtotal: number;                   // precio × personas
  status: QuoteItemStatus;
  conflictos?: string[];              // Lista de conflictos detectados
}

export const QUOTE_STATUS_CONFIG = {
  Draft: { label: 'Borrador', color: 'bg-gray-100', textColor: 'text-gray-700' },
  Enviada: { label: 'Enviada', color: 'bg-blue-100', textColor: 'text-blue-700' },
  Aceptada: { label: 'Aceptada', color: 'bg-green-100', textColor: 'text-green-700' },
  Rechazada: { label: 'Rechazada', color: 'bg-red-100', textColor: 'text-red-700' },
  // Mantener las minúsculas por compatibilidad
  draft: { label: 'Borrador', color: 'bg-gray-100', textColor: 'text-gray-700' },
  enviada: { label: 'Enviada', color: 'bg-blue-100', textColor: 'text-blue-700' },
  aceptada: { label: 'Aceptada', color: 'bg-green-100', textColor: 'text-green-700' },
  rechazada: { label: 'Rechazada', color: 'bg-red-100', textColor: 'text-red-700' },
  expirada: { label: 'Expirada', color: 'bg-yellow-100', textColor: 'text-yellow-700' }
} as const;

export const QUOTE_ITEM_STATUS_CONFIG = {
  disponible: { label: 'Disponible', color: 'bg-green-50', textColor: 'text-green-700', icon: 'CheckCircle2' },
  confirmado: { label: 'Confirmado', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'CheckCircle' },
  conflicto: { label: 'Conflicto', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'AlertCircle' },
  no_disponible: { label: 'No Disponible', color: 'bg-red-50', textColor: 'text-red-700', icon: 'XCircle' }
} as const;
