/**
 * Utility functions for I/O configuration management
 */

import { getUnitIOSpec, getOutputTypes } from "@/constants";

// Re-export functions from constants for convenience
export { getUnitIOSpec, getOutputTypes };

/**
 * Get output label for display
 * @param {string} type - Output type ('relay', 'dimmer', 'ao', 'ac')
 * @returns {string} Display label
 */
const getOutputLabel = (type) => {
  switch (type) {
    case "relay":
      return "Relay";
    case "dimmer":
      return "Dimmer";
    case "ao":
      return "Analog";
    case "ac":
      return "Aircon";
    default:
      return type;
  }
};

/**
 * Create default input configurations for a unit
 * @param {string} unitType - The type of unit (e.g., 'Bedside-17T', 'RLC-I20')
 * @returns {Object} Default input configurations
 */
export const createDefaultInputConfigs = (unitType) => {
  const inputs = [];

  // Create default input configurations
  for (let i = 0; i < getInputCount(unitType); i++) {
    inputs.push({
      index: i,
      function_value: 0, // Default to first function
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

  return { inputs };
};

/**
 * Create default AC output configuration
 * @returns {Object} Default AC configuration
 */
const createDefaultACConfig = () => ({
  // Basic configuration
  enable: false,
  windowMode: 0,
  fanType: 0,
  tempType: 0,
  tempUnit: 0,
  valveContact: 0,
  valveType: 0,
  deadband: 10,
  windowBypass: 0,
  setPointOffset: 0,

  // Window open configuration
  windowOpenAction: 0,
  windowOpenCoolSetPoint: 0,
  windowOpenHeatSetPoint: 0,
  windowDelay: 0,
  roomAddress: 0,

  // Group assignments
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

  // Power and mode settings
  unoccupyPower: 0,
  occupyPower: 0,
  standbyPower: 0,
  unoccupyMode: 0,
  occupyMode: 0,
  standbyMode: 0,
  unoccupyFanSpeed: 0,
  occupyFanSpeed: 0,
  standbyFanSpeed: 0,

  // Set point values
  unoccupyCoolSetPoint: 0,
  occupyCoolSetPoint: 0,
  standbyCoolSetPoint: 0,
  unoccupyHeatSetPoint: 0,
  occupyHeatSetPoint: 0,
  standbyHeatSetPoint: 0,
});

/**
 * Create default lighting/relay/dimmer/AO output configuration
 * @returns {Object} Default lighting configuration
 */
const createDefaultLightingConfig = () => ({
  // Delay settings
  delayOffHours: 0,
  delayOffMinutes: 0,
  delayOffSeconds: 0,
  delayOnHours: 0,
  delayOnMinutes: 0,
  delayOnSeconds: 0,

  // Dimming settings (for dimmer and AO outputs)
  minDim: 1,
  maxDim: 100,

  // Auto trigger and schedule settings
  autoTrigger: false,
  scheduleOnHour: 0,
  scheduleOnMinute: 0,
  scheduleOffHour: 0,
  scheduleOffMinute: 0,
});

/**
 * Create default output configuration based on type
 * @param {string} type - Output type ('relay', 'dimmer', 'ao', 'ac')
 * @returns {Object} Default configuration for the output type
 */
const createDefaultConfigByType = (type) => {
  switch (type) {
    case "ac":
      return createDefaultACConfig();
    case "relay":
    case "dimmer":
    case "ao":
      return createDefaultLightingConfig();
    default:
      return {};
  }
};

/**
 * Create default output configurations for a unit
 * @param {string} unitType - The type of unit (e.g., 'Bedside-17T', 'RLC-I20')
 * @returns {Object} Default output configurations
 */
export const createDefaultOutputConfigs = (unitType) => {
  const outputs = [];
  const outputTypes = getOutputTypes(unitType);
  let outputIndex = 0;

  outputTypes.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      outputs.push({
        index: outputIndex++,
        type: type,
        device_id: null,
        device_type: type === "ac" ? "aircon" : "lighting",
        name: `${getOutputLabel(type)} ${i + 1}`,
        config: createDefaultConfigByType(type), // Create full default config
      });
    }
  });

  return { outputs };
};

/**
 * Get the number of inputs for a unit type
 * @param {string} unitType - The type of unit
 * @returns {number} Number of inputs
 */
const getInputCount = (unitType) => {
  const spec = getUnitIOSpec(unitType);
  return spec ? spec.inputs : 0;
};

