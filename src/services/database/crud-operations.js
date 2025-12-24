import { OBJECT_TYPES } from "@/constants.js";

const TABLE_LIMITS = {
  scene: 100,
  multi_scenes: 40,
  sequences: 20,
};
const ADDRESS_RANGE = { MIN: 1, MAX: 255 };
const TABLES_WITH_OBJECT_TYPE = ["lighting", "curtain"];
const TABLES_WITH_SOURCE_UNIT = ["curtain", "knx", "scene", "multi_scenes", "sequences"];
const TABLES_WITH_SCENE_INTEGRATION = ["lighting", "curtain", "aircon"];

// Get object_value from object_type
export function getObjectValue(objectType) {
  for (const [, value] of Object.entries(OBJECT_TYPES)) {
    if (typeof value === "object" && value.obj_name === objectType) {
      return value.obj_value;
    }
  }
  console.warn(`Unknown object type: ${objectType}`);
  return 0;
}

// Find next available address in range 1-255
export function findNextAvailableAddress(db, projectId, tableName) {
  try {
    const existingAddresses = db.prepare(`SELECT DISTINCT address FROM ${tableName} WHERE project_id = ?`).all(projectId);
    const addressNumbers = existingAddresses
      .map((item) => parseInt(item.address))
      .filter((num) => !isNaN(num) && num >= ADDRESS_RANGE.MIN && num <= ADDRESS_RANGE.MAX)
      .sort((a, b) => a - b);

    // Find the first available address
    let newAddress = ADDRESS_RANGE.MIN;
    for (const num of addressNumbers) {
      if (newAddress < num) break;
      newAddress = num + 1;
    }

    // If exceeded MAX, find a gap in existing addresses
    if (newAddress > ADDRESS_RANGE.MAX) {
      newAddress = null;
      for (let i = ADDRESS_RANGE.MIN; i <= ADDRESS_RANGE.MAX; i++) {
        if (!addressNumbers.includes(i)) {
          newAddress = i;
          break;
        }
      }

      if (newAddress === null) {
        throw new Error(`No available addresses in range ${ADDRESS_RANGE.MIN}-${ADDRESS_RANGE.MAX} for ${tableName}`);
      }
    }

    return newAddress.toString();
  } catch (error) {
    console.error(`Failed to find available address for ${tableName}:`, error);
    throw error;
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

class ValidationHelper {
  constructor(db) {
    this.db = db;
  }

  // Check if address is duplicate
  checkDuplicateAddress(projectId, tableName, address, sourceUnit = null, excludeId = null) {
    const hasSourceUnit = TABLES_WITH_SOURCE_UNIT.includes(tableName);

    let query, params;

    if (hasSourceUnit) {
      if (sourceUnit === null) {
        query = excludeId
          ? `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ? AND address = ? AND source_unit IS NULL AND id != ?`
          : `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ? AND address = ? AND source_unit IS NULL`;
        params = excludeId ? [projectId, address, excludeId] : [projectId, address];
      } else {
        query = excludeId
          ? `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ? AND address = ? AND source_unit = ? AND id != ?`
          : `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ? AND address = ? AND source_unit = ?`;
        params = excludeId ? [projectId, address, sourceUnit, excludeId] : [projectId, address, sourceUnit];
      }
    } else {
      query = excludeId
        ? `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ? AND address = ? AND id != ?`
        : `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ? AND address = ?`;
      params = excludeId ? [projectId, address, excludeId] : [projectId, address];
    }

    const result = this.db.prepare(query).get(...params);
    return result.count > 0;
  }

  // Check table item limit
  checkTableLimit(projectId, tableName) {
    if (!TABLE_LIMITS[tableName]) return;

    const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ?`).get(projectId);
    if (count.count >= TABLE_LIMITS[tableName]) {
      throw new Error(`Maximum ${TABLE_LIMITS[tableName]} ${tableName} allowed per project.`);
    }
  }

  // Validate required fields
  validateRequired(fields, data) {
    for (const field of fields) {
      if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
        throw new Error(`${field} is required.`);
      }
    }
  }
}

// ============================================================================
// TABLE CONFIGURATIONS
// ============================================================================

const tableConfigs = {
  lighting: {
    fields: ["name", "address", "description", "object_type"],
    hasObjectType: true,
    validateCreate(validator, projectId, itemData) {
      if (itemData.address && validator.checkDuplicateAddress(projectId, "lighting", itemData.address)) {
        throw new Error(`Address ${itemData.address} already exists.`);
      }
    },
    validateUpdate(validator, projectId, currentItem, itemData, id) {
      if (itemData.address && currentItem.address !== itemData.address) {
        if (validator.checkDuplicateAddress(projectId, "lighting", itemData.address, null, id)) {
          throw new Error(`Address ${itemData.address} already exists.`);
        }
      }
    },
    buildInsertQuery(tableName, itemData) {
      const object_value = getObjectValue(itemData.object_type);
      return {
        sql: `INSERT INTO ${tableName} (project_id, name, address, description, object_type, object_value) VALUES (?, ?, ?, ?, ?, ?)`,
        params: [itemData.project_id, itemData.name, itemData.address, itemData.description, itemData.object_type, object_value],
      };
    },
    buildUpdateQuery(tableName, itemData, id) {
      const object_value = getObjectValue(itemData.object_type);
      return {
        sql: `UPDATE ${tableName} SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [itemData.name, itemData.address, itemData.description, itemData.object_type, object_value, id],
      };
    },
  },

  aircon: {
    fields: ["name", "address", "description", "label"],
    validateCreate(validator, projectId, itemData) {
      if (itemData.address && validator.checkDuplicateAddress(projectId, "aircon", itemData.address)) {
        throw new Error(`Address ${itemData.address} already exists.`);
      }
    },
    validateUpdate(validator, projectId, currentItem, itemData, id) {
      if (itemData.address && currentItem.address !== itemData.address) {
        if (validator.checkDuplicateAddress(projectId, "aircon", itemData.address, null, id)) {
          throw new Error(`Address ${itemData.address} already exists.`);
        }
      }
    },
    buildInsertQuery(tableName, itemData) {
      return {
        sql: `INSERT INTO ${tableName} (project_id, name, address, description, label) VALUES (?, ?, ?, ?, ?)`,
        params: [itemData.project_id, itemData.name, itemData.address, itemData.description, itemData.label],
      };
    },
    buildUpdateQuery(tableName, itemData, id) {
      return {
        sql: `UPDATE ${tableName} SET name = ?, address = ?, description = ?, label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [itemData.name, itemData.address, itemData.description, itemData.label, id],
      };
    },
  },

  curtain: {
    fields: ["name", "address", "description", "object_type"],
    hasObjectType: true,
    validateCreate(validator, projectId, itemData) {
      const sourceUnit = itemData.source_unit || null;
      if (itemData.address && validator.checkDuplicateAddress(projectId, "curtain", itemData.address, sourceUnit)) {
        throw new Error(`Address ${itemData.address} already exists in this source unit.`);
      }
    },
    validateUpdate(validator, projectId, currentItem, itemData, id) {
      if (!itemData.address) {
        throw new Error("Address is required for curtain items.");
      }
      if (itemData.address && currentItem.address !== itemData.address) {
        const sourceUnit = itemData.source_unit !== undefined ? itemData.source_unit : currentItem.source_unit;
        if (validator.checkDuplicateAddress(projectId, "curtain", itemData.address, sourceUnit, id)) {
          throw new Error(`Address ${itemData.address} already exists in this source unit.`);
        }
      }
    },
    buildUpdateQuery(tableName, itemData, id) {
      const object_value = getObjectValue(itemData.object_type);
      return {
        sql: `UPDATE ${tableName} SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, curtain_type = ?, curtain_value = ?, open_group_id = ?, close_group_id = ?, stop_group_id = ?, pause_period = ?, transition_period = ?, source_unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [
          itemData.name,
          itemData.address,
          itemData.description,
          itemData.object_type,
          object_value,
          itemData.curtain_type,
          itemData.curtain_value || 3,
          itemData.open_group_id || null,
          itemData.close_group_id || null,
          itemData.stop_group_id || null,
          itemData.pause_period || 0,
          itemData.transition_period || 0,
          itemData.source_unit || null,
          id,
        ],
      };
    },
  },

  scene: {
    fields: ["name", "address", "description"],
    validateCreate(validator, projectId, itemData) {
      validator.validateRequired(["name", "address"], itemData);
      validator.checkTableLimit(projectId, "scene");
    },
    validateUpdate(validator, _projectId, _currentItem, itemData, _id) {
      validator.validateRequired(["name", "address"], itemData);
    },
    buildInsertQuery(tableName, itemData) {
      return {
        sql: `INSERT INTO ${tableName} (project_id, name, address, description, source_unit) VALUES (?, ?, ?, ?, ?)`,
        params: [itemData.project_id, itemData.name, itemData.address, itemData.description, itemData.source_unit || null],
      };
    },
    buildUpdateQuery(tableName, itemData, id) {
      return {
        sql: `UPDATE ${tableName} SET name = ?, address = ?, description = ?, source_unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [itemData.name, itemData.address, itemData.description, itemData.source_unit || null, id],
      };
    },
  },

  multi_scenes: {
    fields: ["name", "address", "type", "description"],
    validateCreate(validator, projectId, itemData) {
      validator.validateRequired(["name", "address"], itemData);
      validator.checkTableLimit(projectId, "multi_scenes");

      const sourceUnit = itemData.source_unit || null;
      if (validator.checkDuplicateAddress(projectId, "multi_scenes", itemData.address.trim(), sourceUnit)) {
        throw new Error(`Multi-scene address ${itemData.address.trim()} already exists in this source unit.`);
      }
    },
    validateUpdate(validator, projectId, currentItem, itemData, id) {
      validator.validateRequired(["name", "address"], itemData);

      if (currentItem.address !== itemData.address.trim()) {
        const sourceUnit = itemData.source_unit !== undefined ? itemData.source_unit : currentItem.source_unit;
        if (validator.checkDuplicateAddress(projectId, "multi_scenes", itemData.address.trim(), sourceUnit, id)) {
          throw new Error(`Multi-scene address ${itemData.address.trim()} already exists in this source unit.`);
        }
      }
    },
    buildInsertQuery(tableName, itemData) {
      return {
        sql: `INSERT INTO ${tableName} (project_id, name, address, type, description, source_unit) VALUES (?, ?, ?, ?, ?, ?)`,
        params: [itemData.project_id, itemData.name, itemData.address, itemData.type || 0, itemData.description, itemData.source_unit || null],
      };
    },
    buildUpdateQuery(tableName, itemData, id) {
      return {
        sql: `UPDATE ${tableName} SET name = ?, address = ?, type = ?, description = ?, source_unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [itemData.name, itemData.address, itemData.type || 0, itemData.description, itemData.source_unit || null, id],
      };
    },
  },

  sequences: {
    fields: ["name", "address", "description"],
    validateCreate(validator, projectId, itemData) {
      validator.validateRequired(["name", "address"], itemData);
      validator.checkTableLimit(projectId, "sequences");

      const sourceUnit = itemData.source_unit || null;
      if (validator.checkDuplicateAddress(projectId, "sequences", itemData.address.trim(), sourceUnit)) {
        throw new Error(`Sequence address ${itemData.address.trim()} already exists in this source unit.`);
      }
    },
    validateUpdate(validator, projectId, currentItem, itemData, id) {
      validator.validateRequired(["name", "address"], itemData);

      if (currentItem.address !== itemData.address.trim()) {
        const sourceUnit = itemData.source_unit !== undefined ? itemData.source_unit : currentItem.source_unit;
        if (validator.checkDuplicateAddress(projectId, "sequences", itemData.address.trim(), sourceUnit, id)) {
          throw new Error(`Sequence address ${itemData.address.trim()} already exists in this source unit.`);
        }
      }
    },
    buildInsertQuery(tableName, itemData) {
      return {
        sql: `INSERT INTO ${tableName} (project_id, name, address, description, source_unit) VALUES (?, ?, ?, ?, ?)`,
        params: [itemData.project_id, itemData.name, itemData.address, itemData.description, itemData.source_unit || null],
      };
    },
    buildUpdateQuery(tableName, itemData, id) {
      return {
        sql: `UPDATE ${tableName} SET name = ?, address = ?, description = ?, source_unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [itemData.name, itemData.address, itemData.description, itemData.source_unit || null, id],
      };
    },
  },

  dmx: {
    fields: ["name", "address", "description", "source_unit"],
    buildInsertQuery(tableName, itemData) {
      return {
        sql: `INSERT INTO ${tableName} (project_id, name, address, description, source_unit) VALUES (?, ?, ?, ?, ?)`,
        params: [itemData.project_id, itemData.name, itemData.address, itemData.description, itemData.source_unit || null],
      };
    },
    buildUpdateQuery(tableName, itemData, id) {
      // Build dynamic update query based on itemData fields
      const allowedFields = [
        "name",
        "address",
        "description",
        "source_unit",
        "color1",
        "color2",
        "color3",
        "color4",
        "color5",
        "color6",
        "color7",
        "color8",
        "color9",
        "color10",
        "color11",
        "color12",
        "color13",
        "color14",
        "color15",
        "color16",
      ];

      const fieldsToUpdate = [];
      const params = [];

      allowedFields.forEach((field) => {
        if (itemData.hasOwnProperty(field)) {
          fieldsToUpdate.push(`${field} = ?`);
          params.push(itemData[field]);
        }
      });

      if (fieldsToUpdate.length === 0) {
        throw new Error("No fields to update");
      }

      fieldsToUpdate.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);

      return {
        sql: `UPDATE ${tableName} SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
        params: params,
      };
    },
  },
};

