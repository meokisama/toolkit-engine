/**
 * Find matching units between database and network based on board type, CAN ID, and IP address
 * @param {Array} databaseUnits - Units from database
 * @param {Array} networkUnits - Units from network
 * @returns {Array} Array of matching unit pairs
 */
export function findMatchingUnits(databaseUnits, networkUnits) {
  const matches = [];

  databaseUnits.forEach((dbUnit) => {
    const matchingNetworkUnit = networkUnits.find(
      (netUnit) => dbUnit.type === netUnit.type && dbUnit.id_can === netUnit.id_can && dbUnit.ip_address === netUnit.ip_address
    );

    if (matchingNetworkUnit) {
      matches.push({
        databaseUnit: dbUnit,
        networkUnit: matchingNetworkUnit,
        matchType: "exact",
      });
    }
  });

  return matches;
}
