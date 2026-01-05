/**
 * Transfer Module - Centralized exports for network-to-database transfer functionality
 *
 * This module handles the transfer of configurations from network units to database,
 * including all configurations: basic (RS485, I/O) and advanced (scenes, schedules, etc.)
 */

// ========== MAIN SERVICES ==========

// Network config reader - reads basic configs (RS485 + I/O) from network units
export { readNetworkUnitBasicConfigurations } from "./services/network-config-reader";

// Advanced config transfer service - orchestrates transfer of scenes, schedules, etc.
export { transferAdvancedConfigurations, readAdvancedConfigurations } from "./services/transfer-service";

// ========== BASIC CONFIG READERS ==========

// RS485 configuration reader
export { readRS485Configurations, convertRS485ToDbFormat, convertNetworkToDialogFormat } from "./readers/rs485";

// I/O configuration reader
export { readIOConfigurations } from "./readers/io-config";

// ========== ADVANCED CONFIG READERS ==========

// Individual advanced configuration readers
export { readSceneConfigurations } from "./readers/scene";
export { readScheduleConfigurations } from "./readers/schedule";
export { readCurtainConfigurations } from "./readers/curtain";
export { readKnxConfigurations } from "./readers/knx";
export { readMultiSceneConfigurations } from "./readers/multi-scene";
export { readSequenceConfigurations } from "./readers/sequence";

// ========== UTILITY FUNCTIONS ==========

// Configuration helpers
export {
  findOrCreateDatabaseItemByNetworkItem,
  findOrCreateLightingByAddress,
  getCurtainTypeName,
  getObjectTypeFromValue,
} from "./utils/config-helpers";