// ============================================================================
// PARSING HELPERS
// ============================================================================

function parseUnitItem(item) {
  return {
    ...item,
    rs485_config: item.rs485_config ? JSON.parse(item.rs485_config) : null,
    input_configs: item.input_configs ? JSON.parse(item.input_configs) : null,
    output_configs: item.output_configs ? JSON.parse(item.output_configs) : null,
  };
}

// ============================================================================
// GENERIC CRUD OPERATIONS
// ============================================================================

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
      let orderBy = "CAST(address AS INTEGER) ASC";

      if (tableName === "unit") {
        orderBy = "created_at DESC";
      } else if (tableName === "schedule") {
        orderBy = "name ASC";
      }

      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY ${orderBy}`);
      const items = stmt.all(projectId);

      // Parse JSON for unit items
      if (tableName === "unit") {
        return items.map(parseUnitItem);
      }

      return items;
    } catch (error) {
      throw error;
    }
  },

  getProjectItemById(id, tableName) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      const item = stmt.get(id);

      // Parse JSON for unit items
      if (tableName === "unit" && item) {
        return parseUnitItem(item);
      }

      return item;
    } catch (error) {
      throw error;
    }
  },

  createProjectItem(projectId, itemData, tableName) {
    try {
      const validator = new ValidationHelper(this.db);
      const config = tableConfigs[tableName];

      // Special handling for curtain (uses createCurtainItem)
      if (tableName === "curtain") {
        return this.createCurtainItem(projectId, itemData);
      }

      // Special handling for KNX (uses createKnxItemInline)
      if (tableName === "knx") {
        this.validateKnxItem(projectId, itemData.address, itemData);
        return this.createKnxItemInline(projectId, itemData);
      }

      // Use table config if available
      if (config) {
        // Run validation
        if (config.validateCreate) {
          config.validateCreate(validator, projectId, itemData);
        }

        // Build and execute insert query
        const query = config.buildInsertQuery(tableName, { ...itemData, project_id: projectId });
        const result = this.db.prepare(query.sql).run(...query.params);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      }

      // Fallback for tables without config (use default object_type/object_value structure)
      const object_value = getObjectValue(itemData.object_type);
      const stmt = this.db.prepare(`
        INSERT INTO ${tableName} (project_id, name, address, description, object_type, object_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(projectId, itemData.name, itemData.address, itemData.description, itemData.object_type, object_value);
      return this.getProjectItemById(result.lastInsertRowid, tableName);
    } catch (error) {
      console.error(`Failed to create ${tableName} item:`, error);
      throw error;
    }
  },

  updateProjectItem(id, itemData, tableName) {
    try {
      const validator = new ValidationHelper(this.db);
      const currentItem = this.getProjectItemById(id, tableName);

      if (!currentItem) {
        throw new Error(`${tableName} item not found`);
      }

      const config = tableConfigs[tableName];

      // Special handling for curtain
      if (tableName === "curtain") {
        if (config.validateUpdate) {
          config.validateUpdate(validator, currentItem.project_id, currentItem, itemData, id);
        }
        const query = config.buildUpdateQuery(tableName, itemData, id);
        const result = this.db.prepare(query.sql).run(...query.params);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // Update scene items if address changed
        if (currentItem.address !== itemData.address) {
          this.updateSceneItemsAddress(id, tableName, itemData.address);
        }

        return this.getProjectItemById(id, tableName);
      }

      // Special handling for KNX
      if (tableName === "knx") {
        if (currentItem.address !== itemData.address) {
          this.validateKnxItem(currentItem.project_id, itemData.address, itemData, id);
        } else if (itemData.factor && itemData.factor < 1) {
          throw new Error("Factor must be greater than or equal to 1.");
        }
        return this.updateKnxItemInline(id, itemData);
      }

      // Use table config if available
      if (config) {
        // Run validation
        if (config.validateUpdate) {
          config.validateUpdate(validator, currentItem.project_id, currentItem, itemData, id);
        }

        // Build and execute update query
        const query = config.buildUpdateQuery(tableName, itemData, id);
        const result = this.db.prepare(query.sql).run(...query.params);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // Update scene items if address changed and table supports scene integration
        if (TABLES_WITH_SCENE_INTEGRATION.includes(tableName) && currentItem.address !== itemData.address) {
          console.log(`Updating scene items for ${tableName} ${id}: ${currentItem.address} -> ${itemData.address}`);
          this.updateSceneItemsAddress(id, tableName, itemData.address);
        }

        return this.getProjectItemById(id, tableName);
      }

      // Fallback for tables without config
      const object_value = getObjectValue(itemData.object_type);
      const stmt = this.db.prepare(`
        UPDATE ${tableName}
        SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      const result = stmt.run(itemData.name, itemData.address, itemData.description, itemData.object_type, object_value, id);

      if (result.changes === 0) {
        throw new Error(`${tableName} item not found`);
      }

      // Update scene items if address changed for lighting
      if (tableName === "lighting" && currentItem.address !== itemData.address) {
        console.log(`Updating scene items for ${tableName} ${id}: ${currentItem.address} -> ${itemData.address}`);
        this.updateSceneItemsAddress(id, tableName, itemData.address);
      }

      return this.getProjectItemById(id, tableName);
    } catch (error) {
      console.error(`Failed to update ${tableName} item:`, error);
      throw error;
    }
  },

  deleteProjectItem(id, tableName) {
    try {
      const transaction = this.db.transaction(() => {
        // For tables with scene integration, remove from scene_items and scene_address_items
        if (TABLES_WITH_SCENE_INTEGRATION.includes(tableName)) {
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

          const deleteAddressItemStmt = this.db.prepare(`
            DELETE FROM scene_address_items
            WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ?
          `);

          for (const sceneItem of sceneItems) {
            deleteAddressItemStmt.run(sceneItem.project_id, sceneItem.address, sceneItem.item_type, sceneItem.item_id);
          }

          const deleteSceneItemStmt = this.db.prepare(`DELETE FROM scene_items WHERE item_type = ? AND item_id = ?`);
          deleteSceneItemStmt.run(tableName, id);
        }

        // Delete the main item (CASCADE DELETE handles related records)
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

      // Add object_type for tables that use it
      if (TABLES_WITH_OBJECT_TYPE.includes(tableName)) {
        duplicatedItem.object_type = originalItem.object_type;
      }

      // Table-specific duplicate logic
      const tablesWithUniqueAddress = ["lighting", "aircon", "curtain", "scene"];
      if (tablesWithUniqueAddress.includes(tableName) && originalItem.address) {
        duplicatedItem.address = findNextAvailableAddress(this.db, originalItem.project_id, tableName);
      }

      // Special handling for aircon
      if (tableName === "aircon") {
        duplicatedItem.label = originalItem.label;
      }

      // Special handling for curtain
      if (tableName === "curtain") {
        duplicatedItem.curtain_type = originalItem.curtain_type || "CURTAIN_PULSE_2P";
        duplicatedItem.curtain_value = originalItem.curtain_value || 3;
        duplicatedItem.open_group_id = originalItem.open_group_id || null;
        duplicatedItem.close_group_id = originalItem.close_group_id || null;
        duplicatedItem.stop_group_id = originalItem.stop_group_id || null;
        duplicatedItem.pause_period = originalItem.pause_period || 0;
        duplicatedItem.transition_period = originalItem.transition_period || 0;
      }

      // Special handling for KNX
      if (tableName === "knx") {
        return this.createProjectItem(originalItem.project_id, this.duplicateKnxItem(originalItem), tableName);
      }

      // Special handling for multi_scenes
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
