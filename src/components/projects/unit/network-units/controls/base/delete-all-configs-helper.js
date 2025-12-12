/**
 * Helper functions for deleting all configurations before sending new ones
 * Used by send-all-config-dialog.jsx
 */

/**
 * Delete all configurations of specified types from a unit
 * @param {Object} unit - The unit object with ip_address and id_can
 * @param {Array} configTypes - Array of config types to delete
 * @param {Function} onProgress - Progress callback function
 * @returns {Array} Array of operation results
 */
export async function deleteAllConfigsFromUnit(unit, configTypes, onProgress) {
  const operationResults = [];
  let completedOperations = 0;
  const totalOperations = configTypes.length;

  for (const configType of configTypes) {
    try {
      console.log(`Deleting all ${configType} from unit:`, {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      // Call the appropriate delete function based on config type
      await deleteConfigByType(unit.ip_address, unit.id_can, configType);

      operationResults.push({
        unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
        configType: `Delete All ${getConfigTypeLabel(configType)}`,
        success: true,
        message: `Existing ${configType} deleted successfully`,
        count: 0,
      });

      completedOperations++;
      if (onProgress) {
        onProgress((completedOperations / totalOperations) * 100, `Deleting existing ${configType}...`);
      }
    } catch (error) {
      console.error(`Failed to delete existing ${configType} from unit ${unit.ip_address}:`, error);
      operationResults.push({
        unit: `${unit.type || "Unknown Unit"} (${unit.ip_address})`,
        configType: `Delete All ${getConfigTypeLabel(configType)}`,
        success: false,
        message: error.message || `Failed to delete existing ${configType}`,
        count: 0,
      });

      completedOperations++;
      if (onProgress) {
        onProgress((completedOperations / totalOperations) * 100, `Deleting existing ${configType}...`);
      }
    }
  }

  return operationResults;
}

/**
 * Delete all configurations of specified types from multiple units
 * @param {Array} units - Array of unit objects
 * @param {Array} configTypes - Array of config types to delete
 * @param {Function} onProgress - Progress callback function
 * @returns {Array} Array of operation results
 */
export async function deleteAllConfigsFromUnits(units, configTypes, onProgress) {
  const allResults = [];
  let completedUnits = 0;
  const totalUnits = units.length;

  for (const unit of units) {
    const unitResults = await deleteAllConfigsFromUnit(unit, configTypes, (progress, message) => {
      // Calculate overall progress
      const unitProgress = (completedUnits / totalUnits) * 100;
      const currentUnitProgress = (progress / 100) * (100 / totalUnits);
      const overallProgress = unitProgress + currentUnitProgress;

      if (onProgress) {
        onProgress(overallProgress, `Unit ${completedUnits + 1}/${totalUnits}: ${message}`);
      }
    });

    allResults.push(...unitResults);
    completedUnits++;
  }

  return allResults;
}

/**
 * Call the appropriate delete function based on config type
 * @param {string} unitIp - Unit IP address
 * @param {string} canId - CAN ID
 * @param {string} configType - Type of config to delete
 */
async function deleteConfigByType(unitIp, canId, configType) {
  switch (configType) {
    case "scenes":
      await window.electronAPI.sceneController.deleteAllScenes(unitIp, canId);
      break;
    case "schedules":
      await window.electronAPI.scheduleController.deleteAllSchedules(unitIp, canId);
      break;
    case "multiScenes":
      await window.electronAPI.multiScenesController.deleteAllMultiScenes(unitIp, canId);
      break;
    case "sequences":
      await window.electronAPI.sequenceController.deleteAllSequences(unitIp, canId);
      break;
    case "knx":
      await window.electronAPI.knxController.deleteAllKnxConfigs(unitIp, canId);
      break;
    case "curtain":
      await window.electronAPI.curtainController.deleteAllCurtains(unitIp, canId);
      break;
    default:
      throw new Error(`Unknown config type: ${configType}`);
  }
}

/**
 * Get human-readable label for config type
 * @param {string} configType - Config type
 * @returns {string} Human-readable label
 */
function getConfigTypeLabel(configType) {
  const labels = {
    scenes: "Scenes",
    schedules: "Schedules",
    multiScenes: "Multi-Scenes",
    sequences: "Sequences",
    knx: "KNX Configs",
    curtain: "Curtain Configs",
  };
  return labels[configType] || configType;
}
