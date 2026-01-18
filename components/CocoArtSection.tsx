import React from 'react';
import { Palette, Heart, Package, Ticket } from 'lucide-react';
import { AppRoute } from '../types';

interface CocoArtSectionProps {
  onNavigate: (route: AppRoute, data?: any) => void;
}

const CocoArtSection: React.FC<CocoArtSectionProps> = ({ onNavigate }) => {
  const offerings = [
    {
      icon: <Package size={20} />,
      title: 'Piezas Artesanales',
      description: 'Desde centros Sombreros, canastos hasta figuras únicas',
      price: 'Desde $50,000'
    },
    {
      icon: <Palette size={20} />,
      title: 'Kriol Vibe',
      description: 'Alquiler de ambientación decorativa',
      price: '$100.000'
    },
    {
      icon: <Heart size={20} />,
      title: 'Coco Art Live',
      description: 'Experiencia inmersiva y participativa que incluye relato historico',
      price: 'Desde $195,000'
    }
  ];

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
              onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY, { category: 'tour', searchTerm: 'Coco Art' })}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors w-fit"
            >
              <Ticket size={14} />
              Reservar Experiencia
            </button>
          </div>

          {/* Image */}
          <div className="h-48 md:h-auto bg-cover bg-center" style={{
            backgroundImage: 'url(https://guiasanandresislas.com/wp-content/uploads/2025/08/Imagen-de-WhatsApp-2025-08-18-a-las-20.21.27_c6ff3afa-980x735.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div className="w-full h-full bg-gradient-to-l from-amber-900/50 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Offerings Grid */}
      <div className="relative z-10 grid md:grid-cols-3 gap-4 mb-6">
        {offerings.map((offering, idx) => (
          <div 
            key={idx}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group"
          >
            <div className="text-orange-300 mb-3 group-hover:scale-110 transition-transform">
              {offering.icon}
            </div>
            <h4 className="font-bold text-white text-sm mb-1">{offering.title}</h4>
            <p className="text-amber-100/60 text-xs mb-3 leading-tight">{offering.description}</p>
            <p className="text-orange-300 font-black text-xs">{offering.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CocoArtSection;
