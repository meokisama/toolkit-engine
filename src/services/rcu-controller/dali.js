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

  console.log(`Starting DALI ${extend ? "Extend" : "Reset"} Commissioning for ${unitIp} (${canId})`);

  // Track address conflicts
  const conflictAddresses = [];

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
      // Real-time packet handler for device count notification and address conflicts
      (msg, packetLength) => {
        const dataLength = packetLength - 4; // Exclude cmd1, cmd2, and CRC (2 bytes)

        if (dataLength === 2) {
          // Device count notification
          const oldDeviceCount = msg[8];
          const newDeviceCount = msg[9];
          console.log(`Device count notification: old=${oldDeviceCount}, new=${newDeviceCount}`);
          daliEvents.emit("deviceCountChanged", {
            unitIp,
            canId,
            oldDeviceCount,
            newDeviceCount,
          });
        } else if (dataLength === 4) {
          // Check for address conflict packet (FF FF FF XX)
          const byte0 = msg[8];
          const byte1 = msg[9];
          const byte2 = msg[10];
          const deviceAddress = msg[11];

          if (byte0 === 0xff && byte1 === 0xff && byte2 === 0xff) {
            console.log(`Address conflict detected: address ${deviceAddress}`);
            conflictAddresses.push(deviceAddress);
          }
        }
      }
    );

    console.log(`Commissioning completed: received ${result.responses.length} packet(s), success: ${result.successPacketReceived}`);

    // Filter out device count notification packets (2 bytes data) and conflict packets (4 bytes: FF FF FF XX) before parsing
    const deviceDataResponses = result.responses.filter((response) => {
      const { msg } = response;
      const packetLength = msg[4] | (msg[5] << 8);
      const dataLength = packetLength - 4;

      // Exclude device count notification packets
      if (dataLength === 2) {
        return false;
      }

      // Exclude address conflict packets
      if (dataLength === 4) {
        const byte0 = msg[8];
        const byte1 = msg[9];
        const byte2 = msg[10];
        if (byte0 === 0xff && byte1 === 0xff && byte2 === 0xff) {
          return false;
        }
      }

      return true;
    });

    // Parse devices from responses
    const devices = parseDaliResponse(deviceDataResponses);

    // Emit address conflict event if conflicts were detected
    if (conflictAddresses.length > 0) {
      console.log(`Found ${conflictAddresses.length} address conflict(s): ${conflictAddresses.join(", ")}`);
      daliEvents.emit("addressConflict", {
        unitIp,
        canId,
        conflictAddresses: [...new Set(conflictAddresses)], // Remove duplicates
      });
    }

    return {
      success: result.successPacketReceived,
      devices,
      packetsReceived: result.responses.length,
      conflictAddresses: [...new Set(conflictAddresses)], // Remove duplicates
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

  // Track address conflicts
  const conflictAddresses = [];

  try {
    // Send command and wait for up to 4 packets (3 minutes timeout)
    const result = await sendCommandMultipleResponses(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.DALI_SCAN,
      data,
      180000, // 3 minutes timeout
      null, // No keepalive needed for scan
      // Real-time packet handler for address conflicts
      (msg, packetLength) => {
        const dataLength = packetLength - 4; // Exclude cmd1, cmd2, and CRC (2 bytes)

        if (dataLength === 4) {
          // Check for address conflict packet (FF FF FF XX)
          const byte0 = msg[8];
          const byte1 = msg[9];
          const byte2 = msg[10];
          const deviceAddress = msg[11];

          if (byte0 === 0xff && byte1 === 0xff && byte2 === 0xff) {
            console.log(`Address conflict detected: address ${deviceAddress}`);
            conflictAddresses.push(deviceAddress);
          }
        }
      }
    );

    console.log(`Scan completed: received ${result.responses.length} packet(s), success: ${result.successPacketReceived}`);

    // Filter out address conflict packets (4 bytes: FF FF FF XX) before parsing
    const deviceDataResponses = result.responses.filter((response) => {
      const { msg } = response;
      const packetLength = msg[4] | (msg[5] << 8);
      const dataLength = packetLength - 4;

      // Exclude address conflict packets
      if (dataLength === 4) {
        const byte0 = msg[8];
        const byte1 = msg[9];
        const byte2 = msg[10];
        if (byte0 === 0xff && byte1 === 0xff && byte2 === 0xff) {
          return false;
        }
      }

      return true;
    });

    // Parse devices from responses
    const devices = parseDaliResponse(deviceDataResponses);

    // Emit address conflict event if conflicts were detected
    if (conflictAddresses.length > 0) {
      console.log(`Found ${conflictAddresses.length} address conflict(s): ${conflictAddresses.join(", ")}`);
      daliEvents.emit("addressConflict", {
        unitIp,
        canId,
        conflictAddresses: [...new Set(conflictAddresses)], // Remove duplicates
      });
    }

    return {
      success: result.successPacketReceived,
      devices,
      packetsReceived: result.responses.length,
      conflictAddresses: [...new Set(conflictAddresses)], // Remove duplicates
    };
  } catch (error) {
    console.error("DALI Scan failed:", error);
    throw error;
  }
}

