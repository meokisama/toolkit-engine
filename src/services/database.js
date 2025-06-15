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
        io_config TEXT, -- JSON string for I/O configuration
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
        curtain_type TEXT DEFAULT 'CURTAIN_PULSE_2P',
        open_group TEXT,
        close_group TEXT,
        stop_group TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createKnxTable = `
      CREATE TABLE IF NOT EXISTS knx (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        address TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createSceneTable = `
      CREATE TABLE IF NOT EXISTS scene (
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

    const createUnitOutputConfigsTable = `
      CREATE TABLE IF NOT EXISTS unit_output_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        output_index INTEGER NOT NULL,
        output_type TEXT NOT NULL,
        config_data TEXT, -- JSON string for output configuration
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unit_id) REFERENCES unit (id) ON DELETE CASCADE,
        UNIQUE(unit_id, output_index)
      )
    `;

    const createUnitInputConfigsTable = `
      CREATE TABLE IF NOT EXISTS unit_input_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        input_index INTEGER NOT NULL,
        function_value INTEGER DEFAULT 0,
        lighting_id INTEGER,
        multi_group_config TEXT, -- JSON string for multi-group configuration
        rlc_config TEXT, -- JSON string for RLC configuration
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unit_id) REFERENCES unit (id) ON DELETE CASCADE,
        UNIQUE(unit_id, input_index)
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
      this.db.exec(createUnitOutputConfigsTable);
      this.db.exec(createUnitInputConfigsTable);
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
            open_group: item.open_group,
            close_group: item.close_group,
            stop_group: item.stop_group,
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
          "SELECT * FROM lighting WHERE project_id = ? ORDER BY address ASC"
        )
        .all(projectId);
      const aircon = this.db
        .prepare(
          "SELECT * FROM aircon WHERE project_id = ? ORDER BY address ASC"
        )
        .all(projectId);
      const unit = this.db
        .prepare(
          "SELECT * FROM unit WHERE project_id = ? ORDER BY created_at DESC"
        )
        .all(projectId);
      const curtain = this.db
        .prepare(
          "SELECT * FROM curtain WHERE project_id = ? ORDER BY address ASC"
        )
        .all(projectId);
      const knx = this.db
        .prepare("SELECT * FROM knx WHERE project_id = ? ORDER BY address ASC")
        .all(projectId);
      const scene = this.db
        .prepare(
          "SELECT * FROM scene WHERE project_id = ? ORDER BY address ASC"
        )
        .all(projectId);
      const schedule = this.db
        .prepare(
          "SELECT * FROM schedule WHERE project_id = ? ORDER BY name ASC"
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
          io_config: item.io_config ? JSON.parse(item.io_config) : null,
        }));
      } else if (tableName === "schedule") {
        const stmt = this.db.prepare(
          `SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY name ASC`
        );
        return stmt.all(projectId);
      } else {
        const stmt = this.db.prepare(
          `SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY address ASC`
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

      // Parse RS485 config from JSON for unit items
      if (tableName === "unit" && item && item.rs485_config) {
        item.rs485_config = JSON.parse(item.rs485_config);
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
        open_group,
        close_group,
        stop_group,
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
        if (!name || name.length > 15) {
          throw new Error(
            "Scene name is required and must be 15 characters or less."
          );
        }
      }

      // Special validation for KNX to prevent duplicate addresses
      if (tableName === "knx" && address) {
        const existingItems = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ?"
          )
          .get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`Address ${address} already exists.`);
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
          INSERT INTO ${tableName} (project_id, name, address, description, object_type, object_value, curtain_type, open_group, close_group, stop_group)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          projectId,
          name,
          address,
          description,
          object_type,
          object_value,
          curtain_type,
          open_group || null,
          close_group || null,
          stop_group || null
        );
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === "knx" || tableName === "scene") {
        // For knx and scene tables, don't use object_type and object_value
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
        open_group,
        close_group,
        stop_group,
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
        if (!name || name.length > 15) {
          throw new Error(
            "Scene name is required and must be 15 characters or less."
          );
        }
      }

      // Special validation for KNX to prevent duplicate addresses
      if (tableName === "knx" && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db
            .prepare(
              "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ? AND id != ?"
            )
            .get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
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
          SET name = ?, address = ?, description = ?, object_type = ?, object_value = ?, curtain_type = ?, open_group = ?, close_group = ?, stop_group = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(
          name,
          address,
          description,
          object_type,
          object_value,
          curtain_type,
          open_group || null,
          close_group || null,
          stop_group || null,
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
      } else if (tableName === "knx" || tableName === "scene") {
        // For knx and scene tables, don't use object_type and object_value
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

      // Add object_type only for tables that use it (not aircon, knx, scene)
      if (
        tableName !== "aircon" &&
        tableName !== "knx" &&
        tableName !== "scene"
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
        duplicatedItem.open_group = originalItem.open_group || null;
        duplicatedItem.close_group = originalItem.close_group || null;
        duplicatedItem.stop_group = originalItem.stop_group || null;
      }

      // For scene, find a unique address in range 1-255 if address exists
      if (tableName === "scene" && originalItem.address) {
        duplicatedItem.address = this.findNextAvailableAddress(
          originalItem.project_id,
          "scene"
        );
      }

      // For KNX, find a unique address if address exists
      if (tableName === "knx" && originalItem.address) {
        // For KNX, we need to find next available address in x.y.z format
        // For simplicity, we'll increment the device part (z) and keep area.line the same
        const addressParts = originalItem.address.split(".");
        if (addressParts.length === 3) {
          const area = addressParts[0];
          const line = addressParts[1];
          let device = parseInt(addressParts[2]);

          // Find next available device number (0-255)
          let newAddress;
          do {
            device = (device + 1) % 256;
            newAddress = `${area}.${line}.${device}`;
          } while (
            this.db
              .prepare(
                "SELECT COUNT(*) as count FROM knx WHERE project_id = ? AND address = ?"
              )
              .get(originalItem.project_id, newAddress).count > 0 &&
            device !== parseInt(addressParts[2])
          );

          duplicatedItem.address = newAddress;
        }
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
        .prepare("SELECT * FROM aircon WHERE project_id = ? ORDER BY address")
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
        io_config,
      } = itemData;

      const stmt = this.db.prepare(`
        INSERT INTO unit (
          project_id, type, serial_no, ip_address,
          id_can, mode, firmware_version, hardware_version,
          manufacture_date, can_load, recovery_mode, description, discovered_at, rs485_config, io_config
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        io_config ? JSON.stringify(io_config) : null
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
        io_config,
      } = itemData;

      const stmt = this.db.prepare(`
        UPDATE unit
        SET type = ?, serial_no = ?, ip_address = ?,
            id_can = ?, mode = ?, firmware_version = ?, hardware_version = ?,
            manufacture_date = ?, can_load = ?, recovery_mode = ?, description = ?,
            discovered_at = ?, rs485_config = ?, io_config = ?, updated_at = CURRENT_TIMESTAMP
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
        io_config ? JSON.stringify(io_config) : null,
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

  // Unit Output Configuration methods
  getUnitOutputConfig(unitId, outputIndex) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM unit_output_configs
        WHERE unit_id = ? AND output_index = ?
      `);
      const result = stmt.get(unitId, outputIndex);

      if (result && result.config_data) {
        return {
          ...result,
          config_data: JSON.parse(result.config_data),
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get unit output config:", error);
      throw error;
    }
  }

  saveUnitOutputConfig(unitId, outputIndex, outputType, configData) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO unit_output_configs
        (unit_id, output_index, output_type, config_data, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(
        unitId,
        outputIndex,
        outputType,
        JSON.stringify(configData)
      );

      return this.getUnitOutputConfig(unitId, outputIndex);
    } catch (error) {
      console.error("Failed to save unit output config:", error);
      throw error;
    }
  }

  deleteUnitOutputConfig(unitId, outputIndex) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM unit_output_configs
        WHERE unit_id = ? AND output_index = ?
      `);

      const result = stmt.run(unitId, outputIndex);
      return result.changes > 0;
    } catch (error) {
      console.error("Failed to delete unit output config:", error);
      throw error;
    }
  }

  getAllUnitOutputConfigs(unitId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM unit_output_configs
        WHERE unit_id = ?
        ORDER BY output_index ASC
      `);
      const results = stmt.all(unitId);

      return results.map((result) => ({
        ...result,
        config_data: result.config_data ? JSON.parse(result.config_data) : null,
      }));
    } catch (error) {
      console.error("Failed to get all unit output configs:", error);
      throw error;
    }
  }

  // Unit Input Configuration methods
  getUnitInputConfig(unitId, inputIndex) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM unit_input_configs
        WHERE unit_id = ? AND input_index = ?
      `);
      const result = stmt.get(unitId, inputIndex);

      if (result) {
        return {
          ...result,
          multi_group_config: result.multi_group_config
            ? JSON.parse(result.multi_group_config)
            : [],
          rlc_config: result.rlc_config ? JSON.parse(result.rlc_config) : {},
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get unit input config:", error);
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
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO unit_input_configs
        (unit_id, input_index, function_value, lighting_id, multi_group_config, rlc_config, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        unitId,
        inputIndex,
        functionValue || 0,
        lightingId,
        JSON.stringify(multiGroupConfig || []),
        JSON.stringify(rlcConfig || {})
      );

      return this.getUnitInputConfig(unitId, inputIndex);
    } catch (error) {
      console.error("Failed to save unit input config:", error);
      throw error;
    }
  }

  deleteUnitInputConfig(unitId, inputIndex) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM unit_input_configs
        WHERE unit_id = ? AND input_index = ?
      `);

      const result = stmt.run(unitId, inputIndex);
      return result.changes > 0;
    } catch (error) {
      console.error("Failed to delete unit input config:", error);
      throw error;
    }
  }

  getAllUnitInputConfigs(unitId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM unit_input_configs
        WHERE unit_id = ?
        ORDER BY input_index ASC
      `);
      const results = stmt.all(unitId);

      return results.map((result) => ({
        ...result,
        multi_group_config: result.multi_group_config
          ? JSON.parse(result.multi_group_config)
          : [],
        rlc_config: result.rlc_config ? JSON.parse(result.rlc_config) : {},
      }));
    } catch (error) {
      console.error("Failed to get all unit input configs:", error);
      throw error;
    }
  }

  // Clear all I/O configurations for a unit (used when unit type changes)
  clearAllUnitIOConfigs(unitId) {
    try {
      // Clear all input configurations
      const clearInputsStmt = this.db.prepare(`
        DELETE FROM unit_input_configs WHERE unit_id = ?
      `);

      // Clear all output configurations
      const clearOutputsStmt = this.db.prepare(`
        DELETE FROM unit_output_configs WHERE unit_id = ?
      `);

      // Execute both deletions in a transaction
      const transaction = this.db.transaction(() => {
        clearInputsStmt.run(unitId);
        clearOutputsStmt.run(unitId);
      });

      transaction();

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
        ORDER BY s.address ASC
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

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseService;
