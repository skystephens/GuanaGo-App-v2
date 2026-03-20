import React, { useEffect, useState } from 'react';
import { Music, Calendar, ExternalLink, Loader2, AlertCircle, Ticket, Sparkles, Clock, MapPin } from 'lucide-react';
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
  instagramLink?: string;
  description?: string;
  genre?: string;
}

interface CaribbeanNightSectionProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

const CaribbeanNightSection: React.FC<CaribbeanNightSectionProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventsData = await api.musicEvents.list();
      setEvents(eventsData || []);
    } catch (err) {
      console.error('Error fetching Caribbean Night:', err);
      setError('No pudimos cargar los eventos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = (event: MusicEvent) => {
    onNavigate(AppRoute.MUSIC_EVENT_DETAIL, {
      id: event.id, eventName: event.eventName, date: event.date,
      price: event.price, artistName: event.artistName,
      imageUrl: event.imageUrl, spotifyLink: event.spotifyLink,
      description: event.description,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const featuredEvent = events.length > 0 ? events[0] : null;
  const otherEvents = events.slice(1, 4);

  // Artistas únicos
  const artists = events.reduce((acc: MusicEvent[], event) => {
    if (!acc.find(a => a.artistName === event.artistName)) acc.push(event);
    return acc;
  }, []);

  return (
    <section className="mx-4 my-6 overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(160deg, #0d1f2d 0%, #0e2233 40%, #071a1a 100%)' }}>

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden">
        {/* Fondo con imagen del evento destacado */}
        {featuredEvent && (
          <div className="absolute inset-0">
            <img src={featuredEvent.imageUrl} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,31,45,0.5) 0%, rgba(7,26,26,0.95) 100%)' }} />
          </div>
        )}
        {/* Glow orbs */}
        <div className="absolute top-4 right-6 w-36 h-36 rounded-full opacity-25 blur-3xl" style={{ background: '#f97316' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ background: '#06b6d4' }} />

        <div className="relative z-10 px-5 pt-6 pb-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full border" style={{ background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)' }}>
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-[11px] font-black uppercase tracking-widest">Novedades RIMM</span>
          </div>

          <h2 className="text-3xl font-black text-white leading-none mb-1">
            Caribbean <span style={{ color: '#22d3ee' }}>Night</span>
          </h2>
          <p className="text-sm font-medium mb-5" style={{ color: 'rgba(165,243,252,0.7)' }}>
            🎵 Jueves 9:30 PM · Música Kriol en vivo · San Andrés Isla
          </p>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3 py-10 justify-center">
              <Loader2 size={28} className="animate-spin" style={{ color: '#22d3ee' }} />
              <span className="text-sm font-medium" style={{ color: 'rgba(165,243,252,0.8)' }}>Cargando eventos...</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-2xl p-4 flex items-center gap-3 mb-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={22} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-200 text-sm font-medium">{error}</p>
                <button onClick={fetchAll} className="text-red-300 text-xs underline mt-1">Reintentar</button>
              </div>
            </div>
          )}

          {/* ── EVENTO DESTACADO ── */}
          {!loading && !error && featuredEvent && (
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {/* Imagen grande */}
              <div className="relative h-52 w-full">
                <img src={featuredEvent.imageUrl} alt={featuredEvent.eventName} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white text-xs font-bold shadow-lg" style={{ background: '#f97316' }}>
                    <Calendar size={12} />
                    {formatDate(featuredEvent.date)}
                  </div>
                  {featuredEvent.time && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white text-xs font-bold" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                      <Clock size={12} />
                      {featuredEvent.time}
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-black uppercase animate-pulse" style={{ background: '#ef4444' }}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  Live
                </div>

                {/* Info sobre la imagen */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-black text-lg leading-tight">{featuredEvent.eventName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Music size={13} style={{ color: '#67e8f9' }} />
                    <span className="text-sm font-semibold" style={{ color: '#67e8f9' }}>{featuredEvent.artistName}</span>
                    {featuredEvent.genre && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.25)', color: '#a5f3fc' }}>{featuredEvent.genre}</span>}
                  </div>
                </div>
              </div>

              {/* Info + CTA */}
              <div className="p-4">
                {featuredEvent.description && (
                  <p className="text-xs mb-3 leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {featuredEvent.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Entrada desde</span>
                    <p className="font-black text-2xl leading-none mt-0.5" style={{ color: '#fb923c' }}>
                      ${featuredEvent.price.toLocaleString()}
                      <span className="text-xs font-normal ml-1" style={{ color: 'rgba(255,255,255,0.45)' }}>COP</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleReservation(featuredEvent)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white active:scale-95 transition-all shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  >
                    <Ticket size={15} />
                    Reservar Cupo
                  </button>
                </div>
                {/* Social links */}
                <div className="flex gap-3 mt-3">
                  {featuredEvent.spotifyLink && (
                    <a href={featuredEvent.spotifyLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#4ade80' }}>
                      <ExternalLink size={11} /> Spotify
                    </a>
                  )}
                  {featuredEvent.instagramLink && (
                    <a href={featuredEvent.instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#f9a8d4' }}>
                      <ExternalLink size={11} /> Instagram
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PRÓXIMOS EVENTOS (scroll horizontal) ── */}
          {!loading && !error && otherEvents.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(165,243,252,0.5)' }}>Próximas fechas</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                {otherEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleReservation(event)}
                    className="flex-shrink-0 w-44 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div className="relative h-24 w-full">
                      <img src={event.imageUrl} alt={event.artistName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                      <span className="absolute bottom-2 left-2 text-xs font-bold text-white leading-tight">{event.artistName}</span>
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-medium" style={{ color: 'rgba(165,243,252,0.6)' }}>{formatDate(event.date)}</p>
                      <p className="text-sm font-black" style={{ color: '#fb923c' }}>${event.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && events.length === 0 && (
            <div className="text-center py-8">
              <Music size={44} className="mx-auto mb-3 opacity-40" style={{ color: '#22d3ee' }} />
              <p className="text-sm" style={{ color: 'rgba(165,243,252,0.6)' }}>No hay eventos programados por ahora</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(165,243,252,0.35)' }}>¡Pronto anunciaremos nuevas fechas!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ARTISTAS ── */}
      {!loading && !error && artists.length > 0 && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 mb-4">
            <Music size={16} style={{ color: '#fb923c' }} />
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">Artistas</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {artists.map((artist, index) => (
              <div
                key={index}
                onClick={() => onNavigate(AppRoute.ARTIST_DETAIL, { name: artist.artistName, image: artist.imageUrl, spotifyLink: artist.spotifyLink })}
                className="flex-shrink-0 w-28 rounded-2xl overflow-hidden cursor-pointer group active:scale-95 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="relative h-28 overflow-hidden">
                  <img src={artist.imageUrl} alt={artist.artistName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />
                  {artist.genre && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.7)', color: '#fff' }}>
                      {artist.genre}
                    </span>
                  )}
                </div>
                <div className="p-2.5 text-center">
                  <h4 className="text-white font-bold text-[11px] truncate mb-1">{artist.artistName}</h4>
                  {artist.spotifyLink ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#4ade80' }}>
                      <ExternalLink size={9} /> Spotify
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#67e8f9' }}>
                      <Sparkles size={9} /> Ver perfil
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER CTA ── */}
      {!loading && !error && events.length > 0 && (
        <div className="px-5 pb-6 pt-1 text-center">
          <button
            onClick={() => onNavigate(AppRoute.RIMM_CLUSTER)}
            className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}
          >
            <MapPin size={14} />
            Ver todos los eventos →
          </button>
        </div>
      )}
    </section>
  );
};

export default CaribbeanNightSection;
