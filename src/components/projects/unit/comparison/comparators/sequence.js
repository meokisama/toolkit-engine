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

  // Create maps for easier comparison by address
  const dbSequenceMap = new Map();
  const netSequenceMap = new Map();

  dbSequences.forEach((sequence) => {
    if (sequence.address !== undefined) {
      dbSequenceMap.set(sequence.address, sequence);
    }
  });

  netSequences.forEach((sequence) => {
    if (sequence.address !== undefined) {
      netSequenceMap.set(sequence.address, sequence);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbSequenceMap.keys(), ...netSequenceMap.keys()]);

  // Compare sequence count
  if (dbSequences.length !== netSequences.length) {
    differences.push(`Sequence count: DB=${dbSequences.length}, Network=${netSequences.length}`);
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

    // Compare sequence multi scenes
    const dbMultiScenes = dbSequence.multiScenes || [];
    const netMultiScenes = netSequence.multiScenes || [];

    if (dbMultiScenes.length !== netMultiScenes.length) {
      differences.push(`Sequence ${address} Multi Scene count: DB=${dbMultiScenes.length}, Network=${netMultiScenes.length}`);
    } else {
      for (let i = 0; i < dbMultiScenes.length; i++) {
        const dbMultiScene = dbMultiScenes[i];
        const netMultiScene = netMultiScenes[i];

        if (dbMultiScene.multi_scene_address !== netMultiScene.multi_scene_address) {
          differences.push(
            `Sequence ${address} Multi Scene ${i + 1} Address: DB=${dbMultiScene.multi_scene_address}, Network=${netMultiScene.multi_scene_address}`
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
