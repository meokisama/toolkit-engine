/**
 * Project IPC Handlers
 * Xử lý các tương tác với projects (Database operations)
 */

export function registerProjectHandlers(ipcMain, dbService) {
  // ==================== Database - Project Operations ====================

  // Get all projects
  ipcMain.handle("projects:getAll", async () => {
    try {
      return await dbService.getAllProjects();
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  });

  // Get project by ID
  ipcMain.handle("projects:getById", async (event, id) => {
    try {
      return await dbService.getProjectById(id);
    } catch (error) {
      console.error("Error getting project by ID:", error);
      throw error;
    }
  });

  // Create project
  ipcMain.handle("projects:create", async (event, projectData) => {
    try {
      return await dbService.createProject(projectData);
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  });

  // Update project
  ipcMain.handle("projects:update", async (event, id, projectData) => {
    try {
      return await dbService.updateProject(id, projectData);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  });

  // Delete project
  ipcMain.handle("projects:delete", async (event, id) => {
    try {
      return await dbService.deleteProject(id);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  });

  // Duplicate project
  ipcMain.handle("projects:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateProject(id);
    } catch (error) {
      console.error("Error duplicating project:", error);
      throw error;
    }
  });

  // Get all project items in one call (optimized)
  ipcMain.handle("projects:getAllItems", async (event, projectId) => {
    try {
      return await dbService.getAllProjectItems(projectId);
    } catch (error) {
      console.error("Error getting all project items:", error);
      throw error;
    }
  });

  ipcMain.handle("projects:import", async (event, projectData, itemsData) => {
    try {
      return await dbService.importProject(projectData, itemsData);
    } catch (error) {
      console.error("Error importing project:", error);
      throw error;
    }
  });
}
