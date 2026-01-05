/**
 * Network format converter - converts network unit formats to database formats
 */

/**
 * Convert network RS485 format to database format
 * @param {Object} networkConfig - RS485 config from network unit
 * @returns {Object} RS485 config in database format
 */
export function convertNetworkToDialogFormat(networkConfig) {
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
