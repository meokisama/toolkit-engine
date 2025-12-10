import { ipcRenderer } from "electron";

// Database Operation
export const zigbee = {
  getDevices: (projectId, unitIp = null) =>
    ipcRenderer.invoke("zigbee:getDevices", projectId, unitIp),
  createDevice: (projectId, deviceData) =>
    ipcRenderer.invoke("zigbee:createDevice", projectId, deviceData),
  updateDevice: (id, deviceData) =>
    ipcRenderer.invoke("zigbee:updateDevice", id, deviceData),
  deleteDevice: (id) => ipcRenderer.invoke("zigbee:deleteDevice", id),
  deleteAllDevicesForUnit: (projectId, unitIp) =>
    ipcRenderer.invoke("zigbee:deleteAllDevicesForUnit", projectId, unitIp),
};

// Network Operation
export const zigbeeController = {
  getZigbeeDevices: (params) =>
    ipcRenderer.invoke("rcu:getZigbeeDevices", params),
  sendZigbeeCommand: (params) =>
    ipcRenderer.invoke("rcu:sendZigbeeCommand", params),
  removeZigbeeDevice: (params) =>
    ipcRenderer.invoke("rcu:removeZigbeeDevice", params),
  closeZigbeeNetwork: (params) =>
    ipcRenderer.invoke("rcu:closeZigbeeNetwork", params),
  exploreZigbeeNetwork: (params) =>
    ipcRenderer.invoke("rcu:exploreZigbeeNetwork", params),
  setupZigbeeDevice: (params) =>
    ipcRenderer.invoke("rcu:setupZigbeeDevice", params),
  factoryResetZigbee: (params) =>
    ipcRenderer.invoke("rcu:factoryResetZigbee", params),
};
