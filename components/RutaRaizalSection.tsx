import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, ChevronRight, Loader2, Compass, Sun, Anchor, Bed, Car } from 'lucide-react';
import { AppRoute, Tour } from '../types';
import { api } from '../services/api';
import { getFromCache } from '../services/cacheService';
import { getPrecioB2C, getUnidad } from '../services/pricing';

interface RutaRaizalSectionProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

// Paleta rojiza / terracota Raizal
const R_BG_DARK   = '#1a0a06';   // negro rojizo
const R_BG_MID    = '#2c100a';   // terracota oscuro
const R_BG_WARM   = '#3d1610';   // caoba
const R_RED       = '#c0392b';   // rojo Raizal
const R_RED_LIGHT = '#e74c3c';   // rojo vivo acento
const R_GOLD      = '#e8c56a';   // dorado cálido
const R_CREAM     = 'rgba(255,235,210,0.75)';

const DIAS_MAP: Record<string, { dias: number; label: string }> = {
  '4': { dias: 4, label: '4 Días' },
  '5': { dias: 5, label: '5 Días' },
};

const RutaRaizalSection: React.FC<RutaRaizalSectionProps> = ({ onNavigate }) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'4' | '5'>('4');

  useEffect(() => {
    loadTours();
    const onCacheUpdated = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (key === 'services_turisticos') loadTours();
    };
    window.addEventListener('guanago:cache-updated', onCacheUpdated);
    return () => window.removeEventListener('guanago:cache-updated', onCacheUpdated);
  }, []);

  const loadTours = async () => {
    setLoading(true);
    try {
      let all: Tour[] = getFromCache<Tour[]>('services_turisticos') || [];
      if (all.length === 0) all = await api.services.listPublic();
      const raizal = all.filter(s =>
        s.title?.toLowerCase().includes('raizal') ||
        s.title?.toLowerCase().includes('ruta raizal')
      );
      setTours(raizal);
    } finally {
      setLoading(false);
    }
  };

  // Separar por cantidad de días detectando "4" o "5" en el título
  const toursPorDias = (dias: '4' | '5') =>
    tours.filter(t => t.title?.includes(dias === '4' ? '4' : '5'));

  const tourActual = toursPorDias(activeTab)[0] || null;

  // Imágenes: galería del tour activo
  const imgs: string[] = tourActual
    ? ((tourActual as any).gallery || (tourActual as any).images || [tourActual.image]).filter(Boolean)
    : [];

  const precioB2C = tourActual ? getPrecioB2C(tourActual) : 0;

  return (
    <section
      className="mx-4 my-6 rounded-3xl overflow-hidden shadow-2xl relative"
      style={{ background: `linear-gradient(155deg, ${R_BG_DARK} 0%, ${R_BG_MID} 55%, ${R_BG_WARM} 100%)` }}
    >
      {/* Decoración */}
      <div className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: R_RED }} />
      <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: R_GOLD }} />

      {/* ── HEADER ── */}
      <div className="relative z-10 px-6 pt-7 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass size={14} style={{ color: R_RED_LIGHT }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: R_RED_LIGHT }}>
            Cultura Raizal · San Andrés Isla
          </span>
        </div>
        <h2 className="text-3xl font-black text-white leading-none mb-1">
          Ruta <span style={{ color: R_GOLD }}>Raizal</span>
        </h2>
        <p className="text-sm" style={{ color: R_CREAM }}>
          🌴 Sumérgete en la cultura, historia y naturaleza Raizal de la isla
        </p>
      </div>

      {/* ── SELECTOR DE DÍAS ── */}
      <div className="relative z-10 px-6 mb-4">
        <div className="flex gap-2 p-1 rounded-2xl w-fit"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {(['4', '5'] as const).map(d => (
            <button
              key={d}
              onClick={() => setActiveTab(d)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all"
              style={activeTab === d
                ? { background: R_RED, color: '#fff', boxShadow: `0 4px 14px ${R_RED}60` }
                : { color: R_CREAM }}
            >
              <Calendar size={12} />
              {d} Días
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 size={20} className="animate-spin" style={{ color: R_RED_LIGHT }} />
          <span className="text-sm" style={{ color: R_CREAM }}>Cargando tours...</span>
        </div>
      )}

      {!loading && tourActual && (
        <>
          {/* ── GALERÍA ── */}
          <div className="relative z-10 px-6 mb-4">
            {imgs.length > 0 ? (
              <>
                {/* Imagen principal */}
                <div className="rounded-2xl overflow-hidden relative mb-2"
                  style={{ height: 200, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={imgs[0]} alt={tourActual.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit"
                      style={{ background: R_RED, boxShadow: `0 4px 12px ${R_RED}80` }}>
                      <Sun size={12} className="text-white" />
                      <span className="text-white text-xs font-black">{activeTab} Días · {activeTab === '4' ? '3 Noches' : '4 Noches'}</span>
                    </div>
                  </div>
                </div>

                {/* Grid de miniaturas más grandes */}
                {imgs.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imgs.slice(1, 4).map((src, i) => (
                      <div key={i} className="rounded-xl overflow-hidden aspect-square"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={src} alt={`Tour ${i + 2}`}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl flex items-center justify-center"
                style={{ height: 160, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MapPin size={40} style={{ color: R_RED + '60' }} />
              </div>
            )}
          </div>

          {/* ── INFO DEL TOUR ── */}
          <div className="relative z-10 px-6 mb-5">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <h3 className="text-white font-black text-base leading-snug mb-2">
                {tourActual.title}
              </h3>

              {/* Tags rápidos */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: `${R_RED}30`, color: R_RED_LIGHT }}>
                  <Calendar size={9} /> {activeTab} días / {activeTab === '4' ? '3' : '4'} noches
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: R_CREAM }}>
                  <MapPin size={9} /> San Andrés Isla
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: R_CREAM }}>
                  <Anchor size={9} /> Cultura Raizal
                </span>
              </div>

              {tourActual.description && (
                <p className="text-sm leading-relaxed mb-3 line-clamp-4" style={{ color: R_CREAM }}>
                  {tourActual.description}
                </p>
              )}

              {/* Qué incluye */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: <Bed size={14} />,    label: 'Alojamiento',  sub: 'Posadas Raizales' },
                  { icon: <Car size={14} />,    label: 'Traslados',    sub: 'Aeropuerto + isla' },
                  { icon: <Anchor size={14} />, label: 'Tours',        sub: 'Cultura Raizal' },
                ].map(({ icon, label, sub }) => (
                  <div key={label} className="rounded-xl p-2.5 text-center"
                    style={{ background: `${R_RED}18`, border: `1px solid ${R_RED}30` }}>
                    <div className="flex justify-center mb-1" style={{ color: R_GOLD }}>{icon}</div>
                    <p className="text-white text-[10px] font-black leading-none">{label}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: R_CREAM + 'aa' }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* Precio + CTA */}
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  {precioB2C > 0 ? (
                    <>
                      <span className="text-2xl font-black" style={{ color: R_GOLD }}>
                        ${precioB2C.toLocaleString()}
                      </span>
                      <span className="text-xs ml-1.5" style={{ color: 'rgba(255,235,210,0.5)' }}>
                        {tourActual?.moneda || 'COP'} {getUnidad(tourActual?.category || 'tour')}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm" style={{ color: 'rgba(255,235,210,0.5)' }}>Consultar precio</span>
                  )}
                </div>
                <button
                  onClick={() => onNavigate(AppRoute.TOUR_DETAIL, tourActual)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${R_RED}, ${R_RED_LIGHT})`, boxShadow: `0 4px 14px ${R_RED}50` }}
                >
                  Ver detalles <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Estado vacío si no hay tour para ese número de días */}
      {!loading && !tourActual && tours.length > 0 && (
        <div className="relative z-10 px-6 pb-6 text-center">
          <p className="text-sm" style={{ color: R_CREAM }}>
            Tour de {activeTab} días próximamente disponible
          </p>
        </div>
      )}

      {/* Sin datos de Airtable */}
      {!loading && tours.length === 0 && (
        <div className="relative z-10 px-6 pb-6">
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Compass size={36} className="mx-auto mb-3 opacity-30" style={{ color: R_RED_LIGHT }} />
            <p className="text-white font-bold text-sm">Ruta Raizal</p>
            <p className="text-xs mt-1" style={{ color: R_CREAM }}>
              Tours de 4 y 5 días · Próximamente en catálogo
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div className="relative z-10 px-6 pb-6">
        <button
          onClick={() => onNavigate(AppRoute.CATALOG_PUBLICO)}
          className="w-full text-center text-xs font-bold py-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.06)', color: R_CREAM, border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Ver todos los tours Raizales →
        </button>
      </div>
    </section>
  );
};

export default RutaRaizalSection;
