/**
 * Device Configuration IPC Handlers
 * Xử lý các tương tác với RCU device configuration (Clock, Network Unit Edit, Hardware Config)
 */

export function registerDeviceConfigHandlers(ipcMain, rcu) {
  // ==================== Clock Control ====================

  // Sync clock on RCU device
  ipcMain.handle(
    "rcu:syncClock",
    async (event, { unitIp, canId, clockData }) => {
      try {
        return await rcu.syncClock(unitIp, canId, clockData);
      } catch (error) {
        console.error("Error syncing clock:", error);
        throw error;
      }
    }
  );

  // Get clock from RCU device
  ipcMain.handle("rcu:getClock", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getClock(unitIp, canId);
    } catch (error) {
      console.error("Error getting clock:", error);
      throw error;
    }
  });

  // ==================== Network Unit Edit ====================

  // Change IP address on RCU device
  ipcMain.handle(
    "rcu:changeIpAddress",
    async (event, { unitIp, canId, data }) => {
      try {
        const newIpBytes = data.slice(0, 4);
        const oldIpBytes = data.slice(4, 8);
        return await rcu.changeIpAddress(unitIp, canId, newIpBytes, oldIpBytes);
      } catch (error) {
        console.error("Error changing IP address:", error);
        throw error;
      }
    }
  );

  // Change IP address via broadcast
  ipcMain.handle(
    "rcu:changeIpAddressBroadcast",
    async (event, { unitIp, canId, newIpBytes, oldIpBytes }) => {
      try {
        return await rcu.changeIpAddressBroadcast(
          unitIp,
          canId,
          newIpBytes,
          oldIpBytes
        );
      } catch (error) {
        console.error("Error changing IP address via broadcast:", error);
        throw error;
      }
    }
  );

  // Change CAN ID on RCU device
  ipcMain.handle(
    "rcu:changeCanId",
    async (event, { unitIp, canId, newLastPart }) => {
      try {
        return await rcu.changeCanId(unitIp, canId, newLastPart);
      } catch (error) {
        console.error("Error changing CAN ID:", error);
        throw error;
      }
    }
  );

  // ==================== Hardware Configuration ====================

  // Set hardware config on RCU device
  ipcMain.handle(
    "rcu:setHardwareConfig",
    async (event, { unitIp, canId, configByte }) => {
      try {
        return await rcu.setHardwareConfig(unitIp, canId, configByte);
      } catch (error) {
        console.error("Error setting hardware config:", error);
        throw error;
      }
    }
  );

  // ==================== RS485 Configuration ====================

  // Get RS485 CH1 config from RCU device
  ipcMain.handle("rcu:getRS485CH1Config", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getRS485CH1Config(unitIp, canId);
    } catch (error) {
      console.error("Error getting RS485 CH1 config:", error);
      throw error;
    }
  });

  // Get RS485 CH2 config from RCU device
  ipcMain.handle("rcu:getRS485CH2Config", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getRS485CH2Config(unitIp, canId);
    } catch (error) {
      console.error("Error getting RS485 CH2 config:", error);
      throw error;
    }
  });

  // Set RS485 CH1 config on RCU device
  ipcMain.handle(
    "rcu:setRS485CH1Config",
    async (event, { unitIp, canId, config }) => {
      try {
        return await rcu.setRS485CH1Config(unitIp, canId, config);
      } catch (error) {
        console.error("Error setting RS485 CH1 config:", error);
        throw error;
      }
    }
  );

  // Set RS485 CH2 config on RCU device
  ipcMain.handle(
    "rcu:setRS485CH2Config",
    async (event, { unitIp, canId, config }) => {
      try {
        return await rcu.setRS485CH2Config(unitIp, canId, config);
      } catch (error) {
        console.error("Error setting RS485 CH2 config:", error);
        throw error;
      }
    }
  );
}
