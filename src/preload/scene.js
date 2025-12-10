import { ipcRenderer } from "electron";

// Database Operations
export const scene = {
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
};

// Network Operations
export const sceneController = {
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
};
