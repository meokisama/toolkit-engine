import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt, parseResponse } from "./utils.js";
import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";

// Get Curtain Configuration function
async function getCurtainConfig(unitIp, canId, curtainIndex = null) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Data is curtain index (1 byte) if specified, empty for all curtains
  let data = [];
  if (curtainIndex !== null) {
    data = [curtainIndex & 0xff];
  }

  console.log("Getting curtain config:", {
    unitIp,
    canId,
    curtainIndex,
    dataLength: data.length,
  });

  if (curtainIndex !== null) {
    // Get single curtain configuration
    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.CURTAIN.CMD1,
      PROTOCOL.CURTAIN.CMD2.GET_CURTAIN_CONFIG,
      data,
      true // Skip status check for GET commands
    );

    if (response && response.msg && response.msg.length >= 9) {
      const responseData = response.msg.slice(8); // Skip header
      console.log(
        "Single curtain response data:",
        Array.from(responseData)
          .map((b) => "0x" + b.toString(16).padStart(2, "0"))
          .join(" ")
      );
      const result = parseCurtainConfigResponse(responseData);
      console.log("Parsed single curtain config:", result);
      return result;
    }

    throw new Error("Failed to get curtain configuration");
  } else {
    // Get all curtain configurations
    const result = await sendCommandMultipleResponses(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.CURTAIN.CMD1,
      PROTOCOL.CURTAIN.CMD2.GET_CURTAIN_CONFIG,
      data,
      15000 // 15 second timeout
    );

    console.log("Get all curtains result:", {
      hasResult: !!result,
      hasResponses: !!(result && result.responses),
      responseCount: result?.responses?.length || 0,
      successPacketReceived: result?.successPacketReceived,
    });

    if (result && result.responses && result.responses.length > 0) {
      const curtains = [];

      console.log(`Processing ${result.responses.length} curtain responses`);

      for (let i = 0; i < result.responses.length; i++) {
        const response = result.responses[i];
        try {
          if (response && response.msg && response.msg.length >= 9) {
            const responseData = response.msg.slice(8); // Skip header
            console.log(
              `Curtain response ${i + 1} data:`,
              Array.from(responseData)
                .map((b) => "0x" + b.toString(16).padStart(2, "0"))
                .join(" ")
            );
            const curtainConfig = parseCurtainConfigResponse(responseData);
            if (curtainConfig) {
              console.log(`Parsed curtain config ${i + 1}:`, curtainConfig);
              curtains.push(curtainConfig);
            } else {
              console.log(`Failed to parse curtain config ${i + 1}`);
            }
          } else {
            console.log(
              `Invalid response ${i + 1}:`,
              response ? `msg length: ${response.msg?.length}` : "null response"
            );
          }
        } catch (error) {
          console.error(`Error parsing curtain response ${i + 1}:`, error);
        }
      }

      console.log(`Total curtains parsed: ${curtains.length}`);
      return {
        result: { success: result.successPacketReceived },
        curtains: curtains,
        successPacketReceived: result.successPacketReceived,
        totalResponses: result.responses.length,
      };
    }

    throw new Error(
      "No valid responses received from get curtain configuration command"
    );
  }
}

// Helper function to parse curtain configuration response
function parseCurtainConfigResponse(data) {
  if (!data || data.length < 14) {
    return null;
  }

  try {
    const index = data[0];
    const address = data[1];
    const curtainType = data[2];
    const pausePeriod = data[3];
    const transitionPeriod = data[4] | (data[5] << 8); // Low byte + high byte
    // Skip 6 reserved bytes (data[6] to data[11]) - same as SET packet structure
    const openGroup = data[12];
    const closeGroup = data[13];
    const stopGroup = data[14];

    const parsedResult = {
      index,
      address,
      curtainType,
      pausePeriod,
      transitionPeriod,
      openGroup,
      closeGroup,
      stopGroup,
    };
    return parsedResult;
  } catch (error) {
    return null;
  }
}

// Set Curtain function (control curtain - stop, open, close)
async function setCurtain(unitIp, canId, curtainAddress, value) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Validate curtain value (0=Stop, 1=Open, 2=Close)
  if (value < 0 || value > 2) {
    throw new Error("Curtain value must be 0 (Stop), 1 (Open), or 2 (Close)");
  }

  // Data is curtain address (1 byte) + value (1 byte)
  const data = [curtainAddress & 0xff, value & 0xff];

  // console.log("Setting curtain:", {
  //   unitIp,
  //   canId,
  //   curtainAddress,
  //   value,
  //   valueLabel: ["Stop", "Open", "Close"][value],
  // });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.CURTAIN.CMD1,
    PROTOCOL.CURTAIN.CMD2.SET_CURTAIN,
    data
  );

  if (response && response.msg && response.msg.length >= 9) {
    const responseData = response.msg.slice(8); // Skip header
    return responseData[0] === 0; // 0 means success
  }

  throw new Error("Failed to set curtain");
}

// Set Curtain Configuration function
async function setCurtainConfig(unitIp, canId, curtainConfig) {
  const {
    index,
    address,
    curtainType,
    pausePeriod,
    transitionPeriod,
    openGroup,
    closeGroup,
    stopGroup,
  } = curtainConfig;

  const idAddress = convertCanIdToInt(canId);
  const transitionLow = transitionPeriod & 0xff;
  const transitionHigh = (transitionPeriod >> 8) & 0xff;

  const data = [
    index & 0xff,
    address & 0xff,
    curtainType & 0xff,
    pausePeriod & 0xff,
    transitionLow,
    transitionHigh,
    ...Array(6).fill(0x00), // Reserve 6 bytes
    openGroup & 0xff,
    closeGroup & 0xff,
    stopGroup & 0xff,
  ];

  // console.log("Sending curtain config:", {
  //   unitIp,
  //   canId,
  //   ...curtainConfig,
  //   dataLength: data.length,
  // });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.CURTAIN.CMD1,
    PROTOCOL.CURTAIN.CMD2.SET_CURTAIN_CONFIG,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to set curtain configuration");
  }

  return true;
}

export {
  getCurtainConfig,
  setCurtain,
  setCurtainConfig,
  parseCurtainConfigResponse,
};
