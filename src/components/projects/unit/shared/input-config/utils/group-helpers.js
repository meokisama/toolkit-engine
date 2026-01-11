import { INPUT_TYPES } from "@/constants";

/**
 * Helper function to determine group type based on input function using INPUT_TYPES
 */
export const getGroupTypeFromFunction = (functionValue) => {
  if (!functionValue) return "lighting";

  // Search through INPUT_TYPES to find which category the function belongs to
  for (const [categoryKey, functions] of Object.entries(INPUT_TYPES)) {
    const hasFunction = functions.some((func) => func.value === functionValue);
    if (hasFunction) {
      // Map category keys to project item types
      switch (categoryKey) {
        case "AIR_CONDITIONER":
          return "aircon";
        case "SCENE":
          return "scene";
        case "MULTI_SCENES":
          return "multi-scene";
        case "SEQUENCE":
          return "sequence";
        case "CURTAIN":
          return "curtain";
        case "ROOM":
          return "room";
        case "LIGHTING":
        default:
          return "lighting";
      }
    }
  }

  // Default to lighting if not found in any category
  return "lighting";
};

/**
 * Get group type label for UI display
 */
export const getGroupTypeLabel = (functionValue) => {
  const groupType = getGroupTypeFromFunction(functionValue);

  switch (groupType) {
    case "aircon":
      return "Aircon";
    case "scene":
      return "Scene";
    case "multi-scene":
      return "Multi-Scene";
    case "sequence":
      return "Sequence";
    case "curtain":
      return "Curtain";
    case "room":
      return "Room";
    case "lighting":
    default:
      return "Lighting";
  }
};

/**
 * Auto-create missing groups in database based on input type
 */
export const createGroupByType = async (address, functionValue, selectedProject, createItem) => {
  if (!selectedProject) return null;

  try {
    const groupType = getGroupTypeFromFunction(functionValue);
    let newItemData;
    let category;

    switch (groupType) {
      case "aircon":
        category = "aircon";
        newItemData = {
          name: `AC Group ${address}`,
          address: address.toString(),
          description: "Auto-created from input configuration",
          label: "Aircon",
        };
        break;
      case "scene":
        category = "scene";
        newItemData = {
          name: `Scene ${address}`,
          address: address.toString(),
          description: "Auto-created from input configuration",
          type: 0, // Default scene type
        };
        break;
      case "curtain":
        category = "curtain";
        newItemData = {
          name: `Curtain ${address}`,
          address: address.toString(),
          description: "Auto-created from input configuration",
          object_type: "OBJ_CURTAIN",
          object_value: 2,
          curtain_type: "CURTAIN_PULSE_2P",
          curtain_value: 3,
        };
        break;
      case "room":
        // Room auto-creation not supported - rooms are fixed (1-5)
        console.warn(`Auto-creation not supported for room groups (rooms are fixed 1-5)`);
        return null;
      case "multi-scene":
        // Multi-scene auto-creation not supported due to complex structure
        console.warn(`Auto-creation not supported for multi-scene groups`);
        return null;
      case "sequence":
        // Sequence auto-creation not supported due to complex structure
        console.warn(`Auto-creation not supported for sequence groups`);
        return null;
      case "lighting":
      default:
        category = "lighting";
        newItemData = {
          name: `Group ${address}`,
          address: address.toString(),
          description: "Auto-created from input configuration",
          object_type: "OBJ_LIGHTING",
          object_value: 1,
        };
        break;
    }

    const newItem = await createItem(category, newItemData);
    console.log(`Auto-created ${groupType} group:`, newItem);
    return newItem;
  } catch (error) {
    console.error(`Failed to auto-create group ${address}:`, error);
    return null;
  }
};

/**
 * Load required data based on input function type
 */
export const getTabToLoadForFunction = (functionValue) => {
  const groupType = getGroupTypeFromFunction(functionValue);

  switch (groupType) {
    case "aircon":
      return "aircon";
    case "scene":
      return "scene";
    case "multi-scene":
      return "multi_scenes";
    case "sequence":
      return "sequences";
    case "curtain":
      return "curtain";
    case "room":
      return null; // Rooms don't need to load from database (fixed list)
    case "lighting":
    default:
      return "lighting";
  }
};

/**
 * Get available items from projectItems based on function type
 */
export const getAvailableItemsForFunction = (functionValue, projectItems) => {
  const groupType = getGroupTypeFromFunction(functionValue);

  switch (groupType) {
    case "aircon":
      return projectItems?.aircon || [];
    case "scene":
      return projectItems?.scene || [];
    case "multi-scene":
      return projectItems?.multi_scenes || [];
    case "sequence":
      return projectItems?.sequences || [];
    case "curtain":
      return projectItems?.curtain || [];
    case "room":
      // Return fixed list of 5 rooms for Room Controls (Door Switch, Motion Sensor)
      return [
        { id: "room-1", name: "Room 1", address: "1" },
        { id: "room-2", name: "Room 2", address: "2" },
        { id: "room-3", name: "Room 3", address: "3" },
        { id: "room-4", name: "Room 4", address: "4" },
        { id: "room-5", name: "Room 5", address: "5" },
      ];
    case "lighting":
    default:
      return projectItems?.lighting || [];
  }
};
