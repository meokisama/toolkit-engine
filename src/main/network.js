import dgram from "dgram";

export function registerNetworkHandlers(ipcMain, networkInterfaceService) {
  // ==================== UDP Network Scanning ====================

  // Scan UDP network for devices
  ipcMain.handle("udp:scanNetwork", async (event, config) => {
    try {
      return await scanUDPNetwork(config);
    } catch (error) {
      console.error("Error scanning UDP network:", error);
      throw error;
    }
  });

  // ==================== Network Interface Management ====================

  // Get network interfaces
  ipcMain.handle("network:getInterfaces", async (event, forceRefresh = false) => {
    try {
      return networkInterfaceService.getNetworkInterfaces(forceRefresh);
    } catch (error) {
      console.error("Error getting network interfaces:", error);
      throw error;
    }
  });

  // Get broadcast addresses
  ipcMain.handle("network:getBroadcastAddresses", async (event, forceRefresh = false) => {
    try {
      return networkInterfaceService.getBroadcastAddresses(forceRefresh);
    } catch (error) {
      console.error("Error getting broadcast addresses:", error);
      throw error;
    }
  });

  // Get network summary
  ipcMain.handle("network:getSummary", async (event) => {
    try {
      return networkInterfaceService.getSummary();
    } catch (error) {
      console.error("Error getting network summary:", error);
      throw error;
    }
  });

  // Find interface for target IP
  ipcMain.handle("network:findInterfaceForTarget", async (event, targetIp) => {
    try {
      return networkInterfaceService.findInterfaceForTarget(targetIp);
    } catch (error) {
      console.error("Error finding interface for target:", error);
      throw error;
    }
  });

  // Clear network cache
  ipcMain.handle("network:clearCache", async (event) => {
    try {
      networkInterfaceService.clearCache();
      return { success: true };
    } catch (error) {
      console.error("Error clearing network cache:", error);
      throw error;
    }
  });
}

/**
 * UDP Network Scanner Implementation with Multi-Interface Support
 */
