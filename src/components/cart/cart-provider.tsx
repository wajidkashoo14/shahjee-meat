"use client";
import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import type { CartSummary } from "@/server/cart";

export function CartProvider({ initialSummary, children }: { initialSummary: CartSummary; children: React.ReactNode }) {
  const setSummary = useCartStore((s) => s.setSummary);
  useEffect(() => {
    setSummary(initialSummary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSummary.cartId, initialSummary.itemCount]);
  return <>{children}</>;
}
