import { createDiff, nullCheck } from "./helpers";

export function compareSequences(databaseSequences, networkSequences) {
  const early = nullCheck(databaseSequences, networkSequences, "sequence");
  if (early) return early;

  const differences = [];
  const dbSequences = Array.isArray(databaseSequences) ? databaseSequences : [];
  const netSequences = Array.isArray(networkSequences) ? networkSequences : [];

  // Filter valid sequences (must have at least one multi-scene)
  const validDbSequences = dbSequences.filter((s) => (s.multiScenes?.length || 0) > 0);
  const validNetSequences = netSequences.filter((s) => (s.multiSceneAddresses?.length || 0) > 0);

  if (validDbSequences.length !== validNetSequences.length) {
    differences.push(createDiff("sequence", "Valid Sequence Count", validDbSequences.length, validNetSequences.length));
  }

  const dbMap = new Map();
  const netMap = new Map();

  // Normalize address to number — DB stores it as TEXT, RCU returns number
  validDbSequences.forEach((s) => {
    if (s.address !== undefined) dbMap.set(parseInt(s.address), s);
  });
  validNetSequences.forEach((s) => {
    if (s.address !== undefined) netMap.set(parseInt(s.address), s);
  });

  const allAddresses = new Set([...dbMap.keys(), ...netMap.keys()]);

  allAddresses.forEach((address) => {
    const dbSeq = dbMap.get(address);
    const netSeq = netMap.get(address);
    const label = `Sequence ${address}`;

    if (!dbSeq) {
      differences.push(createDiff("sequence", label, "missing", "present"));
      return;
    }
    if (!netSeq) {
      differences.push(createDiff("sequence", label, "present", "missing"));
      return;
    }

    if (dbSeq.name !== netSeq.name) {
      differences.push(createDiff("sequence", `${label} Name`, dbSeq.name, netSeq.name));
    }

    // Multi-scene order matters
    const dbMsAddrs = (dbSeq.multiScenes || []).map((ms) => parseInt(ms.multi_scene_address));
    const netMsAddrs = (netSeq.multiSceneAddresses || []).map((a) => parseInt(a));

    if (dbMsAddrs.length !== netMsAddrs.length) {
      differences.push(createDiff("sequence", `${label} Multi Scene Count`, dbMsAddrs.length, netMsAddrs.length));
    } else {
      for (let i = 0; i < dbMsAddrs.length; i++) {
        if (dbMsAddrs[i] !== netMsAddrs[i]) {
          differences.push(createDiff("sequence", `${label} MultiScene[${i + 1}] Address`, dbMsAddrs[i], netMsAddrs[i]));
        }
      }
    }
  });

  return { isEqual: differences.length === 0, differences };
}
