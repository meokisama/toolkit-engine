import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import DatabaseService from "./services/database.js";
import {
  setGroupState,
  setMultipleGroupStates,
  getAllGroupStates,
  getAllOutputStates,
  getACStatus,
  getRoomTemp,
  setSettingRoomTemp,
  getSettingRoomTemp,
  setFanMode,
  getFanMode,
  setPowerMode,
  getPowerMode,
  setOperateMode,
  getOperateMode,
  setEcoMode,
  getEcoMode,
  setupScene,
  getSceneInformation,
  getAllScenesInformation,
  triggerScene,
  deleteScene,
  setupSchedule,
  getScheduleInformation,
  getAllSchedulesInformation,
  deleteSchedule,
  syncClock,
  getClock,
} from "./services/rcu-controller.js";
import dgram from "dgram";
import { updateElectronApp } from "update-electron-app";

updateElectronApp()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Initialize database service
let dbService;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#fafafa",
    },
    icon: path.join(__dirname, "/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize database
  dbService = new DatabaseService();

  // Setup IPC handlers
  setupIpcHandlers();

  createWindow();

  // Network cache manager will be initialized in renderer process
  // since UDP scanning needs to run in renderer context

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Close database connection before quitting
    if (dbService) {
      dbService.close();
    }
    app.quit();
  }
});

