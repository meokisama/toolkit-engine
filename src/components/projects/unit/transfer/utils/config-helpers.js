import log from "electron-log/renderer";

/**
 * Find or create a database item matching a network scene item.
 *
 * @param {Object} networkItem - Scene item from network unit
 * @param {string} projectId
 * @param {TransferItemCache|null} itemCache - Optional pre-fetched cache (fixes N+1)
 */
export const findOrCreateDatabaseItemByNetworkItem = async (networkItem, projectId, itemCache = null) => {
  try {
    const objectValue = networkItem.objectValue;
    const itemAddress = networkItem.itemAddress;

    // Map object_value to item type
    let itemType;
    switch (objectValue) {
      case 1:
        itemType = "lighting";
        break;
      case 2:
        itemType = "curtain";
        break;
      case 3: // AC_POWER
      case 4: // AC_MODE
      case 5: // AC_FAN_SPEED
      case 6: // AC_TEMPERATURE
      case 7: // AC_SWING
        itemType = "aircon";
        break;
      default:
        if (objectValue >= 25 && objectValue <= 40) {
          return { itemType: "spi", itemId: null, itemAddress };
        }
        return { itemType: null, itemId: null };
    }

    // --- Cache-first lookup (avoids N+1 DB calls) ---
    if (itemCache) {
      const finder = itemType === "lighting" ? "findLighting" : itemType === "aircon" ? "findAircon" : "findCurtain";
      const cacher = itemType === "lighting" ? "cacheLighting" : itemType === "aircon" ? "cacheAircon" : "cacheCurtain";

      const cached = itemCache[finder](itemAddress);
      if (cached) {
        return { itemType, itemId: cached.id };
      }

      // Not in cache → create
      const newItem = await _buildAndCreate(itemType, itemAddress, projectId);
      if (newItem) {
        itemCache[cacher](newItem);
        return { itemType, itemId: newItem.id };
      }
      return { itemType: null, itemId: null };
    }

    // --- Legacy path (no cache): single getAll() call ---
    const items = await window.electronAPI[itemType].getAll(projectId);
    const foundItem = items.find((item) => item.address === itemAddress.toString());

    if (foundItem) {
      return { itemType, itemId: foundItem.id };
    }

    const newItem = await _buildAndCreate(itemType, itemAddress, projectId);
    return newItem ? { itemType, itemId: newItem.id } : { itemType: null, itemId: null };
  } catch (error) {
    log.error("Error finding or creating database item:", error);
    return { itemType: null, itemId: null };
  }
};

/**
 * Find or create a lighting item by address.
 * Used for curtain group associations and KNX RCU groups.
 *
 * @param {number|string} address
 * @param {string} projectId
 * @param {TransferItemCache|null} itemCache - Optional pre-fetched cache (fixes N+1)
 */
export const findOrCreateLightingByAddress = async (address, projectId, itemCache = null) => {
  try {
    if (!address || address === 0) {
      return null;
    }

    // --- Cache-first lookup ---
    if (itemCache) {
      const cached = itemCache.findLighting(address);
      if (cached) return cached;

      const newItem = await _createLighting(address, projectId, "Auto-created from configuration transfer");
      if (newItem) {
        itemCache.cacheLighting(newItem);
      }
      return newItem;
    }

    // --- Legacy path ---
    const lightingItems = await window.electronAPI.lighting.getAll(projectId);
    const foundItem = lightingItems.find((item) => item.address === address.toString());
    if (foundItem) return foundItem;

    return await _createLighting(address, projectId, "Auto-created from configuration transfer");
  } catch (error) {
    log.error(`Error finding or creating lighting with address ${address}:`, error);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function _buildAndCreate(itemType, itemAddress, projectId) {
  const newItemData = {
    name: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${itemAddress}`,
    address: itemAddress.toString(),
    description: "Auto-created from scene transfer",
  };

  if (itemType === "lighting") {
    newItemData.object_type = "OBJ_LIGHTING";
    newItemData.object_value = 1;
  } else if (itemType === "aircon") {
    newItemData.label = "Aircon";
  } else if (itemType === "curtain") {
    newItemData.object_type = "OBJ_CURTAIN";
    newItemData.object_value = 2;
    newItemData.curtain_type = "";
    newItemData.curtain_value = 0;
    newItemData.pause_period = 0;
    newItemData.transition_period = 0;
  }

  return await window.electronAPI[itemType].create(projectId, newItemData);
}

async function _createLighting(address, projectId, description) {
  const data = {
    name: `Lighting ${address}`,
    address: address.toString(),
    description,
    object_type: "OBJ_LIGHTING",
    object_value: 1,
  };
  return await window.electronAPI.lighting.create(projectId, data);
}

// ---------------------------------------------------------------------------
// Pure helpers (no side effects)
// ---------------------------------------------------------------------------

export const getCurtainTypeName = (curtainType) => {
  switch (curtainType) {
    case 1: return "CURTAIN_PULSE_1G_2P";
    case 2: return "CURTAIN_PULSE_1G_3P";
    case 3: return "CURTAIN_PULSE_2P";
    case 4: return "CURTAIN_PULSE_3P";
    case 5: return "CURTAIN_HOLD_1G";
    case 6: return "CURTAIN_HOLD";
    default: return "";
  }
};

export const getObjectTypeFromValue = (objectValue) => {
  switch (objectValue) {
    case 1: return "OBJ_LIGHTING";
    case 2: return "OBJ_CURTAIN";
    case 3: return "OBJ_AC_POWER";
    case 4: return "OBJ_AC_MODE";
    case 5: return "OBJ_AC_FAN_SPEED";
    case 6: return "OBJ_AC_TEMPERATURE";
    case 7: return "OBJ_AC_SWING";
    default:
      if (objectValue >= 25 && objectValue <= 40) {
        return `OBJ_LED_SPI_EFFECT${objectValue - 24}`;
      }
      return null;
  }
};
