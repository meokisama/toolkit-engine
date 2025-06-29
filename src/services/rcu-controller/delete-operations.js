import { UDP_PORT, PROTOCOL } from "./constants.js";
import { validators } from "./validators.js";
import { convertCanIdToInt, parseResponse } from "./utils.js";
import { sendCommand } from "./command-sender.js";

// Generic delete function
async function deleteItem(unitIp, canId, config, index = null) {
  const idAddress = convertCanIdToInt(canId);
  const data = [];

  if (index !== null && index !== undefined) {
    config.validator(index);
    data.push(index);
  }

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    config.cmd1,
    config.cmd2,
    data
  );

  return config.needsSuccessCheck ? parseResponse.success(response) : response;
}

// Delete configurations
const deleteConfigs = {
  scene: {
    cmd1: PROTOCOL.GENERAL.CMD1,
    cmd2: PROTOCOL.GENERAL.CMD2.CLEAR_SCENE,
    validator: validators.sceneIndex,
    needsSuccessCheck: false,
  },
  schedule: {
    cmd1: PROTOCOL.GENERAL.CMD1,
    cmd2: PROTOCOL.GENERAL.CMD2.CLEAR_SCHEDULE,
    validator: validators.scheduleIndex,
    needsSuccessCheck: false,
  },
  multiScene: {
    cmd1: PROTOCOL.GENERAL.CMD1,
    cmd2: PROTOCOL.GENERAL.CMD2.CLEAR_MULTI_SCENE,
    validator: validators.multiSceneIndex,
    needsSuccessCheck: false,
  },
  curtain: {
    cmd1: PROTOCOL.CURTAIN.CMD1,
    cmd2: PROTOCOL.CURTAIN.CMD2.CLEAR_CURTAIN,
    validator: validators.curtainIndex,
    needsSuccessCheck: true,
  },
};

// Delete Scene function
async function deleteScene(unitIp, canId, sceneIndex = null) {
  return deleteItem(unitIp, canId, deleteConfigs.scene, sceneIndex);
}

// Delete All Scenes function
async function deleteAllScenes(unitIp, canId) {
  return deleteScene(unitIp, canId);
}

// Delete Schedule function
async function deleteSchedule(unitIp, canId, scheduleIndex = null) {
  return deleteItem(unitIp, canId, deleteConfigs.schedule, scheduleIndex);
}

// Delete All Schedules function
async function deleteAllSchedules(unitIp, canId) {
  return deleteSchedule(unitIp, canId);
}

// Delete Multi-Scene function
async function deleteMultiScene(unitIp, canId, multiSceneIndex = null) {
  return deleteItem(unitIp, canId, deleteConfigs.multiScene, multiSceneIndex);
}

// Delete All Multi-Scenes function
async function deleteAllMultiScenes(unitIp, canId) {
  return deleteMultiScene(unitIp, canId);
}

// Delete Curtain function
async function deleteCurtain(unitIp, canId, curtainIndex) {
  console.log("Deleting curtain:", { unitIp, canId, curtainIndex });
  const result = await deleteItem(
    unitIp,
    canId,
    deleteConfigs.curtain,
    curtainIndex
  );
  if (!result) throw new Error("Failed to delete curtain");
  return result;
}

// Delete All Curtains function
async function deleteAllCurtains(unitIp, canId) {
  console.log("Deleting all curtains:", { unitIp, canId });
  const result = await deleteItem(unitIp, canId, deleteConfigs.curtain);
  if (!result) throw new Error("Failed to delete all curtains");
  return result;
}

export {
  deleteScene,
  deleteAllScenes,
  deleteSchedule,
  deleteAllSchedules,
  deleteMultiScene,
  deleteAllMultiScenes,
  deleteCurtain,
  deleteAllCurtains,
};
