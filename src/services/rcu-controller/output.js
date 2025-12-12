import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

async function getOutputAssign(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Getting output assignments from unit ${unitIp} (CAN ID: ${canId})`);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_OUTPUT_ASSIGN,
    [], // No data for GET_OUTPUT_ASSIGN
    true // Skip status check for GET commands
  );

  // Add delay after GET command to prevent auto refresh conflicts
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (response?.result?.success && response.result.data) {
    const data = response.result.data;
    const dataLength = data.length;

    console.log(`Received output assignment data: ${dataLength} bytes`);

    // Each output assignment is 6 bytes:
    // 1 byte: output index
    // 1 byte: lighting address assigned to this output
    // 2 bytes: delay off (little endian)
    // 2 bytes: delay on (little endian)
    const outputAssignments = [];

    if (dataLength % 6 !== 0) {
      console.warn(`Warning: Data length ${dataLength} is not divisible by 6. Some data may be incomplete.`);
    }

    const assignmentCount = Math.floor(dataLength / 6);

    for (let i = 0; i < assignmentCount; i++) {
      const offset = i * 6;

      const outputIndex = data[offset];
      const lightingAddress = data[offset + 1];
      const delayOff = data[offset + 2] | (data[offset + 3] << 8); // Little endian
      const delayOn = data[offset + 4] | (data[offset + 5] << 8); // Little endian

      const assignment = {
        outputIndex: outputIndex,
        lightingAddress: lightingAddress,
        delayOff: delayOff, // in seconds
        delayOn: delayOn, // in seconds
        isAssigned: lightingAddress > 0, // Consider assigned if lighting address > 0
      };

      outputAssignments.push(assignment);
    }

    console.log(`Successfully parsed ${assignmentCount} output assignments`);
    return {
      success: true,
      assignmentCount: assignmentCount,
      outputAssignments: outputAssignments,
    };
  }

  throw new Error("Invalid response from get output assignment command");
}

async function setOutputAssign(unitIp, canId, outputIndex, lightingAddress) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting output assignment: Output ${outputIndex} -> Address ${lightingAddress}`);

  // Validate parameters
  if (outputIndex < 0 || outputIndex > 255) {
    throw new Error("Output index must be between 0 and 255");
  }

  if (lightingAddress < 0 || lightingAddress > 255) {
    throw new Error("Lighting address must be between 0 and 255");
  }

  // Prepare data: 2 bytes per assignment (only index and address)
  const data = [outputIndex, lightingAddress];

  const result = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_ASSIGN, data);

  await new Promise((resolve) => setTimeout(resolve, 500));

  return result;
}

async function setAllOutputAssignments(unitIp, canId, outputAssignments) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting all output assignments in bulk:`, outputAssignments);

  // Validate parameters
  if (!Array.isArray(outputAssignments)) {
    throw new Error("Output assignments must be an array");
  }

  if (outputAssignments.length === 0) {
    console.log("No output assignments to set");
    return { success: true };
  }

  // Prepare data: 2 bytes per assignment (index, address)
  const data = [];

  for (let i = 0; i < outputAssignments.length; i++) {
    const lightingAddress = outputAssignments[i];

    // Validate lighting address
    if (lightingAddress < 0 || lightingAddress > 255) {
      throw new Error(`Lighting address at index ${i} must be between 0 and 255`);
    }

    // Add output index and lighting address
    data.push(i); // Output index (0-based)
    data.push(lightingAddress); // Lighting address
  }

  console.log(`Sending bulk assignment data: [${data.join(",")}]`);

  const result = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_ASSIGN, data);

  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`Bulk output assignment command completed for ${outputAssignments.length} outputs`);
  return result;
}

async function setOutputDelayOff(unitIp, canId, outputIndex, delayOff) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting output delay off: Output ${outputIndex} -> DelayOff: ${delayOff}s`);

  // Validate parameters
  if (outputIndex < 0 || outputIndex > 255) {
    throw new Error("Output index must be between 0 and 255");
  }

  if (delayOff < 0 || delayOff > 65535) {
    throw new Error("Delay off must be between 0 and 65535");
  }

  // Prepare data: 3 bytes (index + 2 bytes delay time)
  const data = [
    outputIndex,
    delayOff & 0xff, // Low byte of delay off
    (delayOff >> 8) & 0xff, // High byte of delay off
  ];

  const result = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_DELAY_OFF, data);

  await new Promise((resolve) => setTimeout(resolve, 500));

  return result;
}

