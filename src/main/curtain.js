/**
 * Curtain IPC Handlers
 * Xử lý các tương tác với curtain items (RCU Controller và Database)
 */

export function registerCurtainHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Curtain Operations ====================

  // Get Curtain Config
  ipcMain.handle(
    "rcu:getCurtainConfig",
    async (event, { unitIp, canId, curtainIndex }) => {
      try {
        return await rcu.getCurtainConfig(unitIp, canId, curtainIndex);
      } catch (error) {
        console.error("Error getting curtain configuration:", error);
        throw error;
      }
    }
  );

  // Set Curtain
  ipcMain.handle(
    "rcu:setCurtain",
    async (event, { unitIp, canId, curtainAddress, value }) => {
      try {
        return await rcu.setCurtain(unitIp, canId, curtainAddress, value);
      } catch (error) {
        console.error("Error setting curtain:", error);
        throw error;
      }
    }
  );

  // Set Curtain Config
  ipcMain.handle(
    "rcu:setCurtainConfig",
    async (event, unitIp, canId, curtainConfig) => {
      try {
        return await rcu.setCurtainConfig(unitIp, canId, curtainConfig);
      } catch (error) {
        console.error("Error setting curtain configuration:", error);
        throw error;
      }
    }
  );

  // Delete Curtain
  ipcMain.handle(
    "rcu:deleteCurtain",
    async (event, { unitIp, canId, curtainIndex }) => {
      try {
        return await rcu.deleteCurtain(unitIp, canId, curtainIndex);
      } catch (error) {
        console.error("Error deleting curtain:", error);
        throw error;
      }
    }
  );

  // Delete All Curtains
  ipcMain.handle("rcu:deleteAllCurtains", async (event, unitIp, canId) => {
    try {
      return await rcu.deleteAllCurtains(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all curtains:", error);
      throw error;
    }
  });

  // ==================== Database - Curtain Operations ====================

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

  ipcMain.handle("curtain:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "curtain");
    } catch (error) {
      console.error("Error bulk importing curtain items:", error);
      throw error;
    }
  });
}
