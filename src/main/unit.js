/**
 * Unit IPC Handlers
 * Xử lý các tương tác với unit items và I/O configurations
 */

export function registerUnitHandlers(ipcMain, dbService) {
  // Unit CRUD operations
  ipcMain.handle("unit:getAll", async (event, projectId) => {
    try {
      return await dbService.getUnitItems(projectId);
    } catch (error) {
      console.error("Error getting unit items:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:getById", async (event, id) => {
    try {
      return await dbService.getProjectItemById(id, "unit");
    } catch (error) {
      console.error("Error getting unit by ID:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createUnitItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating unit item:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:update", async (event, id, itemData) => {
    try {
      return await dbService.updateUnitItem(id, itemData);
    } catch (error) {
      console.error("Error updating unit item:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:delete", async (event, id) => {
    try {
      return await dbService.deleteUnitItem(id);
    } catch (error) {
      console.error("Error deleting unit item:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:deleteWithRelatedItems", async (event, id) => {
    try {
      return await dbService.deleteUnitAndRelatedItems(id);
    } catch (error) {
      console.error("Error deleting unit with related items:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateUnitItem(id);
    } catch (error) {
      console.error("Error duplicating unit item:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "unit");
    } catch (error) {
      console.error("Error bulk importing unit items:", error);
      throw error;
    }
  });

  // Unit Output Configuration handlers
  ipcMain.handle("unit:getOutputConfig", async (event, unitId, outputIndex) => {
    try {
      return await dbService.getUnitOutputConfig(unitId, outputIndex);
    } catch (error) {
      console.error("Error getting unit output config:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:saveOutputConfig", async (event, unitId, outputIndex, outputType, configData) => {
    try {
      return await dbService.saveUnitOutputConfig(unitId, outputIndex, outputType, configData);
    } catch (error) {
      console.error("Error saving unit output config:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:deleteOutputConfig", async (event, unitId, outputIndex) => {
    try {
      return await dbService.deleteUnitOutputConfig(unitId, outputIndex);
    } catch (error) {
      console.error("Error deleting unit output config:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:getAllOutputConfigs", async (event, unitId) => {
    try {
      return await dbService.getAllUnitOutputConfigs(unitId);
    } catch (error) {
      console.error("Error getting all unit output configs:", error);
      throw error;
    }
  });

  // Unit Input Configuration handlers
  ipcMain.handle("unit:getInputConfig", async (event, unitId, inputIndex) => {
    try {
      return await dbService.getUnitInputConfig(unitId, inputIndex);
    } catch (error) {
      console.error("Error getting unit input config:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:saveInputConfig", async (event, unitId, inputIndex, functionValue, lightingId, multiGroupConfig, rlcConfig) => {
    try {
      return await dbService.saveUnitInputConfig(unitId, inputIndex, functionValue, lightingId, multiGroupConfig, rlcConfig);
    } catch (error) {
      console.error("Error saving unit input config:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:deleteInputConfig", async (event, unitId, inputIndex) => {
    try {
      return await dbService.deleteUnitInputConfig(unitId, inputIndex);
    } catch (error) {
      console.error("Error deleting unit input config:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:getAllInputConfigs", async (event, unitId) => {
    try {
      return await dbService.getAllUnitInputConfigs(unitId);
    } catch (error) {
      console.error("Error getting all unit input configs:", error);
      throw error;
    }
  });

  ipcMain.handle("unit:clearAllIOConfigs", async (event, unitId) => {
    try {
      return await dbService.clearAllUnitIOConfigs(unitId);
    } catch (error) {
      console.error("Error clearing all unit I/O configs:", error);
      throw error;
    }
  });
}
