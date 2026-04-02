import log from "electron-log/renderer";

/**
 * Find an existing device item by address, or create a new one.
 *
 * @param {number|string} address
 * @param {"ac"|"lighting"} outputType
 * @param {Object} selectedProject
 * @param {Object} projectItems - Current in-memory project items (from context)
 * @param {Function} createItem - Context createItem function
 * @param {Object} createdItemsCache - Legacy ref-based cache { current: { aircon: Map, lighting: Map } }
 * @param {TransferItemCache|null} itemCache - Optional pre-fetched cache (fixes N+1 when provided)
 */
export async function findOrCreateDeviceByAddress(
  address,
  outputType,
  selectedProject,
  projectItems,
  createItem,
  createdItemsCache,
  itemCache = null
) {
  if (!selectedProject?.id || !address) {
    return null;
  }

  const addressStr = String(address);

  // When a TransferItemCache is provided, delegate entirely to it
  if (itemCache) {
    return _findOrCreateWithCache(addressStr, outputType, selectedProject.id, createItem, itemCache);
  }

  // --- Legacy path (ref-based cache + projectItems + DB fallback) ---
  if (outputType === "ac") {
    if (createdItemsCache.current.aircon.has(addressStr)) {
      return createdItemsCache.current.aircon.get(addressStr).id;
    }

    const existingAircon = projectItems.aircon?.find((item) => item.address === addressStr);
    if (existingAircon) return existingAircon.id;

    try {
      const allAirconItems = await window.electronAPI.aircon.getAll(selectedProject.id);
      const existingInDB = allAirconItems.find((item) => item.address === addressStr);
      if (existingInDB) {
        log.info(`Found existing aircon in database with address ${addressStr}`);
        return existingInDB.id;
      }
    } catch (dbError) {
      log.warn("Failed to check database for existing aircon items:", dbError);
    }

    const newAirconItem = {
      name: `Aircon ${addressStr}`,
      address: addressStr,
      description: "Auto-created from network unit",
      label: "Aircon",
    };

    const createdItem = await createItem("aircon", newAirconItem);
    createdItemsCache.current.aircon.set(addressStr, createdItem);
    log.info(`Created new aircon item with address ${addressStr}`);
    return createdItem.id;
  } else {
    if (createdItemsCache.current.lighting.has(addressStr)) {
      return createdItemsCache.current.lighting.get(addressStr).id;
    }

    const existingLighting = projectItems.lighting?.find((item) => item.address === addressStr);
    if (existingLighting) return existingLighting.id;

    try {
      const allLightingItems = await window.electronAPI.lighting.getAll(selectedProject.id);
      const existingInDB = allLightingItems.find((item) => item.address === addressStr);
      if (existingInDB) {
        log.info(`Found existing lighting in database with address ${addressStr}`);
        return existingInDB.id;
      }
    } catch (dbError) {
      log.warn("Failed to check database for existing lighting items:", dbError);
    }

    const newLightingItem = {
      name: `Lighting ${addressStr}`,
      address: addressStr,
      description: "Auto-created from network unit",
      object_type: "OBJ_LIGHTING",
      object_value: 1,
    };

    const createdItem = await createItem("lighting", newLightingItem);
    createdItemsCache.current.lighting.set(addressStr, createdItem);
    log.info(`Created new lighting item with address ${addressStr}`);
    return createdItem.id;
  }
}

// ---------------------------------------------------------------------------

async function _findOrCreateWithCache(addressStr, outputType, projectId, createItem, itemCache) {
  if (outputType === "ac") {
    const cached = itemCache.findAircon(addressStr);
    if (cached) return cached.id;

    const newItem = await createItem("aircon", {
      name: `Aircon ${addressStr}`,
      address: addressStr,
      description: "Auto-created from network unit",
      label: "Aircon",
    });
    itemCache.cacheAircon(newItem);
    log.info(`Created new aircon item with address ${addressStr}`);
    return newItem.id;
  } else {
    const cached = itemCache.findLighting(addressStr);
    if (cached) return cached.id;

    const newItem = await createItem("lighting", {
      name: `Lighting ${addressStr}`,
      address: addressStr,
      description: "Auto-created from network unit",
      object_type: "OBJ_LIGHTING",
      object_value: 1,
    });
    itemCache.cacheLighting(newItem);
    log.info(`Created new lighting item with address ${addressStr}`);
    return newItem.id;
  }
}

