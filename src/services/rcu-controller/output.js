import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

async function getOutputAssign(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_OUTPUT_ASSIGN,
    [], // No data for GET_OUTPUT_ASSIGN
    true // Skip status check for GET commands
  );

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

      outputAssignments.push({
        outputIndex: outputIndex,
        lightingAddress: lightingAddress,
        delayOff: delayOff, // in milliseconds or appropriate unit
        delayOn: delayOn, // in milliseconds or appropriate unit
        isAssigned: lightingAddress > 0, // Consider assigned if lighting address > 0
      });
    }

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

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_ASSIGN,
    data
  );
}
async function getOutputConfig(unitIp, canId, outputIndex) {
  const idAddress = convertCanIdToInt(canId);

  // Validate output index
  if (outputIndex < 0 || outputIndex > 255) {
    throw new Error("Output index must be between 0 and 255");
  }

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_OUTPUT_CONFIG,
    [outputIndex], // Send output index as data
    true // Skip status check for GET commands
  );

  if (response?.result?.success && response.result.data) {
    const data = response.result.data;
    const dataLength = data.length;

    console.log(`Received output config data: ${dataLength} bytes for output ${outputIndex}`);

    // Expected data structure (8 bytes):
    // Byte 0: Index của output
    // Byte 1: Min dimming level (raw value)
    // Byte 2: Max dimming level (raw value)
    // Byte 3: Auto trigger flag
    // Byte 4: Schedule ON hour
    // Byte 5: Schedule ON minute
    // Byte 6: Schedule OFF hour
    // Byte 7: Schedule OFF minute

    if (dataLength < 8) {
      throw new Error(`Invalid data length: expected 8 bytes, got ${dataLength} bytes`);
    }

    const outputConfig = {
      outputIndex: data[0],
      minDimmingLevel: data[1],
      maxDimmingLevel: data[2],
      autoTriggerFlag: data[3],
      scheduleOnHour: data[4],
      scheduleOnMinute: data[5],
      scheduleOffHour: data[6],
      scheduleOffMinute: data[7],
      // Additional computed properties
      isAutoTriggerEnabled: data[3] > 0,
      scheduleOnTime: `${data[4].toString().padStart(2, '0')}:${data[5].toString().padStart(2, '0')}`,
      scheduleOffTime: `${data[6].toString().padStart(2, '0')}:${data[7].toString().padStart(2, '0')}`,
    };

    return {
      success: true,
      outputConfig: outputConfig,
    };
  }

  throw new Error("Invalid response from get output config command");
}

async function setOutputConfig(unitIp, canId, outputIndex, config) {
  const idAddress = convertCanIdToInt(canId);

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

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_CONFIG,
    data
  );
}

export {
  getOutputAssign,
  setOutputAssign,
  getOutputConfig,
  setOutputConfig,
};
