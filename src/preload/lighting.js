import { ipcRenderer } from "electron";

export const lighting = {
  getAll: (projectId) => ipcRenderer.invoke("lighting:getAll", projectId),
  create: (projectId, itemData) =>
    ipcRenderer.invoke("lighting:create", projectId, itemData),
  update: (id, itemData) =>
    ipcRenderer.invoke("lighting:update", id, itemData),
  delete: (id) => ipcRenderer.invoke("lighting:delete", id),
  duplicate: (id) => ipcRenderer.invoke("lighting:duplicate", id),
  bulkImport: (projectId, items) =>
    ipcRenderer.invoke("lighting:bulkImport", projectId, items),
};
