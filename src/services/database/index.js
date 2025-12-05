/**
 * Database Module Index
 * Exports all database modules and their table schemas
 */

export { sceneTableSchemas, sceneMethods } from "./scene.js";
export { scheduleTableSchemas, scheduleMethods } from "./schedule.js";
export { multisceneTableSchemas, multisceneMethods } from "./multiscene.js";
export { sequenceTableSchemas, sequenceMethods } from "./sequence.js";
export { knxTableSchemas, knxMethods } from "./knx.js";
export { daliTableSchemas, daliMethods } from "./dali.js";

// Future exports for other modules:
// export { lightingTableSchemas, lightingMethods } from "./lighting.js";
// export { airconTableSchemas, airconMethods } from "./aircon.js";
// etc.
