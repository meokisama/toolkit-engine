import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { OBJECT_TYPES } from "../constants.js";

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();
  }

  // Helper function to get object_value from object_type
  getObjectValue(objectType) {
    // Find the matching object type and return its obj_value
    for (const [, value] of Object.entries(OBJECT_TYPES)) {
      if (typeof value === "object" && value.obj_name === objectType) {
        return value.obj_value;
      }
    }
    // Default fallback
    console.warn(`Unknown object type: ${objectType}`);
    return 0;
  }

  init() {
    try {
      // Dynamic import for better-sqlite3
      const Database = require("better-sqlite3");

      // Tạo đường dẫn database trong documents directory
      const documentsPath = app.getPath("documents");
      const toolkitPath = path.join(documentsPath, "Toolkit Engine");

      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(toolkitPath)) {
        fs.mkdirSync(toolkitPath, { recursive: true });
      }

      // Tạo đường dẫn database
      const dbPath = path.join(toolkitPath, "projects.db");

      // Khởi tạo database
      this.db = new Database(dbPath);

      // Tạo bảng projects nếu chưa tồn tại
      this.createTables();
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  createTables() {
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createLightingTable = `
      CREATE TABLE IF NOT EXISTS lighting (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        address TEXT NOT NULL,
        description TEXT,
        object_type TEXT DEFAULT 'OBJ_LIGHTING',
        object_value INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createAirconItemsTable = `
      CREATE TABLE IF NOT EXISTS aircon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        address TEXT NOT NULL,
        description TEXT,
        label TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createUnitTable = `
      CREATE TABLE IF NOT EXISTS unit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        type TEXT,
        serial_no TEXT,
        ip_address TEXT,
        id_can TEXT,
        mode TEXT,
        firmware_version TEXT,
        hardware_version TEXT,
        manufacture_date TEXT,
        can_load BOOLEAN DEFAULT 0,
        recovery_mode BOOLEAN DEFAULT 0,
        description TEXT,
        discovered_at DATETIME,
        rs485_config TEXT, -- JSON string for RS485 configuration
        input_configs TEXT, -- JSON string for ALL input configurations
        output_configs TEXT, -- JSON string for ALL output configurations
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createCurtainTable = `
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (open_group_id) REFERENCES lighting (id) ON DELETE SET NULL,
        FOREIGN KEY (close_group_id) REFERENCES lighting (id) ON DELETE SET NULL,
        FOREIGN KEY (stop_group_id) REFERENCES lighting (id) ON DELETE SET NULL
      )
    `;

    const createKnxTable = `
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
    `;

    const createSceneTable = `
      CREATE TABLE IF NOT EXISTS scene (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createSceneItemsTable = `
      CREATE TABLE IF NOT EXISTS scene_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_address TEXT,
        item_value TEXT,
        command TEXT,
        object_type TEXT,
        object_value INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scene_id) REFERENCES scene (id) ON DELETE CASCADE
      )
    `;

    const createSceneAddressItemsTable = `
      CREATE TABLE IF NOT EXISTS scene_address_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        address TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        object_type TEXT,
        object_value INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        UNIQUE(project_id, address, item_type, item_id, object_type)
      )
    `;

    const createScheduleTable = `
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
    `;

    const createScheduleScenesTable = `
      CREATE TABLE IF NOT EXISTS schedule_scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        scene_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedule (id) ON DELETE CASCADE,
        FOREIGN KEY (scene_id) REFERENCES scene (id) ON DELETE CASCADE
      )
    `;

    const createMultiScenesTable = `
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
    `;

    const createMultiSceneScenesTable = `
      CREATE TABLE IF NOT EXISTS multi_scene_scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        multi_scene_id INTEGER NOT NULL,
        scene_id INTEGER NOT NULL,
        scene_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (multi_scene_id) REFERENCES multi_scenes (id) ON DELETE CASCADE,
        FOREIGN KEY (scene_id) REFERENCES scene (id) ON DELETE CASCADE
      )
    `;

    const createSequencesTable = `
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
    `;

    const createSequenceMultiScenesTable = `
      CREATE TABLE IF NOT EXISTS sequence_multi_scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sequence_id INTEGER NOT NULL,
        multi_scene_id INTEGER NOT NULL,
        multi_scene_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sequence_id) REFERENCES sequences (id) ON DELETE CASCADE,
        FOREIGN KEY (multi_scene_id) REFERENCES multi_scenes (id) ON DELETE CASCADE
      )
    `;

    // Room General Config Table - stores general room configuration for each project
    const createRoomGeneralConfigTable = `
      CREATE TABLE IF NOT EXISTS room_general_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL UNIQUE,
        room_mode INTEGER NOT NULL DEFAULT 0,
        room_amount INTEGER NOT NULL DEFAULT 1,
        tcp_mode INTEGER NOT NULL DEFAULT 0,
        port INTEGER NOT NULL DEFAULT 5000,
        slave_amount INTEGER NOT NULL DEFAULT 1,
        slave_ips TEXT,
        client_mode INTEGER NOT NULL DEFAULT 0,
        client_ip TEXT,
        client_port INTEGER NOT NULL DEFAULT 8080,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    // Room Config Table - stores individual room configurations with 7 states
    const createRoomConfigTable = `
      CREATE TABLE IF NOT EXISTS room_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        room_address INTEGER NOT NULL,
        occupancy_type INTEGER NOT NULL DEFAULT 0,
        occupancy_scene_type INTEGER DEFAULT 0,
        enable_welcome_night INTEGER DEFAULT 0,
        period INTEGER DEFAULT 0,
        pir_init_time INTEGER DEFAULT 0,
        pir_verify_time INTEGER DEFAULT 0,
        unrent_period INTEGER DEFAULT 0,
        standby_time INTEGER DEFAULT 15,
        unrent_aircon_active BOOLEAN DEFAULT 0,
        unrent_aircon_mode INTEGER DEFAULT 0,
        unrent_aircon_fan_speed INTEGER DEFAULT 0,
        unrent_aircon_cool_setpoint INTEGER DEFAULT 24,
        unrent_aircon_heat_setpoint INTEGER DEFAULT 20,
        unrent_scene_amount INTEGER DEFAULT 0,
        unrent_scenes TEXT DEFAULT '',
        unoccupy_aircon_active BOOLEAN DEFAULT 0,
        unoccupy_aircon_mode INTEGER DEFAULT 0,
        unoccupy_aircon_fan_speed INTEGER DEFAULT 0,
        unoccupy_aircon_cool_setpoint INTEGER DEFAULT 24,
        unoccupy_aircon_heat_setpoint INTEGER DEFAULT 20,
        unoccupy_scene_amount INTEGER DEFAULT 0,
        unoccupy_scenes TEXT DEFAULT '',
        checkin_aircon_active BOOLEAN DEFAULT 0,
        checkin_aircon_mode INTEGER DEFAULT 0,
        checkin_aircon_fan_speed INTEGER DEFAULT 0,
        checkin_aircon_cool_setpoint INTEGER DEFAULT 24,
        checkin_aircon_heat_setpoint INTEGER DEFAULT 20,
        checkin_scene_amount INTEGER DEFAULT 0,
        checkin_scenes TEXT DEFAULT '',
        welcome_aircon_active BOOLEAN DEFAULT 0,
        welcome_aircon_mode INTEGER DEFAULT 0,
        welcome_aircon_fan_speed INTEGER DEFAULT 0,
        welcome_aircon_cool_setpoint INTEGER DEFAULT 24,
        welcome_aircon_heat_setpoint INTEGER DEFAULT 20,
        welcome_scene_amount INTEGER DEFAULT 0,
        welcome_scenes TEXT DEFAULT '',
        welcome_night_aircon_active BOOLEAN DEFAULT 0,
        welcome_night_aircon_mode INTEGER DEFAULT 0,
        welcome_night_aircon_fan_speed INTEGER DEFAULT 0,
        welcome_night_aircon_cool_setpoint INTEGER DEFAULT 24,
        welcome_night_aircon_heat_setpoint INTEGER DEFAULT 20,
        welcome_night_scene_amount INTEGER DEFAULT 0,
        welcome_night_scenes TEXT DEFAULT '',
        staff_aircon_active BOOLEAN DEFAULT 0,
        staff_aircon_mode INTEGER DEFAULT 0,
        staff_aircon_fan_speed INTEGER DEFAULT 0,
        staff_aircon_cool_setpoint INTEGER DEFAULT 24,
        staff_aircon_heat_setpoint INTEGER DEFAULT 20,
        staff_scene_amount INTEGER DEFAULT 0,
        staff_scenes TEXT DEFAULT '',
        out_of_service_aircon_active BOOLEAN DEFAULT 0,
        out_of_service_aircon_mode INTEGER DEFAULT 0,
        out_of_service_aircon_fan_speed INTEGER DEFAULT 0,
        out_of_service_aircon_cool_setpoint INTEGER DEFAULT 24,
        out_of_service_aircon_heat_setpoint INTEGER DEFAULT 20,
        out_of_service_scene_amount INTEGER DEFAULT 0,
        out_of_service_scenes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        UNIQUE(project_id, room_address)
      )
    `;

    const createZigbeeDevicesTable = `
      CREATE TABLE IF NOT EXISTS zigbee_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        unit_ip TEXT NOT NULL,
        unit_can_id TEXT NOT NULL,
        ieee_address TEXT NOT NULL,
        device_type INTEGER NOT NULL,
        device_name TEXT,
        num_endpoints INTEGER NOT NULL DEFAULT 0,
        endpoint1_id INTEGER DEFAULT 0,
        endpoint1_value INTEGER DEFAULT 0,
        endpoint1_address INTEGER DEFAULT 0,
        endpoint1_name TEXT,
        endpoint2_id INTEGER DEFAULT 0,
        endpoint2_value INTEGER DEFAULT 0,
        endpoint2_address INTEGER DEFAULT 0,
        endpoint2_name TEXT,
        endpoint3_id INTEGER DEFAULT 0,
        endpoint3_value INTEGER DEFAULT 0,
        endpoint3_address INTEGER DEFAULT 0,
        endpoint3_name TEXT,
        endpoint4_id INTEGER DEFAULT 0,
        endpoint4_value INTEGER DEFAULT 0,
        endpoint4_address INTEGER DEFAULT 0,
        endpoint4_name TEXT,
        rssi INTEGER DEFAULT 0,
        status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        UNIQUE(project_id, unit_ip, ieee_address)
      )
    `;

    // DALI Device Mapping Table - stores 64 fixed addresses (0-63)
    const createDaliDevicesTable = `
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
    `;

    // DALI Groups Metadata Table - stores custom group names and RCU group address
    const createDaliGroupsTable = `
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
    `;

    // DALI Group-Device Relationship Table
    const createDaliGroupDevicesTable = `
      CREATE TABLE IF NOT EXISTS dali_group_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL CHECK(group_id >= 0 AND group_id <= 15),
        device_address INTEGER NOT NULL CHECK(device_address >= 0 AND device_address <= 63),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        UNIQUE(project_id, group_id, device_address)
      )
    `;

    // DALI Scenes Metadata Table - stores custom scene names
    const createDaliScenesTable = `
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
    `;

    // DALI Scene-Device Configuration Table
    const createDaliSceneDevicesTable = `
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
    `;

    try {
      this.db.exec(createProjectsTable);
      this.db.exec(createLightingTable);
      this.db.exec(createAirconItemsTable);
      this.db.exec(createUnitTable);
      this.db.exec(createCurtainTable);
      this.db.exec(createKnxTable);
      this.db.exec(createSceneTable);
      this.db.exec(createSceneItemsTable);
      this.db.exec(createSceneAddressItemsTable);
      this.db.exec(createScheduleTable);
      this.db.exec(createScheduleScenesTable);
      this.db.exec(createMultiScenesTable);
      this.db.exec(createMultiSceneScenesTable);
      this.db.exec(createSequencesTable);
      this.db.exec(createSequenceMultiScenesTable);
      this.db.exec(createRoomGeneralConfigTable);
      this.db.exec(createRoomConfigTable);
      this.db.exec(createZigbeeDevicesTable);
      this.db.exec(createDaliDevicesTable);
      this.db.exec(createDaliGroupsTable);
      this.db.exec(createDaliGroupDevicesTable);
      this.db.exec(createDaliScenesTable);
      this.db.exec(createDaliSceneDevicesTable);
    } catch (error) {
      console.error("Failed to create tables:", error);
      throw error;
    }
  }

  // Helper method to find next available address in range 1-255
  findNextAvailableAddress(projectId, tableName) {
    try {
      const existingAddresses = this.db
        .prepare(
          `SELECT DISTINCT address FROM ${tableName} WHERE project_id = ?`
        )
        .all(projectId);
      const addressNumbers = existingAddresses
        .map((item) => parseInt(item.address))
        .filter((num) => !isNaN(num) && num >= 1 && num <= 255)
        .sort((a, b) => a - b);

      // Find the first available address in range 1-255
      let newAddress = 1;
      for (const num of addressNumbers) {
        if (newAddress < num) {
          break;
        }
        newAddress = num + 1;
      }

      // If we've exceeded 255, find a gap in the existing addresses
      if (newAddress > 255) {
        newAddress = null;
        for (let i = 1; i <= 255; i++) {
          if (!addressNumbers.includes(i)) {
            newAddress = i;
            break;
          }
        }

        if (newAddress === null) {
          throw new Error(
            `No available addresses in range 1-255 for ${tableName} duplication`
          );
        }
      }

      return newAddress.toString();
    } catch (error) {
      console.error(
        `Failed to find available address for ${tableName}:`,
        error
      );
      throw error;
    }
  }

  // CRUD Operations
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
  }

  getProjectById(id) {
    try {
      const stmt = this.db.prepare("SELECT * FROM projects WHERE id = ?");
      return stmt.get(id);
    } catch (error) {
      console.error("Failed to get project by id:", error);
      throw error;
    }
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  // Generic CRUD operations for project items
  getProjectItems(projectId, tableName) {
    try {
      // Sort by address ASC for tables with address field, except unit and schedule tables
      if (tableName === "unit") {
        const stmt = this.db.prepare(
          `SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY created_at DESC`
        );
        const items = stmt.all(projectId);
        // Parse RS485 and I/O config from JSON for unit items
        return items.map((item) => ({
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
        }));
      } else if (tableName === "schedule") {
        const stmt = this.db.prepare(
          `SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY name ASC`
        );
        return stmt.all(projectId);
      } else if (tableName === "multi_scenes") {
        const stmt = this.db.prepare(
          `SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC`
        );
        return stmt.all(projectId);
      } else {
        const stmt = this.db.prepare(
          `SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC`
        );
        return stmt.all(projectId);
      }
    } catch (error) {
      throw error;
    }
  }

  getProjectItemById(id, tableName) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      const item = stmt.get(id);

      // Parse RS485 and I/O config from JSON for unit items
      if (tableName === "unit" && item) {
        if (item.rs485_config) {
          item.rs485_config = JSON.parse(item.rs485_config);
        }
        if (item.input_configs) {
          item.input_configs = JSON.parse(item.input_configs);
        }
        if (item.output_configs) {
          item.output_configs = JSON.parse(item.output_configs);
        }
      }

      return item;
    } catch (error) {
      throw error;
    }
  }

  createProjectItem(projectId, itemData, tableName) {
    try {
      const {
        name,
        address,
        description,
        object_type,
        label,
        type,
        factor,
        feedback,
        rcu_group_id,
        knx_switch_group,
        knx_dimming_group,
        knx_value_group,
      } = itemData;

      // Special validation for lighting to prevent duplicate addresses
      if (tableName === "lighting" && address) {
        const existingItems = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM lighting WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`Address ${address} already exists.`);
        }
      }

      // Special validation for KNX
      if (tableName === "knx") {
        // Validate address range
        if (address < 0 || address > 511) {
          throw new Error("KNX address must be between 0 and 511.");
        }

        // Check for duplicate addresses
        const existingItems = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`KNX address ${address} already exists.`);
        }

        // Validate factor
        if (itemData.factor && itemData.factor < 1) {
          throw new Error("Factor must be greater than or equal to 1.");
        }
      }

      // Note: For aircon, we skip duplicate address validation here because
      // createAirconCard handles this validation at the card level before creating multiple items
      // with the same address but different object_types

      // Special validation for curtain to prevent duplicate addresses
      if (tableName === "curtain" && address) {
        const existingItems = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM curtain WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`Address ${address} already exists.`);
        }
      }

      // Special validation for scene - address is now required
      if (tableName === "scene") {
        if (!address || !address.trim()) {
          throw new Error("Address is required for scene.");
        }
        if (!name) {
          throw new Error("Scene name is required.");
        }

        // Check maximum scene limit (100 scenes)
        const sceneCount = this.db
          .prepare("SELECT COUNT(*) as count FROM scene WHERE project_id = ?")
          .get(projectId);
        if (sceneCount.count >= 100) {
          throw new Error("Maximum 100 scenes allowed per project.");
        }
      }

      // Special validation for multi_scenes
      if (tableName === "multi_scenes") {
        if (!name || !name.trim()) {
          throw new Error("Name is required for multi-scene.");
        }

        if (!address || !address.trim()) {
          throw new Error("Address is required for multi-scene.");
        }

        // Check for duplicate addresses
        const existingMultiScene = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM multi_scenes WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address.trim());
        if (existingMultiScene.count > 0) {
          throw new Error(
            `Multi-scene address ${address.trim()} already exists.`
          );
        }

        // Check maximum multi-scene limit (40 multi-scenes)
        const multiSceneCount = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM multi_scenes WHERE project_id = ?"
          )
          .get(projectId);
        if (multiSceneCount.count >= 40) {
          throw new Error("Maximum 40 multi-scenes allowed per project.");
        }
      }

      // Special validation for sequences
      if (tableName === "sequences") {
        if (!name || !name.trim()) {
          throw new Error("Name is required for sequence.");
        }

        if (!address || !address.trim()) {
          throw new Error("Address is required for sequence.");
        }

        // Check for duplicate addresses
        const existingSequence = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM sequences WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address.trim());
        if (existingSequence.count > 0) {
          throw new Error(`Sequence address ${address.trim()} already exists.`);
        }

        // Check maximum sequence limit (20 sequences)
        const sequenceCount = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM sequences WHERE project_id = ?"
          )
          .get(projectId);
        if (sequenceCount.count >= 20) {
          throw new Error("Maximum 20 sequences allowed per project.");
        }
      }

      // For aircon table, include label column
      if (tableName === "aircon") {
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, label)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description, label);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "curtain") {
        // Use specialized createCurtainItem method to handle address-to-ID mapping
        return this.createCurtainItem(projectId, itemData);
      } else if (tableName === "knx") {
        // For knx table, use new KNX-specific fields
        // Determine rcu_group_type based on KNX type
        let rcu_group_type = null;
        if (rcu_group_id) {
          const typeValue = parseInt(type) || 0;
          switch (typeValue) {
            case 1: // Switch
            case 2: // Dimmer
              rcu_group_type = "lighting";
              break;
            case 3: // Curtain
              rcu_group_type = "curtain";
              break;
            case 4: // Scene
              rcu_group_type = "scene";
              break;
            case 5: // Multi Scene
              rcu_group_type = "multi_scenes";
              break;
            case 6: // Sequences
              rcu_group_type = "sequences";
              break;
            case 7: // AC Power
            case 8: // AC Mode
            case 9: // AC Fan Speed
            case 10: // AC Swing
            case 11: // AC Set Point
              rcu_group_type = "aircon";
              break;
            default:
              rcu_group_type = null;
              break;
          }
        }

        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, type, factor, feedback, rcu_group_id, rcu_group_type, knx_switch_group, knx_dimming_group, knx_value_group, description)
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
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "scene") {
        // For scene table, don't use object_type and object_value
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description)
          VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "multi_scenes") {
        // For multi_scenes table, use type and address fields
        const { type, address } = itemData;
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, type, description)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          projectId,
          name,
          address,
          type || 0,
          description
        );
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "sequences") {
        // For sequences table, use address field
        const { address } = itemData;
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description)
          VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else {
        // For other tables, use original structure with object_type and object_value
        const object_value = this.getObjectValue(object_type);
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, object_type, object_value)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          projectId,
          name,
          address,
          description,
          object_type,
          object_value
        );
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      }
    } catch (error) {
      console.error(`Failed to create ${tableName} item:`, error);
      throw error;
    }
  }

  updateProjectItem(id, itemData, tableName) {
    try {
      const {
        name,
        address,
        description,
        object_type,
        label,
        curtain_type,
        curtain_value,
        open_group_id,
        close_group_id,
        stop_group_id,
        pause_period,
        transition_period,
        type,
        factor,
        feedback,
        rcu_group_id,
        knx_switch_group,
        knx_dimming_group,
        knx_value_group,
      } = itemData;

      // Special validation for aircon to prevent duplicate addresses
      if (tableName === "aircon" && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db
            .prepare(
              "SELECT COUNT(*) as count FROM aircon WHERE project_id = ? AND address = ? AND address != ?"
            )
            .get(currentItem.project_id, address, currentItem.address);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for lighting to prevent duplicate addresses
      if (tableName === "lighting" && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db
            .prepare(
              "SELECT COUNT(*) as count FROM lighting WHERE project_id = ? AND address = ? AND id != ?"
            )
            .get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for curtain to prevent duplicate addresses
      if (tableName === "curtain" && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db
            .prepare(
              "SELECT COUNT(*) as count FROM curtain WHERE project_id = ? AND address = ? AND id != ?"
            )
            .get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for scene - address is required and name length check
      if (tableName === "scene") {
        if (!address || !address.trim()) {
          throw new Error("Address is required for scene.");
        }
        if (!name) {
          throw new Error("Scene name is required.");
        }
      }

      // Special validation for KNX
      if (tableName === "knx") {
        // Validate address range
        if (address < 0 || address > 511) {
          throw new Error("KNX address must be between 0 and 511.");
        }

        // Check for duplicate addresses
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          const existingItems = this.db
            .prepare(
              "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ? AND id != ?"
            )
            .get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`KNX address ${address} already exists.`);
          }
        }

        // Validate factor
        if (factor && factor < 1) {
          throw new Error("Factor must be greater than or equal to 1.");
        }
      }

      // For aircon table, include label column
      if (tableName === "aircon") {
        // Get current item to check if address is changing
        const currentItem = this.getProjectItemById(id, tableName);

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, label = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, label, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // If address changed, update scene items that reference this aircon item
        if (currentItem && currentItem.address !== address) {
          console.log(
            `Updating scene items for aircon ${id}: ${currentItem.address} -> ${address}`
          );
          this.updateSceneItemsAddress(id, "aircon", address);
        }
      } else if (tableName === "curtain") {
        // For curtain table, include curtain-specific fields
        // Address is required for curtain items
        if (!address) {
          throw new Error("Address is required for curtain items.");
        }

        // Get current item to check if address is changing
        const currentItem = this.getProjectItemById(id, tableName);

        const object_value = this.getObjectValue(object_type);

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, curtain_type = ?, curtain_value = ?, open_group_id = ?, close_group_id = ?, stop_group_id = ?, pause_period = ?, transition_period = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(
          name,
          address,
          description,
          object_type,
          object_value,
          curtain_type,
          curtain_value || 3,
          open_group_id || null,
          close_group_id || null,
          stop_group_id || null,
          pause_period || 0,
          transition_period || 0,
          id
        );

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // If address changed, update scene items that reference this curtain item
        if (currentItem && currentItem.address !== address) {
          console.log(
            `Updating scene items for curtain ${id}: ${currentItem.address} -> ${address}`
          );
          this.updateSceneItemsAddress(id, "curtain", address);
        }
      } else if (tableName === "knx") {
        // For knx table, use new KNX-specific fields
        // Determine rcu_group_type based on KNX type
        let rcu_group_type = null;
        if (rcu_group_id) {
          const typeValue = parseInt(type) || 0;
          switch (typeValue) {
            case 1: // Switch
            case 2: // Dimmer
              rcu_group_type = "lighting";
              break;
            case 3: // Curtain
              rcu_group_type = "curtain";
              break;
            case 4: // Scene
              rcu_group_type = "scene";
              break;
            case 5: // Multi Scene
              rcu_group_type = "multi_scenes";
              break;
            case 6: // Sequences
              rcu_group_type = "sequences";
              break;
            case 7: // AC Power
            case 8: // AC Mode
            case 9: // AC Fan Speed
            case 10: // AC Swing
            case 11: // AC Set Point
              rcu_group_type = "aircon";
              break;
            default:
              rcu_group_type = null;
              break;
          }
        }

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
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
          throw new Error(`${tableName} item not found`);
        }
      } else if (tableName === "scene") {
        // For scene table, don't use object_type and object_value
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else if (tableName === "multi_scenes") {
        // For multi_scenes table, use type and address fields
        const { type, address } = itemData;

        // Validation for multi_scenes
        if (!name || !name.trim()) {
          throw new Error("Name is required for multi-scene.");
        }
        if (!address || !address.trim()) {
          throw new Error("Address is required for multi-scene.");
        }

        // Check for duplicate addresses (excluding current item)
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address.trim()) {
          const existingMultiScene = this.db
            .prepare(
              "SELECT COUNT(*) as count FROM multi_scenes WHERE project_id = ? AND address = ? AND id != ?"
            )
            .get(currentItem.project_id, address.trim(), id);
          if (existingMultiScene.count > 0) {
            throw new Error(
              `Multi-scene address ${address.trim()} already exists.`
            );
          }
        }

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, type = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, type || 0, description, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else if (tableName === "sequences") {
        // For sequences table, use address field
        const { address } = itemData;

        // Validation for sequences
        if (!name || !name.trim()) {
          throw new Error("Name is required for sequence.");
        }
        if (!address || !address.trim()) {
          throw new Error("Address is required for sequence.");
        }

        // Check for duplicate addresses (excluding current item)
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address.trim()) {
          const existingSequence = this.db
            .prepare(
              "SELECT COUNT(*) as count FROM sequences WHERE project_id = ? AND address = ? AND id != ?"
            )
            .get(currentItem.project_id, address.trim(), id);
          if (existingSequence.count > 0) {
            throw new Error(
              `Sequence address ${address.trim()} already exists.`
            );
          }
        }

        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else {
        // For other tables (like lighting), use original structure with object_type and object_value
        // Get current item to check if address is changing
        const currentItem = this.getProjectItemById(id, tableName);

        const object_value = this.getObjectValue(object_type);
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(
          name,
          address,
          description,
          object_type,
          object_value,
          id
        );

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }

        // If address changed and this is a table that can be used in scenes, update scene items
        if (
          currentItem &&
          currentItem.address !== address &&
          tableName === "lighting"
        ) {
          console.log(
            `Updating scene items for ${tableName} ${id}: ${currentItem.address} -> ${address}`
          );
          this.updateSceneItemsAddress(id, tableName, address);
        }
      }

      return this.getProjectItemById(id, tableName);
    } catch (error) {
      console.error(`Failed to update ${tableName} item:`, error);
      throw error;
    }
  }

  deleteProjectItem(id, tableName) {
    try {
      // Start transaction to ensure data consistency
      const transaction = this.db.transaction(() => {
        // For lighting, curtain, and aircon items, also remove from scene_items and scene_address_items
        if (
          tableName === "lighting" ||
          tableName === "curtain" ||
          tableName === "aircon"
        ) {
          // Get all scene items that reference this item
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

          // Remove from scene_address_items first
          const deleteAddressItemStmt = this.db.prepare(`
            DELETE FROM scene_address_items
            WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ?
          `);

          for (const sceneItem of sceneItems) {
            deleteAddressItemStmt.run(
              sceneItem.project_id,
              sceneItem.address,
              sceneItem.item_type,
              sceneItem.item_id
            );
          }

          // Remove from scene_items
          const deleteSceneItemStmt = this.db.prepare(`
            DELETE FROM scene_items WHERE item_type = ? AND item_id = ?
          `);
          deleteSceneItemStmt.run(tableName, id);
        }

        // Delete the main item
        // Note: For scene, multi_scenes, and sequences, foreign key constraints with CASCADE DELETE
        // will automatically handle cleanup of related records in:
        // - scene deletion: schedule_scenes, multi_scene_scenes
        // - multi_scenes deletion: multi_scene_scenes, sequence_multi_scenes
        // - sequences deletion: sequence_multi_scenes
        // - schedule deletion: schedule_scenes
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
  }

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

      // Add object_type only for tables that use it (not aircon, knx, scene, multi_scenes)
      if (
        tableName !== "aircon" &&
        tableName !== "knx" &&
        tableName !== "scene" &&
        tableName !== "multi_scenes"
      ) {
        duplicatedItem.object_type = originalItem.object_type;
      }

      // For lighting, find a unique address in range 1-255
      if (tableName === "lighting" && originalItem.address) {
        duplicatedItem.address = this.findNextAvailableAddress(
          originalItem.project_id,
          "lighting"
        );
      }

      // For aircon, include label and find unique address in range 1-255
      if (tableName === "aircon") {
        duplicatedItem.label = originalItem.label;

        if (originalItem.address) {
          duplicatedItem.address = this.findNextAvailableAddress(
            originalItem.project_id,
            "aircon"
          );
        }
      }

      // For curtain, find a unique address in range 1-255 and include curtain-specific fields
      if (tableName === "curtain" && originalItem.address) {
        duplicatedItem.address = this.findNextAvailableAddress(
          originalItem.project_id,
          "curtain"
        );
        duplicatedItem.curtain_type =
          originalItem.curtain_type || "CURTAIN_PULSE_2P";
        duplicatedItem.curtain_value = originalItem.curtain_value || 3;
        duplicatedItem.open_group_id = originalItem.open_group_id || null;
        duplicatedItem.close_group_id = originalItem.close_group_id || null;
        duplicatedItem.stop_group_id = originalItem.stop_group_id || null;
        duplicatedItem.pause_period = originalItem.pause_period || 0;
        duplicatedItem.transition_period = originalItem.transition_period || 0;
      }

      // For scene, find a unique address in range 1-255 if address exists
      if (tableName === "scene" && originalItem.address) {
        duplicatedItem.address = this.findNextAvailableAddress(
          originalItem.project_id,
          "scene"
        );
      }

      // For KNX, find a unique address if address exists
      if (
        tableName === "knx" &&
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

      // For multi_scenes, copy type and address fields
      if (tableName === "multi_scenes") {
        duplicatedItem.type = originalItem.type || 0;
        duplicatedItem.address = originalItem.address || "";
      }

      return this.createProjectItem(
        originalItem.project_id,
        duplicatedItem,
        tableName
      );
    } catch (error) {
      console.error(`Failed to duplicate ${tableName} item:`, error);
      throw error;
    }
  }

  // Import project with all items
  importProject(projectData, itemsData) {
    try {
      // Start transaction
      const transaction = this.db.transaction(() => {
        // Create project
        const project = this.createProject(projectData);

        // Import items for each category
        const categories = [
          "lighting",
          "aircon",
          "unit",
          "curtain",
          "knx",
          "scene",
          "schedule",
          "multi_scenes",
          "sequences",
        ];
        const importedCounts = {};
        const idMappings = {
          scene: {},
          schedule: {},
          multi_scenes: {},
          sequences: {},
        };

        categories.forEach((category) => {
          const items = itemsData[category] || [];
          importedCounts[category] = 0;

          items.forEach((itemData) => {
            let newItem;

            if (category === "unit") {
              newItem = this.createUnitItem(project.id, itemData);
            } else if (category === "aircon") {
              // Ensure label is set for aircon items
              if (!itemData.label) {
                itemData.label = "Aircon";
              }
              newItem = this.createProjectItem(project.id, itemData, "aircon");
            } else if (category === "schedule") {
              newItem = this.createScheduleItem(project.id, itemData);
            } else if (category === "knx") {
              // Handle KNX items with special logic for RCU group references
              newItem = this.createKnxItem(project.id, itemData);
            } else if (category === "curtain") {
              // Handle Curtain items with special logic for lighting group references
              newItem = this.createCurtainItem(project.id, itemData);
            } else {
              newItem = this.createProjectItem(project.id, itemData, category);
            }

            // Store ID mapping for relationships
            if (
              ["scene", "schedule", "multi_scenes", "sequences"].includes(
                category
              )
            ) {
              idMappings[category][itemData.id] = newItem.id;
            }

            importedCounts[category]++;
          });
        });

        // Import relationship tables after all main items are created
        this.importProjectRelationships(itemsData, project.id, idMappings);

        // Update KNX items to resolve RCU group addresses to new IDs
        this.updateKnxRcuGroupReferences(project.id, itemsData);

        return { project, importedCounts };
      });

      return transaction();
    } catch (error) {
      console.error("Failed to import project:", error);
      throw error;
    }
  }

  // Helper method to import all relationship tables
  importProjectRelationships(itemsData, newProjectId, idMappings) {
    try {
      // Import scene_items
      const sceneItems = itemsData.scene_items || [];
      sceneItems.forEach((sceneItem) => {
        let newSceneId = null;
        let newItemId = null;

        // Handle both old format (scene_id) and new format (scene_address)
        if (sceneItem.scene_address) {
          newSceneId = this.findSceneIdByAddress(
            newProjectId,
            sceneItem.scene_address
          );
        } else if (sceneItem.scene_id) {
          newSceneId = idMappings.scene[sceneItem.scene_id]; // Backward compatibility
        }

        // Handle both old format (item_id) and new format (item_address)
        if (sceneItem.item_address && sceneItem.item_type) {
          newItemId = this.findItemIdByAddress(
            newProjectId,
            sceneItem.item_address,
            sceneItem.item_type
          );
        } else if (sceneItem.item_id) {
          newItemId = sceneItem.item_id; // Backward compatibility - may not work cross-machine
        }

        if (newSceneId && newItemId) {
          const stmt = this.db.prepare(`
            INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            newSceneId,
            sceneItem.item_type,
            newItemId,
            sceneItem.item_address,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type,
            sceneItem.object_value
          );
        }
      });

      // Import scene_address_items
      const sceneAddressItems = itemsData.scene_address_items || [];
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

      // Import schedule_scenes
      const scheduleScenes = itemsData.schedule_scenes || [];
      scheduleScenes.forEach((scheduleScene) => {
        let newScheduleId = null;
        let newSceneId = null;

        // Handle both old format (schedule_id) and new format (schedule_identifier)
        if (scheduleScene.schedule_identifier) {
          newScheduleId = this.findScheduleIdByIdentifier(
            newProjectId,
            scheduleScene.schedule_identifier
          );
        } else if (scheduleScene.schedule_id) {
          newScheduleId = idMappings.schedule[scheduleScene.schedule_id]; // Backward compatibility
        }

        // Handle both old format (scene_id) and new format (scene_address)
        if (scheduleScene.scene_address) {
          newSceneId = this.findSceneIdByAddress(
            newProjectId,
            scheduleScene.scene_address
          );
        } else if (scheduleScene.scene_id) {
          newSceneId = idMappings.scene[scheduleScene.scene_id]; // Backward compatibility
        }

        if (newScheduleId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO schedule_scenes (schedule_id, scene_id)
            VALUES (?, ?)
          `);
          stmt.run(newScheduleId, newSceneId);
        }
      });

      // Import multi_scene_scenes
      const multiSceneScenes = itemsData.multi_scene_scenes || [];
      multiSceneScenes.forEach((multiSceneScene) => {
        let newMultiSceneId = null;
        let newSceneId = null;

        // Handle both old format (multi_scene_id) and new format (multi_scene_address)
        if (multiSceneScene.multi_scene_address) {
          newMultiSceneId = this.findMultiSceneIdByAddress(
            newProjectId,
            multiSceneScene.multi_scene_address
          );
        } else if (multiSceneScene.multi_scene_id) {
          newMultiSceneId =
            idMappings.multi_scenes[multiSceneScene.multi_scene_id]; // Backward compatibility
        }

        // Handle both old format (scene_id) and new format (scene_address)
        if (multiSceneScene.scene_address) {
          newSceneId = this.findSceneIdByAddress(
            newProjectId,
            multiSceneScene.scene_address
          );
        } else if (multiSceneScene.scene_id) {
          newSceneId = idMappings.scene[multiSceneScene.scene_id]; // Backward compatibility
        }

        if (newMultiSceneId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO multi_scene_scenes (multi_scene_id, scene_id, scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(newMultiSceneId, newSceneId, multiSceneScene.scene_order);
        }
      });

      // Import sequence_multi_scenes
      const sequenceMultiScenes = itemsData.sequence_multi_scenes || [];
      sequenceMultiScenes.forEach((sequenceMultiScene) => {
        let newSequenceId = null;
        let newMultiSceneId = null;

        // Handle both old format (sequence_id) and new format (sequence_address)
        if (sequenceMultiScene.sequence_address) {
          newSequenceId = this.findSequenceIdByAddress(
            newProjectId,
            sequenceMultiScene.sequence_address
          );
        } else if (sequenceMultiScene.sequence_id) {
          newSequenceId = idMappings.sequences[sequenceMultiScene.sequence_id]; // Backward compatibility
        }

        // Handle both old format (multi_scene_id) and new format (multi_scene_address)
        if (sequenceMultiScene.multi_scene_address) {
          newMultiSceneId = this.findMultiSceneIdByAddress(
            newProjectId,
            sequenceMultiScene.multi_scene_address
          );
        } else if (sequenceMultiScene.multi_scene_id) {
          newMultiSceneId =
            idMappings.multi_scenes[sequenceMultiScene.multi_scene_id]; // Backward compatibility
        }

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
      console.error("Failed to import project relationships:", error);
      throw error;
    }
  }

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
  }

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
  }

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
        const typeValue = parseInt(type) || 0;
        switch (typeValue) {
          case 1: // Switch
          case 2: // Dimmer
            finalRcuGroupType = "lighting";
            break;
          case 3: // Curtain
            finalRcuGroupType = "curtain";
            break;
          case 4: // Scene
            finalRcuGroupType = "scene";
            break;
          case 5: // Multi Scene
            finalRcuGroupType = "multi_scenes";
            break;
          case 6: // Sequences
            finalRcuGroupType = "sequences";
            break;
          case 7: // AC Power
          case 8: // AC Mode
          case 9: // AC Fan Speed
          case 10: // AC Swing
          case 11: // AC Set Point
            finalRcuGroupType = "aircon";
            break;
          default:
            finalRcuGroupType = null;
            break;
        }
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
  }

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
        finalOpenGroupId = this.findLightingIdByAddress(
          projectId,
          open_group_address
        );
      } else if (open_group_id) {
        finalOpenGroupId = open_group_id; // Backward compatibility
      }

      if (close_group_address) {
        finalCloseGroupId = this.findLightingIdByAddress(
          projectId,
          close_group_address
        );
      } else if (close_group_id) {
        finalCloseGroupId = close_group_id; // Backward compatibility
      }

      if (stop_group_address) {
        finalStopGroupId = this.findLightingIdByAddress(
          projectId,
          stop_group_address
        );
      } else if (stop_group_id) {
        finalStopGroupId = stop_group_id; // Backward compatibility
      }

      const object_value = this.getObjectValue(object_type);

      const stmt = this.db.prepare(`
        INSERT INTO curtain (project_id, name, address, description, object_type, object_value, curtain_type, curtain_value, open_group_id, close_group_id, stop_group_id, pause_period, transition_period)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        transition_period || 0
      );

      return this.getProjectItemById(result.lastInsertRowid, "curtain");
    } catch (error) {
      console.error("Failed to create Curtain item:", error);
      throw error;
    }
  }

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
      console.error(
        `Failed to find lighting ID for address ${address}:`,
        error
      );
      return null;
    }
  }

  // Find scene ID by address in the new project
  findSceneIdByAddress(projectId, address) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM scene
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(`Failed to find scene ID for address ${address}:`, error);
      return null;
    }
  }

  // Find item ID by address and type in the new project
  findItemIdByAddress(projectId, address, itemType) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM ${itemType}
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(
        `Failed to find ${itemType} ID for address ${address}:`,
        error
      );
      return null;
    }
  }

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
  }

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
  }

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
  }

  // Bulk import items for a specific category
  bulkImportItems(projectId, items, category) {
    try {
      const transaction = this.db.transaction(() => {
        const importedItems = [];

        items.forEach((itemData) => {
          let item;
          if (category === "unit") {
            item = this.createUnitItem(projectId, itemData);
          } else if (category === "aircon") {
            item = this.createProjectItem(projectId, itemData, "aircon");
          } else if (category === "schedule") {
            item = this.createScheduleItem(projectId, itemData);
          } else if (category === "scene") {
            item = this.bulkImportSingleScene(projectId, itemData);
          } else {
            item = this.createProjectItem(projectId, itemData, category);
          }
          importedItems.push(item);
        });

        return importedItems;
      });

      return transaction();
    } catch (error) {
      console.error(`Failed to bulk import ${category} items:`, error);
      throw error;
    }
  }

  // Bulk import a single scene with its items
  bulkImportSingleScene(projectId, sceneData) {
    try {
      // Find next available address to avoid conflicts
      const availableAddress = this.findNextAvailableAddress(
        projectId,
        "scene"
      );

      // Create the scene first
      const scene = this.createProjectItem(
        projectId,
        {
          name: sceneData.name,
          address: availableAddress.toString(),
          description: sceneData.description,
        },
        "scene"
      );

      // Process each scene item
      if (sceneData.items && sceneData.items.length > 0) {
        for (const itemData of sceneData.items) {
          // Find or create the item based on type and address
          const item = this.findOrCreateItemForScene(projectId, itemData);

          if (item) {
            // Add item to scene
            this.addItemToScene(
              scene.id,
              itemData.itemType,
              item.id,
              itemData.value,
              itemData.command,
              itemData.objectType
            );
          }
        }
      }

      return scene;
    } catch (error) {
      console.error("Failed to bulk import single scene:", error);
      throw error;
    }
  }

  // Find or create item for scene import
  findOrCreateItemForScene(projectId, itemData) {
    try {
      const { itemType, address, itemName } = itemData;

      if (!address) {
        console.warn("No address provided for item:", itemData);
        return null;
      }

      let tableName = itemType;
      let existingItem = null;

      // Find existing item by address
      if (itemType === "lighting") {
        existingItem = this.db
          .prepare(
            "SELECT * FROM lighting WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address);
      } else if (itemType === "aircon") {
        existingItem = this.db
          .prepare("SELECT * FROM aircon WHERE project_id = ? AND address = ?")
          .get(projectId, address);
      } else if (itemType === "curtain") {
        existingItem = this.db
          .prepare("SELECT * FROM curtain WHERE project_id = ? AND address = ?")
          .get(projectId, address);
      }

      // If item exists, return it
      if (existingItem) {
        return existingItem;
      }

      // Create new item
      const newItemData = {
        name: itemName || `${itemType} ${address}`,
        address: address,
        description: `Auto-created from scene import`,
      };

      // Add type-specific properties
      if (itemType === "lighting") {
        newItemData.object_type = "OBJ_LIGHTING";
        newItemData.object_value = 1;
      } else if (itemType === "curtain") {
        newItemData.object_type = "OBJ_CURTAIN";
        newItemData.object_value = 2;
        newItemData.curtain_type = "";
        newItemData.curtain_value = 0;
        newItemData.pause_period = 0;
        newItemData.transition_period = 0;
      } else if (itemType === "aircon") {
        newItemData.label = "Aircon";
      }

      return this.createProjectItem(projectId, newItemData, tableName);
    } catch (error) {
      console.error("Failed to find or create item for scene:", error);
      return null;
    }
  }

  // Specific methods for each category
  // Lighting
  getLightingItems(projectId) {
    return this.getProjectItems(projectId, "lighting");
  }

  createLightingItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "lighting");
  }

  updateLightingItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "lighting");
  }

  deleteLightingItem(id) {
    return this.deleteProjectItem(id, "lighting");
  }

  duplicateLightingItem(id) {
    return this.duplicateProjectItem(id, "lighting");
  }

  // Aircon - Special handling for aircon cards and items
  getAirconItems(projectId) {
    return this.getProjectItems(projectId, "aircon");
  }

  // Get aircon cards (each item is now a card)
  getAirconCards(projectId) {
    try {
      const items = this.db
        .prepare(
          "SELECT * FROM aircon WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC"
        )
        .all(projectId);

      // Each item is now a card
      return items.map((item) => ({
        name: item.name,
        address: item.address,
        description: item.description,
        item: item,
      }));
    } catch (error) {
      console.error("Failed to get aircon cards:", error);
      throw error;
    }
  }

  // Create a new aircon card (creates 1 item with general aircon type)
  createAirconCard(projectId, cardData) {
    try {
      const { name, address, description } = cardData;

      // Ensure address is treated as string for consistency
      const addressStr = address.toString();

      // Check if address already exists for this project
      const existingItems = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM aircon WHERE project_id = ? AND address = ?"
        )
        .get(projectId, addressStr);

      if (existingItems.count > 0) {
        throw new Error(`Address ${addressStr} already exists.`);
      }

      // Create single aircon item
      const itemData = {
        name,
        address: addressStr,
        description,
        label: "Aircon",
      };

      const item = this.createProjectItem(projectId, itemData, "aircon");
      return [item]; // Return as array for compatibility
    } catch (error) {
      console.error("Failed to create aircon card:", error);
      throw error;
    }
  }

  createAirconItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "aircon");
  }

  updateAirconItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "aircon");
  }

  deleteAirconItem(id) {
    return this.deleteProjectItem(id, "aircon");
  }

  // Delete entire aircon card (all items with same address)
  deleteAirconCard(projectId, address) {
    try {
      const stmt = this.db.prepare(
        "DELETE FROM aircon WHERE project_id = ? AND address = ?"
      );
      const result = stmt.run(projectId, address);

      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error("Failed to delete aircon card:", error);
      throw error;
    }
  }

  duplicateAirconItem(id) {
    return this.duplicateProjectItem(id, "aircon");
  }

  // Duplicate entire aircon card
  duplicateAirconCard(projectId, address) {
    try {
      const item = this.db
        .prepare("SELECT * FROM aircon WHERE project_id = ? AND address = ?")
        .get(projectId, address);

      if (!item) {
        throw new Error("Aircon card not found");
      }

      // Find a unique numeric address for the duplicated card in range 1-255
      const newAddress = this.findNextAvailableAddress(projectId, "aircon");

      const duplicatedItem = {
        name: item.name ? `${item.name} (Copy)` : null,
        address: newAddress,
        description: item.description,
        label: item.label,
      };

      const newItem = this.createProjectItem(
        projectId,
        duplicatedItem,
        "aircon"
      );
      return [newItem]; // Return as array for compatibility
    } catch (error) {
      console.error("Failed to duplicate aircon card:", error);
      throw error;
    }
  }

  // Unit - Special handling for unit table structure
  getUnitItems(projectId) {
    return this.getProjectItems(projectId, "unit");
  }

  createUnitItem(projectId, itemData) {
    try {
      const {
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load,
        recovery_mode,
        description,
        discovered_at,
        rs485_config,
        input_configs,
        output_configs,
      } = itemData;

      const stmt = this.db.prepare(`
        INSERT INTO unit (
          project_id, type, serial_no, ip_address,
          id_can, mode, firmware_version, hardware_version,
          manufacture_date, can_load, recovery_mode, description, discovered_at, rs485_config, input_configs, output_configs
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        projectId,
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load ? 1 : 0,
        recovery_mode ? 1 : 0,
        description,
        discovered_at,
        rs485_config ? JSON.stringify(rs485_config) : null,
        input_configs ? JSON.stringify(input_configs) : null,
        output_configs ? JSON.stringify(output_configs) : null
      );

      return this.getProjectItemById(result.lastInsertRowid, "unit");
    } catch (error) {
      console.error("Failed to create unit item:", error);
      throw error;
    }
  }

  updateUnitItem(id, itemData) {
    try {
      const {
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load,
        recovery_mode,
        description,
        discovered_at,
        rs485_config,
        input_configs,
        output_configs,
      } = itemData;

      const stmt = this.db.prepare(`
        UPDATE unit
        SET type = ?, serial_no = ?, ip_address = ?,
            id_can = ?, mode = ?, firmware_version = ?, hardware_version = ?,
            manufacture_date = ?, can_load = ?, recovery_mode = ?, description = ?,
            discovered_at = ?, rs485_config = ?, input_configs = ?, output_configs = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load ? 1 : 0,
        recovery_mode ? 1 : 0,
        description,
        discovered_at,
        rs485_config ? JSON.stringify(rs485_config) : null,
        input_configs ? JSON.stringify(input_configs) : null,
        output_configs ? JSON.stringify(output_configs) : null,
        id
      );

      if (result.changes === 0) {
        throw new Error("Unit item not found");
      }

      return this.getProjectItemById(id, "unit");
    } catch (error) {
      console.error("Failed to update unit item:", error);
      throw error;
    }
  }

  deleteUnitItem(id) {
    return this.deleteProjectItem(id, "unit");
  }

  // Unit I/O Configuration methods (JSON-based)
  getUnitInputConfig(unitId, inputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.input_configs) {
        return null;
      }

      const inputConfigs = unit.input_configs;
      const inputConfig = inputConfigs.inputs?.find(
        (input) => input.index === inputIndex
      );

      if (inputConfig) {
        return {
          unit_id: unitId,
          input_index: inputIndex,
          function_value: inputConfig.function_value || 0,
          lighting_id: inputConfig.lighting_id || null,
          multi_group_config: inputConfig.multi_group_config || [],
          rlc_config: inputConfig.rlc_config || {},
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get unit input config:", error);
      throw error;
    }
  }

  getUnitOutputConfig(unitId, outputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.output_configs) {
        return null;
      }

      const outputConfigs = unit.output_configs;
      const outputConfig = outputConfigs.outputs?.find(
        (output) => output.index === outputIndex
      );

      if (outputConfig) {
        return {
          unit_id: unitId,
          output_index: outputIndex,
          output_type: outputConfig.type,
          config_data: outputConfig.config || {},
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get unit output config:", error);
      throw error;
    }
  }

  saveUnitInputConfig(
    unitId,
    inputIndex,
    functionValue,
    lightingId,
    multiGroupConfig,
    rlcConfig
  ) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit) {
        throw new Error("Unit not found");
      }

      // Get current input configs or create new structure
      let inputConfigs = unit.input_configs || { inputs: [] };

      // Find existing input config or create new one
      const existingIndex = inputConfigs.inputs.findIndex(
        (input) => input.index === inputIndex
      );
      const inputConfig = {
        index: inputIndex,
        function_value: functionValue || 0,
        lighting_id: lightingId || null,
        multi_group_config: multiGroupConfig || [],
        rlc_config: rlcConfig || {},
      };

      if (existingIndex >= 0) {
        inputConfigs.inputs[existingIndex] = inputConfig;
      } else {
        inputConfigs.inputs.push(inputConfig);
      }

      // Sort by index
      inputConfigs.inputs.sort((a, b) => a.index - b.index);

      // Update unit with new input configs
      const result = this.updateUnitItem(unitId, {
        ...unit,
        input_configs: inputConfigs,
      });

      return this.getUnitInputConfig(unitId, inputIndex);
    } catch (error) {
      console.error("Failed to save unit input config:", error);
      throw error;
    }
  }

  saveUnitOutputConfig(unitId, outputIndex, outputType, configData) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit) {
        throw new Error("Unit not found");
      }

      // Get current output configs or create new structure
      let outputConfigs = unit.output_configs || { outputs: [] };

      // Find existing output config or create new one
      const existingIndex = outputConfigs.outputs.findIndex(
        (output) => output.index === outputIndex
      );

      // Remove deviceId, deviceType, and address from config data to avoid duplication
      // For AC outputs, address is equivalent to deviceId and should be stored at output level
      const { deviceId, deviceType, address, ...cleanConfigData } = configData;

      const outputConfig = {
        index: outputIndex,
        type: outputType,
        device_id: deviceId || null,
        device_type:
          deviceType || (outputType === "ac" ? "aircon" : "lighting"),
        name: cleanConfigData.name || `${outputType} ${outputIndex + 1}`,
        config: cleanConfigData,
      };

      if (existingIndex >= 0) {
        outputConfigs.outputs[existingIndex] = outputConfig;
      } else {
        outputConfigs.outputs.push(outputConfig);
      }

      // Sort by index
      outputConfigs.outputs.sort((a, b) => a.index - b.index);

      // Update unit with new output configs
      const result = this.updateUnitItem(unitId, {
        ...unit,
        output_configs: outputConfigs,
      });

      return this.getUnitOutputConfig(unitId, outputIndex);
    } catch (error) {
      console.error("Failed to save unit output config:", error);
      throw error;
    }
  }

  getAllUnitInputConfigs(unitId) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.input_configs) {
        return [];
      }

      const inputConfigs = unit.input_configs;
      return (inputConfigs.inputs || []).map((input) => ({
        unit_id: unitId,
        input_index: input.index,
        function_value: input.function_value || 0,
        lighting_id: input.lighting_id || null,
        multi_group_config: input.multi_group_config || [],
        rlc_config: input.rlc_config || {},
      }));
    } catch (error) {
      console.error("Failed to get all unit input configs:", error);
      throw error;
    }
  }

  getAllUnitOutputConfigs(unitId) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.output_configs) {
        return [];
      }

      const outputConfigs = unit.output_configs;
      return (outputConfigs.outputs || []).map((output) => ({
        unit_id: unitId,
        output_index: output.index,
        output_type: output.type,
        device_id: output.device_id,
        device_type: output.device_type,
        config_data: output.config || {},
      }));
    } catch (error) {
      console.error("Failed to get all unit output configs:", error);
      throw error;
    }
  }

  deleteUnitInputConfig(unitId, inputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.input_configs) {
        return false;
      }

      let inputConfigs = unit.input_configs;
      const originalLength = inputConfigs.inputs?.length || 0;

      // Remove the input config
      inputConfigs.inputs = (inputConfigs.inputs || []).filter(
        (input) => input.index !== inputIndex
      );

      if (inputConfigs.inputs.length < originalLength) {
        // Update unit with new input configs
        this.updateUnitItem(unitId, {
          ...unit,
          input_configs: inputConfigs,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete unit input config:", error);
      throw error;
    }
  }

  deleteUnitOutputConfig(unitId, outputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.output_configs) {
        return false;
      }

      let outputConfigs = unit.output_configs;
      const originalLength = outputConfigs.outputs?.length || 0;

      // Remove the output config
      outputConfigs.outputs = (outputConfigs.outputs || []).filter(
        (output) => output.index !== outputIndex
      );

      if (outputConfigs.outputs.length < originalLength) {
        // Update unit with new output configs
        this.updateUnitItem(unitId, {
          ...unit,
          output_configs: outputConfigs,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete unit output config:", error);
      throw error;
    }
  }

  // Clear all I/O configurations for a unit (used when unit type changes)
  clearAllUnitIOConfigs(unitId) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit) {
        return false;
      }

      // Clear both input and output configs
      this.updateUnitItem(unitId, {
        ...unit,
        input_configs: null,
        output_configs: null,
      });

      return true;
    } catch (error) {
      console.error("Failed to clear all unit I/O configs:", error);
      throw error;
    }
  }

  duplicateUnitItem(id) {
    try {
      const originalItem = this.getProjectItemById(id, "unit");

      if (!originalItem) {
        throw new Error("Unit item not found");
      }

      const duplicatedItem = {
        type: originalItem.type,
        serial_no: originalItem.serial_no,
        ip_address: originalItem.ip_address,
        id_can: originalItem.id_can,
        mode: originalItem.mode,
        firmware_version: originalItem.firmware_version,
        description: originalItem.description,
      };

      return this.createUnitItem(originalItem.project_id, duplicatedItem);
    } catch (error) {
      console.error("Failed to duplicate unit item:", error);
      throw error;
    }
  }

  // Curtain
  getCurtainItems(projectId) {
    return this.getProjectItems(projectId, "curtain");
  }

  createCurtainItemSimple(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "curtain");
  }

  updateCurtainItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "curtain");
  }

  deleteCurtainItem(id) {
    return this.deleteProjectItem(id, "curtain");
  }

  duplicateCurtainItem(id) {
    return this.duplicateProjectItem(id, "curtain");
  }

  // Scene
  getSceneItems(projectId) {
    return this.getProjectItems(projectId, "scene");
  }

  createSceneItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "scene");
  }

  updateSceneItem(id, itemData) {
    try {
      // Start transaction to handle address changes
      const transaction = this.db.transaction(() => {
        // Get current scene info
        const currentScene = this.getProjectItemById(id, "scene");
        if (!currentScene) {
          throw new Error("Scene not found");
        }

        // Check if address is changing
        if (currentScene.address !== itemData.address) {
          // Get all scene items for this scene
          const sceneItems = this.db
            .prepare("SELECT * FROM scene_items WHERE scene_id = ?")
            .all(id);

          // Remove old address items from scene_address_items
          const deleteOldAddressItemStmt = this.db.prepare(`
            DELETE FROM scene_address_items
            WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
          `);

          for (const sceneItem of sceneItems) {
            deleteOldAddressItemStmt.run(
              currentScene.project_id,
              currentScene.address,
              sceneItem.item_type,
              sceneItem.item_id,
              sceneItem.object_type
            );
          }

          // Check if new address items are available
          const checkNewAddressStmt = this.db.prepare(`
            SELECT COUNT(*) as count FROM scene_address_items
            WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
          `);

          for (const sceneItem of sceneItems) {
            const existingItem = checkNewAddressStmt.get(
              currentScene.project_id,
              itemData.address,
              sceneItem.item_type,
              sceneItem.item_id,
              sceneItem.object_type
            );

            if (existingItem.count > 0) {
              throw new Error(
                `Item is already used by another scene with address ${itemData.address}`
              );
            }
          }

          // Add new address items to scene_address_items
          const addNewAddressItemStmt = this.db.prepare(`
            INSERT INTO scene_address_items (project_id, address, item_type, item_id, object_type, object_value)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          for (const sceneItem of sceneItems) {
            const object_value = this.getObjectValue(sceneItem.object_type);
            addNewAddressItemStmt.run(
              currentScene.project_id,
              itemData.address,
              sceneItem.item_type,
              sceneItem.item_id,
              sceneItem.object_type,
              object_value
            );
          }
        }

        // Update the scene
        return this.updateProjectItem(id, itemData, "scene");
      });

      return transaction();
    } catch (error) {
      console.error("Failed to update scene item:", error);
      throw error;
    }
  }

  deleteSceneItem(id) {
    try {
      // Start transaction to ensure data consistency
      const transaction = this.db.transaction(() => {
        // Get scene info before deleting
        const scene = this.db
          .prepare("SELECT project_id, address FROM scene WHERE id = ?")
          .get(id);
        if (!scene) {
          throw new Error("Scene not found");
        }

        // Get all scene items for this scene
        const sceneItems = this.db
          .prepare("SELECT * FROM scene_items WHERE scene_id = ?")
          .all(id);

        // Remove all items from scene_address_items
        const deleteAddressItemStmt = this.db.prepare(`
          DELETE FROM scene_address_items
          WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
        `);

        for (const sceneItem of sceneItems) {
          deleteAddressItemStmt.run(
            scene.project_id,
            scene.address,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.object_type
          );
        }

        // Delete the scene (this will cascade delete scene_items due to foreign key)
        const deleteSceneStmt = this.db.prepare(
          "DELETE FROM scene WHERE id = ?"
        );
        const result = deleteSceneStmt.run(id);

        if (result.changes === 0) {
          throw new Error("Scene item not found");
        }

        return { success: true, deletedId: id };
      });

      return transaction();
    } catch (error) {
      console.error("Failed to delete scene item:", error);
      throw error;
    }
  }

  duplicateSceneItem(id) {
    try {
      // Start transaction
      const transaction = this.db.transaction(() => {
        // Duplicate the scene (this will automatically find a new unique address)
        const duplicatedScene = this.duplicateProjectItem(id, "scene");

        // Get original scene items
        const originalSceneItems = this.getSceneItemsWithDetails(id);

        // Duplicate scene items - addItemToScene will handle scene_address_items automatically
        for (const sceneItem of originalSceneItems) {
          this.addItemToScene(
            duplicatedScene.id,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type
          );
        }

        return duplicatedScene;
      });

      return transaction();
    } catch (error) {
      console.error("Failed to duplicate scene with items:", error);
      throw error;
    }
  }

  // Helper method to update scene items when item addresses change
  updateSceneItemsAddress(itemId, itemType, newAddress) {
    try {
      const stmt = this.db.prepare(`
        UPDATE scene_items
        SET item_address = ?
        WHERE item_id = ? AND item_type = ?
      `);

      const result = stmt.run(newAddress, itemId, itemType);
      console.log(
        `Updated ${result.changes} scene items with new address ${newAddress} for ${itemType} item ${itemId}`
      );

      return result.changes;
    } catch (error) {
      console.error("Failed to update scene items address:", error);
      throw error;
    }
  }

  // Scene Items Management
  getSceneItemsWithDetails(sceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT
          si.*,
          CASE
            WHEN si.item_type = 'lighting' THEN l.name
            WHEN si.item_type = 'aircon' THEN ai.name
            WHEN si.item_type = 'curtain' THEN c.name
          END as item_name,
          si.item_address,
          CASE
            WHEN si.item_type = 'lighting' THEN l.description
            WHEN si.item_type = 'aircon' THEN ai.description
            WHEN si.item_type = 'curtain' THEN c.description
          END as item_description,
          CASE
            WHEN si.item_type = 'lighting' THEN l.object_type
            WHEN si.item_type = 'aircon' THEN si.object_type
            WHEN si.item_type = 'curtain' THEN c.object_type
            ELSE si.object_type
          END as object_type,
          CASE
            WHEN si.item_type = 'aircon' THEN ai.label
            ELSE NULL
          END as label
        FROM scene_items si
        LEFT JOIN lighting l ON si.item_type = 'lighting' AND si.item_id = l.id
        LEFT JOIN aircon ai ON si.item_type = 'aircon' AND si.item_id = ai.id
        LEFT JOIN curtain c ON si.item_type = 'curtain' AND si.item_id = c.id
        WHERE si.scene_id = ?
        ORDER BY si.created_at ASC
      `);

      return stmt.all(sceneId);
    } catch (error) {
      console.error("Failed to get scene items with details:", error);
      throw error;
    }
  }

  addItemToScene(
    sceneId,
    itemType,
    itemId,
    itemValue = null,
    command = null,
    objectType = null
  ) {
    try {
      // Get scene info to check address and project
      const scene = this.db
        .prepare("SELECT project_id, address FROM scene WHERE id = ?")
        .get(sceneId);
      if (!scene) {
        throw new Error("Scene not found");
      }

      // Check scene items limit (60 items maximum)
      const currentItemCount = this.db
        .prepare("SELECT COUNT(*) as count FROM scene_items WHERE scene_id = ?")
        .get(sceneId);
      if (currentItemCount.count >= 60) {
        throw new Error("Maximum 60 items allowed per scene");
      }

      // Get item address from the corresponding table
      let itemAddress = null;
      if (itemType === "lighting") {
        const item = this.db
          .prepare("SELECT address FROM lighting WHERE id = ?")
          .get(itemId);
        itemAddress = item?.address;
      } else if (itemType === "aircon") {
        const item = this.db
          .prepare("SELECT address FROM aircon WHERE id = ?")
          .get(itemId);
        itemAddress = item?.address;
      } else if (itemType === "curtain") {
        const item = this.db
          .prepare("SELECT address FROM curtain WHERE id = ?")
          .get(itemId);
        itemAddress = item?.address;
      }

      // Check if this item is already used by another scene with the same address
      const existingItem = this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM scene_address_items
        WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
      `
        )
        .get(scene.project_id, scene.address, itemType, itemId, objectType);

      if (existingItem.count > 0) {
        throw new Error(
          `This item is already used by another scene with address ${scene.address}`
        );
      }

      // Add to scene_items
      const object_value = this.getObjectValue(objectType);
      const stmt = this.db.prepare(`
        INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        sceneId,
        itemType,
        itemId,
        itemAddress,
        itemValue,
        command,
        objectType,
        object_value
      );

      // Add to scene_address_items to track usage
      const addressItemStmt = this.db.prepare(`
        INSERT INTO scene_address_items (project_id, address, item_type, item_id, object_type, object_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      addressItemStmt.run(
        scene.project_id,
        scene.address,
        itemType,
        itemId,
        objectType,
        object_value
      );

      // Return the created scene item with details
      const getStmt = this.db.prepare("SELECT * FROM scene_items WHERE id = ?");
      return getStmt.get(result.lastInsertRowid);
    } catch (error) {
      console.error("Failed to add item to scene:", error);
      throw error;
    }
  }

  removeItemFromScene(sceneItemId) {
    try {
      // Get scene item info before deleting
      const sceneItem = this.db
        .prepare(
          `
        SELECT si.*, s.project_id, s.address
        FROM scene_items si
        JOIN scene s ON si.scene_id = s.id
        WHERE si.id = ?
      `
        )
        .get(sceneItemId);

      if (!sceneItem) {
        throw new Error("Scene item not found");
      }

      // Remove from scene_items
      const stmt = this.db.prepare("DELETE FROM scene_items WHERE id = ?");
      const result = stmt.run(sceneItemId);

      // Remove from scene_address_items
      const addressItemStmt = this.db.prepare(`
        DELETE FROM scene_address_items
        WHERE project_id = ? AND address = ? AND item_type = ? AND item_id = ? AND object_type = ?
      `);

      addressItemStmt.run(
        sceneItem.project_id,
        sceneItem.address,
        sceneItem.item_type,
        sceneItem.item_id,
        sceneItem.object_type
      );

      return result.changes > 0;
    } catch (error) {
      console.error("Failed to remove item from scene:", error);
      throw error;
    }
  }

  updateSceneItemValue(sceneItemId, itemValue, command = null) {
    try {
      const stmt = this.db.prepare(`
        UPDATE scene_items
        SET item_value = ?, command = ?
        WHERE id = ?
      `);

      const result = stmt.run(itemValue, command, sceneItemId);

      if (result.changes === 0) {
        throw new Error("Scene item not found");
      }

      // Return updated scene item
      const getStmt = this.db.prepare("SELECT * FROM scene_items WHERE id = ?");
      return getStmt.get(sceneItemId);
    } catch (error) {
      console.error("Failed to update scene item value:", error);
      throw error;
    }
  }

  // Check if an item can be added to a scene (not already used by another scene with same address)
  canAddItemToScene(
    projectId,
    address,
    itemType,
    itemId,
    objectType,
    excludeSceneId = null
  ) {
    try {
      let query = `
        SELECT COUNT(*) as count FROM scene_address_items sai
        WHERE sai.project_id = ? AND sai.address = ? AND sai.item_type = ? AND sai.item_id = ? AND sai.object_type = ?
      `;

      const params = [projectId, address, itemType, itemId, objectType];

      // If excludeSceneId is provided, exclude items from that specific scene
      if (excludeSceneId) {
        query += `
          AND NOT EXISTS (
            SELECT 1 FROM scene_items si
            WHERE si.scene_id = ? AND si.item_type = sai.item_type AND si.item_id = sai.item_id AND si.object_type = sai.object_type
          )
        `;
        params.push(excludeSceneId);
      }

      const stmt = this.db.prepare(query);
      const result = stmt.get(...params);
      return result.count === 0;
    } catch (error) {
      console.error("Failed to check if item can be added to scene:", error);
      throw error;
    }
  }

  // Get all items used by scenes with a specific address
  getSceneAddressItems(projectId, address) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM scene_address_items
        WHERE project_id = ? AND address = ?
        ORDER BY created_at ASC
      `);

      return stmt.all(projectId, address);
    } catch (error) {
      console.error("Failed to get scene address items:", error);
      throw error;
    }
  }

  // Schedule Management
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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  // Zigbee Devices Management
  getZigbeeDevices(projectId, unitIp = null) {
    try {
      let query = `
        SELECT * FROM zigbee_devices
        WHERE project_id = ?
      `;
      const params = [projectId];

      if (unitIp) {
        query += ` AND unit_ip = ?`;
        params.push(unitIp);
      }

      query += ` ORDER BY created_at DESC`;

      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error("Failed to get zigbee devices:", error);
      throw error;
    }
  }

  createZigbeeDevice(projectId, deviceData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO zigbee_devices (
          project_id, unit_ip, unit_can_id, ieee_address, device_type, num_endpoints,
          endpoint1_id, endpoint1_value, endpoint1_address,
          endpoint2_id, endpoint2_value, endpoint2_address,
          endpoint3_id, endpoint3_value, endpoint3_address,
          endpoint4_id, endpoint4_value, endpoint4_address,
          rssi, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        projectId,
        deviceData.unit_ip,
        deviceData.unit_can_id,
        deviceData.ieee_address,
        deviceData.device_type,
        deviceData.num_endpoints || 0,
        deviceData.endpoint1_id || 0,
        deviceData.endpoint1_value || 0,
        deviceData.endpoint1_address || 0,
        deviceData.endpoint2_id || 0,
        deviceData.endpoint2_value || 0,
        deviceData.endpoint2_address || 0,
        deviceData.endpoint3_id || 0,
        deviceData.endpoint3_value || 0,
        deviceData.endpoint3_address || 0,
        deviceData.endpoint4_id || 0,
        deviceData.endpoint4_value || 0,
        deviceData.endpoint4_address || 0,
        deviceData.rssi || 0,
        deviceData.status || 0
      );

      // Return the created device
      const getStmt = this.db.prepare(
        "SELECT * FROM zigbee_devices WHERE id = ?"
      );
      return getStmt.get(result.lastInsertRowid);
    } catch (error) {
      console.error("Failed to create zigbee device:", error);
      throw error;
    }
  }

  updateZigbeeDevice(id, deviceData) {
    try {
      // Build dynamic update query - only update fields that are provided
      const updates = [];
      const values = [];

      // Define all possible fields that can be updated
      const allowedFields = [
        "device_type",
        "device_name",
        "num_endpoints",
        "endpoint1_id",
        "endpoint1_value",
        "endpoint1_address",
        "endpoint1_name",
        "endpoint2_id",
        "endpoint2_value",
        "endpoint2_address",
        "endpoint2_name",
        "endpoint3_id",
        "endpoint3_value",
        "endpoint3_address",
        "endpoint3_name",
        "endpoint4_id",
        "endpoint4_value",
        "endpoint4_address",
        "endpoint4_name",
        "rssi",
        "status",
      ];

      // Build SET clause dynamically based on provided fields
      for (const field of allowedFields) {
        if (field in deviceData) {
          updates.push(`${field} = ?`);
          // Handle null values for optional fields
          if (field.endsWith("_name") || field === "device_name") {
            values.push(deviceData[field] || null);
          } else {
            values.push(deviceData[field]);
          }
        }
      }

      // If no fields to update, throw error
      if (updates.length === 0) {
        throw new Error("No fields provided for update");
      }

      // Always update the updated_at timestamp
      updates.push("updated_at = CURRENT_TIMESTAMP");

      // Build and execute the query
      const sql = `
        UPDATE zigbee_devices
        SET ${updates.join(", ")}
        WHERE id = ?
      `;

      values.push(id);

      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        throw new Error("Zigbee device not found");
      }

      // Return updated device
      const getStmt = this.db.prepare(
        "SELECT * FROM zigbee_devices WHERE id = ?"
      );
      return getStmt.get(id);
    } catch (error) {
      console.error("Failed to update zigbee device:", error);
      throw error;
    }
  }

  deleteZigbeeDevice(id) {
    try {
      const stmt = this.db.prepare("DELETE FROM zigbee_devices WHERE id = ?");
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error("Zigbee device not found");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to delete zigbee device:", error);
      throw error;
    }
  }

  deleteAllZigbeeDevicesForUnit(projectId, unitIp) {
    try {
      const stmt = this.db.prepare(
        "DELETE FROM zigbee_devices WHERE project_id = ? AND unit_ip = ?"
      );
      const result = stmt.run(projectId, unitIp);

      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error("Failed to delete zigbee devices for unit:", error);
      throw error;
    }
  }

  // ===== DALI Device Methods =====

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  // ===== DALI Group Metadata Methods =====

  getGroupName(projectId, groupId) {
    try {
      const stmt = this.db.prepare(`
        SELECT name FROM dali_groups
        WHERE project_id = ? AND group_id = ?
      `);
      const row = stmt.get(projectId, groupId);
      return row ? row.name : `Group ${groupId}`;
    } catch (error) {
      console.error("Failed to get group name:", error);
      throw error;
    }
  }

  getAllGroupNames(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT group_id, name, lighting_group_address FROM dali_groups
        WHERE project_id = ?
        ORDER BY group_id
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all group names:", error);
      throw error;
    }
  }

  updateGroupName(projectId, groupId, name) {
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
      console.error("Failed to update group name:", error);
      throw error;
    }
  }

  // Initialize 16 DALI groups for a project with default lighting_group_address 100-115
  initializeGroups(projectId) {
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
      console.error("Failed to initialize groups:", error);
      throw error;
    }
  }

  // Update group's lighting_group_address (RCU Group)
  updateGroupLightingAddress(projectId, groupId, lightingGroupAddress) {
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
      console.error("Failed to update group lighting address:", error);
      throw error;
    }
  }

  // Update device's lighting_group_address in mapped device
  updateDeviceLightingAddress(projectId, address, lightingGroupAddress) {
    try {
      const stmt = this.db.prepare(`
        UPDATE dali_devices
        SET lighting_group_address = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND address = ?
      `);

      const result = stmt.run(lightingGroupAddress, projectId, address);
      if (result.changes === 0) {
        throw new Error("Device not found");
      }
      return { success: true, lightingGroupAddress };
    } catch (error) {
      console.error("Failed to update device lighting address:", error);
      throw error;
    }
  }

  // ===== DALI Group Methods =====

  getGroupDevices(projectId, groupId) {
    try {
      const stmt = this.db.prepare(`
        SELECT device_address
        FROM dali_group_devices
        WHERE project_id = ? AND group_id = ?
        ORDER BY device_address
      `);
      return stmt.all(projectId, groupId).map((row) => row.device_address);
    } catch (error) {
      console.error("Failed to get group devices:", error);
      throw error;
    }
  }

  getAllGroupDevices(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT group_id, device_address
        FROM dali_group_devices
        WHERE project_id = ?
        ORDER BY group_id, device_address
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all group devices:", error);
      throw error;
    }
  }

  addDeviceToGroup(projectId, groupId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO dali_group_devices (project_id, group_id, device_address)
        VALUES (?, ?, ?)
      `);

      stmt.run(projectId, groupId, deviceAddress);
      return { success: true };
    } catch (error) {
      console.error("Failed to add device to group:", error);
      throw error;
    }
  }

  removeDeviceFromGroup(projectId, groupId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM dali_group_devices
        WHERE project_id = ? AND group_id = ? AND device_address = ?
      `);

      const result = stmt.run(projectId, groupId, deviceAddress);
      return { success: true, deleted: result.changes > 0 };
    } catch (error) {
      console.error("Failed to remove device from group:", error);
      throw error;
    }
  }

  getDeviceGroups(projectId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        SELECT group_id
        FROM dali_group_devices
        WHERE project_id = ? AND device_address = ?
        ORDER BY group_id
      `);
      return stmt.all(projectId, deviceAddress).map((row) => row.group_id);
    } catch (error) {
      console.error("Failed to get device groups:", error);
      throw error;
    }
  }

  // ===== DALI Scene Metadata Methods =====

  getSceneName(projectId, sceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT name FROM dali_scenes
        WHERE project_id = ? AND scene_id = ?
      `);
      const row = stmt.get(projectId, sceneId);
      return row ? row.name : `Scene ${sceneId}`;
    } catch (error) {
      console.error("Failed to get scene name:", error);
      throw error;
    }
  }

  getAllSceneNames(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT scene_id, name FROM dali_scenes
        WHERE project_id = ?
        ORDER BY scene_id
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all scene names:", error);
      throw error;
    }
  }

  updateSceneName(projectId, sceneId, name) {
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
      console.error("Failed to update scene name:", error);
      throw error;
    }
  }

  // ===== DALI Scene Methods =====

  getSceneDevices(projectId, sceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT device_address, active, brightness
        FROM dali_scene_devices
        WHERE project_id = ? AND scene_id = ?
        ORDER BY device_address
      `);
      return stmt.all(projectId, sceneId);
    } catch (error) {
      console.error("Failed to get scene devices:", error);
      throw error;
    }
  }

  getAllSceneDevices(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT scene_id, device_address, active, brightness, color_temp, r, g, b, w
        FROM dali_scene_devices
        WHERE project_id = ?
        ORDER BY scene_id, device_address
      `);
      return stmt.all(projectId);
    } catch (error) {
      console.error("Failed to get all scene devices:", error);
      throw error;
    }
  }

  upsertSceneDevice(
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
      console.error("Failed to upsert scene device:", error);
      throw error;
    }
  }

  deleteSceneDevice(projectId, sceneId, deviceAddress) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM dali_scene_devices
        WHERE project_id = ? AND scene_id = ? AND device_address = ?
      `);

      const result = stmt.run(projectId, sceneId, deviceAddress);
      return { success: true, deleted: result.changes > 0 };
    } catch (error) {
      console.error("Failed to delete scene device:", error);
      throw error;
    }
  }

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
  }

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
  }

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
  }

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
  }

  // ==================== Room Configuration Operations ====================

  /**
   * Helper: Parse scenes string to array
   */
  parseScenesString(scenesStr) {
    if (!scenesStr) return [];
    return scenesStr
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  }

  /**
   * Helper: Format scenes array to string
   */
  formatScenesString(scenesArray) {
    if (!scenesArray || scenesArray.length === 0) return "";
    return scenesArray.join(",");
  }

  /**
   * Helper: Get scene amount from array
   */
  getSceneAmount(scenesArray) {
    if (!scenesArray || scenesArray.length === 0) return 0;
    return scenesArray.length;
  }

  /**
   * Get room general config for a project
   */
  getRoomGeneralConfig(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_general_config WHERE project_id = ?
      `);

      const config = stmt.get(projectId);

      if (config) {
        // Parse slave IPs from string to array
        config.slaveIPs = config.slave_ips ? config.slave_ips.split(",") : [];
        delete config.slave_ips;
      }

      return config;
    } catch (error) {
      console.error("Failed to get room general config:", error);
      throw error;
    }
  }

  /**
   * Create or update room general config
   */
  createOrUpdateRoomGeneralConfig(projectId, config) {
    try {
      const existing = this.getRoomGeneralConfig(projectId);

      if (existing) {
        // Update existing
        const stmt = this.db.prepare(`
          UPDATE room_general_config
          SET room_mode = ?, room_amount = ?, tcp_mode = ?, port = ?,
              slave_amount = ?, slave_ips = ?, client_mode = ?,
              client_ip = ?, client_port = ?, updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ?
        `);

        stmt.run(
          config.roomMode ?? 0,
          config.roomAmount ?? 1,
          config.tcpMode ?? 0,
          config.port ?? 5000,
          config.slaveAmount ?? 1,
          (config.slaveIPs || []).join(","),
          config.clientMode ?? 0,
          config.clientIP ?? "",
          config.clientPort ?? 8080,
          projectId
        );

        return this.getRoomGeneralConfig(projectId);
      } else {
        // Create new
        const stmt = this.db.prepare(`
          INSERT INTO room_general_config (
            project_id, room_mode, room_amount, tcp_mode, port,
            slave_amount, slave_ips, client_mode, client_ip, client_port
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          projectId,
          config.roomMode ?? 0,
          config.roomAmount ?? 1,
          config.tcpMode ?? 0,
          config.port ?? 5000,
          config.slaveAmount ?? 1,
          (config.slaveIPs || []).join(","),
          config.clientMode ?? 0,
          config.clientIP ?? "",
          config.clientPort ?? 8080
        );

        return this.getRoomGeneralConfig(projectId);
      }
    } catch (error) {
      console.error("Failed to create/update room general config:", error);
      throw error;
    }
  }

  /**
   * Get room config for a specific room address
   */
  getRoomConfig(projectId, roomAddress) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_config
        WHERE project_id = ? AND room_address = ?
      `);

      const config = stmt.get(projectId, roomAddress);

      if (config) {
        // Parse states from flat columns to nested object
        config.states = {
          Unrent: {
            airconActive: Boolean(config.unrent_aircon_active),
            airconMode: config.unrent_aircon_mode,
            airconFanSpeed: config.unrent_aircon_fan_speed,
            airconCoolSetpoint: config.unrent_aircon_cool_setpoint,
            airconHeatSetpoint: config.unrent_aircon_heat_setpoint,
            sceneAmount: config.unrent_scene_amount,
            scenesList: this.parseScenesString(config.unrent_scenes),
          },
          Unoccupy: {
            airconActive: Boolean(config.unoccupy_aircon_active),
            airconMode: config.unoccupy_aircon_mode,
            airconFanSpeed: config.unoccupy_aircon_fan_speed,
            airconCoolSetpoint: config.unoccupy_aircon_cool_setpoint,
            airconHeatSetpoint: config.unoccupy_aircon_heat_setpoint,
            sceneAmount: config.unoccupy_scene_amount,
            scenesList: this.parseScenesString(config.unoccupy_scenes),
          },
          Checkin: {
            airconActive: Boolean(config.checkin_aircon_active),
            airconMode: config.checkin_aircon_mode,
            airconFanSpeed: config.checkin_aircon_fan_speed,
            airconCoolSetpoint: config.checkin_aircon_cool_setpoint,
            airconHeatSetpoint: config.checkin_aircon_heat_setpoint,
            sceneAmount: config.checkin_scene_amount,
            scenesList: this.parseScenesString(config.checkin_scenes),
          },
          Welcome: {
            airconActive: Boolean(config.welcome_aircon_active),
            airconMode: config.welcome_aircon_mode,
            airconFanSpeed: config.welcome_aircon_fan_speed,
            airconCoolSetpoint: config.welcome_aircon_cool_setpoint,
            airconHeatSetpoint: config.welcome_aircon_heat_setpoint,
            sceneAmount: config.welcome_scene_amount,
            scenesList: this.parseScenesString(config.welcome_scenes),
          },
          WelcomeNight: {
            airconActive: Boolean(config.welcome_night_aircon_active),
            airconMode: config.welcome_night_aircon_mode,
            airconFanSpeed: config.welcome_night_aircon_fan_speed,
            airconCoolSetpoint: config.welcome_night_aircon_cool_setpoint,
            airconHeatSetpoint: config.welcome_night_aircon_heat_setpoint,
            sceneAmount: config.welcome_night_scene_amount,
            scenesList: this.parseScenesString(config.welcome_night_scenes),
          },
          Staff: {
            airconActive: Boolean(config.staff_aircon_active),
            airconMode: config.staff_aircon_mode,
            airconFanSpeed: config.staff_aircon_fan_speed,
            airconCoolSetpoint: config.staff_aircon_cool_setpoint,
            airconHeatSetpoint: config.staff_aircon_heat_setpoint,
            sceneAmount: config.staff_scene_amount,
            scenesList: this.parseScenesString(config.staff_scenes),
          },
          OutOfService: {
            airconActive: Boolean(config.out_of_service_aircon_active),
            airconMode: config.out_of_service_aircon_mode,
            airconFanSpeed: config.out_of_service_aircon_fan_speed,
            airconCoolSetpoint: config.out_of_service_aircon_cool_setpoint,
            airconHeatSetpoint: config.out_of_service_aircon_heat_setpoint,
            sceneAmount: config.out_of_service_scene_amount,
            scenesList: this.parseScenesString(config.out_of_service_scenes),
          },
        };
      }

      return config;
    } catch (error) {
      console.error("Failed to get room config:", error);
      throw error;
    }
  }

  /**
   * Get all room configs for a project
   */
  getAllRoomConfigs(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_config
        WHERE project_id = ?
        ORDER BY room_address
      `);

      const configs = stmt.all(projectId);

      // Parse states for each config
      return configs.map((config) => {
        const roomAddress = config.room_address;
        return this.getRoomConfig(projectId, roomAddress);
      });
    } catch (error) {
      console.error("Failed to get all room configs:", error);
      throw error;
    }
  }

  /**
   * Create or update room config
   */
  createOrUpdateRoomConfig(projectId, roomAddress, config) {
    try {
      const existing = this.getRoomConfig(projectId, roomAddress);
      const states = config.states || {};

      if (existing) {
        // Update existing
        const stmt = this.db.prepare(`
          UPDATE room_config
          SET occupancy_type = ?, occupancy_scene_type = ?, enable_welcome_night = ?,
              period = ?, pir_init_time = ?, pir_verify_time = ?, unrent_period = ?,
              standby_time = ?,
              unrent_aircon_active = ?, unrent_aircon_mode = ?,
              unrent_aircon_fan_speed = ?, unrent_aircon_cool_setpoint = ?,
              unrent_aircon_heat_setpoint = ?, unrent_scene_amount = ?,
              unrent_scenes = ?,
              unoccupy_aircon_active = ?, unoccupy_aircon_mode = ?,
              unoccupy_aircon_fan_speed = ?, unoccupy_aircon_cool_setpoint = ?,
              unoccupy_aircon_heat_setpoint = ?, unoccupy_scene_amount = ?,
              unoccupy_scenes = ?,
              checkin_aircon_active = ?, checkin_aircon_mode = ?,
              checkin_aircon_fan_speed = ?, checkin_aircon_cool_setpoint = ?,
              checkin_aircon_heat_setpoint = ?, checkin_scene_amount = ?,
              checkin_scenes = ?,
              welcome_aircon_active = ?, welcome_aircon_mode = ?,
              welcome_aircon_fan_speed = ?, welcome_aircon_cool_setpoint = ?,
              welcome_aircon_heat_setpoint = ?, welcome_scene_amount = ?,
              welcome_scenes = ?,
              welcome_night_aircon_active = ?, welcome_night_aircon_mode = ?,
              welcome_night_aircon_fan_speed = ?, welcome_night_aircon_cool_setpoint = ?,
              welcome_night_aircon_heat_setpoint = ?, welcome_night_scene_amount = ?,
              welcome_night_scenes = ?,
              staff_aircon_active = ?, staff_aircon_mode = ?,
              staff_aircon_fan_speed = ?, staff_aircon_cool_setpoint = ?,
              staff_aircon_heat_setpoint = ?, staff_scene_amount = ?,
              staff_scenes = ?,
              out_of_service_aircon_active = ?, out_of_service_aircon_mode = ?,
              out_of_service_aircon_fan_speed = ?, out_of_service_aircon_cool_setpoint = ?,
              out_of_service_aircon_heat_setpoint = ?, out_of_service_scene_amount = ?,
              out_of_service_scenes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ? AND room_address = ?
        `);

        stmt.run(
          config.occupancyType ?? 0,
          config.occupancySceneType ?? 0,
          config.enableWelcomeNight ?? 0,
          config.period ?? 0,
          config.pirInitTime ?? 0,
          config.pirVerifyTime ?? 0,
          config.unrentPeriod ?? 0,
          config.standbyTime ?? 15,
          // Unrent
          states.Unrent?.airconActive ? 1 : 0,
          states.Unrent?.airconMode ?? 0,
          states.Unrent?.airconFanSpeed ?? 0,
          states.Unrent?.airconCoolSetpoint ?? 24,
          states.Unrent?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unrent?.scenesList),
          this.formatScenesString(states.Unrent?.scenesList),
          // Unoccupy
          states.Unoccupy?.airconActive ? 1 : 0,
          states.Unoccupy?.airconMode ?? 0,
          states.Unoccupy?.airconFanSpeed ?? 0,
          states.Unoccupy?.airconCoolSetpoint ?? 24,
          states.Unoccupy?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unoccupy?.scenesList),
          this.formatScenesString(states.Unoccupy?.scenesList),
          // Checkin
          states.Checkin?.airconActive ? 1 : 0,
          states.Checkin?.airconMode ?? 0,
          states.Checkin?.airconFanSpeed ?? 0,
          states.Checkin?.airconCoolSetpoint ?? 24,
          states.Checkin?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Checkin?.scenesList),
          this.formatScenesString(states.Checkin?.scenesList),
          // Welcome
          states.Welcome?.airconActive ? 1 : 0,
          states.Welcome?.airconMode ?? 0,
          states.Welcome?.airconFanSpeed ?? 0,
          states.Welcome?.airconCoolSetpoint ?? 24,
          states.Welcome?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Welcome?.scenesList),
          this.formatScenesString(states.Welcome?.scenesList),
          // WelcomeNight
          states.WelcomeNight?.airconActive ? 1 : 0,
          states.WelcomeNight?.airconMode ?? 0,
          states.WelcomeNight?.airconFanSpeed ?? 0,
          states.WelcomeNight?.airconCoolSetpoint ?? 24,
          states.WelcomeNight?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.WelcomeNight?.scenesList),
          this.formatScenesString(states.WelcomeNight?.scenesList),
          // Staff
          states.Staff?.airconActive ? 1 : 0,
          states.Staff?.airconMode ?? 0,
          states.Staff?.airconFanSpeed ?? 0,
          states.Staff?.airconCoolSetpoint ?? 24,
          states.Staff?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Staff?.scenesList),
          this.formatScenesString(states.Staff?.scenesList),
          // OutOfService
          states.OutOfService?.airconActive ? 1 : 0,
          states.OutOfService?.airconMode ?? 0,
          states.OutOfService?.airconFanSpeed ?? 0,
          states.OutOfService?.airconCoolSetpoint ?? 24,
          states.OutOfService?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.OutOfService?.scenesList),
          this.formatScenesString(states.OutOfService?.scenesList),
          projectId,
          roomAddress
        );
      } else {
        // Create new
        const stmt = this.db.prepare(`
          INSERT INTO room_config (
            project_id, room_address, occupancy_type, occupancy_scene_type, enable_welcome_night,
            period, pir_init_time, pir_verify_time, unrent_period, standby_time,
            unrent_aircon_active, unrent_aircon_mode, unrent_aircon_fan_speed,
            unrent_aircon_cool_setpoint, unrent_aircon_heat_setpoint,
            unrent_scene_amount, unrent_scenes,
            unoccupy_aircon_active, unoccupy_aircon_mode, unoccupy_aircon_fan_speed,
            unoccupy_aircon_cool_setpoint, unoccupy_aircon_heat_setpoint,
            unoccupy_scene_amount, unoccupy_scenes,
            checkin_aircon_active, checkin_aircon_mode, checkin_aircon_fan_speed,
            checkin_aircon_cool_setpoint, checkin_aircon_heat_setpoint,
            checkin_scene_amount, checkin_scenes,
            welcome_aircon_active, welcome_aircon_mode, welcome_aircon_fan_speed,
            welcome_aircon_cool_setpoint, welcome_aircon_heat_setpoint,
            welcome_scene_amount, welcome_scenes,
            welcome_night_aircon_active, welcome_night_aircon_mode, welcome_night_aircon_fan_speed,
            welcome_night_aircon_cool_setpoint, welcome_night_aircon_heat_setpoint,
            welcome_night_scene_amount, welcome_night_scenes,
            staff_aircon_active, staff_aircon_mode, staff_aircon_fan_speed,
            staff_aircon_cool_setpoint, staff_aircon_heat_setpoint,
            staff_scene_amount, staff_scenes,
            out_of_service_aircon_active, out_of_service_aircon_mode, out_of_service_aircon_fan_speed,
            out_of_service_aircon_cool_setpoint, out_of_service_aircon_heat_setpoint,
            out_of_service_scene_amount, out_of_service_scenes
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )
        `);

        stmt.run(
          projectId,
          roomAddress,
          config.occupancyType ?? 0,
          config.occupancySceneType ?? 0,
          config.enableWelcomeNight ?? 0,
          config.period ?? 0,
          config.pirInitTime ?? 0,
          config.pirVerifyTime ?? 0,
          config.unrentPeriod ?? 0,
          config.standbyTime ?? 15,
          // Unrent
          states.Unrent?.airconActive ? 1 : 0,
          states.Unrent?.airconMode ?? 0,
          states.Unrent?.airconFanSpeed ?? 0,
          states.Unrent?.airconCoolSetpoint ?? 24,
          states.Unrent?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unrent?.scenesList),
          this.formatScenesString(states.Unrent?.scenesList),
          // Unoccupy
          states.Unoccupy?.airconActive ? 1 : 0,
          states.Unoccupy?.airconMode ?? 0,
          states.Unoccupy?.airconFanSpeed ?? 0,
          states.Unoccupy?.airconCoolSetpoint ?? 24,
          states.Unoccupy?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unoccupy?.scenesList),
          this.formatScenesString(states.Unoccupy?.scenesList),
          // Checkin
          states.Checkin?.airconActive ? 1 : 0,
          states.Checkin?.airconMode ?? 0,
          states.Checkin?.airconFanSpeed ?? 0,
          states.Checkin?.airconCoolSetpoint ?? 24,
          states.Checkin?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Checkin?.scenesList),
          this.formatScenesString(states.Checkin?.scenesList),
          // Welcome
          states.Welcome?.airconActive ? 1 : 0,
          states.Welcome?.airconMode ?? 0,
          states.Welcome?.airconFanSpeed ?? 0,
          states.Welcome?.airconCoolSetpoint ?? 24,
          states.Welcome?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Welcome?.scenesList),
          this.formatScenesString(states.Welcome?.scenesList),
          // WelcomeNight
          states.WelcomeNight?.airconActive ? 1 : 0,
          states.WelcomeNight?.airconMode ?? 0,
          states.WelcomeNight?.airconFanSpeed ?? 0,
          states.WelcomeNight?.airconCoolSetpoint ?? 24,
          states.WelcomeNight?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.WelcomeNight?.scenesList),
          this.formatScenesString(states.WelcomeNight?.scenesList),
          // Staff
          states.Staff?.airconActive ? 1 : 0,
          states.Staff?.airconMode ?? 0,
          states.Staff?.airconFanSpeed ?? 0,
          states.Staff?.airconCoolSetpoint ?? 24,
          states.Staff?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Staff?.scenesList),
          this.formatScenesString(states.Staff?.scenesList),
          // OutOfService
          states.OutOfService?.airconActive ? 1 : 0,
          states.OutOfService?.airconMode ?? 0,
          states.OutOfService?.airconFanSpeed ?? 0,
          states.OutOfService?.airconCoolSetpoint ?? 24,
          states.OutOfService?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.OutOfService?.scenesList),
          this.formatScenesString(states.OutOfService?.scenesList)
        );
      }

      return this.getRoomConfig(projectId, roomAddress);
    } catch (error) {
      console.error("Failed to create/update room config:", error);
      throw error;
    }
  }

  /**
   * Delete room config
   */
  deleteRoomConfig(projectId, roomAddress) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM room_config
        WHERE project_id = ? AND room_address = ?
      `);

      const result = stmt.run(projectId, roomAddress);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("Failed to delete room config:", error);
      throw error;
    }
  }

  /**
   * Delete all room configs for a project
   */
  deleteAllRoomConfigs(projectId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM room_config WHERE project_id = ?
      `);

      const result = stmt.run(projectId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("Failed to delete all room configs:", error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseService;
