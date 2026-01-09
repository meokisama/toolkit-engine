export function registerLightingHandlers(ipcMain, dbService) {
  // Lighting CRUD operations
  ipcMain.handle("lighting:getAll", async (event, projectId) => {
    try {
      return await dbService.getLightingItems(projectId);
    } catch (error) {
      console.error("Error getting lighting items:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createLightingItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating lighting item:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:update", async (event, id, itemData) => {
    try {
      return await dbService.updateLightingItem(id, itemData);
    } catch (error) {
      console.error("Error updating lighting item:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:delete", async (event, id) => {
    try {
      return await dbService.deleteLightingItem(id);
    } catch (error) {
      console.error("Error deleting lighting item:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateLightingItem(id);
    } catch (error) {
      console.error("Error duplicating lighting item:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "lighting");
    } catch (error) {
      console.error("Error bulk importing lighting items:", error);
      throw error;
    }
  });
}
