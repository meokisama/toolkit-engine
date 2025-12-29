/**
 * Schedule IPC Handlers
 * Xử lý các tương tác với schedule items và schedule-scene relationships
 */

export function registerScheduleHandlers(ipcMain, dbService, rcu) {
  // Schedule CRUD operations
  ipcMain.handle("schedule:getAll", async (event, projectId) => {
    try {
      return await dbService.getScheduleItems(projectId);
    } catch (error) {
      console.error("Error getting schedule items:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createScheduleItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating schedule item:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:update", async (event, id, itemData) => {
    try {
      return await dbService.updateScheduleItem(id, itemData);
    } catch (error) {
      console.error("Error updating schedule item:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:delete", async (event, id) => {
    try {
      return await dbService.deleteScheduleItem(id);
    } catch (error) {
      console.error("Error deleting schedule item:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateScheduleItem(id);
    } catch (error) {
      console.error("Error duplicating schedule item:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "schedule");
    } catch (error) {
      console.error("Error bulk importing schedule items:", error);
      throw error;
    }
  });

  // Schedule-Scene Relationships
  ipcMain.handle("schedule:getScenesWithDetails", async (event, scheduleId) => {
    try {
      return await dbService.getScheduleScenesWithDetails(scheduleId);
    } catch (error) {
      console.error("Error getting schedule scenes with details:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:addScene", async (event, scheduleId, sceneId) => {
    try {
      return await dbService.addSceneToSchedule(scheduleId, sceneId);
    } catch (error) {
      console.error("Error adding scene to schedule:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:removeScene", async (event, scheduleSceneId) => {
    try {
      return await dbService.removeSceneFromSchedule(scheduleSceneId);
    } catch (error) {
      console.error("Error removing scene from schedule:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:getForSending", async (event, scheduleId) => {
    try {
      return await dbService.getScheduleForSending(scheduleId);
    } catch (error) {
      console.error("Error getting schedule for sending:", error);
      throw error;
    }
  });

  ipcMain.handle("schedule:send", async (event, params) => {
    try {
      const { unitIp, canId, scheduleIndex, enabled, weekDays, hour, minute, sceneAddresses, mode, intervalTime, dmxDuration } = params;

      return await rcu.setupSchedule(unitIp, canId, {
        scheduleIndex,
        enabled,
        weekDays,
        hour,
        minute,
        sceneAddresses,
        mode,
        intervalTime,
        dmxDuration,
      });
    } catch (error) {
      console.error("Error sending schedule:", error);
      throw error;
    }
  });

  // ==================== RCU Controller - Schedule Information ====================

  // Get schedule information from RCU device
  ipcMain.handle("rcu:getScheduleInformation", async (event, { unitIp, canId, scheduleIndex }) => {
    try {
      return await rcu.getScheduleInformation(unitIp, canId, scheduleIndex);
    } catch (error) {
      console.error("Error getting schedule information:", error);
      throw error;
    }
  });

  // Get all schedules information from RCU device
  ipcMain.handle("rcu:getAllSchedulesInformation", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getAllSchedulesInformation(unitIp, canId);
    } catch (error) {
      console.error("Error getting all schedules information:", error);
      throw error;
    }
  });

  // Delete schedule from RCU device
  ipcMain.handle("rcu:deleteSchedule", async (event, { unitIp, canId, scheduleIndex }) => {
    try {
      return await rcu.deleteSchedule(unitIp, canId, scheduleIndex);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  });

  // Delete all schedules from RCU device
  ipcMain.handle("rcu:deleteAllSchedules", async (event, unitIp, canId) => {
    try {
      return await rcu.deleteAllSchedules(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all schedules:", error);
      throw error;
    }
  });
}
