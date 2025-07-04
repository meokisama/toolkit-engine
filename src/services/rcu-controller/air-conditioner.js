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

// AC Output Configuration Functions
async function getLocalACConfig(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_LOCAL_AC_CONFIG,
    [], // No data needed - get all 10 AC outputs
    true // Skip status check for GET commands
  );

  // Add delay after GET command to prevent auto refresh conflicts
  await new Promise(resolve => setTimeout(resolve, 300));

  if (response?.msg?.length >= 11) {
    const responseData = parseResponse.data(response);

    // Parse 10 AC configurations (64 bytes each)
    const acConfigs = [];
    const AC_CONFIG_SIZE = 64; // 64 bytes per AC config

    for (let i = 0; i < 10; i++) {
      const offset = i * AC_CONFIG_SIZE;
      if (offset + AC_CONFIG_SIZE <= responseData.length) {
        const configData = responseData.slice(offset, offset + AC_CONFIG_SIZE);

        const acConfig = {
          index: i,
          address: configData[0],
          enable: configData[1] === 1,
          windowMode: configData[2], // 0: Off, 1: Save energy
          fanType: configData[3], // 0: on/off, 1: analog
          tempType: configData[4], // 0: thermostat, 1: RCU
          tempUnit: configData[5], // 0: C, 1: F
          valveContact: configData[6], // 0: NO, 1: NC
          valveType: configData[7], // 0: On/Off, 1: analog, 2: on and off
          deadband: configData[8],
          lowFCU_Group: configData[9],
          medFCU_Group: configData[10],
          highFCU_Group: configData[11],
          fanAnalogGroup: configData[12],
          analogCoolGroup: configData[13],
          analogHeatGroup: configData[14],
          valveCoolOpenGroup: configData[15],
          valveCoolCloseGroup: configData[16],
          valveHeatOpenGroup: configData[17],
          valveHeatCloseGroup: configData[18],
          windowBypass: configData[19],
          setPointOffset: configData[20],
          // Bytes 21-30: reserved (skip)
          unoccupyPower: configData[31],
          occupyPower: configData[32],
          standbyPower: configData[33],
          unoccupyMode: configData[34],
          occupyMode: configData[35],
          standbyMode: configData[36],
          unoccupyFanSpeed: configData[37],
          occupyFanSpeed: configData[38],
          standbyFanSpeed: configData[39],
          // 2-byte values (little endian)
          unoccupyCoolSetPoint: configData[40] | (configData[41] << 8),
          occupyCoolSetPoint: configData[42] | (configData[43] << 8),
          standbyCoolSetPoint: configData[44] | (configData[45] << 8),
          unoccupyHeatSetPoint: configData[46] | (configData[47] << 8),
          occupyHeatSetPoint: configData[48] | (configData[49] << 8),
          standbyHeatSetPoint: configData[50] | (configData[51] << 8),
          // Bytes 52-63: reserved (skip)
        };
        acConfigs.push(acConfig);
      }
    }
    return acConfigs;
  }

  throw new Error("No response received from local AC config command");
}

