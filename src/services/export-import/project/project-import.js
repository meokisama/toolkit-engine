// Project import functionality - ID Mapping approach
import { toast } from "sonner";

export class ProjectImporter {
  /**
   * Import project from JSON file
   */
  static async importProjectFromFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // Validate format
          if (!this.validateProjectImportData(data)) {
            toast.error("Invalid project file format");
            reject(new Error("Invalid file format"));
            return;
          }

          resolve(data);
        } catch (error) {
          console.error("Import project failed:", error);
          toast.error("Failed to read project file");
          reject(error);
        }
      };

      input.click();
    });
  }

  /**
   * Validate import data structure
   */
  static validateProjectImportData(data) {
    if (!data || typeof data !== "object") return false;
    if (!data.version || data.version !== "2.0") return false;
    if (!data.project || typeof data.project !== "object") return false;
    if (!data.project.name || typeof data.project.name !== "string") return false;
    if (!data.items || typeof data.items !== "object") return false;

    // Check if items has valid categories
    const validCategories = ["lighting", "aircon", "unit", "curtain", "knx", "dmx", "scene", "schedule", "multi_scenes", "sequences"];

    for (const category of validCategories) {
      if (data.items[category] && !Array.isArray(data.items[category])) {
        return false;
      }
    }

    // Check if relationship tables are valid arrays (optional)
    const relationshipTables = ["scene_items", "schedule_scenes", "multi_scene_scenes", "sequence_multi_scenes"];

    for (const table of relationshipTables) {
      if (data.items[table] && !Array.isArray(data.items[table])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get import statistics
   */
  static getImportStats(data) {
    const stats = {
      version: data.version || "unknown",
      exportedAt: data.exportedAt,
      projectName: data.project.name,
      categories: {},
    };

    const categories = ["lighting", "aircon", "unit", "curtain", "knx", "dmx", "scene", "schedule", "multi_scenes", "sequences"];

    categories.forEach((category) => {
      if (data.items[category]) {
        stats.categories[category] = data.items[category].length;
      }
    });

    return stats;
  }
}
