/**
 * MisCotizaciones — Portal del cliente B2C
 * Permite al cliente ver todas sus cotizaciones ingresando su teléfono.
 */

import React, { useState } from 'react';
import {
  ArrowLeft, Phone, Search, Calendar, Users, DollarSign,
  FileText, Loader2, CheckCircle2, Clock, XCircle, AlertCircle,
  Anchor, Bed, Package as PackageIcon, ChevronRight,
} from 'lucide-react';
import { AppRoute, Cotizacion, QuoteStatus, QUOTE_STATUS_CONFIG } from '../types';
import { getCotizacionesByTelefono } from '../services/quotesService';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
  initialTelefono?: string;
}

function fmtCOP(n: number): string {
  if (!n || n <= 0) return 'Por confirmar';
  return '$' + n.toLocaleString('es-CO') + ' COP';
}

function fmtDate(d: string): string {
  if (!d) return '';
  try {
    const dt = d.includes('T') ? new Date(d) : new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  draft:     <Clock size={14} />,
  Draft:     <Clock size={14} />,
  enviada:   <CheckCircle2 size={14} />,
  Enviada:   <CheckCircle2 size={14} />,
  aceptada:  <CheckCircle2 size={14} />,
  Aceptada:  <CheckCircle2 size={14} />,
  rechazada: <XCircle size={14} />,
  Rechazada: <XCircle size={14} />,
  expirada:  <AlertCircle size={14} />,
};

const MisCotizaciones: React.FC<Props> = ({ onBack, initialTelefono = '' }) => {
  const [telefono, setTelefono] = useState(initialTelefono);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const buscar = async () => {
    if (telefono.trim().length < 7) return;
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const result = await getCotizacionesByTelefono(telefono.trim());
      setCotizaciones(result);
      setSearched(true);
    } catch {
      setError('Error al buscar cotizaciones. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') buscar();
  };

  const nights = (c: Cotizacion) => {
    if (!c.fechaInicio || !c.fechaFin) return 0;
    return Math.max(0, Math.round(
      (new Date(c.fechaFin).getTime() - new Date(c.fechaInicio).getTime()) / 86400000
    ));
  };

  const pax = (c: Cotizacion) => c.adultos + c.ninos + c.bebes;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="flex items-center gap-3 px-4 pt-4 pb-6">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-black">Mis Cotizaciones</h1>
            <p className="text-xs text-emerald-100">GuanaGO · San Andrés Islas</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-6">
          <p className="text-sm text-emerald-100 mb-3">
            Ingresa tu número de WhatsApp para ver tus cotizaciones
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-3 shadow-sm">
              <Phone size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                onKeyDown={handleKey}
                placeholder="+57 300 123 4567"
                className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 bg-transparent"
                autoFocus={!initialTelefono}
              />
            </div>
            <button
              onClick={buscar}
              disabled={loading || telefono.trim().length < 7}
              className="bg-white text-emerald-600 font-bold px-4 py-3 rounded-xl shadow-sm hover:bg-emerald-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pt-5 pb-20 max-w-lg mx-auto space-y-4">

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {searched && cotizaciones.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-700 mb-1">Sin cotizaciones</h3>
            <p className="text-sm text-gray-400">
              No encontramos cotizaciones para el número <strong>{telefono}</strong>.
              <br />Si acabas de cotizar, espera unos segundos y vuelve a buscar.
            </p>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-emerald-300" />
            </div>
            <p className="text-sm text-gray-400">
              Ingresa tu número de WhatsApp para ver el estado de tus cotizaciones
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="text-emerald-500 animate-spin" />
            <span className="text-sm text-gray-400">Buscando cotizaciones...</span>
          </div>
        )}

        {cotizaciones.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium">
              {cotizaciones.length} cotización{cotizaciones.length !== 1 ? 'es' : ''} encontrada{cotizaciones.length !== 1 ? 's' : ''}
            </p>

            {cotizaciones.map(c => {
              const statusCfg = QUOTE_STATUS_CONFIG[c.estado as keyof typeof QUOTE_STATUS_CONFIG];
              const isExp = expanded === c.id;
              const n = nights(c);
              const p = pax(c);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpanded(isExp ? null : c.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Status color bar */}
                      <div className={`w-1 self-stretch rounded-full ${
                        (c.estado as string).toLowerCase() === 'aceptada' ? 'bg-emerald-400' :
                        (c.estado as string).toLowerCase() === 'enviada' ? 'bg-blue-400' :
                        (c.estado as string).toLowerCase() === 'rechazada' ? 'bg-red-400' :
                        'bg-gray-300'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-400">{fmtDate(c.fechaCreacion)}</span>
                          {statusCfg && (
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color} ${statusCfg.textColor}`}>
                              {STATUS_ICON[c.estado]}
                              {statusCfg.label}
                            </span>
                          )}
                        </div>

                        {c.fechaInicio && c.fechaFin && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Calendar size={13} className="text-emerald-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">
                              {fmtDate(c.fechaInicio)} → {fmtDate(c.fechaFin)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-1.5">
                          {p > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users size={12} />
                              {p} {p === 1 ? 'persona' : 'personas'}
                              {n > 0 && ` · ${n} ${n === 1 ? 'noche' : 'noches'}`}
                            </div>
                          )}
                          {c.precioTotal > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <DollarSign size={12} />
                              {fmtCOP(c.precioTotal)}
                            </div>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`text-gray-300 flex-shrink-0 transition-transform duration-200 ${isExp ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExp && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-4">

                      {/* Items */}
                      {c.items && c.items.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Servicios incluidos</p>
                          {c.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {item.servicioTipo === 'hotel' ? <Bed size={13} className="text-blue-400" /> :
                                 item.servicioTipo === 'package' ? <PackageIcon size={13} className="text-purple-400" /> :
                                 <Anchor size={13} className="text-emerald-500" />}
                                <span className="text-gray-700">{item.servicioNombre}</span>
                              </div>
                              {item.subtotal > 0 && (
                                <span className="text-gray-500 text-xs font-medium">{fmtCOP(item.subtotal)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {c.notasInternas && (
                        <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 italic">
                          "{c.notasInternas}"
                        </div>
                      )}

                      {/* Total */}
                      {c.precioTotal > 0 && (
                        <div className="bg-emerald-50 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-sm text-emerald-700 font-medium">Total estimado</span>
                          <span className="text-base font-black text-emerald-700">{fmtCOP(c.precioTotal)}</span>
                        </div>
                      )}

                      {/* CTA */}
                      <a
                        href={`https://wa.me/573001234567?text=${encodeURIComponent(`Hola! Quiero consultar mi cotización de GuanaGO. Mi número: ${telefono}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#1da851] transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.04.514 3.963 1.415 5.642L0 24l6.545-1.386A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.36-.214-3.727.979.995-3.633-.234-.374A9.818 9.818 0 1112 21.818z"/>
                        </svg>
                        Hablar con un asesor
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MisCotizaciones;
