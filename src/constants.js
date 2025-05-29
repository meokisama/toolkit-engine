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
      "Room Logic Controller",
      "Bedside-17T",
      "Bedside-12T",
      "BSP_R14_OL",
      "RLC-I16",
      "RLC-I20",
      "RCU-32AO",
      "RCU-8RL-24AO",
      "RCU-16RL-16AO",
      "RCU-24RL-8AO",
      "RCU-11IN-4RL",
      "RCU-21IN-10RL",
      "RCU-30IN-10RL",
      "RCU-48IN-16RL",
      "RCU-48IN-16RL-4AO",
      "RCU-48IN-16RL-4AI",
      "RCU-48IN-16RL-K",
      "RCU-48IN-16RL-DL",
      "RCU-21IN-8RL",
      "RCU-21IN-8RL-4AO",
      "RCU-21IN-8RL-4AI",
      "RCU-21IN-8RL-K",
      "RCU-21IN-8RL-DL",
      "GNT-EXT-6RL",
      "GNT-EXT-8RL",
      "GNT-EXT-10AO",
      "GNT-EXT-28AO",
      "GNT-EXT-12RL",
      "GNT-EXT-20RL",
      "GNT-EXT-12RL-12AO",
      "GNT-EXT-24IN",
      "GNT-EXT-48IN",
      "GNT-ETH2KDL"
    ],
    MODES: ["Slave", "Master", "Stand-Alone"],

    // Barcode to device type mapping (from RLC codebase)
    BARCODE_MAPPING: {
      "8930000000019": "Room Logic Controller",
      "8930000000200": "Bedside-17T",
      "8930000100214": "Bedside-12T",
      "8930000100221": "BSP_R14_OL",
      "8930000000026": "RLC-I16",
      "8930000000033": "RLC-I20",
      "8930000200013": "RCU-32AO",
      "8930000200020": "RCU-8RL-24AO",
      "8930000200037": "RCU-16RL-16AO",
      "8930000200044": "RCU-24RL-8AO",
      "8930000210005": "RCU-11IN-4RL",
      "8930000210012": "RCU-21IN-10RL",
      "8930000210036": "RCU-30IN-10RL",
      "8930000210043": "RCU-48IN-16RL",
      "8930000210050": "RCU-48IN-16RL-4AO",
      "8930000210067": "RCU-48IN-16RL-4AI",
      "8930000210074": "RCU-48IN-16RL-K",
      "8930000210081": "RCU-48IN-16RL-DL",
      "8930000210111": "RCU-21IN-8RL",
      "8930000210128": "RCU-21IN-8RL-4AO",
      "8930000210135": "RCU-21IN-8RL-4AI",
      "8930000210142": "RCU-21IN-8RL-K",
      "8930000210159": "RCU-21IN-8RL-DL",
      "8930000200051": "GNT-EXT-6RL",
      "8930000200068": "GNT-EXT-8RL",
      "8930000200075": "GNT-EXT-10AO",
      "8930000200082": "GNT-EXT-28AO",
      "8930000200105": "GNT-EXT-12RL",
      "8930000200112": "GNT-EXT-20RL",
      "8930000200099": "GNT-EXT-12RL-12AO",
      "8930000220011": "GNT-EXT-24IN",
      "8930000220028": "GNT-EXT-48IN",
      "8930000230003": "GNT-ETH2KDL"
    },

    // UDP Configuration (from RLC codebase)
    UDP_CONFIG: {
      UDP_PORT: 1234,
      LOCAL_UDP_PORT: 5678,
      BROADCAST_IP: "255.255.255.255",
      RECEIVE_TIMEOUT: 3000,
      SCAN_TIMEOUT: 5000,
      MAX_RETRY: 3
    }
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