/**
 * DALI Conflict Address Commissioning
 * Sends DALI_COMMISSIONING command for specific conflict addresses
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID (e.g., "12.43.3.3")
 * @param {Array<number>} conflictAddresses - Array of conflict addresses to fix
 * @returns {Promise<Object>} - Result with success status and fixed addresses
 */
async function daliConflictAddressCommissioning(unitIp, canId, conflictAddresses) {
  const idAddress = convertCanIdToInt(canId);

  if (!Array.isArray(conflictAddresses) || conflictAddresses.length === 0) {
    throw new Error("Conflict addresses array is required and cannot be empty");
  }

  console.log(`Starting DALI Conflict Address Commissioning for ${unitIp} (${canId})`);
  console.log(`Fixing ${conflictAddresses.length} conflict address(es)`);

  const results = [];

  try {
    // Send commissioning command for each conflict address
    for (const address of conflictAddresses) {
      console.log(`Sending commissioning command for address ${address}`);

      // Prepare data: address byte + 3 bytes of 0x00
      const data = [address, 0x00, 0x00, 0x00];

      try {
        const result = await sendCommand(
          unitIp,
          UDP_PORT,
          idAddress,
          CMD1,
          CMD2.DALI_COMMISSIONING,
          data,
          false,
          false,
          60000 // 60 second timeout
        );

        results.push({
          address,
          success: result.success,
        });

        console.log(`Commissioning for address ${address}: ${result.success ? "success" : "failed"}`);
      } catch (error) {
        console.error(`Failed to send commissioning command for address ${address}:`, error);
        results.push({
          address,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const allSuccess = successCount === conflictAddresses.length;

    console.log(`Conflict address commissioning completed: ${successCount}/${conflictAddresses.length} succeeded`);

    return {
      success: allSuccess,
      results,
      totalAddresses: conflictAddresses.length,
      successCount,
    };
  } catch (error) {
    console.error("DALI Conflict Address Commissioning failed:", error);
    throw error;
  }
}

/**
 * Broadcast ON to all DALI devices
 */
async function daliBroadcastOn(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  try {
    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.BROADCAST_ON, [0x00, 0x00]);

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
    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.BROADCAST_OFF, [0x00, 0x00]);

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
    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.TRIGGER_DALI_DEVICE, data);

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

  console.log(`Triggering DALI group ${groupId} to level ${level} for ${unitIp} (${canId})`);

  try {
    const data = [groupId, level, 0x00, 0x00];
    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.TRIGGER_DALI_GROUP, data);

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
    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.TRIGGER_DALI_SCENE, data);

    return result;
  } catch (error) {
    console.error("Trigger DALI scene failed:", error);
    throw error;
  }
}

/**
 * Trigger DALI Type 8 device with color/temperature control
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {number} deviceIndex - Device index (0-63)
 * @param {number} deviceAddress - Device address (0-63)
 * @param {number} colorFeature - Color feature (2, 3, or 4)
 * @param {number} brightness - Brightness level (0-254)
 * @param {Object} colorData - Color data object with different formats based on colorFeature:
 *   - colorFeature 2: { colorTemperature: number (1000-10000K) }
 *   - colorFeature 3: { r: number, g: number, b: number }
 *   - colorFeature 4: { r: number, g: number, b: number, w: number }
 */
