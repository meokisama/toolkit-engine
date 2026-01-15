import { readCurtainConfigurations } from "../readers/curtain";
import { readSceneConfigurations } from "../readers/scene";
import { readScheduleConfigurations } from "../readers/schedule";
import { readKnxConfigurations } from "../readers/knx";
import { readMultiSceneConfigurations } from "../readers/multi-scene";
import { readSequenceConfigurations } from "../readers/sequence";
import log from "electron-log/renderer";

/**
 * Transfer all advanced configurations from network unit to database
 * This is the main orchestrator function that coordinates all configuration readers
 * @param {Object} networkUnit - The network unit to read from
 * @param {Object} importedUnit - The imported unit in database
 * @param {string} projectId - The project ID
 * @returns {Promise<Object>} Summary of transferred configurations
 */
export const transferAdvancedConfigurations = async (networkUnit, importedUnit, projectId) => {
  try {
    log.info(`Reading advanced configurations for unit ${networkUnit.ip_address}...`);

    const unitId = importedUnit.id;

    // Read curtain configurations FIRST to avoid conflicts with scene auto-creation
    const createdCurtains = await readCurtainConfigurations(networkUnit, projectId, unitId);

    // Read scene configurations (after curtains to avoid auto-creating duplicate curtains)
    const { createdScenes, sceneAddressMap } = await readSceneConfigurations(networkUnit, projectId, unitId);

    // Read schedule configurations
    const createdSchedules = await readScheduleConfigurations(networkUnit, projectId, sceneAddressMap, unitId);

    // Read KNX configurations
    const createdKnxConfigs = await readKnxConfigurations(networkUnit, projectId, unitId);

    // Read Multi-Scene configurations
    const { createdMultiScenes, multiSceneAddressMap } = await readMultiSceneConfigurations(networkUnit, projectId, sceneAddressMap, unitId);

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
    log.info(`Advanced configurations transferred successfully for unit ${networkUnit.ip_address}:`, configSummary);
    log.info(`Total configurations created: ${totalConfigs}`);

    return { configSummary, totalConfigs };
  } catch (error) {
    log.error(`Failed to transfer advanced configurations for unit ${networkUnit.ip_address}:`, error);
    throw error;
  }
};

// Alias for backward compatibility
export const readAdvancedConfigurations = transferAdvancedConfigurations;
