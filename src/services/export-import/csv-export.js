// CSV export functionality
import { toast } from "sonner";
import { CSVParser } from "./csv-parser.js";

export class CSVExporter {
  // Export project items to CSV
  static async exportItemsToCSV(items, category, projectName) {
    try {
      if (!items || items.length === 0) {
        toast.error(`No ${category} items to export`);
        return false;
      }

      let csvContent;
      let filename;

      // Special handling for scene category - export with scene items
      if (category === "scene") {
        csvContent = await this.convertScenesToCSV(items);
        filename = `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_scenes_export.csv`;
      } else if (category === "aircon") {
        // Special handling for aircon category - export as cards
        csvContent = this.convertAirconItemsToCardsCSV(items);
        filename = `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_aircon_cards_export.csv`;
      } else {
        csvContent = this.convertItemsToCSV(items, category);
        filename = `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${category}_export.csv`;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Create download link with event listeners
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Add event listener to show success message after download starts
      link.addEventListener("click", () => {
        // Small delay to ensure download dialog appears first
        setTimeout(() => {
          toast.success(`${category} items export started`);
        }, 100);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Export items failed:", error);
      const errorMessage = error.message || `Failed to export ${category} items`;
      toast.error(errorMessage);
      return false;
    }
  }

  // Convert items to CSV format
  static convertItemsToCSV(items, category) {
    if (!items || items.length === 0) return "";

    // Define headers based on category
    let headers;
    if (category === "unit") {
      headers = ["type", "serial_no", "ip_address", "id_can", "mode", "firmware_version", "description"];
    } else if (category === "curtain") {
      headers = ["name", "address", "description", "object_type", "curtain_type", "open_group", "close_group", "stop_group"];
    } else {
      headers = ["name", "address", "description", "object_type"];
    }

    // Create CSV content
    const csvRows = [];
    csvRows.push(headers.join(","));

    items.forEach((item) => {
      const row = headers.map((header) => {
        const value = item[header] || "";
        return CSVParser.escapeCSVValue(value);
      });
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  // Convert aircon items to cards CSV format
  static convertAirconItemsToCardsCSV(items) {
    if (!items || items.length === 0) return "";

    // Each item is now a card (no need to group)
    const headers = ["name", "address", "description"];
    const csvRows = [];
    csvRows.push(headers.join(","));

    items.forEach((item) => {
      const row = headers.map((header) => {
        const value = item[header] || "";
        return CSVParser.escapeCSVValue(value);
      });
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  // Convert scenes with scene items to CSV format
  static async convertScenesToCSV(scenes) {
    const csvRows = [];
    csvRows.push("SCENE NAME,ITEM NAME,TYPE,ADDRESS,VALUE");

    for (const scene of scenes) {
      try {
        // Get scene items with details
        const sceneItems = await window.electronAPI?.scene?.getItemsWithDetails(scene.id);

        if (sceneItems.length === 0) {
          // If scene has no items, still add the scene name row
          csvRows.push(`"${scene.name || ""}","","","",""`);
          continue;
        }

        // Add scene items
        for (let i = 0; i < sceneItems.length; i++) {
          const item = sceneItems[i];
          const sceneName = i === 0 ? scene.name || "" : ""; // Only show scene name on first item
          const itemName = item.item_name || "";
          const itemType = this.getItemTypeForExport(item.item_type, item.object_type, item.command);
          const address = item.item_address || "";
          const value = this.getItemValueForExport(item.item_type, item.item_value, item.command, item.object_type);

          csvRows.push(`"${sceneName}","${itemName}","${itemType}","${address}","${value}"`);
        }
      } catch (error) {
        console.error(`Failed to get items for scene ${scene.id}:`, error);
        // Add scene name row even if items failed to load
        csvRows.push(`"${scene.name || ""}","","","",""`);
      }
    }

    return csvRows.join("\n");
  }

  // Get item type for export based on item_type and other properties
  static getItemTypeForExport(itemType, objectType, command) {
    if (itemType === "lighting") {
      return "LIGHTING";
    } else if (itemType === "curtain") {
      return "CURTAIN";
    } else if (itemType === "aircon") {
      // Determine aircon type based on object_type first, then command
      if (objectType === "OBJ_AC_POWER" || command === "power") {
        return "AC_POWER";
      } else if (objectType === "OBJ_AC_MODE" || command === "mode") {
        return "AC_MODE";
      } else if (objectType === "OBJ_AC_FAN_SPEED" || command === "fan_speed") {
        return "AC_FAN_SPEED";
      } else if (objectType === "OBJ_AC_TEMPERATURE" || command === "temperature") {
        return "AC_TEMPERATURE";
      } else if (objectType === "OBJ_AC_SWING" || command === "swing") {
        return "AC_SWING";
      } else {
        return "AC_POWER"; // Default to power
      }
    }
    return itemType.toUpperCase();
  }

  // Get item value for export
  static getItemValueForExport(itemType, itemValue, command, objectType) {
    if (!itemValue) return "";

    if (itemType === "lighting") {
      // Convert to percentage if needed
      const value = parseInt(itemValue);
      if (!isNaN(value)) {
        return `${value}%`;
      }
    } else if (itemType === "aircon") {
      if (objectType === "OBJ_AC_POWER" || command === "power") {
        return itemValue === "1" || itemValue === 1 ? "On" : "Off";
      } else if (objectType === "OBJ_AC_MODE" || command === "mode") {
        // Map mode values to readable names
        const modeMap = {
          0: "Cool",
          1: "Heat",
          2: "Ventilation",
          3: "Dry",
          4: "Auto",
        };
        return modeMap[itemValue] || itemValue;
      } else if (objectType === "OBJ_AC_FAN_SPEED" || command === "fan_speed") {
        const fanMap = {
          0: "Low",
          1: "Medium",
          2: "High",
          3: "Auto",
          4: "Off",
        };
        return fanMap[itemValue] || itemValue;
      } else if (objectType === "OBJ_AC_TEMPERATURE" || command === "temperature") {
        return `${itemValue}°C`;
      } else if (objectType === "OBJ_AC_SWING" || command === "swing") {
        const swingMap = {
          0: "B1",
          1: "B2",
          2: "B3",
          3: "B4",
          4: "B5",
          5: "Auto",
        };
        return swingMap[itemValue] || itemValue;
      }
    } else if (itemType === "curtain") {
      if (itemValue === "1" || itemValue === 1) {
        return "Open";
      } else if (itemValue === "0" || itemValue === 0) {
        return "Close";
      }
    }

    return itemValue;
  }
}
