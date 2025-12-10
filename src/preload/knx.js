import { ipcRenderer } from "electron";

// Database Operations
export const knx = {
  getAll: (projectId) => ipcRenderer.invoke("knx:getAll", projectId),
  create: (projectId, itemData) =>
    ipcRenderer.invoke("knx:create", projectId, itemData),
  update: (id, itemData) => ipcRenderer.invoke("knx:update", id, itemData),
  delete: (id) => ipcRenderer.invoke("knx:delete", id),
  duplicate: (id) => ipcRenderer.invoke("knx:duplicate", id),
  bulkImport: (projectId, items) =>
    ipcRenderer.invoke("knx:bulkImport", projectId, items),
};

// Network Operations
export const knxController = {
  setKnxConfig: (unitIp, canId, knxConfig) =>
    ipcRenderer.invoke("rcu:setKnxConfig", unitIp, canId, knxConfig),
  getKnxConfig: (params) => ipcRenderer.invoke("rcu:getKnxConfig", params),
  triggerKnx: (params) => ipcRenderer.invoke("rcu:triggerKnx", params),
  deleteKnxConfig: (params) =>
    ipcRenderer.invoke("rcu:deleteKnxConfig", params),
  deleteAllKnxConfigs: (unitIp, canId) =>
    ipcRenderer.invoke("rcu:deleteAllKnxConfigs", unitIp, canId),
};
