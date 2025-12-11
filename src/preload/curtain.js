import { ipcRenderer } from "electron";

// Database Operations
export const curtain = {
  getAll: (projectId) => ipcRenderer.invoke("curtain:getAll", projectId),
  create: (projectId, itemData) => ipcRenderer.invoke("curtain:create", projectId, itemData),
  update: (id, itemData) => ipcRenderer.invoke("curtain:update", id, itemData),
  delete: (id) => ipcRenderer.invoke("curtain:delete", id),
  duplicate: (id) => ipcRenderer.invoke("curtain:duplicate", id),
  bulkImport: (projectId, items) => ipcRenderer.invoke("curtain:bulkImport", projectId, items),
};

// Network Operations
export const curtainController = {
  getCurtainConfig: (params) => ipcRenderer.invoke("rcu:getCurtainConfig", params),
  setCurtain: (params) => ipcRenderer.invoke("rcu:setCurtain", params),
  setCurtainConfig: (unitIp, canId, curtainConfig) => ipcRenderer.invoke("rcu:setCurtainConfig", unitIp, canId, curtainConfig),
  deleteCurtain: (params) => ipcRenderer.invoke("rcu:deleteCurtain", params),
  deleteAllCurtains: (unitIp, canId) => ipcRenderer.invoke("rcu:deleteAllCurtains", unitIp, canId),
};
