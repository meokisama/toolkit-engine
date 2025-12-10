import { ipcRenderer } from "electron";

// UDP Network Scanning
export const scanUDPNetwork = (config) =>
  ipcRenderer.invoke("udp:scanNetwork", config);

// Network Interface Management
export const networkInterfaces = {
  getAll: (forceRefresh = false) =>
    ipcRenderer.invoke("network:getInterfaces", forceRefresh),
  getBroadcastAddresses: (forceRefresh = false) =>
    ipcRenderer.invoke("network:getBroadcastAddresses", forceRefresh),
  getSummary: () => ipcRenderer.invoke("network:getSummary"),
  findInterfaceForTarget: (targetIp) =>
    ipcRenderer.invoke("network:findInterfaceForTarget", targetIp),
  clearCache: () => ipcRenderer.invoke("network:clearCache"),
};
