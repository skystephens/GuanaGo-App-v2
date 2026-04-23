
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Plus, Trash2, Download, Car, Bed, Anchor, Utensils, ArrowLeft, Save, PlusCircle, Calculator, ChevronRight, ChevronLeft, Info, X, Clock, Users, Minus, Loader2, ShoppingBag } from 'lucide-react';
import { api } from '../../services/api';
import { Tour } from '../../types';

interface SelectedActivity {
  instanceId: string;
  catalogId: string;
  date: string;
  type: string;
  description: string;
  netPrice: number;
  scaling: 'PER_PAX' | 'FIXED';
}

interface ItineraryProps {
  initialStartDate?: string;
  initialEndDate?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
}

const DynamicItineraryBuilder: React.FC<ItineraryProps> = ({
  initialStartDate,
  initialEndDate,
  initialAdults,
  initialChildren,
  initialInfants,
}) => {
  // Estado de Pasajeros con definiciones de edad solicitadas
  const [adults, setAdults] = useState(initialAdults ?? 2);
  const [children, setChildren] = useState(initialChildren ?? 0);
  const [infants, setInfants] = useState(initialInfants ?? 0);
  
  // Lógica de pago: Solo pagan adultos y niños
  const paxPaying = adults + children; 
  const paxTotal = adults + children + infants;
  const MARGIN = 1.20; // 20% de utilidad para la agencia

  // Catálogo Real desde Airtable (ServiciosTuristicos_SAI)
  const [catalog, setCatalog] = useState<Tour[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Fechas de Viaje
  const [startDate, setStartDate] = useState(() => {
    if (initialStartDate) return initialStartDate;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    if (initialEndDate) return initialEndDate;
    const d = new Date();
    d.setDate(d.getDate() + 11);
    return d.toISOString().split('T')[0];
  });
  const [dates, setDates] = useState<{raw: string, formatted: string}[]>([]);

  // Cargar Servicios al Montar
  useEffect(() => {
     const fetchServices = async () => {
        setLoadingCatalog(true);
        try {
           const data = await api.services.listPublic();
           setCatalog(data || []);
        } catch (e) {
           console.error("Error cargando servicios desde ServiciosTuristicos_SAI", e);
        } finally {
           setLoadingCatalog(false);
        }
     };
     fetchServices();
  }, []);

  // Generar lista de días sincronizada con la selección de fechas
  useEffect(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const dateArray: {raw: string, formatted: string}[] = [];
    let current = new Date(start);

    // Limitar a máximo 15 días para evitar colapso de UI
    let count = 0;
    while (current <= end && count < 15) {
      dateArray.push({
          raw: current.toISOString().split('T')[0],
          formatted: current.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      });
      current.setDate(current.getDate() + 1);
      count++;
    }
    setDates(dateArray);
  }, [startDate, endDate]);

  const [itinerary, setItinerary] = useState<SelectedActivity[]>([]);
  const [showCatalog, setShowCatalog] = useState<string | null>(null);

  const addActivity = (item: Tour, date: string) => {
    const newActivity: SelectedActivity = {
      instanceId: Math.random().toString(36).substr(2, 9),
      catalogId: item.id,
      date,
      type: item.category.toUpperCase(),
      description: item.title,
      netPrice: item.price,
      scaling: item.category === 'hotel' ? 'PER_PAX' : 'PER_PAX'
    };
    setItinerary([...itinerary, newActivity]);
    setShowCatalog(null);
  };

  const removeActivity = (instanceId: string) => {
    setItinerary(itinerary.filter(a => a.instanceId !== instanceId));
  };

  const calculateRowPVP = (act: SelectedActivity) => {
    // Transporte: se calcula por vehículo (1 taxi cada 4 personas totales)
    if (act.type === 'TAXI' || act.type === 'TRANSPORTE') {
        const taxisNeeded = Math.ceil(paxTotal / 4);
        return act.netPrice * taxisNeeded * MARGIN;
    }
    // Resto: solo pagan los Pax permitidos (> 4 años)
    return (act.netPrice * paxPaying) * MARGIN;
  };

  const totalPVP = useMemo(() => {
    return itinerary.reduce((acc, act) => acc + calculateRowPVP(act), 0);
  }, [itinerary, adults, children, infants]);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'TAXI': case 'TRANSPORTE': return <Car size={16} />;
      case 'HOTEL': case 'ALOJAMIENTO': return <Bed size={16} />;
      case 'TOUR': return <Anchor size={16} />;
      case 'PACKAGE': return <ShoppingBag size={16} />;
      default: return <PlusCircle size={16} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-64 font-sans overflow-x-hidden">
      <header className="px-6 pt-12 pb-6 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-emerald-600">Planificador Grupal</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Conectado a ServiciosTuristicos_SAI</p>
          </div>
          <button className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl border border-emerald-100 active:scale-95 transition-all">
            <Download size={20} />
          </button>
        </div>

        {/* 1. Selector de Pasajeros con Definiciones de Edad */}
        <div className="bg-gray-50 rounded-[24px] p-4 border border-gray-200 mb-4 shadow-inner">
           <div className="flex gap-3">
              <div className="flex-1 flex flex-col items-center">
                 <span className="text-[8px] font-black text-gray-800 uppercase mb-0.5">Adultos</span>
                 <span className="text-[7px] text-gray-400 font-bold mb-1">(&gt; 18 años)</span>
                 <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-full justify-between">
                    <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500"><Minus size={12}/></button>
                    <span className="text-xs font-black">{adults}</span>
                    <button onClick={() => setAdults(adults + 1)} className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:scale-110"><Plus size={12}/></button>
                 </div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <span className="text-[8px] font-black text-gray-800 uppercase mb-0.5">Niños</span>
                 <span className="text-[7px] text-gray-400 font-bold mb-1">(&gt; 4 años)</span>
                 <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-full justify-between">
                    <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500"><Minus size={12}/></button>
                    <span className="text-xs font-black">{children}</span>
                    <button onClick={() => setChildren(children + 1)} className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:scale-110"><Plus size={12}/></button>
                 </div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <span className="text-[8px] font-black text-gray-800 uppercase mb-0.5">Bebés</span>
                 <span className="text-[7px] text-gray-400 font-bold mb-1">(&lt; 4 años*)</span>
                 <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-full justify-between">
                    <button onClick={() => setInfants(Math.max(0, infants - 1))} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500"><Minus size={12}/></button>
                    <span className="text-xs font-black">{infants}</span>
                    <button onClick={() => setInfants(infants + 1)} className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:scale-110"><Plus size={12}/></button>
                 </div>
              </div>
           </div>
           <p className="text-[7px] text-gray-400 mt-2 italic text-center">*Los menores de 4 años no pagan servicios según política general.</p>
        </div>

        {/* 2. Selector de Fechas */}
        <div className="flex gap-3">
           <div className="flex-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Fecha Llegada</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold p-2.5 outline-none shadow-sm focus:border-emerald-500" />
           </div>
           <div className="flex-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Fecha Salida</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold p-2.5 outline-none shadow-sm focus:border-emerald-500" />
           </div>
        </div>
      </header>

      {/* HORIZONTAL DAYS SCROLL - Desplazamiento de Izquierda a Derecha */}
      <div className="px-4 py-8 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-20">
        {dates.map((dateObj, idx) => (
          <div key={dateObj.raw} className="snap-center shrink-0 w-[85vw] max-w-[320px]">
            <div className="bg-white rounded-[40px] p-7 shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col h-full min-h-[440px] relative overflow-hidden transition-transform active:scale-[0.99]">
              
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-[20px] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-100">
                       {idx + 1}
                    </div>
                    <div>
                       <h2 className="text-lg font-black text-gray-800 leading-none">{dateObj.formatted}</h2>
                       <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Actividades</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowCatalog(dateObj.raw)} 
                   className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                 >
                    <Plus size={24} />
                 </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-1">
                {itinerary.filter(a => a.date === dateObj.raw).length === 0 ? (
                   <div className="h-48 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-gray-300 gap-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Clock size={32} className="opacity-20" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[2px] text-center px-6 leading-tight">Añade servicios para este día</span>
                   </div>
                ) : (
                   itinerary.filter(a => a.date === dateObj.raw).map((act) => {
                     const rowTotal = calculateRowPVP(act);
                     return (
                       <div key={act.instanceId} className="bg-white p-4 rounded-3xl border border-gray-100 flex justify-between items-center animate-in zoom-in-95 group shadow-sm hover:shadow-md transition-all">
                         <div className="flex items-center gap-3 min-w-0">
                           <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                             {getTypeIcon(act.type)}
                           </div>
                           <div className="min-w-0">
                             <p className="font-black text-[11px] text-gray-800 truncate leading-tight">{act.description}</p>
                             <p className="text-[10px] text-emerald-600 font-black mt-1.5 flex items-center gap-1">
                                <Calculator size={10} /> ${rowTotal.toLocaleString()}
                             </p>
                           </div>
                         </div>
                         <button onClick={() => removeActivity(act.instanceId)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                           <Trash2 size={18} />
                         </button>
                       </div>
                     );
                   })
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center opacity-40">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Día {idx + 2} →</span>
                 <ChevronRight size={14} className="text-gray-400" />
              </div>
            </div>
          </div>
        ))}
        <div className="w-10 shrink-0"></div>
      </div>

      {/* FOOTER: Resumen de Presupuesto Grupal */}
      <div className="fixed bottom-[100px] left-0 right-0 z-40 max-w-md mx-auto px-6 pointer-events-none">
         <div className="pointer-events-auto bg-gray-900 rounded-[36px] p-7 shadow-2xl relative overflow-hidden text-white border border-white/10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="flex justify-between items-center relative z-10">
               <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[3px] mb-2">Presupuesto Estimado</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-black text-white">${totalPVP.toLocaleString()}</h2>
                    <span className="text-xs font-bold text-emerald-500">COP</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                     <span className="flex items-center gap-1 text-[9px] font-bold text-gray-300 bg-white/10 px-2 py-1 rounded-lg">
                        <Users size={10}/> {paxPaying} Pagantes
                     </span>
                     {infants > 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-orange-400 bg-white/10 px-2 py-1 rounded-lg">
                           {infants} Bebés libres
                        </span>
                     )}
                  </div>
               </div>
               <button className="bg-emerald-600 w-16 h-16 rounded-[24px] shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all flex items-center justify-center group">
                  <Save size={28} className="group-hover:scale-110 transition-transform" />
               </button>
            </div>
         </div>
      </div>

      {/* Catalog Modal - Filtra servicios reales de Airtable */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 bg-gray-50 flex justify-between items-center border-b border-gray-100">
              <div>
                 <h3 className="text-xl font-black text-gray-800">Directorio SAI</h3>
                 <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">Para el: {dates.find(d => d.raw === showCatalog)?.formatted}</p>
              </div>
              <button onClick={() => setShowCatalog(null)} className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-4 no-scrollbar">
              {loadingCatalog ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={40} className="animate-spin text-emerald-500" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando Airtable...</p>
                 </div>
              ) : catalog.length === 0 ? (
                 <div className="text-center py-20 text-gray-400">
                    <Info size={40} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">No se encontraron servicios.</p>
                 </div>
              ) : (
                catalog.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => addActivity(item, showCatalog)}
                    className="w-full bg-white p-5 rounded-[32px] border border-gray-100 hover:border-emerald-500 hover:shadow-lg flex items-center justify-between text-left transition-all active:scale-95 group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-50 rounded-[22px] flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner overflow-hidden">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.title}/> : getTypeIcon(item.category.toUpperCase())}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-800 truncate leading-tight mb-1">{item.title}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-emerald-600 font-black">
                              ${(item.price * MARGIN).toLocaleString()}
                           </span>
                           <span className="text-[8px] text-gray-400 font-bold uppercase bg-gray-100 px-1.5 py-0.5 rounded-md">
                              {item.category}
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                       <PlusCircle size={20} />
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
               <p className="text-[9px] text-center text-gray-400 font-medium italic">Tarifas con impuestos y gestión logística incluidos.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicItineraryBuilder;
