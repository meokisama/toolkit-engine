import { CONSTANTS } from "../constants";

const { UDP_PORT } = CONSTANTS.UNIT.UDP_CONFIG;

const PROTOCOL = {
  GENERAL: {
    CMD1: 1,
    CMD2: {
      SYNC_CLOCK: 9,
      GET_CLOCK: 10,
      GET_RS485_CH1_CONFIG: 13,
      GET_RS485_CH2_CONFIG: 14,
      SET_RS485_CH1_CONFIG: 15,
      SET_RS485_CH2_CONFIG: 16,
      SETUP_SCENE: 19,
      GET_SCENE_INFOR: 20,
      SETUP_SCHEDULE: 21,
      GET_SCHEDULE_INFOR: 22,
      TRIGGER_SCENE: 23,
      SETUP_MULTI_SCENE: 24,
      GET_MULTI_SCENE: 25,
      TRIGGER_MULTI_SCENE: 26,
      SETUP_MULTI_SCENE_SEQ: 27,
      GET_MULTI_SCENE_SEQ: 28,
      TRIGGER_MULTI_SCENE_SEQ: 29,
      CLEAR_SCENE: 30,
      CLEAR_MULTI_SCENE: 31,
      CLEAR_MULTI_SCENE_SEQ: 32,
      CLEAR_SCHEDULE: 33,
    },
  },
  LIGHTING: {
    CMD1: 10,
    CMD2: {
      SET_GROUP_STATE: 62,
      GET_OUTPUT_STATE: 64,
      GET_GROUP_STATE: 65,
    },
  },
  AC: {
    CMD1: 30,
    CMD2: {
      GET_AC_GROUP: 14,
      GET_ROOM_TEMP: 21,
      SET_SETTING_ROOM_TEMP: 22,
      GET_SETTING_ROOM_TEMP: 23,
      SET_FAN_MODE: 24,
      GET_FAN_MODE: 25,
      SET_POWER_MODE: 28,
      GET_POWER_MODE: 29,
      SET_OPERATE_MODE: 30,
      GET_OPERATE_MODE: 31,
      SET_ECO_MODE: 32,
      GET_ECO_MODE: 33,
    },
  },
  CURTAIN: {
    CMD1: 40,
    CMD2: {
      GET_CURTAIN_CONFIG: 0,
      SET_CURTAIN_CONFIG: 1,
      SET_CURTAIN: 2,
      CLEAR_CURTAIN: 4,
    },
  },
  KNX: {
    CMD1: 50,
    CMD2: {
      GET_KNX_OUT_CONFIG: 0,
      SET_KNX_OUT_CONFIG: 1,
      SET_KNX_OUT: 2,
      CLEAR_KNX: 8,
    },
  },
};

// Helper functions for validation
const validators = {
  range: (value, min, max, name) => {
    if (value < min || value > max) {
      throw new Error(`${name} must be between ${min} and ${max}`);
    }
  },
  group: (group) => validators.range(group, 1, 255, "Group number"),
  value: (value) => validators.range(value, 0, 255, "Value"),
  sceneIndex: (index) => validators.range(index, 0, 99, "Scene index"),
  scheduleIndex: (index) => validators.range(index, 0, 31, "Schedule index"),
  multiSceneIndex: (index) =>
    validators.range(index, 0, 39, "Multi-scene index"),
  curtainIndex: (index) => validators.range(index, 0, 31, "Curtain index"),
  knxAddress: (address) => validators.range(address, 0, 511, "KNX address"),
  hour: (hour) => validators.range(hour, 0, 23, "Hour"),
  minute: (minute) => validators.range(minute, 0, 59, "Minute"),
  second: (second) => validators.range(second, 0, 59, "Second"),
  year: (year) => validators.range(year, 0, 99, "Year"),
  month: (month) => validators.range(month, 1, 12, "Month"),
  day: (day) => validators.range(day, 1, 31, "Day"),
  dayOfWeek: (day) => validators.range(day, 0, 6, "Day of week"),
};

// Helper function for response parsing
const parseResponse = {
  success: (response) => {
    if (response?.msg?.length >= 9) {
      const data = response.msg.slice(8);
      return data[0] === 0;
    }
    return false;
  },
  data: (response, minLength = 8) => {
    if (response?.msg?.length >= minLength) {
      return response.msg.slice(8);
    }
    throw new Error("Invalid response data");
  },
  temperature: (data, offset = 1) => {
    return ((data[offset + 1] << 8) | data[offset]) / 10;
  },
};

// Helper function to convert KNX address from a/b/c format to 2-byte hex
// KNX address format: 5 bit area / 3 bit line / 8 bit device = 16 bits total
function convertKnxAddressToHex(knxAddress) {
  if (!knxAddress || typeof knxAddress !== "string") {
    return [0x00, 0x00]; // Return 2 bytes of 0x00 for empty/invalid address
  }

  const parts = knxAddress.split("/");
  if (parts.length !== 3) {
    return [0x00, 0x00]; // Return 2 bytes of 0x00 for invalid format
  }

  try {
    const area = parseInt(parts[0]) & 0x1f; // 5 bits (0-31)
    const line = parseInt(parts[1]) & 0x07; // 3 bits (0-7)
    const device = parseInt(parts[2]) & 0xff; // 8 bits (0-255)

    // Combine into 16-bit value: area(5) + line(3) + device(8)
    const combined = (area << 11) | (line << 8) | device;

    // Return as 2 bytes: low byte, high byte
    return [combined & 0xff, (combined >> 8) & 0xff];
  } catch (error) {
    return [0x00, 0x00]; // Return 2 bytes of 0x00 for conversion error
  }
}

function convertCanIdToInt(canId) {
  if (!canId || typeof canId !== "string") {
    return 0x00000101;
  }

  const parts = canId.split(".");
  if (parts.length !== 4) {
    return 0x00000101;
  }

  try {
    const byte0 = parseInt(parts[0]) & 0xff;
    const byte1 = parseInt(parts[1]) & 0xff;
    const byte2 = parseInt(parts[2]) & 0xff;
    const byte3 = parseInt(parts[3]) & 0xff;

    return (byte0 << 24) | (byte1 << 16) | (byte2 << 8) | byte3;
  } catch (error) {
    return 0x00000101;
  }
}

