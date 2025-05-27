import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { exportImportService } from "@/services/export-import";

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const ProjectDetailContext = createContext();

export function useProjectDetail() {
  const context = useContext(ProjectDetailContext);
  if (!context) {
    throw new Error(
      "useProjectDetail must be used within a ProjectDetailProvider"
    );
  }
  return context;
}

export function ProjectDetailProvider({ children }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("lighting");
  const [projectItems, setProjectItems] = useState({
    lighting: [],
    aircon: [],
    unit: [],
    curtain: [],
    scene: [],
  });
  const [airconCards, setAirconCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all items for a project (optimized single call) - memoized
  const loadProjectItems = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Use optimized single API call instead of 5 separate calls
      const projectItems = await window.electronAPI.projects.getAllItems(
        projectId
      );

      setProjectItems(projectItems);

      // Load aircon cards separately
      const cards = await window.electronAPI.aircon.getCards(projectId);
      setAirconCards(cards);
    } catch (err) {
      console.error("Failed to load project items:", err);
      setError("Failed to load project items");
      toast.error("Failed to load project items");
    } finally {
      setLoading(false);
    }
  }, []);

  // Select a project and load its items - memoized
  const selectProject = useCallback(
    async (project) => {
      setSelectedProject(project);
      // Reset to default tab (lighting) when switching projects
      setActiveTab("lighting");
      if (project) {
        await loadProjectItems(project.id);
      } else {
        setProjectItems({
          lighting: [],
          aircon: [],
          unit: [],
          curtain: [],
          scene: [],
        });
        setAirconCards([]);
      }
    },
    [loadProjectItems]
  );

  // Generic item operations - memoized
  const createItem = useCallback(
    async (category, itemData) => {
      if (!selectedProject) return;

      try {
        const newItem = await window.electronAPI[category].create(
          selectedProject.id,
          itemData
        );
        setProjectItems((prev) => ({
          ...prev,
          [category]: [...prev[category], newItem],
        }));
        toast.success(
          `${capitalizeFirstLetter(category)} item created successfully`
        );
        return newItem;
      } catch (err) {
        console.error(`Failed to create ${category} item:`, err);
        toast.error(`Failed to create ${category} item`);
        throw err;
      }
    },
    [selectedProject]
  );

  const updateItem = useCallback(async (category, id, itemData) => {
    try {
      const updatedItem = await window.electronAPI[category].update(
        id,
        itemData
      );
      setProjectItems((prev) => ({
        ...prev,
        [category]: prev[category].map((item) =>
          item.id === id ? updatedItem : item
        ),
      }));
      toast.success(
        `${capitalizeFirstLetter(category)} item updated successfully`
      );
      return updatedItem;
    } catch (err) {
      console.error(`Failed to update ${category} item:`, err);
      toast.error(`Failed to update ${category} item`);
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (category, id) => {
    try {
      await window.electronAPI[category].delete(id);
      setProjectItems((prev) => ({
        ...prev,
        [category]: prev[category].filter((item) => item.id !== id),
      }));
      toast.success(
        `${capitalizeFirstLetter(category)} item deleted successfully`
      );
    } catch (err) {
      console.error(`Failed to delete ${category} item:`, err);
      toast.error(`Failed to delete ${category} item`);
      throw err;
    }
  }, []);

  const duplicateItem = useCallback(async (category, id) => {
    try {
      const duplicatedItem = await window.electronAPI[category].duplicate(id);
      setProjectItems((prev) => ({
        ...prev,
        [category]: [...prev[category], duplicatedItem],
      }));
      toast.success(
        `${capitalizeFirstLetter(category)} item duplicated successfully`
      );
      return duplicatedItem;
    } catch (err) {
      console.error(`Failed to duplicate ${category} item:`, err);
      toast.error(`Failed to duplicate ${category} item`);
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
        return await exportImportService.exportItemsToCSV(
          items,
          category,
          selectedProject.name
        );
      } catch (err) {
        console.error(`Failed to export ${category} items:`, err);
        toast.error(`Failed to export ${category} items`);
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
          const cardPromises = items.map((cardData) =>
            window.electronAPI.aircon.createCard(selectedProject.id, cardData)
          );
          const cardResults = await Promise.all(cardPromises);
          importedItems = cardResults.flat(); // Flatten array of arrays

          // Update both aircon items and cards
          setProjectItems((prev) => ({
            ...prev,
            [category]: [...prev[category], ...importedItems],
          }));

          // Reload cards to get updated structure
          const cards = await window.electronAPI.aircon.getCards(
            selectedProject.id
          );
          setAirconCards(cards);

          toast.success(
            `${items.length} aircon cards (${importedItems.length} items) imported successfully`
          );
        } else {
          importedItems = await window.electronAPI[category].bulkImport(
            selectedProject.id,
            items
          );
          setProjectItems((prev) => ({
            ...prev,
            [category]: [...prev[category], ...importedItems],
          }));

          toast.success(
            `${importedItems.length} ${category} items imported successfully`
          );
        }

        return importedItems;
      } catch (err) {
        console.error(`Failed to import ${category} items:`, err);
        const errorMessage =
          err.message || `Failed to import ${category} items`;
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
        const newItems = await window.electronAPI.aircon.createCard(
          selectedProject.id,
          cardData
        );

        // Update both aircon items and cards
        setProjectItems((prev) => ({
          ...prev,
          aircon: [...prev.aircon, ...newItems],
        }));

        // Reload cards to get updated structure
        const cards = await window.electronAPI.aircon.getCards(
          selectedProject.id
        );
        setAirconCards(cards);

        toast.success("Aircon card created successfully");
        return newItems;
      } catch (err) {
        console.error("Failed to create aircon card:", err);
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
      console.error("Failed to delete aircon card:", err);
      toast.error("Failed to delete aircon card");
      throw err;
    }
  }, []);

  const duplicateAirconCard = useCallback(async (projectId, address) => {
    try {
      const duplicatedItems = await window.electronAPI.aircon.duplicateCard(
        projectId,
        address
      );

      // Update both aircon items and cards
      setProjectItems((prev) => ({
        ...prev,
        aircon: [...prev.aircon, ...duplicatedItems],
      }));

      // Reload cards to get updated structure
      const cards = await window.electronAPI.aircon.getCards(projectId);
      setAirconCards(cards);

      toast.success("Aircon card duplicated successfully");
      return duplicatedItems;
    } catch (err) {
      console.error("Failed to duplicate aircon card:", err);
      toast.error("Failed to duplicate aircon card");
      throw err;
    }
  }, []);

  const updateAirconCard = useCallback(
    async (cardData) => {
      if (!selectedProject) return;

      try {
        // Update all items with the same address
        const itemsToUpdate = projectItems.aircon.filter(
          (item) => item.address === cardData.address
        );

        const updatePromises = itemsToUpdate.map((item) =>
          window.electronAPI.aircon.update(item.id, {
            name: cardData.name,
            address: cardData.address,
            description: cardData.description,
            object_type: item.object_type,
          })
        );

        const updatedItems = await Promise.all(updatePromises);

        // Update both aircon items and cards
        setProjectItems((prev) => ({
          ...prev,
          aircon: prev.aircon.map((item) => {
            const updatedItem = updatedItems.find(
              (updated) => updated.id === item.id
            );
            return updatedItem || item;
          }),
        }));

        // Reload cards to get updated structure
        const cards = await window.electronAPI.aircon.getCards(
          selectedProject.id
        );
        setAirconCards(cards);

        toast.success("Aircon card updated successfully");
        return updatedItems;
      } catch (err) {
        console.error("Failed to update aircon card:", err);
        const errorMessage = err.message || "Failed to update aircon card";
        toast.error(errorMessage);
        throw err;
      }
    },
    [selectedProject, projectItems.aircon]
  );

  // Note: loadProjectItems is called directly in selectProject, no need for useEffect

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(
    () => ({
      selectedProject,
      activeTab,
      setActiveTab,
      projectItems,
      airconCards,
      loading,
      error,
      selectProject,
      loadProjectItems,
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
      activeTab,
      projectItems,
      airconCards,
      loading,
      error,
      selectProject,
      loadProjectItems,
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

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}
