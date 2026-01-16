
import React, { useState, useEffect } from 'react';
import { User, Award, ShieldCheck, Copy, ExternalLink, Settings, MessageCircle, LogOut, ChevronRight, Mail, Trophy, CreditCard, Ticket, Gift, Zap, Tag, Star, Briefcase, Shield, Loader2, Target, Sparkles, QrCode, Phone, MapPin, X, Globe, UserCheck, IdCard } from 'lucide-react';
import { PARTNER_CLIENTS } from '../constants';
import { AppRoute, UserRole, Client, Campaign, GuanaUser } from '../types';
import DashboardContainer from '../components/DashboardContainer';
import { api } from '../services/api';
import ChatWindow from '../components/ChatWindow';

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
  
  // ID de usuario de prueba persistente (Mateo Vargas)
  const TEST_USER_ID = 'c1';

  useEffect(() => {
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

  if (!isAuthenticated) {
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
            onClick={onLogin}
            className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-emerald-100 uppercase text-sm tracking-widest active:scale-95 transition-all"
          >
            Iniciar Sesión Turista
          </button>

          <div className="pt-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-6">Accesos de Gestión</p>
            <div className="flex gap-4">
              <button 
                onClick={() => onSwitchRole('partner')}
                className="flex-1 bg-gray-50 p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Briefcase size={20} />
                </div>
                <span className="text-[9px] font-black text-gray-800 uppercase tracking-tighter">Socio Operador</span>
              </button>
              
              <button 
                onClick={() => onSwitchRole('admin')}
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
