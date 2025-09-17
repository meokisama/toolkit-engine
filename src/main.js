import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import DatabaseService from "./services/database.js";
import LoggerService from "./services/logger.js";
import {
  setGroupState,
  setOutputState,
  setInputState,
  setMultipleGroupStates,
  getAllGroupStates,
  getAllOutputStates,
  getAllInputStates,
  getAllInputConfigs,
  setupInputConfig,
  getOutputAssign,
  setOutputAssign,
  setAllOutputAssignments,
  setOutputDelayOff,
  setOutputDelayOn,
  getOutputConfig,
  setOutputConfig,
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
  deleteAllScenes,
  setupMultiScene,
  getMultiSceneInformation,
  getAllMultiScenesInformation,
  triggerMultiScene,
  deleteMultiScene,
  deleteAllMultiScenes,
  deleteSequence,
  deleteAllSequences,
  setupSequence,
  getSequenceInformation,
  getAllSequencesInformation,
  triggerSequence,
  setupSchedule,
  getScheduleInformation,
  getAllSchedulesInformation,
  deleteSchedule,
  deleteAllSchedules,
  syncClock,
  getClock,
  getCurtainConfig,
  setCurtain,
  setCurtainConfig,
  deleteCurtain,
  deleteAllCurtains,
  setKnxConfig,
  getKnxConfig,
  triggerKnx,
  deleteKnxConfig,
  deleteAllKnxConfigs,
  getLocalACConfig,
  setLocalACConfig,
  updateFirmware,
  changeIpAddress,
  changeCanId,
  setHardwareConfig,
  changeIpAddressBroadcast,
  getRS485CH1Config,
  getRS485CH2Config,
  setRS485CH1Config,
  setRS485CH2Config,
  createDefaultNetworkRS485Config,
} from "./services/rcu-controller.js";
import dgram from "dgram";
import { updateElectronApp } from "update-electron-app";
import { networkInterfaceService } from "./services/network-interfaces.js";

