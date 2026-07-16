"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface CartContextValue {
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<string | true>;
  setCount: (n: number) => void;
}

const CartContext = createContext<CartContextValue>({
  count: 0,
  loading: false,
  refresh: async () => {},
  addToCart: async () => "Lỗi mạng.",
  setCount: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession() || {};
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const d = await res.json();
        setCount(d?.totalItems ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, [status]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      setLoading(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          if (typeof d?.totalItems === "number") setCount(d.totalItems);
          return true;
        }
        return d?.error ?? "Thêm vào giỏ hàng thất bại.";
      } catch {
        return "Lỗi kết nối.";
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh, setCount]);

  return (
    <CartContext.Provider value={{ count, loading, refresh, addToCart, setCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
