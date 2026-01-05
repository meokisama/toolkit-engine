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

  // Filter out invalid curtains (type = 0) from both database and network
  // This matches the behavior in Curtain Control dialog
  // Database uses 'type', Network uses 'curtainType'
  const validDbCurtains = dbCurtains.filter((curtain) => curtain.type !== 0);
  const validNetCurtains = netCurtains.filter((curtain) => {
    const type = curtain.curtainType !== undefined ? curtain.curtainType : curtain.type;
    return type !== 0;
  });

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

  // Compare valid curtain count
  if (validDbCurtains.length !== validNetCurtains.length) {
    differences.push(`Valid Curtain count: DB=${validDbCurtains.length}, Network=${validNetCurtains.length}`);
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
    // Database uses 'type', Network uses 'curtainType'
    const dbType = dbCurtain.type;
    const netType = netCurtain.curtainType !== undefined ? netCurtain.curtainType : netCurtain.type;

    if (dbType !== netType) {
      differences.push(`Curtain ${address} Type: DB=${dbType}, Network=${netType}`);
    }

    // Compare runtime
    if (dbCurtain.runtime !== netCurtain.runtime) {
      differences.push(`Curtain ${address} Runtime: DB=${dbCurtain.runtime}, Network=${netCurtain.runtime}`);
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
