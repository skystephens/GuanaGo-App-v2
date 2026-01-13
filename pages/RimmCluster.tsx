import React, { useEffect, useState } from 'react';
import { 
  Music, Calendar, MapPin, Users, Clock, ArrowLeft, 
  Sparkles, ExternalLink, Ticket, Loader2, AlertCircle,
  ChevronRight, Star, Headphones, Image, ChevronLeft
} from 'lucide-react';
import { api } from '../services/api';
import { AppRoute } from '../types';

interface MusicEvent {
  id: string;
  eventName: string;
  date: string;
  time?: string;
  dayOfWeek?: string;
  price: number;
  artistName: string;
  imageUrl: string;
  spotifyLink?: string;
  description?: string;
  location?: string;
  capacity?: number;
  availableSpots?: number;
}

interface Artist {
  id: string;
  name: string;
  genre: string;
  bio: string;
  imageUrl: string;
  spotifyLink?: string;
  instagramLink?: string;
  youtubeLink?: string;
  upcomingEvents: number;
  isActive: boolean;
}

interface RimmPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  includes: string[];
  category: string;
  active: boolean;
}

interface RimmClusterProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const RimmCluster: React.FC<RimmClusterProps> = ({ onBack, onNavigate }) => {
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [packages, setPackages] = useState<RimmPackage[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'artists' | 'packages' | 'gallery'>('upcoming');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar todos los datos en paralelo
      const [eventsData, artistsData, packagesData, galleryData] = await Promise.all([
        api.musicEvents.list(),
        api.rimmArtists.list(),
        api.rimmPackages.list(),
        api.rimmGallery.list()
      ]);
      
      setEvents(eventsData || []);
      setArtists(artistsData || []);
      setPackages(packagesData || []);
      setGallery(galleryData || []);
    } catch (err) {
      console.error('Error fetching RIMM data:', err);
      setError('No pudimos cargar los datos. Intenta de nuevo.');
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
            Todos los <span className="text-orange-400 font-bold">Jueves 9:30 PM</span> • Música Kriol en vivo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-2 relative z-20">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 flex overflow-x-auto no-scrollbar">
          {[
            { id: 'upcoming', label: 'Próximos', icon: Calendar },
            { id: 'artists', label: 'Artistas', icon: Headphones },
            { id: 'packages', label: 'Paquetes', icon: Ticket },
            { id: 'gallery', label: 'Galería', icon: Image }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
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
                onClick={fetchAllData}
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
              <div>
                <h2 className="text-white font-bold text-lg">Próximos Eventos</h2>
                <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                  <Clock size={12} />
                  Todos los jueves 9:30 PM
                </p>
              </div>
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
                      <span className="text-white/70 text-[10px] font-bold uppercase">JUE</span>
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
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {event.time || '9:30 PM'}
                          </span>
                          {event.availableSpots !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {event.availableSpots} cupos
                            </span>
                          )}
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

        {/* Artists Tab - Conectado a Airtable */}
        {!loading && !error && selectedTab === 'artists' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-white font-bold text-lg">Artistas del Clúster</h2>
              <p className="text-gray-400 text-xs mt-1">Talento Raizal de San Andrés</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {artists.map((artist) => (
                <div 
                  key={artist.id}
                  onClick={() => onNavigate(AppRoute.ARTIST_DETAIL, artist)}
                  className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-600 transition-all"
                >
                  <div className="h-32 relative">
                    <img 
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    {artist.upcomingEvents > 0 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {artist.upcomingEvents} próx.
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="text-white font-bold text-sm truncate">{artist.name}</h3>
                      <p className="text-cyan-300 text-xs">{artist.genre}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 flex justify-between items-center">
                    {artist.spotifyLink ? (
                      <a 
                        href={artist.spotifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-green-400 text-xs font-medium hover:text-green-300"
                      >
                        <ExternalLink size={12} />
                        Spotify
                      </a>
                    ) : (
                      <span className="text-gray-500 text-xs">--</span>
                    )}
                    <span className="text-cyan-400 text-xs font-medium flex items-center gap-1">
                      Ver más
                      <ChevronRight size={12} />
                    </span>
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

        {/* Packages Tab - Conectado a ServiciosTuristicos_SAI */}
        {!loading && !error && selectedTab === 'packages' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-white font-bold text-lg">Paquetes Especiales</h2>
              <p className="text-gray-400 text-xs mt-1">Combos exclusivos Caribbean Night</p>
            </div>
            
            {packages.map(pkg => (
              <div 
                key={pkg.id}
                onClick={() => onNavigate(AppRoute.CHECKOUT, { 
                  type: 'rimm_package', 
                  id: pkg.id,
                  title: pkg.title,
                  price: pkg.price,
                  image: pkg.image,
                  description: pkg.description,
                  includes: pkg.includes
                })}
                className="bg-gradient-to-r from-cyan-900/50 to-orange-900/30 backdrop-blur-sm border border-cyan-700/50 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500 transition-all active:scale-[0.98]"
              >
                {/* Package Image */}
                <div className="h-32 relative">
                  <img 
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-white font-bold text-base">{pkg.title}</h3>
                    <p className="text-gray-300 text-xs mt-0.5">{pkg.description}</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-lg">
                    <span className="font-black text-sm">${pkg.price.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-400 text-xs mb-2 font-medium">Incluye:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.includes.map((item, i) => (
                      <span 
                        key={i}
                        className="bg-cyan-600/30 text-cyan-200 px-2 py-1 rounded-lg text-xs"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>

                  <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <Ticket size={16} />
                    Reservar Paquete
                  </button>
                </div>
              </div>
            ))}

            {packages.length === 0 && (
              <div className="text-center py-12">
                <Ticket size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No hay paquetes disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab */}
        {!loading && !error && selectedTab === 'gallery' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-white font-bold text-lg">Galería del Venue</h2>
              <p className="text-gray-400 text-xs mt-1">Conoce el lugar donde vivimos la música</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((image, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                    index === 0 ? 'col-span-2 h-48' : 'h-32'
                  }`}
                >
                  <img 
                    src={image}
                    alt={`Venue ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors"></div>
                </div>
              ))}
            </div>

            {gallery.length === 0 && (
              <div className="text-center py-12">
                <Image size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No hay fotos disponibles</p>
              </div>
            )}

            {/* Location Info */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 mt-6">
              <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-cyan-400" />
                Ubicación
              </h3>
              <p className="text-gray-300 text-sm">San Andrés Isla, Colombia</p>
              <p className="text-gray-400 text-xs mt-1">El venue exacto se confirma con tu reserva</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xl">×</span>
          </button>
          
          {selectedImage > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage - 1); }}
              className="absolute left-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}
          
          <img 
            src={gallery[selectedImage]}
            alt={`Venue ${selectedImage + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          
          {selectedImage < gallery.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage + 1); }}
              className="absolute right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          )}
          
          <div className="absolute bottom-4 text-white text-sm">
            {selectedImage + 1} / {gallery.length}
          </div>
        </div>
      )}

      {/* Bottom Safe Area */}
      <div className="h-24"></div>
    </div>
  );
};

export default RimmCluster;
