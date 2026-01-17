
import React, { useState } from 'react';
import { ArrowLeft, QrCode, ArrowUpRight, ArrowDownLeft, Search, PlusCircle, Gift, Lock, UserPlus } from 'lucide-react';
import { WALLET_TRANSACTIONS } from '../constants';
import { AppRoute } from '../types';
import BlockchainBadge from '../components/BlockchainBadge';
import GuanaPointsSection from '../components/GuanaPointsSection';

interface WalletProps {
   onNavigate?: (route: AppRoute) => void;
   isAuthenticated: boolean;
   onLogin: () => void;
}

const Wallet: React.FC<WalletProps> = ({ onNavigate, isAuthenticated, onLogin }) => {
  const [showQR, setShowQR] = useState(false);

  // --- GUEST WALLET VIEW ---
  if (!isAuthenticated) {
     return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans">
           <div className="bg-white p-6 pb-2">
               <div className="flex items-center gap-4 mb-6">
               {onNavigate && (
                  <button onClick={() => onNavigate(AppRoute.HOME)} className="p-1 -ml-1">
                     <ArrowLeft className="text-gray-800" />
                  </button>
               )}
               <h1 className="text-lg font-bold text-gray-900">GUANA Points</h1>
               </div>
           </div>
           
           {/* Sección de GUANA Points - Prioridad: Mostrar info primero */}
           <div className="px-6 py-4">
              <GuanaPointsSection onNavigate={onNavigate!} isAuthenticated={false} userPoints={0} />
              
              {/* CTA de registro - Más abajo */}
              <div className="mt-6 bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                 <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Lock size={28} className="text-emerald-600" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">¡Comienza a ganar puntos!</h3>
                 <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Regístrate gratis y recibe <span className="font-bold text-emerald-600">100 GUANA Points</span> de bienvenida
                 </p>
                 
                 <button 
                    onClick={onLogin}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                 >
                    <UserPlus size={20} />
                    Crear Cuenta Gratis
                 </button>
              </div>
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
           <h1 className="text-lg font-bold text-gray-900">Mi Billetera</h1>
         </div>

         <div className="flex flex-col items-center mb-6 bg-gray-900 rounded-2xl p-6 text-white shadow-lg">
            <span className="text-xs text-gray-400 mb-1 font-bold tracking-wider">SALDO DISPONIBLE</span>
            <div className="flex items-baseline gap-2 mb-4">
               <span className="text-4xl font-extrabold text-white">1,250</span>
               <span className="text-xl font-bold text-green-400">$GUANA</span>
            </div>
            
            <div className="flex gap-4 w-full">
               <button className="flex-1 bg-green-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-500 transition-colors">
                  <PlusCircle size={16} /> Recargar
               </button>
               {onNavigate && (
                  <button 
                     onClick={() => onNavigate(AppRoute.MARKETPLACE)}
                     className="flex-1 bg-gray-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors"
                  >
                     <Gift size={16} /> Canjear
                  </button>
               )}
            </div>
         </div>
       </div>

       <div className="px-6">
          <button 
            onClick={() => setShowQR(!showQR)}
            className="w-full bg-white border-2 border-gray-900 text-gray-900 rounded-xl py-4 flex items-center justify-center gap-2 shadow-sm mb-8 hover:bg-gray-50 transition-colors"
          >
            <QrCode size={20} />
            <span className="font-bold">{showQR ? 'Ocultar QR' : 'Mostrar mi QR para Pagar'}</span>
          </button>
          
          {showQR && (
            <div className="bg-white p-6 rounded-2xl shadow-inner mb-8 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
               <div className="bg-white p-2 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                  <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white">
                    <QrCode size={100} />
                  </div>
               </div>
               <p className="text-sm text-gray-500 text-center">Muestra este código al operador para pagar con tus tokens.</p>
            </div>
          )}

          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Actividad Reciente</h2>
          <div className="space-y-4 mb-8">
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

          {/* Sección completa de GUANA Points con info de retos y cómo funciona */}
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Retos y Recompensas</h2>
          <GuanaPointsSection onNavigate={onNavigate} isAuthenticated={true} userPoints={1250} />
       </div>
    </div>
  );
};

export default Wallet;
