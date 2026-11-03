import type { Product, CartItem } from "@/models";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

const CART_STORAGE_KEY = "ladooExpressCart";

import { getCart, updateCart } from "@/routes";
import { useAuth } from "@/hooks/use-auth";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Initialize state from localStorage only on client-side
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  const [isInitialised, setIsInitialised] = useState(false);
  const prevCartRef = useRef<string>("");

  // Helper to sanitize cart items
  function sanitizeCartItems(items: any[]): CartItem[] {
    return (items || [])
      .map((item) => {
        const id = item.productId ?? item.id;
        if (!id) return null;
        return {
          ...item,
          price:
            typeof item.price === "number" && !isNaN(item.price)
              ? item.price
              : 0,
          quantity:
            typeof item.quantity === "number" && item.quantity > 0
              ? item.quantity
              : 1,
          id: String(id),
          productId: String(id),
        };
      })
      .filter((item): item is CartItem => item !== null);
  }

  // Load cart from backend or localStorage on mount or user change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user || !user.userId) {
      // Not logged in: load from localStorage
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      setCart(saved ? sanitizeCartItems(JSON.parse(saved)) : []);
      setIsInitialised(true);
      return;
    }
    // Logged in: fetch from backend
    getCart(user.userId, token ?? undefined)
      .then((data) => {
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
    if (typeof window === "undefined") return;
    const cartString = JSON.stringify(cart);
    if (prevCartRef.current === cartString) return;
    prevCartRef.current = cartString;
    if (!user || !user.userId) {
      localStorage.setItem(CART_STORAGE_KEY, cartString);
    } else {
      // Save to backend
      const itemsToSave = cart.map((item) => {
        if (!item.id) {
          throw new Error("Cart item missing product ID");
        }
        return {
          productId: item.id,
          quantity: item.quantity,
        };
      });
      updateCart(user.userId, itemsToSave, token ?? undefined);
    }
  }, [cart, user, token, isInitialised]);

  const addToCart = (product: Product) => {
    if (!product.id) {
      console.error("Product has no id, cannot add to cart:", product);
      return;
    }
    const productId = product.id;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [...prevCart, { ...product, id: productId, quantity: 1 }];
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
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      isInitialised,
    }),
    [cart, isInitialised],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};
