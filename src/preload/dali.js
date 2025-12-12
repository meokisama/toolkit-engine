import { ipcRenderer } from "electron";

// Database Operation
export const dali = {
  // Device operations
  getAllDaliDevices: (projectId) => ipcRenderer.invoke("dali:getAllDaliDevices", projectId),
  getDevice: (projectId, address) => ipcRenderer.invoke("dali:getDevice", projectId, address),
  upsertDaliDevice: (projectId, address, deviceData) => ipcRenderer.invoke("dali:upsertDaliDevice", projectId, address, deviceData),
  updateDaliDeviceName: (projectId, address, name) => ipcRenderer.invoke("dali:updateDaliDeviceName", projectId, address, name),
  clearDaliDeviceMapping: (projectId, address) => ipcRenderer.invoke("dali:clearDaliDeviceMapping", projectId, address),
  deleteDevice: (projectId, address) => ipcRenderer.invoke("dali:deleteDevice", projectId, address),

  // Group metadata operations
  getDaliGroupName: (projectId, groupId) => ipcRenderer.invoke("dali:getDaliGroupName", projectId, groupId),
  getAllDaliGroupNames: (projectId) => ipcRenderer.invoke("dali:getAllDaliGroupNames", projectId),
  updateDaliGroupName: (projectId, groupId, name) => ipcRenderer.invoke("dali:updateDaliGroupName", projectId, groupId, name),
  initializeDaliGroups: (projectId) => ipcRenderer.invoke("dali:initializeDaliGroups", projectId),
  updateDaliGroupLightingAddress: (projectId, groupId, lightingGroupAddress) =>
    ipcRenderer.invoke("dali:updateDaliGroupLightingAddress", projectId, groupId, lightingGroupAddress),
  updateDaliDeviceLightingAddress: (projectId, address, lightingGroupAddress) =>
    ipcRenderer.invoke("dali:updateDaliDeviceLightingAddress", projectId, address, lightingGroupAddress),

  // Group operations
  getDaliGroupDevices: (projectId, groupId) => ipcRenderer.invoke("dali:getDaliGroupDevices", projectId, groupId),
  getAllDaliGroupDevices: (projectId) => ipcRenderer.invoke("dali:getAllDaliGroupDevices", projectId),
  addDaliDeviceToGroup: (projectId, groupId, deviceAddress) => ipcRenderer.invoke("dali:addDaliDeviceToGroup", projectId, groupId, deviceAddress),
  removeDaliDeviceFromGroup: (projectId, groupId, deviceAddress) =>
    ipcRenderer.invoke("dali:removeDaliDeviceFromGroup", projectId, groupId, deviceAddress),
  getDaliDeviceGroups: (projectId, deviceAddress) => ipcRenderer.invoke("dali:getDaliDeviceGroups", projectId, deviceAddress),

  // Scene metadata operations
  getDaliSceneName: (projectId, sceneId) => ipcRenderer.invoke("dali:getDaliSceneName", projectId, sceneId),
  getAllDaliSceneNames: (projectId) => ipcRenderer.invoke("dali:getAllDaliSceneNames", projectId),
  updateDaliSceneName: (projectId, sceneId, name) => ipcRenderer.invoke("dali:updateDaliSceneName", projectId, sceneId, name),

  // Scene operations
  getDaliSceneDevices: (projectId, sceneId) => ipcRenderer.invoke("dali:getDaliSceneDevices", projectId, sceneId),
  getAllDaliSceneDevices: (projectId) => ipcRenderer.invoke("dali:getAllDaliSceneDevices", projectId),
  upsertDaliSceneDevice: (projectId, sceneId, deviceAddress, active, brightness, colorTemp, r, g, b, w) =>
    ipcRenderer.invoke("dali:upsertDaliSceneDevice", projectId, sceneId, deviceAddress, active, brightness, colorTemp, r, g, b, w),
  deleteDaliSceneDevice: (projectId, sceneId, deviceAddress) => ipcRenderer.invoke("dali:deleteDaliSceneDevice", projectId, sceneId, deviceAddress),

  // Clear all configurations
  clearAllDaliDeviceMappings: (projectId) => ipcRenderer.invoke("dali:clearAllDaliDeviceMappings", projectId),
  clearAllDaliGroups: (projectId) => ipcRenderer.invoke("dali:clearAllDaliGroups", projectId),
  clearAllDaliScenes: (projectId) => ipcRenderer.invoke("dali:clearAllDaliScenes", projectId),
  clearAllDaliConfigurations: (projectId) => ipcRenderer.invoke("dali:clearAllDaliConfigurations", projectId),
};

// Network Operation
export const daliController = {
  commissioning: (params) => ipcRenderer.invoke("rcu:daliCommissioning", params),
  scan: (params) => ipcRenderer.invoke("rcu:daliScan", params),
  conflictAddressCommissioning: (params) => ipcRenderer.invoke("rcu:daliConflictAddressCommissioning", params),
  sendAddressMapping: (params) => ipcRenderer.invoke("rcu:sendAddressMapping", params),
  sendMappingRCU: (params) => ipcRenderer.invoke("rcu:sendMappingRCU", params),
  sendGroupSceneConfig: (params) => ipcRenderer.invoke("rcu:sendGroupSceneConfig", params),
  resetAllConfig: (params) => ipcRenderer.invoke("rcu:resetAllConfig", params),
  sendDeleteAddress: (params) => ipcRenderer.invoke("rcu:sendDeleteAddress", params),
  broadcastOn: (params) => ipcRenderer.invoke("rcu:daliBroadcastOn", params),
  broadcastOff: (params) => ipcRenderer.invoke("rcu:daliBroadcastOff", params),
  triggerDevice: (params) => ipcRenderer.invoke("rcu:triggerDaliDevice", params),
  triggerType8Device: (params) => ipcRenderer.invoke("rcu:triggerDaliType8Device", params),
  triggerGroup: (params) => ipcRenderer.invoke("rcu:triggerDaliGroup", params),
  triggerScene: (params) => ipcRenderer.invoke("rcu:triggerDaliScene", params),
  onDeviceCountChanged: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("dali:deviceCountChanged", handler);
    return () => ipcRenderer.removeListener("dali:deviceCountChanged", handler);
  },
  onAddressConflict: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("dali:addressConflict", handler);
    return () => ipcRenderer.removeListener("dali:addressConflict", handler);
  },
};
