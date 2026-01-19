
import React from 'react';
import { Compass, CalendarDays, ShoppingCart, UserCircle, LayoutDashboard, QrCode, Wallet, Settings, PieChart, Map as MapIcon, Database, Trophy, Grid3x3, LogOut, FileText } from 'lucide-react';
import { AppRoute, UserRole } from '../types';
import { useCart } from '../context/CartContext';

interface NavigationProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  role: UserRole;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate, role, isAuthenticated, onLogout }) => {
  const { itemCount } = useCart();
  
  // MENU TURISTA: 5 Items
  const touristNavItemsAuth = [
    { route: AppRoute.UNIFIED_PANEL, icon: <Grid3x3 size={22} />, label: 'Panel' },
    { route: AppRoute.HOME, icon: <Compass size={22} />, label: 'Explora' },
    { route: AppRoute.INTERACTIVE_MAP, icon: <MapIcon size={22} />, label: 'Mapa' },
    { route: AppRoute.DYNAMIC_ITINERARY, icon: <CalendarDays size={22} />, label: 'Planifica' },
    { route: AppRoute.CHECKOUT, icon: <ShoppingCart size={22} />, label: 'Carrito' },
  ];

  // Versión para usuarios sin registro: restaurar botones (sin Panel)
  const touristNavItemsGuest = [
    { route: AppRoute.HOME, icon: <Compass size={22} />, label: 'Explora' },
    { route: AppRoute.INTERACTIVE_MAP, icon: <MapIcon size={22} />, label: 'Mapa' },
    { route: AppRoute.DYNAMIC_ITINERARY, icon: <CalendarDays size={22} />, label: 'Planifica' },
    { route: AppRoute.PROFILE, icon: <UserCircle size={22} />, label: 'Cuenta' },
  ];

  // MENU SOCIO/ALIADO: 5 Items
  const partnerNavItems = [
    { route: AppRoute.UNIFIED_PANEL, icon: <Grid3x3 size={22} />, label: 'Panel' },
    { route: AppRoute.PARTNER_DASHBOARD, icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { route: AppRoute.PARTNER_RESERVATIONS, icon: <CalendarDays size={22} />, label: 'Reservas' },
    { route: AppRoute.PARTNER_WALLET, icon: <Wallet size={22} />, label: 'Caja' },
    { route: AppRoute.PROFILE, icon: <UserCircle size={22} />, label: 'Perfil' },
  ];

  // MENU ADMIN: Panel, Dashboard, Aprobaciones, Reservas, Perfil (Cotizaciones solo en Dashboard y UnifiedPanel)
  const adminNavItems = [
    { route: AppRoute.UNIFIED_PANEL, icon: <Grid3x3 size={22} />, label: 'Panel' },
    { route: AppRoute.ADMIN_DASHBOARD, icon: <PieChart size={22} />, label: 'Dashboard' },
    { route: AppRoute.ADMIN_APPROVALS, icon: <UserCircle size={22} />, label: 'Aprobaciones' },
    { route: AppRoute.ADMIN_RESERVATIONS, icon: <CalendarDays size={22} />, label: 'Reservas' },
    { route: AppRoute.PROFILE, icon: <Settings size={22} />, label: 'Perfil' },
  ];

  // Determinar qué menú mostrar según el rol
  const isPartner = role === 'Socio' || role === 'Aliado' || role === 'Operador' || role === 'Artista';
  const isAdmin = role === 'SuperAdmin';
  const isLocal = role === 'Local';
  const isTourist = !isPartner && !isAdmin;

  let navItems = touristNavItemsAuth;
  if (isPartner) navItems = partnerNavItems;
  if (isAdmin) navItems = adminNavItems;
  if (isTourist && !isAuthenticated) navItems = touristNavItemsGuest;

  const isDark = isPartner || isAdmin;
  const activeLightClasses = isLocal ? 'text-yellow-600 md:bg-yellow-50' : 'text-emerald-600 md:bg-emerald-50';
  const indicatorLightClass = isLocal ? 'bg-yellow-600' : 'bg-emerald-600';

  return (
    <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 py-3 px-1 md:px-4 flex justify-around items-center z-50 
      w-full max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl
      border-t transition-all duration-300
      ${isDark ? 'bg-gray-900 border-gray-800 shadow-2xl' : 'bg-white border-gray-100 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] rounded-t-[32px] md:rounded-t-3xl'}`}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.route)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-all relative py-2 md:py-3 md:px-4 rounded-2xl flex-1 md:flex-none
              md:hover:bg-gray-100 md:dark:hover:bg-gray-800
              ${
              isActive 
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
            <span className={`text-[8px] md:text-xs font-black uppercase tracking-tighter md:tracking-normal md:normal-case md:font-semibold ${isActive ? 'opacity-100' : 'opacity-60 md:opacity-80'}`}>{item.label}</span>
            
            {isActive && (
              <div className={`absolute -bottom-1 w-1 h-1 rounded-full md:hidden ${isDark ? 'bg-emerald-400' : indicatorLightClass}`}></div>
            )}
          </button>
        );
      })}
      {/* Invitados: sin botón de Panel y sin botón extra de salir */}
    </div>
  );
};

export default Navigation;