// Error codes mapping based on RCU protocol
const ERROR_CODES = {
  0: "SUCCESS",
  1: "ERR_CRC",
  2: "NO_SUPPORT",
  3: "LIMIT_FRAME_LEN",
  4: "LIMIT_INPUT_NUMBER",
  5: "LIMIT_OUTPUT_NUMBER",
  6: "LIMIT_GROUP_PER_INPUT",
  7: "ABSENT_UNIT",
  8: "SLAVE_UNIT",
  9: "LOWER_FIRMWARE",
  10: "LICENSE_FAIL",
  11: "HEX_FILE_CRC",
  254: "TRANSFERED_FAILED",
  255: "OTHER",
};

function processResponse(
  msg,
  expectedCmd1,
  expectedCmd2,
  skipStatusCheck = false
) {
  if (msg.length < 10) {
    throw new Error("Response too short (minimum 10 bytes required)");
  }

  console.log("Response packet:", {
    length: msg.length,
    hex: Array.from(msg)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" "),
  });

  // Parse response structure: <ID Address><length><cmd1><cmd2><data><crc>
  const idAddress = (msg[3] << 24) | (msg[2] << 16) | (msg[1] << 8) | msg[0];
  const length = msg[4] | (msg[5] << 8);
  const cmd1 = msg[6];
  const cmd2 = msg[7];
  const dataStart = 8;
  const dataLength = length - 4; // length includes cmd1, cmd2, and crc (4 bytes total)

  // Check if this is an error response
  const isErrorResponse = cmd1 & 0x80 || cmd2 & 0x80;

  if (isErrorResponse) {
    // Error response: either cmd1 or cmd2 has 0x80 added
    const originalCmd1 = cmd1 & 0x7f;
    const originalCmd2 = cmd2 & 0x7f;
    const errorCode = msg[dataStart]; // First byte of data contains error code
    const errorMessage =
      ERROR_CODES[errorCode] || `Unknown error (${errorCode})`;

    console.error("RCU Error Response:", {
      receivedCmd1: `0x${cmd1.toString(16)}`,
      receivedCmd2: `0x${cmd2.toString(16)}`,
      originalCmd1: `0x${originalCmd1.toString(16)}`,
      originalCmd2: `0x${originalCmd2.toString(16)}`,
      expectedCmd1: `0x${expectedCmd1.toString(16)}`,
      expectedCmd2: `0x${expectedCmd2.toString(16)}`,
      errorCode,
      errorMessage,
    });

    throw new Error(`RCU Error: ${errorMessage} (Code: ${errorCode})`);
  }

  // Check if cmd1 and cmd2 match expected values (only for success responses)
  if (cmd1 !== expectedCmd1) {
    throw new Error(
      `Unexpected cmd1 in response: got 0x${cmd1.toString(
        16
      )}, expected 0x${expectedCmd1.toString(16)}`
    );
  }

  if (cmd2 !== expectedCmd2) {
    throw new Error(
      `Unexpected cmd2 in response: got 0x${cmd2.toString(
        16
      )}, expected 0x${expectedCmd2.toString(16)}`
    );
  }

  // For setup commands, check if data field contains success status (0x00)
  // Skip status check for GET_SCENE_INFOR and similar data retrieval commands
  if (!skipStatusCheck && dataLength >= 1) {
    const statusByte = msg[dataStart];

    if (statusByte !== 0x00) {
      const errorMessage =
        ERROR_CODES[statusByte] || `Unknown error (${statusByte})`;
      throw new Error(`Command failed: ${errorMessage} (Code: ${statusByte})`);
    }
  }

  return {
    idAddress,
    length,
    cmd1,
    cmd2,
    data: msg.slice(dataStart, dataStart + dataLength - 2), // Exclude CRC
    success: true,
  };
}

function calculateCRC(data) {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc += data[i];
  }
  return crc & 0xffff;
}

async function sendCommand(
  unitIp,
  port,
  idAddress,
  cmd1,
  cmd2,
  data = [],
  skipStatusCheck = false
) {
  return new Promise((resolve, reject) => {
    const dgram = require("dgram");
    const client = dgram.createSocket("udp4");

    const timeout = setTimeout(() => {
      client.close();
      reject(
        new Error(
          `Command timeout after 5s for ${unitIp}:${port} cmd1=0x${cmd1.toString(
            16
          )} cmd2=0x${cmd2.toString(16)}`
        )
      );
    }, 5000);

    client.on("message", (msg, rinfo) => {
      clearTimeout(timeout);
      console.log(`Received from ${rinfo.address}:${rinfo.port}`);

      try {
        const result = processResponse(msg, cmd1, cmd2, skipStatusCheck);
        client.close();
        resolve({ msg, rinfo, result });
      } catch (error) {
        client.close();
        reject(error);
      }
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      reject(err);
    });

    try {
      const idBuffer = Buffer.alloc(4);
      idBuffer.writeUInt32LE(idAddress, 0);

      const len = 2 + 2 + data.length;
      const packetArray = [];

      packetArray.push(len & 0xff);
      packetArray.push((len >> 8) & 0xff);
      packetArray.push(cmd1);
      packetArray.push(cmd2);

      for (let i = 0; i < data.length; i++) {
        packetArray.push(data[i]);
      }

      const crc = calculateCRC(packetArray);
      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const packetBuffer = Buffer.from(packetArray);
      const buffer = Buffer.concat([idBuffer, packetBuffer]);

      console.log(
        `Send to ${unitIp}:${port} - CMD1:${cmd1} CMD2:${cmd2} Data:[${data.join(
          ","
        )}]`
      );
      console.log(
        "Packet:",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      client.send(buffer, 0, buffer.length, port, unitIp, (err) => {
        if (err) {
          console.error("Send error:", err);
          clearTimeout(timeout);
          client.close();
          reject(err);
        }
      });
    } catch (error) {
      console.error("Command preparation error:", error);
      clearTimeout(timeout);
      client.close();
      reject(error);
    }
  });
}

// Generic lighting command helper
async function sendLightingCommand(unitIp, canId, cmd2, data) {
  const idAddress = convertCanIdToInt(canId);
  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    cmd2,
    data
  );
}

async function setGroupState(unitIp, canId, group, value) {
  validators.group(group);
  validators.value(value);
  return sendLightingCommand(
    unitIp,
    canId,
    PROTOCOL.LIGHTING.CMD2.SET_GROUP_STATE,
    [group, value]
  );
}

