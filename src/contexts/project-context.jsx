import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { exportImportService } from "@/services/export-import";

const ProjectContext = createContext();

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
}

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load projects from database - memoized to prevent recreating on every render
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await window.electronAPI.projects.getAll();
      setProjects(projectsData);
    } catch (err) {
      console.error("Failed to load projects:", err);
      const errorMessage = err.message || "Failed to load projects";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new project - memoized to prevent recreating on every render
  const createProject = useCallback(async (projectData) => {
    try {
      const newProject = await window.electronAPI.projects.create(projectData);
      setProjects((prev) => [newProject, ...prev]);
      toast.success("Project created successfully");
      return newProject;
    } catch (err) {
      console.error("Failed to create project:", err);
      const errorMessage = err.message || "Failed to create project";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Update project - memoized to prevent recreating on every render
  const updateProject = useCallback(async (id, projectData) => {
    try {
      const updatedProject = await window.electronAPI.projects.update(
        id,
        projectData
      );
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? updatedProject : project))
      );
      toast.success("Project updated successfully");
      return updatedProject;
    } catch (err) {
      console.error("Failed to update project:", err);
      const errorMessage = err.message || "Failed to update project";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Delete project - memoized to prevent recreating on every render
  const deleteProject = useCallback(async (id) => {
    try {
      await window.electronAPI.projects.delete(id);
      setProjects((prev) => prev.filter((project) => project.id !== id));
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error("Failed to delete project:", err);
      const errorMessage = err.message || "Failed to delete project";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Duplicate project - memoized to prevent recreating on every render
  const duplicateProject = useCallback(async (id) => {
    try {
      const duplicatedProject = await window.electronAPI.projects.duplicate(id);
      setProjects((prev) => [duplicatedProject, ...prev]);
      toast.success("Project duplicated successfully");
      return duplicatedProject;
    } catch (err) {
      console.error("Failed to duplicate project:", err);
      const errorMessage = err.message || "Failed to duplicate project";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Export project - memoized to prevent recreating on every render
  const exportProject = useCallback(
    async (id) => {
      try {
        const project = projects.find((p) => p.id === id);
        if (!project) {
          toast.error("Project not found");
          return false;
        }

        const projectItems = await window.electronAPI.projects.getAllItems(id);
        return await exportImportService.exportProject(project, projectItems);
      } catch (err) {
        console.error("Failed to export project:", err);
        const errorMessage = err.message || "Failed to export project";
        toast.error(errorMessage);
        return false;
      }
    },
    [projects]
  );

  // Import project - memoized to prevent recreating on every render
  const importProject = useCallback(async (projectData, itemsData) => {
    try {
      const result = await window.electronAPI.projects.import(
        projectData,
        itemsData
      );
      setProjects((prev) => [result.project, ...prev]);

      const totalItems = Object.values(result.importedCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      toast.success(`Project imported successfully with ${totalItems} items`);
      return result.project;
    } catch (err) {
      console.error("Failed to import project:", err);
      const errorMessage = err.message || "Failed to import project";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Get project by ID - memoized to prevent recreating on every render
  const getProjectById = useCallback(
    (id) => {
      return projects.find((project) => project.id === id);
    },
    [projects]
  );

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(
    () => ({
      projects,
      loading,
      error,
      loadProjects,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      exportProject,
      importProject,
      getProjectById,
    }),
    [
      projects,
      loading,
      error,
      loadProjects,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      exportProject,
      importProject,
      getProjectById,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}
