/**
 * Compare scene configurations between database and network unit
 * @param {Array} databaseScenes - Scenes from database unit
 * @param {Array} networkScenes - Scenes from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareScenes(databaseScenes, networkScenes) {
  const differences = [];

  if (!databaseScenes && !networkScenes) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseScenes || !networkScenes) {
    return {
      isEqual: false,
      differences: ["One unit has scenes while the other does not"],
    };
  }

  const dbScenes = Array.isArray(databaseScenes) ? databaseScenes : [];
  const netScenes = Array.isArray(networkScenes) ? networkScenes : [];

  // Filter valid scenes (same logic as scene control dialog)
  // Scene is valid if NOT (address === 0 AND itemCount === 0)
  const validDbScenes = dbScenes.filter((scene) => {
    const itemCount = scene.items?.length || 0;
    return !(scene.address === "0" && itemCount === 0);
  });

  const validNetScenes = netScenes.filter((scene) => {
    return !(scene.address === 0 && scene.itemCount === 0);
  });

  // Create maps for easier comparison by address
  const dbSceneMap = new Map();
  const netSceneMap = new Map();

  validDbScenes.forEach((scene) => {
    if (scene.address !== undefined) {
      dbSceneMap.set(scene.address, scene);
    }
  });

  validNetScenes.forEach((scene) => {
    if (scene.address !== undefined) {
      netSceneMap.set(scene.address, scene);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbSceneMap.keys(), ...netSceneMap.keys()]);

  // Compare valid scene count
  if (validDbScenes.length !== validNetScenes.length) {
    differences.push(`Valid Scene count: DB=${validDbScenes.length}, Network=${validNetScenes.length}`);
  }

  // Compare scenes by address
  allAddresses.forEach((address) => {
    const dbScene = dbSceneMap.get(address);
    const netScene = netSceneMap.get(address);

    if (!dbScene && !netScene) return;

    if (!dbScene) {
      differences.push(`Scene Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netScene) {
      differences.push(`Scene Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare scene properties
    if (dbScene.name !== netScene.name) {
      differences.push(`Scene ${address} Name: DB="${dbScene.name}", Network="${netScene.name}"`);
    }

    // Compare scene items in detail
    const dbItems = dbScene.items || [];
    const netItems = netScene.items || [];

    if (dbItems.length !== netItems.length) {
      differences.push(`Scene ${address} Item count: DB=${dbItems.length}, Network=${netItems.length}`);
    }

    // Create maps for scene items based on unique key: object_value + object_address
    // This allows comparison regardless of item order
    const dbItemMap = new Map();
    const netItemMap = new Map();

    dbItems.forEach((item) => {
      const key = `${item.object_value || 0}_${item.object_address || item.item_address || 0}`;
      dbItemMap.set(key, item);
    });

    netItems.forEach((item) => {
      const key = `${item.objectValue || 0}_${item.itemAddress || item.object_address || 0}`;
      netItemMap.set(key, item);
    });

    // Get all unique item keys
    const allItemKeys = new Set([...dbItemMap.keys(), ...netItemMap.keys()]);

    // Compare each unique item
    allItemKeys.forEach((itemKey) => {
      const dbItem = dbItemMap.get(itemKey);
      const netItem = netItemMap.get(itemKey);

      if (!dbItem && !netItem) return;

      const [objectValue, objectAddress] = itemKey.split("_");

      if (!dbItem) {
        differences.push(`Scene ${address} Item (Type=${objectValue}, Addr=${objectAddress}): Only exists in Network unit`);
        return;
      }

      if (!netItem) {
        differences.push(`Scene ${address} Item (Type=${objectValue}, Addr=${objectAddress}): Only exists in Database unit`);
        return;
      }

      // Compare item value (both DB and Network store 0-255 for lighting)
      const dbItemValue = parseFloat(dbItem.item_value || dbItem.object_value || 0);
      const netItemValue = parseFloat(netItem.itemValue || netItem.item_value || 0);

      if (dbItemValue !== netItemValue) {
        differences.push(
          `Scene ${address} Item (Type=${objectValue}, Addr=${objectAddress}) Value: DB=${dbItem.item_value}, Network=${netItem.itemValue}`
        );
      }

      // Compare delay if present
      const dbDelay = dbItem.delay || 0;
      const netDelay = netItem.delay || 0;
      if (dbDelay !== netDelay) {
        differences.push(`Scene ${address} Item (Type=${objectValue}, Addr=${objectAddress}) Delay: DB=${dbDelay}, Network=${netDelay}`);
      }
    });
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