// ---------------------------------------------------------------------------

/**
 * Auto-create missing lighting/aircon/curtain items derived from I/O configs.
 * Uses itemCache when provided to avoid duplicate DB queries.
 */
export async function autoCreateMissingItems(ioConfigs, selectedProject, projectItems, itemCache = null) {
  if (!selectedProject?.id) return 0;

  const existingLighting = itemCache ? null : (projectItems.lighting || []);
  const existingAircon = itemCache ? null : (projectItems.aircon || []);
  const existingCurtain = itemCache ? null : (projectItems.curtain || []);
  const lightingAddressesToCreate = new Set();

  // Collect lighting addresses from input multi-group configurations
  if (ioConfigs.input_configs) {
    for (const input of ioConfigs.input_configs.inputs) {
      if (input.multi_group_config && Array.isArray(input.multi_group_config)) {
        for (const group of input.multi_group_config) {
          if (group.groupId && group.groupId > 0) {
            const address = group.groupId.toString();
            const exists = itemCache
              ? !!itemCache.findLighting(address)
              : existingLighting.some((item) => item.address === address);
            if (!exists) lightingAddressesToCreate.add(address);
          }
        }
      }
    }
  }

  // Process output configurations
  if (ioConfigs.output_configs) {
    for (const output of ioConfigs.output_configs.outputs) {
      if (!output.address) continue;
      const address = output.address.toString();

      try {
        if (output.type === "lighting") {
          const exists = itemCache
            ? !!itemCache.findLighting(address)
            : existingLighting.some((item) => item.address === address);
          if (!exists) lightingAddressesToCreate.add(address);
        } else if (output.type === "ac") {
          const exists = itemCache
            ? !!itemCache.findAircon(address)
            : existingAircon.some((item) => item.address === address);
          if (!exists) {
            log.info(`Auto-creating aircon item for address ${address}`);
            const newItem = await window.electronAPI.aircon.create(selectedProject.id, {
              name: `Aircon ${address}`,
              address,
              description: `Auto-created from network unit output ${output.index + 1}`,
              label: "Aircon",
            });
            if (itemCache) itemCache.cacheAircon(newItem);
          }
        } else if (output.type === "curtain") {
          const exists = itemCache
            ? !!itemCache.findCurtain(address)
            : existingCurtain.some((item) => item.address === address);
          if (!exists) {
            log.info(`Auto-creating curtain item for address ${address}`);
            const newItem = await window.electronAPI.curtain.create(selectedProject.id, {
              name: `Curtain ${address}`,
              address,
              description: `Auto-created from network unit output ${output.index + 1}`,
              object_type: "OBJ_CURTAIN",
              object_value: 2,
              curtain_type: "CURTAIN_PULSE_2P",
              curtain_value: 3,
              open_group_id: null,
              close_group_id: null,
              stop_group_id: null,
              pause_period: 0,
              transition_period: 0,
            });
            if (itemCache) itemCache.cacheCurtain(newItem);
          }
        }
      } catch (error) {
        log.error(`Failed to auto-create ${output.type} item for address ${address}:`, error);
      }
    }
  }

  // Batch-create all collected lighting addresses
  for (const address of lightingAddressesToCreate) {
    try {
      log.info(`Auto-creating lighting item for address ${address}`);
      const newItem = await window.electronAPI.lighting.create(selectedProject.id, {
        name: `Group ${address}`,
        address,
        description: "Auto-created from network unit configuration",
        object_type: "OBJ_LIGHTING",
        object_value: 1,
      });
      if (itemCache) itemCache.cacheLighting(newItem);
    } catch (error) {
      log.error(`Failed to auto-create lighting item for address ${address}:`, error);
    }
  }

  return lightingAddressesToCreate.size;
}
