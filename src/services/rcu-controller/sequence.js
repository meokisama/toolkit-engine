import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";
import { convertCanIdToInt } from "./utils.js";
import { validators } from "./validators.js";
import { PROTOCOL,UDP_PORT } from "./constants.js";

// Get Sequence Information function
async function getSequenceInformation(unitIp, canId, sequenceIndex = null) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Prepare data parameter
  const data = [];
  if (sequenceIndex !== null) {
    validators.sequenceIndex(sequenceIndex);
    data.push(parseInt(sequenceIndex));
  }
  // If sequenceIndex is null, send empty data to get all sequences

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SEQUENCE,
    data,
    true // Skip status check for GET_SEQUENCE
  );

  if (!response || !response.result) {
    throw new Error("No response received from get sequence information command");
  }

  const { msg } = response;
  const sequences = [];

  // Parse response data
  let offset = 8; // Skip header
  while (offset < msg.length) {
    try {
      // Check if we have enough bytes for sequence header
      if (offset + 4 > msg.length) break;

      const sequence = {
        index: msg[offset],
        address: msg[offset + 1],
        reserved1: msg[offset + 2],
        reserved2: msg[offset + 3],
      };

      offset += 4;

      // Check if we have enough bytes for amount
      if (offset >= msg.length) break;

      const amount = msg[offset];
      sequence.amount = amount;
      offset += 1;

      // Read multi-scene addresses
      sequence.multiSceneAddresses = [];
      for (let i = 0; i < amount && offset < msg.length; i++) {
        sequence.multiSceneAddresses.push(msg[offset]);
        offset += 1;
      }

      sequences.push(sequence);

      // If we requested a specific sequence, break after finding it
      if (sequenceIndex !== null && sequence.index === sequenceIndex) {
        break;
      }
    } catch (error) {
      console.error("Error parsing sequence data:", error);
      break;
    }
  }

  return {
    result: { success: true },
    sequences: sequences,
  };
}

// Get All Sequences Information function
async function getAllSequencesInformation(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  const { responses, successPacketReceived } = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SEQUENCE,
    [], // Empty data to get all sequences
    15000 // 15 second timeout
  );

  if (responses.length > 0) {
    const sequences = [];

    // Process all responses
    for (const response of responses) {
      const { msg } = response;
      
      // Parse response data
      let offset = 8; // Skip header
      while (offset < msg.length) {
        try {
          // Check if we have enough bytes for sequence header
          if (offset + 4 > msg.length) break;

          const sequence = {
            index: msg[offset],
            address: msg[offset + 1],
            reserved1: msg[offset + 2],
            reserved2: msg[offset + 3],
          };

          offset += 4;

          // Check if we have enough bytes for amount
          if (offset >= msg.length) break;

          const amount = msg[offset];
          sequence.amount = amount;
          offset += 1;

          // Read multi-scene addresses
          sequence.multiSceneAddresses = [];
          for (let i = 0; i < amount && offset < msg.length; i++) {
            sequence.multiSceneAddresses.push(msg[offset]);
            offset += 1;
          }

          sequences.push(sequence);
        } catch (error) {
          console.error("Error parsing sequence data:", error);
          break;
        }
      }
    }

    return {
      result: { success: successPacketReceived },
      sequences: sequences,
      successPacketReceived: successPacketReceived,
      totalResponses: responses.length,
    };
  }

  throw new Error(
    "No valid responses received from get all sequences information command"
  );
}

// Setup Sequence function
async function setupSequence(unitIp, canId, sequenceConfig) {
  const {
    sequenceIndex,
    sequenceAddress,
    multiSceneAddresses = [],
  } = sequenceConfig;

  // Validate inputs
  validators.sequenceIndex(sequenceIndex);
  validators.sequenceAddress(sequenceAddress);

  if (!Array.isArray(multiSceneAddresses)) {
    throw new Error("Multi-scene addresses must be an array");
  }

  if (multiSceneAddresses.length > 20) {
    throw new Error("Maximum 20 multi-scenes allowed per sequence");
  }

  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Prepare data array
  const data = [];

  // 1 byte index
  data.push(parseInt(sequenceIndex) || 0);

  // 1 byte address
  data.push(parseInt(sequenceAddress) || 0);

  // 2 byte reserved (0x00)
  data.push(...Array(2).fill(0x00));

  // 1 byte amount (total number of multi-scene addresses)
  data.push(multiSceneAddresses.length);

  // Multi-scene addresses (1 byte each)
  for (const address of multiSceneAddresses) {
    data.push(parseInt(address) || 0);
  }

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SEQUENCE,
    data
  );
}

// Trigger Sequence function
async function triggerSequence(unitIp, canId, sequenceAddress) {
  const idAddress = convertCanIdToInt(canId);
  const triggerData = parseInt(sequenceAddress);

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.TRIGGER_SEQUENCE,
    [triggerData]
  );
}

export {
  setupSequence,
  getSequenceInformation,
  getAllSequencesInformation,
  triggerSequence,
};
