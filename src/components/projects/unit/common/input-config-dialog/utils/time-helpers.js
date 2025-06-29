/**
 * Helper functions for time conversion in RLC options
 */

/**
 * Convert hours, minutes, seconds to Date object
 */
export const timeToDate = (hours, minutes, seconds = 0) => {
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
  return date;
};

/**
 * Extract time components from Date object
 */
export const dateToTimeComponents = (date) => {
  if (!date) return { hours: 0, minutes: 0, seconds: 0 };
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
};

/**
 * Validate and constrain time values for delay off
 */
export const validateDelayOffTime = (hours, minutes, seconds) => {
  // Apply validation constraints
  let validatedHours = Math.max(0, Math.min(18, hours));
  let validatedMinutes = Math.max(0, Math.min(59, minutes));
  let validatedSeconds = Math.max(0, Math.min(59, seconds));

  // Special case: if hours is 18, minutes can only be 0-11
  if (validatedHours === 18) {
    validatedMinutes = Math.max(0, Math.min(11, validatedMinutes));
  }

  return {
    hours: validatedHours,
    minutes: validatedMinutes,
    seconds: validatedSeconds,
  };
};
