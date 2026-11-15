import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import type { Product } from "@/models";

import { getWishlist, updateWishlist } from "@/routes/wishlist";
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
  const userId = user?.userId;
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const owner = userId ?? "";
  const isInitialised = owner === loadedOwner;
  const persistedWishlist = useRef("");
  const pendingSave = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const items = userId ? (await getWishlist(userId, token ?? undefined)).wishlist : [];
        if (!active) return;
        persistedWishlist.current = JSON.stringify(items);
        setWishlist(items);
        setLoadedOwner(owner);
      } catch (error) {
        if (active) console.error("Could not load wishlist:", error);
      }
    };
    void load();
    return () => { active = false; };
  }, [owner, userId, token]);

  useEffect(() => {
    if (!isInitialised || !userId) return;
    const serialized = JSON.stringify(wishlist);
    if (serialized === persistedWishlist.current) return;
    persistedWishlist.current = serialized;

    pendingSave.current = pendingSave.current
      .then(async () => { await updateWishlist(userId, wishlist, token ?? undefined); })
      .catch((error) => { console.error("Could not save wishlist:", error); });
  }, [wishlist, userId, token, isInitialised]);

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
      wishlist: isInitialised ? wishlist : [],
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
