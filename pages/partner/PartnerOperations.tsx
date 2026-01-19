
import React from 'react';
import { Car, AlertTriangle, MapPin, Clock, Phone, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { AppRoute } from '../../types';

interface OperationsProps {
   onNavigate: (route: AppRoute) => void;
}

const PartnerOperations: React.FC<OperationsProps> = ({ onNavigate }) => {
  // Mock de perfil taxista
  const driverProfile = {
    name: 'Carlos Peña García',
    vehicleType: 'Sedán',
    plate: 'WX-2847',
    color: 'Blanco',
    turnId: 'T-SAI-001-2026',
    rating: 4.9,
    trips: 237
  };

   // Mock de cola aeropuerto
   const queue = {
      driverName: 'Carlos Peña',
      position: 3,
      lane: 'Turno aeropuerto - Carril 1',
      eta: 'Próximo en 8 min',
      alerts: ['Revisa tanque lleno', 'Cliente con 2 maletas grandes']
   };

   const upcoming = [
      { pos: 1, driver: 'María G.', notes: 'Sedán' },
      { pos: 2, driver: 'Jorge L.', notes: 'Van' },
      { pos: 3, driver: 'Tú', notes: 'Sedán' }
   ];

   // Mock de carreras independientes (fuera del turno del aeropuerto)
   const independentRequests = [
      {
         id: 'IRQ-101',
         pax: 2,
         luggage: 1,
         tripType: 'Punto a punto',
         from: 'Hotel Cocoplum',
         to: 'Playa Johnny Cay',
         time: '14:30',
         contact: '+57 320 555 1234',
         price: 28000,
         status: 'pendiente'
      },
      {
         id: 'IRQ-102',
         pax: 4,
         luggage: 2,
         tripType: 'Hotel → Aeropuerto',
         from: 'Posada Nativa',
         to: 'Aeropuerto Intl.',
         time: '16:00',
         contact: '+57 310 777 8899',
         price: 35000,
         status: 'pendiente'
      }
   ];

  return (
      <div className="bg-gray-950 min-h-screen text-white pb-24 font-sans">
         <header className="px-6 pt-12 pb-4">
            <h1 className="text-2xl font-bold mb-1">Operaciones Transporte</h1>
            <p className="text-gray-400 text-sm">Tu perfil, carreras y turno en aeropuerto</p>
         </header>

         <div className="px-6 space-y-6">
            {/* Perfil del Taxista */}
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-700/20 border border-green-500/30 rounded-3xl p-5 shadow-lg">
              <div className="grid md:grid-cols-2 gap-5 items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-green-200 font-bold mb-2">Tu Perfil</p>
                  <h2 className="text-2xl font-extrabold text-white mb-1">{driverProfile.name}</h2>
                  <p className="text-green-100 text-sm mb-4">{driverProfile.rating} ⭐ • {driverProfile.trips} viajes completados</p>
                  <div className="space-y-2 text-sm text-gray-200">
                    <p><span className="font-bold text-white">Vehículo:</span> {driverProfile.vehicleType} {driverProfile.color}</p>
                    <p><span className="font-bold text-white">Placa:</span> {driverProfile.plate}</p>
                    <p><span className="font-bold text-white">ID Turno:</span> <span className="font-mono text-green-300">{driverProfile.turnId}</span></p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="px-5 py-3 rounded-xl bg-white text-green-700 font-bold shadow hover:bg-gray-100 transition-colors">
                    Editar Perfil
                  </button>
                  <button className="px-5 py-3 rounded-xl bg-green-600/30 border border-green-500/50 text-green-200 font-bold hover:bg-green-600/50 transition-colors">
                    Ver Documentos
                  </button>
                </div>
              </div>
            </div>

            {/* Carreras Independientes (Fuera del turno del aeropuerto) */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-yellow-300 font-bold">Disponibles Ahora</p>
                  <h3 className="text-lg font-bold text-white">Carreras Independientes</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-400 text-yellow-900">{independentRequests.length}</span>
              </div>

              <div className="space-y-3">
                {independentRequests.length > 0 ? (
                  independentRequests.map((r) => (
                    <div key={r.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <p className="text-xs text-gray-400">{r.id} • {r.tripType}</p>
                          <p className="text-white font-bold text-sm">{r.from} → {r.to}</p>
                          <p className="text-gray-300 text-xs">{r.time} • {r.pax} pax • {r.luggage} equipaje</p>
                          <p className="text-green-300 text-xs">📞 {r.contact}</p>
                          <p className="text-yellow-300 text-sm font-bold mt-1">${r.price.toLocaleString()} COP</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-200 text-yellow-900">Pendiente</span>
                          <div className="flex gap-2">
                            <button className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow">
                              Aceptar
                            </button>
                            <button className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold border border-gray-600">
                              Pasar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p>No hay carreras independientes en este momento.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tu Turno en Aeropuerto */}
            <div className="bg-gradient-to-r from-black via-yellow-900/20 to-yellow-600/20 border border-yellow-500/30 rounded-3xl p-5 shadow-lg">
               <div className="flex items-start justify-between gap-3">
                  <div>
                     <p className="text-[11px] uppercase tracking-[0.22em] text-yellow-200 font-bold mb-2">Tu Turno en Aeropuerto</p>
                     <h2 className="text-xl font-extrabold text-white">{queue.lane}</h2>
                     <p className="text-sm text-gray-200 mt-1">{queue.driverName} — posición #{queue.position} • {queue.eta}</p>
                     <div className="mt-3 flex flex-wrap gap-2">
                        {queue.alerts.map((a, i) => (
                           <span key={i} className="px-3 py-1 rounded-full text-[11px] font-bold bg-black/40 border border-yellow-400/40 text-yellow-100 flex items-center gap-1">
                              <AlertTriangle size={12} /> {a}
                           </span>
                        ))}
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className="px-3 py-1 rounded-full text-[11px] font-bold bg-green-500/20 text-green-200 border border-green-500/40">Disponible</div>
                     <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-700 font-bold shadow-sm hover:bg-gray-100">
                        <Car size={16} /> Marcar en aeropuerto
                     </button>
                  </div>
               </div>
               <div className="mt-4 bg-black/30 border border-gray-700 rounded-2xl p-4">
                  <p className="text-xs text-gray-300 mb-3 font-semibold uppercase tracking-wider">Próximos en la fila</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                     {upcoming.map(item => (
                        <div key={item.pos} className="bg-gray-900/60 rounded-xl p-3 border border-gray-800">
                           <p className="text-gray-400 text-[11px]">Pos #{item.pos}</p>
                           <p className="font-bold text-white">{item.driver}</p>
                           <p className="text-gray-300 text-xs">{item.notes}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
  );
};

export default PartnerOperations;
