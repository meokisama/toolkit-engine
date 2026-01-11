export function registerAirconHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Air Conditioner Operations ====================

  // Get AC Status
  ipcMain.handle("rcu:getACStatus", async (event, { canId, unitIp, group }) => {
    try {
      return await rcu.getACStatus(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting AC status:", error);
      throw error;
    }
  });

  // Get Room Temperature
  ipcMain.handle("rcu:getRoomTemp", async (event, { canId, unitIp, group }) => {
    try {
      return await rcu.getRoomTemp(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting room temperature:", error);
      throw error;
    }
  });

  // Set Setting Room Temperature
  ipcMain.handle("rcu:setSettingRoomTemp", async (event, { canId, unitIp, group, temperature }) => {
    try {
      return await rcu.setSettingRoomTemp(unitIp, canId, group, temperature);
    } catch (error) {
      console.error("Error setting room temperature:", error);
      throw error;
    }
  });

  // Get Setting Room Temperature
  ipcMain.handle("rcu:getSettingRoomTemp", async (event, { canId, unitIp, group }) => {
    try {
      return await rcu.getSettingRoomTemp(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting setting room temperature:", error);
      throw error;
    }
  });

  // Set Fan Mode
  ipcMain.handle("rcu:setFanMode", async (event, { canId, unitIp, group, fanSpeed }) => {
    try {
      return await rcu.setFanMode(unitIp, canId, group, fanSpeed);
    } catch (error) {
      console.error("Error setting fan mode:", error);
      throw error;
    }
  });

  // Get Fan Mode
  ipcMain.handle("rcu:getFanMode", async (event, { canId, unitIp, group }) => {
    try {
      return await rcu.getFanMode(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting fan mode:", error);
      throw error;
    }
  });

  // Set Power Mode
  ipcMain.handle("rcu:setPowerMode", async (event, { canId, unitIp, group, power }) => {
    try {
      return await rcu.setPowerMode(unitIp, canId, group, power);
    } catch (error) {
      console.error("Error setting power mode:", error);
      throw error;
    }
  });

  // Get Power Mode
  ipcMain.handle("rcu:getPowerMode", async (event, { canId, unitIp, group }) => {
    try {
      return await rcu.getPowerMode(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting power mode:", error);
      throw error;
    }
  });

  // Set Operate Mode
  ipcMain.handle("rcu:setOperateMode", async (event, { canId, unitIp, group, mode }) => {
    try {
      return await rcu.setOperateMode(unitIp, canId, group, mode);
    } catch (error) {
      console.error("Error setting operate mode:", error);
      throw error;
    }
  });

  // Get Operate Mode
  ipcMain.handle("rcu:getOperateMode", async (event, { canId, unitIp, group }) => {
    try {
      return await rcu.getOperateMode(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting operate mode:", error);
      throw error;
    }
  });

  // Set Eco Mode
  ipcMain.handle("rcu:setEcoMode", async (event, { canId, unitIp, group, eco }) => {
    try {
      return await rcu.setEcoMode(unitIp, canId, group, eco);
    } catch (error) {
      console.error("Error setting eco mode:", error);
      throw error;
    }
  });

  // Get Eco Mode
  ipcMain.handle("rcu:getEcoMode", async (event, { canId, unitIp, group }) => {
    try {
      return await rcu.getEcoMode(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting eco mode:", error);
      throw error;
    }
  });

  // ==================== Database - Aircon Operations ====================

  // Aircon items CRUD operations
  ipcMain.handle("aircon:getAll", async (event, projectId) => {
    try {
      return await dbService.getAirconItems(projectId);
    } catch (error) {
      console.error("Error getting aircon items:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createAirconItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating aircon item:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:update", async (event, id, itemData) => {
    try {
      return await dbService.updateAirconItem(id, itemData);
    } catch (error) {
      console.error("Error updating aircon item:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:delete", async (event, id) => {
    try {
      return await dbService.deleteAirconItem(id);
    } catch (error) {
      console.error("Error deleting aircon item:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateAirconItem(id);
    } catch (error) {
      console.error("Error duplicating aircon item:", error);
      throw error;
    }
  });

  // Aircon cards operations
  ipcMain.handle("aircon:getCards", async (event, projectId) => {
    try {
      return await dbService.getAirconCards(projectId);
    } catch (error) {
      console.error("Error getting aircon cards:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:createCard", async (event, projectId, cardData) => {
    try {
      return await dbService.createAirconCard(projectId, cardData);
    } catch (error) {
      console.error("Error creating aircon card:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:deleteCard", async (event, projectId, address) => {
    try {
      return await dbService.deleteAirconCard(projectId, address);
    } catch (error) {
      console.error("Error deleting aircon card:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:duplicateCard", async (event, projectId, address) => {
    try {
      return await dbService.duplicateAirconCard(projectId, address);
    } catch (error) {
      console.error("Error duplicating aircon card:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "aircon");
    } catch (error) {
      console.error("Error bulk importing aircon items:", error);
      throw error;
    }
  });
}
