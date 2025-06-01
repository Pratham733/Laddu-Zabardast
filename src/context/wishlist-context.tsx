// src/context/wishlist-context.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Product } from '@/types/product';
import { useAuth } from './auth-context';
import { usePathname } from 'next/navigation';

interface WishlistContextProps {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (product: Product) => void;
  isInitialised: boolean;
}

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps): JSX.Element => {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isInitialised, setIsInitialised] = useState(false);
  const prevWishlistRef = useRef<string>("");
  const pathname = usePathname();

  // Helper to load wishlist - memoized with stable dependencies
  const loadWishlist = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setIsInitialised(false);

    if (!user?.userId || !token) {
      try {
        const saved = localStorage.getItem('ladooExpressWishlist');
        setWishlist(saved ? JSON.parse(saved) : []);
      } catch (err) {
        console.error('[WishlistContext] Error loading from localStorage:', err);
        setWishlist([]);
      }
      setIsInitialised(true);
      return;
    }

    try {
      const res = await fetch(`/api/wishlist/${user.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch wishlist: ${res.status}`);
      }
      
      const data = await res.json();
      setWishlist(data.items || []);
    } catch (err) {
      console.error('[WishlistContext] Error fetching wishlist:', err);
      setWishlist([]);
    } finally {
      setIsInitialised(true);
    }
  }, [user?.userId, token]);

  // Load wishlist on mount or user/token change
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Re-fetch wishlist when navigating to /wishlist
  useEffect(() => {
    if (pathname === '/wishlist') {
      loadWishlist();
    }
  }, [pathname, loadWishlist]);

  // Save wishlist to localStorage or backend
  useEffect(() => {
    if (!isInitialised || typeof window === 'undefined') return;

    const wishlistString = JSON.stringify(wishlist);
    if (prevWishlistRef.current === wishlistString) return;
    prevWishlistRef.current = wishlistString;

    if (!user?.userId || !token) {
      localStorage.setItem('ladooExpressWishlist', wishlistString);
      return;
    }

    fetch(`/api/wishlist/${user.userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: wishlist }),
    }).then(async res => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[WishlistContext] PUT error:', res.status, errorText);
      }
    }).catch(err => {
      console.error('[WishlistContext] PUT fetch error:', err);
    });
  }, [wishlist, user?.userId, token, isInitialised]);

  const addToWishlist = useCallback((product: Product) => {
    setWishlist(prevWishlist => {
      if (prevWishlist.find(p => (p._id && product._id && p._id === product._id) || (p.id && product.id && p.id === product.id))) {
        return prevWishlist;
      }
      return [...prevWishlist, product];
    });
  }, []);

  const removeFromWishlist = useCallback((product: Product) => {
    setWishlist(prevWishlist => 
      prevWishlist.filter(p => !((p._id && product._id && p._id === product._id) || (p.id && product.id && p.id === product.id)))
    );
  }, []);

  const contextValue = useMemo(() => ({
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInitialised,
  }), [wishlist, addToWishlist, removeFromWishlist, isInitialised]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
