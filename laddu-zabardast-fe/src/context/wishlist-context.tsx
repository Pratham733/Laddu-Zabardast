// src/context/wishlist-context.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import type { Product } from "@/models";
import { usePathname } from "next/navigation";

import { getWishlist, updateWishlist } from "@/routes";
import { useAuth } from "@/hooks/use-auth";

interface WishlistContextProps {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (product: Product) => void;
  isInitialised: boolean;
}

export const WishlistContext = createContext<WishlistContextProps | undefined>(
  undefined,
);

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({
  children,
}: WishlistProviderProps): JSX.Element => {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isInitialised, setIsInitialised] = useState(false);
  const prevWishlistRef = useRef<string>("");
  const pathname = usePathname();

  // Helper to load wishlist - memoized with stable dependencies
  const loadWishlist = useCallback(async () => {
    if (!user?.userId) {
      console.log("[WishlistContext] No user available");
      setWishlist([]);
      setIsInitialised(true);
      return;
    }

    try {
      const data = await getWishlist(user.userId, token ?? undefined);
      setWishlist(data.wishlist || []);
    } catch (error) {
      console.error("[WishlistContext] Error fetching wishlist:", error);
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
    if (pathname === "/wishlist") {
      loadWishlist();
    }
  }, [pathname, loadWishlist]);

  // Save wishlist to localStorage or backend
  useEffect(() => {
    if (!isInitialised || typeof window === "undefined") return;

    const wishlistString = JSON.stringify(wishlist);
    if (prevWishlistRef.current === wishlistString) return;
    prevWishlistRef.current = wishlistString;

    if (!user?.userId) {
      localStorage.setItem("ladooExpressWishlist", wishlistString);
      return;
    }

    updateWishlist(user.userId, wishlist, token ?? undefined).catch((err) => {
      console.error("[WishlistContext] PUT fetch error:", err);
    });
  }, [wishlist, user?.userId, token, isInitialised]);

  const addToWishlist = useCallback((product: Product) => {
    setWishlist((prevWishlist) => {
      const prodId = product.id;
      if (!prodId) {
        console.error("[WishlistContext] Product has no id:", product);
        return prevWishlist;
      }
      if (prevWishlist.some((p) => p.id === prodId)) {
        return prevWishlist;
      }
      return [...prevWishlist, product];
    });
  }, []);

  const removeFromWishlist = useCallback((product: Product) => {
    setWishlist((prevWishlist) => {
      const prodId = product.id;
      if (!prodId) return prevWishlist;
      return prevWishlist.filter((p) => p.id !== prodId);
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInitialised,
    }),
    [wishlist, addToWishlist, removeFromWishlist, isInitialised],
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};
