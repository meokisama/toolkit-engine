// Export all lighting functions
export {
  setGroupState,
  setOutputState,
  setMultipleGroupStates,
  getAllGroupStates,
  getAllOutputStates,
  getAllInputStates,
} from "./rcu-controller/lighting.js";

// Export input configuration functions
export { getAllInputConfigs } from "./rcu-controller/input-config.js";

// Export input setup functions
export { setupInputConfig } from "./rcu-controller/input-setup.js";

// Export output configuration functions
export {
  getOutputAssign,
  setOutputAssign,
  setAllOutputAssignments,
  getOutputConfig,
  setOutputConfig,
  setOutputDelayOff,
  setOutputDelayOn,
} from "./rcu-controller/output.js";

// Export air conditioner functions
export {
  getACStatus,
  getRoomTemp,
  setSettingRoomTemp,
  getSettingRoomTemp,
  setFanMode,
  getFanMode,
  setPowerMode,
  getPowerMode,
  setOperateMode,
  getOperateMode,
  setEcoMode,
  getEcoMode,
  getLocalACConfig,
  setLocalACConfig,
} from "./rcu-controller/air-conditioner.js";

// Export scene functions
export {
  setupScene,
  getSceneInformation,
  getAllScenesInformation,
  triggerScene,
} from "./rcu-controller/scene.js";

// Export schedule functions
export {
  setupSchedule,
  getScheduleInformation,
  getAllSchedulesInformation,
} from "./rcu-controller/schedule.js";

// Export multi-scene functions
export {
  setupMultiScene,
  getMultiSceneInformation,
  getAllMultiScenesInformation,
  triggerMultiScene,
} from "./rcu-controller/multi-scene.js";

// Export sequence functions
export {
  setupSequence,
  getSequenceInformation,
  getAllSequencesInformation,
  triggerSequence,
} from "./rcu-controller/sequence.js";

// Export clock functions
export { syncClock, getClock } from "./rcu-controller/clock.js";

// Export curtain functions
export {
  getCurtainConfig,
  setCurtain,
  setCurtainConfig,
} from "./rcu-controller/curtain.js";

// Export KNX functions
export {
  setKnxConfig,
  getKnxConfig,
  triggerKnx,
  deleteKnxConfig,
  deleteAllKnxConfigs,
} from "./rcu-controller/knx.js";

// Export delete operations
export {
  deleteScene,
  deleteAllScenes,
  deleteSchedule,
  deleteAllSchedules,
  deleteMultiScene,
  deleteAllMultiScenes,
  deleteSequence,
  deleteAllSequences,
  deleteCurtain,
  deleteAllCurtains,
} from "./rcu-controller/delete-operations.js";

// Export firmware functions
export { updateFirmware } from "./rcu-controller/firmware.js";

// Export general functions
export {
  changeIpAddress,
  changeCanId,
  setHardwareConfig,
} from "./rcu-controller/general.js";

// Export RS485 functions
export {
  getRS485CH1Config,
  getRS485CH2Config,
  setRS485CH1Config,
  setRS485CH2Config,
  createDefaultNetworkRS485Config,
} from "./rcu-controller/rs485.js";