async function triggerDaliType8Device(unitIp, canId, deviceIndex, deviceAddress, colorFeature, brightness, colorData) {
  const idAddress = convertCanIdToInt(canId);

  try {
    // Build 8-byte data array
    const data = new Array(8).fill(0x00);

    // Byte 0: index
    data[0] = deviceIndex;

    // Byte 1: address
    data[1] = deviceAddress;

    // Byte 2: colorFeature
    data[2] = colorFeature;

    // Bytes 3-6: color/temperature values (4 bytes total)
    if (colorFeature === 2) {
      // Color temperature: calculate 1000000 / Kelvin and store in first 2 bytes (little endian)
      const colorTempValue = Math.round(1000000 / colorData.colorTemperature);
      data[3] = colorTempValue & 0xff; // Low byte
      data[4] = (colorTempValue >> 8) & 0xff; // High byte
      // Bytes 5-6 remain 0x00
    } else if (colorFeature === 3) {
      // RGB: 3 bytes for R, G, B
      data[3] = colorData.r & 0xff;
      data[4] = colorData.g & 0xff;
      data[5] = colorData.b & 0xff;
      // Byte 6 remains 0x00
    } else if (colorFeature === 4) {
      // RGBW: 4 bytes for R, G, B, W
      data[3] = colorData.r & 0xff;
      data[4] = colorData.g & 0xff;
      data[5] = colorData.b & 0xff;
      data[6] = colorData.w & 0xff;
    }

    // Byte 7: brightness
    data[7] = brightness & 0xff;

    console.log("Type 8 trigger data:", data);

    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.TRIGGER_DALI_TYPE8, data);

    return result;
  } catch (error) {
    console.error("Trigger DALI Type 8 device failed:", error);
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
      throw new Error(`Invalid address at index ${i}: ${addressMapping[i]}. Must be between 0-63`);
    }
  }

  console.log(`Sending DALI Address Mapping for ${unitIp} (${canId})`);
  console.log("Address mapping:", addressMapping.join(","));

  try {
    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.MAPPING_ADDRESS, addressMapping, false, false, 60000);

    return result;
  } catch (error) {
    console.error("Send Address Mapping failed:", error);
    throw error;
  }
}

/**
 * Send DALI RCU Mapping
 * Sends 80 bytes: 64 bytes for device lighting_group_address + 16 bytes for group lighting_group_address
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {Array<number>} rcuMapping - Array of 80 bytes: [64 device RCU addresses, 16 group RCU addresses]
 * @returns {Promise<Object>} - Command result
 */
async function sendMappingRCU(unitIp, canId, rcuMapping) {
  const idAddress = convertCanIdToInt(canId);

  // Validate rcuMapping
  if (!Array.isArray(rcuMapping) || rcuMapping.length !== 80) {
    throw new Error("RCU mapping must be an array of exactly 80 bytes");
  }

  console.log(`Sending DALI RCU Mapping for ${unitIp} (${canId})`);
  console.log("Device RCU mapping (0-63):", rcuMapping.slice(0, 64).join(","));
  console.log("Group RCU mapping (0-15):", rcuMapping.slice(64, 80).join(","));

  try {
    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.MAPPING_RCU, rcuMapping, false, false, 60000);

    return result;
  } catch (error) {
    console.error("Send RCU Mapping failed:", error);
    throw error;
  }
}

/**
 * Reset All DALI Configuration
 * Sends RESET_ALL_CONFIG command to clear all DALI configurations
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @returns {Promise<Object>} - Command result
 */
