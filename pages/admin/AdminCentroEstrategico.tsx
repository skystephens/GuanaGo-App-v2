/**
 * AdminCentroEstrategico — Hub que agrupa las pantallas de análisis y planeación:
 * Tareas, las 3 Torres (Comercial, Copa, Control) y el Mapa Mental del negocio.
 */

import React from 'react';
import { ArrowLeft, ListChecks, Building2, Trophy, LayoutGrid, Brain, Network, FileText, Users, ChevronRight } from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const ITEMS = [
  {
    route: AppRoute.ADMIN_TASKS, icon: ListChecks, label: 'Tareas', color: 'from-lime-900/60 to-green-900/60',
    border: 'border-lime-800 hover:border-lime-500', iconColor: 'text-lime-400',
    sub: 'Pendientes del proyecto, con prioridad y estado',
  },
  {
    route: AppRoute.ADMIN_TORRE_COMERCIAL, icon: Building2, label: 'Torre Comercial', color: 'from-emerald-900/60 to-teal-900/60',
    border: 'border-emerald-800 hover:border-emerald-500', iconColor: 'text-emerald-400',
    sub: 'Pipeline de ventas — Nuevo → Contactado → Ganado',
  },
  {
    route: AppRoute.ADMIN_TORRE_COPA, icon: Trophy, label: 'Torre Copa de la Isla', color: 'from-orange-900/60 to-amber-900/60',
    border: 'border-orange-800 hover:border-orange-500', iconColor: 'text-orange-400',
    sub: 'P&L y cuentas por pagar del torneo',
  },
  {
    route: AppRoute.ADMIN_COPA_DELEGACIONES, icon: Users, label: 'Delegaciones Copa de la Isla', color: 'from-teal-900/60 to-emerald-900/60',
    border: 'border-teal-800 hover:border-teal-500', iconColor: 'text-teal-400',
    sub: 'Editar equipos y vincular sus cotizaciones al portal',
  },
  {
    route: AppRoute.ADMIN_TORRE_CONTROL, icon: LayoutGrid, label: 'Torre de Control', color: 'from-blue-900/60 to-indigo-900/60',
    border: 'border-blue-800 hover:border-blue-500', iconColor: 'text-blue-400',
    sub: 'Accesos rápidos a pagos, vouchers y operaciones',
  },
  {
    route: AppRoute.ADMIN_CANVAS_NEGOCIO, icon: Brain, label: 'Canvas del Negocio', color: 'from-purple-900/60 to-fuchsia-900/60',
    border: 'border-purple-800 hover:border-purple-500', iconColor: 'text-purple-400',
    sub: 'Propuesta de valor, servicios, aliados y más — con datos en vivo',
  },
  {
    route: AppRoute.ADMIN_MAPA_MENTAL, icon: Network, label: 'Mapa Mental (Proyectos)', color: 'from-sky-900/60 to-blue-900/60',
    border: 'border-sky-800 hover:border-sky-500', iconColor: 'text-sky-400',
    sub: 'Vista técnica — proyectos, tareas y arquitectura del sistema',
  },
  {
    route: AppRoute.ADMIN_DOCS, icon: FileText, label: 'Documentación', color: 'from-teal-900/60 to-cyan-900/60',
    border: 'border-teal-800 hover:border-teal-500', iconColor: 'text-teal-400',
    sub: 'Todos los .md del repo, leídos directo desde la app',
  },
];

export default function AdminCentroEstrategico({ onBack, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-bold text-lg">Centro Estratégico</h1>
          <p className="text-[11px] text-gray-500">Tareas, torres de control y visión general del negocio</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center gap-3 bg-gradient-to-r ${item.color} border ${item.border} rounded-2xl p-4 text-left transition-colors`}
            >
              <div className="w-11 h-11 rounded-xl bg-black/30 flex items-center justify-center shrink-0">
                <Icon size={20} className={item.iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm">{item.label}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
              </div>
              <ChevronRight size={18} className="text-gray-500 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
