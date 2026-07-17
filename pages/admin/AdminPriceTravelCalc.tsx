/**
 * AdminPriceTravelCalc — Calculadora de margen para alojamientos de aliados
 * externos (PriceTravel y similares).
 *
 * Herramienta de cálculo puro — no guarda nada en Airtable. El precio base
 * de estos proveedores cambia por fecha/temporada y requiere confirmación
 * manual en su portal antes de cobrar al cliente, así que esta calculadora
 * se usa en el momento de cotizar cada solicitud específica.
 */

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Hotel, Copy, Check } from 'lucide-react';

const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

interface Props { onBack: () => void }

const AdminPriceTravelCalc: React.FC<Props> = ({ onBack }) => {
  const [nombreHotel, setNombreHotel] = useState('');
  const [precioBase, setPrecioBase] = useState('');
  const [noches, setNoches] = useState(1);
  const [pax, setPax] = useState(2);
  const [margenPorPax, setMargenPorPax] = useState('30000');
  const [copiado, setCopiado] = useState(false);

  const base = Number(precioBase) || 0;
  const margen = Number(margenPorPax) || 0;

  const subtotalBase = base * noches;
  const totalMargen = margen * pax * noches;
  const total = subtotalBase + totalMargen;
  const precioPorNoche = noches ? total / noches : 0;

  const mensaje = useMemo(() => {
    let t = `🏨 ${nombreHotel || 'Hotel'}\n\n`;
    t += `📅 ${noches} noche${noches !== 1 ? 's' : ''} · 👥 ${pax} pasajero${pax !== 1 ? 's' : ''}\n\n`;
    t += `Tarifa base: ${cop(base)}/noche × ${noches} = ${cop(subtotalBase)}\n`;
    t += `Servicio GuíaSAI: ${cop(margen)}/pax/noche × ${pax} × ${noches} = ${cop(totalMargen)}\n\n`;
    t += `💰 Total: ${cop(total)} (${cop(precioPorNoche)}/noche)\n\n`;
    t += `⚠️ Tarifa sujeta a confirmación de disponibilidad final.`;
    return t;
  }, [nombreHotel, noches, pax, base, subtotalBase, margen, totalMargen, total, precioPorNoche]);

  const copiar = () => {
    navigator.clipboard.writeText(mensaje);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5EFE3] text-[#111820] pb-10" style={{ fontFamily: "'Archivo', sans-serif" }}>
      <div className="bg-[#05263B] text-[#F5EFE3] px-4 pt-10 pb-5 border-b-4 border-[#FF6600]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft size={15} /></button>
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-[#FF6600]">Herramienta independiente</p>
            <h1 className="text-xl font-black uppercase flex items-center gap-2"><Hotel size={20} /> Margen Alojamiento Aliado</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        <div className="bg-[#E8F1F2] border border-[#B9D8DB] rounded p-3 text-xs text-[#0A5C64] leading-relaxed">
          Para hoteles de aliados externos (PriceTravel y similares) cuya tarifa cambia por fecha. Calcula el precio final con tu margen antes de cotizar — recuerda confirmar disponibilidad en el portal del aliado antes de cobrar.
        </div>

        <div className="bg-white border border-[#E7DFCE] rounded-lg overflow-hidden">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#05263B] bg-[#FBF8F2] border-b border-[#E7DFCE] px-4 py-3">Datos de la cotización</h2>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[#6B7785] uppercase">Nombre del hotel</label>
              <input value={nombreHotel} onChange={e => setNombreHotel(e.target.value)} placeholder="Hotel Americas San Andrés Islas" className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B7785] uppercase">Precio base del aliado (por noche, COP)</label>
              <input type="number" value={precioBase} onChange={e => setPrecioBase(e.target.value)} placeholder="635674" className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1 font-mono" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#6B7785] uppercase">Noches</label>
                <input type="number" min={1} value={noches} onChange={e => setNoches(Math.max(1, Number(e.target.value)))} className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7785] uppercase">Pasajeros</label>
                <input type="number" min={1} value={pax} onChange={e => setPax(Math.max(1, Number(e.target.value)))} className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7785] uppercase">Margen /pax/noche</label>
                <input type="number" value={margenPorPax} onChange={e => setMargenPorPax(e.target.value)} className="w-full border border-[#E7DFCE] rounded px-3 py-2 text-sm mt-1 font-mono" />
              </div>
            </div>
          </div>
        </div>

        {base > 0 && (
          <div className="bg-white border-2 border-[#FF6600] rounded-lg overflow-hidden">
            <h2 className="text-[11px] font-mono uppercase tracking-wider text-[#8A4B00] bg-[#FFF3E9] px-4 py-3">Resultado</h2>
            <div className="p-4">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-[#F2EEE5]">
                    <td className="py-1.5">Base: {cop(base)} × {noches} noches</td>
                    <td className="py-1.5 text-right font-mono font-bold">{cop(subtotalBase)}</td>
                  </tr>
                  <tr className="border-b border-[#F2EEE5]">
                    <td className="py-1.5">Margen: {cop(margen)} × {pax} pax × {noches} noches</td>
                    <td className="py-1.5 text-right font-mono font-bold text-[#1E6B4F]">+{cop(totalMargen)}</td>
                  </tr>
                  <tr>
                    <td className="pt-2 font-black">Total ({cop(precioPorNoche)}/noche)</td>
                    <td className="pt-2 text-right font-mono font-black text-base text-[#05263B]">{cop(total)}</td>
                  </tr>
                </tbody>
              </table>
              <button onClick={copiar} className="w-full flex items-center justify-center gap-2 bg-[#05263B] text-white font-bold text-sm py-3 rounded mt-4">
                {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} Copiar para WhatsApp / Cotización
              </button>
              <p className="text-[10px] text-[#6B7785] text-center mt-2">Usa este total al editar el precio del ítem en la cotización, después de agregarlo desde el catálogo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPriceTravelCalc;
