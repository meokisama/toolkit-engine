// Project export functionality
import { toast } from "sonner";

export class ProjectExporter {
  // Export project to JSON
  static async exportProject(project, projectItems) {
    try {
      // Transform items to use address instead of ID for all references
      const transformedItems = this.transformItemsForExport(projectItems);

      const exportData = {
        project: {
          name: project.name,
          description: project.description,
        },
        items: transformedItems,
        exportedAt: new Date().toISOString(),
        version: "1.1", // Increment version to indicate new format
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create download link with event listeners
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_export.json`;

      // Add event listener to show success message after download starts
      link.addEventListener("click", () => {
        // Small delay to ensure download dialog appears first
        setTimeout(() => {
          toast.success(`Project "${project.name}" export started`);
        }, 100);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Export project failed:", error);
      toast.error("Failed to export project");
      return false;
    }
  }

  // Transform items to use address instead of ID for all references
  static transformItemsForExport(projectItems) {
    let transformedItems = { ...projectItems };

    // Transform KNX items
    if (transformedItems.knx && transformedItems.knx.length > 0) {
      transformedItems.knx = transformedItems.knx.map((knxItem) => {
        const transformedKnx = { ...knxItem };

        // If KNX item has RCU group reference, replace ID with address
        if (knxItem.rcu_group_id && knxItem.rcu_group_type) {
          const rcuGroupAddress = this.findRcuGroupAddress(knxItem.rcu_group_id, knxItem.rcu_group_type, projectItems);

          if (rcuGroupAddress) {
            // Replace rcu_group_id with rcu_group_address
            delete transformedKnx.rcu_group_id;
            transformedKnx.rcu_group_address = rcuGroupAddress;
          }
        }

        return transformedKnx;
      });
    }

    // Transform Curtain items
    if (transformedItems.curtain && transformedItems.curtain.length > 0) {
      transformedItems.curtain = transformedItems.curtain.map((curtainItem) => {
        const transformedCurtain = { ...curtainItem };

        // Replace lighting group IDs with addresses
        if (curtainItem.open_group_id) {
          const openGroupAddress = this.findLightingAddress(curtainItem.open_group_id, projectItems);
          if (openGroupAddress) {
            delete transformedCurtain.open_group_id;
            transformedCurtain.open_group_address = openGroupAddress;
          }
        }

        if (curtainItem.close_group_id) {
          const closeGroupAddress = this.findLightingAddress(curtainItem.close_group_id, projectItems);
          if (closeGroupAddress) {
            delete transformedCurtain.close_group_id;
            transformedCurtain.close_group_address = closeGroupAddress;
          }
        }

        if (curtainItem.stop_group_id) {
          const stopGroupAddress = this.findLightingAddress(curtainItem.stop_group_id, projectItems);
          if (stopGroupAddress) {
            delete transformedCurtain.stop_group_id;
            transformedCurtain.stop_group_address = stopGroupAddress;
          }
        } else {
          // Ensure stop_group_id is removed even if null
          delete transformedCurtain.stop_group_id;
        }

        return transformedCurtain;
      });
    }

    // Transform relationship tables
    transformedItems = this.transformRelationshipTables(transformedItems);

    return transformedItems;
  }

  // Transform relationship tables to use addresses instead of IDs
  static transformRelationshipTables(projectItems) {
    const transformedItems = { ...projectItems };

    // Transform scene_items
    if (transformedItems.scene_items && transformedItems.scene_items.length > 0) {
      transformedItems.scene_items = transformedItems.scene_items.map((sceneItem) => {
        const transformedSceneItem = { ...sceneItem };

        // Replace scene_id with scene_address
        if (sceneItem.scene_id) {
          const sceneAddress = this.findSceneAddress(sceneItem.scene_id, projectItems);
          if (sceneAddress) {
            delete transformedSceneItem.scene_id;
            transformedSceneItem.scene_address = sceneAddress;
          }
        }

        // item_address should already be available, but ensure item_id is removed
        if (sceneItem.item_id && sceneItem.item_address) {
          delete transformedSceneItem.item_id;
        }

        return transformedSceneItem;
      });
    }

    // Transform schedule_scenes
    if (transformedItems.schedule_scenes && transformedItems.schedule_scenes.length > 0) {
      transformedItems.schedule_scenes = transformedItems.schedule_scenes.map((scheduleScene) => {
        const transformedScheduleScene = { ...scheduleScene };

        // Replace schedule_id with schedule identifier (name + time combination)
        if (scheduleScene.schedule_id) {
          const scheduleIdentifier = this.findScheduleIdentifier(scheduleScene.schedule_id, projectItems);
          if (scheduleIdentifier) {
            delete transformedScheduleScene.schedule_id;
            transformedScheduleScene.schedule_identifier = scheduleIdentifier;
          }
        }

        // Replace scene_id with scene_address
        if (scheduleScene.scene_id) {
          const sceneAddress = this.findSceneAddress(scheduleScene.scene_id, projectItems);
          if (sceneAddress) {
            delete transformedScheduleScene.scene_id;
            transformedScheduleScene.scene_address = sceneAddress;
          }
        }

        return transformedScheduleScene;
      });
    }

    // Transform multi_scene_scenes
    if (transformedItems.multi_scene_scenes && transformedItems.multi_scene_scenes.length > 0) {
      transformedItems.multi_scene_scenes = transformedItems.multi_scene_scenes.map((multiSceneScene) => {
        const transformedMultiSceneScene = { ...multiSceneScene };

        // Replace multi_scene_id with multi_scene_address
        if (multiSceneScene.multi_scene_id) {
          const multiSceneAddress = this.findMultiSceneAddress(multiSceneScene.multi_scene_id, projectItems);
          if (multiSceneAddress) {
            delete transformedMultiSceneScene.multi_scene_id;
            transformedMultiSceneScene.multi_scene_address = multiSceneAddress;
          }
        }

        // Replace scene_id with scene_address
        if (multiSceneScene.scene_id) {
          const sceneAddress = this.findSceneAddress(multiSceneScene.scene_id, projectItems);
          if (sceneAddress) {
            delete transformedMultiSceneScene.scene_id;
            transformedMultiSceneScene.scene_address = sceneAddress;
          }
        }

        return transformedMultiSceneScene;
      });
    }

    // Transform sequence_multi_scenes
    if (transformedItems.sequence_multi_scenes && transformedItems.sequence_multi_scenes.length > 0) {
      transformedItems.sequence_multi_scenes = transformedItems.sequence_multi_scenes.map((sequenceMultiScene) => {
        const transformedSequenceMultiScene = { ...sequenceMultiScene };

        // Replace sequence_id with sequence_address
        if (sequenceMultiScene.sequence_id) {
          const sequenceAddress = this.findSequenceAddress(sequenceMultiScene.sequence_id, projectItems);
          if (sequenceAddress) {
            delete transformedSequenceMultiScene.sequence_id;
            transformedSequenceMultiScene.sequence_address = sequenceAddress;
          }
        }

        // Replace multi_scene_id with multi_scene_address
        if (sequenceMultiScene.multi_scene_id) {
          const multiSceneAddress = this.findMultiSceneAddress(sequenceMultiScene.multi_scene_id, projectItems);
          if (multiSceneAddress) {
            delete transformedSequenceMultiScene.multi_scene_id;
            transformedSequenceMultiScene.multi_scene_address = multiSceneAddress;
          }
        }

        return transformedSequenceMultiScene;
      });
    }

    return transformedItems;
  }

  // Find RCU group address by ID and type
  static findRcuGroupAddress(rcuGroupId, rcuGroupType, projectItems) {
    const items = projectItems[rcuGroupType];
    if (!items) return null;

    const rcuGroup = items.find((item) => item.id === rcuGroupId);
    return rcuGroup ? rcuGroup.address : null;
  }

  // Find lighting address by ID
  static findLightingAddress(lightingId, projectItems) {
    const lightingItems = projectItems.lighting;
    if (!lightingItems) return null;

    const lightingItem = lightingItems.find((item) => item.id === lightingId);
    return lightingItem ? lightingItem.address : null;
  }

  // Find scene address by ID
  static findSceneAddress(sceneId, projectItems) {
    const sceneItems = projectItems.scene;
    if (!sceneItems) return null;

    const sceneItem = sceneItems.find((item) => item.id === sceneId);
    return sceneItem ? sceneItem.address : null;
  }

  // Find schedule identifier by ID (using name + time as unique identifier)
  static findScheduleIdentifier(scheduleId, projectItems) {
    const scheduleItems = projectItems.schedule;
    if (!scheduleItems) return null;

    const scheduleItem = scheduleItems.find((item) => item.id === scheduleId);
    return scheduleItem ? `${scheduleItem.name}|${scheduleItem.time}` : null;
  }

  // Find multi_scene address by ID
  static findMultiSceneAddress(multiSceneId, projectItems) {
    const multiSceneItems = projectItems.multi_scenes;
    if (!multiSceneItems) return null;

    const multiSceneItem = multiSceneItems.find((item) => item.id === multiSceneId);
    return multiSceneItem ? multiSceneItem.address : null;
  }

  // Find sequence address by ID
  static findSequenceAddress(sequenceId, projectItems) {
    const sequenceItems = projectItems.sequences;
    if (!sequenceItems) return null;

    const sequenceItem = sequenceItems.find((item) => item.id === sequenceId);
    return sequenceItem ? sequenceItem.address : null;
  }
}
