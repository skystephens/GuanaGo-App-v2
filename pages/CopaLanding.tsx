/**
 * CopaLanding — Página pública de la Copa de la Isla, sin código ni login.
 * Punto de llegada informativo del torneo: qué es, categorías, escenarios,
 * equipos confirmados, vista previa de alojamiento, y accesos a "Ya tengo
 * código" (delegados) y "Quiero inscribir mi equipo" (WhatsApp).
 *
 * Datos oficiales tomados del flyer "I Copa Nacional de Voleibol en San
 * Andrés Islas" (Club Villa Real de Cali & Club Deportivo Los Pulpitos).
 *
 * Capa 1 de 4 del modelo de acceso (Pública / Delegado / Participante / Staff)
 * — ver documento "Copa de la Isla — Plan estratégico" sección 5.
 */

import React, { useEffect, useState } from 'react';
import { MessageCircle, Trophy, Users, MapPin, Calendar, ArrowRight, ArrowLeft, KeyRound, Hotel, ExternalLink } from 'lucide-react';
import { GUANA_LOGO } from '../constants';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
const wa = 'https://wa.me/573153836043';
const waLink = (msg: string) => `${wa}?text=${encodeURIComponent(msg)}`;

const COMITE = [
  { nombre: 'Fernando Espinosa', rol: 'Organizador · Todas las categorías' },
  { nombre: 'Jacir Davis Blanco', rol: 'Anfitrión · Logística de escenarios' },
  { nombre: 'Carlos Colorado', rol: 'Logística de arbitraje y reglamento' },
  { nombre: 'Daniela Espinosa', rol: 'Organizadora · Todas las categorías' },
  { nombre: 'Sky Stephens', rol: 'Anfitriona · Hospedaje, transporte y alimentación' },
];

const CATEGORIAS = [
  { nombre: 'Mini', rango: '2014 – 2015', genero: 'Femenino' },
  { nombre: 'Infantil', rango: '2011 – 2013', genero: 'Femenino' },
  { nombre: 'Menores', rango: '2009 – 2010', genero: 'Femenino' },
  { nombre: 'Sub 25', rango: '2001', genero: 'Femenino' },
  { nombre: 'Sub 21', rango: '2005', genero: 'Masculino' },
];

const ESCENARIOS_CONFIRMADOS = [
  { nombre: 'Coliseo Cove Hill', detalle: 'Cubierto — sede principal', lat: 12.541243, lon: -81.725084 },
  { nombre: 'Colegio Bilingüe Flowers Hill', detalle: 'Cubierto', lat: 12.5701, lon: -81.7138 },
  { nombre: 'Cancha Colegio Philip Bigman (El Rancho)', detalle: 'Cubierto', lat: 12.547566, lon: -81.7046083 },
  { nombre: 'Cancha Brooks Hill', detalle: 'Cubierta', lat: 12.556099, lon: -81.721529 },
];

interface HotelDisp { id: string; nombre: string; tipo: string; precioNoche: number; imagen: string; capacidadEstimada: number }
interface ServicioDestacado { id: string; nombre: string; tipo: string; precio: number; descripcion: string; imagen: string }

interface CopaLandingProps {
  onBack?: () => void;
}

