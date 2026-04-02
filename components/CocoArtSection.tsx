import React, { useState, useEffect } from 'react';
import { Palette, Heart, Package, Ticket, Images, Star, ChevronRight, Crown } from 'lucide-react';
import { AppRoute, Tour } from '../types';
import PhotoCarousel from './PhotoCarousel';
import { api } from '../services/api';
import { getFromCache } from '../services/cacheService';

interface CocoArtSectionProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

const CocoArtSection: React.FC<CocoArtSectionProps> = ({ onNavigate }) => {
  const [activeImg, setActiveImg] = useState<number | null>(null);
  const [paquetes, setPaquetes] = useState<Tour[]>([]);

  const carouselImages = [
    'https://guiasanandresislas.com/wp-content/uploads/2025/08/Imagen-de-WhatsApp-2025-08-18-a-las-20.21.27_c6ff3afa-980x735.jpg',
    'https://guiasanandresislas.com/wp-content/uploads/2025/08/Imagen-de-WhatsApp-2025-08-18-a-las-20.23.13_2e2e3c6f-980x735.jpg',
    'https://guiasanandresislas.com/wp-content/uploads/2025/08/Imagen-de-WhatsApp-2025-08-18-a-las-20.22.06_4aa64cc6-980x735.jpg',
    'https://guiasanandresislas.com/wp-content/uploads/2025/08/Imagen-de-WhatsApp-2025-08-18-a-las-20.24.07_6b8c4f3a-980x735.jpg',
    'https://guiasanandresislas.com/wp-content/uploads/2025/08/Imagen-de-WhatsApp-2025-08-18-a-las-20.25.14_8d9f5c2e-980x735.jpg'
  ];

  useEffect(() => {
    loadPaquetes();
  }, []);

  const loadPaquetes = async () => {
    let all: Tour[] = getFromCache<Tour[]>('services_turisticos') || [];
    if (all.length === 0) {
      all = await api.services.listPublic();
    }
    const cocoItems = all.filter(s =>
      s.title?.toLowerCase().includes('cocoart') ||
      s.title?.toLowerCase().includes('coco art')
    );
    setPaquetes(cocoItems);
  };

  return (
    <section className="px-6 py-8 bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 rounded-3xl mx-4 my-6 shadow-xl overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 opacity-15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-300 opacity-10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={16} className="text-orange-300" />
          <span className="text-orange-300 text-xs font-black uppercase tracking-widest">
            Experiencia Cultural
          </span>
        </div>
        <h2 className="text-2xl font-black text-white leading-tight">
          Descubre <span className="text-amber-200">Coco Art</span>
        </h2>
        <p className="text-amber-100/70 text-sm mt-1">
          Un Legado Tejido a Mano: La historia del coco convertida en arte 🥥
        </p>
      </div>

      {/* Featured Content */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden mb-6">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Text Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-lg font-black text-white mb-3">
              Transformar historias en experiencias
            </h3>
            <p className="text-amber-100/80 text-sm leading-relaxed mb-6">
              El maestro («Breda Sky») rescata la herencia de San Andrés transformando la palma de coco en arte auténtico. Desde venta de piezas artesanales hasta experiencias interactivas, cada creación es un homenaje a nuestras raíces Kriol.
            </p>
            
            <div className="space-y-2 mb-6">
              <p className="text-amber-200 text-xs font-bold uppercase">✓ Piezas únicas y personalizadas</p>
              <p className="text-amber-200 text-xs font-bold uppercase">✓ Ambientación para eventos especiales</p>
              <p className="text-amber-200 text-xs font-bold uppercase">✓ Experiencias educativas e inmersivas</p>
            </div>

            <button
              onClick={() => paquetes.length > 0
                ? onNavigate(AppRoute.TOUR_DETAIL, paquetes[0])
                : onNavigate(AppRoute.DYNAMIC_ITINERARY, { category: 'tour', searchTerm: 'Coco Art' })
              }
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors w-fit"
            >
              <Ticket size={14} />
              Reservar Experiencia
            </button>
          </div>

          {/* Photo Carousel */}
          <div className="h-48 md:h-auto">
            <PhotoCarousel images={carouselImages} autoPlay={true} autoPlayInterval={5000} />
          </div>
        </div>
      </div>

      {/* Paquetes desde Airtable (CocoART BASIC / VIP) */}
      {paquetes.length > 0 && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {paquetes.map((pkg) => {
            const precioB2C = pkg.price > 0 ? Math.ceil(pkg.price * 1.15) : 0;
            const isVip = pkg.title?.toLowerCase().includes('vip');
            return (
              <div
                key={pkg.id}
                onClick={() => onNavigate(AppRoute.TOUR_DETAIL, pkg)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all cursor-pointer group active:scale-[0.98]"
              >
                {/* Imagen del paquete si existe */}
                {pkg.image && (
                  <div className="relative h-36 overflow-hidden">
                    <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(120,53,15,0.85) 0%, transparent 50%)' }} />
                    {isVip && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black"
                        style={{ background: 'rgba(251,191,36,0.9)', color: '#78350f' }}>
                        <Crown size={10} /> VIP
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-white font-black text-sm">{pkg.title}</span>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  {!pkg.image && (
                    <div className="flex items-center gap-2 mb-2">
                      {isVip ? <Crown size={18} className="text-amber-300" /> : <Star size={18} className="text-orange-300" />}
                      <h4 className="font-black text-white text-sm">{pkg.title}</h4>
                      {isVip && (
                        <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}>VIP</span>
                      )}
                    </div>
                  )}
                  {pkg.description && (
                    <p className="text-amber-100/70 text-xs leading-relaxed mb-3 line-clamp-3">{pkg.description}</p>
                  )}
                  {/* Bullets de lo que incluye — parsear de descripción o mostrar genéricos */}
                  <div className="space-y-1 mb-4">
                    <p className="text-amber-200 text-[10px] font-bold uppercase">✓ Experiencia artesanal guiada</p>
                    <p className="text-amber-200 text-[10px] font-bold uppercase">✓ Historia Kriol del coco</p>
                    {isVip && <p className="text-amber-200 text-[10px] font-bold uppercase">✓ Degustación + materiales premium</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {precioB2C > 0 ? (
                        <>
                          <span className="text-orange-300 font-black text-lg">${precioB2C.toLocaleString()}</span>
                          <span className="text-amber-100/50 text-[10px] ml-1">COP / persona</span>
                        </>
                      ) : (
                        <span className="text-amber-100/50 text-xs">Consultar precio</span>
                      )}
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      style={{ background: 'rgba(249,115,22,0.3)', color: '#fdba74' }}
                    >
                      Saber más <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offerings estáticos (fallback si no hay data de Airtable) */}
      {paquetes.length === 0 && (
        <div className="relative z-10 grid md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: <Package size={20} />, title: 'Piezas Artesanales', description: 'Desde centros, sombreros, canastos hasta figuras únicas', price: 'Desde $50,000' },
            { icon: <Palette size={20} />, title: 'Kriol Vibe', description: 'Alquiler de ambientación decorativa', price: '$100.000' },
            { icon: <Heart size={20} />, title: 'Coco Art Live', description: 'Experiencia inmersiva y participativa con relato histórico', price: 'Desde $195,000' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all group">
              <div className="text-orange-300 mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
              <p className="text-amber-100/60 text-xs mb-3 leading-tight">{item.description}</p>
              <p className="text-orange-300 font-black text-xs">{item.price}</p>
            </div>
          ))}
        </div>
      )}

      {/* Galería Coco Art */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Images size={15} className="text-orange-300" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Galería Coco Art</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>
            {carouselImages.length} fotos
          </span>
        </div>

        {/* Primera imagen grande + columna de 2 + columna de 2 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Imagen destacada */}
          <div
            className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer relative group"
            style={{ width: 200, height: 220, border: '1px solid rgba(255,255,255,0.15)' }}
            onClick={() => setActiveImg(activeImg === 0 ? null : 0)}
          >
            <img src={carouselImages[0]} alt="Coco Art" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(120,53,15,0.7) 0%, transparent 50%)' }} />
            <div className="absolute bottom-3 left-3">
              <p className="text-white text-xs font-bold">Coco Art</p>
              <p className="text-amber-200 text-[10px]">San Andrés Isla</p>
            </div>
          </div>

          {/* Columnas de 2 fotos apiladas */}
          {[[1, 2], [3, 4]].map((pair, ci) => (
            <div key={ci} className="flex-shrink-0 flex flex-col gap-2" style={{ width: 130 }}>
              {pair.map((idx) => carouselImages[idx] && (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden cursor-pointer relative group"
                  style={{ height: 104, border: '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => setActiveImg(activeImg === idx ? null : idx)}
                >
                  <img src={carouselImages[idx]} alt={`Coco Art ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(120,53,15,0.6) 0%, transparent 55%)' }} />
                  {activeImg === idx && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <span className="text-white text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(249,115,22,0.7)' }}>✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Lightbox mini al seleccionar */}
        {activeImg !== null && carouselImages[activeImg] && (
          <div className="mt-3 rounded-2xl overflow-hidden relative" style={{ border: '1px solid rgba(251,146,60,0.3)' }}>
            <img src={carouselImages[activeImg]} alt={`Coco Art ${activeImg + 1}`} className="w-full object-cover" style={{ maxHeight: 280 }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(120,53,15,0.75) 0%, transparent 60%)' }} />
            <button
              onClick={() => setActiveImg(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              ✕
            </button>
            <div className="absolute bottom-3 left-4">
              <p className="text-white font-bold text-sm">Coco Art · Experiencia Cultural</p>
              <p className="text-amber-200 text-xs mt-0.5">San Andrés Isla 🥥</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CocoArtSection;
