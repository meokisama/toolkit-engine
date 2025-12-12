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
    const categories = ["lighting", "aircon", "unit", "scene", "schedule", "multi_scenes", "sequences", "curtain", "knx"];

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
        if (["scene", "schedule", "multi_scenes", "sequences"].includes(category)) {
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
        stmt.run(newProjectId, addressItem.address, addressItem.item_type, addressItem.item_id, addressItem.object_type, addressItem.object_value);
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
        const newMultiSceneId = idMappings.multi_scenes[multiSceneScene.multi_scene_id];
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
        const newSequenceId = idMappings.sequences[sequenceMultiScene.sequence_id];
        const newMultiSceneId = idMappings.multi_scenes[sequenceMultiScene.multi_scene_id];
        if (newSequenceId && newMultiSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO sequence_multi_scenes (sequence_id, multi_scene_id, multi_scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(newSequenceId, newMultiSceneId, sequenceMultiScene.multi_scene_order);
        }
      });

      // Copy room general config
      if (originalItems.room_general_config) {
        const roomGeneralConfig = originalItems.room_general_config;
        const stmt = this.db.prepare(`
          INSERT INTO room_general_config (
            project_id, room_mode, room_amount, tcp_mode, port, slave_amount, slave_ips,
            client_mode, client_ip, client_port
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          roomGeneralConfig.room_mode,
          roomGeneralConfig.room_amount,
          roomGeneralConfig.tcp_mode,
          roomGeneralConfig.port,
          roomGeneralConfig.slave_amount,
          roomGeneralConfig.slave_ips,
          roomGeneralConfig.client_mode,
          roomGeneralConfig.client_ip,
          roomGeneralConfig.client_port
        );
      }

      // Copy room config
      const roomConfigs = originalItems.room_config || [];
      roomConfigs.forEach((roomConfig) => {
        const stmt = this.db.prepare(`
          INSERT INTO room_config (
            project_id, room_address, occupancy_type, occupancy_scene_type, enable_welcome_night,
            period, pir_init_time, pir_verify_time, unrent_period, standby_time,
            unrent_aircon_active, unrent_aircon_mode, unrent_aircon_fan_speed, unrent_aircon_cool_setpoint, unrent_aircon_heat_setpoint,
            unrent_scene_amount, unrent_scenes,
            unoccupy_aircon_active, unoccupy_aircon_mode, unoccupy_aircon_fan_speed, unoccupy_aircon_cool_setpoint, unoccupy_aircon_heat_setpoint,
            unoccupy_scene_amount, unoccupy_scenes,
            checkin_aircon_active, checkin_aircon_mode, checkin_aircon_fan_speed, checkin_aircon_cool_setpoint, checkin_aircon_heat_setpoint,
            checkin_scene_amount, checkin_scenes,
            welcome_aircon_active, welcome_aircon_mode, welcome_aircon_fan_speed, welcome_aircon_cool_setpoint, welcome_aircon_heat_setpoint,
            welcome_scene_amount, welcome_scenes,
            welcome_night_aircon_active, welcome_night_aircon_mode, welcome_night_aircon_fan_speed, welcome_night_aircon_cool_setpoint, welcome_night_aircon_heat_setpoint,
            welcome_night_scene_amount, welcome_night_scenes,
            staff_aircon_active, staff_aircon_mode, staff_aircon_fan_speed, staff_aircon_cool_setpoint, staff_aircon_heat_setpoint,
            staff_scene_amount, staff_scenes,
            out_of_service_aircon_active, out_of_service_aircon_mode, out_of_service_aircon_fan_speed, out_of_service_aircon_cool_setpoint, out_of_service_aircon_heat_setpoint,
            out_of_service_scene_amount, out_of_service_scenes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          roomConfig.room_address,
          roomConfig.occupancy_type,
          roomConfig.occupancy_scene_type,
          roomConfig.enable_welcome_night,
          roomConfig.period,
          roomConfig.pir_init_time,
          roomConfig.pir_verify_time,
          roomConfig.unrent_period,
          roomConfig.standby_time,
          roomConfig.unrent_aircon_active,
          roomConfig.unrent_aircon_mode,
          roomConfig.unrent_aircon_fan_speed,
          roomConfig.unrent_aircon_cool_setpoint,
          roomConfig.unrent_aircon_heat_setpoint,
          roomConfig.unrent_scene_amount,
          roomConfig.unrent_scenes,
          roomConfig.unoccupy_aircon_active,
          roomConfig.unoccupy_aircon_mode,
          roomConfig.unoccupy_aircon_fan_speed,
          roomConfig.unoccupy_aircon_cool_setpoint,
          roomConfig.unoccupy_aircon_heat_setpoint,
          roomConfig.unoccupy_scene_amount,
          roomConfig.unoccupy_scenes,
          roomConfig.checkin_aircon_active,
          roomConfig.checkin_aircon_mode,
          roomConfig.checkin_aircon_fan_speed,
          roomConfig.checkin_aircon_cool_setpoint,
          roomConfig.checkin_aircon_heat_setpoint,
          roomConfig.checkin_scene_amount,
          roomConfig.checkin_scenes,
          roomConfig.welcome_aircon_active,
          roomConfig.welcome_aircon_mode,
          roomConfig.welcome_aircon_fan_speed,
          roomConfig.welcome_aircon_cool_setpoint,
          roomConfig.welcome_aircon_heat_setpoint,
          roomConfig.welcome_scene_amount,
          roomConfig.welcome_scenes,
          roomConfig.welcome_night_aircon_active,
          roomConfig.welcome_night_aircon_mode,
          roomConfig.welcome_night_aircon_fan_speed,
          roomConfig.welcome_night_aircon_cool_setpoint,
          roomConfig.welcome_night_aircon_heat_setpoint,
          roomConfig.welcome_night_scene_amount,
          roomConfig.welcome_night_scenes,
          roomConfig.staff_aircon_active,
          roomConfig.staff_aircon_mode,
          roomConfig.staff_aircon_fan_speed,
          roomConfig.staff_aircon_cool_setpoint,
          roomConfig.staff_aircon_heat_setpoint,
          roomConfig.staff_scene_amount,
          roomConfig.staff_scenes,
          roomConfig.out_of_service_aircon_active,
          roomConfig.out_of_service_aircon_mode,
          roomConfig.out_of_service_aircon_fan_speed,
          roomConfig.out_of_service_aircon_cool_setpoint,
          roomConfig.out_of_service_aircon_heat_setpoint,
          roomConfig.out_of_service_scene_amount,
          roomConfig.out_of_service_scenes
        );
      });

      // Copy DALI devices
      const daliDevices = originalItems.dali_devices || [];
      daliDevices.forEach((daliDevice) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_devices (
            project_id, address, name, mapped_device_name, mapped_device_type,
            mapped_device_index, mapped_device_address, lighting_group_address, color_feature
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          daliDevice.address,
          daliDevice.name,
          daliDevice.mapped_device_name,
          daliDevice.mapped_device_type,
          daliDevice.mapped_device_index,
          daliDevice.mapped_device_address,
          daliDevice.lighting_group_address,
          daliDevice.color_feature
        );
      });

      // Copy DALI groups
      const daliGroups = originalItems.dali_groups || [];
      daliGroups.forEach((daliGroup) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_groups (project_id, group_id, name, lighting_group_address)
          VALUES (?, ?, ?, ?)
        `);
        stmt.run(newProjectId, daliGroup.group_id, daliGroup.name, daliGroup.lighting_group_address);
      });

      // Copy DALI group devices
      const daliGroupDevices = originalItems.dali_group_devices || [];
      daliGroupDevices.forEach((daliGroupDevice) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_group_devices (project_id, group_id, device_address)
          VALUES (?, ?, ?)
        `);
        stmt.run(newProjectId, daliGroupDevice.group_id, daliGroupDevice.device_address);
      });

      // Copy DALI scenes
      const daliScenes = originalItems.dali_scenes || [];
      daliScenes.forEach((daliScene) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_scenes (project_id, scene_id, name)
          VALUES (?, ?, ?)
        `);
        stmt.run(newProjectId, daliScene.scene_id, daliScene.name);
      });

      // Copy DALI scene devices
      const daliSceneDevices = originalItems.dali_scene_devices || [];
      daliSceneDevices.forEach((daliSceneDevice) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_scene_devices (
            project_id, scene_id, device_address, active, brightness,
            color_temp, r, g, b, w
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          daliSceneDevice.scene_id,
          daliSceneDevice.device_address,
          daliSceneDevice.active,
          daliSceneDevice.brightness,
          daliSceneDevice.color_temp,
          daliSceneDevice.r,
          daliSceneDevice.g,
          daliSceneDevice.b,
          daliSceneDevice.w
        );
      });

      // Copy Zigbee devices
      const zigbeeDevices = originalItems.zigbee_devices || [];
      zigbeeDevices.forEach((zigbeeDevice) => {
        const stmt = this.db.prepare(`
          INSERT INTO zigbee_devices (
            project_id, unit_ip, unit_can_id, ieee_address, device_type, device_name, num_endpoints,
            endpoint1_id, endpoint1_value, endpoint1_address, endpoint1_name,
            endpoint2_id, endpoint2_value, endpoint2_address, endpoint2_name,
            endpoint3_id, endpoint3_value, endpoint3_address, endpoint3_name,
            endpoint4_id, endpoint4_value, endpoint4_address, endpoint4_name,
            rssi, status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          zigbeeDevice.unit_ip,
          zigbeeDevice.unit_can_id,
          zigbeeDevice.ieee_address,
          zigbeeDevice.device_type,
          zigbeeDevice.device_name,
          zigbeeDevice.num_endpoints,
          zigbeeDevice.endpoint1_id,
          zigbeeDevice.endpoint1_value,
          zigbeeDevice.endpoint1_address,
          zigbeeDevice.endpoint1_name,
          zigbeeDevice.endpoint2_id,
          zigbeeDevice.endpoint2_value,
          zigbeeDevice.endpoint2_address,
          zigbeeDevice.endpoint2_name,
          zigbeeDevice.endpoint3_id,
          zigbeeDevice.endpoint3_value,
          zigbeeDevice.endpoint3_address,
          zigbeeDevice.endpoint3_name,
          zigbeeDevice.endpoint4_id,
          zigbeeDevice.endpoint4_value,
          zigbeeDevice.endpoint4_address,
          zigbeeDevice.endpoint4_name,
          zigbeeDevice.rssi,
          zigbeeDevice.status
        );
      });
    } catch (error) {
      console.error("Failed to copy project relationships:", error);
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

      const scene_address_items = this.db
        .prepare("SELECT * FROM scene_address_items WHERE project_id = ? ORDER BY address, created_at")
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
      const room_general_config = this.db
        .prepare("SELECT * FROM room_general_config WHERE project_id = ?")
        .get(projectId);

      const room_config = this.db
        .prepare("SELECT * FROM room_config WHERE project_id = ? ORDER BY room_address")
        .all(projectId);

      // Get DALI configuration
      const dali_devices = this.db
        .prepare("SELECT * FROM dali_devices WHERE project_id = ? ORDER BY address")
        .all(projectId);

      const dali_groups = this.db
        .prepare("SELECT * FROM dali_groups WHERE project_id = ? ORDER BY group_id")
        .all(projectId);

      const dali_group_devices = this.db
        .prepare("SELECT * FROM dali_group_devices WHERE project_id = ? ORDER BY group_id, device_address")
        .all(projectId);

      const dali_scenes = this.db
        .prepare("SELECT * FROM dali_scenes WHERE project_id = ? ORDER BY scene_id")
        .all(projectId);

      const dali_scene_devices = this.db
        .prepare("SELECT * FROM dali_scene_devices WHERE project_id = ? ORDER BY scene_id, device_address")
        .all(projectId);

      // Get Zigbee devices
      const zigbee_devices = this.db
        .prepare("SELECT * FROM zigbee_devices WHERE project_id = ? ORDER BY unit_ip, ieee_address")
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
        // Room configuration
        room_general_config,
        room_config,
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
