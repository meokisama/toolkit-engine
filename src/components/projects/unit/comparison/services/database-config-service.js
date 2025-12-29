/**
 * Service for loading database configurations for a unit
 * Extracted from use-config-comparison.js
 */

/**
 * Get database configurations for a project (scenes, schedules, curtains, knx, multi scenes, sequences)
 * @param {Object} databaseUnit - Database unit object
 * @param {number} projectId - Project ID
 * @returns {Object} Database configurations with scenes, schedules, curtains, knx, multiScenes, sequences
 */
export async function getDatabaseConfigurations(databaseUnit, projectId) {
  try {
    console.log(`Loading database configurations for project ${projectId}`);

    // Load all database configurations in parallel
    const [scenes, schedules, curtains, knx, multiScenes, sequences] = await Promise.all([
      window.electronAPI.scene.getAll(projectId),
      window.electronAPI.schedule.getAll(projectId),
      window.electronAPI.curtain.getAll(projectId),
      window.electronAPI.knx.getAll(projectId),
      window.electronAPI.multiScenes.getAll(projectId),
      window.electronAPI.sequences.getAll(projectId),
    ]);

    // For scenes, we need to get scene items as well
    const scenesWithItems = await Promise.all(
      scenes.map(async (scene) => {
        try {
          const items = await window.electronAPI.scenes.getItems(scene.id);
          return { ...scene, items };
        } catch (error) {
          console.warn(`Failed to load items for scene ${scene.id}:`, error);
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
          console.warn(`Failed to load scenes for schedule ${schedule.id}:`, error);
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
          console.warn(`Failed to load scenes for multi scene ${multiScene.id}:`, error);
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
          console.warn(`Failed to load multi scenes for sequence ${sequence.id}:`, error);
          return { ...sequence, multiScenes: [] };
        }
      })
    );

    console.log(`Loaded database configurations:`, {
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
    console.error(`Failed to load database configurations for project ${projectId}:`, error);
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
