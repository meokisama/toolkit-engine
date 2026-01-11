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
  dmxTableSchemas,
  dmxMethods,
  crudOperations,
  importExportOperations,
} from "./database/index.js";
import { migrations } from "./database/migration/index.js";

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
    Object.assign(this, dmxMethods);
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
      this.db.exec(dmxTableSchemas.createDmxTable);
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

      // Run all pending migrations
      for (const migration of migrations) {
        if (currentVersion < migration.version) {
          migration.up(this.db);
          this.db.pragma(`user_version = ${migration.version}`);
        }
      }
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
