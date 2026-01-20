
import React, { useState } from 'react';
import { QrCode, User, ChevronRight, Coins, ChevronDown, MapPin, Clock, Info } from 'lucide-react';
import { AppRoute } from '../../types';

interface OperationsProps {
   onNavigate: (route: AppRoute) => void;
}

const Operations: React.FC<OperationsProps> = ({ onNavigate }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const missions = [
    { 
       client: 'Sofia Ramirez', 
       time: '10:00 AM', 
       img: 'https://i.pravatar.cc/150?u=1',
       title: 'Tour de Snorkel VIP',
       location: 'Muelle Toninos',
       details: '2 Adultos, 1 Niño. Incluye almuerzo vegetariano. Tienen equipo propio, solo necesitan chalecos.',
       status: 'confirmed'
    },
    { 
       client: 'Mateo Vargas', 
       time: '11:30 AM', 
       img: 'https://i.pravatar.cc/150?u=2',
       title: 'Alquiler de Mulita',
       location: 'Lobby Hotel Decameron',
       details: 'Entrega de vehículo placa WX-204. Verificar licencia de conducción vigente. Pago pendiente del 50%.',
       status: 'pending'
    },
    { 
       client: 'Isabella Torres', 
       time: '1:00 PM', 
       img: 'https://i.pravatar.cc/150?u=3',
       title: 'Parasail Adventure',
       location: 'Playa Spratt Bight',
       details: '1 Persona. Turno sencillo. Cliente celebra cumpleaños, ofrecer video de cortesía si es posible.',
       status: 'confirmed'
    },
  ];

  const tokenBalance = 2500;

  const toggleMission = (index: number) => {
      if (expandedIndex === index) {
          setExpandedIndex(null);
      } else {
          setExpandedIndex(index);
      }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
       <header className="px-6 pt-12 pb-6">
          <h1 className="text-2xl font-bold mb-1">Traslados</h1>
          <p className="text-gray-400 text-sm">Gestiona el flujo de hoy</p>
       </header>

       <div className="px-6">
          
          {/* Token Balance Card */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/30 p-5 rounded-2xl flex items-center justify-between mb-6 cursor-pointer hover:bg-gray-800/50 transition-colors">
             <div className="flex items-center gap-4">
                <div className="bg-yellow-500/20 p-3 rounded-full">
                   <Coins className="text-yellow-500" size={28} />
                </div>
                <div>
                   <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider mb-0.5">Saldo para Venta</p>
                   <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-yellow-400">{tokenBalance.toLocaleString()}</span>
                      <span className="text-yellow-500 font-bold text-sm">$GUANA</span>
                   </div>
                </div>
             </div>
             <div className="bg-yellow-500 text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                Recargar <ChevronRight size={12}/>
             </div>
          </div>

          {/* Main Action - Scan */}
          <button 
            onClick={() => onNavigate(AppRoute.PARTNER_SCANNER)}
            className="w-full bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-gray-900 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 mb-8"
          >
             <QrCode size={24} />
             <span>ESCANEAR QR PARA CANJEAR</span>
          </button>

          {/* Missions List (Accordion) */}
          <h2 className="text-lg font-bold mb-4">Próximas Misiones</h2>
          <div className="space-y-4">
             {missions.map((m, idx) => {
               const isExpanded = expandedIndex === idx;
               return (
                  <div 
                     key={idx} 
                     className={`bg-gray-800 rounded-xl overflow-hidden border transition-all duration-300 ${
                        isExpanded ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-gray-700'
                     }`}
                  >
                     {/* Header Card - Clickable */}
                     <button 
                        onClick={() => toggleMission(idx)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors text-left"
                     >
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <img src={m.img} alt={m.client} className="w-12 h-12 rounded-full object-cover" />
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                                 m.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></div>
                           </div>
                           <div>
                              <p className="font-bold text-sm text-white">{m.client}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-green-400 text-xs font-bold bg-green-900/30 px-1.5 rounded flex items-center gap-1">
                                    <Clock size={10} /> {m.time}
                                 </span>
                              </div>
                           </div>
                        </div>
                        {isExpanded ? (
                           <ChevronDown size={20} className="text-green-500" />
                        ) : (
                           <ChevronRight size={20} className="text-gray-600" />
                        )}
                     </button>

                     {/* Expanded Details */}
                     {isExpanded && (
                        <div className="bg-gray-900/50 p-4 border-t border-gray-700 animate-in slide-in-from-top-2">
                           <div className="mb-3">
                              <h3 className="text-green-400 text-sm font-bold mb-1 flex items-center gap-2">
                                 {m.title}
                              </h3>
                              <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                                 <MapPin size={12} />
                                 <span>{m.location}</span>
                              </div>
                           </div>
                           
                           <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-3">
                              <div className="flex gap-2">
                                 <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                                 <p className="text-xs text-gray-300 leading-relaxed">
                                    {m.details}
                                 </p>
                              </div>
                           </div>

                           <div className="flex gap-2 mt-2">
                              <button className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                                 Iniciar Misión
                              </button>
                              <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                                 Contactar
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               );
             })}
          </div>

          {/* Notifications */}
          <h2 className="text-lg font-bold mt-8 mb-4">Notificaciones Recientes</h2>
          <div className="bg-gray-800 p-4 rounded-xl flex gap-4 border border-gray-700 mb-3">
             <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
               <User size={20} className="text-red-400" />
             </div>
             <div>
                <p className="text-xs text-gray-300">Nuevo cliente: <span className="text-white font-bold">Sofia Ramirez</span> ha reservado para las 10:00 AM.</p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Operations;
