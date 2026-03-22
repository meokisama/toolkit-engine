import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

async function sendOnlineStatusCommand(unitIp, canId, data) {
  const idAddress = convertCanIdToInt(canId);
  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.CHECK_ONLINE_STATUS,
    data,
    true // skipStatusCheck - response is data, not a status byte
  );
}

/**
 * Parse RS485 online status response.
 * Response structure (repeated per channel):
 *   byte 0: channel number (0 = CH1, 1 = CH2)
 *   byte 1: RS485 type
 *   byte 2: device count
 *   then for each device: [id (1 byte), status (1 byte, 0=offline 1=online)]
 */
function parseRS485Response(data) {
  const channels = [];
  let offset = 0;

  while (offset < data.length) {
    const channelNum = data[offset++];
    if (offset >= data.length) break;
    const rs485Type = data[offset++];
    if (offset >= data.length) break;
    const deviceCount = data[offset++];

    const devices = [];
    for (let i = 0; i < deviceCount; i++) {
      if (offset + 1 >= data.length) break;
      const id = data[offset++];
      const status = data[offset++];
      devices.push({ id, online: status === 1 });
    }

    channels.push({ channel: channelNum, rs485Type, devices });
  }

  return channels;
}

/**
 * Parse TCP master/slave online status response.
 * Response structure:
 *   byte 0: room_mode
 *   byte 1: tcp_mode
 *   byte 2: device count
 *   then for each device: [ip1, ip2, ip3, ip4, status (0=offline 1=online)]
 */
function parseTcpResponse(data) {
  if (data.length < 3) return null;

  const roomMode = data[0];
  const tcpMode = data[1];
  const deviceCount = data[2];

  const devices = [];
  let offset = 3;
  for (let i = 0; i < deviceCount; i++) {
    if (offset + 4 >= data.length) break;
    const ip = `${data[offset]}.${data[offset + 1]}.${data[offset + 2]}.${data[offset + 3]}`;
    const status = data[offset + 4];
    offset += 5;
    devices.push({ ip, online: status === 1 });
  }

  return { roomMode, tcpMode, devices };
}

async function checkRS485OnlineStatus(unitIp, canId) {
  const response = await sendOnlineStatusCommand(unitIp, canId, [0x00, 0x00]);
  const data = response.msg.slice(8);
  return parseRS485Response(data);
}

async function checkTcpOnlineStatus(unitIp, canId) {
  const response = await sendOnlineStatusCommand(unitIp, canId, [0x01, 0x00]);
  const data = response.msg.slice(8);
  return parseTcpResponse(data);
}

export { checkRS485OnlineStatus, checkTcpOnlineStatus };
