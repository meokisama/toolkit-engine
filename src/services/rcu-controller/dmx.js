import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt, parseResponse } from "./utils.js";
import { sendCommand } from "./command-sender.js";

/**
 * Parse color string "R,G,B,W" into array of bytes
 * @param {string} colorStr - Color string in format "R,G,B,W"
 * @returns {number[]} Array of 4 bytes [r, g, b, w]
 */
function parseColorString(colorStr) {
  if (!colorStr) {
    return [0, 0, 0, 0];
  }

  const parts = colorStr.split(",").map((v) => parseInt(v.trim(), 10));
  if (parts.length !== 4) {
    console.warn(`Invalid color format: ${colorStr}, using default [0,0,0,0]`);
    return [0, 0, 0, 0];
  }

  return parts.map((v) => (isNaN(v) ? 0 : Math.max(0, Math.min(255, v))));
}

/**
 * Build 66-byte data structure for a single DMX device
 * @param {object} dmxItem - DMX item with address and color1-color16 fields
 * @param {number} deviceIndex - Index of the device in the array
 * @returns {number[]} 66 bytes of data
 */
function buildDmxDeviceData(dmxItem, deviceIndex) {
  const data = [];

  // Byte 0: Device index
  data.push(deviceIndex & 0xff);

  // Bytes 1-64: 16 colors (4 bytes each: r,g,b,w)
  for (let i = 1; i <= 16; i++) {
    const colorField = `color${i}`;
    const colorBytes = parseColorString(dmxItem[colorField]);
    data.push(...colorBytes);
  }

  // Byte 65: Device address
  data.push(dmxItem.address & 0xff);

  return data;
}

/**
 * Set total number of DMX devices
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {number} deviceCount - Number of DMX devices
 * @returns {Promise<boolean>} Success status
 */
async function setTotalDmxDevice(unitIp, canId, deviceCount) {
  const idAddress = convertCanIdToInt(canId);

  // Data: [device_count, 0x00]
  const data = [deviceCount & 0xff, 0x00];

  console.log("Setting total DMX devices:", {
    unitIp,
    canId,
    deviceCount,
  });

  const response = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.DMX.CMD1, PROTOCOL.DMX.CMD2.SET_TOTAL_DMX_DEVICE, data);

  if (!parseResponse.success(response)) {
    throw new Error("Failed to set total DMX devices");
  }

  return true;
}

/**
 * Set DMX color configuration for one or more devices
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {object|object[]} dmxItems - Single DMX item or array of DMX items
 * @param {object} loggerService - Optional logger service for logging
 * @param {string} unitType - Type of unit (for logging)
 * @returns {Promise<boolean>} Success status
 */
async function setDmxColor(unitIp, canId, dmxItems, loggerService = null, unitType = "Unknown") {
  const idAddress = convertCanIdToInt(canId);

  // Ensure dmxItems is an array
  const items = Array.isArray(dmxItems) ? dmxItems : [dmxItems];

  if (items.length === 0) {
    throw new Error("No DMX items provided");
  }

  // Validate item count (max 15 devices per packet)
  if (items.length > 15) {
    throw new Error("Cannot send more than 15 DMX devices in a single packet");
  }

  try {
    // Step 1: Send SET_TOTAL_DMX_DEVICE command first
    await setTotalDmxDevice(unitIp, canId, items.length);

    // Step 2: Build data array (66 bytes per device)
    const data = [];
    items.forEach((item, index) => {
      const deviceData = buildDmxDeviceData(item, index);
      data.push(...deviceData);
    });

    console.log("Sending DMX color config:", {
      unitIp,
      canId,
      deviceCount: items.length,
      dataLength: data.length,
      expectedLength: items.length * 66,
    });

    // Step 3: Send SET_DMX_COLOR command
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.DMX.CMD1, PROTOCOL.DMX.CMD2.SET_DMX_COLOR, data);

    if (!parseResponse.success(response)) {
      const error = "Failed to set DMX color configuration";

      // Log error if logger service is available
      if (loggerService) {
        loggerService.logDmxSend("SET_COLOR", items, { ip_address: unitIp, id_can: canId, type: unitType }, false, error);
      }

      throw new Error(error);
    }

    // Log success if logger service is available
    if (loggerService) {
      loggerService.logDmxSend("SET_COLOR", items, { ip_address: unitIp, id_can: canId, type: unitType }, true);
    }

    return true;
  } catch (error) {
    // Log error if logger service is available
    if (loggerService) {
      loggerService.logDmxSend("SET_COLOR", items, { ip_address: unitIp, id_can: canId, type: unitType }, false, error.message);
    }

    throw error;
  }
}

/**
 * Set DMX color for multiple batches (splits into chunks of 15 devices)
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {object[]} dmxItems - Array of DMX items
 * @param {object} loggerService - Optional logger service
 * @param {string} unitType - Type of unit
 * @returns {Promise<object>} Result with success count and errors
 */
async function setDmxColorBatch(unitIp, canId, dmxItems, loggerService = null, unitType = "Unknown") {
  const BATCH_SIZE = 15;
  const results = {
    total: dmxItems.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Split items into batches of 15
  for (let i = 0; i < dmxItems.length; i += BATCH_SIZE) {
    const batch = dmxItems.slice(i, i + BATCH_SIZE);

    try {
      await setDmxColor(unitIp, canId, batch, loggerService, unitType);
      results.success += batch.length;
    } catch (error) {
      results.failed += batch.length;
      results.errors.push({
        batch: Math.floor(i / BATCH_SIZE) + 1,
        count: batch.length,
        error: error.message,
      });
      console.error(`Failed to send DMX batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
    }
  }

  return results;
}

export { setTotalDmxDevice, setDmxColor, setDmxColorBatch };
