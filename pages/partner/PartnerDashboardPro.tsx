import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  User,
  Hotel,
  UtensilsCrossed,
  LogOut,
  ChevronDown,
  Home,
  Settings,
  BarChart3,
  Plane,
  Car,
} from 'lucide-react';
import { AppRoute } from '../../types';
import PartnerProfile from './PartnerProfile';
import AccommodationPanel from './AccommodationPanel';
import RestaurantPanel from './RestaurantPanel';
import ToursPanel from './ToursPanel';
import TransfersPanel from './TransfersPanel';

type BusinessType = 'accommodation' | 'restaurant' | 'tours' | 'transfers' | null;
type MenuSection = 'dashboard' | 'profile' | 'accommodation' | 'restaurant' | 'tours' | 'transfers' | null;

interface BusinessUnits {
  accommodation: boolean;
  restaurant: boolean;
  tours: boolean;
  transfers: boolean;
}

interface PartnerData {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  category: BusinessType;
  phone?: string;
  address?: string;
  description?: string;
  businessUnits?: BusinessUnits;
}

interface PartnerDashboardProProps {
  onNavigate?: (route: AppRoute) => void;
  onLogout?: () => void;
}

const PartnerDashboardPro: React.FC<PartnerDashboardProProps> = ({ onNavigate, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<MenuSection>('dashboard');
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del partner desde localStorage
  useEffect(() => {
    const loadPartnerData = async () => {
      try {
        const saved = localStorage.getItem('partner_data');
        if (saved) {
          const data = JSON.parse(saved);
          // Normalizar category a accommodation, restaurant, tours, transfers
          const category = data.category?.toLowerCase() === 'alojamiento' 
            ? 'accommodation'
            : data.category?.toLowerCase() === 'restaurante'
            ? 'restaurant'
            : data.category?.toLowerCase() === 'tours'
            ? 'tours'
            : data.category?.toLowerCase() === 'transfers'
            ? 'transfers'
            : data.category ?? null;

          const units: BusinessUnits = {
            accommodation: data.businessUnits?.accommodation ?? category === 'accommodation',
            restaurant: data.businessUnits?.restaurant ?? category === 'restaurant',
            tours: data.businessUnits?.tours ?? category === 'tours',
            transfers: data.businessUnits?.transfers ?? category === 'transfers',
          };

          setPartnerData({
            ...data,
            category,
            businessUnits: units,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading partner data:', error);
        setLoading(false);
      }
    };
    loadPartnerData();
  }, []);

  // Ajustar menú activo cuando cambian las unidades
  useEffect(() => {
    if (!partnerData) return;
    const hasAccommodation = partnerData.businessUnits?.accommodation;
    const hasRestaurant = partnerData.businessUnits?.restaurant;
    const hasTours = partnerData.businessUnits?.tours;
    const hasTransfers = partnerData.businessUnits?.transfers;

    if (activeMenu === 'accommodation' && !hasAccommodation) {
      setActiveMenu(hasRestaurant ? 'restaurant' : hasTours ? 'tours' : hasTransfers ? 'transfers' : 'dashboard');
    }
    if (activeMenu === 'restaurant' && !hasRestaurant) {
      setActiveMenu(hasAccommodation ? 'accommodation' : hasTours ? 'tours' : hasTransfers ? 'transfers' : 'dashboard');
    }
    if (activeMenu === 'tours' && !hasTours) {
      setActiveMenu(hasAccommodation ? 'accommodation' : hasRestaurant ? 'restaurant' : hasTransfers ? 'transfers' : 'dashboard');
    }
    if (activeMenu === 'transfers' && !hasTransfers) {
      setActiveMenu(hasAccommodation ? 'accommodation' : hasRestaurant ? 'restaurant' : hasTours ? 'tours' : 'dashboard');
    }
  }, [partnerData, activeMenu]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (!partnerData) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">No se encontraron datos del socio</p>
          <button
            onClick={() => onNavigate?.(AppRoute.HOME)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const hasAccommodation = !!partnerData.businessUnits?.accommodation;
  const hasRestaurant = !!partnerData.businessUnits?.restaurant;
  const hasTours = !!partnerData.businessUnits?.tours;
  const hasTransfers = !!partnerData.businessUnits?.transfers;
  
  const getBusinessLabel = () => {
    const parts = [];
    if (hasAccommodation) parts.push('🏨 Alojamiento');
    if (hasRestaurant) parts.push('🍽️ Restaurante');
    if (hasTours) parts.push('✈️ Tours');
    if (hasTransfers) parts.push('🚗 Traslados');
    return parts.length > 0 ? parts.join(' + ') : 'Sin unidades activas';
  };
  
  const businessLabel = getBusinessLabel();

  const currentBusiness: BusinessType =
    activeMenu === 'accommodation'
      ? 'accommodation'
      : activeMenu === 'restaurant'
      ? 'restaurant'
      : hasAccommodation
      ? 'accommodation'
      : hasRestaurant
      ? 'restaurant'
      : null;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h2 className="font-black text-emerald-400">GuiaSAI</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Dashboard */}
          <button
            onClick={() => setActiveMenu('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'dashboard'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            title="Dashboard"
          >
            <BarChart3 size={24} />
            {sidebarOpen && <span className="font-semibold">Dashboard</span>}
          </button>

          {/* Negocio: Alojamientos */}
          {hasAccommodation && (
            <button
              onClick={() => setActiveMenu('accommodation')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'accommodation'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
              title="Alojamientos"
            >
              <Hotel size={24} />
              {sidebarOpen && <span className="font-semibold">Alojamientos</span>}
            </button>
          )}

          {/* Negocio: Restaurantes */}
          {hasRestaurant && (
            <button
              onClick={() => setActiveMenu('restaurant')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'restaurant'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
              title="Restaurantes"
            >
              <UtensilsCrossed size={24} />
              {sidebarOpen && <span className="font-semibold">Restaurantes</span>}
            </button>
          )}

          {/* Negocio: Tours */}
          {hasTours && (
            <button
              onClick={() => setActiveMenu('tours')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'tours'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
              title="Tours"
            >
              <Plane size={24} />
              {sidebarOpen && <span className="font-semibold">Tours</span>}
            </button>
          )}

          {/* Negocio: Traslados */}
          {hasTransfers && (
            <button
              onClick={() => setActiveMenu('transfers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'transfers'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
              title="Traslados"
            >
              <Car size={24} />
              {sidebarOpen && <span className="font-semibold">Traslados</span>}
            </button>
          )}

          {/* Mensaje si no hay unidades activas */}
          {!hasAccommodation && !hasRestaurant && !hasTours && !hasTransfers && (
            <div className="p-3 border border-gray-700 rounded-lg text-xs text-gray-400">
              Activa unidades en "Mi Perfil" para gestionar tu negocio.
            </div>
          )}

          {/* Perfil */}
          <button
            onClick={() => setActiveMenu('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'profile'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            title="Mi Perfil"
          >
            <User size={24} />
            {sidebarOpen && <span className="font-semibold">Mi Perfil</span>}
          </button>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              localStorage.removeItem('partner_token');
              localStorage.removeItem('partner_data');
              onLogout?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-600/20 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={24} />
            {sidebarOpen && <span className="font-semibold">Cerrar sesión</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-emerald-400">
                {partnerData.businessName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {businessLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{partnerData.contactName}</p>
              <p className="text-gray-400 text-sm">{partnerData.email}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeMenu === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                <div className="text-blue-400 text-sm font-semibold mb-2">Total Ingresos</div>
                <div className="text-3xl font-black text-white">$45,500</div>
                <div className="text-blue-300 text-xs mt-2">+12.5% este mes</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                <div className="text-green-400 text-sm font-semibold mb-2">
                  {currentBusiness === 'accommodation' ? 'Habitaciones' : currentBusiness === 'restaurant' ? 'Platos' : 'Ítems'}
                </div>
                <div className="text-3xl font-black text-white">23</div>
                <div className="text-green-300 text-xs mt-2">Activos</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                <div className="text-purple-400 text-sm font-semibold mb-2">Ventas</div>
                <div className="text-3xl font-black text-white">127</div>
                <div className="text-purple-300 text-xs mt-2">Este mes</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
                <div className="text-orange-400 text-sm font-semibold mb-2">Calificación</div>
                <div className="text-3xl font-black text-white">4.8★</div>
                <div className="text-orange-300 text-xs mt-2">Excelente</div>
              </div>
            </div>
          )}

          {activeMenu === 'accommodation' && hasAccommodation && (
            <AccommodationPanel partnerData={partnerData} />
          )}

          {activeMenu === 'restaurant' && hasRestaurant && (
            <RestaurantPanel partnerData={partnerData} />
          )}

          {activeMenu === 'tours' && hasTours && (
            <ToursPanel partnerData={partnerData} />
          )}

          {activeMenu === 'transfers' && hasTransfers && (
            <TransfersPanel partnerData={partnerData} />
          )}

          {activeMenu === 'accommodation' && !hasAccommodation && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-gray-300">
              Activa la unidad de Alojamiento en "Mi Perfil" para gestionar habitaciones.
            </div>
          )}

          {activeMenu === 'restaurant' && !hasRestaurant && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-gray-300">
              Activa la unidad de Restaurante en "Mi Perfil" para gestionar tu establecimiento.
            </div>
          )}

          {activeMenu === 'tours' && !hasTours && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-gray-300">
              Activa la unidad de Tours en "Mi Perfil" para gestionar tus excursiones.
            </div>
          )}

          {activeMenu === 'transfers' && !hasTransfers && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-gray-300">
              Activa la unidad de Traslados en "Mi Perfil" para gestionar tus servicios de transporte.
            </div>
          )}

          {activeMenu === 'profile' && (
            <PartnerProfile partnerData={partnerData} onUpdate={setPartnerData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboardPro;
