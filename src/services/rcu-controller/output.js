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
  await new Promise(resolve => setTimeout(resolve, 300));

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

      // Special attention to output index 0
      if (outputIndex === 0) {
        console.log(`🚨 CRITICAL: Output index 0 (first output) - Address: ${lightingAddress}, DelayOff: ${delayOff}s, DelayOn: ${delayOn}s`);
      }

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

async function setOutputAssign(unitIp, canId, outputIndex, lightingAddress, delayOff = 0, delayOn = 0) {
  const idAddress = convertCanIdToInt(canId);

  console.log(`Setting output assignment: Output ${outputIndex} -> Address ${lightingAddress}, DelayOff: ${delayOff}s, DelayOn: ${delayOn}s`);

  // Validate parameters
  if (outputIndex < 0 || outputIndex > 255) {
    throw new Error("Output index must be between 0 and 255");
  }

  if (lightingAddress < 0 || lightingAddress > 255) {
    throw new Error("Lighting address must be between 0 and 255");
  }

  if (delayOff < 0 || delayOff > 65535) {
    throw new Error("Delay off must be between 0 and 65535");
  }

  if (delayOn < 0 || delayOn > 65535) {
    throw new Error("Delay on must be between 0 and 65535");
  }

  // Prepare data: 6 bytes per assignment
  const data = [
    outputIndex,
    lightingAddress,
    delayOff & 0xFF,        // Low byte of delay off
    (delayOff >> 8) & 0xFF, // High byte of delay off
    delayOn & 0xFF,         // Low byte of delay on
    (delayOn >> 8) & 0xFF   // High byte of delay on
  ];

  console.log(`📤 SET_OUTPUT_ASSIGN data bytes: [${data.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}]`);

  // Special attention to output index 0
  if (outputIndex === 0) {
    console.log(`🚨 CRITICAL: Setting output index 0 (first output) - Address: ${lightingAddress}`);
  }

  const result = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_ASSIGN,
    data
  );

  // Add delay after SET command to allow unit to process - CRITICAL for output assignment
  await new Promise(resolve => setTimeout(resolve, 500));

  // WORKAROUND: Send command twice for output index 0 due to firmware bug
  if (outputIndex === 0) {
    console.log(`🔄 WORKAROUND: Sending output 0 assignment command again due to firmware bug`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between commands

    const result2 = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.LIGHTING.CMD1,
      PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_ASSIGN,
      data
    );

    await new Promise(resolve => setTimeout(resolve, 500)); // Extra delay for output 0
    console.log(`🔄 WORKAROUND: Second command sent for output 0`);
  }

  console.log(`Output assignment command completed for output ${outputIndex}`);
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
  await new Promise(resolve => setTimeout(resolve, 300));

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
        scheduleOnTime: `${scheduleOnHour.toString().padStart(2, '0')}:${scheduleOnMinute.toString().padStart(2, '0')}`,
        scheduleOffTime: `${scheduleOffHour.toString().padStart(2, '0')}:${scheduleOffMinute.toString().padStart(2, '0')}`,
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

  const {
    minDimmingLevel,
    maxDimmingLevel,
    autoTriggerFlag,
    scheduleOnHour,
    scheduleOnMinute,
    scheduleOffHour,
    scheduleOffMinute
  } = config;

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
  const data = [
    outputIndex,
    minDimmingLevel,
    maxDimmingLevel,
    autoTriggerFlag,
    scheduleOnHour,
    scheduleOnMinute,
    scheduleOffHour,
    scheduleOffMinute
  ];

  const result = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_CONFIG,
    data
  );

  // Add delay after SET command to allow unit to process
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`Output config command completed for output ${outputIndex}`);
  return result;
}

export {
  getOutputAssign,
  setOutputAssign,
  getOutputConfig,
  setOutputConfig,
};
