// Project export functionality V2 - Full Snapshot approach
// This version is simpler and more reliable than V1 (address-based)
import { toast } from "sonner";

export class ProjectExporter {
  /**
   * Export project to JSON using Full Snapshot approach
   * Exports all data AS-IS with IDs intact
   * Import will handle ID remapping
   */
  static async exportProject(project, projectItems) {
    try {
      const exportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        exportedBy: "ProjectExporter",
        project: {
          name: project.name,
          description: project.description,
          // Don't include id - will be generated on import
        },
        items: this.prepareItemsForExport(projectItems),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;

      // Add event listener to show success message
      link.addEventListener("click", () => {
        setTimeout(() => {
          toast.success(`Project "${project.name}" exported successfully`);
        }, 100);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Export project V2 failed:", error);
      toast.error("Failed to export project");
      return false;
    }
  }

  /**
   * Prepare items for export
   * Keep all data AS-IS, just remove unnecessary fields
   */
  static prepareItemsForExport(projectItems) {
    const items = { ...projectItems };

    // List of all categories to export
    const categories = [
      // Main item categories
      "lighting",
      "aircon",
      "unit",
      "curtain",
      "knx",
      "dmx",
      "scene",
      "schedule",
      "multi_scenes",
      "sequences",
      // Relationship tables
      "scene_items",
      "schedule_scenes",
      "multi_scene_scenes",
      "sequence_multi_scenes",
      // Configuration tables
      "room_general_config",
      "room_detail_config",
      // DALI tables
      "dali_devices",
      "dali_groups",
      "dali_group_devices",
      "dali_scenes",
      "dali_scene_devices",
      // Zigbee tables
      "zigbee_devices",
    ];

    // Clean up items - remove fields that shouldn't be exported
    const cleanedItems = {};

    categories.forEach((category) => {
      if (items[category]) {
        cleanedItems[category] = items[category].map((item) => {
          const cleanedItem = { ...item };

          // Remove timestamps - will be regenerated on import
          delete cleanedItem.created_at;
          delete cleanedItem.updated_at;
          delete cleanedItem.discovered_at;

          // Keep IDs - they will be used for mapping during import
          // project_id will be updated during import

          return cleanedItem;
        });
      }
    });

    return cleanedItems;
  }

  /**
   * Get export statistics
   */
  static getExportStats(projectItems) {
    const stats = {};

    const categories = ["lighting", "aircon", "unit", "curtain", "knx", "dmx", "scene", "schedule", "multi_scenes", "sequences"];

    categories.forEach((category) => {
      if (projectItems[category]) {
        stats[category] = projectItems[category].length;
      }
    });

    return stats;
  }
}
