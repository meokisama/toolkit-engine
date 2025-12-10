import { ipcRenderer } from "electron";

// Database Operation
export const room = {
  // Room general config operations
  getGeneralConfig: (projectId) =>
    ipcRenderer.invoke("room:getGeneralConfig", projectId),
  setGeneralConfig: (projectId, config) =>
    ipcRenderer.invoke("room:setGeneralConfig", projectId, config),

  // Room config operations
  getRoomConfig: (projectId, roomAddress) =>
    ipcRenderer.invoke("room:getRoomConfig", projectId, roomAddress),
  getAllRoomConfigs: (projectId) =>
    ipcRenderer.invoke("room:getAllRoomConfigs", projectId),
  setRoomConfig: (projectId, roomAddress, config) =>
    ipcRenderer.invoke("room:setRoomConfig", projectId, roomAddress, config),
  deleteRoomConfig: (projectId, roomAddress) =>
    ipcRenderer.invoke("room:deleteRoomConfig", projectId, roomAddress),
  deleteAllRoomConfigs: (projectId) =>
    ipcRenderer.invoke("room:deleteAllRoomConfigs", projectId),
};

// Network Operation
export const roomController = {
  setRoomConfiguration: (unitIp, canId, generalConfig, roomConfigs) =>
    ipcRenderer.invoke(
      "rcu:setRoomConfiguration",
      unitIp,
      canId,
      generalConfig,
      roomConfigs
    ),
  getRoomConfiguration: (unitIp, canId) =>
    ipcRenderer.invoke("rcu:getRoomConfiguration", unitIp, canId),
  getRoomStatus: (unitIp, canId) =>
    ipcRenderer.invoke("rcu:getRoomStatus", unitIp, canId),
  setRoomStatus: (unitIp, canId, airconMode, roomStatuses) =>
    ipcRenderer.invoke(
      "rcu:setRoomStatus",
      unitIp,
      canId,
      airconMode,
      roomStatuses
    ),
};
