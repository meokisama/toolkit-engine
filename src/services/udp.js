import { CONSTANTS } from '@/constants';
import '@/utils/network-debug.js'; // Import debug utilities

const { UDP_CONFIG, TYPES } = CONSTANTS.UNIT;

/**
 * UDP Network Scanner Service
 * Based on RLC C# implementation for discovering units on network
 */
class UDPNetworkScanner {
    constructor() {
        this.isScanning = false;
        this.scanResults = [];
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
        return '';
    }

    /**
     * Map barcode to device type
     * Based on InfoBarcode function from RLC
     */
    mapBarcodeToDeviceType(barcode) {
        const unit = TYPES.find(unit => unit.barcode === barcode);
        return unit ? unit.name : 'Unidentified';
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
    createHardwareInfoRequest(targetId = '0.0.0.0') {
        const data = new Uint8Array(1024);

        // Parse target ID (Address bytes 0-3)
        const idParts = targetId.split('.');
        data[0] = parseInt(idParts[3]) || 0;
        data[1] = parseInt(idParts[2]) || 0;
        data[2] = parseInt(idParts[1]) || 0;
        data[3] = parseInt(idParts[0]) || 0;

        // Length (bytes 4-5)
        data[4] = 4;
        data[5] = 0;

        // Command (bytes 6-7)
        data[6] = 1;  // CMD
        data[7] = 4;  // Sub-command for hardware info

        // Calculate CRC
        const crcSum = this.calculateCRC(data, 4, data[4]);
        data[8] = crcSum & 0xFF;        // Low byte
        data[9] = (crcSum >> 8) & 0xFF; // High byte

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
            let barcode = '';
            const barcodeStart = posData + 70;
            const barcodeEnd = posData + 83;

            if (barcodeEnd <= data.length) {
                for (let i = barcodeStart; i < barcodeEnd; i++) {
                    barcode += (data[i] - 48).toString();
                }
            } else {
                // Fallback: try to find barcode in different position
                for (let i = posData + 60; i < Math.min(posData + 80, data.length); i++) {
                    if (data[i] >= 48 && data[i] <= 57) { // ASCII digits
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
            if (hwFlags === 0) mode = 'Stand-Alone';
            else if (hwFlags === 1) mode = 'Slave';
            else mode = 'Master';

            // Parse firmware and hardware versions
            let hwVersion = '0.0.0';
            let fwVersion = '0.0.0';

            const hwVersionPos1 = posData + 85;
            const hwVersionPos2 = posData + 86;
            const fwVersionPos1 = posData + 87;
            const fwVersionPos2 = posData + 88;

            if (hwVersionPos2 < data.length) {
                hwVersion = `${data[hwVersionPos2]}.${data[hwVersionPos1] >> 4}.${data[hwVersionPos1] & 0x0F}`;
            }

            if (fwVersionPos2 < data.length) {
                fwVersion = `${data[fwVersionPos2]}.${data[fwVersionPos1]}.0`;
            }

            // Parse manufacture date
            let manufactureDate = '';
            const dateStart = 19;
            const dateEnd = 27;

            if (dateEnd <= data.length) {
                for (let i = dateStart; i < dateEnd; i++) {
                    if (data[i] >= 48 && data[i] <= 57) { // ASCII digits
                        manufactureDate += (data[i] - 48).toString();
                    }
                }
            }

            const result = {
                id: `unit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                type: deviceType,
                serial_no: barcode || 'Unknown',
                ip_address: sourceIP,
                id_can: unitId,
                mode: mode,
                firmware_version: fwVersion,
                hardware_version: hwVersion,
                manufacture_date: manufactureDate || 'Unknown',
                can_load: canLoad,
                recovery_mode: recovery,
                description: `${deviceType} discovered on network`,
                discovered_at: new Date().toISOString()
            };

            return result;
        } catch (error) {
            console.error('Error parsing UDP response:', error);
            return null;
        }
    }

    /**
     * Scan network for units using UDP broadcast
     * Based on RLC Get_Infor_Unit method
     */
    async scanNetwork() {
        console.log('[UDP Scanner] Starting network scan...');

        if (this.isScanning) {
            console.log('[UDP Scanner] Scan already in progress');
            throw new Error('Scan already in progress');
        }

        this.isScanning = true;
        this.scanResults = [];

        try {
            // Check if we're in Electron environment
            console.log('[UDP Scanner] Checking Electron environment...');
            console.log('[UDP Scanner] window exists:', typeof window !== 'undefined');
            console.log('[UDP Scanner] window.electronAPI exists:', typeof window !== 'undefined' && !!window.electronAPI);
            console.log('[UDP Scanner] scanUDPNetwork method exists:', typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.scanUDPNetwork === 'function');

            if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.scanUDPNetwork) {
                console.log('[UDP Scanner] Using Electron IPC for UDP operations');
                console.log('[UDP Scanner] Config:', {
                    broadcastIP: UDP_CONFIG.BROADCAST_IP,
                    udpPort: UDP_CONFIG.UDP_PORT,
                    localPort: UDP_CONFIG.LOCAL_UDP_PORT,
                    timeout: UDP_CONFIG.SCAN_TIMEOUT
                });

                // Use Electron IPC for UDP operations
                const results = await window.electronAPI.scanUDPNetwork({
                    broadcastIP: UDP_CONFIG.BROADCAST_IP,
                    udpPort: UDP_CONFIG.UDP_PORT,
                    localPort: UDP_CONFIG.LOCAL_UDP_PORT,
                    timeout: UDP_CONFIG.SCAN_TIMEOUT
                });

                console.log('[UDP Scanner] Raw results from Electron:', results.length, 'responses');

                this.scanResults = results.map(result => {
                    console.log('[UDP Scanner] Processing response from:', result.sourceIP);
                    return this.parseUDPResponse(result.data, result.sourceIP);
                }).filter(unit => {
                    if (unit !== null) {
                        console.log('[UDP Scanner] Valid unit found:', unit.type, unit.ip_address);
                        return true;
                    }
                    return false;
                });

                console.log('[UDP Scanner] Final scan results:', this.scanResults.length, 'units found');
            } else {
                console.log('[UDP Scanner] Electron API not available, using simulation');
                // Fallback for development/testing - simulate scan results
                await this.simulateScan();
            }

            return this.scanResults;
        } catch (error) {
            console.error('[UDP Scanner] Network scan failed:', error);
            throw error;
        } finally {
            this.isScanning = false;
            console.log('[UDP Scanner] Scan completed');
        }
    }

    /**
     * Simulate network scan for development/testing
     */
    async simulateScan() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock scan results based on RLC test data
        this.scanResults = [
            {
                id: `unit_${Date.now()}_1`,
                type: 'Room Logic Controller',
                serial_no: '8930000000019',
                ip_address: '192.168.1.23',
                id_can: '12.43.3.3',
                mode: 'Stand-Alone',
                firmware_version: '1.0.4',
                hardware_version: '3.2.5',
                manufacture_date: '06072015',
                can_load: true,
                recovery_mode: false,
                description: 'Room Logic Controller discovered on network',
                discovered_at: new Date().toISOString()
            },
            {
                id: `unit_${Date.now()}_2`,
                type: 'Bedside-17T',
                serial_no: '8930000000200',
                ip_address: '192.168.1.24',
                id_can: '12.43.3.5',
                mode: 'Slave',
                firmware_version: '1.0.4',
                hardware_version: '3.2.5',
                manufacture_date: '09032015',
                can_load: true,
                recovery_mode: false,
                description: 'Bedside-17T discovered on network',
                discovered_at: new Date().toISOString()
            }
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
    }
}

// Export singleton instance
export const udpScanner = new UDPNetworkScanner();

// Export class for testing
export { UDPNetworkScanner };