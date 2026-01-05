import { compareRS485Config } from "./rs485";
import { compareInputConfigs } from "./input";
import { compareOutputConfigs } from "./output";
import { compareScenes } from "./scene";
import { compareMultiScenes } from "./multi-scenes";
import { compareSchedules } from "./schedule";
import { compareCurtains } from "./curtain";
import { compareKnx } from "./knx";
import { compareSequences } from "./sequence";

/**
 * Compare all configurations between a database unit and network unit
 * @param {Object} databaseUnit - Database unit with all configurations
 * @param {Object} networkUnit - Network unit with all configurations
 * @param {Object} projectItems - Project items for device_id to address lookup
 * @param {Object} databaseConfigs - Database configurations (scenes, schedules, curtains, knx, multiScenes, sequences)
 * @returns {Object} Complete comparison result
 */
export async function compareUnitConfigurations(databaseUnit, networkUnit, projectItems = null, databaseConfigs = null) {
  const allDifferences = [];
  let hasAnyDifferences = false;

  // Compare basic unit properties (skip CAN Load and Recovery Mode as they are equivalent)
  const basicFields = [
    { name: "type", label: "Board Type" },
    { name: "id_can", label: "CAN ID" },
    { name: "ip_address", label: "IP Address" },
    { name: "mode", label: "Mode" },
  ];

  basicFields.forEach((field) => {
    if (databaseUnit[field.name] !== networkUnit[field.name]) {
      allDifferences.push(`${field.label}: DB=${databaseUnit[field.name]}, Network=${networkUnit[field.name]}`);
      hasAnyDifferences = true;
    }
  });

  // Special handling for CAN Load (0 == false, 1 == true)
  const dbCanLoad = databaseUnit.can_load;
  const netCanLoad = networkUnit.can_load;
  if ((dbCanLoad === 0 || dbCanLoad === false) !== (netCanLoad === 0 || netCanLoad === false)) {
    allDifferences.push(`CAN Load: DB=${dbCanLoad}, Network=${netCanLoad}`);
    hasAnyDifferences = true;
  }

  // Special handling for Recovery Mode (0 == false, 1 == true)
  const dbRecoveryMode = databaseUnit.recovery_mode;
  const netRecoveryMode = networkUnit.recovery_mode;
  if ((dbRecoveryMode === 0 || dbRecoveryMode === false) !== (netRecoveryMode === 0 || netRecoveryMode === false)) {
    allDifferences.push(`Recovery Mode: DB=${dbRecoveryMode}, Network=${netRecoveryMode}`);
    hasAnyDifferences = true;
  }

  // Compare RS485 configurations
  const rs485Comparison = compareRS485Config(databaseUnit.rs485_config, networkUnit.rs485_config);
  if (!rs485Comparison.isEqual) {
    allDifferences.push(...rs485Comparison.differences.map((diff) => `RS485: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare input configurations
  const inputComparison = compareInputConfigs(databaseUnit.input_configs, networkUnit.input_configs);
  if (!inputComparison.isEqual) {
    allDifferences.push(...inputComparison.differences.map((diff) => `Input: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare output configurations
  const outputComparison = compareOutputConfigs(databaseUnit.output_configs, networkUnit.output_configs, projectItems);
  if (!outputComparison.isEqual) {
    allDifferences.push(...outputComparison.differences.map((diff) => `Output: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare scenes (use databaseConfigs instead of databaseUnit.scenes)
  const sceneComparison = compareScenes(databaseConfigs?.scenes, networkUnit.scenes);
  if (!sceneComparison.isEqual) {
    allDifferences.push(...sceneComparison.differences.map((diff) => `Scene: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare schedules (use databaseConfigs instead of databaseUnit.schedules)
  const scheduleComparison = compareSchedules(databaseConfigs?.schedules, networkUnit.schedules);
  if (!scheduleComparison.isEqual) {
    allDifferences.push(...scheduleComparison.differences.map((diff) => `Schedule: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare curtains (use databaseConfigs instead of databaseUnit.curtains)
  const curtainComparison = compareCurtains(databaseConfigs?.curtains, networkUnit.curtains);
  if (!curtainComparison.isEqual) {
    allDifferences.push(...curtainComparison.differences.map((diff) => `Curtain: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare multi scenes
  const multiSceneComparison = compareMultiScenes(databaseConfigs?.multiScenes, networkUnit.multiScenes);
  if (!multiSceneComparison.isEqual) {
    allDifferences.push(...multiSceneComparison.differences.map((diff) => `Multi Scene: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare sequences
  const sequenceComparison = compareSequences(databaseConfigs?.sequences, networkUnit.sequences);
  if (!sequenceComparison.isEqual) {
    allDifferences.push(...sequenceComparison.differences.map((diff) => `Sequence: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare KNX configurations
  const knxComparison = compareKnx(databaseConfigs?.knx, networkUnit.knxConfigs);
  if (!knxComparison.isEqual) {
    allDifferences.push(...knxComparison.differences.map((diff) => `KNX: ${diff}`));
    hasAnyDifferences = true;
  }

  return {
    isEqual: !hasAnyDifferences,
    differences: allDifferences,
    comparisonDetails: {
      basic: { isEqual: allDifferences.filter((d) => !d.includes(":")).length === 0 },
      rs485: rs485Comparison,
      input: inputComparison,
      output: outputComparison,
      scenes: sceneComparison,
      schedules: scheduleComparison,
      curtains: curtainComparison,
      multiScenes: multiSceneComparison,
      sequences: sequenceComparison,
      knx: knxComparison,
    },
  };
}
