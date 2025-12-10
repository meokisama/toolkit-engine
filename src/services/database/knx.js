/**
 * KNX Database Module
 * Contains all table schemas and methods related to KNX items
 */

// Table creation SQL statements
export const knxTableSchemas = {
  createKnxTable: `
    CREATE TABLE IF NOT EXISTS knx (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT,
      address INTEGER NOT NULL CHECK(address >= 0 AND address <= 511),
      type INTEGER NOT NULL DEFAULT 0,
      factor INTEGER NOT NULL DEFAULT 1 CHECK(factor >= 1),
      feedback INTEGER NOT NULL DEFAULT 0,
      rcu_group_id INTEGER,
      rcu_group_type TEXT,
      knx_switch_group TEXT,
      knx_dimming_group TEXT,
      knx_value_group TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, address)
    )
  `,
};

// Helper function to determine RCU group type from KNX type
function determineRcuGroupType(type) {
  const typeValue = parseInt(type) || 0;
  switch (typeValue) {
    case 1: // Switch
    case 2: // Dimmer
      return "lighting";
    case 3: // Curtain
      return "curtain";
    case 4: // Scene
      return "scene";
    case 5: // Multi Scene
      return "multi_scenes";
    case 6: // Sequences
      return "sequences";
    case 7: // AC Power
    case 8: // AC Mode
    case 9: // AC Fan Speed
    case 10: // AC Swing
    case 11: // AC Set Point
      return "aircon";
    default:
      return null;
  }
}

