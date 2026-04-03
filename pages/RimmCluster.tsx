import React, { useEffect, useState } from 'react';
import {
  Music, Calendar, MapPin, Clock, ArrowLeft,
  Sparkles, ExternalLink, Loader2, AlertCircle,
  ChevronRight, Headphones, Image, ChevronLeft
} from 'lucide-react';
import { api } from '../services/api';
import { cachedApi } from '../services/cachedApi';
import { AppRoute, Tour } from '../types';
import { getFromCache } from '../services/cacheService';

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

interface RimmClusterProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const RimmCluster: React.FC<RimmClusterProps> = ({ onBack, onNavigate }) => {
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'artists' | 'gallery'>('upcoming');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Artistas desde Rimm_musicos (en construcción)
      const [eventsData, artistsData] = await Promise.all([
        api.musicEvents.list(),
        cachedApi.getArtists(),
      ]);
      setEvents(eventsData || []);
      setArtists(artistsData || []);

      // Galería: directo de ServiciosTuristicos_SAI
      let allServices: Tour[] = getFromCache<Tour[]>('services_turisticos') || [];
      if (allServices.length === 0) {
        allServices = await api.services.listPublic();
      }

      const caribbeanServices = allServices.filter(s =>
        s.title?.toLowerCase().includes('caribbean night') ||
        s.title?.toLowerCase().includes('caribbean')
      );

      const galleryImages: string[] = [];
      caribbeanServices.forEach(s => {
        const imgs: string[] = (s as any).gallery || (s as any).images || [];
        imgs.forEach(url => { if (url && !galleryImages.includes(url)) galleryImages.push(url); });
        if (s.image && !galleryImages.includes(s.image)) galleryImages.unshift(s.image);
      });
      setGallery(galleryImages);

    } catch (err) {
      console.error('Error fetching RIMM data:', err);
      setError('No pudimos cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
            { id: 'upcoming', label: 'Calendario', icon: Calendar },
            { id: 'artists', label: 'Artistas', icon: Headphones },
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

        {/* Calendar Tab */}
        {!loading && !error && selectedTab === 'upcoming' && (() => {
          const today = new Date();
          const year = calendarDate.getFullYear();
          const month = calendarDate.getMonth();
          const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const monthName = calendarDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

          const cells: (number | null)[] = [
            ...Array(firstDay).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
          ];
          // pad to full weeks
          while (cells.length % 7 !== 0) cells.push(null);

          const isThursday = (day: number) => new Date(year, month, day).getDay() === 4;
          const isToday = (day: number) =>
            day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isPast = (day: number) => new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <div>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <ChevronLeft size={18} className="text-gray-300" />
                </button>
                <div className="text-center">
                  <p className="text-white font-bold capitalize">{monthName}</p>
                  <p className="text-orange-400 text-xs font-medium flex items-center justify-center gap-1 mt-0.5">
                    <Clock size={11} />
                    Todos los jueves · 9:30 PM
                  </p>
                </div>
                <button
                  onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d, i) => (
                  <div key={d} className={`text-center text-[11px] font-bold pb-2 ${i === 4 ? 'text-orange-400' : 'text-gray-500'}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const thu = isThursday(day);
                  const tod = isToday(day);
                  const past = isPast(day);
                  return (
                    <div key={day} className="flex flex-col items-center py-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                          ${thu && !past ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : ''}
                          ${thu && past ? 'bg-orange-900/40 text-orange-500/60' : ''}
                          ${tod && !thu ? 'ring-2 ring-cyan-400 text-white' : ''}
                          ${!thu && !tod ? 'text-gray-500' : ''}
                        `}
                      >
                        {day}
                      </div>
                      {thu && !past && (
                        <div className="w-1 h-1 rounded-full bg-orange-400 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-orange-500" />
                  <span className="text-gray-400 text-xs">Caribbean Night</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg ring-2 ring-cyan-400" />
                  <span className="text-gray-400 text-xs">Hoy</span>
                </div>
              </div>

              {/* Info card */}
              <div className="mt-5 bg-gray-800/60 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Music size={18} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-bold">Evento fijo semanal</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Caribbean Night se realiza <span className="text-orange-300 font-medium">todos los jueves del año</span> a las 9:30 PM. Los artistas rotan cada semana.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

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
