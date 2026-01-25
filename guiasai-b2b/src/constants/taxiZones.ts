// Zonas de Taxi oficiales de San Andrés - Tarifas 2026
// Compatible con GuanaGO Travel

export interface TaxiZone {
  id: string;
  name: string;
  sectors: string;
  priceSmall: number;  // 1-4 pasajeros (desde aeropuerto)
  priceLarge: number;  // 5+ pasajeros (van/microbús)
  color: string;
}

export const TAXI_ZONES: TaxiZone[] = [
  { 
    id: 'z1', 
    name: 'Zona 1 - Centro / North End', 
    sectors: 'Centro, North End, El Cliff, Peatonal, Aeropuerto, Spratt Bight',
    priceSmall: 40000,  // 1-4 pasajeros
    priceLarge: 60000,  // 5+ pasajeros
    color: '#FBBF24' // yellow-400
  },
  { 
    id: 'z2', 
    name: 'Zona 2 - San Luis', 
    sectors: 'San Luis, Sound Bay, Rocky Cay, Bahía Sonora',
    priceSmall: 50000,
    priceLarge: 70000,
    color: '#10B981' // green-500
  },
  { 
    id: 'z3', 
    name: 'Zona 3 - La Loma / El Cove', 
    sectors: 'La Loma, El Cove, Orange Hill, Brooks Hill',
    priceSmall: 60000,
    priceLarge: 80000,
    color: '#EC4899' // pink-500
  },
  { 
    id: 'z4', 
    name: 'Zona 4 - Sur / Punta Sur', 
    sectors: 'Punta Sur, South End, Tom Hooker, El Acuario',
    priceSmall: 70000,
    priceLarge: 100000,
    color: '#60A5FA' // blue-400
  },
  { 
    id: 'z5', 
    name: 'Zona 5 - West View / Cove', 
    sectors: 'West View, Cueva de Morgan, Big Pond, Linval',
    priceSmall: 70000,
    priceLarge: 100000,
    color: '#EF4444' // red-500
  }
];

/**
 * Calcula el precio de un traslado basado en pasajeros y zona
 * @param zoneId ID de la zona de destino
 * @param passengers Número de pasajeros (1-15)
 * @param hasLuggage Si hay muchas maletas (reduce capacidad a 3 pax por taxi)
 * @returns Precio total del traslado
 */
export function calculateTaxiPrice(zoneId: string, passengers: number, hasLuggage: boolean = false): number {
  const zone = TAXI_ZONES.find(z => z.id === zoneId);
  if (!zone) return 0;

  // Capacidad por taxi: 4 sin maletas, 3 con muchas maletas
  const capacityPerTaxi = hasLuggage ? 3 : 4;
  
  // 1-4 pax (o 1-3 con maletas) = 1 taxi con tarifa pequeña
  // 5+ pax = múltiples taxis, cada uno cuesta priceSmall
  const taxisNeeded = Math.ceil(passengers / capacityPerTaxi);
  
  // Siempre usar priceSmall (cada taxi cuesta lo mismo)
  const pricePerVehicle = zone.priceSmall;
  
  return taxisNeeded * pricePerVehicle;
}

/**
 * Calcula cuántos vehículos se necesitan para X pasajeros
 * @param passengers Número de pasajeros
 * @param hasLuggage Si hay muchas maletas (reduce capacidad a 3 pax por taxi)
 */
export function calculateVehiclesNeeded(passengers: number, hasLuggage: boolean = false): number {
  const capacityPerTaxi = hasLuggage ? 3 : 4;
  return Math.ceil(passengers / capacityPerTaxi);
}
