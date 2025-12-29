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

  // Create maps for easier comparison by address
  const dbSceneMap = new Map();
  const netSceneMap = new Map();

  dbScenes.forEach((scene) => {
    if (scene.address !== undefined) {
      dbSceneMap.set(scene.address, scene);
    }
  });

  netScenes.forEach((scene) => {
    if (scene.address !== undefined) {
      netSceneMap.set(scene.address, scene);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbSceneMap.keys(), ...netSceneMap.keys()]);

  // Compare scene count
  if (dbScenes.length !== netScenes.length) {
    differences.push(`Scene count: DB=${dbScenes.length}, Network=${netScenes.length}`);
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
    } else {
      // Compare individual scene items
      for (let i = 0; i < dbItems.length; i++) {
        const dbItem = dbItems[i];
        const netItem = netItems[i];

        if (!dbItem && !netItem) continue;

        if (!dbItem || !netItem) {
          differences.push(`Scene ${address} Item ${i + 1}: Exists in only one unit`);
          continue;
        }

        // Compare scene item properties
        const itemFields = [
          { name: "object_type", label: "Object Type" },
          { name: "object_address", label: "Object Address" },
          { name: "object_value", label: "Object Value" },
          { name: "delay", label: "Delay" },
        ];

        itemFields.forEach((field) => {
          if (dbItem[field.name] !== netItem[field.name]) {
            differences.push(`Scene ${address} Item ${i + 1} ${field.label}: DB=${dbItem[field.name]}, Network=${netItem[field.name]}`);
          }
        });
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
