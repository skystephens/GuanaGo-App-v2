
import { Tour, Hotel, TaxiZone, Transaction, RewardItem, Badge, Reservation, Client, Package, GuanaLocation } from './types';
import { Wifi, Wind, Utensils, Droplets, Sun, Pill, DollarSign, ShoppingBag, Coffee, Heart, Bed } from 'lucide-react';
import React from 'react';
import { api } from './services/api';

export const GUANA_LOGO = "https://guiasanandresislas.com/wp-content/uploads/2026/01/Logotipo-App-guanago.png"; 

export const DIRECTORY_DATA: GuanaLocation[] = [
  // FARMACIAS / DROGUERÍAS
  { id: 'd1', name: 'Droguería Alemana Central', latitude: 12.5847, longitude: -81.7006, category: 'Droguería', price: 0, description: 'Medicamentos y productos de salud' },
  { id: 'd2', name: 'Droguería San Andrés', latitude: 12.5810, longitude: -81.7030, category: 'Droguería', price: 0, description: 'Farmacia 24 horas' },
  { id: 'd3', name: 'Droguería La Económica', latitude: 12.5820, longitude: -81.6995, category: 'Droguería', price: 0, description: 'Precios accesibles' },
  
  // CAJEROS / BANCOS
  { id: 'd4', name: 'Cajero Bancolombia Peatonal', latitude: 12.5855, longitude: -81.6990, category: 'Cajero', price: 0, description: 'Retiros hasta $3M' },
  { id: 'd5', name: 'Cajero Servibanca Éxito', latitude: 12.5860, longitude: -81.6980, category: 'Cajero', price: 0, description: 'Retiros y depósitos' },
  { id: 'd6', name: 'Banco Davivienda', latitude: 12.5840, longitude: -81.7002, category: 'Cajero', price: 0, description: 'Servicios bancarios completos' },
  { id: 'd7', name: 'Banco Popular Centro', latitude: 12.5850, longitude: -81.7010, category: 'Cajero', price: 0, description: 'Cambio de divisas' },
  
  // RESTAURANTES
  { id: 'd8', name: 'Restaurante La Regatta', latitude: 12.5830, longitude: -81.7015, category: 'Restaurante', price: 45, description: 'Mariscos y cocina caribeña' },
  { id: 'd9', name: 'Café Juan Valdez', latitude: 12.5870, longitude: -81.6970, category: 'Cafetería', price: 15, description: 'El mejor café colombiano' },
  { id: 'd10', name: 'Miss Celia Restaurant', latitude: 12.5565, longitude: -81.7185, category: 'Restaurante', price: 55, description: 'Gastronomía raizal auténtica' },
  { id: 'd11', name: 'Donde Francesca', latitude: 12.5845, longitude: -81.7005, category: 'Restaurante', price: 40, description: 'Comida italiana y mariscos' },
  { id: 'd12', name: 'Restaurante El Muelle', latitude: 12.5836, longitude: -81.7020, category: 'Restaurante', price: 50, description: 'Vista al mar' },
  { id: 'd13', name: 'Capitol Burger', latitude: 12.5852, longitude: -81.6998, category: 'Restaurante', price: 25, description: 'Las mejores hamburguesas' },
  { id: 'd14', name: 'La Pizzería', latitude: 12.5848, longitude: -81.6993, category: 'Restaurante', price: 30, description: 'Pizza artesanal' },
  
  // HOTELES
  { id: 'd15', name: 'Hotel Sunrise Beach', latitude: 12.5898, longitude: -81.6955, category: 'Hotel', price: 180, description: 'Frente al mar, piscina' },
  { id: 'd16', name: 'Decameron San Luis', latitude: 12.5560, longitude: -81.7190, category: 'Hotel', price: 350, description: 'All inclusive resort' },
  { id: 'd17', name: 'Hotel Arena Blanca', latitude: 12.5880, longitude: -81.6965, category: 'Hotel', price: 150, description: 'Económico y céntrico' },
  { id: 'd18', name: 'Posada Nativa Casa Bella', latitude: 12.5570, longitude: -81.7175, category: 'Hospedaje', price: 90, description: 'Experiencia raizal' },
  { id: 'd19', name: 'Hotel Cocoplum', latitude: 12.5850, longitude: -81.6988, category: 'Hotel', price: 200, description: 'Playa privada' },
  
  // TIENDAS Y COMPRAS
  { id: 'd20', name: 'Centro Comercial New Point', latitude: 12.5843, longitude: -81.6995, category: 'Tienda', price: 0, description: 'Zona duty free' },
  { id: 'd21', name: 'Éxito San Andrés', latitude: 12.5865, longitude: -81.6982, category: 'Tienda', price: 0, description: 'Supermercado' },
  { id: 'd22', name: 'Licores Típicos', latitude: 12.5841, longitude: -81.7008, category: 'Tienda', price: 0, description: 'Ron y licores locales' },
  
  // PUNTOS TURÍSTICOS
  { id: 'd23', name: 'Playa Spratt Bight', latitude: 12.5885, longitude: -81.6950, category: 'Playa', price: 0, description: 'Playa principal' },
  { id: 'd24', name: 'Rocky Cay', latitude: 12.5420, longitude: -81.7050, category: 'Playa', price: 0, description: 'Snorkel natural' },
  { id: 'd25', name: 'Cueva de Morgan', latitude: 12.5280, longitude: -81.7280, category: 'Atracción', price: 18000, description: 'Historia pirata' },
  { id: 'd26', name: 'Hoyo Soplador', latitude: 12.5180, longitude: -81.7350, category: 'Atracción', price: 10000, description: 'Fenómeno natural' },
  { id: 'd27', name: 'Acuario San Andrés', latitude: 12.5580, longitude: -81.7170, category: 'Atracción', price: 20000, description: 'Tour marino' },
  
  // TRANSPORTE
  { id: 'd28', name: 'Aeropuerto Gustavo Rojas Pinilla', latitude: 12.5827, longitude: -81.7085, category: 'Transporte', price: 0, description: 'Aeropuerto internacional' },
  { id: 'd29', name: 'Muelle Turístico', latitude: 12.5832, longitude: -81.7028, category: 'Transporte', price: 0, description: 'Lanchas a Johnny Cay' },
  { id: 'd30', name: 'Punto de Mulas', latitude: 12.5855, longitude: -81.6985, category: 'Transporte', price: 0, description: 'Alquiler de motos' },
  
  // SALUD
  { id: 'd31', name: 'Hospital Amor de Patria', latitude: 12.5800, longitude: -81.7050, category: 'Hospital', price: 0, description: 'Urgencias 24h' },
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
    price: 85000,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
    gallery: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600', 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=600'],
    category: 'tour',
    description: 'Explora los arrecifes de coral más impresionantes del Caribe. Incluye equipo de snorkel, almuerzo típico y bebidas.',
    duration: '6 horas',
    active: true
  },
  {
    id: 't2',
    title: 'Paseo a Johnny Cay',
    rating: 4.9,
    reviews: 412,
    price: 55000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'],
    category: 'tour',
    description: 'Visita la isla más icónica de San Andrés. Playa de arena blanca, música reggae y comida local.',
    duration: '4 horas',
    active: true
  },
  {
    id: 't3',
    title: 'Tour del Acuario y Haynes Cay',
    rating: 4.7,
    reviews: 328,
    price: 70000,
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600',
    gallery: ['https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600'],
    category: 'tour',
    description: 'Nada con mantarrayas y tiburones nodriza en aguas cristalinas. Almuerzo de mariscos incluido.',
    duration: '5 horas',
    active: true
  },
  {
    id: 't4',
    title: 'Tour Vuelta a la Isla',
    rating: 4.6,
    reviews: 189,
    price: 45000,
    image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600',
    gallery: ['https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600'],
    category: 'tour',
    description: 'Recorre todos los puntos turísticos: Hoyo Soplador, Cueva de Morgan, West View, La Piscinita.',
    duration: '4 horas',
    active: true
  },
  {
    id: 't5',
    title: 'Kayak en el Mar de los 7 Colores',
    rating: 4.8,
    reviews: 156,
    price: 65000,
    image: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=600',
    gallery: ['https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=600'],
    category: 'tour',
    description: 'Aventura en kayak por las aguas turquesas de San Andrés. Incluye instructor y refrigerio.',
    duration: '3 horas',
    active: true
  },
  {
    id: 't6',
    title: 'Buceo Certificado 2 Tanques',
    rating: 4.9,
    reviews: 98,
    price: 250000,
    image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600',
    gallery: ['https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600'],
    category: 'tour',
    description: 'Buceo para certificados en los mejores spots: Blue Hole, Trampa Turtle y El Avión.',
    duration: '4 horas',
    active: true
  },
  {
    id: 't7',
    title: 'Tour Gastronómico Raizal',
    rating: 4.7,
    reviews: 87,
    price: 120000,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    gallery: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600'],
    category: 'tour',
    description: 'Degusta los sabores auténticos de la cocina raizal: rondón, crab back, y coconut rice.',
    duration: '3 horas',
    active: true
  },
  {
    id: 't8',
    title: 'Sunset Catamaran Party',
    rating: 4.8,
    reviews: 234,
    price: 95000,
    image: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=600',
    gallery: ['https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=600'],
    category: 'tour',
    description: 'Fiesta en catamarán con barra libre, DJ y el mejor atardecer del Caribe.',
    duration: '3 horas',
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
    description: 'Estancia de lujo frente al mar con acceso privado a la playa, piscina climatizada y servicio de lujo 24/7.',
    amenities: ['Wi-Fi', 'Piscina', 'Desayuno', 'Jacuzzi'],
    maxGuests: 4,
    pricePerNight: { 1: 150, 2: 180 },
    active: true,
    accommodationType: 'Hotel Boutique',
    allowBabies: true,
    babyPolicy: 'Niños de 0 a 3 años no se cobran como huésped. A partir de 4 años se cuentan como adulto.',
    singleBeds: 1,
    doubleBeds: 1,
    queenBeds: 0,
    kingBeds: 0,
    hasPool: true,
    hasJacuzzi: true,
    hasKitchen: false,
    includesBreakfast: true
  },
  {
    id: 'h2',
    title: 'Posada Nativa Raizal',
    rating: 4.7,
    reviews: 142,
    price: 100,
    image: 'https://picsum.photos/id/165/800/600',
    category: 'hotel',
    address: 'Calle 20, San Andrés Centro',
    description: 'Alojamiento típico con auténtica hospitalidad raizal. Desayuno casero incluido.',
    amenities: ['Wi-Fi', 'Desayuno'],
    maxGuests: 3,
    pricePerNight: { 1: 100, 2: 130 },
    active: true,
    accommodationType: 'Posada Nativa',
    allowBabies: true,
    babyPolicy: 'Aceptamos bebés. Niños 0-3 años no generan costo. Comunica sus necesidades especiales.',
    singleBeds: 2,
    doubleBeds: 1,
    hasPool: false,
    hasJacuzzi: false,
    includesBreakfast: true
  },
  {
    id: 'h3',
    title: 'Apartahotel Playa Azul',
    rating: 4.5,
    reviews: 96,
    price: 120,
    image: 'https://picsum.photos/id/166/800/600',
    category: 'hotel',
    address: 'Frente al Mar, San Andrés',
    description: 'Apartamentos modernos con cocina equipada, perfectos para familias largas.',
    amenities: ['Wi-Fi', 'Piscina', 'Cocina Equipada'],
    maxGuests: 5,
    pricePerNight: { 1: 120, 2: 150, 3: 170 },
    active: true,
    accommodationType: 'Aparta Hotel',
    allowBabies: true,
    babyPolicy: 'Perfecto para familias. Bebés 0-3 sin costo. Contamos con cuna disponible.',
    singleBeds: 2,
    doubleBeds: 1,
    queenBeds: 1,
    hasPool: true,
    hasJacuzzi: false,
    hasKitchen: true,
    includesBreakfast: false
  }
];

