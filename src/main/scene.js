/**
 * Scene IPC Handlers
 * Xử lý các tương tác với scene items (RCU Controller và Database)
 */

export function registerSceneHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Scene Operations ====================

  // Setup Scene
  ipcMain.handle("rcu:setupScene", async (event, unitIp, canId, sceneConfig) => {
    try {
      return await rcu.setupScene(unitIp, canId, sceneConfig);
    } catch (error) {
      console.error("Error setting up scene:", error);
      throw error;
    }
  });

  // Get Scene Information
  ipcMain.handle("rcu:getSceneInformation", async (event, { unitIp, canId, sceneIndex }) => {
    try {
      return await rcu.getSceneInformation(unitIp, canId, sceneIndex);
    } catch (error) {
      console.error("Error getting scene information:", error);
      throw error;
    }
  });

  // Get All Scenes Information
  ipcMain.handle("rcu:getAllScenesInformation", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getAllScenesInformation(unitIp, canId);
    } catch (error) {
      console.error("Error getting all scenes information:", error);
      throw error;
    }
  });

  // Trigger Scene
  ipcMain.handle("rcu:triggerScene", async (event, { unitIp, canId, sceneIndex, sceneAddress }) => {
    try {
      return await rcu.triggerScene(unitIp, canId, sceneAddress);
    } catch (error) {
      console.error("Error triggering scene:", error);
      throw error;
    }
  });

  // Delete Scene
  ipcMain.handle("rcu:deleteScene", async (event, unitIp, canId, sceneIndex) => {
    try {
      return await rcu.deleteScene(unitIp, canId, sceneIndex);
    } catch (error) {
      console.error("Error deleting scene:", error);
      throw error;
    }
  });

  // Delete All Scenes
  ipcMain.handle("rcu:deleteAllScenes", async (event, unitIp, canId) => {
    try {
      return await rcu.deleteAllScenes(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all scenes:", error);
      throw error;
    }
  });

  // ==================== Database - Scene Operations ====================

  // Scene CRUD operations
  ipcMain.handle("scene:getAll", async (event, projectId) => {
    try {
      return await dbService.getSceneItems(projectId);
    } catch (error) {
      console.error("Error getting scene items:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createSceneItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating scene item:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:update", async (event, id, itemData) => {
    try {
      return await dbService.updateSceneItem(id, itemData);
    } catch (error) {
      console.error("Error updating scene item:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:delete", async (event, id) => {
    try {
      return await dbService.deleteSceneItem(id);
    } catch (error) {
      console.error("Error deleting scene item:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateSceneItem(id);
    } catch (error) {
      console.error("Error duplicating scene item:", error);
      throw error;
    }
  });

  // Scene Items Management
  ipcMain.handle("scene:getItemsWithDetails", async (event, sceneId) => {
    try {
      return await dbService.getSceneItemsWithDetails(sceneId);
    } catch (error) {
      console.error("Error getting scene items with details:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:addItem", async (event, sceneId, itemType, itemId, itemValue, command, objectType) => {
    try {
      return await dbService.addItemToScene(sceneId, itemType, itemId, itemValue, command, objectType);
    } catch (error) {
      console.error("Error adding item to scene:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:removeItem", async (event, sceneItemId) => {
    try {
      return await dbService.removeItemFromScene(sceneItemId);
    } catch (error) {
      console.error("Error removing item from scene:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:updateItemValue", async (event, sceneItemId, itemValue, command) => {
    try {
      return await dbService.updateSceneItemValue(sceneItemId, itemValue, command);
    } catch (error) {
      console.error("Error updating scene item value:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:canAddItemToScene", async (event, projectId, address, itemType, itemId, objectType, excludeSceneId) => {
    try {
      return await dbService.canAddItemToScene(projectId, address, itemType, itemId, objectType, excludeSceneId);
    } catch (error) {
      console.error("Error checking if item can be added to scene:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:getAddressItems", async (event, projectId, address) => {
    try {
      return await dbService.getSceneAddressItems(projectId, address);
    } catch (error) {
      console.error("Error getting scene address items:", error);
      throw error;
    }
  });

  // Bulk import
  ipcMain.handle("scene:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "scene");
    } catch (error) {
      console.error("Error bulk importing scene items:", error);
      throw error;
    }
  });
}
