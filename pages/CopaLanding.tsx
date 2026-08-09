/**
 * CopaLanding — Página pública de la Copa de la Isla, sin código ni login.
 * Punto de llegada informativo del torneo: qué es, quién organiza, equipos
 * confirmados, y accesos a "Ya tengo código" (delegados) y "Quiero inscribir
 * mi equipo" (WhatsApp).
 *
 * Capa 1 de 4 del modelo de acceso (Pública / Delegado / Participante / Staff)
 * — ver documento "Copa de la Isla — Plan estratégico" sección 5.
 */

import React, { useEffect, useState } from 'react';
import { MessageCircle, Trophy, Users, MapPin, Calendar, ArrowRight, KeyRound } from 'lucide-react';
import { GUANA_LOGO } from '../constants';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const wa = 'https://wa.me/573153836043';
const waLink = (msg: string) => `${wa}?text=${encodeURIComponent(msg)}`;

const COMITE = [
  { nombre: 'Sky Stephens', rol: 'Anfitriona · Hospedaje, transporte y alimentación' },
  { nombre: 'Jacir Davis Blanco', rol: 'Anfitrión · Logística de escenarios' },
  { nombre: 'Carlos Colorado', rol: 'Logística de arbitraje y reglamento' },
  { nombre: 'Daniela Espinosa', rol: 'Organizadora · Todas las categorías' },
  { nombre: 'Fernando Espinosa', rol: 'Organizador · Todas las categorías' },
];

const CopaLanding: React.FC = () => {
  const [equipos, setEquipos] = useState<{ club: string; ciudad: string }[]>([]);
  const [codigoInput, setCodigoInput] = useState('');

  useEffect(() => {
    fetch(`${API}/api/copa/equipos-publico`).then(r => r.json()).then(d => Array.isArray(d) && setEquipos(d)).catch(() => {});
  }, []);

  const irAlPortal = () => {
    const cod = codigoInput.trim().toUpperCase();
    if (!cod) return;
    window.location.href = `${window.location.origin}${window.location.pathname}?copa=${cod}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-5 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white rounded-2xl w-12 h-12 p-1.5 flex items-center justify-center shadow-md shrink-0">
              <img src={GUANA_LOGO} alt="GuiaSAI" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight">Guía<span className="text-orange-300">SAI</span></span>
              <p className="text-emerald-100 text-[11px] font-semibold">RNT 48674 · Aliado oficial logístico</p>
            </div>
          </div>
          <p className="text-[11px] font-bold tracking-[.16em] uppercase text-orange-200 mb-1">Torneo interclubes de voleibol</p>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Copa de la Isla</h1>
          <p className="text-emerald-50 text-sm flex items-center gap-1.5"><Calendar size={14} /> 16 – 22 de diciembre, 2026 · San Andrés Islas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">

        {/* Sobre el torneo */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#003D5C] mb-2">Sobre el torneo</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            La Copa de la Isla reúne a clubes y ligas de voleibol de toda Colombia en San Andrés, en varias categorías. GuíaSAI S.A.S. — empresa local con más de 10 años de trayectoria — es el aliado oficial encargado de la logística de hospedaje, alimentación y traslados de las delegaciones participantes.
          </p>
        </div>

        {/* Comité organizador */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#003D5C] mb-3 flex items-center gap-2"><Users size={18} className="text-teal-600" /> Comité organizador</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {COMITE.map(p => (
              <div key={p.nombre} className="bg-gray-50 rounded-xl p-3">
                <p className="font-bold text-sm text-gray-800">{p.nombre}</p>
                <p className="text-[11px] text-gray-500">{p.rol}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Marcador / posiciones — próximamente */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#003D5C] mb-2 flex items-center gap-2"><Trophy size={18} className="text-orange-500" /> Marcador y tabla de posiciones</h2>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
            <p className="text-orange-700 font-bold text-sm">Se activa durante los días del torneo</p>
            <p className="text-[12px] text-orange-600 mt-1">El equipo de GuíaSAI irá actualizando resultados y fotos en tiempo real del 16 al 22 de diciembre.</p>
          </div>
        </div>

        {/* Equipos confirmados */}
        {equipos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-[#003D5C] mb-3 flex items-center gap-2"><MapPin size={18} className="text-teal-600" /> Equipos confirmados ({equipos.length})</h2>
            <div className="flex flex-wrap gap-2">
              {equipos.map((e, i) => (
                <span key={i} className="text-xs font-semibold bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full">{e.club}{e.ciudad ? ` · ${e.ciudad}` : ''}</span>
              ))}
            </div>
          </div>
        )}

        {/* Dos accesos: ya tengo código / quiero inscribirme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-[#003D5C] mb-1 flex items-center gap-1.5"><KeyRound size={16} className="text-teal-600" /> ¿Ya tienes código?</h3>
            <p className="text-[12px] text-gray-500 mb-3">Si tu delegación ya está registrada, entra con tu código de 6 letras.</p>
            <div className="flex gap-2">
              <input
                value={codigoInput} onChange={e => setCodigoInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') irAlPortal(); }}
                placeholder="EJEMPLO" maxLength={6}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-500"
              />
              <button onClick={irAlPortal} className="bg-teal-600 hover:bg-teal-700 text-white px-3 rounded-xl transition-colors"><ArrowRight size={16} /></button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-[#003D5C] mb-1">¿Quieres inscribir tu equipo?</h3>
            <p className="text-[12px] text-gray-500 mb-3">Escríbenos y armamos la cotización de hospedaje, alimentación y traslados para tu delegación.</p>
            <a
              href={waLink('Hola GuíaSAI 🏐 quiero inscribir a mi equipo en la Copa de la Isla')}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle size={14} /> Inscribir mi equipo
            </a>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-400 pb-6">GuíaSAI S.A.S. · RNT 48674 · #LaivStieg · Operador logístico oficial de la Copa de la Isla</p>
    </div>
  );
};

export default CopaLanding;