async function resetAllConfig(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Sending RESET_ALL_CONFIG for ${unitIp} (${canId})`);

  try {
    const result = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      CMD1,
      CMD2.REST_ALL_CONFIG,
      [0x00, 0x00, 0x00, 0x00], // 4 bytes of 0x00
      false,
      false,
      60000
    );

    return result;
  } catch (error) {
    console.error("Reset All Config failed:", error);
    throw error;
  }
}

/**
 * Delete DALI Address
 * Sends DELETE_ADDRESS command to delete a specific address or all addresses
 * @param {string} unitIp - Target unit IP address
 * @param {string} canId - CAN ID
 * @param {number} address - Address to delete (0-63) or 0xFF to delete all
 * @returns {Promise<Object>} - Command result
 */
async function sendDeleteAddress(unitIp, canId, address) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Sending DELETE_ADDRESS for ${unitIp} (${canId}), address: ${address === 0xff ? "ALL (0xFF)" : address}`);

  try {
    // Data format: [address_byte, 0x00, 0x00, 0x00]
    const data = [address, 0x00, 0x00, 0x00];

    const result = await sendCommand(unitIp, UDP_PORT, idAddress, CMD1, CMD2.DELETE_ADDRESS, data, false, false, 60000);

    return result;
  } catch (error) {
    console.error("Delete Address failed:", error);
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
    const sceneDevice = sceneDevices.find((sd) => sd.scene_id === sceneId && sd.device_address === device.address && sd.active);
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

  try {
    // Get all devices with mappings from database
    const allDevices = await database.getAllDaliDevices(projectId);
    const mappedDevices = allDevices.filter((d) => d.mapped_device_index !== null && d.mapped_device_address !== null);

    if (mappedDevices.length === 0) {
      throw new Error("No mapped devices found. Please map devices first.");
    }

    // Get all scene device configurations
    const sceneDevices = await database.getAllDaliSceneDevices(projectId);

    // Get all group device relationships
    const groupDevices = await database.getAllDaliGroupDevices(projectId);

    // Filter to only include devices that are in at least one group or scene
    const devicesInGroups = new Set(groupDevices.map((gd) => gd.device_address));
    const devicesInScenes = new Set(sceneDevices.filter((sd) => sd.active).map((sd) => sd.device_address));

    const filteredDevices = mappedDevices.filter((device) => devicesInGroups.has(device.address) || devicesInScenes.has(device.address));

    if (filteredDevices.length === 0) {
      throw new Error("No devices found in any group or scene. Please assign devices to groups or scenes first.");
    }

    console.log(`Found ${mappedDevices.length} mapped device(s)`);
    console.log(`Found ${filteredDevices.length} device(s) in groups or scenes`);

    // Build configuration data
    // Split devices into batches of 16
    const DEVICES_PER_BATCH = 16;
    const batches = [];

    for (let i = 0; i < filteredDevices.length; i += DEVICES_PER_BATCH) {
      batches.push(filteredDevices.slice(i, i + DEVICES_PER_BATCH));
    }

    let totalBytesSent = 0;
    let allConfigResults = [];

    // Send configuration for each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const configData = [];

      for (const device of batch) {
        const deviceConfig = buildDeviceConfig(device, sceneDevices, groupDevices);
        configData.push(...deviceConfig);
      }

      if (configData.length === 0) {
        console.warn(`Batch ${batchIndex + 1} has no configuration data, skipping`);
        continue;
      }

      // Send DALI_CONFIG command for this batch
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

      allConfigResults.push(configResult);
      totalBytesSent += configData.length;

      console.log(`Batch ${batchIndex + 1}/${batches.length} sent successfully`);
    }

    console.log(`All ${batches.length} batch(es) sent successfully`);

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

    // ===== Process Device Type 8 Scene Configuration =====
    const type8Devices = mappedDevices.filter((d) => d.mapped_device_type === 8);

    if (type8Devices.length > 0) {
      console.log(`Found ${type8Devices.length} device(s) of type 8, building DT8 scene config...`);

      // Build array of device scene configurations (9 bytes each)
      const dt8SceneConfigs = [];

      // Iterate through all scenes (0-15) and all type 8 devices
      for (let sceneId = 0; sceneId < 16; sceneId++) {
        for (const device of type8Devices) {
          // Find scene device configuration for this device and scene
          const sceneDevice = sceneDevices.find((sd) => sd.scene_id === sceneId && sd.device_address === device.address && sd.active);

          if (sceneDevice) {
            // Build 9-byte configuration
            const config = [];

            // Byte 0: device index
            config.push(device.mapped_device_index);

            // Byte 1: device address
            config.push(device.mapped_device_address);

            // Byte 2: color feature
            const colorFeature = device.color_feature || 0;
            config.push(colorFeature);

            // Byte 3: scene id (0-15)
            config.push(sceneId);

            // Bytes 4-7: color/temperature values (4 bytes total)
            if (colorFeature === 2) {
              // Color temperature: calculate 1000000 / Kelvin and store in first 2 bytes (little endian)
              const colorTemp = sceneDevice.color_temp || 4000; // Default 4000K
              const colorTempValue = Math.round(1000000 / colorTemp);
              config.push(colorTempValue & 0xff); // Byte 4: Low byte
              config.push((colorTempValue >> 8) & 0xff); // Byte 5: High byte
              config.push(0x00); // Byte 6: unused
              config.push(0x00); // Byte 7: unused
            } else if (colorFeature === 3) {
              // RGB: 3 bytes for R, G, B
              config.push((sceneDevice.r || 0) & 0xff); // Byte 4: R
              config.push((sceneDevice.g || 0) & 0xff); // Byte 5: G
              config.push((sceneDevice.b || 0) & 0xff); // Byte 6: B
              config.push(0x00); // Byte 7: unused
            } else if (colorFeature === 4) {
              // RGBW: 4 bytes for R, G, B, W
              config.push((sceneDevice.r || 0) & 0xff); // Byte 4: R
              config.push((sceneDevice.g || 0) & 0xff); // Byte 5: G
              config.push((sceneDevice.b || 0) & 0xff); // Byte 6: B
              config.push((sceneDevice.w || 0) & 0xff); // Byte 7: W
            } else {
              // Unknown color feature, fill with zeros
              config.push(0x00, 0x00, 0x00, 0x00);
            }

            // Byte 8: brightness
            config.push(sceneDevice.brightness);

            dt8SceneConfigs.push(config);
          }
        }
      }

      if (dt8SceneConfigs.length > 0) {
        console.log(`Built ${dt8SceneConfigs.length} DT8 scene configuration(s)`);

        // Split into batches of 16 device scenes (144 bytes per batch)
        const DT8_SCENES_PER_BATCH = 16;
        const dt8Batches = [];

        for (let i = 0; i < dt8SceneConfigs.length; i += DT8_SCENES_PER_BATCH) {
          dt8Batches.push(dt8SceneConfigs.slice(i, i + DT8_SCENES_PER_BATCH));
        }

        // Send APPLY_DT8_SCENE command for each batch
        let dt8BatchResults = [];
        for (let batchIndex = 0; batchIndex < dt8Batches.length; batchIndex++) {
          const batch = dt8Batches[batchIndex];
          const dt8Data = [];

          // Flatten batch (each config is 9 bytes)
          for (const config of batch) {
            dt8Data.push(...config);
          }

          console.log(`Sending DT8 batch ${batchIndex + 1}/${dt8Batches.length} (${batch.length} device scene(s), ${dt8Data.length} bytes)...`);

          const dt8Result = await sendCommand(
            unitIp,
            UDP_PORT,
            idAddress,
            CMD1,
            CMD2.APPLY_DT8_SCENE,
            dt8Data,
            false,
            false,
            60000 // 60 second timeout
          );

          dt8BatchResults.push(dt8Result);

          console.log(`DT8 batch ${batchIndex + 1}/${dt8Batches.length} sent successfully`);
        }

        console.log(`All ${dt8Batches.length} DT8 batch(es) sent successfully`);

        // Check if all DT8 batches were successful
        const allDt8BatchesSuccessful = dt8BatchResults.every((result) => result.success);

        // Check if all batches (both DT6 and DT8) were successful
        const allBatchesSuccessful = allConfigResults.every((result) => result.success);

        return {
          success: allBatchesSuccessful && applyResult.success && allDt8BatchesSuccessful,
          deviceCount: filteredDevices.length,
          batchCount: batches.length,
          totalBytes: totalBytesSent,
          dt8DeviceCount: type8Devices.length,
          dt8SceneCount: dt8SceneConfigs.length,
          dt8BatchCount: dt8Batches.length,
        };
      } else {
        console.log("No active DT8 scene configurations found, skipping");
      }
    } else {
      console.log("No device type 8 found, skipping DT8 scene config");
    }

    // Check if all batches were successful
    const allBatchesSuccessful = allConfigResults.every((result) => result.success);

    return {
      success: allBatchesSuccessful && applyResult.success,
      deviceCount: filteredDevices.length,
      batchCount: batches.length,
      totalBytes: totalBytesSent,
    };
  } catch (error) {
    console.error("Send Group & Scene Config failed:", error);
    throw error;
  }
}

export {
  daliCommissioning,
  daliScan,
  daliConflictAddressCommissioning,
  daliBroadcastOn,
  daliBroadcastOff,
  triggerDaliDevice,
  triggerDaliGroup,
  triggerDaliScene,
  triggerDaliType8Device,
  sendAddressMapping,
  sendMappingRCU,
  sendGroupSceneConfig,
  resetAllConfig,
  sendDeleteAddress,
  daliEvents,
};
