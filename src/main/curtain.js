/**
 * Curtain IPC Handlers
 * Xử lý các tương tác với curtain items
 */

export function registerCurtainHandlers(ipcMain, dbService) {
  // Curtain CRUD operations
  ipcMain.handle("curtain:getAll", async (event, projectId) => {
    try {
      return await dbService.getCurtainItems(projectId);
    } catch (error) {
      console.error("Error getting curtain items:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createCurtainItemSimple(projectId, itemData);
    } catch (error) {
      console.error("Error creating curtain item:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:update", async (event, id, itemData) => {
    try {
      return await dbService.updateCurtainItem(id, itemData);
    } catch (error) {
      console.error("Error updating curtain item:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:delete", async (event, id) => {
    try {
      return await dbService.deleteCurtainItem(id);
    } catch (error) {
      console.error("Error deleting curtain item:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateCurtainItem(id);
    } catch (error) {
      console.error("Error duplicating curtain item:", error);
      throw error;
    }
  });
}
