import React from 'react';
import { MapPin, Star, ChevronRight } from 'lucide-react';
import { Tour } from '../types';

const FALLBACK: Record<string, string> = {
  tour:    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  hotel:   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  package: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  taxi:    'https://images.unsplash.com/photo-1549924231-f129b911e442?w=600&q=80',
};

const BADGE: Record<string, { label: string; color: string }> = {
  tour:    { label: 'Tour',        color: 'bg-emerald-600' },
  hotel:   { label: 'Alojamiento', color: 'bg-teal-600'    },
  package: { label: 'Paquete',     color: 'bg-amber-500'   },
  taxi:    { label: 'Traslado',    color: 'bg-yellow-500'  },
};

interface ServiceCatalogCardProps {
  service: Tour & {
    nombre?: string;
    tipo?: string;
    location?: string;
    images?: string[];
  };
  onViewDetails: () => void;
  /** Mostrar precio en COP (true) o USD (false). Default false */
  priceCOP?: boolean;
}

const ServiceCatalogCard: React.FC<ServiceCatalogCardProps> = ({
  service,
  onViewDetails,
  priceCOP = false,
}) => {
  const category = service.category || 'tour';
  const badge    = BADGE[category] || { label: category, color: 'bg-gray-500' };
  const imageUrl =
    service.image ||
    (service.images && service.images[0]) ||
    FALLBACK[category] ||
    FALLBACK.tour;
  const title    = service.title || (service as any).nombre || 'Servicio turístico';
  const location = (service as any).location || 'San Andrés Isla';
  const price    = service.price || 0;
  const rating   = service.rating || 4.5;

  return (
    <div
      onClick={onViewDetails}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer border border-gray-100 active:scale-[0.98] flex flex-col"
    >
      {/* ── Imagen ─────────────────────────────── */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK[category] || FALLBACK.tour;
          }}
        />
        {/* Badge categoría */}
        <div className={`absolute top-3 left-3 ${badge.color} text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shadow-sm`}>
          {badge.label}
        </div>
        {/* Rating */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold">
          <Star size={10} fill="currentColor" className="text-yellow-400" />
          {rating.toFixed(1)}
        </div>
      </div>

      {/* ── Contenido ──────────────────────────── */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{title}</h3>

        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <MapPin size={11} />
          <span className="truncate">{location}</span>
        </div>

        {service.description && (
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{service.description}</p>
        )}

        {/* ── Precio + CTA ─── */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
          <div>
            {price > 0 ? (
              <>
                <span className="text-emerald-600 font-black text-base">
                  ${priceCOP ? price.toLocaleString('es-CO') : price.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 ml-1">
                  {priceCOP ? 'COP' : 'USD'} {category === 'hotel' ? '/ noche' : '/ persona'}
                </span>
              </>
            ) : (
              <span className="text-gray-400 text-xs font-semibold">Consultar precio</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
            Ver más <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalogCard;
