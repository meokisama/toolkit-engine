import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";
import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { EventEmitter } from "events";

const { CMD1, CMD2 } = PROTOCOL.DALI;

// Event emitter for DALI events
const daliEvents = new EventEmitter();

/**
 * Parse DALI device data from response packet
 * Each device has 37 bytes of data (ignore last 4 bytes)
 */
function parseDaliDeviceData(data, offset, deviceIndex) {
  const device = {
    index: deviceIndex, // Device index starting from 0
    address: data[offset],
    online: data[offset + 1],
    status: data[offset + 2],
    deviceType: data[offset + 3],
    colorFeature: data[offset + 4],
    currentLevel: data[offset + 5],
    minLevel: data[offset + 6],
    maxLevel: data[offset + 7],
    fadeTime: data[offset + 8],
    fadeRate: data[offset + 9],
    sceneLevels: [], // 16 bytes for scene levels
    groupMask: 0, // 2 bytes for group mask
    lightingGroupAddress: data[offset + 28],
  };

  // Parse 16 scene levels
  for (let i = 0; i < 16; i++) {
    device.sceneLevels.push(data[offset + 10 + i]);
  }

  // Parse 2-byte group mask (16 bits) - Big Endian
  // Byte 26: high byte (groups 8-15), Byte 27: low byte (groups 0-7)
  device.groupMask = (data[offset + 26] << 8) | data[offset + 27];

  // Extract which groups this device belongs to
  device.groups = [];
  for (let i = 0; i < 16; i++) {
    if (device.groupMask & (1 << i)) {
      device.groups.push(i);
    }
  }

  return device;
}

/**
 * Parse DALI scan/commissioning response
 * Expects 4 packets with up to 16 devices each
 */
function parseDaliResponse(responses) {
  const devices = [];
  let deviceIndex = 0; // Global device index starting from 0

  for (const response of responses) {
    const { msg } = response;
    const data = new Uint8Array(msg);

    // Skip header (4 bytes ID + 2 bytes length + 2 bytes cmd)
    const dataStart = 8;

    // Byte 0: packet index (0-3)
    const packetIndex = data[dataStart];
    // Byte 1: device count in this packet
    const deviceCount = data[dataStart + 1];

    console.log(`Packet ${packetIndex}: contains ${deviceCount} device(s)`);

    // Parse each device (37 bytes each, starting from byte 2)
    for (let i = 0; i < deviceCount && i < 16; i++) {
      const deviceOffset = dataStart + 2 + i * 37;
      const device = parseDaliDeviceData(data, deviceOffset, deviceIndex);
      devices.push(device);
      deviceIndex++; // Increment global device index
    }
  }

  return devices;
}

/**
 * DALI Commissioning
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID (e.g., "12.43.3.3")
 * @param {boolean} extend - true for Extend Commissioning, false for Reset Commissioning
 * @returns {Promise<Array>} - Array of discovered devices
 */
async function daliCommissioning(unitIp, canId, extend = false) {
  const idAddress = convertCanIdToInt(canId);

  // Prepare data:
  // Reset: 4 bytes of 0x00
  // Extend: 1 byte 0xFF + 3 bytes 0x00
  const data = extend ? [0xff, 0x00, 0x00, 0x00] : [0x00, 0x00, 0x00, 0x00];

  console.log(
    `Starting DALI ${
      extend ? "Extend" : "Reset"
    } Commissioning for ${unitIp} (${canId})`
  );

  try {
    // Send command and wait for up to 4 packets (6 minutes timeout)
    // Enable keepalive (60s) to maintain firewall connection tracking
    const result = await sendCommandMultipleResponses(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.DALI_COMMISSIONING,
      data,
      360000, // 6 minutes timeout
      60000, // Send keepalive packet every 60 seconds to prevent firewall timeout
      // Real-time packet handler for device count notification
      (msg, packetLength) => {
        const dataLength = packetLength - 4; // Exclude cmd1, cmd2, and CRC (2 bytes)
        if (dataLength === 2) {
          const oldDeviceCount = msg[8];
          const newDeviceCount = msg[9];
          console.log(
            `Device count notification: old=${oldDeviceCount}, new=${newDeviceCount}`
          );
          daliEvents.emit("deviceCountChanged", {
            unitIp,
            canId,
            oldDeviceCount,
            newDeviceCount,
          });
        }
      }
    );

    console.log(
      `Commissioning completed: received ${result.responses.length} packet(s), success: ${result.successPacketReceived}`
    );

    // Filter out device count notification packets (2 bytes data) before parsing
    const deviceDataResponses = result.responses.filter((response) => {
      const { msg } = response;
      const packetLength = msg[4] | (msg[5] << 8);
      const dataLength = packetLength - 4;
      return dataLength !== 2;
    });

    // Parse devices from responses
    const devices = parseDaliResponse(deviceDataResponses);

    return {
      success: result.successPacketReceived,
      devices,
      packetsReceived: result.responses.length,
    };
  } catch (error) {
    console.error("DALI Commissioning failed:", error);
    throw error;
  }
}

