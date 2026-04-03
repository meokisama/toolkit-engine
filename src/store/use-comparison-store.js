import { create } from "zustand";

const initialState = {
  comparisonResults: new Map(),
  isComparing: false,
  comparisonProgress: 0,
  hasComparisonResults: false,
  comparisonSummary: null,
};

export const useComparisonStore = create((set) => ({
  ...initialState,

  setComparisonResults: (results) => set({ comparisonResults: results }),
  setIsComparing: (value) => set({ isComparing: value }),
  setComparisonProgress: (value) => set({ comparisonProgress: value }),
  setHasComparisonResults: (value) => set({ hasComparisonResults: value }),
  setComparisonSummary: (summary) => set({ comparisonSummary: summary }),

  reset: () => set({ ...initialState, comparisonResults: new Map() }),
}));
