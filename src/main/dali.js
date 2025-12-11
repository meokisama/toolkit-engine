/**
 * DALI IPC Handlers
 * Xử lý các tương tác với DALI devices, groups và scenes (RCU Controller và Database)
 */

export function registerDaliHandlers(ipcMain, dbService, rcu) {
  // ==================== RCU Controller - DALI Operations ====================

  // DALI Commissioning
  ipcMain.handle("rcu:daliCommissioning", async (event, { unitIp, canId, extend }) => {
    try {
      return await rcu.daliCommissioning(unitIp, canId, extend);
    } catch (error) {
      console.error("Error in DALI commissioning:", error);
      throw error;
    }
  });

  // DALI Scan
  ipcMain.handle("rcu:daliScan", async (event, { unitIp, canId }) => {
    try {
      return await rcu.daliScan(unitIp, canId);
    } catch (error) {
      console.error("Error in DALI scan:", error);
      throw error;
    }
  });

  // DALI Conflict Address Commissioning
  ipcMain.handle("rcu:daliConflictAddressCommissioning", async (event, { unitIp, canId, conflictAddresses }) => {
    try {
      return await rcu.daliConflictAddressCommissioning(unitIp, canId, conflictAddresses);
    } catch (error) {
      console.error("Error in DALI conflict address commissioning:", error);
      throw error;
    }
  });

  // Send Address Mapping
  ipcMain.handle("rcu:sendAddressMapping", async (event, { unitIp, canId, addressMapping }) => {
    try {
      return await rcu.sendAddressMapping(unitIp, canId, addressMapping);
    } catch (error) {
      console.error("Error sending DALI address mapping:", error);
      throw error;
    }
  });

  // Send Mapping RCU
  ipcMain.handle("rcu:sendMappingRCU", async (event, { unitIp, canId, rcuMapping }) => {
    try {
      return await rcu.sendMappingRCU(unitIp, canId, rcuMapping);
    } catch (error) {
      console.error("Error sending DALI RCU mapping:", error);
      throw error;
    }
  });

  // Reset All Config
  ipcMain.handle("rcu:resetAllConfig", async (event, { unitIp, canId }) => {
    try {
      return await rcu.resetAllConfig(unitIp, canId);
    } catch (error) {
      console.error("Error resetting DALI configuration:", error);
      throw error;
    }
  });

  // Send Delete Address
  ipcMain.handle("rcu:sendDeleteAddress", async (event, { unitIp, canId, address }) => {
    try {
      return await rcu.sendDeleteAddress(unitIp, canId, address);
    } catch (error) {
      console.error("Error deleting DALI address:", error);
      throw error;
    }
  });

  // DALI Broadcast On
  ipcMain.handle("rcu:daliBroadcastOn", async (event, { unitIp, canId }) => {
    try {
      return await rcu.daliBroadcastOn(unitIp, canId);
    } catch (error) {
      console.error("Error in DALI broadcast ON:", error);
      throw error;
    }
  });

  // DALI Broadcast Off
  ipcMain.handle("rcu:daliBroadcastOff", async (event, { unitIp, canId }) => {
    try {
      return await rcu.daliBroadcastOff(unitIp, canId);
    } catch (error) {
      console.error("Error in DALI broadcast OFF:", error);
      throw error;
    }
  });

  // Trigger DALI Device
  ipcMain.handle("rcu:triggerDaliDevice", async (event, { unitIp, canId, deviceAddress, level }) => {
    try {
      return await rcu.triggerDaliDevice(unitIp, canId, deviceAddress, level);
    } catch (error) {
      console.error("Error triggering DALI device:", error);
      throw error;
    }
  });

  // Trigger DALI Type 8 Device
  ipcMain.handle("rcu:triggerDaliType8Device", async (event, { unitIp, canId, deviceIndex, deviceAddress, colorFeature, brightness, colorData }) => {
    try {
      return await rcu.triggerDaliType8Device(unitIp, canId, deviceIndex, deviceAddress, colorFeature, brightness, colorData);
    } catch (error) {
      console.error("Error triggering DALI Type 8 device:", error);
      throw error;
    }
  });

  // Trigger DALI Group
  ipcMain.handle("rcu:triggerDaliGroup", async (event, { unitIp, canId, groupId, level }) => {
    try {
      return await rcu.triggerDaliGroup(unitIp, canId, groupId, level);
    } catch (error) {
      console.error("Error triggering DALI group:", error);
      throw error;
    }
  });

  // Trigger DALI Scene
  ipcMain.handle("rcu:triggerDaliScene", async (event, { unitIp, canId, sceneId }) => {
    try {
      return await rcu.triggerDaliScene(unitIp, canId, sceneId);
    } catch (error) {
      console.error("Error triggering DALI scene:", error);
      throw error;
    }
  });

  // Send Group & Scene Config
  ipcMain.handle("rcu:sendGroupSceneConfig", async (event, { unitIp, canId, projectId }) => {
    try {
      return await rcu.sendGroupSceneConfig(unitIp, canId, projectId, dbService);
    } catch (error) {
      console.error("Error sending Group & Scene config:", error);
      throw error;
    }
  });

  // ==================== Database - DALI Operations ====================

  // DALI Devices - Database Operations
  ipcMain.handle("dali:getAllDaliDevices", async (event, projectId) => {
    try {
      return await dbService.getAllDaliDevices(projectId);
    } catch (error) {
      console.error("Error getting all DALI devices:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:getDevice", async (event, projectId, address) => {
    try {
      return await dbService.getDaliDevice(projectId, address);
    } catch (error) {
      console.error("Error getting DALI device:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:upsertDaliDevice", async (event, projectId, address, deviceData) => {
    try {
      return await dbService.upsertDaliDevice(projectId, address, deviceData);
    } catch (error) {
      console.error("Error upserting DALI device:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:updateDaliDeviceName", async (event, projectId, address, name) => {
    try {
      return await dbService.updateDaliDeviceName(projectId, address, name);
    } catch (error) {
      console.error("Error updating DALI device name:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:clearDaliDeviceMapping", async (event, projectId, address) => {
    try {
      return await dbService.clearDaliDeviceMapping(projectId, address);
    } catch (error) {
      console.error("Error clearing DALI device mapping:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:deleteDevice", async (event, projectId, address) => {
    try {
      return await dbService.deleteDaliDevice(projectId, address);
    } catch (error) {
      console.error("Error deleting DALI device:", error);
      throw error;
    }
  });

  // DALI Group Metadata - Database Operations
  ipcMain.handle("dali:getDaliGroupName", async (event, projectId, groupId) => {
    try {
      return await dbService.getDaliGroupName(projectId, groupId);
    } catch (error) {
      console.error("Error getting group name:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:getAllDaliGroupNames", async (event, projectId) => {
    try {
      return await dbService.getAllDaliGroupNames(projectId);
    } catch (error) {
      console.error("Error getting all group names:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:updateDaliGroupName", async (event, projectId, groupId, name) => {
    try {
      return await dbService.updateDaliGroupName(projectId, groupId, name);
    } catch (error) {
      console.error("Error updating group name:", error);
      throw error;
    }
  });

  // Initialize 16 DALI groups for a project
  ipcMain.handle("dali:initializeDaliGroups", async (event, projectId) => {
    try {
      return await dbService.initializeDaliGroups(projectId);
    } catch (error) {
      console.error("Error initializing groups:", error);
      throw error;
    }
  });

  // Update group's lighting_group_address
  ipcMain.handle("dali:updateDaliGroupLightingAddress", async (event, projectId, groupId, lightingGroupAddress) => {
    try {
      return await dbService.updateDaliGroupLightingAddress(projectId, groupId, lightingGroupAddress);
    } catch (error) {
      console.error("Error updating group lighting address:", error);
      throw error;
    }
  });

  // Update device's lighting_group_address
  ipcMain.handle("dali:updateDaliDeviceLightingAddress", async (event, projectId, address, lightingGroupAddress) => {
    try {
      return await dbService.updateDaliDeviceLightingAddress(projectId, address, lightingGroupAddress);
    } catch (error) {
      console.error("Error updating device lighting address:", error);
      throw error;
    }
  });

  // DALI Groups - Database Operations
  ipcMain.handle("dali:getDaliGroupDevices", async (event, projectId, groupId) => {
    try {
      return await dbService.getDaliGroupDevices(projectId, groupId);
    } catch (error) {
      console.error("Error getting group devices:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:getAllDaliGroupDevices", async (event, projectId) => {
    try {
      return await dbService.getAllDaliGroupDevices(projectId);
    } catch (error) {
      console.error("Error getting all group devices:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:addDaliDeviceToGroup", async (event, projectId, groupId, deviceAddress) => {
    try {
      return await dbService.addDaliDeviceToGroup(projectId, groupId, deviceAddress);
    } catch (error) {
      console.error("Error adding device to group:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:removeDaliDeviceFromGroup", async (event, projectId, groupId, deviceAddress) => {
    try {
      return await dbService.removeDaliDeviceFromGroup(projectId, groupId, deviceAddress);
    } catch (error) {
      console.error("Error removing device from group:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:getDaliDeviceGroups", async (event, projectId, deviceAddress) => {
    try {
      return await dbService.getDaliDeviceGroups(projectId, deviceAddress);
    } catch (error) {
      console.error("Error getting device groups:", error);
      throw error;
    }
  });

  // DALI Scene Metadata - Database Operations
  ipcMain.handle("dali:getDaliSceneName", async (event, projectId, sceneId) => {
    try {
      return await dbService.getDaliSceneName(projectId, sceneId);
    } catch (error) {
      console.error("Error getting scene name:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:getAllDaliSceneNames", async (event, projectId) => {
    try {
      return await dbService.getAllDaliSceneNames(projectId);
    } catch (error) {
      console.error("Error getting all scene names:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:updateDaliSceneName", async (event, projectId, sceneId, name) => {
    try {
      return await dbService.updateDaliSceneName(projectId, sceneId, name);
    } catch (error) {
      console.error("Error updating scene name:", error);
      throw error;
    }
  });

  // DALI Scenes - Database Operations
  ipcMain.handle("dali:getDaliSceneDevices", async (event, projectId, sceneId) => {
    try {
      return await dbService.getDaliSceneDevices(projectId, sceneId);
    } catch (error) {
      console.error("Error getting scene devices:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:getAllDaliSceneDevices", async (event, projectId) => {
    try {
      return await dbService.getAllDaliSceneDevices(projectId);
    } catch (error) {
      console.error("Error getting all scene devices:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:upsertDaliSceneDevice", async (event, projectId, sceneId, deviceAddress, active, brightness, colorTemp, r, g, b, w) => {
    try {
      return await dbService.upsertDaliSceneDevice(projectId, sceneId, deviceAddress, active, brightness, colorTemp, r, g, b, w);
    } catch (error) {
      console.error("Error upserting scene device:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:deleteDaliSceneDevice", async (event, projectId, sceneId, deviceAddress) => {
    try {
      return await dbService.deleteDaliSceneDevice(projectId, sceneId, deviceAddress);
    } catch (error) {
      console.error("Error deleting scene device:", error);
      throw error;
    }
  });

  // DALI Clear All Configurations - Database Operations
  ipcMain.handle("dali:clearAllDaliDeviceMappings", async (event, projectId) => {
    try {
      return await dbService.clearAllDaliDeviceMappings(projectId);
    } catch (error) {
      console.error("Error clearing all DALI device mappings:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:clearAllDaliGroups", async (event, projectId) => {
    try {
      return await dbService.clearAllDaliGroups(projectId);
    } catch (error) {
      console.error("Error clearing all DALI groups:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:clearAllDaliScenes", async (event, projectId) => {
    try {
      return await dbService.clearAllDaliScenes(projectId);
    } catch (error) {
      console.error("Error clearing all DALI scenes:", error);
      throw error;
    }
  });

  ipcMain.handle("dali:clearAllDaliConfigurations", async (event, projectId) => {
    try {
      return await dbService.clearAllDaliConfigurations(projectId);
    } catch (error) {
      console.error("Error clearing all DALI configurations:", error);
      throw error;
    }
  });
}
