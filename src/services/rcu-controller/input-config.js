import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt, processResponse, calculateCRC } from "./utils.js";

// Get Input Configuration function - returns configuration for all inputs
async function getAllInputConfigs(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  return new Promise((resolve, reject) => {
    const dgram = require("dgram");
    const client = dgram.createSocket("udp4");

    let responses = [];
    let responseCount = 0;
    let successPacketReceived = false;

    const timeout = setTimeout(() => {
      client.close();
      reject(
        new Error(
          `GET_INPUT_CONFIG timeout after 10s for ${unitIp}:${UDP_PORT}`
        )
      );
    }, 10000); // 10 second timeout for input config

    client.on("message", (msg, rinfo) => {
      console.log(
        `Input config response ${responseCount + 1} from ${rinfo.address}`
      );
      console.log(
        "Raw packet:",
        Array.from(msg)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
          .toUpperCase()
      );

      try {
        const result = processResponse(
          msg,
          PROTOCOL.LIGHTING.CMD1,
          PROTOCOL.LIGHTING.CMD2.GET_INPUT_CONFIG,
          true
        );

        // Check if this is a success packet
        const packetLength = msg[4] | (msg[5] << 8);
        const dataSection = Array.from(msg.slice(8, 8 + packetLength - 4));
        const isSuccessPacket =
          packetLength === 5 &&
          dataSection.length === 1 &&
          dataSection[0] === 0x00;

        if (isSuccessPacket) {
          console.log(
            "✅ Input config success packet received - all data transmitted successfully"
          );
          successPacketReceived = true;
          clearTimeout(timeout);
          client.close();

          // Parse all input configurations
          const parsedConfigs = responses.map((response, index) => {
            return parseInputConfigResponse(response.msg, index);
          });

          resolve({ configs: parsedConfigs, successPacketReceived });
        } else {
          // This is a data packet, add to responses
          responses.push({ msg, rinfo, result });
          responseCount++;
          console.log(`📦 Input config data packet ${responseCount} collected`);
        }
      } catch (error) {
        console.error(
          `Error processing input config response ${responseCount + 1}:`,
          error
        );
        console.error(
          "Packet data:",
          Array.from(msg)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ")
        );
        // Continue collecting other responses even if one fails
      }
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      reject(err);
    });

    try {
      // Create command buffer similar to sendCommand
      const idBuffer = Buffer.alloc(4);
      idBuffer.writeUInt32LE(idAddress, 0);

      const data = []; // No data needed for GET_INPUT_CONFIG
      const len = 2 + 2 + data.length;
      const packetArray = [];

      packetArray.push(len & 0xff);
      packetArray.push((len >> 8) & 0xff);
      packetArray.push(PROTOCOL.LIGHTING.CMD1);
      packetArray.push(PROTOCOL.LIGHTING.CMD2.GET_INPUT_CONFIG);

      for (let i = 0; i < data.length; i++) {
        packetArray.push(data[i]);
      }

      const crc = calculateCRC(packetArray);
      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const packetBuffer = Buffer.from(packetArray);
      const buffer = Buffer.concat([idBuffer, packetBuffer]);

      console.log(`Sending GET_INPUT_CONFIG command to ${unitIp}:${UDP_PORT}`);
      console.log(
        "Command packet:",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
          .toUpperCase()
      );

      client.send(buffer, 0, buffer.length, UDP_PORT, unitIp, (err) => {
        if (err) {
          console.error("Send error:", err);
          clearTimeout(timeout);
          client.close();
          reject(err);
        }
      });
    } catch (error) {
      console.error("Command preparation error:", error);
      clearTimeout(timeout);
      client.close();
      reject(error);
    }
  });
}

// Parse input configuration response packet
function parseInputConfigResponse(msg, inputIndex) {
  if (msg.length < 8) {
    throw new Error("Input config response too short");
  }

  const data = Array.from(msg.slice(8)); // Convert to regular array to avoid Buffer deprecation
  const length = msg[4] | (msg[5] << 8);
  const dataLength = length - 4; // Exclude cmd1, cmd2, and CRC

  if (dataLength < 39) {
    throw new Error(
      `Input config data too short: ${dataLength} bytes, expected at least 39`
    );
  }

  // Parse according to the specified structure
  const inputNumber = data[0];
  const inputType = data[1];
  const ramp = data[2];
  const preset = data[3];
  const ledStatus = data[4];
  const autoMode = data[5];
  // Bytes 6-33: Auto Time (28 bytes) - not supported yet
  const delayOff = data[34] | (data[35] << 8); // 2 bytes
  const delayOn = data[36] | (data[37] << 8); // 2 bytes
  const groupCount = data[38];

  // Parse LED status bits
  const displayMode = ledStatus & 0x03; // Bits 0-1
  const nightlight = (ledStatus & 0x10) !== 0; // Bit 4
  const backlight = (ledStatus & 0x20) !== 0; // Bit 5

  // Parse group data (starting from byte 39)
  const groups = [];
  let groupDataOffset = 39;

  // For Key Card input (type 4), always expect 20 groups
  const expectedGroups = inputType === 4 ? 20 : groupCount;

  for (let i = 0; i < expectedGroups && groupDataOffset + 1 < dataLength; i++) {
    const groupId = data[groupDataOffset];
    const presetBrightness = data[groupDataOffset + 1];

    // Only add groups with valid IDs (> 0)
    if (groupId > 0) {
      groups.push({
        groupId: groupId,
        presetBrightness: presetBrightness,
      });
    }

    groupDataOffset += 2;
  }

  const config = {
    inputNumber: inputNumber,
    inputType: inputType,
    ramp: ramp,
    preset: preset,
    ledStatus: {
      displayMode: displayMode,
      nightlight: nightlight,
      backlight: backlight,
      raw: ledStatus,
    },
    autoMode: autoMode,
    delayOff: delayOff,
    delayOn: delayOn,
    groupCount: groupCount,
    groups: groups,
    isKeyCard: inputType === 4,
  };

  // console.log(`Input ${inputNumber} config:`, {
  //   type: inputType,
  //   ramp: ramp,
  //   preset: preset,
  //   ledDisplay: displayMode,
  //   nightlight: nightlight,
  //   backlight: backlight,
  //   autoMode: autoMode,
  //   delayOff: delayOff,
  //   delayOn: delayOn,
  //   groupCount: groupCount,
  //   actualGroups: groups.length,
  //   groups: groups,
  // });

  return config;
}

export { getAllInputConfigs, parseInputConfigResponse };
