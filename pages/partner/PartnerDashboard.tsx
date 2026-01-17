
import React from 'react';
import { Bell, Briefcase, Map as MapIcon, Car } from 'lucide-react';
import { AppRoute } from '../../types';

interface DashboardProps {
   onNavigate?: (route: AppRoute) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-gray-900">
         <div>
            <h1 className="text-2xl font-bold">Panel de Socio</h1>
            <p className="text-gray-400 text-sm">Herramientas Comerciales</p>
         </div>
         <button className="relative p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <Bell size={20} className="text-white" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900"></span>
         </button>
      </header>

      <div className="px-6 space-y-6">
         {/* Services Link */}
         {onNavigate && (
            <button 
               onClick={() => onNavigate(AppRoute.PARTNER_MY_SERVICES)}
               className="w-full bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-gray-700 hover:bg-gray-750 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-lg text-green-500">
                     <Briefcase size={20} />
                  </div>
                  <div className="text-left">
                     <span className="block font-bold text-sm">Mis Servicios</span>
                     <span className="text-xs text-gray-400">Gestionar tours y productos</span>
                  </div>
               </div>
               <span className="text-gray-500">→</span>
            </button>
         )}

         {/* Accommodations Link (NUEVO) */}
         {onNavigate && (
            <button 
               onClick={() => onNavigate(AppRoute.PARTNER_ACCOMMODATIONS)}
               className="w-full bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-gray-700 hover:bg-gray-750 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                     <MapIcon size={20} />
                  </div>
                  <div className="text-left">
                     <span className="block font-bold text-sm">🏨 Alojamientos</span>
                     <span className="text-xs text-gray-400">Registrar hospedajes</span>
                  </div>
               </div>
               <span className="text-gray-500">→</span>
            </button>
         )}

         {/* Taxi & Mapbox Placeholder */}
         <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
               <MapIcon size={100} />
            </div>
            
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
               <Car size={20} className="text-yellow-500"/> 
               Guía de Transporte y Mapa
            </h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
               Próximamente: Integración con <strong>Mapbox</strong> para visualización en tiempo real de zonas de taxi, rutas turísticas y puntos de interés comercial para empresarios.
            </p>
            <div className="flex gap-2">
               <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-1 rounded">Zonificación</span>
               <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-1 rounded">Geolocalización</span>
            </div>
         </div>

         {/* Commercial Stats Placeholder */}
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-green-500">
               <span className="text-green-500 text-sm font-medium">Reservas Activas</span>
               <div className="flex items-end justify-between mt-1">
                  <span className="text-3xl font-bold text-white">12</span>
               </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-purple-500">
               <span className="text-purple-500 text-sm font-medium">Ingresos Mes</span>
               <div className="flex items-end justify-between mt-1">
                  <span className="text-2xl font-bold text-white">$4.5M</span>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default Dashboard;
