
import React, { useEffect, useState } from 'react';
import { User, Settings, Award, Lock, ChevronRight, LogOut, CheckCircle, Shield, Target, Tag, Trophy, Phone, MapPin, LogIn, MessageCircle, Briefcase, Mail, CreditCard, Globe, Building, X, Save, ShieldCheck, Copy, ExternalLink, Calendar, Users, LayoutDashboard, Eye, Key } from 'lucide-react';
import { BADGES, PARTNER_CLIENTS } from '../constants';
import { UserRole, Campaign, Client, AppRoute } from '../types';
import { api } from '../services/api';
import ChatWindow from '../components/ChatWindow';

interface ProfileProps {
  role: UserRole;
  isAuthenticated: boolean;
  onLogin: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  onNavigate: (route: AppRoute) => void;
  onBack?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ role, isAuthenticated, onLogin, onSwitchRole, onLogout, onNavigate, onBack }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Detectar si es admin (incluye 'admin' y 'SuperAdmin')
  const isAdmin = role === 'admin' || role === 'SuperAdmin';
  
  // Obtener datos del admin desde localStorage si está autenticado
  const getAdminData = () => {
    try {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.user || null;
      }
    } catch (e) {
      console.error('Error parsing admin session:', e);
    }
    return null;
  };

  const adminData = getAdminData();

  const initialUser: Client = role === 'partner' 
      ? PARTNER_CLIENTS.find(c => c.id === 'partner-1')! 
      : (isAdmin
          ? { 
              id: adminData?.id || 'admin', 
              name: adminData?.nombre || 'Super Admin', 
              email: adminData?.email || 'admin@guanago.travel', 
              role: 'admin', 
              image: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminData?.nombre || 'Admin')}&background=8B5CF6&color=fff&bold=true`, 
              status: 'active', 
              walletBalance: 0, 
              reservations: 0 
            } as Client
          : PARTNER_CLIENTS.find(c => c.id === 'c1')!);

  const [currentUser, setCurrentUser] = useState<Client>(initialUser);
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    const adminInfo = getAdminData();
    const newUser = role === 'partner' 
      ? PARTNER_CLIENTS.find(c => c.id === 'partner-1')! 
      : (isAdmin 
          ? { 
              id: adminInfo?.id || 'admin', 
              name: adminInfo?.nombre || 'Super Admin', 
              email: adminInfo?.email || 'admin@guanago.travel', 
              role: 'admin', 
              image: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminInfo?.nombre || 'Admin')}&background=8B5CF6&color=fff&bold=true`, 
              status: 'active', 
              walletBalance: 0, 
              reservations: 0 
            } as Client
          : PARTNER_CLIENTS.find(c => c.id === 'c1')!);
    setCurrentUser(newUser);
  }, [role, isAdmin]);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const adminUser = {
    id: 'admin',
    name: 'Soporte GuanaGo',
    role: 'admin',
    image: 'https://ui-avatars.com/api/?name=Soporte+Guana&background=10B981&color=fff'
  };

  useEffect(() => {
     if (role === 'tourist' && isAuthenticated) {
        const fetchCampaigns = async () => {
           const data = await api.campaigns.list();
           setCampaigns(data.filter(c => c.active));
           setLoadingCampaigns(false);
        };
        fetchCampaigns();
     }
  }, [role, isAuthenticated]);
  
  const handleRegister = (e: React.FormEvent) => {
     e.preventDefault();
     if(guestName && guestPhone) {
        onLogin();
     }
  };

  const openSettings = () => {
      setFormData({ ...currentUser });
      setShowSettings(true);
  };

  const saveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      setCurrentUser(prev => ({ ...prev, ...formData }));
      setShowSettings(false);
  };

  const getRoleLabel = () => {
    if (role === 'tourist') return 'Explorador Raizal';
    if (role === 'partner') return 'Operador Verificado';
    if (role === 'SuperAdmin' || role === 'admin') return 'Super Administrador';
    return 'Usuario';
  };

  const isDark = role !== 'tourist';

  // Handler para cerrar sesión admin y volver al lobby
  const handleAdminLogout = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_authenticated');
    onLogout();
  };

  // Handler para explorar como turista (sin cerrar sesión admin)
  const handleExploreAsTourist = () => {
    onSwitchRole('tourist');
  };

  // Handler para explorar como local
  const handleExploreAsLocal = () => {
    onSwitchRole('Local' as UserRole);
  };

  // Handler para cambiar contraseña (mock)
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    // TODO: Implementar cambio de contraseña en backend
    alert('Contraseña actualizada exitosamente');
    setShowChangePassword(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  // --- VISTA GUEST (No Autenticado) ---
  if (role === 'tourist' && !isAuthenticated) {
     return (
        <div className="bg-white min-h-screen pb-24 font-sans flex flex-col justify-center px-8 relative animate-in fade-in">
           {/* Back Button */}
           {onBack && (
             <button 
               onClick={onBack}
               className="absolute top-8 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
               title="Volver"
             >
               <X size={24} />
             </button>
           )}
           <div className="mb-10 text-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 border-2 border-emerald-100 shadow-sm">
                 <User size={40} />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">¡Hola, Viajero!</h1>
              <p className="text-gray-500 text-sm leading-relaxed px-4">
                Inicia sesión para gestionar tus reservas, ver tu <span className="text-emerald-600 font-bold">itinerario</span> y acumular puntos.
              </p>
           </div>

           <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Tu Nombre</label>
                 <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-sm">
                    <User size={18} className="text-gray-400" />
                    <input 
                       type="text" 
                       placeholder="Ej. Mateo Vargas"
                       value={guestName}
                       onChange={e => setGuestName(e.target.value)}
                       className="bg-transparent border-none outline-none w-full text-sm font-bold text-gray-900 placeholder-gray-300"
                       required
                    />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">WhatsApp</label>
                 <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-sm">
                    <Phone size={18} className="text-gray-400" />
                    <input 
                       type="tel" 
                       placeholder="+57 300 000 0000"
                       value={guestPhone}
                       onChange={e => setGuestPhone(e.target.value)}
                       className="bg-transparent border-none outline-none w-full text-sm font-bold text-gray-900 placeholder-gray-300"
                       required
                    />
                 </div>
              </div>

              <div className="pt-6 space-y-4">
                 <button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
                 >
                    Empezar mi Viaje
                 </button>
                 
                 <button 
                    type="button"
                    onClick={onLogin} 
                    className="w-full bg-white border-2 border-gray-50 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                 >
                    <LogIn size={18} />
                    Ya tengo cuenta
                 </button>
              </div>
           </form>
           
           <div className="mt-14 pt-8 border-t border-gray-100 text-center">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-6">Zona de Gestión</h3>
              <div className="flex gap-3">
                 <button 
                   onClick={() => onSwitchRole('partner')} 
                   className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 p-4 rounded-2xl transition-all border border-blue-100 flex flex-col items-center gap-2 group active:scale-95"
                 >
                    <Briefcase size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Socio / Operador</span>
                 </button>
                 <button 
                   onClick={() => onSwitchRole('admin')} 
                   className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 p-4 rounded-2xl transition-all border border-purple-100 flex flex-col items-center gap-2 group active:scale-95"
                 >
                    <Shield size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Panel Admin</span>
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // --- VISTA DASHBOARD (Usuario Autenticado) ---
  return (
    <div className={`${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen pb-32 font-sans`}>
      {/* Header Premium */}
      <div className={`${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white shadow-sm'} p-6 pb-12 rounded-b-[48px] relative overflow-hidden`}>
         <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
         
         <div className="flex justify-between items-center mb-8 relative z-10">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
               role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
               role === 'partner' ? 'bg-blue-50 text-blue-600 border-blue-100' :
               'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
               {getRoleLabel()}
            </div>
            
            <div className="flex gap-2">
               {/* Role Switch Shortcut for Authenticated Staff */}
               {isDark && (
                  <button 
                     onClick={() => onSwitchRole(role === 'admin' ? 'partner' : 'admin')}
                     className="p-2 bg-gray-700/50 rounded-full text-gray-400 hover:text-white transition-colors"
                     title="Cambiar área de gestión"
                  >
                     <LayoutDashboard size={20} />
                  </button>
               )}
               <button 
                  onClick={() => onSwitchRole('tourist')}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                  title="Volver a modo Turista"
               >
                  <User size={20} />
               </button>
            </div>
         </div>

         <div className="flex items-center gap-6 relative z-10">
            <div className={`w-24 h-24 rounded-3xl border-4 shadow-2xl overflow-hidden ${isDark ? 'border-gray-700 bg-gray-600' : 'border-white bg-emerald-100 shadow-emerald-100/50'}`}>
              <img src={currentUser?.image || "https://i.pravatar.cc/300?img=11"} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
               <h2 className="text-2xl font-black leading-tight">{currentUser?.name || "Viajero"}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <Mail size={14} className="text-gray-400" />
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{currentUser?.email}</p>
               </div>
               
               <div className="mt-3 flex items-center gap-2">
                  <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                     <Trophy size={14} className="fill-current" />
                     <span className="text-[10px] font-black uppercase">Nivel 4</span>
                  </div>
                  {isAdmin && (
                    <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl flex items-center gap-1.5">
                       <ShieldCheck size={14} />
                       <span className="text-[10px] font-black uppercase">Root Access</span>
                    </div>
                  )}
               </div>
            </div>
         </div>

         <div className="absolute -bottom-8 left-6 right-6 bg-emerald-600 rounded-3xl p-6 shadow-xl shadow-emerald-100 text-white flex justify-between items-center">
            <div>
               <p className="text-[9px] font-black uppercase tracking-[2px] text-emerald-200">Saldo Disponible</p>
               <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black">{currentUser.walletBalance.toLocaleString()}</h3>
                  <span className="text-sm font-bold text-emerald-200">$GUANA</span>
               </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
               <Award size={28} />
            </div>
         </div>
      </div>

      <div className="px-6 mt-16 space-y-8">
         {/* ITINERARY BUTTON: Visible solo para turistas autenticados */}
         {role === 'tourist' && (
            <button 
               onClick={() => onNavigate(AppRoute.MY_ITINERARY)}
               className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                     <Calendar size={28} />
                  </div>
                  <div className="text-left">
                     <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-1">Mi Itinerario Real</h3>
                     <p className="text-[10px] text-gray-400 font-bold leading-tight">Consulta tus reservas confirmadas y vouchers QR de viaje.</p>
                  </div>
               </div>
               <ChevronRight size={20} className="text-gray-300" />
            </button>
         )}

         {/* HEDERA TRANSPARENCY SECTION */}
         <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'} rounded-[32px] p-6 border`}>
            <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
               <ShieldCheck size={16} className="text-emerald-500" /> Transparencia Blockchain
            </h3>
            <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-2xl p-4 flex flex-col gap-3`}>
               <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Tu Hedera Account ID</label>
                  <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} flex items-center justify-between border px-3 py-2 rounded-xl`}>
                     <span className={`text-xs font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>0.0.344592@164..</span>
                     <div className="flex gap-2">
                        <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Copy size={14}/></button>
                        <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><ExternalLink size={14}/></button>
                     </div>
                  </div>
               </div>
               <p className="text-[9px] text-gray-400 leading-relaxed italic">
                  Tus reservas están notarizadas en el Ledger de Hedera para tu seguridad.
               </p>
            </div>
         </div>

         {/* ADMIN QUICK ACTIONS - Solo visible para admins */}
         {isAdmin && (
            <div className="bg-purple-900/50 border border-purple-500/30 rounded-[32px] p-6">
               <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-purple-300 flex items-center gap-2">
                  <Eye size={16} /> Explorar App Como Usuario
               </h3>
               <div className="grid grid-cols-2 gap-3">
                  <button 
                     onClick={handleExploreAsTourist}
                     className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl transition-all flex flex-col items-center gap-2 active:scale-95"
                  >
                     <User size={24} />
                     <span className="text-[10px] font-black uppercase">Ver como Turista</span>
                  </button>
                  <button 
                     onClick={() => onSwitchRole('partner')}
                     className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl transition-all flex flex-col items-center gap-2 active:scale-95"
                  >
                     <Briefcase size={24} />
                     <span className="text-[10px] font-black uppercase">Ver como Socio</span>
                  </button>
               </div>
               <p className="text-[10px] text-purple-300/70 mt-3 text-center">
                  Explora la app desde diferentes perspectivas sin cerrar tu sesión de admin.
               </p>
            </div>
         )}

         {/* Settings & Support Links */}
         <div className={`${isDark ? 'bg-gray-800 border-gray-700 divide-gray-700' : 'bg-white border-gray-100 shadow-sm divide-gray-50'} rounded-[32px] overflow-hidden border divide-y`}>
             <button 
               onClick={() => setShowSupportChat(true)}
               className="w-full p-5 flex items-center justify-between hover:bg-emerald-500/5 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <MessageCircle size={20} />
                   </div>
                   <span className={`font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Soporte y Chat</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
             </button>

            <button 
               onClick={openSettings}
               className="w-full p-5 flex items-center justify-between hover:bg-emerald-500/5 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                     <Settings size={20} />
                  </div>
                  <span className={`font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Editar mi Cuenta</span>
               </div>
               <ChevronRight size={18} className="text-gray-300" />
            </button>

            {/* Cambiar Contraseña/PIN - Solo para Admin */}
            {isAdmin && (
               <button 
                  onClick={() => setShowChangePassword(true)}
                  className="w-full p-5 flex items-center justify-between hover:bg-purple-500/10 transition-colors"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Key size={20} />
                     </div>
                     <span className={`font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Cambiar PIN/Contraseña</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
               </button>
            )}
            
            <button 
               onClick={isAdmin ? handleAdminLogout : onLogout}
               className="w-full p-5 flex items-center justify-between hover:bg-red-500/10 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                     <LogOut size={20} />
                  </div>
                  <span className="font-bold text-sm text-red-600">
                     {isAdmin ? 'Cerrar Sesión Admin' : 'Cerrar Sesión'}
                  </span>
               </div>
               <ChevronRight size={18} className="text-red-200" />
            </button>
         </div>
      </div>

      {showSupportChat && (
         <ChatWindow 
            currentUserRole={role}
            currentUserId={isAuthenticated ? "c1" : "guest"}
            targetUser={adminUser}
            onClose={() => setShowSupportChat(false)}
         />
      )}

      {/* Account Settings Modal */}
      {showSettings && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md rounded-[40px] overflow-hidden max-h-[90vh] flex flex-col ${isDark ? 'bg-gray-900 border border-gray-800 text-white' : 'bg-white text-gray-900 shadow-2xl'}`}>
               <div className={`p-6 flex items-center justify-between border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-50 bg-gray-50/50'}`}>
                  <h2 className="text-lg font-bold">Ajustes del Perfil</h2>
                  <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                     <X size={20} className="text-gray-500" />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-8">
                  <form onSubmit={saveSettings} className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-2 block">Nombre Completo</label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full rounded-2xl px-5 py-4 text-sm font-bold border-2 transition-all outline-none ${isDark ? 'bg-gray-800 border-gray-700 focus:border-emerald-500' : 'bg-gray-50 border-white focus:bg-white focus:border-emerald-500 shadow-sm'}`} />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-2 block">Email de Contacto</label>
                        <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full rounded-2xl px-5 py-4 text-sm font-bold border-2 transition-all outline-none ${isDark ? 'bg-gray-800 border-gray-700 focus:border-emerald-500' : 'bg-gray-50 border-white focus:bg-white focus:border-emerald-500 shadow-sm'}`} />
                     </div>
                     <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 mt-4 uppercase text-sm tracking-widest">
                        <Save size={20} /> Guardar Perfil
                     </button>
                  </form>
               </div>
            </div>
         </div>
      )}

      {/* Change Password Modal - Solo Admin */}
      {showChangePassword && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-gray-900 border border-purple-500/30 rounded-[40px] overflow-hidden">
               <div className="p-6 flex items-center justify-between border-b border-gray-800 bg-purple-900/30">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                     <Key size={20} className="text-purple-400" />
                     Cambiar PIN/Contraseña
                  </h2>
                  <button 
                     onClick={() => {
                        setShowChangePassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                     }} 
                     className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                     <X size={20} className="text-gray-400" />
                  </button>
               </div>
               <div className="p-8">
                  <form onSubmit={handleChangePassword} className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black text-purple-300 uppercase ml-1 mb-2 block">Nuevo PIN/Contraseña</label>
                        <input 
                           type="password" 
                           value={newPassword} 
                           onChange={e => setNewPassword(e.target.value)} 
                           placeholder="••••••••"
                           className="w-full rounded-2xl px-5 py-4 text-sm font-bold border-2 transition-all outline-none bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-purple-300 uppercase ml-1 mb-2 block">Confirmar PIN/Contraseña</label>
                        <input 
                           type="password" 
                           value={confirmPassword} 
                           onChange={e => setConfirmPassword(e.target.value)} 
                           placeholder="••••••••"
                           className="w-full rounded-2xl px-5 py-4 text-sm font-bold border-2 transition-all outline-none bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                        />
                     </div>
                     <button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-4 uppercase text-sm tracking-widest"
                     >
                        <Lock size={20} /> Actualizar Contraseña
                     </button>
                  </form>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Profile;
