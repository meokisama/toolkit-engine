/**
 * Schedule Database Module
 * Contains all table schemas and methods related to schedules
 */

// Table creation SQL statements
export const scheduleTableSchemas = {
  createScheduleTable: `
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT,
      description TEXT,
      time TEXT NOT NULL,
      days TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,
};

// Schedule-related methods that will be mixed into DatabaseService
export const scheduleMethods = {
  // Schedule CRUD operations
  getScheduleItems(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM schedule
        WHERE project_id = ?
        ORDER BY name ASC
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get schedule items:", error);
      throw error;
    }
  },

  createScheduleItem(projectId, itemData) {
    try {
      // Check maximum schedule limit (32 schedules)
      const scheduleCount = this.db
        .prepare("SELECT COUNT(*) as count FROM schedule WHERE project_id = ?")
        .get(projectId);
      if (scheduleCount.count >= 32) {
        throw new Error("Maximum 32 schedules allowed per project.");
      }

      const stmt = this.db.prepare(`
        INSERT INTO schedule (project_id, name, description, time, days, enabled)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Convert boolean to integer for SQLite
      const enabledValue =
        itemData.enabled !== undefined ? (itemData.enabled ? 1 : 0) : 1;

      const result = stmt.run(
        projectId,
        itemData.name,
        itemData.description,
        itemData.time,
        JSON.stringify(itemData.days),
        enabledValue
      );

      // Return the created schedule item
      const getStmt = this.db.prepare("SELECT * FROM schedule WHERE id = ?");
      return getStmt.get(result.lastInsertRowid);
    } catch (error) {
      console.error("Failed to create schedule item:", error);
      throw error;
    }
  },

  updateScheduleItem(id, itemData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE schedule
        SET name = ?, description = ?, time = ?, days = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      // Convert boolean to integer for SQLite
      const enabledValue =
        itemData.enabled !== undefined ? (itemData.enabled ? 1 : 0) : 1;

      const result = stmt.run(
        itemData.name,
        itemData.description,
        itemData.time,
        JSON.stringify(itemData.days),
        enabledValue,
        id
      );

      if (result.changes === 0) {
        throw new Error("Schedule item not found");
      }

      // Return updated schedule item
      const getStmt = this.db.prepare("SELECT * FROM schedule WHERE id = ?");
      return getStmt.get(id);
    } catch (error) {
      console.error("Failed to update schedule item:", error);
      throw error;
    }
  },

  deleteScheduleItem(id) {
    try {
      const stmt = this.db.prepare("DELETE FROM schedule WHERE id = ?");
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error("Schedule item not found");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to delete schedule item:", error);
      throw error;
    }
  },

  duplicateScheduleItem(id) {
    try {
      // Get original schedule item
      const getStmt = this.db.prepare("SELECT * FROM schedule WHERE id = ?");
      const original = getStmt.get(id);

      if (!original) {
        throw new Error("Schedule item not found");
      }

      // Create duplicate with modified name
      const duplicateName = `${original.name} (Copy)`;
      const createStmt = this.db.prepare(`
        INSERT INTO schedule (project_id, name, description, time, days, enabled)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Ensure enabled value is properly converted to integer for SQLite
      const enabledValue = original.enabled ? 1 : 0;

      const result = createStmt.run(
        original.project_id,
        duplicateName,
        original.description,
        original.time,
        original.days,
        enabledValue
      );

      // Get the duplicated schedule item
      const newSchedule = getStmt.get(result.lastInsertRowid);

      // Copy schedule-scene relationships
      const getRelationsStmt = this.db.prepare(
        "SELECT scene_id FROM schedule_scenes WHERE schedule_id = ?"
      );
      const relations = getRelationsStmt.all(id);

      const addRelationStmt = this.db.prepare(`
        INSERT INTO schedule_scenes (schedule_id, scene_id)
        VALUES (?, ?)
      `);

      for (const relation of relations) {
        addRelationStmt.run(newSchedule.id, relation.scene_id);
      }

      return newSchedule;
    } catch (error) {
      console.error("Failed to duplicate schedule item:", error);
      throw error;
    }
  },

  // Schedule-Scene Relationships
  getScheduleScenesWithDetails(scheduleId) {
    try {
      const stmt = this.db.prepare(`
        SELECT
          ss.*,
          s.name as scene_name,
          s.address as scene_address,
          s.description as scene_description
        FROM schedule_scenes ss
        LEFT JOIN scene s ON ss.scene_id = s.id
        WHERE ss.schedule_id = ?
        ORDER BY s.name ASC
      `);
      return stmt.all(scheduleId);
    } catch (error) {
      console.error("Failed to get schedule scenes with details:", error);
      throw error;
    }
  },

  addSceneToSchedule(scheduleId, sceneId) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO schedule_scenes (schedule_id, scene_id)
        VALUES (?, ?)
      `);

      const result = stmt.run(scheduleId, sceneId);

      // Return the created schedule-scene relationship
      const getStmt = this.db.prepare(
        "SELECT * FROM schedule_scenes WHERE id = ?"
      );
      return getStmt.get(result.lastInsertRowid);
    } catch (error) {
      console.error("Failed to add scene to schedule:", error);
      throw error;
    }
  },

  removeSceneFromSchedule(scheduleSceneId) {
    try {
      const stmt = this.db.prepare("DELETE FROM schedule_scenes WHERE id = ?");
      const result = stmt.run(scheduleSceneId);

      if (result.changes === 0) {
        throw new Error("Schedule-scene relationship not found");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to remove scene from schedule:", error);
      throw error;
    }
  },

  // Get schedule with scene addresses for sending
  getScheduleForSending(scheduleId) {
    try {
      // Get schedule basic info
      const scheduleStmt = this.db.prepare(`
        SELECT * FROM schedule WHERE id = ?
      `);
      const schedule = scheduleStmt.get(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Get scene addresses
      const scenesStmt = this.db.prepare(`
        SELECT s.address as scene_address
        FROM schedule_scenes ss
        LEFT JOIN scene s ON ss.scene_id = s.id
        WHERE ss.schedule_id = ?
        ORDER BY CAST(s.address AS INTEGER) ASC
      `);
      const scenes = scenesStmt.all(scheduleId);

      // Parse days from JSON and convert to boolean array
      let days = [false, false, false, false, false, false, false]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
      try {
        const dayKeys = JSON.parse(schedule.days);
        const dayMapping = {
          monday: 0,
          tuesday: 1,
          wednesday: 2,
          thursday: 3,
          friday: 4,
          saturday: 5,
          sunday: 6,
        };

        // Convert day keys to boolean array
        if (Array.isArray(dayKeys)) {
          dayKeys.forEach((dayKey) => {
            const index = dayMapping[dayKey];
            if (index !== undefined) {
              days[index] = true;
            }
          });
        }
      } catch (error) {
        console.error("Failed to parse schedule days:", error);
        days = [false, false, false, false, false, false, false]; // Default to no days
      }

      // Parse time
      const timeParts = schedule.time.split(":");
      const hour = parseInt(timeParts[0]) || 0;
      const minute = parseInt(timeParts[1]) || 0;

      return {
        ...schedule,
        parsedDays: days,
        hour,
        minute,
        sceneAddresses: scenes
          .map((scene) => scene.scene_address)
          .filter((addr) => addr !== null),
      };
    } catch (error) {
      console.error("Failed to get schedule for sending:", error);
      throw error;
    }
  },

  // Find schedule ID by identifier (name + time combination)
  findScheduleIdByIdentifier(projectId, identifier) {
    try {
      const [name, time] = identifier.split("|");
      const stmt = this.db.prepare(`
        SELECT id FROM schedule
        WHERE project_id = ? AND name = ? AND time = ?
      `);
      const result = stmt.get(projectId, name, time);
      return result ? result.id : null;
    } catch (error) {
      console.error(
        `Failed to find schedule ID for identifier ${identifier}:`,
        error
      );
      return null;
    }
  },
};
