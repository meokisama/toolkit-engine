/**
 * Scene Control Dialog Configuration
 * Defines entity-specific settings and API methods for scene control
 */

export const sceneConfig = {
  entityName: "Scene",
  entityNameSingular: "Scene", 
  entityNamePlural: "Scenes",
  indexRange: [0, 31],
  
  apiMethods: {
    // Load single scene
    loadSingle: async ({ unitIp, canId, index }) => {
      return await window.electronAPI.rcuController.getSceneInformation({
        unitIp,
        canId,
        sceneIndex: index,
      });
    },

    // Load all scenes
    loadAll: async ({ unitIp, canId }) => {
      const result = await window.electronAPI.rcuController.getAllScenesInformation({
        unitIp,
        canId,
      });
      return result?.scenes || [];
    },

    // Delete scene
    deleteItem: async ({ unitIp, canId, index }) => {
      return await window.electronAPI.rcuController.deleteScene({
        unitIp,
        canId,
        sceneIndex: index,
      });
    },

    // Process single scene item
    processItem: (result, index) => {
      if (!result) return null;
      
      return {
        index: index,
        name: result.sceneName || "No name",
        address: result.sceneAddress || 0,
        itemCount: result.itemCount || 0,
        items: result.items || [],
      };
    },

    // Process multiple scenes
    processItems: (scenes) => {
      return scenes.map((scene) => ({
        index: scene.sceneIndex || scene.index,
        name: scene.sceneName || scene.name || "No name",
        address: scene.sceneAddress || scene.address || 0,
        itemCount: scene.itemCount || 0,
        items: scene.items || [],
      }));
    },
  },

  // Filter function for scenes (optional)
  filterItems: (scene) => {
    // You can add filtering logic here if needed
    return true;
  },
};
