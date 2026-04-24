import { useCallback } from "react";
import { useProjectNavStore } from "@/store/use-project-nav-store";
import { useProjectItemsStore } from "@/store/use-project-items-store";

export function useProjectDetail() {
  const selectedProject = useProjectNavStore((s) => s.selectedProject);
  const activeSection = useProjectNavStore((s) => s.activeSection);
  const activeTab = useProjectNavStore((s) => s.activeTab);

  const projectItems = useProjectItemsStore((s) => s.projectItems);
  const airconCards = useProjectItemsStore((s) => s.airconCards);
  const tabLoading = useProjectItemsStore((s) => s.tabLoading);
  const error = useProjectItemsStore((s) => s.error);

  const setActiveSection = useCallback((section) => {
    useProjectNavStore.getState().setActiveSection(section);
  }, []);

  const setActiveTab = useCallback((tabName) => {
    useProjectNavStore.getState().handleTabChange(tabName);
  }, []);

  const selectProject = useCallback((project) => {
    return useProjectNavStore.getState().selectProject(project);
  }, []);

  const selectProjectSection = useCallback((project, section) => {
    return useProjectNavStore.getState().selectProjectSection(project, section);
  }, []);

  // Support both old signature (projectId, tabName) and new (tabName)
  const loadTabData = useCallback((tabNameOrProjectId, tabName) => {
    const resolvedTabName = tabName ?? tabNameOrProjectId;
    const projectId = useProjectNavStore.getState().selectedProject?.id;
    return useProjectItemsStore.getState().loadTabData(projectId, resolvedTabName);
  }, []);

  const createItem = useCallback((category, itemData, silent) => {
    const projectId = useProjectNavStore.getState().selectedProject?.id;
    return useProjectItemsStore.getState().createItem(category, itemData, projectId, silent);
  }, []);

  const updateItem = useCallback((category, id, itemData) => {
    return useProjectItemsStore.getState().updateItem(category, id, itemData);
  }, []);

  const deleteItem = useCallback((category, id) => {
    return useProjectItemsStore.getState().deleteItem(category, id);
  }, []);

  const duplicateItem = useCallback((category, id) => {
    return useProjectItemsStore.getState().duplicateItem(category, id);
  }, []);

  const createAirconCard = useCallback((cardData) => {
    const projectId = useProjectNavStore.getState().selectedProject?.id;
    return useProjectItemsStore.getState().createAirconCard(cardData, projectId);
  }, []);

  const updateAirconCard = useCallback((cardData, originalCard) => {
    const projectId = useProjectNavStore.getState().selectedProject?.id;
    return useProjectItemsStore.getState().updateAirconCard(cardData, originalCard, projectId);
  }, []);

  const deleteAirconCard = useCallback((projectId, address) => {
    return useProjectItemsStore.getState().deleteAirconCard(projectId, address);
  }, []);

  const duplicateAirconCard = useCallback((projectId, address) => {
    return useProjectItemsStore.getState().duplicateAirconCard(projectId, address);
  }, []);

  const exportItems = useCallback((category) => {
    const project = useProjectNavStore.getState().selectedProject;
    return useProjectItemsStore.getState().exportItems(category, project);
  }, []);

  const importItems = useCallback((category, data, silent) => {
    const project = useProjectNavStore.getState().selectedProject;
    return useProjectItemsStore.getState().importItems(category, data, project, silent);
  }, []);

  return {
    // state
    selectedProject,
    activeSection,
    activeTab,
    projectItems,
    airconCards,
    tabLoading,
    error,
    // actions
    setActiveSection,
    setActiveTab,
    selectProject,
    selectProjectSection,
    loadTabData,
    createItem,
    updateItem,
    deleteItem,
    duplicateItem,
    createAirconCard,
    updateAirconCard,
    deleteAirconCard,
    duplicateAirconCard,
    exportItems,
    importItems,
  };
}