async function scanUDPNetwork(config) {
  const { interfaceAddresses, broadcastAddresses, broadcastIP, udpPort, localPort, timeout, multiInterface = false, targetCanId = "0.0.0.0" } = config;

  return new Promise((resolve, reject) => {
    const results = [];
    const sockets = [];
    let timeoutHandle = null;
    let completedScans = 0;

    // Create UDP request packet for hardware information
    const createHardwareInfoRequest = (targetId = "0.0.0.0") => {
      const data = Buffer.alloc(1024);

      // Parse target ID (Address bytes 0-3)
      const idParts = targetId.split(".");
      data[0] = parseInt(idParts[3]) || 0;
      data[1] = parseInt(idParts[2]) || 0;
      data[2] = parseInt(idParts[1]) || 0;
      data[3] = parseInt(idParts[0]) || 0;

      // Length (bytes 4-5)
      data[4] = 4;
      data[5] = 0;

      // Command (bytes 6-7)
      data[6] = 1; // CMD
      data[7] = 4; // Sub-command for hardware info

      // Calculate CRC
      let crcSum = 0;
      for (let i = 4; i < data[4] + 4; i++) {
        crcSum += data[i];
      }
      data[8] = crcSum & 0xff; // Low byte
      data[9] = (crcSum >> 8) & 0xff; // High byte

      return data.slice(0, data[4] + 6);
    };

    // Cleanup function
    function cleanup() {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      sockets.forEach((socket) => {
        if (socket) {
          try {
            socket.close();
          } catch (e) {
            console.error("Error closing socket:", e);
          }
        }
      });
      sockets.length = 0;
    }

    // Handle message reception
    function handleMessage(msg, rinfo) {
      if (msg.length >= 6) {
        const dataLength = msg[5] * 256 + msg[4];

        // Check if response is valid (length > 90 as per RLC logic)
        if (dataLength > 90) {
          results.push({
            data: Array.from(msg), // Convert Buffer to Array for JSON serialization
            sourceIP: rinfo.address,
          });
        }
      }
    }

    // Build the per-interface scan plan.
    // Preferred: bind a socket to each interface's local IP and send to the
    // limited broadcast (255.255.255.255) so the request egresses every NIC.
    // Legacy fallback: send to each subnet-directed broadcast (e.g. x.x.x.255).
    const targetBroadcast = broadcastIP || "255.255.255.255";
    const scanTargets =
      interfaceAddresses && interfaceAddresses.length > 0
        ? interfaceAddresses.map((address) => ({ bindAddress: address, destAddr: targetBroadcast }))
        : (broadcastAddresses || []).map((broadcastAddr) => ({ bindAddress: null, destAddr: broadcastAddr }));

    // Multi-interface scanning
    if (multiInterface && scanTargets.length > 0) {
      console.log(
        `Multi-interface UDP scan starting on ${scanTargets.length} interfaces -> ${targetBroadcast}:`,
        scanTargets.map((t) => t.bindAddress || t.destAddr)
      );

      const expectedScans = scanTargets.length;
      const requestData = createHardwareInfoRequest(targetCanId);

      // Create a socket for each interface
      scanTargets.forEach(({ bindAddress, destAddr }, index) => {
        const label = bindAddress ? `${bindAddress} -> ${destAddr}` : destAddr;
        const socket = dgram.createSocket("udp4");
        sockets.push(socket);

        socket.on("error", (err) => {
          console.error(`UDP socket error on interface ${label}:`, err);
          completedScans++;
          if (completedScans === expectedScans) {
            cleanup();
            resolve(results);
          }
        });

        socket.on("message", handleMessage);

        socket.on("listening", () => {
          // Set socket options
          try {
            socket.setBroadcast(true);
            socket.setRecvBufferSize(0x40000);
          } catch (e) {
            console.log(`Socket option warning on ${label}:`, e.message);
          }

          // Send broadcast request to this interface
          socket.send(requestData, udpPort, destAddr, (err) => {
            if (err) {
              console.error(`Send error on interface ${label}:`, err);
            } else {
              console.log(`Broadcast sent on interface ${label}`);
            }

            completedScans++;

            // If this is the last scan to complete, set the timeout
            if (completedScans === expectedScans) {
              timeoutHandle = setTimeout(() => {
                console.log(`Multi-interface scan timeout reached. Found ${results.length} responses.`);
                cleanup();
                resolve(results);
              }, timeout);
            }
          });
        });

        // Bind socket to the interface IP (random port) so the limited broadcast
        // is sent out the correct NIC; fall back to any interface when unbound.
        if (bindAddress) {
          socket.bind(0, bindAddress);
        } else {
          socket.bind();
        }
      });

      // Fallback timeout in case no sockets complete successfully
      if (expectedScans === 0) {
        console.log("No network interfaces available for scanning");
        resolve([]);
      }
    } else {
      // Fallback to single interface scanning (backward compatibility)
      const targetBroadcast = broadcastIP || "255.255.255.255";
      console.log(`Single-interface UDP scan starting on ${targetBroadcast}`);

      const socket = dgram.createSocket("udp4");
      sockets.push(socket);

      socket.on("error", (err) => {
        console.error("UDP socket error:", err);
        cleanup();
        reject(err);
      });

      socket.on("message", handleMessage);

      socket.on("listening", () => {
        // Set socket options
        try {
          socket.setBroadcast(true);
          socket.setRecvBufferSize(0x40000);
        } catch (e) {
          console.log("Socket option warning:", e.message);
        }

        // Send broadcast request
        const requestData = createHardwareInfoRequest(targetCanId);

        socket.send(requestData, udpPort, targetBroadcast, (err) => {
          if (err) {
            cleanup();
            reject(err);
            return;
          }

          console.log(`Broadcast sent on ${targetBroadcast}`);

          // Set timeout for responses
          timeoutHandle = setTimeout(() => {
            console.log(`Single-interface scan timeout reached. Found ${results.length} responses.`);
            cleanup();
            resolve(results);
          }, timeout);
        });
      });

      socket.bind();
    }
  });
}
