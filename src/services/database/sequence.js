/**
 * Sequence Database Module
 * Contains all table schemas and methods related to sequences
 */

// Table creation SQL statements
export const sequenceTableSchemas = {
  createSequencesTable: `
    CREATE TABLE IF NOT EXISTS sequences (
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

  createSequenceMultiScenesTable: `
    CREATE TABLE IF NOT EXISTS sequence_multi_scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sequence_id INTEGER NOT NULL,
      multi_scene_id INTEGER NOT NULL,
      multi_scene_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sequence_id) REFERENCES sequences (id) ON DELETE CASCADE,
      FOREIGN KEY (multi_scene_id) REFERENCES multi_scenes (id) ON DELETE CASCADE
    )
  `,
};

// Sequence-related methods that will be mixed into DatabaseService
export const sequenceMethods = {
  // Sequence management methods
  getSequenceMultiScenes(sequenceId) {
    try {
      const stmt = this.db.prepare(`
        SELECT sms.*, ms.name as multi_scene_name, ms.address as multi_scene_address
        FROM sequence_multi_scenes sms
        JOIN multi_scenes ms ON sms.multi_scene_id = ms.id
        WHERE sms.sequence_id = ?
        ORDER BY sms.multi_scene_order ASC
      `);
      return stmt.all(sequenceId);
    } catch (error) {
      console.error("Failed to get sequence multi-scenes:", error);
      throw error;
    }
  },

  addMultiSceneToSequence(sequenceId, multiSceneId, multiSceneOrder = 0) {
    try {
      // Check if sequence already has 20 multi-scenes
      const multiSceneCount = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM sequence_multi_scenes WHERE sequence_id = ?"
        )
        .get(sequenceId);
      if (multiSceneCount.count >= 20) {
        throw new Error("Maximum 20 multi-scenes allowed per sequence.");
      }

      // Check if multi-scene is already in this sequence
      const existingMultiScene = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM sequence_multi_scenes WHERE sequence_id = ? AND multi_scene_id = ?"
        )
        .get(sequenceId, multiSceneId);
      if (existingMultiScene.count > 0) {
        throw new Error("Multi-scene is already in this sequence.");
      }

      const stmt = this.db.prepare(`
        INSERT INTO sequence_multi_scenes (sequence_id, multi_scene_id, multi_scene_order)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(sequenceId, multiSceneId, multiSceneOrder);
      return {
        id: result.lastInsertRowid,
        sequence_id: sequenceId,
        multi_scene_id: multiSceneId,
        multi_scene_order: multiSceneOrder,
      };
    } catch (error) {
      console.error("Failed to add multi-scene to sequence:", error);
      throw error;
    }
  },

  removeMultiSceneFromSequence(sequenceId, multiSceneId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM sequence_multi_scenes
        WHERE sequence_id = ? AND multi_scene_id = ?
      `);
      const result = stmt.run(sequenceId, multiSceneId);

      if (result.changes === 0) {
        throw new Error("Multi-scene not found in sequence");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to remove multi-scene from sequence:", error);
      throw error;
    }
  },

  updateSequenceMultiScenes(sequenceId, multiSceneIds) {
    try {
      // Start transaction for atomic operation
      const transaction = this.db.transaction(() => {
        // Remove all existing multi-scenes from sequence
        this.db
          .prepare("DELETE FROM sequence_multi_scenes WHERE sequence_id = ?")
          .run(sequenceId);

        // Add new multi-scenes with order
        multiSceneIds.forEach((multiSceneId, index) => {
          this.addMultiSceneToSequence(sequenceId, multiSceneId, index);
        });
      });

      transaction();
      return { success: true };
    } catch (error) {
      console.error("Failed to update sequence multi-scenes:", error);
      throw error;
    }
  },

  // Find sequence ID by address in the new project
  findSequenceIdByAddress(projectId, address) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM sequences
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(
        `Failed to find sequence ID for address ${address}:`,
        error
      );
      return null;
    }
  },
};
