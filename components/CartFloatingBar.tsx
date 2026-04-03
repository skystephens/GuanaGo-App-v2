import React from 'react';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { AppRoute } from '../types';

interface CartFloatingBarProps {
  onNavigate: (route: AppRoute, data?: any) => void;
  isAuthenticated: boolean;
}

const CartFloatingBar: React.FC<CartFloatingBarProps> = ({ onNavigate, isAuthenticated }) => {
  const { itemCount, totalPrice } = useCart();

  if (itemCount === 0) return null;

  const destRoute = isAuthenticated ? AppRoute.CHECKOUT : AppRoute.DYNAMIC_ITINERARY;

  return (
    // Pill flotante anclado al contenedor del diseño — esquina inferior derecha sobre la nav
    <div className="fixed bottom-24 right-4 z-50 max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl">
      <button
        onClick={() => onNavigate(destRoute)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl active:scale-95 transition-all"
        style={{ background: 'rgba(16,185,129,0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="relative">
          <ShoppingCart size={16} className="text-white" />
          <span
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-emerald-700"
            style={{ background: 'white' }}
          >
            {itemCount}
          </span>
        </div>
        <span className="text-white text-xs font-black whitespace-nowrap">
          ${totalPrice.toLocaleString()}
        </span>
        <ChevronRight size={13} className="text-white/80" />
      </button>
    </div>
  );
};

export default CartFloatingBar;
