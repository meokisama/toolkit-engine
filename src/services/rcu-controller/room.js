import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

const MAX_SLAVE = 4;
const MAX_ROOM = 5;
const MAX_SCENE_ITEM = 20;

/**
 * Parse IP address string to 4-byte array
 * @param {string} ipString - IP address in format "192.168.1.1"
 * @returns {number[]} - Array of 4 bytes [192, 168, 1, 1]
 */
function parseIpAddress(ipString) {
  if (!ipString || typeof ipString !== "string") {
    return [0, 0, 0, 0];
  }

  const parts = ipString.split(".");
  if (parts.length !== 4) {
    return [0, 0, 0, 0];
  }

  try {
    return parts.map((part) => parseInt(part) & 0xff);
  } catch (error) {
    return [0, 0, 0, 0];
  }
}

/**
 * Decode 4-byte array to IP address string
 * @param {number[]} bytes - Array of 4 bytes [192, 168, 1, 1]
 * @returns {string} - IP address in format "192.168.1.1"
 */
function decodeIpAddress(bytes) {
  if (!Array.isArray(bytes) || bytes.length !== 4) {
    return "0.0.0.0";
  }
  return bytes.join(".");
}

/**
 * Encode ROOM_C structure according to C struct
 * @param {Object} roomConfig - Room configuration from database
 * @returns {number[]} - Encoded bytes array
 */
function encodeRoomConfig(roomConfig) {
  const data = [];
  const states = roomConfig.states || {};

  // Basic room settings (8 bytes)
  data.push(roomConfig.room_address || 0); // room_address: UINT8
  data.push(roomConfig.occupancy_type || 0); // occupancy_type: UINT8
  data.push(roomConfig.occupancy_scene_type || 0); // occupancy_scene_type: UINT8
  data.push(roomConfig.enable_welcome_night || 0); // enable_welcome_night: UINT8
  data.push(roomConfig.pir_init_time || 0); // pir_init_time: UINT8
  data.push(roomConfig.pir_verify_time || 0); // pir_verify_time: UINT8

  // unrent_period: UINT16 (little endian)
  const unrentPeriod = roomConfig.unrent_period || 0;
  data.push(unrentPeriod & 0xff); // Low byte
  data.push((unrentPeriod >> 8) & 0xff); // High byte

  // Standby time and period (4 bytes, UINT16 each, little endian)
  const standbyTime = roomConfig.standby_time || 0;
  data.push(standbyTime & 0xff); // Low byte
  data.push((standbyTime >> 8) & 0xff); // High byte

  const period = roomConfig.period || 0;
  data.push(period & 0xff); // Low byte
  data.push((period >> 8) & 0xff); // High byte

  // Reserved 8 bytes
  data.push(...Array(8).fill(0x00));

  // 7 states aircon configuration (35 bytes total, 5 bytes each)
  const stateNames = ["Unrent", "Unoccupy", "Checkin", "Welcome", "WelcomeNight", "Staff", "OutOfService"];

  for (const stateName of stateNames) {
    const state = states[stateName] || {};
    data.push(state.airconActive ? 1 : 0); // aircon_active: UINT8
    data.push(state.airconMode || 0); // aircon_mode: UINT8
    data.push(state.airconFanSpeed || 0); // aircon_fan_speed: UINT8
    data.push(state.airconCoolSetpoint || 0); // aircon_cool_setpoint: UINT8
    data.push(state.airconHeatSetpoint || 0); // aircon_heat_setpoint: UINT8
  }

  // 7 scene amounts (7 bytes)
  for (const stateName of stateNames) {
    const state = states[stateName] || {};
    const scenesList = state.scenesList || [];
    data.push(scenesList.length); // scene_amount: UINT8
  }

  // Reserved 8 bytes
  data.push(...Array(8).fill(0x00));

  // 7 scenes lists (fixed length MAX_SCENE_ITEM each)
  for (const stateName of stateNames) {
    const state = states[stateName] || {};
    const scenesList = state.scenesList || [];
    // Each scene address is 1 byte, fixed MAX_SCENE_ITEM items
    for (let i = 0; i < MAX_SCENE_ITEM; i++) {
      if (i < scenesList.length) {
        data.push(parseInt(scenesList[i]) || 0);
      } else {
        data.push(0x00); // Padding
      }
    }
  }

  return data;
}

/**
 * Encode IP_CONF structure according to C struct
 * @param {Object} generalConfig - General room configuration from database
 * @returns {number[]} - Encoded bytes array
 */
