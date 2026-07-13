/**
 * CulturaEventos — Cultura & Eventos GuiaSAI
 *
 * Agrupa las secciones ampliadas que vivían en el Home clásico:
 * Caribbean Night, Coco Art y Ruta Raizal. Se conservan intactas
 * (mismos componentes, misma data) — solo cambia dónde viven:
 * ahora son una pestaña propia accesible desde Home2.
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppRoute } from '../types';
import { GUANA_LOGO } from '../constants';
import CaribbeanNightSection from '../components/CaribbeanNightSection';
import CocoArtSection from '../components/CocoArtSection';
import RutaRaizalSection from '../components/RutaRaizalSection';

interface Props {
  onNavigate: (route: AppRoute, data?: any) => void;
  onBack?: () => void;
}

const CulturaEventos: React.FC<Props> = ({ onNavigate, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
          )}
          <div className="bg-teal-50 w-10 h-10 rounded-xl flex items-center justify-center p-1 border border-teal-100 shrink-0">
            <img src={GUANA_LOGO} alt="GuiaSAI" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">GuiaSAI · Turismo Raizal</p>
            <h1 className="text-lg md:text-xl font-black text-gray-900 leading-tight">Cultura & Eventos</h1>
          </div>
        </div>
      </div>

      {/* Secciones — mismos componentes del Home clásico, contenido intacto */}
      <div className="pt-2 pb-10">
        <CaribbeanNightSection onNavigate={onNavigate} />
        <CocoArtSection onNavigate={onNavigate} />
        <RutaRaizalSection onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export default CulturaEventos;
