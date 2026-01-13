import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, Music, 
  Ticket, Share2, Heart, ChevronDown, ChevronUp,
  ExternalLink, Sparkles, CheckCircle, AlertCircle,
  Car, Utensils, Wine, Star, ShoppingCart
} from 'lucide-react';
import { AppRoute } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';

// Paquetes disponibles para Caribbean Night
interface EventPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
  isPopular?: boolean;
  icon: React.ReactNode;
}

interface MusicEventDetailProps {
  data: {
    id: string;
    eventName: string;
    date: string;
    price: number;
    artistName: string;
    imageUrl: string;
    spotifyLink?: string;
    description?: string;
    location?: string;
    capacity?: number;
    availableSpots?: number;
  };
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const MusicEventDetail: React.FC<MusicEventDetailProps> = ({ data, onBack, onNavigate }) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('basic');
  const [selectedTickets, setSelectedTickets] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [availability, setAvailability] = useState<{ available: number; isBlocked: boolean } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  // Usar hook de carrito (try-catch para cuando no está disponible)
  let cartHook: ReturnType<typeof useCart> | null = null;
  try {
    cartHook = useCart();
  } catch (e) {
    // Cart provider not available
  }

  // Paquetes de Caribbean Night
  const packages: EventPackage[] = [
    {
      id: 'basic',
      name: 'Entrada Básica',
      description: 'Acceso al show en zona general',
      price: data.price,
      includes: ['Entrada al evento', 'Acceso a zona general'],
      icon: <Ticket size={20} className="text-cyan-400" />
    },
    {
      id: 'transport',
      name: 'Entrada + Transporte',
      description: 'Incluye taxi ida y vuelta',
      price: data.price + 35000,
      includes: ['Entrada al evento', 'Acceso a zona general', 'Transporte en taxi (ida y vuelta)'],
      icon: <Car size={20} className="text-orange-400" />
    },
    {
      id: 'vip',
      name: 'Experiencia VIP',
      description: 'La experiencia completa Caribbean Night',
      price: data.price + 85000,
      includes: [
        'Entrada al evento',
        'Acceso a sección preferencial',
        'Cóctel de bienvenida',
        'Degustación gastronómica',
        'Transporte en taxi (ida y vuelta)'
      ],
      isPopular: true,
      icon: <Star size={20} className="text-yellow-400" />
    }
  ];

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const result = await api.inventory.checkAvailability(data.id, data.date);
      setAvailability(result);
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailability({ available: data.availableSpots || 50, isBlocked: false });
    } finally {
      setLoadingAvailability(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleDateString('es-CO', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      }),
      time: '9:30 PM',
      dayOfWeek: 'Jueves'
    };
  };

  const selectedPkg = packages.find(p => p.id === selectedPackage) || packages[0];
  const totalPrice = selectedPkg.price * selectedTickets;
  const dateInfo = formatDate(data.date);
  const availableSpots = availability?.available ?? data.availableSpots ?? 50;
  const isAvailable = availableSpots > 0 && !availability?.isBlocked;

  const handleAddToCart = () => {
    if (cartHook?.addToCart) {
      // Agregar al carrito con los datos del paquete seleccionado
      cartHook.addToCart(
        {
          id: `${data.id}-${selectedPackage}`,
          title: `${data.eventName} - ${selectedPkg.name}`,
          price: selectedPkg.price,
          image: data.imageUrl,
          rating: 5,
          reviews: 0,
          category: 'tour' as const,
          active: true,
          description: `${selectedPkg.description} | ${data.artistName} | ${dateInfo.full}`
        },
        selectedTickets,
        data.date,
        dateInfo.time
      );
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } else {
      // Fallback: ir directo a checkout
      handleReservation();
    }
  };

  const handleReservation = () => {
    onNavigate(AppRoute.CHECKOUT, {
      type: 'music_event',
      id: data.id,
      title: `${data.eventName} - ${selectedPkg.name}`,
      price: totalPrice,
      unitPrice: selectedPkg.price,
      date: data.date,
      time: dateInfo.time,
      image: data.imageUrl,
      artistName: data.artistName,
      quantity: selectedTickets,
      packageId: selectedPackage,
      packageName: selectedPkg.name,
      includes: selectedPkg.includes
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Image */}
      <div className="relative h-72">
        <img 
          src={data.imageUrl}
          alt={data.eventName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center ${
                isLiked ? 'bg-red-500' : 'bg-black/40'
              }`}
            >
              <Heart size={20} className={isLiked ? 'text-white fill-white' : 'text-white'} />
            </button>
            <button className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Share2 size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Live Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
          <Sparkles size={14} />
          <span className="text-xs font-bold">RIMM Caribbean Night</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-36 -mt-8 relative z-10">
        {/* Title Card */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
          <h1 className="text-white font-black text-xl mb-2">{data.eventName}</h1>
          
          <div className="flex items-center gap-2 text-cyan-300 mb-4">
            <Music size={16} />
            <span className="font-medium">{data.artistName}</span>
            {data.spotifyLink && (
              <a 
                href={data.spotifyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"
              >
                <ExternalLink size={12} />
                Spotify
              </a>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Fecha</p>
                <p className="text-white text-sm font-medium capitalize">{dateInfo.full}</p>
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Hora</p>
                <p className="text-white text-sm font-medium">{dateInfo.time}</p>
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <MapPin size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Ubicación</p>
                <p className="text-white text-sm font-medium">{data.location || 'San Andrés Isla'}</p>
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isAvailable ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <Users size={18} className={isAvailable ? 'text-green-400' : 'text-red-400'} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Cupos</p>
                {loadingAvailability ? (
                  <p className="text-gray-400 text-sm">Verificando...</p>
                ) : (
                  <p className={`text-sm font-medium ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {isAvailable ? `${availableSpots} disponibles` : 'Agotados'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
          <h2 className="text-white font-bold mb-3">Sobre el evento</h2>
          <p className={`text-gray-300 text-sm leading-relaxed ${!showFullDescription && 'line-clamp-3'}`}>
            {data.description || 
              `Únete a una noche mágica de música Kriol en vivo con ${data.artistName}. 
              Disfruta de los ritmos auténticos del Caribe colombiano en un ambiente único. 
              Esta es una experiencia cultural que celebra la tradición Raizal de San Andrés Isla.
              El evento incluye presentaciones en vivo, interacción con los artistas y una atmósfera 
              inolvidable frente al mar Caribe.`
            }
          </p>
          <button 
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-cyan-400 text-sm mt-2 flex items-center gap-1"
          >
            {showFullDescription ? (
              <>Ver menos <ChevronUp size={14} /></>
            ) : (
              <>Ver más <ChevronDown size={14} /></>
            )}
          </button>
        </div>

        {/* What's Included (Basic) */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
          <h2 className="text-white font-bold mb-3">¿Qué incluye la entrada básica?</h2>
          <div className="space-y-2">
            {['Entrada al evento', 'Acceso a zona general'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                <CheckCircle size={16} className="text-green-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Package Selection */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
          <h2 className="text-white font-bold mb-2">Complementa tu experiencia</h2>
          <p className="text-gray-400 text-xs mb-4">Elige el paquete que mejor se adapte a ti</p>
          
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPackage === pkg.id 
                    ? 'bg-cyan-900/40 border-2 border-cyan-500' 
                    : 'bg-gray-700/50 border-2 border-transparent hover:border-gray-600'
                }`}
              >
                {/* Popular Badge */}
                {pkg.isPopular && (
                  <div className="absolute -top-2 right-3 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    MÁS POPULAR
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  {/* Radio */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    selectedPackage === pkg.id ? 'border-cyan-500 bg-cyan-500' : 'border-gray-500'
                  }`}>
                    {selectedPackage === pkg.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {pkg.icon}
                        <span className="text-white font-bold text-sm">{pkg.name}</span>
                      </div>
                      <span className="text-orange-400 font-black">
                        ${pkg.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-2">{pkg.description}</p>
                    
                    {/* Includes */}
                    <div className="flex flex-wrap gap-1">
                      {pkg.includes.map((item, i) => (
                        <span 
                          key={i}
                          className="text-[10px] bg-gray-600/50 text-gray-300 px-2 py-0.5 rounded-full"
                        >
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Quantity */}
        {isAvailable && (
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-white font-bold mb-3">Cantidad de entradas</h2>
            
            <div className="flex items-center justify-between bg-gray-700/50 rounded-xl p-4">
              <div>
                <p className="text-white font-medium">{selectedPkg.name}</p>
                <p className="text-gray-400 text-sm">${selectedPkg.price.toLocaleString()} COP c/u</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedTickets(Math.max(1, selectedTickets - 1))}
                  className="w-10 h-10 bg-gray-600 rounded-lg text-white font-bold hover:bg-gray-500 text-xl"
                >
                  -
                </button>
                <span className="text-white font-bold text-xl w-10 text-center">{selectedTickets}</span>
                <button 
                  onClick={() => setSelectedTickets(Math.min(availableSpots, selectedTickets + 1))}
                  className="w-10 h-10 bg-cyan-600 rounded-lg text-white font-bold hover:bg-cyan-500 text-xl"
                >
                  +
                </button>
              </div>
            </div>

            {selectedTickets >= availableSpots && (
              <p className="text-orange-400 text-xs mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                Máximo de cupos disponibles alcanzado
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-gray-400 text-xs">
              {selectedPkg.name} × {selectedTickets}
            </p>
            <p className="text-white font-black text-xl">
              ${totalPrice.toLocaleString()} <span className="text-sm font-normal text-gray-400">COP</span>
            </p>
          </div>
          
          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            disabled={!isAvailable || addedToCart}
            className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              addedToCart
                ? 'bg-green-600 text-white'
                : isAvailable 
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={18} />
            {addedToCart ? '✓' : ''}
          </button>
          
          {/* Reserve Button */}
          <button 
            onClick={handleReservation}
            disabled={!isAvailable}
            className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isAvailable 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:scale-95'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Ticket size={18} />
            {isAvailable ? 'Reservar' : 'Agotado'}
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {addedToCart && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-pulse">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Agregado al carrito</span>
        </div>
      )}
    </div>
  );
};

export default MusicEventDetail;
