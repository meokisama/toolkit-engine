import { toast } from "sonner";
import log from "electron-log/renderer";

const ALL_TABS = ["lighting", "aircon", "unit", "curtain", "knx", "dmx", "scene", "schedule", "multi_scenes", "sequences", "room"];

async function fetchTab(projectId, tabName) {
  if (tabName === "aircon") {
    const items = await window.electronAPI.aircon.getAll(projectId);
    const cards = items.map((item) => ({
      address: item.address,
      name: item.name,
      description: item.description,
      item,
    }));
    return { tabName, items, cards };
  }
  // Room stores a composite shape per source_unit: one general_config row joined
  // with its room_detail_config children. Other tabs just return a flat array.
  if (tabName === "room") {
    const generals = await window.electronAPI.room.getAllGeneralConfigs(projectId);
    const items = await Promise.all(
      (generals || []).map(async (gc) => {
        try {
          const rooms = await window.electronAPI.room.getAllRoomConfigs(gc.id);
          return { ...gc, rooms: rooms || [] };
        } catch (err) {
          log.error(`Failed to load room details for general config ${gc.id}:`, err);
          return { ...gc, rooms: [] };
        }
      })
    );
    return { tabName, items };
  }
  const apiName = tabName === "multi_scenes" ? "multiScenes" : tabName;
  const items = await window.electronAPI[apiName].getAll(projectId);
  return { tabName, items };
}

export const createTabLoaderSlice = (set) => ({
  // Load all tabs in parallel — called on project select
  loadAllTabs: async (projectId) => {
    if (!projectId) return;
    set({ tabLoading: Object.fromEntries(ALL_TABS.map((t) => [t, true])), error: null });

    const results = await Promise.allSettled(ALL_TABS.map((tab) => fetchTab(projectId, tab)));

    const projectItemsUpdate = {};
    let airconCardsUpdate = null;
    const errors = [];

    results.forEach((result, i) => {
      const tabName = ALL_TABS[i];
      if (result.status === "fulfilled") {
        const { items, cards } = result.value;
        projectItemsUpdate[tabName] = items;
        if (cards) airconCardsUpdate = cards;
      } else {
        log.error(`Failed to load ${tabName} items:`, result.reason);
        errors.push(tabName);
      }
    });

    set((s) => ({
      projectItems: { ...s.projectItems, ...projectItemsUpdate },
      ...(airconCardsUpdate !== null ? { airconCards: airconCardsUpdate } : {}),
      tabLoading: {},
      ...(errors.length > 0 ? { error: `Failed to load: ${errors.join(", ")}` } : {}),
    }));

    if (errors.length > 0) {
      toast.error(`Failed to load data for: ${errors.join(", ")}`);
    }
  },

  // Reload a single tab — used for data refresh after mutations in child dialogs
  loadTabData: async (projectId, tabName) => {
    if (!projectId || !tabName) return;

    try {
      set((s) => ({ tabLoading: { ...s.tabLoading, [tabName]: true }, error: null }));
      const result = await fetchTab(projectId, tabName);
      set((s) => ({
        projectItems: { ...s.projectItems, [tabName]: result.items },
        ...(result.cards ? { airconCards: result.cards } : {}),
      }));
    } catch (err) {
      log.error(`Failed to reload ${tabName} items:`, err);
      const errorMessage = err.message || `Failed to reload ${tabName} items`;
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set((s) => ({ tabLoading: { ...s.tabLoading, [tabName]: false } }));
    }
  },
});
