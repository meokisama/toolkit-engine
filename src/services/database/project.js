/**
 * Project Database Module
 * Contains all table schemas and methods related to projects
 */

// Table creation SQL statements
export const projectTableSchemas = {
  createProjectsTable: `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
};

// Project-related methods that will be mixed into DatabaseService
export const projectMethods = {
  // Get all projects
  getAllProjects() {
    try {
      const stmt = this.db.prepare(
        "SELECT * FROM projects ORDER BY created_at DESC"
      );
      return stmt.all();
    } catch (error) {
      console.error("Failed to get all projects:", error);
      throw error;
    }
  },

  // Get a single project by ID
  getProjectById(id) {
    try {
      const stmt = this.db.prepare("SELECT * FROM projects WHERE id = ?");
      return stmt.get(id);
    } catch (error) {
      console.error("Failed to get project by id:", error);
      throw error;
    }
  },

  // Create a new project
  createProject(projectData) {
    try {
      const { name, description } = projectData;

      const stmt = this.db.prepare(`
        INSERT INTO projects (name, description)
        VALUES (?, ?)
      `);

      const result = stmt.run(name, description);
      return this.getProjectById(result.lastInsertRowid);
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  },

  // Update a project
  updateProject(id, projectData) {
    try {
      const { name, description } = projectData;

      const stmt = this.db.prepare(`
        UPDATE projects
        SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(name, description, id);

      if (result.changes === 0) {
        throw new Error("Project not found");
      }

      return this.getProjectById(id);
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  },

  // Delete a project
  deleteProject(id) {
    try {
      const stmt = this.db.prepare("DELETE FROM projects WHERE id = ?");
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error("Project not found");
      }

      return { success: true, deletedId: id };
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  },

  // Duplicate a project with all its items and relationships
  duplicateProject(id) {
    try {
      const originalProject = this.getProjectById(id);

      if (!originalProject) {
        throw new Error("Project not found");
      }

      // Start transaction for atomic operation
      const transaction = this.db.transaction(() => {
        // Create the new project
        const duplicatedProject = {
          name: `${originalProject.name} (Copy)`,
          description: originalProject.description,
        };

        const newProject = this.createProject(duplicatedProject);

        // Get all items from the original project
        const originalItems = this.getAllProjectItems(id);

        // Copy all items to the new project
        this.copyProjectItems(originalItems, newProject.id);

        return newProject;
      });

      return transaction();
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      throw error;
    }
  },

  // Helper method to copy all project items to a new project
  copyProjectItems(originalItems, newProjectId) {
    const categories = [
      "lighting",
      "aircon",
      "unit",
      "scene",
      "schedule",
      "multi_scenes",
      "sequences",
      "curtain",
      "knx",
    ];

    // Create mapping from old IDs to new IDs for relationships
    const idMappings = {
      scene: {},
      schedule: {},
      multi_scenes: {},
      sequences: {},
    };

    categories.forEach((category) => {
      const items = originalItems[category] || [];

      items.forEach((item) => {
        let newItem;

        if (category === "unit") {
          // Special handling for unit items
          const itemData = {
            name: item.name,
            type: item.type,
            serial_no: item.serial_no,
            ip_address: item.ip_address,
            id_can: item.id_can,
            mode: item.mode,
            firmware_version: item.firmware_version,
            description: item.description,
          };
          newItem = this.createUnitItem(newProjectId, itemData);
        } else if (category === "aircon") {
          // Special handling for aircon items (use aircon table)
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            label: item.label || "Aircon",
          };
          newItem = this.createProjectItem(newProjectId, itemData, "aircon");
        } else if (category === "curtain") {
          // Special handling for curtain items
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            object_type: item.object_type,
            curtain_type: item.curtain_type,
            curtain_value: item.curtain_value,
            open_group: item.open_group,
            close_group: item.close_group,
            stop_group: item.stop_group,
            pause_period: item.pause_period,
            transition_period: item.transition_period,
          };
          newItem = this.createProjectItem(newProjectId, itemData, category);
        } else if (category === "schedule") {
          // Special handling for schedule items
          const itemData = {
            name: item.name,
            description: item.description,
            time: item.time,
            days: item.days,
            enabled: item.enabled,
          };
          newItem = this.createScheduleItem(newProjectId, itemData);
        } else if (category === "multi_scenes") {
          // Special handling for multi_scenes items
          const itemData = {
            name: item.name,
            address: item.address,
            type: item.type,
            description: item.description,
          };
          newItem = this.createProjectItem(newProjectId, itemData, category);
        } else if (category === "sequences") {
          // Special handling for sequences items
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
          };
          newItem = this.createProjectItem(newProjectId, itemData, category);
        } else {
          // Standard handling for other categories
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            object_type: item.object_type,
          };
          newItem = this.createProjectItem(newProjectId, itemData, category);
        }

        // Store ID mapping for relationships
        if (
          ["scene", "schedule", "multi_scenes", "sequences"].includes(category)
        ) {
          idMappings[category][item.id] = newItem.id;
        }
      });
    });

    // Copy relationship tables after all main items are created
    this.copyProjectRelationships(originalItems, newProjectId, idMappings);
  },

  // Helper method to copy all relationship tables
  copyProjectRelationships(originalItems, newProjectId, idMappings) {
    try {
      // Copy scene_items
      const sceneItems = originalItems.scene_items || [];
      sceneItems.forEach((sceneItem) => {
        const newSceneId = idMappings.scene[sceneItem.scene_id];
        if (newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            newSceneId,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.item_address,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type,
            sceneItem.object_value
          );
        }
      });

      // Copy scene_address_items
      const sceneAddressItems = originalItems.scene_address_items || [];
      sceneAddressItems.forEach((addressItem) => {
        const stmt = this.db.prepare(`
          INSERT INTO scene_address_items (project_id, address, item_type, item_id, object_type, object_value)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          addressItem.address,
          addressItem.item_type,
          addressItem.item_id,
          addressItem.object_type,
          addressItem.object_value
        );
      });

      // Copy schedule_scenes
      const scheduleScenes = originalItems.schedule_scenes || [];
      scheduleScenes.forEach((scheduleScene) => {
        const newScheduleId = idMappings.schedule[scheduleScene.schedule_id];
        const newSceneId = idMappings.scene[scheduleScene.scene_id];
        if (newScheduleId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO schedule_scenes (schedule_id, scene_id)
            VALUES (?, ?)
          `);
          stmt.run(newScheduleId, newSceneId);
        }
      });

      // Copy multi_scene_scenes
      const multiSceneScenes = originalItems.multi_scene_scenes || [];
      multiSceneScenes.forEach((multiSceneScene) => {
        const newMultiSceneId =
          idMappings.multi_scenes[multiSceneScene.multi_scene_id];
        const newSceneId = idMappings.scene[multiSceneScene.scene_id];
        if (newMultiSceneId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO multi_scene_scenes (multi_scene_id, scene_id, scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(newMultiSceneId, newSceneId, multiSceneScene.scene_order);
        }
      });

      // Copy sequence_multi_scenes
      const sequenceMultiScenes = originalItems.sequence_multi_scenes || [];
      sequenceMultiScenes.forEach((sequenceMultiScene) => {
        const newSequenceId =
          idMappings.sequences[sequenceMultiScene.sequence_id];
        const newMultiSceneId =
          idMappings.multi_scenes[sequenceMultiScene.multi_scene_id];
        if (newSequenceId && newMultiSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO sequence_multi_scenes (sequence_id, multi_scene_id, multi_scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(
            newSequenceId,
            newMultiSceneId,
            sequenceMultiScene.multi_scene_order
          );
        }
      });
    } catch (error) {
      console.error("Failed to copy project relationships:", error);
      throw error;
    }
  },

  // Get all project items in one optimized call
  getAllProjectItems(projectId) {
    try {
      const lighting = this.db
        .prepare(
          "SELECT * FROM lighting WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC"
        )
        .all(projectId);
      const aircon = this.db
        .prepare(
          "SELECT * FROM aircon WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC"
        )
        .all(projectId);
      const unitRaw = this.db
        .prepare(
          "SELECT * FROM unit WHERE project_id = ? ORDER BY created_at DESC"
        )
        .all(projectId);

      // Parse RS485 and I/O config from JSON for unit items
      const unit = unitRaw.map((item) => {
        const parsedItem = {
          ...item,
          rs485_config: item.rs485_config
            ? JSON.parse(item.rs485_config)
            : null,
          input_configs: item.input_configs
            ? JSON.parse(item.input_configs)
            : null,
          output_configs: item.output_configs
            ? JSON.parse(item.output_configs)
            : null,
        };

        // Debug logging for output configs
        if (parsedItem.output_configs) {
          console.log("Reading unit from database:", {
            id: item.id,
            ip_address: item.ip_address,
            outputConfigsCount: parsedItem.output_configs?.outputs?.length || 0,
            hasOutputConfigs: !!parsedItem.output_configs,
          });
        }

        return parsedItem;
      });
      const curtain = this.db
        .prepare(
          "SELECT * FROM curtain WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC"
        )
        .all(projectId);
      const knx = this.db
        .prepare(
          "SELECT * FROM knx WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC"
        )
        .all(projectId);
      const scene = this.db
        .prepare(
          "SELECT * FROM scene WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC"
        )
        .all(projectId);
      const schedule = this.db
        .prepare(
          "SELECT * FROM schedule WHERE project_id = ? ORDER BY name ASC"
        )
        .all(projectId);
      const multi_scenes = this.db
        .prepare(
          "SELECT * FROM multi_scenes WHERE project_id = ? ORDER BY name ASC"
        )
        .all(projectId);
      const sequences = this.db
        .prepare(
          "SELECT * FROM sequences WHERE project_id = ? ORDER BY name ASC"
        )
        .all(projectId);

      // Get all relationship tables for complete export
      const scene_items = this.db
        .prepare(
          `
          SELECT si.* FROM scene_items si
          JOIN scene s ON si.scene_id = s.id
          WHERE s.project_id = ?
          ORDER BY si.scene_id, si.created_at
        `
        )
        .all(projectId);

      const scene_address_items = this.db
        .prepare(
          "SELECT * FROM scene_address_items WHERE project_id = ? ORDER BY address, created_at"
        )
        .all(projectId);

      const schedule_scenes = this.db
        .prepare(
          `
          SELECT ss.* FROM schedule_scenes ss
          JOIN schedule sch ON ss.schedule_id = sch.id
          WHERE sch.project_id = ?
          ORDER BY ss.schedule_id, ss.created_at
        `
        )
        .all(projectId);

      const multi_scene_scenes = this.db
        .prepare(
          `
          SELECT mss.* FROM multi_scene_scenes mss
          JOIN multi_scenes ms ON mss.multi_scene_id = ms.id
          WHERE ms.project_id = ?
          ORDER BY mss.multi_scene_id, mss.scene_order
        `
        )
        .all(projectId);

      const sequence_multi_scenes = this.db
        .prepare(
          `
          SELECT sms.* FROM sequence_multi_scenes sms
          JOIN sequences seq ON sms.sequence_id = seq.id
          WHERE seq.project_id = ?
          ORDER BY sms.sequence_id, sms.multi_scene_order
        `
        )
        .all(projectId);

      return {
        lighting,
        aircon,
        unit,
        curtain,
        knx,
        scene,
        schedule,
        multi_scenes,
        sequences,
        // Relationship tables for complete export
        scene_items,
        scene_address_items,
        schedule_scenes,
        multi_scene_scenes,
        sequence_multi_scenes,
      };
    } catch (error) {
      console.error("Failed to get all project items:", error);
      throw error;
    }
  },
};
