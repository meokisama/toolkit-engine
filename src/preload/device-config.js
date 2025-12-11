import { ipcRenderer } from "electron";

export const deviceController = {
  // Clock Control
  syncClock: (params) => ipcRenderer.invoke("rcu:syncClock", params),
  getClock: (params) => ipcRenderer.invoke("rcu:getClock", params),

  // Network Unit Edit functions
  changeIpAddress: (params) => ipcRenderer.invoke("rcu:changeIpAddress", params),
  changeIpAddressBroadcast: (params) => ipcRenderer.invoke("rcu:changeIpAddressBroadcast", params),
  changeCanId: (params) => ipcRenderer.invoke("rcu:changeCanId", params),
  setHardwareConfig: (params) => ipcRenderer.invoke("rcu:setHardwareConfig", params),

  // RS485 Configuration functions
  getRS485CH1Config: (params) => ipcRenderer.invoke("rcu:getRS485CH1Config", params),
  getRS485CH2Config: (params) => ipcRenderer.invoke("rcu:getRS485CH2Config", params),
  setRS485CH1Config: (params) => ipcRenderer.invoke("rcu:setRS485CH1Config", params),
  setRS485CH2Config: (params) => ipcRenderer.invoke("rcu:setRS485CH2Config", params),
};
