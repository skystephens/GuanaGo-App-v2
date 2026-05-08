import React from 'react';
import { Eye, ArrowLeft, User, Store, Anchor, Mic, MapPin } from 'lucide-react';
import { AppRoute, UserRole } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
  onPreview: (role: UserRole) => void;
}

interface RoleCard {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  route: AppRoute;
}

const ROLES: RoleCard[] = [
  {
    role: 'Turista',
    label: 'Turista',
    description: 'Vista del visitante — Home, tours, hoteles, mapa, carrito, chatbot',
    icon: <MapPin size={28} className="text-sky-300" />,
    gradient: 'from-sky-900 to-blue-950',
    border: 'border-sky-700 hover:border-sky-400',
    route: AppRoute.HOME,
  },
  {
    role: 'Aliado',
    label: 'Aliado / Socio',
    description: 'Panel de negocio local — perfil, reservas, servicios, comisiones',
    icon: <Store size={28} className="text-emerald-300" />,
    gradient: 'from-emerald-900 to-teal-950',
    border: 'border-emerald-700 hover:border-emerald-400',
    route: AppRoute.PROFILE,
  },
  {
    role: 'Operador',
    label: 'Operador',
    description: 'Dashboard operativo — tour ops, scanner QR, operaciones en campo',
    icon: <Anchor size={28} className="text-orange-300" />,
    gradient: 'from-orange-900 to-amber-950',
    border: 'border-orange-700 hover:border-orange-400',
    route: AppRoute.PROFILE,
  },
  {
    role: 'Artista',
    label: 'Artista',
    description: 'Portal Caribbean Night — perfil artístico, shows, contrataciones',
    icon: <Mic size={28} className="text-purple-300" />,
    gradient: 'from-purple-900 to-violet-950',
    border: 'border-purple-700 hover:border-purple-400',
    route: AppRoute.PROFILE,
  },
  {
    role: 'Local',
    label: 'Residente Local',
    description: 'Vista de raizal / residente — descuentos locales, servicios comunitarios',
    icon: <User size={28} className="text-rose-300" />,
    gradient: 'from-rose-900 to-pink-950',
    border: 'border-rose-700 hover:border-rose-400',
    route: AppRoute.HOME,
  },
];

const AdminPreviewRoles: React.FC<Props> = ({ onBack, onPreview }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-indigo-400" />
            <h1 className="text-lg font-bold text-white">Vista Previa por Rol</h1>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Navega la app como si fueras otro usuario — sin cerrar sesión
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-5 rounded-xl border border-indigo-800 bg-indigo-950/50 p-3 flex items-start gap-3">
        <Eye size={16} className="text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-300 leading-relaxed">
          Al activar una vista previa verás la app exactamente como la ve ese usuario.
          Una barra flotante en la parte inferior te permitirá volver al panel de SuperAdmin
          en cualquier momento.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid gap-3">
        {ROLES.map((card) => (
          <button
            key={card.role}
            onClick={() => onPreview(card.role)}
            className={`w-full text-left rounded-2xl border bg-gradient-to-br ${card.gradient} ${card.border}
              p-4 flex items-center gap-4 transition-all duration-200
              hover:scale-[1.01] active:scale-[0.99] group`}
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm">{card.label}</div>
              <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">{card.description}</div>
            </div>
            <Eye size={16} className="text-gray-400 group-hover:text-white shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminPreviewRoles;
