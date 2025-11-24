import { processResponse, calculateCRC } from "./utils.js";

function createOptimalSocket(targetIp) {
  const dgram = require("dgram");
  const client = dgram.createSocket("udp4");

  console.log(
    `Creating UDP socket for target ${targetIp} with default binding`
  );

  return { client, interface: null };
}

async function sendCommand(
  unitIp,
  port,
  idAddress,
  cmd1,
  cmd2,
  data = [],
  skipStatusCheck = false,
  waitAfterBusy = false,
  timeoutMs = 5000
) {
  return new Promise((resolve, reject) => {
    const { client, interface: selectedInterface } =
      createOptimalSocket(unitIp);

    let busyReceived = false;
    let responseCount = 0;

    const timeout = setTimeout(() => {
      client.close();
      reject(
        new Error(
          `Command timeout after ${timeoutMs / 1000}s for ${unitIp}:${port} cmd1=0x${cmd1.toString(
            16
          )} cmd2=0x${cmd2.toString(16)}`
        )
      );
    }, timeoutMs);

    client.on("message", (msg, rinfo) => {
      responseCount++;
      console.log(`Received response #${responseCount} from ${rinfo.address}:${rinfo.port}`);

      try {
        // If this is the response after BUSY, skip status check as it's a status update packet
        const shouldSkipStatusCheck = busyReceived ? true : skipStatusCheck;
        const result = processResponse(msg, cmd1, cmd2, shouldSkipStatusCheck);
        clearTimeout(timeout);
        client.close();
        resolve({ msg, rinfo, result });
      } catch (error) {
        // Check if this is a BUSY error (error code 24 = 0x18)
        const isBusyError = error.message && error.message.includes("BUSY");

        if (waitAfterBusy && isBusyError && !busyReceived) {
          console.log("BUSY error received, waiting for final response...");
          busyReceived = true;
          // Don't close client, continue listening for the next response
          return;
        }

        clearTimeout(timeout);
        client.close();
        reject(error);
      }
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      reject(err);
    });

    try {
      const idBuffer = Buffer.alloc(4);
      idBuffer.writeUInt32LE(idAddress, 0);

      const len = 2 + 2 + data.length;
      const packetArray = [];

      packetArray.push(len & 0xff);
      packetArray.push((len >> 8) & 0xff);
      packetArray.push(cmd1);
      packetArray.push(cmd2);

      for (let i = 0; i < data.length; i++) {
        packetArray.push(data[i]);
      }

      const crc = calculateCRC(packetArray);
      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const packetBuffer = Buffer.from(packetArray);
      const buffer = Buffer.concat([idBuffer, packetBuffer]);

      console.log(
        `Send to ${unitIp}:${port} - CMD1:${cmd1} CMD2:${cmd2} Data:[${data.join(
          ","
        )}]`
      );
      console.log(
        "Packet:",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      client.send(buffer, 0, buffer.length, port, unitIp, (err) => {
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

// Send command and collect multiple responses until success packet
async function sendCommandMultipleResponses(
  unitIp,
  port,
  idAddress,
  cmd1,
  cmd2,
  data = [],
  timeoutMs = 15000,
  keepaliveIntervalMs = 0, // 0 = disabled, e.g., 60000 = send keepalive every 60 seconds
  onPacket = null // Optional callback called for each packet received: (msg, packetLength, dataSection) => void
) {
  return new Promise((resolve, reject) => {
    const { client, interface: selectedInterface } =
      createOptimalSocket(unitIp);
    const responses = [];
    let responseCount = 0;
    let successPacketReceived = false;
    let keepaliveInterval = null;

    // Setup keepalive if enabled
    if (keepaliveIntervalMs > 0) {
      console.log(
        `Keepalive enabled: sending packet every ${keepaliveIntervalMs}ms to maintain firewall connection tracking`
      );

      keepaliveInterval = setInterval(() => {
        // Send a minimal dummy packet to keep connection alive
        // Just send the ID buffer (4 bytes) - minimal overhead
        const keepaliveBuffer = Buffer.alloc(4);
        keepaliveBuffer.writeUInt32LE(idAddress, 0);

        client.send(keepaliveBuffer, 0, keepaliveBuffer.length, port, unitIp, (err) => {
          if (err) {
            console.warn("Keepalive send warning:", err);
          } else {
            console.log("Keepalive packet sent");
          }
        });
      }, keepaliveIntervalMs);
    }

    const cleanup = () => {
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
      }
      client.close();
    };

    const timeout = setTimeout(() => {
      cleanup();
      console.log(
        `Timeout: collected ${responseCount} responses, success packet: ${successPacketReceived}`
      );
      resolve({ responses, successPacketReceived });
    }, timeoutMs);

    client.on("message", (msg, rinfo) => {
      console.log(`Response ${responseCount + 1} from ${rinfo.address}`);
      console.log(
        "Raw packet:",
        Array.from(msg)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
          .toUpperCase()
      );

      try {
        const result = processResponse(msg, cmd1, cmd2, true); // Skip status check

        // Check if this is a success packet
        // Success packet format: <ID><length><cmd1><cmd2><0x00><crc>
        // Length should be 5 (cmd1 + cmd2 + data + crc = 1+1+1+2 = 5)
        const packetLength = msg[4] | (msg[5] << 8);
        const dataSection = Array.from(msg.slice(8, 8 + packetLength - 4)); // Exclude cmd1, cmd2, and CRC

        // Call onPacket callback if provided (for real-time packet handling)
        if (onPacket) {
          onPacket(msg, packetLength, dataSection);
        }

        const isSuccessPacket =
          packetLength === 5 &&
          dataSection.length === 1 &&
          dataSection[0] === 0x00;

        if (isSuccessPacket) {
          console.log(
            "Success packet received - all data transmitted successfully"
          );
          successPacketReceived = true;
          clearTimeout(timeout);
          cleanup();
          resolve({ responses, successPacketReceived });
        } else {
          // This is a data packet, add to responses
          responses.push({ msg, rinfo, result });
          responseCount++;
        }
      } catch (error) {
        console.error(`Error processing response ${responseCount + 1}:`, error);
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
      cleanup();
      reject(err);
    });

    try {
      const idBuffer = Buffer.alloc(4);
      idBuffer.writeUInt32LE(idAddress, 0);

      const len = 2 + 2 + data.length;
      const packetArray = [];

      packetArray.push(len & 0xff);
      packetArray.push((len >> 8) & 0xff);
      packetArray.push(cmd1);
      packetArray.push(cmd2);

      for (let i = 0; i < data.length; i++) {
        packetArray.push(data[i]);
      }

      const crc = calculateCRC(packetArray);
      packetArray.push(crc & 0xff);
      packetArray.push((crc >> 8) & 0xff);

      const packetBuffer = Buffer.from(packetArray);
      const buffer = Buffer.concat([idBuffer, packetBuffer]);

      console.log(
        `Send to ${unitIp}:${port} listening for success packet - CMD1:${cmd1} CMD2:${cmd2}`
      );
      console.log(
        "Packet:",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      client.send(buffer, 0, buffer.length, port, unitIp, (err) => {
        if (err) {
          console.error("Send error:", err);
          clearTimeout(timeout);
          cleanup();
          reject(err);
        }
      });
    } catch (error) {
      console.error("Command preparation error:", error);
      clearTimeout(timeout);
      cleanup();
      reject(error);
    }
  });
}

export { sendCommand, sendCommandMultipleResponses };