// KNX-related methods that will be mixed into DatabaseService
export const knxMethods = {
  // Validation for KNX items
  validateKnxItem(projectId, address, itemData, itemId = null) {
    // Validate address range
    if (address < 0 || address > 511) {
      throw new Error("KNX address must be between 0 and 511.");
    }

    // Check for duplicate addresses
    if (itemId === null) {
      // Creating new item
      const existingItems = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ?"
        )
        .get(projectId, address);
      if (existingItems.count > 0) {
        throw new Error(`KNX address ${address} already exists.`);
      }
    } else {
      // Updating existing item
      const currentItem = this.getProjectItemById(itemId, "knx");
      if (currentItem && currentItem.address !== address) {
        const existingItems = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ? AND id != ?"
          )
          .get(currentItem.project_id, address, itemId);
        if (existingItems.count > 0) {
          throw new Error(`KNX address ${address} already exists.`);
        }
      }
    }

    // Validate factor
    const factor = itemData.factor;
    if (factor && factor < 1) {
      throw new Error("Factor must be greater than or equal to 1.");
    }
  },

  // Create KNX item in createProjectItem
  createKnxItemInline(projectId, itemData) {
    const {
      name,
      address,
      type,
      factor,
      feedback,
      rcu_group_id,
      knx_switch_group,
      knx_dimming_group,
      knx_value_group,
      description,
    } = itemData;

    // Determine rcu_group_type based on KNX type
    let rcu_group_type = null;
    if (rcu_group_id) {
      rcu_group_type = determineRcuGroupType(type);
    }

    const stmt = this.db.prepare(`
      INSERT INTO knx (project_id, name, address, type, factor, feedback, rcu_group_id, rcu_group_type, knx_switch_group, knx_dimming_group, knx_value_group, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      projectId,
      name,
      address,
      type || 0,
      factor || 2,
      feedback || 0,
      rcu_group_id || null,
      rcu_group_type,
      knx_switch_group || null,
      knx_dimming_group || null,
      knx_value_group || null,
      description
    );
    return this.getProjectItemById(result.lastInsertRowid, "knx");
  },

  // Update KNX item in updateProjectItem
  updateKnxItemInline(id, itemData) {
    const {
      name,
      address,
      type,
      factor,
      feedback,
      rcu_group_id,
      knx_switch_group,
      knx_dimming_group,
      knx_value_group,
      description,
    } = itemData;

    // Determine rcu_group_type based on KNX type
    let rcu_group_type = null;
    if (rcu_group_id) {
      rcu_group_type = determineRcuGroupType(type);
    }

    const stmt = this.db.prepare(`
      UPDATE knx
      SET name = ?, address = ?, type = ?, factor = ?, feedback = ?, rcu_group_id = ?, rcu_group_type = ?, knx_switch_group = ?, knx_dimming_group = ?, knx_value_group = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(
      name,
      address,
      type || 0,
      factor || 2,
      feedback || 0,
      rcu_group_id || null,
      rcu_group_type,
      knx_switch_group || null,
      knx_dimming_group || null,
      knx_value_group || null,
      description,
      id
    );

    if (result.changes === 0) {
      throw new Error("knx item not found");
    }

    return this.getProjectItemById(id, "knx");
  },

  // Duplicate KNX item logic
  duplicateKnxItem(originalItem) {
    const duplicatedItem = { ...originalItem };
    delete duplicatedItem.id;
    delete duplicatedItem.created_at;
    delete duplicatedItem.updated_at;

    // For KNX, find a unique address if address exists
    if (
      originalItem.address !== null &&
      originalItem.address !== undefined
    ) {
      // For KNX, find next available address in range 0-511
      let newAddress = originalItem.address;
      do {
        newAddress = (newAddress + 1) % 512;
      } while (
        this.db
          .prepare(
            "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ?"
          )
          .get(originalItem.project_id, newAddress).count > 0 &&
        newAddress !== originalItem.address
      );

      duplicatedItem.address = newAddress;

      // Copy KNX-specific fields
      duplicatedItem.type = originalItem.type || 0;
      duplicatedItem.factor = originalItem.factor || 2;
      duplicatedItem.feedback = originalItem.feedback || 0;
      duplicatedItem.rcu_group_id = originalItem.rcu_group_id || null;
      duplicatedItem.knx_switch_group = originalItem.knx_switch_group || null;
      duplicatedItem.knx_dimming_group =
        originalItem.knx_dimming_group || null;
      duplicatedItem.knx_value_group = originalItem.knx_value_group || null;
    }

    return duplicatedItem;
  },

  // Create KNX item with special handling for RCU group references
  createKnxItem(projectId, itemData) {
    try {
      const {
        name,
        address,
        type,
        factor,
        feedback,
        rcu_group_id,
        rcu_group_address, // New format
        rcu_group_type,
        knx_switch_group,
        knx_dimming_group,
        knx_value_group,
        description,
      } = itemData;

      let finalRcuGroupId = null;
      let finalRcuGroupType = null;

      // Handle both old format (rcu_group_id) and new format (rcu_group_address)
      if (rcu_group_address && rcu_group_type) {
        // New format: lookup ID by address
        finalRcuGroupId = this.findRcuGroupIdByAddress(
          projectId,
          rcu_group_address,
          rcu_group_type
        );
        finalRcuGroupType = rcu_group_type;
      } else if (rcu_group_id && rcu_group_type) {
        // Old format: use ID directly (for backward compatibility)
        finalRcuGroupId = rcu_group_id;
        finalRcuGroupType = rcu_group_type;
      } else if (rcu_group_id) {
        // Very old format: determine type from KNX type
        finalRcuGroupId = rcu_group_id;
        finalRcuGroupType = determineRcuGroupType(type);
      }

      const stmt = this.db.prepare(`
        INSERT INTO knx (project_id, name, address, type, factor, feedback, rcu_group_id, rcu_group_type, knx_switch_group, knx_dimming_group, knx_value_group, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        projectId,
        name,
        address,
        type || 0,
        factor || 2,
        feedback || 0,
        finalRcuGroupId || null,
        finalRcuGroupType,
        knx_switch_group || null,
        knx_dimming_group || null,
        knx_value_group || null,
        description
      );

      return this.getProjectItemById(result.lastInsertRowid, "knx");
    } catch (error) {
      console.error("Failed to create KNX item:", error);
      throw error;
    }
  },

  // Update KNX items to resolve RCU group addresses to new IDs
  updateKnxRcuGroupReferences(projectId, itemsData) {
    try {
      const knxItems = itemsData.knx || [];

      knxItems.forEach((knxItem) => {
        // Check if this KNX item has rcu_group_address (new format)
        if (knxItem.rcu_group_address && knxItem.rcu_group_type) {
          const newRcuGroupId = this.findRcuGroupIdByAddress(
            projectId,
            knxItem.rcu_group_address,
            knxItem.rcu_group_type
          );

          if (newRcuGroupId) {
            // Update the KNX item with the new RCU group ID
            const stmt = this.db.prepare(`
              UPDATE knx
              SET rcu_group_id = ?
              WHERE project_id = ? AND address = ?
            `);
            stmt.run(newRcuGroupId, projectId, knxItem.address);
          }
        }
      });
    } catch (error) {
      console.error("Failed to update KNX RCU group references:", error);
      throw error;
    }
  },

  // Find RCU group ID by address and type in the new project
  findRcuGroupIdByAddress(projectId, address, rcuGroupType) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM ${rcuGroupType}
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(
        `Failed to find RCU group ID for ${rcuGroupType} address ${address}:`,
        error
      );
      return null;
    }
  },
};
