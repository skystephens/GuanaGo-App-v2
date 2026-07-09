/**
 * MisCotizaciones — Portal del cliente B2C
 * Permite al cliente ver todas sus cotizaciones ingresando su teléfono.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Phone, Search, Calendar, Users, DollarSign,
  FileText, Loader2, CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { AppRoute, Cotizacion, QuoteStatus, QUOTE_STATUS_CONFIG, DEFAULT_QUOTE_DISPLAY_CONFIG } from '../types';
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

const MisCotizaciones: React.FC<Props> = ({ onBack, onNavigate, initialTelefono = '' }) => {
  const [telefono, setTelefono] = useState(initialTelefono);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const buscar = async (tel?: string) => {
    const q = (tel ?? telefono).trim();
    if (q.length < 7) return;
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const result = await getCotizacionesByTelefono(q);
      setCotizaciones(result);
      setSearched(true);
    } catch {
      setError('Error al buscar cotizaciones. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-buscar si llegamos con teléfono pre-cargado (desde cotizador o URL ?miscot=tel)
  useEffect(() => {
    if (initialTelefono && initialTelefono.length >= 7) {
      buscar(initialTelefono);
    }
  }, []);

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
            <p className="text-xs text-emerald-100">GuiaSAI · San Andrés Islas</p>
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
              onClick={() => buscar()}
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
              const n = nights(c);
              const p = pax(c);

              return (
                <button
                  key={c.id}
                  onClick={() => onNavigate(AppRoute.PUBLIC_QUOTE, { cotId: c.id, config: DEFAULT_QUOTE_DISPLAY_CONFIG })}
                  className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all"
                >
                  <div className="p-4 flex items-start gap-3">
                    {/* Status color bar */}
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${
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
                          <Calendar size={13} className="text-emerald-500 shrink-0" />
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

                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MisCotizaciones;
