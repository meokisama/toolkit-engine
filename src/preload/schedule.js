import { ipcRenderer } from "electron";

// Database Operations
export const schedule = {
  getAll: (projectId) => ipcRenderer.invoke("schedule:getAll", projectId),
  create: (projectId, itemData) => ipcRenderer.invoke("schedule:create", projectId, itemData),
  update: (id, itemData) => ipcRenderer.invoke("schedule:update", id, itemData),
  delete: (id) => ipcRenderer.invoke("schedule:delete", id),
  duplicate: (id) => ipcRenderer.invoke("schedule:duplicate", id),
  bulkImport: (projectId, items) => ipcRenderer.invoke("schedule:bulkImport", projectId, items),
  // Schedule-Scene Relationships
  getScenesWithDetails: (scheduleId) => ipcRenderer.invoke("schedule:getScenesWithDetails", scheduleId),
  addScene: (scheduleId, sceneId) => ipcRenderer.invoke("schedule:addScene", scheduleId, sceneId),
  removeScene: (scheduleSceneId) => ipcRenderer.invoke("schedule:removeScene", scheduleSceneId),
  getForSending: (scheduleId) => ipcRenderer.invoke("schedule:getForSending", scheduleId),
  send: (params) => ipcRenderer.invoke("schedule:send", params),
};

// Network Operations
export const scheduleController = {
  getScheduleInformation: (params) => ipcRenderer.invoke("rcu:getScheduleInformation", params),
  getAllSchedulesInformation: (params) => ipcRenderer.invoke("rcu:getAllSchedulesInformation", params),
  deleteSchedule: (params) => ipcRenderer.invoke("rcu:deleteSchedule", params),
  deleteAllSchedules: (unitIp, canId) => ipcRenderer.invoke("rcu:deleteAllSchedules", unitIp, canId),
};
