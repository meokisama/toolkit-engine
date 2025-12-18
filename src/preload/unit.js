import { ipcRenderer } from "electron";

export const unit = {
  getAll: (projectId) => ipcRenderer.invoke("unit:getAll", projectId),
  getById: (id) => ipcRenderer.invoke("unit:getById", id),
  create: (projectId, itemData) => ipcRenderer.invoke("unit:create", projectId, itemData),
  update: (id, itemData) => ipcRenderer.invoke("unit:update", id, itemData),
  delete: (id) => ipcRenderer.invoke("unit:delete", id),
  deleteWithRelatedItems: (id) => ipcRenderer.invoke("unit:deleteWithRelatedItems", id),
  duplicate: (id) => ipcRenderer.invoke("unit:duplicate", id),
  bulkImport: (projectId, items) => ipcRenderer.invoke("unit:bulkImport", projectId, items),
  // Output configuration methods
  getOutputConfig: (unitId, outputIndex) => ipcRenderer.invoke("unit:getOutputConfig", unitId, outputIndex),
  saveOutputConfig: (unitId, outputIndex, outputType, configData) =>
    ipcRenderer.invoke("unit:saveOutputConfig", unitId, outputIndex, outputType, configData),
  deleteOutputConfig: (unitId, outputIndex) => ipcRenderer.invoke("unit:deleteOutputConfig", unitId, outputIndex),
  getAllOutputConfigs: (unitId) => ipcRenderer.invoke("unit:getAllOutputConfigs", unitId),
  // Input configuration methods
  getInputConfig: (unitId, inputIndex) => ipcRenderer.invoke("unit:getInputConfig", unitId, inputIndex),
  saveInputConfig: (unitId, inputIndex, functionValue, lightingId, multiGroupConfig, rlcConfig) =>
    ipcRenderer.invoke("unit:saveInputConfig", unitId, inputIndex, functionValue, lightingId, multiGroupConfig, rlcConfig),
  deleteInputConfig: (unitId, inputIndex) => ipcRenderer.invoke("unit:deleteInputConfig", unitId, inputIndex),
  getAllInputConfigs: (unitId) => ipcRenderer.invoke("unit:getAllInputConfigs", unitId),
  // Clear all I/O configurations (used when unit type changes)
  clearAllIOConfigs: (unitId) => ipcRenderer.invoke("unit:clearAllIOConfigs", unitId),
};
