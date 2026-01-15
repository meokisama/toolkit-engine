import { CONSTANTS } from "@/constants";
import { sortByIpAddress } from "@/utils/ip-utils";
import log from "electron-log/renderer";

const { UDP_CONFIG, TYPES } = CONSTANTS.UNIT;

/**
 * UDP Network Scanner Service
 * Based on RLC C# implementation for discovering units on network
 */
class UDPNetworkScanner {
  constructor() {
    this.isScanning = false;
    this.scanResults = [];
    this.lastScanTime = null;
    this.useSimulatedScan = false; // Set to true to use simulated scan instead of real UDP scan
    // Cache persists until next scan - no timeout
  }

  /**
   * Parse substring from string using delimiter and position
   * Equivalent to C# Substring method in RLC
   */
  parseSubstring(delimiter, position, str) {
    const parts = str.split(delimiter);
    if (position < parts.length) {
      return parts[position];
    }
    return "";
  }

  /**
   * Map barcode to device type
   * Based on InfoBarcode function from RLC
   */
  mapBarcodeToDeviceType(barcode) {
    const unit = TYPES.find((unit) => unit.barcode === barcode);
    return unit ? unit.name : "Unidentified";
  }

  /**
   * Calculate CRC checksum for UDP packet
   * Based on RLC implementation
   */
  calculateCRC(data, startIndex, length) {
    let sum = 0;
    for (let i = startIndex; i < startIndex + length; i++) {
      sum += data[i];
    }
    return sum;
  }

  /**
   * Create UDP request packet for hardware information
   * Based on RLC Get_Infor_Unit method
   */
  createHardwareInfoRequest(targetId = "0.0.0.0") {
    const data = new Uint8Array(1024);

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
    const crcSum = this.calculateCRC(data, 4, data[4]);
    data[8] = crcSum & 0xff; // Low byte
    data[9] = (crcSum >> 8) & 0xff; // High byte

    return data.slice(0, data[4] + 6);
  }

