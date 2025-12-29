/**
 * Curtain configuration comparator
 */

/**
 * Compare curtain configurations between database and network unit
 * @param {Array} databaseCurtains - Curtains from database unit
 * @param {Array} networkCurtains - Curtains from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareCurtains(databaseCurtains, networkCurtains) {
  const differences = [];

  if (!databaseCurtains && !networkCurtains) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseCurtains || !networkCurtains) {
    return {
      isEqual: false,
      differences: ["One unit has curtains while the other does not"],
    };
  }

  const dbCurtains = Array.isArray(databaseCurtains) ? databaseCurtains : [];
  const netCurtains = Array.isArray(networkCurtains) ? networkCurtains : [];

  // Filter out disabled curtains (type = 0) from both database and network
  // This matches the behavior for other disabled configurations
  const validDbCurtains = dbCurtains.filter((curtain) => curtain.type !== 0);
  const validNetCurtains = netCurtains.filter((curtain) => curtain.type !== 0);

  // Create maps for easier comparison by address
  const dbCurtainMap = new Map();
  const netCurtainMap = new Map();

  validDbCurtains.forEach((curtain) => {
    if (curtain.address !== undefined) {
      dbCurtainMap.set(curtain.address, curtain);
    }
  });

  validNetCurtains.forEach((curtain) => {
    if (curtain.address !== undefined) {
      netCurtainMap.set(curtain.address, curtain);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbCurtainMap.keys(), ...netCurtainMap.keys()]);

  // Compare curtain count (using filtered arrays)
  if (validDbCurtains.length !== validNetCurtains.length) {
    differences.push(`Curtain count: DB=${validDbCurtains.length}, Network=${validNetCurtains.length}`);
  }

  // Compare curtains by address
  allAddresses.forEach((address) => {
    const dbCurtain = dbCurtainMap.get(address);
    const netCurtain = netCurtainMap.get(address);

    if (!dbCurtain && !netCurtain) return;

    if (!dbCurtain) {
      differences.push(`Curtain Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netCurtain) {
      differences.push(`Curtain Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare curtain properties (skip name as it's not meaningful for comparison)
    const fieldsToCompare = [
      { name: "type", label: "Type" },
      { name: "runtime", label: "Runtime" },
    ];

    fieldsToCompare.forEach((field) => {
      if (dbCurtain[field.name] !== netCurtain[field.name]) {
        differences.push(`Curtain ${address} ${field.label}: DB=${dbCurtain[field.name]}, Network=${netCurtain[field.name]}`);
      }
    });
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
