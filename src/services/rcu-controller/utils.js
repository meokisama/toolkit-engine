import { ERROR_CODES } from "./constants.js";

// Helper function for response parsing
const parseResponse = {
  success: (response) => {
    if (response?.msg?.length >= 9) {
      const data = response.msg.slice(8);
      return data[0] === 0;
    }
    return false;
  },
  data: (response, minLength = 8) => {
    if (response?.msg?.length >= minLength) {
      return response.msg.slice(8);
    }
    throw new Error("Invalid response data");
  },
  temperature: (data, offset = 1) => {
    return ((data[offset + 1] << 8) | data[offset]) / 10;
  },
};

// Helper function to convert KNX address from a/b/c format to 2-byte hex
// KNX address format: 5 bit area / 3 bit line / 8 bit device = 16 bits total
function convertKnxAddressToHex(knxAddress) {
  if (!knxAddress || typeof knxAddress !== "string") {
    return [0x00, 0x00]; // Return 2 bytes of 0x00 for empty/invalid address
  }

  const parts = knxAddress.split("/");
  if (parts.length !== 3) {
    return [0x00, 0x00]; // Return 2 bytes of 0x00 for invalid format
  }

  try {
    const area = parseInt(parts[0]) & 0x1f; // 5 bits (0-31)
    const line = parseInt(parts[1]) & 0x07; // 3 bits (0-7)
    const device = parseInt(parts[2]) & 0xff; // 8 bits (0-255)

    // Combine into 16-bit value: area(5) + line(3) + device(8)
    const combined = (area << 11) | (line << 8) | device;

    // Return as 2 bytes: low byte, high byte
    return [combined & 0xff, (combined >> 8) & 0xff];
  } catch (error) {
    return [0x00, 0x00]; // Return 2 bytes of 0x00 for conversion error
  }
}

function convertCanIdToInt(canId) {
  if (!canId || typeof canId !== "string") {
    return 0x00000101;
  }

  const parts = canId.split(".");
  if (parts.length !== 4) {
    return 0x00000101;
  }

  try {
    const byte0 = parseInt(parts[0]) & 0xff;
    const byte1 = parseInt(parts[1]) & 0xff;
    const byte2 = parseInt(parts[2]) & 0xff;
    const byte3 = parseInt(parts[3]) & 0xff;

    return (byte0 << 24) | (byte1 << 16) | (byte2 << 8) | byte3;
  } catch (error) {
    return 0x00000101;
  }
}

function processResponse(
  msg,
  expectedCmd1,
  expectedCmd2,
  skipStatusCheck = false
) {
  if (msg.length < 10) {
    throw new Error("Response too short (minimum 10 bytes required)");
  }

  console.log("Response packet:", {
    length: msg.length,
    hex: Array.from(msg)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" "),
  });

  // Parse response structure: <ID Address><length><cmd1><cmd2><data><crc>
  const idAddress = (msg[3] << 24) | (msg[2] << 16) | (msg[1] << 8) | msg[0];
  const length = msg[4] | (msg[5] << 8);
  const cmd1 = msg[6];
  const cmd2 = msg[7];
  const dataStart = 8;
  const dataLength = length - 4; // length includes cmd1, cmd2, and crc (4 bytes total)

  // Check if this is an error response
  const isErrorResponse = cmd1 & 0x80 || cmd2 & 0x80;

  if (isErrorResponse) {
    // Error response: either cmd1 or cmd2 has 0x80 added
    const originalCmd1 = cmd1 & 0x7f;
    const originalCmd2 = cmd2 & 0x7f;
    const errorCode = msg[dataStart]; // First byte of data contains error code
    const errorMessage =
      ERROR_CODES[errorCode] || `Unknown error (${errorCode})`;

    console.error("RCU Error Response:", {
      receivedCmd1: `0x${cmd1.toString(16)}`,
      receivedCmd2: `0x${cmd2.toString(16)}`,
      originalCmd1: `0x${originalCmd1.toString(16)}`,
      originalCmd2: `0x${originalCmd2.toString(16)}`,
      expectedCmd1: `0x${expectedCmd1.toString(16)}`,
      expectedCmd2: `0x${expectedCmd2.toString(16)}`,
      errorCode,
      errorMessage,
    });

    throw new Error(`RCU Error: ${errorMessage} (Code: ${errorCode})`);
  }

  // Check if cmd1 and cmd2 match expected values (only for success responses)
  if (cmd1 !== expectedCmd1) {
    throw new Error(
      `Unexpected cmd1 in response: got 0x${cmd1.toString(
        16
      )}, expected 0x${expectedCmd1.toString(16)}`
    );
  }

  if (cmd2 !== expectedCmd2) {
    throw new Error(
      `Unexpected cmd2 in response: got 0x${cmd2.toString(
        16
      )}, expected 0x${expectedCmd2.toString(16)}`
    );
  }

  // For setup commands, check if data field contains success status (0x00)
  // Skip status check for GET_SCENE_INFOR and similar data retrieval commands
  if (!skipStatusCheck && dataLength >= 1) {
    const statusByte = msg[dataStart];

    if (statusByte !== 0x00) {
      const errorMessage =
        ERROR_CODES[statusByte] || `Unknown error (${statusByte})`;
      throw new Error(`Command failed: ${errorMessage} (Code: ${statusByte})`);
    }
  }

  return {
    idAddress,
    length,
    cmd1,
    cmd2,
    data: msg.slice(dataStart, dataStart + dataLength), // dataLength already excludes CRC
    success: true,
  };
}

function calculateCRC(data) {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc += data[i];
  }
  return crc & 0xffff;
}

export {
  parseResponse,
  convertKnxAddressToHex,
  convertCanIdToInt,
  processResponse,
  calculateCRC,
};
