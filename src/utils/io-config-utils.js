/**
 * Utility functions for I/O configuration management
 */

/**
 * Create a default I/O configuration for a unit
 * @param {string} unitType - The type of unit (e.g., 'Bedside-17T', 'RLC-I20')
 * @returns {Object} Default I/O configuration
 */
export const createDefaultIOConfig = (unitType) => {
  // Get unit specs from constants if available
  const inputs = [];
  const outputs = [];

  // Create default input configurations
  // This will be populated based on unit type specifications
  for (let i = 0; i < getInputCount(unitType); i++) {
    inputs.push({
      index: i,
      function: 0, // Default to first function
      lightingId: null,
      ramp: 0,
      preset: 100,
      led_status: 0,
      auto_mode: 0,
      auto_time: 0,
      delay_off: 0,
      delay_on: 0,
      multiGroupConfig: []
    });
  }

  // Create default output configurations
  for (let i = 0; i < getOutputCount(unitType); i++) {
    outputs.push({
      index: i,
      name: `Output ${i + 1}`,
      deviceId: null,
      deviceType: getOutputType(unitType, i) // 'lighting', 'aircon', etc.
    });
  }

  return {
    inputs,
    outputs
  };
};

/**
 * Get the number of inputs for a unit type
 * @param {string} unitType - The type of unit
 * @returns {number} Number of inputs
 */
const getInputCount = (unitType) => {
  // This should match the constants from constants.js
  const inputCounts = {
    'Bedside-17T': 17,
    'Bedside-12T': 12,
    'RLC-I20': 20,
    'RLC-I16': 16,
    'RCU-48IN-16RL': 48,
    'RCU-48IN-16RL-4AI': 48,
    'RCU-48IN-16RL-4AO': 48,
    'RCU-32AO': 0,
    'RCU-11IN-4RL': 11
  };
  
  return inputCounts[unitType] || 0;
};

/**
 * Get the number of outputs for a unit type
 * @param {string} unitType - The type of unit
 * @returns {number} Number of outputs
 */
const getOutputCount = (unitType) => {
  const outputCounts = {
    'Bedside-17T': 0,
    'Bedside-12T': 0,
    'RLC-I20': 0,
    'RLC-I16': 0,
    'RCU-48IN-16RL': 16,
    'RCU-48IN-16RL-4AI': 16,
    'RCU-48IN-16RL-4AO': 16,
    'RCU-32AO': 32,
    'RCU-11IN-4RL': 4
  };
  
  return outputCounts[unitType] || 0;
};

/**
 * Get the output type for a specific output index
 * @param {string} unitType - The type of unit
 * @param {number} outputIndex - The output index
 * @returns {string} Output type ('relay', 'dimmer', 'ao', 'ac')
 */
const getOutputType = (unitType, outputIndex) => {
  // This should match the output specifications from constants.js
  const outputSpecs = {
    'RCU-48IN-16RL': 'relay',
    'RCU-48IN-16RL-4AI': 'relay',
    'RCU-48IN-16RL-4AO': 'relay',
    'RCU-32AO': 'ao',
    'RCU-11IN-4RL': 'relay'
  };
  
  return outputSpecs[unitType] || 'relay';
};

/**
 * Validate I/O configuration
 * @param {Object} ioConfig - The I/O configuration to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateIOConfig = (ioConfig) => {
  const errors = [];
  
  if (!ioConfig) {
    errors.push('I/O configuration is required');
    return { isValid: false, errors };
  }

  if (!Array.isArray(ioConfig.inputs)) {
    errors.push('Inputs must be an array');
  }

  if (!Array.isArray(ioConfig.outputs)) {
    errors.push('Outputs must be an array');
  }

  // Validate inputs
  if (ioConfig.inputs) {
    ioConfig.inputs.forEach((input, index) => {
      if (typeof input.index !== 'number') {
        errors.push(`Input ${index}: index must be a number`);
      }
      if (typeof input.function !== 'number') {
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
      if (typeof output.index !== 'number') {
        errors.push(`Output ${index}: index must be a number`);
      }
      if (!output.name || typeof output.name !== 'string') {
        errors.push(`Output ${index}: name is required and must be a string`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
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
    inputs: ioConfig.inputs?.map(input => ({
      ...input,
      multiGroupConfig: [...(input.multiGroupConfig || [])]
    })) || [],
    outputs: ioConfig.outputs?.map(output => ({ ...output })) || []
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
 * Get input configuration by index
 * @param {Object} ioConfig - The I/O configuration
 * @param {number} inputIndex - The input index
 * @returns {Object|null} Input configuration or null if not found
 */
export const getInputConfig = (ioConfig, inputIndex) => {
  if (!ioConfig?.inputs) return null;
  return ioConfig.inputs.find(input => input.index === inputIndex) || null;
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
  
  const inputConfigIndex = newConfig.inputs.findIndex(input => input.index === inputIndex);
  if (inputConfigIndex >= 0) {
    newConfig.inputs[inputConfigIndex] = { ...newConfig.inputs[inputConfigIndex], ...inputData };
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
  return ioConfig.outputs.find(output => output.index === outputIndex) || null;
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
  
  const outputConfigIndex = newConfig.outputs.findIndex(output => output.index === outputIndex);
  if (outputConfigIndex >= 0) {
    newConfig.outputs[outputConfigIndex] = { ...newConfig.outputs[outputConfigIndex], ...outputData };
  } else {
    newConfig.outputs.push({ index: outputIndex, ...outputData });
  }
  
  return newConfig;
};
