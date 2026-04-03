import { toast } from "sonner";
import log from "electron-log/renderer";
import { exportImportService } from "@/services/export-import";

export const createImportExportSlice = (set, get) => ({
  exportItems: async (category, selectedProject) => {
    try {
      if (!selectedProject) {
        toast.error("No project selected");
        return false;
      }
      const items = get().projectItems[category] || [];
      return await exportImportService.exportItemsToCSV(items, category, selectedProject.name);
    } catch (err) {
      log.error(`Failed to export ${category} items:`, err);
      toast.error(err.message || `Failed to export ${category} items`);
      return false;
    }
  },

  importItems: async (category, items, selectedProject, silent = false) => {
    try {
      if (!selectedProject) {
        toast.error("No project selected");
        return false;
      }

      let importedItems;

      if (category === "aircon") {
        const results = await Promise.all(
          items.map((cardData) => window.electronAPI.aircon.createCard(selectedProject.id, cardData))
        );
        importedItems = results.flat();

        const cards = importedItems.map((item) => ({
          address: item.address,
          name: item.name,
          description: item.description,
          item,
        }));

        set((s) => ({
          projectItems: { ...s.projectItems, aircon: [...s.projectItems.aircon, ...importedItems] },
          airconCards: [...s.airconCards, ...cards],
        }));

        if (!silent) toast.success(`${items.length} aircon cards (${importedItems.length} items) imported successfully`);
      } else {
        const apiName = category === "multi_scenes" ? "multiScenes" : category;
        importedItems = await window.electronAPI[apiName].bulkImport(selectedProject.id, items);
        set((s) => ({
          projectItems: { ...s.projectItems, [category]: [...s.projectItems[category], ...importedItems] },
        }));
        if (!silent) toast.success(`${importedItems.length} ${category} items imported successfully`);
      }

      return importedItems;
    } catch (err) {
      log.error(`Failed to import ${category} items:`, err);
      toast.error(err.message || `Failed to import ${category} items`);
      throw err;
    }
  },
});
