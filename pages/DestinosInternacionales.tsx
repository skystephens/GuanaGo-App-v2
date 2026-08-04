/**
 * DestinosInternacionales — Pantalla dedicada de paquetes internacionales de aliados
 * Muestra SOLO paquetes internacionales, sin ningún contenido de San Andrés.
 * Lee /api/paquetes-internacionales (misma fuente que usaba la sección en Home2).
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Globe2, Loader2, X, Calendar, MapPin, FileText, MessageCircle } from 'lucide-react';
import { AppRoute } from '../types';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface PaqueteIntl {
  id: string; nombre: string; categoria: string; duracion: string;
  origen: string; salidas: string; precioDesde: number;
  precioSencilla: number | null; precioNino: number | null;
  flyerDrive: string; imagen: string; notas: string;
}

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const emojiPara = (categoria: string) =>
  categoria === 'Colombia' ? '🇨🇴' : categoria === 'América' ? '🌎' : categoria === 'Europa' ? '🇪🇺' :
  categoria === 'África' ? '🦁' : categoria === 'Asia' ? '🌏' : '🕌';

const fmtPrecio = (categoria: string, n: number | null) => {
  if (!n) return null;
  return categoria === 'Colombia'
    ? `$${Math.round(n).toLocaleString('es-CO')} COP`
    : `USD $${Math.round(n).toLocaleString('en-US')}`;
};

const wa = 'https://wa.me/573153836043';

const DestinosInternacionales: React.FC<Props> = ({ onBack }) => {
  const [paquetes, setPaquetes] = useState<PaqueteIntl[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState<PaqueteIntl | null>(null);

  useEffect(() => {
    fetch(`${API}/api/paquetes-internacionales`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setPaquetes(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categorias = ['Todos', ...Array.from(new Set(paquetes.map(p => p.categoria).filter(Boolean)))];
  const filtrados = categoria === 'Todos' ? paquetes : paquetes.filter(p => p.categoria === categoria);

  return (
    <div className="min-h-screen bg-white">
      {/* Header — solo esto, nada de hero de San Andrés */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0">
            <ArrowLeft size={20} className="text-gray-800" />
          </button>
          <div>
            <h1 className="text-lg font-black text-[#003D5C] flex items-center gap-2">
              <Globe2 size={18} className="text-indigo-600" /> Otros Destinos
            </h1>
            <p className="text-xs text-gray-400">Paquetes internacionales con nuestros aliados</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-[11px] font-bold tracking-[.14em] uppercase text-teal-600">Desde Bogotá y Medellín · Con asesoría GuiaSAI</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#003D5C] mt-1">Destinos internacionales</h2>
          </div>
          <a
            href={`${wa}?text=${encodeURIComponent('Hola GuiaSAI 🌍 quiero información sobre los paquetes internacionales')}`}
            target="_blank" rel="noopener noreferrer"
            className="text-sm font-bold text-orange-500 hover:text-orange-600"
          >
            Habla con un asesor →
          </a>
        </div>

        {/* Filtro por categoría */}
        {categorias.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
            {categorias.map(c => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  categoria === c ? 'bg-[#003D5C] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Globe2 size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">No hay paquetes disponibles en esta categoría todavía</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtrados.map(p => {
              const emoji = emojiPara(p.categoria);
              const primeraSalida = (p.salidas || '').split('|')[0].trim();
              return (
                <button
                  key={p.id}
                  onClick={() => setSeleccionado(p)}
                  className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  {p.imagen ? (
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${p.imagen}')` }} />
                  ) : (
                    <div className="h-40 flex items-center justify-center text-5xl" style={{ background: 'linear-gradient(115deg,#003D5C,#2AABBB)' }}>{emoji}</div>
                  )}
                  <div className="p-4">
                    <p className="text-[9px] font-bold tracking-wider uppercase text-teal-600">{p.categoria} · {p.duracion}</p>
                    <h3 className="font-bold text-[15px] text-gray-800 mt-1 leading-snug">{p.nombre}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Salida desde {p.origen}{primeraSalida ? ` · ${primeraSalida}` : ''}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Desde · por persona</p>
                        <p className="font-black text-[#003D5C]">{fmtPrecio(p.categoria, p.precioDesde)}</p>
                      </div>
                      <span className="text-xs font-bold text-orange-500">Más info →</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {seleccionado && <DetallePaquete paquete={seleccionado} onClose={() => setSeleccionado(null)} />}
    </div>
  );
};

function DetallePaquete({ paquete: p, onClose }: { paquete: PaqueteIntl; onClose: () => void }) {
  const emoji = emojiPara(p.categoria);
  const salidas = (p.salidas || '').split('|').map(s => s.trim()).filter(Boolean);
  const waLink = `${wa}?text=${encodeURIComponent(`Hola GuiaSAI 🌍 quiero información del paquete: ${p.nombre}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Imagen / cabecera */}
        <div className="relative shrink-0">
          {p.imagen ? (
            <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url('${p.imagen}')` }} />
          ) : (
            <div className="h-48 flex items-center justify-center text-6xl" style={{ background: 'linear-gradient(115deg,#003D5C,#2AABBB)' }}>{emoji}</div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-5 py-5">
          <p className="text-[10px] font-bold tracking-wider uppercase text-teal-600">{p.categoria} · {p.duracion}</p>
          <h2 className="text-xl font-black text-[#003D5C] mt-1 leading-snug">{p.nombre}</h2>

          {p.origen && (
            <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-3">
              <MapPin size={14} className="text-gray-400 shrink-0" /> Sale desde <b>{p.origen}</b>
            </p>
          )}

          {salidas.length > 0 && (
            <div className="text-sm text-gray-600 flex items-start gap-1.5 mt-2">
              <Calendar size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <b>Próximas salidas</b>
                <ul className="mt-1 space-y-0.5 text-[13px]">
                  {salidas.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Precios */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase text-gray-400 font-bold">Doble</p>
              <p className="font-black text-[#003D5C] text-sm mt-0.5">{fmtPrecio(p.categoria, p.precioDesde) || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase text-gray-400 font-bold">Sencilla</p>
              <p className="font-black text-[#003D5C] text-sm mt-0.5">{fmtPrecio(p.categoria, p.precioSencilla) || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase text-gray-400 font-bold">Niño</p>
              <p className="font-black text-[#003D5C] text-sm mt-0.5">{fmtPrecio(p.categoria, p.precioNino) || '—'}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">Precios por persona</p>

          {p.notas && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[12px] text-amber-900 leading-relaxed">{p.notas}</p>
            </div>
          )}

          <div className="flex gap-2 mt-5">
            {p.flyerDrive && (
              <a
                href={p.flyerDrive}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50"
              >
                <FileText size={16} /> Ver más
              </a>
            )}
            <a
              href={waLink}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600"
            >
              <MessageCircle size={16} /> Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DestinosInternacionales;
