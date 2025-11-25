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
      return await changeIpAddressBroadcast(
        unitIp,
        canId,
        newIpBytes,
        oldIpBytes
      );
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
    result: { success: true },
  };
}

// Helper function to check if unit is on different network (main process only)
async function checkIfDifferentNetwork(unitIp) {
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();

    // Get all local IPv4 addresses
    const localAddresses = [];
    for (const [name, addresses] of Object.entries(interfaces)) {
      const ipv4Addresses = addresses.filter(
        (addr) => addr.family === "IPv4" && !addr.internal
      );
      localAddresses.push(...ipv4Addresses.map((addr) => addr.address));
    }

    // Check if unit IP is on same network as any local interface
    const unitNetwork = unitIp.split(".").slice(0, 3).join(".");

    for (const localAddr of localAddresses) {
      const localNetwork = localAddr.split(".").slice(0, 3).join(".");
      if (unitNetwork === localNetwork) {
        console.log(`Unit ${unitIp} is on same network as local ${localAddr}`);
        return false; // Same network
      }
    }

    console.log(
      `Unit ${unitIp} is on different network from all local interfaces:`,
      localAddresses
    );
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
    return (
      interfaces.find((iface) => !iface.address.startsWith("127.")) ||
      interfaces[0]
    );
  }
  return { address: "192.168.1.100" }; // fallback
}

// Broadcast method for cross-network IP change
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

      console.log("*** USING FIXED BROADCAST METHOD (proper socket init) ***");

      // Create packet exactly like RLC Core
      const Data = new Array(18).fill(0);

      // Convert CAN ID to address format (like RLC Core)
      const canIdParts = canId.split(".");
      Data[0] = parseInt(canIdParts[3]) & 0xff; // Last part first
      Data[1] = parseInt(canIdParts[2]) & 0xff;
      Data[2] = parseInt(canIdParts[1]) & 0xff;
      Data[3] = parseInt(canIdParts[0]) & 0xff; // First part last

      // Length: 12 bytes (CMD1 + CMD2 + 8 bytes data + 2 bytes CRC)
      Data[4] = 12;
      Data[5] = 0;

      // Commands
      Data[6] = 1; // CMD1 = GENERAL
      Data[7] = 7; // CMD2 = CHANGE_IP

      // New IP (4 bytes)
      Data[8] = newIpBytes[0];
      Data[9] = newIpBytes[1];
      Data[10] = newIpBytes[2];
      Data[11] = newIpBytes[3];

      // Old IP (4 bytes)
      Data[12] = oldIpBytes[0];
      Data[13] = oldIpBytes[1];
      Data[14] = oldIpBytes[2];
      Data[15] = oldIpBytes[3];

      // Calculate CRC
      let SumCRC = 0;
      for (let i = 4; i < Data[4] + 4; i++) {
        SumCRC += Data[i];
      }

      // Set CRC
      Data[17] = Math.floor(SumCRC / 256);
      Data[16] = SumCRC - Data[17] * 256;

      const buffer = Buffer.from(Data);

      console.log("Broadcast packet structure:");
      console.log(
        "  ID Address:",
        Data.slice(0, 4)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );
      console.log("  Length:", Data[4] + (Data[5] << 8));
      console.log("  CMD1:", Data[6], "CMD2:", Data[7]);
      console.log("  New IP:", Data.slice(8, 12).join("."));
      console.log("  Old IP:", Data.slice(12, 16).join("."));
      console.log(
        "  CRC:",
        Data[16] + (Data[17] << 8),
        "(" + Data[16].toString(16) + " " + Data[17].toString(16) + ")"
      );
      console.log(
        "Broadcast packet (fixed init):",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      // Create UDP client for broadcast
      const client = dgram.createSocket("udp4");

      // Set up error handler
      client.on("error", (err) => {
        console.error("Broadcast socket error:", err);
        try {
          client.close();
        } catch (closeErr) {
          console.warn("Error closing socket:", closeErr);
        }
        reject(err);
      });

      // Wait for socket to be ready before setting broadcast and sending
      client.on("listening", () => {
        try {
          console.log("Socket is ready, setting broadcast mode...");

          // Now it's safe to set broadcast
          client.setBroadcast(true);
          console.log("Broadcast mode enabled");

          // Send broadcast packet
          client.send(
            buffer,
            0,
            Data[4] + 6,
            1234,
            "255.255.255.255",
            (err) => {
              // Always close the socket after send attempt
              try {
                client.close();
              } catch (closeErr) {
                console.warn("Error closing socket after send:", closeErr);
              }

              if (err) {
                console.error("Broadcast send error:", err);
                reject(err);
                return;
              }

              console.log(
                "IP change broadcast sent successfully to 255.255.255.255:1234"
              );
              console.log("=== BROADCAST IP CHANGE COMPLETE ===");

              // Resolve immediately after successful send (fire-and-forget)
              resolve({ result: { success: true } });
            }
          );
        } catch (broadcastErr) {
          console.error("Error in broadcast setup or send:", broadcastErr);
          try {
            client.close();
          } catch (closeErr) {
            console.warn("Error closing socket:", closeErr);
          }
          reject(broadcastErr);
        }
      });

      // Bind to any available port to initialize the socket
      // This triggers the 'listening' event when ready
      client.bind(0, (err) => {
        if (err) {
          console.error("Socket bind error:", err);
          try {
            client.close();
          } catch (closeErr) {
            console.warn("Error closing socket:", closeErr);
          }
          reject(err);
        }
        // Socket is now ready, 'listening' event will fire
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
    result: { success: true },
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
    configByte: `0x${configByte.toString(16).padStart(2, "0")}`,
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

  // Send separate CHANGE_ACT_MODE command
  const actionMode = configByte & 0x03; // Extract action mode from bit 0-1

  const actModeResponse = await sendGeneralCommand(
    unitIp,
    canId,
    PROTOCOL.GENERAL.CMD2.CHANGE_ACT_MODE,
    [actionMode]
  );

  if (!parseResponse.success(actModeResponse)) {
    throw new Error("Failed to change action mode");
  }

  return {
    result: { success: true },
  };
}

export {
  changeIpAddress,
  changeCanId,
  setHardwareConfig,
  changeIpAddressBroadcast,
  checkIfDifferentNetwork,
};
