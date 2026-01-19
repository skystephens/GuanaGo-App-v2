import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, ChevronDown, Car, Truck, Info, Ticket, Phone, User, Mail, Clock, Plane } from 'lucide-react';
import { TAXI_ZONES } from '../constants';
import SanAndresMap from '../components/SanAndresMap';
import { api } from '../services/api';

interface TaxiProps {
  onBack: () => void;
}

const Taxi: React.FC<TaxiProps> = ({ onBack }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [passengers, setPassengers] = useState<number>(2);
   const [luggage, setLuggage] = useState<number>(1);
   const [tripType, setTripType] = useState<'airport_to_hotel' | 'hotel_to_airport' | 'point_to_point'>('airport_to_hotel');
   const [contactName, setContactName] = useState<string>('');
   const [contactPhone, setContactPhone] = useState<string>('');
   const [contactEmail, setContactEmail] = useState<string>('');
   const [arrivalTime, setArrivalTime] = useState<string>('');
   const [flightNumber, setFlightNumber] = useState<string>('');
   const [notes, setNotes] = useState<string>('');
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
   const [submitMessage, setSubmitMessage] = useState<string>('');
   const [submitError, setSubmitError] = useState<string>('');
   const [status, setStatus] = useState<'pendiente' | 'asignada' | 'en_ruta'>('pendiente');

   const STATUS_BADGE: Record<typeof status, { label: string; bg: string; text: string; ring: string }> = {
      pendiente: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-300' },
      asignada: { label: 'Asignada', bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-300' },
      en_ruta: { label: 'En ruta', bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-300' }
   };

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

   const handleSubmit = async () => {
      if (!selectedZoneId || !contactName || !contactPhone) {
         setSubmitError('Completa zona, nombre y teléfono.');
         setSubmitMessage('');
         return;
      }

      setIsSubmitting(true);
      setSubmitError('');
      setSubmitMessage('');

      try {
         const payload = {
            origin: tripType === 'airport_to_hotel' ? 'Aeropuerto Intl.' : 'Hotel / Punto',
            destination: TAXI_ZONES.find(z => z.id === selectedZoneId)?.name || 'Zona',
            zoneId: selectedZoneId,
            passengers,
            luggage,
            tripType,
            pickupTime: arrivalTime,
            flightNumber,
            notes,
            contactName,
            contactPhone,
            contactEmail,
            taxisNeeded,
            priceEstimate: price
         };

         await api.taxis.request(payload as any);
         setSubmitMessage('Solicitud enviada. Te contactaremos para confirmar el conductor.');
      } catch (error: any) {
         const reason = error?.message || 'No se pudo enviar la solicitud.';
         setSubmitError(reason.includes('401') ? 'Inicia sesión o comparte tu contacto.' : reason);
      } finally {
         setIsSubmitting(false);
      }
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
             {/* CTA rápida de solicitud */}
             <div className="rounded-3xl p-5 shadow-lg mb-6 relative overflow-hidden bg-gradient-to-br from-black via-green-800 to-green-600 text-white">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-8 -translate-y-8">
                     <Car size={120} />
                </div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-yellow-200 font-bold mb-2">Traslados oficiales</p>
                <h2 className="text-xl font-extrabold leading-tight">Llega y sube sin filas</h2>
                <p className="text-green-100 text-sm mt-1 mb-4 max-w-2xl leading-relaxed">
                   Hasta 4 pasajeros o 3 con equipaje grande por taxi. Sumamos más taxis para grupos. Tarifas reguladas por zona, pago en sitio.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                   <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-400 text-black">Turno aeropuerto</span>
                   <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 border border-white/30">Pago en sitio</span>
                   <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/80 text-white">Sin sobrecostos</span>
                </div>
                <button
                   onClick={() => document.getElementById('taxi-request-form')?.scrollIntoView({ behavior: 'smooth' })}
                   className="bg-white text-green-800 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-green-50 transition-colors flex items-center gap-2 justify-center w-fit"
                >
                   <Car size={18} />
                   Solicitar ahora
                </button>
             </div>
         
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

             {/* Formulario de solicitud */}
             <div id="taxi-request-form" className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100 mb-6">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-[0.28em] mb-3 text-center">Solicitar traslado</h3>
                <div className="grid md:grid-cols-2 gap-4">
                   <div className="space-y-3">
                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">Tipo de viaje</label>
                         <select
                            value={tripType}
                            onChange={(e) => setTripType(e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3"
                         >
                            <option value="airport_to_hotel">Aeropuerto → hotel/punto</option>
                            <option value="hotel_to_airport">Hotel/punto → aeropuerto</option>
                            <option value="point_to_point">Punto a punto en la isla</option>
                         </select>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">Hora de llegada o recogida</label>
                         <div className="relative">
                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                               type="datetime-local"
                               value={arrivalTime}
                               onChange={(e) => setArrivalTime(e.target.value)}
                               className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3 pl-9"
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">N. vuelo (opcional)</label>
                         <div className="relative">
                            <Plane size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                               type="text"
                               value={flightNumber}
                               onChange={(e) => setFlightNumber(e.target.value)}
                               placeholder="AV8523"
                               className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3 pl-9"
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">Equipaje</label>
                         <input
                            type="number"
                            min={0}
                            max={20}
                            value={luggage}
                            onChange={(e) => setLuggage(parseInt(e.target.value || '0', 10))}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3"
                         />
                         <p className="text-[11px] text-gray-500 mt-1">Si llevas equipaje grande, contamos máximo 3 pax por taxi.</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">Nombre de contacto</label>
                         <div className="relative">
                            <User size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                               type="text"
                               value={contactName}
                               onChange={(e) => setContactName(e.target.value)}
                               placeholder="Nombre y apellido"
                               className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3 pl-9"
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">WhatsApp o teléfono</label>
                         <div className="relative">
                            <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                               type="tel"
                               value={contactPhone}
                               onChange={(e) => setContactPhone(e.target.value)}
                               placeholder="+57 3xx xxx xxxx"
                               className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3 pl-9"
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">Correo (opcional)</label>
                         <div className="relative">
                            <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                               type="email"
                               value={contactEmail}
                               onChange={(e) => setContactEmail(e.target.value)}
                               placeholder="tu@email.com"
                               className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3 pl-9"
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-900 mb-1">Notas (hotel, referencias)</label>
                         <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-600 focus:border-green-600 block p-3"
                            placeholder="Hotel, punto exacto, puerta de arribo, silla para bebé, etc."
                         />
                      </div>
                   </div>
                </div>

                {(submitError || submitMessage) && (
                   <div className={`mt-3 text-sm font-medium rounded-lg p-3 ${submitError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {submitError || submitMessage}
                   </div>
                )}

                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                   <p className="text-xs text-gray-600">Asignamos taxis según pax y equipaje. Confirmamos por WhatsApp.</p>
                   <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedZoneId || !contactName || !contactPhone}
                      className={`w-full md:w-auto font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                         isSubmitting || !selectedZoneId || !contactName || !contactPhone
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                      }`}
                   >
                      {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                   </button>
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
                                       <div className="mt-2 flex flex-wrap gap-2 items-center">
                                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ring-2 ${STATUS_BADGE[status].bg} ${STATUS_BADGE[status].text} ${STATUS_BADGE[status].ring}`}>
                                             Estado: {STATUS_BADGE[status].label}
                                          </span>
                                          <button
                                             onClick={() => setStatus(prev => prev === 'pendiente' ? 'asignada' : prev === 'asignada' ? 'en_ruta' : 'pendiente')}
                                             className="text-[11px] font-bold text-green-200 hover:text-white underline underline-offset-2"
                                             aria-label="Cambiar estado mock"
                                          >
                                             Simular cambio
                                          </button>
                                       </div>
                       </div>
                       <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-green-500 shadow-inner">
                          {taxisNeeded > 1 ? <Truck size={28} /> : <Car size={28} />}
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
                          <span className="font-bold">{taxisNeeded > 1 ? `${taxisNeeded} Taxis` : 'Taxi Estándar'}</span>
                       </div>
                       <div className="pt-2 text-xs text-gray-500 border-t border-gray-700 mt-3">
                          <p>💡 Tarifas reguladas saliendo desde Aeropuerto. Para otras rutas zona-a-zona contacta con operaciones.</p>
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