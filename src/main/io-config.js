/**
 * I/O Configuration IPC Handlers
 * Xử lý các tương tác với RCU I/O Control và Output Configuration
 */

export function registerIOConfigHandlers(ipcMain, rcu) {
  // ==================== RCU Group Control ====================

  // Set group state on RCU device
  ipcMain.handle(
    "rcu:setGroupState",
    async (event, { canId, group, value, unitIp }) => {
      try {
        return await rcu.setGroupState(unitIp, canId, group, value);
      } catch (error) {
        console.error("Error setting group state:", error);
        throw error;
      }
    }
  );

  // Set output state on RCU device
  ipcMain.handle(
    "rcu:setOutputState",
    async (event, { canId, outputIndex, value, unitIp }) => {
      try {
        return await rcu.setOutputState(unitIp, canId, outputIndex, value);
      } catch (error) {
        console.error("Error setting output state:", error);
        throw error;
      }
    }
  );

  // Set input state on RCU device
  ipcMain.handle(
    "rcu:setInputState",
    async (event, { canId, inputIndex, value, unitIp }) => {
      try {
        return await rcu.setInputState(unitIp, canId, inputIndex, value);
      } catch (error) {
        console.error("Error setting input state:", error);
        throw error;
      }
    }
  );

  // Set multiple group states on RCU device
  ipcMain.handle(
    "rcu:setMultipleGroupStates",
    async (event, { canId, groupSettings, unitIp }) => {
      try {
        return await rcu.setMultipleGroupStates(unitIp, canId, groupSettings);
      } catch (error) {
        console.error("Error setting multiple group states:", error);
        throw error;
      }
    }
  );

  // Get all group states from RCU device
  ipcMain.handle("rcu:getAllGroupStates", async (event, { canId, unitIp }) => {
    try {
      return await rcu.getAllGroupStates(unitIp, canId);
    } catch (error) {
      console.error("Error getting group states:", error);
      throw error;
    }
  });

  // Get all output states from RCU device
  ipcMain.handle("rcu:getAllOutputStates", async (event, { canId, unitIp }) => {
    try {
      return await rcu.getAllOutputStates(unitIp, canId);
    } catch (error) {
      console.error("Error getting output states:", error);
      throw error;
    }
  });

  // Get all input states from RCU device
  ipcMain.handle("rcu:getAllInputStates", async (event, { canId, unitIp }) => {
    try {
      return await rcu.getAllInputStates(unitIp, canId);
    } catch (error) {
      console.error("Error getting input states:", error);
      throw error;
    }
  });

  // ==================== RCU Input Configuration ====================

  // Get all input configs from RCU device
  ipcMain.handle("rcu:getAllInputConfigs", async (event, { canId, unitIp }) => {
    try {
      return await rcu.getAllInputConfigs(unitIp, canId);
    } catch (error) {
      console.error("Error getting input configs:", error);
      throw error;
    }
  });

  // Setup input config on RCU device
  ipcMain.handle(
    "rcu:setupInputConfig",
    async (event, { unitIp, canId, inputConfig }) => {
      try {
        return await rcu.setupInputConfig(unitIp, canId, inputConfig);
      } catch (error) {
        console.error("Error setting up input config:", error);
        throw error;
      }
    }
  );

  // Setup batch input configs on RCU device (optimized)
  ipcMain.handle(
    "rcu:setupBatchInputConfigs",
    async (event, { unitIp, canId, inputConfigs, maxBytes }) => {
      try {
        return await rcu.setupBatchInputConfigs(unitIp, canId, inputConfigs, maxBytes);
      } catch (error) {
        console.error("Error setting up batch input configs:", error);
        throw error;
      }
    }
  );

  // ==================== RCU Output Configuration ====================

  // Get output assignments from RCU device
  ipcMain.handle("rcu:getOutputAssign", async (event, { unitIp, canId }) => {
    try {
      return await rcu.getOutputAssign(unitIp, canId);
    } catch (error) {
      console.error("Error getting output assignments:", error);
      throw error;
    }
  });

  // Get output config from RCU device
  ipcMain.handle("rcu:getOutputConfig", async (event, unitIp, canId) => {
    try {
      return await rcu.getOutputConfig(unitIp, canId);
    } catch (error) {
      console.error("Error getting output config:", error);
      throw error;
    }
  });

  // Set output assignment on RCU device
  ipcMain.handle(
    "rcu:setOutputAssign",
    async (event, unitIp, canId, outputIndex, lightingAddress) => {
      try {
        return await rcu.setOutputAssign(
          unitIp,
          canId,
          outputIndex,
          lightingAddress
        );
      } catch (error) {
        console.error("Error setting output assignment:", error);
        throw error;
      }
    }
  );

  // Set all output assignments on RCU device
  ipcMain.handle(
    "rcu:setAllOutputAssignments",
    async (event, unitIp, canId, outputAssignments) => {
      try {
        return await rcu.setAllOutputAssignments(
          unitIp,
          canId,
          outputAssignments
        );
      } catch (error) {
        console.error("Error setting all output assignments:", error);
        throw error;
      }
    }
  );

  // Set output delay off on RCU device
  ipcMain.handle(
    "rcu:setOutputDelayOff",
    async (event, unitIp, canId, outputIndex, delayOff) => {
      try {
        return await rcu.setOutputDelayOff(
          unitIp,
          canId,
          outputIndex,
          delayOff
        );
      } catch (error) {
        console.error("Error setting output delay off:", error);
        throw error;
      }
    }
  );

  // Set output delay on on RCU device
  ipcMain.handle(
    "rcu:setOutputDelayOn",
    async (event, unitIp, canId, outputIndex, delayOn) => {
      try {
        return await rcu.setOutputDelayOn(unitIp, canId, outputIndex, delayOn);
      } catch (error) {
        console.error("Error setting output delay on:", error);
        throw error;
      }
    }
  );

  // Set output config on RCU device
  ipcMain.handle(
    "rcu:setOutputConfig",
    async (event, unitIp, canId, outputIndex, config) => {
      try {
        return await rcu.setOutputConfig(unitIp, canId, outputIndex, config);
      } catch (error) {
        console.error("Error setting output config:", error);
        throw error;
      }
    }
  );

  // Setup batch lighting outputs on RCU device (optimized)
  ipcMain.handle(
    "rcu:setupBatchLightingOutputs",
    async (event, { unitIp, canId, lightingOutputs, maxBytes }) => {
      try {
        return await rcu.setupBatchLightingOutputs(
          unitIp,
          canId,
          lightingOutputs,
          maxBytes
        );
      } catch (error) {
        console.error("Error setting up batch lighting outputs:", error);
        throw error;
      }
    }
  );

  // Get Local AC Config
  ipcMain.handle("rcu:getLocalACConfig", async (event, unitIp, canId) => {
    try {
      return await rcu.getLocalACConfig(unitIp, canId);
    } catch (error) {
      console.error("Error getting local AC config:", error);
      throw error;
    }
  });

  // Set Local AC Config
  ipcMain.handle(
    "rcu:setLocalACConfig",
    async (event, unitIp, canId, acConfigs) => {
      try {
        return await rcu.setLocalACConfig(unitIp, canId, acConfigs);
      } catch (error) {
        console.error("Error setting local AC config:", error);
        throw error;
      }
    }
  );
}
