import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, Music, 
  Ticket, Share2, Heart, ChevronDown, ChevronUp,
  ExternalLink, Sparkles, CheckCircle, AlertCircle
} from 'lucide-react';
import { AppRoute } from '../types';
import { api } from '../services/api';

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
  const [selectedTickets, setSelectedTickets] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [availability, setAvailability] = useState<{ available: number; isBlocked: boolean } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

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
      // Fallback a datos mock
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
      time: '8:00 PM' // Default, se puede hacer dinámico
    };
  };

  const handleReservation = () => {
    onNavigate(AppRoute.CHECKOUT, {
      type: 'music_event',
      id: data.id,
      title: data.eventName,
      price: data.price * selectedTickets,
      date: data.date,
      image: data.imageUrl,
      artistName: data.artistName,
      quantity: selectedTickets,
      unitPrice: data.price
    });
  };

  const totalPrice = data.price * selectedTickets;
  const dateInfo = formatDate(data.date);
  const availableSpots = availability?.available ?? data.availableSpots ?? 50;
  const isAvailable = availableSpots > 0 && !availability?.isBlocked;

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
      <div className="px-5 pb-32 -mt-8 relative z-10">
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

        {/* What's Included */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
          <h2 className="text-white font-bold mb-3">¿Qué incluye?</h2>
          <div className="space-y-2">
            {[
              'Entrada al evento',
              'Acceso a zona general',
              'Bebida de bienvenida',
              'Souvenirs del artista'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                <CheckCircle size={16} className="text-green-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Related Tours */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
          <h2 className="text-white font-bold mb-3">Complementa tu experiencia</h2>
          <p className="text-gray-400 text-xs mb-3">Tours relacionados con la cultura Raizal</p>
          
          <div className="space-y-3">
            {[
              { title: 'Tour Cultura Raizal', price: 120000, duration: '4 horas' },
              { title: 'Gastronomía Isleña', price: 85000, duration: '3 horas' }
            ].map((tour, i) => (
              <div 
                key={i}
                onClick={() => onNavigate(AppRoute.TOUR_LIST, { filter: 'cultural' })}
                className="bg-gray-700/50 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-all"
              >
                <div>
                  <p className="text-white text-sm font-medium">{tour.title}</p>
                  <p className="text-gray-400 text-xs">{tour.duration}</p>
                </div>
                <span className="text-cyan-400 font-bold text-sm">
                  +${tour.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Selector */}
        {isAvailable && (
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-white font-bold mb-3">Selecciona tus entradas</h2>
            
            <div className="flex items-center justify-between bg-gray-700/50 rounded-xl p-4">
              <div>
                <p className="text-white font-medium">Entrada General</p>
                <p className="text-gray-400 text-sm">${data.price.toLocaleString()} COP c/u</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedTickets(Math.max(1, selectedTickets - 1))}
                  className="w-8 h-8 bg-gray-600 rounded-lg text-white font-bold hover:bg-gray-500"
                >
                  -
                </button>
                <span className="text-white font-bold text-lg w-8 text-center">{selectedTickets}</span>
                <button 
                  onClick={() => setSelectedTickets(Math.min(availableSpots, selectedTickets + 1))}
                  className="w-8 h-8 bg-cyan-600 rounded-lg text-white font-bold hover:bg-cyan-500"
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs">Total ({selectedTickets} entrada{selectedTickets > 1 ? 's' : ''})</p>
            <p className="text-white font-black text-xl">
              ${totalPrice.toLocaleString()} <span className="text-sm font-normal text-gray-400">COP</span>
            </p>
          </div>
          
          <button 
            onClick={handleReservation}
            disabled={!isAvailable}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isAvailable 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:scale-95'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Ticket size={18} />
            {isAvailable ? 'Reservar Ahora' : 'Agotado'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicEventDetail;
