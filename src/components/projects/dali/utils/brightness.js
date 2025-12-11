import { BRIGHTNESS_MAX, BRIGHTNESS_MIN, BRIGHTNESS_PERCENT_MAX, BRIGHTNESS_PERCENT_MIN } from "./constants";

/**
 * Convert brightness from 0-100% to 0-255
 * @param {number} percent - Brightness percentage (0-100)
 * @returns {number} Brightness value (0-255)
 */
export function percentToBrightness(percent) {
  const clampedPercent = Math.max(BRIGHTNESS_PERCENT_MIN, Math.min(BRIGHTNESS_PERCENT_MAX, parseInt(percent) || 0));
  return Math.round(clampedPercent * 2.55);
}

/**
 * Convert brightness from 0-255 to 0-100%
 * @param {number} brightness - Brightness value (0-255)
 * @returns {number} Brightness percentage (0-100)
 */
export function brightnessToPercent(brightness) {
  const clampedBrightness = Math.max(BRIGHTNESS_MIN, Math.min(BRIGHTNESS_MAX, parseInt(brightness) || 0));
  return Math.round(clampedBrightness / 2.55);
}

/**
 * Clamp brightness value to valid range (0-255)
 * @param {number} value - Raw brightness value
 * @returns {number} Clamped brightness value
 */
export function clampBrightness(value) {
  return Math.max(BRIGHTNESS_MIN, Math.min(BRIGHTNESS_MAX, parseInt(value) || 0));
}

/**
 * Parse brightness input based on type
 * @param {string|number} value - Input value
 * @param {string} type - Input type ("0-255" or "0-100")
 * @returns {number} Brightness value (0-255)
 */
export function parseBrightnessInput(value, type) {
  if (type === "0-255") {
    return clampBrightness(value);
  } else {
    // type === "0-100"
    return percentToBrightness(value);
  }
}
