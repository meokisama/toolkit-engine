import { UDP_PORT, PROTOCOL } from "./constants.js";
import { parseResponse } from "./utils.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

// Generic general command helper
async function sendGeneralCommand(unitIp, canId, cmd2, data) {
  const idAddress = convertCanIdToInt(canId);
  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    cmd2,
    data
  );
}

// Change IP Address function
async function changeIpAddress(unitIp, canId, newIpBytes, oldIpBytes) {
  console.log("Changing IP address:", {
    unitIp,
    canId,
    newIpBytes,
    oldIpBytes,
  });

  // Data: 4 bytes new IP + 4 bytes old IP
  const data = [...newIpBytes, ...oldIpBytes];

  const response = await sendGeneralCommand(
    unitIp,
    canId,
    PROTOCOL.GENERAL.CMD2.CHANGE_IP,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to change IP address");
  }

  return {
    result: { success: true }
  };
}

// Change CAN ID function
async function changeCanId(unitIp, canId, newLastPart) {
  console.log("Changing CAN ID:", {
    unitIp,
    canId,
    newLastPart,
  });

  // Validate new last part (1-255)
  if (newLastPart < 1 || newLastPart > 255) {
    throw new Error("CAN ID last part must be between 1-255");
  }

  const data = [newLastPart];

  const response = await sendGeneralCommand(
    unitIp,
    canId,
    PROTOCOL.GENERAL.CMD2.CHANGE_ID,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to change CAN ID");
  }

  return {
    result: { success: true }
  };
}

// Set Hardware Configuration function
// configByte structure:
// - Bit 0-1: Action mode (0: Stand-Alone, 1: Slave, 2: Master)
// - Bit 2: CAN Load (0: disabled, 1: enabled)
// - Bit 6: Recovery (0: disabled, 1: enabled)
// - Other bits: reserved
async function setHardwareConfig(unitIp, canId, configByte) {
  console.log("Setting hardware config:", {
    unitIp,
    canId,
    configByte: `0x${configByte.toString(16).padStart(2, '0')}`,
    actionMode: configByte & 0x03,
    canLoad: !!(configByte & 0x04),
    recovery: !!(configByte & 0x40),
  });

  const data = [configByte];

  const response = await sendGeneralCommand(
    unitIp,
    canId,
    PROTOCOL.GENERAL.CMD2.HARDWARE_CONFIG,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to set hardware configuration");
  }

  return {
    result: { success: true }
  };
}



export {
  changeIpAddress,
  changeCanId,
  setHardwareConfig,
};
