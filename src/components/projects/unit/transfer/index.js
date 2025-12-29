/**
 * Transfer Module - Centralized exports for network-to-database transfer functionality
 *
 * This module handles the transfer of configurations from network units to database,
 * including all advanced configurations like scenes, schedules, curtains, KNX, etc.
 */

// Main transfer service
export { transferAdvancedConfigurations, readAdvancedConfigurations } from "./services/transfer-service";

// Individual configuration readers
export { readSceneConfigurations } from "./readers/scene";
export { readScheduleConfigurations } from "./readers/schedule";
export { readCurtainConfigurations } from "./readers/curtain";
export { readKnxConfigurations } from "./readers/knx";
export { readMultiSceneConfigurations } from "./readers/multi-scene";
export { readSequenceConfigurations } from "./readers/sequence";

// Utility functions
export {
  findOrCreateDatabaseItemByNetworkItem,
  findOrCreateLightingByAddress,
  getCurtainTypeName,
  getObjectTypeFromValue,
} from "./utils/config-helpers";
