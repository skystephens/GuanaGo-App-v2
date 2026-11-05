/**
 * DestinosInternacionales — Pantalla dedicada de paquetes internacionales de aliados
 * Diseño inspirado en la página de producto de WordPress/Divi de GuiaSAI:
 * galería de fotos, descripción organizada, tabla de precios, relacionados.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Globe2, Loader2, Calendar, MapPin, FileText, MessageCircle } from 'lucide-react';
import { AppRoute } from '../types';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface PaqueteIntl {
  id: string; nombre: string; categoria: string; duracion: string;
  origen: string; salidas: string; precioDesde: number;
  precioSencilla: number | null; precioNino: number | null;
  flyerDrive: string; imagen: string; notas: string;
  destacado?: boolean; moneda?: 'COP' | 'USD';
}

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const emojiPara = (categoria: string) =>
  categoria === 'Colombia' ? '🇨🇴' : categoria === 'América' ? '🌎' : categoria === 'Europa' ? '🇪🇺' :
  categoria === 'África' ? '🦁' : categoria === 'Asia' ? '🌏' : '🕌';

const fmtPrecio = (p: PaqueteIntl, n: number | null) => {
  if (!n) return null;
  const esCOP = p.moneda ? p.moneda === 'COP' : p.categoria === 'Colombia';
  return esCOP
    ? `$${Math.round(n).toLocaleString('es-CO')} COP`
    : `USD $${Math.round(n).toLocaleString('en-US')}`;
};

// "Próxima salida" de un paquete: primera fecha de la lista (separadas por |)
const primeraSalidaDe = (p: PaqueteIntl) => (p.salidas || '').split('|')[0].trim();

const wa = 'https://wa.me/573153836043';

const DestinosInternacionales: React.FC<Props> = ({ onBack }) => {
  const [paquetes, setPaquetes] = useState<PaqueteIntl[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('Todos');
  const [detalleId, setDetalleId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/paquetes-internacionales`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setPaquetes(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const detalle = paquetes.find(p => p.id === detalleId) || null;

  if (detalle) {
    return (
      <DetallePaquete
        paquete={detalle}
        relacionados={paquetes.filter(p => p.categoria === detalle.categoria && p.id !== detalle.id).slice(0, 4)}
        onBack={() => setDetalleId(null)}
        onVerOtro={(id) => setDetalleId(id)}
        onSalir={onBack}
      />
    );
  }

  const categorias = ['Todos', ...Array.from(new Set(paquetes.map(p => p.categoria).filter(Boolean)))];
  const enCategoria = categoria === 'Todos' ? paquetes : paquetes.filter(p => p.categoria === categoria);
  // El paquete marcado "Destacado" en Airtable se muestra aparte, arriba de la grilla
  const destacado = enCategoria.find(p => p.destacado) || null;
  const filtrados = enCategoria.filter(p => p !== destacado);
  const cuenta = (c: string) => (c === 'Todos' ? paquetes.length : paquetes.filter(p => p.categoria === c).length);

  return (
    <div className="min-h-screen bg-white">
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
                {c} <span className="opacity-70 font-medium ml-0.5">{cuenta(c)}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
        ) : !destacado && filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Globe2 size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">No hay paquetes disponibles en esta categoría todavía</p>
          </div>
        ) : (
          <>
            {destacado && (
              <div className="mb-8">
                <p className="text-[11px] font-bold tracking-[.14em] uppercase text-teal-700 mb-3">Salida destacada</p>
                <TarjetaDestacada p={destacado} onClick={() => setDetalleId(destacado.id)} />
              </div>
            )}
            {filtrados.length > 0 && (
              <>
                {destacado && (
                  <p className="text-[11px] font-bold tracking-[.14em] uppercase text-gray-500 mb-3">Todos los paquetes</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtrados.map(p => (
                    <TarjetaPaquete key={p.id} p={p} onClick={() => setDetalleId(p.id)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function TarjetaDestacada({ p, onClick }: { p: PaqueteIntl; onClick: () => void }) {
  const primeraImagen = (p.imagen || '').split(',')[0].trim();
  const proxima = primeraSalidaDe(p);
  // Con foto: velo azul marino sobre la imagen. Sin foto: degradado de marca.
  const fondo = primeraImagen
    ? `linear-gradient(115deg, rgba(0,61,92,.94) 0%, rgba(0,61,92,.82) 55%, rgba(0,61,92,.45) 100%), url('${primeraImagen}')`
    : 'linear-gradient(115deg, #003D5C 0%, #003D5C 55%, #2AABBB 130%)';
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-3xl overflow-hidden text-white shadow-sm hover:shadow-xl transition-shadow bg-cover bg-center"
      style={{ backgroundImage: fondo }}
    >
      <div className="p-6 md:p-8">
        {proxima && (
          <span className="inline-block bg-orange-100 text-orange-800 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
            Próxima salida · {proxima}
          </span>
        )}
        <h3 className="text-2xl md:text-4xl font-black mt-4 leading-tight">{p.nombre}</h3>
        <p className="text-sm md:text-base mt-2 opacity-90">
          {p.duracion}{p.origen ? ` · Desde ${p.origen}` : ''}
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-8">
          <div>
            <p className="text-xs opacity-85">Desde, por persona en doble</p>
            <p className="text-2xl md:text-3xl font-black">{fmtPrecio(p, p.precioDesde)}</p>
          </div>
          <span className="px-5 py-3 rounded-xl bg-white text-[#003D5C] text-sm font-bold">Ver detalle</span>
        </div>
      </div>
    </button>
  );
}

function TarjetaPaquete({ p, onClick }: { p: PaqueteIntl; onClick: () => void }) {
  const emoji = emojiPara(p.categoria);
  const primeraImagen = (p.imagen || '').split(',')[0].trim();
  const primeraSalida = (p.salidas || '').split('|')[0].trim();
  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      {primeraImagen ? (
        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${primeraImagen}')` }} />
      ) : (
        <div className="h-40 flex items-center justify-center text-5xl" style={{ background: 'linear-gradient(115deg,#003D5C,#2AABBB)' }}>{emoji}</div>
      )}
      <div className="p-4">
        <p className="text-[9px] font-bold tracking-wider uppercase text-teal-600">{p.categoria} · {p.duracion}</p>
        <h3 className="font-bold text-[15px] text-gray-800 mt-1 leading-snug">{p.nombre}</h3>
        <p className="text-[11px] text-slate-400 mt-1">Salida desde {p.origen || 'Colombia'}{primeraSalida ? ` · ${primeraSalida}` : ''}</p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Desde · por persona</p>
            <p className="font-black text-[#003D5C]">{fmtPrecio(p, p.precioDesde)}</p>
          </div>
          <span className="text-xs font-bold text-orange-500">Más info →</span>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════ PÁGINA DE DETALLE ═══════════════════════════

function DetallePaquete({ paquete: p, relacionados, onBack, onVerOtro, onSalir }: {
  paquete: PaqueteIntl; relacionados: PaqueteIntl[];
  onBack: () => void; onVerOtro: (id: string) => void; onSalir: () => void;
}) {
  const emoji = emojiPara(p.categoria);
  const imagenes = (p.imagen || '').split(',').map(u => u.trim()).filter(Boolean);
  const [fotoActiva, setFotoActiva] = useState(0);
  const salidas = (p.salidas || '').split('|').map(s => s.trim()).filter(Boolean);
  const waLink = `${wa}?text=${encodeURIComponent(`Hola GuiaSAI 🌍 quiero información del paquete: ${p.nombre}`)}`;

  useEffect(() => { setFotoActiva(0); window.scrollTo({ top: 0 }); }, [p.id]);

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0">
            <ArrowLeft size={20} className="text-gray-800" />
          </button>
          <p className="text-xs text-gray-400">
            <button onClick={onSalir} className="hover:text-teal-600">Otros Destinos</button> / {p.categoria}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {imagenes.length > 0 ? (
          <div>
            <div className="aspect-[27/16] rounded-2xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${imagenes[fotoActiva]}')` }} />
            {imagenes.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                {imagenes.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoActiva(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg bg-cover bg-center border-2 ${i === fotoActiva ? 'border-orange-500' : 'border-transparent opacity-70'}`}
                    style={{ backgroundImage: `url('${img}')` }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[27/16] rounded-2xl flex items-center justify-center text-7xl" style={{ background: 'linear-gradient(115deg,#003D5C,#2AABBB)' }}>{emoji}</div>
        )}

        <div className="mt-5">
          <p className="text-[11px] font-bold tracking-wider uppercase text-teal-600">{p.categoria} · {p.duracion}</p>
          <h1 className="text-2xl md:text-3xl font-black text-[#003D5C] mt-1 leading-snug">{p.nombre}</h1>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-gray-600">
            {p.origen && (
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> Sale desde <b>{p.origen}</b></span>
            )}
            {salidas.length > 0 && (
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {salidas[0]}</span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-5">
            <div>
              <h2 className="text-base font-black text-[#003D5C] mb-2">Descripción</h2>
              {p.notas ? <NotasFormateadas texto={p.notas} /> : (
                <p className="text-sm text-gray-500">Consulta con tu asesor para más detalles de este plan.</p>
              )}
            </div>

            {salidas.length > 1 && (
              <div>
                <h2 className="text-base font-black text-[#003D5C] mb-2 flex items-center gap-1.5"><Calendar size={16} /> Próximas salidas</h2>
                <div className="flex flex-wrap gap-2">
                  {salidas.map((s, i) => (
                    <span key={i} className="text-[12px] bg-teal-50 text-teal-700 font-semibold px-3 py-1.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:sticky md:top-24 md:self-start">
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-[#003D5C] px-4 py-3">
                <p className="text-white font-black text-sm">Información adicional</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-500">Doble</td>
                    <td className="px-4 py-2.5 text-right font-black text-[#003D5C]">{fmtPrecio(p, p.precioDesde) || '—'}</td>
                  </tr>
                  {p.precioSencilla ? (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-500">Sencilla</td>
                      <td className="px-4 py-2.5 text-right font-black text-[#003D5C]">{fmtPrecio(p, p.precioSencilla)}</td>
                    </tr>
                  ) : null}
                  {p.precioNino ? (
                    <tr>
                      <td className="px-4 py-2.5 text-gray-500">Niño</td>
                      <td className="px-4 py-2.5 text-right font-black text-[#003D5C]">{fmtPrecio(p, p.precioNino)}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 text-center py-2 border-t border-gray-100">Precios por persona</p>
            </div>

            <div className="flex flex-col gap-2 mt-3">
              {p.flyerDrive && (
                <a
                  href={p.flyerDrive}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600"
                >
                  <FileText size={16} /> Ver más
                </a>
              )}
              <a
                href={waLink}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600"
              >
                <MessageCircle size={16} /> Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>

        {relacionados.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-black text-[#003D5C] mb-4">Otros destinos de {p.categoria}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relacionados.map(r => (
                <TarjetaPaquete key={r.id} p={r} onClick={() => onVerOtro(r.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotasFormateadas({ texto }: { texto: string }) {
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l !== '');
  const bloques: { tipo: 'titulo' | 'item' | 'texto'; contenido: string }[] = lineas.map(l => {
    if (l.startsWith('## ')) return { tipo: 'titulo' as const, contenido: l.slice(3) };
    if (l.startsWith('- ')) return { tipo: 'item' as const, contenido: l.slice(2) };
    return { tipo: 'texto' as const, contenido: l };
  });

  const tieneTitulos = bloques.some(b => b.tipo === 'titulo');
  if (!tieneTitulos) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
        <p className="text-[12.5px] text-amber-900 leading-relaxed">{texto}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bloques.map((b, i) => {
        if (b.tipo === 'titulo') {
          return <p key={i} className="text-[12px] font-black uppercase tracking-wide text-teal-600 pt-2 first:pt-0">{b.contenido}</p>;
        }
        if (b.tipo === 'item') {
          return (
            <div key={i} className="flex items-start gap-2 -mt-2">
              <span className="text-teal-500 text-sm mt-0.5">•</span>
              <p className="text-[13.5px] text-gray-700 leading-snug flex-1">{b.contenido}</p>
            </div>
          );
        }
        return <p key={i} className="text-[13.5px] text-gray-700 leading-snug">{b.contenido}</p>;
      })}
    </div>
  );
}

export default DestinosInternacionales;
