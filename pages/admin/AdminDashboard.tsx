
import React from 'react';
import { TrendingUp, Users, DollarSign, Activity, Calendar, Package as PackageIcon, ChevronRight, Server, Music, Palette, Handshake, ClipboardList, Clock } from 'lucide-react';
import { ADMIN_STATS, PARTNER_RESERVATIONS, POPULAR_TOURS } from '../../constants';
import { AppRoute } from '../../types';

interface DashboardProps {
   onNavigate: (route: AppRoute) => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-gray-900">
         <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Vista General del Sistema</p>
         </div>
         <div className="bg-gray-800 p-2 rounded-full">
            <Activity size={20} className="text-green-500" />
         </div>
      </header>

      <div className="px-6 space-y-6">
         {/* Stats Grid */}
         <div className="grid grid-cols-2 gap-4">
            {ADMIN_STATS.map((stat, idx) => (
               <div key={idx} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <span className="text-gray-400 text-xs uppercase font-bold">{stat.title}</span>
                  <div className="mt-2 flex items-baseline justify-between">
                     <span className="text-xl font-bold">{stat.value}</span>
                     <span className="text-green-500 text-xs font-bold">{stat.change}</span>
                  </div>
               </div>
            ))}
         </div>

         {/* Reservations Summary List */}
         <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  <h3 className="font-bold text-sm">Reservas Recientes</h3>
               </div>
               <button className="text-xs text-blue-400 hover:text-blue-300 font-bold">Ver Todas</button>
            </div>
            <div className="divide-y divide-gray-700">
               {PARTNER_RESERVATIONS.slice(0, 3).map((res) => (
                  <div key={res.id} className="p-4 flex justify-between items-center hover:bg-gray-750 transition-colors">
                     <div>
                        <p className="font-bold text-sm">{res.clientName}</p>
                        <p className="text-xs text-gray-400">{res.tourName}</p>
                     </div>
                     <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                           res.status === 'confirmed' ? 'bg-green-900/50 text-green-500' :
                           res.status === 'pending' ? 'bg-yellow-900/50 text-yellow-500' :
                           'bg-red-900/50 text-red-500'
                        }`}>
                           {res.status === 'confirmed' ? 'Confirmada' : res.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">{res.date}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Services Summary List */}
         <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <PackageIcon size={18} className="text-orange-500" />
                  <h3 className="font-bold text-sm">Servicios Top</h3>
               </div>
               <button className="text-xs text-orange-400 hover:text-orange-300 font-bold">Gestionar</button>
            </div>
            <div className="divide-y divide-gray-700">
               {POPULAR_TOURS.slice(0, 3).map((tour) => (
                  <div key={tour.id} className="p-4 flex items-center gap-3 hover:bg-gray-750 transition-colors">
                     <img src={tour.image} alt={tour.title} className="w-10 h-10 rounded-lg object-cover bg-gray-700" />
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{tour.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-xs text-gray-400">${tour.price}</span>
                           <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 rounded uppercase">Tour</span>
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-gray-600" />
                  </div>
               ))}
            </div>
         </div>

         {/* Quick Actions */}
         <div className="grid grid-cols-4 gap-3 pt-2">
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_USERS)}
               className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 flex flex-col items-center gap-2 text-center"
             >
               <Users size={24} className="text-blue-500" />
               <span className="text-xs font-bold">Usuarios</span>
             </button>
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_APPROVALS)}
               className="bg-gradient-to-br from-yellow-900 to-orange-900 p-4 rounded-xl border border-yellow-600 hover:border-yellow-400 flex flex-col items-center gap-2 text-center relative overflow-hidden"
             >
               <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
               <Clock size={24} className="text-yellow-400" />
               <span className="text-xs font-bold">Aprobaciones</span>
             </button>
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_FINANCE)}
               className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 flex flex-col items-center gap-2 text-center"
             >
               <DollarSign size={24} className="text-green-500" />
               <span className="text-xs font-bold">Finanzas</span>
             </button>
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_CARIBBEAN_NIGHT)}
               className="bg-gradient-to-br from-orange-900 to-cyan-900 p-4 rounded-xl border border-orange-600 hover:border-orange-400 flex flex-col items-center gap-2 text-center relative overflow-hidden"
             >
               <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
               <Music size={24} className="text-orange-400" />
               <span className="text-xs font-bold">Caribbean</span>
             </button>
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_ARTISTAS)}
               className="bg-gradient-to-br from-purple-900 to-pink-900 p-4 rounded-xl border border-purple-600 hover:border-purple-400 flex flex-col items-center gap-2 text-center relative overflow-hidden"
             >
               <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
               <Palette size={24} className="text-pink-400" />
               <span className="text-xs font-bold">Artistas</span>
             </button>
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_SOCIOS)}
               className="bg-gradient-to-br from-emerald-900 to-teal-900 p-4 rounded-xl border border-emerald-600 hover:border-emerald-400 flex flex-col items-center gap-2 text-center relative overflow-hidden"
             >
               <div className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
               <Handshake size={24} className="text-emerald-400" />
               <span className="text-xs font-bold">Socios</span>
             </button>
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_BACKEND)}
               className="bg-gradient-to-br from-purple-900 to-blue-900 p-4 rounded-xl border border-purple-600 hover:border-purple-400 flex flex-col items-center gap-2 text-center relative overflow-hidden"
             >
               <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <Server size={24} className="text-purple-400" />
               <span className="text-xs font-bold">Backend</span>
             </button>
             <button 
               onClick={() => onNavigate(AppRoute.ADMIN_TASKS)}
               className="bg-gradient-to-br from-cyan-900 to-blue-900 p-4 rounded-xl border border-cyan-600 hover:border-cyan-400 flex flex-col items-center gap-2 text-center relative overflow-hidden"
             >
               <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
               <ClipboardList size={24} className="text-cyan-400" />
               <span className="text-xs font-bold">Tareas</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
