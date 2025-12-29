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

    // Compare multi scene scenes (ORDER MATTERS - scenes are ordered by scene_order)
    // Database returns scenes ordered by scene_order ASC
    // Network returns sceneAddresses array in order
    const dbScenes = dbMultiScene.scenes || [];
    const netSceneAddresses = netMultiScene.sceneAddresses || [];

    // Extract scene addresses from database scenes (already ordered by scene_order)
    const dbSceneAddresses = dbScenes.map((s) => parseInt(s.scene_address));

    if (dbSceneAddresses.length !== netSceneAddresses.length) {
      differences.push(`Multi Scene ${address} Scene count: DB=${dbSceneAddresses.length}, Network=${netSceneAddresses.length}`);
    } else {
      // Compare scenes in ORDER (index by index)
      for (let i = 0; i < dbSceneAddresses.length; i++) {
        const dbSceneAddr = dbSceneAddresses[i];
        const netSceneAddr = parseInt(netSceneAddresses[i]);

        if (dbSceneAddr !== netSceneAddr) {
          differences.push(
            `Multi Scene ${address} Scene ${i + 1} Address: DB=${dbSceneAddr}, Network=${netSceneAddr} (Order matters)`
          );
        }
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
