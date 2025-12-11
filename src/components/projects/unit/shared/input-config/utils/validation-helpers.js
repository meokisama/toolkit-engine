/**
 * Validation helper functions for input configuration
 */

/**
 * Validate and clamp percentage value (0-100)
 */
export const validatePercentage = (value) => {
  const numValue = parseInt(value) || 0;
  return Math.max(0, Math.min(100, numValue));
};

/**
 * Validate and clamp raw value (0-255)
 */
export const validateRawValue = (value) => {
  const numValue = parseInt(value) || 0;
  return Math.max(0, Math.min(255, numValue));
};

/**
 * Convert percentage to raw value (0-100% -> 0-255)
 */
export const percentageToRaw = (percentage) => {
  const clampedPercent = validatePercentage(percentage);
  return Math.round((clampedPercent * 255) / 100);
};

/**
 * Convert raw value to percentage (0-255 -> 0-100%)
 */
export const rawToPercentage = (rawValue) => {
  const clampedRaw = validateRawValue(rawValue);
  return Math.round((clampedRaw * 100) / 255);
};

/**
 * Update group value based on percentage mode
 */
export const updateGroupValue = (group, value, usePercentage) => {
  const numValue = parseInt(value) || 0;

  if (usePercentage) {
    // Update percentage and calculate raw value
    const clampedPercent = validatePercentage(numValue);
    const rawValue = percentageToRaw(clampedPercent);
    return {
      ...group,
      value: value,
      presetPercent: clampedPercent,
      preset: rawValue,
    };
  } else {
    // Update raw value and calculate percentage
    const clampedRaw = validateRawValue(numValue);
    const percentValue = rawToPercentage(clampedRaw);
    return {
      ...group,
      value: value,
      preset: clampedRaw,
      presetPercent: percentValue,
    };
  }
};
