/**
 * Multi-Scene IPC Handlers
 * Xử lý các tương tác với multi-scene items (RCU Controller và Database)
 */

export function registerMultiSceneHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Multi-Scene Operations ====================

  // Setup Multi-Scene
  ipcMain.handle(
    "rcu:setupMultiScene",
    async (event, unitIp, canId, multiSceneConfig) => {
      try {
        return await rcu.setupMultiScene(unitIp, canId, multiSceneConfig);
      } catch (error) {
        console.error("Error setting up multi-scene:", error);
        throw error;
      }
    }
  );

  // Get Multi-Scene Information
  ipcMain.handle(
    "rcu:getMultiSceneInformation",
    async (event, { unitIp, canId, multiSceneIndex }) => {
      try {
        return await rcu.getMultiSceneInformation(
          unitIp,
          canId,
          multiSceneIndex
        );
      } catch (error) {
        console.error("Error getting multi-scene information:", error);
        throw error;
      }
    }
  );

  // Get All Multi-Scenes Information
  ipcMain.handle(
    "rcu:getAllMultiScenesInformation",
    async (event, { unitIp, canId }) => {
      try {
        return await rcu.getAllMultiScenesInformation(unitIp, canId);
      } catch (error) {
        console.error("Error getting all multi-scenes information:", error);
        throw error;
      }
    }
  );

  // Trigger Multi-Scene
  ipcMain.handle(
    "rcu:triggerMultiScene",
    async (event, { unitIp, canId, multiSceneAddress }) => {
      try {
        return await rcu.triggerMultiScene(unitIp, canId, multiSceneAddress);
      } catch (error) {
        console.error("Error triggering multi-scene:", error);
        throw error;
      }
    }
  );

  // Delete Multi-Scene
  ipcMain.handle(
    "rcu:deleteMultiScene",
    async (event, unitIp, canId, multiSceneIndex) => {
      try {
        return await rcu.deleteMultiScene(unitIp, canId, multiSceneIndex);
      } catch (error) {
        console.error("Error deleting multi-scene:", error);
        throw error;
      }
    }
  );

  // Delete All Multi-Scenes
  ipcMain.handle("rcu:deleteAllMultiScenes", async (event, unitIp, canId) => {
    try {
      return await rcu.deleteAllMultiScenes(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all multi-scenes:", error);
      throw error;
    }
  });

  // ==================== Database - Multi-Scene Operations ====================

  // Multi-Scene CRUD operations
  ipcMain.handle("multiScenes:getAll", async (event, projectId) => {
    try {
      return await dbService.getProjectItems(projectId, "multi_scenes");
    } catch (error) {
      console.error("Error getting multi-scene items:", error);
      throw error;
    }
  });

  ipcMain.handle("multiScenes:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createProjectItem(
        projectId,
        itemData,
        "multi_scenes"
      );
    } catch (error) {
      console.error("Error creating multi-scene item:", error);
      throw error;
    }
  });

  ipcMain.handle("multiScenes:update", async (event, id, itemData) => {
    try {
      return await dbService.updateProjectItem(id, itemData, "multi_scenes");
    } catch (error) {
      console.error("Error updating multi-scene item:", error);
      throw error;
    }
  });

  ipcMain.handle("multiScenes:delete", async (event, id) => {
    try {
      return await dbService.deleteProjectItem(id, "multi_scenes");
    } catch (error) {
      console.error("Error deleting multi-scene item:", error);
      throw error;
    }
  });

  ipcMain.handle("multiScenes:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateProjectItem(id, "multi_scenes");
    } catch (error) {
      console.error("Error duplicating multi-scene item:", error);
      throw error;
    }
  });

  ipcMain.handle("multiScenes:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "multi_scenes");
    } catch (error) {
      console.error("Error bulk importing multi-scene items:", error);
      throw error;
    }
  });

  // Multi-Scene scenes management
  ipcMain.handle("multiScenes:getScenes", async (event, multiSceneId) => {
    try {
      return await dbService.getMultiSceneScenes(multiSceneId);
    } catch (error) {
      console.error("Error getting multi-scene scenes:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "multiScenes:addScene",
    async (event, multiSceneId, sceneId, sceneOrder) => {
      try {
        return await dbService.addSceneToMultiScene(
          multiSceneId,
          sceneId,
          sceneOrder
        );
      } catch (error) {
        console.error("Error adding scene to multi-scene:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "multiScenes:removeScene",
    async (event, multiSceneId, sceneId) => {
      try {
        return await dbService.removeSceneFromMultiScene(multiSceneId, sceneId);
      } catch (error) {
        console.error("Error removing scene from multi-scene:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "multiScenes:updateScenes",
    async (event, multiSceneId, sceneIds) => {
      try {
        return await dbService.updateMultiSceneScenes(multiSceneId, sceneIds);
      } catch (error) {
        console.error("Error updating multi-scene scenes:", error);
        throw error;
      }
    }
  );
}
