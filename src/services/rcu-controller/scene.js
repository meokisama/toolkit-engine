import { UDP_PORT, PROTOCOL, isSendName } from "./constants.js";
import { validators } from "./validators.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";

// Scene Setup function
async function setupScene(unitIp, canId, sceneConfig) {
  const { sceneIndex, sceneName, sceneAddress, sceneItems } = sceneConfig;

  // Validations
  validators.sceneIndex(sceneIndex);

  if (isSendName && (!sceneName || sceneName.length > 15)) {
    throw new Error("Scene name must be provided and not exceed 15 characters");
  }

  if (!sceneAddress) {
    throw new Error("Scene address must be provided");
  }

  if (!Array.isArray(sceneItems)) {
    throw new Error("Scene items must be an array");
  }

  if (sceneItems.length > 85) {
    throw new Error("Too many scene items. Maximum is 85 items.");
  }

  const idAddress = convertCanIdToInt(canId);
  const data = [sceneIndex];

  // Scene name (15 bytes, null padded) - controlled by isSendName flag
  if (isSendName) {
    const nameBytes = Buffer.from(sceneName, "utf8");
    for (let i = 0; i < 15; i++) {
      data.push(i < nameBytes.length ? nameBytes[i] : 0x00);
    }
  }

  // Scene address and amount
  data.push(parseInt(sceneAddress) || 0, sceneItems.length);

  // 7 empty bytes
  data.push(...Array(7).fill(0x00));

  // Scene items (3 bytes per item)
  for (const item of sceneItems) {
    data.push(item.object_value || 0);
    data.push(parseInt(item.item_address) || 0);

    let itemValue = parseFloat(item.item_value) || 0;
    if (item.object_value === 1) {
      itemValue = Math.round((itemValue / 100) * 255); // LIGHTING
    } else if (item.object_value === 6) {
      itemValue = parseInt(itemValue) || 0; // AC_TEMPERATURE
    } else {
      itemValue = parseInt(itemValue) || 0; // Other types
    }
    data.push(itemValue);
  }

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.SETUP_SCENE,
    data
  );
}

// Get Scene Information function
async function getSceneInformation(unitIp, canId, sceneIndex) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Data is just the scene index (1 byte)
  const data = [sceneIndex];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCENE_INFOR,
    data,
    true // Skip status check for GET_SCENE_INFOR
  );

  const minResponseLength = isSendName ? 10 : 10; // Keep minimum at 10 for header + basic data
  if (response && response.msg && response.msg.length >= minResponseLength) {
    const data = response.msg.slice(8); // Skip header (4 bytes ID + 2 bytes length + 2 bytes cmd)

    const minDataLength = isSendName ? 18 : 3; // Adjust minimum data length based on isSendName
    if (data.length < minDataLength) {
      throw new Error(
        `Insufficient scene data: ${data.length} bytes (expected at least ${minDataLength})`
      );
    }

    // Parse scene information
    // Data structure: scene index, 15-byte name (if isSendName), address, item count, 7 empty bytes, then 3-byte items
    let offset = 0;
    const sceneIndex = data[offset++];

    let sceneName = "";
    if (isSendName) {
      const nameBytes = data.slice(offset, offset + 15);
      offset += 15;

      sceneName = String.fromCharCode(...nameBytes)
        .replace(/\0/g, "")
        .trim();
    }

    const sceneAddress = data[offset++];
    const itemCount = data[offset++];

    const items = [];
    const itemsStartIndex = offset + 7; // Skip 7 empty bytes

    for (
      let i = 0;
      i < itemCount && itemsStartIndex + i * 3 + 2 < data.length;
      i++
    ) {
      const itemIndex = itemsStartIndex + i * 3;
      items.push({
        objectValue: data[itemIndex],
        itemAddress: data[itemIndex + 1],
        itemValue: data[itemIndex + 2],
      });
    }

    return {
      sceneIndex,
      sceneName,
      sceneAddress,
      itemCount,
      items,
    };
  }

  throw new Error("Invalid response from get scene information command");
}

// Get All Scenes Information function
async function getAllScenesInformation(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for loading all scenes
  const data = [];

  const result = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCENE_INFOR,
    data,
    15000 // 15 second timeout
  );

  const { responses, successPacketReceived } = result;

  if (responses.length > 0) {
    const scenes = [];

    // Process each response (each response contains one scene)
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];

      if (response.result?.success && response.msg && response.msg.length > 0) {
        try {
          // Parse scene information from this response
          // Data structure: scene index, 15-byte name (if isSendName), address, item count, 7 empty bytes, then 3-byte items
          const data = response.msg.slice(8); // Skip header

          const minLength = isSendName ? 18 : 3; // Adjust minimum length based on isSendName
          if (data.length >= minLength) {
            let offset = 0;
            const sceneIndex = data[offset++];

            let sceneName = "";
            if (isSendName) {
              const nameBytes = data.slice(offset, offset + 15);
              offset += 15;

              sceneName = String.fromCharCode(...nameBytes)
                .replace(/\0/g, "")
                .trim();
            }

            const sceneAddress = data[offset++];
            const itemCount = data[offset++];

            // Only add scenes that have actual data (non-empty name or items)
            if (sceneName.length > 0 || itemCount > 0) {
              scenes.push({
                index: sceneIndex,
                name: sceneName || `Scene ${sceneIndex}`,
                address: sceneAddress,
                itemCount: itemCount,
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing scene response ${i + 1}:`, error);
        }
      }
    }

    return {
      result: { success: successPacketReceived },
      scenes: scenes,
      successPacketReceived: successPacketReceived,
      totalResponses: responses.length,
    };
  }

  throw new Error(
    "No valid responses received from get all scenes information command"
  );
}

// Trigger Scene function
async function triggerScene(unitIp, canId, sceneAddress) {
  const idAddress = convertCanIdToInt(canId);
  const triggerData = parseInt(sceneAddress);

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.TRIGGER_SCENE,
    [triggerData]
  );
}

export {
  setupScene,
  getSceneInformation,
  getAllScenesInformation,
  triggerScene,
};
