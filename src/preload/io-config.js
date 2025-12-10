import { ipcRenderer } from "electron";

export const ioController = {
  setGroupState: (params) => ipcRenderer.invoke("rcu:setGroupState", params),
  setOutputState: (params) => ipcRenderer.invoke("rcu:setOutputState", params),
  setInputState: (params) => ipcRenderer.invoke("rcu:setInputState", params),
  setMultipleGroupStates: (params) =>
    ipcRenderer.invoke("rcu:setMultipleGroupStates", params),
  getAllGroupStates: (params) =>
    ipcRenderer.invoke("rcu:getAllGroupStates", params),
  getAllOutputStates: (params) =>
    ipcRenderer.invoke("rcu:getAllOutputStates", params),
  getAllInputStates: (params) =>
    ipcRenderer.invoke("rcu:getAllInputStates", params),
  getAllInputConfigs: (params) =>
    ipcRenderer.invoke("rcu:getAllInputConfigs", params),
  setupInputConfig: (params) =>
    ipcRenderer.invoke("rcu:setupInputConfig", params),
  setupBatchInputConfigs: (params) =>
    ipcRenderer.invoke("rcu:setupBatchInputConfigs", params),
  // Output configuration methods
  getOutputAssign: (params) =>
    ipcRenderer.invoke("rcu:getOutputAssign", params),
  getOutputConfig: (unitIp, canId) =>
    ipcRenderer.invoke("rcu:getOutputConfig", unitIp, canId),
  setOutputAssign: (unitIp, canId, outputIndex, lightingAddress) =>
    ipcRenderer.invoke(
      "rcu:setOutputAssign",
      unitIp,
      canId,
      outputIndex,
      lightingAddress
    ),
  setAllOutputAssignments: (unitIp, canId, outputAssignments) =>
    ipcRenderer.invoke(
      "rcu:setAllOutputAssignments",
      unitIp,
      canId,
      outputAssignments
    ),
  setOutputDelayOff: (unitIp, canId, outputIndex, delayOff) =>
    ipcRenderer.invoke(
      "rcu:setOutputDelayOff",
      unitIp,
      canId,
      outputIndex,
      delayOff
    ),
  setOutputDelayOn: (unitIp, canId, outputIndex, delayOn) =>
    ipcRenderer.invoke(
      "rcu:setOutputDelayOn",
      unitIp,
      canId,
      outputIndex,
      delayOn
    ),
  setOutputConfig: (unitIp, canId, outputIndex, config) =>
    ipcRenderer.invoke(
      "rcu:setOutputConfig",
      unitIp,
      canId,
      outputIndex,
      config
    ),
  setupBatchLightingOutputs: (params) =>
    ipcRenderer.invoke("rcu:setupBatchLightingOutputs", params),
  getLocalACConfig: (unitIp, canId) =>
    ipcRenderer.invoke("rcu:getLocalACConfig", unitIp, canId),
  setLocalACConfig: (unitIp, canId, acConfigs) =>
    ipcRenderer.invoke("rcu:setLocalACConfig", unitIp, canId, acConfigs),
};
