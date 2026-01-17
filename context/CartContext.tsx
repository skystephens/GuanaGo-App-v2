
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartContextType, CartItem, Tour, Hotel, Package } from '../types';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Calculate totals: Sum of (price * quantity) for all items
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Tour | Hotel | Package, quantity: number, date?: string, time?: string, nights?: number, totalOverride?: number, babies?: number) => {
    setItems((prevItems) => {
      const isHotel = product.category === 'hotel';
      // Para hoteles, cada reserva es única por fecha usualmente, pero aquí simplificamos
      const existingItemIndex = prevItems.findIndex((item) => item.id === product.id && item.date === date && item.time === time);

      const finalPrice = totalOverride !== undefined ? totalOverride : product.price;
      const finalQuantity = isHotel ? 1 : quantity;

      if (existingItemIndex > -1 && !isHotel) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prevItems, { 
            ...product, 
            price: finalPrice, 
            quantity: finalQuantity, 
            date: date || 'Fecha abierta',
            time: time || 'Horario por definir',
            nights: nights,
            pax: isHotel ? quantity : undefined,
            babies: babies
        }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalPrice, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
