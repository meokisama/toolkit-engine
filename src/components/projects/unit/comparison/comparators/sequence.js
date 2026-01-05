/**
 * Compare sequence configurations between database and network unit
 * @param {Array} databaseSequences - Sequences from database
 * @param {Array} networkSequences - Sequences from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareSequences(databaseSequences, networkSequences) {
  const differences = [];

  if (!databaseSequences && !networkSequences) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseSequences || !networkSequences) {
    return {
      isEqual: false,
      differences: ["One unit has sequences while the other does not"],
    };
  }

  const dbSequences = Array.isArray(databaseSequences) ? databaseSequences : [];
  const netSequences = Array.isArray(networkSequences) ? networkSequences : [];

  // Filter valid sequences (same logic as sequence control dialog)
  // Sequence is valid if amount > 0 (has multi-scenes)
  const validDbSequences = dbSequences.filter((sequence) => {
    const multiSceneCount = sequence.multiScenes?.length || 0;
    return multiSceneCount > 0;
  });

  const validNetSequences = netSequences.filter((sequence) => {
    const multiSceneCount = sequence.multiSceneAddresses?.length || 0;
    return multiSceneCount > 0;
  });

  // Create maps for easier comparison by address
  const dbSequenceMap = new Map();
  const netSequenceMap = new Map();

  validDbSequences.forEach((sequence) => {
    if (sequence.address !== undefined) {
      dbSequenceMap.set(sequence.address, sequence);
    }
  });

  validNetSequences.forEach((sequence) => {
    if (sequence.address !== undefined) {
      netSequenceMap.set(sequence.address, sequence);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbSequenceMap.keys(), ...netSequenceMap.keys()]);

  // Compare valid sequence count
  if (validDbSequences.length !== validNetSequences.length) {
    differences.push(`Valid Sequence count: DB=${validDbSequences.length}, Network=${validNetSequences.length}`);
  }

  // Compare sequences by address
  allAddresses.forEach((address) => {
    const dbSequence = dbSequenceMap.get(address);
    const netSequence = netSequenceMap.get(address);

    if (!dbSequence && !netSequence) return;

    if (!dbSequence) {
      differences.push(`Sequence Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netSequence) {
      differences.push(`Sequence Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare sequence properties
    if (dbSequence.name !== netSequence.name) {
      differences.push(`Sequence ${address} Name: DB="${dbSequence.name}", Network="${netSequence.name}"`);
    }

    // Compare sequence multi scenes (ORDER MATTERS - multi-scenes are ordered by multi_scene_order)
    // Database returns multi-scenes ordered by multi_scene_order ASC
    // Network returns multiSceneAddresses array in order
    const dbMultiScenes = dbSequence.multiScenes || [];
    const netMultiSceneAddresses = netSequence.multiSceneAddresses || [];

    // Extract multi-scene addresses from database (already ordered by multi_scene_order)
    const dbMultiSceneAddresses = dbMultiScenes.map((ms) => parseInt(ms.multi_scene_address));

    if (dbMultiSceneAddresses.length !== netMultiSceneAddresses.length) {
      differences.push(`Sequence ${address} Multi Scene count: DB=${dbMultiSceneAddresses.length}, Network=${netMultiSceneAddresses.length}`);
    } else {
      // Compare multi-scenes in ORDER (index by index)
      for (let i = 0; i < dbMultiSceneAddresses.length; i++) {
        const dbMultiSceneAddr = dbMultiSceneAddresses[i];
        const netMultiSceneAddr = parseInt(netMultiSceneAddresses[i]);

        if (dbMultiSceneAddr !== netMultiSceneAddr) {
          differences.push(
            `Sequence ${address} Multi Scene ${i + 1} Address: DB=${dbMultiSceneAddr}, Network=${netMultiSceneAddr} (Order matters)`
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
