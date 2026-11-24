import type { Sweetener } from "@/models/product";
import { priceProductLine } from "@/lib/sweeteners";
import type { Product, CartItem, LadduBox } from "@/models";
import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { cartLineInput, type CartLineInput } from "@/packets/cart";
import { getCart, updateCart } from "@/routes/cart";
import { reorderItems, type ReorderResult } from "@/routes/orders";
import { useAuth } from "@/hooks/use-auth";

interface CartContextType {
  cart: CartItem[];
  isInitialised: boolean;
  loadError: string;
  saveError: string;
  retryLoad: () => void;
  syncCart: () => Promise<CartItem[]>;
  reorder: (orderId: string, requestId: string) => Promise<ReorderResult>;
  addToCart: (product: Product, choice?: Sweetener) => void;
  updateSweetener: (lineId: string, choice: Sweetener) => void;
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
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isReordering, setIsReordering] = useState(false);
  const reorderBusy = useRef(false);
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
      setLoadError(""); setSaveError(""); setLoadedOwner(null);
      try {
        const items = userId
          ? (await getCart(userId, token ?? undefined)).items
          : readGuestCart();
        if (!active) return;
        persistedCart.current = JSON.stringify(items);
        setCart(items);
        setLoadedOwner(owner);
      } catch (error) {
        if (active) setLoadError("Your cart could not be loaded. Check your connection and try again.");
      }
    };
    void load();
    return () => { active = false; };
  }, [owner, userId, token, loadAttempt]);

  useEffect(() => {
    if (!isInitialised || reorderBusy.current) return;
    const serialized = JSON.stringify(cart);
    if (serialized === persistedCart.current) return;
    persistedCart.current = serialized;
    if (!userId) {
      localStorage.setItem(CART_STORAGE_KEY, serialized);
      return;
    }

    void saveCart(userId, cart.map(cartLineInput)).then(() => {
      if (currentOwner.current === owner) setSaveError("");
    }).catch(() => {
      if (currentOwner.current === owner) setSaveError("Your latest cart changes have not synced. Retry before leaving this page.");
    });
  }, [cart, isInitialised, isReordering, userId, token]);

  const reorder = async (orderId: string, requestId: string) => {
    if (!userId || !isInitialised || reorderBusy.current) {
      throw new Error("Wait for the cart to finish updating, then try again.");
    }
    reorderBusy.current = true;
    setIsReordering(true);
    try {
      await pendingSave.current;
      if (currentOwner.current !== owner) throw new Error("Your account changed. Please try again.");
      if (saveError) {
        const saved = (await saveCart(userId, cart.map(cartLineInput))).items;
        if (currentOwner.current !== owner) throw new Error("Your account changed. Please try again.");
        persistedCart.current = JSON.stringify(saved);
        setCart(saved);
        setSaveError("");
      }
      const result = await reorderItems(orderId, requestId);
      if (currentOwner.current !== owner) throw new Error("Your account changed. Please try again.");
      persistedCart.current = JSON.stringify(result.items);
      setCart(result.items);
      return result;
    } finally {
      reorderBusy.current = false;
      setIsReordering(false);
    }
  };

  const syncCart = async () => {
    if (!userId || !isInitialised || reorderBusy.current) throw new Error("Your cart is still updating. Please try again.");
    try {
      const saved = (await saveCart(userId, cart.map(cartLineInput))).items;
      if (currentOwner.current !== owner) throw new Error("Your account changed. Please try again.");
      setSaveError("");
      persistedCart.current = JSON.stringify(saved);
      setCart(current => current === cart ? saved : current);
      return saved;
    }
    catch (error) { setSaveError("Your cart could not be saved. Please try again."); throw error; }
  };

  const addBox = async (box: LadduBox) => {
    if (!userId || !isInitialised || reorderBusy.current) throw new Error("Your cart is still updating.");
    const existing = cart.find((item) => matchesBox(item, box));
    const lines = cart.map((item) =>
      item === existing ? { box, quantity: item.quantity + 1 } : cartLineInput(item)
    );
    if (!existing) lines.push({ box, quantity: 1 });

    const saved = (await saveCart(userId, lines)).items;
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

  const addToCart = (product: Product, choice?: Sweetener) => {
    if (product.available === false || reorderBusy.current) return;
    if (!product.id) {
      console.error("Product has no id, cannot add to cart:", product);
      return;
    }
    const line = priceProductLine({ ...product, id: product.id }, 1, choice);

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === line.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === line.id
            ? { ...line, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [...prevCart, line];
      }
    });
  };

  const updateSweetener = (lineId: string, choice: Sweetener) => {
    if (reorderBusy.current) return;
    setCart(current => {
      const line = current.find(item => item.id === lineId);
      if (!line || line.box) return current;
      const next = priceProductLine(line, line.quantity, choice);
      const matching = current.find(item => item.id === next.id && item !== line);
      if (!matching) return current.map(item => item === line ? next : item);
      return current.filter(item => item !== line).map(item =>
        item === matching ? { ...next, quantity: next.quantity + matching.quantity } : item);
    });
  };

  const removeFromCart = (productId: string) => {
    if (reorderBusy.current) return;
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (reorderBusy.current) return;
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
    if (reorderBusy.current) return;
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
      updateSweetener,
      clearCart,
      getCartTotal,
      isInitialised: isInitialised && !isReordering,
      loadError,
      saveError,
      retryLoad: () => setLoadAttempt(attempt => attempt + 1),
      syncCart,
      reorder,
    }),
    [cart, isInitialised, isReordering, userId, token, loadError, saveError],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};
