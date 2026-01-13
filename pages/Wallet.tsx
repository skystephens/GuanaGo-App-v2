
import React, { useState, useEffect } from 'react';
import { ArrowLeft, QrCode, ArrowUpRight, ArrowDownLeft, PlusCircle, Gift, Lock, UserPlus, Trophy, Target, Zap, ChevronRight, Loader2 } from 'lucide-react';
import { WALLET_TRANSACTIONS } from '../constants';
import { AppRoute } from '../types';
import BlockchainBadge from '../components/BlockchainBadge';
import { airtableService, GuanaUser, GuanaReto } from '../services/airtableService';

interface WalletProps {
   onNavigate?: (route: AppRoute) => void;
   isAuthenticated: boolean;
   onLogin: () => void;
   userEmail?: string; // Email del usuario para cargar datos
}

const Wallet: React.FC<WalletProps> = ({ onNavigate, isAuthenticated, onLogin, userEmail }) => {
  const [showQR, setShowQR] = useState(false);
  const [userData, setUserData] = useState<GuanaUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [retos, setRetos] = useState<GuanaReto[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
      setRetos(airtableService.getAvailableRetos());
    }
  }, [isAuthenticated, userEmail]);

  const loadUserData = async () => {
    if (!userEmail) {
      // Datos de demo si no hay email
      setUserData({
        id: 'demo',
        guanaId: 'GUANA-DEMO123',
        nombre: 'Explorador',
        email: 'demo@guanago.com',
        saldoGuana: 1250,
        puntosAcumulados: 1450,
        puntosCanjeados: 200,
        nivel: 'Aventurero',
        retosCompletados: 3,
        qrEscaneados: 5,
        fechaRegistro: new Date().toISOString()
      });
      return;
    }

    setLoading(true);
    try {
      const user = await airtableService.getUserByEmail(userEmail);
      if (user) {
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNivelColor = (nivel: GuanaUser['nivel']) => {
    switch (nivel) {
      case 'Explorador': return 'bg-gray-500';
      case 'Aventurero': return 'bg-blue-500';
      case 'Experto': return 'bg-purple-500';
      case 'Leyenda': return 'bg-yellow-500';
    }
  };

  const getNivelIcon = (nivel: GuanaUser['nivel']) => {
    switch (nivel) {
      case 'Explorador': return '🌱';
      case 'Aventurero': return '⚡';
      case 'Experto': return '🌟';
      case 'Leyenda': return '👑';
    }
  };

  // --- GUEST WALLET VIEW ---
  if (!isAuthenticated) {
     return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans flex flex-col">
           <div className="bg-white p-6 pb-2">
               <div className="flex items-center gap-4 mb-6">
               {onNavigate && (
                  <button onClick={() => onNavigate(AppRoute.HOME)} className="p-1 -ml-1">
                     <ArrowLeft className="text-gray-800" />
                  </button>
               )}
               <h1 className="text-lg font-bold text-gray-900">Mi Billetera</h1>
               </div>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center px-8 text-center -mt-10">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 relative">
                 <Lock size={40} className="text-gray-400" />
                 <div className="absolute top-0 right-0 bg-green-500 rounded-full p-2 border-4 border-gray-50">
                    <Gift size={16} className="text-white" />
                 </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Desbloquea tus Recompensas!</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                 Regístrate para comenzar a ganar <span className="font-bold text-green-600">$GUANA</span> en cada tour y canjearlos por cenas, descuentos y aventuras.
              </p>
              
              <button 
                 onClick={onLogin}
                 className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
              >
                 <UserPlus size={20} />
                 Crear Cuenta Gratis
              </button>
           </div>
        </div>
     );
  }

  // --- AUTHENTICATED WALLET VIEW ---
  return (
    <div className="bg-gray-50 min-h-screen pb-24">
       <div className="bg-white p-6 pb-2">
         <div className="flex items-center gap-4 mb-6">
           {onNavigate && (
             <button onClick={() => onNavigate(AppRoute.HOME)} className="p-1 -ml-1">
                 <ArrowLeft className="text-gray-800" />
             </button>
           )}
           <h1 className="text-lg font-bold text-gray-900">Mi Billetera GUANA</h1>
         </div>

         {loading ? (
           <div className="flex items-center justify-center py-12">
             <Loader2 className="animate-spin text-emerald-600" size={32} />
           </div>
         ) : (
           <>
             {/* Balance Card */}
             <div className="flex flex-col items-center mb-6 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                
                {/* Nivel Badge */}
                {userData && (
                  <div className={`absolute top-3 right-3 ${getNivelColor(userData.nivel)} px-3 py-1 rounded-full flex items-center gap-1`}>
                    <span>{getNivelIcon(userData.nivel)}</span>
                    <span className="text-xs font-bold">{userData.nivel}</span>
                  </div>
                )}
                
                <span className="text-xs text-emerald-100 mb-1 font-bold tracking-wider">SALDO DISPONIBLE</span>
                <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-5xl font-extrabold text-white">{userData?.saldoGuana.toLocaleString() || '0'}</span>
                   <span className="text-xl font-bold text-yellow-300">$GUANA</span>
                </div>
                
                {userData && (
                  <div className="flex items-center gap-4 text-xs text-emerald-100 mb-4">
                    <span>📈 {userData.puntosAcumulados.toLocaleString()} acumulados</span>
                    <span>🎁 {userData.puntosCanjeados.toLocaleString()} canjeados</span>
                  </div>
                )}
                
                <div className="flex gap-4 w-full">
                   <button className="flex-1 bg-white/20 backdrop-blur-sm py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/30 transition-colors border border-white/30">
                      <PlusCircle size={16} /> Ganar Más
                   </button>
                   {onNavigate && (
                      <button 
                         onClick={() => onNavigate(AppRoute.MARKETPLACE)}
                         className="flex-1 bg-yellow-400 text-emerald-800 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-yellow-300 transition-colors"
                      >
                         <Gift size={16} /> Canjear
                      </button>
                   )}
                </div>
             </div>

             {/* Stats Row */}
             {userData && (
               <div className="grid grid-cols-3 gap-3 mb-6">
                 <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                   <Target size={20} className="text-emerald-600 mx-auto mb-1" />
                   <p className="text-lg font-black text-gray-800">{userData.retosCompletados}</p>
                   <p className="text-[10px] text-gray-500 font-semibold">Retos</p>
                 </div>
                 <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                   <QrCode size={20} className="text-blue-600 mx-auto mb-1" />
                   <p className="text-lg font-black text-gray-800">{userData.qrEscaneados}</p>
                   <p className="text-[10px] text-gray-500 font-semibold">QR Escaneados</p>
                 </div>
                 <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                   <Trophy size={20} className="text-yellow-600 mx-auto mb-1" />
                   <p className="text-lg font-black text-gray-800">{userData.nivel}</p>
                   <p className="text-[10px] text-gray-500 font-semibold">Nivel</p>
                 </div>
               </div>
             )}
           </>
         )}
       </div>

       <div className="px-6">
          {/* QR Code Button */}
          <button 
            onClick={() => setShowQR(!showQR)}
            className="w-full bg-gray-900 text-white rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg mb-6 hover:bg-gray-800 transition-colors"
          >
            <QrCode size={20} />
            <span className="font-bold">{showQR ? 'Ocultar mi QR' : 'Mostrar mi QR para Cobrar/Pagar'}</span>
          </button>
          
          {showQR && userData && (
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
               <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-200 mb-4">
                  <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white rounded-xl">
                    <QrCode size={120} />
                  </div>
               </div>
               <p className="text-sm font-bold text-gray-800 mb-1">{userData.guanaId}</p>
               <p className="text-xs text-gray-500 text-center">Muestra este código para pagar o recibir GUANA Points</p>
            </div>
          )}

          {/* Retos Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={16} /> Retos Disponibles
              </h2>
              <button className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {retos.slice(0, 3).map(reto => (
                <div key={reto.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl">
                    {reto.icono}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{reto.titulo}</p>
                    <p className="text-xs text-gray-500">{reto.descripcion}</p>
                  </div>
                  <div className="bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <Zap size={12} className="text-emerald-600" />
                    <span className="text-emerald-700 font-black text-xs">+{reto.puntosRecompensa}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
             {WALLET_TRANSACTIONS.map(tx => (
                <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                         }`}>
                            {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">{tx.type === 'credit' ? '+' : ''}{tx.amount} $GUANA</p>
                            <p className="text-xs text-gray-500">{tx.description}</p>
                         </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{tx.date}</span>
                   </div>
                   <div className="pt-2 border-t border-gray-50 flex justify-end">
                      <BlockchainBadge status={tx.auditStatus as any} transactionId={tx.hederaTransactionId} size="sm" />
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default Wallet;
