
import React, { useState, useEffect } from 'react';
import { User, Award, ShieldCheck, Copy, ExternalLink, Settings, MessageCircle, LogOut, ChevronRight, Mail, Trophy, CreditCard, Ticket, Gift, Zap, Tag, Star, Briefcase, Shield, Loader2, Target, Sparkles, QrCode, Phone, MapPin, X, Globe, UserCheck, IdCard } from 'lucide-react';
import { PARTNER_CLIENTS } from '../constants';
import { AppRoute, UserRole, Client, Campaign, GuanaUser } from '../types';
import DashboardContainer from '../components/DashboardContainer';
import { api } from '../services/api';
import ChatWindow from '../components/ChatWindow';
import AdminPinLogin from './AdminPinLogin';
import AuthGate from './AuthGate';

interface AccountDashboardProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onNavigate?: (route: AppRoute) => void;
}

const AccountDashboard: React.FC<AccountDashboardProps> = ({ isAuthenticated, onLogin, onLogout, onSwitchRole, onNavigate }) => {
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showDigitalId, setShowDigitalId] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [userData, setUserData] = useState<Client | GuanaUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showAuthGate, setShowAuthGate] = useState(!isAuthenticated);
  
  // ID de usuario de prueba persistente (Mateo Vargas)
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
         }
       } catch {}
     }
     
     if (isAuthenticated) {
        fetchInitialData();
     }
  }, [isAuthenticated]);

  const fetchInitialData = async () => {
      setLoadingUser(true);
      setLoadingCampaigns(true);
      try {
         // 1. Sincronizar datos personales reales desde el proxy (Airtable)
         const profile = await api.users.getProfile(TEST_USER_ID);
         setUserData(profile);

         // 2. Cargar campañas de marketing activas
         const camps = await api.campaigns.list();
         setActiveCampaigns(camps.filter(c => c.active).slice(0, 5));
      } catch (e) {
         console.error("Error sincronizando cuenta", e);
         // Fallback a constante local
         setUserData(PARTNER_CLIENTS.find(c => c.id === TEST_USER_ID) || PARTNER_CLIENTS[0]);
      } finally {
         setLoadingUser(false);
         setLoadingCampaigns(false);
      }
  };

  // Si hay sesión de admin activa, mostrar panel de SuperAdmin
  if (adminUser && !showAdminPin) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 min-h-screen pb-32 font-sans">
        <div className="px-6 pt-8">
          {/* Header Admin */}
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl border border-purple-100">
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
          }}
        />
      );
    }

    return (
      <div className="bg-white min-h-screen flex flex-col justify-center px-8 text-center font-sans pb-24">
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
                <span className="text-[9px] font-black text-gray-800 uppercase tracking-tighter">Socio Operador</span>
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

  // Fallback user en caso de carga lenta
  const displayUser = userData || PARTNER_CLIENTS[0];

  // Render dinámico por rol
  return (
    <div className="bg-gray-50 min-h-screen pb-32 font-sans overflow-x-hidden">
      <DashboardContainer user={userData as GuanaUser} />
      {/* ...puedes agregar aquí otros componentes globales si lo deseas... */}
    </div>
  );
};

export default AccountDashboard;
