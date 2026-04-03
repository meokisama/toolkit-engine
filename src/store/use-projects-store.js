import { create } from "zustand";
import { toast } from "sonner";
import { exportImportService } from "@/services/export-import";
import log from "electron-log/renderer";

export const useProjectsStore = create((set, get) => ({
  projects: [],
  loading: true,
  error: null,

  loadProjects: async () => {
    try {
      set({ loading: true, error: null });
      const projectsData = await window.electronAPI.projects.getAll();
      set({ projects: projectsData });
    } catch (err) {
      log.error("Failed to load projects:", err);
      const errorMessage = err.message || "Failed to load projects";
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (projectData) => {
    try {
      const newProject = await window.electronAPI.projects.create(projectData);
      set((state) => ({ projects: [newProject, ...state.projects] }));
      toast.success("Project created successfully");
      return newProject;
    } catch (err) {
      log.error("Failed to create project:", err);
      toast.error(err.message || "Failed to create project");
      throw err;
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const updatedProject = await window.electronAPI.projects.update(id, projectData);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
      }));
      toast.success("Project updated successfully");
      return updatedProject;
    } catch (err) {
      log.error("Failed to update project:", err);
      toast.error(err.message || "Failed to update project");
      throw err;
    }
  },

  deleteProject: async (id) => {
    try {
      await window.electronAPI.projects.delete(id);
      set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
      toast.success("Project deleted successfully");
    } catch (err) {
      log.error("Failed to delete project:", err);
      toast.error(err.message || "Failed to delete project");
      throw err;
    }
  },

  exportProject: async (id) => {
    try {
      const project = get().projects.find((p) => p.id === id);
      if (!project) {
        toast.error("Project not found");
        return false;
      }
      const projectItems = await window.electronAPI.projects.getAllItems(id);
      return await exportImportService.exportProject(project, projectItems);
    } catch (err) {
      log.error("Failed to export project:", err);
      toast.error(err.message || "Failed to export project");
      return false;
    }
  },

  importProject: async (projectData, itemsData) => {
    try {
      const result = await window.electronAPI.projects.import(projectData, itemsData);
      set((state) => ({ projects: [result.project, ...state.projects] }));
      const totalItems = Object.values(result.importedCounts).reduce((sum, count) => sum + count, 0);
      toast.success(`Project imported successfully with ${totalItems} items`);
      return result.project;
    } catch (err) {
      log.error("Failed to import project:", err);
      toast.error(err.message || "Failed to import project");
      throw err;
    }
  },

  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id);
  },
}));
