import { createDiff, nullCheck } from "./helpers";

// Resolve a DB group FK (lighting.id) to its address via projectItems lookup.
// Returns 0 if unresolved so comparisons fall back to "unassigned".
function resolveDbGroupAddress(groupId, projectItems) {
  if (!groupId || !projectItems?.lighting) return 0;
  const item = projectItems.lighting.find((l) => l.id === groupId);
  return item ? parseInt(item.address) || 0 : 0;
}

export function compareCurtains(databaseCurtains, networkCurtains, projectItems = null) {
  const early = nullCheck(databaseCurtains, networkCurtains, "curtain");
  if (early) return early;

  const differences = [];
  const dbCurtains = Array.isArray(databaseCurtains) ? databaseCurtains : [];
  const netCurtains = Array.isArray(networkCurtains) ? networkCurtains : [];

  // Filter out inactive curtains. DB stores the numeric type in `curtain_value`;
  // RCU returns `curtainType`.
  const validDbCurtains = dbCurtains.filter((c) => (c.curtain_value || 0) !== 0);
  const validNetCurtains = netCurtains.filter((c) => (c.curtainType || 0) !== 0);

  if (validDbCurtains.length !== validNetCurtains.length) {
    differences.push(createDiff("curtain", "Valid Curtain Count", validDbCurtains.length, validNetCurtains.length));
  }

  // Normalize address to number — DB stores it as TEXT, RCU returns number
  const dbCurtainMap = new Map();
  const netCurtainMap = new Map();

  validDbCurtains.forEach((c) => {
    if (c.address !== undefined) dbCurtainMap.set(parseInt(c.address), c);
  });
  validNetCurtains.forEach((c) => {
    if (c.address !== undefined) netCurtainMap.set(parseInt(c.address), c);
  });

  const allAddresses = new Set([...dbCurtainMap.keys(), ...netCurtainMap.keys()]);

  allAddresses.forEach((address) => {
    const dbCurtain = dbCurtainMap.get(address);
    const netCurtain = netCurtainMap.get(address);
    const label = `Curtain ${address}`;

    if (!dbCurtain) {
      differences.push(createDiff("curtain", label, "missing", "present"));
      return;
    }
    if (!netCurtain) {
      differences.push(createDiff("curtain", label, "present", "missing"));
      return;
    }

    if ((dbCurtain.curtain_value || 0) !== (netCurtain.curtainType || 0)) {
      differences.push(createDiff("curtain", `${label} Type`, dbCurtain.curtain_value, netCurtain.curtainType));
    }

    if ((dbCurtain.pause_period || 0) !== (netCurtain.pausePeriod || 0)) {
      differences.push(createDiff("curtain", `${label} Pause Period`, dbCurtain.pause_period, netCurtain.pausePeriod));
    }

    if ((dbCurtain.transition_period || 0) !== (netCurtain.transitionPeriod || 0)) {
      differences.push(createDiff("curtain", `${label} Transition Period`, dbCurtain.transition_period, netCurtain.transitionPeriod));
    }

    // Group comparison requires projectItems to resolve DB group IDs to addresses.
    // Skip silently if projectItems is unavailable (same pattern as output comparator).
    if (projectItems) {
      const groupFields = [
        { dbField: "open_group_id", netField: "openGroup", lbl: `${label} Open Group` },
        { dbField: "close_group_id", netField: "closeGroup", lbl: `${label} Close Group` },
        { dbField: "stop_group_id", netField: "stopGroup", lbl: `${label} Stop Group` },
      ];
      groupFields.forEach(({ dbField, netField, lbl }) => {
        const dbAddr = resolveDbGroupAddress(dbCurtain[dbField], projectItems);
        const netAddr = netCurtain[netField] || 0;
        if (dbAddr !== netAddr) {
          differences.push(createDiff("curtain", lbl, dbAddr || "unassigned", netAddr || "unassigned"));
        }
      });
    }
  });

  return { isEqual: differences.length === 0, differences };
}
