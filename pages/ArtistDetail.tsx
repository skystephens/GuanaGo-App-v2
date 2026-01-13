import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Music, Calendar, ExternalLink, Instagram, 
  Youtube, Headphones, Loader2, AlertCircle, Star
} from 'lucide-react';
import { AppRoute } from '../types';
import { api } from '../services/api';

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

interface ArtistDetailProps {
  data?: Artist;
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ data, onBack, onNavigate }) => {
  const [artist, setArtist] = useState<Artist | null>(data || null);
  const [loading, setLoading] = useState(!data);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!data) {
      // Si no hay data, intentar cargar
      setLoading(false);
    } else {
      fetchArtistEvents();
    }
  }, [data]);

  const fetchArtistEvents = async () => {
    try {
      const events = await api.musicEvents.list();
      const artistEvents = events.filter(e => e.artistName === artist?.name);
      setUpcomingEvents(artistEvents);
    } catch (err) {
      console.error('Error fetching artist events:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-white text-center mb-4">Artista no encontrado</p>
        <button onClick={onBack} className="text-cyan-400 underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <div className="relative h-80">
        <img 
          src={artist.imageUrl}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          
          <div className="bg-orange-500 px-3 py-1 rounded-full flex items-center gap-2">
            <Headphones size={14} className="text-white" />
            <span className="text-white text-xs font-bold">RIMM Artist</span>
          </div>
        </div>

        {/* Artist Name */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-white font-black text-3xl mb-1">{artist.name}</h1>
          <p className="text-cyan-300 font-medium flex items-center gap-2">
            <Music size={16} />
            {artist.genre}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-24">
        {/* Social Links */}
        <div className="flex gap-3 py-4 border-b border-gray-800">
          {artist.spotifyLink && (
            <a 
              href={artist.spotifyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-green-500 transition-colors"
            >
              <ExternalLink size={16} />
              Spotify
            </a>
          )}
          {artist.instagramLink && (
            <a 
              href={artist.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <Instagram size={16} />
              Instagram
            </a>
          )}
          {artist.youtubeLink && (
            <a 
              href={artist.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-red-500 transition-colors"
            >
              <Youtube size={16} />
              YouTube
            </a>
          )}
        </div>

        {/* Bio */}
        <div className="py-6 border-b border-gray-800">
          <h2 className="text-white font-bold mb-3">Sobre el artista</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{artist.bio}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 py-6 border-b border-gray-800">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-orange-400 font-black text-2xl">{artist.upcomingEvents}</p>
            <p className="text-gray-400 text-xs mt-1">Próximos eventos</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={20} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-black text-2xl">4.9</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">Rating shows</p>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="py-6">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-cyan-400" />
              Próximas presentaciones
            </h2>
            
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div 
                  key={event.id}
                  onClick={() => onNavigate(AppRoute.MUSIC_EVENT_DETAIL, event)}
                  className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="w-14 h-14 bg-orange-500 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-white font-black text-lg">
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-white/80 text-[10px] uppercase">
                      {new Date(event.date).toLocaleDateString('es-CO', { month: 'short' })}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm">{event.eventName}</h3>
                    <p className="text-gray-400 text-xs">{event.dayOfWeek} • {event.time}</p>
                  </div>
                  
                  <span className="text-cyan-400 font-bold text-sm">
                    ${event.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button 
          onClick={() => onNavigate(AppRoute.RIMM_CLUSTER)}
          className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
        >
          <Music size={18} />
          Ver todos los eventos Caribbean Night
        </button>
      </div>
    </div>
  );
};

export default ArtistDetail;