async function setMultipleGroupStates(unitIp, canId, groupSettings) {
  if (!Array.isArray(groupSettings) || groupSettings.length === 0) {
    throw new Error("Invalid input. Provide an array of [group, value] pairs");
  }

  const data = [];
  for (const pair of groupSettings) {
    if (Array.isArray(pair) && pair.length === 2) {
      const [group, value] = pair;
      if (group >= 1 && group <= 255 && value >= 0 && value <= 255) {
        data.push(group, value);
      }
    }
  }

  if (data.length === 0) {
    throw new Error("No valid groups to set");
  }

  return sendLightingCommand(
    unitIp,
    canId,
    PROTOCOL.LIGHTING.CMD2.SET_GROUP_STATE,
    data
  );
}

async function getAllGroupStates(unitIp, canId) {
  return sendLightingCommand(
    unitIp,
    canId,
    PROTOCOL.LIGHTING.CMD2.GET_GROUP_STATE,
    []
  );
}

async function getAllOutputStates(unitIp, canId) {
  return sendLightingCommand(
    unitIp,
    canId,
    PROTOCOL.LIGHTING.CMD2.GET_OUTPUT_STATE,
    []
  );
}

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

// Scene Setup function
async function setupScene(unitIp, canId, sceneConfig) {
  const { sceneIndex, sceneName, sceneAddress, sceneItems } = sceneConfig;

  // Validations
  validators.sceneIndex(sceneIndex);

  if (!sceneName || sceneName.length > 15) {
    throw new Error("Scene name must be provided and not exceed 15 characters");
  }

  if (!sceneAddress) {
    throw new Error("Scene address must be provided");
  }

  if (!Array.isArray(sceneItems)) {
    throw new Error("Scene items must be an array");
  }

  if (sceneItems.length > 85) {
    throw new Error("Too many scene items. Maximum is 85 items.");
  }

  const idAddress = convertCanIdToInt(canId);
  const data = [sceneIndex];

  // Scene name (15 bytes, null padded)
  const nameBytes = Buffer.from(sceneName, "utf8");
  for (let i = 0; i < 15; i++) {
    data.push(i < nameBytes.length ? nameBytes[i] : 0x00);
  }

  // Scene address and amount
  data.push(parseInt(sceneAddress) || 0, sceneItems.length);

  // 7 empty bytes
  data.push(...Array(7).fill(0x00));

  // Scene items (3 bytes per item)
  for (const item of sceneItems) {
    data.push(item.object_value || 0);
    data.push(parseInt(item.item_address) || 0);

    let itemValue = parseFloat(item.item_value) || 0;
    if (item.object_value === 1) {
      itemValue = Math.round((itemValue / 100) * 255); // LIGHTING
    } else if (item.object_value === 6) {
      itemValue = parseInt(itemValue) || 0; // AC_TEMPERATURE
    } else {
      itemValue = parseInt(itemValue) || 0; // Other types
    }
    data.push(itemValue);
  }

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SCENE,
    data
  );
}

// Get Scene Information function
async function getSceneInformation(unitIp, canId, sceneIndex) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Data is just the scene index (1 byte)
  const data = [sceneIndex];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCENE_INFOR,
    data,
    true // Skip status check for GET_SCENE_INFOR
  );

  if (response && response.msg && response.msg.length >= 10) {
    const data = response.msg.slice(8); // Skip header (4 bytes ID + 2 bytes length + 2 bytes cmd)

    // Parse scene information
    // Data structure: scene index, 15-byte name, address, item count, 7 empty bytes, then 3-byte items
    const sceneIndex = data[0];
    const sceneName = String.fromCharCode(...data.slice(1, 16))
      .replace(/\0/g, "")
      .trim();
    const sceneAddress = data[16];
    const itemCount = data[17];

    const items = [];
    const itemsStartIndex = 25; // Skip scene index(1) + name(15) + address(1) + count(1) + empty(7)

    for (
      let i = 0;
      i < itemCount && itemsStartIndex + i * 3 + 2 < data.length;
      i++
    ) {
      const itemIndex = itemsStartIndex + i * 3;
      items.push({
        objectValue: data[itemIndex],
        itemAddress: data[itemIndex + 1],
        itemValue: data[itemIndex + 2],
      });
    }

    return {
      sceneIndex,
      sceneName,
      sceneAddress,
      itemCount,
      items,
    };
  }

  throw new Error("Invalid response from get scene information command");
}

