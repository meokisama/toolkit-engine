import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTableUIStore = create(
  persist(
    (set) => ({
      // Persisted — global user preferences
      columnVisibility: {},
      pageSizes: {},
      // Not persisted — resets on app restart, but remembered while switching between projects
      pageIndexes: {},
      setColumnVisibility: (tableKey, visibility) =>
        set((state) => ({
          columnVisibility: { ...state.columnVisibility, [tableKey]: visibility },
        })),
      setPageSize: (tableKey, pageSize) =>
        set((state) => ({
          pageSizes: { ...state.pageSizes, [tableKey]: pageSize },
        })),
      setPageIndex: (key, pageIndex) =>
        set((state) => ({
          pageIndexes: { ...state.pageIndexes, [key]: pageIndex },
        })),
    }),
    {
      name: "table-ui-preferences",
      partialize: (state) => ({
        columnVisibility: state.columnVisibility,
        pageSizes: state.pageSizes,
        // pageIndexes intentionally excluded — session only
      }),
    },
  ),
);
