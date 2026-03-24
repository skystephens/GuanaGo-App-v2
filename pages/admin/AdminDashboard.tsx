import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Activity, Calendar, Package as PackageIcon, ChevronRight, Server, Music, Palette, Handshake, ClipboardList, Clock, FileText, TowerControl, LayoutGrid, Brain, Route, Map } from 'lucide-react';
import { ADMIN_STATS, POPULAR_TOURS } from '../../constants';
import { AppRoute } from '../../types';
import { api } from '../../services/api';
import type { Reservation } from '../../types';

interface DashboardProps {
   onNavigate: (route: AppRoute) => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
   const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
   const [loadingReservations, setLoadingReservations] = useState<boolean>(false);

   const loadRecent = React.useCallback(async () => {
      try {
         setLoadingReservations(true);
         const list = await (api.reservations as any).listAll?.();
         const normalize = (raw: any): Reservation => ({
            id: raw.id || raw.reservationId || `res-${Date.now()}`,
            tourName: raw.tourName || raw.serviceName || raw.service?.name || 'Servicio',
            clientName: raw.clientName || raw.customerName || raw.customer?.name || 'Cliente',
            date: raw.date || raw.fecha || raw.createdAt || new Date().toISOString(),
            status: (raw.status || raw.estado || 'pending').toLowerCase(),
            people: raw.people || raw.pax || raw.quantity || 1,
            price: raw.price || raw.valor || raw.total || undefined,
            auditStatus: 'verified'
         });
         const normalized = Array.isArray(list) ? list.map(normalize) : [];
         const sorted = normalized.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
         setRecentReservations(sorted.slice(0, 3));
      } catch (e) {
         setRecentReservations([]);
      } finally {
         setLoadingReservations(false);
      }
   }, []);

   useEffect(() => {
      loadRecent();
   }, [loadRecent]);

