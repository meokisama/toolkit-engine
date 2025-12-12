import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";
import { getUnitByBarcode } from "@/constants.js";

// Firmware Update Functions
function parseHexLine(line) {
  if (!line.trim().startsWith(":")) {
    throw new Error("Invalid HEX line format");
  }

  // Remove the ":"
  const content = line.trim().slice(1);

  // Check if this is a firmware header line with version and barcode
  if (content.includes(",")) {
    const parts = content.split(",");
    if (parts.length === 2) {
      const versionHex = parts[0];
      const barcode = parts[1];

      // Parse version: 4 hex chars = 2 bytes (e.g., "0303" = version 3.3)
      if (versionHex.length === 4) {
        const majorVersion = parseInt(versionHex.slice(0, 2), 16);
        const minorVersion = parseInt(versionHex.slice(2, 4), 16);

        return {
          isHeader: true,
          version: { major: majorVersion, minor: minorVersion },
          barcode: barcode.trim(), // Trim whitespace from barcode
          rawBytes: [majorVersion, minorVersion], // Send version bytes to device
          hexString: versionHex,
          originalLine: line.trim(),
        };
      }
    }
    throw new Error("Invalid firmware header format");
  }

  // Regular HEX line processing
  const bytes = [];
  // Convert ASCII hex pairs to actual bytes
  for (let i = 0; i < content.length; i += 2) {
    const hexPair = content.slice(i, i + 2);
    const byte = parseInt(hexPair, 16);
    bytes.push(byte);
  }

  return {
    isHeader: false,
    rawBytes: bytes,
    hexString: content,
    originalLine: line.trim(),
  };
}

function validateHexFile(hexContent, expectedBoardType) {
  const lines = hexContent.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("Empty HEX file");
  }

  // Validate HEX format - all lines must start with ":"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith(":")) {
      throw new Error(`Invalid HEX format at line ${i + 1}: must start with ":"`);
    }
  }

  const hexLines = lines.filter((line) => line.startsWith(":"));

  if (hexLines.length === 0) {
    throw new Error("No valid HEX lines found");
  }

  // Parse first line to get firmware version and validate board type
  const firstLine = hexLines[0];
  const firstLineData = parseHexLine(firstLine);

  if (firstLineData.isHeader) {
    // Log detected firmware version
    console.log(`Firmware version detected: ${firstLineData.version.major}.${firstLineData.version.minor}`);

    // Get unit information from barcode
    const unitInfo = getUnitByBarcode(firstLineData.barcode);
    if (unitInfo) {
      console.log(`Firmware for unit: ${unitInfo.name} (${firstLineData.barcode})`);
    } else {
      console.warn(`Unknown unit barcode: ${firstLineData.barcode}`);
    }

    // Validate board type using barcode if expectedBoardType is provided
    if (expectedBoardType) {
      // expectedBoardType is now the expected barcode
      const expectedBarcode = String(expectedBoardType).trim();
      const firmwareBarcode = String(firstLineData.barcode).trim();

      if (firmwareBarcode !== expectedBarcode) {
        // Get unit names for better error message
        const expectedUnitInfo = getUnitByBarcode(expectedBarcode);
        const actualUnitInfo = getUnitByBarcode(firmwareBarcode);

        const expectedUnitName = expectedUnitInfo ? expectedUnitInfo.name : expectedBarcode;
        const actualUnitName = actualUnitInfo ? actualUnitInfo.name : firmwareBarcode;

        throw new Error(
          `Firmware is not correct for board type: expected ${expectedUnitName} (${expectedBarcode}), got ${actualUnitName} (${firmwareBarcode})`
        );
      }
    }
  } else {
    console.warn("First line is not a firmware header, version detection skipped");
  }

  return hexLines;
}

