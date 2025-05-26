import React, { useState, useCallback } from "react";
import {
  Folder,
  MoreHorizontal,
  SquarePen,
  Trash2,
  Copy,
  Plus,
  Download,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/contexts/project-context";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportDialog } from "@/components/projects/import-dialog";

export function NavProjects() {
  const { isMobile } = useSidebar();
  const {
    projects,
    loading,
    deleteProject,
    duplicateProject,
    exportProject,
    importProject,
  } = useProjects();
  const { selectProject, selectedProject } = useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

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

  const handleDuplicateProject = useCallback(
    async (project) => {
      try {
        await duplicateProject(project.id);
      } catch (error) {
        console.error("Failed to duplicate project:", error);
      }
    },
    [duplicateProject]
  );

  const handleDeleteProject = useCallback((project) => {
    setProjectToDelete(project);
    setConfirmDialogOpen(true);
  }, []);

  const handleExportProject = useCallback(
    async (project) => {
      try {
        await exportProject(project.id);
      } catch (error) {
        console.error("Failed to export project:", error);
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
        selectProject(newProject);
      } catch (error) {
        console.error("Failed to import project:", error);
      }
    },
    [importProject, selectProject]
  );

  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteProject(projectToDelete.id);
      setConfirmDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [projectToDelete, deleteProject]);

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateProject}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Project</span>
          </Button>
        </div>
        <SidebarMenu>
          {loading ? (
            // Show skeleton while loading
            Array.from({ length: 3 }).map((_, index) => (
              <SidebarMenuSkeleton key={index} showIcon />
            ))
          ) : projects.length === 0 ? (
            <div className="px-2 py-4 text-xs text-muted-foreground text-center italic">
              No projects found.
            </div>
          ) : (
            projects.map((project) => {
              return (
                <SidebarMenuItem key={project.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <SidebarMenuButton
                        className={`text-gray-700 cursor-pointer ${
                          selectedProject?.id === project.id ? "bg-accent" : ""
                        }`}
                        onClick={() => selectProject(project)}
                      >
                        <Folder />
                        <span>{project.name}</span>
                      </SidebarMenuButton>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48 text-gray-700">
                      <ContextMenuItem
                        onClick={() => handleEditProject(project)}
                        className="cursor-pointer"
                      >
                        <SquarePen className="text-muted-foreground" />
                        <span>Edit Project</span>
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleDuplicateProject(project)}
                        className="cursor-pointer"
                      >
                        <Copy className="text-muted-foreground" />
                        <span>Duplicate Project</span>
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleExportProject(project)}
                        className="cursor-pointer"
                      >
                        <Download className="text-muted-foreground" />
                        <span>Export Project</span>
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={handleImportProject}
                        className="cursor-pointer"
                      >
                        <Upload className="text-muted-foreground" />
                        <span>Import Project</span>
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDeleteProject(project)}
                        className="cursor-pointer"
                        variant="destructive"
                      >
                        <Trash2 />
                        <span>Delete Project</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 text-gray-700"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem
                        onClick={() => handleEditProject(project)}
                      >
                        <SquarePen className="text-muted-foreground" />
                        <span>Edit Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicateProject(project)}
                      >
                        <Copy className="text-muted-foreground" />
                        <span>Duplicate Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleExportProject(project)}
                      >
                        <Download className="text-muted-foreground" />
                        <span>Export Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleImportProject}>
                        <Upload className="text-muted-foreground" />
                        <span>Import Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteProject(project)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="text-red-600" />
                        <span>Delete Project</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })
          )}
        </SidebarMenu>
      </SidebarGroup>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        mode={dialogMode}
      />

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

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportConfirm}
      />
    </>
  );
}
