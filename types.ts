
export interface Tour {
  id: string;
  title: string;
  rating: number;
  reviews: number;
  price: number; 
  image: string;
  gallery?: string[];
  images?: string[];
  category: 'tour' | 'hotel' | 'taxi' | 'package' | 'handicraft';
  description?: string;
  duration?: string;
  ownerId?: string; 
  active: boolean;
  isRaizal?: boolean;
  raizalHistory?: string;
  latitude?: number;
  longitude?: number;
  
  // Campos de Airtable
  ubicacion?: string;
  isla?: string;
  location?: string;
  schedule?: string;
  horario?: string;
  operatingHours?: string;
  operatingDays?: string;
  diasOperacion?: string;
  includes?: string;
  incluye?: string;
  activityCategory?: string;
  categoriaActividad?: string;
  tags?: string[];
  serviceType?: string;
  tipoServicio?: string;
  meetingPoint?: string;
  puntoEncuentro?: string;
  provider?: string;
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
  category: string; // Flexible: Tour, Hotel, Restaurante, Droguería, Cajero, etc.
  price?: number;
  description?: string;
  phone?: string;
  address?: string;
  hours?: string;
  image?: string;
  rating?: number;
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
  pricePerNight: Record<number, number>; 
  maxGuests: number;
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
  date?: string;
  time?: string; 
  nights?: number; 
  pax?: number; 
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
  WALLET = 'WALLET',
  PROFILE = 'PROFILE',
  CHECKOUT = 'CHECKOUT',
  INTERACTIVE_MAP = 'INTERACTIVE_MAP',
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
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_FINANCE = 'ADMIN_FINANCE',
  ADMIN_SERVICES = 'ADMIN_SERVICES',
  ADMIN_BACKEND = 'ADMIN_BACKEND',
  GROUP_QUOTE = 'GROUP_QUOTE',
  MY_ITINERARY = 'MY_ITINERARY',
  DYNAMIC_ITINERARY = 'DYNAMIC_ITINERARY',
  DIRECTORY = 'DIRECTORY',
  // RIMM Caribbean Night Routes
  RIMM_CLUSTER = 'RIMM_CLUSTER',
  MUSIC_EVENT_DETAIL = 'MUSIC_EVENT_DETAIL',
  ARTIST_DETAIL = 'ARTIST_DETAIL',
  ADMIN_CARIBBEAN_NIGHT = 'ADMIN_CARIBBEAN_NIGHT',
  // Gestión de Artistas y NFTs
  ADMIN_ARTISTAS = 'ADMIN_ARTISTAS',
  ARTISTA_ONBOARDING = 'ARTISTA_ONBOARDING',
  ARTISTA_PORTAL = 'ARTISTA_PORTAL',
  // Gestión de Socios Multi-perfil
  ADMIN_SOCIOS = 'ADMIN_SOCIOS',
  SOCIO_PORTAL = 'SOCIO_PORTAL',
  // Panel de Tareas del Proyecto
  ADMIN_TASKS = 'ADMIN_TASKS',
}

export type UserRole = 'tourist' | 'partner' | 'admin';

// Tipos de Socio/Partner - cada uno tiene su propio portal y campos
export type TipoSocio = 
  | 'artista_musical'      // Artistas del RIMM Cluster
  | 'tour_operador'        // Operadores de tours y excursiones
  | 'alojamiento'          // Hoteles, hostales, Airbnb
  | 'restaurante'          // Restaurantes y bares
  | 'transporte'           // Taxis, lanchas, rentacars
  | 'comercio'             // Tiendas y artesanías
  | 'experiencia'          // Actividades (buceo, snorkel, etc.)
  | 'evento';              // Organizadores de eventos

// Configuración de campos requeridos por tipo de socio
export interface SocioConfig {
  tipo: TipoSocio;
  label: string;
  icon: string;
  color: string;
  camposRequeridos: string[];
  camposOpcionales: string[];
  portalRoute: AppRoute;
}

