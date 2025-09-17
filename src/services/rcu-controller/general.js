import { UDP_PORT, PROTOCOL } from "./constants.js";
import { parseResponse } from "./utils.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";
import { Buffer } from "buffer";

// Generic general command helper
async function sendGeneralCommand(unitIp, canId, cmd2, data) {
  const idAddress = convertCanIdToInt(canId);
  return sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    cmd2,
    data
  );
}

// Change IP Address function
async function changeIpAddress(unitIp, canId, newIpBytes, oldIpBytes) {
  console.log("=== CHANGE IP ADDRESS START ===");
  console.log("Changing IP address:", {
    unitIp,
    canId,
    newIpBytes,
    oldIpBytes,
  });

  // Data: 4 bytes new IP + 4 bytes old IP
  const data = [...newIpBytes, ...oldIpBytes];

  // Check if we're in main process (Node.js environment)
  const isMainProcess = typeof window === "undefined";
  console.log("Environment check - isMainProcess:", isMainProcess);

  if (isMainProcess) {
    // In main process, check network and use appropriate method
    console.log("Checking if unit is on different network...");
    const isDifferentNetwork = await checkIfDifferentNetwork(unitIp);
    console.log("isDifferentNetwork result:", isDifferentNetwork);

    if (isDifferentNetwork) {
      console.log("*** USING BROADCAST METHOD ***");
      return await changeIpAddressBroadcast(unitIp, canId, newIpBytes, oldIpBytes);
    } else {
      console.log("*** USING DIRECT METHOD ***");
    }
  } else {
    console.log("In renderer process, using direct method");
  }

  // Use direct method for same network or when in renderer process
  console.log("Sending direct command to:", unitIp);
  const response = await sendGeneralCommand(
    unitIp,
    canId,
    PROTOCOL.GENERAL.CMD2.CHANGE_IP,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to change IP address");
  }

  console.log("=== CHANGE IP ADDRESS SUCCESS ===");
  return {
    result: { success: true }
  };
}

// Helper function to check if unit is on different network (main process only)
async function checkIfDifferentNetwork(unitIp) {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    // Get all local IPv4 addresses
    const localAddresses = [];
    for (const [name, addresses] of Object.entries(interfaces)) {
      const ipv4Addresses = addresses.filter(addr =>
        addr.family === 'IPv4' && !addr.internal
      );
      localAddresses.push(...ipv4Addresses.map(addr => addr.address));
    }

    // Check if unit IP is on same network as any local interface
    const unitNetwork = unitIp.split('.').slice(0, 3).join('.');

    for (const localAddr of localAddresses) {
      const localNetwork = localAddr.split('.').slice(0, 3).join('.');
      if (unitNetwork === localNetwork) {
        console.log(`Unit ${unitIp} is on same network as local ${localAddr}`);
        return false; // Same network
      }
    }

    console.log(`Unit ${unitIp} is on different network from all local interfaces:`, localAddresses);
    return true; // Different network
  } catch (error) {
    console.error("Error checking network:", error);
    return false; // Default to same network on error
  }
}

// Helper function to get current network info (renderer process)
async function getCurrentNetworkInfo() {
  if (typeof window !== "undefined" && window.electronAPI) {
    const interfaces = await window.electronAPI.networkInterfaces.getAll();
    return interfaces.find(iface => !iface.address.startsWith('127.')) || interfaces[0];
  }
  return { address: '192.168.1.100' }; // fallback
}

