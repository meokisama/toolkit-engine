import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt, parseResponse } from "./utils.js";
import { sendCommand } from "./command-sender.js";

/**
 * LED SPI Commands:
 * - SET_HARDWARE_CONFIG (0): 15 bytes per channel
 * - SET_EFFECT_CONTROL (1): 9 bytes per channel
 * - GET_LED_CONFIG (2): Request 4 bytes, Response 23 bytes per channel
 * - TRIGGER_LED (3): 4 bytes per channel
 */

/**
 * Set LED SPI hardware configuration for a channel
 * Data: 15 bytes
 * - Byte 0: Channel (1 or 2)
 * - Byte 1-2: Pixel amount (2 bytes, little endian)
 * - Byte 3: Enable custom (0 or 1)
 * - Byte 4: IC Type
 * - Byte 5: Color Type
 * - Byte 6: Direction
 * - Byte 7-8: Bit 0 high time (2 bytes, little endian)
 * - Byte 9-10: Bit 1 high time (2 bytes, little endian)
 * - Byte 11-12: Overall bit time (2 bytes, little endian)
 * - Byte 13-14: Reset cycle (2 bytes, little endian)
 *
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {number} channel - Channel number (1 or 2)
 * @param {object} config - Hardware configuration
 * @returns {Promise<boolean>} Success status
 */
async function setLedSpiHardwareConfig(unitIp, canId, channel, config) {
  const idAddress = convertCanIdToInt(canId);

  const data = [
    channel & 0xff, // Channel (1 or 2)
    config.pixelAmount & 0xff, // Pixel amount low byte
    (config.pixelAmount >> 8) & 0xff, // Pixel amount high byte
    config.custom ? 1 : 0, // Enable custom
    config.icType & 0xff, // IC Type
    config.colorType & 0xff, // Color Type
    config.direction & 0xff, // Direction
    config.bit0HighTime & 0xff, // Bit 0 high time low byte
    (config.bit0HighTime >> 8) & 0xff, // Bit 0 high time high byte
    config.bit1HighTime & 0xff, // Bit 1 high time low byte
    (config.bit1HighTime >> 8) & 0xff, // Bit 1 high time high byte
    config.overallBitTime & 0xff, // Overall bit time low byte
    (config.overallBitTime >> 8) & 0xff, // Overall bit time high byte
    config.resetCycle & 0xff, // Reset cycle low byte
    (config.resetCycle >> 8) & 0xff, // Reset cycle high byte
  ];

  console.log("Setting LED SPI hardware config:", {
    unitIp,
    canId,
    channel,
    config,
    dataLength: data.length,
  });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LED_SPI.CMD1,
    PROTOCOL.LED_SPI.CMD2.SET_HARDWARE_CONFIG,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error(`Failed to set LED SPI hardware config for channel ${channel}`);
  }

  return true;
}

/**
 * Set LED SPI effect control for a channel
 * Data: 9 bytes
 * - Byte 0: Channel (1 or 2)
 * - Byte 1: Effect
 * - Byte 2: Speed
 * - Byte 3: Brightness
 * - Byte 4: Red
 * - Byte 5: Green
 * - Byte 6: Blue
 * - Byte 7: White
 * - Byte 8: Reserved
 *
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {number} channel - Channel number (1 or 2)
 * @param {object} effect - Effect configuration
 * @returns {Promise<boolean>} Success status
 */
async function setLedSpiEffectControl(unitIp, canId, channel, effect) {
  const idAddress = convertCanIdToInt(canId);

  const data = [
    channel & 0xff, // Channel (1 or 2)
    effect.effect & 0xff, // Effect
    effect.speed & 0xff, // Speed
    effect.brightness & 0xff, // Brightness
    effect.color.r & 0xff, // Red
    effect.color.g & 0xff, // Green
    effect.color.b & 0xff, // Blue
    effect.color.w & 0xff, // White
    0x00, // Reserved
  ];

  console.log("Setting LED SPI effect control:", {
    unitIp,
    canId,
    channel,
    effect,
    dataLength: data.length,
  });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LED_SPI.CMD1,
    PROTOCOL.LED_SPI.CMD2.SET_EFFECT_CONTROL,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error(`Failed to set LED SPI effect control for channel ${channel}`);
  }

  return true;
}

/**
 * Parse LED config response data (23 bytes per channel)
 * @param {Buffer} data - Response data
 * @returns {object} Parsed config with hardware and effect settings
 */
function parseLedConfigResponse(data) {
  if (data.length < 23) {
    throw new Error(`Invalid LED config response length: ${data.length}, expected 23 bytes`);
  }

  return {
    channel: data[0],
    hardware: {
      pixelAmount: data[1] | (data[2] << 8),
      custom: data[3] === 1,
      icType: data[4],
      colorType: data[5],
      direction: data[6],
      bit0HighTime: data[7] | (data[8] << 8),
      bit1HighTime: data[9] | (data[10] << 8),
      overallBitTime: data[11] | (data[12] << 8),
      resetCycle: data[13] | (data[14] << 8),
    },
    effect: {
      effect: data[15],
      speed: data[16],
      brightness: data[17],
      color: {
        r: data[18],
        g: data[19],
        b: data[20],
        w: data[21],
      },
    },
    // Byte 22: Reserved
  };
}

/**
 * Get LED SPI configuration for a channel
 * Request: 4 bytes - 1 byte channel, 3 bytes reserved
 * Response: 23 bytes per channel
 *
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {number} channel - Channel number (1 or 2)
 * @returns {Promise<object>} LED configuration
 */
async function getLedSpiConfig(unitIp, canId, channel) {
  const idAddress = convertCanIdToInt(canId);

  const data = [
    channel & 0xff, // Channel (1 or 2)
    0x00, // Reserved
    0x00, // Reserved
    0x00, // Reserved
  ];

  console.log("Getting LED SPI config:", {
    unitIp,
    canId,
    channel,
  });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LED_SPI.CMD1,
    PROTOCOL.LED_SPI.CMD2.GET_LED_CONFIG,
    data,
    true // skipStatusCheck - we expect data response, not just status
  );

  // Parse response data
  const responseData = parseResponse.data(response);
  const config = parseLedConfigResponse(responseData);

  console.log("Received LED SPI config:", config);

  return config;
}

/**
 * Trigger LED on/off for a channel
 * Data: 4 bytes
 * - Byte 0: Channel (1 or 2)
 * - Byte 1: Trigger (0 = off, 1 = on)
 * - Byte 2-3: Reserved
 *
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {number} channel - Channel number (1 or 2)
 * @param {boolean} enabled - true = on, false = off
 * @returns {Promise<boolean>} Success status
 */
async function triggerLedSpi(unitIp, canId, channel, enabled) {
  const idAddress = convertCanIdToInt(canId);

  const data = [
    channel & 0xff, // Channel (1 or 2)
    enabled ? 1 : 0, // Trigger (0 = off, 1 = on)
    0x00, // Reserved
    0x00, // Reserved
  ];

  console.log("Triggering LED SPI:", {
    unitIp,
    canId,
    channel,
    enabled,
  });

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.LED_SPI.CMD1,
    PROTOCOL.LED_SPI.CMD2.TRIGGER_LED,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error(`Failed to trigger LED for channel ${channel}`);
  }

  return true;
}

export { setLedSpiHardwareConfig, setLedSpiEffectControl, getLedSpiConfig, triggerLedSpi };