/**
 * DALI Scan Devices
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID (e.g., "12.43.3.3")
 * @returns {Promise<Array>} - Array of discovered devices
 */
async function daliScan(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  // Prepare data: 2 bytes of 0x00
  const data = [0x00, 0x00];

  console.log(`Starting DALI Scan for ${unitIp} (${canId})`);

  try {
    // Send command and wait for up to 4 packets (3 minutes timeout)
    const result = await sendCommandMultipleResponses(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.DALI_SCAN,
      data,
      180000 // 3 minutes timeout
    );

    console.log(
      `Scan completed: received ${result.responses.length} packet(s), success: ${result.successPacketReceived}`
    );

    // Parse devices from responses
    const devices = parseDaliResponse(result.responses);

    return {
      success: result.successPacketReceived,
      devices,
      packetsReceived: result.responses.length,
    };
  } catch (error) {
    console.error("DALI Scan failed:", error);
    throw error;
  }
}

/**
 * Broadcast ON to all DALI devices
 */
async function daliBroadcastOn(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  try {
    const result = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.BROADCAST_ON,
      [0x00, 0x00]
    );

    return result;
  } catch (error) {
    console.error("DALI Broadcast ON failed:", error);
    throw error;
  }
}

/**
 * Broadcast OFF to all DALI devices
 */
async function daliBroadcastOff(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  try {
    const result = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.BROADCAST_OFF,
      [0x00, 0x00]
    );

    return result;
  } catch (error) {
    console.error("DALI Broadcast OFF failed:", error);
    throw error;
  }
}

/**
 * Trigger DALI device
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {number} deviceAddress - Device address (0-63)
 * @param {number} level - Brightness level (0-255)
 */
async function triggerDaliDevice(unitIp, canId, deviceAddress, level) {
  const idAddress = convertCanIdToInt(canId);

  try {
    const data = [deviceAddress, level, 0x00, 0x00];
    const result = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.TRIGGER_DALI_DEVICE,
      data
    );

    return result;
  } catch (error) {
    console.error("Trigger DALI device failed:", error);
    throw error;
  }
}

/**
 * Trigger DALI group
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {number} groupId - Group ID (0-15)
 * @param {number} level - Brightness level (0-255)
 */
async function triggerDaliGroup(unitIp, canId, groupId, level) {
  const idAddress = convertCanIdToInt(canId);

  console.log(
    `Triggering DALI group ${groupId} to level ${level} for ${unitIp} (${canId})`
  );

  try {
    const data = [groupId, level, 0x00, 0x00];
    const result = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.TRIGGER_DALI_GROUP,
      data
    );

    return result;
  } catch (error) {
    console.error("Trigger DALI group failed:", error);
    throw error;
  }
}

/**
 * Trigger DALI scene
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {number} sceneId - Scene ID (0-15)
 */
