// Import/Export operations for database projects

export const importExportOperations = {
  // Import project with all items
  importProject(projectData, itemsData) {
    try {
      // Start transaction
      const transaction = this.db.transaction(() => {
        // Create project
        const project = this.createProject(projectData);

        // Import items for each category
        const categories = ["lighting", "aircon", "unit", "curtain", "knx", "scene", "schedule", "multi_scenes", "sequences"];
        const importedCounts = {};
        const idMappings = {
          scene: {},
          schedule: {},
          multi_scenes: {},
          sequences: {},
        };

        categories.forEach((category) => {
          const items = itemsData[category] || [];
          importedCounts[category] = 0;

          items.forEach((itemData) => {
            let newItem;

            if (category === "unit") {
              newItem = this.createUnitItem(project.id, itemData);
            } else if (category === "aircon") {
              // Ensure label is set for aircon items
              if (!itemData.label) {
                itemData.label = "Aircon";
              }
              newItem = this.createProjectItem(project.id, itemData, "aircon");
            } else if (category === "schedule") {
              newItem = this.createScheduleItem(project.id, itemData);
            } else if (category === "knx") {
              // Handle KNX items with special logic for RCU group references
              newItem = this.createKnxItem(project.id, itemData);
            } else if (category === "curtain") {
              // Handle Curtain items with special logic for lighting group references
              newItem = this.createCurtainItem(project.id, itemData);
            } else {
              newItem = this.createProjectItem(project.id, itemData, category);
            }

            // Store ID mapping for relationships
            if (["scene", "schedule", "multi_scenes", "sequences"].includes(category)) {
              idMappings[category][itemData.id] = newItem.id;
            }

            importedCounts[category]++;
          });
        });

        // Import relationship tables after all main items are created
        this.importProjectRelationships(itemsData, project.id, idMappings);

        // Update KNX items to resolve RCU group addresses to new IDs
        this.updateKnxRcuGroupReferences(project.id, itemsData);

        return { project, importedCounts };
      });

      return transaction();
    } catch (error) {
      console.error("Failed to import project:", error);
      throw error;
    }
  },

  // Helper method to import all relationship tables
  importProjectRelationships(itemsData, newProjectId, idMappings) {
    try {
      // Import scene_items
      const sceneItems = itemsData.scene_items || [];
      sceneItems.forEach((sceneItem) => {
        let newSceneId = null;
        let newItemId = null;

        // Handle both old format (scene_id) and new format (scene_address)
        if (sceneItem.scene_address) {
          newSceneId = this.findSceneIdByAddress(newProjectId, sceneItem.scene_address);
        } else if (sceneItem.scene_id) {
          newSceneId = idMappings.scene[sceneItem.scene_id]; // Backward compatibility
        }

        // Handle both old format (item_id) and new format (item_address)
        if (sceneItem.item_address && sceneItem.item_type) {
          newItemId = this.findItemIdByAddress(newProjectId, sceneItem.item_address, sceneItem.item_type);
        } else if (sceneItem.item_id) {
          newItemId = sceneItem.item_id; // Backward compatibility - may not work cross-machine
        }

        if (newSceneId && newItemId) {
          const stmt = this.db.prepare(`
            INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            newSceneId,
            sceneItem.item_type,
            newItemId,
            sceneItem.item_address,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type,
            sceneItem.object_value
          );
        }
      });

      // Import scene_address_items
      const sceneAddressItems = itemsData.scene_address_items || [];
      sceneAddressItems.forEach((addressItem) => {
        const stmt = this.db.prepare(`
          INSERT INTO scene_address_items (project_id, address, item_type, item_id, object_type, object_value)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(newProjectId, addressItem.address, addressItem.item_type, addressItem.item_id, addressItem.object_type, addressItem.object_value);
      });

      // Import schedule_scenes
      const scheduleScenes = itemsData.schedule_scenes || [];
      scheduleScenes.forEach((scheduleScene) => {
        let newScheduleId = null;
        let newSceneId = null;

        // Handle both old format (schedule_id) and new format (schedule_identifier)
        if (scheduleScene.schedule_identifier) {
          newScheduleId = this.findScheduleIdByIdentifier(newProjectId, scheduleScene.schedule_identifier);
        } else if (scheduleScene.schedule_id) {
          newScheduleId = idMappings.schedule[scheduleScene.schedule_id]; // Backward compatibility
        }

        // Handle both old format (scene_id) and new format (scene_address)
        if (scheduleScene.scene_address) {
          newSceneId = this.findSceneIdByAddress(newProjectId, scheduleScene.scene_address);
        } else if (scheduleScene.scene_id) {
          newSceneId = idMappings.scene[scheduleScene.scene_id]; // Backward compatibility
        }

        if (newScheduleId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO schedule_scenes (schedule_id, scene_id)
            VALUES (?, ?)
          `);
          stmt.run(newScheduleId, newSceneId);
        }
      });

      // Import multi_scene_scenes
      const multiSceneScenes = itemsData.multi_scene_scenes || [];
      multiSceneScenes.forEach((multiSceneScene) => {
        let newMultiSceneId = null;
        let newSceneId = null;

        // Handle both old format (multi_scene_id) and new format (multi_scene_address)
        if (multiSceneScene.multi_scene_address) {
          newMultiSceneId = this.findMultiSceneIdByAddress(newProjectId, multiSceneScene.multi_scene_address);
        } else if (multiSceneScene.multi_scene_id) {
          newMultiSceneId = idMappings.multi_scenes[multiSceneScene.multi_scene_id]; // Backward compatibility
        }

        // Handle both old format (scene_id) and new format (scene_address)
        if (multiSceneScene.scene_address) {
          newSceneId = this.findSceneIdByAddress(newProjectId, multiSceneScene.scene_address);
        } else if (multiSceneScene.scene_id) {
          newSceneId = idMappings.scene[multiSceneScene.scene_id]; // Backward compatibility
        }

        if (newMultiSceneId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO multi_scene_scenes (multi_scene_id, scene_id, scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(newMultiSceneId, newSceneId, multiSceneScene.scene_order);
        }
      });

      // Import sequence_multi_scenes
      const sequenceMultiScenes = itemsData.sequence_multi_scenes || [];
      sequenceMultiScenes.forEach((sequenceMultiScene) => {
        let newSequenceId = null;
        let newMultiSceneId = null;

        // Handle both old format (sequence_id) and new format (sequence_address)
        if (sequenceMultiScene.sequence_address) {
          newSequenceId = this.findSequenceIdByAddress(newProjectId, sequenceMultiScene.sequence_address);
        } else if (sequenceMultiScene.sequence_id) {
          newSequenceId = idMappings.sequences[sequenceMultiScene.sequence_id]; // Backward compatibility
        }

        // Handle both old format (multi_scene_id) and new format (multi_scene_address)
        if (sequenceMultiScene.multi_scene_address) {
          newMultiSceneId = this.findMultiSceneIdByAddress(newProjectId, sequenceMultiScene.multi_scene_address);
        } else if (sequenceMultiScene.multi_scene_id) {
          newMultiSceneId = idMappings.multi_scenes[sequenceMultiScene.multi_scene_id]; // Backward compatibility
        }

        if (newSequenceId && newMultiSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO sequence_multi_scenes (sequence_id, multi_scene_id, multi_scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(newSequenceId, newMultiSceneId, sequenceMultiScene.multi_scene_order);
        }
      });
    } catch (error) {
      console.error("Failed to import project relationships:", error);
      throw error;
    }
  },

  // Find item ID by address and type in the new project
  findItemIdByAddress(projectId, address, itemType) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM ${itemType}
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(`Failed to find ${itemType} ID for address ${address}:`, error);
      return null;
    }
  },

  // Bulk import items for a specific category
  bulkImportItems(projectId, items, category) {
    try {
      const transaction = this.db.transaction(() => {
        const importedItems = [];

        items.forEach((itemData) => {
          let item;
          if (category === "unit") {
            item = this.createUnitItem(projectId, itemData);
          } else if (category === "aircon") {
            item = this.createProjectItem(projectId, itemData, "aircon");
          } else if (category === "schedule") {
            item = this.createScheduleItem(projectId, itemData);
          } else if (category === "scene") {
            item = this.bulkImportSingleScene(projectId, itemData);
          } else {
            item = this.createProjectItem(projectId, itemData, category);
          }
          importedItems.push(item);
        });

        return importedItems;
      });

      return transaction();
    } catch (error) {
      console.error(`Failed to bulk import ${category} items:`, error);
      throw error;
    }
  },
};
