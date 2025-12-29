import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt, parseResponse } from "./utils.js";
import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";

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
 * @param {number} totalDeviceCount - Total number of DMX devices in database
 * @returns {Promise<boolean>} Success status
 */
async function setDmxColor(unitIp, canId, dmxItems, totalDeviceCount = 0) {
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

  // Step 1: Send SET_TOTAL_DMX_DEVICE command first with TOTAL count from database
  await setTotalDmxDevice(unitIp, canId, totalDeviceCount);

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
    throw new Error("Failed to set DMX color configuration");
  }

  return true;
}

/**
 * Set DMX color for multiple batches (splits into chunks of 15 devices)
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {object[]} dmxItems - Array of DMX items
 * @param {number} totalDeviceCount - Total number of DMX devices in database
 * @returns {Promise<object>} Result with success count and errors
 */
async function setDmxColorBatch(unitIp, canId, dmxItems, totalDeviceCount = 0) {
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
      await setDmxColor(unitIp, canId, batch, totalDeviceCount);
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

/**
 * Parse DMX color data from response package
 * @param {Buffer} packageData - Package data buffer
 * @returns {object} Parsed package with devices array
 */
function parseDmxColorPackage(packageData) {
  const packageIndex = packageData[0];
  const deviceCount = packageData[1];

  const devices = [];

  // Each device is 64 bytes (16 colors x 4 bytes)
  for (let i = 0; i < deviceCount; i++) {
    const offset = 2 + (i * 64);
    const colors = [];

    // Parse 16 colors for this device
    for (let j = 0; j < 16; j++) {
      const colorOffset = offset + (j * 4);
      const r = packageData[colorOffset];
      const g = packageData[colorOffset + 1];
      const b = packageData[colorOffset + 2];
      const w = packageData[colorOffset + 3];

      colors.push({
        r,
        g,
        b,
        w,
        colorString: `${r},${g},${b},${w}`
      });
    }

    devices.push({
      deviceIndex: packageIndex * 16 + i,
      colors
    });
  }

  return {
    packageIndex,
    deviceCount,
    devices
  };
}

/**
 * Get DMX color configuration from unit
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @returns {Promise<object[]>} Array of DMX devices with color configurations
 */
async function getDmxColor(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  // Data: 2 bytes [0x00, 0x00]
  const data = [0x00, 0x00];

  console.log("Getting DMX color configuration:", {
    unitIp,
    canId,
  });

  // Use sendCommandMultipleResponses to receive up to 4 packages
  const { responses } = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.DMX.CMD1,
    PROTOCOL.DMX.CMD2.GET_DMX_COLOR,
    data,
    10000 // 10 second timeout to receive all packages
  );

  if (!responses || responses.length === 0) {
    throw new Error("No response received from unit");
  }

  console.log(`Received ${responses.length} packages from unit`);

  // Parse all packages and combine devices
  const allDevices = [];

  for (const packageResponse of responses) {
    try {
      // Extract data from response
      const msg = packageResponse.msg;
      const packetLength = msg[4] | (msg[5] << 8);
      const dataSection = msg.slice(8, 8 + packetLength - 4); // Exclude cmd1, cmd2, and CRC

      const packageData = parseDmxColorPackage(dataSection);
      allDevices.push(...packageData.devices);

      console.log(`Package ${packageData.packageIndex}: ${packageData.deviceCount} devices`);
    } catch (error) {
      console.warn("Failed to parse package, skipping:", error);
    }
  }

  console.log(`Parsed ${allDevices.length} DMX devices from unit`);

  return allDevices;
}

export { setTotalDmxDevice, setDmxColor, setDmxColorBatch, getDmxColor };
