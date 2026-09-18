"use client";
import { create } from "zustand";

type UIStore = {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}));
