import { createDiff, nullCheck } from "./helpers";

export function compareKnx(databaseKnx, networkKnx) {
  const early = nullCheck(databaseKnx, networkKnx, "knx");
  if (early) return early;

  const differences = [];
  const dbKnx = Array.isArray(databaseKnx) ? databaseKnx : [];
  const netKnx = Array.isArray(networkKnx) ? networkKnx : [];

  // Filter disabled KNX configs (type = 0)
  const validDbKnx = dbKnx.filter((k) => k.type !== 0);
  const validNetKnx = netKnx.filter((k) => k.type !== 0);

  if (validDbKnx.length !== validNetKnx.length) {
    differences.push(createDiff("knx", "Valid KNX Count", validDbKnx.length, validNetKnx.length));
  }

  const dbKnxMap = new Map();
  const netKnxMap = new Map();

  validDbKnx.forEach((k) => {
    if (k.address !== undefined) dbKnxMap.set(k.address, k);
  });
  validNetKnx.forEach((k) => {
    if (k.address !== undefined) netKnxMap.set(k.address, k);
  });

  const allAddresses = new Set([...dbKnxMap.keys(), ...netKnxMap.keys()]);

  const normalizeGroup = (value) => {
    if (value === null || value === undefined || value === "" || value === "null") return "";
    return value;
  };

  allAddresses.forEach((address) => {
    const dbConfig = dbKnxMap.get(address);
    const netConfig = netKnxMap.get(address);
    const label = `KNX ${address}`;

    if (!dbConfig) {
      differences.push(createDiff("knx", label, "missing", "present"));
      return;
    }
    if (!netConfig) {
      differences.push(createDiff("knx", label, "present", "missing"));
      return;
    }

    // Basic fields
    [
      { name: "type", lbl: `${label} Type` },
      { name: "factor", lbl: `${label} Factor` },
      { name: "feedback", lbl: `${label} Feedback` },
    ].forEach(({ name, lbl }) => {
      if (dbConfig[name] !== netConfig[name]) {
        differences.push(createDiff("knx", lbl, dbConfig[name], netConfig[name]));
      }
    });

    // KNX group fields — handle camelCase vs snake_case between DB and network
    [
      { dbField: "knx_switch_group", netField: "knxSwitchGroup", lbl: `${label} Switch Group` },
      { dbField: "knx_dimming_group", netField: "knxDimmingGroup", lbl: `${label} Dimming Group` },
      { dbField: "knx_value_group", netField: "knxValueGroup", lbl: `${label} Value Group` },
      { dbField: "knx_status_group", netField: "knxStatusGroup", lbl: `${label} Status Group` },
    ].forEach(({ dbField, netField, lbl }) => {
      const dbValue = normalizeGroup(dbConfig[dbField]);
      const netValue = normalizeGroup(netConfig[dbField] !== undefined ? netConfig[dbField] : netConfig[netField]);
      if (dbValue !== netValue) {
        differences.push(createDiff("knx", lbl, dbValue || "empty", netValue || "empty"));
      }
    });

    // RCU group comparison is skipped — requires DB lookup (known TODO)
  });

  return { isEqual: differences.length === 0, differences };
}
