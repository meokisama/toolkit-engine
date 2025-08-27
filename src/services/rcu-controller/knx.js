import { UDP_PORT, PROTOCOL } from "./constants.js";
import { validators } from "./validators.js";
import { convertCanIdToInt, convertKnxAddressToHex, parseResponse } from "./utils.js";
import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";

// Trigger KNX function
async function triggerKnx(unitIp, canId, knxAddress) {
  const idAddress = convertCanIdToInt(canId);
  const triggerData = parseInt(knxAddress);

  console.log("Triggering KNX:", {
    unitIp,
    canId,
    knxAddress,
    triggerData,
  });

  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.KNX.CMD1,
    PROTOCOL.KNX.CMD2.SET_KNX_OUT,
    [triggerData]
  );
}

// Set KNX Configuration function
async function setKnxConfig(unitIp, canId, knxConfig, loggerService = null, unitType = "Unknown") {
  const {
    address,
    type,
    factor,
    feedback,
    rcuGroup,
    knxSwitchGroup,
    knxDimmingGroup,
    knxValueGroup,
  } = knxConfig;

  // Validations
  validators.knxAddress(address);

  if (type < 0 || type > 11) {
    throw new Error("KNX type must be between 0 and 11");
  }

  if (factor < 1) {
    throw new Error("Factor must be greater than or equal to 1");
  }

  if (feedback < 0 || feedback > 2) {
    throw new Error("KNX feedback must be between 0 and 2");
  }

  if (rcuGroup < 0 || rcuGroup > 255) {
    throw new Error("RCU group must be between 0 and 255");
  }

  const idAddress = convertCanIdToInt(canId);

  // Convert KNX addresses from a/b/c format to 2-byte hex
  const switchGroupBytes = convertKnxAddressToHex(knxSwitchGroup);
  const dimmingGroupBytes = convertKnxAddressToHex(knxDimmingGroup);
  const valueGroupBytes = convertKnxAddressToHex(knxValueGroup);

  const data = [
    address & 0xff, // KNX Address low byte
    (address >> 8) & 0xff, // KNX Address high byte
    type & 0xff, // Type (1 byte)
    factor & 0xff, // Factor (1 byte)
    feedback & 0xff, // FeedBack (1 byte)
    0x00, // memValueFlag (1 byte, always 0x00)
    0x00, // Reserve (1 byte, always 0x00)
    rcuGroup & 0xff, // rcu_group_value (1 byte)
    switchGroupBytes[0], // KNX switch group low byte
    switchGroupBytes[1], // KNX switch group high byte
    dimmingGroupBytes[0], // KNX dimming group low byte
    dimmingGroupBytes[1], // KNX dimming group high byte
    valueGroupBytes[0], // KNX value group low byte
    valueGroupBytes[1], // KNX value group high byte
  ];

  console.log("Sending KNX config:", {
    unitIp,
    canId,
    ...knxConfig,
    dataLength: data.length,
    switchGroupHex: `0x${switchGroupBytes[1]
      .toString(16)
      .padStart(2, "0")}${switchGroupBytes[0].toString(16).padStart(2, "0")}`,
    dimmingGroupHex: `0x${dimmingGroupBytes[1]
      .toString(16)
      .padStart(2, "0")}${dimmingGroupBytes[0].toString(16).padStart(2, "0")}`,
    valueGroupHex: `0x${valueGroupBytes[1]
      .toString(16)
      .padStart(2, "0")}${valueGroupBytes[0].toString(16).padStart(2, "0")}`,
  });

  try {
    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.KNX.CMD1,
      PROTOCOL.KNX.CMD2.SET_KNX_OUT_CONFIG,
      data
    );

    if (!parseResponse.success(response)) {
      const error = "Failed to set KNX configuration";

      // Log error if logger service is available
      if (loggerService) {
        loggerService.logKnxSend(
          'SET_CONFIG',
          knxConfig,
          { ip_address: unitIp, id_can: canId, type: unitType },
          false,
          error
        );
      }

      throw new Error(error);
    }

    // Log success if logger service is available
    if (loggerService) {
      loggerService.logKnxSend(
        'SET_CONFIG',
        knxConfig,
        { ip_address: unitIp, id_can: canId, type: unitType },
        true
      );
    }

    return true;
  } catch (error) {
    // Log error if logger service is available
    if (loggerService) {
      loggerService.logKnxSend(
        'SET_CONFIG',
        knxConfig,
        { ip_address: unitIp, id_can: canId, type: unitType },
        false,
        error.message
      );
    }

    throw error;
  }
}

