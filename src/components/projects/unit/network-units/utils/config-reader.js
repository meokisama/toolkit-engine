import { readNetworkUnitBasicConfigurations } from "../../transfer/services/network-config-reader";

/**
 * Read all configurations from network unit and prepare for database transfer
 * @param {Object} networkUnit - Network unit to read from
 * @param {Object} selectedProject - Selected project
 * @param {Object} projectItems - All project items
 * @param {Function} createItem - Function to create new items
 * @param {Object} createdItemsCache - Cache for created items
 * @returns {Promise<Object>} Network unit with all configurations ready for transfer
 */
export async function readNetworkUnitConfigurations(networkUnit, selectedProject, projectItems, createItem, createdItemsCache) {
  // Clear cache for this transfer session
  createdItemsCache.current.aircon.clear();
  createdItemsCache.current.lighting.clear();

  // Read basic configurations (RS485 + I/O) using shared service
  const unitWithBasicConfigs = await readNetworkUnitBasicConfigurations(networkUnit, {
    selectedProject,
    projectItems,
    createItem,
    createdItemsCache,
    autoCreateItems: true,
    showToast: true,
  });

  // Prepare unit for database transfer
  const newUnit = {
    ...unitWithBasicConfigs,
    id: undefined, // Let the system generate new ID
    // Add fields to store advanced configurations metadata
    scenes: [],
    schedules: [],
    curtains: [],
    knxConfigs: [],
    multiScenes: [],
    sequences: [],
    // Flag to indicate that advanced configs should be read after database creation
    readAdvancedConfigs: true,
  };

  return newUnit;
}
