
import React, { useState, useEffect } from 'react';
import { User, Award, ShieldCheck, Copy, ExternalLink, Settings, MessageCircle, LogOut, ChevronRight, Mail, Trophy, CreditCard, Ticket, Gift, Zap, Tag, Star, Briefcase, Shield, Loader2, Target, Sparkles, QrCode, Phone, MapPin, X, Globe, UserCheck, IdCard, ArrowLeft, Music, Clock } from 'lucide-react';
import { PARTNER_CLIENTS } from '../constants';
import { AppRoute, UserRole, Client, Campaign, GuanaUser } from '../types';
import UnifiedPanel from '../components/UnifiedPanel';
import { api } from '../services/api';
import ChatWindow from '../components/ChatWindow';
import AdminPinLogin from './AdminPinLogin';
import AuthGate from './AuthGate';
import { useAuth } from '../context/AuthContext';

interface AccountDashboardProps {
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onNavigate?: (route: AppRoute) => void;
  onBack?: () => void;
}

const AccountDashboard: React.FC<AccountDashboardProps> = ({ onLogout, onSwitchRole, onNavigate, onBack }) => {
  const { isAuthenticated, userRole, isLoading, firebaseUser } = useAuth();
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showDigitalId, setShowDigitalId] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showAuthGate, setShowAuthGate] = useState(!isAuthenticated);
  const [negocio, setNegocio] = useState<any>(null);
  const [loadingNegocio, setLoadingNegocio] = useState(false);

  const TEST_USER_ID = 'c1';

  useEffect(() => {
     // Verificar si hay sesión de admin guardada
     const savedSession = localStorage.getItem('admin_session');
     if (savedSession) {
       try {
         const session = JSON.parse(savedSession);
         const expiresAt = new Date(session.expiresAt);
         if (expiresAt > new Date()) {
           setAdminUser(session.user);
           setShowAdminPin(false);
           // Restaurar vista de SuperAdmin si había sesión válida
           onSwitchRole('SuperAdmin');
           if (onNavigate) onNavigate(AppRoute.ADMIN_DASHBOARD);
         }
       } catch {}
     }
     
     if (isAuthenticated) {
        fetchInitialData();
     }
  }, [isAuthenticated, userRole]);

  // Sincronizar showAuthGate cuando Firebase carga el estado de auth
  useEffect(() => {
    if (isAuthenticated) {
      setShowAuthGate(false);
    }
  }, [isAuthenticated]);

  // Cargar ficha del negocio desde Directorio_Mapa cuando rol es Socio
  useEffect(() => {
    const isPartner = ['Socio', 'Aliado', 'Operador'].includes(userRole as string);
    if (!isPartner || !isAuthenticated) return;
    const email = firebaseUser?.email;
    if (!email) return;
    setLoadingNegocio(true);
    fetch(`/api/directory?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.length > 0) setNegocio(d.data[0]); })
      .catch(() => {})
      .finally(() => setLoadingNegocio(false));
  }, [isAuthenticated, userRole, firebaseUser]);

  const fetchInitialData = async () => {
      setLoadingUser(true);
      setLoadingCampaigns(true);
      try {
         // 1. Sincronizar datos personales reales desde el proxy (Airtable) - solo si autenticado
         if (isAuthenticated) {
            const profile = await api.users.getProfile(TEST_USER_ID);
            setUserData({ ...profile, role: userRole });
         } else {
            // Si no está autenticado, usar datos de fallback
            const fallbackUser = PARTNER_CLIENTS.find(c => c.id === TEST_USER_ID) || PARTNER_CLIENTS[0];
            setUserData({ ...fallbackUser, role: userRole });
         }

         // 2. Cargar campañas de marketing activas
         const camps = await api.campaigns.list();
         setActiveCampaigns(camps.filter(c => c.active).slice(0, 5));
      } catch (e) {
         console.error("Error sincronizando cuenta", e);
         // Fallback a constante local con el rol correcto
         const fallbackUser = PARTNER_CLIENTS.find(c => c.id === TEST_USER_ID) || PARTNER_CLIENTS[0];
         setUserData({ ...fallbackUser, role: userRole });
      } finally {
         setLoadingUser(false);
         setLoadingCampaigns(false);
      }
  };

  // Mientras Firebase carga, mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  // Si hay sesión de admin activa, mostrar panel de SuperAdmin
  if (adminUser && !showAdminPin) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 min-h-screen pb-32 font-sans">
        <div className="px-6 pt-8">
          {/* Back Button */}
          {onBack && (
            <button 
              onClick={onBack}
              className="mb-4 p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-600"
              title="Volver"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          {/* Header Admin */}
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl border border-purple-100 relative">
            <button
              onClick={() => {
                localStorage.removeItem('admin_session');
                setAdminUser(null);
                onLogout();
                if (onNavigate) onNavigate(AppRoute.HOME);
              }}
              className="absolute top-4 right-4 p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
              title="Cerrar Sesión Admin"
            >
              <LogOut size={20} />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-purple-600 uppercase tracking-wider mb-1">SuperAdmin</div>
                <h1 className="text-2xl font-black text-gray-900">{adminUser.nombre || 'Administrador'}</h1>
                <p className="text-sm text-gray-500">{adminUser.email || ''}</p>
              </div>
            </div>
          </div>

          {/* Opciones de Navegación */}
          <div className="space-y-3 mb-6">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-4">Cambiar Vista</p>
            
            <button 
              onClick={() => onSwitchRole('Turista')}
              className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <User size={24} />
                </div>
                <div className="text-left">
                  <div className="font-black text-gray-900">Vista Turista</div>
                  <div className="text-xs text-gray-500">Explorar como visitante</div>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-emerald-600" size={20} />
            </button>

            <button 
              onClick={() => onSwitchRole('Local')}
              className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-yellow-50 hover:border-yellow-200 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                  <MapPin size={24} />
                </div>
                <div className="text-left">
                  <div className="font-black text-gray-900">Vista Local</div>
                  <div className="text-xs text-gray-500">Explorar como residente</div>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-yellow-600" size={20} />
            </button>

            <button 
              onClick={() => onSwitchRole('Socio')}
              className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Briefcase size={24} />
                </div>
                <div className="text-left">
                  <div className="font-black text-gray-900">Panel Socio</div>
                  <div className="text-xs text-gray-500">Gestión de negocios</div>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-blue-600" size={20} />
            </button>

            <button 
              onClick={() => onSwitchRole('Artista')}
              className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-purple-50 hover:border-purple-200 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Music size={24} />
                </div>
                <div className="text-left">
                  <div className="font-black text-gray-900">Panel Artista</div>
                  <div className="text-xs text-gray-500">Vender obras, shows y talleres</div>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-purple-600" size={20} />
            </button>

            <button 
              onClick={() => {
                // Logout del admin y volver a Home
                localStorage.removeItem('admin_session');
                setAdminUser(null);
                onLogout();
                if (onNavigate) onNavigate(AppRoute.HOME);
              }}
              className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                  <Globe size={24} />
                </div>
                <div className="text-left">
                  <div className="font-black text-gray-900">Salir a Inicio</div>
                  <div className="text-xs text-gray-500">Cerrar panel de admin</div>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-gray-600" size={20} />
            </button>
          </div>

          {/* Cerrar Sesión */}
          <div className="mt-8">
            <button 
              onClick={() => {
                localStorage.removeItem('admin_session');
                setAdminUser(null);
                onLogout();
                if (onNavigate) onNavigate(AppRoute.HOME);
              }}
              className="w-full bg-red-50 text-red-600 font-black py-5 rounded-2xl border-2 border-red-200 uppercase text-sm tracking-widest active:scale-95 transition-all hover:bg-red-100 flex items-center justify-center gap-3"
            >
              <LogOut size={20} />
              Cerrar Sesión Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si AuthGate está abierto, mostrarlo
    if (showAuthGate) {
      return (
        <AuthGate 
          onAuthenticated={(role) => {
            console.log('✅ Usuario autenticado con rol:', role);
            onSwitchRole(role);
            setShowAuthGate(false);
          }}
        />
      );
    }

    // Si hay PIN modal abierto, mostrar login de admin
    if (showAdminPin) {
      return (
        <AdminPinLogin 
          onLoginSuccess={(user) => {
            console.log('✅ Admin login exitoso:', user);
            setAdminUser(user);
            setShowAdminPin(false);
            // Entrar directamente al modo SuperAdmin y abrir el dashboard
            onSwitchRole('SuperAdmin');
            if (onNavigate) onNavigate(AppRoute.ADMIN_DASHBOARD);
          }}
        />
      );
    }

    return (
      <div className="bg-white min-h-screen flex flex-col justify-center px-8 text-center font-sans pb-24 relative">
        {/* Back Button */}
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-8 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Volver"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 border border-emerald-100 shadow-sm">
          <User size={48} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">¡Hola, Viajero!</h1>
        <p className="text-gray-500 mb-10 text-sm leading-relaxed px-4">
          Inicia sesión para gestionar tus puntos, ver tus reservas pagadas y acceder a beneficios exclusivos.
        </p>
        
        <div className="space-y-4 w-full">
          <button 
            onClick={() => setShowAuthGate(true)}
            className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-emerald-100 uppercase text-sm tracking-widest active:scale-95 transition-all"
          >
            Iniciar Sesión o Registrarse
          </button>

          <div className="pt-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-6">Acceso Directo</p>
            <div className="flex gap-4">
              <button 
                onClick={() => onSwitchRole('Socio')}
                className="flex-1 bg-gray-50 p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Briefcase size={20} />
                </div>
                <span className="text-[9px] font-black text-gray-800 uppercase tracking-tighter">Negocio Local</span>
              </button>
              
              <button 
                onClick={() => {
                  // Si hay sesión guardada, volver sin pedir password
                  const savedSession = localStorage.getItem('admin_session');
                  if (savedSession) {
                    try {
                      const session = JSON.parse(savedSession);
                      const expiresAt = new Date(session.expiresAt);
                      if (expiresAt > new Date()) {
                        setAdminUser(session.user);
                        return;
                      }
                    } catch {}
                  }
                  // Si no hay sesión o expiró, mostrar login
                  setShowAdminPin(true);
                }}
                className="flex-1 bg-gray-50 p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-100 transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-purple-500 shadow-sm group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[9px] font-black text-gray-800 uppercase tracking-tighter">Administrador</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista específica para Negocio Local (Socio / Aliado / Operador)
  const isPartnerRole = ['Socio', 'Aliado', 'Operador'].includes(userRole as string);
  if (isPartnerRole && isAuthenticated) {
    const userEmail = firebaseUser?.email || '';
    const userName  = firebaseUser?.displayName || userEmail.split('@')[0] || 'Negocio';
    return (
      <div className="min-h-screen bg-gray-900 text-white pb-28">
        {/* Header */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-5 pt-8 pb-6">
          {onBack && (
            <button onClick={onBack} className="mb-4 p-2 hover:bg-gray-700 rounded-lg text-gray-400">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-black text-white shadow-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-teal-400 font-bold uppercase tracking-widest">Negocio Local</p>
              <h1 className="text-xl font-black">{userName}</h1>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-4 mt-4">
          {/* Ficha del negocio */}
          {loadingNegocio ? (
            <div className="bg-gray-800 rounded-2xl p-6 flex items-center justify-center gap-3 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando tu ficha en GuanaGO...</span>
            </div>
          ) : negocio ? (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
              {negocio.image && (
                <img src={negocio.image} alt={negocio.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-lg font-black text-white">{negocio.name}</h2>
                    <p className="text-xs text-teal-400 font-semibold">{negocio.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${
                    negocio.estado === 'activo'
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {negocio.estado || 'activo'}
                  </span>
                </div>
                {negocio.description && (
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">{negocio.description}</p>
                )}
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-400">
                  {negocio.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-teal-400 flex-shrink-0" />
                      {negocio.address}
                    </div>
                  )}
                  {negocio.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-teal-400 flex-shrink-0" />
                      {negocio.phone}
                    </div>
                  )}
                  {negocio.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-teal-400 flex-shrink-0" />
                      {negocio.email}
                    </div>
                  )}
                  {negocio.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={12} className="text-teal-400 flex-shrink-0" />
                      <a href={negocio.website} target="_blank" rel="noreferrer" className="text-teal-400 underline truncate">
                        {negocio.website}
                      </a>
                    </div>
                  )}
                  {negocio.hours && (
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-teal-400 flex-shrink-0" />
                      {negocio.hours}
                    </div>
                  )}
                </div>
                {(negocio.plan || negocio.rnt) && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex gap-4 text-xs">
                    {negocio.plan && (
                      <div>
                        <p className="text-gray-600 uppercase tracking-wide">Plan</p>
                        <p className="text-white font-bold">{negocio.plan}</p>
                      </div>
                    )}
                    {negocio.rnt && (
                      <div>
                        <p className="text-gray-600 uppercase tracking-wide">RNT</p>
                        <p className="text-white font-bold">{negocio.rnt}</p>
                      </div>
                    )}
                    {negocio.rating > 0 && (
                      <div>
                        <p className="text-gray-600 uppercase tracking-wide">Rating</p>
                        <p className="text-yellow-400 font-bold">★ {negocio.rating}</p>
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-4 text-[10px] text-gray-600 text-center">
                  Para actualizar tu ficha contacta al admin de GuanaGO
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
              <MapPin size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-sm font-semibold text-gray-400 mb-1">Tu negocio no está en el directorio</p>
              <p className="text-xs text-gray-600">Contacta al administrador de GuanaGO para que agregue tu ficha.</p>
            </div>
          )}

          {/* Cerrar sesión */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-4 bg-red-900/20 border border-red-800 hover:bg-red-900/40 text-red-400 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Fallback user en caso de carga lenta
  const displayUser = userData ? { ...userData, role: userRole } : { ...PARTNER_CLIENTS[0], role: userRole };

  // Render dinámico por rol - usar UnifiedPanel para navegación
  return (
    <UnifiedPanel
      userRole={userRole}
      onNavigate={(route) => {
        if (onNavigate) onNavigate(route);
      }}
      onBack={() => {
        if (onBack) onBack();
      }}
      isAuthenticated={isAuthenticated}
      onLogout={onLogout}
    />
  );
};

export default AccountDashboard;
