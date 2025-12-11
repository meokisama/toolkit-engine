/**
 * Zigbee IPC Handlers
 * Xử lý các tương tác với Zigbee devices (RCU Controller và Database)
 */

export function registerZigbeeHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - Zigbee Operations ====================

  // Get Zigbee Devices
  ipcMain.handle("rcu:getZigbeeDevices", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getZigbeeDevices(unitIp, canId);
    } catch (error) {
      console.error("Error getting Zigbee devices:", error);
      throw error;
    }
  });

  // Send Zigbee Command
  ipcMain.handle("rcu:sendZigbeeCommand", async (event, { unitIp, canId, ieeeAddress, deviceType, endpointId, command, deviceId }) => {
    try {
      const result = await rcu.sendZigbeeCommand(unitIp, canId, ieeeAddress, deviceType, endpointId, command);

      // If we have status update and deviceId, update the database
      if (result.statusUpdate && deviceId) {
        try {
          // Get current device data
          const currentDevice = await dbService.db.prepare("SELECT * FROM zigbee_devices WHERE id = ?").get(deviceId);

          if (currentDevice) {
            // Find which endpoint index matches the endpointId from response
            const responseEndpointId = result.statusUpdate.endpointId;
            let endpointIndex = null;
            for (let i = 1; i <= 4; i++) {
              if (currentDevice[`endpoint${i}_id`] === responseEndpointId) {
                endpointIndex = i;
                break;
              }
            }

            if (endpointIndex) {
              // Update the endpoint value and status
              const updateFields = {
                [`endpoint${endpointIndex}_value`]: result.statusUpdate.endpointValue,
                status: result.statusUpdate.onlineStatus,
                rssi: result.statusUpdate.rssi,
              };

              const updateStmt = dbService.db.prepare(`
                  UPDATE zigbee_devices
                  SET endpoint${endpointIndex}_value = ?,
                      status = ?,
                      rssi = ?,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = ?
                `);

              updateStmt.run(updateFields[`endpoint${endpointIndex}_value`], updateFields.status, updateFields.rssi, deviceId);

              console.log(`Updated device ${deviceId} endpoint ${endpointIndex} value to ${result.statusUpdate.endpointValue}`);
            }
          }
        } catch (dbError) {
          console.error("Failed to update device in database:", dbError);
          // Don't throw - we still want to return the result
        }
      }

      return result;
    } catch (error) {
      console.error("Error sending Zigbee command:", error);
      throw error;
    }
  });

  // Remove Zigbee Device
  ipcMain.handle("rcu:removeZigbeeDevice", async (event, { unitIp, canId, ieeeAddress, deviceType }) => {
    try {
      return await rcu.removeZigbeeDevice(unitIp, canId, ieeeAddress, deviceType);
    } catch (error) {
      console.error("Error removing Zigbee device:", error);
      throw error;
    }
  });

  // Close Zigbee Network
  ipcMain.handle("rcu:closeZigbeeNetwork", async (event, { unitIp, canId }) => {
    try {
      return await rcu.closeZigbeeNetwork(unitIp, canId);
    } catch (error) {
      console.error("Error closing Zigbee network:", error);
      throw error;
    }
  });

  // Explore Zigbee Network
  ipcMain.handle("rcu:exploreZigbeeNetwork", async (event, { unitIp, canId, timeoutMs, onDeviceFound }) => {
    try {
      return await rcu.exploreZigbeeNetwork(unitIp, canId, timeoutMs, onDeviceFound);
    } catch (error) {
      console.error("Error exploring Zigbee network:", error);
      throw error;
    }
  });

  // Setup Zigbee Device
  ipcMain.handle("rcu:setupZigbeeDevice", async (event, { unitIp, canId, devices }) => {
    try {
      return await rcu.setupZigbeeDevice(unitIp, canId, devices);
    } catch (error) {
      console.error("Error setting up Zigbee devices:", error);
      throw error;
    }
  });

  // Factory Reset Zigbee
  ipcMain.handle("rcu:factoryResetZigbee", async (event, { unitIp, canId }) => {
    try {
      return await rcu.factoryResetZigbee(unitIp, canId);
    } catch (error) {
      console.error("Error factory resetting Zigbee:", error);
      throw error;
    }
  });

  // ==================== Database - Zigbee Operations ====================

  // Get Zigbee Devices from Database
  ipcMain.handle("zigbee:getDevices", async (event, projectId, unitIp = null) => {
    try {
      return await dbService.getZigbeeDevices(projectId, unitIp);
    } catch (error) {
      console.error("Error getting zigbee devices from database:", error);
      throw error;
    }
  });

  // Create Zigbee Device in Database
  ipcMain.handle("zigbee:createDevice", async (event, projectId, deviceData) => {
    try {
      return await dbService.createZigbeeDevice(projectId, deviceData);
    } catch (error) {
      console.error("Error creating zigbee device:", error);
      throw error;
    }
  });

  // Update Zigbee Device in Database
  ipcMain.handle("zigbee:updateDevice", async (event, id, deviceData) => {
    try {
      return await dbService.updateZigbeeDevice(id, deviceData);
    } catch (error) {
      console.error("Error updating zigbee device:", error);
      throw error;
    }
  });

  // Delete Zigbee Device from Database
  ipcMain.handle("zigbee:deleteDevice", async (event, id) => {
    try {
      return await dbService.deleteZigbeeDevice(id);
    } catch (error) {
      console.error("Error deleting zigbee device:", error);
      throw error;
    }
  });

  // Delete All Zigbee Devices for Unit from Database
  ipcMain.handle("zigbee:deleteAllDevicesForUnit", async (event, projectId, unitIp) => {
    try {
      return await dbService.deleteAllZigbeeDevicesForUnit(projectId, unitIp);
    } catch (error) {
      console.error("Error deleting all zigbee devices for unit:", error);
      throw error;
    }
  });
}
