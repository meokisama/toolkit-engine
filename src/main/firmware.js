/**
 * Firmware IPC Handlers
 * Xử lý các tương tác với firmware update
 */

export function registerFirmwareHandlers(ipcMain, rcu) {
  // ==================== Firmware Update ====================

  // Update firmware on RCU device
  ipcMain.handle("firmware:update", async (event, { unitIp, canId, hexContent, unitType }) => {
    try {
      // Create progress callback that sends to renderer
      const onProgress = (progress, status) => {
        event.sender.send("firmware:progress", { progress, status });
      };

      return await rcu.updateFirmware(unitIp, canId, hexContent, onProgress, unitType);
    } catch (error) {
      console.error("Error updating firmware:", error);
      throw error;
    }
  });
}
