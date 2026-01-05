import { ipcRenderer } from "electron";

export const projects = {
  getAll: () => ipcRenderer.invoke("projects:getAll"),
  getById: (id) => ipcRenderer.invoke("projects:getById", id),
  create: (projectData) => ipcRenderer.invoke("projects:create", projectData),
  update: (id, projectData) => ipcRenderer.invoke("projects:update", id, projectData),
  delete: (id) => ipcRenderer.invoke("projects:delete", id),
  getAllItems: (projectId) => ipcRenderer.invoke("projects:getAllItems", projectId),
  import: (projectData, itemsData) => ipcRenderer.invoke("projects:import", projectData, itemsData),
};
