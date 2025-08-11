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
        knx_switch_group TEXT,
        knx_dimming_group TEXT,
        knx_value_group TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (rcu_group_id) REFERENCES lighting (id) ON DELETE SET NULL,
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
        name TEXT NOT NULL CHECK(length(name) <= 15),
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
        name TEXT NOT NULL CHECK(length(name) <= 15),
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

    // Note: unit_output_configs and unit_input_configs tables are removed
    // All I/O configuration data is now stored in unit.input_configs and unit.output_configs JSON columns

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
      // Note: unit_output_configs and unit_input_configs tables are removed
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
      "curtain",
      "knx",
      "scene",
      "multi_scenes",
      "sequences",
    ];

    categories.forEach((category) => {
      const items = originalItems[category] || [];

      items.forEach((item) => {
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
          this.createUnitItem(newProjectId, itemData);
        } else if (category === "aircon") {
          // Special handling for aircon items (use aircon table)
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            label: item.label || "Aircon",
          };
          this.createProjectItem(newProjectId, itemData, "aircon");
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
          this.createProjectItem(newProjectId, itemData, category);
        } else if (category === "multi_scenes") {
          // Special handling for multi_scenes items
          const itemData = {
            name: item.name,
            address: item.address,
            type: item.type,
            description: item.description,
          };
          this.createProjectItem(newProjectId, itemData, category);
        } else if (category === "sequences") {
          // Special handling for sequences items
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
          };
          this.createProjectItem(newProjectId, itemData, category);
        } else {
          // Standard handling for other categories
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            object_type: item.object_type,
          };
          this.createProjectItem(newProjectId, itemData, category);
        }
      });
    });
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
          input_configs: item.input_configs ? JSON.parse(item.input_configs) : null,
          output_configs: item.output_configs ? JSON.parse(item.output_configs) : null,
        };

        // Debug logging for output configs
        if (parsedItem.output_configs) {
          console.log("Reading unit from database:", {
            id: item.id,
            ip_address: item.ip_address,
            outputConfigsCount: parsedItem.output_configs?.outputs?.length || 0,
            hasOutputConfigs: !!parsedItem.output_configs
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
        .prepare("SELECT * FROM knx WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC")
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
          input_configs: item.input_configs ? JSON.parse(item.input_configs) : null,
          output_configs: item.output_configs ? JSON.parse(item.output_configs) : null,
        }));
      } else if (tableName === "schedule" || tableName === "multi_scenes") {
        const stmt = this.db.prepare(
          `SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY name ASC`
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

        if (name.length > 15) {
          throw new Error("Multi-scene name must be 15 characters or less.");
        }

        if (!address || !address.trim()) {
          throw new Error("Address is required for multi-scene.");
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

        if (name.length > 15) {
          throw new Error("Sequence name must be 15 characters or less.");
        }

        if (!address || !address.trim()) {
          throw new Error("Address is required for sequence.");
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
        // For curtain table, include curtain-specific fields
        // Address is required for curtain items
        if (!address) {
          throw new Error("Address is required for curtain items.");
        }
        const object_value = this.getObjectValue(object_type);

        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, object_type, object_value, curtain_type, curtain_value, open_group_id, close_group_id, stop_group_id, pause_period, transition_period)
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
          open_group_id || null,
          close_group_id || null,
          stop_group_id || null,
          pause_period || 0,
          transition_period || 0
        );
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "knx") {
        // For knx table, use new KNX-specific fields
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, type, factor, feedback, rcu_group_id, knx_switch_group, knx_dimming_group, knx_value_group, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          projectId,
          name,
          address,
          type || 0,
          factor || 2,
          feedback || 0,
          rcu_group_id || null,
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
        const result = stmt.run(
          projectId,
          name,
          address,
          description
        );
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
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, type = ?, factor = ?, feedback = ?, rcu_group_id = ?, knx_switch_group = ?, knx_dimming_group = ?, knx_value_group = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(
          name,
          address,
          type || 0,
          factor || 2,
          feedback || 0,
          rcu_group_id || null,
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
        if (name.length > 15) {
          throw new Error("Multi-scene name must be 15 characters or less.");
        }
        if (!address || !address.trim()) {
          throw new Error("Address is required for multi-scene.");
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
        if (name.length > 15) {
          throw new Error("Sequence name must be 15 characters or less.");
        }
        if (!address || !address.trim()) {
          throw new Error("Address is required for sequence.");
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
      const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error(`${tableName} item not found`);
      }

      return { success: true, deletedId: id };
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
        ];
        const importedCounts = {};

        categories.forEach((category) => {
          const items = itemsData[category] || [];
          importedCounts[category] = 0;

          items.forEach((itemData) => {
            if (category === "unit") {
              this.createUnitItem(project.id, itemData);
            } else if (category === "aircon") {
              // Ensure label is set for aircon items
              if (!itemData.label) {
                itemData.label = "Aircon";
              }
              this.createProjectItem(project.id, itemData, "aircon");
            } else if (category === "schedule") {
              this.createScheduleItem(project.id, itemData);
            } else {
              this.createProjectItem(project.id, itemData, category);
            }
            importedCounts[category]++;
          });
        });

        return { project, importedCounts };
      });

      return transaction();
    } catch (error) {
      console.error("Failed to import project:", error);
      throw error;
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
      const availableAddress = this.findNextAvailableAddress(projectId, "scene");

      // Create the scene first
      const scene = this.createProjectItem(projectId, {
        name: sceneData.name,
        address: availableAddress.toString(),
        description: sceneData.description
      }, "scene");

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
      if (itemType === 'lighting') {
        existingItem = this.db.prepare(
          "SELECT * FROM lighting WHERE project_id = ? AND address = ?"
        ).get(projectId, address);
      } else if (itemType === 'aircon') {
        existingItem = this.db.prepare(
          "SELECT * FROM aircon WHERE project_id = ? AND address = ?"
        ).get(projectId, address);
      } else if (itemType === 'curtain') {
        existingItem = this.db.prepare(
          "SELECT * FROM curtain WHERE project_id = ? AND address = ?"
        ).get(projectId, address);
      }

      // If item exists, return it
      if (existingItem) {
        return existingItem;
      }

      // Create new item
      const newItemData = {
        name: itemName || `${itemType} ${address}`,
        address: address,
        description: `Auto-created from scene import`
      };

      // Add type-specific properties
      if (itemType === 'lighting') {
        newItemData.object_type = 'OBJ_LIGHTING';
        newItemData.object_value = 1;
      } else if (itemType === 'curtain') {
        newItemData.object_type = 'OBJ_CURTAIN';
        newItemData.object_value = 2;
        newItemData.curtain_type = '';
        newItemData.curtain_value = 0;
        newItemData.pause_period = 0;
        newItemData.transition_period = 0;
      } else if (itemType === 'aircon') {
        newItemData.label = 'Aircon';
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
        .prepare("SELECT * FROM aircon WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC")
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
      const inputConfig = inputConfigs.inputs?.find(input => input.index === inputIndex);

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
      const outputConfig = outputConfigs.outputs?.find(output => output.index === outputIndex);

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
      const existingIndex = inputConfigs.inputs.findIndex(input => input.index === inputIndex);
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
      const existingIndex = outputConfigs.outputs.findIndex(output => output.index === outputIndex);

      // Remove deviceId, deviceType, and address from config data to avoid duplication
      // For AC outputs, address is equivalent to deviceId and should be stored at output level
      const { deviceId, deviceType, address, ...cleanConfigData } = configData;

      const outputConfig = {
        index: outputIndex,
        type: outputType,
        device_id: deviceId || null,
        device_type: deviceType || (outputType === "ac" ? "aircon" : "lighting"),
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
      return (inputConfigs.inputs || []).map(input => ({
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
      return (outputConfigs.outputs || []).map(output => ({
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
      inputConfigs.inputs = (inputConfigs.inputs || []).filter(input => input.index !== inputIndex);

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
      outputConfigs.outputs = (outputConfigs.outputs || []).filter(output => output.index !== outputIndex);

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

  createCurtainItem(projectId, itemData) {
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

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseService;
