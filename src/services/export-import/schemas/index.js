// Schema registry. Adding a new feature = drop a schema file here and register it.
// No engine changes, no facade changes.

import { lightingSchema } from "./lighting.js";
import { curtainSchema } from "./curtain.js";
import { knxSchema } from "./knx.js";
import { dmxSchema } from "./dmx.js";
import { unitSchema } from "./unit.js";
import { airconCardsSchema } from "./aircon.js";

const registry = {
  lighting: lightingSchema,
  curtain: curtainSchema,
  knx: knxSchema,
  dmx: dmxSchema,
  unit: unitSchema,
  aircon: airconCardsSchema,
};

export function getSchema(category) {
  return registry[category] || null;
}

export function hasSchema(category) {
  return category in registry;
}

export function listSchemas() {
  return Object.values(registry);
}

// Builds FK lookup helpers out of whatever categories the caller already has
// loaded in the renderer store. Categories that aren't in projectItems are
// silently ignored — schemas handle missing lookups by returning null/empty.
export function buildLookupContext(projectItems = {}) {
  const byType = {};
  for (const [type, items] of Object.entries(projectItems)) {
    if (!Array.isArray(items)) continue;
    const byAddress = new Map();
    const byId = new Map();
    for (const it of items) {
      if (it == null) continue;
      const addr = it.address !== undefined && it.address !== null ? String(it.address) : null;
      if (addr !== null) byAddress.set(addr, it.id);
      byId.set(it.id, addr !== null ? addr : "");
    }
    byType[type] = { byAddress, byId };
  }
  return {
    lookupByAddress: (type, address) => byType[type]?.byAddress.get(String(address)) ?? null,
    lookupById: (type, id) => byType[type]?.byId.get(id) ?? "",
    projectItems,
  };
}
