import { OBJECT_TYPES } from "@/constants.js";

// Helper function to get object_value from object_type
export function getObjectValue(objectType) {
  // Find the matching object type and return its obj_value
  for (const [, value] of Object.entries(OBJECT_TYPES)) {
    if (typeof value === "object" && value.obj_name === objectType) {
      return value.obj_value;
    }
  }
  // Default fallback
  console.warn(`Unknown object type: ${objectType}`);
  return 0;
}

// Helper method to find next available address in range 1-255
export function findNextAvailableAddress(db, projectId, tableName) {
  try {
    const existingAddresses = db.prepare(`SELECT DISTINCT address FROM ${tableName} WHERE project_id = ?`).all(projectId);
    const addressNumbers = existingAddresses
      .map((item) => parseInt(item.address))
      .filter((num) => !isNaN(num) && num >= 1 && num <= 255)
      .sort((a, b) => a - b);

    // Find the first available address in range 1-255
    let newAddress = 1;
    for (const num of addressNumbers) {
      if (newAddress < num) {
        break;
      }
      newAddress = num + 1;
    }

    // If we've exceeded 255, find a gap in the existing addresses
    if (newAddress > 255) {
      newAddress = null;
      for (let i = 1; i <= 255; i++) {
        if (!addressNumbers.includes(i)) {
          newAddress = i;
          break;
        }
      }

      if (newAddress === null) {
        throw new Error(`No available addresses in range 1-255 for ${tableName} duplication`);
      }
    }

    return newAddress.toString();
  } catch (error) {
    console.error(`Failed to find available address for ${tableName}:`, error);
    throw error;
  }
}

