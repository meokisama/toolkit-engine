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

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseService;