function encodeIpConfig(generalConfig) {
  const data = [];

  // tcp_mode: UINT8
  data.push(generalConfig.tcp_mode || 0);

  // slave_amount: UINT8
  const slaveAmount = generalConfig.slave_amount || 0;
  data.push(slaveAmount);

  // port: UINT16 (little endian)
  const port = generalConfig.port || 0;
  data.push(port & 0xff); // Low byte
  data.push((port >> 8) & 0xff); // High byte

  // ip[MAX_SLAVE]: array of IP addresses (4 bytes each)
  const slaveIPs = generalConfig.slaveIPs || [];
  for (let i = 0; i < MAX_SLAVE; i++) {
    const ipBytes = i < slaveIPs.length ? parseIpAddress(slaveIPs[i]) : [0, 0, 0, 0];
    data.push(...ipBytes);
  }

  return data;
}

/**
 * Set Room Configuration command
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID in format "1.1.1.1"
 * @param {Object} generalConfig - General room configuration
 * @param {Array} roomConfigs - Array of room configurations
 * @returns {Promise} - Result of the command
 */
async function setRoomConfiguration(unitIp, canId, generalConfig, roomConfigs) {
  // Validate inputs
  if (!generalConfig) {
    throw new Error("General room configuration must be provided");
  }

  if (!Array.isArray(roomConfigs)) {
    throw new Error("Room configurations must be an array");
  }

  if (roomConfigs.length > MAX_ROOM) {
    throw new Error(`Too many rooms. Maximum is ${MAX_ROOM} rooms.`);
  }

  const idAddress = convertCanIdToInt(canId);
  const data = [];

  // ROOM_CONFIG structure
  // room_amount: UINT8
  data.push(generalConfig.room_amount || roomConfigs.length);

  // room_mode: UINT8
  data.push(generalConfig.room_mode || 0);

  // client_mode: UINT8
  data.push(generalConfig.client_mode || 0);

  // reserved: UINT8
  data.push(0x00);

  // IP_CONF tcp
  const ipConfBytes = encodeIpConfig(generalConfig);
  data.push(...ipConfBytes);

  // client_ip: 4 bytes
  const clientIpBytes = parseIpAddress(generalConfig.client_ip || "");
  data.push(...clientIpBytes);

  // client_port: UINT16 (little endian)
  const clientPort = generalConfig.client_port || 0;
  data.push(clientPort & 0xff); // Low byte
  data.push((clientPort >> 8) & 0xff); // High byte

  // reserved: 14 bytes
  data.push(...Array(14).fill(0x00));

  // ROOM_C room[MAX_ROOM]: encode each room configuration
  for (let i = 0; i < MAX_ROOM; i++) {
    if (i < roomConfigs.length) {
      const roomBytes = encodeRoomConfig(roomConfigs[i]);
      data.push(...roomBytes);
    } else {
      // Fill empty room with zeros
      // Size: 8 + 4 + 8 + 35 + 7 + 8 + (7 * MAX_SCENE_ITEM) = 8 + 4 + 8 + 35 + 7 + 8 + 140 = 210 bytes
      data.push(...Array(210).fill(0x00));
    }
  }

  return sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.GENERAL.CMD1, PROTOCOL.GENERAL.CMD2.SET_ROOM_CONFIG, data);
}

/**
 * Decode ROOM_C structure from bytes
 * @param {number[]} data - Byte array containing ROOM_C structure
 * @param {number} offset - Starting offset in the data array
 * @returns {Object} - Decoded room configuration object
 */