// Send command and collect multiple responses until success packet
async function sendCommandMultipleResponses(
  unitIp,
  port,
  idAddress,
  cmd1,
  cmd2,
  data = [],
  timeoutMs = 15000
) {
  return new Promise((resolve, reject) => {
    const dgram = require("dgram");
    const client = dgram.createSocket("udp4");
    const responses = [];
    let responseCount = 0;
    let successPacketReceived = false;

    const timeout = setTimeout(() => {
      client.close();
      console.log(
        `Timeout: collected ${responseCount} responses, success packet: ${successPacketReceived}`
      );
      resolve({ responses, successPacketReceived });
    }, timeoutMs);

    client.on("message", (msg, rinfo) => {
      console.log(`Response ${responseCount + 1} from ${rinfo.address}`);
      console.log(
        "Raw packet:",
        Array.from(msg)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
          .toUpperCase()
      );

      try {
        const result = processResponse(msg, cmd1, cmd2, true); // Skip status check

        // Check if this is a success packet
        // Success packet format: <ID><length><cmd1><cmd2><0x00><crc>
        // Length should be 5 (cmd1 + cmd2 + data + crc = 1+1+1+2 = 5)
        const packetLength = msg[4] | (msg[5] << 8);
        const dataSection = msg.slice(8, 8 + packetLength - 4); // Exclude cmd1, cmd2, and CRC
        const isSuccessPacket =
          packetLength === 5 &&
          dataSection.length === 1 &&
          dataSection[0] === 0x00;

        if (isSuccessPacket) {
          console.log(
            "✅ Success packet received - all data transmitted successfully"
          );
          successPacketReceived = true;
          clearTimeout(timeout);
          client.close();
          resolve({ responses, successPacketReceived });
        } else {
          // This is a data packet, add to responses
          responses.push({ msg, rinfo, result });
          responseCount++;
          console.log(`📦 Data packet ${responseCount} collected`);
        }
      } catch (error) {
        console.error(`Error processing response ${responseCount + 1}:`, error);
        console.error(
          "Packet data:",
          Array.from(msg)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ")
        );
        // Continue collecting other responses even if one fails
      }
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      reject(err);
    });

    try {
      const idBuffer = Buffer.alloc(4);
      idBuffer.writeUInt32LE(idAddress, 0);

      const len = 2 + 2 + data.length;
      const packetArray = [];

      packetArray.push(len & 0xff);
      packetArray.push((len >> 8) & 0xff);
      packetArray.push(cmd1);
      packetArray.push(cmd2);

      for (let i = 0; i < data.length; i++) {
        packetArray.push(data[i]);
      }

      const crc = calculateCRC(packetArray);
      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const packetBuffer = Buffer.from(packetArray);
      const buffer = Buffer.concat([idBuffer, packetBuffer]);

      console.log(
        `Send to ${unitIp}:${port} listening for success packet - CMD1:${cmd1} CMD2:${cmd2}`
      );
      console.log(
        "Packet:",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      client.send(buffer, 0, buffer.length, port, unitIp, (err) => {
        if (err) {
          console.error("Send error:", err);
          clearTimeout(timeout);
          client.close();
          reject(err);
        }
      });
    } catch (error) {
      console.error("Command preparation error:", error);
      clearTimeout(timeout);
      client.close();
      reject(error);
    }
  });
}

// Get All Scenes Information function
async function getAllScenesInformation(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for loading all scenes
  const data = [];

  const result = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCENE_INFOR,
    data,
    15000 // 15 second timeout
  );

  const { responses, successPacketReceived } = result;

  if (responses.length > 0) {
    const scenes = [];

    // Process each response (each response contains one scene)
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];

      if (response.result?.success && response.msg && response.msg.length > 0) {
        try {
          // Parse scene information from this response
          // Data structure: scene index, 15-byte name, address, item count, 7 empty bytes, then 3-byte items
          const data = response.msg.slice(8); // Skip header

          if (data.length >= 18) {
            // Minimum data for scene info
            const sceneIndex = data[0];
            const sceneName = String.fromCharCode(...data.slice(1, 16))
              .replace(/\0/g, "")
              .trim();
            const sceneAddress = data[16];
            const itemCount = data[17];

            // Only add scenes that have actual data (non-empty name or items)
            if (sceneName.length > 0 || itemCount > 0) {
              scenes.push({
                index: sceneIndex,
                name: sceneName || `Scene ${sceneIndex}`,
                address: sceneAddress,
                itemCount: itemCount,
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing scene response ${i + 1}:`, error);
        }
      }
    }

    return {
      result: { success: successPacketReceived },
      scenes: scenes,
      successPacketReceived: successPacketReceived,
      totalResponses: responses.length,
    };
  }

  throw new Error(
    "No valid responses received from get all scenes information command"
  );
}

// Trigger Scene function
async function triggerScene(unitIp, canId, sceneAddress) {
  const idAddress = convertCanIdToInt(canId);
  const triggerData = parseInt(sceneAddress);

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.TRIGGER_SCENE,
    [triggerData]
  );
}

// Trigger KNX function
async function triggerKnx(unitIp, canId, knxAddress) {
  const idAddress = convertCanIdToInt(canId);
  const triggerData = parseInt(knxAddress);

  console.log("Triggering KNX:", {
    unitIp,
    canId,
    knxAddress,
    triggerData,
  });

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.KNX.CMD1,
    PROTOCOL.KNX.CMD2.SET_KNX_OUT,
    [triggerData]
  );
}

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

// Setup Schedule function
async function setupSchedule(unitIp, canId, scheduleConfig) {
  const { scheduleIndex, enabled, weekDays, hour, minute, sceneAddresses } =
    scheduleConfig;

  // Validations
  validators.scheduleIndex(scheduleIndex);
  validators.hour(hour);
  validators.minute(minute);

  if (sceneAddresses.length > 32) {
    throw new Error("Maximum 32 scenes allowed per schedule");
  }

  const idAddress = convertCanIdToInt(canId);
  const data = [
    scheduleIndex,
    enabled ? 1 : 0,
    ...Array(10).fill(0x00), // Reserve 10 bytes
    ...weekDays.map((day) => (day ? 1 : 0)), // Week days (7 bytes)
    hour,
    minute,
    0, // Second (always 0)
    sceneAddresses.length,
    ...sceneAddresses.map((addr) => parseInt(addr) || 0),
  ];

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SCHEDULE,
    data
  );
}

// Get Multi-Scene Information function
async function getMultiSceneInformation(unitIp, canId, multiSceneIndex = null) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Prepare data parameter
  const data = [];
  if (multiSceneIndex !== null) {
    validators.multiSceneIndex(multiSceneIndex);
    data.push(parseInt(multiSceneIndex));
  }
  // If multiSceneIndex is null, send empty data to get all multi-scenes

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_MULTI_SCENE,
    data,
    true // Skip status check for GET_MULTI_SCENE
  );

  if (response && response.msg) {
    const data = response.msg.slice(8); // Skip header

    if (data.length < 24) {
      throw new Error(
        `Insufficient multi-scene data: ${data.length} bytes (expected at least 24)`
      );
    }

    // Parse multi-scene data structure:
    // 1 byte index
    // 15 bytes name
    // 1 byte address
    // 1 byte type
    // 5 bytes reserved
    // 1 byte amount (number of scene addresses)
    // N bytes scene addresses (1 byte each)

    const index = data[0];
    const nameBytes = data.slice(1, 16);
    const address = data[16];
    const type = data[17];
    // Skip 5 reserved bytes (18-22)
    const amount = data[23];

    // Extract scene addresses
    const sceneAddresses = [];
    for (let i = 0; i < amount && i < data.length - 24; i++) {
      sceneAddresses.push(data[24 + i]);
    }

    // Convert name bytes to string (remove null terminators)
    let multiSceneName = "";
    for (let i = 0; i < nameBytes.length; i++) {
      if (nameBytes[i] === 0) break;
      multiSceneName += String.fromCharCode(nameBytes[i]);
    }

    return {
      multiSceneIndex: index,
      multiSceneName: multiSceneName || `Multi-Scene ${index}`,
      multiSceneAddress: address,
      multiSceneType: type,
      sceneCount: amount,
      sceneAddresses: sceneAddresses,
    };
  }

  throw new Error(
    "No response received from get multi-scene information command"
  );
}

// Get All Multi-Scenes Information function
async function getAllMultiScenesInformation(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for loading all multi-scenes
  const data = [];

  const result = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_MULTI_SCENE,
    data,
    15000 // 15 second timeout
  );

  if (result && result.responses && result.responses.length > 0) {
    const multiScenes = [];
    let successPacketReceived = false;

    for (let i = 0; i < result.responses.length; i++) {
      const response = result.responses[i];
      if (response && response.msg) {
        try {
          const msg = response.msg;

          // Check for success packet (indicates end of data)
          if (msg.length >= 10) {
            // Success packet format: <ID><length><cmd1><cmd2><0x00><crc>
            const packetLength = msg[4] | (msg[5] << 8);
            const dataSection = msg.slice(8, 8 + packetLength - 4);
            const isSuccessPacket =
              packetLength === 5 &&
              dataSection.length === 1 &&
              dataSection[0] === 0x00;

            if (isSuccessPacket) {
              successPacketReceived = true;
              console.log(
                `Success packet received for multi-scene response ${i + 1}`
              );
              continue;
            }
          }

          // Parse multi-scene data
          const data = msg.slice(8);
          if (data.length >= 24) {
            const index = data[0];
            const nameBytes = data.slice(1, 16);
            const address = data[16];
            const type = data[17];
            const amount = data[23];

            // Extract scene addresses
            const sceneAddresses = [];
            for (let j = 0; j < amount && j < data.length - 24; j++) {
              sceneAddresses.push(data[24 + j]);
            }

            // Convert name bytes to string
            let multiSceneName = "";
            for (let j = 0; j < nameBytes.length; j++) {
              if (nameBytes[j] === 0) break;
              multiSceneName += String.fromCharCode(nameBytes[j]);
            }

            multiScenes.push({
              multiSceneIndex: index,
              multiSceneName: multiSceneName || `Multi-Scene ${index}`,
              multiSceneAddress: address,
              multiSceneType: type,
              sceneCount: amount,
              sceneAddresses: sceneAddresses,
            });
          }
        } catch (error) {
          console.error(`Error parsing multi-scene response ${i + 1}:`, error);
        }
      }
    }

    return {
      result: { success: successPacketReceived },
      multiScenes: multiScenes,
      successPacketReceived: successPacketReceived,
      totalResponses: result.responses.length,
    };
  }

  throw new Error(
    "No valid responses received from get all multi-scenes information command"
  );
}

// Trigger Multi-Scene function
async function triggerMultiScene(unitIp, canId, multiSceneAddress) {
  const idAddress = convertCanIdToInt(canId);
  const triggerData = parseInt(multiSceneAddress);

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.TRIGGER_MULTI_SCENE,
    [triggerData]
  );
}

// Setup Multi-Scene function
async function setupMultiScene(unitIp, canId, multiSceneConfig) {
  const {
    multiSceneIndex,
    multiSceneName,
    multiSceneAddress,
    multiSceneType,
    sceneAddresses,
  } = multiSceneConfig;

  // Validations
  if (multiSceneIndex < 0 || multiSceneIndex > 39) {
    throw new Error("Multi-scene index must be between 0 and 39");
  }

  if (!multiSceneName || multiSceneName.length > 15) {
    throw new Error(
      "Multi-scene name must be provided and not exceed 15 characters"
    );
  }

  if (!multiSceneAddress) {
    throw new Error("Multi-scene address must be provided");
  }

  if (!Array.isArray(sceneAddresses)) {
    throw new Error("Scene addresses must be an array");
  }

  if (sceneAddresses.length > 20) {
    throw new Error("Maximum 20 scene addresses allowed per multi-scene");
  }

  const idAddress = convertCanIdToInt(canId);
  const data = [];

  // 1 byte index
  data.push(multiSceneIndex);

  // 15 byte name (pad with 0x00 if shorter)
  const nameBytes = Array(15).fill(0x00);
  for (let i = 0; i < Math.min(multiSceneName.length, 15); i++) {
    nameBytes[i] = multiSceneName.charCodeAt(i);
  }
  data.push(...nameBytes);

  // 1 byte address
  data.push(parseInt(multiSceneAddress) || 0);

  // 1 byte type
  data.push(parseInt(multiSceneType) || 0);

  // 5 byte reserved (0x00)
  data.push(...Array(5).fill(0x00));

  // 1 byte amount (total number of scene addresses)
  data.push(sceneAddresses.length);

  // Scene addresses (1 byte each)
  for (const address of sceneAddresses) {
    data.push(parseInt(address) || 0);
  }

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_MULTI_SCENE,
    data
  );
}

// Get Schedule Information function
async function getScheduleInformation(unitIp, canId, scheduleIndex) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Validate schedule index
  if (scheduleIndex < 0 || scheduleIndex > 31) {
    throw new Error("Schedule index must be between 0 and 31");
  }

  // Data is the schedule index (0-31 for protocol)
  const data = [scheduleIndex];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCHEDULE_INFOR,
    data,
    true // Skip status check for GET_SCHEDULE_INFOR
  );

  if (response && response.msg && response.msg.length >= 8) {
    const data = response.msg.slice(8); // Skip header

    // Debug logging
    console.log(
      "Schedule response raw data:",
      Array.from(data)
        .map((b) => "0x" + b.toString(16).padStart(2, "0"))
        .join(" ")
    );
    console.log("Schedule response data length:", data.length);

    if (data.length >= 23) {
      // Minimum data length for schedule
      const scheduleInfo = {
        scheduleIndex: data[0], // Keep 0-31 range
        enabled: data[1] === 1,
        // Skip 10 reserved bytes (positions 2-11)
        weekDays: [
          data[12] === 1, // Monday
          data[13] === 1, // Tuesday
          data[14] === 1, // Wednesday
          data[15] === 1, // Thursday
          data[16] === 1, // Friday
          data[17] === 1, // Saturday
          data[18] === 1, // Sunday
        ],
        hour: data[19],
        minute: data[20],
        second: data[21],
        sceneAmount: data[22],
        sceneAddresses: [],
      };

      // Extract scene addresses
      for (let i = 0; i < scheduleInfo.sceneAmount && i < 32; i++) {
        if (data.length > 23 + i) {
          scheduleInfo.sceneAddresses.push(data[23 + i]);
        }
      }

      console.log("Parsed schedule info:", scheduleInfo);

      return {
        success: true,
        data: scheduleInfo,
        rawData: Array.from(data),
      };
    }
  }

  throw new Error(
    "No valid response received from get schedule information command"
  );
}

// Get All Schedules Information function
async function getAllSchedulesInformation(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for loading all schedules
  const data = [];

  const result = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCHEDULE_INFOR,
    data,
    15000 // 15 second timeout
  );

  const { responses, successPacketReceived } = result;
  const schedules = [];

  for (const response of responses) {
    if (response && response.msg && response.msg.length >= 8) {
      const data = response.msg.slice(8); // Skip header

      // Debug logging for each schedule response
      console.log(
        "All schedules response raw data:",
        Array.from(data)
          .map((b) => "0x" + b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      if (data.length >= 23) {
        // Minimum data length for schedule
        const scheduleInfo = {
          scheduleIndex: data[0], // Keep 0-31 range
          enabled: data[1] === 1,
          // Skip 10 reserved bytes (positions 2-11)
          weekDays: [
            data[12] === 1, // Monday
            data[13] === 1, // Tuesday
            data[14] === 1, // Wednesday
            data[15] === 1, // Thursday
            data[16] === 1, // Friday
            data[17] === 1, // Saturday
            data[18] === 1, // Sunday
          ],
          hour: data[19],
          minute: data[20],
          second: data[21],
          sceneAmount: data[22],
          sceneAddresses: [],
        };

        // Extract scene addresses
        for (let i = 0; i < scheduleInfo.sceneAmount && i < 32; i++) {
          if (data.length > 23 + i) {
            scheduleInfo.sceneAddresses.push(data[23 + i]);
          }
        }

        console.log("Parsed schedule info (all schedules):", scheduleInfo);
        schedules.push(scheduleInfo);
      }
    }
  }

  if (schedules.length > 0 || successPacketReceived) {
    // Sort schedules by index to ensure proper order
    schedules.sort((a, b) => a.scheduleIndex - b.scheduleIndex);

    return {
      success: successPacketReceived,
      data: schedules,
      totalSchedules: schedules.length,
      successPacketReceived: successPacketReceived,
      totalResponses: responses.length,
    };
  }

  throw new Error(
    "No valid responses received from get all schedules information command"
  );
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

// Clock Control Functions

// Sync Clock function - sets the unit's clock
async function syncClock(unitIp, canId, clockData) {
  if (!clockData) {
    throw new Error("Clock data is required");
  }

  const { year, month, day, dayOfWeek, hour, minute, second } = clockData;

  // Validate all clock data
  validators.year(year);
  validators.month(month);
  validators.day(day);
  validators.dayOfWeek(dayOfWeek);
  validators.hour(hour);
  validators.minute(minute);
  validators.second(second);

  const idAddress = convertCanIdToInt(canId);
  const data = [year, month, day, dayOfWeek, hour, minute, second];

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SYNC_CLOCK,
    data
  );
}

// Get Clock function - retrieves the unit's current clock
async function getClock(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for getting clock
  const data = [];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_CLOCK,
    data,
    true // Skip status check for GET_CLOCK
  );

  if (response && response.msg && response.msg.length >= 15) {
    // Expected response: header (8 bytes) + clock data (7 bytes)
    const clockData = response.msg.slice(8); // Skip header

    if (clockData.length >= 7) {
      return {
        year: clockData[0], // 0-99 (2000-2099)
        month: clockData[1], // 1-12
        day: clockData[2], // 1-31
        dayOfWeek: clockData[3], // 0-6 (Monday-Sunday)
        hour: clockData[4], // 0-23
        minute: clockData[5], // 0-59
        second: clockData[6], // 0-59
        // Convert to full year for display
        fullYear: 2000 + clockData[0],
        // Convert day of week to string
        dayOfWeekString:
          [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ][clockData[3]] || "Unknown",
      };
    }
  }

  throw new Error("Invalid response from get clock command");
}

// Get Curtain Configuration function
async function getCurtainConfig(unitIp, canId, curtainIndex = null) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Data is curtain index (1 byte) if specified, empty for all curtains
  let data = [];
  if (curtainIndex !== null) {
    data = [curtainIndex & 0xff];
  }

  console.log("Getting curtain config:", {
    unitIp,
    canId,
    curtainIndex,
    dataLength: data.length,
  });

  if (curtainIndex !== null) {
    // Get single curtain configuration
    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.CURTAIN.CMD1,
      PROTOCOL.CURTAIN.CMD2.GET_CURTAIN_CONFIG,
      data,
      true // Skip status check for GET commands
    );

    if (response && response.msg && response.msg.length >= 9) {
      const responseData = response.msg.slice(8); // Skip header
      console.log(
        "Single curtain response data:",
        Array.from(responseData)
          .map((b) => "0x" + b.toString(16).padStart(2, "0"))
          .join(" ")
      );
      const result = parseCurtainConfigResponse(responseData);
      console.log("Parsed single curtain config:", result);
      return result;
    }

    throw new Error("Failed to get curtain configuration");
  } else {
    // Get all curtain configurations
    const result = await sendCommandMultipleResponses(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.CURTAIN.CMD1,
      PROTOCOL.CURTAIN.CMD2.GET_CURTAIN_CONFIG,
      data,
      15000 // 15 second timeout
    );

    console.log("Get all curtains result:", {
      hasResult: !!result,
      hasResponses: !!(result && result.responses),
      responseCount: result?.responses?.length || 0,
      successPacketReceived: result?.successPacketReceived,
    });

    if (result && result.responses && result.responses.length > 0) {
      const curtains = [];

      console.log(`Processing ${result.responses.length} curtain responses`);

      for (let i = 0; i < result.responses.length; i++) {
        const response = result.responses[i];
        try {
          if (response && response.msg && response.msg.length >= 9) {
            const responseData = response.msg.slice(8); // Skip header
            console.log(
              `Curtain response ${i + 1} data:`,
              Array.from(responseData)
                .map((b) => "0x" + b.toString(16).padStart(2, "0"))
                .join(" ")
            );
            const curtainConfig = parseCurtainConfigResponse(responseData);
            if (curtainConfig) {
              console.log(`Parsed curtain config ${i + 1}:`, curtainConfig);
              curtains.push(curtainConfig);
            } else {
              console.log(`Failed to parse curtain config ${i + 1}`);
            }
          } else {
            console.log(
              `Invalid response ${i + 1}:`,
              response ? `msg length: ${response.msg?.length}` : "null response"
            );
          }
        } catch (error) {
          console.error(`Error parsing curtain response ${i + 1}:`, error);
        }
      }

      console.log(`Total curtains parsed: ${curtains.length}`);
      return {
        result: { success: result.successPacketReceived },
        curtains: curtains,
        successPacketReceived: result.successPacketReceived,
        totalResponses: result.responses.length,
      };
    }

    throw new Error(
      "No valid responses received from get curtain configuration command"
    );
  }
}

// Helper function to parse curtain configuration response
function parseCurtainConfigResponse(data) {
  if (!data || data.length < 14) {
    console.warn("Invalid curtain config response data length:", data?.length);
    return null;
  }

  try {
    const index = data[0];
    const address = data[1];
    const curtainType = data[2];
    const pausePeriod = data[3];
    const transitionPeriod = data[4] | (data[5] << 8); // Low byte + high byte
    // Skip 6 reserved bytes (data[6] to data[11]) - same as SET packet structure
    const openGroup = data[12];
    const closeGroup = data[13];
    const stopGroup = data[14];

    return {
      index,
      address,
      curtainType,
      pausePeriod,
      transitionPeriod,
      openGroup,
      closeGroup,
      stopGroup,
    };
  } catch (error) {
    console.error("Error parsing curtain config response:", error);
    return null;
  }
}

// Set Curtain function (control curtain - stop, open, close)
async function setCurtain(unitIp, canId, curtainAddress, value) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Validate curtain value (0=Stop, 1=Open, 2=Close)
  if (value < 0 || value > 2) {
    throw new Error("Curtain value must be 0 (Stop), 1 (Open), or 2 (Close)");
  }

  // Data is curtain address (1 byte) + value (1 byte)
  const data = [curtainAddress & 0xff, value & 0xff];

  console.log("Setting curtain:", {
    unitIp,
    canId,
    curtainAddress,
    value,
    valueLabel: ["Stop", "Open", "Close"][value],
  });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.CURTAIN.CMD1,
    PROTOCOL.CURTAIN.CMD2.SET_CURTAIN,
    data
  );

  if (response && response.msg && response.msg.length >= 9) {
    const responseData = response.msg.slice(8); // Skip header
    return responseData[0] === 0; // 0 means success
  }

  throw new Error("Failed to set curtain");
}

// Set Curtain Configuration function
async function setCurtainConfig(unitIp, canId, curtainConfig) {
  const {
    index,
    address,
    curtainType,
    pausePeriod,
    transitionPeriod,
    openGroup,
    closeGroup,
    stopGroup,
  } = curtainConfig;

  const idAddress = convertCanIdToInt(canId);
  const transitionLow = transitionPeriod & 0xff;
  const transitionHigh = (transitionPeriod >> 8) & 0xff;

  const data = [
    index & 0xff,
    address & 0xff,
    curtainType & 0xff,
    pausePeriod & 0xff,
    transitionLow,
    transitionHigh,
    ...Array(6).fill(0x00), // Reserve 6 bytes
    openGroup & 0xff,
    closeGroup & 0xff,
    stopGroup & 0xff,
  ];

  console.log("Sending curtain config:", {
    unitIp,
    canId,
    ...curtainConfig,
    dataLength: data.length,
  });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.CURTAIN.CMD1,
    PROTOCOL.CURTAIN.CMD2.SET_CURTAIN_CONFIG,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to set curtain configuration");
  }

  return true;
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

// KNX Functions

// Set KNX Configuration function
async function setKnxConfig(unitIp, canId, knxConfig) {
  const {
    address,
    type,
    factor,
    feedback,
    rcuGroup,
    knxSwitchGroup,
    knxDimmingGroup,
    knxValueGroup,
  } = knxConfig;

  // Validations
  validators.knxAddress(address);

  if (type < 0 || type > 11) {
    throw new Error("KNX type must be between 0 and 11");
  }

  if (factor < 1) {
    throw new Error("Factor must be greater than or equal to 1");
  }

  if (feedback < 0 || feedback > 2) {
    throw new Error("KNX feedback must be between 0 and 2");
  }

  if (rcuGroup < 1 || rcuGroup > 255) {
    throw new Error("RCU group must be between 1 and 255");
  }

  const idAddress = convertCanIdToInt(canId);

  // Convert KNX addresses from a/b/c format to 2-byte hex
  const switchGroupBytes = convertKnxAddressToHex(knxSwitchGroup);
  const dimmingGroupBytes = convertKnxAddressToHex(knxDimmingGroup);
  const valueGroupBytes = convertKnxAddressToHex(knxValueGroup);

  // Build data packet according to specification:
  // KNX Address: 1byte
  // Type: 1byte
  // Factor: 1byte
  // FeedBack: 1byte
  // 1byte memValueFlag = 0x00
  // Reserve: 1byte 0x00
  // rcu_group_value: 1byte
  // 2 byte KNX switch group, 2 byte KNX dimming group, 2 byte KNX value group
  const data = [
    address & 0xff, // KNX Address (1 byte)
    type & 0xff, // Type (1 byte)
    factor & 0xff, // Factor (1 byte)
    feedback & 0xff, // FeedBack (1 byte)
    0x00, // memValueFlag (1 byte, always 0x00)
    0x00, // Reserve (1 byte, always 0x00)
    rcuGroup & 0xff, // rcu_group_value (1 byte)
    switchGroupBytes[0], // KNX switch group low byte
    switchGroupBytes[1], // KNX switch group high byte
    dimmingGroupBytes[0], // KNX dimming group low byte
    dimmingGroupBytes[1], // KNX dimming group high byte
    valueGroupBytes[0], // KNX value group low byte
    valueGroupBytes[1], // KNX value group high byte
  ];

  console.log("Sending KNX config:", {
    unitIp,
    canId,
    ...knxConfig,
    dataLength: data.length,
    switchGroupHex: `0x${switchGroupBytes[1]
      .toString(16)
      .padStart(2, "0")}${switchGroupBytes[0].toString(16).padStart(2, "0")}`,
    dimmingGroupHex: `0x${dimmingGroupBytes[1]
      .toString(16)
      .padStart(2, "0")}${dimmingGroupBytes[0].toString(16).padStart(2, "0")}`,
    valueGroupHex: `0x${valueGroupBytes[1]
      .toString(16)
      .padStart(2, "0")}${valueGroupBytes[0].toString(16).padStart(2, "0")}`,
  });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.KNX.CMD1,
    PROTOCOL.KNX.CMD2.SET_KNX_OUT_CONFIG,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to set KNX configuration");
  }

  return true;
}

// Get KNX Configuration function
async function getKnxConfig(unitIp, canId, knxAddress = null) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Data is KNX address (1 byte) if specified, empty for all KNX configs
  let data = [];
  if (knxAddress !== null) {
    validators.knxAddress(knxAddress);
    data = [knxAddress & 0xff];
  }

  console.log("Getting KNX config:", {
    unitIp,
    canId,
    knxAddress,
    dataLength: data.length,
  });

  if (knxAddress !== null) {
    // Get single KNX configuration
    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.KNX.CMD1,
      PROTOCOL.KNX.CMD2.GET_KNX_OUT_CONFIG,
      data,
      true // Skip status check for GET commands
    );

    if (response && response.msg && response.msg.length >= 9) {
      const responseData = response.msg.slice(8); // Skip header
      console.log(
        "Single KNX response data:",
        Array.from(responseData)
          .map((b) => "0x" + b.toString(16).padStart(2, "0"))
          .join(" ")
      );
      const result = parseKnxConfigResponse(responseData);
      console.log("Parsed single KNX config:", result);
      return result;
    }

    throw new Error("Failed to get KNX configuration");
  } else {
    // Get all KNX configurations
    const result = await sendCommandMultipleResponses(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.KNX.CMD1,
      PROTOCOL.KNX.CMD2.GET_KNX_OUT_CONFIG,
      data,
      15000 // 15 second timeout
    );

    console.log("Get all KNX result:", {
      hasResult: !!result,
      hasResponses: !!(result && result.responses),
      responseCount: result?.responses?.length || 0,
      successPacketReceived: result?.successPacketReceived,
    });

    if (result && result.responses && result.responses.length > 0) {
      const knxConfigs = [];

      console.log(`Processing ${result.responses.length} KNX responses`);

      for (let i = 0; i < result.responses.length; i++) {
        const response = result.responses[i];
        try {
          if (response && response.msg && response.msg.length >= 9) {
            const responseData = response.msg.slice(8); // Skip header
            console.log(
              `KNX response ${i + 1} data:`,
              Array.from(responseData)
                .map((b) => "0x" + b.toString(16).padStart(2, "0"))
                .join(" ")
            );
            const knxConfig = parseKnxConfigResponse(responseData);
            if (knxConfig) {
              console.log(`Parsed KNX config ${i + 1}:`, knxConfig);
              knxConfigs.push(knxConfig);
            } else {
              console.log(`Failed to parse KNX config ${i + 1}`);
            }
          } else {
            console.log(
              `Invalid response ${i + 1}:`,
              response ? `msg length: ${response.msg?.length}` : "null response"
            );
          }
        } catch (error) {
          console.error(`Error parsing KNX response ${i + 1}:`, error);
        }
      }

      console.log(`Total KNX configs parsed: ${knxConfigs.length}`);
      return {
        result: { success: result.successPacketReceived },
        knxConfigs: knxConfigs,
        successPacketReceived: result.successPacketReceived,
        totalResponses: result.responses.length,
      };
    }

    throw new Error(
      "No valid responses received from get KNX configuration command"
    );
  }
}

// Helper function to parse KNX configuration response
function parseKnxConfigResponse(data) {
  if (!data || data.length < 13) {
    console.warn("Invalid KNX config response data length:", data?.length);
    return null;
  }

  try {
    const address = data[0];
    const type = data[1];
    const factor = data[2];
    const feedback = data[3];
    const memValueFlag = data[4]; // Should be 0x00
    const reserve = data[5]; // Should be 0x00
    const rcuGroup = data[6];

    // Parse KNX group addresses (2 bytes each, little endian)
    const switchGroupLow = data[7];
    const switchGroupHigh = data[8];
    const dimmingGroupLow = data[9];
    const dimmingGroupHigh = data[10];
    const valueGroupLow = data[11];
    const valueGroupHigh = data[12];

    // Convert 2-byte hex back to a/b/c format
    const convertHexToKnxAddress = (lowByte, highByte) => {
      const combined = (highByte << 8) | lowByte;
      if (combined === 0) return ""; // Empty address

      const area = (combined >> 11) & 0x1f; // 5 bits
      const line = (combined >> 8) & 0x07; // 3 bits
      const device = combined & 0xff; // 8 bits

      return `${area}/${line}/${device}`;
    };

    const knxSwitchGroup = convertHexToKnxAddress(
      switchGroupLow,
      switchGroupHigh
    );
    const knxDimmingGroup = convertHexToKnxAddress(
      dimmingGroupLow,
      dimmingGroupHigh
    );
    const knxValueGroup = convertHexToKnxAddress(valueGroupLow, valueGroupHigh);

    return {
      address,
      type,
      factor,
      feedback,
      memValueFlag,
      reserve,
      rcuGroup,
      knxSwitchGroup,
      knxDimmingGroup,
      knxValueGroup,
    };
  } catch (error) {
    console.error("Error parsing KNX config response:", error);
    return null;
  }
}

// Delete KNX Configuration function
async function deleteKnxConfig(unitIp, canId, knxAddress = null) {
  const idAddress = convertCanIdToInt(canId);
  const data = [];

  if (knxAddress !== null && knxAddress !== undefined) {
    validators.knxAddress(knxAddress);
    data.push(knxAddress & 0xff);
  }

  console.log("Deleting KNX config:", { unitIp, canId, knxAddress });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.KNX.CMD1,
    PROTOCOL.KNX.CMD2.CLEAR_KNX,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to delete KNX configuration");
  }

  return true;
}

// Delete All KNX Configurations function
async function deleteAllKnxConfigs(unitIp, canId) {
  console.log("Deleting all KNX configs:", { unitIp, canId });
  return deleteKnxConfig(unitIp, canId);
}

export {
  setGroupState,
  setMultipleGroupStates,
  getAllGroupStates,
  getAllOutputStates,
  // Air Conditioner functions
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
  // Scene functions
  setupScene,
  getSceneInformation,
  getAllScenesInformation,
  triggerScene,
  deleteScene,
  deleteAllScenes,
  // Schedule functions
  setupSchedule,
  getScheduleInformation,
  getAllSchedulesInformation,
  deleteSchedule,
  deleteAllSchedules,
  // Multi-Scene functions
  setupMultiScene,
  getMultiSceneInformation,
  getAllMultiScenesInformation,
  triggerMultiScene,
  deleteMultiScene,
  deleteAllMultiScenes,
  // Clock functions
  syncClock,
  getClock,
  // Curtain functions
  getCurtainConfig,
  setCurtain,
  setCurtainConfig,
  deleteCurtain,
  deleteAllCurtains,
  // KNX functions
  setKnxConfig,
  getKnxConfig,
  triggerKnx,
  deleteKnxConfig,
  deleteAllKnxConfigs,
};
