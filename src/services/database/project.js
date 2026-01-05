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
      const stmt = this.db.prepare("SELECT * FROM projects ORDER BY created_at DESC");
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

  // Get all project items in one optimized call
  getAllProjectItems(projectId) {
    try {
      const lighting = this.db.prepare("SELECT * FROM lighting WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC").all(projectId);
      const aircon = this.db.prepare("SELECT * FROM aircon WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC").all(projectId);
      const unitRaw = this.db.prepare("SELECT * FROM unit WHERE project_id = ? ORDER BY created_at DESC").all(projectId);

      // Parse RS485 and I/O config from JSON for unit items
      const unit = unitRaw.map((item) => {
        const parsedItem = {
          ...item,
          rs485_config: item.rs485_config ? JSON.parse(item.rs485_config) : null,
          input_configs: item.input_configs ? JSON.parse(item.input_configs) : null,
          output_configs: item.output_configs ? JSON.parse(item.output_configs) : null,
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
      const curtain = this.db.prepare("SELECT * FROM curtain WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC").all(projectId);
      const knx = this.db.prepare("SELECT * FROM knx WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC").all(projectId);
      const dmx = this.db.prepare("SELECT * FROM dmx WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC").all(projectId);
      const scene = this.db.prepare("SELECT * FROM scene WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC").all(projectId);
      const schedule = this.db.prepare("SELECT * FROM schedule WHERE project_id = ? ORDER BY name ASC").all(projectId);
      const multi_scenes = this.db.prepare("SELECT * FROM multi_scenes WHERE project_id = ? ORDER BY name ASC").all(projectId);
      const sequences = this.db.prepare("SELECT * FROM sequences WHERE project_id = ? ORDER BY name ASC").all(projectId);

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

      // Get room configuration
      const room_general_config = this.db.prepare("SELECT * FROM room_general_config WHERE project_id = ?").get(projectId);

      const room_detail_config = this.db
        .prepare(
          `
          SELECT rdc.* FROM room_detail_config rdc
          JOIN room_general_config rgc ON rdc.general_config_id = rgc.id
          WHERE rgc.project_id = ?
          ORDER BY rdc.room_address
        `
        )
        .all(projectId);

      // Get DALI configuration
      const dali_devices = this.db.prepare("SELECT * FROM dali_devices WHERE project_id = ? ORDER BY address").all(projectId);

      const dali_groups = this.db.prepare("SELECT * FROM dali_groups WHERE project_id = ? ORDER BY group_id").all(projectId);

      const dali_group_devices = this.db
        .prepare("SELECT * FROM dali_group_devices WHERE project_id = ? ORDER BY group_id, device_address")
        .all(projectId);

      const dali_scenes = this.db.prepare("SELECT * FROM dali_scenes WHERE project_id = ? ORDER BY scene_id").all(projectId);

      const dali_scene_devices = this.db
        .prepare("SELECT * FROM dali_scene_devices WHERE project_id = ? ORDER BY scene_id, device_address")
        .all(projectId);

      // Get Zigbee devices
      const zigbee_devices = this.db.prepare("SELECT * FROM zigbee_devices WHERE project_id = ? ORDER BY unit_ip, ieee_address").all(projectId);

      return {
        lighting,
        aircon,
        unit,
        curtain,
        knx,
        dmx,
        scene,
        schedule,
        multi_scenes,
        sequences,
        // Relationship tables for complete export
        scene_items,
        schedule_scenes,
        multi_scene_scenes,
        sequence_multi_scenes,
        // Room configuration
        room_general_config,
        room_detail_config,
        // DALI configuration
        dali_devices,
        dali_groups,
        dali_group_devices,
        dali_scenes,
        dali_scene_devices,
        // Zigbee devices
        zigbee_devices,
      };
    } catch (error) {
      console.error("Failed to get all project items:", error);
      throw error;
    }
  },
};
