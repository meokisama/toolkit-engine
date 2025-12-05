/**
 * KNX IPC Handlers
 * Xử lý các tương tác với KNX items
 */

export function registerKnxHandlers(ipcMain, dbService) {
  // KNX CRUD operations
  ipcMain.handle("knx:getAll", async (event, projectId) => {
    try {
      return await dbService.getProjectItems(projectId, "knx");
    } catch (error) {
      console.error("Error getting KNX items:", error);
      throw error;
    }
  });

  ipcMain.handle("knx:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createProjectItem(projectId, itemData, "knx");
    } catch (error) {
      console.error("Error creating KNX item:", error);
      throw error;
    }
  });

  ipcMain.handle("knx:update", async (event, id, itemData) => {
    try {
      return await dbService.updateProjectItem(id, itemData, "knx");
    } catch (error) {
      console.error("Error updating KNX item:", error);
      throw error;
    }
  });

  ipcMain.handle("knx:delete", async (event, id) => {
    try {
      return await dbService.deleteProjectItem(id, "knx");
    } catch (error) {
      console.error("Error deleting KNX item:", error);
      throw error;
    }
  });

  ipcMain.handle("knx:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateProjectItem(id, "knx");
    } catch (error) {
      console.error("Error duplicating KNX item:", error);
      throw error;
    }
  });

  ipcMain.handle("knx:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "knx");
    } catch (error) {
      console.error("Error bulk importing KNX items:", error);
      throw error;
    }
  });
}
