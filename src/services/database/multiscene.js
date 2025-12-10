/**
 * Multi-Scene Database Module
 * Contains all table schemas and methods related to multi-scenes
 */

// Table creation SQL statements
export const multisceneTableSchemas = {
  createMultiScenesTable: `
    CREATE TABLE IF NOT EXISTS multi_scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      type INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,

  createMultiSceneScenesTable: `
    CREATE TABLE IF NOT EXISTS multi_scene_scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      multi_scene_id INTEGER NOT NULL,
      scene_id INTEGER NOT NULL,
      scene_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (multi_scene_id) REFERENCES multi_scenes (id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scene (id) ON DELETE CASCADE
    )
  `,
};

// Multi-scene related methods that will be mixed into DatabaseService
export const multisceneMethods = {
  // Multi-Scene management methods
  getMultiSceneScenes(multiSceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT mss.*, s.name as scene_name, s.address as scene_address
        FROM multi_scene_scenes mss
        JOIN scene s ON mss.scene_id = s.id
        WHERE mss.multi_scene_id = ?
        ORDER BY mss.scene_order ASC
      `);
      return stmt.all(multiSceneId);
    } catch (error) {
      console.error("Failed to get multi-scene scenes:", error);
      throw error;
    }
  },

  addSceneToMultiScene(multiSceneId, sceneId, sceneOrder = 0) {
    try {
      // Get the address of the scene being added
      const sceneToAdd = this.db
        .prepare("SELECT address FROM scene WHERE id = ?")
        .get(sceneId);

      if (!sceneToAdd) {
        throw new Error("Scene not found.");
      }

      // Check if multi-scene already has 20 unique addresses
      const uniqueAddresses = this.db
        .prepare(
          `
          SELECT COUNT(DISTINCT s.address) as count
          FROM multi_scene_scenes mss
          JOIN scene s ON mss.scene_id = s.id
          WHERE mss.multi_scene_id = ?
        `
        )
        .get(multiSceneId);

      // Check if this address is already in the multi-scene
      const addressExists = this.db
        .prepare(
          `
          SELECT COUNT(*) as count
          FROM multi_scene_scenes mss
          JOIN scene s ON mss.scene_id = s.id
          WHERE mss.multi_scene_id = ? AND s.address = ?
        `
        )
        .get(multiSceneId, sceneToAdd.address);

      // If this is a new address and we already have 20 addresses, reject
      if (addressExists.count === 0 && uniqueAddresses.count >= 20) {
        throw new Error("Maximum 20 addresses allowed per multi-scene.");
      }

      // Check if scene is already in this multi-scene
      const existingScene = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM multi_scene_scenes WHERE multi_scene_id = ? AND scene_id = ?"
        )
        .get(multiSceneId, sceneId);
      if (existingScene.count > 0) {
        throw new Error("Scene is already in this multi-scene.");
      }

      const stmt = this.db.prepare(`
        INSERT INTO multi_scene_scenes (multi_scene_id, scene_id, scene_order)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(multiSceneId, sceneId, sceneOrder);
      return {
        id: result.lastInsertRowid,
        multi_scene_id: multiSceneId,
        scene_id: sceneId,
        scene_order: sceneOrder,
      };
    } catch (error) {
      console.error("Failed to add scene to multi-scene:", error);
      throw error;
    }
  },

  removeSceneFromMultiScene(multiSceneId, sceneId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM multi_scene_scenes
        WHERE multi_scene_id = ? AND scene_id = ?
      `);
      const result = stmt.run(multiSceneId, sceneId);

      if (result.changes === 0) {
        throw new Error("Scene not found in multi-scene");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to remove scene from multi-scene:", error);
      throw error;
    }
  },

  updateMultiSceneScenes(multiSceneId, sceneIds) {
    try {
      // Start transaction for atomic operation
      const transaction = this.db.transaction(() => {
        // Remove all existing scenes from multi-scene
        this.db
          .prepare("DELETE FROM multi_scene_scenes WHERE multi_scene_id = ?")
          .run(multiSceneId);

        // Add new scenes with order
        sceneIds.forEach((sceneId, index) => {
          this.addSceneToMultiScene(multiSceneId, sceneId, index);
        });
      });

      transaction();
      return { success: true };
    } catch (error) {
      console.error("Failed to update multi-scene scenes:", error);
      throw error;
    }
  },

  // Find multi_scene ID by address in the new project
  findMultiSceneIdByAddress(projectId, address) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM multi_scenes
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(
        `Failed to find multi_scene ID for address ${address}:`,
        error
      );
      return null;
    }
  },
};
