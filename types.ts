
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
}

export type UserRole = 'tourist' | 'partner' | 'admin';
