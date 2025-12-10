import { ipcRenderer } from "electron";

// Database Operations
export const aircon = {
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
};

// Network Operations
export const airconController = {
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
  setOperateMode: (params) => ipcRenderer.invoke("rcu:setOperateMode", params),
  getOperateMode: (params) => ipcRenderer.invoke("rcu:getOperateMode", params),
  setEcoMode: (params) => ipcRenderer.invoke("rcu:setEcoMode", params),
  getEcoMode: (params) => ipcRenderer.invoke("rcu:getEcoMode", params),
};
