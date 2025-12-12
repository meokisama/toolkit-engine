// Validation functions for export/import operations

export class Validators {
  // Validate project import data
  static validateProjectImportData(data) {
    if (!data || typeof data !== "object") return false;
    if (!data.project || typeof data.project !== "object") return false;
    if (!data.project.name || typeof data.project.name !== "string") return false;
    if (!data.items || typeof data.items !== "object") return false;

    // Check if items has valid categories
    const validCategories = ["lighting", "aircon", "unit", "curtain", "knx", "scene", "schedule", "multi_scenes", "sequences"];
    for (const category of validCategories) {
      if (data.items[category] && !Array.isArray(data.items[category])) {
        return false;
      }
    }

    // Check if relationship tables are valid arrays (optional)
    const relationshipTables = ["scene_items", "scene_address_items", "schedule_scenes", "multi_scene_scenes", "sequence_multi_scenes"];
    for (const table of relationshipTables) {
      if (data.items[table] && !Array.isArray(data.items[table])) {
        return false;
      }
    }

    return true;
  }

  // Validate CSV headers based on category
  static validateCSVHeaders(headers, category) {
    let expectedHeaders;

    if (category === "unit") {
      expectedHeaders = ["type", "serial_no", "ip_address", "id_can", "mode", "firmware_version", "description"];
    } else if (category === "curtain") {
      expectedHeaders = ["name", "address", "description", "object_type", "curtain_type", "open_group", "close_group", "stop_group"];
    } else if (category === "aircon") {
      expectedHeaders = ["name", "address", "description"];
    } else if (category === "scene") {
      const sceneHeaders = ["SCENE NAME", "ITEM NAME", "TYPE", "ADDRESS", "VALUE"];
      return sceneHeaders.every((header) => headers.some((h) => h.toUpperCase() === header));
    } else {
      expectedHeaders = ["name", "address", "description", "object_type"];
    }

    return expectedHeaders.every((header) => headers.includes(header));
  }

  // Validate item based on category
  static validateItem(item, category) {
    if (category === "unit") {
      return item.type && item.type.trim();
    } else if (category === "aircon") {
      if (!item.address || !item.address.trim()) return false;
      // Validate address is positive integer
      const addressNum = parseInt(item.address.trim());
      return !isNaN(addressNum) && addressNum > 0;
    } else {
      return item.address && item.address.trim();
    }
  }
}
