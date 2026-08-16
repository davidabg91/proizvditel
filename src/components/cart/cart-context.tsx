"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

export type CartItem = {
  listingId: string;
  producerSlug: string;
  producerName: string;
  title: string;
  price: number;
  unit: string;
  currency: string;
  imageUrl: string | null;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (listingId: string, qty: number) => void;
  remove: (listingId: string) => void;
  removeByProducer: (producerSlug: string) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "proizvoditel_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Зареждане от localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // игнорираме
    }
    setReady(true);
  }, []);

  // Запис при промяна
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // игнорираме
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === item.listingId);
      if (existing) {
        return prev.map((i) =>
          i.listingId === item.listingId ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback((listingId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.listingId !== listingId)
        : prev.map((i) => (i.listingId === listingId ? { ...i, qty } : i)),
    );
  }, []);

  const remove = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }, []);

  const removeByProducer = useCallback((producerSlug: string) => {
    setItems((prev) => prev.filter((i) => i.producerSlug !== producerSlug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const total = useMemo(
    () => items.reduce((s, i) => s + i.qty * i.price, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, count, total, add, setQty, remove, removeByProducer, clear, ready }),
    [items, count, total, add, setQty, remove, removeByProducer, clear, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart трябва да е в CartProvider");
  return ctx;
}