async function triggerDaliScene(unitIp, canId, sceneId) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Triggering DALI scene ${sceneId} for ${unitIp} (${canId})`);

  try {
    const data = [sceneId, 0x00, 0x00, 0x00];
    const result = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.TRIGGER_DALI_SCENE,
      data
    );

    return result;
  } catch (error) {
    console.error("Trigger DALI scene failed:", error);
    throw error;
  }
}

/**
 * Send DALI Address Mapping
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {Array<number>} addressMapping - Array of 64 bytes representing address mapping (0-63)
 * @returns {Promise<Object>} - Command result
 */
async function sendAddressMapping(unitIp, canId, addressMapping) {
  const idAddress = convertCanIdToInt(canId);

  // Validate addressMapping
  if (!Array.isArray(addressMapping) || addressMapping.length !== 64) {
    throw new Error("Address mapping must be an array of exactly 64 bytes");
  }

  // Validate each address is in range 0-63
  for (let i = 0; i < addressMapping.length; i++) {
    if (addressMapping[i] < 0 || addressMapping[i] > 63) {
      throw new Error(
        `Invalid address at index ${i}: ${addressMapping[i]}. Must be between 0-63`
      );
    }
  }

  console.log(`Sending DALI Address Mapping for ${unitIp} (${canId})`);
  console.log("Address mapping:", addressMapping.join(","));

  try {
    const result = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.MAPPING_ADDRESS,
      addressMapping,
      false,
      false,
      60000
    );

    return result;
  } catch (error) {
    console.error("Send Address Mapping failed:", error);
    throw error;
  }
}

/**
 * Build device configuration data (20 bytes per device)
 * @param {Object} device - Device data from database with mapped info
 * @param {Array} sceneDevices - Scene device configurations from database
 * @param {Array} groupDevices - Group device relationships from database
 * @returns {Array<number>} - 20 bytes configuration for device
 */
function buildDeviceConfig(device, sceneDevices, groupDevices) {
  const config = [];

  // Byte 0: device index (from mapped_device_index in database)
  config.push(device.mapped_device_index || 0);

  // Byte 1: device address (from mapped_device_address in database)
  config.push(device.mapped_device_address || 0);

  // Bytes 2-17: 16 scene levels (0-255, or 0xFF if device not in scene)
  for (let sceneId = 0; sceneId < 16; sceneId++) {
    const sceneDevice = sceneDevices.find(
      (sd) =>
        sd.scene_id === sceneId &&
        sd.device_address === device.address &&
        sd.active
    );
    if (sceneDevice) {
      config.push(sceneDevice.brightness);
    } else {
      config.push(0xff); // 0xFF = not in scene
    }
  }

  // Bytes 18-19: group bits (little endian)
  // Build 16-bit mask: bit N = 1 if device in group N
  let groupMask = 0;
  for (const groupDevice of groupDevices) {
    if (groupDevice.device_address === device.address) {
      groupMask |= 1 << groupDevice.group_id;
    }
  }

  // Big endian: high byte first, then low byte
  config.push((groupMask >> 8) & 0xff); // Byte 18: high byte (groups 8-15)
  config.push(groupMask & 0xff); // Byte 19: low byte (groups 0-7)

  return config;
}

/**
 * Send Group & Scene Configuration
 * Builds and sends DALI_CONFIG command with device configurations
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {number} projectId - Project ID to fetch configuration data
 * @param {Object} database - Database instance to query data
 * @returns {Promise<Object>} - Command result
 */
async function sendGroupSceneConfig(unitIp, canId, projectId, database) {
  const idAddress = convertCanIdToInt(canId);

  console.log(
    `Building Group & Scene configuration for ${unitIp} (${canId}), project ${projectId}`
  );

  try {
    // Get all devices with mappings from database
    const allDevices = await database.getAllDaliDevices(projectId);
    const mappedDevices = allDevices.filter(
      (d) => d.mapped_device_index !== null && d.mapped_device_address !== null
    );

    if (mappedDevices.length === 0) {
      throw new Error("No mapped devices found. Please map devices first.");
    }

    // Get all scene device configurations
    const sceneDevices = await database.getAllSceneDevices(projectId);

    // Get all group device relationships
    const groupDevices = await database.getAllGroupDevices(projectId);

    // Filter to only include devices that are in at least one group or scene
    const devicesInGroups = new Set(groupDevices.map((gd) => gd.device_address));
    const devicesInScenes = new Set(
      sceneDevices.filter((sd) => sd.active).map((sd) => sd.device_address)
    );

    const filteredDevices = mappedDevices.filter(
      (device) =>
        devicesInGroups.has(device.address) ||
        devicesInScenes.has(device.address)
    );

    if (filteredDevices.length === 0) {
      throw new Error(
        "No devices found in any group or scene. Please assign devices to groups or scenes first."
      );
    }

    console.log(`Found ${mappedDevices.length} mapped device(s)`);
    console.log(
      `Found ${filteredDevices.length} device(s) in groups or scenes`
    );
    console.log(`Found ${sceneDevices.length} scene device configuration(s)`);
    console.log(`Found ${groupDevices.length} group device assignment(s)`);

    // Build configuration data
    // Max 16 devices per packet, each device = 20 bytes
    const configData = [];

    for (const device of filteredDevices.slice(0, 16)) {
      // Limit to 16 devices per packet
      const deviceConfig = buildDeviceConfig(
        device,
        sceneDevices,
        groupDevices
      );
      configData.push(...deviceConfig);
    }

    if (configData.length === 0) {
      throw new Error("No configuration data to send");
    }

    console.log(
      `Sending configuration for ${
        filteredDevices.slice(0, 16).length
      } device(s) (${configData.length} bytes)`
    );

    // Send DALI_CONFIG command
    const configResult = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.DALI_CONFIG,
      configData,
      false,
      false,
      60000 // 60 second timeout
    );

    console.log("Group & Scene configuration sent successfully");

    // Send APPLY_CONFIG command to apply the configuration
    console.log("Sending APPLY_CONFIG command...");
    const applyResult = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.APPLY_CONFIG,
      [0x00, 0x00], // 2 bytes of 0x00
      false,
      false,
      60000 // 60 second timeout
    );

    console.log("APPLY_CONFIG command sent successfully");

    return {
      success: configResult.success && applyResult.success,
      deviceCount: filteredDevices.slice(0, 16).length,
      totalBytes: configData.length,
    };
  } catch (error) {
    console.error("Send Group & Scene Config failed:", error);
    throw error;
  }
}

export {
  daliCommissioning,
  daliScan,
  daliBroadcastOn,
  daliBroadcastOff,
  triggerDaliDevice,
  triggerDaliGroup,
  triggerDaliScene,
  sendAddressMapping,
  sendGroupSceneConfig,
  daliEvents,
};
