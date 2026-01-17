import React, { useEffect, useState } from 'react';
import { Music, Calendar, ExternalLink, Loader2, AlertCircle, Ticket, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute } from '../types';

// Estructura de datos esperada del backend
interface MusicEvent {
  id: string;
  eventName: string;
  date: string;
  price: number;
  artistName: string;
  imageUrl: string;
  spotifyLink?: string;
  description?: string;
}

interface CaribbeanNightSectionProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

const CaribbeanNightSection: React.FC<CaribbeanNightSectionProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      console.error('Error fetching Caribbean Night events:', err);
      setError('No pudimos cargar los eventos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = (event: MusicEvent) => {
    // Navegar a la página de detalle del evento musical
    onNavigate(AppRoute.MUSIC_EVENT_DETAIL, {
      id: event.id,
      eventName: event.eventName,
      date: event.date,
      price: event.price,
      artistName: event.artistName,
      imageUrl: event.imageUrl,
      spotifyLink: event.spotifyLink,
      description: event.description
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Featured event (el próximo evento)
  const featuredEvent = events.length > 0 ? events[0] : null;
  
  // Artistas únicos del clúster
  const artists = events.reduce((acc: { name: string; image: string; spotifyLink?: string }[], event) => {
    if (!acc.find(a => a.name === event.artistName)) {
      acc.push({
        name: event.artistName,
        image: event.imageUrl,
        spotifyLink: event.spotifyLink
      });
    }
    return acc;
  }, []);

  return (
    <section className="px-6 py-8 bg-gradient-to-br from-cyan-900 via-teal-800 to-emerald-900 rounded-3xl mx-4 my-6 shadow-xl overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400 opacity-15 rounded-full blur-3xl"></div>
      
      {/* Header - Novedades RIMM */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-orange-400" />
          <span className="text-orange-400 text-xs font-black uppercase tracking-widest">
            Novedades RIMM
          </span>
        </div>
        <h2 className="text-2xl font-black text-white leading-tight">
          Próximas <span className="text-cyan-300">Caribbean Nights</span>
        </h2>
        <p className="text-cyan-100/70 text-sm mt-1">
          Vive la música Kriol en San Andrés 🎵
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-cyan-300" />
          <span className="ml-3 text-cyan-100 font-medium">Cargando eventos...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-200 font-medium text-sm">{error}</p>
            <button 
              onClick={fetchMusicEvents}
              className="text-red-300 text-xs underline mt-1 hover:text-white transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Featured Event Card */}
      {!loading && !error && featuredEvent && (
        <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden mb-6">
          {/* Event Image */}
          <div className="relative h-40 w-full">
            <img 
              src={featuredEvent.imageUrl} 
              alt={featuredEvent.eventName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            
            {/* Date Badge */}
            <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
              <Calendar size={14} />
              <span className="text-xs font-bold">{formatDate(featuredEvent.date)}</span>
            </div>
            
            {/* Live Badge */}
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-[10px] font-black uppercase">Live</span>
            </div>
          </div>
          
          {/* Event Info */}
          <div className="p-4">
            <h3 className="text-white font-black text-lg leading-tight mb-1">
              {featuredEvent.eventName}
            </h3>
            <p className="text-cyan-200 text-sm mb-3 flex items-center gap-2">
              <Music size={14} />
              Artista: <span className="font-semibold">{featuredEvent.artistName}</span>
            </p>
            
            {featuredEvent.description && (
              <p className="text-white/70 text-xs mb-4 line-clamp-2">
                {featuredEvent.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white/60 text-xs">Desde</span>
                <p className="text-orange-400 font-black text-xl">
                  ${featuredEvent.price.toLocaleString()} <span className="text-sm font-normal text-white/60">COP</span>
                </p>
              </div>
              
              <button 
                onClick={() => handleReservation(featuredEvent)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg active:scale-95"
              >
                <Ticket size={16} />
                Reservar Cupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <div className="text-center py-8">
          <Music size={48} className="text-cyan-300/50 mx-auto mb-3" />
          <p className="text-cyan-100/70 text-sm">
            No hay eventos programados por ahora
          </p>
          <p className="text-cyan-200/50 text-xs mt-1">
            ¡Pronto anunciaremos nuevas fechas!
          </p>
        </div>
      )}

      {/* Artist Showcase */}
      {!loading && !error && artists.length > 0 && (
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Music size={16} className="text-orange-400" />
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">
              Nuestros Artistas
            </h3>
          </div>
          
          {/* Horizontal Scrollable Grid */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
            {artists.map((artist, index) => (
              <div 
                key={index}
                onClick={() => onNavigate(AppRoute.ARTIST_DETAIL, { name: artist.name, image: artist.image, spotifyLink: artist.spotifyLink })}
                className="flex-shrink-0 w-28 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:bg-white/20 transition-all cursor-pointer group"
              >
                {/* Artist Image */}
                <div className="h-28 w-full relative overflow-hidden">
                  <img 
                    src={artist.image} 
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                
                {/* Artist Info */}
                <div className="p-3 text-center">
                  <h4 className="text-white font-bold text-xs truncate mb-2">
                    {artist.name}
                  </h4>
                  
                  {artist.spotifyLink ? (
                    <a 
                      href={artist.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400 hover:text-green-300 transition-colors"
                    >
                      <ExternalLink size={10} />
                      Spotify
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
                      <Sparkles size={10} />
                      Ver Creaciones
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      {!loading && !error && events.length > 0 && (
        <div className="mt-6 text-center">
          <button 
            onClick={() => onNavigate(AppRoute.RIMM_CLUSTER)}
            className="text-cyan-200 text-sm font-semibold hover:text-white transition-colors underline underline-offset-4"
          >
            Ver todos los eventos →
          </button>
        </div>
      )}
    </section>
  );
};

export default CaribbeanNightSection;
