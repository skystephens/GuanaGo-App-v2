/**
 * AdminTrasladosCalc — Calculadora de Traslados Aeropuerto ↔ Hotel
 *
 * Herramienta independiente (no depende de Copa/Delegaciones ni de ningún
 * otro módulo). Vehículo sedán, 1-4 pax por trayecto según equipaje,
 * tarifa por vehículo. Turno diurno/nocturno automático según la hora.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Car, Copy, Check, Sun, Moon } from 'lucide-react';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

interface Props { onBack: () => void }
interface Hotel { id: string; nombre: string; colorZona: string; precioDiurno: number; precioNocturno: number }

const COLOR_HEX: Record<string, string> = {
  Amarillo: '#FACC15', Verde: '#22C55E', Magenta: '#EC4899', Azul: '#60A5FA', Rojo: '#EF4444', 'Sin color': '#D1D5DB',
};

const turnoDeHora = (hhmm: string): 'diurno' | 'nocturno' => {
  if (!/^\d{1,2}:\d{2}$/.test(hhmm)) return 'diurno';
  const h = Number(hhmm.split(':')[0]);
  return (h >= 6 && h < 21) ? 'diurno' : 'nocturno';
};

const AdminTrasladosCalc: React.FC<Props> = ({ onBack }) => {
  const [hoteles, setHoteles] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState('');
  const [pax, setPax] = useState(4);
  const [equipajeGrande, setEquipajeGrande] = useState(false);
  const [horaLlegada, setHoraLlegada] = useState('14:00');
  const [horaSalida, setHoraSalida] = useState('10:00');
  const [incluirSalida, setIncluirSalida] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    fetch(`${API}/api/traslados/hoteles`).then(r => r.json()).then(d => Array.isArray(d) && setHoteles(d)).catch(() => {});
  }, []);

  const hotel = hoteles.find(h => h.id === hotelId) || null;
  const capacidadPorVehiculo = equipajeGrande ? 3 : 4;
  const vehiculos = Math.max(1, Math.ceil(pax / capacidadPorVehiculo));
  const turnoLlegada = turnoDeHora(horaLlegada);
  const turnoSalida = turnoDeHora(horaSalida);

  const precioLlegada = hotel ? (turnoLlegada === 'diurno' ? hotel.precioDiurno : hotel.precioNocturno) : 0;
  const precioSalida = hotel ? (turnoSalida === 'diurno' ? hotel.precioDiurno : hotel.precioNocturno) : 0;

  const totalLlegada = vehiculos * precioLlegada;
  const totalSalida = incluirSalida ? vehiculos * precioSalida : 0;
  const total = totalLlegada + totalSalida;

  const mensaje = useMemo(() => {
    if (!hotel) return '';
    let t = `🚕 Traslado Aeropuerto ↔ ${hotel.nombre}\n\n`;
    t += `👥 ${pax} pasajeros · ${vehiculos} vehículo${vehiculos > 1 ? 's' : ''} sedán (${capacidadPorVehiculo} pax c/u)\n\n`;
    t += `✈️ Llegada ${horaLlegada} (${turnoLlegada}): ${vehiculos} × ${cop(precioLlegada)} = ${cop(totalLlegada)}\n`;
    if (incluirSalida) t += `🛫 Salida ${horaSalida} (${turnoSalida}): ${vehiculos} × ${cop(precioSalida)} = ${cop(totalSalida)}\n`;
    t += `\n💰 Total traslados: ${cop(total)}`;
    return t;
  }, [hotel, pax, vehiculos, capacidadPorVehiculo, horaLlegada, horaSalida, turnoLlegada, turnoSalida, precioLlegada, precioSalida, totalLlegada, totalSalida, incluirSalida, total]);

  const copiar = () => {
    navigator.clipboard.writeText(mensaje);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };

  const hotelesFiltrados = hoteles.filter(h => !buscar || h.nombre.toLowerCase().includes(buscar.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F5EFE3] text-[#111820] pb-10" style={{ fontFamily: "'Archivo', sans-serif" }}>
      <div className="bg-[#05263B] text-[#F5EFE3] px-4 pt-10 pb-5 border-b-4 border-[#FF6600]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft size={15} /></button>
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-[#FF6600]">Herramienta independiente</p>
            <h1 className="text-xl font-black uppercase flex items-center gap-2"><Car size={20} /> Calculadora de Traslados</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        <div className="bg-[#E8F1F2] border border-[#B9D8DB] rounded p-3 text-xs text-[#0A5C64] leading-relaxed">
          Vehículo sedán, tarifa por vehículo (no por persona) — hasta 4 pax por trayecto, o 3 si llevan mucho equipaje. Diurno 6:00am–8:59pm · Nocturno 9:00pm–5:59am.
        </div>

        {/* Selector de hotel */}
        <div className="bg-white border border-[#E7DFCE] rounded-lg overflow-hidden">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Hotel destino</h2>
          <div className="p-4">
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar hotel..." className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {hotelesFiltrados.map(h => (
                <button key={h.id} onClick={() => setHotelId(h.id)}
                  className={`flex items-center gap-2 text-left p-2.5 rounded border-2 transition-colors ${hotelId === h.id ? 'border-[#FF6600] bg-[#FFF8F3]' : 'border-[#E7DFCE] hover:border-[#0E7C86]'}`}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLOR_HEX[h.colorZona] || '#D1D5DB' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{h.nombre}</p>
                    <p className="text-[10px] font-mono text-[#6B7785]">{cop(h.precioDiurno)} / {cop(h.precioNocturno)}</p>
                  </div>
                </button>
              ))}
              {hoteles.length === 0 && <p className="text-sm text-[#6B7785] col-span-2 text-center py-4">Cargando hoteles...</p>}
            </div>
          </div>
        </div>

        {hotel && (
          <>
            {/* Parámetros */}
            <div className="bg-white border border-[#E7DFCE] rounded-lg overflow-hidden">
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Grupo y horarios</h2>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7785] uppercase">Pasajeros</label>
                    <input type="number" min={1} value={pax} onChange={e => setPax(Math.max(1, Number(e.target.value)))} className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1" />
                  </div>
                  <label className="flex items-center gap-2 mt-5 text-xs font-bold text-[#6B7785]">
                    <input type="checkbox" checked={equipajeGrande} onChange={e => setEquipajeGrande(e.target.checked)} className="w-4 h-4 accent-[#FF6600]" />
                    Equipaje grande (3 pax/vehículo)
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7785] uppercase flex items-center gap-1">Hora llegada {turnoLlegada === 'diurno' ? <Sun size={11} className="text-orange-500" /> : <Moon size={11} className="text-indigo-500" />}</label>
                    <input type="time" value={horaLlegada} onChange={e => setHoraLlegada(e.target.value)} className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1" />
                  </div>
                  <div className={incluirSalida ? '' : 'opacity-40'}>
                    <label className="text-[10px] font-bold text-[#6B7785] uppercase flex items-center gap-1">Hora salida {turnoSalida === 'diurno' ? <Sun size={11} className="text-orange-500" /> : <Moon size={11} className="text-indigo-500" />}</label>
                    <input type="time" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} disabled={!incluirSalida} className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#6B7785]">
                  <input type="checkbox" checked={incluirSalida} onChange={e => setIncluirSalida(e.target.checked)} className="w-4 h-4 accent-[#FF6600]" />
                  Incluir traslado de salida (ida y vuelta)
                </label>
              </div>
            </div>

            {/* Resultado */}
            <div className="bg-white border-2 border-[#FF6600] rounded-lg overflow-hidden">
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#8A4B00] bg-[#FFF3E9] px-4 py-3">Resultado</h2>
              <div className="p-4">
                <p className="text-sm mb-1"><b>{vehiculos}</b> vehículo{vehiculos > 1 ? 's' : ''} sedán necesario{vehiculos > 1 ? 's' : ''} ({capacidadPorVehiculo} pax c/u)</p>
                <table className="w-full text-xs mt-3">
                  <tbody>
                    <tr className="border-b border-[#F2EEE5]">
                      <td className="py-1.5">Llegada · {horaLlegada} ({turnoLlegada})</td>
                      <td className="py-1.5 text-right font-mono">{vehiculos} × {cop(precioLlegada)}</td>
                      <td className="py-1.5 text-right font-mono font-bold pl-3">{cop(totalLlegada)}</td>
                    </tr>
                    {incluirSalida && (
                      <tr className="border-b border-[#F2EEE5]">
                        <td className="py-1.5">Salida · {horaSalida} ({turnoSalida})</td>
                        <td className="py-1.5 text-right font-mono">{vehiculos} × {cop(precioSalida)}</td>
                        <td className="py-1.5 text-right font-mono font-bold pl-3">{cop(totalSalida)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={2} className="pt-2 font-black">Total traslados</td>
                      <td className="pt-2 text-right font-mono font-black text-base text-[#05263B]">{cop(total)}</td>
                    </tr>
                  </tbody>
                </table>
                <button onClick={copiar} className="w-full flex items-center justify-center gap-2 bg-[#05263B] text-white font-bold text-sm py-3 rounded mt-4">
                  {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} Copiar para WhatsApp
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminTrasladosCalc;