/**
 * Validate I/O configuration
 * @param {Object} ioConfig - The I/O configuration to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateIOConfig = (ioConfig) => {
  const errors = [];

  if (!ioConfig) {
    errors.push("I/O configuration is required");
    return { isValid: false, errors };
  }

  if (!Array.isArray(ioConfig.inputs)) {
    errors.push("Inputs must be an array");
  }

  if (!Array.isArray(ioConfig.outputs)) {
    errors.push("Outputs must be an array");
  }

  // Validate inputs
  if (ioConfig.inputs) {
    ioConfig.inputs.forEach((input, index) => {
      if (typeof input.index !== "number") {
        errors.push(`Input ${index}: index must be a number`);
      }
      if (typeof input.function !== "number") {
        errors.push(`Input ${index}: function must be a number`);
      }
      if (!Array.isArray(input.multiGroupConfig)) {
        errors.push(`Input ${index}: multiGroupConfig must be an array`);
      }
    });
  }

  // Validate outputs
  if (ioConfig.outputs) {
    ioConfig.outputs.forEach((output, index) => {
      if (typeof output.index !== "number") {
        errors.push(`Output ${index}: index must be a number`);
      }
      if (!output.name || typeof output.name !== "string") {
        errors.push(`Output ${index}: name is required and must be a string`);
      }
      // Validate nested config if present
      if (output.config && typeof output.config !== "object") {
        errors.push(`Output ${index}: config must be an object if provided`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Clone I/O configuration for editing
 * @param {Object} ioConfig - The I/O configuration to clone
 * @returns {Object} Cloned I/O configuration
 */
export const cloneIOConfig = (ioConfig) => {
  if (!ioConfig) return null;

  return {
    inputs:
      ioConfig.inputs?.map((input) => ({
        ...input,
        multiGroupConfig: [...(input.multiGroupConfig || [])],
      })) || [],
    outputs:
      ioConfig.outputs?.map((output) => ({
        ...output,
        config: output.config ? { ...output.config } : null,
      })) || [],
  };
};

/**
 * Check if I/O configuration has changes
 * @param {Object} original - Original I/O configuration
 * @param {Object} current - Current I/O configuration
 * @returns {boolean} True if there are changes
 */
export const hasIOConfigChanges = (original, current) => {
  if (!original && !current) return false;
  if (!original || !current) return true;

  return JSON.stringify(original) !== JSON.stringify(current);
};

/**
 * Check if a specific input configuration has changed
 * @param {Object} originalInput - Original input configuration
 * @param {Object} currentInput - Current input configuration
 * @returns {boolean} True if the input has changed
 */
export const hasInputConfigChanged = (originalInput, currentInput) => {
  if (!originalInput && !currentInput) return false;
  if (!originalInput || !currentInput) return true;

  // Compare the key properties that indicate a change
  if (originalInput.functionValue !== currentInput.functionValue || originalInput.lightingId !== currentInput.lightingId) {
    return true;
  }

  // Compare multi group config (array comparison)
  const originalInputDetail = originalInput.multiGroupConfig || [];
  const currentInputDetail = currentInput.multiGroupConfig || [];

  if (originalInputDetail.length !== currentInputDetail.length) {
    return true;
  }

  // Deep compare multi group config array
  for (let i = 0; i < originalInputDetail.length; i++) {
    if (JSON.stringify(originalInputDetail[i]) !== JSON.stringify(currentInputDetail[i])) {
      return true;
    }
  }

  // Compare RLC config - handle both naming conventions
  const originalRlc = originalInput.rlcConfig || {};
  const currentRlc = currentInput.rlcConfig || {};

  // Compare each RLC property with fallback for different naming conventions
  const rlcComparisons = [
    { orig: originalRlc.ramp || 0, curr: currentRlc.ramp || 0 },
    { orig: originalRlc.preset || 100, curr: currentRlc.preset || 100 },
    {
      orig: originalRlc.ledStatus || originalRlc.led_status || 0,
      curr: currentRlc.ledStatus || currentRlc.led_status || 0,
    },
    {
      orig: originalRlc.autoMode || originalRlc.auto_mode || 0,
      curr: currentRlc.autoMode || currentRlc.auto_mode || 0,
    },
    {
      orig: originalRlc.delayOff || originalRlc.delay_off || 0,
      curr: currentRlc.delayOff || currentRlc.delay_off || 0,
    },
    {
      orig: originalRlc.delayOn || originalRlc.delay_on || 0,
      curr: currentRlc.delayOn || currentRlc.delay_on || 0,
    },
  ];

  for (const comparison of rlcComparisons) {
    if (comparison.orig !== comparison.curr) {
      return true;
    }
  }

  return false;
};

/**
 * Get changed input indices by comparing original and current input configs
 * @param {Array} originalInputs - Array of original input configurations
 * @param {Array} currentInputs - Array of current input configurations
 * @returns {Set} Set of input indices that have changed
 */
