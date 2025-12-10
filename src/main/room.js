/**
 * Room IPC Handlers
 * Xử lý các tương tác với room configuration (RCU Controller và Database)
 */

export function registerRoomHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Room Configuration ====================

  // Set room configuration on RCU device
  ipcMain.handle(
    "rcu:setRoomConfiguration",
    async (event, unitIp, canId, generalConfig, roomConfigs) => {
      try {
        return await rcu.setRoomConfiguration(
          unitIp,
          canId,
          generalConfig,
          roomConfigs
        );
      } catch (error) {
        console.error("Error setting room configuration:", error);
        throw error;
      }
    }
  );

  // Get room configuration from RCU device
  ipcMain.handle("rcu:getRoomConfiguration", async (event, unitIp, canId) => {
    try {
      return await rcu.getRoomConfiguration(unitIp, canId);
    } catch (error) {
      console.error("Error getting room configuration:", error);
      throw error;
    }
  });

  // Get room status from RCU device
  ipcMain.handle("rcu:getRoomStatus", async (event, unitIp, canId) => {
    try {
      return await rcu.getRoomStatus(unitIp, canId);
    } catch (error) {
      console.error("Error getting room status:", error);
      throw error;
    }
  });

  // Set room status on RCU device
  ipcMain.handle(
    "rcu:setRoomStatus",
    async (event, unitIp, canId, airconMode, roomStatuses) => {
      try {
        return await rcu.setRoomStatus(unitIp, canId, airconMode, roomStatuses);
      } catch (error) {
        console.error("Error setting room status:", error);
        throw error;
      }
    }
  );

  // ==================== Database - Room Configuration ====================

  // Get room general config from database
  ipcMain.handle("room:getGeneralConfig", async (event, projectId) => {
    try {
      return await dbService.getRoomGeneralConfig(projectId);
    } catch (error) {
      console.error("Error getting room general config:", error);
      throw error;
    }
  });

  // Create or update room general config in database
  ipcMain.handle("room:setGeneralConfig", async (event, projectId, config) => {
    try {
      return await dbService.createOrUpdateRoomGeneralConfig(projectId, config);
    } catch (error) {
      console.error("Error setting room general config:", error);
      throw error;
    }
  });

  // Get room config for specific address from database
  ipcMain.handle(
    "room:getRoomConfig",
    async (event, projectId, roomAddress) => {
      try {
        return await dbService.getRoomConfig(projectId, roomAddress);
      } catch (error) {
        console.error("Error getting room config:", error);
        throw error;
      }
    }
  );

  // Get all room configs for project from database
  ipcMain.handle("room:getAllRoomConfigs", async (event, projectId) => {
    try {
      return await dbService.getAllRoomConfigs(projectId);
    } catch (error) {
      console.error("Error getting all room configs:", error);
      throw error;
    }
  });

  // Create or update room config in database
  ipcMain.handle(
    "room:setRoomConfig",
    async (event, projectId, roomAddress, config) => {
      try {
        return await dbService.createOrUpdateRoomConfig(
          projectId,
          roomAddress,
          config
        );
      } catch (error) {
        console.error("Error setting room config:", error);
        throw error;
      }
    }
  );

  // Delete room config from database
  ipcMain.handle(
    "room:deleteRoomConfig",
    async (event, projectId, roomAddress) => {
      try {
        return await dbService.deleteRoomConfig(projectId, roomAddress);
      } catch (error) {
        console.error("Error deleting room config:", error);
        throw error;
      }
    }
  );

  // Delete all room configs for project from database
  ipcMain.handle("room:deleteAllRoomConfigs", async (event, projectId) => {
    try {
      return await dbService.deleteAllRoomConfigs(projectId);
    } catch (error) {
      console.error("Error deleting all room configs:", error);
      throw error;
    }
  });
}
