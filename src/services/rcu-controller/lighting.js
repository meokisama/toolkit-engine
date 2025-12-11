import { UDP_PORT, PROTOCOL } from "./constants.js";
import { parseResponse } from "./utils.js";
import { validators } from "./validators.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

// Generic lighting command helper
async function sendLightingCommand(unitIp, canId, cmd2, data) {
  const idAddress = convertCanIdToInt(canId);
  return sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, cmd2, data);
}

async function setGroupState(unitIp, canId, group, value) {
  validators.group(group);
  validators.value(value);
  return sendLightingCommand(unitIp, canId, PROTOCOL.LIGHTING.CMD2.SET_GROUP_STATE, [group, value]);
}

async function setOutputState(unitIp, canId, outputIndex, value) {
  validators.outputIndex(outputIndex);
  validators.value(value);
  return sendLightingCommand(unitIp, canId, PROTOCOL.LIGHTING.CMD2.SET_OUTPUT_STATE, [outputIndex, value]);
}

async function setInputState(unitIp, canId, inputIndex, value) {
  validators.outputIndex(inputIndex); // Use same validator for input index
  validators.value(value);
  return sendLightingCommand(unitIp, canId, PROTOCOL.LIGHTING.CMD2.SET_INPUT_STATE, [inputIndex, value]);
}

async function setMultipleGroupStates(unitIp, canId, groupSettings) {
  if (!Array.isArray(groupSettings) || groupSettings.length === 0) {
    throw new Error("Invalid input. Provide an array of [group, value] pairs");
  }

  const data = [];
  for (const pair of groupSettings) {
    if (Array.isArray(pair) && pair.length === 2) {
      const [group, value] = pair;
      if (group >= 1 && group <= 255 && value >= 0 && value <= 255) {
        data.push(group, value);
      }
    }
  }

  if (data.length === 0) {
    throw new Error("No valid groups to set");
  }

  return sendLightingCommand(unitIp, canId, PROTOCOL.LIGHTING.CMD2.SET_GROUP_STATE, data);
}

async function getAllGroupStates(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_GROUP_STATE,
    [], // No data for GET_GROUP_STATE
    true // Skip status check for GET commands
  );
}

async function getAllOutputStates(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_OUTPUT_STATE,
    [], // No data for GET_OUTPUT_STATE
    true // Skip status check for GET commands
  );

  if (response && response.msg && response.msg.length >= 8) {
    const data = response.msg.slice(8); // Skip header
    const length = response.msg[4] | (response.msg[5] << 8);
    const dataLength = length - 4; // Exclude cmd1, cmd2, and CRC

    console.log("Output states response:", {
      totalLength: response.msg.length,
      dataLength: dataLength,
      outputCount: dataLength,
      data: Array.from(data.slice(0, dataLength))
        .map((b) => b.toString())
        .join(", "),
    });

    // Each byte represents the brightness value of one output channel
    // Starting from output 0, each output has 1 byte brightness value
    const outputStates = [];
    for (let i = 0; i < dataLength; i++) {
      outputStates.push({
        outputIndex: i,
        brightness: data[i], // 0-255 brightness value
        isActive: data[i] > 0, // Consider output active if brightness > 0
      });
    }

    return {
      success: true,
      outputCount: dataLength,
      outputStates: outputStates,
    };
  }

  throw new Error("Invalid response from get output states command");
}

// Get Input States function - returns brightness values for all inputs
async function getAllInputStates(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LIGHTING.CMD1,
    PROTOCOL.LIGHTING.CMD2.GET_INPUT_STATE,
    [], // No data for GET_INPUT_STATE
    true // Skip status check for GET commands
  );

  if (response && response.msg && response.msg.length >= 8) {
    const data = response.msg.slice(8); // Skip header
    const length = response.msg[4] | (response.msg[5] << 8);
    const dataLength = length - 4; // Exclude cmd1, cmd2, and CRC

    console.log("Input states response:", {
      totalLength: response.msg.length,
      dataLength: dataLength,
      inputCount: dataLength,
      data: Array.from(data.slice(0, dataLength))
        .map((b) => b.toString())
        .join(", "),
    });

    // Each byte represents the brightness value of one input channel
    // Starting from input 0, each input has 1 byte brightness value
    const inputStates = [];
    for (let i = 0; i < dataLength; i++) {
      inputStates.push({
        inputIndex: i,
        brightness: data[i], // 0-255 brightness value
        isActive: data[i] > 0, // Consider input active if brightness > 0
      });
    }

    return {
      success: true,
      inputCount: dataLength,
      inputStates: inputStates,
    };
  }

  throw new Error("Invalid response from get input states command");
}

export { setGroupState, setOutputState, setInputState, setMultipleGroupStates, getAllGroupStates, getAllOutputStates, getAllInputStates };
