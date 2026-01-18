
import React, { useState } from 'react';
import { ArrowLeft, Lock, ShoppingBag, CreditCard, User, MapPin, Mail, CheckCircle, Loader2, Coins, ShieldCheck, Calendar, Clock, Trash2, Phone, Globe, Building, AlertCircle, PhoneCall, ShieldAlert } from 'lucide-react';
import { AppRoute } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { formatCurrency } from '../types_blockchain';
import BlockchainBadge from '../components/BlockchainBadge';

interface CheckoutProps {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
  isAuthenticated: boolean;
}

const Checkout: React.FC<CheckoutProps> = ({ onBack, onNavigate, isAuthenticated }) => {
  const { items, totalPrice, clearCart, removeFromCart } = useCart();
   const [step, setStep] = useState<'cart' | 'info' | 'payment' | 'processing' | 'success'>('cart');
   const hasHotel = items.some(i => i.category === 'hotel');
   const [availabilityStatus, setAvailabilityStatus] = useState<'not-requested' | 'pending' | 'approved'>('not-requested');
  const [paymentMethod, setPaymentMethod] = useState<'binance' | 'hedera' | 'payu'>('payu');
  const [auditInfo, setAuditInfo] = useState<{status: 'pending' | 'verified', txId?: string}>({status: 'pending'});

  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    docId: '',
    country: '',
    billingAddress: '',
    accommodation: '',
    emergencyContact: ''
  });

  const prices = formatCurrency(totalPrice);

  const isFormValid = () => {
    return Object.values(userData).every(value => (value as string).trim() !== '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

   const handleRequestAvailability = async () => {
      try {
         setAvailabilityStatus('pending');
         // Crear solicitudes para cada item de alojamiento
         for (const item of items.filter(i => i.category === 'hotel')) {
            await api.availability.createRequest({
               alojamientoId: item.id,
               checkIn: item.checkIn || item.date || '',
               checkOut: item.checkOut || '',
               adultos: item.pax || item.quantity || 1,
               contactName: userData.fullName,
               contactEmail: userData.email,
               contactWhatsapp: userData.whatsapp
            });
         }
         alert('Solicitud enviada. Te notificaremos cuando el socio apruebe.');
      } catch (e) {
         alert('No se pudo enviar la solicitud. Intenta nuevamente.');
         setAvailabilityStatus('not-requested');
      }
   };

   const handlePayment = async () => {
    setStep('processing');
    try {
            if (hasHotel && availabilityStatus !== 'approved') {
               // Bloquear pago hasta aprobación
               setStep('payment');
               alert('Debes contar con confirmación de disponibilidad antes de pagar.');
               return;
            }
        // 1. Notarización Blockchain
        const audit = await api.blockchain.verifyOnLedger(`TX-${paymentMethod.toUpperCase()}-${Date.now()}`);
        
        // 2. Actualización de Inventario en Tiempo Real (Sincronización con Airtable)
        const inventoryItems = items.map(item => ({
           id: item.id,
           date: item.date || '',
           quantity: item.quantity
        }));
        await api.inventory.updateInventory(inventoryItems);

        setAuditInfo({ status: 'verified', txId: audit.hederaTransactionId });
        setStep('success');
    } catch (e) {
        setStep('payment');
        alert('Ocurrió un problema procesando tu reserva. Por favor intenta de nuevo.');
    }
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
           <ShoppingBag size={40} className="text-gray-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-400 text-sm mb-8 text-center">Parece que aún no has seleccionado ninguna experiencia para tu viaje.</p>
        <button onClick={() => onNavigate(AppRoute.HOME)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg">Explorar Experiencias</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen text-white pb-40 font-sans">
       {/* Sticky Header */}
       <div className="sticky top-0 bg-gray-950/80 backdrop-blur-md z-30 p-6 flex items-center gap-4 border-b border-gray-900">
          <button onClick={() => {
            if (step === 'info') setStep('cart');
            else if (step === 'payment') setStep('info');
            else onBack();
          }} className="p-2 hover:bg-gray-900 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex-1">
             <h1 className="text-lg font-bold">{step === 'cart' ? 'Resumen de Reserva' : step === 'info' ? 'Datos del Viajero' : 'Método de Pago'}</h1>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Paso {step === 'cart' ? '1' : step === 'info' ? '2' : step === 'payment' ? '3' : 'Final'} de 4</p>
          </div>
       </div>

       <div className="p-6">
          {step === 'cart' ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Servicios Seleccionados</h3>
                   {items.map((item) => (
                      <div key={item.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex gap-4 relative">
                         <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0"><img src={item.image} alt={item.title} className="w-full h-full object-cover" /></div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-100 truncate pr-6">{item.title}</h4>
                            <div className="flex flex-col gap-1 mt-1 text-[11px] text-gray-400">
                               <div className="flex items-center gap-1.5"><Calendar size={12} className="text-emerald-500" /><span>{item.date}</span></div>
                               <div className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-500" /><span>{item.time}</span></div>
                               <div className="mt-1 font-medium text-emerald-400">{item.category === 'hotel' ? `${item.nights} Noches - ${item.pax} Pax` : `${item.quantity} Personas`}</div>
                            </div>
                         </div>
                         <div className="flex flex-col justify-between items-end">
                            <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-600 hover:text-red-500"><Trash2 size={16} /></button>
                            <span className="font-bold text-emerald-400">${(item.price * item.quantity).toLocaleString()}</span>
                         </div>
                      </div>
                   ))}
                </div>
                <div className="bg-gray-900 rounded-3xl p-6 border border-emerald-900/20">
                    <div className="pt-3 flex justify-between items-center"><span className="text-lg font-bold">Total a Pagar</span><div className="text-right"><p className="text-2xl font-extrabold text-emerald-400">{prices.cop}</p><p className="text-xs text-gray-500">{prices.usdt}</p></div></div>
                    <button onClick={() => setStep('info')} className="w-full bg-emerald-600 py-4 rounded-2xl font-bold mt-6 flex items-center justify-center gap-2"><span>Continuar con mis Datos</span><ArrowLeft size={18} className="rotate-180" /></button>
                </div>
             </div>
          ) : step === 'info' ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pb-10">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex gap-3"><AlertCircle className="text-emerald-500 shrink-0" size={20} /><p className="text-[11px] text-gray-300 leading-relaxed">Para garantizar la validez de tu <strong>seguro de viaje</strong> y la notarización en el Ledger de Hedera, todos los campos son obligatorios.</p></div>
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><User size={14} /> Identificación y Contacto</h3>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nombre Completo (Como en ID)</label><input name="fullName" value={userData.fullName} onChange={handleInputChange} placeholder="Ej. Mateo Vargas" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">WhatsApp (Con código)</label><input name="whatsapp" value={userData.whatsapp} onChange={handleInputChange} placeholder="+57 300..." className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">ID / Pasaporte</label><input name="docId" value={userData.docId} onChange={handleInputChange} placeholder="Nº Documento" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                      </div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Correo Electrónico (Para Vouchers)</label><input name="email" value={userData.email} onChange={handleInputChange} type="email" placeholder="mateo@ejemplo.com" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                   </div>
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 pt-4"><ShieldCheck size={14} /> Seguridad Financiera</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">País de Origen</label><input name="country" value={userData.country} onChange={handleInputChange} placeholder="Ej. Colombia" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Dirección Facturación</label><input name="billingAddress" value={userData.billingAddress} onChange={handleInputChange} placeholder="Calle..." className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                   </div>
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 pt-4"><Building size={14} /> Logística en la Isla</h3>
                   <div className="space-y-4">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nombre de tu Alojamiento</label><input name="accommodation" value={userData.accommodation} onChange={handleInputChange} placeholder="Hotel / Posada / Apt" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Contacto Emergencia</label><input name="emergencyContact" value={userData.emergencyContact} onChange={handleInputChange} placeholder="Ej. Ana Vargas - 301..." className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" /></div>
                   </div>
                </div>
                <button disabled={!isFormValid()} onClick={() => setStep('payment')} className={`w-full py-4 rounded-2xl font-bold mt-4 transition-all flex items-center justify-center gap-2 ${isFormValid() ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}>{isFormValid() ? 'Elegir Método de Pago' : 'Completa todos los campos'}</button>
             </div>
               ) : step === 'payment' ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        {hasHotel && (
                           <div className="bg-yellow-500/10 border border-yellow-600/30 p-4 rounded-2xl">
                              <div className="flex items-start gap-3">
                                 <ShieldAlert size={18} className="text-yellow-600 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-yellow-700">Verificación de Disponibilidad</p>
                                    <p className="text-[11px] text-yellow-800">Para alojamientos, debes solicitar y recibir confirmación de disponibilidad antes de pagar.</p>
                                    <div className="mt-3 flex items-center gap-2">
                                       <span className="text-[10px] px-2 py-1 rounded-lg bg-yellow-600/20 text-yellow-800 font-bold uppercase tracking-widest">Estado: {availabilityStatus === 'not-requested' ? 'Sin Solicitud' : availabilityStatus === 'pending' ? 'Pendiente' : 'Aprobado'}</span>
                                       {availabilityStatus !== 'approved' && (
                                          <button onClick={handleRequestAvailability} className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-xl font-bold">Solicitar Disponibilidad</button>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-2xl border border-gray-800"><div className="bg-emerald-500/10 p-2 rounded-lg"><ShoppingBag size={20} className="text-emerald-500" /></div><div><p className="text-[10px] text-gray-500 font-bold uppercase">Total a Pagar</p><p className="font-bold text-emerald-400">{prices.cop} ({prices.usdt})</p></div></div>
                <div className="space-y-4">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selecciona Método de Pago</h3>
                   <button onClick={() => setPaymentMethod('payu')} className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${paymentMethod === 'payu' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-gray-900 border-gray-800'}`}><div className="flex items-center gap-4"><div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg"><CreditCard size={24} /></div><div className="text-left"><p className="font-bold text-sm">PayU Latam</p><p className="text-[10px] text-gray-500">Tarjetas de Crédito, Débito y PSE</p></div></div>{paymentMethod === 'payu' && <CheckCircle size={20} className="text-emerald-500" />}</button>
                   <button onClick={() => setPaymentMethod('binance')} className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${paymentMethod === 'binance' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-gray-900 border-gray-800'}`}><div className="flex items-center gap-4"><div className="bg-yellow-500 p-2.5 rounded-xl text-black shadow-lg"><Coins size={24} /></div><div className="text-left"><p className="font-bold text-sm">Binance Pay</p><p className="text-[10px] text-gray-500">Paga con Cripto (Bajo Fee)</p></div></div>{paymentMethod === 'binance' && <CheckCircle size={20} className="text-yellow-500" />}</button>
                   <button onClick={() => setPaymentMethod('hedera')} className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${paymentMethod === 'hedera' ? 'bg-blue-500/10 border-blue-500' : 'bg-gray-900 border-gray-800'}`}><div className="flex items-center gap-4"><div className="bg-blue-500 p-2.5 rounded-xl text-white shadow-lg"><ShieldCheck size={24} /></div><div className="text-left"><p className="font-bold text-sm">Hedera Network</p><p className="text-[10px] text-gray-500">Inmutable HBAR/USDC</p></div></div>{paymentMethod === 'hedera' && <CheckCircle size={20} className="text-blue-500" />}</button>
                </div>
                <button onClick={handlePayment} disabled={hasHotel && availabilityStatus !== 'approved'} className={`w-full py-5 rounded-2xl font-bold mt-4 flex items-center justify-center gap-2 shadow-xl ${hasHotel && availabilityStatus !== 'approved' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                   <Lock size={18} /> Pagar {paymentMethod === 'payu' ? prices.cop : prices.usdt}
                </button>
             </div>
          ) : step === 'processing' ? (
             <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-8">
                   <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse"><ShieldCheck size={48} className="text-emerald-500" /></div>
                   <Loader2 size={32} className="animate-spin text-emerald-400 absolute -bottom-2 -right-2 bg-gray-950 rounded-full" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Procesando y Sincronizando</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">Estamos confirmando tus cupos con el operador y notarizando la reserva en <strong>Hedera Network</strong>.</p>
             </div>
          ) : (
             <div className="animate-in fade-in slide-in-from-bottom-10">
                <div className="bg-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30"><CheckCircle size={48} className="text-white" /></div>
                <h2 className="text-3xl font-extrabold text-center mb-2 tracking-tight">¡Buen Viaje, {userData.fullName.split(' ')[0]}!</h2>
                <p className="text-gray-400 text-sm text-center mb-8 px-4">Tu reserva ha sido confirmada, tus cupos bloqueados e inyectados exitosamente en la red Hedera.</p>
                <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl space-y-6 mb-8">
                    <div><p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Auditoría Blockchain</p><BlockchainBadge status="verified" transactionId={auditInfo.txId} /></div>
                    <div className="pt-4 border-t border-gray-800 space-y-3"><p className="text-xs text-gray-400 leading-relaxed">Cupos descontados del inventario en tiempo real. Enviamos los vouchers QR a <strong>{userData.email}</strong>.</p><button className="w-full bg-gray-800 py-3 rounded-xl text-xs font-bold hover:bg-gray-700 transition-colors">Descargar Vouchers (PDF)</button></div>
                </div>
                <button onClick={() => { clearCart(); onNavigate(AppRoute.HOME); }} className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-900/30">Finalizar y Volver al Inicio</button>
             </div>
          )}
       </div>
    </div>
  );
};

export default Checkout;
