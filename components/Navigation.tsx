
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Compass, CalendarDays, UserCircle, PieChart, Map as MapIcon,
  Settings, Trophy, Users, Grid3x3,
  LayoutGrid, Car, Package, BedDouble, Binoculars, FileText,
} from 'lucide-react';
import { AppRoute, UserRole } from '../types';
import { useCart } from '../context/CartContext';

interface NavigationProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  role: UserRole;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

// Rutas que pertenecen al menú "Servicios"
const SERVICES_ROUTES = new Set([
  AppRoute.TOUR_LIST,
  AppRoute.HOTEL_LIST,
  AppRoute.PACKAGE_LIST,
  AppRoute.TAXI_DETAIL,
]);

const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate, role, isAuthenticated }) => {
  const { itemCount } = useCart();
  const { t } = useTranslation();
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  // Cerrar popup al hacer click fuera
  useEffect(() => {
    if (!showServicesMenu) return;
    const handler = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setShowServicesMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showServicesMenu]);

  // Navegar a una subruta del menú Servicios
  const goToService = (route: AppRoute) => {
    setShowServicesMenu(false);
    onNavigate(route);
  };

  // ── Ítems del submenú Servicios ─────────────────────────────────────────────
  const serviceSubItems = [
    {
      route: AppRoute.PACKAGE_LIST,
      icon: <Package size={20} />,
      label: t('nav.packages'),
      color: 'text-purple-600',
      bg: 'bg-purple-50 hover:bg-purple-100',
      border: 'border-purple-100',
    },
    {
      route: AppRoute.HOTEL_LIST,
      icon: <BedDouble size={20} />,
      label: t('nav.accommodations'),
      color: 'text-blue-600',
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-100',
    },
    {
      route: AppRoute.TOUR_LIST,
      icon: <Binoculars size={20} />,
      label: t('nav.tours'),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      border: 'border-emerald-100',
    },
    {
      route: AppRoute.TAXI_DETAIL,
      icon: <Car size={20} />,
      label: t('nav.taxi'),
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      border: 'border-yellow-100',
    },
  ];

  // ── TURISTA autenticado: Inicio, Mapa, Cotizaciones, Mi viaje, Perfil ────────
  const touristNavAuth = [
    { route: AppRoute.HOME,              icon: <Compass size={22} />,      label: t('nav.home') },
    { route: AppRoute.INTERACTIVE_MAP,   icon: <MapIcon size={22} />,      label: t('nav.map') },
    { route: AppRoute.MIS_COTIZACIONES,  icon: <FileText size={22} />,     label: 'Cotizaciones' },
    { route: AppRoute.MI_VIAJE,          icon: <CalendarDays size={22} />, label: t('nav.myTrip') },
    { route: AppRoute.PROFILE,           icon: <UserCircle size={22} />,   label: t('nav.profile') },
  ];

  // ── TURISTA anónimo: Inicio, Mapa, Cotizaciones, Servicios ▾, Entrar ────────
  const touristNavGuest = [
    { route: AppRoute.HOME,              icon: <Compass size={22} />,      label: t('nav.home'),     special: false },
    { route: AppRoute.INTERACTIVE_MAP,   icon: <MapIcon size={22} />,      label: t('nav.map'),      special: false },
    { route: AppRoute.MIS_COTIZACIONES,  icon: <FileText size={22} />,     label: 'Cotizaciones',    special: false },
    { route: 'SERVICES' as AppRoute,     icon: <LayoutGrid size={22} />,   label: t('nav.services'), special: true  },
    { route: AppRoute.AUTH_GATE,         icon: <UserCircle size={22} />,   label: t('nav.login'),    special: false },
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
    { route: AppRoute.UNIFIED_PANEL,      icon: <Grid3x3 size={22} />,      label: 'Panel' },
    { route: AppRoute.ADMIN_DASHBOARD,    icon: <PieChart size={22} />,     label: 'Dashboard' },
    { route: AppRoute.ADMIN_APPROVALS,    icon: <UserCircle size={22} />,   label: 'Aprobaciones' },
    { route: AppRoute.ADMIN_RESERVATIONS, icon: <CalendarDays size={22} />, label: 'Reservas' },
    { route: AppRoute.PROFILE,            icon: <Settings size={22} />,     label: 'Perfil' },
  ];

  // ── Selección de menú según rol ───────────────────────────────────────────────
  const isPartner   = ['Socio', 'Aliado', 'Operador', 'Artista'].includes(role);
  const isAdmin     = role === 'SuperAdmin';
  const isResidente = role === 'Residente' || role === 'Local';

  if (isPartner) return null;

  let navItems: { route: AppRoute | string; icon: React.ReactNode; label: string; special?: boolean }[] = touristNavGuest;
  if (isAdmin)         navItems = adminNav;
  else if (isResidente) navItems = residenteNav;
  else if (isAuthenticated) navItems = touristNavAuth;

  const isDark = isAdmin;
  const isLocal = role === 'Local';
  const activeLightClasses  = isLocal ? 'text-yellow-600 md:bg-yellow-50' : 'text-emerald-600 md:bg-emerald-50';
  const indicatorLightClass = isLocal ? 'bg-yellow-600' : 'bg-emerald-600';

  return (
    <div
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 py-3 px-1 md:px-4 flex justify-around items-center z-50
        w-full max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl
        border-t transition-all duration-300
        ${isDark
          ? 'bg-gray-900 border-gray-800 shadow-2xl'
          : 'bg-white border-gray-100 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] rounded-t-[32px] md:rounded-t-3xl'
        }`}
    >
      {navItems.map((item) => {
        // ── Botón especial "Servicios" con popup ──────────────────────────────
        if (item.special) {
          const isServicesActive = SERVICES_ROUTES.has(currentRoute) || showServicesMenu;
          return (
            <div key="services" ref={servicesRef} className="relative flex-1 md:flex-none flex justify-center">
              {/* Popup del submenú */}
              {showServicesMenu && (
                <div
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50
                    bg-white rounded-2xl shadow-2xl border border-gray-100 p-2
                    grid grid-cols-2 gap-2 w-56
                    animate-fade-in"
                  style={{ animation: 'fadeSlideUp 0.18s ease-out' }}
                >
                  {/* Título */}
                  <div className="col-span-2 px-1 pb-1 border-b border-gray-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {t('nav.services')}
                    </span>
                  </div>

                  {serviceSubItems.map((sub) => {
                    const isSubActive = currentRoute === sub.route;
                    return (
                      <button
                        key={sub.route}
                        onClick={() => goToService(sub.route)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all
                          ${isSubActive
                            ? `${sub.bg} ${sub.border} ring-2 ring-offset-0 ring-current ${sub.color}`
                            : `${sub.bg} ${sub.border} ${sub.color}`
                          }`}
                      >
                        {item.icon && React.cloneElement(sub.icon as React.ReactElement, {})}
                        <span className="text-[10px] font-bold leading-none">{sub.label}</span>
                      </button>
                    );
                  })}

                  {/* Pico decorativo apuntando hacia abajo */}
                  <div className="col-span-2 flex justify-center -mb-4">
                    <div className="w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 -translate-y-1.5" />
                  </div>
                </div>
              )}

              {/* Botón de la barra */}
              <button
                onClick={() => setShowServicesMenu(prev => !prev)}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-all relative py-2 md:py-3 md:px-4 rounded-2xl w-full md:w-auto
                  md:hover:bg-gray-100
                  ${isServicesActive
                    ? activeLightClasses
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <div className={`relative transition-transform duration-300 ${isServicesActive ? 'scale-110 md:scale-100' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[8px] md:text-xs font-black uppercase tracking-tighter md:tracking-normal md:normal-case md:font-semibold
                  ${isServicesActive ? 'opacity-100' : 'opacity-60 md:opacity-80'}`}>
                  {item.label}
                </span>
                {isServicesActive && (
                  <div className={`absolute -bottom-1 w-1 h-1 rounded-full md:hidden ${indicatorLightClass}`} />
                )}
              </button>
            </div>
          );
        }

        // ── Botón estándar ────────────────────────────────────────────────────
        const isActive = currentRoute === item.route;
        return (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route as AppRoute)}
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

      {/* Keyframe de animación del popup */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Navigation;
