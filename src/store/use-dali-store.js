import { create } from "zustand";

export const useDaliStore = create((set) => ({
  selectedGateway: null,

  selectGateway: (gateway) => set({ selectedGateway: gateway }),

  clearGateway: () => set({ selectedGateway: null }),
}));