// Get KNX Configuration function
async function getKnxConfig(unitIp, canId, knxAddress = null) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Data is KNX address (2 bytes) if specified, empty for all KNX configs
  let data = [];
  if (knxAddress !== null) {
    validators.knxAddress(knxAddress);
    data = [knxAddress & 0xff, (knxAddress >> 8) & 0xff];
  }

  console.log("Getting KNX config:", {
    unitIp,
    canId,
    knxAddress,
    dataLength: data.length,
  });

  if (knxAddress !== null) {
    // Get single KNX configuration
    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.KNX.CMD1,
      PROTOCOL.KNX.CMD2.GET_KNX_OUT_CONFIG,
      data,
      true // Skip status check for GET commands
    );

    if (response && response.msg && response.msg.length >= 10) {
      const responseData = response.msg.slice(8); // Skip header
      console.log(
        "Single KNX response data:",
        Array.from(responseData)
          .map((b) => "0x" + b.toString(16).padStart(2, "0"))
          .join(" ")
      );
      const result = parseKnxConfigResponse(responseData);
      console.log("Parsed single KNX config:", result);
      return result;
    }

    throw new Error("Failed to get KNX configuration");
  } else {
    // Get all KNX configurations
    const result = await sendCommandMultipleResponses(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.KNX.CMD1,
      PROTOCOL.KNX.CMD2.GET_KNX_OUT_CONFIG,
      data,
      15000 // 15 second timeout
    );

    console.log("Get all KNX result:", {
      hasResult: !!result,
      hasResponses: !!(result && result.responses),
      responseCount: result?.responses?.length || 0,
      successPacketReceived: result?.successPacketReceived,
    });

    if (result && result.responses && result.responses.length > 0) {
      const knxConfigs = [];

      console.log(`Processing ${result.responses.length} KNX responses`);

      for (let i = 0; i < result.responses.length; i++) {
        const response = result.responses[i];
        try {
          if (response && response.msg && response.msg.length >= 10) {
            const responseData = response.msg.slice(8); // Skip header
            console.log(
              `KNX response ${i + 1} data:`,
              Array.from(responseData)
                .map((b) => "0x" + b.toString(16).padStart(2, "0"))
                .join(" ")
            );
            const knxConfig = parseKnxConfigResponse(responseData);
            if (knxConfig) {
              console.log(`Parsed KNX config ${i + 1}:`, knxConfig);
              knxConfigs.push(knxConfig);
            } else {
              console.log(`Failed to parse KNX config ${i + 1}`);
            }
          } else {
            console.log(
              `Invalid response ${i + 1}:`,
              response ? `msg length: ${response.msg?.length}` : "null response"
            );
          }
        } catch (error) {
          console.error(`Error parsing KNX response ${i + 1}:`, error);
        }
      }

      console.log(`Total KNX configs parsed: ${knxConfigs.length}`);
      return {
        result: { success: result.successPacketReceived },
        knxConfigs: knxConfigs,
        successPacketReceived: result.successPacketReceived,
        totalResponses: result.responses.length,
      };
    }

    throw new Error(
      "No valid responses received from get KNX configuration command"
    );
  }
}

// Helper function to parse KNX configuration response
function parseKnxConfigResponse(data) {
  if (!data || data.length < 14) {
    console.warn("Invalid KNX config response data length:", data?.length);
    return null;
  }

  try {
    // Parse KNX address from 2 bytes (little endian)
    const addressLow = data[0];
    const addressHigh = data[1];
    const address = (addressHigh << 8) | addressLow;

    const type = data[2];
    const factor = data[3];
    const feedback = data[4];
    const memValueFlag = data[5]; // Should be 0x00
    const reserve = data[6]; // Should be 0x00
    const rcuGroup = data[7];

    // Parse KNX group addresses (2 bytes each, little endian)
    const switchGroupLow = data[8];
    const switchGroupHigh = data[9];
    const dimmingGroupLow = data[10];
    const dimmingGroupHigh = data[11];
    const valueGroupLow = data[12];
    const valueGroupHigh = data[13];

    // Convert 2-byte hex back to a/b/c format
    const convertHexToKnxAddress = (lowByte, highByte) => {
      const combined = (highByte << 8) | lowByte;
      if (combined === 0) return ""; // Empty address

      const area = (combined >> 11) & 0x1f; // 5 bits
      const line = (combined >> 8) & 0x07; // 3 bits
      const device = combined & 0xff; // 8 bits

      return `${area}/${line}/${device}`;
    };

    const knxSwitchGroup = convertHexToKnxAddress(
      switchGroupLow,
      switchGroupHigh
    );
    const knxDimmingGroup = convertHexToKnxAddress(
      dimmingGroupLow,
      dimmingGroupHigh
    );
    const knxValueGroup = convertHexToKnxAddress(valueGroupLow, valueGroupHigh);

    return {
      address,
      type,
      factor,
      feedback,
      memValueFlag,
      reserve,
      rcuGroup,
      knxSwitchGroup,
      knxDimmingGroup,
      knxValueGroup,
    };
  } catch (error) {
    console.error("Error parsing KNX config response:", error);
    return null;
  }
}

// Delete KNX Configuration function
async function deleteKnxConfig(unitIp, canId, knxAddress = null) {
  const idAddress = convertCanIdToInt(canId);
  const data = [];

  if (knxAddress !== null && knxAddress !== undefined) {
    validators.knxAddress(knxAddress);
    data.push(knxAddress & 0xff, (knxAddress >> 8) & 0xff);
  }

  console.log("Deleting KNX config:", { unitIp, canId, knxAddress });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.KNX.CMD1,
    PROTOCOL.KNX.CMD2.CLEAR_KNX,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to delete KNX configuration");
  }

  return true;
}

// Delete All KNX Configurations function
async function deleteAllKnxConfigs(unitIp, canId) {
  console.log("Deleting all KNX configs:", { unitIp, canId });
  return deleteKnxConfig(unitIp, canId);
}

export {
  triggerKnx,
  setKnxConfig,
  getKnxConfig,
  parseKnxConfigResponse,
  deleteKnxConfig,
  deleteAllKnxConfigs,
};
