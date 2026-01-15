import log from "electron-log/renderer";
/**
 * Change IP address of a device
 */
export const changeIpAddress = async (oldIp, newIp, canId) => {
  const oldIpBytes = oldIp.split(".").map((part) => parseInt(part));
  const newIpBytes = newIp.split(".").map((part) => parseInt(part));
  const data = [...newIpBytes, ...oldIpBytes];

  const response = await window.electronAPI.deviceController.changeIpAddress({
    unitIp: oldIp,
    canId: canId,
    data: data,
  });

  if (!response.result.success) {
    throw new Error("Failed to change IP address");
  }
};

/**
 * Change CAN ID of a device
 */
export const changeCanId = async (unitIp, newLastPart, oldCanId) => {
  const response = await window.electronAPI.deviceController.changeCanId({
    unitIp: unitIp,
    canId: oldCanId,
    newLastPart: newLastPart,
  });

  if (!response.result.success) {
    throw new Error("Failed to change CAN ID");
  }
};

/**
 * Change hardware configuration (mode, can_load, recovery_mode)
 */
export const changeHardwareConfig = async (unitIp, canId, config) => {
  let configByte = 0;

  const modeMap = {
    "Stand-Alone": 0,
    Slave: 1,
    Master: 2,
  };
  configByte |= (modeMap[config.mode] || 0) & 0x03;

  if (config.can_load) {
    configByte |= 0x04;
  }

  if (config.recovery_mode) {
    configByte |= 0x40;
  }

  const response = await window.electronAPI.deviceController.setHardwareConfig({
    unitIp: unitIp,
    canId: canId,
    configByte: configByte,
  });

  if (!response.result.success) {
    throw new Error("Failed to change hardware configuration");
  }
};

/**
 * Write I/O configuration to device
 */
export const writeIOConfiguration = async (unitIp, canId, ioConfig) => {
  if (!ioConfig) {
    log.info("No I/O config provided, skipping");
    return;
  }

  try {
    // Write all input configurations at once
    if (ioConfig.inputs && Array.isArray(ioConfig.inputs)) {
      const inputConfigsData = ioConfig.inputs
        .filter((input) => input && input.functionValue !== undefined)
        .map((input, index) => ({
          inputNumber: index,
          inputType: parseInt(input.functionValue) || 0,
          ramp: parseInt(input.ramp) ?? 0,
          preset: parseInt(input.preset) ?? 255,
          ledStatus: parseInt(input.ledStatus) || 0,
          autoMode: input.autoMode || false,
          delayOff: parseInt(input.delayOff) ?? 0,
          groups: input.groups || [],
        }));

      if (inputConfigsData.length > 0) {
        log.info(`Sending ${inputConfigsData.length} input configurations in batch mode to ${unitIp}`);
        const result = await window.electronAPI.ioController.setupBatchInputConfigs({
          unitIp: unitIp,
          canId: canId,
          inputConfigs: inputConfigsData,
          maxBytes: 900, // Auto-split into multiple batches if needed
        });

        if (result.success) {
          log.info(`✓ Successfully sent ${result.successCount} input configs in batch mode`);
        } else {
          log.warn(`⚠ Batch input config send partially failed: ${result.successCount}/${inputConfigsData.length} succeeded`);
        }
      }
    }

    // Write lighting output configurations using batch mode
    if (ioConfig.outputs && Array.isArray(ioConfig.outputs)) {
      // Filter lighting outputs (exclude aircon)
      const lightingOutputs = ioConfig.outputs.filter((output) => output && output.deviceType !== "aircon");

      if (lightingOutputs.length > 0) {
        log.info(`Sending ${lightingOutputs.length} lighting output configurations in batch mode to ${unitIp}`);
        const result = await window.electronAPI.ioController.setupBatchLightingOutputs({
          unitIp: unitIp,
          canId: canId,
          lightingOutputs: lightingOutputs,
          maxBytes: 900, // Auto-split into multiple batches if needed
        });

        if (result.overallSuccess) {
          log.info(`✓ Successfully sent lighting output configs in batch mode`);
        } else {
          log.warn(`Batch lighting output config send partially failed`);
          if (result.assignments && !result.assignments.success) {
            log.error(`  - Assignments error: ${result.assignments.error}`);
          }
          if (result.delayOff && !result.delayOff.success) {
            log.error(`  - Delay off errors:`, result.delayOff.errors);
          }
          if (result.delayOn && !result.delayOn.success) {
            log.error(`  - Delay on errors:`, result.delayOn.errors);
          }
          if (result.configs && !result.configs.success) {
            log.error(`  - Config errors:`, result.configs.errors);
          }
        }
      }
    }

    // Write AC configurations
    if (ioConfig.acConfigs && Array.isArray(ioConfig.acConfigs)) {
      log.info(`Sending AC configurations to ${unitIp}:`, ioConfig.acConfigs);
      await window.electronAPI.ioController.setLocalACConfig(unitIp, canId, ioConfig.acConfigs);
      log.info(`✓ AC configurations sent successfully to ${unitIp}`);
    }
  } catch (error) {
    log.error("Failed to write I/O configuration:", error);
    throw error;
  }
};

/**
 * Convert database RS485 format to network format
 */
export const convertDatabaseToNetworkRS485Format = (databaseConfig) => {
  return {
    baudrate: databaseConfig.baudrate,
    parity: databaseConfig.parity,
    stopBit: databaseConfig.stop_bit,
    boardId: databaseConfig.board_id,
    rs485Type: databaseConfig.config_type,
    numSlaves: databaseConfig.num_slave_devs,
    reserved: databaseConfig.reserved || [0, 0, 0, 0, 0],
    slaves: (databaseConfig.slave_cfg || []).map((slave) => ({
      slaveId: slave.slave_id,
      slaveGroup: slave.slave_group,
      numIndoors: slave.num_indoors,
      indoorGroups: slave.indoor_group || new Array(16).fill(0),
    })),
  };
};

/**
 * Write RS485 configuration to device
 */
export const writeRS485Configuration = async (unitIp, canId, rs485Config) => {
  if (!rs485Config || !Array.isArray(rs485Config)) return;

  try {
    log.info(`Writing RS485 configuration to ${unitIp}:`, rs485Config);

    // RS485 configuration is typically an array of 2 configurations (RS485-1 and RS485-2)
    for (let portIndex = 0; portIndex < rs485Config.length; portIndex++) {
      const config = rs485Config[portIndex];
      if (config) {
        log.info(`Writing RS485 CH${portIndex + 1} config:`, config);

        // Convert database format to network format
        const networkConfig = convertDatabaseToNetworkRS485Format(config);
        log.info(`Converted RS485 CH${portIndex + 1} config:`, networkConfig);

        if (portIndex === 0) {
          // RS485 CH1
          await window.electronAPI.deviceController.setRS485CH1Config({
            unitIp: unitIp,
            canId: canId,
            config: networkConfig,
          });
        } else if (portIndex === 1) {
          // RS485 CH2
          await window.electronAPI.deviceController.setRS485CH2Config({
            unitIp: unitIp,
            canId: canId,
            config: networkConfig,
          });
        }

        // Small delay between RS485 port configurations
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    log.info(`RS485 configuration written successfully to ${unitIp}`);
  } catch (error) {
    log.error("Failed to write RS485 configuration:", error);
    throw error;
  }
};
