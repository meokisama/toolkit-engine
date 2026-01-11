/**
 * Compare KNX configurations between database and network unit
 * @param {Array} databaseKnx - KNX configs from database
 * @param {Array} networkKnx - KNX configs from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareKnx(databaseKnx, networkKnx) {
  const differences = [];

  if (!databaseKnx && !networkKnx) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseKnx || !networkKnx) {
    return {
      isEqual: false,
      differences: ["One unit has KNX configs while the other does not"],
    };
  }

  const dbKnx = Array.isArray(databaseKnx) ? databaseKnx : [];
  const netKnx = Array.isArray(networkKnx) ? networkKnx : [];

  // Filter out disabled KNX configs (type = 0) from both database and network
  // This matches the behavior in KNX Control dialog
  const validDbKnx = dbKnx.filter((knx) => knx.type !== 0);
  const validNetKnx = netKnx.filter((knx) => knx.type !== 0);

  // Create maps for easier comparison by address
  const dbKnxMap = new Map();
  const netKnxMap = new Map();

  validDbKnx.forEach((knx) => {
    if (knx.address !== undefined) {
      dbKnxMap.set(knx.address, knx);
    }
  });

  validNetKnx.forEach((knx) => {
    if (knx.address !== undefined) {
      netKnxMap.set(knx.address, knx);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbKnxMap.keys(), ...netKnxMap.keys()]);

  // Compare valid KNX count
  if (validDbKnx.length !== validNetKnx.length) {
    differences.push(`Valid KNX count: DB=${validDbKnx.length}, Network=${validNetKnx.length}`);
  }

  // Compare KNX configs by address
  allAddresses.forEach((address) => {
    const dbKnxConfig = dbKnxMap.get(address);
    const netKnxConfig = netKnxMap.get(address);

    if (!dbKnxConfig && !netKnxConfig) return;

    if (!dbKnxConfig) {
      differences.push(`KNX Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netKnxConfig) {
      differences.push(`KNX Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare KNX properties (skip name as it's not meaningful for comparison)
    const knxFields = [
      { name: "type", label: "Type" },
      { name: "factor", label: "Factor" },
      { name: "feedback", label: "Feedback" },
      { name: "knx_switch_group", label: "KNX Switch Group" },
      { name: "knx_dimming_group", label: "KNX Dimming Group" },
      { name: "knx_value_group", label: "KNX Value Group" },
      { name: "knx_status_group", label: "KNX Status Group" },
    ];

    knxFields.forEach((field) => {
      // Handle different field names between database and network
      let dbValue = dbKnxConfig[field.name];
      let netValue = netKnxConfig[field.name];

      // Map network field names to database field names
      if (field.name === "knx_switch_group" && netValue === undefined) {
        netValue = netKnxConfig.knxSwitchGroup;
      }
      if (field.name === "knx_dimming_group" && netValue === undefined) {
        netValue = netKnxConfig.knxDimmingGroup;
      }
      if (field.name === "knx_value_group" && netValue === undefined) {
        netValue = netKnxConfig.knxValueGroup;
      }
      if (field.name === "knx_status_group" && netValue === undefined) {
        netValue = netKnxConfig.knxStatusGroup;
      }

      // For KNX group fields, treat null and empty string as equivalent
      if (field.name.includes("knx_") && field.name.includes("_group")) {
        // Normalize values: treat null, undefined, and empty string as equivalent
        const normalizeGroupValue = (value) => {
          if (value === null || value === undefined || value === "" || value === "null") {
            return "";
          }
          return value;
        };

        dbValue = normalizeGroupValue(dbValue);
        netValue = normalizeGroupValue(netValue);
      }

      if (dbValue !== netValue) {
        differences.push(`KNX ${address} ${field.label}: DB="${dbValue}", Network="${netValue}"`);
      }
    });

    // Compare RCU group - need to handle the relationship
    // Database stores rcu_group_id, network stores rcuGroup address
    if (dbKnxConfig.rcu_group_id && netKnxConfig.rcuGroup) {
      // This would require looking up the RCU group address from the database
      // For now, we'll skip this comparison or implement it later
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
