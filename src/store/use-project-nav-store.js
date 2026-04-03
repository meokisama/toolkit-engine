import { create } from "zustand";
import { useProjectItemsStore } from "./use-project-items-store";

const initialState = {
  selectedProject: null,
  activeSection: "group-config",
  activeTab: "lighting",
};

export const useProjectNavStore = create((set, get) => ({
  ...initialState,

  setActiveSection: (section) => set({ activeSection: section }),

  handleTabChange: (tabName) => set({ activeTab: tabName }),

  // Main entry point: called from sidebar when user picks a project + section.
  // Resets ALL item data when the project changes; preserves data when only
  // the section changes within the same project.
  selectProjectSection: async (project, section) => {
    const { selectedProject } = get();
    const projectChanged = selectedProject?.id !== project?.id;

    set({
      selectedProject: project,
      activeSection: section,
      activeTab: section === "group-config" ? "lighting" : "scene",
    });

    if (!project) {
      useProjectItemsStore.getState().reset();
      return;
    }

    if (projectChanged) {
      useProjectItemsStore.getState().reset();
      await useProjectItemsStore.getState().loadAllTabs(project.id);
    }
  },

  // Legacy alias kept for backward compatibility
  selectProject: async (project) => {
    await get().selectProjectSection(project, "group-config");
  },
}));
