// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  projects: {
    getAll: () => ipcRenderer.invoke("projects:getAll"),
    getById: (id) => ipcRenderer.invoke("projects:getById", id),
    create: (projectData) => ipcRenderer.invoke("projects:create", projectData),
    update: (id, projectData) =>
      ipcRenderer.invoke("projects:update", id, projectData),
    delete: (id) => ipcRenderer.invoke("projects:delete", id),
    duplicate: (id) => ipcRenderer.invoke("projects:duplicate", id),
    getAllItems: (projectId) =>
      ipcRenderer.invoke("projects:getAllItems", projectId),
    import: (projectData, itemsData) =>
      ipcRenderer.invoke("projects:import", projectData, itemsData),
  },
  lighting: {
    getAll: (projectId) => ipcRenderer.invoke("lighting:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("lighting:create", projectId, itemData),
    update: (id, itemData) =>
      ipcRenderer.invoke("lighting:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("lighting:delete", id),
    duplicate: (id) => ipcRenderer.invoke("lighting:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("lighting:bulkImport", projectId, items),
  },
  aircon: {
    getAll: (projectId) => ipcRenderer.invoke("aircon:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("aircon:create", projectId, itemData),
    update: (id, itemData) => ipcRenderer.invoke("aircon:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("aircon:delete", id),
    duplicate: (id) => ipcRenderer.invoke("aircon:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("aircon:bulkImport", projectId, items),
    // Aircon cards
    getCards: (projectId) => ipcRenderer.invoke("aircon:getCards", projectId),
    createCard: (projectId, cardData) =>
      ipcRenderer.invoke("aircon:createCard", projectId, cardData),
    deleteCard: (projectId, address) =>
      ipcRenderer.invoke("aircon:deleteCard", projectId, address),
    duplicateCard: (projectId, address) =>
      ipcRenderer.invoke("aircon:duplicateCard", projectId, address),
  },
  unit: {
    getAll: (projectId) => ipcRenderer.invoke("unit:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("unit:create", projectId, itemData),
    update: (id, itemData) => ipcRenderer.invoke("unit:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("unit:delete", id),
    duplicate: (id) => ipcRenderer.invoke("unit:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("unit:bulkImport", projectId, items),
    // Output configuration methods
    getOutputConfig: (unitId, outputIndex) =>
      ipcRenderer.invoke("unit:getOutputConfig", unitId, outputIndex),
    saveOutputConfig: (unitId, outputIndex, outputType, configData) =>
      ipcRenderer.invoke(
        "unit:saveOutputConfig",
        unitId,
        outputIndex,
        outputType,
        configData
      ),
    deleteOutputConfig: (unitId, outputIndex) =>
      ipcRenderer.invoke("unit:deleteOutputConfig", unitId, outputIndex),
    getAllOutputConfigs: (unitId) =>
      ipcRenderer.invoke("unit:getAllOutputConfigs", unitId),
    // Input configuration methods
    getInputConfig: (unitId, inputIndex) =>
      ipcRenderer.invoke("unit:getInputConfig", unitId, inputIndex),
    saveInputConfig: (
      unitId,
      inputIndex,
      functionValue,
      lightingId,
      multiGroupConfig,
      rlcConfig
    ) =>
      ipcRenderer.invoke(
        "unit:saveInputConfig",
        unitId,
        inputIndex,
        functionValue,
        lightingId,
        multiGroupConfig,
        rlcConfig
      ),
    deleteInputConfig: (unitId, inputIndex) =>
      ipcRenderer.invoke("unit:deleteInputConfig", unitId, inputIndex),
    getAllInputConfigs: (unitId) =>
      ipcRenderer.invoke("unit:getAllInputConfigs", unitId),
    // Clear all I/O configurations (used when unit type changes)
    clearAllIOConfigs: (unitId) =>
      ipcRenderer.invoke("unit:clearAllIOConfigs", unitId),
  },
  curtain: {
    getAll: (projectId) => ipcRenderer.invoke("curtain:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("curtain:create", projectId, itemData),
    update: (id, itemData) =>
      ipcRenderer.invoke("curtain:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("curtain:delete", id),
    duplicate: (id) => ipcRenderer.invoke("curtain:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("curtain:bulkImport", projectId, items),
  },
  knx: {
    getAll: (projectId) => ipcRenderer.invoke("knx:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("knx:create", projectId, itemData),
    update: (id, itemData) => ipcRenderer.invoke("knx:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("knx:delete", id),
    duplicate: (id) => ipcRenderer.invoke("knx:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("knx:bulkImport", projectId, items),
  },
  scene: {
    getAll: (projectId) => ipcRenderer.invoke("scene:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("scene:create", projectId, itemData),
    update: (id, itemData) => ipcRenderer.invoke("scene:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("scene:delete", id),
    duplicate: (id) => ipcRenderer.invoke("scene:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("scene:bulkImport", projectId, items),
    // Scene Items Management
    getItemsWithDetails: (sceneId) =>
      ipcRenderer.invoke("scene:getItemsWithDetails", sceneId),
    addItem: (sceneId, itemType, itemId, itemValue, command, objectType) =>
      ipcRenderer.invoke(
        "scene:addItem",
        sceneId,
        itemType,
        itemId,
        itemValue,
        command,
        objectType
      ),
    removeItem: (sceneItemId) =>
      ipcRenderer.invoke("scene:removeItem", sceneItemId),
    updateItemValue: (sceneItemId, itemValue, command) =>
      ipcRenderer.invoke(
        "scene:updateItemValue",
        sceneItemId,
        itemValue,
        command
      ),
    canAddItemToScene: (
      projectId,
      address,
      itemType,
      itemId,
      objectType,
      excludeSceneId
    ) =>
      ipcRenderer.invoke(
        "scene:canAddItemToScene",
        projectId,
        address,
        itemType,
        itemId,
        objectType,
        excludeSceneId
      ),
    getAddressItems: (projectId, address) =>
      ipcRenderer.invoke("scene:getAddressItems", projectId, address),
  },
  schedule: {
    getAll: (projectId) => ipcRenderer.invoke("schedule:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("schedule:create", projectId, itemData),
    update: (id, itemData) =>
      ipcRenderer.invoke("schedule:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("schedule:delete", id),
    duplicate: (id) => ipcRenderer.invoke("schedule:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("schedule:bulkImport", projectId, items),
    // Schedule-Scene Relationships
    getScenesWithDetails: (scheduleId) =>
      ipcRenderer.invoke("schedule:getScenesWithDetails", scheduleId),
    addScene: (scheduleId, sceneId) =>
      ipcRenderer.invoke("schedule:addScene", scheduleId, sceneId),
    removeScene: (scheduleSceneId) =>
      ipcRenderer.invoke("schedule:removeScene", scheduleSceneId),
    getForSending: (scheduleId) =>
      ipcRenderer.invoke("schedule:getForSending", scheduleId),
    send: (params) => ipcRenderer.invoke("schedule:send", params),
  },
  multiScenes: {
    getAll: (projectId) => ipcRenderer.invoke("multiScenes:getAll", projectId),
    create: (projectId, itemData) =>
      ipcRenderer.invoke("multiScenes:create", projectId, itemData),
    update: (id, itemData) =>
      ipcRenderer.invoke("multiScenes:update", id, itemData),
    delete: (id) => ipcRenderer.invoke("multiScenes:delete", id),
    duplicate: (id) => ipcRenderer.invoke("multiScenes:duplicate", id),
    bulkImport: (projectId, items) =>
      ipcRenderer.invoke("multiScenes:bulkImport", projectId, items),
    // Multi-Scene scenes management
    getScenes: (multiSceneId) =>
      ipcRenderer.invoke("multiScenes:getScenes", multiSceneId),
    addScene: (multiSceneId, sceneId, sceneOrder) =>
      ipcRenderer.invoke(
        "multiScenes:addScene",
        multiSceneId,
        sceneId,
        sceneOrder
      ),
    removeScene: (multiSceneId, sceneId) =>
      ipcRenderer.invoke("multiScenes:removeScene", multiSceneId, sceneId),
    updateScenes: (multiSceneId, sceneIds) =>
      ipcRenderer.invoke("multiScenes:updateScenes", multiSceneId, sceneIds),
  },
  // Firmware Update
  firmware: {
    update: (unitIp, canId, hexContent, onProgress, unitType) => {
      // Set up progress listener
      if (onProgress) {
        const progressHandler = (event, { progress, status }) => {
          onProgress(progress, status);
        };
        ipcRenderer.on("firmware:progress", progressHandler);

        // Clean up listener when done
        const cleanup = () => {
          ipcRenderer.removeListener("firmware:progress", progressHandler);
        };

        return ipcRenderer
          .invoke("firmware:update", {
            unitIp,
            canId,
            hexContent,
            unitType,
          })
          .finally(cleanup);
      } else {
        return ipcRenderer.invoke("firmware:update", {
          unitIp,
          canId,
          hexContent,
          unitType,
        });
      }
    },
  },
  // UDP Network Scanning
  scanUDPNetwork: (config) => ipcRenderer.invoke("udp:scanNetwork", config),

  // RCU Group Control
  rcuController: {
    setGroupState: (params) => ipcRenderer.invoke("rcu:setGroupState", params),
    setMultipleGroupStates: (params) =>
      ipcRenderer.invoke("rcu:setMultipleGroupStates", params),
    getAllGroupStates: (params) =>
      ipcRenderer.invoke("rcu:getAllGroupStates", params),
    getAllOutputStates: (params) =>
      ipcRenderer.invoke("rcu:getAllOutputStates", params),
    // Air Conditioner Control
    getACStatus: (params) => ipcRenderer.invoke("rcu:getACStatus", params),
    getRoomTemp: (params) => ipcRenderer.invoke("rcu:getRoomTemp", params),
    setSettingRoomTemp: (params) =>
      ipcRenderer.invoke("rcu:setSettingRoomTemp", params),
    getSettingRoomTemp: (params) =>
      ipcRenderer.invoke("rcu:getSettingRoomTemp", params),
    setFanMode: (params) => ipcRenderer.invoke("rcu:setFanMode", params),
    getFanMode: (params) => ipcRenderer.invoke("rcu:getFanMode", params),
    setPowerMode: (params) => ipcRenderer.invoke("rcu:setPowerMode", params),
    getPowerMode: (params) => ipcRenderer.invoke("rcu:getPowerMode", params),
    setOperateMode: (params) =>
      ipcRenderer.invoke("rcu:setOperateMode", params),
    getOperateMode: (params) =>
      ipcRenderer.invoke("rcu:getOperateMode", params),
    setEcoMode: (params) => ipcRenderer.invoke("rcu:setEcoMode", params),
    getEcoMode: (params) => ipcRenderer.invoke("rcu:getEcoMode", params),
    // Scene Setup
    setupScene: (unitIp, canId, sceneConfig) =>
      ipcRenderer.invoke("rcu:setupScene", unitIp, canId, sceneConfig),
    // Scene Information
    getSceneInformation: (params) =>
      ipcRenderer.invoke("rcu:getSceneInformation", params),
    // All Scenes Information
    getAllScenesInformation: (params) =>
      ipcRenderer.invoke("rcu:getAllScenesInformation", params),
    // Scene Trigger
    triggerScene: (params) => ipcRenderer.invoke("rcu:triggerScene", params),
    // Scene Delete
    deleteScene: (unitIp, canId, sceneIndex) =>
      ipcRenderer.invoke("rcu:deleteScene", unitIp, canId, sceneIndex),
    // Delete All Scenes
    deleteAllScenes: (unitIp, canId) =>
      ipcRenderer.invoke("rcu:deleteAllScenes", unitIp, canId),
    // Multi-Scene Setup
    setupMultiScene: (unitIp, canId, multiSceneConfig) =>
      ipcRenderer.invoke(
        "rcu:setupMultiScene",
        unitIp,
        canId,
        multiSceneConfig
      ),
    // Multi-Scene Information
    getMultiSceneInformation: (params) =>
      ipcRenderer.invoke("rcu:getMultiSceneInformation", params),
    // All Multi-Scenes Information
    getAllMultiScenesInformation: (params) =>
      ipcRenderer.invoke("rcu:getAllMultiScenesInformation", params),
    // Multi-Scene Trigger
    triggerMultiScene: (params) =>
      ipcRenderer.invoke("rcu:triggerMultiScene", params),
    // Multi-Scene Delete
    deleteMultiScene: (unitIp, canId, multiSceneIndex) =>
      ipcRenderer.invoke(
        "rcu:deleteMultiScene",
        unitIp,
        canId,
        multiSceneIndex
      ),
    // Delete All Multi-Scenes
    deleteAllMultiScenes: (unitIp, canId) =>
      ipcRenderer.invoke("rcu:deleteAllMultiScenes", unitIp, canId),
    // Schedule Information
    getScheduleInformation: (params) =>
      ipcRenderer.invoke("rcu:getScheduleInformation", params),
    // All Schedules Information
    getAllSchedulesInformation: (params) =>
      ipcRenderer.invoke("rcu:getAllSchedulesInformation", params),
    // Delete Schedule
    deleteSchedule: (params) =>
      ipcRenderer.invoke("rcu:deleteSchedule", params),
    // Delete All Schedules
    deleteAllSchedules: (unitIp, canId) =>
      ipcRenderer.invoke("rcu:deleteAllSchedules", unitIp, canId),
    // Clock Control
    syncClock: (params) => ipcRenderer.invoke("rcu:syncClock", params),
    getClock: (params) => ipcRenderer.invoke("rcu:getClock", params),
    // Curtain Control
    getCurtainConfig: (params) =>
      ipcRenderer.invoke("rcu:getCurtainConfig", params),
    setCurtain: (params) => ipcRenderer.invoke("rcu:setCurtain", params),
    setCurtainConfig: (unitIp, canId, curtainConfig) =>
      ipcRenderer.invoke("rcu:setCurtainConfig", unitIp, canId, curtainConfig),
    // Delete Curtain
    deleteCurtain: (params) => ipcRenderer.invoke("rcu:deleteCurtain", params),
    // Delete All Curtains
    deleteAllCurtains: (unitIp, canId) =>
      ipcRenderer.invoke("rcu:deleteAllCurtains", unitIp, canId),
    // KNX Control
    setKnxConfig: (unitIp, canId, knxConfig) =>
      ipcRenderer.invoke("rcu:setKnxConfig", unitIp, canId, knxConfig),
    getKnxConfig: (params) => ipcRenderer.invoke("rcu:getKnxConfig", params),
    triggerKnx: (params) => ipcRenderer.invoke("rcu:triggerKnx", params),
    deleteKnxConfig: (params) =>
      ipcRenderer.invoke("rcu:deleteKnxConfig", params),
    deleteAllKnxConfigs: (unitIp, canId) =>
      ipcRenderer.invoke("rcu:deleteAllKnxConfigs", unitIp, canId),
  },
});
