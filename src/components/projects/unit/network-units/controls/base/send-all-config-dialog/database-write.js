import { changeIpAddress, changeCanId, changeHardwareConfig, writeIOConfiguration, writeRS485Configuration } from "./device-config";
import log from "electron-log/renderer";
/**
 * Write database unit configuration to network unit
 * @param {Object} databaseUnit - Database unit object
 * @param {Object} networkUnit - Network unit object
 * @param {Function} setCurrentOperation - Function to update current operation message
 * @param {Function} setProgress - Function to update progress
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const writeDatabaseConfigToUnit = async (databaseUnit, networkUnit, setCurrentOperation, setProgress) => {
  try {
    setCurrentOperation(`Writing database configuration to ${networkUnit.type} (${networkUnit.ip_address})...`);

    // Use network unit's current IP and CAN ID for initial operations
    let currentIp = networkUnit.ip_address;
    let currentCanId = networkUnit.id_can;

    // 1. Write hardware configuration (mode, can_load, recovery_mode)
    await changeHardwareConfig(currentIp, currentCanId, {
      mode: databaseUnit.mode,
      can_load: databaseUnit.can_load,
      recovery_mode: databaseUnit.recovery_mode,
    });
    setProgress((prev) => prev + 15);

    // Use new JSON structure
    log.info("Database unit I/O configs:", {
      input_configs: databaseUnit.input_configs,
      output_configs: databaseUnit.output_configs,
    });

    if (databaseUnit.input_configs || databaseUnit.output_configs) {
      setCurrentOperation("Writing I/O configuration...");

      const inputConfigs = databaseUnit.input_configs || { inputs: [] };
      const outputConfigs = databaseUnit.output_configs || { outputs: [] };

      // Convert new structure to format compatible with existing UDP logic
      const detailedIOConfig = {
        inputs: (inputConfigs.inputs || []).map((input) => ({
          index: input.index,
          functionValue: input.function_value || 0, // Use functionValue for compatibility
          lightingId: input.lighting_id,
          ramp: input.rlc_config?.ramp || 0,
          preset: input.rlc_config?.preset || 255,
          ledStatus: input.rlc_config?.ledStatus || 0, // Use ledStatus for compatibility
          autoMode: input.rlc_config?.autoMode || 0, // Use autoMode for compatibility
          delayOff: input.rlc_config?.delayOff || 0, // Use delayOff for compatibility
          delayOn: input.rlc_config?.delayOn || 0, // Use delayOn for compatibility
          groups: input.multi_group_config || [], // Use groups for compatibility
        })),
        outputs: (outputConfigs.outputs || []).map((output) => ({
          index: output.index,
          name: output.name,
          type: output.type,
          deviceId: output.device_id,
          deviceType: output.device_type, // Keep consistent naming
          config: output.config || {},
        })),
      };

      log.info("Detailed I/O config prepared:", {
        inputsCount: detailedIOConfig.inputs?.length || 0,
        outputsCount: detailedIOConfig.outputs?.length || 0,
        inputs: detailedIOConfig.inputs,
        outputs: detailedIOConfig.outputs,
      });

      // Process input configurations - data is already prepared above
      // No additional processing needed for new structure

      // Process output configurations - data is already prepared above
      log.info("Starting output configuration processing...", {
        hasOutputs: detailedIOConfig.outputs && Array.isArray(detailedIOConfig.outputs),
        outputsCount: detailedIOConfig.outputs?.length || 0,
      });

      if (detailedIOConfig.outputs && Array.isArray(detailedIOConfig.outputs)) {
        try {
          // Load detailed output configurations from database
          const detailedOutputConfigs = await window.electronAPI.unit.getAllOutputConfigs(databaseUnit.id);

          // Load lighting and aircon items to convert deviceId to address
          const lightingItems = await window.electronAPI.lighting.getAll(databaseUnit.project_id);
          const airconItems = await window.electronAPI.aircon.getAll(databaseUnit.project_id);

          // Initialize AC configs array (10 items) with default values matching packet structure
          const acConfigs = new Array(10).fill(null).map((_, index) => ({
            address: 0,
            enable: false,
            windowMode: 0,
            fanType: 0,
            tempType: 0,
            tempUnit: 0,
            valveContact: 0,
            valveType: 0,
            deadband: 0,
            lowFCU_Group: 0,
            medFCU_Group: 0,
            highFCU_Group: 0,
            fanAnalogGroup: 0,
            analogCoolGroup: 0,
            analogHeatGroup: 0,
            valveCoolOpenGroup: 0,
            valveCoolCloseGroup: 0,
            valveHeatOpenGroup: 0,
            valveHeatCloseGroup: 0,
            windowBypass: 0,
            setPointOffset: 0,
            windowOpenAction: 0,
            windowOpenCoolSetPoint: 0,
            windowOpenHeatSetPoint: 0,
            windowDelay: 0,
            roomAddress: 0,
            unoccupyPower: 0,
            occupyPower: 0,
            standbyPower: 0,
            unoccupyMode: 0,
            occupyMode: 0,
            standbyMode: 0,
            unoccupyFanSpeed: 0,
            occupyFanSpeed: 0,
            standbyFanSpeed: 0,
            unoccupyCoolSetPoint: 0,
            occupyCoolSetPoint: 0,
            standbyCoolSetPoint: 0,
            unoccupyHeatSetPoint: 0,
            occupyHeatSetPoint: 0,
            standbyHeatSetPoint: 0,
          }));

          // First pass: Process all output configurations and set lightingAddress
          for (let i = 0; i < detailedIOConfig.outputs.length; i++) {
            const output = detailedIOConfig.outputs[i];
            const detailedConfig = detailedOutputConfigs.find((config) => config.output_index === output.index);
            if (detailedConfig && detailedConfig.config_data) {
              let lightingAddress = 0;

              // Convert deviceId to address based on device type
              // Use device_id and device_type from output level (not from config_data)
              if (detailedConfig.device_id) {
                const deviceId = parseInt(detailedConfig.device_id);

                log.info(`Processing output ${output.index}:`, {
                  deviceId,
                  deviceType: detailedConfig.device_type,
                  lightingItemsCount: lightingItems.length,
                  airconItemsCount: airconItems.length,
                });

                if (detailedConfig.device_type === "aircon") {
                  // Aircon outputs should not have lighting address
                  lightingAddress = 0;

                  // Map AC output config to AC configs array
                  if (detailedConfig.device_type === "aircon") {
                    const acOutputs = detailedIOConfig.outputs.filter((o) => {
                      const detailedConfigForOutput = detailedOutputConfigs.find((config) => config.output_index === o.index);
                      return detailedConfigForOutput?.device_type === "aircon";
                    });
                    const acConfigIndex = acOutputs.findIndex((o) => o.index === output.index);

                    if (acConfigIndex >= 0 && acConfigIndex < 10) {
                      // Find aircon item by ID to get address for AC config
                      const airconItem = airconItems.find((item) => item.id === deviceId);
                      const airconAddress = parseInt(airconItem?.address) || 0;

                      acConfigs[acConfigIndex] = {
                        address: airconAddress,
                        enable: detailedConfig.config_data.enable || false,
                        windowMode: detailedConfig.config_data.windowMode || 0,
                        fanType: detailedConfig.config_data.fanType || 0,
                        tempType: detailedConfig.config_data.tempType || 0,
                        tempUnit: detailedConfig.config_data.tempUnit || 0,
                        valveContact: detailedConfig.config_data.valveContact || 0,
                        valveType: detailedConfig.config_data.valveType || 0,
                        deadband: detailedConfig.config_data.deadband || 0,
                        lowFCU_Group: detailedConfig.config_data.lowFCU_Group || 0,
                        medFCU_Group: detailedConfig.config_data.medFCU_Group || 0,
                        highFCU_Group: detailedConfig.config_data.highFCU_Group || 0,
                        fanAnalogGroup: detailedConfig.config_data.fanAnalogGroup || 0,
                        analogCoolGroup: detailedConfig.config_data.analogCoolGroup || 0,
                        analogHeatGroup: detailedConfig.config_data.analogHeatGroup || 0,
                        valveCoolOpenGroup: detailedConfig.config_data.valveCoolOpenGroup || 0,
                        valveCoolCloseGroup: detailedConfig.config_data.valveCoolCloseGroup || 0,
                        valveHeatOpenGroup: detailedConfig.config_data.valveHeatOpenGroup || 0,
                        valveHeatCloseGroup: detailedConfig.config_data.valveHeatCloseGroup || 0,
                        windowBypass: detailedConfig.config_data.windowBypass || 0,
                        setPointOffset: detailedConfig.config_data.setPointOffset || 0,
                        windowOpenAction: detailedConfig.config_data.windowOpenAction || 0,
                        windowOpenCoolSetPoint: detailedConfig.config_data.windowOpenCoolSetPoint || 0,
                        windowOpenHeatSetPoint: detailedConfig.config_data.windowOpenHeatSetPoint || 0,
                        windowDelay: detailedConfig.config_data.windowDelay || 0,
                        roomAddress: detailedConfig.config_data.roomAddress || 0,
                        unoccupyPower: detailedConfig.config_data.unoccupyPower || 0,
                        occupyPower: detailedConfig.config_data.occupyPower || 0,
                        standbyPower: detailedConfig.config_data.standbyPower || 0,
                        unoccupyMode: detailedConfig.config_data.unoccupyMode || 0,
                        occupyMode: detailedConfig.config_data.occupyMode || 0,
                        standbyMode: detailedConfig.config_data.standbyMode || 0,
                        unoccupyFanSpeed: detailedConfig.config_data.unoccupyFanSpeed || 0,
                        occupyFanSpeed: detailedConfig.config_data.occupyFanSpeed || 0,
                        standbyFanSpeed: detailedConfig.config_data.standbyFanSpeed || 0,
                        unoccupyCoolSetPoint: detailedConfig.config_data.unoccupyCoolSetPoint || 0,
                        occupyCoolSetPoint: detailedConfig.config_data.occupyCoolSetPoint || 0,
                        standbyCoolSetPoint: detailedConfig.config_data.standbyCoolSetPoint || 0,
                        unoccupyHeatSetPoint: detailedConfig.config_data.unoccupyHeatSetPoint || 0,
                        occupyHeatSetPoint: detailedConfig.config_data.occupyHeatSetPoint || 0,
                        standbyHeatSetPoint: detailedConfig.config_data.standbyHeatSetPoint || 0,
                      };
                    }
                  }
                } else {
                  // Find lighting item by ID to get address
                  const lightingItem = lightingItems.find((item) => item.id === deviceId);
                  if (lightingItem) {
                    lightingAddress = parseInt(lightingItem.address) || 0;
                    log.info(`Found lighting item for output ${output.index}:`, {
                      lightingItemId: lightingItem.id,
                      lightingItemAddress: lightingItem.address,
                      lightingAddress,
                    });
                  } else {
                    log.info(`No lighting item found for deviceId ${deviceId} in output ${output.index}`);
                  }
                }
              }

              // Convert delay format from database to expected format
              const configData = detailedConfig.config_data;
              let delayOff = 0;
              let delayOn = 0;

              // Convert delay off from hours/minutes/seconds to total seconds
              if (configData.delayOffHours !== undefined || configData.delayOffMinutes !== undefined || configData.delayOffSeconds !== undefined) {
                delayOff =
                  (parseInt(configData.delayOffHours) || 0) * 3600 +
                  (parseInt(configData.delayOffMinutes) || 0) * 60 +
                  (parseInt(configData.delayOffSeconds) || 0);
              }

              // Convert delay on from hours/minutes/seconds to total seconds
              if (configData.delayOnHours !== undefined || configData.delayOnMinutes !== undefined || configData.delayOnSeconds !== undefined) {
                delayOn =
                  (parseInt(configData.delayOnHours) || 0) * 3600 +
                  (parseInt(configData.delayOnMinutes) || 0) * 60 +
                  (parseInt(configData.delayOnSeconds) || 0);
              }

              // Merge detailed configuration with basic output config
              detailedIOConfig.outputs[i] = {
                ...output,
                ...configData,
                lightingAddress: lightingAddress,
                delayOff: delayOff, // Convert to seconds for UDP command
                delayOn: delayOn, // Convert to seconds for UDP command
              };
            }
          }

          // Add AC configs to detailed I/O config
          detailedIOConfig.acConfigs = acConfigs;
        } catch (error) {
          log.warn("Failed to load detailed output configurations:", error);
        }
      }

      await writeIOConfiguration(currentIp, currentCanId, detailedIOConfig);
      setProgress((prev) => prev + 10);
    }

    // 4. Write RS485 configuration if exists
    log.info("Database unit RS485 config check:", {
      hasRS485Config: !!databaseUnit.rs485_config,
      rs485ConfigType: typeof databaseUnit.rs485_config,
      rs485ConfigLength: Array.isArray(databaseUnit.rs485_config) ? databaseUnit.rs485_config.length : "not array",
      rs485Config: databaseUnit.rs485_config,
    });

    if (databaseUnit.rs485_config) {
      setCurrentOperation("Writing RS485 configuration...");
      await writeRS485Configuration(currentIp, currentCanId, databaseUnit.rs485_config);
      setProgress((prev) => prev + 10);
    } else {
      log.info("No RS485 configuration found in database unit, skipping RS485 config write");
    }

    // 5. Write IP and CAN ID changes last (to avoid communication issues)
    if (databaseUnit.ip_address !== networkUnit.ip_address) {
      setCurrentOperation("Updating IP address...");
      await changeIpAddress(networkUnit.ip_address, databaseUnit.ip_address, currentCanId);
      currentIp = databaseUnit.ip_address; // Update current IP for next operation
      setProgress((prev) => prev + 15);
    }

    if (databaseUnit.id_can !== networkUnit.id_can) {
      setCurrentOperation("Updating CAN ID...");
      const newLastPart = parseInt(databaseUnit.id_can.split(".")[3]);
      await changeCanId(currentIp, newLastPart, currentCanId);
      setProgress((prev) => prev + 15);
    }

    return { success: true };
  } catch (error) {
    log.error("Failed to write database configuration:", error);
    return { success: false, error: error.message };
  }
};
