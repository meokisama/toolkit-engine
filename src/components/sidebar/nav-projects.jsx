import React, { useState, useCallback } from "react";
import { Folder, SquarePen, Trash2, Plus, Download, Upload, ChevronRight, Library, Workflow, Home, Eclipse } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/contexts/project-context";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportDialog } from "@/components/projects/import-project-dialog";
import log from "electron-log/renderer";

export function NavProjects() {
  const { isMobile } = useSidebar();
  const { projects, loading, deleteProject, exportProject, importProject } = useProjects();
  const { selectProjectSection, selectedProject, activeSection } = useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  // Memoize handlers to prevent unnecessary rerenders
  const handleCreateProject = useCallback(() => {
    setEditingProject(null);
    setDialogMode("create");
    setDialogOpen(true);
  }, []);

  const handleEditProject = useCallback((project) => {
    setEditingProject(project);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  const handleDeleteProject = useCallback((project) => {
    setProjectToDelete(project);
    setConfirmDialogOpen(true);
  }, []);

  const handleExportProject = useCallback(
    async (project) => {
      try {
        await exportProject(project.id);
      } catch (error) {
        log.error("Failed to export project:", error);
      }
    },
    [exportProject]
  );

  const handleImportProject = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportConfirm = useCallback(
    async (projectData, itemsData) => {
      try {
        const newProject = await importProject(projectData, itemsData);
        // Optionally select the newly imported project
        selectProjectSection(newProject, "group-config");
      } catch (error) {
        log.error("Failed to import project:", error);
      }
    },
    [importProject, selectProjectSection]
  );

  // Toggle project expansion
  const toggleProject = useCallback((projectId) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  // Handle section selection
  const handleSectionSelect = useCallback(
    (project, section) => {
      selectProjectSection(project, section);
      // Expand the project if it's not already expanded
      setExpandedProjects((prev) => new Set([...prev, project.id]));
    },
    [selectProjectSection]
  );

  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;

    setDeleteLoading(true);
    try {
      // Check if the project being deleted is currently selected
      const isCurrentlySelected = selectedProject?.id === projectToDelete.id;

      await deleteProject(projectToDelete.id);

      // If the deleted project was currently selected, go back to main page
      if (isCurrentlySelected) {
        selectProjectSection(null, "group-config");
      }

      setConfirmDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      log.error("Failed to delete project:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [projectToDelete, deleteProject, selectedProject, selectProjectSection]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <Button variant="ghost" size="sm" onClick={handleCreateProject} className="h-6 w-6 p-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add Project</span>
              </Button>
            </div>
            <SidebarMenu>
              {loading ? (
                // Show skeleton while loading
                Array.from({ length: 3 }).map((_, index) => <SidebarMenuSkeleton key={index} showIcon />)
              ) : projects.length === 0 ? (
                <div className="px-2 py-4 text-xs text-muted-foreground text-center italic">No projects found.</div>
              ) : (
                projects.map((project) => {
                  const isExpanded = expandedProjects.has(project.id);
                  const isSelected = selectedProject?.id === project.id;

                  return (
                    <Collapsible key={project.id} open={isExpanded} onOpenChange={() => toggleProject(project.id)}>
                      <SidebarMenuItem>
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <SidebarMenuButton className="text-gray-700 cursor-pointer" onClick={() => toggleProject(project.id)}>
                              <Folder />
                              <span>{project.name}</span>
                            </SidebarMenuButton>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48 text-gray-700">
                            <ContextMenuItem onClick={() => handleEditProject(project)} className="cursor-pointer">
                              <SquarePen className="text-muted-foreground" />
                              <span>Edit Project</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => handleExportProject(project)} className="cursor-pointer">
                              <Download className="text-muted-foreground" />
                              <span>Export Project</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={handleImportProject} className="cursor-pointer">
                              <Upload className="text-muted-foreground" />
                              <span>Import Project</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => handleDeleteProject(project)} className="cursor-pointer" variant="destructive">
                              <Trash2 />
                              <span>Delete Project</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="data-[state=open]:rotate-90">
                            <ChevronRight />
                            <span className="sr-only">Toggle</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                className={`text-gray-700 cursor-pointer ${isSelected && activeSection === "group-config" ? "bg-accent" : ""}`}
                                onClick={() => handleSectionSelect(project, "group-config")}
                              >
                                <Library className="h-4 w-4" />
                                <span>Configuration</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                className={`text-gray-700 cursor-pointer ${isSelected && activeSection === "scenes-schedules" ? "bg-accent" : ""}`}
                                onClick={() => handleSectionSelect(project, "scenes-schedules")}
                              >
                                <Workflow className="h-4 w-4" />
                                <span>Automation</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                className={`text-gray-700 cursor-pointer ${isSelected && activeSection === "dali-core" ? "bg-accent" : ""}`}
                                onClick={() => handleSectionSelect(project, "dali-core")}
                              >
                                <Eclipse className="h-4 w-4" />
                                <span>Dali Interface</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                className={`text-gray-700 cursor-pointer ${isSelected && activeSection === "smarthome" ? "bg-accent" : ""}`}
                                onClick={() => handleSectionSelect(project, "smarthome")}
                              >
                                <Home className="h-4 w-4" />
                                <span>Smarthome</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 text-gray-700">
          <ContextMenuItem onClick={handleCreateProject} className="cursor-pointer">
            <Plus className="text-muted-foreground" />
            <span>Add Project</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleImportProject} className="cursor-pointer">
            <Upload className="text-muted-foreground" />
            <span>Import Project</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editingProject} mode={dialogMode} />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteProject}
        loading={deleteLoading}
      />

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImportConfirm} />
    </>
  );
}
