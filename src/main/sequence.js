/**
 * Sequence IPC Handlers
 * Xử lý các tương tác với sequence items (RCU Controller và Database)
 */

export function registerSequenceHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Sequence Operations ====================

  // Setup Sequence
  ipcMain.handle("rcu:setupSequence", async (event, unitIp, canId, sequenceConfig) => {
    try {
      return await rcu.setupSequence(unitIp, canId, sequenceConfig);
    } catch (error) {
      console.error("Error setting up sequence:", error);
      throw error;
    }
  });

  // Get Sequence Information
  ipcMain.handle("rcu:getSequenceInformation", async (event, { unitIp, canId, sequenceIndex }) => {
    try {
      return await rcu.getSequenceInformation(unitIp, canId, sequenceIndex);
    } catch (error) {
      console.error("Error getting sequence information:", error);
      throw error;
    }
  });

  // Get All Sequences Information
  ipcMain.handle("rcu:getAllSequencesInformation", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getAllSequencesInformation(unitIp, canId);
    } catch (error) {
      console.error("Error getting all sequences information:", error);
      throw error;
    }
  });

  // Trigger Sequence
  ipcMain.handle("rcu:triggerSequence", async (event, { unitIp, canId, sequenceAddress }) => {
    try {
      return await rcu.triggerSequence(unitIp, canId, sequenceAddress);
    } catch (error) {
      console.error("Error triggering sequence:", error);
      throw error;
    }
  });

  // Delete Sequence
  ipcMain.handle("rcu:deleteSequence", async (event, unitIp, canId, sequenceIndex) => {
    try {
      return await rcu.deleteSequence(unitIp, canId, sequenceIndex);
    } catch (error) {
      console.error("Error deleting sequence:", error);
      throw error;
    }
  });

  // Delete All Sequences
  ipcMain.handle("rcu:deleteAllSequences", async (event, unitIp, canId) => {
    try {
      return await rcu.deleteAllSequences(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all sequences:", error);
      throw error;
    }
  });

  // ==================== Database - Sequence Operations ====================

  // Sequence CRUD operations
  ipcMain.handle("sequences:getAll", async (event, projectId) => {
    try {
      return await dbService.getProjectItems(projectId, "sequences");
    } catch (error) {
      console.error("Error getting sequence items:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createProjectItem(projectId, itemData, "sequences");
    } catch (error) {
      console.error("Error creating sequence item:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:update", async (event, id, itemData) => {
    try {
      return await dbService.updateProjectItem(id, itemData, "sequences");
    } catch (error) {
      console.error("Error updating sequence item:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:delete", async (event, id) => {
    try {
      return await dbService.deleteProjectItem(id, "sequences");
    } catch (error) {
      console.error("Error deleting sequence item:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateProjectItem(id, "sequences");
    } catch (error) {
      console.error("Error duplicating sequence item:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "sequences");
    } catch (error) {
      console.error("Error bulk importing sequence items:", error);
      throw error;
    }
  });

  // Sequence multi-scenes management
  ipcMain.handle("sequences:getMultiScenes", async (event, sequenceId) => {
    try {
      return await dbService.getSequenceMultiScenes(sequenceId);
    } catch (error) {
      console.error("Error getting sequence multi-scenes:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:addMultiScene", async (event, sequenceId, multiSceneId, multiSceneOrder) => {
    try {
      return await dbService.addMultiSceneToSequence(sequenceId, multiSceneId, multiSceneOrder);
    } catch (error) {
      console.error("Error adding multi-scene to sequence:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:removeMultiScene", async (event, sequenceId, multiSceneId) => {
    try {
      return await dbService.removeMultiSceneFromSequence(sequenceId, multiSceneId);
    } catch (error) {
      console.error("Error removing multi-scene from sequence:", error);
      throw error;
    }
  });

  ipcMain.handle("sequences:updateMultiScenes", async (event, sequenceId, multiSceneIds) => {
    try {
      return await dbService.updateSequenceMultiScenes(sequenceId, multiSceneIds);
    } catch (error) {
      console.error("Error updating sequence multi-scenes:", error);
      throw error;
    }
  });
}