function decodeRoomConfig(data, offset = 0) {
  const stateNames = ["Unrent", "Unoccupy", "Checkin", "Welcome", "WelcomeNight", "Staff", "OutOfService"];

  let pos = offset;

  // Basic room settings (8 bytes)
  const roomAddress = data[pos++];
  const occupancyType = data[pos++];
  const occupancySceneType = data[pos++];
  const enableWelcomeNight = data[pos++];
  const pirInitTime = data[pos++];
  const pirVerifyTime = data[pos++];

  // unrent_period: UINT16 (little endian)
  const unrentPeriod = data[pos] | (data[pos + 1] << 8);
  pos += 2;

  // Standby time and period (4 bytes, UINT16 each, little endian)
  const standbyTime = data[pos] | (data[pos + 1] << 8);
  pos += 2;
  const period = data[pos] | (data[pos + 1] << 8);
  pos += 2;

  // Skip reserved 8 bytes
  pos += 8;

  // 7 states aircon configuration (35 bytes total, 5 bytes each)
  const states = {};
  for (const stateName of stateNames) {
    states[stateName] = {
      airconActive: Boolean(data[pos++]),
      airconMode: data[pos++],
      airconFanSpeed: data[pos++],
      airconCoolSetpoint: data[pos++],
      airconHeatSetpoint: data[pos++],
    };
  }

  // 7 scene amounts (7 bytes)
  const sceneAmounts = {};
  for (const stateName of stateNames) {
    sceneAmounts[stateName] = data[pos++];
  }

  // Skip reserved 8 bytes
  pos += 8;

  // 7 scenes lists (fixed length MAX_SCENE_ITEM each)
  for (const stateName of stateNames) {
    const amount = sceneAmounts[stateName];
    const scenesList = [];
    for (let i = 0; i < MAX_SCENE_ITEM; i++) {
      if (i < amount) {
        scenesList.push(data[pos]);
      }
      pos++; // Always advance position to read all MAX_SCENE_ITEM bytes
    }
    states[stateName].scenesList = scenesList;
    states[stateName].sceneAmount = amount;
  }

  return {
    room_address: roomAddress,
    occupancy_type: occupancyType,
    occupancy_scene_type: occupancySceneType,
    enable_welcome_night: enableWelcomeNight,
    pir_init_time: pirInitTime,
    pir_verify_time: pirVerifyTime,
    unrent_period: unrentPeriod,
    standby_time: standbyTime,
    period: period,
    states: states,
    bytesRead: pos - offset,
  };
}

/**
 * Decode IP_CONF structure from bytes
 * @param {number[]} data - Byte array containing IP_CONF structure
 * @param {number} offset - Starting offset in the data array
 * @returns {Object} - Decoded IP configuration object
 */
function decodeIpConfig(data, offset = 0) {
  let pos = offset;

  // tcp_mode: UINT8
  const tcpMode = data[pos++];

  // slave_amount: UINT8
  const slaveAmount = data[pos++];

  // port: UINT16 (little endian)
  const port = data[pos] | (data[pos + 1] << 8);
  pos += 2;

  // ip[MAX_SLAVE]: array of IP addresses (4 bytes each)
  const slaveIPs = [];
  for (let i = 0; i < MAX_SLAVE; i++) {
    const ipBytes = data.slice(pos, pos + 4);
    slaveIPs.push(decodeIpAddress(ipBytes));
    pos += 4;
  }

  return {
    tcp_mode: tcpMode,
    slave_amount: slaveAmount,
    port: port,
    slaveIPs: slaveIPs,
    bytesRead: pos - offset,
  };
}

/**
 * Get Room Configuration command
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID in format "1.1.1.1"
 * @returns {Promise<Object>} - Decoded room configuration
 */
async function getRoomConfiguration(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for GET command
  const data = [];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_ROOM_CONFIG,
    data,
    true // Skip status check for GET command
  );

  if (!response || !response.msg || response.msg.length < 8) {
    throw new Error("Invalid response from get room configuration command");
  }

  // Skip header (4 bytes ID + 2 bytes length + 2 bytes cmd)
  const responseData = response.msg.slice(8);

  // Parse ROOM_CONFIG structure
  let pos = 0;

  // room_amount: UINT8
  const roomAmount = responseData[pos++];

  // room_mode: UINT8
  const roomMode = responseData[pos++];

  // client_mode: UINT8
  const clientMode = responseData[pos++];

  // reserved: UINT8
  pos++; // Skip reserved byte

  // IP_CONF tcp
  const ipConfig = decodeIpConfig(responseData, pos);
  pos += ipConfig.bytesRead;

  // client_ip: 4 bytes
  const clientIp = decodeIpAddress(responseData.slice(pos, pos + 4));
  pos += 4;

  // client_port: UINT16 (little endian)
  const clientPort = responseData[pos] | (responseData[pos + 1] << 8);
  pos += 2;

  // Skip reserved 14 bytes
  pos += 14;

  // ROOM_C room[MAX_ROOM]: decode each room configuration
  const rooms = [];
  for (let i = 0; i < MAX_ROOM; i++) {
    const roomConfig = decodeRoomConfig(responseData, pos);
    pos += roomConfig.bytesRead;

    // Only include rooms up to room_amount (in order)
    if (i < roomAmount) {
      rooms.push(roomConfig);
    }
  }

  return {
    generalConfig: {
      room_amount: roomAmount,
      room_mode: roomMode,
      client_mode: clientMode,
      tcp_mode: ipConfig.tcp_mode,
      slave_amount: ipConfig.slave_amount,
      port: ipConfig.port,
      slaveIPs: ipConfig.slaveIPs,
      client_ip: clientIp,
      client_port: clientPort,
    },
    rooms: rooms,
  };
}

