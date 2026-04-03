import React, { useEffect, useState } from 'react';
import { Music, ExternalLink, Loader2, Ticket, Sparkles, MapPin, ChevronRight, Car, UtensilsCrossed } from 'lucide-react';
import { api } from '../services/api';
import { AppRoute, Tour } from '../types';
import { getFromCache } from '../services/cacheService';
import { getPrecioB2C } from '../services/pricing';

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
  const [paquetes, setPaquetes] = useState<Tour[]>([]);

  useEffect(() => {
    fetchAll();
    loadPaquetes();
    const onCacheUpdated = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (key === 'services_turisticos') loadPaquetes();
    };
    window.addEventListener('guanago:cache-updated', onCacheUpdated);
    return () => window.removeEventListener('guanago:cache-updated', onCacheUpdated);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const eventsData = await api.musicEvents.list();
      setEvents(eventsData || []);
    } catch {
      // silencioso — la sección funciona sin eventos
    } finally {
      setLoading(false);
    }
  };

  const loadPaquetes = async () => {
    let all: Tour[] = getFromCache<Tour[]>('services_turisticos') || [];
    if (all.length === 0) {
      all = await api.services.listPublic();
    }
    const caribbean = all.filter(s =>
      s.title?.toLowerCase().includes('caribbean night') ||
      s.title?.toLowerCase().includes('caribbean')
    );
    setPaquetes(caribbean);
  };

  // Imagen del primer evento para el hero (si existe)
  const heroImage = events[0]?.imageUrl || null;

  // Artistas únicos
  const artists = events.reduce((acc: MusicEvent[], event) => {
    if (!acc.find(a => a.artistName === event.artistName)) acc.push(event);
    return acc;
  }, []);

  return (
    <section className="mx-4 my-6 overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(160deg, #0d1f2d 0%, #0e2233 40%, #071a1a 100%)' }}>

      {/* ── 1. HERO — imagen sola + título + horario fijo ── */}
      <div className="relative overflow-hidden">
        {/* Imagen de fondo a pantalla completa */}
        {heroImage && !loading && (
          <div className="absolute inset-0">
            <img src={heroImage} alt="Caribbean Night" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,31,45,0.3) 0%, rgba(7,26,26,0.92) 100%)' }} />
          </div>
        )}

        {/* Glow orbs decorativos */}
        <div className="absolute top-4 right-6 w-36 h-36 rounded-full opacity-25 blur-3xl" style={{ background: '#f97316' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ background: '#06b6d4' }} />

        <div className="relative z-10 px-5 pt-6 pb-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full border" style={{ background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)' }}>
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-[11px] font-black uppercase tracking-widest">Novedades RIMM</span>
          </div>

          <h2 className="text-4xl font-black text-white leading-none mb-2">
            Caribbean <span style={{ color: '#22d3ee' }}>Night</span>
          </h2>

          {/* Horario fijo — todos los jueves */}
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}>
              <Music size={13} style={{ color: '#22d3ee' }} />
              <span className="text-xs font-bold" style={{ color: '#a5f3fc' }}>Todos los jueves</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <span className="text-xs font-bold" style={{ color: '#fdba74' }}>9:30 PM</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <MapPin size={11} style={{ color: 'rgba(165,243,252,0.6)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(165,243,252,0.6)' }}>San Andrés Isla</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(165,243,252,0.65)' }}>
            La noche más auténtica de la isla. Música Kriol en vivo, artistas Raizales y una experiencia cultural única cada semana.
          </p>

          {/* Loading spinner dentro del hero */}
          {loading && (
            <div className="flex items-center gap-2 mt-4">
              <Loader2 size={16} className="animate-spin" style={{ color: '#22d3ee' }} />
              <span className="text-xs" style={{ color: 'rgba(165,243,252,0.5)' }}>Cargando artistas...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. ELIGE TU PAQUETE (desde ServiciosTuristicos_SAI) ── */}
      {paquetes.length > 0 && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Ticket size={15} style={{ color: '#fb923c' }} />
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">Elige tu paquete</h3>
          </div>
          <div className="flex flex-col gap-3">
            {paquetes.map((pkg) => {
              const precioB2C = getPrecioB2C(pkg);
              const hasTransporte = pkg.title?.toLowerCase().includes('transporte');
              const hasDegustacion = pkg.title?.toLowerCase().includes('degustaci');
              return (
                <div
                  key={pkg.id}
                  className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  onClick={() => onNavigate(AppRoute.TOUR_DETAIL, pkg)}
                >
                  <div className="flex">
                    {pkg.image && (
                      <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
                        <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div>
                        <h4 className="text-white font-black text-sm leading-tight mb-1">{pkg.title}</h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(249,115,22,0.25)', color: '#fb923c' }}>
                            <Ticket size={9} /> Cover
                          </span>
                          {hasTransporte && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                              style={{ background: 'rgba(34,211,238,0.2)', color: '#22d3ee' }}>
                              <Car size={9} /> Transporte
                            </span>
                          )}
                          {hasDegustacion && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                              style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>
                              <UtensilsCrossed size={9} /> Degustación
                            </span>
                          )}
                        </div>
                        {pkg.description && (
                          <p className="text-[11px] leading-relaxed line-clamp-2"
                            style={{ color: 'rgba(165,243,252,0.65)' }}>
                            {pkg.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {precioB2C > 0 ? (
                            <>
                              <span className="text-base font-black" style={{ color: '#fb923c' }}>
                                ${precioB2C.toLocaleString()}
                              </span>
                              <span className="text-[10px] ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>COP / persona</span>
                            </>
                          ) : (
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Consultar precio</span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#22d3ee' }}>
                          Saber más <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. ARTISTAS ── */}
      {!loading && artists.length > 0 && (
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
                    <a
                      href={artist.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold"
                      style={{ color: '#4ade80' }}
                    >
                      <ExternalLink size={9} /> Spotify
                    </a>
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

      {/* ── CTA footer ── */}
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
    </section>
  );
};

export default CaribbeanNightSection;