updateElectronApp();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Initialize services
let dbService;
let loggerService;

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
    icon: path.join(__dirname, "/app.ico"),
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
  // Initialize services
  dbService = new DatabaseService();
  loggerService = new LoggerService();

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
      return await dbService.createCurtainItemSimple(projectId, itemData);
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

      return await setupSchedule(unitIp, canId, {
        scheduleIndex,
        enabled,
        weekDays,
        hour,
        minute,
        sceneAddresses,
      });
    } catch (error) {
      console.error("Error sending schedule:", error);
      throw error;
    }
  });

  // Multi-Scene items
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

  // Sequence items
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
      return await dbService.createProjectItem(
        projectId,
        itemData,
        "sequences"
      );
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

  ipcMain.handle(
    "sequences:addMultiScene",
    async (event, sequenceId, multiSceneId, multiSceneOrder) => {
      try {
        return await dbService.addMultiSceneToSequence(
          sequenceId,
          multiSceneId,
          multiSceneOrder
        );
      } catch (error) {
        console.error("Error adding multi-scene to sequence:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "sequences:removeMultiScene",
    async (event, sequenceId, multiSceneId) => {
      try {
        return await dbService.removeMultiSceneFromSequence(sequenceId, multiSceneId);
      } catch (error) {
        console.error("Error removing multi-scene from sequence:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "sequences:updateMultiScenes",
    async (event, sequenceId, multiSceneIds) => {
      try {
        return await dbService.updateSequenceMultiScenes(sequenceId, multiSceneIds);
      } catch (error) {
        console.error("Error updating sequence multi-scenes:", error);
        throw error;
      }
    }
  );

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

  ipcMain.handle("rcu:deleteAllSchedules", async (event, unitIp, canId) => {
    try {
      return await deleteAllSchedules(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all schedules:", error);
      throw error;
    }
  });

  // Firmware Update
  ipcMain.handle(
    "firmware:update",
    async (event, { unitIp, canId, hexContent, unitType }) => {
      try {
        // Create progress callback that sends to renderer
        const onProgress = (progress, status) => {
          event.sender.send("firmware:progress", { progress, status });
        };

        return await updateFirmware(
          unitIp,
          canId,
          hexContent,
          onProgress,
          unitType
        );
      } catch (error) {
        console.error("Error updating firmware:", error);
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

  // Network Interface Management
  ipcMain.handle("network:getInterfaces", async (event, forceRefresh = false) => {
    try {
      return networkInterfaceService.getNetworkInterfaces(forceRefresh);
    } catch (error) {
      console.error("Error getting network interfaces:", error);
      throw error;
    }
  });

  ipcMain.handle("network:getBroadcastAddresses", async (event, forceRefresh = false) => {
    try {
      return networkInterfaceService.getBroadcastAddresses(forceRefresh);
    } catch (error) {
      console.error("Error getting broadcast addresses:", error);
      throw error;
    }
  });

  ipcMain.handle("network:getSummary", async (event) => {
    try {
      return networkInterfaceService.getSummary();
    } catch (error) {
      console.error("Error getting network summary:", error);
      throw error;
    }
  });

  ipcMain.handle("network:findInterfaceForTarget", async (event, targetIp) => {
    try {
      return networkInterfaceService.findInterfaceForTarget(targetIp);
    } catch (error) {
      console.error("Error finding interface for target:", error);
      throw error;
    }
  });

  ipcMain.handle("network:clearCache", async (event) => {
    try {
      networkInterfaceService.clearCache();
      return { success: true };
    } catch (error) {
      console.error("Error clearing network cache:", error);
      throw error;
    }
  });

  // RCU Controller functions
  ipcMain.handle(
    "rcu:setupScene",
    async (event, unitIp, canId, sceneConfig) => {
      try {
        return await setupScene(unitIp, canId, sceneConfig);
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
        return await triggerScene(unitIp, canId, sceneAddress);
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

  ipcMain.handle("rcu:deleteAllScenes", async (event, unitIp, canId) => {
    try {
      return await deleteAllScenes(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all scenes:", error);
      throw error;
    }
  });

  // Multi-Scene Setup
  ipcMain.handle(
    "rcu:setupMultiScene",
    async (event, unitIp, canId, multiSceneConfig) => {
      try {
        return await setupMultiScene(unitIp, canId, multiSceneConfig);
      } catch (error) {
        console.error("Error setting up multi-scene:", error);
        throw error;
      }
    }
  );

  // Multi-Scene Information
  ipcMain.handle(
    "rcu:getMultiSceneInformation",
    async (event, { unitIp, canId, multiSceneIndex }) => {
      try {
        return await getMultiSceneInformation(unitIp, canId, multiSceneIndex);
      } catch (error) {
        console.error("Error getting multi-scene information:", error);
        throw error;
      }
    }
  );

  // All Multi-Scenes Information
  ipcMain.handle(
    "rcu:getAllMultiScenesInformation",
    async (event, { unitIp, canId }) => {
      try {
        return await getAllMultiScenesInformation(unitIp, canId);
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
        return await triggerMultiScene(unitIp, canId, multiSceneAddress);
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
        return await deleteMultiScene(unitIp, canId, multiSceneIndex);
      } catch (error) {
        console.error("Error deleting multi-scene:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:deleteAllMultiScenes", async (event, unitIp, canId) => {
    try {
      return await deleteAllMultiScenes(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all multi-scenes:", error);
      throw error;
    }
  });

  // Delete Sequence
  ipcMain.handle(
    "rcu:deleteSequence",
    async (event, unitIp, canId, sequenceIndex) => {
      try {
        return await deleteSequence(unitIp, canId, sequenceIndex);
      } catch (error) {
        console.error("Error deleting sequence:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:deleteAllSequences", async (event, unitIp, canId) => {
    try {
      return await deleteAllSequences(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all sequences:", error);
      throw error;
    }
  });

  // Sequence Setup
  ipcMain.handle(
    "rcu:setupSequence",
    async (event, unitIp, canId, sequenceConfig) => {
      try {
        return await setupSequence(unitIp, canId, sequenceConfig);
      } catch (error) {
        console.error("Error setting up sequence:", error);
        throw error;
      }
    }
  );

  // Sequence Information
  ipcMain.handle(
    "rcu:getSequenceInformation",
    async (event, { unitIp, canId, sequenceIndex }) => {
      try {
        return await getSequenceInformation(unitIp, canId, sequenceIndex);
      } catch (error) {
        console.error("Error getting sequence information:", error);
        throw error;
      }
    }
  );

  // All Sequences Information
  ipcMain.handle(
    "rcu:getAllSequencesInformation",
    async (event, { unitIp, canId }) => {
      try {
        return await getAllSequencesInformation(unitIp, canId);
      } catch (error) {
        console.error("Error getting all sequences information:", error);
        throw error;
      }
    }
  );

  // Trigger Sequence
  ipcMain.handle(
    "rcu:triggerSequence",
    async (event, { unitIp, canId, sequenceAddress }) => {
      try {
        return await triggerSequence(unitIp, canId, sequenceAddress);
      } catch (error) {
        console.error("Error triggering sequence:", error);
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
    "rcu:setOutputState",
    async (event, { canId, outputIndex, value, unitIp }) => {
      try {
        return await setOutputState(unitIp, canId, outputIndex, value);
      } catch (error) {
        console.error("Error setting output state:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setInputState",
    async (event, { canId, inputIndex, value, unitIp }) => {
      try {
        return await setInputState(unitIp, canId, inputIndex, value);
      } catch (error) {
        console.error("Error setting input state:", error);
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

  ipcMain.handle("rcu:getAllInputStates", async (event, { canId, unitIp }) => {
    try {
      return await getAllInputStates(unitIp, canId);
    } catch (error) {
      console.error("Error getting input states:", error);
      throw error;
    }
  });

  ipcMain.handle("rcu:getAllInputConfigs", async (event, { canId, unitIp }) => {
    try {
      return await getAllInputConfigs(unitIp, canId);
    } catch (error) {
      console.error("Error getting input configs:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "rcu:setupInputConfig",
    async (event, { unitIp, canId, inputConfig }) => {
      try {
        return await setupInputConfig(unitIp, canId, inputConfig);
      } catch (error) {
        console.error("Error setting up input config:", error);
        throw error;
      }
    }
  );

  // Output Configuration Control
  ipcMain.handle("rcu:getOutputAssign", async (event, { unitIp, canId }) => {
    try {
      console.log("IPC getOutputAssign called with:", { unitIp, canId });
      return await getOutputAssign(unitIp, canId);
    } catch (error) {
      console.error("Error getting output assignments:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "rcu:getOutputConfig",
    async (event, unitIp, canId) => {
      try {
        return await getOutputConfig(unitIp, canId);
      } catch (error) {
        console.error("Error getting output config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setOutputAssign",
    async (event, unitIp, canId, outputIndex, lightingAddress) => {
      try {
        return await setOutputAssign(unitIp, canId, outputIndex, lightingAddress);
      } catch (error) {
        console.error("Error setting output assignment:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setAllOutputAssignments",
    async (event, unitIp, canId, outputAssignments) => {
      try {
        return await setAllOutputAssignments(unitIp, canId, outputAssignments);
      } catch (error) {
        console.error("Error setting all output assignments:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setOutputDelayOff",
    async (event, unitIp, canId, outputIndex, delayOff) => {
      try {
        return await setOutputDelayOff(unitIp, canId, outputIndex, delayOff);
      } catch (error) {
        console.error("Error setting output delay off:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setOutputDelayOn",
    async (event, unitIp, canId, outputIndex, delayOn) => {
      try {
        return await setOutputDelayOn(unitIp, canId, outputIndex, delayOn);
      } catch (error) {
        console.error("Error setting output delay on:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setOutputConfig",
    async (event, unitIp, canId, outputIndex, config) => {
      try {
        return await setOutputConfig(unitIp, canId, outputIndex, config);
      } catch (error) {
        console.error("Error setting output config:", error);
        throw error;
      }
    }
  );

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

  // AC Output Configuration
  ipcMain.handle("rcu:getLocalACConfig", async (event, unitIp, canId) => {
    try {
      return await getLocalACConfig(unitIp, canId);
    } catch (error) {
      console.error("Error getting local AC config:", error);
      throw error;
    }
  });

  ipcMain.handle("rcu:setLocalACConfig", async (event, unitIp, canId, acConfigs) => {
    try {
      return await setLocalACConfig(unitIp, canId, acConfigs);
    } catch (error) {
      console.error("Error setting local AC config:", error);
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

  // Curtain Control functions
  ipcMain.handle(
    "rcu:getCurtainConfig",
    async (event, { unitIp, canId, curtainIndex }) => {
      try {
        return await getCurtainConfig(unitIp, canId, curtainIndex);
      } catch (error) {
        console.error("Error getting curtain configuration:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setCurtain",
    async (event, { unitIp, canId, curtainAddress, value }) => {
      try {
        return await setCurtain(unitIp, canId, curtainAddress, value);
      } catch (error) {
        console.error("Error setting curtain:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setCurtainConfig",
    async (event, unitIp, canId, curtainConfig) => {
      try {
        return await setCurtainConfig(unitIp, canId, curtainConfig);
      } catch (error) {
        console.error("Error setting curtain configuration:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:deleteCurtain",
    async (event, { unitIp, canId, curtainIndex }) => {
      try {
        return await deleteCurtain(unitIp, canId, curtainIndex);
      } catch (error) {
        console.error("Error deleting curtain:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:deleteAllCurtains", async (event, unitIp, canId) => {
    try {
      return await deleteAllCurtains(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all curtains:", error);
      throw error;
    }
  });

  // KNX Control functions
  ipcMain.handle(
    "rcu:setKnxConfig",
    async (event, unitIp, canId, knxConfig, unitType) => {
      try {
        return await setKnxConfig(unitIp, canId, knxConfig, loggerService, unitType);
      } catch (error) {
        console.error("Error setting KNX config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getKnxConfig",
    async (event, { unitIp, canId, knxAddress }) => {
      try {
        return await getKnxConfig(unitIp, canId, knxAddress);
      } catch (error) {
        console.error("Error getting KNX config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:deleteKnxConfig",
    async (event, { unitIp, canId, knxAddress }) => {
      try {
        return await deleteKnxConfig(unitIp, canId, knxAddress);
      } catch (error) {
        console.error("Error deleting KNX config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("rcu:deleteAllKnxConfigs", async (event, unitIp, canId) => {
    try {
      return await deleteAllKnxConfigs(unitIp, canId);
    } catch (error) {
      console.error("Error deleting all KNX configs:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "rcu:triggerKnx",
    async (event, { unitIp, canId, knxAddress }) => {
      try {
        return await triggerKnx(unitIp, canId, knxAddress);
      } catch (error) {
        console.error("Error triggering KNX:", error);
        throw error;
      }
    }
  );

  // Network Unit Edit functions
  ipcMain.handle(
    "rcu:changeIpAddress",
    async (event, { unitIp, canId, data }) => {
      try {
        const newIpBytes = data.slice(0, 4);
        const oldIpBytes = data.slice(4, 8);
        return await changeIpAddress(unitIp, canId, newIpBytes, oldIpBytes);
      } catch (error) {
        console.error("Error changing IP address:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:changeIpAddressBroadcast",
    async (event, { unitIp, canId, newIpBytes, oldIpBytes }) => {
      try {
        return await changeIpAddressBroadcast(unitIp, canId, newIpBytes, oldIpBytes);
      } catch (error) {
        console.error("Error changing IP address via broadcast:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:changeCanId",
    async (event, { unitIp, canId, newLastPart }) => {
      try {
        return await changeCanId(unitIp, canId, newLastPart);
      } catch (error) {
        console.error("Error changing CAN ID:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setHardwareConfig",
    async (event, { unitIp, canId, configByte }) => {
      try {
        return await setHardwareConfig(unitIp, canId, configByte);
      } catch (error) {
        console.error("Error setting hardware config:", error);
        throw error;
      }
    }
  );

  // RS485 Configuration functions
  ipcMain.handle(
    "rcu:getRS485CH1Config",
    async (event, { unitIp, canId }) => {
      try {
        return await getRS485CH1Config(unitIp, canId);
      } catch (error) {
        console.error("Error getting RS485 CH1 config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:getRS485CH2Config",
    async (event, { unitIp, canId }) => {
      try {
        return await getRS485CH2Config(unitIp, canId);
      } catch (error) {
        console.error("Error getting RS485 CH2 config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setRS485CH1Config",
    async (event, { unitIp, canId, config }) => {
      try {
        return await setRS485CH1Config(unitIp, canId, config);
      } catch (error) {
        console.error("Error setting RS485 CH1 config:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "rcu:setRS485CH2Config",
    async (event, { unitIp, canId, config }) => {
      try {
        return await setRS485CH2Config(unitIp, canId, config);
      } catch (error) {
        console.error("Error setting RS485 CH2 config:", error);
        throw error;
      }
    }
  );
}

/**
 * UDP Network Scanner Implementation with Multi-Interface Support
 * Enhanced version that broadcasts on all available network interfaces
 * Based on RLC C# implementation
 */
async function scanUDPNetwork(config) {
  const {
    broadcastAddresses,
    broadcastIP,
    udpPort,
    localPort,
    timeout,
    multiInterface = false,
    targetCanId = "0.0.0.0"
  } = config;

  return new Promise((resolve, reject) => {
    const results = [];
    const sockets = [];
    let timeoutHandle = null;
    let completedScans = 0;

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

      sockets.forEach(socket => {
        if (socket) {
          try {
            socket.close();
          } catch (e) {
            console.error("Error closing socket:", e);
          }
        }
      });
      sockets.length = 0;
    }

    // Handle message reception
    function handleMessage(msg, rinfo) {
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
    }

    // Multi-interface scanning
    if (multiInterface && broadcastAddresses && broadcastAddresses.length > 0) {
      console.log(`Multi-interface UDP scan starting on ${broadcastAddresses.length} interfaces:`, broadcastAddresses);

      const expectedScans = broadcastAddresses.length;
      const requestData = createHardwareInfoRequest(targetCanId);

      // Create a socket for each broadcast address
      broadcastAddresses.forEach((broadcastAddr, index) => {
        const socket = dgram.createSocket("udp4");
        sockets.push(socket);

        socket.on("error", (err) => {
          console.error(`UDP socket error on interface ${broadcastAddr}:`, err);
          completedScans++;
          if (completedScans === expectedScans) {
            cleanup();
            resolve(results);
          }
        });

        socket.on("message", handleMessage);

        socket.on("listening", () => {
          // Set socket options
          try {
            socket.setBroadcast(true);
            socket.setRecvBufferSize(0x40000);
          } catch (e) {
            console.log(`Socket option warning on ${broadcastAddr}:`, e.message);
          }

          // Send broadcast request to this interface
          socket.send(requestData, udpPort, broadcastAddr, (err) => {
            if (err) {
              console.error(`Send error on interface ${broadcastAddr}:`, err);
            } else {
              console.log(`Broadcast sent on interface ${broadcastAddr}`);
            }

            completedScans++;

            // If this is the last scan to complete, set the timeout
            if (completedScans === expectedScans) {
              timeoutHandle = setTimeout(() => {
                console.log(`Multi-interface scan timeout reached. Found ${results.length} responses.`);
                cleanup();
                resolve(results);
              }, timeout);
            }
          });
        });

        // Bind socket to any available port
        socket.bind();
      });

      // Fallback timeout in case no sockets complete successfully
      if (expectedScans === 0) {
        console.log("No network interfaces available for scanning");
        resolve([]);
      }

    } else {
      // Fallback to single interface scanning (backward compatibility)
      const targetBroadcast = broadcastIP || "255.255.255.255";
      console.log(`Single-interface UDP scan starting on ${targetBroadcast}`);

      const socket = dgram.createSocket("udp4");
      sockets.push(socket);

      socket.on("error", (err) => {
        console.error("UDP socket error:", err);
        cleanup();
        reject(err);
      });

      socket.on("message", handleMessage);

      socket.on("listening", () => {
        // Set socket options
        try {
          socket.setBroadcast(true);
          socket.setRecvBufferSize(0x40000);
        } catch (e) {
          console.log("Socket option warning:", e.message);
        }

        // Send broadcast request
        const requestData = createHardwareInfoRequest(targetCanId);

        socket.send(requestData, udpPort, targetBroadcast, (err) => {
          if (err) {
            cleanup();
            reject(err);
            return;
          }

          console.log(`Broadcast sent on ${targetBroadcast}`);

          // Set timeout for responses
          timeoutHandle = setTimeout(() => {
            console.log(`Single-interface scan timeout reached. Found ${results.length} responses.`);
            cleanup();
            resolve(results);
          }, timeout);
        });
      });

      // Bind socket to any available port
      socket.bind();
    }
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