// Generic CRUD operations for project items
export const crudOperations = {
  // Helper function to get object_value from object_type
  getObjectValue(objectType) {
    return getObjectValue(objectType);
  },

  // Helper method to find next available address in range 1-255
  findNextAvailableAddress(projectId, tableName) {
    return findNextAvailableAddress(this.db, projectId, tableName);
  },

  getProjectItems(projectId, tableName) {
    try {
      // Sort by address ASC for tables with address field, except unit and schedule tables
      if (tableName === "unit") {
        const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY created_at DESC`);
        const items = stmt.all(projectId);
        // Parse RS485 and I/O config from JSON for unit items
        return items.map((item) => ({
          ...item,
          rs485_config: item.rs485_config ? JSON.parse(item.rs485_config) : null,
          input_configs: item.input_configs ? JSON.parse(item.input_configs) : null,
          output_configs: item.output_configs ? JSON.parse(item.output_configs) : null,
        }));
      } else if (tableName === "schedule") {
        const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY name ASC`);
        return stmt.all(projectId);
      } else if (tableName === "multi_scenes") {
        const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC`);
        return stmt.all(projectId);
      } else {
        const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC`);
        return stmt.all(projectId);
      }
    } catch (error) {
      throw error;
    }
  },

  getProjectItemById(id, tableName) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      const item = stmt.get(id);

      // Parse RS485 and I/O config from JSON for unit items
      if (tableName === "unit" && item) {
        if (item.rs485_config) {
          item.rs485_config = JSON.parse(item.rs485_config);
        }
        if (item.input_configs) {
          item.input_configs = JSON.parse(item.input_configs);
        }
        if (item.output_configs) {
          item.output_configs = JSON.parse(item.output_configs);
        }
      }

      return item;
    } catch (error) {
      throw error;
    }
  },

  createProjectItem(projectId, itemData, tableName) {
    try {
      const {
        name,
        address,
        description,
        object_type,
        label,
        type,
        factor,
        feedback,
        rcu_group_id,
        knx_switch_group,
        knx_dimming_group,
        knx_value_group,
      } = itemData;

      // Special validation for lighting to prevent duplicate addresses
      if (tableName === "lighting" && address) {
        const existingItems = this.db.prepare("SELECT COUNT(*) as count FROM lighting WHERE project_id = ? AND address = ?").get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`Address ${address} already exists.`);
        }
      }

      // Special validation for KNX
      if (tableName === "knx") {
        this.validateKnxItem(projectId, address, itemData);
      }

      // Note: For aircon, we skip duplicate address validation here because
      // createAirconCard handles this validation at the card level before creating multiple items
      // with the same address but different object_types

      // Special validation for curtain to prevent duplicate addresses
      if (tableName === "curtain" && address) {
        const existingItems = this.db.prepare("SELECT COUNT(*) as count FROM curtain WHERE project_id = ? AND address = ?").get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`Address ${address} already exists.`);
        }
      }

      // Special validation for scene - address is now required
      if (tableName === "scene") {
        if (!address || !address.trim()) {
          throw new Error("Address is required for scene.");
        }
        if (!name) {
          throw new Error("Scene name is required.");
        }

        // Check maximum scene limit (100 scenes)
        const sceneCount = this.db.prepare("SELECT COUNT(*) as count FROM scene WHERE project_id = ?").get(projectId);
        if (sceneCount.count >= 100) {
          throw new Error("Maximum 100 scenes allowed per project.");
        }
      }

      // Special validation for multi_scenes
      if (tableName === "multi_scenes") {
        if (!name || !name.trim()) {
          throw new Error("Name is required for multi-scene.");
        }

        if (!address || !address.trim()) {
          throw new Error("Address is required for multi-scene.");
        }

        // Check for duplicate addresses
        const existingMultiScene = this.db
          .prepare("SELECT COUNT(*) as count FROM multi_scenes WHERE project_id = ? AND address = ?")
          .get(projectId, address.trim());
        if (existingMultiScene.count > 0) {
          throw new Error(`Multi-scene address ${address.trim()} already exists.`);
        }

        // Check maximum multi-scene limit (40 multi-scenes)
        const multiSceneCount = this.db.prepare("SELECT COUNT(*) as count FROM multi_scenes WHERE project_id = ?").get(projectId);
        if (multiSceneCount.count >= 40) {
          throw new Error("Maximum 40 multi-scenes allowed per project.");
        }
      }

      // Special validation for sequences
      if (tableName === "sequences") {
        if (!name || !name.trim()) {
          throw new Error("Name is required for sequence.");
        }

        if (!address || !address.trim()) {
          throw new Error("Address is required for sequence.");
        }

        // Check for duplicate addresses
        const existingSequence = this.db
          .prepare("SELECT COUNT(*) as count FROM sequences WHERE project_id = ? AND address = ?")
          .get(projectId, address.trim());
        if (existingSequence.count > 0) {
          throw new Error(`Sequence address ${address.trim()} already exists.`);
        }

        // Check maximum sequence limit (20 sequences)
        const sequenceCount = this.db.prepare("SELECT COUNT(*) as count FROM sequences WHERE project_id = ?").get(projectId);
        if (sequenceCount.count >= 20) {
          throw new Error("Maximum 20 sequences allowed per project.");
        }
      }

      // For aircon table, include label column
      if (tableName === "aircon") {
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, label)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description, label);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "curtain") {
        // Use specialized createCurtainItem method to handle address-to-ID mapping
        return this.createCurtainItem(projectId, itemData);
      } else if (tableName === "knx") {
        return this.createKnxItemInline(projectId, itemData);
      } else if (tableName === "scene") {
        // For scene table, don't use object_type and object_value
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description)
          VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "multi_scenes") {
        // For multi_scenes table, use type and address fields
        const { type, address } = itemData;
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, type, description)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, type || 0, description);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "sequences") {
        // For sequences table, use address field
        const { address } = itemData;
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description)
          VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else {
        // For other tables, use original structure with object_type and object_value
        const object_value = getObjectValue(object_type);
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, object_type, object_value)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description, object_type, object_value);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      }
    } catch (error) {
      console.error(`Failed to create ${tableName} item:`, error);
      throw error;
    }
  },

  updateProjectItem(id, itemData, tableName) {
    try {
      const {
        name,
        address,
        description,
        object_type,
        label,
        curtain_type,
        curtain_value,
        open_group_id,
        close_group_id,
        stop_group_id,
        pause_period,
        transition_period,
      } = itemData;

      // Special validation for aircon to prevent duplicate addresses
      if (tableName === "aircon" && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db
            .prepare("SELECT COUNT(*) as count FROM aircon WHERE project_id = ? AND address = ? AND address != ?")
            .get(currentItem.project_id, address, currentItem.address);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for lighting to prevent duplicate addresses
      if (tableName === "lighting" && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db
            .prepare("SELECT COUNT(*) as count FROM lighting WHERE project_id = ? AND address = ? AND id != ?")
            .get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for curtain to prevent duplicate addresses
      if (tableName === "curtain" && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db
            .prepare("SELECT COUNT(*) as count FROM curtain WHERE project_id = ? AND address = ? AND id != ?")
            .get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for scene - address is required and name length check
      if (tableName === "scene") {
        if (!address || !address.trim()) {
          throw new Error("Address is required for scene.");
        }
        if (!name) {
          throw new Error("Scene name is required.");
        }
      }

      // Special validation for KNX
      if (tableName === "knx") {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          this.validateKnxItem(currentItem.project_id, address, itemData, id);
        } else if (currentItem) {
          // Just validate factor if address is not changing
          if (itemData.factor && itemData.factor < 1) {
            throw new Error("Factor must be greater than or equal to 1.");
          }
        }
      }

      // For aircon table, include label column
      if (tableName === "aircon") {
        // Get current item to check if address is changing
        const currentItem = this.getProjectItemById(id, tableName);

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, label = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, label, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // If address changed, update scene items that reference this aircon item
        if (currentItem && currentItem.address !== address) {
          console.log(`Updating scene items for aircon ${id}: ${currentItem.address} -> ${address}`);
          this.updateSceneItemsAddress(id, "aircon", address);
        }
      } else if (tableName === "curtain") {
        // For curtain table, include curtain-specific fields
        // Address is required for curtain items
        if (!address) {
          throw new Error("Address is required for curtain items.");
        }

        // Get current item to check if address is changing
        const currentItem = this.getProjectItemById(id, tableName);

        const object_value = getObjectValue(object_type);

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, curtain_type = ?, curtain_value = ?, open_group_id = ?, close_group_id = ?, stop_group_id = ?, pause_period = ?, transition_period = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(
          name,
          address,
          description,
          object_type,
          object_value,
          curtain_type,
          curtain_value || 3,
          open_group_id || null,
          close_group_id || null,
          stop_group_id || null,
          pause_period || 0,
          transition_period || 0,
          id
        );

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // If address changed, update scene items that reference this curtain item
        if (currentItem && currentItem.address !== address) {
          console.log(`Updating scene items for curtain ${id}: ${currentItem.address} -> ${address}`);
          this.updateSceneItemsAddress(id, "curtain", address);
        }
      } else if (tableName === "knx") {
        return this.updateKnxItemInline(id, itemData);
      } else if (tableName === "scene") {
        // For scene table, don't use object_type and object_value
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else if (tableName === "multi_scenes") {
        // For multi_scenes table, use type and address fields
        const { type, address } = itemData;

        // Validation for multi_scenes
        if (!name || !name.trim()) {
          throw new Error("Name is required for multi-scene.");
        }
        if (!address || !address.trim()) {
          throw new Error("Address is required for multi-scene.");
        }

        // Check for duplicate addresses (excluding current item)
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address.trim()) {
          const existingMultiScene = this.db
            .prepare("SELECT COUNT(*) as count FROM multi_scenes WHERE project_id = ? AND address = ? AND id != ?")
            .get(currentItem.project_id, address.trim(), id);
          if (existingMultiScene.count > 0) {
            throw new Error(`Multi-scene address ${address.trim()} already exists.`);
          }
        }

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, type = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, type || 0, description, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else if (tableName === "sequences") {
        // For sequences table, use address field
        const { address } = itemData;

        // Validation for sequences
        if (!name || !name.trim()) {
          throw new Error("Name is required for sequence.");
        }
        if (!address || !address.trim()) {
          throw new Error("Address is required for sequence.");
        }

        // Check for duplicate addresses (excluding current item)
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address.trim()) {
          const existingSequence = this.db
            .prepare("SELECT COUNT(*) as count FROM sequences WHERE project_id = ? AND address = ? AND id != ?")
            .get(currentItem.project_id, address.trim(), id);
          if (existingSequence.count > 0) {
            throw new Error(`Sequence address ${address.trim()} already exists.`);
          }
        }

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else {
        // For other tables (like lighting), use original structure with object_type and object_value
        // Get current item to check if address is changing
        const currentItem = this.getProjectItemById(id, tableName);

        const object_value = getObjectValue(object_type);
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, object_type, object_value, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // If address changed and this is a table that can be used in scenes, update scene items
        if (currentItem && currentItem.address !== address && tableName === "lighting") {
          console.log(`Updating scene items for ${tableName} ${id}: ${currentItem.address} -> ${address}`);
          this.updateSceneItemsAddress(id, tableName, address);
        }
      }

      return this.getProjectItemById(id, tableName);
    } catch (error) {
      console.error(`Failed to update ${tableName} item:`, error);
      throw error;
    }
  },

  deleteProjectItem(id, tableName) {
    try {
      // Start transaction to ensure data consistency
      const transaction = this.db.transaction(() => {
        // For lighting, curtain, and aircon items, also remove from scene_items and scene_address_items
        if (tableName === "lighting" || tableName === "curtain" || tableName === "aircon") {
          // Get all scene items that reference this item
          const sceneItems = this.db
            .prepare(
              `
              SELECT si.*, s.project_id, s.address
              FROM scene_items si
              JOIN scene s ON si.scene_id = s.id
              WHERE si.item_type = ? AND si.item_id = ?
            `
            )
            .all(tableName, id);

          // Remove from scene_address_items first
          const deleteAddressItemStmt = this.db.prepare(`
            DELETE FROM scene_address_items
            WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ?
          `);

          for (const sceneItem of sceneItems) {
            deleteAddressItemStmt.run(sceneItem.project_id, sceneItem.address, sceneItem.item_type, sceneItem.item_id);
          }

          // Remove from scene_items
          const deleteSceneItemStmt = this.db.prepare(`
            DELETE FROM scene_items WHERE item_type = ? AND item_id = ?
          `);
          deleteSceneItemStmt.run(tableName, id);
        }

        // Delete the main item
        // Note: For scene, multi_scenes, and sequences, foreign key constraints with CASCADE DELETE
        // will automatically handle cleanup of related records in:
        // - scene deletion: schedule_scenes, multi_scene_scenes
        // - multi_scenes deletion: multi_scene_scenes, sequence_multi_scenes
        // - sequences deletion: sequence_multi_scenes
        // - schedule deletion: schedule_scenes
        const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
        const result = stmt.run(id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        return { success: true, deletedId: id };
      });

      return transaction();
    } catch (error) {
      console.error(`Failed to delete ${tableName} item:`, error);
      throw error;
    }
  },

  duplicateProjectItem(id, tableName) {
    try {
      const originalItem = this.getProjectItemById(id, tableName);

      if (!originalItem) {
        throw new Error(`${tableName} item not found`);
      }

      const duplicatedItem = {
        name: originalItem.name ? `${originalItem.name} (Copy)` : null,
        address: originalItem.address,
        description: originalItem.description,
      };

      // Add object_type only for tables that use it (not aircon, knx, scene, multi_scenes)
      if (tableName !== "aircon" && tableName !== "knx" && tableName !== "scene" && tableName !== "multi_scenes") {
        duplicatedItem.object_type = originalItem.object_type;
      }

      // For lighting, find a unique address in range 1-255
      if (tableName === "lighting" && originalItem.address) {
        duplicatedItem.address = findNextAvailableAddress(this.db, originalItem.project_id, "lighting");
      }

      // For aircon, include label and find unique address in range 1-255
      if (tableName === "aircon") {
        duplicatedItem.label = originalItem.label;

        if (originalItem.address) {
          duplicatedItem.address = findNextAvailableAddress(this.db, originalItem.project_id, "aircon");
        }
      }

      // For curtain, find a unique address in range 1-255 and include curtain-specific fields
      if (tableName === "curtain" && originalItem.address) {
        duplicatedItem.address = findNextAvailableAddress(this.db, originalItem.project_id, "curtain");
        duplicatedItem.curtain_type = originalItem.curtain_type || "CURTAIN_PULSE_2P";
        duplicatedItem.curtain_value = originalItem.curtain_value || 3;
        duplicatedItem.open_group_id = originalItem.open_group_id || null;
        duplicatedItem.close_group_id = originalItem.close_group_id || null;
        duplicatedItem.stop_group_id = originalItem.stop_group_id || null;
        duplicatedItem.pause_period = originalItem.pause_period || 0;
        duplicatedItem.transition_period = originalItem.transition_period || 0;
      }

      // For scene, find a unique address in range 1-255 if address exists
      if (tableName === "scene" && originalItem.address) {
        duplicatedItem.address = findNextAvailableAddress(this.db, originalItem.project_id, "scene");
      }

      // For KNX, use duplicateKnxItem method
      if (tableName === "knx") {
        return this.createProjectItem(originalItem.project_id, this.duplicateKnxItem(originalItem), tableName);
      }

      // For multi_scenes, copy type and address fields
      if (tableName === "multi_scenes") {
        duplicatedItem.type = originalItem.type || 0;
        duplicatedItem.address = originalItem.address || "";
      }

      return this.createProjectItem(originalItem.project_id, duplicatedItem, tableName);
    } catch (error) {
      console.error(`Failed to duplicate ${tableName} item:`, error);
      throw error;
    }
  },
};
