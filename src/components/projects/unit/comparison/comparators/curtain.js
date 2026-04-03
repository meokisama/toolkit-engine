import { createDiff, nullCheck } from "./helpers";

export function compareCurtains(databaseCurtains, networkCurtains) {
  const early = nullCheck(databaseCurtains, networkCurtains, "curtain");
  if (early) return early;

  const differences = [];
  const dbCurtains = Array.isArray(databaseCurtains) ? databaseCurtains : [];
  const netCurtains = Array.isArray(networkCurtains) ? networkCurtains : [];

  // Filter out inactive curtains (type = 0)
  const validDbCurtains = dbCurtains.filter((c) => c.type !== 0);
  const validNetCurtains = netCurtains.filter((c) => {
    const type = c.curtainType !== undefined ? c.curtainType : c.type;
    return type !== 0;
  });

  if (validDbCurtains.length !== validNetCurtains.length) {
    differences.push(createDiff("curtain", "Valid Curtain Count", validDbCurtains.length, validNetCurtains.length));
  }

  const dbCurtainMap = new Map();
  const netCurtainMap = new Map();

  validDbCurtains.forEach((c) => {
    if (c.address !== undefined) dbCurtainMap.set(c.address, c);
  });
  validNetCurtains.forEach((c) => {
    if (c.address !== undefined) netCurtainMap.set(c.address, c);
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

    const netType = netCurtain.curtainType !== undefined ? netCurtain.curtainType : netCurtain.type;
    if (dbCurtain.type !== netType) {
      differences.push(createDiff("curtain", `${label} Type`, dbCurtain.type, netType));
    }

    if (dbCurtain.runtime !== netCurtain.runtime) {
      differences.push(createDiff("curtain", `${label} Runtime`, dbCurtain.runtime, netCurtain.runtime));
    }
  });

  return { isEqual: differences.length === 0, differences };
}