// Datos del Socio
export interface Socio {
  id: string;
  nombre: string;
  nombreComercial: string;
  tipo: TipoSocio;
  email: string;
  telefono: string;
  // Estado
  estado: 'prospecto' | 'activo' | 'pausado' | 'suspendido';
  verificado: boolean;
  // Financiero
  comisionGuanaGO: number; // Porcentaje que cobra GuanaGO
  walletHedera?: string;
  datosBancarios?: {
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    titular: string;
  };
  // Documentos
  documentosCompletados: string[];
  documentosPendientes: string[];
  // Stats
  productosActivos: number;
  ventasTotales: number;
  calificacionPromedio: number;
  // Metadata
  createdAt: string;
  updatedAt: string;
}
// ============================================================
// SISTEMA DE TAREAS (Admin Tasks / To-Do Panel)
// ============================================================

export type TaskStatus = 'pendiente' | 'en_progreso' | 'urgente_pendiente' | 'terminado' | 'bloqueado';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'critica';
export type TaskCategory = 
  | 'frontend' 
  | 'backend' 
  | 'blockchain' 
  | 'integracion' 
  | 'diseno' 
  | 'documentacion'
  | 'testing'
  | 'devops'
  | 'negocio'
  | 'marketing';

export interface ProjectTask {
  id: string;
  titulo: string;
  descripcion: string;
  status: TaskStatus;
  prioridad: TaskPriority;
  categoria: TaskCategory;
  // Trazabilidad
  archivoReferencia?: string; // Ej: "ARCHITECTURE_MAP.md", "RIMM_NFT_STRATEGY.md"
  seccionReferencia?: string; // Ej: "Fase 2: Contenido"
  // Estimaciones
  estimacionHoras?: number;
  horasReales?: number;
  fechaLimite?: string;
  // Asignación
  asignadoA?: string;
  creadoPor: string;
  // Dependencias
  dependeDe?: string[]; // IDs de tareas que bloquean esta
  bloquea?: string[]; // IDs de tareas que esta bloquea
  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  // Para IA/Make
  notasIA?: string; // Sugerencias de la IA
  ultimoAnalisis?: string; // Fecha del último análisis
}

export interface TaskFilter {
  status?: TaskStatus[];
  prioridad?: TaskPriority[];
  categoria?: TaskCategory[];
  archivoReferencia?: string;
  asignadoA?: string;
}

export interface TaskStats {
  total: number;
  pendientes: number;
  enProgreso: number;
  urgentesPendientes: number;
  terminadas: number;
  bloqueadas: number;
  porCategoria: Record<TaskCategory, number>;
}

// Configuración de colores y etiquetas para el UI
export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' },
  en_progreso: { label: 'En Progreso', color: 'text-blue-400', bgColor: 'bg-blue-900/30' },
  urgente_pendiente: { label: '⚠️ Urgente', color: 'text-red-400', bgColor: 'bg-red-900/30' },
  terminado: { label: 'Terminado', color: 'text-green-400', bgColor: 'bg-green-900/30' },
  bloqueado: { label: 'Bloqueado', color: 'text-gray-400', bgColor: 'bg-gray-900/30' }
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  baja: { label: 'Baja', color: 'text-gray-400', icon: '○' },
  media: { label: 'Media', color: 'text-yellow-400', icon: '◐' },
  alta: { label: 'Alta', color: 'text-orange-400', icon: '●' },
  critica: { label: 'Crítica', color: 'text-red-500', icon: '🔥' }
};

export const TASK_CATEGORY_CONFIG: Record<TaskCategory, { label: string; color: string; icon: string }> = {
  frontend: { label: 'Frontend', color: 'text-cyan-400', icon: '🎨' },
  backend: { label: 'Backend', color: 'text-green-400', icon: '⚙️' },
  blockchain: { label: 'Blockchain', color: 'text-purple-400', icon: '⛓️' },
  integracion: { label: 'Integración', color: 'text-blue-400', icon: '🔗' },
  diseno: { label: 'Diseño', color: 'text-pink-400', icon: '✏️' },
  documentacion: { label: 'Docs', color: 'text-yellow-400', icon: '📄' },
  testing: { label: 'Testing', color: 'text-orange-400', icon: '🧪' },
  devops: { label: 'DevOps', color: 'text-red-400', icon: '🚀' },
  negocio: { label: 'Negocio', color: 'text-emerald-400', icon: '💼' },
  marketing: { label: 'Marketing', color: 'text-fuchsia-400', icon: '📢' }
};