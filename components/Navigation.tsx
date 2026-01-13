
import React from 'react';
import { Compass, CalendarDays, ShoppingCart, UserCircle, LayoutDashboard, QrCode, Wallet, Settings, PieChart, Map as MapIcon } from 'lucide-react';
import { AppRoute, UserRole } from '../types';
import { useCart } from '../context/CartContext';

interface NavigationProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  role: UserRole;
  isAuthenticated?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate, role, isAuthenticated }) => {
  const { itemCount } = useCart();
  
  // MENU TURISTA ACTUALIZADO: 5 Items
  const touristNavItems = [
    { route: AppRoute.HOME, icon: <Compass size={22} />, label: 'Explora' },
    { route: AppRoute.INTERACTIVE_MAP, icon: <MapIcon size={22} />, label: 'Mapa' },
    { route: AppRoute.DYNAMIC_ITINERARY, icon: <CalendarDays size={22} />, label: 'Planifica' },
    { route: AppRoute.CHECKOUT, icon: <ShoppingCart size={22} />, label: 'Carrito' },
    { route: AppRoute.PROFILE, icon: <UserCircle size={22} />, label: 'Cuenta' },
  ];

  const partnerNavItems = [
    { route: AppRoute.PARTNER_DASHBOARD, icon: <LayoutDashboard size={22} />, label: 'Panel' },
    { route: AppRoute.PARTNER_RESERVATIONS, icon: <CalendarDays size={22} />, label: 'Reservas' },
    { route: AppRoute.PARTNER_OPERATIONS, icon: <QrCode size={22} />, label: 'Canje' },
    { route: AppRoute.PARTNER_WALLET, icon: <Wallet size={22} />, label: 'Caja' },
    { route: AppRoute.PROFILE, icon: <Settings size={22} />, label: 'Perfil' }, 
  ];

  const adminNavItems = [
    { route: AppRoute.ADMIN_DASHBOARD, icon: <PieChart size={22} />, label: 'Panel' },
    { route: AppRoute.ADMIN_SERVICES, icon: <Settings size={22} />, label: 'Gestión' },
    { route: AppRoute.ADMIN_FINANCE, icon: <Wallet size={22} />, label: 'Finanzas' },
    { route: AppRoute.ADMIN_USERS, icon: <UserCircle size={22} />, label: 'Socios' },
    { route: AppRoute.PROFILE, icon: <Settings size={22} />, label: 'Perfil' },
  ];

  let navItems = touristNavItems;
  if (role === 'partner') navItems = partnerNavItems;
  if (role === 'admin') navItems = adminNavItems;

  const isDark = role === 'partner' || role === 'admin';

  return (
    <div className={`fixed bottom-0 left-0 right-0 py-3 px-1 flex justify-around items-center z-50 max-w-md mx-auto w-full border-t transition-all duration-300
      ${isDark ? 'bg-gray-900 border-gray-800 shadow-2xl' : 'bg-white border-gray-100 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] rounded-t-[32px]'}`}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.route)}
            className={`flex flex-col items-center gap-1 transition-all relative py-2 rounded-2xl flex-1 ${
              isActive 
                ? (isDark ? 'text-emerald-400' : 'text-emerald-600') 
                : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
            }`}
          >
            <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
              {item.icon}
              {item.route === AppRoute.CHECKOUT && itemCount > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
                    {itemCount}
                 </span>
              )}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            
            {isActive && (
              <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`}></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
