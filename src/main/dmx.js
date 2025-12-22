/**
 * DMX IPC Handlers
 * Xử lý các tương tác với DMX items (Database)
 */

export function registerDmxHandlers(ipcMain, dbService) {
  // ==================== Database - DMX Operations ====================

  // DMX CRUD operations
  ipcMain.handle("dmx:getAll", async (event, projectId) => {
    try {
      return await dbService.getDmxItems(projectId);
    } catch (error) {
      console.error("Error getting DMX items:", error);
      throw error;
    }
  });

  ipcMain.handle("dmx:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createDmxItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating DMX item:", error);
      throw error;
    }
  });

  ipcMain.handle("dmx:update", async (event, id, itemData) => {
    try {
      return await dbService.updateDmxItem(id, itemData);
    } catch (error) {
      console.error("Error updating DMX item:", error);
      throw error;
    }
  });

  ipcMain.handle("dmx:delete", async (event, id) => {
    try {
      return await dbService.deleteDmxItem(id);
    } catch (error) {
      console.error("Error deleting DMX item:", error);
      throw error;
    }
  });

  ipcMain.handle("dmx:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateDmxItem(id);
    } catch (error) {
      console.error("Error duplicating DMX item:", error);
      throw error;
    }
  });

  ipcMain.handle("dmx:bulkImport", async (event, projectId, items) => {
    try {
      const results = [];
      for (const item of items) {
        const result = await dbService.createDmxItem(projectId, item);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error("Error bulk importing DMX items:", error);
      throw error;
    }
  });
}
