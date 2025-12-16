/**
 * Scene Database Module
 * Contains all table schemas and methods related to scenes, multi-scenes, and scene items
 */

// Table creation SQL statements
export const sceneTableSchemas = {
  createSceneTable: `
    CREATE TABLE IF NOT EXISTS scene (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT,
      source_unit INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (source_unit) REFERENCES unit (id) ON DELETE SET NULL
    )
  `,

  createSceneItemsTable: `
    CREATE TABLE IF NOT EXISTS scene_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      item_address TEXT,
      item_value TEXT,
      command TEXT,
      object_type TEXT,
      object_value INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scene_id) REFERENCES scene (id) ON DELETE CASCADE
    )
  `,

  createScheduleScenesTable: `
    CREATE TABLE IF NOT EXISTS schedule_scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      scene_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedule (id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scene (id) ON DELETE CASCADE
    )
  `,

  // Note: Multi-scene and sequence related tables have been moved to their respective modules:
  // - createMultiScenesTable, createMultiSceneScenesTable -> database/multiscene.js
  // - createSequenceMultiScenesTable -> database/sequence.js
};

// Scene-related methods that will be mixed into DatabaseService
export const sceneMethods = {
  // Scene CRUD operations
  getSceneItems(projectId) {
    return this.getProjectItems(projectId, "scene");
  },

  createSceneItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "scene");
  },

  updateSceneItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "scene");
  },

  deleteSceneItem(id) {
    return this.deleteProjectItem(id, "scene");
  },

  duplicateSceneItem(id) {
    try {
      // Start transaction
      const transaction = this.db.transaction(() => {
        // Duplicate the scene (this will automatically find a new unique address)
        const duplicatedScene = this.duplicateProjectItem(id, "scene");

        // Get original scene items
        const originalSceneItems = this.getSceneItemsWithDetails(id);

        // Duplicate scene items - addItemToScene will handle scene_address_items automatically
        for (const sceneItem of originalSceneItems) {
          this.addItemToScene(
            duplicatedScene.id,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type
          );
        }

        return duplicatedScene;
      });

      return transaction();
    } catch (error) {
      console.error("Failed to duplicate scene with items:", error);
      throw error;
    }
  },

  // Helper method to update scene items when item addresses change
  updateSceneItemsAddress(itemId, itemType, newAddress) {
    try {
      const stmt = this.db.prepare(`
        UPDATE scene_items
        SET item_address = ?
        WHERE item_id = ? AND item_type = ?
      `);

      const result = stmt.run(newAddress, itemId, itemType);
      console.log(`Updated ${result.changes} scene items with new address ${newAddress} for ${itemType} item ${itemId}`);

      return result.changes;
    } catch (error) {
      console.error("Failed to update scene items address:", error);
      throw error;
    }
  },

  // Scene Items Management
  getSceneItemsWithDetails(sceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT
          si.*,
          CASE
            WHEN si.item_type = 'lighting' THEN l.name
            WHEN si.item_type = 'aircon' THEN ai.name
            WHEN si.item_type = 'curtain' THEN c.name
          END as item_name,
          si.item_address,
          CASE
            WHEN si.item_type = 'lighting' THEN l.description
            WHEN si.item_type = 'aircon' THEN ai.description
            WHEN si.item_type = 'curtain' THEN c.description
          END as item_description,
          CASE
            WHEN si.item_type = 'lighting' THEN l.object_type
            WHEN si.item_type = 'aircon' THEN si.object_type
            WHEN si.item_type = 'curtain' THEN c.object_type
            ELSE si.object_type
          END as object_type,
          CASE
            WHEN si.item_type = 'aircon' THEN ai.label
            ELSE NULL
          END as label
        FROM scene_items si
        LEFT JOIN lighting l ON si.item_type = 'lighting' AND si.item_id = l.id
        LEFT JOIN aircon ai ON si.item_type = 'aircon' AND si.item_id = ai.id
        LEFT JOIN curtain c ON si.item_type = 'curtain' AND si.item_id = c.id
        WHERE si.scene_id = ?
        ORDER BY si.created_at ASC
      `);

      return stmt.all(sceneId);
    } catch (error) {
      console.error("Failed to get scene items with details:", error);
      throw error;
    }
  },

  addItemToScene(sceneId, itemType, itemId, itemValue = null, command = null, objectType = null) {
    try {
      // Check scene items limit (60 items maximum)
      const currentItemCount = this.db.prepare("SELECT COUNT(*) as count FROM scene_items WHERE scene_id = ?").get(sceneId);
      if (currentItemCount.count >= 60) {
        throw new Error("Maximum 60 items allowed per scene");
      }

      // Get item address from the corresponding table
      let itemAddress = null;
      if (itemType === "lighting") {
        const item = this.db.prepare("SELECT address FROM lighting WHERE id = ?").get(itemId);
        itemAddress = item?.address;
      } else if (itemType === "aircon") {
        const item = this.db.prepare("SELECT address FROM aircon WHERE id = ?").get(itemId);
        itemAddress = item?.address;
      } else if (itemType === "curtain") {
        const item = this.db.prepare("SELECT address FROM curtain WHERE id = ?").get(itemId);
        itemAddress = item?.address;
      }

      // Add to scene_items
      const object_value = this.getObjectValue(objectType);
      const stmt = this.db.prepare(`
        INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(sceneId, itemType, itemId, itemAddress, itemValue, command, objectType, object_value);

      // Return the created scene item with details
      const getStmt = this.db.prepare("SELECT * FROM scene_items WHERE id = ?");
      return getStmt.get(result.lastInsertRowid);
    } catch (error) {
      console.error("Failed to add item to scene:", error);
      throw error;
    }
  },

  removeItemFromScene(sceneItemId) {
    try {
      const stmt = this.db.prepare("DELETE FROM scene_items WHERE id = ?");
      const result = stmt.run(sceneItemId);

      if (result.changes === 0) {
        throw new Error("Scene item not found");
      }

      return result.changes > 0;
    } catch (error) {
      console.error("Failed to remove item from scene:", error);
      throw error;
    }
  },

  updateSceneItemValue(sceneItemId, itemValue, command = null) {
    try {
      const stmt = this.db.prepare(`
        UPDATE scene_items
        SET item_value = ?, command = ?
        WHERE id = ?
      `);

      const result = stmt.run(itemValue, command, sceneItemId);

      if (result.changes === 0) {
        throw new Error("Scene item not found");
      }

      // Return updated scene item
      const getStmt = this.db.prepare("SELECT * FROM scene_items WHERE id = ?");
      return getStmt.get(sceneItemId);
    } catch (error) {
      console.error("Failed to update scene item value:", error);
      throw error;
    }
  },

  // Find scene ID by address in the new project
  findSceneIdByAddress(projectId, address) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM scene
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(`Failed to find scene ID for address ${address}:`, error);
      return null;
    }
  },

  // Bulk import a single scene with its items
  bulkImportSingleScene(projectId, sceneData) {
    try {
      // Find next available address to avoid conflicts
      const availableAddress = this.findNextAvailableAddress(projectId, "scene");

      // Create the scene first
      const scene = this.createProjectItem(
        projectId,
        {
          name: sceneData.name,
          address: availableAddress.toString(),
          description: sceneData.description,
        },
        "scene"
      );

      // Process each scene item
      if (sceneData.items && sceneData.items.length > 0) {
        for (const itemData of sceneData.items) {
          // Find or create the item based on type and address
          const item = this.findOrCreateItemForScene(projectId, itemData);

          if (item) {
            // Add item to scene
            this.addItemToScene(scene.id, itemData.itemType, item.id, itemData.value, itemData.command, itemData.objectType);
          }
        }
      }

      return scene;
    } catch (error) {
      console.error("Failed to bulk import single scene:", error);
      throw error;
    }
  },

  // Find or create item for scene import
  findOrCreateItemForScene(projectId, itemData) {
    try {
      const { itemType, address, itemName } = itemData;

      if (!address) {
        console.warn("No address provided for item:", itemData);
        return null;
      }

      let tableName = itemType;
      let existingItem = null;

      // Find existing item by address
      if (itemType === "lighting") {
        existingItem = this.db.prepare("SELECT * FROM lighting WHERE project_id = ? AND address = ?").get(projectId, address);
      } else if (itemType === "aircon") {
        existingItem = this.db.prepare("SELECT * FROM aircon WHERE project_id = ? AND address = ?").get(projectId, address);
      } else if (itemType === "curtain") {
        existingItem = this.db.prepare("SELECT * FROM curtain WHERE project_id = ? AND address = ?").get(projectId, address);
      }

      // If item exists, return it
      if (existingItem) {
        return existingItem;
      }

      // Otherwise, create a new item
      const newItemData = {
        address: address,
        name: itemName || `Imported ${itemType}`,
        description: `Auto-created from scene import`,
      };

      // Add object_type for lighting and curtain
      if (itemType === "lighting" || itemType === "curtain") {
        newItemData.object_type = itemData.objectType || "Switch";
      }

      const newItem = this.createProjectItem(projectId, newItemData, tableName);
      return newItem;
    } catch (error) {
      console.error("Failed to find or create item for scene:", error);
      return null;
    }
  },
};