async function sendFirmwarePacket(unitIp, canId, packetData, retryCount = 6) {
  const idAddress = convertCanIdToInt(canId);

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await sendCommand(
        unitIp,
        UDP_PORT,
        idAddress,
        PROTOCOL.GENERAL.CMD1,
        PROTOCOL.GENERAL.CMD2.UPDATE_FIRMWARE,
        packetData,
        false
      );

      // Check for successful response (cmd2 = 6)
      if (response.result.cmd2 === PROTOCOL.GENERAL.CMD2.UPDATE_FIRMWARE) {
        return response;
      }
    } catch (error) {
      console.warn(`Firmware packet send attempt ${attempt + 1} failed:`, error.message);

      // If this is the last attempt, throw the error
      if (attempt === retryCount - 1) {
        throw error;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

async function requestUnitAfterFirmware(unitIp, canId, maxRetries = 10) {
  const idAddress = convertCanIdToInt(canId);
  let retryCount = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await sendCommand(
        unitIp,
        UDP_PORT,
        idAddress,
        PROTOCOL.GENERAL.CMD1,
        PROTOCOL.GENERAL.CMD2.REQUEST_UNIT, // CMD1: 1, CMD2: 1
        [],
        true
      );

      // Check if response indicates successful firmware update
      if (response.result.data && response.result.data.length >= 1) {
        const statusByte = response.result.data[0];
        if (statusByte >= 10) {
          // Follow RLC original logic: if retryCount < 3 (slave units), wait 8 seconds
          if (retryCount < 3) {
            console.log("Slave unit detected, waiting 8 seconds for firmware completion...");
            await new Promise((resolve) => setTimeout(resolve, 8000));
          }
          return true;
        }
      }
    } catch (error) {
      console.warn(`Unit request attempt ${attempt + 1} failed:`, error.message);
      retryCount++;
    }

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

async function updateFirmware(unitIp, canId, hexContent, onProgress, unitType = null) {
  try {
    // Validate HEX file
    const hexLines = validateHexFile(hexContent, unitType);

    if (hexLines.length === 0) {
      throw new Error("No valid HEX data found");
    }

    const totalLines = hexLines.length;
    let processedLines = 0;
    let firmwareCRC = 0;

    // Step 1: Send first HEX line (firmware version) to initialize firmware update
    if (hexLines.length > 0) {
      const firstLine = hexLines[0];
      const hexData = parseHexLine(firstLine);

      // Send the version bytes to device (for header format :0303,barcode, sends [3,3])
      await sendFirmwarePacket(unitIp, canId, hexData.rawBytes);

      // NOTE: Do NOT calculate CRC for the first line (version/header)

      processedLines++;
      if (onProgress) {
        const versionInfo = hexData.isHeader ? `${hexData.version.major}.${hexData.version.minor}` : "unknown";
        onProgress(5, `Sending firmware version ${versionInfo}...`);
      }
    }

    // Step 2: Process remaining HEX lines

    firmwareCRC = 0;

    // Group complete lines into packets, ensuring total packet size <= 1024 bytes
    const maxPacketSize = 1000; // Maximum bytes per packet (reserve space for headers)
    let currentPacketData = [];
    let currentPacketLines = [];

    for (let i = 1; i < hexLines.length; i++) {
      const line = hexLines[i];

      try {
        const hexData = parseHexLine(line);

        // Check if adding this complete line would exceed packet size
        if (currentPacketData.length + hexData.rawBytes.length > maxPacketSize) {
          // Send current packet if it has data (complete lines only)
          if (currentPacketData.length > 0) {
            await sendFirmwarePacket(unitIp, canId, currentPacketData);
            currentPacketData = [];
            currentPacketLines = [];
          }
        }

        // Add this complete line's bytes to current packet
        currentPacketData.push(...hexData.rawBytes);
        currentPacketLines.push(line);

        // Calculate CRC for firmware verification
        hexData.rawBytes.forEach((byte) => {
          firmwareCRC += byte;
        });

        processedLines++;

        // Update progress
        if (onProgress) {
          const progress = Math.round((processedLines / totalLines) * 90); // Reserve 10% for final steps
          onProgress(Math.min(progress, 90), `Processing line ${processedLines}/${totalLines}`);
        }
      } catch (error) {
        throw new Error(`Error processing HEX line ${i + 1}: ${error.message}`);
      }
    }

    // Send any remaining data (complete lines only)
    if (currentPacketData.length > 0) {
      await sendFirmwarePacket(unitIp, canId, currentPacketData);
    }

    // Step 3: Send firmware CRC for verification
    if (onProgress) {
      onProgress(95, "Sending firmware CRC...");
    }

    // Follow RLC original byte order: low byte first, high byte second
    const crcData = [firmwareCRC & 0xff, (firmwareCRC >> 8) & 0xff];

    await sendFirmwarePacket(unitIp, canId, crcData);

    // Step 4: Wait for unit to process firmware update
    if (onProgress) {
      onProgress(98, "Unit is updating firmware, please wait...");
    }

    // Give unit time to process firmware (varies by file size)
    // Estimate: ~1-2 seconds per KB of firmware data
    const estimatedWaitTime = Math.max(5000, Math.min(30000, processedLines * 50)); // 5-30 seconds
    await new Promise((resolve) => setTimeout(resolve, estimatedWaitTime));

    // Step 5: Request unit to verify firmware update completion
    if (onProgress) {
      onProgress(99, "Verifying firmware update...");
    }

    const success = await requestUnitAfterFirmware(unitIp, canId);

    if (!success) {
      throw new Error("Failed to complete firmware update - unit not responding after update");
    }

    if (onProgress) {
      onProgress(100, "Firmware update completed successfully");
    }

    return {
      success: true,
      message: "Firmware updated successfully",
    };
  } catch (error) {
    console.error("Firmware update failed:", error);
    throw error;
  }
}

export { parseHexLine, validateHexFile, sendFirmwarePacket, requestUnitAfterFirmware, updateFirmware };