export const getChangedInputIndices = (originalInputs, currentInputs) => {
  const changedIndices = new Set();

  if (!originalInputs || !currentInputs) return changedIndices;

  // Create maps for easier lookup
  const originalMap = new Map(originalInputs.map((input) => [input.index, input]));
  const currentMap = new Map(currentInputs.map((input) => [input.index, input]));

  // Check each current input against its original
  currentInputs.forEach((currentInput) => {
    const originalInput = originalMap.get(currentInput.index);
    if (hasInputConfigChanged(originalInput, currentInput)) {
      changedIndices.add(currentInput.index);
    }
  });

  return changedIndices;
};

/**
 * Get input configuration by index
 * @param {Object} ioConfig - The I/O configuration
 * @param {number} inputIndex - The input index
 * @returns {Object|null} Input configuration or null if not found
 */
export const getInputConfig = (ioConfig, inputIndex) => {
  if (!ioConfig?.inputs) return null;
  return ioConfig.inputs.find((input) => input.index === inputIndex) || null;
};

/**
 * Update input configuration
 * @param {Object} ioConfig - The I/O configuration
 * @param {number} inputIndex - The input index
 * @param {Object} inputData - The input data to update
 * @returns {Object} Updated I/O configuration
 */
export const updateInputConfig = (ioConfig, inputIndex, inputData) => {
  const newConfig = cloneIOConfig(ioConfig);

  const inputConfigIndex = newConfig.inputs.findIndex((input) => input.index === inputIndex);
  if (inputConfigIndex >= 0) {
    newConfig.inputs[inputConfigIndex] = {
      ...newConfig.inputs[inputConfigIndex],
      ...inputData,
    };
  } else {
    newConfig.inputs.push({ index: inputIndex, ...inputData });
  }

  return newConfig;
};

/**
 * Get output configuration by index
 * @param {Object} ioConfig - The I/O configuration
 * @param {number} outputIndex - The output index
 * @returns {Object|null} Output configuration or null if not found
 */
export const getOutputConfig = (ioConfig, outputIndex) => {
  if (!ioConfig?.outputs) return null;
  return ioConfig.outputs.find((output) => output.index === outputIndex) || null;
};

/**
 * Get output detailed config by index
 * @param {Object} ioConfig - The I/O configuration
 * @param {number} outputIndex - The output index
 * @returns {Object|null} Output detailed config or null if not found
 */
export const getOutputDetailedConfig = (ioConfig, outputIndex) => {
  const output = getOutputConfig(ioConfig, outputIndex);
  return output?.config || null;
};

/**
 * Update output configuration
 * @param {Object} ioConfig - The I/O configuration
 * @param {number} outputIndex - The output index
 * @param {Object} outputData - The output data to update
 * @returns {Object} Updated I/O configuration
 */
export const updateOutputConfig = (ioConfig, outputIndex, outputData) => {
  const newConfig = cloneIOConfig(ioConfig);

  const outputConfigIndex = newConfig.outputs.findIndex((output) => output.index === outputIndex);
  if (outputConfigIndex >= 0) {
    newConfig.outputs[outputConfigIndex] = {
      ...newConfig.outputs[outputConfigIndex],
      ...outputData,
    };
  } else {
    newConfig.outputs.push({ index: outputIndex, ...outputData });
  }

  return newConfig;
};

// ============================================================================
// Output Configuration Change Detection
// ============================================================================

/**
 * Configuration fields to compare for lighting outputs
 * Used by both network units and database units
 */
const LIGHTING_CONFIG_FIELDS = [
  "lightingAddress", // For network units
  "deviceId", // For database units
  "delayOff",
  "delayOn",
  "delayOffHours", // For database units (time split into components)
  "delayOffMinutes",
  "delayOffSeconds",
  "delayOnHours",
  "delayOnMinutes",
  "delayOnSeconds",
  "minDim",
  "maxDim",
  "autoTrigger",
  "scheduleOnHour",
  "scheduleOnMinute",
  "scheduleOffHour",
  "scheduleOffMinute",
];

/**
 * Configuration fields to compare for aircon outputs
 * Used by both network units and database units
 */