// Broadcast method for cross-network IP change (similar to RLC Core)
// This function runs in main process and uses dgram directly
async function changeIpAddressBroadcast(unitIp, canId, newIpBytes, oldIpBytes) {
  const dgram = require("dgram");

  return new Promise((resolve, reject) => {
    try {
      console.log("Changing IP address via broadcast:", {
        unitIp,
        canId,
        newIpBytes,
        oldIpBytes,
      });

      // Convert CAN ID to address format (similar to convertCanIdToInt)
      const canIdParts = canId.split(".");
      const idAddress = Buffer.alloc(4);
      idAddress[0] = parseInt(canIdParts[3]) & 0xff;
      idAddress[1] = parseInt(canIdParts[2]) & 0xff;
      idAddress[2] = parseInt(canIdParts[1]) & 0xff;
      idAddress[3] = parseInt(canIdParts[0]) & 0xff;

      // Create packet: <ID Address><length><CMD><Data><CRC>
      const data = [...newIpBytes, ...oldIpBytes];
      const len = 2 + 2 + data.length; // cmd1 + cmd2 + data
      const packetArray = [];

      packetArray.push(len & 0xff);
      packetArray.push((len >> 8) & 0xff);
      packetArray.push(1); // CMD1 = GENERAL
      packetArray.push(7); // CMD2 = CHANGE_IP

      for (let i = 0; i < data.length; i++) {
        packetArray.push(data[i]);
      }

      // Calculate CRC
      let crc = 0;
      for (let i = 0; i < packetArray.length; i++) {
        crc += packetArray[i];
      }
      crc = crc & 0xffff;

      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const packetBuffer = Buffer.from(packetArray);
      const buffer = Buffer.concat([idAddress, packetBuffer]);

      console.log("Broadcast packet:", Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Create UDP client for broadcast
      const client = dgram.createSocket("udp4");

      client.on("error", (err) => {
        console.error("Broadcast socket error:", err);
        client.close();
        reject(err);
      });

      client.on("message", (msg, rinfo) => {
        console.log(`Broadcast response from ${rinfo.address}:${rinfo.port}`);
        client.close();

        // Check if response indicates success
        if (msg.length >= 9 && msg[8] === 0) {
          resolve({ result: { success: true } });
        } else {
          reject(new Error("IP change failed - unit returned error"));
        }
      });

      // Bind and send broadcast
      client.bind(() => {
        client.setBroadcast(true);

        // Send to broadcast address (port 2000 like RLC Core)
        client.send(buffer, 0, buffer.length, 2000, "255.255.255.255", (err) => {
          if (err) {
            console.error("Broadcast send error:", err);
            client.close();
            reject(err);
            return;
          }

          console.log("IP change broadcast sent");

          // Set timeout for response
          setTimeout(() => {
            client.close();
            resolve({ result: { success: true } }); // Assume success if no error response
          }, 3000);
        });
      });

    } catch (error) {
      console.error("Error in changeIpAddressBroadcast:", error);
      reject(error);
    }
  });
}

// Change CAN ID function
async function changeCanId(unitIp, canId, newLastPart) {
  console.log("Changing CAN ID:", {
    unitIp,
    canId,
    newLastPart,
  });

  // Validate new last part (1-255)
  if (newLastPart < 1 || newLastPart > 255) {
    throw new Error("CAN ID last part must be between 1-255");
  }

  const data = [newLastPart];

  const response = await sendGeneralCommand(
    unitIp,
    canId,
    PROTOCOL.GENERAL.CMD2.CHANGE_ID,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to change CAN ID");
  }

  return {
    result: { success: true }
  };
}

// Set Hardware Configuration function
// configByte structure:
// - Bit 0-1: Action mode (0: Stand-Alone, 1: Slave, 2: Master)
// - Bit 2: CAN Load (0: disabled, 1: enabled)
// - Bit 6: Recovery (0: disabled, 1: enabled)
// - Other bits: reserved
async function setHardwareConfig(unitIp, canId, configByte) {
  console.log("Setting hardware config:", {
    unitIp,
    canId,
    configByte: `0x${configByte.toString(16).padStart(2, '0')}`,
    actionMode: configByte & 0x03,
    canLoad: !!(configByte & 0x04),
    recovery: !!(configByte & 0x40),
  });

  const data = [configByte];

  const response = await sendGeneralCommand(
    unitIp,
    canId,
    PROTOCOL.GENERAL.CMD2.HARDWARE_CONFIG,
    data
  );

  if (!parseResponse.success(response)) {
    throw new Error("Failed to set hardware configuration");
  }

  return {
    result: { success: true }
  };
}



export {
  changeIpAddress,
  changeCanId,
  setHardwareConfig,
  changeIpAddressBroadcast,
  checkIfDifferentNetwork,
};
