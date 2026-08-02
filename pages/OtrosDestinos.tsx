import React, { useEffect, useState } from 'react';
import { ArrowLeft, Globe2, Calendar, MapPin, FileText, MessageCircle, Loader2 } from 'lucide-react';
import { AppRoute } from '../types';
import { getPaquetesInternacionales, PaqueteInternacional } from '../services/airtableService';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const WHATSAPP_NUMERO = '573153836043';

const fmtUSD = (n: number) => n ? `US$${n.toLocaleString('en-US')}` : '';

const OtrosDestinos: React.FC<Props> = ({ onBack }) => {
  const [paquetes, setPaquetes] = useState<PaqueteInternacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState<string>('Todos');
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    getPaquetesInternacionales()
      .then(setPaquetes)
      .catch((e) => console.error('[OtrosDestinos] Error cargando paquetes:', e))
      .finally(() => setLoading(false));
  }, []);

  const categorias = ['Todos', ...Array.from(new Set(paquetes.map(p => p.categoria).filter(Boolean)))];
  const filtrados = categoria === 'Todos' ? paquetes : paquetes.filter(p => p.categoria === categoria);

  const linkWhatsApp = (p: PaqueteInternacional) => {
    const texto = `Hola, me interesa el paquete "${p.nombre}" 🌍 ¿Me cuentan más detalles?`;
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Globe2 size={18} className="text-indigo-600" /> Otros Destinos
          </h1>
          <p className="text-xs text-gray-400">Paquetes internacionales con nuestros aliados</p>
        </div>
      </div>

      {/* Filtro por categoría */}
      {categorias.length > 1 && (
        <div className="px-6 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                categoria === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Globe2 size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">No hay paquetes disponibles en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(p => {
              const abierto = expandido === p.id;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandido(abierto ? null : p.id)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1.5">
                        {p.categoria}
                      </span>
                      <h3 className="font-bold text-gray-900 leading-tight">{p.nombre}</h3>
                      <p className="text-xs text-gray-400 mt-1">{p.duracion}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400">Desde</p>
                      <p className="text-lg font-black text-emerald-600 leading-none">{fmtUSD(p.precioDobleUSD)}</p>
                      <p className="text-[9px] text-gray-400">USD / persona</p>
                    </div>
                  </button>

                  {abierto && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-2.5">
                      {p.origen && (
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <MapPin size={13} className="text-gray-400 shrink-0" /> Sale desde: <b>{p.origen}</b>
                        </p>
                      )}
                      {p.salidas.length > 0 && (
                        <div className="text-xs text-gray-600 flex items-start gap-1.5">
                          <Calendar size={13} className="text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <b>Próximas salidas:</b>
                            <ul className="mt-1 space-y-0.5">
                              {p.salidas.slice(0, 4).map((s, i) => <li key={i}>• {s}</li>)}
                              {p.salidas.length > 4 && <li className="text-gray-400">+ {p.salidas.length - 4} fechas más</li>}
                            </ul>
                          </div>
                        </div>
                      )}
                      {p.precioSencillaUSD > 0 && (
                        <p className="text-xs text-gray-600">Habitación sencilla: <b>{fmtUSD(p.precioSencillaUSD)}</b></p>
                      )}
                      {p.precioNinoUSD && (
                        <p className="text-xs text-gray-600">Tarifa niño: <b>{fmtUSD(p.precioNinoUSD)}</b></p>
                      )}
                      {p.notasTarifa && (
                        <p className="text-[11px] text-gray-400 italic">{p.notasTarifa}</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        {p.flyerUrl && (
                          <a
                            href={p.flyerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50"
                          >
                            <FileText size={14} /> Ver flyer
                          </a>
                        )}
                        <a
                          href={linkWhatsApp(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600"
                        >
                          <MessageCircle size={14} /> Consultar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-6">
          Paquetes operados por agencias mayoristas aliadas — precios en USD, pago equivalente en COP a TRM del día.
        </p>
      </div>
    </div>
  );
};

export default OtrosDestinos;
