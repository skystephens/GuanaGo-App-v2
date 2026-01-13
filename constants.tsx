
import { Tour, Hotel, TaxiZone, Transaction, RewardItem, Badge, Reservation, Client, Package, GuanaLocation } from './types';
import { Wifi, Wind, Utensils, Droplets, Sun, Pill, DollarSign, ShoppingBag, Coffee } from 'lucide-react';
import React from 'react';
import { api } from './services/api';

export const GUANA_LOGO = "https://guanago.travel/wp-content/uploads/sites/2/2025/12/Logotipo-App-guanago-5.png"; 

export const DIRECTORY_DATA: GuanaLocation[] = [
  { id: 'd1', name: 'Droguería Alemana Central', latitude: 12.5847, longitude: -81.7006, category: 'Transporte', price: 0 }, // Usaremos category como discriminador visual
  { id: 'd2', name: 'Cajero Bancolombia Peatonal', latitude: 12.5855, longitude: -81.6990, category: 'Hotel', price: 0 },
  { id: 'd3', name: 'Restaurante La Regatta', latitude: 12.5830, longitude: -81.7015, category: 'Restaurante', price: 45 },
  { id: 'd4', name: 'Droguería San Andrés', latitude: 12.5810, longitude: -81.7030, category: 'Transporte', price: 0 },
  { id: 'd5', name: 'Cajero Servibanca Éxito', latitude: 12.5860, longitude: -81.6980, category: 'Hotel', price: 0 },
  { id: 'd6', name: 'Café Juan Valdez', latitude: 12.5870, longitude: -81.6970, category: 'Restaurante', price: 15 },
];

export const fetchPopularTours = async (): Promise<Tour[]> => {
  try {
    const data = await api.services.listPublic();
    if (data && Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.error("Error fetching popular tours:", error);
    return [];
  }
};

export const POPULAR_TOURS: Tour[] = [
  {
    id: 't1',
    title: 'Tour de Snorkel en Cayo Bolívar',
    rating: 4.8,
    reviews: 256,
    price: 50,
    image: 'https://picsum.photos/id/1039/600/400',
    gallery: ['https://picsum.photos/id/1039/600/400', 'https://picsum.photos/id/1015/600/400'],
    category: 'tour',
    description: 'Explora los arrecifes de coral.',
    duration: '6 horas',
    active: true
  }
];

export const HOTEL_LIST: Hotel[] = [
  {
    id: 'h1',
    title: 'Hotel Boutique del Mar',
    rating: 4.9,
    reviews: 188,
    price: 150,
    image: 'https://picsum.photos/id/164/800/600',
    category: 'hotel',
    address: 'Av. Colombia, San Andrés Isla',
    description: 'Estancia de lujo.',
    amenities: ['Wi-Fi', 'Piscina', 'Desayuno'],
    maxGuests: 4,
    pricePerNight: { 1: 150, 2: 180 },
    active: true
  }
];

// Added HOTEL_DATA export to fix Detail.tsx import error
export const HOTEL_DATA = HOTEL_LIST[0];

export const TAXI_ZONES: TaxiZone[] = [
  { id: 'z1', name: 'Zona 1 (Centro)', sectors: 'Centro, North End', priceSmall: 50000, priceLarge: 70000, color: 'bg-yellow-400' }
];

export const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Wi-Fi': <Wifi size={24} className="text-green-600 mb-2" />,
  'Piscina': <Droplets size={24} className="text-green-600 mb-2" />,
  'Desayuno': <Utensils size={24} className="text-green-600 mb-2" />
};

export const WALLET_TRANSACTIONS: Transaction[] = [];
export const MARKETPLACE_ITEMS: RewardItem[] = [];
export const BADGES: Badge[] = [];
export const PARTNER_CLIENTS: Client[] = [
  { 
    id: 'c1', name: 'Mateo Vargas', email: 'mateo@mail.com', reservations: 3, image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', 
    role: 'tourist', status: 'active', walletBalance: 1250, phone: '+57 301 234 5678', city: 'Bogotá', country: 'Colombia'
  }
];
export const PARTNER_RESERVATIONS: Reservation[] = [];
export const ADMIN_STATS = [];
export const POPULAR_PACKAGES: Package[] = [];
