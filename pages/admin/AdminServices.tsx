
import React, { useState, useEffect } from 'react';
import { Search, Trash2, Power, Loader2, Package, Target, Plus, X, Save, Edit3, Tag, Trophy, Image as ImageIcon, Upload, ChevronDown, Calendar, Sparkles, Megaphone, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Tour, Campaign, AppRoute } from '../../types';
import { getFromCache, saveToCache } from '../../services/cacheService';

interface AdminServicesProps {
  onBack?: () => void;
  onNavigate?: (route: AppRoute) => void;
}

const AdminServices: React.FC<AdminServicesProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'services' | 'campaigns'>('services');

  // Services State
  const [services, setServices] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Service Edit State
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Tour | null>(null);
  const [serviceFormData, setServiceFormData] = useState<Partial<Tour>>({
     title: '', price: 0, description: '', image: '', gallery: [], category: 'tour'
  });

  // Campaigns State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<Partial<Campaign>>({
     title: '', type: 'mission', description: '', startDate: '', endDate: '', reward: '', active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (forceRefresh = false) => {
    // 1. Intentar cargar desde caché primero (instantáneo)
    if (!forceRefresh) {
      const cached = getFromCache<Tour[]>('services_turisticos');
      if (cached && cached.length > 0) {
        setServices(cached);
        setLoading(false);
        // Refrescar en background sin bloquear la UI
        refreshInBackground();
        const campaignsData = await api.campaigns.list();
        setCampaigns(campaignsData || []);
        return;
      }
    }

    // 2. Sin caché o forzando refresh: cargar desde Airtable
    setLoading(true);
    const [servicesData, campaignsData] = await Promise.all([
      api.services.listAll(),
      api.campaigns.list()
    ]);
    const svcs = servicesData || [];
    setServices(svcs);
    setCampaigns(campaignsData || []);
    // Guardar en caché para próximas visitas (válido 48h según cacheService)
    if (svcs.length > 0) saveToCache('services_turisticos', svcs);
    setLoading(false);
  };

  const refreshInBackground = async () => {
    setSyncing(true);
    try {
      const fresh = await api.services.listAll();
      if (fresh && fresh.length > 0) {
        setServices(fresh);
        saveToCache('services_turisticos', fresh);
      }
    } finally {
      setSyncing(false);
    }
  };

  // --- SERVICE LOGIC ---
  const handleServiceToggle = async (id: string, currentStatus: boolean) => {
     setServices(prev => prev.map(s => s.id === id ? {...s, active: !currentStatus} : s));
     await api.services.update(id, { active: !currentStatus });
  };

  const handleServiceDelete = async (id: string) => {
     if(window.confirm('¿Estás seguro de eliminar este servicio permanentemente?')) {
        setServices(prev => prev.filter(s => s.id !== id));
        await api.services.delete(id);
     }
  };

  const openServiceForm = (service: Tour) => {
      setEditingService(service);
      setServiceFormData({
          title: service.title,
          price: service.price,
          description: service.description || '',
          image: service.image,
          gallery: service.gallery || [],
          category: service.category || 'tour'
      });
      setShowServiceForm(true);
  };

  const handleServiceMainImageChange = () => {
     const randomId = Math.floor(Math.random() * 1000);
     setServiceFormData({ ...serviceFormData, image: `https://picsum.photos/id/${randomId}/800/600` });
  };

  const handleServiceAddGalleryImage = () => {
     const randomId = Math.floor(Math.random() * 1000);
     const newImage = `https://picsum.photos/id/${randomId}/800/600`;
     const currentGallery = serviceFormData.gallery || [];
     setServiceFormData({ ...serviceFormData, gallery: [...currentGallery, newImage] });
  };

  const handleServiceRemoveGalleryImage = (index: number) => {
     const currentGallery = serviceFormData.gallery || [];
     const newGallery = currentGallery.filter((_, i) => i !== index);
     setServiceFormData({ ...serviceFormData, gallery: newGallery });
  };

  const saveService = async () => {
      if (!editingService || !serviceFormData.title) return;
      await api.services.update(editingService.id, serviceFormData);
      setServices(prev => prev.map(s => 
          s.id === editingService.id ? { ...s, ...serviceFormData } as Tour : s
      ));
      setShowServiceForm(false);
      setEditingService(null);
  };

  // --- CAMPAIGN LOGIC ---
  const openCampaignForm = (campaign?: Campaign) => {
     if (campaign) {
        setEditingCampaign(campaign);
        setFormData(campaign);
     } else {
        setEditingCampaign(null);
        setFormData({ title: '', type: 'mission', description: '', startDate: '', endDate: '', reward: '', active: true });
     }
     setShowCampaignForm(true);
  };

  const saveCampaign = async () => {
     if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) return alert('Completa los campos obligatorios');
     
     if (editingCampaign) {
        await api.campaigns.update(editingCampaign.id, formData);
        setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? { ...c, ...formData } as Campaign : c));
     } else {
        await api.campaigns.create(formData as Campaign);
        const newCampaigns = await api.campaigns.list();
        setCampaigns(newCampaigns);
     }
     setShowCampaignForm(false);
  };

  const handleCampaignToggle = async (id: string, currentStatus: boolean) => {
      setCampaigns(prev => prev.map(c => c.id === id ? {...c, active: !currentStatus} : c));
      await api.campaigns.update(id, { active: !currentStatus });
  };

  const handleCampaignDelete = async (id: string) => {
      if(window.confirm('¿Eliminar campaña?')) {
         setCampaigns(prev => prev.filter(c => c.id !== id));
         await api.campaigns.delete(id);
      }
  };

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.ownerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans relative">
       <header className="px-6 pt-12 pb-4 bg-gray-900 sticky top-0 z-10 border-b border-gray-800/50">
          <div className="flex items-center gap-3 mb-6">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                aria-label="Volver"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
               <Megaphone size={24} />
            </div>
            <div className="flex-1 min-w-0">
               <h1 className="text-xl font-black">Centro de Gestión</h1>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Marketing e Inventario SAI</p>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={syncing || loading}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0 disabled:opacity-40"
              aria-label="Sincronizar"
              title="Forzar sync con Airtable"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin text-emerald-400' : ''} />
            </button>
          </div>
          
          {/* Tabs con mejor diseño visual */}
          <div className="flex bg-gray-800/50 rounded-[20px] p-1.5 mb-6 border border-gray-700/50">
             <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-300 ${
                   activeTab === 'services' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-500 hover:text-gray-300'
                }`}
             >
                <Package size={16} />
                PRODUCTOS
                {services.length > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'services' ? 'bg-white/20' : 'bg-gray-700'}`}>
                    {services.length}
                  </span>
                )}
             </button>
             <button 
                onClick={() => setActiveTab('campaigns')}
                className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-300 ${
                   activeTab === 'campaigns' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-500 hover:text-gray-300'
                }`}
             >
                <Sparkles size={16} />
                MARKETING
             </button>
          </div>

          {activeTab === 'services' && (
             <div className="relative">
               <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
               <input 
                  type="text" 
                  placeholder="Buscar tour, hotel o servicio..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800/50 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none border border-gray-700 focus:border-emerald-500 transition-all" 
               />
             </div>
          )}
          
          {activeTab === 'campaigns' && (
             <button 
               onClick={() => openCampaignForm()}
               className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 text-xs uppercase tracking-widest"
             >
                <Plus size={20} />
                Publicar Campaña
             </button>
          )}
       </header>

       <div className="px-6 py-6 space-y-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={32}/>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Cargando catálogo...</p>
             </div>
          ) : activeTab === 'services' ? (
             // --- SERVICES LIST ---
             filteredServices.length > 0 ? filteredServices.map((service) => (
                <div key={service.id} className="bg-gray-800/50 rounded-3xl p-4 border border-gray-700/50 flex items-center justify-between group hover:bg-gray-800 transition-all">
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className="relative">
                        <img src={service.image} alt={service.title} className="w-14 h-14 rounded-2xl object-cover bg-gray-700 shrink-0 border border-gray-700" />
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${service.active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      </div>
                      <div className="min-w-0">
                         <h3 className="font-bold text-sm truncate group-hover:text-emerald-400 transition-colors">{service.title}</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-emerald-500 font-black text-xs">${service.price}</span>
                            <span className="text-gray-600 text-[10px]">•</span>
                            <span className="text-gray-500 text-[9px] uppercase font-bold tracking-tighter">{service.category}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => openServiceForm(service)}
                        className="p-2.5 rounded-xl bg-gray-700/50 text-gray-400 hover:bg-emerald-600 hover:text-white transition-all"
                        title="Editar"
                      >
                         <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleServiceToggle(service.id, service.active)}
                        className={`p-2.5 rounded-xl transition-all ${service.active ? 'bg-emerald-900/30 text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white'}`}
                      >
                         <Power size={18} />
                      </button>
                      <button 
                        onClick={() => handleServiceDelete(service.id)}
                        className="p-2.5 rounded-xl bg-gray-700/50 text-gray-500 hover:bg-red-600 hover:text-white transition-all"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>
             )) : (
                <div className="text-center py-20 text-gray-600 flex flex-col items-center gap-3">
                    <Package size={48} className="opacity-10"/>
                    <p className="text-xs font-bold uppercase tracking-widest">No hay productos que coincidan</p>
                </div>
             )
          ) : (
             // --- CAMPAIGNS LIST (RETO, PROMO, DESCUENTO) ---
             campaigns.length === 0 ? (
                <div className="text-center py-20 text-gray-600 flex flex-col items-center gap-3">
                    <Sparkles size={48} className="opacity-10"/>
                    <p className="text-xs font-bold uppercase tracking-widest">Inicia tu primera campaña de marketing</p>
                </div>
             ) : (
               campaigns.map((camp) => (
                  <div key={camp.id} className="bg-gray-800/50 rounded-3xl p-5 border border-gray-700/50 hover:bg-gray-800 transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className={`p-2.5 rounded-2xl ${
                              camp.type === 'mission' ? 'bg-blue-900/50 text-blue-400' :
                              camp.type === 'discount' ? 'bg-orange-900/50 text-orange-400' : 'bg-purple-900/50 text-purple-400'
                           }`}>
                              {camp.type === 'mission' ? <Target size={20}/> : camp.type === 'discount' ? <Tag size={20}/> : <Sparkles size={20}/>}
                           </div>
                           <div>
                              <h3 className="font-bold text-sm leading-tight">{camp.title}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{camp.type === 'mission' ? 'Reto/Misión' : camp.type === 'discount' ? 'Descuento' : 'Promoción'}</span>
                                 <div className={`w-1.5 h-1.5 rounded-full ${camp.active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-1.5">
                            <button 
                              onClick={() => openCampaignForm(camp)}
                              className="p-2 bg-gray-700/50 rounded-xl text-gray-400 hover:text-white hover:bg-emerald-600 transition-all"
                           >
                              <Edit3 size={16} />
                           </button>
                           <button 
                              onClick={() => handleCampaignToggle(camp.id, camp.active)}
                              className={`p-2 rounded-xl transition-all ${camp.active ? 'bg-emerald-900/30 text-emerald-500' : 'bg-red-900/30 text-red-500'}`}
                           >
                              <Power size={16} />
                           </button>
                           <button 
                              onClick={() => handleCampaignDelete(camp.id)}
                              className="p-2 bg-gray-700/50 rounded-xl text-gray-500 hover:text-red-500"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                     <p className="text-xs text-gray-500 leading-relaxed mb-4 font-medium">{camp.description}</p>
                     <div className="flex items-center justify-between text-[10px] bg-gray-900/50 p-3 rounded-2xl border border-gray-700/30">
                        <span className="text-gray-400 flex items-center gap-2 font-bold uppercase">
                           <Calendar size={14} className="text-emerald-500"/> {camp.startDate} <span className="text-gray-700">|</span> {camp.endDate}
                        </span>
                        <div className="flex items-center gap-1.5 text-emerald-400 font-black uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-xl">
                           <Trophy size={12}/> {camp.reward}
                        </div>
                     </div>
                  </div>
               ))
             )
          )}
       </div>

       {/* Campaigns Create/Edit Modal */}
       {showCampaignForm && (
          <div className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-xl p-6 flex items-center justify-center animate-in fade-in">
             <div className="bg-gray-900 w-full max-w-sm rounded-[40px] border border-gray-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-10">
                   <h3 className="font-black uppercase text-xs tracking-[2px]">{editingCampaign ? 'Ajustar Campaña' : 'Nueva Publicación'}</h3>
                   <button onClick={() => setShowCampaignForm(false)} className="p-2 bg-gray-800 rounded-full text-gray-400"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                   <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Título del Reto/Oferta</label>
                      <input 
                        className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        placeholder="Ej. Descuento del 20% en Snorkel"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Tipo de Acción</label>
                      <div className="relative">
                        <select 
                           className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-emerald-500 appearance-none text-white shadow-inner"
                           value={formData.type}
                           onChange={e => setFormData({...formData, type: e.target.value as any})}
                        >
                           <option value="mission">Reto o Misión (Gamificación)</option>
                           <option value="discount">Cupón de Descuento</option>
                           <option value="contest">Concurso / Sorteo</option>
                           <option value="promotion">Promoción Temporal</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Detalles de la Campaña</label>
                      <textarea 
                        className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all resize-none h-28 shadow-inner"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Explica a los turistas cómo participar..."
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Fecha Inicio</label>
                        <input 
                           type="date"
                           className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-[11px] font-bold focus:outline-none focus:border-emerald-500 text-white shadow-inner"
                           value={formData.startDate}
                           onChange={e => setFormData({...formData, startDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Fecha Fin</label>
                        <input 
                           type="date"
                           className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-[11px] font-bold focus:outline-none focus:border-emerald-500 text-white shadow-inner"
                           value={formData.endDate}
                           onChange={e => setFormData({...formData, endDate: e.target.value})}
                        />
                      </div>
                   </div>

                   <div>
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Recompensa (Puntos/Regalo)</label>
                     <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-2xl p-4 focus-within:border-emerald-500 transition-all shadow-inner">
                        <Trophy size={18} className="text-emerald-500" />
                        <input 
                           className="w-full bg-transparent border-none text-sm font-black focus:outline-none placeholder-gray-600"
                           value={formData.reward}
                           onChange={e => setFormData({...formData, reward: e.target.value})}
                           placeholder="Ej. +150 $GUANA"
                        />
                     </div>
                   </div>
                   
                   <button 
                     onClick={saveCampaign}
                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[24px] mt-4 flex items-center justify-center gap-3 shadow-2xl shadow-emerald-900/40 uppercase text-xs tracking-widest active:scale-95 transition-all"
                   >
                      <CheckCircle2 size={20} /> Publicar Ahora
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* Services Edit Modal (Admin Style) */}
       {showServiceForm && (
          <div className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-xl p-6 flex items-center justify-center animate-in fade-in">
             <div className="bg-gray-900 w-full max-w-sm rounded-[40px] border border-gray-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-10">
                   <h3 className="font-black uppercase text-xs tracking-[2px]">Supervisión de Producto</h3>
                   <button onClick={() => setShowServiceForm(false)} className="p-2 bg-gray-800 rounded-full text-gray-400"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                   
                   <div className="relative h-44 rounded-3xl overflow-hidden bg-gray-800 border border-gray-700 group shadow-inner">
                      {serviceFormData.image ? (
                         <>
                           <img src={serviceFormData.image} alt="Main" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={handleServiceMainImageChange} className="bg-white text-gray-900 px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2">
                                 <Upload size={16} /> Cambiar Foto
                              </button>
                           </div>
                         </>
                      ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer" onClick={handleServiceMainImageChange}>
                           <ImageIcon size={32} className="mb-2 opacity-20" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Añadir Imagen</span>
                        </div>
                      )}
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Título del Producto</label>
                      <input 
                        className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                        value={serviceFormData.title}
                        onChange={e => setServiceFormData({...serviceFormData, title: e.target.value})}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Categoría</label>
                         <div className="relative">
                           <select
                              value={serviceFormData.category}
                              onChange={(e) => setServiceFormData({...serviceFormData, category: e.target.value as any})}
                              className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-[10px] font-black focus:outline-none focus:border-emerald-500 appearance-none text-white shadow-inner uppercase"
                           >
                              <option value="tour">Tour</option>
                              <option value="hotel">Alojamiento</option>
                              <option value="package">Paquete</option>
                              <option value="taxi">Transporte</option>
                              <option value="handicraft">Tienda</option>
                           </select>
                           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Precio USD</label>
                         <input 
                           type="number"
                           className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm font-black focus:outline-none focus:border-emerald-500 text-emerald-500 shadow-inner"
                           value={serviceFormData.price}
                           onChange={e => setServiceFormData({...serviceFormData, price: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Descripción de la Experiencia</label>
                      <textarea 
                        className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all resize-none h-32 shadow-inner"
                        value={serviceFormData.description}
                        onChange={e => setServiceFormData({...serviceFormData, description: e.target.value})}
                      />
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block px-1">Galería Extendida</label>
                      <div className="grid grid-cols-4 gap-2">
                         {serviceFormData.gallery?.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-800 group">
                               <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                               <button 
                                  onClick={() => handleServiceRemoveGalleryImage(idx)}
                                  className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                  <X size={10} />
                               </button>
                            </div>
                         ))}
                         <button 
                            onClick={handleServiceAddGalleryImage}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-gray-700 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-gray-800/50 shadow-inner"
                         >
                            <Plus size={20} />
                         </button>
                      </div>
                   </div>
                   
                   <button 
                     onClick={saveService}
                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[24px] mt-4 flex items-center justify-center gap-3 shadow-2xl shadow-emerald-900/40 uppercase text-xs tracking-widest active:scale-95 transition-all"
                   >
                      <Save size={20} /> Guardar Cambios
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default AdminServices;
