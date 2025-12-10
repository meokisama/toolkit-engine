// Helper function to convert network RS485 format to database format
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

// Helper function to read RS485 configurations from network unit
export async function readRS485Configurations(networkUnit) {
  try {
    console.log("Reading RS485 configurations...");

    // Read CH1 configuration first
    console.log("Reading RS485 CH1 configuration...");
    const ch1Config =
      await window.electronAPI.deviceController.getRS485CH1Config({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

    // Add delay between RS485 channel reads
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Read CH2 configuration second
    console.log("Reading RS485 CH2 configuration...");
    const ch2Config =
      await window.electronAPI.deviceController.getRS485CH2Config({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

    // Convert to database format
    const rs485Config = [
      convertNetworkToDialogFormat(ch1Config),
      convertNetworkToDialogFormat(ch2Config),
    ];

    // Add delay after RS485 config read
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("RS485 configurations read successfully");

    return rs485Config;
  } catch (error) {
    console.error("Failed to read RS485 configurations:", error);
    return null;
  }
}
