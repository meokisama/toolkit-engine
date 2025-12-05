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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
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

  createSceneAddressItemsTable: `
    CREATE TABLE IF NOT EXISTS scene_address_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      address TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      object_type TEXT,
      object_value INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, address, item_type, item_id, object_type)
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
    try {
      // Start transaction to handle address changes
      const transaction = this.db.transaction(() => {
        // Get current scene info
        const currentScene = this.getProjectItemById(id, "scene");
        if (!currentScene) {
          throw new Error("Scene not found");
        }

        // Check if address is changing
        if (currentScene.address !== itemData.address) {
          // Get all scene items for this scene
          const sceneItems = this.db
            .prepare("SELECT * FROM scene_items WHERE scene_id = ?")
            .all(id);

          // Remove old address items from scene_address_items
          const deleteOldAddressItemStmt = this.db.prepare(`
            DELETE FROM scene_address_items
            WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
          `);

          for (const sceneItem of sceneItems) {
            deleteOldAddressItemStmt.run(
              currentScene.project_id,
              currentScene.address,
              sceneItem.item_type,
              sceneItem.item_id,
              sceneItem.object_type
            );
          }

          // Check if new address items are available
          const checkNewAddressStmt = this.db.prepare(`
            SELECT COUNT(*) as count FROM scene_address_items
            WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
          `);

          for (const sceneItem of sceneItems) {
            const existingItem = checkNewAddressStmt.get(
              currentScene.project_id,
              itemData.address,
              sceneItem.item_type,
              sceneItem.item_id,
              sceneItem.object_type
            );

            if (existingItem.count > 0) {
              throw new Error(
                `Item is already used by another scene with address ${itemData.address}`
              );
            }
          }

          // Add new address items to scene_address_items
          const addNewAddressItemStmt = this.db.prepare(`
            INSERT INTO scene_address_items (project_id, address, item_type, item_id, object_type, object_value)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          for (const sceneItem of sceneItems) {
            const object_value = this.getObjectValue(sceneItem.object_type);
            addNewAddressItemStmt.run(
              currentScene.project_id,
              itemData.address,
              sceneItem.item_type,
              sceneItem.item_id,
              sceneItem.object_type,
              object_value
            );
          }
        }

        // Update the scene
        return this.updateProjectItem(id, itemData, "scene");
      });

      return transaction();
    } catch (error) {
      console.error("Failed to update scene item:", error);
      throw error;
    }
  },

  deleteSceneItem(id) {
    try {
      // Start transaction to ensure data consistency
      const transaction = this.db.transaction(() => {
        // Get scene info before deleting
        const scene = this.db
          .prepare("SELECT project_id, address FROM scene WHERE id = ?")
          .get(id);
        if (!scene) {
          throw new Error("Scene not found");
        }

        // Get all scene items for this scene
        const sceneItems = this.db
          .prepare("SELECT * FROM scene_items WHERE scene_id = ?")
          .all(id);

        // Remove all items from scene_address_items
        const deleteAddressItemStmt = this.db.prepare(`
          DELETE FROM scene_address_items
          WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
        `);

        for (const sceneItem of sceneItems) {
          deleteAddressItemStmt.run(
            scene.project_id,
            scene.address,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.object_type
          );
        }

        // Delete the scene (this will cascade delete scene_items due to foreign key)
        const deleteSceneStmt = this.db.prepare(
          "DELETE FROM scene WHERE id = ?"
        );
        const result = deleteSceneStmt.run(id);

        if (result.changes === 0) {
          throw new Error("Scene item not found");
        }

        return { success: true, deletedId: id };
      });

      return transaction();
    } catch (error) {
      console.error("Failed to delete scene item:", error);
      throw error;
    }
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
      console.log(
        `Updated ${result.changes} scene items with new address ${newAddress} for ${itemType} item ${itemId}`
      );

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

  addItemToScene(
    sceneId,
    itemType,
    itemId,
    itemValue = null,
    command = null,
    objectType = null
  ) {
    try {
      // Get scene info to check address and project
      const scene = this.db
        .prepare("SELECT project_id, address FROM scene WHERE id = ?")
        .get(sceneId);
      if (!scene) {
        throw new Error("Scene not found");
      }

      // Check scene items limit (60 items maximum)
      const currentItemCount = this.db
        .prepare("SELECT COUNT(*) as count FROM scene_items WHERE scene_id = ?")
        .get(sceneId);
      if (currentItemCount.count >= 60) {
        throw new Error("Maximum 60 items allowed per scene");
      }

      // Get item address from the corresponding table
      let itemAddress = null;
      if (itemType === "lighting") {
        const item = this.db
          .prepare("SELECT address FROM lighting WHERE id = ?")
          .get(itemId);
        itemAddress = item?.address;
      } else if (itemType === "aircon") {
        const item = this.db
          .prepare("SELECT address FROM aircon WHERE id = ?")
          .get(itemId);
        itemAddress = item?.address;
      } else if (itemType === "curtain") {
        const item = this.db
          .prepare("SELECT address FROM curtain WHERE id = ?")
          .get(itemId);
        itemAddress = item?.address;
      }

      // Check if this item is already used by another scene with the same address
      const existingItem = this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM scene_address_items
        WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
      `
        )
        .get(scene.project_id, scene.address, itemType, itemId, objectType);

      if (existingItem.count > 0) {
        throw new Error(
          `This item is already used by another scene with address ${scene.address}`
        );
      }

      // Add to scene_items
      const object_value = this.getObjectValue(objectType);
      const stmt = this.db.prepare(`
        INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        sceneId,
        itemType,
        itemId,
        itemAddress,
        itemValue,
        command,
        objectType,
        object_value
      );

      // Add to scene_address_items to track usage
      const addressItemStmt = this.db.prepare(`
        INSERT INTO scene_address_items (project_id, address, item_type, item_id, object_type, object_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      addressItemStmt.run(
        scene.project_id,
        scene.address,
        itemType,
        itemId,
        objectType,
        object_value
      );

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
      // Get scene item info before deleting
      const sceneItem = this.db
        .prepare(
          `
        SELECT si.*, s.project_id, s.address
        FROM scene_items si
        JOIN scene s ON si.scene_id = s.id
        WHERE si.id = ?
      `
        )
        .get(sceneItemId);

      if (!sceneItem) {
        throw new Error("Scene item not found");
      }

      // Remove from scene_items
      const stmt = this.db.prepare("DELETE FROM scene_items WHERE id = ?");
      const result = stmt.run(sceneItemId);

      // Remove from scene_address_items
      const addressItemStmt = this.db.prepare(`
        DELETE FROM scene_address_items
        WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
      `);

      addressItemStmt.run(
        sceneItem.project_id,
        sceneItem.address,
        sceneItem.item_type,
        sceneItem.item_id,
        sceneItem.object_type
      );

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

  // Check if an item can be added to a scene (not already used by another scene with same address)
  canAddItemToScene(
    projectId,
    address,
    itemType,
    itemId,
    objectType,
    excludeSceneId = null
  ) {
    try {
      let query = `
        SELECT COUNT(*) as count FROM scene_address_items sai
        WHERE sai.project_id = ? AND sai.address = ? AND sai.item_type = ? AND sai.item_id = ? AND sai.object_type = ?
      `;

      const params = [projectId, address, itemType, itemId, objectType];

      // If excludeSceneId is provided, exclude items from that specific scene
      if (excludeSceneId) {
        query += `
          AND NOT EXISTS (
            SELECT 1 FROM scene_items si
            WHERE si.scene_id = ? AND si.item_type = sai.item_type AND si.item_id = sai.item_id AND si.object_type = sai.object_type
          )
        `;
        params.push(excludeSceneId);
      }

      const stmt = this.db.prepare(query);
      const result = stmt.get(...params);
      return result.count === 0;
    } catch (error) {
      console.error("Failed to check if item can be added to scene:", error);
      throw error;
    }
  },

  // Get all items used by scenes with a specific address
  getSceneAddressItems(projectId, address) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM scene_address_items
        WHERE project_id = ? AND address = ?
        ORDER BY created_at ASC
      `);

      return stmt.all(projectId, address);
    } catch (error) {
      console.error("Failed to get scene address items:", error);
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
      const availableAddress = this.findNextAvailableAddress(
        projectId,
        "scene"
      );

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
            this.addItemToScene(
              scene.id,
              itemData.itemType,
              item.id,
              itemData.value,
              itemData.command,
              itemData.objectType
            );
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
        existingItem = this.db
          .prepare(
            "SELECT * FROM lighting WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address);
      } else if (itemType === "aircon") {
        existingItem = this.db
          .prepare("SELECT * FROM aircon WHERE project_id = ? AND address = ?")
          .get(projectId, address);
      } else if (itemType === "curtain") {
        existingItem = this.db
          .prepare("SELECT * FROM curtain WHERE project_id = ? AND address = ?")
          .get(projectId, address);
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
