/**
 * KNX IPC Handlers
 * Xử lý các tương tác với KNX items (RCU Controller và Database)
 */

export function registerKnxHandlers(ipcMain, dbService, rcu, loggerService) {
  // ==================== RCU Controller - KNX Operations ====================

  // Set KNX Config
  ipcMain.handle(
    "rcu:setKnxConfig",
    async (event, unitIp, canId, knxConfig, unitType) => {
      try {
        return await rcu.setKnxConfig(
          unitIp,
          canId,
          knxConfig,
          loggerService,
          unitType
        );
      } catch (error) {
        console.error("Error setting KNX config:", error);
        throw error;
      }
    }
  );

  // Get KNX Config
  ipcMain.handle(
    "rcu:getKnxConfig",
    async (event, { unitIp, canId, knxAddress }) => {
      try {
        return await rcu.getKnxConfig(unitIp, canId, knxAddress);
      } catch (error) {
        console.error("Error getting KNX config:", error);
        throw error;
      }
    }
  );

  // Delete KNX Config
  ipcMain.handle(
    "rcu:deleteKnxConfig",
    async (event, { unitIp, canId, knxAddress }) => {
      try {
        return await rcu.deleteKnxConfig(unitIp, canId, knxAddress);
      } catch (error) {
        console.error("Error deleting KNX config:", error);
        throw error;
      }
    }
  );

  // Delete All KNX Configs
  ipcMain.handle("rcu:deleteAllKnxConfigs", async (event, unitIp, canId) => {
    try {
      return await rcu.deleteAllKnxConfigs(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all KNX configs:", error);
      throw error;
    }
  });

  // Trigger KNX
  ipcMain.handle(
    "rcu:triggerKnx",
    async (event, { unitIp, canId, knxAddress }) => {
      try {
        return await rcu.triggerKnx(unitIp, canId, knxAddress);
      } catch (error) {
        console.error("Error triggering KNX:", error);
        throw error;
      }
    }
  );

  // ==================== Database - KNX Operations ====================

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
