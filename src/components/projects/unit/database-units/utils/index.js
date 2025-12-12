/**
 * Configuration reading utilities for transferring network unit configurations to database
 *
 * This module provides functions to read various configuration types from network units
 * and create corresponding entries in the database. Used when transferring units from
 * network to database with the readAdvancedConfigs flag enabled.
 */

// Main orchestrator function
export { readAdvancedConfigurations } from "./read-advanced-configurations";

// Individual configuration readers
export { readSceneConfigurations } from "./read-scene";
export { readScheduleConfigurations } from "./read-schedule";
export { readCurtainConfigurations } from "./read-curtain";
export { readKnxConfigurations } from "./read-knx";
export { readMultiSceneConfigurations } from "./read-multi-scene";
export { readSequenceConfigurations } from "./read-sequence";

// Helper functions
export { findOrCreateDatabaseItemByNetworkItem, findOrCreateLightingByAddress, getCurtainTypeName, getObjectTypeFromValue } from "./config-helpers";
