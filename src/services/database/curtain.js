/**
 * Curtain Database Module
 * Contains all table schemas and methods related to curtain devices
 */

// Table creation SQL statements
export const curtainTableSchemas = {
  createCurtainTable: `
    CREATE TABLE IF NOT EXISTS curtain (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT,
      address TEXT NOT NULL,
      description TEXT,
      object_type TEXT DEFAULT 'OBJ_CURTAIN',
      object_value INTEGER DEFAULT 2,
      curtain_type TEXT DEFAULT '',
      curtain_value INTEGER DEFAULT 0,
      open_group_id INTEGER,
      close_group_id INTEGER,
      stop_group_id INTEGER,
      pause_period INTEGER DEFAULT 0,
      transition_period INTEGER DEFAULT 0,
      source_unit INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (open_group_id) REFERENCES lighting (id) ON DELETE SET NULL,
      FOREIGN KEY (close_group_id) REFERENCES lighting (id) ON DELETE SET NULL,
      FOREIGN KEY (stop_group_id) REFERENCES lighting (id) ON DELETE SET NULL,
      FOREIGN KEY (source_unit) REFERENCES unit (id) ON DELETE SET NULL
    )
  `,
};

// Curtain-related methods that will be mixed into DatabaseService
export const curtainMethods = {
  // Get all curtain items for a project
  getCurtainItems(projectId) {
    return this.getProjectItems(projectId, "curtain");
  },

  // Create a simple curtain item (uses generic createProjectItem)
  createCurtainItemSimple(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "curtain");
  },

  // Update a curtain item
  updateCurtainItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "curtain");
  },

  // Delete a curtain item
  deleteCurtainItem(id) {
    return this.deleteProjectItem(id, "curtain");
  },

  // Duplicate a curtain item
  duplicateCurtainItem(id) {
    return this.duplicateProjectItem(id, "curtain");
  },

  // Create Curtain item with special handling for lighting group references
  createCurtainItem(projectId, itemData) {
    try {
      const {
        name,
        address,
        description,
        object_type,
        curtain_type,
        curtain_value,
        open_group_id,
        close_group_id,
        stop_group_id,
        open_group_address, // New format
        close_group_address, // New format
        stop_group_address, // New format
        pause_period,
        transition_period,
      } = itemData;

      let finalOpenGroupId = null;
      let finalCloseGroupId = null;
      let finalStopGroupId = null;

      // Handle both old format (group_id) and new format (group_address)
      if (open_group_address) {
        finalOpenGroupId = this.findLightingIdByAddress(projectId, open_group_address);
      } else if (open_group_id) {
        finalOpenGroupId = open_group_id; // Backward compatibility
      }

      if (close_group_address) {
        finalCloseGroupId = this.findLightingIdByAddress(projectId, close_group_address);
      } else if (close_group_id) {
        finalCloseGroupId = close_group_id; // Backward compatibility
      }

      if (stop_group_address) {
        finalStopGroupId = this.findLightingIdByAddress(projectId, stop_group_address);
      } else if (stop_group_id) {
        finalStopGroupId = stop_group_id; // Backward compatibility
      }

      const object_value = this.getObjectValue(object_type);

      const stmt = this.db.prepare(`
        INSERT INTO curtain (project_id, name, address, description, object_type, object_value, curtain_type, curtain_value, open_group_id, close_group_id, stop_group_id, pause_period, transition_period, source_unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        projectId,
        name,
        address,
        description,
        object_type,
        object_value,
        curtain_type,
        curtain_value || 3, // Default to CURTAIN_PULSE_2P value
        finalOpenGroupId || null,
        finalCloseGroupId || null,
        finalStopGroupId || null,
        pause_period || 0,
        transition_period || 0,
        itemData.source_unit || null
      );

      return this.getProjectItemById(result.lastInsertRowid, "curtain");
    } catch (error) {
      console.error("Failed to create Curtain item:", error);
      throw error;
    }
  },

  // Find lighting ID by address in the new project
  findLightingIdByAddress(projectId, address) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM lighting
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(`Failed to find lighting ID for address ${address}:`, error);
      return null;
    }
  },
};