async function setOutputDelayOn(unitIp, canId, outputIndex, delayOn) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting output delay on: Output ${outputIndex} -> DelayOn: ${delayOn}s`);

  // Validate parameters
  if (outputIndex < 0 || outputIndex > 255) {
    throw new Error("Output index must be between 0 and 255");
  }

  if (delayOn < 0 || delayOn > 65535) {
    throw new Error("Delay on must be between 0 and 65535");
  }

  // Prepare data: 3 bytes (index + 2 bytes delay time)
  const data = [
    outputIndex,
    delayOn & 0xff, // Low byte of delay on
    (delayOn >> 8) & 0xff, // High byte of delay on
  ];

  const result = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_DELAY_ON, data);

  await new Promise((resolve) => setTimeout(resolve, 500));

  return result;
}
async function getOutputConfig(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Getting output config from unit ${unitIp} (CAN ID: ${canId})`);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_OUTPUT_CONFIG,
    [], // No data needed - get all outputs
    true // Skip status check for GET commands
  );

  // Add delay after GET command to prevent auto refresh conflicts
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (response?.result?.success && response.result.data) {
    const data = response.result.data;
    const dataLength = data.length;

    console.log(`Received output config data: ${dataLength} bytes`);

    // Each output config is 8 bytes:
    // Byte 0: Index của output
    // Byte 1: Min dimming level (raw value)
    // Byte 2: Max dimming level (raw value)
    // Byte 3: Auto trigger flag
    // Byte 4: Schedule ON hour
    // Byte 5: Schedule ON minute
    // Byte 6: Schedule OFF hour
    // Byte 7: Schedule OFF minute
    const outputConfigs = [];

    if (dataLength % 8 !== 0) {
      console.warn(`Warning: Data length ${dataLength} is not divisible by 8. Some data may be incomplete.`);
    }

    const configCount = Math.floor(dataLength / 8);

    for (let i = 0; i < configCount; i++) {
      const offset = i * 8;

      const outputIndex = data[offset];
      const minDimmingLevel = data[offset + 1];
      const maxDimmingLevel = data[offset + 2];
      const autoTriggerFlag = data[offset + 3];
      const scheduleOnHour = data[offset + 4];
      const scheduleOnMinute = data[offset + 5];
      const scheduleOffHour = data[offset + 6];
      const scheduleOffMinute = data[offset + 7];

      outputConfigs.push({
        outputIndex: outputIndex,
        minDimmingLevel: minDimmingLevel,
        maxDimmingLevel: maxDimmingLevel,
        autoTriggerFlag: autoTriggerFlag,
        scheduleOnHour: scheduleOnHour,
        scheduleOnMinute: scheduleOnMinute,
        scheduleOffHour: scheduleOffHour,
        scheduleOffMinute: scheduleOffMinute,
        // Additional computed properties
        isAutoTriggerEnabled: autoTriggerFlag > 0,
        scheduleOnTime: `${scheduleOnHour.toString().padStart(2, "0")}:${scheduleOnMinute.toString().padStart(2, "0")}`,
        scheduleOffTime: `${scheduleOffHour.toString().padStart(2, "0")}:${scheduleOffMinute.toString().padStart(2, "0")}`,
      });
    }

    console.log(`Successfully parsed ${configCount} output configs`);
    return {
      success: true,
      configCount: configCount,
      outputConfigs: outputConfigs,
    };
  }

  throw new Error("Invalid response from get output config command");
}

