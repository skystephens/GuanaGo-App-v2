
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, CalendarDays, ShoppingCart, UserCircle, PieChart, Map as MapIcon, Settings, Trophy, Users, Grid3x3 } from 'lucide-react';
import { AppRoute, UserRole } from '../types';
import { useCart } from '../context/CartContext';

interface NavigationProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  role: UserRole;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate, role, isAuthenticated }) => {
  const { itemCount } = useCart();
  const { t } = useTranslation();

  // ── TURISTA autenticado: Inicio, Mapa, Mi viaje, Retos, Perfil ──────────────
  const touristNavAuth = [
    { route: AppRoute.HOME,            icon: <Compass size={22} />,      label: t('nav.home') },
    { route: AppRoute.INTERACTIVE_MAP, icon: <MapIcon size={22} />,      label: t('nav.map') },
    { route: AppRoute.MI_VIAJE,        icon: <CalendarDays size={22} />, label: t('nav.myTrip') },
    { route: AppRoute.RETOS,           icon: <Trophy size={22} />,       label: t('nav.challenges') },
    { route: AppRoute.PROFILE,         icon: <UserCircle size={22} />,   label: t('nav.profile') },
  ];

  // ── TURISTA anónimo: Inicio, Mapa, Tours, Taxi, Entrar ──────────────────────
  const touristNavGuest = [
    { route: AppRoute.HOME,            icon: <Compass size={22} />,      label: t('nav.home') },
    { route: AppRoute.INTERACTIVE_MAP, icon: <MapIcon size={22} />,      label: t('nav.map') },
    { route: AppRoute.TOUR_LIST,       icon: <Trophy size={22} />,       label: t('nav.tours') },
    { route: AppRoute.TAXI_DETAIL,     icon: <ShoppingCart size={22} />, label: t('nav.taxi') },
    { route: AppRoute.AUTH_GATE,       icon: <UserCircle size={22} />,   label: t('nav.login') },
  ];

  // ── RESIDENTE: Inicio, Mapa, Concursos, Embajador, Perfil ───────────────────
  const residenteNav = [
    { route: AppRoute.HOME,            icon: <Compass size={22} />,      label: t('nav.home') },
    { route: AppRoute.INTERACTIVE_MAP, icon: <MapIcon size={22} />,      label: t('nav.map') },
    { route: AppRoute.CONCURSOS,       icon: <Trophy size={22} />,       label: t('nav.contests') },
    { route: AppRoute.EMBAJADOR,       icon: <Users size={22} />,        label: t('nav.ambassador') },
    { route: AppRoute.PROFILE,         icon: <UserCircle size={22} />,   label: t('nav.profile') },
  ];

  // ── ADMIN / SUPER ADMIN ───────────────────────────────────────────────────────
  const adminNav = [
    { route: AppRoute.UNIFIED_PANEL,   icon: <Grid3x3 size={22} />,      label: 'Panel' },
    { route: AppRoute.ADMIN_DASHBOARD, icon: <PieChart size={22} />,     label: 'Dashboard' },
    { route: AppRoute.ADMIN_APPROVALS, icon: <UserCircle size={22} />,   label: 'Aprobaciones' },
    { route: AppRoute.ADMIN_RESERVATIONS, icon: <CalendarDays size={22} />, label: 'Reservas' },
    { route: AppRoute.PROFILE,         icon: <Settings size={22} />,     label: 'Perfil' },
  ];

  // ── Selección de menú según rol ───────────────────────────────────────────────
  const isPartner  = ['Socio', 'Aliado', 'Operador', 'Artista'].includes(role);
  const isAdmin    = role === 'SuperAdmin';
  const isLocal    = role === 'Local';
  // 'Local' es el rol asignado por el backend para residentes de la isla
  const isResidente = role === 'Residente' || role === 'Local';

  // Partners tienen su propio tab nav interno
  if (isPartner) return null;

  let navItems = touristNavGuest;
  if (isAdmin)    navItems = adminNav;
  else if (isResidente) navItems = residenteNav;
  else if (isAuthenticated) navItems = touristNavAuth;

  const isDark = isAdmin;
  const activeLightClasses   = isLocal ? 'text-yellow-600 md:bg-yellow-50' : 'text-emerald-600 md:bg-emerald-50';
  const indicatorLightClass  = isLocal ? 'bg-yellow-600' : 'bg-emerald-600';

  return (
    <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 py-3 px-1 md:px-4 flex justify-around items-center z-50
      w-full max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl
      border-t transition-all duration-300
      ${isDark
        ? 'bg-gray-900 border-gray-800 shadow-2xl'
        : 'bg-white border-gray-100 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] rounded-t-[32px] md:rounded-t-3xl'
      }`}
    >
      {navItems.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-all relative py-2 md:py-3 md:px-4 rounded-2xl flex-1 md:flex-none
              md:hover:bg-gray-100
              ${isActive
                ? (isDark ? 'text-emerald-400 md:bg-gray-800' : activeLightClasses)
                : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
              }`}
          >
            <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110 md:scale-100' : ''}`}>
              {item.icon}
              {item.route === AppRoute.CHECKOUT && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span className={`text-[8px] md:text-xs font-black uppercase tracking-tighter md:tracking-normal md:normal-case md:font-semibold ${isActive ? 'opacity-100' : 'opacity-60 md:opacity-80'}`}>
              {item.label}
            </span>
            {isActive && (
              <div className={`absolute -bottom-1 w-1 h-1 rounded-full md:hidden ${isDark ? 'bg-emerald-400' : indicatorLightClass}`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