// Setup IPC handlers for database operations
function setupIpcHandlers() {
  // Get all projects
  ipcMain.handle("projects:getAll", async () => {
    try {
      return await dbService.getAllProjects();
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  });

  // Get project by ID
  ipcMain.handle("projects:getById", async (event, id) => {
    try {
      return await dbService.getProjectById(id);
    } catch (error) {
      console.error("Error getting project by ID:", error);
      throw error;
    }
  });

  // Create project
  ipcMain.handle("projects:create", async (event, projectData) => {
    try {
      return await dbService.createProject(projectData);
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  });

  // Update project
  ipcMain.handle("projects:update", async (event, id, projectData) => {
    try {
      return await dbService.updateProject(id, projectData);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  });

  // Delete project
  ipcMain.handle("projects:delete", async (event, id) => {
    try {
      return await dbService.deleteProject(id);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  });

  // Duplicate project
  ipcMain.handle("projects:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateProject(id);
    } catch (error) {
      console.error("Error duplicating project:", error);
      throw error;
    }
  });

  // Get all project items in one call (optimized)
  ipcMain.handle("projects:getAllItems", async (event, projectId) => {
    try {
      return await dbService.getAllProjectItems(projectId);
    } catch (error) {
      console.error("Error getting all project items:", error);
      throw error;
    }
  });

  // Lighting items
  ipcMain.handle("lighting:getAll", async (event, projectId) => {
    try {
      return await dbService.getLightingItems(projectId);
    } catch (error) {
      console.error("Error getting lighting items:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createLightingItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating lighting item:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:update", async (event, id, itemData) => {
    try {
      return await dbService.updateLightingItem(id, itemData);
    } catch (error) {
      console.error("Error updating lighting item:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:delete", async (event, id) => {
    try {
      return await dbService.deleteLightingItem(id);
    } catch (error) {
      console.error("Error deleting lighting item:", error);
      throw error;
    }
  });

  ipcMain.handle("lighting:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateLightingItem(id);
    } catch (error) {
      console.error("Error duplicating lighting item:", error);
      throw error;
    }
  });

  // Aircon items
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

  // Aircon cards
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

  // Unit items
  ipcMain.handle("unit:getAll", async (event, projectId) => {
    try {
      return await dbService.getUnitItems(projectId);
    } catch (error) {
      console.error("Error getting unit items:", error);
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

  ipcMain.handle("unit:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateUnitItem(id);
    } catch (error) {
      console.error("Error duplicating unit item:", error);
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

  ipcMain.handle(
    "unit:saveOutputConfig",
    async (event, unitId, outputIndex, outputType, configData) => {
      try {
        return await dbService.saveUnitOutputConfig(
          unitId,
          outputIndex,
          outputType,
          configData
        );
      } catch (error) {
        console.error("Error saving unit output config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "unit:deleteOutputConfig",
    async (event, unitId, outputIndex) => {
      try {
        return await dbService.deleteUnitOutputConfig(unitId, outputIndex);
      } catch (error) {
        console.error("Error deleting unit output config:", error);
        throw error;
      }
    }
  );

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

  ipcMain.handle(
    "unit:saveInputConfig",
    async (
      event,
      unitId,
      inputIndex,
      functionValue,
      lightingId,
      multiGroupConfig,
      rlcConfig
    ) => {
      try {
        return await dbService.saveUnitInputConfig(
          unitId,
          inputIndex,
          functionValue,
          lightingId,
          multiGroupConfig,
          rlcConfig
        );
      } catch (error) {
        console.error("Error saving unit input config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "unit:deleteInputConfig",
    async (event, unitId, inputIndex) => {
      try {
        return await dbService.deleteUnitInputConfig(unitId, inputIndex);
      } catch (error) {
        console.error("Error deleting unit input config:", error);
        throw error;
      }
    }
  );

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

  // Curtain items
  ipcMain.handle("curtain:getAll", async (event, projectId) => {
    try {
      return await dbService.getCurtainItems(projectId);
    } catch (error) {
      console.error("Error getting curtain items:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createCurtainItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating curtain item:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:update", async (event, id, itemData) => {
    try {
      return await dbService.updateCurtainItem(id, itemData);
    } catch (error) {
      console.error("Error updating curtain item:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:delete", async (event, id) => {
    try {
      return await dbService.deleteCurtainItem(id);
    } catch (error) {
      console.error("Error deleting curtain item:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateCurtainItem(id);
    } catch (error) {
      console.error("Error duplicating curtain item:", error);
      throw error;
    }
  });

  // KNX items
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

  // Scene items
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

  ipcMain.handle(
    "scene:addItem",
    async (
      event,
      sceneId,
      itemType,
      itemId,
      itemValue,
      command,
      objectType
    ) => {
      try {
        return await dbService.addItemToScene(
          sceneId,
          itemType,
          itemId,
          itemValue,
          command,
          objectType
        );
      } catch (error) {
        console.error("Error adding item to scene:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("scene:removeItem", async (event, sceneItemId) => {
    try {
      return await dbService.removeItemFromScene(sceneItemId);
    } catch (error) {
      console.error("Error removing item from scene:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "scene:updateItemValue",
    async (event, sceneItemId, itemValue, command) => {
      try {
        return await dbService.updateSceneItemValue(
          sceneItemId,
          itemValue,
          command
        );
      } catch (error) {
        console.error("Error updating scene item value:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "scene:canAddItemToScene",
    async (
      event,
      projectId,
      address,
      itemType,
      itemId,
      objectType,
      excludeSceneId
    ) => {
      try {
        return await dbService.canAddItemToScene(
          projectId,
          address,
          itemType,
          itemId,
          objectType,
          excludeSceneId
        );
      } catch (error) {
        console.error("Error checking if item can be added to scene:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("scene:getAddressItems", async (event, projectId, address) => {
    try {
      return await dbService.getSceneAddressItems(projectId, address);
    } catch (error) {
      console.error("Error getting scene address items:", error);
      throw error;
    }
  });

  // Import project
  ipcMain.handle("projects:import", async (event, projectData, itemsData) => {
    try {
      return await dbService.importProject(projectData, itemsData);
    } catch (error) {
      console.error("Error importing project:", error);
      throw error;
    }
  });

  // Bulk import items for each category
  ipcMain.handle("lighting:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "lighting");
    } catch (error) {
      console.error("Error bulk importing lighting items:", error);
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

  ipcMain.handle("unit:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "unit");
    } catch (error) {
      console.error("Error bulk importing unit items:", error);
      throw error;
    }
  });

  ipcMain.handle("curtain:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "curtain");
    } catch (error) {
      console.error("Error bulk importing curtain items:", error);
      throw error;
    }
  });

  ipcMain.handle("scene:bulkImport", async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, "scene");
    } catch (error) {
      console.error("Error bulk importing scene items:", error);
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

  // Schedule items
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
      const {
        unitIp,
        canId,
        scheduleIndex,
        enabled,
        weekDays,
        hour,
        minute,
        sceneAddresses,
      } = params;

      return await setupSchedule(
        unitIp,
        canId,
        scheduleIndex,
        enabled,
        weekDays,
        hour,
        minute,
        sceneAddresses
      );
    } catch (error) {
      console.error("Error sending schedule:", error);
      throw error;
    }
  });

  // RCU Schedule Information functions
  ipcMain.handle(
    "rcu:getScheduleInformation",
    async (event, { unitIp, canId, scheduleIndex }) => {
      try {
        return await getScheduleInformation(unitIp, canId, scheduleIndex);
      } catch (error) {
        console.error("Error getting schedule information:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getAllSchedulesInformation",
    async (event, { unitIp, canId }) => {
      try {
        return await getAllSchedulesInformation(unitIp, canId);
      } catch (error) {
        console.error("Error getting all schedules information:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:deleteSchedule",
    async (event, { unitIp, canId, scheduleIndex }) => {
      try {
        return await deleteSchedule(unitIp, canId, scheduleIndex);
      } catch (error) {
        console.error("Error deleting schedule:", error);
        throw error;
      }
    }
  );

  // UDP Network Scanning
  ipcMain.handle("udp:scanNetwork", async (event, config) => {
    try {
      return await scanUDPNetwork(config);
    } catch (error) {
      console.error("Error scanning UDP network:", error);
      throw error;
    }
  });

  // RCU Controller functions
  ipcMain.handle(
    "rcu:setupScene",
    async (
      event,
      unitIp,
      canId,
      sceneIndex,
      sceneName,
      sceneAddress,
      sceneItems
    ) => {
      try {
        return await setupScene(
          unitIp,
          canId,
          sceneIndex,
          sceneName,
          sceneAddress,
          sceneItems
        );
      } catch (error) {
        console.error("Error setting up scene:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getSceneInformation",
    async (event, { unitIp, canId, sceneIndex }) => {
      try {
        return await getSceneInformation(unitIp, canId, sceneIndex);
      } catch (error) {
        console.error("Error getting scene information:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getAllScenesInformation",
    async (event, { unitIp, canId }) => {
      try {
        return await getAllScenesInformation(unitIp, canId);
      } catch (error) {
        console.error("Error getting all scenes information:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:triggerScene",
    async (event, { unitIp, canId, sceneIndex, sceneAddress }) => {
      try {
        return await triggerScene(unitIp, canId, sceneIndex, sceneAddress);
      } catch (error) {
        console.error("Error triggering scene:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:deleteScene",
    async (event, unitIp, canId, sceneIndex) => {
      try {
        return await deleteScene(unitIp, canId, sceneIndex);
      } catch (error) {
        console.error("Error deleting scene:", error);
        throw error;
      }
    }
  );

  // RCU Group Control
  ipcMain.handle(
    "rcu:setGroupState",
    async (event, { canId, group, value, unitIp }) => {
      try {
        return await setGroupState(unitIp, canId, group, value);
      } catch (error) {
        console.error("Error setting group state:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setMultipleGroupStates",
    async (event, { canId, groupSettings, unitIp }) => {
      try {
        return await setMultipleGroupStates(unitIp, canId, groupSettings);
      } catch (error) {
        console.error("Error setting multiple group states:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:getAllGroupStates", async (event, { canId, unitIp }) => {
    try {
      return await getAllGroupStates(unitIp, canId);
    } catch (error) {
      console.error("Error getting group states:", error);
      throw error;
    }
  });

  ipcMain.handle("rcu:getAllOutputStates", async (event, { canId, unitIp }) => {
    try {
      return await getAllOutputStates(unitIp, canId);
    } catch (error) {
      console.error("Error getting output states:", error);
      throw error;
    }
  });

  // Air Conditioner Control
  ipcMain.handle("rcu:getACStatus", async (event, { canId, unitIp, group }) => {
    try {
      return await getACStatus(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting AC status:", error);
      throw error;
    }
  });

  ipcMain.handle("rcu:getRoomTemp", async (event, { canId, unitIp, group }) => {
    try {
      return await getRoomTemp(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting room temperature:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "rcu:setSettingRoomTemp",
    async (event, { canId, unitIp, group, temperature }) => {
      try {
        return await setSettingRoomTemp(unitIp, canId, group, temperature);
      } catch (error) {
        console.error("Error setting room temperature:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getSettingRoomTemp",
    async (event, { canId, unitIp, group }) => {
      try {
        return await getSettingRoomTemp(unitIp, canId, group);
      } catch (error) {
        console.error("Error getting setting room temperature:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setFanMode",
    async (event, { canId, unitIp, group, fanSpeed }) => {
      try {
        return await setFanMode(unitIp, canId, group, fanSpeed);
      } catch (error) {
        console.error("Error setting fan mode:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:getFanMode", async (event, { canId, unitIp, group }) => {
    try {
      return await getFanMode(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting fan mode:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "rcu:setPowerMode",
    async (event, { canId, unitIp, group, power }) => {
      try {
        return await setPowerMode(unitIp, canId, group, power);
      } catch (error) {
        console.error("Error setting power mode:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getPowerMode",
    async (event, { canId, unitIp, group }) => {
      try {
        return await getPowerMode(unitIp, canId, group);
      } catch (error) {
        console.error("Error getting power mode:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setOperateMode",
    async (event, { canId, unitIp, group, mode }) => {
      try {
        return await setOperateMode(unitIp, canId, group, mode);
      } catch (error) {
        console.error("Error setting operate mode:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getOperateMode",
    async (event, { canId, unitIp, group }) => {
      try {
        return await getOperateMode(unitIp, canId, group);
      } catch (error) {
        console.error("Error getting operate mode:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setEcoMode",
    async (event, { canId, unitIp, group, eco }) => {
      try {
        return await setEcoMode(unitIp, canId, group, eco);
      } catch (error) {
        console.error("Error setting eco mode:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:getEcoMode", async (event, { canId, unitIp, group }) => {
    try {
      return await getEcoMode(unitIp, canId, group);
    } catch (error) {
      console.error("Error getting eco mode:", error);
      throw error;
    }
  });

  // Clock Control functions
  ipcMain.handle(
    "rcu:syncClock",
    async (event, { unitIp, canId, clockData }) => {
      try {
        return await syncClock(unitIp, canId, clockData);
      } catch (error) {
        console.error("Error syncing clock:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:getClock", async (event, { unitIp, canId }) => {
    try {
      return await getClock(unitIp, canId);
    } catch (error) {
      console.error("Error getting clock:", error);
      throw error;
    }
  });
}

/**
 * UDP Network Scanner Implementation
 * Based on RLC C# implementation
 */
async function scanUDPNetwork(config) {
  const { broadcastIP, udpPort, localPort, timeout } = config;

  return new Promise((resolve, reject) => {
    const results = [];
    let socket = null;
    let timeoutHandle = null;

    // Create UDP request packet for hardware information
    const createHardwareInfoRequest = (targetId = "0.0.0.0") => {
      const data = Buffer.alloc(1024);

      // Parse target ID (Address bytes 0-3)
      const idParts = targetId.split(".");
      data[0] = parseInt(idParts[3]) || 0;
      data[1] = parseInt(idParts[2]) || 0;
      data[2] = parseInt(idParts[1]) || 0;
      data[3] = parseInt(idParts[0]) || 0;

      // Length (bytes 4-5)
      data[4] = 4;
      data[5] = 0;

      // Command (bytes 6-7)
      data[6] = 1; // CMD
      data[7] = 4; // Sub-command for hardware info

      // Calculate CRC
      let crcSum = 0;
      for (let i = 4; i < data[4] + 4; i++) {
        crcSum += data[i];
      }
      data[8] = crcSum & 0xff; // Low byte
      data[9] = (crcSum >> 8) & 0xff; // High byte

      return data.slice(0, data[4] + 6);
    };

    // Cleanup function
    function cleanup() {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      if (socket) {
        try {
          socket.close();
        } catch (e) {
          console.error("Error closing socket:", e);
        }
        socket = null;
      }
    }

    // Create single socket for both send and receive
    socket = dgram.createSocket("udp4");

    socket.on("error", (err) => {
      console.error("UDP socket error:", err);
      cleanup();
      reject(err);
    });

    socket.on("message", (msg, rinfo) => {
      if (msg.length >= 6) {
        const dataLength = msg[5] * 256 + msg[4];

        // Check if response is valid (length > 90 as per RLC logic)
        if (dataLength > 90) {
          results.push({
            data: Array.from(msg), // Convert Buffer to Array for JSON serialization
            sourceIP: rinfo.address,
          });
        }
      }
    });

    socket.on("listening", () => {
      // Set socket options
      try {
        socket.setBroadcast(true);
        socket.setRecvBufferSize(0x40000);
      } catch (e) {
        // Ignore socket option errors
      }

      // Send broadcast request
      const requestData = createHardwareInfoRequest("0.0.0.0");

      socket.send(requestData, udpPort, broadcastIP, (err) => {
        if (err) {
          cleanup();
          reject(err);
          return;
        }

        // Set timeout for responses
        timeoutHandle = setTimeout(() => {
          cleanup();
          resolve(results);
        }, timeout);
      });
    });

    // Bind socket to any available port
    socket.bind();
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