const CopaLanding: React.FC<CopaLandingProps> = ({ onBack }) => {
  const [equipos, setEquipos] = useState<{ club: string; ciudad: string }[]>([]);
  const [hoteles, setHoteles] = useState<HotelDisp[]>([]);
  const [servicios, setServicios] = useState<{ tours: ServicioDestacado[]; traslados: ServicioDestacado[]; cultura: ServicioDestacado[] }>({ tours: [], traslados: [], cultura: [] });
  const [codigoInput, setCodigoInput] = useState('');

  useEffect(() => {
    fetch(`${API}/api/copa/equipos-publico`).then(r => r.json()).then(d => Array.isArray(d) && setEquipos(d)).catch(() => {});
    fetch(`${API}/api/copa/disponibilidad?pax=20`).then(r => r.json())
      .then(d => Array.isArray(d?.hoteles) && setHoteles(d.hoteles.slice(0, 4))).catch(() => {});
    fetch(`${API}/api/copa/servicios-destacados`).then(r => r.json()).then(d => d && setServicios(d)).catch(() => {});
  }, []);

  const irAlPortal = () => {
    const cod = codigoInput.trim().toUpperCase();
    if (!cod) return;
    window.location.href = `${window.location.origin}${window.location.pathname}?copa=${cod}`;
  };

  const irAHoteles = () => { window.location.href = `${window.location.origin}${window.location.pathname}?p=copa-hoteles`; };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-5 py-6">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors mb-4"
              aria-label="Volver al inicio"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white rounded-2xl w-12 h-12 p-1.5 flex items-center justify-center shadow-md shrink-0">
              <img src={GUANA_LOGO} alt="GuiaSAI" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight">Guía<span className="text-orange-300">SAI</span></span>
              <p className="text-emerald-100 text-[11px] font-semibold">RNT 48674 · Aliado oficial logístico</p>
            </div>
          </div>
          <p className="text-[11px] font-bold tracking-[.16em] uppercase text-orange-200 mb-1">I Copa Nacional de Voleibol en San Andrés Islas</p>
          <h1 className="text-3xl md:text-4xl font-black mb-1">La Copa de la Isla</h1>
          <p className="text-emerald-50 text-sm italic mb-3">"Juguemos en el mar de los 7 colores"</p>
          <p className="text-emerald-50 text-sm flex items-center gap-1.5"><Calendar size={14} /> 18 – 21 de diciembre, 2026 · San Andrés Islas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">

        {/* Sobre el torneo */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#003D5C] mb-2">Sobre el torneo</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            La Copa de la Isla reúne a clubes y ligas de voleibol de toda Colombia en San Andrés, organizada por Club Villa Real de Cali y Club Deportivo Los Pulpitos. GuíaSAI S.A.S. — empresa local con más de 10 años de trayectoria — es el aliado oficial encargado de la logística de hospedaje, alimentación y traslados de las delegaciones participantes.
          </p>
        </div>

        {/* Categorías + Inscripción */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#003D5C] mb-3">Categorías</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {CATEGORIAS.map(c => (
              <div key={c.nombre} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="font-bold text-sm text-gray-800">{c.nombre}</p>
                <p className="text-[11px] text-gray-500">{c.rango}</p>
                <p className="text-[10px] text-teal-600 font-semibold mt-0.5">{c.genero}</p>
              </div>
            ))}
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-[12.5px] text-teal-800">
            <b>Inscripción:</b> $500.000 por equipo (julio a octubre) — consulta disponibilidad de cupo con la organización.
          </div>
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

        {/* Escenarios deportivos */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#003D5C] mb-1 flex items-center gap-2"><MapPin size={18} className="text-orange-500" /> Escenarios deportivos</h2>
          <p className="text-[12px] text-gray-500 mb-3">Las 4 sedes cubiertas confirmadas para el torneo.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ESCENARIOS_CONFIRMADOS.map(e => (
              <a
                key={e.nombre}
                href={`https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lon}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-800 leading-snug">{e.nombre}</p>
                  <p className="text-[11px] text-gray-500">{e.detalle}</p>
                </div>
                <span className="text-orange-500 text-xs font-bold shrink-0">📍</span>
              </a>
            ))}
          </div>
        </div>

        {/* Vista previa de alojamiento — mezcla con copa-hoteles */}
        {hoteles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#003D5C] flex items-center gap-2"><Hotel size={18} className="text-teal-600" /> Alojamiento verificado</h2>
              <button onClick={irAHoteles} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 shrink-0">
                Ver todos <ExternalLink size={12} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {hoteles.map(h => (
                <button key={h.id} onClick={irAHoteles} className="shrink-0 w-40 text-left border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  {h.imagen ? (
                    <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url('${h.imagen}')` }} />
                  ) : (
                    <div className="h-24 bg-gray-50 flex items-center justify-center text-2xl">🏨</div>
                  )}
                  <div className="p-2.5">
                    <p className="font-bold text-[12px] text-gray-800 truncate">{h.nombre}</p>
                    <p className="text-[10px] text-gray-400">{h.tipo}</p>
                    {h.precioNoche > 0 && <p className="text-[12px] font-bold text-[#003D5C] mt-0.5">{cop(h.precioNoche)}<span className="text-[9px] font-normal text-gray-400">/noche</span></p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tours, Traslados y Cultura Raizal */}
        {(servicios.tours.length > 0 || servicios.traslados.length > 0 || servicios.cultura.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-bold text-[#003D5C]">Otros servicios para tu delegación</h2>

            {servicios.traslados.length > 0 && (
              <FilaServicios titulo="Traslados" items={servicios.traslados} emoji="🚐" />
            )}
            {servicios.tours.length > 0 && (
              <FilaServicios titulo="Tours" items={servicios.tours} emoji="🏝️" />
            )}
            {servicios.cultura.length > 0 && (
              <FilaServicios titulo="Cultura Raizal" items={servicios.cultura} emoji="🎭" />
            )}
          </div>
        )}

        {/* Marcador / posiciones — próximamente */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#003D5C] mb-2 flex items-center gap-2"><Trophy size={18} className="text-orange-500" /> Marcador y tabla de posiciones</h2>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
            <p className="text-orange-700 font-bold text-sm">Se activa durante los días del torneo</p>
            <p className="text-[12px] text-orange-600 mt-1">El equipo de GuíaSAI irá actualizando resultados y fotos en tiempo real del 18 al 21 de diciembre.</p>
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

function FilaServicios({ titulo, items, emoji }: { titulo: string; items: ServicioDestacado[]; emoji: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-2">{emoji} {titulo}</p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {items.map(s => (
          <a
            key={s.id}
            href={waLink(`Hola GuíaSAI 🏐 quiero información sobre "${s.nombre}" para mi delegación en la Copa de la Isla`)}
            target="_blank" rel="noopener noreferrer"
            className="shrink-0 w-36 text-left border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {s.imagen ? (
              <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url('${s.imagen}')` }} />
            ) : (
              <div className="h-20 bg-gray-50 flex items-center justify-center text-xl">{emoji}</div>
            )}
            <div className="p-2">
              <p className="font-bold text-[11px] text-gray-800 leading-snug line-clamp-2">{s.nombre}</p>
              {s.precio > 0 && <p className="text-[11px] font-bold text-[#003D5C] mt-0.5">{cop(s.precio)}</p>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default CopaLanding;
