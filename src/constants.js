// Object Types
export const OBJECT_TYPES = {
  LIGHTING: "OBJ_LIGHTING",
  AC_POWER: "OBJ_AC_POWER",
  AC_MODE: "OBJ_AC_MODE",
  AC_FAN_SPEED: "OBJ_AC_FAN_SPEED",
  AC_TEMPERATURE: "OBJ_AC_TEMPERATURE",
  AC_SWING: "OBJ_AC_SWING",
  CURTAIN: "OBJ_CURTAIN",
  SCENE: "OBJ_SCENE"
};

// Aircon object types for creating aircon items
export const AIRCON_OBJECT_TYPES = [
  OBJECT_TYPES.AC_POWER,
  OBJECT_TYPES.AC_MODE,
  OBJECT_TYPES.AC_FAN_SPEED,
  OBJECT_TYPES.AC_TEMPERATURE,
  OBJECT_TYPES.AC_SWING
];

// Aircon object type labels for display
export const AIRCON_OBJECT_LABELS = {
  [OBJECT_TYPES.AC_POWER]: "Power",
  [OBJECT_TYPES.AC_MODE]: "Mode",
  [OBJECT_TYPES.AC_FAN_SPEED]: "Fan Speed",
  [OBJECT_TYPES.AC_TEMPERATURE]: "Temperature",
  [OBJECT_TYPES.AC_SWING]: "Swing"
};

export const UNIT_TYPES = [
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
];

export const UNIT_MODES = ["Slave", "Master", "Stand Alone"];

// Aircon Values
export const AC_POWER_VALUES = {
  AC_PWR_OFF: 0,
  AC_PWR_ON: 1
};

export const AC_FAN_SPEED_VALUES = {
  FCU_FAN_LOW: 0,
  FCU_FAN_MED: 1,
  FCU_FAN_HIGH: 2,
  FCU_FAN_AUTO: 3,
  FCU_FAN_OFF: 4
};

export const AC_MODE_VALUES = {
  AC_COOL_MODE: 0,
  AC_HEAT_MODE: 1,
  AC_VENTILATION_MODE: 2,
  AC_DRY_MODE: 3,
  AC_AUTO: 4
};

export const AC_SWING_VALUES = {
  OFF: 0,
  ON: 1
};

// Aircon value labels for display
export const AC_POWER_LABELS = {
  [AC_POWER_VALUES.AC_PWR_OFF]: "Off",
  [AC_POWER_VALUES.AC_PWR_ON]: "On"
};

export const AC_FAN_SPEED_LABELS = {
  [AC_FAN_SPEED_VALUES.FCU_FAN_LOW]: "Low",
  [AC_FAN_SPEED_VALUES.FCU_FAN_MED]: "Medium",
  [AC_FAN_SPEED_VALUES.FCU_FAN_HIGH]: "High",
  [AC_FAN_SPEED_VALUES.FCU_FAN_AUTO]: "Auto",
  [AC_FAN_SPEED_VALUES.FCU_FAN_OFF]: "Off"
};

export const AC_MODE_LABELS = {
  [AC_MODE_VALUES.AC_COOL_MODE]: "Cool",
  [AC_MODE_VALUES.AC_HEAT_MODE]: "Heat",
  [AC_MODE_VALUES.AC_VENTILATION_MODE]: "Ventilation",
  [AC_MODE_VALUES.AC_DRY_MODE]: "Dry",
  [AC_MODE_VALUES.AC_AUTO]: "Auto"
};

export const AC_SWING_LABELS = {
  [AC_SWING_VALUES.OFF]: "Off",
  [AC_SWING_VALUES.ON]: "On"
};
