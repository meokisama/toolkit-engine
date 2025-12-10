// Helper functions for I/O configuration

/**
 * Get output icon based on type
 */
export const getOutputIcon = (type) => {
  const iconMap = {
    relay: "Zap",
    dimmer: "Lightbulb", 
    ao: "Fan",
    ac: "Thermometer",
  };
  return iconMap[type] || "Settings";
};

/**
 * Get output label based on type
 */
export const getOutputLabel = (type) => {
  const labelMap = {
    relay: "Relay",
    dimmer: "Dimmer",
    ao: "Analog",
    ac: "Aircon",
  };
  return labelMap[type] || type;
};

/**
 * Check if a function requires configuration
 */
export const requiresConfiguration = (functionName) => {
  return functionName && functionName !== "IP_UNUSED";
};

/**
 * Format device option for combobox
 */
export const formatDeviceOption = (device) => ({
  value: device.id.toString(),
  label: `${device.name || "Unnamed"} (${device.address})`,
});

/**
 * Create device options from items array
 */
export const createDeviceOptions = (items) => {
  return items.map(formatDeviceOption);
};

/**
 * Get device options for output type
 */
export const getDeviceOptionsForOutput = (outputType, lightingOptions, airconOptions) => {
  return outputType === "ac" ? airconOptions : lightingOptions;
};

/**
 * Performance monitoring helper
 */
export const checkPerformanceThreshold = (items, threshold = 50) => {
  return items.length > threshold;
};

/**
 * Log performance warning in development
 */
export const logPerformanceWarning = (type, count, threshold = 50) => {
  if (process.env.NODE_ENV === "development" && count > threshold) {
    console.warn(
      `IOConfigDialog: Large ${type} list detected (${count} items). Consider pagination.`
    );
  }
};
