import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt, parseResponse } from "./utils.js";
import { sendCommand } from "./command-sender.js";

// Air Conditioner Functions
async function getACStatus(unitIp, canId, group = 1) {
  const idAddress = convertCanIdToInt(canId);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_AC_GROUP,
    [group],
    true // Skip status check for GET_AC_GROUP
  );

  if (response && response.msg) {
    const msgLength = response.msg.length;

    // Check minimum length for basic response (header + 10 bytes data)
    if (msgLength < 18) {
      throw new Error(
        `Response too short: ${msgLength} bytes (minimum 18 required)`
      );
    }

    const data = response.msg.slice(8); // Skip header

    // Check if we have at least 10 bytes of AC status data
    if (data.length < 10) {
      throw new Error(
        `Insufficient AC status data: ${data.length} bytes (expected 10)`
      );
    }

    // Parse the 10-byte AC status data structure:
    // 1 byte status
    // 1 byte power (0:Off, 1:On)
    // 1 byte fanSpeed (0:Low, 1:Med, 2:High, 3:Auto, 4:Off)
    // 1 byte mode (0:Cool, 1:Heat, 2:Ventilation, 3:Dry)
    // 1 byte swing
    // 1 byte reserved
    // 2 byte temperature (180 -> 18 degrees)
    // 2 byte roomTemperature (250 -> 25 degrees)

    const status = data[0];
    const power = data[1];
    const fanSpeed = data[2];
    const mode = data[3];
    const swing = data[4];
    const reserved = data[5];
    const temperature = (data[7] << 8) | data[6]; // Little endian 2 bytes
    const roomTemperature = (data[9] << 8) | data[8]; // Little endian 2 bytes

    return {
      group: group,
      status: status,
      power: power === 1, // Convert to boolean
      fanSpeed: fanSpeed,
      mode: mode,
      swing: swing,
      reserved: reserved,
      temperature: temperature / 10, // Convert to celsius (180 -> 18.0)
      roomTemperature: roomTemperature / 10, // Convert to celsius (250 -> 25.0)
      // Add human-readable descriptions
      powerText: power === 1 ? "On" : "Off",
      fanSpeedText:
        ["Low", "Med", "High", "Auto", "Off"][fanSpeed] || "Unknown",
      modeText: ["Cool", "Heat", "Ventilation", "Dry"][mode] || "Unknown",
    };
  }

  throw new Error("No response received from AC status command");
}

async function getRoomTemp(unitIp, canId, group = 1) {
  return getACData(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.GET_ROOM_TEMP,
    [group],
    (data) => ({
      group: data[0],
      temperature: parseResponse.temperature(data, 1),
    }),
    "Invalid response from room temperature command"
  );
}

async function setSettingRoomTemp(
  unitIp,
  canId,
  group = 1,
  temperature = 25.0
) {
  const tempValue = Math.round(temperature * 10);
  const lowByte = tempValue & 0xff;
  const highByte = (tempValue >> 8) & 0xff;

  return sendACCommand(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.SET_SETTING_ROOM_TEMP,
    [group, lowByte, highByte],
    "Failed to set room temperature"
  );
}

async function getSettingRoomTemp(unitIp, canId, group = 1) {
  return getACData(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.GET_SETTING_ROOM_TEMP,
    [group],
    (data) => ({
      group: data[0],
      temperature: parseResponse.temperature(data, 1),
    }),
    "Invalid response from setting temperature command"
  );
}

// Generic AC command helper
async function sendACCommand(unitIp, canId, cmd2, data, errorMsg) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    cmd2,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error(errorMsg);
  }
  return true;
}

async function getACData(unitIp, canId, cmd2, data, parser, errorMsg) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    cmd2,
    data
  );

  if (response?.msg?.length >= 11) {
    const responseData = parseResponse.data(response);
    return parser(responseData);
  }

  throw new Error(errorMsg);
}

async function setFanMode(unitIp, canId, group = 1, fanSpeed = 0) {
  return sendACCommand(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.SET_FAN_MODE,
    [group, fanSpeed, 0],
    "Failed to set fan mode"
  );
}

async function getFanMode(unitIp, canId, group = 1) {
  return getACData(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.GET_FAN_MODE,
    [group],
    (data) => ({ group: data[0], fanSpeed: data[1] }),
    "Invalid response from fan mode command"
  );
}

async function setPowerMode(unitIp, canId, group = 1, power = true) {
  const powerValue = power ? 1 : 0;
  try {
    await sendACCommand(
      unitIp,
      canId,
      PROTOCOL.AC.CMD2.SET_POWER_MODE,
      [group, powerValue, 0],
      "Failed to set power mode"
    );
    return true;
  } catch {
    return false;
  }
}

async function getPowerMode(unitIp, canId, group = 1) {
  return getACData(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.GET_POWER_MODE,
    [group],
    (data) => ({ group: data[0], power: data[1] === 1 }),
    "Invalid response from power mode command"
  );
}

async function setOperateMode(unitIp, canId, group = 1, mode = 1) {
  return sendACCommand(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.SET_OPERATE_MODE,
    [group, mode, 0],
    "Failed to set operate mode"
  );
}

async function getOperateMode(unitIp, canId, group = 1) {
  return getACData(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.GET_OPERATE_MODE,
    [group],
    (data) => ({ group: data[0], mode: data[1] }),
    "Invalid response from operate mode command"
  );
}

async function setEcoMode(unitIp, canId, group = 1, eco = false) {
  const ecoValue = eco ? 1 : 0;
  return sendACCommand(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.SET_ECO_MODE,
    [group, ecoValue, 0],
    "Failed to set eco mode"
  );
}

async function getEcoMode(unitIp, canId, group = 1) {
  return getACData(
    unitIp,
    canId,
    PROTOCOL.AC.CMD2.GET_ECO_MODE,
    [group],
    (data) => ({ group: data[0], eco: data[1] === 1 }),
    "Invalid response from eco mode command"
  );
}

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
};