// Added HOTEL_DATA export to fix Detail.tsx import error
export const HOTEL_DATA = HOTEL_LIST[0];

// Zonas de Taxi oficiales de San Andrés - Tarifas 2026
export const TAXI_ZONES: TaxiZone[] = [
  { 
    id: 'z1', 
    name: 'Zona 1 - Centro / North End', 
    sectors: 'Centro, North End, El Cliff, Peatonal, Aeropuerto, Spratt Bight',
    priceSmall: 25000,  // 1-4 pasajeros (desde aeropuerto)
    priceLarge: 35000,  // 5+ pasajeros (van/microbús)
    color: 'bg-yellow-400' 
  },
  { 
    id: 'z2', 
    name: 'Zona 2 - San Luis', 
    sectors: 'San Luis, Sound Bay, Rocky Cay, Bahía Sonora',
    priceSmall: 30000,  // desde aeropuerto
    priceLarge: 45000,
    color: 'bg-green-500' 
  },
  { 
    id: 'z3', 
    name: 'Zona 3 - La Loma / El Cove', 
    sectors: 'La Loma, El Cove, Orange Hill, Brooks Hill',
    priceSmall: 40000,  // desde aeropuerto
    priceLarge: 60000,
    color: 'bg-pink-500' 
  },
  { 
    id: 'z4', 
    name: 'Zona 4 - Sur / Punta Sur', 
    sectors: 'Punta Sur, South End, Tom Hooker, El Acuario',
    priceSmall: 70000,  // desde aeropuerto
    priceLarge: 100000,
    color: 'bg-blue-400' 
  },
  { 
    id: 'z5', 
    name: 'Zona 5 - West View / Cove', 
    sectors: 'West View, Cueva de Morgan, Big Pond, Linval',
    priceSmall: 55000,  // desde aeropuerto
    priceLarge: 80000,
    color: 'bg-red-500' 
  }
];

export const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Wi-Fi': <Wifi size={24} className="text-green-600 mb-2" />,
  'Piscina': <Droplets size={24} className="text-blue-600 mb-2" />,
  'Desayuno': <Utensils size={24} className="text-green-600 mb-2" />,
  'Jacuzzi': <Droplets size={24} className="text-purple-600 mb-2" />,
  'Acepta Bebés': <Heart size={24} className="text-pink-600 mb-2" />,
  'Cama Sencilla': <Bed size={24} className="text-indigo-600 mb-2" />,
  'Cama Doble': <Bed size={24} className="text-indigo-600 mb-2" />,
  'Cama Queen': <Bed size={24} className="text-indigo-600 mb-2" />,
  'Cama King': <Bed size={24} className="text-indigo-600 mb-2" />
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
