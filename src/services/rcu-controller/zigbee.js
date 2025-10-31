import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";
import { convertCanIdToInt } from "./utils.js";
import { UDP_PORT, PROTOCOL } from "./constants.js";

/**
 * Get all Zigbee devices from a specific unit
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @returns {Promise<{devices: Array, success: boolean}>} List of Zigbee devices
 */
async function getZigbeeDevices(unitIp, canId) {
  try {
    console.log(
      `Getting Zigbee devices from unit ${unitIp} with CAN ID ${canId}`
    );

    const cmd1 = PROTOCOL.ZIGBEE.CMD1;
    const cmd2 = PROTOCOL.ZIGBEE.CMD2.GET_ZIGBEE_DEVICE;
    const idAddress = convertCanIdToInt(canId);

    // Send command and collect multiple responses (one per device)
    const { responses, successPacketReceived } =
      await sendCommandMultipleResponses(
        unitIp,
        UDP_PORT,
        idAddress,
        cmd1,
        cmd2,
        [],
        15000 // 15 seconds timeout
      );

    console.log(
      `Received ${responses.length} device(s), success packet: ${successPacketReceived}`
    );

    // Parse each response into device information
    const devices = responses
      .map((response) => {
        const { result } = response;
        const data = result.data;

        if (!data || data.length < 28) {
          console.warn("Invalid device data packet, skipping");
          return null;
        }

        // Parse device data according to protocol
        // Byte 0-7: IEEE address (8 bytes)
        console.log("Raw IEEE bytes:", data.slice(0, 8));
        console.log("Raw IEEE bytes hex:", data.slice(0, 8).map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(" "));

        const ieeeAddress = data
          .slice(0, 8)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(":")
          .toUpperCase();

        console.log("Parsed IEEE address:", ieeeAddress);

        // Byte 8: device type
        const deviceType = data[8];

        // Byte 9: number of endpoints
        const numEndpoints = data[9];

        // Parse endpoint data (maximum 4 endpoints)
        const endpoints = [];
        for (let i = 0; i < 4; i++) {
          const baseIndex = 10 + i * 3; // Each endpoint: ID (1 byte) + value (2 bytes)
          if (baseIndex + 2 < data.length) {
            const endpointId = data[baseIndex];
            const endpointValue =
              data[baseIndex + 1] | (data[baseIndex + 2] << 8);

            endpoints.push({
              id: endpointId,
              value: endpointValue,
            });
          }
        }

        // Byte 22-25: address mapping (4 bytes total, 1 byte per endpoint)
        const addresses = [];
        for (let i = 0; i < 4; i++) {
          const addressIndex = 22 + i;
          if (addressIndex < data.length) {
            addresses.push(data[addressIndex]);
          }
        }

        // Byte 26: RSSI
        const rssi = data.length > 26 ? data[26] : 0;

        // Byte 27: status (00 - offline, 01 - online)
        const status = data.length > 27 ? data[27] : 0;

        return {
          ieee_address: ieeeAddress,
          device_type: deviceType,
          num_endpoints: numEndpoints,
          endpoint1_id: endpoints[0]?.id || 0,
          endpoint1_value: endpoints[0]?.value || 0,
          endpoint1_address: addresses[0] || 0,
          endpoint2_id: endpoints[1]?.id || 0,
          endpoint2_value: endpoints[1]?.value || 0,
          endpoint2_address: addresses[1] || 0,
          endpoint3_id: endpoints[2]?.id || 0,
          endpoint3_value: endpoints[2]?.value || 0,
          endpoint3_address: addresses[2] || 0,
          endpoint4_id: endpoints[3]?.id || 0,
          endpoint4_value: endpoints[3]?.value || 0,
          endpoint4_address: addresses[3] || 0,
          rssi,
          status,
        };
      })
      .filter((device) => device !== null); // Remove invalid devices

    return {
      success: successPacketReceived,
      devices,
      totalDevices: devices.length,
    };
  } catch (error) {
    console.error("Failed to get Zigbee devices:", error);
    throw error;
  }
}

/**
 * Send command to a Zigbee device
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {string} ieeeAddress - IEEE address of the device (format: "XX:XX:XX:XX:XX:XX:XX:XX")
 * @param {number} deviceType - Device type
 * @param {number} endpointId - Endpoint ID to control
 * @param {number} command - Command type (0: OFF, 1: ON, 2: TOGGLE)
 * @returns {Promise<{success: boolean}>}
 */
async function sendZigbeeCommand(
  unitIp,
  canId,
  ieeeAddress,
  deviceType,
  endpointId,
  command
) {
  try {
    console.log(
      `Sending Zigbee command to device ${ieeeAddress} on unit ${unitIp}`
    );
    // Parse IEEE address from string format "XX:XX:XX:XX:XX:XX:XX:XX" to bytes
    const ieeeBytes = ieeeAddress.split(":").map((byte) => parseInt(byte, 16));

    // Build data packet:
    // - Byte 0-7: IEEE address (8 bytes)
    // - Byte 8: device type
    // - Byte 9: endpoint id
    // - Byte 10: command
    const data = [
      ...ieeeBytes, // 8 bytes IEEE address
      deviceType, // Byte 8: device type
      endpointId, // Byte 9: endpoint id
      command, // Byte 10: command (0: OFF, 1: ON, 2: TOGGLE)
    ];

    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      convertCanIdToInt(canId),
      PROTOCOL.ZIGBEE.CMD1,
      PROTOCOL.ZIGBEE.CMD2.SEND_ZIGBEE_CMD,
      data
    );

    console.log(`Zigbee command sent successfully to ${ieeeAddress}`);

    return {
      success: response.result.success,
      data: response.result.data,
    };
  } catch (error) {
    console.error("Failed to send Zigbee command:", error);
    throw error;
  }
}

export { getZigbeeDevices, sendZigbeeCommand };
