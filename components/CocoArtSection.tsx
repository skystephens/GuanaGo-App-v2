import React, { useState, useEffect } from 'react';
import { Leaf, Heart, Package, Images, Star, ChevronRight, Crown, Play, X } from 'lucide-react';
import { AppRoute, Tour } from '../types';
import { api } from '../services/api';
import { getFromCache } from '../services/cacheService';
import { getPrecioB2C } from '../services/pricing';

interface CocoArtSectionProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

const YOUTUBE_ID = 'rFQ9sV08KRI';
const YOUTUBE_THUMB = `https://img.youtube.com/vi/${YOUTUBE_ID}/hqdefault.jpg`;

// Paleta: verde oscuro palmera + negro
const PALM_DARK  = '#0a1f0f';  // negro verdoso
const PALM_MID   = '#132a18';  // verde oscuro
const PALM_GREEN = '#1a3d1f';  // verde palmera medio
const PALM_LIGHT = '#2d6a35';  // verde palmera claro
const PALM_ACCENT= '#4caf50';  // acento verde vivo
const PALM_GOLD  = '#c8a84b';  // dorado coco

const CocoArtSection: React.FC<CocoArtSectionProps> = ({ onNavigate }) => {
  const [activeImg, setActiveImg]   = useState<number | null>(null);
  const [playVideo, setPlayVideo]   = useState(false);
  const [paquetes, setPaquetes]     = useState<Tour[]>([]);
  const [gallery, setGallery]       = useState<string[]>([]);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const GALLERY_PREVIEW = 5;

  useEffect(() => {
    loadPaquetes();
    const onCacheUpdated = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (key === 'services_turisticos') loadPaquetes();
    };
    window.addEventListener('guanago:cache-updated', onCacheUpdated);
    return () => window.removeEventListener('guanago:cache-updated', onCacheUpdated);
  }, []);

  const loadPaquetes = async () => {
    let all: Tour[] = getFromCache<Tour[]>('services_turisticos') || [];
    if (all.length === 0) all = await api.services.listPublic();
    const coco = all.filter(s =>
      s.title?.toLowerCase().includes('cocoart') ||
      s.title?.toLowerCase().includes('coco art')
    );
    setPaquetes(coco);

    // Recoger todas las imágenes de los servicios CocoART (ImagenWP tiene prioridad via airtableService)
    const imgs: string[] = [];
    coco.forEach(s => {
      const srcs: string[] = (s as any).gallery || (s as any).images || [];
      srcs.forEach(u => { if (u && !imgs.includes(u)) imgs.push(u); });
      if (s.image && !imgs.includes(s.image)) imgs.unshift(s.image);
    });
    if (imgs.length > 0) setGallery(imgs);
  };

  const displayImages = gallery;
  const visibleImages = showAllPhotos ? displayImages : displayImages.slice(0, GALLERY_PREVIEW);
  const hasMore = displayImages.length > GALLERY_PREVIEW;

  return (
    <section
      className="mx-4 my-6 rounded-3xl shadow-2xl overflow-hidden relative"
      style={{ background: `linear-gradient(160deg, ${PALM_DARK} 0%, ${PALM_MID} 50%, ${PALM_GREEN} 100%)` }}
    >
      {/* ── Decoración de fondo ── */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: PALM_LIGHT }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: PALM_ACCENT }} />
      {/* Patrón de hoja sutil */}
      <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M60 0 Q90 30 60 60 Q30 30 60 0Z" fill="white"/>
          <path d="M60 60 Q90 90 60 120 Q30 90 60 60Z" fill="white"/>
          <path d="M0 60 Q30 30 60 60 Q30 90 0 60Z" fill="white"/>
          <path d="M120 60 Q90 30 60 60 Q90 90 120 60Z" fill="white"/>
        </svg>
      </div>

      {/* ── HEADER ── */}
      <div className="relative z-10 px-6 pt-7 pb-5">
        <div className="flex items-center gap-2 mb-2">
          <Leaf size={14} style={{ color: PALM_ACCENT }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: PALM_ACCENT }}>
            Experiencia Cultural Raizal
          </span>
        </div>
        <h2 className="text-3xl font-black text-white leading-none mb-1">
          Coco <span style={{ color: PALM_GOLD }}>Art</span>
        </h2>
        <p className="text-sm" style={{ color: 'rgba(200,230,200,0.7)' }}>
          🥥 La historia del coco convertida en arte · «Breda Sky»
        </p>
      </div>

      {/* ── DESCRIPCIÓN + IMAGEN ── */}
      <div
        className="relative z-10 mx-6 mb-5 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Imagen pequeña arriba */}
        {displayImages[0] && (
          <div className="h-36 overflow-hidden">
            <img
              src={displayImages[0]}
              alt="Coco Art"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(10,31,15,0.9) 100%)' }} />
          </div>
        )}
        {/* Texto debajo */}
        <div className="p-4">
          <h3 className="text-base font-black text-white mb-1.5 leading-snug">
            Transformar historias en experiencias
          </h3>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(200,230,200,0.75)' }}>
            El maestro rescata la herencia de San Andrés transformando la palma de coco en arte auténtico. Cada pieza es un homenaje a las raíces Kriol de la isla.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              'Piezas únicas y personalizadas',
              'Ambientación para eventos especiales',
              'Experiencias educativas e inmersivas',
            ].map(item => (
              <p key={item} className="text-[11px] font-bold flex items-center gap-1.5"
                style={{ color: PALM_ACCENT }}>
                <span style={{ color: PALM_GOLD }}>✓</span> {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAQUETES AIRTABLE (CocoART BASIC / VIP) ── */}
      {paquetes.length > 0 && (
        <div className="relative z-10 px-6 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: PALM_GOLD }} />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Elige tu experiencia</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paquetes.map(pkg => {
              const precioB2C = getPrecioB2C(pkg);
              const isVip = pkg.title?.toLowerCase().includes('vip');
              return (
                <div
                  key={pkg.id}
                  onClick={() => onNavigate(AppRoute.TOUR_DETAIL, pkg)}
                  className="rounded-2xl overflow-hidden cursor-pointer group active:scale-[0.98] transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${isVip ? PALM_GOLD + '60' : 'rgba(255,255,255,0.12)'}` }}
                >
                  {pkg.image && (
                    <div className="relative h-32 overflow-hidden">
                      <img src={pkg.image} alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,31,15,0.85) 0%, transparent 55%)' }} />
                      {isVip && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
                          style={{ background: PALM_GOLD, color: PALM_DARK }}>
                          <Crown size={9} /> VIP
                        </div>
                      )}
                      <span className="absolute bottom-2 left-3 text-white font-black text-sm">{pkg.title}</span>
                    </div>
                  )}
                  <div className="p-3">
                    {!pkg.image && (
                      <div className="flex items-center gap-2 mb-2">
                        {isVip ? <Crown size={16} style={{ color: PALM_GOLD }} /> : <Leaf size={16} style={{ color: PALM_ACCENT }} />}
                        <h4 className="font-black text-white text-sm">{pkg.title}</h4>
                      </div>
                    )}
                    {pkg.description && (
                      <p className="text-xs leading-relaxed mb-2 line-clamp-2" style={{ color: 'rgba(200,230,200,0.65)' }}>
                        {pkg.description}
                      </p>
                    )}
                    <div className="space-y-1 mb-3">
                      <p className="text-[10px] font-bold uppercase" style={{ color: PALM_ACCENT }}>✓ Experiencia artesanal guiada</p>
                      <p className="text-[10px] font-bold uppercase" style={{ color: PALM_ACCENT }}>✓ Historia Kriol del coco</p>
                      {isVip && <p className="text-[10px] font-bold uppercase" style={{ color: PALM_GOLD }}>✓ Degustación + materiales premium</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {precioB2C > 0
                          ? <><span className="font-black text-base" style={{ color: PALM_GOLD }}>${precioB2C.toLocaleString()}</span>
                              <span className="text-[10px] ml-1" style={{ color: 'rgba(200,230,200,0.45)' }}>COP / persona</span></>
                          : <span className="text-xs" style={{ color: 'rgba(200,230,200,0.45)' }}>Consultar precio</span>
                        }
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold" style={{ color: PALM_ACCENT }}>
                        Saber más <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback estático */}
      {paquetes.length === 0 && (
        <div className="relative z-10 px-6 mb-5 grid grid-cols-3 gap-3">
          {[
            { icon: <Package size={18} />, title: 'Piezas Artesanales', price: 'Desde $50,000' },
            { icon: <Leaf size={18} />,    title: 'Kriol Vibe',          price: '$100.000' },
            { icon: <Heart size={18} />,   title: 'Coco Art Live',       price: 'Desde $195,000' },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="mb-2 flex justify-center" style={{ color: PALM_ACCENT }}>{item.icon}</div>
              <p className="text-white text-[11px] font-bold mb-1">{item.title}</p>
              <p className="text-[10px] font-black" style={{ color: PALM_GOLD }}>{item.price}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── GALERÍA + VIDEO ── */}
      <div className="relative z-10 px-6 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Images size={14} style={{ color: PALM_ACCENT }} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Galería Coco Art</h3>
          {displayImages.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(76,175,80,0.2)', color: PALM_ACCENT }}>
              {displayImages.length} fotos
            </span>
          )}
        </div>

        {/* Grid de fotos — cuadradas, máx 5 visibles */}
        {displayImages.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {visibleImages.map((src, idx) => {
                const isLast = !showAllPhotos && hasMore && idx === GALLERY_PREVIEW - 1;
                return (
                  <div key={idx}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={() => isLast ? setShowAllPhotos(true) : setActiveImg(activeImg === idx ? null : idx)}
                  >
                    <img src={src} alt={`Coco Art ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, rgba(10,31,15,0.5) 0%, transparent 60%)' }} />
                    {isLast && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: 'rgba(10,31,15,0.78)' }}>
                        <span className="text-white font-black text-xl">+{displayImages.length - GALLERY_PREVIEW + 1}</span>
                        <span className="text-xs font-bold mt-0.5" style={{ color: PALM_ACCENT }}>Ver más</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {showAllPhotos && (
              <button
                onClick={() => setShowAllPhotos(false)}
                className="w-full text-xs font-bold py-2 mb-2 rounded-xl transition-all"
                style={{ color: PALM_ACCENT, background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)' }}
              >
                Ver menos ↑
              </button>
            )}
          </>
        )}

        {/* Lightbox */}
        {activeImg !== null && visibleImages[activeImg] && (
          <div className="mb-3 rounded-2xl overflow-hidden relative"
            style={{ border: `1px solid ${PALM_LIGHT}50` }}>
            <img src={visibleImages[activeImg]} alt="Coco Art"
              className="w-full object-cover" style={{ maxHeight: 260 }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(10,31,15,0.8) 0%, transparent 55%)' }} />
            <button onClick={() => setActiveImg(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <X size={14} />
            </button>
            <div className="absolute bottom-3 left-4">
              <p className="text-white font-bold text-sm">Coco Art · Experiencia Cultural</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(200,230,200,0.7)' }}>San Andrés Isla 🥥</p>
            </div>
          </div>
        )}

        {/* Video YouTube */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${PALM_LIGHT}50` }}>
          {playVideo ? (
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`}
                title="Coco Art — Experiencia Cultural San Andrés"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button onClick={() => setPlayVideo(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white z-10"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative cursor-pointer group" style={{ height: 195 }}
              onClick={() => setPlayVideo(true)}>
              <img src={YOUTUBE_THUMB} alt="Ver video Coco Art"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: 'rgba(10,31,15,0.55)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(220,0,0,0.92)' }}>
                  <Play size={28} fill="white" className="text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-black text-sm drop-shadow">Ver experiencia Coco Art</p>
                <p className="text-xs mt-0.5 drop-shadow" style={{ color: 'rgba(200,230,200,0.8)' }}>YouTube · San Andrés Isla</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CocoArtSection;
