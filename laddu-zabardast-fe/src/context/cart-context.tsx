import type { Product, CartItem, LadduBox } from "@/models";
import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { cartLineInput, type CartLineInput, type CartResponse } from "@/packets/cart";
import { getCart, updateCart } from "@/routes/cart";
import { useAuth } from "@/hooks/use-auth";

interface CartContextType {
  cart: CartItem[];
  isInitialised: boolean;
  addToCart: (product: Product) => void;
  addBox: (box: LadduBox) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

const CART_STORAGE_KEY = "ladooExpressCart";

function readGuestCart(): CartItem[] {
  try {
    const items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function cartItemsFromResponse({ items }: CartResponse): CartItem[] {
  return items.map((item) => ({ ...item, id: item.productId ?? item.id }));
}

function matchesBox(item: CartItem, box: LadduBox): boolean {
  const existing = item.box;
  return existing?.size === box.size &&
    existing.items.length === box.items.length &&
    box.items.every((choice) => existing.items.some((stored) =>
      stored.productId === choice.productId && stored.quantity === choice.quantity
    ));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const userId = user?.userId;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const owner = userId ?? "";
  const isInitialised = owner === loadedOwner;
  const persistedCart = useRef("");
  const pendingSave = useRef(Promise.resolve());
  const currentOwner = useRef(owner);
  currentOwner.current = owner;

  const saveCart = (id: string, items: CartLineInput[]) => {
    const save = pendingSave.current.then(() => updateCart(id, items, token ?? undefined));
    pendingSave.current = save.then(() => {}, () => {});
    return save;
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const items = userId
          ? cartItemsFromResponse(await getCart(userId, token ?? undefined))
          : readGuestCart();
        if (!active) return;
        persistedCart.current = JSON.stringify(items);
        setCart(items);
        setLoadedOwner(owner);
      } catch (error) {
        if (active) console.error("Could not load cart:", error);
      }
    };
    void load();
    return () => { active = false; };
  }, [owner, userId, token]);

  useEffect(() => {
    if (!isInitialised) return;
    const serialized = JSON.stringify(cart);
    if (serialized === persistedCart.current) return;
    persistedCart.current = serialized;
    if (!userId) {
      localStorage.setItem(CART_STORAGE_KEY, serialized);
      return;
    }

    void saveCart(userId, cart.map(cartLineInput)).catch((error) => {
      console.error("Could not save cart:", error);
    });
  }, [cart, isInitialised, userId, token]);

  const addBox = async (box: LadduBox) => {
    if (!userId || !isInitialised) throw new Error("Your cart is still loading.");
    const existing = cart.find((item) => matchesBox(item, box));
    const lines = cart.map((item) =>
      item === existing ? { box, quantity: item.quantity + 1 } : cartLineInput(item)
    );
    if (!existing) lines.push({ box, quantity: 1 });

    const saved = cartItemsFromResponse(await saveCart(userId, lines));
    if (currentOwner.current !== owner) return;
    const savedBox = saved.find((item) => matchesBox(item, box));
    if (!savedBox) throw new Error("The box could not be saved.");
    persistedCart.current = JSON.stringify(saved);
    setCart((current) => {
      if (current === cart) return saved;
      const currentBox = current.find((item) => matchesBox(item, box));
      return currentBox
        ? current.map((item) => item === currentBox ? { ...savedBox, quantity: item.quantity + 1 } : item)
        : [...current, { ...savedBox, quantity: 1 }];
    });
  };

  const addToCart = (product: Product) => {
    if (product.available === false) return;
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
      cart: isInitialised ? cart : [],
      addToCart,
      addBox,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      isInitialised,
    }),
    [cart, isInitialised, userId, token],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};