   useEffect(() => {
      const id = setInterval(() => {
         loadRecent();
      }, 60000);
      return () => clearInterval(id);
   }, [loadRecent]);
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
               <button onClick={() => onNavigate(AppRoute.ADMIN_RESERVATIONS)} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Ver Todas</button>
            </div>
            <div className="divide-y divide-gray-700">
                      {loadingReservations ? (
                         <div className="p-4 text-xs text-gray-500">Cargando reservas...</div>
                      ) : recentReservations.length === 0 ? (
                         <div className="p-4 text-xs text-gray-500">Sin reservas recientes</div>
                      ) : (
                         recentReservations.map((res) => (
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
                                  <p className="text-[10px] text-gray-500 mt-1">{new Date(res.date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</p>
                               </div>
                            </div>
                         ))
                      )}
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

         {/* ═══ Módulos del Panel ═══ */}
         <div className="space-y-5 pt-2">

            {/* ── Sección 1: Operaciones & Logística ── */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-emerald-800/50" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Operaciones & Logística</span>
                  <span className="h-px flex-1 bg-emerald-800/50" />
               </div>
               <button
                  onClick={() => onNavigate(AppRoute.ADMIN_OPERACIONES)}
                  className="w-full bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 p-4 rounded-xl border border-emerald-700 hover:border-emerald-400 flex items-center gap-3 relative overflow-hidden transition-colors"
               >
                  <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <LayoutGrid size={20} className="text-emerald-400 flex-shrink-0" />
                  <div className="text-left">
                     <span className="text-sm font-bold text-emerald-300 block">Operaciones</span>
                     <span className="text-xs text-emerald-700">Catálogo · Channel Manager · CRM · Cotizaciones</span>
                  </div>
               </button>
               <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => onNavigate(AppRoute.ADMIN_RESERVATIONS)} className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-blue-700 flex flex-col items-center gap-1.5 text-center transition-colors">
                     <Calendar size={20} className="text-blue-400" />
                     <span className="text-[10px] font-bold">Reservas</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_APPROVALS)} className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 p-3 rounded-xl border border-yellow-700 hover:border-yellow-500 flex flex-col items-center gap-1.5 text-center relative overflow-hidden transition-colors">
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                     <Clock size={20} className="text-yellow-400" />
                     <span className="text-[10px] font-bold">Aprobaciones</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)} className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-emerald-700 flex flex-col items-center gap-1.5 text-center transition-colors">
                     <FileText size={20} className="text-emerald-400" />
                     <span className="text-[10px] font-bold">Cotizaciones</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.DYNAMIC_ITINERARY)} className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-cyan-700 flex flex-col items-center gap-1.5 text-center transition-colors">
                     <Route size={20} className="text-cyan-400" />
                     <span className="text-[10px] font-bold">Itinerarios</span>
                  </button>
               </div>
            </div>

            {/* ── Sección 2: Socios & Usuarios ── */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-blue-800/50" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Socios & Usuarios</span>
                  <span className="h-px flex-1 bg-blue-800/50" />
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => onNavigate(AppRoute.ADMIN_SOCIOS)} className="bg-gradient-to-br from-emerald-900/60 to-teal-900/60 p-3 rounded-xl border border-emerald-700 hover:border-emerald-500 flex flex-col items-center gap-1.5 text-center relative overflow-hidden transition-colors">
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                     <Handshake size={20} className="text-emerald-400" />
                     <span className="text-[10px] font-bold">Socios</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_USERS)} className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-blue-700 flex flex-col items-center gap-1.5 text-center transition-colors">
                     <Users size={20} className="text-blue-500" />
                     <span className="text-[10px] font-bold">Usuarios</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_FINANCE)} className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-green-700 flex flex-col items-center gap-1.5 text-center transition-colors">
                     <DollarSign size={20} className="text-green-500" />
                     <span className="text-[10px] font-bold">Finanzas</span>
                  </button>
               </div>
            </div>

            {/* ── Sección 3: Contenido & Cultura ── */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-orange-800/50" />
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Contenido & Cultura</span>
                  <span className="h-px flex-1 bg-orange-800/50" />
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => onNavigate(AppRoute.ADMIN_SERVICES)} className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-orange-700 flex flex-col items-center gap-1.5 text-center transition-colors">
                     <PackageIcon size={20} className="text-orange-400" />
                     <span className="text-[10px] font-bold">Servicios</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_CARIBBEAN)} className="bg-gradient-to-br from-orange-900/60 to-cyan-900/60 p-3 rounded-xl border border-orange-700 hover:border-orange-500 flex flex-col items-center gap-1.5 text-center relative overflow-hidden transition-colors">
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                     <Music size={20} className="text-orange-400" />
                     <span className="text-[10px] font-bold">Caribbean</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_ARTISTAS)} className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 p-3 rounded-xl border border-purple-700 hover:border-purple-500 flex flex-col items-center gap-1.5 text-center relative overflow-hidden transition-colors">
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                     <Palette size={20} className="text-pink-400" />
                     <span className="text-[10px] font-bold">Artistas</span>
                  </button>
               </div>
            </div>

            {/* ── Sección 4: Cerebro & Sistema ── */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-indigo-800/50" />
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Cerebro & Sistema</span>
                  <span className="h-px flex-1 bg-indigo-800/50" />
               </div>
               <button
                  onClick={() => onNavigate(AppRoute.ADMIN_CEREBRO)}
                  className="w-full bg-gradient-to-r from-indigo-950 via-violet-950 to-indigo-950 p-4 rounded-xl border border-indigo-600 hover:border-indigo-400 flex items-center gap-3 transition-colors"
               >
                  <Brain size={20} className="text-indigo-400 flex-shrink-0" />
                  <div className="text-left">
                     <span className="text-sm font-bold text-indigo-300 block">Cerebro</span>
                     <span className="text-xs text-indigo-700">Notas · Oportunidades · Trazabilidad · Contexto Claude</span>
                  </div>
               </button>
               <button
                  onClick={() => onNavigate(AppRoute.ADMIN_TORRE_CONTROL)}
                  className="w-full bg-gradient-to-r from-cyan-900/60 via-blue-900/60 to-cyan-900/60 p-3 rounded-xl border border-cyan-700 hover:border-cyan-500 flex items-center gap-3 relative overflow-hidden transition-colors"
               >
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <TowerControl size={18} className="text-cyan-400 flex-shrink-0" />
                  <div className="text-left">
                     <span className="text-sm font-bold text-cyan-300">Torre de Control</span>
                     <span className="text-xs text-cyan-700 ml-2">Checklist lanzamiento · Super Admin</span>
                  </div>
               </button>
               <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => onNavigate(AppRoute.ADMIN_TASKS)} className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 p-3 rounded-xl border border-cyan-800 hover:border-cyan-600 flex flex-col items-center gap-1.5 text-center relative overflow-hidden transition-colors">
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                     <ClipboardList size={20} className="text-cyan-400" />
                     <span className="text-[10px] font-bold">Tareas</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_BACKEND)} className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-3 rounded-xl border border-purple-800 hover:border-purple-600 flex flex-col items-center gap-1.5 text-center relative overflow-hidden transition-colors">
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     <Server size={20} className="text-purple-400" />
                     <span className="text-[10px] font-bold">Backend</span>
                  </button>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_STRUCTURE)} className="bg-gray-800 p-3 rounded-xl border border-gray-700 hover:border-purple-700 flex flex-col items-center gap-1.5 text-center transition-colors">
                     <Map size={20} className="text-purple-400" />
                     <span className="text-[10px] font-bold">Estructura</span>
                  </button>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
