import { compareRS485Config } from "./rs485";
import { compareInputConfigs } from "./input";
import { compareOutputConfigs } from "./output";
import { compareScenes } from "./scene";
import { compareMultiScenes } from "./multi-scenes";
import { compareSchedules } from "./schedule";
import { compareCurtains } from "./curtain";
import { compareKnx } from "./knx";
import { compareSequences } from "./sequence";
import { compareRoomConfig } from "./room";
import { createDiff } from "./helpers";

/**
 * Compare all configurations between a database unit and network unit.
 * All differences are structured objects: { category, label, dbValue, networkValue }
 *
 * @param {Object} databaseUnit
 * @param {Object} networkUnit
 * @param {Object} projectItems - For device_id → address lookup
 * @param {Object} databaseConfigs - { scenes, schedules, curtains, knx, multiScenes, sequences }
 * @returns {{ isEqual: boolean, differences: Array, comparisonDetails: Object }}
 */
export async function compareUnitConfigurations(databaseUnit, networkUnit, projectItems = null, databaseConfigs = null) {
  const basicDiffs = [];

  // Basic fields
  [
    { name: "type", label: "Board Type" },
    { name: "id_can", label: "CAN ID" },
    { name: "ip_address", label: "IP Address" },
    { name: "mode", label: "Mode" },
  ].forEach(({ name, label }) => {
    if (databaseUnit[name] !== networkUnit[name]) {
      basicDiffs.push(createDiff("basic", label, databaseUnit[name], networkUnit[name]));
    }
  });

  // CAN Load and Recovery Mode: treat as booleans
  if (Boolean(databaseUnit.can_load) !== Boolean(networkUnit.can_load)) {
    basicDiffs.push(createDiff("basic", "CAN Load", databaseUnit.can_load, networkUnit.can_load));
  }
  if (Boolean(databaseUnit.recovery_mode) !== Boolean(networkUnit.recovery_mode)) {
    basicDiffs.push(createDiff("basic", "Recovery Mode", databaseUnit.recovery_mode, networkUnit.recovery_mode));
  }

  const rs485Comparison    = compareRS485Config(databaseUnit.rs485_config, networkUnit.rs485_config);
  const inputComparison    = compareInputConfigs(databaseUnit.input_configs, networkUnit.input_configs);
  const outputComparison   = compareOutputConfigs(databaseUnit.output_configs, networkUnit.output_configs, projectItems);
  const sceneComparison    = compareScenes(databaseConfigs?.scenes, networkUnit.scenes);
  const scheduleComparison = compareSchedules(databaseConfigs?.schedules, networkUnit.schedules);
  const curtainComparison  = compareCurtains(databaseConfigs?.curtains, networkUnit.curtains, projectItems);
  const multiSceneComparison = compareMultiScenes(databaseConfigs?.multiScenes, networkUnit.multiScenes);
  const sequenceComparison = compareSequences(databaseConfigs?.sequences, networkUnit.sequences);
  const knxComparison      = compareKnx(databaseConfigs?.knx, networkUnit.knxConfigs);
  const roomComparison     = compareRoomConfig(databaseConfigs?.roomConfig, networkUnit.roomConfig);

  const allDifferences = [
    ...basicDiffs,
    ...rs485Comparison.differences,
    ...inputComparison.differences,
    ...outputComparison.differences,
    ...sceneComparison.differences,
    ...scheduleComparison.differences,
    ...curtainComparison.differences,
    ...multiSceneComparison.differences,
    ...sequenceComparison.differences,
    ...knxComparison.differences,
    ...roomComparison.differences,
  ];

  return {
    isEqual: allDifferences.length === 0,
    differences: allDifferences,
    comparisonDetails: {
      basic:       { isEqual: basicDiffs.length === 0,                   differences: basicDiffs },
      rs485:       rs485Comparison,
      input:       inputComparison,
      output:      outputComparison,
      scenes:      sceneComparison,
      schedules:   scheduleComparison,
      curtains:    curtainComparison,
      multiScenes: multiSceneComparison,
      sequences:   sequenceComparison,
      knx:         knxComparison,
      room:        roomComparison,
    },
  };
}
