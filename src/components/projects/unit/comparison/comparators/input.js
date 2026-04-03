import { createDiff, nullCheck } from "./helpers";

export function compareInputConfigs(databaseInputs, networkInputs) {
  const early = nullCheck(databaseInputs, networkInputs, "input");
  if (early) return early;

  const differences = [];
  const dbInputs = databaseInputs.inputs || [];
  const netInputs = networkInputs.inputs || [];

  for (let i = 0; i < Math.max(dbInputs.length, netInputs.length); i++) {
    const dbInput = dbInputs[i];
    const netInput = netInputs[i];
    const label = `Input ${i + 1}`;

    if (!dbInput && !netInput) continue;

    if (!dbInput || !netInput) {
      differences.push(createDiff("input", label, dbInput ? "present" : "missing", netInput ? "present" : "missing"));
      continue;
    }

    // Skip unused inputs (both function_value = 0)
    const dbFn = dbInput.function_value || 0;
    const netFn = netInput.function_value || 0;
    if (dbFn === 0 && netFn === 0) continue;

    // Compare basic fields
    // Note: lighting_id is an internal DB concept (always null in network data), skip it
    [
      { name: "index", lbl: `${label} Index` },
      { name: "function_value", lbl: `${label} Function` },
    ].forEach(({ name, lbl }) => {
      if (dbInput[name] !== netInput[name]) {
        differences.push(createDiff("input", lbl, dbInput[name], netInput[name]));
      }
    });

    // Compare multi_group_config
    const dbActiveGroups = (dbInput.multi_group_config || []).filter((g) => g && typeof g === "object" && g.groupId > 0);
    const netActiveGroups = (netInput.multi_group_config || []).filter((g) => g && typeof g === "object" && g.groupId > 0);

    if (dbActiveGroups.length !== netActiveGroups.length) {
      differences.push(createDiff("input", `${label} Multi-Group Count`, dbActiveGroups.length, netActiveGroups.length));
    } else {
      const sortedDb = [...dbActiveGroups].sort((a, b) => a.groupId - b.groupId);
      const sortedNet = [...netActiveGroups].sort((a, b) => a.groupId - b.groupId);

      for (let j = 0; j < sortedDb.length; j++) {
        if (sortedDb[j].groupId !== sortedNet[j].groupId) {
          differences.push(createDiff("input", `${label} Group[${j}] ID`, sortedDb[j].groupId, sortedNet[j].groupId));
        }
        if (sortedDb[j].presetBrightness !== sortedNet[j].presetBrightness) {
          differences.push(createDiff("input", `${label} Group[${j}] Preset`, sortedDb[j].presetBrightness, sortedNet[j].presetBrightness));
        }
      }
    }

    // Compare rlc_config
    const dbRlc = dbInput.rlc_config || {};
    const netRlc = netInput.rlc_config || {};

    [
      { name: "ramp", lbl: `${label} RLC Ramp` },
      { name: "preset", lbl: `${label} RLC Preset` },
      { name: "ledDisplay", lbl: `${label} RLC LED Display` },
      { name: "nightlight", lbl: `${label} RLC Nightlight` },
      { name: "backlight", lbl: `${label} RLC Backlight` },
      { name: "autoMode", lbl: `${label} RLC Auto Mode` },
      { name: "delayOff", lbl: `${label} RLC Delay Off` },
    ].forEach(({ name, lbl }) => {
      if (dbRlc[name] !== netRlc[name]) {
        differences.push(createDiff("input", lbl, dbRlc[name], netRlc[name]));
      }
    });
  }

  return { isEqual: differences.length === 0, differences };
}
