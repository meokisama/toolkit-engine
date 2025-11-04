import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";
import { convertCanIdToInt, calculateCRC, processResponse } from "./utils.js";
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

    // Send command and collect multiple responses (one per device)
    const { responses, successPacketReceived } =
      await sendCommandMultipleResponses(
        unitIp,
        UDP_PORT,
        convertCanIdToInt(canId),
        PROTOCOL.ZIGBEE.CMD1,
        PROTOCOL.ZIGBEE.CMD2.GET_ZIGBEE_DEVICE,
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
        const ieeeAddress = Array.from(data.slice(0, 8))
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
 * @returns {Promise<{success: boolean, statusUpdate: object}>}
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
      data,
      false, // skipStatusCheck
      true // waitAfterBusy - wait for final response if BUSY is received
    );

    console.log(`Zigbee command sent successfully to ${ieeeAddress}`);

    // Parse response data (after BUSY response)
    // Response data format:
    // - Byte 0-7: IEEE address (8 bytes)
    // - Byte 8: online status
    // - Byte 9: device type
    // - Byte 10: endpoint id
    // - Byte 11: RSSI
    // - Byte 12-13: endpoint value (2 bytes, little endian)
    const responseData = response.result.data;
    let statusUpdate = null;

    if (responseData && responseData.length >= 14) {
      // Parse IEEE address from response
      const respIeeeAddress = Array.from(responseData.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(":")
        .toUpperCase();

      // Parse status info
      const onlineStatus = responseData[8];
      const respDeviceType = responseData[9];
      const respEndpointId = responseData[10];
      const rssi = responseData[11];
      const endpointValue = responseData[12] | (responseData[13] << 8);

      statusUpdate = {
        ieeeAddress: respIeeeAddress,
        onlineStatus,
        deviceType: respDeviceType,
        endpointId: respEndpointId,
        rssi,
        endpointValue,
      };

      console.log("Zigbee device status update:", statusUpdate);
    }

    return {
      success: response.result.success,
      data: response.result.data,
      statusUpdate,
    };
  } catch (error) {
    console.error("Failed to send Zigbee command:", error);
    throw error;
  }
}

/**
 * Remove a Zigbee device from the network
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {string} ieeeAddress - IEEE address of the device (format: "XX:XX:XX:XX:XX:XX:XX:XX")
 * @param {number} deviceType - Device type
 * @returns {Promise<{success: boolean}>}
 */
async function removeZigbeeDevice(unitIp, canId, ieeeAddress, deviceType) {
  try {
    console.log(`Removing Zigbee device ${ieeeAddress} from unit ${unitIp}`);

    // Parse IEEE address from string format "XX:XX:XX:XX:XX:XX:XX:XX" to bytes
    const ieeeBytes = ieeeAddress.split(":").map((byte) => parseInt(byte, 16));

    // Build data packet:
    // - Byte 0-7: IEEE address (8 bytes)
    // - Byte 8: device type (1 byte)
    const data = [
      ...ieeeBytes, // 8 bytes IEEE address
      deviceType, // Byte 8: device type
    ];

    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      convertCanIdToInt(canId),
      PROTOCOL.ZIGBEE.CMD1,
      PROTOCOL.ZIGBEE.CMD2.REMOVE_ZIGBEE_DEVICE,
      data,
      false, // skipStatusCheck
      false // waitAfterBusy
    );

    console.log(`Zigbee device ${ieeeAddress} removed successfully`);

    return {
      success: response.result.success,
    };
  } catch (error) {
    console.error("Failed to remove Zigbee device:", error);
    throw error;
  }
}

/**
 * Close Zigbee network (stop pairing mode)
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @returns {Promise<{success: boolean}>}
 */
async function closeZigbeeNetwork(unitIp, canId) {
  try {
    console.log(
      `Closing Zigbee network on unit ${unitIp} with CAN ID ${canId}`
    );

    // Data: 2 bytes 00 00
    const data = [0x00, 0x00];

    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      convertCanIdToInt(canId),
      PROTOCOL.ZIGBEE.CMD1,
      PROTOCOL.ZIGBEE.CMD2.CLOSE_ZIGBEE_NETWORK,
      data,
      false, // skipStatusCheck
      false // waitAfterBusy
    );

    console.log(`Zigbee network closed successfully on ${unitIp}`);

    return {
      success: response.result.success,
    };
  } catch (error) {
    console.error("Failed to close Zigbee network:", error);
    throw error;
  }
}

