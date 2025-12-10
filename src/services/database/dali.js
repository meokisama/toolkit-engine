/**
 * DALI Database Module
 * Contains all table schemas and methods related to DALI devices, groups, and scenes
 */

// Table creation SQL statements
export const daliTableSchemas = {
  // DALI Device Mapping Table - stores 64 fixed addresses (0-63)
  createDaliDevicesTable: `
    CREATE TABLE IF NOT EXISTS dali_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      address INTEGER NOT NULL CHECK(address >= 0 AND address <= 63),
      name TEXT,
      mapped_device_name TEXT,
      mapped_device_type INTEGER,
      mapped_device_index INTEGER,
      mapped_device_address INTEGER,
      lighting_group_address INTEGER,
      color_feature INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, address)
    )
  `,

  // DALI Groups Metadata Table - stores custom group names and RCU group address
  createDaliGroupsTable: `
    CREATE TABLE IF NOT EXISTS dali_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL CHECK(group_id >= 0 AND group_id <= 15),
      name TEXT NOT NULL,
      lighting_group_address INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, group_id)
    )
  `,

  // DALI Group-Device Relationship Table
  createDaliGroupDevicesTable: `
    CREATE TABLE IF NOT EXISTS dali_group_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL CHECK(group_id >= 0 AND group_id <= 15),
      device_address INTEGER NOT NULL CHECK(device_address >= 0 AND device_address <= 63),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, group_id, device_address)
    )
  `,

  // DALI Scenes Metadata Table - stores custom scene names
  createDaliScenesTable: `
    CREATE TABLE IF NOT EXISTS dali_scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      scene_id INTEGER NOT NULL CHECK(scene_id >= 0 AND scene_id <= 15),
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, scene_id)
    )
  `,

  // DALI Scene-Device Configuration Table
  createDaliSceneDevicesTable: `
    CREATE TABLE IF NOT EXISTS dali_scene_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      scene_id INTEGER NOT NULL CHECK(scene_id >= 0 AND scene_id <= 15),
      device_address INTEGER NOT NULL CHECK(device_address >= 0 AND device_address <= 63),
      active BOOLEAN DEFAULT 0,
      brightness INTEGER NOT NULL DEFAULT 255 CHECK(brightness >= 0 AND brightness <= 255),
      color_temp INTEGER CHECK(color_temp >= 1000 AND color_temp <= 10000),
      r INTEGER CHECK(r >= 0 AND r <= 254),
      g INTEGER CHECK(g >= 0 AND g <= 254),
      b INTEGER CHECK(b >= 0 AND b <= 254),
      w INTEGER CHECK(w >= 0 AND w <= 254),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, scene_id, device_address)
    )
  `,
};

