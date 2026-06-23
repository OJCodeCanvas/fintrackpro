"use client";

import { create } from "zustand";

export type View = "dashboard" | "transactions" | "categories" | "budgets" | "reports";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

interface AppState {
  view: View;
  currency: string;
  setView: (view: View) => void;
  setCurrency: (currency: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  currency: "USD",
  setView: (view) => set({ view }),
  setCurrency: (currency) => set({ currency }),
}));
