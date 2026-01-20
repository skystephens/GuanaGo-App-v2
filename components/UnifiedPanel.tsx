import React from 'react';
import {
  ArrowLeft,
  Home,
  ShoppingCart,
  MapPin,
  Heart,
  Calendar,
  DollarSign,
  Users,
  Settings,
  BarChart3,
  CheckCircle,
  Database,
  Music,
  Package,
  Car,
  Search,
  LogOut,
  Plus,
  Eye,
  CreditCard,
  Shield,
  Layers,
  FileText,
  Zap,
  User,
  Store,
  ListChecks
} from 'lucide-react';
import { AppRoute, UserRole } from '../types';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: AppRoute;
  description?: string;
  badge?: string;
  color?: string;
}

interface UnifiedPanelProps {
  userRole: UserRole;
  onNavigate: (route: AppRoute) => void;
  onBack: () => void;
  isAuthenticated: boolean;
  onLogout?: () => void;
}

const UnifiedPanel: React.FC<UnifiedPanelProps> = ({
  userRole,
  onNavigate,
  onBack,
  isAuthenticated,
  onLogout,
}) => {
  // Opciones para TURISTA
  const touristMenu: MenuItem[] = [
    { id: 'home', label: 'Inicio', icon: <Home size={24} />, route: AppRoute.HOME, color: 'from-blue-500 to-blue-600' },
    { id: 'tours', label: 'Tours', icon: <Search size={24} />, route: AppRoute.TOUR_LIST, description: 'Explora tours disponibles', color: 'from-emerald-500 to-emerald-600' },
    { id: 'hotels', label: 'Alojamientos', icon: <MapPin size={24} />, route: AppRoute.HOTEL_LIST, description: 'Busca hoteles y posadas', color: 'from-orange-500 to-orange-600' },
    { id: 'taxi', label: 'Transporte', icon: <Car size={24} />, route: AppRoute.TAXI_LIST, description: 'Solicita un taxi', color: 'from-yellow-500 to-yellow-600' },
    { id: 'packages', label: 'Paquetes', icon: <Package size={24} />, route: AppRoute.PACKAGE_LIST, description: 'Ofertas especiales', color: 'from-purple-500 to-purple-600' },
    { id: 'marketplace', label: 'Marketplace', icon: <Store size={24} />, route: AppRoute.MARKETPLACE, description: 'Compras locales', color: 'from-pink-500 to-pink-600' },
    { id: 'map', label: 'Mapa Interactivo', icon: <MapPin size={24} />, route: AppRoute.INTERACTIVE_MAP, description: 'Descubre la isla', color: 'from-cyan-500 to-cyan-600' },
    { id: 'restaurants', label: 'Restaurantes', icon: <Heart size={24} />, route: AppRoute.RESTAURANT_MAP, description: 'Encuentra el mejor lugar para comer', color: 'from-red-500 to-red-600' },
    { id: 'itinerary', label: 'Mi Itinerario', icon: <Calendar size={24} />, route: AppRoute.MY_ITINERARY, description: 'Planifica tu viaje', color: 'from-indigo-500 to-indigo-600' },
    { id: 'wallet', label: 'Cartera', icon: <DollarSign size={24} />, route: AppRoute.WALLET, description: 'Gestiona tu dinero', color: 'from-green-500 to-green-600' },
    { id: 'profile', label: 'Mi Perfil', icon: <User size={24} />, route: AppRoute.PROFILE, description: 'Información personal', color: 'from-gray-500 to-gray-600' },
  ];

  // Opciones para SOCIO/ALIADO/OPERADOR
  const partnerMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={24} />, route: AppRoute.PARTNER_DASHBOARD, description: 'Resumen de tu negocio', color: 'from-blue-500 to-blue-600' },
    { id: 'operations', label: 'Traslados', icon: <Settings size={24} />, route: AppRoute.PARTNER_OPERATIONS, description: 'Gestiona traslados', color: 'from-emerald-500 to-emerald-600' },
    { id: 'services', label: 'Mis Servicios', icon: <Package size={24} />, route: AppRoute.PARTNER_MY_SERVICES, description: 'Tours y actividades', color: 'from-orange-500 to-orange-600' },
    { id: 'new-service', label: 'Crear Servicio', icon: <Plus size={24} />, route: AppRoute.PARTNER_CREATE_SERVICE, description: 'Nuevo tour o experiencia', color: 'from-purple-500 to-purple-600' },
    { id: 'accommodations', label: 'Alojamientos', icon: <MapPin size={24} />, route: AppRoute.PARTNER_ACCOMMODATIONS, description: 'Gestiona tus hoteles', color: 'from-cyan-500 to-cyan-600' },
    { id: 'reservations', label: 'Reservas', icon: <Calendar size={24} />, route: AppRoute.PARTNER_RESERVATIONS, description: 'Tus reservaciones', color: 'from-pink-500 to-pink-600' },
    { id: 'scanner', label: 'Check-in Scanner', icon: <Eye size={24} />, route: AppRoute.PARTNER_SCANNER, description: 'Valida asistencias', color: 'from-red-500 to-red-600' },
    { id: 'wallet', label: 'Cartera', icon: <CreditCard size={24} />, route: AppRoute.PARTNER_WALLET, description: 'Tus ganancias', color: 'from-green-500 to-green-600' },
  ];

  // Opciones para ARTISTA
  const artistMenu: MenuItem[] = [
    { id: 'artist-profile', label: 'Mi Perfil Artista', icon: <User size={24} />, route: AppRoute.PROFILE, description: 'Datos, bio y catálogo', color: 'from-purple-500 to-purple-600' },
    { id: 'artist-marketplace', label: 'Tienda de Obras', icon: <Store size={24} />, route: AppRoute.MARKETPLACE, description: 'Vender arte y merch', color: 'from-pink-500 to-pink-600' },
    { id: 'artist-new-product', label: 'Crear Producto/Show', icon: <Plus size={24} />, route: AppRoute.PARTNER_CREATE_SERVICE, description: 'Sube obra, show o taller', color: 'from-orange-500 to-orange-600' },
    { id: 'music-events', label: 'Caribbean Night', icon: <Music size={24} />, route: AppRoute.RIMM_CLUSTER, description: 'Eventos musicales', color: 'from-indigo-500 to-indigo-600' },
  ];

  // Opciones para SUPER ADMIN
  const adminMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={24} />, route: AppRoute.ADMIN_DASHBOARD, description: 'Panel de control', color: 'from-red-500 to-red-600' },
    { id: 'approvals', label: 'Aprobaciones', icon: <CheckCircle size={24} />, route: AppRoute.ADMIN_APPROVALS, description: 'Solicitudes pendientes', color: 'from-yellow-500 to-yellow-600', badge: '12' },
    { id: 'quotes', label: 'Cotizaciones', icon: <FileText size={24} />, route: AppRoute.ADMIN_QUOTES, description: 'Gestión de cotizaciones', color: 'from-emerald-500 to-emerald-600' },
    { id: 'reservations', label: 'Reservas', icon: <Calendar size={24} />, route: AppRoute.ADMIN_RESERVATIONS, description: 'Todas las reservaciones', color: 'from-blue-500 to-blue-600' },
    { id: 'users', label: 'Usuarios', icon: <Users size={24} />, route: AppRoute.ADMIN_USERS, description: 'Gestión de usuarios', color: 'from-purple-500 to-purple-600' },
    { id: 'services', label: 'Servicios', icon: <Package size={24} />, route: AppRoute.ADMIN_SERVICES, description: 'Tours y servicios', color: 'from-emerald-500 to-emerald-600' },
    { id: 'finance', label: 'Finanzas', icon: <DollarSign size={24} />, route: AppRoute.ADMIN_FINANCE, description: 'Reportes financieros', color: 'from-green-500 to-green-600' },
    { id: 'caribbean', label: 'Caribbean Night', icon: <Music size={24} />, route: AppRoute.ADMIN_CARIBBEAN, description: 'Gestión de eventos', color: 'from-pink-500 to-pink-600' },
    { id: 'artistas', label: 'Artistas', icon: <Zap size={24} />, route: AppRoute.ADMIN_ARTISTAS, description: 'Gestión de artistas', color: 'from-orange-500 to-orange-600' },
    { id: 'socios', label: 'Socios', icon: <Shield size={24} />, route: AppRoute.ADMIN_SOCIOS, description: 'Gestión de socios', color: 'from-cyan-500 to-cyan-600' },
    { id: 'structure', label: 'Backend', icon: <Layers size={24} />, route: AppRoute.ADMIN_STRUCTURE, description: 'Mapa de estructura', color: 'from-indigo-500 to-indigo-600' },
    { id: 'tasks', label: 'Tareas', icon: <ListChecks size={24} />, route: AppRoute.ADMIN_TASKS, description: 'Gestión de tareas', color: 'from-teal-500 to-teal-600' },
  ];

  // Seleccionar menú según rol
  let menuItems: MenuItem[] = touristMenu;
  let roleLabel = 'Turista';
  let roleColor = 'from-blue-500 to-blue-600';

  if (userRole === 'SuperAdmin') {
    menuItems = adminMenu;
    roleLabel = 'Super Admin';
    roleColor = 'from-red-500 to-red-600';
  } else if (['Socio', 'Aliado', 'Operador'].includes(userRole)) {
    menuItems = partnerMenu;
    roleLabel = userRole;
    roleColor = 'from-emerald-500 to-emerald-600';
  } else if (userRole === 'Artista') {
    menuItems = [...partnerMenu, ...artistMenu];
    roleLabel = 'Artista';
    roleColor = 'from-purple-500 to-purple-600';
  }

  const handleMenuClick = (route: AppRoute) => {
    onNavigate(route);
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-gray-950 to-gray-900 border-b border-gray-800 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-900 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-400" />
          </button>
          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${roleColor} text-white text-sm font-bold`}>
            {roleLabel}
          </div>
          {isAuthenticated && onLogout && (
            <button onClick={onLogout} className="p-2 hover:bg-gray-900 rounded-lg transition-colors" title="Cerrar sesión">
              <LogOut size={24} className="text-red-400" />
            </button>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-black mb-1">Mi Panel de Control</h1>
          <p className="text-sm text-gray-400">Acceso rápido a todas tus funcionalidades</p>
        </div>
      </header>

      {/* Grid de opciones */}
      <div className="px-6 pt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.route)}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.color} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              {/* Badge si existe */}
              {item.badge && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {item.badge}
                </div>
              )}

              {/* Contenido */}
              <div className="relative z-10 flex flex-col items-center text-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{item.label}</h3>
                  {item.description && (
                    <p className="text-[10px] text-white/70 mt-1">{item.description}</p>
                  )}
                </div>
              </div>

              {/* Efecto hover background */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Sección informativa */}
        <div className="mt-12 bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <FileText size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Panel Unificado</h3>
              <p className="text-sm text-gray-400">
                Accede a todas tus funcionalidades desde aquí. El panel se adapta automáticamente según tu rol y te muestra solo las opciones disponibles para ti.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPanel;
