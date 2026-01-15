import log from "electron-log/renderer";
/**
 * Service for loading database configurations for a unit
 * Extracted from use-config-comparison.js
 */

/**
 * Get database configurations for a project (scenes, schedules, curtains, knx, multi scenes, sequences)
 * Filters all configurations by source_unit to only include items that belong to the specified database unit.
 * @param {Object} databaseUnit - Database unit object
 * @param {number} projectId - Project ID
 * @returns {Object} Database configurations with scenes, schedules, curtains, knx, multiScenes, sequences
 */
export async function getDatabaseConfigurations(databaseUnit, projectId) {
  try {
    log.info(`Loading database configurations for project ${projectId}, unit ${databaseUnit.id} (${databaseUnit.type} - ${databaseUnit.ip_address})`);

    // Load all database configurations in parallel
    const [allScenes, allSchedules, allCurtains, allKnx, allMultiScenes, allSequences] = await Promise.all([
      window.electronAPI.scene.getAll(projectId),
      window.electronAPI.schedule.getAll(projectId),
      window.electronAPI.curtain.getAll(projectId),
      window.electronAPI.knx.getAll(projectId),
      window.electronAPI.multiScenes.getAll(projectId),
      window.electronAPI.sequences.getAll(projectId),
    ]);

    // Filter all configurations by source_unit
    // Only include items where source_unit matches the current database unit
    const scenes = allScenes.filter((item) => item.source_unit === databaseUnit.id);
    const schedules = allSchedules.filter((item) => item.source_unit === databaseUnit.id);
    const curtains = allCurtains.filter((item) => item.source_unit === databaseUnit.id);
    const knx = allKnx.filter((item) => item.source_unit === databaseUnit.id);
    const multiScenes = allMultiScenes.filter((item) => item.source_unit === databaseUnit.id);
    const sequences = allSequences.filter((item) => item.source_unit === databaseUnit.id);

    // For scenes, we need to get scene items as well
    const scenesWithItems = await Promise.all(
      scenes.map(async (scene) => {
        try {
          const items = await window.electronAPI.scenes.getItems(scene.id);
          return { ...scene, items };
        } catch (error) {
          log.warn(`Failed to load items for scene ${scene.id}:`, error);
          return { ...scene, items: [] };
        }
      })
    );

    // For schedules, we need to get schedule scenes as well
    const schedulesWithScenes = await Promise.all(
      schedules.map(async (schedule) => {
        try {
          const scenes = await window.electronAPI.schedules.getScenes(schedule.id);
          return { ...schedule, scenes };
        } catch (error) {
          log.warn(`Failed to load scenes for schedule ${schedule.id}:`, error);
          return { ...schedule, scenes: [] };
        }
      })
    );

    // For multi scenes, we need to get multi scene scenes as well
    const multiScenesWithScenes = await Promise.all(
      multiScenes.map(async (multiScene) => {
        try {
          const scenes = await window.electronAPI.multiScenes.getScenes(multiScene.id);
          return { ...multiScene, scenes };
        } catch (error) {
          log.warn(`Failed to load scenes for multi scene ${multiScene.id}:`, error);
          return { ...multiScene, scenes: [] };
        }
      })
    );

    // For sequences, we need to get sequence multi scenes as well
    const sequencesWithMultiScenes = await Promise.all(
      sequences.map(async (sequence) => {
        try {
          const multiScenes = await window.electronAPI.sequences.getMultiScenes(sequence.id);
          return { ...sequence, multiScenes };
        } catch (error) {
          log.warn(`Failed to load multi scenes for sequence ${sequence.id}:`, error);
          return { ...sequence, multiScenes: [] };
        }
      })
    );

    log.info(`Loaded database configurations for unit ${databaseUnit.id} (filtered by source_unit):`, {
      scenes: scenesWithItems.length,
      schedules: schedulesWithScenes.length,
      curtains: curtains.length,
      knx: knx.length,
      multiScenes: multiScenesWithScenes.length,
      sequences: sequencesWithMultiScenes.length,
    });

    return {
      scenes: scenesWithItems,
      schedules: schedulesWithScenes,
      curtains,
      knx,
      multiScenes: multiScenesWithScenes,
      sequences: sequencesWithMultiScenes,
    };
  } catch (error) {
    log.error(`Failed to load database configurations for project ${projectId}:`, error);
    return {
      scenes: [],
      schedules: [],
      curtains: [],
      knx: [],
      multiScenes: [],
      sequences: [],
    };
  }
}
