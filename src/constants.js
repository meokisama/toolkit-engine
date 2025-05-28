// Main constants object with nested structure
export const CONSTANTS = {
  // Object Types
  OBJECT_TYPES: {
    LIGHTING: "OBJ_LIGHTING",
    AC_POWER: "OBJ_AC_POWER",
    AC_MODE: "OBJ_AC_MODE",
    AC_FAN_SPEED: "OBJ_AC_FAN_SPEED",
    AC_TEMPERATURE: "OBJ_AC_TEMPERATURE",
    AC_SWING: "OBJ_AC_SWING",
    CURTAIN: "OBJ_CURTAIN",
    SCENE: "OBJ_SCENE"
  },

  // Unit configuration
  UNIT: {
    TYPES: [
      "RLC-416",
      "RLC-420",
      "Bedado-17T",
      "RLC-520",
      "BSP_R14_OL",
      "Bedado-12T",
      "RCU-35L-2440",
      "RCU-32A0",
      "RCU-24RL-840",
      "RCU-16RL-1840",
      "RCU-21N-8RL",
      "RCU-21N-16RL-1A0",
      "RCU-21N-8RL-4AI",
      "RCU-21N-16RL-5DL",
      "RCU-21N-16RL",
      "RCU-48N-32A0",
      "RCU-48N-16RL",
      "RCU-48N-16RL-1A0",
      "RCU-48N-16RL-5AI",
      "RCU-48N-16RL-5DL",
      "GNT-EXT-32L",
      "GNT-EXT-8RL",
      "GNT-EXT-16RL",
      "GNT-EXT-20RL",
      "GNT-EXT-32RL",
      "GNT-EXT-28A0",
      "GNT-EXT-20RL-12A0",
      "GNT-EXT-24IN",
      "GNT-EXT-48IN"
    ],
    MODES: ["Slave", "Master", "Stand Alone"]
  },

  // Aircon configuration
  // Curtain configuration
  CURTAIN: {
    TYPES: [
      { value: "CURTAIN_PULSE_2P", label: "2-Point Pulse" },
      { value: "CURTAIN_PULSE_3P", label: "3-Point Pulse" }
    ],
    VALUES: [
      { value: 0, label: "Stop" },
      { value: 1, label: "Open" },
      { value: 2, label: "Close" }
    ]
  },

  AIRCON: [
    {
      obj_type: "OBJ_AC_POWER",
      label: "Power",
      values: [
        { command: "AC_PWR_OFF", value: 0, label: "Off" },
        { command: "AC_PWR_ON", value: 1, label: "On" }
      ]
    },
    {
      obj_type: "OBJ_AC_MODE",
      label: "Mode",
      values: [
        { command: "AC_COOL_MODE", value: 0, label: "Cool" },
        { command: "AC_HEAT_MODE", value: 1, label: "Heat" },
        { command: "AC_VENTILATION_MODE", value: 2, label: "Ventilation" },
        { command: "AC_DRY_MODE", value: 3, label: "Dry" },
        { command: "AC_AUTO", value: 4, label: "Auto" }
      ]
    },
    {
      obj_type: "OBJ_AC_FAN_SPEED",
      label: "Fan Speed",
      values: [
        { command: "FCU_FAN_LOW", value: 0, label: "Low" },
        { command: "FCU_FAN_MED", value: 1, label: "Medium" },
        { command: "FCU_FAN_HIGH", value: 2, label: "High" },
        { command: "FCU_FAN_AUTO", value: 3, label: "Auto" },
        { command: "FCU_FAN_OFF", value: 4, label: "Off" }
      ]
    },
    {
      obj_type: "OBJ_AC_TEMPERATURE",
      label: "Temperature",
      values: [] // Temperature uses numeric input, not predefined values
    },
    {
      obj_type: "OBJ_AC_SWING",
      label: "Swing",
      values: [
        { command: "AC_SWING_B1", value: 0, label: "B1" },
        { command: "AC_SWING_B2", value: 1, label: "B2" },
        { command: "AC_SWING_B3", value: 2, label: "B3" },
        { command: "AC_SWING_B4", value: 3, label: "B4" },
        { command: "AC_SWING_B5", value: 4, label: "B5" },
        { command: "AC_SWING_AUTO", value: 5, label: "Auto" }
      ]
    }
  ]
};

// Export individual parts for backward compatibility and easier access
export const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;
export const UNIT_TYPES = CONSTANTS.UNIT.TYPES;
export const UNIT_MODES = CONSTANTS.UNIT.MODES;
export const CURTAIN_TYPES = CONSTANTS.CURTAIN.TYPES;
export const CURTAIN_VALUES = CONSTANTS.CURTAIN.VALUES;
export const CURTAIN_VALUE_LABELS = Object.fromEntries(
  CONSTANTS.CURTAIN.VALUES.map(item => [item.value, item.label])
);

// Extract aircon object types and labels from new structure
export const AIRCON_OBJECT_TYPES = CONSTANTS.AIRCON.map(item => item.obj_type);
export const AIRCON_OBJECT_LABELS = Object.fromEntries(
  CONSTANTS.AIRCON.map(item => [item.obj_type, item.label])
);

// Helper functions to extract values and labels from new structure
const getPowerConfig = () => CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_POWER");
const getFanSpeedConfig = () => CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_FAN_SPEED");
const getModeConfig = () => CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_MODE");
const getSwingConfig = () => CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_SWING");

export const AC_POWER_VALUES = Object.fromEntries(
  getPowerConfig().values.map(item => [item.command, item.value])
);
export const AC_POWER_LABELS = Object.fromEntries(
  getPowerConfig().values.map(item => [item.value, item.label])
);

export const AC_FAN_SPEED_VALUES = Object.fromEntries(
  getFanSpeedConfig().values.map(item => [item.command, item.value])
);
export const AC_FAN_SPEED_LABELS = Object.fromEntries(
  getFanSpeedConfig().values.map(item => [item.value, item.label])
);

export const AC_MODE_VALUES = Object.fromEntries(
  getModeConfig().values.map(item => [item.command, item.value])
);
export const AC_MODE_LABELS = Object.fromEntries(
  getModeConfig().values.map(item => [item.value, item.label])
);

export const AC_SWING_VALUES = Object.fromEntries(
  getSwingConfig().values.map(item => [item.command, item.value])
);
export const AC_SWING_LABELS = Object.fromEntries(
  getSwingConfig().values.map(item => [item.value, item.label])
);
