/**
 * Compare input configurations between database and network unit
 * @param {Object} databaseInputs - Input configs from database unit
 * @param {Object} networkInputs - Input configs from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareInputConfigs(databaseInputs, networkInputs) {
  const differences = [];

  if (!databaseInputs && !networkInputs) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseInputs || !networkInputs) {
    return {
      isEqual: false,
      differences: ["One unit has input configs while the other does not"],
    };
  }

  const dbInputs = databaseInputs.inputs || [];
  const netInputs = networkInputs.inputs || [];

  for (let i = 0; i < Math.max(dbInputs.length, netInputs.length); i++) {
    const dbInput = dbInputs[i];
    const netInput = netInputs[i];

    if (!dbInput && !netInput) continue;

    if (!dbInput || !netInput) {
      differences.push(`Input ${i + 1}: Configuration exists in only one unit`);
      continue;
    }

    // Skip detailed comparison if both inputs are unused (function_value = 0)
    const dbFunctionValue = dbInput.function_value || 0;
    const netFunctionValue = netInput.function_value || 0;

    if (dbFunctionValue === 0 && netFunctionValue === 0) {
      // Both inputs are unused, skip detailed comparison
      continue;
    }

    // Compare input properties based on actual structure from transfer function
    const fieldsToCompare = [
      { name: "index", label: "Index" },
      { name: "function_value", label: "Function Value" },
      { name: "lighting_id", label: "Lighting ID" },
    ];

    fieldsToCompare.forEach((field) => {
      if (dbInput[field.name] !== netInput[field.name]) {
        differences.push(`Input ${i + 1} ${field.label}: DB=${dbInput[field.name]}, Network=${netInput[field.name]}`);
      }
    });

    // Compare multi_group_config arrays - both should be arrays of objects with {groupId, presetBrightness}
    const dbGroups = dbInput.multi_group_config || [];
    const netGroups = netInput.multi_group_config || [];

    // Filter out invalid/empty groups (groups with groupId > 0)
    const dbActiveGroups = dbGroups.filter((group) => group && typeof group === "object" && group.groupId > 0);
    const netActiveGroups = netGroups.filter((group) => group && typeof group === "object" && group.groupId > 0);

    if (dbActiveGroups.length !== netActiveGroups.length) {
      differences.push(`Input ${i + 1} Active Multi-Group Count: DB=${dbActiveGroups.length}, Network=${netActiveGroups.length}`);
    } else {
      // Sort both arrays by groupId for consistent comparison
      const sortedDbGroups = [...dbActiveGroups].sort((a, b) => a.groupId - b.groupId);
      const sortedNetGroups = [...netActiveGroups].sort((a, b) => a.groupId - b.groupId);

      for (let j = 0; j < sortedDbGroups.length; j++) {
        const dbGroup = sortedDbGroups[j];
        const netGroup = sortedNetGroups[j];

        if (dbGroup.groupId !== netGroup.groupId) {
          differences.push(`Input ${i + 1} Multi-Group[${j}] Group ID: DB=${dbGroup.groupId}, Network=${netGroup.groupId}`);
        }

        if (dbGroup.presetBrightness !== netGroup.presetBrightness) {
          differences.push(
            `Input ${i + 1} Multi-Group[${j}] Preset Brightness: DB=${dbGroup.presetBrightness}, Network=${netGroup.presetBrightness}`
          );
        }
      }
    }

    // Compare rlc_config object
    const dbRlc = dbInput.rlc_config || {};
    const netRlc = netInput.rlc_config || {};

    const rlcFields = [
      { name: "ramp", label: "Ramp" },
      { name: "preset", label: "Preset" },
      { name: "ledStatus", label: "LED Status" },
      { name: "autoMode", label: "Auto Mode" },
      { name: "delayOff", label: "Delay Off" },
      { name: "delayOn", label: "Delay On" },
    ];

    rlcFields.forEach((field) => {
      if (dbRlc[field.name] !== netRlc[field.name]) {
        differences.push(`Input ${i + 1} RLC ${field.label}: DB=${dbRlc[field.name]}, Network=${netRlc[field.name]}`);
      }
    });
  }

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
