/**
 * Curtain Control Dialog Configuration
 * Defines entity-specific settings and API methods for curtain control
 */

export const curtainConfig = {
  entityName: "Curtain",
  entityNameSingular: "Curtain",
  entityNamePlural: "Curtains",
  indexRange: [0, 31],
  
  apiMethods: {
    // Load single curtain
    loadSingle: async ({ unitIp, canId, index }) => {
      return await window.electronAPI.rcuController.getCurtainConfig({
        unitIp,
        canId,
        curtainIndex: index,
      });
    },

    // Load all curtains
    loadAll: async ({ unitIp, canId }) => {
      const result = await window.electronAPI.rcuController.getCurtainConfig({
        unitIp,
        canId,
        curtainIndex: null, // null means get all
      });
      return result?.curtains || [];
    },

    // Delete curtain
    deleteItem: async ({ unitIp, canId, index }) => {
      return await window.electronAPI.rcuController.deleteCurtain({
        unitIp,
        canId,
        curtainIndex: index,
      });
    },

    // Process single curtain item
    processItem: (result, index) => {
      if (!result) return null;
      
      return {
        address: result.address || 0,
        index: result.index || index,
        curtainType: result.curtainType || 0,
        pausePeriod: result.pausePeriod || 0,
        transitionPeriod: result.transitionPeriod || 0,
        openGroup: result.openGroup || 0,
        closeGroup: result.closeGroup || 0,
        stopGroup: result.stopGroup || 0,
      };
    },

    // Process multiple curtains
    processItems: (curtains) => {
      return curtains.map((curtain) => ({
        address: curtain.address,
        index: curtain.index,
        curtainType: curtain.curtainType,
        pausePeriod: curtain.pausePeriod,
        transitionPeriod: curtain.transitionPeriod,
        openGroup: curtain.openGroup,
        closeGroup: curtain.closeGroup,
        stopGroup: curtain.stopGroup,
      }));
    },
  },

  // Filter function for curtains - exclude curtains with type = 0 (invalid/unused)
  filterItems: (curtain) => {
    return curtain.curtainType !== 0;
  },
};
