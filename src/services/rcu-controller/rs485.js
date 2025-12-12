import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

/**
 * Get RS485 CH1 Configuration
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @returns {Promise<Object>} RS485 CH1 configuration
 */
async function getRS485CH1Config(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Getting RS485 CH1 config from unit ${unitIp} (CAN ID: ${canId})`);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_RS485_CH1_CONFIG,
    [], // No data for GET command
    true // Skip status check for GET commands
  );

  // Add delay after GET command to prevent auto refresh conflicts
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!response.result.success) {
    throw new Error("Failed to get RS485 CH1 configuration");
  }

  // Parse the response data according to the frame structure
  const data = response.result.data;
  if (!data || data.length < 204) {
    throw new Error("Invalid RS485 CH1 configuration data received");
  }

  return parseRS485Config(data);
}

/**
 * Get RS485 CH2 Configuration
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @returns {Promise<Object>} RS485 CH2 configuration
 */
async function getRS485CH2Config(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Getting RS485 CH2 config from unit ${unitIp} (CAN ID: ${canId})`);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_RS485_CH2_CONFIG,
    [], // No data for GET command
    true // Skip status check for GET commands
  );

  // Add delay after GET command to prevent auto refresh conflicts
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!response.result.success) {
    throw new Error("Failed to get RS485 CH2 configuration");
  }

  // Parse the response data according to the frame structure
  const data = response.result.data;
  if (!data || data.length < 204) {
    throw new Error("Invalid RS485 CH2 configuration data received");
  }

  return parseRS485Config(data);
}

/**
 * Set RS485 CH1 Configuration
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {Object} config - RS485 configuration object
 * @returns {Promise<boolean>} Success status
 */
async function setRS485CH1Config(unitIp, canId, config) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting RS485 CH1 config for unit ${unitIp} (CAN ID: ${canId})`);

  // Build data frame according to the specification
  const data = buildRS485ConfigData(config);

  const response = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.GENERAL.CMD1, PROTOCOL.GENERAL.CMD2.SET_RS485_CH1_CONFIG, data);

  // Add delay after SET command
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!response.result.success) {
    throw new Error("Failed to set RS485 CH1 configuration");
  }

  return true;
}

/**
 * Set RS485 CH2 Configuration
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {Object} config - RS485 configuration object
 * @returns {Promise<boolean>} Success status
 */
async function setRS485CH2Config(unitIp, canId, config) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting RS485 CH2 config for unit ${unitIp} (CAN ID: ${canId})`);

  // Build data frame according to the specification
  const data = buildRS485ConfigData(config);

  const response = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.GENERAL.CMD1, PROTOCOL.GENERAL.CMD2.SET_RS485_CH2_CONFIG, data);

  // Add delay after SET command
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!response.result.success) {
    throw new Error("Failed to set RS485 CH2 configuration");
  }

  return true;
}

/**
 * Parse RS485 configuration data from response
 * @param {Array} data - Raw data array from response
 * @returns {Object} Parsed RS485 configuration
 */
function parseRS485Config(data) {
  // Data frame structure:
  // Byte 1-4: baudrate (little endian)
  // Byte 5: parity (None - 0, Odd - 1, Even - 2)
  // Byte 6: stop bit (1 stop bit - 0, 2 stop bit - 1)
  // Byte 7: board id
  // Byte 8: RS485 type
  // Byte 9: Number of slaves
  // Byte 10-14: 5 byte reserved (0x00)
  // Byte 15+: Slave configurations (19 bytes each, up to 10 slaves)

  const baudrate = (data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0];
  const parity = data[4];
  const stopBit = data[5];
  const boardId = data[6];
  const rs485Type = data[7];
  const numSlaves = data[8];
  const reserved = data.slice(9, 14);

  const slaves = [];
  for (let i = 0; i < 10; i++) {
    const slaveOffset = 14 + i * 19;
    if (slaveOffset + 19 <= data.length) {
      const slave = {
        slaveId: data[slaveOffset],
        slaveGroup: data[slaveOffset + 1],
        numIndoors: data[slaveOffset + 2],
        indoorGroups: data.slice(slaveOffset + 3, slaveOffset + 19),
      };
      slaves.push(slave);
    }
  }

  return {
    baudrate,
    parity,
    stopBit,
    boardId,
    rs485Type,
    numSlaves,
    reserved,
    slaves,
  };
}

/**
 * Build RS485 configuration data for sending
 * @param {Object} config - RS485 configuration object
 * @returns {Array} Data array for sending
 */
function buildRS485ConfigData(config) {
  const data = new Array(204); // Total 204 bytes: 14 header + 190 slave data (19 * 10)

  // Byte 1-4: baudrate (little endian)
  data[0] = config.baudrate & 0xff;
  data[1] = (config.baudrate >> 8) & 0xff;
  data[2] = (config.baudrate >> 16) & 0xff;
  data[3] = (config.baudrate >> 24) & 0xff;

  // Byte 5: parity
  data[4] = config.parity & 0xff;

  // Byte 6: stop bit
  data[5] = config.stopBit & 0xff;

  // Byte 7: board id
  data[6] = config.boardId & 0xff;

  // Byte 8: RS485 type
  data[7] = config.rs485Type & 0xff;

  // Byte 9: Number of slaves
  data[8] = config.numSlaves & 0xff;

  // Byte 10-14: 5 byte reserved (0x00)
  for (let i = 9; i < 14; i++) {
    data[i] = 0x00;
  }

  // Slave configurations (19 bytes each, up to 10 slaves)
  for (let i = 0; i < 10; i++) {
    const slaveOffset = 14 + i * 19;
    const slave =
      config.slaves && config.slaves[i]
        ? config.slaves[i]
        : {
            slaveId: 1,
            slaveGroup: 0,
            numIndoors: 0,
            indoorGroups: new Array(16).fill(0),
          };

    // Byte 15: Slave ID
    data[slaveOffset] = slave.slaveId & 0xff;

    // Byte 16: Slave group (address of aircon item)
    data[slaveOffset + 1] = slave.slaveGroup & 0xff;

    // Byte 17: number of indoors
    data[slaveOffset + 2] = slave.numIndoors & 0xff;

    // Byte 18-33: 16 byte for 16 indoors
    for (let j = 0; j < 16; j++) {
      const indoorGroup = slave.indoorGroups && slave.indoorGroups[j] ? slave.indoorGroups[j] : 0;
      data[slaveOffset + 3 + j] = indoorGroup & 0xff;
    }
  }

  return data;
}

/**
 * Create default RS485 configuration for network unit
 * @returns {Object} Default RS485 configuration
 */
function createDefaultNetworkRS485Config() {
  return {
    baudrate: 9600,
    parity: 0, // None
    stopBit: 0, // 1 stop bit
    boardId: 1,
    rs485Type: 0,
    numSlaves: 0,
    reserved: [0, 0, 0, 0, 0],
    slaves: Array.from({ length: 10 }, () => ({
      slaveId: 1,
      slaveGroup: 0,
      numIndoors: 0,
      indoorGroups: new Array(16).fill(0),
    })),
  };
}

export {
  getRS485CH1Config,
  getRS485CH2Config,
  setRS485CH1Config,
  setRS485CH2Config,
  parseRS485Config,
  buildRS485ConfigData,
  createDefaultNetworkRS485Config,
};
