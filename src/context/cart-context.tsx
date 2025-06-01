"use client";

import type { Product } from '@/types/product';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './auth-context';

export interface CartItem extends Product {
  id: string; // force id to be required
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ladooExpressCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
      // Initialize state from localStorage only on client-side
      if (typeof window !== 'undefined') {
          const savedCart = localStorage.getItem(CART_STORAGE_KEY);
          return savedCart ? JSON.parse(savedCart) : [];
      }
      return [];
  });
  const [isInitialised, setIsInitialised] = useState(false);
  const prevCartRef = useRef<string>("");

  // Helper to sanitize cart items
  function sanitizeCartItems(items: any[]): CartItem[] {
    return (items || []).map((item) => ({
      ...item,
      price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      id: item._id?.toString() || item.id || item.productId || '',
      _id: item._id?.toString() || item.id || item.productId || '',
    })).filter(item => item.id);
  }

  // Load cart from backend or localStorage on mount or user change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || !token) {
      // Not logged in: load from localStorage
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      setCart(saved ? sanitizeCartItems(JSON.parse(saved)) : []);
      setIsInitialised(true);
      return;
    }
    // Logged in: fetch from backend
    fetch(`/api/cart/${user.userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : { items: [] })
      .then(data => {
        // Only set cart if backend returns items
        if (Array.isArray(data.items)) {
          setCart(sanitizeCartItems(data.items));
        }
        setIsInitialised(true);
      })
      .catch(() => {
        // Do not clear cart on error, just mark as initialised
        setIsInitialised(true);
      });
  }, [user, token]);

  // Save cart to localStorage (for guests) or backend (for logged-in users)
  useEffect(() => {
    if (!isInitialised) return;
    if (typeof window === 'undefined') return;
    const cartString = JSON.stringify(cart);
    if (prevCartRef.current === cartString) return;
    prevCartRef.current = cartString;
    if (!user || !token) {
      localStorage.setItem(CART_STORAGE_KEY, cartString);
    } else {
      // Save to backend
      // Only send productId and quantity to backend
      const itemsToSave = cart.map(item => ({
        productId: item._id?.toString() || item.id,
        quantity: item.quantity
      }));
      fetch(`/api/cart/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsToSave }),
      });
    }
  }, [cart, user, token, isInitialised]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      // Always use MongoDB _id as the canonical ID
      const productId = product._id?.toString() || product.id;
      if (!productId) {
        console.error("Product has no _id, cannot add to cart:", product);
        return prevCart;
      }

      const existingItem = prevCart.find((item) => item._id === productId);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // When adding new item, ensure it has a valid 'id' and '_id'
        return [...prevCart, { ...product, id: productId, _id: productId, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    isInitialised,
  }), [cart, isInitialised]);

  return (
    <CartContext.Provider value={contextValue}>
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

