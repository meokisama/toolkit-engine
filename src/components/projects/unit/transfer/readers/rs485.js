import log from "electron-log/renderer";
/**
 * RS485 Configuration Reader
 * Reads RS485 configurations from network units and converts to database format
 */

/**
 * Convert network RS485 format to database format
 * @param {Object} networkConfig - RS485 config from network unit
 * @returns {Object|null} RS485 config in database format
 */
export function convertRS485ToDbFormat(networkConfig) {
  if (!networkConfig) return null;

  return {
    baudrate: networkConfig.baudrate || 9600,
    parity: networkConfig.parity || 0,
    stop_bit: networkConfig.stopBit || 0,
    board_id: networkConfig.boardId || 0,
    config_type: networkConfig.rs485Type || 0,
    num_slave_devs: networkConfig.numSlaves || 0,
    reserved: networkConfig.reserved || [0, 0, 0, 0, 0],
    slave_cfg: (networkConfig.slaves || []).map((slave) => ({
      slave_id: slave.slaveId || 0,
      slave_group: slave.slaveGroup || 0,
      num_indoors: slave.numIndoors || 0,
      indoor_group: slave.indoorGroups || Array(16).fill(0),
    })),
  };
}

/**
 * Read RS485 configurations from network unit (both CH1 and CH2)
 * @param {Object} networkUnit - Network unit to read from
 * @returns {Promise<Array|null>} Array of [CH1Config, CH2Config] or null on error
 */
export async function readRS485Configurations(networkUnit) {
  try {
    log.info("Reading RS485 configurations...");

    let ch1Config = null;
    let ch2Config = null;

    // Read CH1 configuration first
    log.info("Reading RS485 CH1 configuration...");
    try {
      ch1Config = await window.electronAPI.deviceController.getRS485CH1Config({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });
    } catch (error) {
      log.warn("Failed to read RS485 CH1 configuration:", error);
    }

    // Read CH2 configuration second
    log.info("Reading RS485 CH2 configuration...");
    try {
      ch2Config = await window.electronAPI.deviceController.getRS485CH2Config({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });
    } catch (error) {
      log.warn("Failed to read RS485 CH2 configuration:", error);
    }

    const rs485Config = [convertRS485ToDbFormat(ch1Config), convertRS485ToDbFormat(ch2Config)];
    log.info("RS485 configurations read successfully");

    return rs485Config;
  } catch (error) {
    log.error("Failed to read RS485 configurations:", error);
    return null;
  }
}

// Legacy alias for backward compatibility
export const convertNetworkToDialogFormat = convertRS485ToDbFormat;
