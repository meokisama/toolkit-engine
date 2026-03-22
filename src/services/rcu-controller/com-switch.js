import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt, calculateCRC } from "./utils.js";
import { sendCommand } from "./command-sender.js";
import { SWITCH_ENUM_BY_TYPE, SWITCH_TYPE_BY_ENUM } from "@/constants/com-switch-types.js";

/**
 * Build the binary data payload for SET_COM_SWITCH.
 * Format per channel: [channel(1B)][count(1B)] then per switch: [switchId(1B)][enumType(1B)][keyId(1B)][0x00]
 * Only channels that have at least one switch are included.
 *
 * @param {Array} switchConfigs - Array of switch config objects from the app
 * @returns {number[]} Data bytes array
 */
function buildComSwitchData(switchConfigs) {
  // Group switches by channel (1-5)
  const byChannel = {};
  for (const sw of switchConfigs) {
    const ch = parseInt(sw.channel) || 1;
    if (!byChannel[ch]) byChannel[ch] = [];
    byChannel[ch].push(sw);
  }

  const data = [];
  // Iterate channels in order
  for (const channel of Object.keys(byChannel).map(Number).sort()) {
    const switches = byChannel[channel];
    data.push(channel & 0xff); // channel byte
    data.push(switches.length & 0xff); // count for this channel
    for (const sw of switches) {
      const switchId = (parseInt(sw.switchId) || 0) & 0xff;
      const enumType = (SWITCH_ENUM_BY_TYPE[sw.type] ?? 0) & 0xff;
      const keyId = (parseInt(sw.keyId) || 0) & 0xff;
      data.push(switchId);
      data.push(enumType);
      data.push(keyId);
      data.push(0x00); // padding byte
    }
  }

  return data;
}

/**
 * Parse the binary payload returned by GET_COM_SWITCH into switch config objects.
 * Same structure as buildComSwitchData output.
 *
 * @param {number[]} data - Raw data bytes (starting after cmd1/cmd2 header)
 * @returns {Array} Array of switch config objects { channel, type, enumValue, switchId, keyId }
 */
function parseComSwitchData(data) {
  const switches = [];
  let i = 0;

  while (i < data.length) {
    if (i + 1 >= data.length) break;

    const channel = data[i];
    const count = data[i + 1];
    i += 2;

    for (let j = 0; j < count; j++) {
      if (i + 3 >= data.length) break;

      const switchId = data[i];
      const enumType = data[i + 1];
      const keyId = data[i + 2];
      // data[i + 3] is the padding byte 0x00
      i += 4;

      const typeInfo = SWITCH_TYPE_BY_ENUM[enumType];
      if (typeInfo) {
        switches.push({
          channel,
          type: typeInfo.value,
          enumValue: enumType,
          switchId: switchId.toString(),
          keyId: keyId.toString(),
        });
      }
    }
  }

  return switches;
}

/**
 * Send SET_COM_SWITCH command to the unit.
 * Encodes all switch configs into the binary format and sends in a single command.
 *
 * @param {string} unitIp
 * @param {string} canId
 * @param {Array} switchConfigs - App switch config objects
 */
async function setComSwitch(unitIp, canId, switchConfigs) {
  const idAddress = convertCanIdToInt(canId);
  const data = buildComSwitchData(switchConfigs);

  console.log(`Sending SET_COM_SWITCH to ${unitIp} with ${switchConfigs.length} switch(es), ${data.length} bytes`);

  return sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.SET_COM_SWITCH, data, false);
}

/**
 * Send GET_COM_SWITCH command to the unit and parse the response.
 *
 * @param {string} unitIp
 * @param {string} canId
 * @returns {Promise<{supported: boolean, switches: Array}>}
 *   - supported: false if unit returns NO_SUPPORT (error code 2)
 *   - switches: parsed switch config objects (empty array if none configured)
 */
async function getComSwitch(unitIp, canId) {
  const idAddress = convertCanIdToInt(canId);

  return new Promise((resolve) => {
    const dgram = require("dgram");
    const client = dgram.createSocket("udp4");

    const timeout = setTimeout(() => {
      client.close();
      // Treat timeout as not supported (older firmware)
      console.warn(`GET_COM_SWITCH timeout for ${unitIp} - treating as not supported`);
      resolve({ supported: false, switches: [] });
    }, 5000);

    client.on("message", (msg) => {
      clearTimeout(timeout);
      client.close();

      console.log(
        "GET_COM_SWITCH raw packet:",
        Array.from(msg)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
          .toUpperCase(),
      );

      try {
        // Check for error response (CMD1 or CMD2 has bit 7 set)
        if (msg.length < 8) {
          resolve({ supported: false, switches: [] });
          return;
        }

        const cmd1 = msg[6];
        const cmd2 = msg[7];
        const isError = (cmd1 & 0x80) !== 0 || (cmd2 & 0x80) !== 0;

        if (isError) {
          const packetLength = msg[4] | (msg[5] << 8);
          const dataSection = msg.slice(8, 8 + packetLength - 4);
          const errorCode = dataSection.length > 0 ? dataSection[0] : 255;
          if (errorCode === 2 /* NO_SUPPORT */) {
            console.log(`GET_COM_SWITCH: unit ${unitIp} does not support COM switch`);
          } else {
            console.warn(`GET_COM_SWITCH error code ${errorCode} from ${unitIp}`);
          }
          resolve({ supported: false, switches: [] });
          return;
        }

        // Valid response - parse data
        const packetLength = msg[4] | (msg[5] << 8);
        const dataLength = packetLength - 4; // subtract cmd1, cmd2, crc (2 bytes)
        const data = Array.from(msg.slice(8, 8 + dataLength));

        console.log(`GET_COM_SWITCH response from ${unitIp}: ${data.length} bytes`);

        const switches = parseComSwitchData(data);
        resolve({ supported: true, switches });
      } catch (err) {
        console.error("GET_COM_SWITCH parse error:", err);
        resolve({ supported: false, switches: [] });
      }
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      console.error("GET_COM_SWITCH socket error:", err);
      resolve({ supported: false, switches: [] });
    });

    // Build and send command packet
    try {
      const idBuffer = Buffer.alloc(4);
      idBuffer.writeUInt32LE(idAddress, 0);

      const data = [0x00, 0x00];
      const len = 2 + 2 + data.length;
      const packetArray = [len & 0xff, (len >> 8) & 0xff, PROTOCOL.LIGHTING.CMD1, PROTOCOL.LIGHTING.CMD2.GET_COM_SWITCH, ...data];

      const crc = calculateCRC(packetArray);
      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const buffer = Buffer.concat([idBuffer, Buffer.from(packetArray)]);

      console.log(`Sending GET_COM_SWITCH to ${unitIp}:${UDP_PORT}`);
      client.send(buffer, 0, buffer.length, UDP_PORT, unitIp, (err) => {
        if (err) {
          clearTimeout(timeout);
          client.close();
          console.error("GET_COM_SWITCH send error:", err);
          resolve({ supported: false, switches: [] });
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      client.close();
      console.error("GET_COM_SWITCH build error:", err);
      resolve({ supported: false, switches: [] });
    }
  });
}

export { setComSwitch, getComSwitch, buildComSwitchData, parseComSwitchData };
