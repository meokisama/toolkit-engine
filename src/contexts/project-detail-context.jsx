import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

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

  // Load all items for a project (optimized single call)
  const loadProjectItems = async (projectId) => {
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
  };

  // Select a project and load its items
  const selectProject = async (project) => {
    setSelectedProject(project);
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
  };

  // Generic item operations
  const createItem = async (category, itemData) => {
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
  };

  const updateItem = async (category, id, itemData) => {
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
  };

  const deleteItem = async (category, id) => {
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
  };

  const duplicateItem = async (category, id) => {
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
  };

  // Note: loadProjectItems is called directly in selectProject, no need for useEffect

  const value = {
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
  };

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}
