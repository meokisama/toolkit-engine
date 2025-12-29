/**
 * Scene and Multi-Scene configuration comparators
 */

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

/**
 * Compare multi scene configurations between database and network unit
 * @param {Array} databaseMultiScenes - Multi scenes from database
 * @param {Array} networkMultiScenes - Multi scenes from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareMultiScenes(databaseMultiScenes, networkMultiScenes) {
  const differences = [];

  if (!databaseMultiScenes && !networkMultiScenes) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseMultiScenes || !networkMultiScenes) {
    return {
      isEqual: false,
      differences: ["One unit has multi scenes while the other does not"],
    };
  }

  const dbMultiScenes = Array.isArray(databaseMultiScenes) ? databaseMultiScenes : [];
  const netMultiScenes = Array.isArray(networkMultiScenes) ? networkMultiScenes : [];

  // Create maps for easier comparison by address
  const dbMultiSceneMap = new Map();
  const netMultiSceneMap = new Map();

  dbMultiScenes.forEach((multiScene) => {
    if (multiScene.address !== undefined) {
      dbMultiSceneMap.set(multiScene.address, multiScene);
    }
  });

  networkMultiScenes.forEach((multiScene) => {
    if (multiScene.address !== undefined) {
      netMultiSceneMap.set(multiScene.address, multiScene);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbMultiSceneMap.keys(), ...netMultiSceneMap.keys()]);

  // Compare multi scene count
  if (dbMultiScenes.length !== netMultiScenes.length) {
    differences.push(`Multi Scene count: DB=${dbMultiScenes.length}, Network=${netMultiScenes.length}`);
  }

  // Compare multi scenes by address
  allAddresses.forEach((address) => {
    const dbMultiScene = dbMultiSceneMap.get(address);
    const netMultiScene = netMultiSceneMap.get(address);

    if (!dbMultiScene && !netMultiScene) return;

    if (!dbMultiScene) {
      differences.push(`Multi Scene Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netMultiScene) {
      differences.push(`Multi Scene Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare multi scene properties
    const multiSceneFields = [
      { name: "name", label: "Name" },
      { name: "type", label: "Type" },
    ];

    multiSceneFields.forEach((field) => {
      if (dbMultiScene[field.name] !== netMultiScene[field.name]) {
        differences.push(`Multi Scene ${address} ${field.label}: DB="${dbMultiScene[field.name]}", Network="${netMultiScene[field.name]}"`);
      }
    });

    // Compare multi scene scenes
    const dbScenes = dbMultiScene.scenes || [];
    const netScenes = netMultiScene.scenes || [];

    if (dbScenes.length !== netScenes.length) {
      differences.push(`Multi Scene ${address} Scene count: DB=${dbScenes.length}, Network=${netScenes.length}`);
    } else {
      for (let i = 0; i < dbScenes.length; i++) {
        const dbScene = dbScenes[i];
        const netScene = netScenes[i];

        if (dbScene.scene_address !== netScene.scene_address) {
          differences.push(`Multi Scene ${address} Scene ${i + 1} Address: DB=${dbScene.scene_address}, Network=${netScene.scene_address}`);
        }
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
