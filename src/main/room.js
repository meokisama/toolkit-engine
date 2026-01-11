export function registerRoomHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Room Configuration ====================

  // Set room configuration on RCU device
  ipcMain.handle("rcu:setRoomConfiguration", async (event, unitIp, canId, generalConfig, roomConfigs) => {
    try {
      return await rcu.setRoomConfiguration(unitIp, canId, generalConfig, roomConfigs);
    } catch (error) {
      console.error("Error setting room configuration:", error);
      throw error;
    }
  });

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
  ipcMain.handle("rcu:setRoomStatus", async (event, unitIp, canId, airconMode, roomStatuses) => {
    try {
      return await rcu.setRoomStatus(unitIp, canId, airconMode, roomStatuses);
    } catch (error) {
      console.error("Error setting room status:", error);
      throw error;
    }
  });

  // ==================== Database - Room Configuration ====================

  // Get room general config from database
  ipcMain.handle("room:getGeneralConfig", async (event, projectId, sourceUnit = null) => {
    try {
      return await dbService.getRoomGeneralConfig(projectId, sourceUnit);
    } catch (error) {
      console.error("Error getting room general config:", error);
      throw error;
    }
  });

  // Create or update room general config in database
  ipcMain.handle("room:setGeneralConfig", async (event, projectId, config, sourceUnit = null) => {
    try {
      return await dbService.createOrUpdateRoomGeneralConfig(projectId, config, sourceUnit);
    } catch (error) {
      console.error("Error setting room general config:", error);
      throw error;
    }
  });

  // Get all room general configs for a project (all units)
  ipcMain.handle("room:getAllGeneralConfigs", async (event, projectId) => {
    try {
      return await dbService.getAllRoomGeneralConfigs(projectId);
    } catch (error) {
      console.error("Error getting all room general configs:", error);
      throw error;
    }
  });

  // Get all room configs for a general config ID from database
  ipcMain.handle("room:getAllRoomConfigs", async (event, generalConfigId) => {
    try {
      return await dbService.getAllRoomDetailConfigs(generalConfigId);
    } catch (error) {
      console.error("Error getting all room configs:", error);
      throw error;
    }
  });

  // Get all room configs for project and source unit from database
  ipcMain.handle("room:getAllRoomConfigsByUnit", async (event, projectId, sourceUnit = null) => {
    try {
      return await dbService.getAllRoomDetailConfigsByProjectAndUnit(projectId, sourceUnit);
    } catch (error) {
      console.error("Error getting all room configs by unit:", error);
      throw error;
    }
  });

  // Create or update room config in database
  ipcMain.handle("room:setRoomConfig", async (event, projectId, sourceUnit, roomAddress, config) => {
    try {
      // Get or create the general config
      let generalConfig = await dbService.getRoomGeneralConfig(projectId, sourceUnit);

      if (!generalConfig) {
        // Create a default general config if not exists
        console.log("General config not found, creating default config for unit:", sourceUnit);
        generalConfig = await dbService.createOrUpdateRoomGeneralConfig(
          projectId,
          {
            roomMode: 0,
            roomAmount: 1,
            tcpMode: 0,
            port: 5000,
            slaveAmount: 1,
            slaveIPs: ["", "", "", ""],
            clientMode: 0,
            clientIP: "",
            clientPort: 8080,
          },
          sourceUnit
        );
      }

      if (!generalConfig || !generalConfig.id) {
        throw new Error("Failed to get or create general config");
      }

      return await dbService.createOrUpdateRoomDetailConfig(generalConfig.id, roomAddress, config);
    } catch (error) {
      console.error("Error setting room config:", error);
      throw error;
    }
  });

  // Delete room general config and all its room configs
  ipcMain.handle("room:deleteRoomGeneralConfig", async (event, projectId, sourceUnit = null) => {
    try {
      return await dbService.deleteRoomGeneralConfig(projectId, sourceUnit);
    } catch (error) {
      console.error("Error deleting room general config:", error);
      throw error;
    }
  });
}
