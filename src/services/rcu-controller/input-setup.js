import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

/**
 * Calculate the data size for a single input configuration
 * @param {Object} inputConfig - Input configuration object
 * @returns {number} Size in bytes
 */
function calculateInputConfigSize(inputConfig) {
  const isKeyCard = inputConfig.inputType === 4;
  const groups = inputConfig.groups || [];

  // Fixed fields: 39 bytes (input number, type, ramp, preset, LED, auto mode, auto time, delays, group count)
  const fixedSize = 39;

  // Group data: 2 bytes per group (groupId + presetBrightness)
  const groupSize = isKeyCard ? 40 : groups.length * 2; // Key Card always has 20 groups = 40 bytes

  return fixedSize + groupSize;
}

/**
 * Build data array for a single input configuration
 * @param {Object} inputConfig - Input configuration object
 * @returns {Array<number>} Data array
 */
function buildInputConfigData(inputConfig) {
  const data = [];

  // Convert all input values to integers to ensure proper data types
  const inputNumber = parseInt(inputConfig.inputNumber) || 0;
  const inputType = parseInt(inputConfig.inputType) || 0;
  const ramp = parseInt(inputConfig.ramp) ?? 0;
  const preset = parseInt(inputConfig.preset) ?? 255;
  const ledStatus = parseInt(inputConfig.ledStatus) || 0;
  const autoMode = inputConfig.autoMode ? 1 : 0; // Boolean conversion

  // Byte 0 - Input number (0-based)
  data.push(inputNumber);

  // Byte 1 - Input type
  data.push(inputType);

  // Byte 2 - Ramp
  data.push(ramp);

  // Byte 3 - Preset
  data.push(preset);

  // Byte 4 - LED Status (calculated from display mode and flags)
  data.push(ledStatus);

  // Byte 5 - Auto Mode
  data.push(autoMode);

  // Bytes 6-33 - Auto Time (28 bytes, not supported, default 0)
  for (let i = 0; i < 28; i++) {
    data.push(0);
  }

  // Bytes 34-35 - Delay Off (2 bytes, little endian)
  const delayOff = parseInt(inputConfig.delayOff) || 0;
  data.push(delayOff & 0xff);
  data.push((delayOff >> 8) & 0xff);

  // Bytes 36-37 - Delay On (2 bytes, not supported, default 0)
  data.push(0);
  data.push(0);

  // Byte 38 - Number of groups
  const groups = inputConfig.groups || [];
  const isKeyCard = inputConfig.inputType === 4;
  const groupCount = isKeyCard ? 20 : groups.length;
  data.push(groupCount);

  // Group data (2 bytes per group: Group ID + Preset brightness)
  if (isKeyCard) {
    // Key Card always has 20 groups
    for (let i = 0; i < 20; i++) {
      if (i < groups.length && groups[i]) {
        data.push(parseInt(groups[i].groupId) || 0);
        data.push(parseInt(groups[i].presetBrightness) || 0);
      } else {
        data.push(0); // Group ID 0 = unused
        data.push(0); // Preset brightness
      }
    }
  } else {
    // Regular input with actual group count
    for (let i = 0; i < groups.length; i++) {
      data.push(parseInt(groups[i].groupId) || 0);
      data.push(parseInt(groups[i].presetBrightness) || 0);
    }
  }

  return data;
}

/**
 * Group input configs into batches that don't exceed maxBytes
 * @param {Array<Object>} inputConfigs - Array of input configuration objects
 * @param {number} maxBytes - Maximum bytes per batch (default: 900)
 * @returns {Array<Array<Object>>} Array of batches
 */
function groupInputConfigsIntoBatches(inputConfigs, maxBytes = 900) {
  const batches = [];
  let currentBatch = [];
  let currentBatchSize = 0;

  for (const config of inputConfigs) {
    const configSize = calculateInputConfigSize(config);

    // If adding this config would exceed the limit, start a new batch
    if (currentBatchSize + configSize > maxBytes && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBatchSize = 0;
    }

    // Add config to current batch
    currentBatch.push(config);
    currentBatchSize += configSize;
  }

  // Add the last batch if not empty
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

// Setup Input Configuration function (single input)
async function setupInputConfig(unitIp, canId, inputConfig) {
  const idAddress = convertCanIdToInt(canId);

  // Build data array using the helper function
  const data = buildInputConfigData(inputConfig);

  try {
    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.LIGHTING.CMD1,
      PROTOCOL.LIGHTING.CMD2.SETUP_INPUT,
      data,
      false
    );

    console.log(
      `Input ${inputConfig.inputNumber} configuration sent successfully`
    );
    return response;
  } catch (error) {
    console.error(
      `Failed to setup input ${inputConfig.inputNumber} config:`,
      error
    );
    throw error;
  }
}

/**
 * Setup multiple input configurations in batches (optimized for speed)
 * Groups configs into batches that don't exceed maxBytes and sends them together
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {Array<Object>} inputConfigs - Array of input configuration objects
 * @param {number} maxBytes - Maximum bytes per batch (default: 900)
 * @returns {Promise<Object>} Result with success/fail counts
 */
async function setupBatchInputConfigs(unitIp, canId, inputConfigs, maxBytes = 900) {
  const idAddress = convertCanIdToInt(canId);

  // Group configs into batches
  const batches = groupInputConfigsIntoBatches(inputConfigs, maxBytes);

  console.log(
    `Sending ${inputConfigs.length} input configs in ${batches.length} batch(es)`
  );

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  // Send each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchData = [];

    // Concatenate all input config data in this batch: [input0][input1][input2]...
    for (const config of batch) {
      const configData = buildInputConfigData(config);
      batchData.push(...configData);
    }

    try {
      await sendCommand(
        unitIp,
        UDP_PORT,
        idAddress,
        PROTOCOL.LIGHTING.CMD1,
        PROTOCOL.LIGHTING.CMD2.SETUP_INPUT,
        batchData,
        false
      );

      successCount += batch.length;
      console.log(
        `Batch ${batchIndex + 1}/${batches.length}: Sent ${batch.length} input config(s) successfully (${batchData.length} bytes)`
      );
    } catch (error) {
      failCount += batch.length;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        batchIndex: batchIndex,
        inputIndices: batch.map((c) => c.inputNumber),
        error: errorMessage,
      });
      console.error(
        `Batch ${batchIndex + 1}/${batches.length} failed:`,
        errorMessage
      );
    }
  }

  return {
    success: failCount === 0,
    successCount,
    failCount,
    totalBatches: batches.length,
    errors,
  };
}

export { setupInputConfig, setupBatchInputConfigs };
