import { toast } from "sonner";
import log from "electron-log/renderer";

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function apiName(category) {
  return category === "multi_scenes" ? "multiScenes" : category;
}

export const createCrudSlice = (set) => ({
  createItem: async (category, itemData, projectId, silent = false) => {
    try {
      const newItem = await window.electronAPI[apiName(category)].create(projectId, itemData);
      set((s) => ({
        projectItems: { ...s.projectItems, [category]: [...s.projectItems[category], newItem] },
      }));
      if (!silent) toast.success(`${cap(category)} item created successfully`);
      return newItem;
    } catch (err) {
      log.error(`Failed to create ${category} item:`, err);
      toast.error(err.message || `Failed to create ${category} item`);
      throw err;
    }
  },

  updateItem: async (category, id, itemData) => {
    try {
      const updatedItem = await window.electronAPI[apiName(category)].update(id, itemData);
      set((s) => ({
        projectItems: {
          ...s.projectItems,
          [category]: s.projectItems[category].map((item) => (item.id === id ? updatedItem : item)),
        },
      }));
      toast.success(`${cap(category)} item updated successfully`);
      return updatedItem;
    } catch (err) {
      log.error(`Failed to update ${category} item:`, err);
      toast.error(err.message || `Failed to update ${category} item`);
      throw err;
    }
  },

  deleteItem: async (category, id) => {
    try {
      await window.electronAPI[apiName(category)].delete(id);
      set((s) => ({
        projectItems: {
          ...s.projectItems,
          [category]: s.projectItems[category].filter((item) => item.id !== id),
        },
      }));
      toast.success(`${cap(category)} item deleted successfully`);
    } catch (err) {
      log.error(`Failed to delete ${category} item:`, err);
      toast.error(err.message || `Failed to delete ${category} item`);
      throw err;
    }
  },

  duplicateItem: async (category, id) => {
    try {
      const duplicatedItem = await window.electronAPI[apiName(category)].duplicate(id);
      set((s) => ({
        projectItems: {
          ...s.projectItems,
          [category]: [...s.projectItems[category], duplicatedItem],
        },
      }));
      toast.success(`${cap(category)} item duplicated successfully`);
      return duplicatedItem;
    } catch (err) {
      log.error(`Failed to duplicate ${category} item:`, err);
      toast.error(err.message || `Failed to duplicate ${category} item`);
      throw err;
    }
  },
});
