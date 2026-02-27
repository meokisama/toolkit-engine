export function registerLedSpiHandlers(ipcMain, rcu) {
  // ==================== RCU Controller - LED SPI Operations ====================

  // Set LED SPI Hardware Configuration
  ipcMain.handle("rcu:setLedSpiHardwareConfig", async (event, unitIp, canId, channel, config) => {
    try {
      return await rcu.setLedSpiHardwareConfig(unitIp, canId, channel, config);
    } catch (error) {
      console.error("Error setting LED SPI hardware config:", error);
      throw error;
    }
  });

  // Set LED SPI Effect Control
  ipcMain.handle("rcu:setLedSpiEffectControl", async (event, unitIp, canId, channel, effect) => {
    try {
      return await rcu.setLedSpiEffectControl(unitIp, canId, channel, effect);
    } catch (error) {
      console.error("Error setting LED SPI effect control:", error);
      throw error;
    }
  });

  // Get LED SPI Configuration
  ipcMain.handle("rcu:getLedSpiConfig", async (event, unitIp, canId, channel) => {
    try {
      return await rcu.getLedSpiConfig(unitIp, canId, channel);
    } catch (error) {
      console.error("Error getting LED SPI config:", error);
      throw error;
    }
  });

  // Trigger LED SPI On/Off
  ipcMain.handle("rcu:triggerLedSpi", async (event, unitIp, canId, channel, enabled) => {
    try {
      return await rcu.triggerLedSpi(unitIp, canId, channel, enabled);
    } catch (error) {
      console.error("Error triggering LED SPI:", error);
      throw error;
    }
  });

  // Change LED SPI Mode
  ipcMain.handle("rcu:changeLedSpiMode", async (event, unitIp, canId, channel, mode) => {
    try {
      return await rcu.changeLedSpiMode(unitIp, canId, channel, mode);
    } catch (error) {
      console.error("Error changing LED SPI mode:", error);
      throw error;
    }
  });
}
