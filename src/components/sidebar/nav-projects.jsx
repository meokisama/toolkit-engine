import React, { useState } from "react";
import {
  Folder,
  MoreHorizontal,
  SquarePen,
  Trash2,
  Copy,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/contexts/project-context";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function NavProjects() {
  const { isMobile } = useSidebar();
  const { projects, deleteProject, duplicateProject } = useProjects();
  const { selectProject, selectedProject } = useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreateProject = () => {
    setEditingProject(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDuplicateProject = async (project) => {
    try {
      await duplicateProject(project.id);
    } catch (error) {
      console.error("Failed to duplicate project:", error);
    }
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
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
  };

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
          {projects.length === 0 ? (
            <div className="px-2 py-4 text-xs text-muted-foreground text-center italic">
              No projects found.
            </div>
          ) : (
            projects.map((project) => {
              return (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    className={`text-gray-700 ${
                      selectedProject?.id === project.id ? "bg-accent" : ""
                    }`}
                    onClick={() => selectProject(project)}
                  >
                    <Folder />
                    <span>{project.name}</span>
                  </SidebarMenuButton>
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
    </>
  );
}
