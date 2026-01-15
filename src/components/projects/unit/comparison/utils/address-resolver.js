import log from "electron-log/renderer";
/**
 * Utility for resolving device addresses from device IDs
 */

/**
 * Helper function to get address from device_id by looking up in project items
 * @param {number} deviceId - Device ID from database
 * @param {string} deviceType - Device type (lighting/aircon)
 * @param {Object} projectItems - Project items cache
 * @returns {string|null} Address of the device
 */
export async function getAddressFromDeviceId(deviceId, deviceType, projectItems = null) {
  if (!deviceId || !deviceType) return null;

  try {
    // If we have project items cache, use it
    if (projectItems && projectItems[deviceType]) {
      const item = projectItems[deviceType].find((item) => item.id === deviceId);
      return item ? item.address : null;
    }

    // Otherwise, try to get from electronAPI if available
    if (typeof window !== "undefined" && window.electronAPI && window.electronAPI[deviceType]) {
      // This would require project ID, which we don't have in comparison context
      // For now, return null and handle in the comparison logic
      return null;
    }

    return null;
  } catch (error) {
    log.warn(`Failed to get address for device ${deviceId}:`, error);
    return null;
  }
}
