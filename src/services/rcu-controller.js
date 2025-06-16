import { CONSTANTS } from "../constants.js";

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
      GET_AC_STATUS: 13,
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
};

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

async function setGroupState(unitIp, canId, group, value) {
  if (group < 1 || group > 255) {
    throw new Error("Group number must be between 1 and 255");
  }

  if (value < 0 || value > 255) {
    throw new Error("Value must be between 0 and 255");
  }

  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.SET_GROUP_STATE,
    [group, value]
  );

  return response;
}

async function setMultipleGroupStates(unitIp, canId, groupSettings) {
  if (!Array.isArray(groupSettings) || groupSettings.length === 0) {
    throw new Error("Invalid input. Provide an array of [group, value] pairs");
  }

  const data = [];
  for (let i = 0; i < groupSettings.length; i++) {
    const pair = groupSettings[i];
    if (Array.isArray(pair) && pair.length === 2) {
      const group = pair[0];
      const value = pair[1];

      if (group >= 1 && group <= 255 && value >= 0 && value <= 255) {
        data.push(group);
        data.push(value);
      }
    }
  }

  if (data.length === 0) {
    throw new Error("No valid groups to set");
  }

  const idAddress = convertCanIdToInt(canId);
  return await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.SET_GROUP_STATE,
    data
  );
}

async function getAllGroupStates(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);
  return await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_GROUP_STATE,
    []
  );
}

async function getAllOutputStates(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);
  return await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
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
    PROTOCOL.AC.CMD2.GET_AC_STATUS,
    [group]
  );

  if (response && response.msg) {
    const msgLength = response.msg.length;

    // Check minimum length for basic response
    if (msgLength < 8) {
      throw new Error(
        `Response too short: ${msgLength} bytes (minimum 8 required)`
      );
    }

    // Check if we have enough data for AC status (need at least 26 bytes total)
    if (msgLength < 26) {
      throw new Error(
        `Insufficient data in AC status response: ${msgLength} bytes (expected 26+)`
      );
    }

    const data = response.msg.slice(8); // Skip header

    return {
      group: data[0],
      thermostatStatus: data[1],
      roomTemp: (data[3] * 256 + data[2]) / 10, // Convert to celsius
      occupancyStatus: data[5] * 256 + data[4],
      powerMode: data[7] * 256 + data[6],
      operateMode: data[9] * 256 + data[8],
      occupiedFanSpeed: data[11] * 256 + data[10],
      unoccupiedFanSpeed: data[13] * 256 + data[12],
      settingTemp: (data[15] * 256 + data[14]) / 10, // Convert to celsius
      unoccupiedCoolTemp: (data[17] * 256 + data[16]) / 10,
      unoccupiedHeatTemp: (data[19] * 256 + data[18]) / 10,
      ecoMode: data[21] * 256 + data[20],
    };
  }

  throw new Error("No response received from AC status command");
}

async function getRoomTemp(unitIp, canId, group = 1) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_ROOM_TEMP,
    [group]
  );

  if (response && response.msg && response.msg.length >= 11) {
    const data = response.msg.slice(8); // Skip header
    const temp = (data[2] * 256 + data[1]) / 10; // Convert to celsius
    return { group: data[0], temperature: temp };
  }

  throw new Error("Invalid response from room temperature command");
}

async function setSettingRoomTemp(
  unitIp,
  canId,
  group = 1,
  temperature = 25.0
) {
  const idAddress = convertCanIdToInt(canId);
  const tempValue = Math.round(temperature * 10); // Convert to protocol format
  const lowByte = tempValue & 0xff;
  const highByte = (tempValue >> 8) & 0xff;

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.SET_SETTING_ROOM_TEMP,
    [group, lowByte, highByte]
  );

  if (response && response.msg && response.msg.length >= 9) {
    const data = response.msg.slice(8); // Skip header
    return data[0] === 0; // 0 means success
  }

  throw new Error("Failed to set room temperature");
}

async function getSettingRoomTemp(unitIp, canId, group = 1) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_SETTING_ROOM_TEMP,
    [group]
  );

  if (response && response.msg && response.msg.length >= 11) {
    const data = response.msg.slice(8); // Skip header
    const temp = (data[2] * 256 + data[1]) / 10; // Convert to celsius
    return { group: data[0], temperature: temp };
  }

  throw new Error("Invalid response from setting temperature command");
}

async function setFanMode(unitIp, canId, group = 1, fanSpeed = 0) {
  const idAddress = convertCanIdToInt(canId);
  // fanSpeed: 0=low, 1=medium, 2=high, 3=auto
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.SET_FAN_MODE,
    [group, fanSpeed, 0]
  );

  if (response && response.msg && response.msg.length >= 9) {
    const data = response.msg.slice(8); // Skip header
    return data[0] === 0; // 0 means success
  }

  throw new Error("Failed to set fan mode");
}

