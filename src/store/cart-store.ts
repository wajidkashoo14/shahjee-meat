"use client";
import { create } from "zustand";
import type { CartSummary } from "@/server/cart";

type CartStore = {
  summary: CartSummary | null;
  setSummary: (summary: CartSummary) => void;
};

export const useCartStore = create<CartStore>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
}));
