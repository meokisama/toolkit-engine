import { ipcRenderer } from "electron";

// Database Operations
export const sequences = {
  getAll: (projectId) => ipcRenderer.invoke("sequences:getAll", projectId),
  create: (projectId, itemData) => ipcRenderer.invoke("sequences:create", projectId, itemData),
  update: (id, itemData) => ipcRenderer.invoke("sequences:update", id, itemData),
  delete: (id) => ipcRenderer.invoke("sequences:delete", id),
  duplicate: (id) => ipcRenderer.invoke("sequences:duplicate", id),
  bulkImport: (projectId, items) => ipcRenderer.invoke("sequences:bulkImport", projectId, items),
  // Sequence multi-scenes management
  getMultiScenes: (sequenceId) => ipcRenderer.invoke("sequences:getMultiScenes", sequenceId),
  addMultiScene: (sequenceId, multiSceneId, multiSceneOrder) =>
    ipcRenderer.invoke("sequences:addMultiScene", sequenceId, multiSceneId, multiSceneOrder),
  removeMultiScene: (sequenceId, multiSceneId) => ipcRenderer.invoke("sequences:removeMultiScene", sequenceId, multiSceneId),
  updateMultiScenes: (sequenceId, multiSceneIds) => ipcRenderer.invoke("sequences:updateMultiScenes", sequenceId, multiSceneIds),
};

// Network Operations
export const sequenceController = {
  deleteSequence: (unitIp, canId, sequenceIndex) => ipcRenderer.invoke("rcu:deleteSequence", unitIp, canId, sequenceIndex),
  deleteAllSequences: (unitIp, canId) => ipcRenderer.invoke("rcu:deleteAllSequences", unitIp, canId),
  setupSequence: (unitIp, canId, sequenceConfig) => ipcRenderer.invoke("rcu:setupSequence", unitIp, canId, sequenceConfig),
  getSequenceInformation: (params) => ipcRenderer.invoke("rcu:getSequenceInformation", params),
  getAllSequencesInformation: (params) => ipcRenderer.invoke("rcu:getAllSequencesInformation", params),
  triggerSequence: (params) => ipcRenderer.invoke("rcu:triggerSequence", params),
};