async function getFanMode(unitIp, canId, group = 1) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_FAN_MODE,
    [group]
  );

  if (response && response.msg && response.msg.length >= 11) {
    const data = response.msg.slice(8); // Skip header
    return { group: data[0], fanSpeed: data[1] };
  }

  throw new Error("Invalid response from fan mode command");
}

async function setPowerMode(unitIp, canId, group = 1, power = true) {
  const idAddress = convertCanIdToInt(canId);
  const powerValue = power ? 1 : 0;
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.SET_POWER_MODE,
    [group, powerValue, 0]
  );

  return response?.result?.success || false;
}

async function getPowerMode(unitIp, canId, group = 1) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_POWER_MODE,
    [group]
  );

  if (response && response.msg && response.msg.length >= 11) {
    const data = response.msg.slice(8); // Skip header
    return { group: data[0], power: data[1] === 1 };
  }

  throw new Error("Invalid response from power mode command");
}

async function setOperateMode(unitIp, canId, group = 1, mode = 1) {
  const idAddress = convertCanIdToInt(canId);
  // mode: 1=cool, 2=heat, 3=ventilation/fan
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.SET_OPERATE_MODE,
    [group, mode, 0]
  );

  if (response && response.msg && response.msg.length >= 9) {
    const data = response.msg.slice(8); // Skip header
    return data[0] === 0; // 0 means success
  }

  throw new Error("Failed to set operate mode");
}

async function getOperateMode(unitIp, canId, group = 1) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_OPERATE_MODE,
    [group]
  );

  if (response && response.msg && response.msg.length >= 11) {
    const data = response.msg.slice(8); // Skip header
    return { group: data[0], mode: data[1] };
  }

  throw new Error("Invalid response from operate mode command");
}

async function setEcoMode(unitIp, canId, group = 1, eco = false) {
  const idAddress = convertCanIdToInt(canId);
  const ecoValue = eco ? 1 : 0;
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.SET_ECO_MODE,
    [group, ecoValue, 0]
  );

  if (response && response.msg && response.msg.length >= 9) {
    const data = response.msg.slice(8); // Skip header
    return data[0] === 0; // 0 means success
  }

  throw new Error("Failed to set eco mode");
}

async function getEcoMode(unitIp, canId, group = 1) {
  const idAddress = convertCanIdToInt(canId);
  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.AC.CMD1,
    PROTOCOL.AC.CMD2.GET_ECO_MODE,
    [group]
  );

  if (response && response.msg && response.msg.length >= 11) {
    const data = response.msg.slice(8); // Skip header
    return { group: data[0], eco: data[1] === 1 };
  }

  throw new Error("Invalid response from eco mode command");
}

// Scene Setup function
async function setupScene(
  unitIp,
  canId,
  sceneIndex,
  sceneName,
  sceneAddress,
  sceneItems
) {
  if (sceneIndex < 0 || sceneIndex > 99) {
    throw new Error("Scene index must be between 0 and 99");
  }

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
    // Maximum items that can fit in UDP packet
    throw new Error("Too many scene items. Maximum is 85 items.");
  }

  const idAddress = convertCanIdToInt(canId);

  // Build data array
  const data = [];

  // 1. Scene index (1 byte)
  data.push(sceneIndex);

  // 2. Scene name (15 bytes, null padded)
  const nameBytes = Buffer.from(sceneName, "utf8");
  for (let i = 0; i < 15; i++) {
    if (i < nameBytes.length) {
      data.push(nameBytes[i]);
    } else {
      data.push(0x00); // Null padding
    }
  }

  // 3. Scene address (1 byte)
  const addressValue = parseInt(sceneAddress) || 0;
  data.push(addressValue);

  // 4. Scene amount - number of items (1 byte)
  data.push(sceneItems.length);

  // 5. 7 empty bytes
  for (let i = 0; i < 7; i++) {
    data.push(0x00);
  }

  // 6. Scene items (3 bytes per item: object_value, item_address, item_value)
  for (const item of sceneItems) {
    // object_value (type)
    data.push(item.object_value || 0);

    // item_address
    const itemAddress = parseInt(item.item_address) || 0;
    data.push(itemAddress);

    // item_value - convert values based on object type
    let itemValue = parseFloat(item.item_value) || 0;
    if (item.object_value === 1) {
      // LIGHTING object type
      itemValue = Math.round((itemValue / 100) * 255);
    } else if (item.object_value === 6) {
      // AC_TEMPERATURE object type
      itemValue = parseInt(itemValue) || 0;
    } else {
      // For other types, convert to integer
      itemValue = parseInt(itemValue) || 0;
    }
    data.push(itemValue);
  }

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SCENE,
    data
  );

  return response;
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
async function triggerScene(unitIp, canId, sceneIndex, sceneAddress) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  const triggerData = parseInt(sceneAddress);
  const data = [triggerData];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.TRIGGER_SCENE,
    data
  );

  return response;
}

