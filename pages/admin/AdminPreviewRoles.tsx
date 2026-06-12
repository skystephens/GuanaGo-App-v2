import React, { useState } from 'react';
import {
  Eye, ArrowLeft, User, Store, Anchor, Mic, MapPin,
  Home, X, ExternalLink, Briefcase, CalendarCheck, BedDouble, Sailboat,
} from 'lucide-react';
import { AppRoute, UserRole } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
  onPreview: (role: UserRole, route?: AppRoute) => void;
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

// ── Barra de control reutilizable para los iframes ────────────────────────────
interface IframeBarProps {
  label: string;
  subLabel: string;
  barColor: string;
  url: string;
  onClose: () => void;
  children?: React.ReactNode;
}

const IframeBar: React.FC<IframeBarProps> = ({ label, subLabel, barColor, url, onClose, children }) => (
  <div className="min-h-screen bg-gray-950 text-white flex flex-col">
    <div
      className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5 backdrop-blur border-b"
      style={{ background: barColor, borderColor: `${barColor}88` }}
    >
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm font-bold text-white hover:opacity-80 transition-opacity"
      >
        <X size={16} /> Cerrar
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-white/70 truncate">{subLabel}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
      >
        <ExternalLink size={12} /> Abrir
      </a>
    </div>
    {children}
    <iframe
      key={url}
      src={url}
      className="flex-1 w-full border-0"
      style={{ minHeight: 'calc(100vh - 96px)' }}
      title={label}
    />
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────

const AdminPreviewRoles: React.FC<Props> = ({ onBack, onPreview }) => {
  // Dueño de alojamiento
  const [ownerPreview, setOwnerPreview]   = useState(false);
  const [ownerAlojId, setOwnerAlojId]     = useState('');

  // Agencia B2B (GuiaSAI)
  const [b2bPreview, setB2bPreview]       = useState(false);

  // Canal de reservas turista
  const [channelPreview, setChannelPreview] = useState(false);
  const [channelAlojId, setChannelAlojId]   = useState('');

  // ── URLs de los iframes ─────────────────────────────────────────────────────
  const ownerUrl = ownerAlojId.startsWith('rec')
    ? `/disponibilidad-propietario?id=${ownerAlojId}`
    : `/disponibilidad-propietario`;

  const channelUrl = channelAlojId.startsWith('rec')
    ? `/?alojId=${channelAlojId}`
    : `/`;

  // ── Vista: Dueño de alojamiento ─────────────────────────────────────────────
  if (ownerPreview) {
    return (
      <IframeBar
        label="Dueño de Alojamiento"
        subLabel={ownerAlojId.startsWith('rec') ? ownerAlojId : 'DEMO — sin ID real'}
        barColor="rgba(15,118,110,0.95)"
        url={ownerUrl}
        onClose={() => setOwnerPreview(false)}
      >
        <div className="px-4 py-2 bg-gray-900/80 border-b border-gray-800 flex items-center gap-2">
          <label className="text-xs text-gray-400 shrink-0">ID de alojamiento:</label>
          <input
            value={ownerAlojId}
            onChange={e => setOwnerAlojId(e.target.value)}
            placeholder="recXXXXXXXXXXXXXX  (vacío = modo demo)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-teal-500"
          />
        </div>
      </IframeBar>
    );
  }

  // ── Vista: Agencia B2B (GuiaSAI) ────────────────────────────────────────────
  if (b2bPreview) {
    return (
      <IframeBar
        label="Agencia B2B · GuiaSAI"
        subLabel="Portal de cotizaciones y reservas para agencias de viajes"
        barColor="rgba(79,70,229,0.95)"
        url="/agencias/"
        onClose={() => setB2bPreview(false)}
      />
    );
  }

  // ── Vista: Canal de Reservas (turista) ──────────────────────────────────────
  if (channelPreview) {
    return (
      <IframeBar
        label="Canal de Reservas GuanaGO"
        subLabel={channelAlojId.startsWith('rec') ? `Alojamiento ${channelAlojId}` : 'Vista turista — inicio de la app'}
        barColor="rgba(234,88,12,0.95)"
        url={channelUrl}
        onClose={() => setChannelPreview(false)}
      >
        <div className="px-4 py-2 bg-gray-900/80 border-b border-gray-800 flex items-center gap-2">
          <label className="text-xs text-gray-400 shrink-0">ID alojamiento:</label>
          <input
            value={channelAlojId}
            onChange={e => setChannelAlojId(e.target.value)}
            placeholder="recXXXXXXXXXXXXXX  (vacío = inicio)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
          />
          <span className="text-[10px] text-gray-600 shrink-0">Enter para recargar</span>
        </div>
      </IframeBar>
    );
  }

  // ── Vista: lista de roles ────────────────────────────────────────────────────
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
          Los 5 roles inferiores cambian la vista dentro de la app React (sin cerrar sesión).
          Las 3 tarjetas de canal abren vistas especiales en un iframe para no afectar tu sesión.
        </p>
      </div>

      {/* Sección: App GuanaGO — roles internos */}
      <p className="text-[10px] font-black text-gray-500 uppercase mb-2 mt-1">App GuanaGO — roles internos</p>
      <div className="grid gap-3 mb-5">
        {ROLES.map((card) => (
          <button
            key={card.role}
            onClick={() => onPreview(card.role, AppRoute.PROFILE)}
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

        {/* Dueño de Alojamiento (app interna) */}
        <button
          onClick={() => onPreview('Aliado' as UserRole, AppRoute.PARTNER_ACCOMMODATIONS)}
          className="w-full text-left rounded-2xl border bg-gradient-to-br from-teal-900 to-cyan-950
            border-teal-700 hover:border-teal-400
            p-4 flex items-center gap-4 transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
            <BedDouble size={28} className="text-teal-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">Dueño de Alojamiento</div>
            <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">
              Panel de gestión de alojamientos — ficha, fotos, disponibilidad, reservas
            </div>
          </div>
          <Eye size={16} className="text-gray-400 group-hover:text-white shrink-0 transition-colors" />
        </button>

        {/* Dueño de Servicio Turístico (app interna) */}
        <button
          onClick={() => onPreview('Aliado' as UserRole, AppRoute.PARTNER_MY_SERVICES)}
          className="w-full text-left rounded-2xl border bg-gradient-to-br from-amber-900 to-orange-950
            border-amber-700 hover:border-amber-400
            p-4 flex items-center gap-4 transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
            <Sailboat size={28} className="text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">Dueño de Servicio Turístico</div>
            <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">
              Mis servicios — tours, actividades, slots de disponibilidad y solicitudes de reserva
            </div>
          </div>
          <Eye size={16} className="text-gray-400 group-hover:text-white shrink-0 transition-colors" />
        </button>
      </div>

      {/* Sección: Canales externos — iframes */}
      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Canales externos — iframe</p>
      <div className="grid gap-3">

        {/* Agencia B2B / GuiaSAI */}
        <button
          onClick={() => setB2bPreview(true)}
          className="w-full text-left rounded-2xl border bg-gradient-to-br from-indigo-900 to-violet-950
            border-indigo-700 hover:border-indigo-400
            p-4 flex items-center gap-4 transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
            <Briefcase size={28} className="text-indigo-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">Agencia B2B · GuiaSAI</div>
            <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">
              Portal /agencias/ — cotizaciones, tarifas netas y reservas para agencias de viajes
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Eye size={16} className="text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-[9px] text-indigo-500 font-bold">iframe</span>
          </div>
        </button>

        {/* Canal de Reservas GuanaGO (turista) */}
        <button
          onClick={() => setChannelPreview(true)}
          className="w-full text-left rounded-2xl border bg-gradient-to-br from-orange-900 to-amber-950
            border-orange-700 hover:border-orange-400
            p-4 flex items-center gap-4 transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
            <CalendarCheck size={28} className="text-orange-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">Canal de Reservas GuanaGO</div>
            <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">
              Vista turista — cómo ve disponibilidad y solicita reserva por nuestro canal directo
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Eye size={16} className="text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-[9px] text-orange-500 font-bold">iframe</span>
          </div>
        </button>

        {/* Dueño de Alojamiento */}
        <button
          onClick={() => setOwnerPreview(true)}
          className="w-full text-left rounded-2xl border bg-gradient-to-br from-teal-900 to-cyan-950
            border-teal-700 hover:border-teal-400
            p-4 flex items-center gap-4 transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99] group"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
            <Home size={28} className="text-teal-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">Dueño de Alojamiento</div>
            <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">
              Calendario de disponibilidad — gestiona fechas, bloqueos y promos de su propiedad
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Eye size={16} className="text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-[9px] text-teal-500 font-bold">iframe</span>
          </div>
        </button>

      </div>
    </div>
  );
};

export default AdminPreviewRoles;
