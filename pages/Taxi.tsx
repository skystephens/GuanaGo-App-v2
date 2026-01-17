import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, ChevronDown, Car, Truck, Info, Ticket } from 'lucide-react';
import { TAXI_ZONES } from '../constants';
import SanAndresMap from '../components/SanAndresMap';

interface TaxiProps {
  onBack: () => void;
}

const Taxi: React.FC<TaxiProps> = ({ onBack }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [passengers, setPassengers] = useState<number>(2);

  const selectedZone = useMemo(() => 
    TAXI_ZONES.find(z => z.id === selectedZoneId), 
  [selectedZoneId]);

   // Pricing Logic: cada taxi lleva hasta 4 pax, se suman taxis adicionales con la misma tarifa base
   const taxisNeeded = Math.ceil(passengers / 4);
   const pricePerTaxi = selectedZone?.priceSmall || 0;
   const price = selectedZone ? taxisNeeded * pricePerTaxi : 0;

  const handleIncrement = () => {
     if (passengers < 15) setPassengers(prev => prev + 1);
  };

  const handleDecrement = () => {
     if (passengers > 1) setPassengers(prev => prev - 1);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-44 relative font-sans">
       {/* Simple Header */}
       <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 flex items-center gap-4 shadow-sm">
         <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
           <ArrowLeft size={20} className="text-gray-800" />
         </button>
         <h1 className="text-lg font-bold text-gray-900">Calculadora de Tarifas</h1>
       </div>

       <div className="p-6">
         
         {/* Info Banner */}
         <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex gap-3">
             <Info className="text-green-600 shrink-0 mt-0.5" size={20} />
             <p className="text-xs text-green-800">
                Usa la lista y el mapa de referencia para ver la tarifa oficial regulada.
             </p>
         </div>

         {/* Mapa + Leyenda + Formulario */}
         <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-6 mt-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Mapa de Zonas y Cálculo</h3>
            <div className="grid md:grid-cols-2 gap-4 items-start">
               <SanAndresMap 
                 selectedZoneId={selectedZoneId} 
                 onSelectZone={(id) => setSelectedZoneId(id)} 
               />

               <div className="space-y-4">
                  {/* Leyenda de zonas */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Zonas de Taxi</p>
                    <div className="space-y-2">
                      {TAXI_ZONES.map((zone) => {
                        const zoneNumber = zone.id.replace('z', '');
                        const zoneLabel = zone.name.replace(/^Zona\s*\d+\s*-\s*/i, '');
                        return (
                          <div key={zone.id} className="flex items-start gap-2">
                            <div className={`w-3 h-3 mt-1 rounded-full border border-gray-300 ${zone.color}`}></div>
                            <div className="text-xs text-gray-700 leading-tight">
                              <span className="font-bold mr-1">Zona {zoneNumber}</span>
                              <span>{zoneLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Formulario de destino y pasajeros */}
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    {/* 1. Zone Selector */}
                    <div className="mb-4">
                       <label className="block text-sm font-bold text-gray-900 mb-2">¿Cuál es tu destino?</label>
                       <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                             <MapPin size={20} />
                          </div>
                          <select 
                             value={selectedZoneId}
                             onChange={(e) => setSelectedZoneId(e.target.value)}
                             className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block p-4 pl-12 pr-10 appearance-none outline-none transition-all font-medium"
                          >
                             <option value="" disabled>Selecciona una zona...</option>
                             {TAXI_ZONES.map(zone => (
                                <option key={zone.id} value={zone.id}>
                                   {zone.name}
                                </option>
                             ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                             <ChevronDown size={20} />
                          </div>
                       </div>
                       {selectedZone && (
                          <div className="mt-3 flex items-start gap-2 bg-gray-50 p-2 rounded-lg transition-all animate-in fade-in">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${selectedZone.color}`}></div>
                              <p className="text-xs text-gray-500">
                                 <span className="font-bold">Sectores:</span> {selectedZone.sectors}
                              </p>
                          </div>
                       )}
                    </div>

                    {/* 2. Passenger Counter */}
                    <div>
                       <label className="block text-sm font-bold text-gray-900 mb-2">Cantidad de Pasajeros</label>
                       <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 border border-gray-200">
                          <button 
                             onClick={handleDecrement}
                             className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-green-600 font-bold text-xl active:scale-95 transition-all disabled:opacity-50"
                             disabled={passengers <= 1}
                          >
                             -
                          </button>
                          <div className="flex flex-col items-center">
                             <span className="text-xl font-bold text-gray-900">{passengers}</span>
                             <span className="text-xs text-gray-400">personas</span>
                          </div>
                          <button 
                             onClick={handleIncrement}
                             className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-green-600 font-bold text-xl active:scale-95 transition-all disabled:opacity-50"
                             disabled={passengers >= 15}
                          >
                             +
                          </button>
                       </div>
                       
                       {taxisNeeded > 1 ? (
                          <p className="text-xs text-blue-600 mt-2 ml-1 flex items-center gap-1 font-medium">
                             <Info size={12} />
                             Se asignan {taxisNeeded} taxis (4 pax c/u). Tarifa por taxi: ${pricePerTaxi.toLocaleString()} COP.
                          </p>
                       ) : (
                          <p className="text-xs text-gray-400 mt-2 ml-1 flex items-center gap-1">
                             <Info size={12} />
                             Tarifa estándar de Taxi (hasta 4 pasajeros)
                          </p>
                       )}
                    </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Result Preview (Ticket Style) */}
         {selectedZone ? (
             <div className="relative bg-gray-900 rounded-2xl p-0 text-white shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                {/* Visual top decorative bar */}
                <div className={`h-2 w-full ${selectedZone.color}`}></div>
                
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Precio Estimado</p>
                          <h2 className="text-4xl font-bold text-green-400">
                             ${price.toLocaleString()} <span className="text-sm text-gray-400 font-normal">COP</span>
                          </h2>
                       </div>
                       <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-green-500 shadow-inner">
                          {isLargeGroup ? <Truck size={28} /> : <Car size={28} />}
                       </div>
                    </div>

                    <div className="space-y-3 border-t border-gray-700 pt-4 text-sm">
                       <div className="flex justify-between">
                          <span className="text-gray-400">Origen</span>
                          <span className="font-bold">Aeropuerto Intl.</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">Destino</span>
                          <span className="font-bold text-right max-w-[160px]">{selectedZone.name}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-400">Tipo Servicio</span>
                          <span className="font-bold">{isLargeGroup ? 'Van / Microbús' : 'Taxi Estándar'}</span>
                       </div>
                    </div>
                </div>
                
                {/* Perforated edge visual effect */}
                <div className="relative h-4 bg-gray-900">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-50"></div>
                    <div className="absolute left-0 right-0 top-2 border-t-2 border-dashed border-gray-700"></div>
                    <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-gray-50"></div>
                </div>

                <div className="bg-gray-800 p-4 text-center">
                    <p className="text-xs text-gray-400">Tarifas oficiales "GuíaSAI 2026"</p>
                </div>
             </div>
         ) : (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 opacity-50 border-2 border-dashed border-gray-300 rounded-2xl">
               <Ticket size={48} className="mb-2" />
               <p className="text-sm font-medium">Completa los datos para ver la tarifa</p>
            </div>
         )}

       </div>

       {/* Footer Button - Lifted */}
       <div className="fixed bottom-[74px] left-0 right-0 bg-white p-4 border-t border-gray-100 max-w-md mx-auto w-full z-40 rounded-t-2xl shadow-lg">
        <button 
         className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
            ${selectedZone 
               ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' 
               : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
         disabled={!selectedZone}
        >
          <Car size={20} />
          Solicitar Transporte
        </button>
      </div>
    </div>
  );
};

export default Taxi;