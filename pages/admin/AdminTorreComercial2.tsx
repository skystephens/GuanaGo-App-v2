/**
 * AdminTorreComercial — GuiaSAI Tycoon v1
 * Fila de departamentos con métricas EN VIVO (auto-refresh 60s) + alerta de leads.
 * Cada departamento es una puerta a su módulo existente.
 * El pipeline CRM (kanban) se activa cuando existan los campos Etapa_CRM
 * en CotizacionesGG — mientras tanto muestra la guía de activación.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, RefreshCw, TrendingUp, Loader2 } from 'lucide-react';
import { AppRoute } from '../../types';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface Metricas {
  ventas: { leadsHoy: number; sinAtender: number; leadUrgente: { nombre: string; desde: string; monto: number } | null };
  finanzas: { ventasHoyCOP: number; ventasMesCOP: number; pagosMes: number };
  atencion: { chatsPendientes: number };
  operaciones: { toursHoy: number; vouchersPendientes: number };
  generadoEn: string;
}

interface Props { onBack: () => void; onNavigate: (r: AppRoute) => void }

const fmtM = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

const AdminTorreComercial: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [m, setM] = useState<Metricas | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = () => {
    fetch(`${API}/api/tycoon/metricas`)
      .then(r => r.json())
      .then(d => { if (d && d.ventas) setM(d); })
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60_000);
    return () => clearInterval(t);
  }, []);

  const totalAlertas = (m?.ventas.sinAtender || 0) + (m?.atencion.chatsPendientes || 0);

  const DEPTOS = m ? [
    {
      emoji: '🛎️', nombre: 'Ventas', ruta: AppRoute.ADMIN_QUOTES,
      kpi: `${m.ventas.leadsHoy}`, kpiLabel: 'leads hoy',
      sub: `${m.ventas.sinAtender} sin atender`,
      estado: m.ventas.sinAtender > 2 ? 'rojo' : m.ventas.sinAtender > 0 ? 'amarillo' : 'verde',
    },
    {
      emoji: '💰', nombre: 'Finanzas', ruta: AppRoute.ADMIN_QUOTES,
      kpi: fmtM(m.finanzas.ventasHoyCOP), kpiLabel: 'ventas hoy',
      sub: `${fmtM(m.finanzas.ventasMesCOP)} en el mes · ${m.finanzas.pagosMes} pagos`,
      estado: 'verde',
    },
    {
      emoji: '⚙️', nombre: 'Operaciones', ruta: AppRoute.ADMIN_VOUCHERS,
      kpi: `${m.operaciones.toursHoy}`, kpiLabel: 'tours hoy',
      sub: `${m.operaciones.vouchersPendientes} vouchers pendientes`,
      estado: m.operaciones.vouchersPendientes > 5 ? 'amarillo' : 'verde',
    },
    {
      emoji: '💬', nombre: 'Atención', ruta: AppRoute.ADMIN_CHATS_ATENCION,
      kpi: `${m.atencion.chatsPendientes}`, kpiLabel: 'chats pendientes',
      sub: 'chat web + WhatsApp',
      estado: m.atencion.chatsPendientes > 0 ? 'amarillo' : 'verde',
    },
    {
      emoji: '📣', nombre: 'Marketing', ruta: AppRoute.ADMIN_CAMPANAS,
      kpi: '→', kpiLabel: 'campañas',
      sub: 'Generador 80/20 · bandera DIMAR',
      estado: 'verde',
    },
    {
      emoji: '🖌️', nombre: 'Home & Marca', ruta: AppRoute.ADMIN_EDITOR_HOME,
      kpi: '→', kpiLabel: 'editor',
      sub: 'Portada · bandera del día',
      estado: 'verde',
    },
  ] : [];

  const COLOR: Record<string, string> = {
    verde: 'border-emerald-700/60',
    amarillo: 'border-yellow-600 ring-1 ring-yellow-600/30',
    rojo: 'border-red-600 ring-1 ring-red-600/40',
  };
  const DOT: Record<string, string> = { verde: 'bg-emerald-400', amarillo: 'bg-yellow-400', rojo: 'bg-red-500 animate-pulse' };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-base">🏝️ Torre Comercial Guía<span className="text-orange-500">SAI</span></h1>
            <p className="text-[10px] text-gray-500">Tu empresa en modo tycoon · métricas en vivo cada 60s</p>
          </div>
          <button onClick={() => { setCargando(true); cargar(); }} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <RefreshCw size={14} className={cargando ? 'animate-spin text-orange-400' : 'text-gray-400'} />
          </button>
          <div className="relative w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
            <Bell size={15} className="text-gray-300" />
            {totalAlertas > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[17px] h-[17px] rounded-full flex items-center justify-center animate-pulse">
                {totalAlertas}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">

        {/* Alerta de lead urgente */}
        {m?.ventas.leadUrgente && m.ventas.sinAtender > 0 && (
          <button
            onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
            className="w-full flex items-center gap-3 bg-orange-950/60 border border-orange-700 rounded-2xl px-4 py-3 text-left hover:border-orange-500 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-200">
                {m.ventas.sinAtender} cotizaci{m.ventas.sinAtender === 1 ? 'ón' : 'ones'} sin atender
              </p>
              <p className="text-[11px] text-orange-300/70">
                Más reciente: {m.ventas.leadUrgente.nombre}
                {m.ventas.leadUrgente.monto ? ` · $${Number(m.ventas.leadUrgente.monto).toLocaleString('es-CO')}` : ''} — tócala para atenderla
              </p>
            </div>
            <TrendingUp size={16} className="text-orange-400 shrink-0" />
          </button>
        )}

        {/* Fila de departamentos */}
        {cargando && !m ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-orange-500" size={26} /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DEPTOS.map(d => (
              <button
                key={d.nombre}
                onClick={() => onNavigate(d.ruta)}
                className={`bg-gray-900 border ${COLOR[d.estado]} rounded-2xl p-4 text-left hover:bg-gray-800/80 transition-colors`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{d.emoji}</span>
                  <span className={`w-2 h-2 rounded-full ${DOT[d.estado]}`} />
                </div>
                <p className="text-2xl font-black leading-none">{d.kpi}</p>
                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">{d.kpiLabel}</p>
                <p className="text-[11px] font-bold text-gray-300 mt-2">{d.nombre}</p>
                <p className="text-[9.5px] text-gray-500 leading-snug">{d.sub}</p>
              </button>
            ))}
          </div>
        )}

        {/* Pipeline CRM — pendiente de activación */}
        <div className="bg-gray-900/60 border border-dashed border-gray-700 rounded-2xl p-5">
          <p className="text-sm font-bold text-gray-300 mb-1">🚧 Pipeline CRM — listo para activar</p>
          <p className="text-[11.5px] text-gray-500 leading-relaxed">
            El tablero kanban (Nuevo → Contactado → Negociación → Pago enviado → Ganado) se enciende
            cuando existan estos campos en <b className="text-gray-400">CotizacionesGG</b>:{' '}
            <span className="text-teal-400">Etapa_CRM</span>, <span className="text-teal-400">Temperatura</span>,{' '}
            <span className="text-teal-400">Notas_CRM</span>, <span className="text-teal-400">Proximo_Seguimiento</span>,{' '}
            <span className="text-teal-400">Responsable</span>. Créalos en Airtable y pide a Claude construir el kanban.
          </p>
        </div>

        {m && (
          <p className="text-center text-[9px] text-gray-600">
            Actualizado {new Date(m.generadoEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · fuente: Airtable en vivo
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminTorreComercial;
