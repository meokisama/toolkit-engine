import { readCurtainConfigurations } from "./read-curtain";
import { readSceneConfigurations } from "./read-scene";
import { readScheduleConfigurations } from "./read-schedule";
import { readKnxConfigurations } from "./read-knx";
import { readMultiSceneConfigurations } from "./read-multi-scene";
import { readSequenceConfigurations } from "./read-sequence";

/**
 * Read all advanced configurations from network unit and create them in database
 * This is the main orchestrator function that calls all specific configuration readers
 * @param {Object} networkUnit - The network unit to read from
 * @param {Object} importedUnit - The imported unit in database
 * @param {string} projectId - The project ID
 * @returns {Promise<void>}
 */
export const readAdvancedConfigurations = async (networkUnit, importedUnit, projectId) => {
  try {
    console.log(`Reading advanced configurations for unit ${networkUnit.ip_address}...`);

    const unitId = importedUnit.id;

    // Read curtain configurations FIRST to avoid conflicts with scene auto-creation
    const createdCurtains = await readCurtainConfigurations(networkUnit, projectId, unitId);

    // Add delay between different configuration types
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read scene configurations (after curtains to avoid auto-creating duplicate curtains)
    const { createdScenes, sceneAddressMap } = await readSceneConfigurations(networkUnit, projectId, unitId);

    // Add delay between different configuration types
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read schedule configurations
    const createdSchedules = await readScheduleConfigurations(networkUnit, projectId, sceneAddressMap, unitId);

    // Add delay between different configuration types
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read KNX configurations
    const createdKnxConfigs = await readKnxConfigurations(networkUnit, projectId, unitId);

    // Add delay between different configuration types
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read Multi-Scene configurations
    const { createdMultiScenes, multiSceneAddressMap } = await readMultiSceneConfigurations(networkUnit, projectId, sceneAddressMap, unitId);

    // Add delay between different configuration types
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read Sequence configurations
    const createdSequences = await readSequenceConfigurations(networkUnit, projectId, multiSceneAddressMap, unitId);

    // Log summary of created configurations
    const configSummary = {
      scenes: createdScenes.length,
      schedules: createdSchedules.length,
      curtains: createdCurtains.length,
      knxConfigs: createdKnxConfigs.length,
      multiScenes: createdMultiScenes.length,
      sequences: createdSequences.length,
    };

    const totalConfigs = Object.values(configSummary).reduce((sum, count) => sum + count, 0);
    console.log(`Advanced configurations read successfully for unit ${networkUnit.ip_address}:`, configSummary);
    console.log(`Total configurations created: ${totalConfigs}`);
  } catch (error) {
    console.error(`Failed to read advanced configurations for unit ${networkUnit.ip_address}:`, error);
    throw error;
  }
};
