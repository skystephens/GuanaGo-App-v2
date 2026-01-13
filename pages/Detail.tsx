
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Star, MapPin, CheckCircle, ShoppingCart, Minus, Plus, Calendar, Clock, Loader2, AlertTriangle, XCircle, X, Maximize2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { HOTEL_DATA, AMENITY_ICONS } from '../constants';
import { AppRoute, Package, Hotel, Tour } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

interface DetailProps {
  type: 'hotel' | 'tour' | 'package';
  data?: any;
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const Detail: React.FC<DetailProps> = ({ type, data: propData, onBack, onNavigate }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1); 
  const [nights, setNights] = useState(1); 
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('08:00 AM');
  const [added, setAdded] = useState(false);
  
  const [showLightbox, setShowLightbox] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<number | null>(null);
  const [isDateBlocked, setIsDateBlocked] = useState(false);

  const data = propData || HOTEL_DATA;
  const gallery = data.gallery || [data.image];

  useEffect(() => {
     const tomorrow = new Date();
     tomorrow.setDate(tomorrow.getDate() + 1);
     const dateStr = tomorrow.toISOString().split('T')[0];
     setSelectedDate(dateStr);
     validateInventory(dateStr);
  }, [data.id]);

  const validateInventory = async (date: string) => {
    if (!date || !data.id) return;
    setCheckingAvailability(true);
    try {
      const res = await api.inventory.checkAvailability(data.id, date);
      setAvailableSlots(res.available);
      setIsDateBlocked(res.isBlocked);
    } catch (e) {
      setAvailableSlots(10); 
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    validateInventory(newDate);
  };
  
  const isHotel = type === 'hotel';
  const hotel = data as Hotel;
  const maxAllowed = availableSlots !== null ? availableSlots : (isHotel && hotel.maxGuests ? hotel.maxGuests : 10);
  
  const isExceeding = quantity > maxAllowed && !isDateBlocked && availableSlots !== 0;
  const isUnavailable = isDateBlocked || (availableSlots !== null && availableSlots <= 0);

  const handleIncrement = () => setQuantity(prev => Math.min(prev + 1, isHotel ? (hotel.maxGuests || 10) : 20));
  const handleDecrement = () => setQuantity(prev => Math.max(prev - 1, 1));
  
  const handleNightIncrement = () => setNights(prev => Math.min(prev + 1, 30));
  const handleNightDecrement = () => setNights(prev => Math.max(prev - 1, 1));

  let totalPrice = 0;
  let unitPriceDisplay = 0;

  if (isHotel && hotel.pricePerNight) {
     const pricePerNightForPax = hotel.pricePerNight[quantity] || hotel.pricePerNight[Object.keys(hotel.pricePerNight).length] || data.price;
     unitPriceDisplay = pricePerNightForPax;
     totalPrice = pricePerNightForPax * nights;
  } else {
     unitPriceDisplay = data.price;
     totalPrice = data.price * quantity;
  }

  const handleAddToCart = () => {
    if (isExceeding || isUnavailable) return;
    const priceOverride = isHotel ? totalPrice : undefined;
    addToCart(data, quantity, selectedDate, selectedTime, isHotel ? nights : undefined, priceOverride);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000); 
  };

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setShowLightbox(true);
  };

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  // Usar horarios de Airtable si existen, sino usar defaults
  const parseTimeSlots = (schedule: string): string[] => {
    if (!schedule) return ['08:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'];
    // Intentar parsear horarios del formato "8:00 AM - 5:00 PM" o similar
    const matches = schedule.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/g);
    if (matches && matches.length > 0) return matches;
    return ['08:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'];
  };
  
  const timeSlots = parseTimeSlots(data.schedule || data.horario || data.operatingHours || '');

  return (
    <div className="bg-gray-50 min-h-screen relative pb-64 font-sans overflow-x-hidden">
      {/* Header Image Section - Modern Floating Look */}
      <div className="relative px-4 pt-4">
        <div className="relative h-[400px] w-full rounded-[40px] overflow-hidden shadow-2xl">
          <img 
            src={gallery[0]} 
            alt={data.title} 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110 cursor-pointer"
            onClick={() => openLightbox(0)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
            <button onClick={onBack} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white active:scale-95 transition-all"><ArrowLeft size={22} className="text-gray-900" /></button>
            <div className="flex gap-3">
               <button className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white active:scale-95 transition-all"><Share2 size={20} className="text-gray-900" /></button>
            </div>
          </div>

          <div className="absolute bottom-6 right-6">
            <button 
              onClick={() => openLightbox(0)}
              className="bg-black/60 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-[11px] font-bold flex items-center gap-2 border border-white/20 shadow-lg"
            >
              <Maximize2 size={14} /> Ver {gallery.length} fotos
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pt-10">
        {/* Title & Stats Section */}
        <div className="mb-8">
           <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${data.isRaizal ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                 {data.isRaizal ? 'Experiencia Raizal' : 'Turismo Premium'}
              </span>
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                <Star size={12} className="text-yellow-500 fill-current" />
                <span className="font-black text-[11px] text-yellow-700">{data.rating}</span>
                <span className="text-[10px] text-yellow-600/60 font-medium">({data.reviews})</span>
              </div>
           </div>
           
           <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">{data.title}</h1>
           
           <div className="flex items-start gap-2.5 text-gray-500 mb-6">
              <div className="mt-0.5 bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{data.isla || data.ubicacion || 'San Andrés Isla, Colombia'}</p>
                <p className="text-[10px] text-gray-400 mt-1">La ubicación exacta se mostrará tras confirmar tu reserva</p>
              </div>
           </div>

           <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Precio actual</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-600">${unitPriceDisplay.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{isHotel ? `por noche` : 'por persona'}</span>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-emerald-500 uppercase flex items-center justify-end gap-1"><ShieldCheck size={10}/> Mejor precio</p>
                 <p className="text-[10px] text-gray-400 font-medium italic mt-1">Impuestos incluidos</p>
              </div>
           </div>
        </div>

        {/* Gallery Thumbnails - 4 fotos pequeñas */}
        {gallery.length > 1 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Galería</h3>
             <button onClick={() => openLightbox(0)} className="text-[10px] font-bold text-emerald-600">Ver todas ({gallery.length})</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
             {gallery.slice(1, 5).map((img: string, idx: number) => (
                <div 
                   key={idx} 
                   onClick={() => openLightbox(idx + 1)}
                   className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95"
                >
                   <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} />
                   {idx === 3 && gallery.length > 5 && (
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                       <span className="text-white font-bold text-sm">+{gallery.length - 5}</span>
                     </div>
                   )}
                </div>
             ))}
          </div>
        </div>
        )}

        {/* Info Box / Booking Details */}
        <div className="mb-10 space-y-4">
           <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                   <Calendar size={20} className="text-emerald-500" /> Planifica tu visita
                </h3>
                {checkingAvailability && <Loader2 size={18} className="animate-spin text-emerald-500" />}
              </div>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Fecha de salida</label>
                    <input 
                       type="date" 
                       value={selectedDate}
                       onChange={handleDateChange}
                       className={`w-full bg-gray-50 border-2 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all ${isUnavailable ? 'border-red-100 bg-red-50 text-red-500' : 'border-transparent focus:border-emerald-500 focus:bg-white shadow-inner'}`}
                    />
                    
                    {!checkingAvailability && (
                      <div className="mt-3 px-1">
                        {isUnavailable ? (
                          <div className="flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded-xl border border-red-100">
                             <XCircle size={14} />
                             <p className="text-[10px] font-bold leading-tight">Sin disponibilidad para este día.</p>
                          </div>
                        ) : availableSlots !== null && availableSlots <= 5 ? (
                          <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded-xl border border-orange-100">
                             <AlertTriangle size={14} />
                             <p className="text-[10px] font-bold leading-tight">¡Quedan pocos cupos ({availableSlots})!</p>
                          </div>
                        ) : availableSlots !== null && (
                           <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                              <CheckCircle size={14} />
                              <p className="text-[10px] font-bold leading-tight">Confirmado: Hay disponibilidad.</p>
                           </div>
                        )}
                      </div>
                    )}
                 </div>

                 {!isHotel && (
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Horarios Disponibles</label>
                       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                          {timeSlots.map(time => (
                             <button 
                                key={time} 
                                onClick={() => setSelectedTime(time)} 
                                className={`px-6 py-4 rounded-2xl text-xs font-black border-2 transition-all shrink-0 ${selectedTime === time ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-white hover:border-gray-200'}`}
                             >
                                {time}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* About Section */}
           <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">La Experiencia</h3>
             
             {/* Categoría de actividad */}
             {(data.categoriaActividad || data.activityCategory || (data.tags && data.tags.length > 0)) && (
               <div className="flex flex-wrap gap-2 mb-4">
                 {(Array.isArray(data.tags) ? data.tags : [data.categoriaActividad || data.activityCategory]).filter(Boolean).map((tag: string, idx: number) => (
                   <span key={idx} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                     {tag}
                   </span>
                 ))}
               </div>
             )}
             
             <p className="text-gray-500 leading-relaxed text-sm font-medium mb-6">{data.description}</p>
             
             {/* Información del servicio */}
             <div className="grid grid-cols-2 gap-4 mb-6">
               {/* Duración */}
               {data.duration && (
                 <div className="bg-gray-50 rounded-2xl p-4">
                   <div className="flex items-center gap-2 mb-1">
                     <Clock size={14} className="text-emerald-600" />
                     <span className="text-[10px] font-black text-gray-400 uppercase">Duración</span>
                   </div>
                   <p className="text-sm font-bold text-gray-800">{data.duration}</p>
                 </div>
               )}
               
               {/* Días de operación */}
               {(data.diasOperacion || data.operatingDays) && (
                 <div className="bg-gray-50 rounded-2xl p-4">
                   <div className="flex items-center gap-2 mb-1">
                     <Calendar size={14} className="text-emerald-600" />
                     <span className="text-[10px] font-black text-gray-400 uppercase">Días</span>
                   </div>
                   <p className="text-sm font-bold text-gray-800">{data.diasOperacion || data.operatingDays}</p>
                 </div>
               )}
               
               {/* Horarios de operación */}
               {(data.horario || data.schedule || data.operatingHours) && (
                 <div className="bg-gray-50 rounded-2xl p-4 col-span-2">
                   <div className="flex items-center gap-2 mb-1">
                     <Clock size={14} className="text-emerald-600" />
                     <span className="text-[10px] font-black text-gray-400 uppercase">Horarios de Operación</span>
                   </div>
                   <p className="text-sm font-bold text-gray-800">{data.horario || data.schedule || data.operatingHours}</p>
                 </div>
               )}
             </div>
             
             {/* Qué incluye */}
             {(data.incluye || data.includes) && (
               <div className="mb-6">
                 <h4 className="text-xs font-black text-gray-600 uppercase mb-3 flex items-center gap-2">
                   <CheckCircle size={14} className="text-emerald-500" />
                   Qué Incluye
                 </h4>
                 <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                   <p className="text-sm text-emerald-800 font-medium leading-relaxed whitespace-pre-line">{data.incluye || data.includes}</p>
                 </div>
               </div>
             )}
             
             {/* Cancelación */}
             <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={20} />
                   </div>
                   <div>
                     <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter block">Cancelación Gratis</span>
                     <span className="text-[9px] text-gray-400">Máximo 24 horas antes de la hora de realización</span>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Footer / Cart Action - Refined Floating Bar */}
      <div className="fixed bottom-[94px] left-0 right-0 bg-white/80 backdrop-blur-2xl p-5 border-t border-gray-100 max-w-md mx-auto w-full z-40 flex flex-col gap-4 shadow-[0_-15px_50px_rgba(0,0,0,0.08)] rounded-t-[48px]">
        <div className="flex gap-4">
             <div className="flex-1">
                <div className="flex items-center bg-gray-100/50 rounded-2xl p-1.5 h-16 justify-between border border-gray-200/50">
                   <button onClick={handleDecrement} className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-emerald-600 active:scale-90 transition-all"><Minus size={18} /></button>
                   <div className="flex flex-col items-center">
                      <span className="font-black text-gray-900 text-base leading-none">{quantity}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{isHotel ? 'Huéspedes' : 'Viajeros'}</span>
                   </div>
                   <button onClick={handleIncrement} className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-emerald-600 active:scale-90 transition-all"><Plus size={18} /></button>
                </div>
             </div>
             {isHotel && (
                <div className="flex-1">
                   <div className="flex items-center bg-gray-100/50 rounded-2xl p-1.5 h-16 justify-between border border-gray-200/50">
                      <button onClick={handleNightDecrement} className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-emerald-600 active:scale-90 transition-all"><Minus size={18} /></button>
                      <div className="flex flex-col items-center">
                         <span className="font-black text-gray-900 text-base leading-none">{nights}</span>
                         <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Noches</span>
                      </div>
                      <button onClick={handleNightIncrement} className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-emerald-600 active:scale-90 transition-all"><Plus size={18} /></button>
                   </div>
                </div>
             )}
        </div>

        <button 
          onClick={handleAddToCart}
          disabled={added || isExceeding || isUnavailable || checkingAvailability}
          className={`w-full font-black py-5 rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[2px]
             ${isUnavailable || isExceeding || checkingAvailability
               ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-100' 
               : added 
                 ? 'bg-gray-900 text-white' 
                 : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50 active:scale-95'
             }
          `}
        >
          {checkingAvailability ? (
             <><Loader2 size={18} className="animate-spin" /> <span>Validando...</span></>
          ) : added ? (
             <><CheckCircle size={18} /><span>Añadido al Carrito</span></>
          ) : isUnavailable ? (
             <span>Agotado para hoy</span>
          ) : isExceeding ? (
             <span>Cupos Insuficientes</span>
          ) : (
             <><ShoppingCart size={18} /><span>Reservar • ${totalPrice.toLocaleString()}</span></>
          )}
        </button>
      </div>

      {/* Lightbox / Full Visor */}
      {showLightbox && (
         <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500">
            <div className="p-6 pt-14 flex justify-between items-center text-white relative z-10">
               <span className="font-black text-xs uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">{activeImageIndex + 1} / {gallery.length}</span>
               <button onClick={() => setShowLightbox(false)} className="p-3 bg-white/10 rounded-2xl backdrop-blur-md hover:bg-white/20 transition-colors">
                  <X size={24} />
               </button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center p-4">
               <button onClick={prevImage} className="absolute left-4 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white backdrop-blur-sm hover:bg-white/20 z-10">
                  <ChevronLeft size={28} />
               </button>
               
               <img 
                  src={gallery[activeImageIndex]} 
                  className="max-w-full max-h-[70vh] object-cover rounded-[40px] shadow-2xl border border-white/10" 
                  alt="Full view" 
               />

               <button onClick={nextImage} className="absolute right-4 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white backdrop-blur-sm hover:bg-white/20 z-10">
                  <ChevronRight size={28} />
               </button>
            </div>

            <div className="p-8 pb-14 flex gap-3 overflow-x-auto no-scrollbar justify-center">
               {gallery.map((img: string, idx: number) => (
                  <button 
                     key={idx} 
                     onClick={() => setActiveImageIndex(idx)}
                     className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === idx ? 'border-emerald-500 scale-110 shadow-xl' : 'border-transparent opacity-40'}`}
                  >
                     <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                  </button>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

export default Detail;
