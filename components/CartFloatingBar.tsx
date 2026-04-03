import React from 'react';
import { ShoppingCart, ChevronRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { AppRoute } from '../types';

interface CartFloatingBarProps {
  onNavigate: (route: AppRoute, data?: any) => void;
  isAuthenticated: boolean;
}

const CartFloatingBar: React.FC<CartFloatingBarProps> = ({ onNavigate, isAuthenticated }) => {
  const { items, itemCount, totalPrice, removeFromCart } = useCart();

  if (itemCount === 0) return null;

  const destRoute = isAuthenticated ? AppRoute.CHECKOUT : AppRoute.DYNAMIC_ITINERARY;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-2 pb-1"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)', pointerEvents: 'none' }}
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(16,185,129,0.97)', backdropFilter: 'blur(16px)', pointerEvents: 'auto' }}
      >
        {/* Items en línea horizontal */}
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-1.5 flex-shrink-0 bg-white/15 rounded-xl px-2.5 py-1.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                {item.image
                  ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/20" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-white text-[10px] font-black leading-none truncate max-w-[90px]">{item.title}</p>
                {item.date && item.date !== 'Fecha abierta' && (
                  <p className="text-white/70 text-[9px] leading-none mt-0.5">{item.date}</p>
                )}
              </div>
              {item.quantity > 1 && (
                <span className="text-[9px] font-black bg-white/20 text-white rounded-full px-1.5 py-0.5">×{item.quantity}</span>
              )}
              <button onClick={() => removeFromCart(item.id)} className="ml-0.5 opacity-70 hover:opacity-100">
                <X size={11} className="text-white" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer con total y CTA */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-pointer active:opacity-80"
          onClick={() => onNavigate(destRoute)}
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={14} className="text-white" />
            <span className="text-white text-xs font-black">
              {itemCount} {itemCount === 1 ? 'servicio' : 'servicios'} · ${totalPrice.toLocaleString()} COP
            </span>
          </div>
          <div className="flex items-center gap-1 bg-white text-emerald-700 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] font-black">{isAuthenticated ? 'Reservar' : 'Ver plan'}</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartFloatingBar;
