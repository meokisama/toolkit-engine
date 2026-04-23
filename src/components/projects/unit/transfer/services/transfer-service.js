import { readCurtainConfigurations } from "../readers/curtain";
import { readSceneConfigurations } from "../readers/scene";
import { readScheduleConfigurations } from "../readers/schedule";
import { readKnxConfigurations } from "../readers/knx";
import { readMultiSceneConfigurations } from "../readers/multi-scene";
import { readSequenceConfigurations } from "../readers/sequence";
import { readRoomConfigurations } from "../readers/room";
import { readDmxConfigurations } from "../readers/dmx";
import log from "electron-log/renderer";

/**
 * Transfer all advanced configurations from network unit to database.
 * Orchestrates curtain → scene → schedule → KNX → multi-scene → sequence
 * in the correct dependency order.
 *
 * @param {Object} networkUnit - The network unit to read from
 * @param {Object} importedUnit - The unit record already saved in the database
 * @param {string} projectId
 * @param {TransferItemCache|null} itemCache - Optional pre-fetched lookup cache (fixes N+1)
 * @returns {Promise<{ configSummary: Object, totalConfigs: number }>}
 */
export const transferAdvancedConfigurations = async (networkUnit, importedUnit, projectId, itemCache = null) => {
  try {
    log.info(`Reading advanced configurations for unit ${networkUnit.ip_address}...`);

    const unitId = importedUnit.id;

    // Curtains FIRST — scenes may auto-create curtain items, so pre-create to avoid duplicates
    const createdCurtains = await readCurtainConfigurations(networkUnit, projectId, unitId, itemCache);

    // Scenes (after curtains)
    const { createdScenes, sceneAddressMap } = await readSceneConfigurations(networkUnit, projectId, unitId, itemCache);

    // Schedules
    const createdSchedules = await readScheduleConfigurations(networkUnit, projectId, sceneAddressMap, unitId);

    // KNX
    const createdKnxConfigs = await readKnxConfigurations(networkUnit, projectId, unitId, itemCache);

    // Multi-scenes
    const { createdMultiScenes, multiSceneAddressMap } = await readMultiSceneConfigurations(
      networkUnit,
      projectId,
      sceneAddressMap,
      unitId
    );

    // Sequences
    const createdSequences = await readSequenceConfigurations(networkUnit, projectId, multiSceneAddressMap, unitId);

    // Room configuration (general + per-room details)
    const roomResult = await readRoomConfigurations(networkUnit, projectId, unitId);

    // DMX device color configurations
    const createdDmxItems = await readDmxConfigurations(networkUnit, projectId, unitId);

    const configSummary = {
      scenes: createdScenes.length,
      schedules: createdSchedules.length,
      curtains: createdCurtains.length,
      knxConfigs: createdKnxConfigs.length,
      multiScenes: createdMultiScenes.length,
      sequences: createdSequences.length,
      rooms: roomResult.rooms,
      dmxItems: createdDmxItems.length,
    };

    const totalConfigs = Object.values(configSummary).reduce((sum, n) => sum + n, 0);
    log.info(`Advanced configurations transferred for unit ${networkUnit.ip_address}:`, configSummary);

    return { configSummary, totalConfigs };
  } catch (error) {
    log.error(`Failed to transfer advanced configurations for unit ${networkUnit.ip_address}:`, error);
    throw error;
  }
};

// Alias kept for backward compatibility with existing imports
export const readAdvancedConfigurations = transferAdvancedConfigurations;