// DALI-related methods that will be mixed into DatabaseService
export const daliMethods = {
  getAllDaliDevices(projectId) {
    try {
      const stmt = this.db.prepare(
        "SELECT * FROM dali_devices WHERE project_id = ? ORDER BY address"
      );
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all DALI devices:", error);
      throw error;
    }
  },

  getDaliDevice(projectId, address) {
    try {
      const stmt = this.db.prepare(
        "SELECT * FROM dali_devices WHERE project_id = ? AND address = ?"
      );
      return stmt.get(projectId, address);
    } catch (error) {
      console.error("Failed to get DALI device:", error);
      throw error;
    }
  },

  upsertDaliDevice(projectId, address, deviceData) {
    try {
      const {
        name,
        mapped_device_name,
        mapped_device_type,
        mapped_device_index,
        mapped_device_address,
        lighting_group_address,
        color_feature,
      } = deviceData;

      const stmt = this.db.prepare(`
        INSERT INTO dali_devices (
          project_id, address, name,
          mapped_device_name, mapped_device_type, mapped_device_index, mapped_device_address,
          lighting_group_address, color_feature
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id, address)
        DO UPDATE SET
          name = excluded.name,
          mapped_device_name = excluded.mapped_device_name,
          mapped_device_type = excluded.mapped_device_type,
          mapped_device_index = excluded.mapped_device_index,
          mapped_device_address = excluded.mapped_device_address,
          lighting_group_address = excluded.lighting_group_address,
          color_feature = excluded.color_feature,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(
        projectId,
        address,
        name || null,
        mapped_device_name || null,
        mapped_device_type || null,
        mapped_device_index !== undefined ? mapped_device_index : null,
        mapped_device_address !== undefined ? mapped_device_address : null,
        lighting_group_address !== undefined ? lighting_group_address : null,
        color_feature !== undefined ? color_feature : null
      );

      return this.getDaliDevice(projectId, address);
    } catch (error) {
      console.error("Failed to upsert DALI device:", error);
      throw error;
    }
  },

  updateDaliDeviceName(projectId, address, name) {
    try {
      const stmt = this.db.prepare(`
        UPDATE dali_devices
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND address = ?
      `);

      stmt.run(name, projectId, address);
      return this.getDaliDevice(projectId, address);
    } catch (error) {
      console.error("Failed to update DALI device name:", error);
      throw error;
    }
  },

  clearDaliDeviceMapping(projectId, address) {
    try {
      const stmt = this.db.prepare(
        "DELETE FROM dali_devices WHERE project_id = ? AND address = ?"
      );
      const result = stmt.run(projectId, address);

      return { success: true, deleted: result.changes > 0 };
    } catch (error) {
      console.error("Failed to clear DALI device mapping:", error);
      throw error;
    }
  },

  deleteDaliDevice(projectId, address) {
    try {
      const stmt = this.db.prepare(
        "DELETE FROM dali_devices WHERE project_id = ? AND address = ?"
      );
      const result = stmt.run(projectId, address);

      return { success: true, deleted: result.changes > 0 };
    } catch (error) {
      console.error("Failed to delete DALI device:", error);
      throw error;
    }
  },

  // ===== DALI Group Metadata Methods =====

  getDaliGroupName(projectId, groupId) {
    try {
      const stmt = this.db.prepare(`
        SELECT name FROM dali_groups
        WHERE project_id = ? AND group_id = ?
      `);
      const row = stmt.get(projectId, groupId);
      return row ? row.name : `Group ${groupId}`;
    } catch (error) {
      console.error("Failed to get DALI group name:", error);
      throw error;
    }
  },

  getAllDaliGroupNames(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT group_id, name, lighting_group_address FROM dali_groups
        WHERE project_id = ?
        ORDER BY group_id
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all DALI group names:", error);
      throw error;
    }
  },

  updateDaliGroupName(projectId, groupId, name) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO dali_groups (project_id, group_id, name)
        VALUES (?, ?, ?)
        ON CONFLICT(project_id, group_id)
        DO UPDATE SET
          name = excluded.name,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(projectId, groupId, name);
      return { success: true, name };
    } catch (error) {
      console.error("Failed to update DALI group name:", error);
      throw error;
    }
  },

  // Initialize 16 DALI groups for a project with default lighting_group_address 100-115
  initializeDaliGroups(projectId) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO dali_groups (project_id, group_id, name, lighting_group_address)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(project_id, group_id) DO NOTHING
      `);

      const transaction = this.db.transaction(() => {
        for (let i = 0; i < 16; i++) {
          stmt.run(projectId, i, `Group ${i}`, 100 + i);
        }
      });

      transaction();
      return { success: true };
    } catch (error) {
      console.error("Failed to initialize DALI groups:", error);
      throw error;
    }
  },

  // Update group's lighting_group_address (RCU Group)
  updateDaliGroupLightingAddress(projectId, groupId, lightingGroupAddress) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO dali_groups (project_id, group_id, name, lighting_group_address)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(project_id, group_id)
        DO UPDATE SET
          lighting_group_address = excluded.lighting_group_address,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(projectId, groupId, `Group ${groupId}`, lightingGroupAddress);
      return { success: true, lightingGroupAddress };
    } catch (error) {
      console.error("Failed to update DALI group lighting address:", error);
      throw error;
    }
  },

  // Update device's lighting_group_address in mapped device
  updateDaliDeviceLightingAddress(projectId, address, lightingGroupAddress) {
    try {
      const stmt = this.db.prepare(`
        UPDATE dali_devices
        SET lighting_group_address = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND address = ?
      `);

      const result = stmt.run(lightingGroupAddress, projectId, address);
      if (result.changes === 0) {
        throw new Error("DALI device not found");
      }
      return { success: true, lightingGroupAddress };
    } catch (error) {
      console.error("Failed to update DALI device lighting address:", error);
      throw error;
    }
  },

  // ===== DALI Group Methods =====

  getDaliGroupDevices(projectId, groupId) {
    try {
      const stmt = this.db.prepare(`
        SELECT device_address
        FROM dali_group_devices
        WHERE project_id = ? AND group_id = ?
        ORDER BY device_address
      `);
      return stmt.all(projectId, groupId).map((row) => row.device_address);
    } catch (error) {
      console.error("Failed to get DALI group devices:", error);
      throw error;
    }
  },

  getAllDaliGroupDevices(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT group_id, device_address
        FROM dali_group_devices
        WHERE project_id = ?
        ORDER BY group_id, device_address
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all DALI group devices:", error);
      throw error;
    }
  },

  addDaliDeviceToGroup(projectId, groupId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO dali_group_devices (project_id, group_id, device_address)
        VALUES (?, ?, ?)
      `);

      stmt.run(projectId, groupId, deviceAddress);
      return { success: true };
    } catch (error) {
      console.error("Failed to add DALI device to group:", error);
      throw error;
    }
  },

  removeDaliDeviceFromGroup(projectId, groupId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM dali_group_devices
        WHERE project_id = ? AND group_id = ? AND device_address = ?
      `);

      const result = stmt.run(projectId, groupId, deviceAddress);
      return { success: true, deleted: result.changes > 0 };
    } catch (error) {
      console.error("Failed to remove DALI device from group:", error);
      throw error;
    }
  },

  getDaliDeviceGroups(projectId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        SELECT group_id
        FROM dali_group_devices
        WHERE project_id = ? AND device_address = ?
        ORDER BY group_id
      `);
      return stmt.all(projectId, deviceAddress).map((row) => row.group_id);
    } catch (error) {
      console.error("Failed to get DALI device groups:", error);
      throw error;
    }
  },

  // ===== DALI Scene Metadata Methods =====

  getDaliSceneName(projectId, sceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT name FROM dali_scenes
        WHERE project_id = ? AND scene_id = ?
      `);
      const row = stmt.get(projectId, sceneId);
      return row ? row.name : `Scene ${sceneId}`;
    } catch (error) {
      console.error("Failed to get DALI scene name:", error);
      throw error;
    }
  },

  getAllDaliSceneNames(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT scene_id, name FROM dali_scenes
        WHERE project_id = ?
        ORDER BY scene_id
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all DALI scene names:", error);
      throw error;
    }
  },

  updateDaliSceneName(projectId, sceneId, name) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO dali_scenes (project_id, scene_id, name)
        VALUES (?, ?, ?)
        ON CONFLICT(project_id, scene_id)
        DO UPDATE SET
          name = excluded.name,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(projectId, sceneId, name);
      return { success: true, name };
    } catch (error) {
      console.error("Failed to update DALI scene name:", error);
      throw error;
    }
  },

  // ===== DALI Scene Methods =====

  getDaliSceneDevices(projectId, sceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT device_address, active, brightness
        FROM dali_scene_devices
        WHERE project_id = ? AND scene_id = ?
        ORDER BY device_address
      `);
      return stmt.all(projectId, sceneId);
    } catch (error) {
      console.error("Failed to get DALI scene devices:", error);
      throw error;
    }
  },

  getAllDaliSceneDevices(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT scene_id, device_address, active, brightness, color_temp, r, g, b, w
        FROM dali_scene_devices
        WHERE project_id = ?
        ORDER BY scene_id, device_address
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all DALI scene devices:", error);
      throw error;
    }
  },

  upsertDaliSceneDevice(
    projectId,
    sceneId,
    deviceAddress,
    active,
    brightness,
    colorTemp = null,
    r = null,
    g = null,
    b = null,
    w = null
  ) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO dali_scene_devices (
          project_id, scene_id, device_address, active, brightness, color_temp, r, g, b, w
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id, scene_id, device_address)
        DO UPDATE SET
          active = excluded.active,
          brightness = excluded.brightness,
          color_temp = excluded.color_temp,
          r = excluded.r,
          g = excluded.g,
          b = excluded.b,
          w = excluded.w,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(
        projectId,
        sceneId,
        deviceAddress,
        active ? 1 : 0,
        brightness,
        colorTemp,
        r,
        g,
        b,
        w
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to upsert DALI scene device:", error);
      throw error;
    }
  },

  deleteDaliSceneDevice(projectId, sceneId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM dali_scene_devices
        WHERE project_id = ? AND scene_id = ? AND device_address = ?
      `);

      const result = stmt.run(projectId, sceneId, deviceAddress);
      return { success: true, deleted: result.changes > 0 };
    } catch (error) {
      console.error("Failed to delete DALI scene device:", error);
      throw error;
    }
  },

  // ===== DALI Clear All Configurations =====

  /**
   * Clear all device mappings for a project
   * Deletes all devices with mappings
   */
  clearAllDaliDeviceMappings(projectId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM dali_devices
        WHERE project_id = ? AND mapped_device_address IS NOT NULL
      `);

      const result = stmt.run(projectId);
      return { success: true, cleared: result.changes };
    } catch (error) {
      console.error("Failed to clear all DALI device mappings:", error);
      throw error;
    }
  },

  /**
   * Clear all group configurations for a project
   * Deletes all group metadata and group-device relationships
   */
  clearAllDaliGroups(projectId) {
    try {
      // Delete group-device relationships
      const deleteRelationships = this.db.prepare(`
        DELETE FROM dali_group_devices WHERE project_id = ?
      `);

      // Delete group metadata (names)
      const deleteMetadata = this.db.prepare(`
        DELETE FROM dali_groups WHERE project_id = ?
      `);

      const relationshipsResult = deleteRelationships.run(projectId);
      const metadataResult = deleteMetadata.run(projectId);

      return {
        success: true,
        clearedRelationships: relationshipsResult.changes,
        clearedMetadata: metadataResult.changes,
      };
    } catch (error) {
      console.error("Failed to clear all DALI groups:", error);
      throw error;
    }
  },

  /**
   * Clear all scene configurations for a project
   * Deletes all scene metadata and scene-device configurations
   */
  clearAllDaliScenes(projectId) {
    try {
      // Delete scene-device configurations
      const deleteDevices = this.db.prepare(`
        DELETE FROM dali_scene_devices WHERE project_id = ?
      `);

      // Delete scene metadata (names)
      const deleteMetadata = this.db.prepare(`
        DELETE FROM dali_scenes WHERE project_id = ?
      `);

      const devicesResult = deleteDevices.run(projectId);
      const metadataResult = deleteMetadata.run(projectId);

      return {
        success: true,
        clearedDevices: devicesResult.changes,
        clearedMetadata: metadataResult.changes,
      };
    } catch (error) {
      console.error("Failed to clear all DALI scenes:", error);
      throw error;
    }
  },

  /**
   * Clear all DALI configurations for a project
   * Clears device mappings, groups, and scenes
   */
  clearAllDaliConfigurations(projectId) {
    try {
      const mappingsResult = this.clearAllDaliDeviceMappings(projectId);
      const groupsResult = this.clearAllDaliGroups(projectId);
      const scenesResult = this.clearAllDaliScenes(projectId);

      return {
        success: true,
        mappings: mappingsResult,
        groups: groupsResult,
        scenes: scenesResult,
      };
    } catch (error) {
      console.error("Failed to clear all DALI configurations:", error);
      throw error;
    }
  },
};
