import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { exportImportService } from "@/services/export-import";

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
        toast.success(`${category} item created successfully`);
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
      toast.success(`${category} item updated successfully`);
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
      toast.success(`${category} item deleted successfully`);
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
      toast.success(`${category} item duplicated successfully`);
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

        const importedItems = await window.electronAPI[category].bulkImport(
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
        return importedItems;
      } catch (err) {
        console.error(`Failed to import ${category} items:`, err);
        toast.error(`Failed to import ${category} items`);
        throw err;
      }
    },
    [selectedProject]
  );

  // Note: loadProjectItems is called directly in selectProject, no need for useEffect

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(
    () => ({
      selectedProject,
      activeTab,
      setActiveTab,
      projectItems,
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
    }),
    [
      selectedProject,
      activeTab,
      projectItems,
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
    ]
  );

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}
