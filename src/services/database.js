import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { OBJECT_TYPES } from "../constants.js";
import {
  projectTableSchemas,
  projectMethods,
  sceneTableSchemas,
  sceneMethods,
  scheduleTableSchemas,
  scheduleMethods,
  multisceneTableSchemas,
  multisceneMethods,
  sequenceTableSchemas,
  sequenceMethods,
  knxTableSchemas,
  knxMethods,
  daliTableSchemas,
  daliMethods,
  roomTableSchemas,
  roomMethods,
  zigbeeTableSchemas,
  zigbeeMethods,
  curtainTableSchemas,
  curtainMethods,
  airconTableSchemas,
  airconMethods,
  lightingTableSchemas,
  lightingMethods,
  unitTableSchemas,
  unitMethods,
} from "./database/index.js";

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();

    // Mix in module methods
    Object.assign(this, projectMethods);
    Object.assign(this, sceneMethods);
    Object.assign(this, scheduleMethods);
    Object.assign(this, multisceneMethods);
    Object.assign(this, sequenceMethods);
    Object.assign(this, knxMethods);
    Object.assign(this, daliMethods);
    Object.assign(this, roomMethods);
    Object.assign(this, zigbeeMethods);
    Object.assign(this, curtainMethods);
    Object.assign(this, airconMethods);
    Object.assign(this, lightingMethods);
    Object.assign(this, unitMethods);
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
    try {
      this.db.exec(projectTableSchemas.createProjectsTable);
      this.db.exec(lightingTableSchemas.createLightingTable);
      this.db.exec(airconTableSchemas.createAirconItemsTable);
      this.db.exec(unitTableSchemas.createUnitTable);
      this.db.exec(curtainTableSchemas.createCurtainTable);
      this.db.exec(knxTableSchemas.createKnxTable);
      this.db.exec(sceneTableSchemas.createSceneTable);
      this.db.exec(sceneTableSchemas.createSceneItemsTable);
      this.db.exec(sceneTableSchemas.createSceneAddressItemsTable);
      this.db.exec(scheduleTableSchemas.createScheduleTable);
      this.db.exec(sceneTableSchemas.createScheduleScenesTable);
      this.db.exec(multisceneTableSchemas.createMultiScenesTable);
      this.db.exec(multisceneTableSchemas.createMultiSceneScenesTable);
      this.db.exec(sequenceTableSchemas.createSequencesTable);
      this.db.exec(sequenceTableSchemas.createSequenceMultiScenesTable);
      this.db.exec(roomTableSchemas.createRoomGeneralConfigTable);
      this.db.exec(roomTableSchemas.createRoomConfigTable);
      this.db.exec(zigbeeTableSchemas.createZigbeeDevicesTable);
      this.db.exec(daliTableSchemas.createDaliDevicesTable);
      this.db.exec(daliTableSchemas.createDaliGroupsTable);
      this.db.exec(daliTableSchemas.createDaliGroupDevicesTable);
      this.db.exec(daliTableSchemas.createDaliScenesTable);
      this.db.exec(daliTableSchemas.createDaliSceneDevicesTable);
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
        this.validateKnxItem(projectId, address, itemData);
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
        return this.createKnxItemInline(projectId, itemData);
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
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          this.validateKnxItem(currentItem.project_id, address, itemData, id);
        } else if (currentItem) {
          // Just validate factor if address is not changing
          if (itemData.factor && itemData.factor < 1) {
            throw new Error("Factor must be greater than or equal to 1.");
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
        return this.updateKnxItemInline(id, itemData);
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

      // For KNX, use duplicateKnxItem method
      if (tableName === "knx") {
        duplicatedItem = this.duplicateKnxItem(originalItem);
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

  // Find scene ID by address in the new project
  // findSceneIdByAddress is now in database/scene.js module

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

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseService;
