/**
 * Schedule Control Dialog Configuration
 * Defines entity-specific settings and API methods for schedule control
 */

export const scheduleConfig = {
  entityName: "Schedule",
  entityNameSingular: "Schedule",
  entityNamePlural: "Schedules", 
  indexRange: [0, 31],
  
  apiMethods: {
    // Load single schedule
    loadSingle: async ({ unitIp, canId, index }) => {
      const result = await window.electronAPI.rcuController.getScheduleInformation({
        unitIp,
        canId,
        scheduleIndex: index,
      });
      
      // Return the data part if successful
      return result?.success && result?.data ? result.data : null;
    },

    // Load all schedules
    loadAll: async ({ unitIp, canId }) => {
      const result = await window.electronAPI.rcuController.getAllSchedulesInformation({
        unitIp,
        canId,
      });
      return result?.data || [];
    },

    // Delete schedule
    deleteItem: async ({ unitIp, canId, index }) => {
      return await window.electronAPI.rcuController.deleteSchedule({
        unitIp,
        canId,
        scheduleIndex: index,
      });
    },

    // Process single schedule item
    processItem: (result, index) => {
      if (!result) return null;
      
      return {
        index: index,
        enabled: result.enabled || false,
        hour: result.hour || 0,
        minute: result.minute || 0,
        weekDays: result.weekDays || [false, false, false, false, false, false, false],
        sceneCount: result.sceneAddresses ? result.sceneAddresses.length : 0,
        sceneAddresses: result.sceneAddresses || [],
      };
    },

    // Process multiple schedules
    processItems: (schedules) => {
      return schedules.map((schedule) => ({
        index: schedule.scheduleIndex || schedule.index,
        enabled: schedule.enabled || false,
        hour: schedule.hour || 0,
        minute: schedule.minute || 0,
        weekDays: schedule.weekDays || [false, false, false, false, false, false, false],
        sceneCount: schedule.sceneAddresses ? schedule.sceneAddresses.length : 0,
        sceneAddresses: schedule.sceneAddresses || [],
      }));
    },
  },

  // Filter function for schedules - exclude disabled empty schedules
  filterItems: (schedule) => {
    return !(schedule.enabled === false && schedule.sceneCount === 0);
  },
};