async function setLocalACConfig(unitIp, canId, acConfigs) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting local AC config to unit ${unitIp} (CAN ID: ${canId})`);

  // Validate input - should be array of 10 AC configurations
  if (!Array.isArray(acConfigs) || acConfigs.length !== 10) {
    throw new Error("AC configurations must be an array of exactly 10 items");
  }

  // Prepare data: 64 bytes per AC config * 10 = 640 bytes total
  const data = [];
  const AC_CONFIG_SIZE = 64;

  for (let i = 0; i < 10; i++) {
    const config = acConfigs[i] || {};

    // Build 64-byte configuration for this AC
    const configBytes = new Array(AC_CONFIG_SIZE).fill(0);

    // Byte 0: address
    configBytes[0] = config.address || 0;

    // Byte 1: enable/disable
    configBytes[1] = config.enable ? 1 : 0;

    // Byte 2: windowMode (0: Off, 1: Save energy)
    configBytes[2] = config.windowMode || 0;

    // Byte 3: fanType (0: on/off, 1: analog)
    configBytes[3] = config.fanType || 0;

    // Byte 4: tempType (0: thermostat, 1: RCU)
    configBytes[4] = config.tempType || 0;

    // Byte 5: tempUnit (0: C, 1: F)
    configBytes[5] = config.tempUnit || 0;

    // Byte 6: valveContact (0: NO, 1: NC)
    configBytes[6] = config.valveContact || 0;

    // Byte 7: valveType (0: On/Off, 1: analog, 2: on and off)
    configBytes[7] = config.valveType || 0;

    // Byte 8: deadband
    configBytes[8] = config.deadband || 0;

    // Byte 9-19: Group assignments
    configBytes[9] = config.lowFCU_Group || 0;
    configBytes[10] = config.medFCU_Group || 0;
    configBytes[11] = config.highFCU_Group || 0;
    configBytes[12] = config.fanAnalogGroup || 0;
    configBytes[13] = config.analogCoolGroup || 0;
    configBytes[14] = config.analogHeatGroup || 0;
    configBytes[15] = config.valveCoolOpenGroup || 0;
    configBytes[16] = config.valveCoolCloseGroup || 0;
    configBytes[17] = config.valveHeatOpenGroup || 0;
    configBytes[18] = config.valveHeatCloseGroup || 0;
    configBytes[19] = config.windowBypass || 0;

    // Byte 20: setPointOffset
    configBytes[20] = config.setPointOffset || 0;

    // Bytes 21-30: reserved (already filled with 0)

    // Byte 31-39: Power and mode settings
    configBytes[31] = config.unoccupyPower || 0;
    configBytes[32] = config.occupyPower || 0;
    configBytes[33] = config.standbyPower || 0;
    configBytes[34] = config.unoccupyMode || 0;
    configBytes[35] = config.occupyMode || 0;
    configBytes[36] = config.standbyMode || 0;
    configBytes[37] = config.unoccupyFanSpeed || 0;
    configBytes[38] = config.occupyFanSpeed || 0;
    configBytes[39] = config.standbyFanSpeed || 0;

    // Bytes 40-51: Set point values (2 bytes each, little endian)
    const unoccupyCool = config.unoccupyCoolSetPoint || 0;
    configBytes[40] = unoccupyCool & 0xFF;
    configBytes[41] = (unoccupyCool >> 8) & 0xFF;

    const occupyCool = config.occupyCoolSetPoint || 0;
    configBytes[42] = occupyCool & 0xFF;
    configBytes[43] = (occupyCool >> 8) & 0xFF;

    const standbyCool = config.standbyCoolSetPoint || 0;
    configBytes[44] = standbyCool & 0xFF;
    configBytes[45] = (standbyCool >> 8) & 0xFF;

    const unoccupyHeat = config.unoccupyHeatSetPoint || 0;
    configBytes[46] = unoccupyHeat & 0xFF;
    configBytes[47] = (unoccupyHeat >> 8) & 0xFF;

    const occupyHeat = config.occupyHeatSetPoint || 0;
    configBytes[48] = occupyHeat & 0xFF;
    configBytes[49] = (occupyHeat >> 8) & 0xFF;

    const standbyHeat = config.standbyHeatSetPoint || 0;
    configBytes[50] = standbyHeat & 0xFF;
    configBytes[51] = (standbyHeat >> 8) & 0xFF;

    // Bytes 52-63: reserved (already filled with 0)

    // Add this AC config to the data array
    data.push(...configBytes);
  }

  const result = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.SET_LOCAL_AC_CONFIG,
    data
  );

  // Add delay after SET command to allow unit to process
  await new Promise(resolve => setTimeout(resolve, 500));

  return result;
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
  getLocalACConfig,
  setLocalACConfig,
};
