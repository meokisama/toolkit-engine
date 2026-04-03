import { createDiff, nullCheck } from "./helpers";

export function compareScenes(databaseScenes, networkScenes) {
  const early = nullCheck(databaseScenes, networkScenes, "scene");
  if (early) return early;

  const differences = [];
  const dbScenes = Array.isArray(databaseScenes) ? databaseScenes : [];
  const netScenes = Array.isArray(networkScenes) ? networkScenes : [];

  // Normalize address to number to avoid string/number type mismatch
  const validDbScenes = dbScenes.filter((scene) => {
    const addr = parseInt(scene.address);
    const itemCount = scene.items?.length || 0;
    return !(addr === 0 && itemCount === 0);
  });

  const validNetScenes = netScenes.filter((scene) => {
    const addr = parseInt(scene.address);
    return !(addr === 0 && scene.itemCount === 0);
  });

  if (validDbScenes.length !== validNetScenes.length) {
    differences.push(createDiff("scene", "Valid Scene Count", validDbScenes.length, validNetScenes.length));
  }

  // Build maps by numeric address for consistent key comparison
  const dbSceneMap = new Map();
  const netSceneMap = new Map();

  validDbScenes.forEach((scene) => {
    if (scene.address !== undefined) dbSceneMap.set(parseInt(scene.address), scene);
  });
  validNetScenes.forEach((scene) => {
    if (scene.address !== undefined) netSceneMap.set(parseInt(scene.address), scene);
  });

  const allAddresses = new Set([...dbSceneMap.keys(), ...netSceneMap.keys()]);

  allAddresses.forEach((address) => {
    const dbScene = dbSceneMap.get(address);
    const netScene = netSceneMap.get(address);

    if (!dbScene) {
      differences.push(createDiff("scene", `Scene ${address}`, "missing", "present"));
      return;
    }
    if (!netScene) {
      differences.push(createDiff("scene", `Scene ${address}`, "present", "missing"));
      return;
    }

    if (dbScene.name !== netScene.name) {
      differences.push(createDiff("scene", `Scene ${address} Name`, dbScene.name, netScene.name));
    }

    const dbItems = dbScene.items || [];
    const netItems = netScene.items || [];

    if (dbItems.length !== netItems.length) {
      differences.push(createDiff("scene", `Scene ${address} Item Count`, dbItems.length, netItems.length));
    }

    // Compare items by composite key: objectValue_objectAddress
    const dbItemMap = new Map();
    const netItemMap = new Map();

    dbItems.forEach((item) => {
      const key = `${item.object_value || 0}_${item.object_address || item.item_address || 0}`;
      dbItemMap.set(key, item);
    });
    netItems.forEach((item) => {
      const key = `${item.objectValue || 0}_${item.itemAddress || item.object_address || 0}`;
      netItemMap.set(key, item);
    });

    const allItemKeys = new Set([...dbItemMap.keys(), ...netItemMap.keys()]);

    allItemKeys.forEach((itemKey) => {
      const dbItem = dbItemMap.get(itemKey);
      const netItem = netItemMap.get(itemKey);
      const [objectValue, objectAddress] = itemKey.split("_");
      const itemLabel = `Scene ${address} Item (Type=${objectValue}, Addr=${objectAddress})`;

      if (!dbItem) {
        differences.push(createDiff("scene", itemLabel, "missing", "present"));
        return;
      }
      if (!netItem) {
        differences.push(createDiff("scene", itemLabel, "present", "missing"));
        return;
      }

      const dbValue = parseFloat(dbItem.item_value || dbItem.object_value || 0);
      const netValue = parseFloat(netItem.itemValue || netItem.item_value || 0);
      if (dbValue !== netValue) {
        differences.push(createDiff("scene", `${itemLabel} Value`, dbItem.item_value, netItem.itemValue));
      }

      const dbDelay = dbItem.delay || 0;
      const netDelay = netItem.delay || 0;
      if (dbDelay !== netDelay) {
        differences.push(createDiff("scene", `${itemLabel} Delay`, dbDelay, netDelay));
      }
    });
  });

  return { isEqual: differences.length === 0, differences };
}