// Delete Scene function
async function deleteScene(unitIp, canId, sceneIndex) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Build data array for delete scene
  const data = [];

  // 1. Scene index (1 byte)
  data.push(sceneIndex);

  // 2. Scene name (15 bytes, all null for delete)
  for (let i = 0; i < 15; i++) {
    data.push(0x00);
  }

  // 3. Scene address (1 byte) - set to 0 for delete
  data.push(0x00);

  // 4. Scene amount - number of items (1 byte) - set to 0 for delete
  data.push(0x00);

  // 5. 7 empty bytes
  for (let i = 0; i < 7; i++) {
    data.push(0x00);
  }

  // No scene items for delete operation

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SCENE,
    data
  );

  return response;
}

// Setup Schedule function
async function setupSchedule(
  unitIp,
  canId,
  scheduleIndex,
  enabled,
  weekDays,
  hour,
  minute,
  sceneAddresses
) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Validate inputs
  if (scheduleIndex < 0 || scheduleIndex > 31) {
    throw new Error("Schedule index must be between 0 and 31");
  }
  if (hour < 0 || hour > 23) {
    throw new Error("Hour must be between 0 and 23");
  }
  if (minute < 0 || minute > 59) {
    throw new Error("Minute must be between 0 and 59");
  }
  if (sceneAddresses.length > 32) {
    throw new Error("Maximum 32 scenes allowed per schedule");
  }

  const data = [];

  // 1. Schedule Index (0-31 for protocol)
  data.push(scheduleIndex);

  // 2. Enable (0/1)
  data.push(enabled ? 1 : 0);

  // 3. Reserve 10 bytes (0x00)
  for (let i = 0; i < 10; i++) {
    data.push(0x00);
  }

  // 4. Week: 7 bytes (each byte corresponds to one day, 0/1 for each day)
  // weekDays should be array of 7 boolean values [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  for (let i = 0; i < 7; i++) {
    data.push(weekDays[i] ? 1 : 0);
  }

  // 5. Hour (0-23)
  data.push(hour);

  // 6. Minutes (0-59)
  data.push(minute);

  // 7. Second (always 0)
  data.push(0);

  // 8. Scene amount (max 32)
  data.push(sceneAddresses.length);

  // 9. Scene addresses (1 byte per address)
  for (const address of sceneAddresses) {
    data.push(parseInt(address) || 0);
  }

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SCHEDULE,
    data
  );

  return response;
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
async function deleteSchedule(unitIp, canId, scheduleIndex) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Validate schedule index
  if (scheduleIndex < 0 || scheduleIndex > 31) {
    throw new Error("Schedule index must be between 0 and 31");
  }

  const data = [];

  // 1. Schedule Index (0-31 for protocol)
  data.push(scheduleIndex);

  // 2. Enable (0 for delete)
  data.push(0);

  // 3. Reserve 10 bytes (0x00)
  for (let i = 0; i < 10; i++) {
    data.push(0x00);
  }

  // 4. Week: 7 bytes (all 0 for delete)
  for (let i = 0; i < 7; i++) {
    data.push(0);
  }

  // 5. Hour (0 for delete)
  data.push(0);

  // 6. Minutes (0 for delete)
  data.push(0);

  // 7. Second (0 for delete)
  data.push(0);

  // 8. Scene amount (0 for delete)
  data.push(0);

  // No scene addresses for delete operation

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SCHEDULE,
    data
  );

  return response;
}

// Clock Control Functions

// Sync Clock function - sets the unit's clock
async function syncClock(unitIp, canId, clockData) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Validate clock data
  if (!clockData) {
    throw new Error("Clock data is required");
  }

  const { year, month, day, dayOfWeek, hour, minute, second } = clockData;

  // Validate date/time values
  if (year < 0 || year > 99) {
    throw new Error("Year must be between 0 and 99 (2000-2099)");
  }
  if (month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12");
  }
  if (day < 1 || day > 31) {
    throw new Error("Day must be between 1 and 31");
  }
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("Day of week must be between 0 and 6 (Monday-Sunday)");
  }
  if (hour < 0 || hour > 23) {
    throw new Error("Hour must be between 0 and 23");
  }
  if (minute < 0 || minute > 59) {
    throw new Error("Minute must be between 0 and 59");
  }
  if (second < 0 || second > 59) {
    throw new Error("Second must be between 0 and 59");
  }

  // Build data array: 7 bytes in order year, month, day, dayOfWeek, hour, minute, second
  const data = [year, month, day, dayOfWeek, hour, minute, second];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SYNC_CLOCK,
    data
  );

  return response;
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
  // Schedule functions
  setupSchedule,
  getScheduleInformation,
  getAllSchedulesInformation,
  deleteSchedule,
  // Clock functions
  syncClock,
  getClock,
};
