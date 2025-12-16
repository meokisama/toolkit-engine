import { ipcRenderer } from "electron";

// Database Operation
export const room = {
  // Room general config operations
  getGeneralConfig: (projectId, sourceUnit = null) => ipcRenderer.invoke("room:getGeneralConfig", projectId, sourceUnit),
  setGeneralConfig: (projectId, config, sourceUnit = null) => ipcRenderer.invoke("room:setGeneralConfig", projectId, config, sourceUnit),
  getAllGeneralConfigs: (projectId) => ipcRenderer.invoke("room:getAllGeneralConfigs", projectId),
  deleteRoomGeneralConfig: (projectId, sourceUnit = null) => ipcRenderer.invoke("room:deleteRoomGeneralConfig", projectId, sourceUnit),

  // Room config operations
  getAllRoomConfigs: (generalConfigId) => ipcRenderer.invoke("room:getAllRoomConfigs", generalConfigId),
  getAllRoomConfigsByUnit: (projectId, sourceUnit = null) => ipcRenderer.invoke("room:getAllRoomConfigsByUnit", projectId, sourceUnit),
  setRoomConfig: (projectId, sourceUnit, roomAddress, config) => ipcRenderer.invoke("room:setRoomConfig", projectId, sourceUnit, roomAddress, config),
};

// Network Operation
export const roomController = {
  setRoomConfiguration: (unitIp, canId, generalConfig, roomConfigs) =>
    ipcRenderer.invoke("rcu:setRoomConfiguration", unitIp, canId, generalConfig, roomConfigs),
  getRoomConfiguration: (unitIp, canId) => ipcRenderer.invoke("rcu:getRoomConfiguration", unitIp, canId),
  getRoomStatus: (unitIp, canId) => ipcRenderer.invoke("rcu:getRoomStatus", unitIp, canId),
  setRoomStatus: (unitIp, canId, airconMode, roomStatuses) => ipcRenderer.invoke("rcu:setRoomStatus", unitIp, canId, airconMode, roomStatuses),
};
