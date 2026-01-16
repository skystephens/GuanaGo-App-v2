import React, { useState } from 'react';
import { Target, QrCode, MapPin, Gift, ChevronRight, Sparkles, Trophy, Zap, Star, Utensils, Camera, Users, HelpCircle, ArrowRight, Coins, ShoppingBag, Compass } from 'lucide-react';
import { AppRoute } from '../types';
import { airtableService, GuanaReto } from '../services/airtableService';

interface GuanaPointsSectionProps {
  onNavigate: (route: AppRoute, data?: any) => void;
  isAuthenticated?: boolean;
  userPoints?: number;
  /** Modo compacto para mostrar solo un preview con link a sección completa */
  compact?: boolean;
}

const GuanaPointsSection: React.FC<GuanaPointsSectionProps> = ({ 
  onNavigate, 
  isAuthenticated = false,
  userPoints = 0,
  compact = false
}) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  // Obtener retos disponibles
  const retos = airtableService.getAvailableRetos().slice(0, 4);

  const getRetoIcon = (icono: string) => {
    return <span className="text-2xl">{icono}</span>;
  };

  const getDificultadColor = (dificultad: GuanaReto['dificultad']) => {
    switch (dificultad) {
      case 'facil': return 'bg-green-100 text-green-700';
      case 'medio': return 'bg-yellow-100 text-yellow-700';
      case 'dificil': return 'bg-red-100 text-red-700';
    }
  };

  const getDificultadLabel = (dificultad: GuanaReto['dificultad']) => {
    switch (dificultad) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Medio';
      case 'dificil': return 'Difícil';
    }
  };

  // Formas de ganar puntos
  const waysToEarn = [
    { icon: <Utensils size={18} />, title: 'Visita Restaurantes', points: '+50 pts', desc: 'Escanea el QR al pagar' },
    { icon: <Compass size={18} />, title: 'Completa Tours', points: '+100 pts', desc: 'Al finalizar cada tour' },
    { icon: <Camera size={18} />, title: 'Comparte Fotos', points: '+25 pts', desc: 'Sube fotos de tus aventuras' },
    { icon: <Users size={18} />, title: 'Invita Amigos', points: '+200 pts', desc: 'Cuando se registren' },
  ];

  // Formas de canjear puntos
  const waysToRedeem = [
    { icon: '🍹', title: 'Bebidas gratis', points: '500 pts' },
    { icon: '🍽️', title: 'Descuento 20%', points: '300 pts' },
    { icon: '🏖️', title: 'Tour gratis', points: '2000 pts' },
    { icon: '🎁', title: 'Souvenirs', points: '150 pts' },
  ];

  // === MODO COMPACTO: Preview sencillo con link a sección completa ===
  if (compact) {
    return (
      <section className="mb-6">
        <button
          onClick={() => onNavigate(AppRoute.WALLET)}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400 opacity-20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                <Coins size={24} className="text-emerald-800" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles size={12} className="text-yellow-300" />
                  <span className="text-yellow-300 text-[10px] font-black uppercase tracking-wider">GUANA Points</span>
                </div>
                <h3 className="text-white font-bold text-sm">
                  {isAuthenticated 
                    ? `${userPoints.toLocaleString()} puntos disponibles`
                    : 'Gana puntos, canjea premios'}
                </h3>
                <p className="text-emerald-100 text-xs">
                  {isAuthenticated ? 'Ver retos y canjear →' : 'Regístrate y gana 100 pts gratis'}
                </p>
              </div>
            </div>
            <ArrowRight size={24} className="text-white/70" />
          </div>
        </button>
      </section>
    );
  }

  // === MODO COMPLETO: Sección con toda la información ===
  return (
    <section className="mb-8 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl mx-0 p-6 shadow-xl overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-400 opacity-10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="text-yellow-300 text-xs font-black uppercase tracking-widest">
              GUANA Points
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 hover:bg-white/30 transition-colors"
              title="¿Cómo funciona?"
            >
              <HelpCircle size={14} className="text-white" />
              <span className="text-white text-[10px] font-bold hidden md:inline">¿Cómo funciona?</span>
            </button>
            {isAuthenticated && (
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Trophy size={14} className="text-yellow-300" />
                <span className="text-white font-bold text-sm">{userPoints.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
          Cumple Retos, <span className="text-yellow-300">Gana Puntos</span>
        </h2>
        <p className="text-emerald-100 text-sm mt-1">
          Explora la isla y canjea por experiencias únicas 🌴
        </p>
      </div>

      {/* Sección "Cómo Funciona" - Expandible */}
      {showHowItWorks && (
        <div className="relative z-10 mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Star size={16} className="text-yellow-300" />
            ¿Cómo Funcionan los GUANA Points?
          </h3>
          
          {/* Formas de ganar */}
          <div className="mb-4">
            <h4 className="text-yellow-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Coins size={14} /> Formas de Ganar
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {waysToEarn.map((way, idx) => (
                <div key={idx} className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-yellow-300">{way.icon}</div>
                    <span className="text-emerald-100 text-[10px] font-bold">{way.points}</span>
                  </div>
                  <p className="text-white text-xs font-bold">{way.title}</p>
                  <p className="text-emerald-200 text-[10px]">{way.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formas de canjear */}
          <div>
            <h4 className="text-yellow-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShoppingBag size={14} /> Canjea Por
            </h4>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {waysToRedeem.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 bg-white/10 rounded-xl px-3 py-2 text-center hover:bg-white/20 transition-colors">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-white text-[10px] font-bold mt-1">{item.title}</p>
                  <p className="text-emerald-200 text-[10px]">{item.points}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="mt-4 bg-yellow-400/20 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-emerald-800" />
            </div>
            <div>
              <p className="text-yellow-300 text-xs font-bold">💡 Tip: Escanea QR</p>
              <p className="text-emerald-100 text-[11px]">
                Los negocios socios tienen códigos QR. Escánealos al pagar para acumular puntos automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="relative z-10 grid grid-cols-3 gap-3 mb-6">
        <button 
          onClick={() => onNavigate(AppRoute.DIRECTORY)}
          className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/30 transition-all active:scale-95"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <QrCode size={20} className="text-white" />
          </div>
          <span className="text-white text-[10px] md:text-xs font-bold text-center">Escanear QR</span>
        </button>
        
        <button 
          onClick={() => onNavigate(AppRoute.INTERACTIVE_MAP)}
          className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/30 transition-all active:scale-95"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-white" />
          </div>
          <span className="text-white text-[10px] md:text-xs font-bold text-center">Explorar Rutas</span>
        </button>
        
        <button 
          onClick={() => onNavigate(AppRoute.WALLET)}
          className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/30 transition-all active:scale-95"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Gift size={20} className="text-white" />
          </div>
          <span className="text-white text-[10px] md:text-xs font-bold text-center">Canjear</span>
        </button>
      </div>

      {/* Retos Destacados */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-yellow-300" />
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">
              Retos Activos
            </h3>
          </div>
          <button 
            onClick={() => onNavigate(AppRoute.WALLET)}
            className="text-yellow-300 text-xs font-bold flex items-center gap-1 hover:underline"
          >
            Ver todos <ChevronRight size={14} />
          </button>
        </div>
        
        {/* Horizontal Scroll de Retos */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {retos.map((reto) => (
            <div 
              key={reto.id}
              className="flex-shrink-0 w-40 md:w-48 bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  {getRetoIcon(reto.icono)}
                </div>
                <span className={`text-[8px] font-bold uppercase px-2 py-1 rounded-full ${getDificultadColor(reto.dificultad)}`}>
                  {getDificultadLabel(reto.dificultad)}
                </span>
              </div>
              
              <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                {reto.titulo}
              </h4>
              <p className="text-gray-500 text-[10px] mb-3 line-clamp-2">
                {reto.descripcion}
              </p>
              
              <div className="flex items-center gap-1 bg-emerald-50 rounded-lg px-2 py-1.5">
                <Zap size={12} className="text-emerald-600" />
                <span className="text-emerald-700 font-black text-xs">
                  +{reto.puntosRecompensa} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA para no autenticados */}
      {!isAuthenticated && (
        <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Gift size={24} className="text-emerald-800" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">¡Bono de Bienvenida!</p>
            <p className="text-emerald-100 text-xs">Regístrate y recibe 100 GUANA Points gratis</p>
          </div>
          <button 
            onClick={() => onNavigate(AppRoute.PROFILE)}
            className="bg-yellow-400 text-emerald-800 px-4 py-2 rounded-xl font-bold text-xs hover:bg-yellow-300 transition-colors"
          >
            Unirme
          </button>
        </div>
      )}
    </section>
  );
};

export default GuanaPointsSection;
