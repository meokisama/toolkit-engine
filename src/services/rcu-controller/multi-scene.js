import { UDP_PORT, PROTOCOL, isSendName } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";
import { validators } from "./validators.js";

// Get Multi-Scene Information function
async function getMultiSceneInformation(unitIp, canId, multiSceneIndex = null) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Prepare data parameter
  const data = [];
  if (multiSceneIndex !== null) {
    validators.multiSceneIndex(multiSceneIndex);
    data.push(parseInt(multiSceneIndex));
  }
  // If multiSceneIndex is null, send empty data to get all multi-scenes

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_MULTI_SCENE,
    data,
    true // Skip status check for GET_MULTI_SCENE
  );

  if (response && response.msg) {
    const data = response.msg.slice(8); // Skip header

    const minLength = isSendName ? 24 : 9; // Adjust minimum length based on isSendName
    if (data.length < minLength) {
      throw new Error(
        `Insufficient multi-scene data: ${data.length} bytes (expected at least ${minLength})`
      );
    }

    // Parse multi-scene data structure:
    // 1 byte index
    // 15 bytes name (if isSendName is true)
    // 1 byte address
    // 1 byte type
    // 5 bytes reserved
    // 1 byte amount (number of scene addresses)
    // N bytes scene addresses (1 byte each)

    let offset = 0;
    const index = data[offset++];

    let multiSceneName = "";
    if (isSendName) {
      const nameBytes = data.slice(offset, offset + 15);
      offset += 15;

      // Convert name bytes to string (remove null terminators)
      for (let i = 0; i < nameBytes.length; i++) {
        if (nameBytes[i] === 0) break;
        multiSceneName += String.fromCharCode(nameBytes[i]);
      }
    }

    const address = data[offset++];
    const type = data[offset++];
    // Skip 5 reserved bytes
    offset += 5;
    const amount = data[offset++];

    // Extract scene addresses
    const sceneAddresses = [];
    for (let i = 0; i < amount && i < data.length - offset; i++) {
      sceneAddresses.push(data[offset + i]);
    }

    return {
      multiSceneIndex: index,
      multiSceneName: multiSceneName || `Multi-Scene ${index}`,
      multiSceneAddress: address,
      multiSceneType: type,
      sceneCount: amount,
      sceneAddresses: sceneAddresses,
    };
  }

  throw new Error(
    "No response received from get multi-scene information command"
  );
}

// Trigger Multi-Scene function
async function triggerMultiScene(unitIp, canId, multiSceneAddress) {
  const idAddress = convertCanIdToInt(canId);
  const triggerData = parseInt(multiSceneAddress);

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.TRIGGER_MULTI_SCENE,
    [triggerData]
  );
}

// Setup Multi-Scene function
async function setupMultiScene(unitIp, canId, multiSceneConfig) {
  const {
    multiSceneIndex,
    multiSceneName,
    multiSceneAddress,
    multiSceneType,
    sceneAddresses,
  } = multiSceneConfig;

  // Validations
  if (multiSceneIndex < 0 || multiSceneIndex > 39) {
    throw new Error("Multi-scene index must be between 0 and 39");
  }

  if (isSendName && (!multiSceneName || multiSceneName.length > 15)) {
    throw new Error(
      "Multi-scene name must be provided and not exceed 15 characters"
    );
  }

  if (!multiSceneAddress) {
    throw new Error("Multi-scene address must be provided");
  }

  if (!Array.isArray(sceneAddresses)) {
    throw new Error("Scene addresses must be an array");
  }

  if (sceneAddresses.length > 20) {
    throw new Error("Maximum 20 scene addresses allowed per multi-scene");
  }

  const idAddress = convertCanIdToInt(canId);
  const data = [];

  // 1 byte index
  data.push(multiSceneIndex);

  // 15 byte name (pad with 0x00 if shorter) - controlled by isSendName flag
  if (isSendName) {
    const nameBytes = Array(15).fill(0x00);
    for (let i = 0; i < Math.min(multiSceneName.length, 15); i++) {
      nameBytes[i] = multiSceneName.charCodeAt(i);
    }
    data.push(...nameBytes);
  }

  // 1 byte address
  data.push(parseInt(multiSceneAddress) || 0);

  // 1 byte type
  data.push(parseInt(multiSceneType) || 0);

  // 5 byte reserved (0x00)
  data.push(...Array(5).fill(0x00));

  // 1 byte amount (total number of scene addresses)
  data.push(sceneAddresses.length);

  // Scene addresses (1 byte each)
  for (const address of sceneAddresses) {
    data.push(parseInt(address) || 0);
  }

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_MULTI_SCENE,
    data
  );
}

// Get All Multi-Scenes Information function
async function getAllMultiScenesInformation(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for loading all multi-scenes
  const data = [];

  const result = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_MULTI_SCENE,
    data,
    15000 // 15 second timeout
  );

  if (result && result.responses && result.responses.length > 0) {
    const multiScenes = [];
    let successPacketReceived = false;

    for (let i = 0; i < result.responses.length; i++) {
      const response = result.responses[i];
      if (response && response.msg) {
        try {
          const msg = response.msg;

          // Check for success packet (indicates end of data)
          if (msg.length >= 10) {
            // Success packet format: <ID><length><cmd1><cmd2><0x00><crc>
            const packetLength = msg[4] | (msg[5] << 8);
            const dataSection = msg.slice(8, 8 + packetLength - 4);
            const isSuccessPacket =
              packetLength === 5 &&
              dataSection.length === 1 &&
              dataSection[0] === 0x00;

            if (isSuccessPacket) {
              successPacketReceived = true;
              console.log(
                `Success packet received for multi-scene response ${i + 1}`
              );
              continue;
            }
          }

          // Parse multi-scene data
          const data = msg.slice(8);
          const minLength = isSendName ? 24 : 9; // Adjust minimum length based on isSendName
          if (data.length >= minLength) {
            let offset = 0;
            const index = data[offset++];

            let multiSceneName = "";
            if (isSendName) {
              const nameBytes = data.slice(offset, offset + 15);
              offset += 15;

              // Convert name bytes to string
              for (let j = 0; j < nameBytes.length; j++) {
                if (nameBytes[j] === 0) break;
                multiSceneName += String.fromCharCode(nameBytes[j]);
              }
            }

            const address = data[offset++];
            const type = data[offset++];
            // Skip 5 reserved bytes
            offset += 5;
            const amount = data[offset++];

            // Extract scene addresses
            const sceneAddresses = [];
            for (let j = 0; j < amount && j < data.length - offset; j++) {
              sceneAddresses.push(data[offset + j]);
            }

            multiScenes.push({
              multiSceneIndex: index,
              multiSceneName: multiSceneName || `Multi-Scene ${index}`,
              multiSceneAddress: address,
              multiSceneType: type,
              sceneCount: amount,
              sceneAddresses: sceneAddresses,
            });
          }
        } catch (error) {
          console.error(`Error parsing multi-scene response ${i + 1}:`, error);
        }
      }
    }

    return {
      result: { success: successPacketReceived },
      multiScenes: multiScenes,
      successPacketReceived: successPacketReceived,
      totalResponses: result.responses.length,
    };
  }

  throw new Error(
    "No valid responses received from get all multi-scenes information command"
  );
}

export {
  getMultiSceneInformation,
  triggerMultiScene,
  setupMultiScene,
  getAllMultiScenesInformation,
};
