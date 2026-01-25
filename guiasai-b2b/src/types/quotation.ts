// Tipo de usuario que cotiza
export interface AgencyUser {
  id: string
  name: string // Nombre de la agencia
  email: string
  phone: string
  company: string // Nombre empresa
  nit: string // Documento fiscal
  country: string
  logo?: string
  createdAt: Date
  subscriptionPlan: 'basic' | 'pro' | 'enterprise'
}

// Cotización principal
export interface Quotation {
  id: string // QT-YYYYMMDD-XXXX
  userId: string
  accommodations: AccommodationItem[]
  tours: TourItem[]
  transports: TransportItem[]
  total: number // Precio total en COP
  currency: 'COP' | 'USD'
  status: 'draft' | 'pending' | 'partial' | 'confirmed' | 'paid' | 'expired'
  confirmationStatus: ConfirmationStatus
  createdAt: Date
  expiresAt: Date
  notes?: string
  paymentLink?: string
  voucherId?: string
}

// Estado de confirmación de cada servicio
export interface ConfirmationStatus {
  accommodationConfirmed: boolean
  accommodationConfirmedAt?: Date
  toursConfirmed: boolean
  toursConfirmedAt?: Date
  transportsConfirmed: boolean
  transportsConfirmedAt?: Date
  allConfirmed: boolean
  confirmationExpires: Date
}

// Item de alojamiento en cotización
export interface AccommodationItem {
  id: string
  hotelId: string
  hotelName: string
  roomType: 'simple' | 'doble' | 'triple' | 'suite'
  checkIn: Date
  checkOut: Date
  nights: number
  quantity: number // Cantidad de habitaciones
  
  // Pasajeros (nuevo - compatibilidad con Cotizaciones_Items)
  adultos: number   // 18-99 años
  ninos: number     // 4-17 años
  bebes: number     // 0-3 años
  
  pricePerNight: number
  total: number
  partnerConfirmed: boolean
  partnerConfirmedAt?: Date
  partnerContact?: string
}

// Item de tour en cotización
export interface TourItem {
  id: string
  tourId: string
  tourName: string
  description: string
  date: Date
  duration: string // "4 horas", "full day", etc
  quantity: number // Cantidad de personas
  
  // Pasajeros (nuevo - compatibilidad con Cotizaciones_Items)
  adultos: number   // 18-99 años
  ninos: number     // 4-17 años
  bebes: number     // 0-3 años
  
  // Horarios (nuevo - desde Dias_Operacion)
  horario?: string  // HH:MM formato 24h (ej: "09:00", "14:00")
  schedule?: string // Alias para horario seleccionado
  diasOperacion?: string // Info completa de días de operación (ej: "Lun-Vie: 09:00, 14:00")
  horariosDisponibles?: string[] // Todos los horarios del tour
  cuposPorHorario?: Record<string, number> // {"09:00": 10, "14:00": 8}
  
  pricePerPerson: number
  total: number
  partnerConfirmed: boolean
  partnerConfirmedAt?: Date
  partnerContact?: string
  included: string[] // Lo que incluye
  notIncluded?: string[]
}

// Item de transporte en cotización
export interface TransportItem {
  id: string
  transportId: string
  transportType: 'airport-hotel' | 'hotel-hotel' | 'custom'
  origin: string
  destination: string
  date: Date
  time?: string
  vehicleType: 'minivan' | 'car' | 'boat' | 'motorbike'
  quantity: number // Cantidad de vehículos
  capacity: number // Personas por vehículo
  totalPassengers: number
  pricePerVehicle: number
  total: number
  partnerConfirmed: boolean
  partnerConfirmedAt?: Date
  partnerContact?: string
}

// Partner/Aliado local
export interface Partner {
  id: string
  name: string
  type: 'accommodation' | 'tour' | 'transport'
  email: string
  phone: string
  whatsapp: string
  address: string
  description: string
  images: string[]
  subscriptionPlan: 'esencial' | 'impacto' | 'full-power'
  isActive: boolean
  averageRating: number
  reviewCount: number
  responseTime: number // minutos promedio
}

// Respuesta de disponibilidad del aliado
export interface AvailabilityResponse {
  quotationItemId: string
  partnerId: string
  isAvailable: boolean
  availableQuantity?: number
  finalPrice?: number
  alternatives?: string[] // IDs de alternativas sugeridas
  respondedAt: Date
  expiresIn: number // segundos
}

// Payment info
export interface PaymentInfo {
  quotationId: string
  amount: number
  currency: 'COP' | 'USD'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  method: 'credit_card' | 'debit_card' | 'transfer' | 'wompi'
  reference: string
  createdAt: Date
  completedAt?: Date
}

// Analytics
export interface QuotationAnalytics {
  totalQuotations: number
  confirmedQuotations: number
  totalValue: number
  averageConfirmationTime: number // minutos
  mostRequestedServices: string[]
  partnerPerformance: Record<string, number> // score 0-100
}