const AIRCON_CONFIG_FIELDS = [
  "airconAddress", // For network units
  "deviceId", // For database units
  "acEnable",
  "enable", // Database units use 'enable' instead of 'acEnable'
  "acWindowMode",
  "windowMode",
  "acFanType",
  "fanType",
  "acTempType",
  "tempType",
  "acTempUnit",
  "tempUnit",
  "acValveContact",
  "valveContact",
  "acValveType",
  "valveType",
  "acDeadband",
  "deadband",
  "acLowFCU_Group",
  "lowFCU_Group",
  "acMedFCU_Group",
  "medFCU_Group",
  "acHighFCU_Group",
  "highFCU_Group",
  "acFanAnalogGroup",
  "fanAnalogGroup",
  "acAnalogCoolGroup",
  "analogCoolGroup",
  "acAnalogHeatGroup",
  "analogHeatGroup",
  "acValveCoolOpenGroup",
  "valveCoolOpenGroup",
  "acValveCoolCloseGroup",
  "valveCoolCloseGroup",
  "acValveHeatOpenGroup",
  "valveHeatOpenGroup",
  "acValveHeatCloseGroup",
  "valveHeatCloseGroup",
  "acWindowBypass",
  "windowBypass",
  "acSetPointOffset",
  "setPointOffset",
  "acWindowOpenAction",
  "windowOpenAction",
  "acWindowOpenCoolSetPoint",
  "windowOpenCoolSetPoint",
  "acWindowOpenHeatSetPoint",
  "windowOpenHeatSetPoint",
  "acWindowDelay",
  "windowDelay",
  "acRoomAddress",
  "roomAddress",
  "acUnoccupyPower",
  "unoccupyPower",
  "acOccupyPower",
  "occupyPower",
  "acStandbyPower",
  "standbyPower",
  "acUnoccupyMode",
  "unoccupyMode",
  "acOccupyMode",
  "occupyMode",
  "acStandbyMode",
  "standbyMode",
  "acUnoccupyFanSpeed",
  "unoccupyFanSpeed",
  "acOccupyFanSpeed",
  "occupyFanSpeed",
  "acStandbyFanSpeed",
  "standbyFanSpeed",
  "acUnoccupyCoolSetPoint",
  "unoccupyCoolSetPoint",
  "acOccupyCoolSetPoint",
  "occupyCoolSetPoint",
  "acStandbyCoolSetPoint",
  "standbyCoolSetPoint",
  "acUnoccupyHeatSetPoint",
  "unoccupyHeatSetPoint",
  "acOccupyHeatSetPoint",
  "occupyHeatSetPoint",
  "acStandbyHeatSetPoint",
  "standbyHeatSetPoint",
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
 * Works for both network units and database units
 * @param {Object} config - Current configuration
 * @param {Object} originalConfig - Original configuration
 * @returns {boolean} True if configuration has changed
 */
export const hasLightingConfigChanged = (config, originalConfig) => {
  return hasConfigFieldsChanged(config, originalConfig, LIGHTING_CONFIG_FIELDS);
};

/**
 * Compare aircon output configuration with original configuration
 * Works for both network units and database units
 * @param {Object} config - Current configuration
 * @param {Object} originalConfig - Original configuration
 * @returns {boolean} True if configuration has changed
 */
export const hasAirconConfigChanged = (config, originalConfig) => {
  return hasConfigFieldsChanged(config, originalConfig, AIRCON_CONFIG_FIELDS);
};

/**
 * Check if output configuration has changed from original
 * Automatically detects type and uses appropriate comparison
 * Works for both network units and database units
 * @param {Object} config - Current configuration with type field
 * @param {Object} originalConfig - Original configuration
 * @returns {boolean} True if configuration has changed
 */
export const hasOutputConfigChanged = (config, originalConfig) => {
  if (!originalConfig) {
    console.log("⚠️ [COMPARE DEBUG] No originalConfig, returning false");
    return false;
  }

  // Use type-specific comparison based on config type
  let hasChanged = false;
  if (config.type === "ac") {
    hasChanged = hasAirconConfigChanged(config, originalConfig);
  } else {
    hasChanged = hasLightingConfigChanged(config, originalConfig);
  }

  // Log only for first output (index 0) to avoid spam
  if (config.index === 0) {
    console.log("🔍 [COMPARE DEBUG] hasOutputConfigChanged result:", {
      index: config.index,
      type: config.type,
      hasChanged: hasChanged,
      configFields: {
        lightingAddress: config.lightingAddress,
        delayOff: config.delayOff,
        delayOn: config.delayOn,
        minDim: config.minDim,
        maxDim: config.maxDim,
        autoTrigger: config.autoTrigger,
      },
      originalFields: {
        lightingAddress: originalConfig.lightingAddress,
        delayOff: originalConfig.delayOff,
        delayOn: originalConfig.delayOn,
        minDim: originalConfig.minDim,
        maxDim: originalConfig.maxDim,
        autoTrigger: originalConfig.autoTrigger,
      },
    });
  }

  return hasChanged;
};
