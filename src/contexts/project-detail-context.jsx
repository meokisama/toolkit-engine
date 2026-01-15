import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { exportImportService } from "@/services/export-import";
import log from "electron-log/renderer";

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const ProjectDetailContext = createContext();

export function useProjectDetail() {
  const context = useContext(ProjectDetailContext);
  if (!context) {
    throw new Error("useProjectDetail must be used within a ProjectDetailProvider");
  }
  return context;
}

export function ProjectDetailProvider({ children }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeSection, setActiveSection] = useState("group-config"); // "group-config" or "scenes-schedules"
  const [activeTab, setActiveTab] = useState("lighting");
  const [projectItems, setProjectItems] = useState({
    lighting: [],
    aircon: [],
    unit: [],
    curtain: [],
    knx: [],
    dmx: [],
    room: [],
    scene: [],
    schedule: [],
    multi_scenes: [],
    sequences: [],
  });
  const [airconCards, setAirconCards] = useState([]);
  const [error, setError] = useState(null);

  // Track which tabs have been loaded to avoid re-loading
  const [loadedTabs, setLoadedTabs] = useState(new Set());
  // Track loading state for individual tabs
  const [tabLoading, setTabLoading] = useState({});

  // Load specific tab data - memoized
  const loadTabData = useCallback(async (projectId, tabName) => {
    if (!projectId || !tabName) return;

    // Temporarily skip room tab until backend API is ready
    if (tabName === "room") {
      setLoadedTabs((prev) => new Set([...prev, tabName]));
      return;
    }

    try {
      setTabLoading((prev) => ({ ...prev, [tabName]: true }));
      setError(null);

      if (tabName === "aircon") {
        // Load aircon items
        const items = await window.electronAPI.aircon.getAll(projectId);

        setProjectItems((prev) => ({
          ...prev,
          aircon: items,
        }));

        // Create cards from items (each item is now a card)
        const cards = items.map((item) => ({
          address: item.address,
          name: item.name,
          description: item.description,
          item: item,
        }));
        setAirconCards(cards);
      } else {
        // Load specific category items using individual API calls
        // Map tab name to API name
        const apiName = tabName === "multi_scenes" ? "multiScenes" : tabName === "sequences" ? "sequences" : tabName;
        const items = await window.electronAPI[apiName].getAll(projectId);
        setProjectItems((prev) => ({
          ...prev,
          [tabName]: items,
        }));
      }

      // Mark tab as loaded
      setLoadedTabs((prev) => new Set([...prev, tabName]));
    } catch (err) {
      log.error(`Failed to load ${tabName} items:`, err);
      const errorMessage = err.message || `Failed to load ${tabName} items`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTabLoading((prev) => ({ ...prev, [tabName]: false }));
    }
  }, []);

  // Select a project section (group-config or scenes-schedules) - memoized
  const selectProjectSection = useCallback(
    async (project, section) => {
      setSelectedProject(project);
      setActiveSection(section);

      // Set default tab based on section
      if (section === "group-config") {
        setActiveTab("lighting");
      } else if (section === "scenes-schedules") {
        setActiveTab("scene");
      }

      if (project) {
        // Reset loaded tabs and clear data
        setLoadedTabs(new Set());
        setTabLoading({});
        setProjectItems({
          lighting: [],
          aircon: [],
          unit: [],
          curtain: [],
          knx: [],
          dmx: [],
          room: [],
          scene: [],
          schedule: [],
          multi_scenes: [],
          sequences: [],
        });
        setAirconCards([]);

        // Load appropriate tab based on section
        const initialTab = section === "group-config" ? "lighting" : "scene";
        await loadTabData(project.id, initialTab);
      } else {
        setProjectItems({
          lighting: [],
          aircon: [],
          unit: [],
          curtain: [],
          knx: [],
          dmx: [],
          room: [],
          scene: [],
          schedule: [],
          multi_scenes: [],
          sequences: [],
        });
        setAirconCards([]);
        setLoadedTabs(new Set());
        setTabLoading({});
      }
    },
    [loadTabData]
  );

  // Legacy selectProject function for backward compatibility
  const selectProject = useCallback(
    async (project) => {
      await selectProjectSection(project, "group-config");
    },
    [selectProjectSection]
  );

  // Handle tab change with lazy loading
  const handleTabChange = useCallback(
    async (tabName) => {
      setActiveTab(tabName);

      // Load tab data if not already loaded
      if (selectedProject && !loadedTabs.has(tabName)) {
        await loadTabData(selectedProject.id, tabName);
      }
    },
    [selectedProject, loadedTabs, loadTabData]
  );

  // Generic item operations - memoized
  const createItem = useCallback(
    async (category, itemData) => {
      if (!selectedProject) return;

      try {
        // Map category to API name
        const apiName = category === "multi_scenes" ? "multiScenes" : category;
        const newItem = await window.electronAPI[apiName].create(selectedProject.id, itemData);
        setProjectItems((prev) => ({
          ...prev,
          [category]: [...prev[category], newItem],
        }));
        toast.success(`${capitalizeFirstLetter(category)} item created successfully`);
        return newItem;
      } catch (err) {
        log.error(`Failed to create ${category} item:`, err);
        const errorMessage = err.message || `Failed to create ${category} item`;
        toast.error(errorMessage);
        throw err;
      }
    },
    [selectedProject]
  );

  const updateItem = useCallback(async (category, id, itemData) => {
    try {
      // Map category to API name
      const apiName = category === "multi_scenes" ? "multiScenes" : category;
      const updatedItem = await window.electronAPI[apiName].update(id, itemData);
      setProjectItems((prev) => ({
        ...prev,
        [category]: prev[category].map((item) => (item.id === id ? updatedItem : item)),
      }));
      toast.success(`${capitalizeFirstLetter(category)} item updated successfully`);
      return updatedItem;
    } catch (err) {
      log.error(`Failed to update ${category} item:`, err);
      const errorMessage = err.message || `Failed to update ${category} item`;
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (category, id) => {
    try {
      // Map category to API name
      const apiName = category === "multi_scenes" ? "multiScenes" : category;
      await window.electronAPI[apiName].delete(id);
      setProjectItems((prev) => ({
        ...prev,
        [category]: prev[category].filter((item) => item.id !== id),
      }));
      toast.success(`${capitalizeFirstLetter(category)} item deleted successfully`);
    } catch (err) {
      log.error(`Failed to delete ${category} item:`, err);
      const errorMessage = err.message || `Failed to delete ${category} item`;
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const duplicateItem = useCallback(async (category, id) => {
    try {
      // Map category to API name
      const apiName = category === "multi_scenes" ? "multiScenes" : category;
      const duplicatedItem = await window.electronAPI[apiName].duplicate(id);
      setProjectItems((prev) => ({
        ...prev,
        [category]: [...prev[category], duplicatedItem],
      }));
      toast.success(`${capitalizeFirstLetter(category)} item duplicated successfully`);
      return duplicatedItem;
    } catch (err) {
      log.error(`Failed to duplicate ${category} item:`, err);
      const errorMessage = err.message || `Failed to duplicate ${category} item`;
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Export items to CSV - memoized to prevent recreating on every render
  const exportItems = useCallback(
    async (category) => {
      try {
        if (!selectedProject) {
          toast.error("No project selected");
          return false;
        }

        const items = projectItems[category] || [];
        return await exportImportService.exportItemsToCSV(items, category, selectedProject.name);
      } catch (err) {
        log.error(`Failed to export ${category} items:`, err);
        const errorMessage = err.message || `Failed to export ${category} items`;
        toast.error(errorMessage);
        return false;
      }
    },
    [selectedProject, projectItems]
  );

  // Import items from CSV - memoized to prevent recreating on every render
  const importItems = useCallback(
    async (category, items) => {
      try {
        if (!selectedProject) {
          toast.error("No project selected");
          return false;
        }

        let importedItems;

        // Special handling for aircon category - import as cards
        if (category === "aircon") {
          const cardPromises = items.map((cardData) => window.electronAPI.aircon.createCard(selectedProject.id, cardData));
          const cardResults = await Promise.all(cardPromises);
          importedItems = cardResults.flat(); // Flatten array of arrays

          // Update both aircon items and cards
          setProjectItems((prev) => ({
            ...prev,
            [category]: [...prev[category], ...importedItems],
          }));

          // Create cards from imported items
          const cards = importedItems.map((item) => ({
            address: item.address,
            name: item.name,
            description: item.description,
            item: item,
          }));
          setAirconCards((prev) => [...prev, ...cards]);

          toast.success(`${items.length} aircon cards (${importedItems.length} items) imported successfully`);
        } else {
          // Map category to API name
          const apiName = category === "multi_scenes" ? "multiScenes" : category;
          importedItems = await window.electronAPI[apiName].bulkImport(selectedProject.id, items);
          setProjectItems((prev) => ({
            ...prev,
            [category]: [...prev[category], ...importedItems],
          }));

          toast.success(`${importedItems.length} ${category} items imported successfully`);
        }

        return importedItems;
      } catch (err) {
        log.error(`Failed to import ${category} items:`, err);
        const errorMessage = err.message || `Failed to import ${category} items`;
        toast.error(errorMessage);
        throw err;
      }
    },
    [selectedProject]
  );

  // Aircon card operations - memoized
  const createAirconCard = useCallback(
    async (cardData) => {
      if (!selectedProject) return;

      try {
        const newItems = await window.electronAPI.aircon.createCard(selectedProject.id, cardData);

        // Update aircon items (now just one item per card)
        setProjectItems((prev) => ({
          ...prev,
          aircon: [...prev.aircon, ...newItems],
        }));

        // Create cards from items (each item is now a card)
        const cards = newItems.map((item) => ({
          address: item.address,
          name: item.name,
          description: item.description,
          item: item,
        }));
        setAirconCards((prev) => [...prev, ...cards]);

        toast.success("Aircon card created successfully");
        return newItems;
      } catch (err) {
        log.error("Failed to create aircon card:", err);
        const errorMessage = err.message || "Failed to create aircon card";
        toast.error(errorMessage);
        throw err;
      }
    },
    [selectedProject]
  );

  const deleteAirconCard = useCallback(async (projectId, address) => {
    try {
      await window.electronAPI.aircon.deleteCard(projectId, address);

      // Update both aircon items and cards
      setProjectItems((prev) => ({
        ...prev,
        aircon: prev.aircon.filter((item) => item.address !== address),
      }));

      setAirconCards((prev) => prev.filter((card) => card.address !== address));

      toast.success("Aircon card deleted successfully");
    } catch (err) {
      log.error("Failed to delete aircon card:", err);
      const errorMessage = err.message || "Failed to delete aircon card";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const duplicateAirconCard = useCallback(async (projectId, address) => {
    try {
      const duplicatedItems = await window.electronAPI.aircon.duplicateCard(projectId, address);

      // Update both aircon items and cards
      setProjectItems((prev) => ({
        ...prev,
        aircon: [...prev.aircon, ...duplicatedItems],
      }));

      // Create cards from duplicated items
      const cards = duplicatedItems.map((item) => ({
        address: item.address,
        name: item.name,
        description: item.description,
        item: item,
      }));
      setAirconCards((prev) => [...prev, ...cards]);

      toast.success("Aircon card duplicated successfully");
      return duplicatedItems;
    } catch (err) {
      log.error("Failed to duplicate aircon card:", err);
      const errorMessage = err.message || "Failed to duplicate aircon card";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateAirconCard = useCallback(
    async (cardData, originalCard) => {
      if (!selectedProject) return;

      try {
        // Find items to update using the original address
        const originalAddress = originalCard ? originalCard.address : cardData.address;
        const itemsToUpdate = projectItems.aircon.filter((item) => item.address === originalAddress);

        log.info("Updating aircon card:", {
          originalAddress,
          newAddress: cardData.address,
          itemsToUpdate: itemsToUpdate.length,
        });

        const updatePromises = itemsToUpdate.map((item) =>
          window.electronAPI.aircon.update(item.id, {
            name: cardData.name,
            address: cardData.address,
            description: cardData.description,
            label: item.label,
          })
        );

        const updatedItems = await Promise.all(updatePromises);

        // Update both aircon items and cards
        setProjectItems((prev) => ({
          ...prev,
          aircon: prev.aircon.map((item) => {
            const updatedItem = updatedItems.find((updated) => updated.id === item.id);
            return updatedItem || item;
          }),
        }));

        // Update cards with new data - use original address to find the card to update
        setAirconCards((prev) =>
          prev.map((card) =>
            card.address === originalAddress
              ? {
                  ...card,
                  address: cardData.address, // Update the address
                  name: cardData.name,
                  description: cardData.description,
                  item: {
                    ...card.item,
                    address: cardData.address, // Update the address in item too
                    name: cardData.name,
                    description: cardData.description,
                  },
                }
              : card
          )
        );

        toast.success("Aircon card updated successfully");
        return updatedItems;
      } catch (err) {
        log.error("Failed to update aircon card:", err);
        const errorMessage = err.message || "Failed to update aircon card";
        toast.error(errorMessage);
        throw err;
      }
    },
    [selectedProject, projectItems.aircon]
  );

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(
    () => ({
      selectedProject,
      activeSection,
      setActiveSection,
      activeTab,
      setActiveTab: handleTabChange,
      projectItems,
      airconCards,
      tabLoading,
      loadedTabs,
      error,
      selectProject,
      selectProjectSection,
      loadTabData,
      createItem,
      updateItem,
      deleteItem,
      duplicateItem,
      exportItems,
      importItems,
      createAirconCard,
      updateAirconCard,
      deleteAirconCard,
      duplicateAirconCard,
    }),
    [
      selectedProject,
      activeSection,
      activeTab,
      handleTabChange,
      projectItems,
      airconCards,
      tabLoading,
      loadedTabs,
      error,
      selectProject,
      selectProjectSection,
      loadTabData,
      createItem,
      updateItem,
      deleteItem,
      duplicateItem,
      exportItems,
      importItems,
      createAirconCard,
      updateAirconCard,
      deleteAirconCard,
      duplicateAirconCard,
    ]
  );

  return <ProjectDetailContext.Provider value={value}>{children}</ProjectDetailContext.Provider>;
}