/**
 * Explore Zigbee network for new devices
 * Opens the network, listens for new device notification on the same socket, then closes the network
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {number} timeoutMs - Timeout in milliseconds (default: 200000 = 200 seconds)
 * @param {function} onDeviceFound - Optional callback when a device is discovered
 * @returns {Promise<{devices: Array, success: boolean}>}
 */
async function exploreZigbeeNetwork(
  unitIp,
  canId,
  timeoutMs = 200000,
  onDeviceFound = null
) {
  return new Promise((resolve, reject) => {
    const dgram = require("dgram");
    const client = dgram.createSocket("udp4");
    const idAddress = convertCanIdToInt(canId);
    let deviceFound = null;
    let networkOpened = false;
    let exploring = true; // Flag to prevent processing additional packets after device found

    console.log(
      `Exploring Zigbee network on unit ${unitIp} with CAN ID ${canId} (timeout: ${timeoutMs}ms)`
    );

    const timeout = setTimeout(() => {
      if (!exploring) return; // Already completed

      console.log("Exploration timeout - no device found");
      exploring = false;

      // Try to close network if it was opened
      if (networkOpened) {
        sendCloseNetworkCommand();
      } else {
        client.close();
        resolve({
          success: false,
          devices: [],
          totalDevices: 0,
        });
      }
    }, timeoutMs);

    // Helper function to send close network command
    const sendCloseNetworkCommand = () => {
      try {
        console.log("Sending close network command...");

        const data = [0x00, 0x00];
        const idBuffer = Buffer.alloc(4);
        idBuffer.writeUInt32LE(idAddress, 0);

        const len = 2 + 2 + data.length;
        const packetArray = [];
        packetArray.push(len & 0xff);
        packetArray.push((len >> 8) & 0xff);
        packetArray.push(PROTOCOL.ZIGBEE.CMD1);
        packetArray.push(PROTOCOL.ZIGBEE.CMD2.CLOSE_ZIGBEE_NETWORK);
        packetArray.push(...data);

        const crc = calculateCRC(packetArray);
        packetArray.push(crc & 0xff);
        packetArray.push((crc >> 8) & 0xff);

        const packetBuffer = Buffer.from(packetArray);
        const buffer = Buffer.concat([idBuffer, packetBuffer]);

        client.send(buffer, 0, buffer.length, UDP_PORT, unitIp, (err) => {
          if (err) {
            console.error("Error sending close network command:", err);
          }

          // Close socket after a short delay to allow close command to be sent
          // Reduced from 100ms to 20ms for faster response
          setTimeout(() => {
            client.close();
            clearTimeout(timeout);
            resolve({
              success: deviceFound !== null,
              devices: deviceFound ? [deviceFound] : [],
              totalDevices: deviceFound ? 1 : 0,
            });
          }, 100);
        });
      } catch (error) {
        console.error("Error in sendCloseNetworkCommand:", error);
        client.close();
        clearTimeout(timeout);
        resolve({
          success: false,
          devices: [],
          totalDevices: 0,
        });
      }
    };

    client.on("message", (msg, rinfo) => {
      try {
        console.log(`Received packet from ${rinfo.address}:${rinfo.port}`);
        console.log(
          "Raw packet:",
          Array.from(msg)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ")
            .toUpperCase()
        );

        if (msg.length < 10) {
          console.log("Packet too short, ignoring");
          return;
        }

        const receivedId = msg.readUInt32LE(0);
        const packetLength = msg[4] | (msg[5] << 8);
        const cmd1 = msg[6];
        const cmd2 = msg[7];

        console.log(
          `Parsed: ID=${receivedId}, Len=${packetLength}, CMD1=${cmd1}, CMD2=${cmd2}`
        );

        // Check if this is response to OPEN_ZIGBEE_NETWORK command
        if (
          !networkOpened &&
          receivedId === idAddress &&
          cmd1 === PROTOCOL.ZIGBEE.CMD1 &&
          cmd2 === PROTOCOL.ZIGBEE.CMD2.OPEN_ZIGBEE_NETWORK
        ) {
          const result = processResponse(msg, cmd1, cmd2, false);

          if (result.success) {
            console.log(
              "Zigbee network opened successfully, waiting for new device..."
            );
            networkOpened = true;
          } else {
            console.error("Failed to open Zigbee network");
            exploring = false;
            clearTimeout(timeout);
            client.close();
            reject(new Error("Failed to open Zigbee network"));
          }
          return;
        }

        // Check if this is a NEW_ZIGBEE_DEVICE notification
        if (
          networkOpened &&
          exploring &&
          receivedId === idAddress &&
          cmd1 === PROTOCOL.ZIGBEE.CMD1 &&
          cmd2 === PROTOCOL.ZIGBEE.CMD2.NEW_ZIGBEE_DEVICE
        ) {
          // Stop exploring immediately to prevent processing additional packets
          exploring = false;
          clearTimeout(timeout); // Clear timeout immediately

          const dataLength = packetLength - 4;
          const data = Array.from(msg.slice(8, 8 + dataLength));

          console.log(
            "NEW_ZIGBEE_DEVICE notification received, data length:",
            data.length
          );

          if (data.length >= 10) {
            // Parse device data
            const ieeeAddress = Array.from(data.slice(0, 8))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(":")
              .toUpperCase();

            const deviceType = data[8];
            const numEndpoints = data[9];

            console.log(
              `New device found: ${ieeeAddress}, Type: ${deviceType}, Endpoints: ${numEndpoints}`
            );

            // Parse endpoint data (maximum 4 endpoints)
            const endpoints = [];
            for (let i = 0; i < 4 && i < numEndpoints; i++) {
              const idIndex = 10 + i * 2;
              const addressIndex = 11 + i * 2;

              if (addressIndex < data.length) {
                const endpointId = data[idIndex];
                const endpointAddress = data[addressIndex];
                endpoints.push({ id: endpointId, address: endpointAddress });
              }
            }

            deviceFound = {
              ieee_address: ieeeAddress,
              device_type: deviceType,
              num_endpoints: numEndpoints,
              endpoint1_id: endpoints[0]?.id || 0,
              endpoint1_address: endpoints[0]?.address || 0,
              endpoint1_value: 0,
              endpoint2_id: endpoints[1]?.id || 0,
              endpoint2_address: endpoints[1]?.address || 0,
              endpoint2_value: 0,
              endpoint3_id: endpoints[2]?.id || 0,
              endpoint3_address: endpoints[2]?.address || 0,
              endpoint3_value: 0,
              endpoint4_id: endpoints[3]?.id || 0,
              endpoint4_address: endpoints[3]?.address || 0,
              endpoint4_value: 0,
              rssi: 0,
              status: 1,
            };

            // Call callback if provided
            if (onDeviceFound) {
              onDeviceFound(deviceFound);
            }

            // Send close network command and finish
            sendCloseNetworkCommand();
          }
        }
      } catch (error) {
        console.error("Error processing packet:", error);
      }
    });

    client.on("error", (err) => {
      console.error("Socket error:", err);
      exploring = false;
      clearTimeout(timeout);
      client.close();
      reject(err);
    });

    // Send OPEN_ZIGBEE_NETWORK command
    try {
      const data = [0x00, 0x00];
      const idBuffer = Buffer.alloc(4);
      idBuffer.writeUInt32LE(idAddress, 0);

      const len = 2 + 2 + data.length;
      const packetArray = [];
      packetArray.push(len & 0xff);
      packetArray.push((len >> 8) & 0xff);
      packetArray.push(PROTOCOL.ZIGBEE.CMD1);
      packetArray.push(PROTOCOL.ZIGBEE.CMD2.OPEN_ZIGBEE_NETWORK);
      packetArray.push(...data);

      const crc = calculateCRC(packetArray);
      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const packetBuffer = Buffer.from(packetArray);
      const buffer = Buffer.concat([idBuffer, packetBuffer]);

      console.log(
        `Sending OPEN_ZIGBEE_NETWORK command to ${unitIp}:${UDP_PORT}`
      );
      console.log(
        "Packet:",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      client.send(buffer, 0, buffer.length, UDP_PORT, unitIp, (err) => {
        if (err) {
          console.error("Send error:", err);
          exploring = false;
          clearTimeout(timeout);
          client.close();
          reject(err);
        }
      });
    } catch (error) {
      console.error("Command preparation error:", error);
      exploring = false;
      clearTimeout(timeout);
      client.close();
      reject(error);
    }
  });
}

/**
 * Setup Zigbee device address configurations
 * Sends endpoint address mappings to the unit (max 50 devices per packet)
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @param {Array} devices - Array of device configurations
 * @returns {Promise<{success: boolean}>}
 */
async function setupZigbeeDevice(unitIp, canId, devices) {
  try {
    console.log(
      `Setting up Zigbee device configurations for unit ${unitIp} with CAN ID ${canId}`
    );
    console.log(`Total devices to configure: ${devices.length}`);

    // Validate device count
    if (devices.length === 0) {
      throw new Error("No devices provided for configuration");
    }

    if (devices.length > 50) {
      throw new Error(
        `Too many devices: ${devices.length} (maximum 50 per packet)`
      );
    }

    // Build data packet
    // Each device: 13 bytes
    // - Byte 0-7: IEEE address (8 bytes)
    // - Byte 8: device type (1 byte)
    // - Byte 9: endpoint 1 address (1 byte)
    // - Byte 10: endpoint 2 address (1 byte)
    // - Byte 11: endpoint 3 address (1 byte)
    // - Byte 12: endpoint 4 address (1 byte)
    const data = [];

    devices.forEach((device, index) => {
      // Parse IEEE address from string format "XX:XX:XX:XX:XX:XX:XX:XX" to bytes
      const ieeeBytes = device.ieeeAddress
        .split(":")
        .map((byte) => parseInt(byte, 16));

      if (ieeeBytes.length !== 8) {
        throw new Error(
          `Invalid IEEE address format for device ${index}: ${device.ieeeAddress}`
        );
      }

      // Add device data (13 bytes)
      data.push(
        ...ieeeBytes, // 8 bytes: IEEE address
        device.deviceType, // Byte 8: device type
        device.endpoint1Address || 0, // Byte 9: endpoint 1 address
        device.endpoint2Address || 0, // Byte 10: endpoint 2 address
        device.endpoint3Address || 0, // Byte 11: endpoint 3 address
        device.endpoint4Address || 0 // Byte 12: endpoint 4 address
      );
    });

    console.log(
      `Built data packet: ${data.length} bytes for ${devices.length} device(s)`
    );

    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      convertCanIdToInt(canId),
      PROTOCOL.ZIGBEE.CMD1,
      PROTOCOL.ZIGBEE.CMD2.SETUP_ZIGBEE_DEVICE,
      data,
      false, // skipStatusCheck
      false // waitAfterBusy
    );

    console.log(`Zigbee device setup completed successfully for ${unitIp}`);

    return {
      success: response.result.success,
    };
  } catch (error) {
    console.error("Failed to setup Zigbee devices:", error);
    throw error;
  }
}

/**
 * Factory reset Zigbee coordinator
 * Clears all paired devices and resets the Zigbee network
 * @param {string} unitIp - IP address of the unit
 * @param {string} canId - CAN ID of the unit
 * @returns {Promise<{success: boolean}>}
 */
async function factoryResetZigbee(unitIp, canId) {
  try {
    console.log(
      `Factory resetting Zigbee coordinator on unit ${unitIp} with CAN ID ${canId}`
    );

    // Data: 2 bytes 00 00
    const data = [0x00, 0x00];

    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      convertCanIdToInt(canId),
      PROTOCOL.ZIGBEE.CMD1,
      PROTOCOL.ZIGBEE.CMD2.FACTORY_RESET,
      data,
      false, // skipStatusCheck
      false // waitAfterBusy
    );

    console.log(`Zigbee factory reset completed successfully on ${unitIp}`);

    return {
      success: response.result.success,
    };
  } catch (error) {
    console.error("Failed to factory reset Zigbee:", error);
    throw error;
  }
}

export {
  getZigbeeDevices,
  sendZigbeeCommand,
  removeZigbeeDevice,
  closeZigbeeNetwork,
  exploreZigbeeNetwork,
  setupZigbeeDevice,
  factoryResetZigbee,
};
