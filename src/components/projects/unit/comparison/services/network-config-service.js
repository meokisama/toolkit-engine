import { getUnitIOSpec } from "@/utils/io-config-utils";
import { convertNetworkToDialogFormat } from "../utils/network-format-converter";

/**
 * Read all configurations from a network unit (following the same pattern as transfer function)
 * @param {Object} networkUnit - Network unit to read from
 * @param {Map} networkConfigCache - Cache map for network unit configurations
 * @returns {Object} Network unit with all configurations
 */
export async function readNetworkUnitConfigurations(networkUnit, networkConfigCache) {
  const cacheKey = `${networkUnit.ip_address}_${networkUnit.id_can}`;

  // Check cache first
  if (networkConfigCache.has(cacheKey)) {
    return networkConfigCache.get(cacheKey);
  }

  try {
    console.log(`Reading configurations from network unit: ${networkUnit.ip_address}`);

    const unitWithConfigs = { ...networkUnit };

    // Read RS485 configurations sequentially (same as transfer function)
    try {
      console.log("Reading RS485 CH1 configuration...");
      const ch1Config = await window.electronAPI.deviceController.getRS485CH1Config({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      // Add delay between RS485 channel reads
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("Reading RS485 CH2 configuration...");
      const ch2Config = await window.electronAPI.deviceController.getRS485CH2Config({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      // Convert to database format (same as transfer function)
      unitWithConfigs.rs485_config = [convertNetworkToDialogFormat(ch1Config), convertNetworkToDialogFormat(ch2Config)];

      // Add delay after RS485 config read
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`Failed to read RS485 config from ${networkUnit.ip_address}:`, error);
      unitWithConfigs.rs485_config = null;
    }

    // Read input configurations (same as transfer function)
    try {
      const inputResponse = await window.electronAPI.ioController.getAllInputConfigs({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      const inputConfigs = { inputs: [] };

      // Get unit IO spec to determine number of inputs
      const ioSpec = getUnitIOSpec(networkUnit.type);
      if (!ioSpec) {
        unitWithConfigs.input_configs = inputConfigs;
        return;
      }

      // Process inputs based on unit spec (same as transfer function)
      if (inputResponse?.configs) {
        for (let i = 0; i < ioSpec.inputs; i++) {
          const unitConfig = inputResponse.configs.find((config) => config.inputNumber === i);

          if (unitConfig) {
            inputConfigs.inputs.push({
              index: i,
              function_value: unitConfig.inputType || 0,
              lighting_id: null, // Will be resolved when needed
              multi_group_config: unitConfig.groups || [],
              rlc_config: {
                ramp: unitConfig.ramp ?? 0,
                preset: unitConfig.preset ?? 255,
                ledStatus: unitConfig.ledStatus?.raw || 0,
                autoMode: unitConfig.autoMode || 0,
                delayOff: unitConfig.delayOff ?? 0,
                delayOn: unitConfig.delayOn ?? 0,
              },
            });
          } else {
            // Create default config for missing inputs (same as transfer function)
            inputConfigs.inputs.push({
              index: i,
              function_value: 0,
              lighting_id: null,
              multi_group_config: [],
              rlc_config: {
                ramp: 0,
                preset: 255,
                ledStatus: 0,
                autoMode: 0,
                delayOff: 0,
                delayOn: 0,
              },
            });
          }
        }
      }

      unitWithConfigs.input_configs = inputConfigs;

      // Add delay after input config read
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`Failed to read input configs from ${networkUnit.ip_address}:`, error);
      unitWithConfigs.input_configs = null;
    }

    // Read output configurations (same as transfer function)
    try {
      // Read output assignments first
      const assignResponse = await window.electronAPI.ioController.getOutputAssign({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      // Add delay between output reads
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Read output configurations second
      const configResponse = await window.electronAPI.ioController.getOutputConfig(networkUnit.ip_address, networkUnit.id_can);

      // Add delay between output reads
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Read AC configurations third
      const acConfigResponse = await window.electronAPI.ioController.getLocalACConfig(networkUnit.ip_address, networkUnit.id_can);

      const outputConfigs = { outputs: [] };

      // Get unit IO spec to determine output types (same as transfer function)
      const ioSpec = getUnitIOSpec(networkUnit.type);
      if (!ioSpec) {
        unitWithConfigs.output_configs = outputConfigs;
        return;
      }

      // Helper function to get output type for index (same as transfer function)
      const getOutputTypeForIndex = (index, outputSpec) => {
        let currentIndex = 0;

        // Check relay outputs first
        if (index < currentIndex + outputSpec.relay) {
          return "relay";
        }
        currentIndex += outputSpec.relay;

        // Check dimmer outputs
        if (index < currentIndex + outputSpec.dimmer) {
          return "dimmer";
        }
        currentIndex += outputSpec.dimmer;

        // Check analog outputs
        if (index < currentIndex + outputSpec.ao) {
          return "ao";
        }
        currentIndex += outputSpec.ao;

        // Check AC outputs
        if (index < currentIndex + outputSpec.ac) {
          return "ac";
        }

        return "unknown";
      };

      // Process all outputs (same logic as transfer function)
      for (let i = 0; i < ioSpec.totalOutputs; i++) {
        const assignment = assignResponse?.outputAssignments?.find((a) => a.outputIndex === i);
        const config = configResponse?.outputConfigs?.find((c) => c.outputIndex === i);

        // Determine output type
        const outputType = assignment?.outputType || getOutputTypeForIndex(i, ioSpec.outputs);

        let configData;
        let assignmentAddress = null;

        if (outputType === "ac") {
          // For aircon outputs, get AC config
          const acOutputs = [];
          for (let j = 0; j < ioSpec.totalOutputs; j++) {
            if (getOutputTypeForIndex(j, ioSpec.outputs) === "ac") {
              acOutputs.push(j);
            }
          }

          const acConfigIndex = acOutputs.indexOf(i);
          let acConfig = null;
          if (acConfigIndex >= 0 && acConfigIndex < (acConfigResponse?.length || 0)) {
            acConfig = acConfigResponse[acConfigIndex];
            assignmentAddress = acConfig?.address || 0;
          }

          // Aircon config structure (same as transfer function)
          // Note: address is added here only for comparison purposes
          configData = {
            address: assignmentAddress || 0, // For comparison only
            enable: acConfig?.enable || false,
            windowMode: acConfig?.windowMode || 0,
            fanType: acConfig?.fanType || 0,
            tempType: acConfig?.tempType || 0,
            tempUnit: acConfig?.tempUnit || 0,
            valveContact: acConfig?.valveContact || 0,
            valveType: acConfig?.valveType || 0,
            deadband: acConfig?.deadband || 20,
            lowFCU_Group: acConfig?.lowFCU_Group || 0,
            medFCU_Group: acConfig?.medFCU_Group || 0,
            highFCU_Group: acConfig?.highFCU_Group || 0,
            fanAnalogGroup: acConfig?.fanAnalogGroup || 0,
            analogCoolGroup: acConfig?.analogCoolGroup || 0,
            analogHeatGroup: acConfig?.analogHeatGroup || 0,
            valveCoolOpenGroup: acConfig?.valveCoolOpenGroup || 0,
            valveCoolCloseGroup: acConfig?.valveCoolCloseGroup || 0,
            valveHeatOpenGroup: acConfig?.valveHeatOpenGroup || 0,
            valveHeatCloseGroup: acConfig?.valveHeatCloseGroup || 0,
            windowBypass: acConfig?.windowBypass || 0,
            setPointOffset: acConfig?.setPointOffset || 0,
            unoccupyPower: acConfig?.unoccupyPower || 0,
            occupyPower: acConfig?.occupyPower || 0,
            standbyPower: acConfig?.standbyPower || 0,
            unoccupyMode: acConfig?.unoccupyMode || 0,
            occupyMode: acConfig?.occupyMode || 0,
            standbyMode: acConfig?.standbyMode || 0,
            unoccupyFanSpeed: acConfig?.unoccupyFanSpeed || 0,
            occupyFanSpeed: acConfig?.occupyFanSpeed || 0,
            standbyFanSpeed: acConfig?.standbyFanSpeed || 0,
            unoccupyCoolSetPoint: acConfig?.unoccupyCoolSetPoint || 0,
            occupyCoolSetPoint: acConfig?.occupyCoolSetPoint || 0,
            standbyCoolSetPoint: acConfig?.standbyCoolSetPoint || 0,
            unoccupyHeatSetPoint: acConfig?.unoccupyHeatSetPoint || 0,
            occupyHeatSetPoint: acConfig?.occupyHeatSetPoint || 0,
            standbyHeatSetPoint: acConfig?.standbyHeatSetPoint || 0,
          };
        } else {
          // Lighting/relay/dimmer config structure (same as transfer function)
          assignmentAddress = assignment?.lightingAddress || assignment?.address || 0;

          configData = {
            address: assignmentAddress || 0, // Add address to config for comparison
            autoTrigger: config?.autoTriggerFlag === 1 || false,
            delayOffHours: 0,
            delayOffMinutes: 0,
            delayOffSeconds: assignment?.delay || assignment?.delayOff || 0,
            delayOnHours: 0,
            delayOnMinutes: 0,
            delayOnSeconds: assignment?.delayOn || 0,
            scheduleOnHour: config?.scheduleOnHour || 0,
            scheduleOnMinute: config?.scheduleOnMinute || 0,
            scheduleOffHour: config?.scheduleOffHour || 0,
            scheduleOffMinute: config?.scheduleOffMinute || 0,
          };

          // Add dimming settings for dimmer, relay, and AO outputs
          if (outputType === "dimmer" || outputType === "relay" || outputType === "ao") {
            configData.minDim = config?.minDimmingLevel ? Math.round((config.minDimmingLevel / 255) * 100) : 1;
            configData.maxDim = config?.maxDimmingLevel ? Math.round((config.maxDimmingLevel / 255) * 100) : 100;
          }
        }

        const outputConfig = {
          index: i,
          type: outputType,
          device_id: assignment?.deviceId || null,
          device_type: outputType === "ac" ? "aircon" : "lighting",
          name: `${outputType} ${i + 1}`,
          config: configData,
        };

        outputConfigs.outputs.push(outputConfig);
      }

      unitWithConfigs.output_configs = outputConfigs;
    } catch (error) {
      console.warn(`Failed to read output configs from ${networkUnit.ip_address}:`, error);
      unitWithConfigs.output_configs = null;
    }

    // Read advanced configurations (scenes, schedules, curtains, knx, multi scenes, sequences)
    try {
      console.log("Reading advanced configurations...");

      // Read scenes
      try {
        const scenesResult = await window.electronAPI.sceneController.getAllScenesInformation({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });
        unitWithConfigs.scenes = scenesResult?.scenes || [];
        console.log(`Found ${unitWithConfigs.scenes.length} scenes on network unit`);
      } catch (error) {
        console.warn(`Failed to read scenes from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.scenes = [];
      }

      // Add delay between reads
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read schedules
      try {
        const schedulesResult = await window.electronAPI.scheduleController.getAllSchedulesInformation({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });
        unitWithConfigs.schedules = schedulesResult?.data || [];
        console.log(`Found ${unitWithConfigs.schedules.length} schedules on network unit`);
      } catch (error) {
        console.warn(`Failed to read schedules from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.schedules = [];
      }

      // Add delay between reads
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read curtains
      try {
        const curtainsResult = await window.electronAPI.curtainController.getCurtainConfig({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
          curtainIndex: null, // Get all curtains
        });
        unitWithConfigs.curtains = curtainsResult?.curtains || [];
        console.log(`Found ${unitWithConfigs.curtains.length} curtains on network unit`);
      } catch (error) {
        console.warn(`Failed to read curtains from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.curtains = [];
      }

      // Add delay between reads
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read KNX configurations
      try {
        const knxResult = await window.electronAPI.knxController.getKnxConfig({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
          knxAddress: null, // Get all KNX configs
        });
        unitWithConfigs.knxConfigs = knxResult?.knxConfigs || [];
        console.log(`Found ${unitWithConfigs.knxConfigs.length} KNX configs on network unit`);
      } catch (error) {
        console.warn(`Failed to read KNX configs from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.knxConfigs = [];
      }

      // Add delay between reads
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read multi scenes
      try {
        const multiScenesResult = await window.electronAPI.multiScenesController.getAllMultiScenesInformation({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });
        unitWithConfigs.multiScenes = multiScenesResult?.multiScenes || [];
        console.log(`Found ${unitWithConfigs.multiScenes.length} multi scenes on network unit`);
      } catch (error) {
        console.warn(`Failed to read multi scenes from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.multiScenes = [];
      }

      // Add delay between reads
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read sequences
      try {
        const sequencesResult = await window.electronAPI.sequenceController.getAllSequencesInformation({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });
        unitWithConfigs.sequences = sequencesResult?.sequences || [];
        console.log(`Found ${unitWithConfigs.sequences.length} sequences on network unit`);
      } catch (error) {
        console.warn(`Failed to read sequences from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.sequences = [];
      }
    } catch (error) {
      console.warn(`Failed to read advanced configurations from ${networkUnit.ip_address}:`, error);
      // Set default empty arrays for all advanced configs
      unitWithConfigs.scenes = [];
      unitWithConfigs.schedules = [];
      unitWithConfigs.curtains = [];
      unitWithConfigs.knxConfigs = [];
      unitWithConfigs.multiScenes = [];
      unitWithConfigs.sequences = [];
    }

    // Cache the result
    networkConfigCache.set(cacheKey, unitWithConfigs);

    return unitWithConfigs;
  } catch (error) {
    console.error(`Failed to read configurations from network unit ${networkUnit.ip_address}:`, error);
    throw error;
  }
}
