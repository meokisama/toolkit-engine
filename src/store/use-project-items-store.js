import { create } from "zustand";
import { createItemsStateSlice } from "./slices/items-state.slice";
import { createTabLoaderSlice } from "./slices/tab-loader.slice";
import { createCrudSlice } from "./slices/crud.slice";
import { createAirconSlice } from "./slices/aircon.slice";
import { createImportExportSlice } from "./slices/import-export.slice";

export const useProjectItemsStore = create((set, get) => ({
  ...createItemsStateSlice(set, get),
  ...createTabLoaderSlice(set, get),
  ...createCrudSlice(set, get),
  ...createAirconSlice(set, get),
  ...createImportExportSlice(set, get),
}));
