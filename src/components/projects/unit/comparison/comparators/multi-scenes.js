import { createDiff, nullCheck } from "./helpers";

export function compareMultiScenes(databaseMultiScenes, networkMultiScenes) {
  const early = nullCheck(databaseMultiScenes, networkMultiScenes, "multi_scene");
  if (early) return early;

  const differences = [];
  const dbMultiScenes = Array.isArray(databaseMultiScenes) ? databaseMultiScenes : [];
  const netMultiScenes = Array.isArray(networkMultiScenes) ? networkMultiScenes : [];

  // Filter valid multi-scenes (must have at least one scene)
  const validDbMultiScenes = dbMultiScenes.filter((ms) => (ms.scenes?.length || 0) > 0);
  const validNetMultiScenes = netMultiScenes.filter((ms) => (ms.sceneAddresses?.length || 0) > 0);

  if (validDbMultiScenes.length !== validNetMultiScenes.length) {
    differences.push(createDiff("multi_scene", "Valid Multi Scene Count", validDbMultiScenes.length, validNetMultiScenes.length));
  }

  const dbMap = new Map();
  const netMap = new Map();

  validDbMultiScenes.forEach((ms) => {
    if (ms.address !== undefined) dbMap.set(ms.address, ms);
  });
  validNetMultiScenes.forEach((ms) => {
    if (ms.address !== undefined) netMap.set(ms.address, ms);
  });

  const allAddresses = new Set([...dbMap.keys(), ...netMap.keys()]);

  allAddresses.forEach((address) => {
    const dbMs = dbMap.get(address);
    const netMs = netMap.get(address);
    const label = `Multi Scene ${address}`;

    if (!dbMs) {
      differences.push(createDiff("multi_scene", label, "missing", "present"));
      return;
    }
    if (!netMs) {
      differences.push(createDiff("multi_scene", label, "present", "missing"));
      return;
    }

    if (dbMs.name !== netMs.name) {
      differences.push(createDiff("multi_scene", `${label} Name`, dbMs.name, netMs.name));
    }
    if (dbMs.type !== netMs.type) {
      differences.push(createDiff("multi_scene", `${label} Type`, dbMs.type, netMs.type));
    }

    // Scene order matters
    const dbSceneAddrs = (dbMs.scenes || []).map((s) => parseInt(s.scene_address));
    const netSceneAddrs = (netMs.sceneAddresses || []).map((s) => parseInt(s));

    if (dbSceneAddrs.length !== netSceneAddrs.length) {
      differences.push(createDiff("multi_scene", `${label} Scene Count`, dbSceneAddrs.length, netSceneAddrs.length));
    } else {
      for (let i = 0; i < dbSceneAddrs.length; i++) {
        if (dbSceneAddrs[i] !== netSceneAddrs[i]) {
          differences.push(createDiff("multi_scene", `${label} Scene[${i + 1}] Address`, dbSceneAddrs[i], netSceneAddrs[i]));
        }
      }
    }
  });

  return { isEqual: differences.length === 0, differences };
}