  /**
   * Parse UDP response data
   * Based on RLC response parsing logic
   */
  parseUDPResponse(buffer, sourceIP) {
    try {
      const data = new Uint8Array(buffer);
      const dataLength = data[5] * 256 + data[4];

      // Check if response is valid (length > 90 as per RLC logic)
      if (dataLength <= 90) {
        return null;
      }

      const posData = 7; // Data position offset

      // Parse Unit ID from response header
      const unitId = `${data[3]}.${data[2]}.${data[1]}.${data[0]}`;

      // Parse barcode (13 bytes starting at posData + 70)
      let barcode = "";
      const barcodeStart = posData + 70;
      const barcodeEnd = posData + 83;

      if (barcodeEnd <= data.length) {
        for (let i = barcodeStart; i < barcodeEnd; i++) {
          barcode += (data[i] - 48).toString();
        }
      } else {
        // Fallback: try to find barcode in different position
        for (let i = posData + 60; i < Math.min(posData + 80, data.length); i++) {
          if (data[i] >= 48 && data[i] <= 57) {
            // ASCII digits
            barcode += (data[i] - 48).toString();
          }
        }
      }

      // Map barcode to device type
      const deviceType = this.mapBarcodeToDeviceType(barcode);

      // Parse hardware enable flags
      const hardwareEnablePos = posData + 84;
      let hardwareEnable = 0;
      let recovery = false;

      if (hardwareEnablePos < data.length) {
        hardwareEnable = data[hardwareEnablePos];
        recovery = (hardwareEnable & 0x40) === 0x40;
      }

      // Parse mode and capabilities
      let hwFlags = hardwareEnable;
      let factor = 128;
      for (let i = 1; i <= 5; i++) {
        if (hwFlags >= factor) hwFlags -= factor;
        factor = factor / 2;
      }

      const canLoad = hwFlags >= 4;
      if (canLoad) hwFlags -= 4;

      let mode;
      if (hwFlags === 0) mode = "Stand-Alone";
      else if (hwFlags === 1) mode = "Slave";
      else mode = "Master";

      // Parse firmware and hardware versions
      let hwVersion = "0.0.0";
      let fwVersion = "0.0.0";

      const hwVersionPos1 = posData + 85;
      const hwVersionPos2 = posData + 86;
      const fwVersionPos1 = posData + 87;
      const fwVersionPos2 = posData + 88;

      if (hwVersionPos2 < data.length) {
        hwVersion = `${data[hwVersionPos2]}.${data[hwVersionPos1] >> 4}.${data[hwVersionPos1] & 0x0f}`;
      }

      if (fwVersionPos2 < data.length) {
        fwVersion = `${data[fwVersionPos2]}.${data[fwVersionPos1]}.0`;
      }

      // Parse manufacture date
      let manufactureDate = "";
      const dateStart = 19;
      const dateEnd = 27;

      if (dateEnd <= data.length) {
        for (let i = dateStart; i < dateEnd; i++) {
          if (data[i] >= 48 && data[i] <= 57) {
            // ASCII digits
            manufactureDate += (data[i] - 48).toString();
          }
        }
      }

      const result = {
        id: `unit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: deviceType,
        serial_no: barcode || "Unknown",
        ip_address: sourceIP,
        id_can: unitId,
        mode: mode,
        firmware_version: fwVersion,
        hardware_version: hwVersion,
        manufacture_date: manufactureDate || "Unknown",
        can_load: canLoad,
        recovery_mode: recovery,
        description: `${deviceType} discovered on network`,
        discovered_at: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      log.error("Error parsing UDP response:", error);
      return null;
    }
  }

  /**
   * Check if cached results are available
   */
  isCacheValid() {
    return this.lastScanTime !== null && this.scanResults.length > 0;
  }

  /**
   * Get cached results if available, otherwise scan network
   * This is the main method to use for getting network units
   */
  async getNetworkUnits(forceScan = false, includeSlaves = true) {
    // Return cached results if available and not forcing scan
    if (!forceScan && this.isCacheValid()) {
      log.info("Returning cached network units");
      return this.scanResults;
    }

    // If no cache or force scan, scan network
    if (includeSlaves) {
      return await this.scanNetworkWithSlaves();
    } else {
      return await this.scanNetwork();
    }
  }

  /**
   * Scan network for units using UDP broadcast on all available interfaces
   * Based on RLC Get_Infor_Unit method, enhanced for multi-interface support
   */
  async scanNetwork() {
    if (this.isScanning) {
      throw new Error("Scan already in progress");
    }

    this.isScanning = true;
    log.info("Starting multi-interface network scan...");

    try {
      // Check if simulate mode is enabled (takes priority)
      if (this.useSimulatedScan) {
        log.info("Using simulated scan mode (forced by flag)");
        await this.simulateScan();
        this.scanResults = sortByIpAddress(this.scanResults);
      }
      // Check if we're in Electron environment
      else if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.scanUDPNetwork) {
        // Get network interface information from main process
        const interfaces = await window.electronAPI.networkInterfaces.getAll(true); // Force refresh
        const broadcastAddresses = interfaces.map((iface) => iface.broadcast);

        log.info(`Scanning on ${broadcastAddresses.length} network interfaces:`, broadcastAddresses);

        // Use Electron IPC for UDP operations with multi-interface support
        const results = await window.electronAPI.scanUDPNetwork({
          broadcastAddresses: broadcastAddresses,
          broadcastIP: UDP_CONFIG.BROADCAST_IP,
          udpPort: UDP_CONFIG.UDP_PORT,
          localPort: UDP_CONFIG.LOCAL_UDP_PORT,
          timeout: UDP_CONFIG.SCAN_TIMEOUT,
          multiInterface: true,
        });

        // Parse results and remove duplicates based on IP address + CAN ID combination
        const parsedResults = results.map((result) => this.parseUDPResponse(result.data, result.sourceIP)).filter((unit) => unit !== null);

        // Remove duplicates by IP address + CAN ID combination (to support slave units with same IP but different CAN ID)
        const uniqueResults = [];
        const seenUnits = new Set();

        for (const unit of parsedResults) {
          const unitKey = `${unit.ip_address}:${unit.id_can}`;
          if (!seenUnits.has(unitKey)) {
            seenUnits.add(unitKey);
            // Add interface information to the unit using main process
            const sourceInterface = await window.electronAPI.networkInterfaces.findInterfaceForTarget(unit.ip_address);
            if (sourceInterface) {
              unit.source_interface = {
                name: sourceInterface.name,
                address: sourceInterface.address,
                network: sourceInterface.network,
                broadcast: sourceInterface.broadcast,
              };
            }
            uniqueResults.push(unit);
          }
        }

        // Sort results by IP address before storing
        this.scanResults = sortByIpAddress(uniqueResults);
      } else {
        // Fallback for development/testing - simulate scan results
        await this.simulateScan();
        // Sort simulated results too
        this.scanResults = sortByIpAddress(this.scanResults);
      }

      // Update cache timestamp
      this.lastScanTime = Date.now();
      log.info(`Multi-interface network scan completed. Found ${this.scanResults.length} unique units (sorted by IP)`);

      return this.scanResults;
    } catch (error) {
      log.error("Multi-interface network scan failed:", error);
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Enhanced network scan that includes slave unit discovery
   * Based on RLC Core logic - broadcast scan should already return all units including slaves
   * The key is proper deduplication by IP+CAN ID combination instead of just IP
   */
  async scanNetworkWithSlaves() {
    log.info("Starting enhanced network scan with slave unit discovery...");

    // Perform broadcast scan - this should return all units including slaves
    // The RLC Core logic shows that all units (master and slaves) respond to broadcast
    const allResults = await this.scanNetwork();

    // Group units by IP to identify master-slave relationships
    const unitsByIP = {};
    allResults.forEach((unit) => {
      if (!unitsByIP[unit.ip_address]) {
        unitsByIP[unit.ip_address] = [];
      }
      unitsByIP[unit.ip_address].push(unit);
    });

    // Log master-slave relationships for debugging
    Object.entries(unitsByIP).forEach(([ip, units]) => {
      if (units.length > 1) {
        const masters = units.filter((u) => u.mode === "Master");
        const slaves = units.filter((u) => u.mode === "Slave");
        log.info(`IP ${ip}: ${masters.length} master(s), ${slaves.length} slave(s)`);

        slaves.forEach((slave) => {
          log.info(`  - Slave: ${slave.type} (CAN ID: ${slave.id_can})`);
        });
      }
    });

    log.info(`Enhanced scan completed. Found ${allResults.length} total units`);

    return allResults;
  }

  /**
   * Simulate network scan for development/testing
   */
  async simulateScan() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock scan results based on RLC test data - including slave units
    this.scanResults = [
      {
        id: `unit_${Date.now()}_1`,
        type: "RCU-48IN-16RL",
        serial_no: "8930000210043",
        ip_address: "192.168.2.10",
        id_can: "0.0.1.1",
        mode: "Master",
        firmware_version: "1.0.4",
        hardware_version: "3.2.5",
        manufacture_date: "06072015",
        can_load: true,
        recovery_mode: false,
        description: "RCU-48IN-16RL discovered on network",
        discovered_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Get last scan results
   */
  getLastScanResults() {
    return this.scanResults;
  }

  /**
   * Check if scanner is currently scanning
   */
  isCurrentlyScanning() {
    return this.isScanning;
  }

  /**
   * Clear scan results
   */
  clearResults() {
    this.scanResults = [];
    this.lastScanTime = null;
  }

  /**
   * Get cache status information
   */
  getCacheStatus() {
    return {
      isValid: this.isCacheValid(),
      lastScanTime: this.lastScanTime,
      unitCount: this.scanResults.length,
    };
  }
}

// Export singleton instance
export const udpScanner = new UDPNetworkScanner();
