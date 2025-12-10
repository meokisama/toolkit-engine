/**
 * Helper functions for reading and processing network unit configurations
 */

/**
 * Find or create database item by network item
 * Maps network object types to database item types and creates items if needed
 */
export const findOrCreateDatabaseItemByNetworkItem = async (
  networkItem,
  projectId
) => {
  try {
    const objectValue = networkItem.objectValue;
    const itemAddress = networkItem.itemAddress;

    // Map object_value to item type
    let itemType;
    switch (objectValue) {
      case 1: // LIGHTING
        itemType = "lighting";
        break;
      case 2: // CURTAIN
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
        return { itemType: null, itemId: null };
    }

    // Find item in database by address
    const items = await window.electronAPI[itemType].getAll(projectId);

    let foundItem = items.find(
      (item) => item.address === itemAddress.toString()
    );

    if (foundItem) {
      return { itemType, itemId: foundItem.id };
    } else {
      const newItemData = {
        name: `${
          itemType.charAt(0).toUpperCase() + itemType.slice(1)
        } ${itemAddress}`,
        address: itemAddress.toString(),
        description: `Auto-created from scene transfer`,
      };

      // Add specific fields for each item type
      if (itemType === "lighting") {
        newItemData.object_type = "OBJ_LIGHTING";
        newItemData.object_value = 1;
      } else if (itemType === "aircon") {
        // For aircon, we create one item that can handle all aircon properties
        newItemData.label = "Aircon";
      } else if (itemType === "curtain") {
        newItemData.object_type = "OBJ_CURTAIN";
        newItemData.object_value = 2;
        newItemData.curtain_type = "";
        newItemData.curtain_value = 0;
        newItemData.pause_period = 0;
        newItemData.transition_period = 0;
        // Note: open_group_id, close_group_id, stop_group_id will be null
      }

      const createdItem = await window.electronAPI[itemType].create(
        projectId,
        newItemData
      );

      return { itemType, itemId: createdItem.id };
    }
  } catch (error) {
    console.error("Error finding or creating database item:", error);
    return { itemType: null, itemId: null };
  }
};

/**
 * Find or create lighting item by address
 * Used for curtain group associations and KNX RCU groups
 */
export const findOrCreateLightingByAddress = async (address, projectId) => {
  try {
    if (!address || address === 0) {
      return null;
    }

    const lightingItems = await window.electronAPI.lighting.getAll(projectId);
    let foundItem = lightingItems.find(
      (item) => item.address === address.toString()
    );

    if (foundItem) {
      return foundItem;
    } else {
      const newLightingData = {
        name: `Lighting ${address}`,
        address: address.toString(),
        description: `Auto-created from configuration transfer`,
        object_type: "OBJ_LIGHTING",
        object_value: 1,
      };

      const createdItem = await window.electronAPI.lighting.create(
        projectId,
        newLightingData
      );
      return createdItem;
    }
  } catch (error) {
    console.error(
      `Error finding or creating lighting with address ${address}:`,
      error
    );
    return null;
  }
};

/**
 * Get curtain type name from numeric value
 * Based on constants.js curtain type definitions
 */
export const getCurtainTypeName = (curtainType) => {
  let typeName;
  switch (curtainType) {
    case 1:
      typeName = "CURTAIN_PULSE_1G_2P";
      break;
    case 2:
      typeName = "CURTAIN_PULSE_1G_3P";
      break;
    case 3:
      typeName = "CURTAIN_PULSE_2P";
      break;
    case 4:
      typeName = "CURTAIN_PULSE_3P";
      break;
    case 5:
      typeName = "CURTAIN_HOLD_1G";
      break;
    case 6:
      typeName = "CURTAIN_HOLD";
      break;
    default:
      typeName = "";
      break;
  }

  return typeName;
};

/**
 * Get object type string from numeric object value
 * Used for scene items and other configuration mappings
 */
export const getObjectTypeFromValue = (objectValue) => {
  switch (objectValue) {
    case 1:
      return "OBJ_LIGHTING";
    case 2:
      return "OBJ_CURTAIN";
    case 3:
      return "OBJ_AC_POWER";
    case 4:
      return "OBJ_AC_MODE";
    case 5:
      return "OBJ_AC_FAN_SPEED";
    case 6:
      return "OBJ_AC_TEMPERATURE";
    case 7:
      return "OBJ_AC_SWING";
    default:
      return null;
  }
};
