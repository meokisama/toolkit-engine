import { getUnitIOSpec } from "@/utils/io-config-utils";
import { getOutputTypeForIndex, getOutputTypeName, getOutputTypeIndex } from "./output-type-utils";
import { findOrCreateDeviceByAddress } from "./device-management-utils";

// Helper function to read I/O configurations from network unit
export async function readIOConfigurations(networkUnit, selectedProject, projectItems, createItem, createdItemsCache) {
  const ioSpec = getUnitIOSpec(networkUnit.type);
  if (!ioSpec) {
    return { input_configs: null, output_configs: null };
  }

  const inputConfigs = { inputs: [] };
  const outputConfigs = { outputs: [] };

  // Read input configurations
  try {
    const inputResponse = await window.electronAPI.ioController.getAllInputConfigs({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
    });

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
          // Create default config for missing inputs
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

    // Add delay after input config read
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.error("Failed to read input configurations:", error);
  }

  // Read output configurations and assignments sequentially to avoid UDP conflicts
  try {
    // Read output assignments first
    console.log("Reading output assignments...");
    const assignResponse = await window.electronAPI.ioController.getOutputAssign({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
    });

    // Add delay between output reads
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Read output configurations second
    console.log("Reading output configurations...");
    const configResponse = await window.electronAPI.ioController.getOutputConfig(networkUnit.ip_address, networkUnit.id_can);

    // Add delay between output reads
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Read AC configurations third for aircon address mapping
    console.log("Reading AC configurations...");
    const acConfigResponse = await window.electronAPI.ioController.getLocalACConfig(networkUnit.ip_address, networkUnit.id_can);

    // Create output configs for all outputs, whether we have network data or not
    for (let i = 0; i < ioSpec.totalOutputs; i++) {
      const assignment = assignResponse?.outputAssignments?.find((a) => a.outputIndex === i);
      const config = configResponse?.outputConfigs?.find((c) => c.outputIndex === i);

      // Determine output type from assignment or default based on unit spec
      const outputType = assignment?.outputType || getOutputTypeForIndex(i, ioSpec.outputs);

      // Handle device_id mapping and assignment data first
      let finalDeviceId = null;
      let assignmentAddress = null;
      let acConfig = null;

      if (outputType === "ac") {
        // For aircon outputs, get address from AC config
        if (acConfigResponse && Array.isArray(acConfigResponse)) {
          // Calculate AC config index: find position of this output in AC outputs list
          const acOutputs = [];
          for (let j = 0; j < ioSpec.totalOutputs; j++) {
            const acOutputType = getOutputTypeForIndex(j, ioSpec.outputs);
            if (acOutputType === "ac") {
              acOutputs.push(j);
            }
          }

          const acConfigIndex = acOutputs.indexOf(i);
          if (acConfigIndex >= 0 && acConfigIndex < acConfigResponse.length) {
            acConfig = acConfigResponse[acConfigIndex];
            assignmentAddress = acConfig.address;

            if (assignmentAddress && assignmentAddress > 0) {
              finalDeviceId = await findOrCreateDeviceByAddress(
                assignmentAddress,
                outputType,
                selectedProject,
                projectItems,
                createItem,
                createdItemsCache
              );
            }
          }
        }
      } else {
        // For lighting outputs, get address from assignment
        if (assignment) {
          assignmentAddress = assignment.lightingAddress || assignment.address;

          // If assignment has an address, try to map it to existing device or create new one
          if (assignmentAddress && assignmentAddress > 0) {
            finalDeviceId = await findOrCreateDeviceByAddress(
              assignmentAddress,
              outputType,
              selectedProject,
              projectItems,
              createItem,
              createdItemsCache
            );
          }
        }
      }

      // Build config data that matches database structure
      const outputTypeName = getOutputTypeName(outputType);
      const typeIndex = getOutputTypeIndex(i, outputType, ioSpec.outputs);
      const outputName = `${outputTypeName} ${typeIndex}`;

      let configData;

      if (outputType === "ac") {
        // Aircon config structure - populate from AC config if available
        // Note: address and deviceId are handled separately at output level, not in config
        configData = {
          name: outputName,
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
        // Lighting/relay/dimmer config structure
        configData = {
          name: outputName,
          // Default values for lighting outputs
          autoTrigger: false,
          delayOffHours: 0,
          delayOffMinutes: 0,
          delayOffSeconds: 0,
          delayOnHours: 0,
          delayOnMinutes: 0,
          delayOnSeconds: 0,
          scheduleOnHour: 0,
          scheduleOnMinute: 0,
          scheduleOffHour: 0,
          scheduleOffMinute: 0,
        };

        // Add dimming settings for dimmer and relay outputs
        if (outputType === "dimmer" || outputType === "relay") {
          configData.minDim = 1;
          configData.maxDim = 100;
        }

        // Handle delay settings from assignment for lighting outputs
        if (assignment) {
          if (assignment.delay || assignment.delayOff) {
            configData.delayOffSeconds = assignment.delay || assignment.delayOff || 0;
          }
          if (assignment.delayOn) {
            configData.delayOnSeconds = assignment.delayOn || 0;
          }
        }
      }

      // Add detailed config data from getOutputConfig
      if (config) {
        // Convert 0-255 range to 0-100% for min/max dim
        if (config.minDimmingLevel !== undefined) {
          configData.minDim = Math.round((config.minDimmingLevel / 255) * 100);
        }
        if (config.maxDimmingLevel !== undefined) {
          configData.maxDim = Math.round((config.maxDimmingLevel / 255) * 100);
        }
        if (config.autoTriggerFlag !== undefined) configData.autoTrigger = config.autoTriggerFlag === 1;
        if (config.scheduleOnHour !== undefined) configData.scheduleOnHour = config.scheduleOnHour;
        if (config.scheduleOnMinute !== undefined) configData.scheduleOnMinute = config.scheduleOnMinute;
        if (config.scheduleOffHour !== undefined) configData.scheduleOffHour = config.scheduleOffHour;
        if (config.scheduleOffMinute !== undefined) configData.scheduleOffMinute = config.scheduleOffMinute;
      }

      const outputConfig = {
        index: i,
        type: outputType,
        device_id: finalDeviceId,
        device_type: outputType === "ac" ? "aircon" : "lighting",
        name: outputName,
        config: configData,
      };

      console.log(`Creating output config for index ${i}:`, {
        index: i,
        type: outputType,
        name: outputConfig.name,
        finalDeviceId: finalDeviceId,
        assignmentAddress: assignmentAddress,
        hasAssignment: !!assignment,
        hasConfig: !!config,
        // AC-specific info
        ...(outputType === "ac" && {
          acConfigIndex:
            acConfigResponse && Array.isArray(acConfigResponse)
              ? (() => {
                  const acOutputs = [];
                  for (let j = 0; j < ioSpec.totalOutputs; j++) {
                    if (getOutputTypeForIndex(j, ioSpec.outputs) === "ac") {
                      acOutputs.push(j);
                    }
                  }
                  return acOutputs.indexOf(i);
                })()
              : -1,
          acConfigAddress:
            acConfigResponse && Array.isArray(acConfigResponse)
              ? (() => {
                  const acOutputs = [];
                  for (let j = 0; j < ioSpec.totalOutputs; j++) {
                    if (getOutputTypeForIndex(j, ioSpec.outputs) === "ac") {
                      acOutputs.push(j);
                    }
                  }
                  const acConfigIndex = acOutputs.indexOf(i);
                  return acConfigIndex >= 0 && acConfigIndex < acConfigResponse.length ? acConfigResponse[acConfigIndex].address : null;
                })()
              : null,
        }),
        // Lighting-specific info
        ...(outputType !== "ac" && {
          assignmentLightingAddress: assignment?.lightingAddress,
          assignmentGenericAddress: assignment?.address,
        }),
      });
      outputConfigs.outputs.push(outputConfig);
    }
  } catch (error) {
    console.error("Failed to read output configurations:", error);
  }

  const result = {
    input_configs: inputConfigs.inputs.length > 0 ? inputConfigs : null,
    output_configs: outputConfigs.outputs.length > 0 ? outputConfigs : null,
  };

  console.log("Final I/O configs result:", {
    unitIp: networkUnit.ip_address,
    inputConfigsCount: inputConfigs.inputs.length,
    outputConfigsCount: outputConfigs.outputs.length,
    hasInputConfigs: !!result.input_configs,
    hasOutputConfigs: !!result.output_configs,
    outputConfigs: result.output_configs,
  });

  return result;
}

// Define configuration fields for each output type
const LIGHTING_CONFIG_FIELDS = [
  "lightingAddress",
  "delayOff",
  "delayOn",
  "minDim",
  "maxDim",
  "autoTrigger",
  "scheduleOnHour",
  "scheduleOnMinute",
  "scheduleOffHour",
  "scheduleOffMinute",
];

const AIRCON_CONFIG_FIELDS = [
  "airconAddress",
  "acEnable",
  "acWindowMode",
  "acFanType",
  "acTempType",
  "acTempUnit",
  "acValveContact",
  "acValveType",
  "acDeadband",
  "acLowFCU_Group",
  "acMedFCU_Group",
  "acHighFCU_Group",
  "acFanAnalogGroup",
  "acAnalogCoolGroup",
  "acAnalogHeatGroup",
  "acValveCoolOpenGroup",
  "acValveCoolCloseGroup",
  "acValveHeatOpenGroup",
  "acValveHeatCloseGroup",
  "acWindowBypass",
  "acSetPointOffset",
  "acUnoccupyPower",
  "acOccupyPower",
  "acStandbyPower",
  "acUnoccupyMode",
  "acOccupyMode",
  "acStandbyMode",
  "acUnoccupyFanSpeed",
  "acOccupyFanSpeed",
  "acStandbyFanSpeed",
  "acUnoccupyCoolSetPoint",
  "acOccupyCoolSetPoint",
  "acStandbyCoolSetPoint",
  "acUnoccupyHeatSetPoint",
  "acOccupyHeatSetPoint",
  "acStandbyHeatSetPoint",
];

/**
 * Generic function to compare configuration fields
 * @param {Object} config - Current configuration
 * @param {Object} originalConfig - Original configuration
 * @param {Array<string>} fields - Array of field names to compare
 * @returns {boolean} True if any field has changed
 */
function hasConfigFieldsChanged(config, originalConfig, fields) {
  if (!originalConfig) return false;
  return fields.some((field) => config[field] !== originalConfig[field]);
}

/**
 * Compare lighting output configuration with original configuration
 * @param {Object} config - Current configuration
 * @param {Object} originalConfig - Original configuration
 * @returns {boolean} True if configuration has changed
 */
export function hasLightingConfigChanged(config, originalConfig) {
  return hasConfigFieldsChanged(config, originalConfig, LIGHTING_CONFIG_FIELDS);
}

/**
 * Compare aircon output configuration with original configuration
 * @param {Object} config - Current configuration
 * @param {Object} originalConfig - Original configuration
 * @returns {boolean} True if configuration has changed
 */
export function hasAirconConfigChanged(config, originalConfig) {
  return hasConfigFieldsChanged(config, originalConfig, AIRCON_CONFIG_FIELDS);
}

/**
 * Compare output configuration with original configuration (automatically detects type)
 * @param {Object} config - Current configuration with type field
 * @param {Object} originalConfig - Original configuration
 * @returns {boolean} True if configuration has changed
 */
export function hasOutputConfigChanged(config, originalConfig) {
  if (!originalConfig) return false;

  // Use type-specific comparison based on config type
  if (config.type === "ac") {
    return hasAirconConfigChanged(config, originalConfig);
  } else {
    return hasLightingConfigChanged(config, originalConfig);
  }
}
