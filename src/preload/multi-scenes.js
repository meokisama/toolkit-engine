import { ipcRenderer } from "electron";

// Database Operations
export const multiScenes = {
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
};

// Network Operations
export const multiScenesController = {
  // Multi-Scene Setup
  setupMultiScene: (unitIp, canId, multiSceneConfig) =>
    ipcRenderer.invoke("rcu:setupMultiScene", unitIp, canId, multiSceneConfig),
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
    ipcRenderer.invoke("rcu:deleteMultiScene", unitIp, canId, multiSceneIndex),
  // Delete All Multi-Scenes
  deleteAllMultiScenes: (unitIp, canId) =>
    ipcRenderer.invoke("rcu:deleteAllMultiScenes", unitIp, canId),
};
