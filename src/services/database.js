import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
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
  crudOperations,
  importExportOperations,
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
    Object.assign(this, crudOperations);
    Object.assign(this, importExportOperations);
  }

  init() {
    try {
      const Database = require("better-sqlite3");
      const documentsPath = app.getPath("documents");
      const toolkitPath = path.join(documentsPath, "Toolkit Engine");

      if (!fs.existsSync(toolkitPath)) {
        fs.mkdirSync(toolkitPath, { recursive: true });
      }

      const dbPath = path.join(toolkitPath, "projects.db");
      this.db = new Database(dbPath);
      this.createTables();
      this.runMigrations();
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
      this.db.exec(scheduleTableSchemas.createScheduleTable);
      this.db.exec(sceneTableSchemas.createScheduleScenesTable);
      this.db.exec(multisceneTableSchemas.createMultiScenesTable);
      this.db.exec(multisceneTableSchemas.createMultiSceneScenesTable);
      this.db.exec(sequenceTableSchemas.createSequencesTable);
      this.db.exec(sequenceTableSchemas.createSequenceMultiScenesTable);
      this.db.exec(roomTableSchemas.createRoomGeneralConfigTable);
      this.db.exec(roomTableSchemas.createRoomGeneralConfigUniqueIndex);
      this.db.exec(roomTableSchemas.createRoomDetailConfigTable);
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

  runMigrations() {
    try {
      // Get current database version
      const currentVersion = this.db.pragma("user_version", { simple: true });

      // Migration 1: Add source_unit column to tables
      if (currentVersion < 1) {
        console.log("Running migration 1: Adding source_unit column to tables...");

        // Helper function to check if column exists
        const columnExists = (tableName, columnName) => {
          const columns = this.db.pragma(`table_info(${tableName})`);
          return columns.some((col) => col.name === columnName);
        };

        // Add source_unit column to curtain table
        if (!columnExists("curtain", "source_unit")) {
          this.db.exec(`
            ALTER TABLE curtain ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
          `);
          console.log("Added source_unit column to curtain table");
        }

        // Add source_unit column to knx table
        if (!columnExists("knx", "source_unit")) {
          this.db.exec(`
            ALTER TABLE knx ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
          `);
          console.log("Added source_unit column to knx table");
        }

        // Add source_unit column to scene table
        if (!columnExists("scene", "source_unit")) {
          this.db.exec(`
            ALTER TABLE scene ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
          `);
          console.log("Added source_unit column to scene table");
        }

        // Add source_unit column to multi_scenes table
        if (!columnExists("multi_scenes", "source_unit")) {
          this.db.exec(`
            ALTER TABLE multi_scenes ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
          `);
          console.log("Added source_unit column to multi_scenes table");
        }

        // Add source_unit column to sequences table
        if (!columnExists("sequences", "source_unit")) {
          this.db.exec(`
            ALTER TABLE sequences ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
          `);
          console.log("Added source_unit column to sequences table");
        }

        // Add source_unit column to schedule table
        if (!columnExists("schedule", "source_unit")) {
          this.db.exec(`
            ALTER TABLE schedule ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
          `);
          console.log("Added source_unit column to schedule table");
        }

        // Update database version
        this.db.pragma("user_version = 1");
        console.log("Migration 1 completed successfully");
      }

      // Migration 2: Add knx_address column to room_general_config table
      if (currentVersion < 2) {
        console.log("Running migration 2: Adding knx_address column to room_general_config...");

        // Helper function to check if column exists
        const columnExists = (tableName, columnName) => {
          const columns = this.db.pragma(`table_info(${tableName})`);
          return columns.some((col) => col.name === columnName);
        };

        // Add knx_address column to room_general_config table
        if (!columnExists("room_general_config", "knx_address")) {
          this.db.exec(`
            ALTER TABLE room_general_config ADD COLUMN knx_address TEXT DEFAULT '0/0/0';
          `);
          console.log("Added knx_address column to room_general_config table");
        }

        // Update database version
        this.db.pragma("user_version = 2");
        console.log("Migration 2 completed successfully");
      }

      // Add future migrations here with if (currentVersion < 3), etc.
    } catch (error) {
      console.error("Failed to run migrations:", error);
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