async function setOutputConfig(unitIp, canId, outputIndex, config) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting output config: Output ${outputIndex}`, config);

  // Validate parameters
  if (outputIndex < 0 || outputIndex > 255) {
    throw new Error("Output index must be between 0 and 255");
  }

  const { minDimmingLevel, maxDimmingLevel, autoTriggerFlag, scheduleOnHour, scheduleOnMinute, scheduleOffHour, scheduleOffMinute } = config;

  // Validate dimming levels
  if (minDimmingLevel < 0 || minDimmingLevel > 255) {
    throw new Error("Min dimming level must be between 0 and 255");
  }
  if (maxDimmingLevel < 0 || maxDimmingLevel > 255) {
    throw new Error("Max dimming level must be between 0 and 255");
  }
  if (minDimmingLevel > maxDimmingLevel) {
    throw new Error("Min dimming level cannot be greater than max dimming level");
  }

  // Validate auto trigger flag
  if (autoTriggerFlag < 0 || autoTriggerFlag > 255) {
    throw new Error("Auto trigger flag must be between 0 and 255");
  }

  // Validate schedule times
  if (scheduleOnHour < 0 || scheduleOnHour > 23) {
    throw new Error("Schedule ON hour must be between 0 and 23");
  }
  if (scheduleOnMinute < 0 || scheduleOnMinute > 59) {
    throw new Error("Schedule ON minute must be between 0 and 59");
  }
  if (scheduleOffHour < 0 || scheduleOffHour > 23) {
    throw new Error("Schedule OFF hour must be between 0 and 23");
  }
  if (scheduleOffMinute < 0 || scheduleOffMinute > 59) {
    throw new Error("Schedule OFF minute must be between 0 and 59");
  }

  // Prepare data: 8 bytes
  const data = [outputIndex, minDimmingLevel, maxDimmingLevel, autoTriggerFlag, scheduleOnHour, scheduleOnMinute, scheduleOffHour, scheduleOffMinute];

  const result = await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_CONFIG, data);

  // Add delay after SET command to allow unit to process
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`Output config command completed for output ${outputIndex}`);
  return result;
}

/**
 * Set multiple output delay off values in batch
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {Array<{outputIndex: number, delayOff: number}>} delayOffConfigs - Array of delay off configs
 * @param {number} maxBytes - Maximum bytes per batch (default: 900)
 * @returns {Promise<Object>} Result with success/fail counts
 */
async function setBatchOutputDelayOff(unitIp, canId, delayOffConfigs, maxBytes = 900) {
  const idAddress = convertCanIdToInt(canId);

  // Each delay off config is 3 bytes: outputIndex (1) + delayOff (2 bytes little endian)
  const bytesPerConfig = 3;
  const maxConfigsPerBatch = Math.floor(maxBytes / bytesPerConfig);

  // Split into batches
  const batches = [];
  for (let i = 0; i < delayOffConfigs.length; i += maxConfigsPerBatch) {
    batches.push(delayOffConfigs.slice(i, i + maxConfigsPerBatch));
  }

  console.log(`Sending ${delayOffConfigs.length} delay off configs in ${batches.length} batch(es)`);

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const data = [];

    // Build data: [index1, delayOff1_low, delayOff1_high, index2, delayOff2_low, delayOff2_high, ...]
    for (const config of batch) {
      data.push(config.outputIndex);
      data.push(config.delayOff & 0xff); // Low byte
      data.push((config.delayOff >> 8) & 0xff); // High byte
    }

    try {
      await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_DELAY_OFF, data);

      successCount += batch.length;
      console.log(`Batch ${batchIndex + 1}/${batches.length}: Sent ${batch.length} delay off config(s) successfully`);
    } catch (error) {
      failCount += batch.length;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        batchIndex: batchIndex,
        outputIndices: batch.map((c) => c.outputIndex),
        error: errorMessage,
      });
      console.error(`Batch ${batchIndex + 1}/${batches.length} failed:`, errorMessage);
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

/**
 * Set multiple output delay on values in batch
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {Array<{outputIndex: number, delayOn: number}>} delayOnConfigs - Array of delay on configs
 * @param {number} maxBytes - Maximum bytes per batch (default: 900)
 * @returns {Promise<Object>} Result with success/fail counts
 */
async function setBatchOutputDelayOn(unitIp, canId, delayOnConfigs, maxBytes = 900) {
  const idAddress = convertCanIdToInt(canId);

  // Each delay on config is 3 bytes: outputIndex (1) + delayOn (2 bytes little endian)
  const bytesPerConfig = 3;
  const maxConfigsPerBatch = Math.floor(maxBytes / bytesPerConfig);

  // Split into batches
  const batches = [];
  for (let i = 0; i < delayOnConfigs.length; i += maxConfigsPerBatch) {
    batches.push(delayOnConfigs.slice(i, i + maxConfigsPerBatch));
  }

  console.log(`Sending ${delayOnConfigs.length} delay on configs in ${batches.length} batch(es)`);

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const data = [];

    // Build data: [index1, delayOn1_low, delayOn1_high, index2, delayOn2_low, delayOn2_high, ...]
    for (const config of batch) {
      data.push(config.outputIndex);
      data.push(config.delayOn & 0xff); // Low byte
      data.push((config.delayOn >> 8) & 0xff); // High byte
    }

    try {
      await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_DELAY_ON, data);

      successCount += batch.length;
      console.log(`Batch ${batchIndex + 1}/${batches.length}: Sent ${batch.length} delay on config(s) successfully`);
    } catch (error) {
      failCount += batch.length;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        batchIndex: batchIndex,
        outputIndices: batch.map((c) => c.outputIndex),
        error: errorMessage,
      });
      console.error(`Batch ${batchIndex + 1}/${batches.length} failed:`, errorMessage);
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

/**
 * Set multiple output configs in batch
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {Array<Object>} outputConfigs - Array of output config objects
 * @param {number} maxBytes - Maximum bytes per batch (default: 900)
 * @returns {Promise<Object>} Result with success/fail counts
 */
async function setBatchOutputConfigs(unitIp, canId, outputConfigs, maxBytes = 900) {
  const idAddress = convertCanIdToInt(canId);

  // Each output config is 8 bytes
  const bytesPerConfig = 8;
  const maxConfigsPerBatch = Math.floor(maxBytes / bytesPerConfig);

  // Split into batches
  const batches = [];
  for (let i = 0; i < outputConfigs.length; i += maxConfigsPerBatch) {
    batches.push(outputConfigs.slice(i, i + maxConfigsPerBatch));
  }

  console.log(`Sending ${outputConfigs.length} output configs in ${batches.length} batch(es)`);

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const data = [];

    // Build data: [config1_8bytes][config2_8bytes]...
    for (const config of batch) {
      data.push(config.outputIndex);
      data.push(config.minDimmingLevel);
      data.push(config.maxDimmingLevel);
      data.push(config.autoTriggerFlag);
      data.push(config.scheduleOnHour);
      data.push(config.scheduleOnMinute);
      data.push(config.scheduleOffHour);
      data.push(config.scheduleOffMinute);
    }

    try {
      await sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_CONFIG, data);

      successCount += batch.length;
      console.log(`Batch ${batchIndex + 1}/${batches.length}: Sent ${batch.length} output config(s) successfully (${data.length} bytes)`);
    } catch (error) {
      failCount += batch.length;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        batchIndex: batchIndex,
        outputIndices: batch.map((c) => c.outputIndex),
        error: errorMessage,
      });
      console.error(`Batch ${batchIndex + 1}/${batches.length} failed:`, errorMessage);
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

/**
 * Set all output configurations in batches (comprehensive function)
 * Handles assignments, delays, and configs in optimized batches
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {Array<Object>} lightingOutputs - Array of output objects with all config data
 * @param {number} maxBytes - Maximum bytes per batch (default: 900)
 * @returns {Promise<Object>} Comprehensive result
 */
async function setupBatchLightingOutputs(unitIp, canId, lightingOutputs, maxBytes = 900) {
  console.log(`Setting up ${lightingOutputs.length} lighting outputs in batch mode`);

  const results = {
    assignments: null,
    delayOff: null,
    delayOn: null,
    configs: null,
    overallSuccess: true,
  };

  // 1. Set all output assignments (addresses) in one batch
  try {
    const assignments = lightingOutputs.map((output) => output.lightingAddress || 0);
    await setAllOutputAssignments(unitIp, canId, assignments);
    results.assignments = { success: true, count: assignments.length };
    console.log(`✓ Set ${assignments.length} output assignments successfully`);
  } catch (error) {
    results.assignments = { success: false, error: error.message };
    results.overallSuccess = false;
    console.error("✗ Failed to set output assignments:", error);
  }

  // 2. Set delay off values in batches
  try {
    const delayOffConfigs = lightingOutputs.map((output) => ({
      outputIndex: output.index,
      delayOff: output.delayOff ?? 0,
    }));
    results.delayOff = await setBatchOutputDelayOff(unitIp, canId, delayOffConfigs, maxBytes);
    if (!results.delayOff.success) results.overallSuccess = false;
    console.log(`✓ Set ${results.delayOff.successCount}/${delayOffConfigs.length} delay off values`);
  } catch (error) {
    results.delayOff = { success: false, error: error.message };
    results.overallSuccess = false;
    console.error("✗ Failed to set delay off values:", error);
  }

  // 3. Set delay on values in batches
  try {
    const delayOnConfigs = lightingOutputs.map((output) => ({
      outputIndex: output.index,
      delayOn: output.delayOn ?? 0,
    }));
    results.delayOn = await setBatchOutputDelayOn(unitIp, canId, delayOnConfigs, maxBytes);
    if (!results.delayOn.success) results.overallSuccess = false;
    console.log(`✓ Set ${results.delayOn.successCount}/${delayOnConfigs.length} delay on values`);
  } catch (error) {
    results.delayOn = { success: false, error: error.message };
    results.overallSuccess = false;
    console.error("✗ Failed to set delay on values:", error);
  }

  // 4. Set output configs (minDim, maxDim, autoTrigger, schedule) in batches
  try {
    const outputConfigs = lightingOutputs.map((output) => ({
      outputIndex: output.index,
      minDimmingLevel: output.minDim ?? 1,
      maxDimmingLevel: output.maxDim ?? 100,
      autoTriggerFlag: output.autoTrigger ? 1 : 0,
      scheduleOnHour: output.scheduleOnHour ?? 0,
      scheduleOnMinute: output.scheduleOnMinute ?? 0,
      scheduleOffHour: output.scheduleOffHour ?? 0,
      scheduleOffMinute: output.scheduleOffMinute ?? 0,
    }));
    results.configs = await setBatchOutputConfigs(unitIp, canId, outputConfigs, maxBytes);
    if (!results.configs.success) results.overallSuccess = false;
    console.log(`✓ Set ${results.configs.successCount}/${outputConfigs.length} output configs`);
  } catch (error) {
    results.configs = { success: false, error: error.message };
    results.overallSuccess = false;
    console.error("✗ Failed to set output configs:", error);
  }

  return results;
}

export {
  getOutputAssign,
  setOutputAssign,
  setAllOutputAssignments,
  setOutputDelayOff,
  setOutputDelayOn,
  getOutputConfig,
  setOutputConfig,
  setBatchOutputDelayOff,
  setBatchOutputDelayOn,
  setBatchOutputConfigs,
  setupBatchLightingOutputs,
};