/**
 * Encode ROOM_S structure according to C struct
 * @param {Object} roomStatus - Room status object
 * @returns {number[]} - Encoded bytes array (20 bytes)
 */
function encodeRoomStatus(roomStatus) {
  const data = [];

  // rent_status: UINT8 (0: unrent, 1: rent)
  data.push(roomStatus.rent_status || 0);

  // guest_status: UINT8 (0: normal, 1: VIP)
  data.push(roomStatus.guest_status || 0);

  // reserved: 18 bytes
  data.push(...Array(18).fill(0x00));

  return data;
}

/**
 * Decode ROOM_S structure from bytes
 * @param {number[]} data - Byte array containing ROOM_S structure
 * @param {number} offset - Starting offset in the data array
 * @returns {Object} - Decoded room status object
 */
function decodeRoomStatus(data, offset = 0) {
  let pos = offset;

  const rentStatus = data[pos++];
  const guestStatus = data[pos++];

  // Skip reserved 18 bytes
  pos += 18;

  return {
    rent_status: rentStatus,
    guest_status: guestStatus,
    bytesRead: pos - offset,
  };
}

/**
 * Get Room Status command
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID in format "1.1.1.1"
 * @returns {Promise<Object>} - Decoded room status
 */
async function getRoomStatus(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for GET command
  const data = [];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_ROOM_STATUS,
    data,
    true // Skip status check for GET command
  );

  if (!response || !response.msg || response.msg.length < 8) {
    throw new Error("Invalid response from get room status command");
  }

  // Skip header (4 bytes ID + 2 bytes length + 2 bytes cmd)
  const responseData = response.msg.slice(8);

  // Parse ROOM_SETTING structure
  let pos = 0;

  // aircon_mode: UINT8 (0: cool, 1: heat)
  const airconMode = responseData[pos++];

  // reserved: 11 bytes
  pos += 11;

  // room[MAX_ROOM]: decode each room status
  const rooms = [];
  for (let i = 0; i < MAX_ROOM; i++) {
    const roomStatus = decodeRoomStatus(responseData, pos);
    pos += roomStatus.bytesRead;
    rooms.push({
      room_index: i,
      rent_status: roomStatus.rent_status,
      guest_status: roomStatus.guest_status,
    });
  }

  return {
    aircon_mode: airconMode,
    rooms: rooms,
  };
}

/**
 * Set Room Status command
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID in format "1.1.1.1"
 * @param {number} airconMode - Aircon mode (0: cool, 1: heat)
 * @param {Array} roomStatuses - Array of room status objects (max 5 items)
 * @returns {Promise} - Result of the command
 */
async function setRoomStatus(unitIp, canId, airconMode, roomStatuses) {
  // Validate inputs
  if (!Array.isArray(roomStatuses)) {
    throw new Error("Room statuses must be an array");
  }

  if (roomStatuses.length > MAX_ROOM) {
    throw new Error(`Too many rooms. Maximum is ${MAX_ROOM} rooms.`);
  }

  const idAddress = convertCanIdToInt(canId);
  const data = [];

  // ROOM_SETTING structure
  // aircon_mode: UINT8 (0: cool, 1: heat)
  data.push(airconMode || 0);

  // reserved: 11 bytes
  data.push(...Array(11).fill(0x00));

  // room[MAX_ROOM]: encode each room status
  for (let i = 0; i < MAX_ROOM; i++) {
    if (i < roomStatuses.length) {
      const roomBytes = encodeRoomStatus(roomStatuses[i]);
      data.push(...roomBytes);
    } else {
      // Fill empty room with zeros (20 bytes)
      data.push(...Array(20).fill(0x00));
    }
  }

  return sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.GENERAL.CMD1, PROTOCOL.GENERAL.CMD2.SET_ROOM_STATUS, data);
}

export { setRoomConfiguration, getRoomConfiguration, getRoomStatus, setRoomStatus };
