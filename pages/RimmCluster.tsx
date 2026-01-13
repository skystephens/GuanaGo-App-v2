import React, { useEffect, useState } from 'react';
import { 
  Music, Calendar, MapPin, Users, Clock, ArrowLeft, 
  Sparkles, ExternalLink, Ticket, Loader2, AlertCircle,
  ChevronRight, Star, Headphones
} from 'lucide-react';
import { api } from '../services/api';
import { AppRoute } from '../types';

interface MusicEvent {
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
}

interface RimmClusterProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const RimmCluster: React.FC<RimmClusterProps> = ({ onBack, onNavigate }) => {
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'artists' | 'packages'>('upcoming');

  useEffect(() => {
    fetchMusicEvents();
  }, []);

  const fetchMusicEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.musicEvents.list();
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching RIMM events:', err);
      setError('No pudimos cargar los eventos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase(),
      full: date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    };
  };

  // Artistas únicos
  const artists = events.reduce((acc: { name: string; image: string; spotifyLink?: string; eventCount: number }[], event) => {
    const existing = acc.find(a => a.name === event.artistName);
    if (existing) {
      existing.eventCount++;
    } else {
      acc.push({
        name: event.artistName,
        image: event.imageUrl,
        spotifyLink: event.spotifyLink,
        eventCount: 1
      });
    }
    return acc;
  }, []);

  // Paquetes sugeridos (mock por ahora, conectar con backend después)
  const packages = [
    {
      id: 'pkg-rimm-1',
      title: 'Caribbean Night + Hotel',
      description: 'Entrada al evento + 1 noche en hotel partner',
      price: 250000,
      includes: ['Entrada VIP', '1 noche hotel 4★', 'Desayuno incluido']
    },
    {
      id: 'pkg-rimm-2',
      title: 'Full RIMM Experience',
      description: 'Todos los eventos del mes + tour cultural',
      price: 450000,
      includes: ['3 eventos', 'Tour Cultura Raizal', 'Merchandising RIMM']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-cyan-950 to-gray-900">
      {/* Header */}
      <div className="relative">
        {/* Background Image */}
        <div className="absolute inset-0 h-72">
          <img 
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
            alt="RIMM Caribbean Night"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-900"></div>
        </div>

        {/* Navigation */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-orange-400" />
            <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Clúster Musical</span>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 pt-8 pb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-orange-500 px-2 py-1 rounded-lg">
              <Music size={14} className="text-white" />
            </div>
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">RIMM</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Caribbean <span className="text-cyan-300">Night</span>
          </h1>
          <p className="text-white/70 text-sm">
            Vive la música Kriol y la cultura Raizal de San Andrés en eventos únicos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-2 relative z-20">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 flex">
          {[
            { id: 'upcoming', label: 'Próximos', icon: Calendar },
            { id: 'artists', label: 'Artistas', icon: Headphones },
            { id: 'packages', label: 'Paquetes', icon: Ticket }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                selectedTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-cyan-400" />
            <span className="ml-3 text-cyan-100">Cargando...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-200 font-medium text-sm">{error}</p>
              <button 
                onClick={fetchMusicEvents}
                className="text-red-300 text-xs underline mt-1"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Upcoming Events Tab */}
        {!loading && !error && selectedTab === 'upcoming' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Próximos Eventos</h2>
              <span className="text-cyan-400 text-sm">{events.length} eventos</span>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No hay eventos programados</p>
              </div>
            ) : (
              events.map(event => {
                const date = formatDate(event.date);
                return (
                  <div 
                    key={event.id}
                    onClick={() => onNavigate(AppRoute.MUSIC_EVENT_DETAIL, event)}
                    className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden flex cursor-pointer hover:border-cyan-600 transition-all active:scale-[0.98]"
                  >
                    {/* Date Column */}
                    <div className="w-20 bg-gradient-to-b from-orange-500 to-orange-600 flex flex-col items-center justify-center py-4">
                      <span className="text-white text-2xl font-black">{date.day}</span>
                      <span className="text-white/80 text-xs font-bold">{date.month}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">
                        {event.eventName}
                      </h3>
                      <p className="text-cyan-300 text-xs mb-2 flex items-center gap-1">
                        <Music size={12} />
                        {event.artistName}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-400 text-xs">
                          {event.availableSpots !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {event.availableSpots} cupos
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            San Andrés
                          </span>
                        </div>
                        <span className="text-orange-400 font-bold text-sm">
                          ${event.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center px-3">
                      <ChevronRight size={20} className="text-gray-500" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Artists Tab */}
        {!loading && !error && selectedTab === 'artists' && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">Artistas del Clúster</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {artists.map((artist, index) => (
                <div 
                  key={index}
                  className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden"
                >
                  <div className="h-32 relative">
                    <img 
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="text-white font-bold text-sm truncate">{artist.name}</h3>
                      <p className="text-cyan-300 text-xs">{artist.eventCount} evento(s)</p>
                    </div>
                  </div>
                  
                  <div className="p-3 flex justify-between items-center">
                    {artist.spotifyLink ? (
                      <a 
                        href={artist.spotifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-400 text-xs font-medium hover:text-green-300"
                      >
                        <ExternalLink size={12} />
                        Spotify
                      </a>
                    ) : (
                      <span className="text-gray-500 text-xs">Sin Spotify</span>
                    )}
                    <button className="text-cyan-400 text-xs font-medium flex items-center gap-1">
                      <Star size={12} />
                      Ver más
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {artists.length === 0 && (
              <div className="text-center py-12">
                <Headphones size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No hay artistas disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* Packages Tab */}
        {!loading && !error && selectedTab === 'packages' && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">Paquetes Especiales</h2>
            
            {packages.map(pkg => (
              <div 
                key={pkg.id}
                onClick={() => onNavigate(AppRoute.CHECKOUT, { 
                  type: 'rimm_package', 
                  ...pkg,
                  image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600'
                })}
                className="bg-gradient-to-r from-cyan-900/50 to-orange-900/30 backdrop-blur-sm border border-cyan-700/50 rounded-2xl p-5 cursor-pointer hover:border-cyan-500 transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold text-base">{pkg.title}</h3>
                    <p className="text-gray-300 text-xs mt-1">{pkg.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-orange-400 font-black text-lg">
                      ${pkg.price.toLocaleString()}
                    </span>
                    <p className="text-gray-500 text-xs">COP</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <p className="text-gray-400 text-xs mb-2 font-medium">Incluye:</p>
                  <div className="flex flex-wrap gap-2">
                    {pkg.includes.map((item, i) => (
                      <span 
                        key={i}
                        className="bg-cyan-600/30 text-cyan-200 px-2 py-1 rounded-lg text-xs"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  <Ticket size={16} />
                  Reservar Paquete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Safe Area */}
      <div className="h-24"></div>
    </div>
  );
};

export default RimmCluster;
