import log from "electron-log/renderer";

// Helper function to find existing device by address or create new one
export async function findOrCreateDeviceByAddress(address, outputType, selectedProject, projectItems, createItem, createdItemsCache) {
  if (!selectedProject?.id || !address) {
    return null;
  }

  try {
    const addressStr = address.toString();

    if (outputType === "ac") {
      // Check cache first
      if (createdItemsCache.current.aircon.has(addressStr)) {
        return createdItemsCache.current.aircon.get(addressStr).id;
      }

      // Check existing aircon items in project state
      const existingAircon = projectItems.aircon?.find((item) => item.address === addressStr);
      if (existingAircon) {
        return existingAircon.id;
      }

      // Check database for existing aircon items with this address
      try {
        const allAirconItems = await window.electronAPI.aircon.getAll(selectedProject.id);
        const existingInDB = allAirconItems.find((item) => item.address === addressStr);
        if (existingInDB) {
          log.info(`Found existing aircon in database with address ${addressStr}:`, existingInDB);
          return existingInDB.id;
        }
      } catch (dbError) {
        log.warn("Failed to check database for existing aircon items:", dbError);
      }

      // Create new aircon item
      const newAirconItem = {
        name: `Aircon ${addressStr}`,
        address: addressStr,
        description: `Auto-created from network unit`,
        label: "Aircon",
      };

      const createdItem = await createItem("aircon", newAirconItem);

      // Cache the created item
      createdItemsCache.current.aircon.set(addressStr, createdItem);

      log.info(`Created new aircon item with address ${addressStr}:`, createdItem);
      return createdItem.id;
    } else {
      // Check cache first
      if (createdItemsCache.current.lighting.has(addressStr)) {
        return createdItemsCache.current.lighting.get(addressStr).id;
      }

      // Check existing lighting items in project state
      const existingLighting = projectItems.lighting?.find((item) => item.address === addressStr);
      if (existingLighting) {
        return existingLighting.id;
      }

      // Check database for existing lighting items with this address
      try {
        const allLightingItems = await window.electronAPI.lighting.getAll(selectedProject.id);
        const existingInDB = allLightingItems.find((item) => item.address === addressStr);
        if (existingInDB) {
          log.info(`Found existing lighting in database with address ${addressStr}:`, existingInDB);
          return existingInDB.id;
        }
      } catch (dbError) {
        log.warn("Failed to check database for existing lighting items:", dbError);
      }

      // Create new lighting item
      const newLightingItem = {
        name: `Lighting ${addressStr}`,
        address: addressStr,
        description: `Auto-created from network unit`,
        object_type: "OBJ_LIGHTING",
        object_value: 1,
      };

      const createdItem = await createItem("lighting", newLightingItem);

      // Cache the created item
      createdItemsCache.current.lighting.set(addressStr, createdItem);

      log.info(`Created new lighting item with address ${addressStr}:`, createdItem);
      return createdItem.id;
    }
  } catch (error) {
    log.error(`Failed to find or create device for address ${address}:`, error);
    return null;
  }
}

// Helper function to auto-create missing lighting, aircon, curtain items
export async function autoCreateMissingItems(ioConfigs, selectedProject, projectItems) {
  if (!selectedProject?.id) {
    return;
  }

  const existingLighting = projectItems.lighting || [];
  const existingAircon = projectItems.aircon || [];
  const existingCurtain = projectItems.curtain || [];
  const lightingAddressesToCreate = new Set();

  // First, collect lighting addresses from input multi-group configurations
  if (ioConfigs.input_configs) {
    for (const input of ioConfigs.input_configs.inputs) {
      if (input.multi_group_config && Array.isArray(input.multi_group_config)) {
        for (const group of input.multi_group_config) {
          if (group.groupId && group.groupId > 0) {
            const address = group.groupId.toString();

            // Check if lighting item with this address already exists
            const exists = existingLighting.some((item) => item.address === address);
            if (!exists) {
              lightingAddressesToCreate.add(address);
            }
          }
        }
      }
    }
  }

  // Process output configurations to find missing items
  if (ioConfigs.output_configs) {
    for (const output of ioConfigs.output_configs.outputs) {
      if (!output.address) continue;

      const address = output.address.toString();

      try {
        if (output.type === "lighting") {
          // Check if lighting item exists
          const exists = existingLighting.some((item) => item.address === address);
          if (!exists) {
            lightingAddressesToCreate.add(address);
          }
        } else if (output.type === "ac") {
          // Check if aircon item exists
          const exists = existingAircon.some((item) => item.address === address);
          if (!exists) {
            log.info(`Auto-creating aircon item for address ${address}`);
            const newAirconItem = {
              name: `Aircon ${address}`,
              address: address,
              description: `Auto-created from network unit output ${output.index + 1}`,
              label: "Aircon",
            };

            await window.electronAPI.aircon.create(selectedProject.id, newAirconItem);
            // Toast notification will be handled by the caller
          }
        } else if (output.type === "curtain") {
          // Check if curtain item exists
          const exists = existingCurtain.some((item) => item.address === address);
          if (!exists) {
            log.info(`Auto-creating curtain item for address ${address}`);
            const newCurtainItem = {
              name: `Curtain ${address}`,
              address: address,
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
            };

            await window.electronAPI.curtain.create(selectedProject.id, newCurtainItem);
            // Toast notification will be handled by the caller
          }
        }
      } catch (error) {
        log.error(`Failed to auto-create ${output.type} item for address ${address}:`, error);
        // Continue with other items even if one fails
      }
    }
  }

  // Create all collected lighting items
  for (const address of lightingAddressesToCreate) {
    try {
      log.info(`Auto-creating lighting item for address ${address}`);
      const newLightingItem = {
        name: `Group ${address}`,
        address: address,
        description: `Auto-created from network unit configuration`,
        object_type: "OBJ_LIGHTING",
        object_value: 1,
      };

      await window.electronAPI.lighting.create(selectedProject.id, newLightingItem);
      // Toast notification will be handled by the caller

      // Add small delay between creations to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      log.error(`Failed to auto-create lighting item for address ${address}:`, error);
      // Continue with other items even if one fails
    }
  }

  if (lightingAddressesToCreate.size > 0) {
    log.info(`Auto-created ${lightingAddressesToCreate.size} lighting items from network unit configurations`);
  }

  return lightingAddressesToCreate.size;
}
