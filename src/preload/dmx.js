import { ipcRenderer } from "electron";

// Database Operations
export const dmx = {
  getAll: (projectId) => ipcRenderer.invoke("dmx:getAll", projectId),
  create: (projectId, itemData) => ipcRenderer.invoke("dmx:create", projectId, itemData),
  update: (id, itemData) => ipcRenderer.invoke("dmx:update", id, itemData),
  delete: (id) => ipcRenderer.invoke("dmx:delete", id),
  duplicate: (id) => ipcRenderer.invoke("dmx:duplicate", id),
  bulkImport: (projectId, items) => ipcRenderer.invoke("dmx:bulkImport", projectId, items),
};

// Network Operations
export const dmxController = {
  setDmxColor: (unitIp, canId, dmxItems, totalDeviceCount) =>
    ipcRenderer.invoke("rcu:setDmxColor", unitIp, canId, dmxItems, totalDeviceCount),
  getDmxColor: (unitIp, canId) =>
    ipcRenderer.invoke("rcu:getDmxColor", unitIp, canId),
};
