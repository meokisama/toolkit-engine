/**
 * Comparison module - centralized exports for config comparison functionality
 */

// Orchestrator exports
export { compareUnitConfigurations } from "./orchestrator";

// Comparator exports
export { compareRS485Config, compareInputConfigs } from "./comparators/basic-comparator";
export { compareOutputConfigs } from "./comparators/output-comparator";
export { compareScenes, compareMultiScenes } from "./comparators/scene-comparator";
export { compareSchedules } from "./comparators/schedule-comparator";
export { compareCurtains } from "./comparators/curtain-comparator";
export { compareKnx } from "./comparators/knx-comparator";
export { compareSequences } from "./comparators/sequence-comparator";
export { findMatchingUnits } from "./comparators/unit-matcher";

// Service exports
export { readNetworkUnitConfigurations } from "./services/network-config-service";
export { getDatabaseConfigurations } from "./services/database-config-service";

// Utility exports
export { getAddressFromDeviceId } from "./utils/address-resolver";
export { convertNetworkToDialogFormat } from "./utils/network-format-converter";
export { getNetworkUnitCacheKey, getDatabaseUnitKey, getNetworkUnitKey } from "./utils/unit-key-utils";

// Hook exports
export { useConfigComparison } from "./use-comparison";

// Component exports
export { ComparisonDifferencesDialog } from "./comparison-dialog";
