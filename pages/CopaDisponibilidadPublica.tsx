/**
 * CopaDisponibilidadPublica — Un solo link público, sin código de acceso,
 * para compartir con TODAS las delegaciones del evento. Cada coordinador
 * pone su cantidad de pax y ve los hoteles verificados con cupo.
 *
 * Acceso: app.guiasanandresislas.com/?p=copa-hoteles
 */

import React, { useEffect, useState } from 'react';
import { Hotel, MessageCircle, Search } from 'lucide-react';
import { GUANA_LOGO } from '../constants';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

interface HotelDisp { id: string; nombre: string; tipo: string; precioNoche: number; imagen: string; descripcion: string; habitacionesDisponibles: number; capacidadEstimada: number }

const CopaDisponibilidadPublica: React.FC = () => {
  const [pax, setPax] = useState('');
  const [hoteles, setHoteles] = useState<HotelDisp[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDisponibles, setTotalDisponibles] = useState(0);

  const cargar = (p: string) => {
    setLoading(true);
    const qs = p && Number(p) > 0 ? `?pax=${p}` : '';
    fetch(`${API}/api/copa/disponibilidad${qs}`)
      .then(r => r.json())
      .then(d => {
        setHoteles(Array.isArray(d?.hoteles) ? d.hoteles : []);
        setTotalDisponibles(d?.totalDisponibles || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(''); }, []);

  return (
    <div className="min-h-screen bg-[#F5EFE3] text-[#111820] pb-10" style={{ fontFamily: "'Archivo', sans-serif" }}>
      <div className="bg-[#05263B] text-[#F5EFE3] px-4 pt-8 pb-6 border-b-4 border-[#FF6600]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5 mb-3">
            <img src={GUANA_LOGO} alt="GuiaSAI" className="w-8 h-8 object-contain bg-white rounded-lg p-1" />
            <p className="text-[10px] font-mono tracking-widest uppercase text-[#FF6600]">GuíaSAI · RNT 48674 · Turismo Raizal</p>
          </div>
          <h1 className="text-2xl font-black uppercase mb-1 flex items-center gap-2"><Hotel size={22} /> Hospedaje para delegaciones</h1>
          <p className="text-xs font-mono text-[#9FB6C4]">Hoteles verificados por GuíaSAI con cupo disponible para tu equipo — Copa de la Isla 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        <div className="bg-white border border-[#E7DFCE] rounded-lg p-4">
          <label className="text-[11px] font-bold text-[#6B7785] uppercase mb-1.5 block">¿Cuántas personas viajan en tu delegación?</label>
          <div className="flex gap-2">
            <input
              type="number" min={1} value={pax}
              onChange={e => setPax(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && cargar(pax)}
              placeholder="Ej: 35"
              className="flex-1 border border-[#E7DFCE] rounded px-3 py-2.5 text-sm font-mono"
            />
            <button onClick={() => cargar(pax)} className="flex items-center gap-1.5 bg-[#05263B] text-white font-bold text-sm px-4 rounded">
              <Search size={14} /> Buscar
            </button>
          </div>
          <p className="text-[10px] text-[#6B7785] mt-2">
            {pax ? `Mostrando hoteles con espacio para ${pax} pax.` : `Mostrando los ${totalDisponibles} hoteles disponibles para el evento.`} Capacidad estimada según habitaciones — se confirma al solicitar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {hoteles.map(h => (
            <div key={h.id} className="bg-white border border-[#E7DFCE] rounded-lg overflow-hidden">
              {h.imagen ? <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url('${h.imagen}')` }} /> : <div className="h-32 bg-[#F5EFE3] flex items-center justify-center text-3xl">🏨</div>}
              <div className="p-3">
                <p className="font-bold text-sm">{h.nombre}</p>
                <p className="text-[10px] text-[#6B7785] mb-2">{h.tipo} · {h.habitacionesDisponibles} habitaciones · capacidad estimada {h.capacidadEstimada} pax</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#05263B] text-sm">
                    {h.precioNoche > 0 ? <>{cop(h.precioNoche)}<span className="text-[10px] font-normal text-[#6B7785]">/noche</span></> : <span className="text-[11px] text-[#8A4B00] font-bold">Precio bajo pedido</span>}
                  </span>
                  <a
                    href={`https://wa.me/573153836043?text=${encodeURIComponent(`Hola GuíaSAI, quiero cotizar ${h.nombre} para mi delegación${pax ? ` (${pax} pax)` : ''} — Copa de la Isla.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold bg-[#FF6600] text-white px-2.5 py-1.5 rounded"
                  >
                    <MessageCircle size={11} /> Cotizar
                  </a>
                </div>
              </div>
            </div>
          ))}
          {!loading && hoteles.length === 0 && (
            <div className="col-span-2 text-center py-10 text-[#6B7785] text-sm">
              {pax ? `Ningún hotel verificado tiene capacidad estimada para ${pax} pax todavía — escríbenos, seguimos ampliando la lista.` : 'Aún no hay hoteles marcados como disponibles.'}
            </div>
          )}
          {loading && <div className="col-span-2 text-center py-10 text-[#6B7785] text-sm">Cargando hoteles...</div>}
        </div>

        <a
          href="https://wa.me/573153836043?text=Hola%20Gu%C3%ADaSAI%2C%20somos%20una%20delegaci%C3%B3n%20de%20la%20Copa%20de%20la%20Isla%20y%20queremos%20cotizar%20hospedaje."
          target="_blank" rel="noopener noreferrer"
          className="block text-center bg-[#1E6B4F] text-white font-bold text-sm py-3.5 rounded-lg"
        >
          💬 Hablar directo con GuíaSAI por WhatsApp
        </a>
      </div>
      <p className="text-center text-[10px] font-mono text-[#6B7785] pt-8">GuíaSAI S.A.S. · RNT 48674 · #LaivStieg</p>
    </div>
  );
};

export default CopaDisponibilidadPublica;
