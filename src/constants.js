export const CONSTANTS = {
  OBJECT_TYPES: {
    OUTPUT_NONE: { obj_name: "OBJ_OUTPUT_NONE", obj_value: 0 },
    LIGHTING: { obj_name: "OBJ_LIGHTING", obj_value: 1 },
    CURTAIN: { obj_name: "OBJ_CURTAIN", obj_value: 2 },
    AC_POWER: { obj_name: "OBJ_AC_POWER", obj_value: 3 },
    AC_MODE: { obj_name: "OBJ_AC_MODE", obj_value: 4 },
    AC_FAN_SPEED: { obj_name: "OBJ_AC_FAN_SPEED", obj_value: 5 },
    AC_TEMPERATURE: { obj_name: "OBJ_AC_TEMPERATURE", obj_value: 6 },
    AC_SWING: { obj_name: "OBJ_AC_SWING", obj_value: 7 },
    TIMER: { obj_name: "OBJ_TIMER", obj_value: 8 },
  },

  UNIT: {
    TYPES: [
      {
        name: "Room Logic Controller",
        barcode: "8930000000019",
        inputs: 48,
        outputs: {
          relay: 32,
          dimmer: 6,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "Bedside-17T",
        barcode: "8930000000200",
        inputs: 17,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "Bedside-12T",
        barcode: "8930000100214",
        inputs: 12,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "BSP_R14_OL",
        barcode: "8930000100221",
        inputs: 14,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "RLC-I16",
        barcode: "8930000000026",
        inputs: 60,
        outputs: {
          relay: 32,
          dimmer: 6,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RLC-I20",
        barcode: "8930000000033",
        inputs: 60,
        outputs: {
          relay: 32,
          dimmer: 6,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-32AO",
        barcode: "8930000200013",
        inputs: 60,
        outputs: {
          relay: 0,
          dimmer: 6,
          ao: 32,
          ac: 10,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "RCU-8RL-24AO",
        barcode: "8930000200020",
        inputs: 60,
        outputs: {
          relay: 8,
          dimmer: 0,
          ao: 24,
          ac: 10,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "RCU-16RL-16AO",
        barcode: "8930000200037",
        inputs: 60,
        outputs: {
          relay: 16,
          dimmer: 0,
          ao: 16,
          ac: 10,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "RCU-24RL-8AO",
        barcode: "8930000200044",
        inputs: 60,
        outputs: {
          relay: 24,
          dimmer: 0,
          ao: 8,
          ac: 10,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "RCU-11IN-4RL",
        barcode: "8930000210005",
        inputs: 11,
        outputs: {
          relay: 4,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-21IN-10RL",
        barcode: "8930000210012",
        inputs: 21,
        outputs: {
          relay: 10,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-30IN-10RL",
        barcode: "8930000210036",
        inputs: 30,
        outputs: {
          relay: 10,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-48IN-16RL",
        barcode: "8930000210043",
        inputs: 48,
        outputs: {
          relay: 16,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-48IN-16RL-4AO",
        barcode: "8930000210050",
        inputs: 48,
        outputs: {
          relay: 16,
          dimmer: 0,
          ao: 4,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-48IN-16RL-4AI",
        barcode: "8930000210067",
        inputs: 48,
        outputs: {
          relay: 16,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-48IN-16RL-K",
        barcode: "8930000210074",
        inputs: 48,
        outputs: {
          relay: 20,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-48IN-16RL-DL",
        barcode: "8930000210081",
        inputs: 48,
        outputs: {
          relay: 20,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-21IN-8RL",
        barcode: "8930000210111",
        inputs: 21,
        outputs: {
          relay: 8,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-21IN-8RL-4AO",
        barcode: "8930000210128",
        inputs: 21,
        outputs: {
          relay: 8,
          dimmer: 0,
          ao: 4,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-21IN-8RL-4AI",
        barcode: "8930000210135",
        inputs: 21,
        outputs: {
          relay: 8,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-21IN-8RL-K",
        barcode: "8930000210142",
        inputs: 21,
        outputs: {
          relay: 8,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "RCU-21IN-10RL-T",
        barcode: "8930000210159",
        inputs: 21,
        outputs: {
          relay: 10,
          dimmer: 0,
          ao: 0,
          ac: 10,
        },
        inputFunctions: {
          0: "KEY_CARD_INPUT", // Input 1: Key Card/Keyless
          3: "BELL_INPUT", // Input 4: Bell
          6: "DND_INPUT", // Input 7: Do Not Disturb
          7: "MUR_INPUT", // Input 8: Make Up Room
          default: "ALL", // All other inputs: Full function list
        },
      },
      {
        name: "GNT-EXT-6RL",
        barcode: "8930000200051",
        inputs: 0,
        outputs: {
          relay: 6,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
      {
        name: "GNT-EXT-8RL",
        barcode: "8930000200068",
        inputs: 0,
        outputs: {
          relay: 8,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
      {
        name: "GNT-EXT-10AO",
        barcode: "8930000200075",
        inputs: 0,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 10,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
      {
        name: "GNT-EXT-28AO",
        barcode: "8930000200082",
        inputs: 0,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 28,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
      {
        name: "GNT-EXT-12RL",
        barcode: "8930000200105",
        inputs: 0,
        outputs: {
          relay: 12,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
      {
        name: "GNT-EXT-20RL",
        barcode: "8930000200112",
        inputs: 0,
        outputs: {
          relay: 20,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
      {
        name: "GNT-EXT-12RL-12AO",
        barcode: "8930000200099",
        inputs: 0,
        outputs: {
          relay: 12,
          dimmer: 0,
          ao: 12,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
      {
        name: "GNT-EXT-24IN",
        barcode: "8930000220011",
        inputs: 24,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "GNT-EXT-48IN",
        barcode: "8930000220028",
        inputs: 48,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {
          default: "ALL", // All inputs: Full function list
        },
      },
      {
        name: "GNT-ETH2KDL",
        barcode: "8930000230003",
        inputs: 0,
        outputs: {
          relay: 0,
          dimmer: 0,
          ao: 0,
          ac: 0,
        },
        inputFunctions: {}, // No inputs
      },
    ],
    MODES: ["Slave", "Master", "Stand-Alone"],
    UDP_CONFIG: {
      UDP_PORT: 1234,
      LOCAL_UDP_PORT: 5678,
      BROADCAST_IP: "255.255.255.255",
      RECEIVE_TIMEOUT: 3000,
      SCAN_TIMEOUT: 5000,
      MAX_RETRY: 3,
    },
  },

  CURTAIN: {
    TYPES: [
      { value: 0, name: "", label: "Select curtain type" },
      { value: 1, name: "CURTAIN_PULSE_1G_2P", label: "1-Gang 2-Point Pulse" },
      { value: 2, name: "CURTAIN_PULSE_1G_3P", label: "1-Gang 3-Point Pulse" },
      { value: 3, name: "CURTAIN_PULSE_2P", label: "2-Point Pulse" },
      { value: 4, name: "CURTAIN_PULSE_3P", label: "3-Point Pulse" },
      { value: 5, name: "CURTAIN_HOLD_1G", label: "1-Gang Hold" },
      { value: 6, name: "CURTAIN_HOLD", label: "Hold" },
    ],
    VALUES: [
      { value: 0, label: "Stop" },
      { value: 1, label: "Open" },
      { value: 2, label: "Close" },
    ],
  },

  KNX: {
    KNX_OUTPUT_TYPES: [
      { value: 0, name: "KNX_OUTPUT_DISABLE", label: "Disable" },
      { value: 1, name: "KNX_OUTPUT_SWITCH", label: "Switch" },
      { value: 2, name: "KNX_OUTPUT_DIMMER", label: "Dimmer" },
      { value: 3, name: "KNX_OUTPUT_CURTAIN", label: "Curtain" },
      { value: 4, name: "KNX_OUTPUT_SCENE", label: "Scene" },
      { value: 5, name: "KNX_OUTPUT_MULTI_SCENE", label: "Multi Scene" },
      {
        value: 6,
        name: "KNX_OUTPUT_MULTI_SCENE_SEQ",
        label: "Multi Scene Sequence",
      },
      { value: 7, name: "KNX_AC_POWER", label: "AC Power" },
      { value: 8, name: "KNX_AC_MODE", label: "AC Mode" },
      { value: 9, name: "KNX_AC_FAN_SPEED", label: "AC Fan Speed" },
      { value: 10, name: "KNX_AC_SWING", label: "AC Swing" },
      { value: 11, name: "KNX_AC_SET_POINT", label: "AC Set Point" },
    ],

    KNX_FEEDBACK_TYPES: [
      { value: 0, name: "KNX_FB_DISABLE", label: "Disable" },
      { value: 1, name: "KNX_FB_ACTIVE", label: "Active" },
      { value: 2, name: "KNX_FB_PASSIVE", label: "Passive" },
    ],
  },

  RS485: {
    MAX_CONFIG: 2,
    SLAVE_MAX_DEVS: 10,
    SLAVE_MAX_INDOORS: 16,

    TYPES: [
      { value: 1, label: "RS485_MASTER_TC300" },
      { value: 2, label: "RS485_MASTER_TC303" },
      { value: 3, label: "RS485_MASTER_TC903" },
      { value: 4, label: "RS485_MASTER_TC907" },
      { value: 5, label: "RS485_MASTER_SE8300" },
      { value: 6, label: "RS485_MASTER_P_22RTM" },
      { value: 7, label: "RS485_MASTER_ABB" },
      { value: 10, label: "RS485_MASTER_DAIKIN" },
      { value: 11, label: "RS485_MASTER_MITSU" },
      { value: 12, label: "RS485_MASTER_LG" },
      { value: 13, label: "RS485_MASTER_SAMSUNG_F1F2" },
      { value: 14, label: "RS485_MASTER_SAMSUNG_F3F4" },
      { value: 15, label: "RS485_MASTER_HITACHI" },
      { value: 16, label: "RS485_MASTER_SANYO" },
      { value: 17, label: "RS485_MASTER_RISHUN" },
      { value: 18, label: "RS485_MASTER_LAFFEY" },
      { value: 19, label: "RS485_MASTER_HAFELE" },
      { value: 20, label: "RS485_SLAVE_RLG" },
      { value: 21, label: "RS485_MASTER_RLG" },
      { value: 22, label: "RS485_SLAVE_RTU" },
      { value: 23, label: "RS485_MASTER_RTU" },
      { value: 24, label: "RS485_SLAVE_ASCII" },
      { value: 25, label: "RS485_MASTER_ASCII" },
      { value: 26, label: "RS485_SLAVE_TC300" },
      { value: 27, label: "RS485_SLAVE_TC303" },
      { value: 28, label: "RS485_SLAVE_LINK" },
      { value: 29, label: "RS485_MASTER_LINK" },
      { value: 30, label: "RS485_SLAVE_DMX" },
      { value: 31, label: "RS485_MASTER_DMX" },
      { value: 32, label: "RS485_BACNET" },
      { value: 33, label: "RS485_RESI_DALI" },
      { value: 40, label: "SAMSUNG_OUTDOOR_F1F2" },
      { value: 41, label: "SAMSUNG_INDOOR_F3F4" },
      { value: 42, label: "D3_NET" },
      { value: 43, label: "P1P2" },
      { value: 255, label: "RS485_OTHER" },
    ],

    BAUDRATES: [
      { value: 4800, label: "4800" },
      { value: 9600, label: "9600" },
      { value: 19200, label: "19200" },
      { value: 38400, label: "38400" },
      { value: 57600, label: "57600" },
      { value: 115200, label: "115200" },
      { value: 128000, label: "128000" },
      { value: 256000, label: "256000" },
    ],

    PARITY: [
      { value: 0, label: "None" },
      { value: 1, label: "Odd" },
      { value: 2, label: "Even" },
    ],

    STOP_BITS: [
      { value: 0, label: "1" },
      { value: 1, label: "2" },
    ],
  },

  AIRCON: [
    {
      obj_type: "OBJ_AC_POWER",
      label: "Power",
      values: [
        { command: "AC_PWR_OFF", value: 0, label: "Off" },
        { command: "AC_PWR_ON", value: 1, label: "On" },
      ],
    },
    {
      obj_type: "OBJ_AC_MODE",
      label: "Mode",
      values: [
        { command: "AC_COOL_MODE", value: 0, label: "Cool" },
        { command: "AC_HEAT_MODE", value: 1, label: "Heat" },
        { command: "AC_VENTILATION_MODE", value: 2, label: "Ventilation" },
        { command: "AC_DRY_MODE", value: 3, label: "Dry" },
        { command: "AC_AUTO", value: 4, label: "Auto" },
      ],
    },
    {
      obj_type: "OBJ_AC_FAN_SPEED",
      label: "Fan Speed",
      values: [
        { command: "FCU_FAN_LOW", value: 0, label: "Low" },
        { command: "FCU_FAN_MED", value: 1, label: "Medium" },
        { command: "FCU_FAN_HIGH", value: 2, label: "High" },
        { command: "FCU_FAN_AUTO", value: 3, label: "Auto" },
        { command: "FCU_FAN_OFF", value: 4, label: "Off" },
      ],
    },
    {
      obj_type: "OBJ_AC_TEMPERATURE",
      label: "Temperature",
      values: [],
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
        { command: "AC_SWING_AUTO", value: 5, label: "Auto" },
      ],
    },
  ],
};

// Export individual parts for backward compatibility and easier access
export const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;
export const UNIT_TYPES = CONSTANTS.UNIT.TYPES;
export const UNIT_MODES = CONSTANTS.UNIT.MODES;
export const CURTAIN_TYPES = CONSTANTS.CURTAIN.TYPES;
export const CURTAIN_VALUES = CONSTANTS.CURTAIN.VALUES;
export const CURTAIN_VALUE_LABELS = Object.fromEntries(
  CONSTANTS.CURTAIN.VALUES.map((item) => [item.value, item.label])
);
export const CURTAIN_TYPE_LABELS = Object.fromEntries(
  CONSTANTS.CURTAIN.TYPES.map((item) => [item.value, item.label])
);

// Extract aircon object types and labels from new structure
export const AIRCON_OBJECT_TYPES = CONSTANTS.AIRCON.map(
  (item) => item.obj_type
);
export const AIRCON_OBJECT_LABELS = Object.fromEntries(
  CONSTANTS.AIRCON.map((item) => [item.obj_type, item.label])
);

// Helper functions to extract values and labels from new structure
const getPowerConfig = () =>
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_POWER");
const getFanSpeedConfig = () =>
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_FAN_SPEED");
const getModeConfig = () =>
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_MODE");
const getSwingConfig = () =>
  CONSTANTS.AIRCON.find((item) => item.obj_type === "OBJ_AC_SWING");

export const AC_POWER_VALUES = Object.fromEntries(
  getPowerConfig().values.map((item) => [item.command, item.value])
);
export const AC_POWER_LABELS = Object.fromEntries(
  getPowerConfig().values.map((item) => [item.value, item.label])
);

export const AC_FAN_SPEED_VALUES = Object.fromEntries(
  getFanSpeedConfig().values.map((item) => [item.command, item.value])
);
export const AC_FAN_SPEED_LABELS = Object.fromEntries(
  getFanSpeedConfig().values.map((item) => [item.value, item.label])
);

export const AC_MODE_VALUES = Object.fromEntries(
  getModeConfig().values.map((item) => [item.command, item.value])
);
export const AC_MODE_LABELS = Object.fromEntries(
  getModeConfig().values.map((item) => [item.value, item.label])
);

export const AC_SWING_VALUES = Object.fromEntries(
  getSwingConfig().values.map((item) => [item.command, item.value])
);
export const AC_SWING_LABELS = Object.fromEntries(
  getSwingConfig().values.map((item) => [item.value, item.label])
);

// Helper functions for unit I/O specifications
export const getUnitIOSpec = (unitName) => {
  const unit = CONSTANTS.UNIT.TYPES.find((u) => u.name === unitName);
  return unit
    ? {
        inputs: unit.inputs,
        outputs: unit.outputs,
        totalOutputs:
          unit.outputs.relay +
          unit.outputs.dimmer +
          unit.outputs.ao +
          unit.outputs.ac,
      }
    : null;
};

export const getUnitByBarcode = (barcode) => {
  return CONSTANTS.UNIT.TYPES.find((u) => u.barcode === barcode);
};

export const hasInputs = (unitName) => {
  const spec = getUnitIOSpec(unitName);
  return spec ? spec.inputs > 0 : false;
};

export const hasOutputs = (unitName) => {
  const spec = getUnitIOSpec(unitName);
  return spec ? spec.totalOutputs > 0 : false;
};

export const hasAirconOutputs = (unitName) => {
  const spec = getUnitIOSpec(unitName);
  return spec ? spec.outputs.ac > 0 : false;
};

export const getOutputTypes = (unitName) => {
  const spec = getUnitIOSpec(unitName);
  if (!spec) return [];

  const types = [];
  if (spec.outputs.relay > 0)
    types.push({ type: "relay", count: spec.outputs.relay });
  if (spec.outputs.dimmer > 0)
    types.push({ type: "dimmer", count: spec.outputs.dimmer });
  if (spec.outputs.ao > 0) types.push({ type: "ao", count: spec.outputs.ao });
  if (spec.outputs.ac > 0) types.push({ type: "ac", count: spec.outputs.ac });

  return types;
};

// Input function lists
export const INPUT_FUNCTIONS = {
  // Complete list of all available input functions (values match C# enum exactly)
  ALL: [
    { name: "IP_UNUSED", label: "Unused", value: 0 },
    { name: "BELL", label: "Bell", value: 1 },
    { name: "DO_NOT_DISTURB", label: "Do Not Disturb", value: 2 },
    { name: "MAKE_UP_ROOM", label: "Make Up Room", value: 3 },
    { name: "KEY_CARD", label: "Key Card", value: 4 },
    { name: "IP_ON", label: "On", value: 5 },
    { name: "IP_OFF", label: "Off", value: 6 },
    { name: "IP_ON_OFF", label: "On/Off", value: 7 },
    { name: "IP_SWITCH", label: "Switch", value: 8 },
    { name: "IP_SWITCH_INVERT", label: "Switch (Inverted)", value: 9 },
    { name: "IP_DIM_TOGGLE", label: "Dim Toggle", value: 10 },
    { name: "IP_DIM_MEM", label: "Dim Memory", value: 11 },
    { name: "IP_ON_UP", label: "On Up", value: 12 },
    { name: "IP_OFF_DOWN", label: "Off Down", value: 13 },
    { name: "IP_TIMER_TOGGLE", label: "Timer Toggle", value: 14 },
    { name: "IP_TIMER_RETRIGGER", label: "Timer Retrigger", value: 15 },
    { name: "IP_DIM_UP", label: "Dim Up", value: 16 },
    { name: "IP_DIM_DOWN", label: "Dim Down", value: 17 },
    { name: "IP_SOFT_UP", label: "Soft Up", value: 18 },
    { name: "IP_SOFT_DOWN", label: "Soft Down", value: 19 },
    { name: "SCENE", label: "Scene", value: 20 },
    { name: "CURTAIN", label: "Curtain", value: 21 },
    { name: "RETURN", label: "Return", value: 22 },
    { name: "IP_TOGGLE", label: "Toggle", value: 23 },
    { name: "SCENE_SEQUENCE", label: "Scene Sequence", value: 24 },
    { name: "SCENE_OFF", label: "Scene Off", value: 25 },
    { name: "SCENE_ON", label: "Scene On", value: 26 },
    { name: "SCENE_WELCOME", label: "Scene Welcome", value: 27 },
    { name: "SCENE_UNOCCUPIED", label: "Scene Unoccupied", value: 28 },
    { name: "SCENE_TOGGLE", label: "Scene Toggle", value: 29 },
    { name: "KEYLESS", label: "Keyless", value: 30 },
    { name: "DOOR_SWITCH", label: "Door Switch", value: 31 },
    { name: "MOTION_SENSOR", label: "Motion Sensor", value: 32 },
    { name: "BLIND", label: "Blind", value: 33 },
    { name: "FAN_LMH", label: "Fan L/M/H", value: 34 },
    { name: "FAN_LMHO", label: "Fan L/M/H/O", value: 35 },
    { name: "IP_CIRCLE_UP", label: "Circle Up", value: 36 },
    { name: "IP_CIRCLE_DOWN", label: "Circle Down", value: 37 },
    { name: "IP_CIRCLE_UP_OFF", label: "Circle Up Off", value: 38 },
    { name: "IP_CIRCLE_DOWN_OFF", label: "Circle Down Off", value: 39 },
    { name: "IP_VOL_UP", label: "Volume Up", value: 40 },
    { name: "IP_VOL_DOWN", label: "Volume Down", value: 41 },
    { name: "SCENE_WELCOME_NIGHT", label: "Scene Welcome Night", value: 42 },
    { name: "SCENE_GROUP_TRIGGER", label: "Scene Group Trigger", value: 43 },
    { name: "SCENE_GROUP_TOGGLE", label: "Scene Group Toggle", value: 44 },
    { name: "SCENE_GROUP_SEQUENCE", label: "Scene Group Sequence", value: 45 },
    { name: "CURTAIN_OBJ", label: "Curtain Object", value: 49 },
    { name: "AC_FAN_LMH", label: "AC Fan L/M/H", value: 50 },
    { name: "AC_FAN_OLMH", label: "AC Fan O/L/M/H", value: 51 },
    { name: "AC_FAN_LOW", label: "AC Fan Low", value: 52 },
    { name: "AC_FAN_MED", label: "AC Fan Medium", value: 53 },
    { name: "AC_FAN_HIGH", label: "AC Fan High", value: 54 },
    { name: "AC_TEMP_DOWN", label: "AC Temperature Down", value: 55 },
    { name: "AC_TEMP_UP", label: "AC Temperature Up", value: 56 },
    { name: "AC_TEMP_TYPE", label: "AC Temperature Type", value: 57 },
    { name: "AC_POWER", label: "AC Power", value: 58 },
    { name: "AC_MODE", label: "AC Mode", value: 59 },
    { name: "AC_FAN_SPEED", label: "AC Fan Speed", value: 60 },
    { name: "SW_INV_AC_OFF", label: "Switch Invert AC Off", value: 70 },
    { name: "SW_INV_AC_ECO", label: "Switch Invert AC Eco", value: 71 },
    { name: "TIME_HOUR", label: "Time Hour", value: 80 },
    { name: "TIME_MINUTE", label: "Time Minute", value: 81 },
    { name: "TIME_ALARM", label: "Time Alarm", value: 82 },
    { name: "TIME_ZONE", label: "Time Zone", value: 83 },
    { name: "TIME_SETT", label: "Time Setting", value: 84 },
    { name: "MOTION_SET_SCENE", label: "Motion Set Scene", value: 90 },
    { name: "SW_SCENE", label: "Switch Scene", value: 91 },
    { name: "SW_SCENE_OFF", label: "Switch Scene Off", value: 92 },
    { name: "SW_SCENE_ON", label: "Switch Scene On", value: 93 },
    { name: "SW_SCENE_SEQUENCE", label: "Switch Scene Sequence", value: 94 },
    { name: "SW_SCENE_GROUP", label: "Switch Scene Group", value: 95 },
    { name: "SW_DND", label: "Switch DND", value: 96 },
    { name: "SW_MUR", label: "Switch MUR", value: 97 },
    { name: "ENTRANCE", label: "Entrance", value: 254 },
    { name: "CUSTOM", label: "Custom", value: 255 },
  ],

  // Specific function lists for special inputs
  KEY_CARD_INPUT: [
    { name: "IP_UNUSED", label: "Unused", value: 0 },
    { name: "KEY_CARD", label: "Key Card", value: 4 },
    { name: "KEYLESS", label: "Keyless", value: 30 },
  ],
  BELL_INPUT: [
    { name: "IP_UNUSED", label: "Unused", value: 0 },
    { name: "BELL", label: "Bell", value: 1 },
  ],
  DND_INPUT: [
    { name: "IP_UNUSED", label: "Unused", value: 0 },
    { name: "DO_NOT_DISTURB", label: "Do Not Disturb", value: 2 },
    { name: "SW_DND", label: "Switch DND", value: 96 },
  ],
  MUR_INPUT: [
    { name: "IP_UNUSED", label: "Unused", value: 0 },
    { name: "MAKE_UP_ROOM", label: "Make Up Room", value: 3 },
    { name: "SW_MUR", label: "Switch MUR", value: 97 },
  ],
};

// Helper functions for input functions
export const getInputFunctions = (unitName, inputIndex) => {
  const unit = CONSTANTS.UNIT.TYPES.find((u) => u.name === unitName);
  if (!unit || !unit.inputFunctions) return [];

  // Check if this specific input has a custom function list
  if (unit.inputFunctions[inputIndex]) {
    return INPUT_FUNCTIONS[unit.inputFunctions[inputIndex]] || [];
  }

  // Use default function list
  if (unit.inputFunctions.default) {
    return INPUT_FUNCTIONS[unit.inputFunctions.default] || [];
  }

  return [];
};

export const getInputFunctionByValue = (value) => {
  // Search through all function lists to find function by value
  for (const functionList of Object.values(INPUT_FUNCTIONS)) {
    const found = functionList.find((func) => func.value === value);
    if (found) return found;
  }
  return null;
};

export const getInputFunctionByName = (name) => {
  // Search through all function lists to find function by name
  for (const functionList of Object.values(INPUT_FUNCTIONS)) {
    const found = functionList.find((func) => func.name === name);
    if (found) return found;
  }
  return null;
};

// Multiple Group Functions - functions that require multiple lighting address configuration
// Based on Multiple_Group_Func enum from WinForms RLC codebase
export const MULTIPLE_GROUP_FUNCTIONS = [
  "KEY_CARD",
  "IP_ON",
  "IP_OFF",
  "IP_ON_OFF",
  "IP_SWITCH",
  "IP_SWITCH_INVERT",
  "IP_DIM_TOGGLE",
  "IP_DIM_MEM",
  "IP_DIM_UP",
  "IP_DIM_DOWN",
  "SCENE",
  "CURTAIN",
  "CURTAIN_OBJ",
  "RETURN",
  "IP_TOGGLE",
  "SCENE_SEQUENCE",
  "SCENE_OFF",
  "SCENE_ON",
  "SCENE_WELCOME",
  "SCENE_UNOCCUPIED",
  "SCENE_TOGGLE",
  "SCENE_GROUP_TRIGGER",
  "SCENE_GROUP_TOGGLE",
  "SCENE_GROUP_SEQUENCE",
  "KEYLESS",
  "DOOR_SWITCH",
  "MOTION_SENSOR",
  "BLIND",
  "FAN_LMH",
  "FAN_LMHO",
  "IP_CIRCLE_UP",
  "IP_CIRCLE_DOWN",
  "IP_CIRCLE_UP_OFF",
  "IP_CIRCLE_DOWN_OFF",
  "IP_VOL_UP",
  "IP_VOL_DOWN",
  "AC_FAN_LMH",
  "AC_FAN_SPEED",
  "AC_FAN_LOW",
  "AC_FAN_MED",
  "AC_FAN_HIGH",
  "AC_TEMP_DOWN",
  "AC_TEMP_UP",
  "AC_TEMP_TYPE",
  "AC_POWER",
  "AC_MODE",
  "SW_INV_AC_OFF",
  "SW_INV_AC_ECO",
  "TIME_HOUR",
  "TIME_MINUTE",
  "TIME_ALARM",
  "TIME_ZONE",
  "TIME_SETT",
  "SCENE_WELCOME_NIGHT",
  "CUSTOM",
];

export const isMultipleGroupFunction = (functionName) => {
  return MULTIPLE_GROUP_FUNCTIONS.includes(functionName);
};

// Ramp and Preset Group Functions - functions that enable both Ramp and Preset options
// Based on Ramp_Preset_Group_Func enum from WinForms RLC codebase
export const RAMP_PRESET_GROUP_FUNCTIONS = ["BELL", "IP_SOFT_UP"];

// DelayOff Group Functions - functions that enable DelayOff option
// Based on DelayOff_Group_Func enum from WinForms RLC codebase
export const DELAY_OFF_GROUP_FUNCTIONS = [
  "KEY_CARD",
  "KEYLESS",
  "IP_TIMER_TOGGLE",
  "IP_TIMER_RETRIGGER",
  "CURTAIN",
  "ENTRANCE",
  "IP_SWITCH",
  "IP_SWITCH_INVERT",
];

// Ramp Group Functions - functions that enable only Ramp option
// Based on Ramp_Group_Func enum from WinForms RLC codebase
export const RAMP_GROUP_FUNCTIONS = ["IP_SOFT_DOWN"];

// Key Card Group Functions - functions for keycard features
// Based on Key_Card_Group_Func enum from WinForms RLC codebase
export const KEY_CARD_GROUP_FUNCTIONS = [
  "KEY_CARD",
  "SCENE_GROUP",
  "SCENE_GROUP_TOGGLE",
];

// Helper functions to check if a function belongs to each group
export const isRampPresetGroupFunction = (functionName) => {
  return RAMP_PRESET_GROUP_FUNCTIONS.includes(functionName);
};

export const isDelayOffGroupFunction = (functionName) => {
  return DELAY_OFF_GROUP_FUNCTIONS.includes(functionName);
};

export const isRampGroupFunction = (functionName) => {
  return RAMP_GROUP_FUNCTIONS.includes(functionName);
};

export const isKeyCardGroupFunction = (functionName) => {
  return KEY_CARD_GROUP_FUNCTIONS.includes(functionName);
};

// Function to determine which RLC options should be enabled based on input function
export const getRlcOptionsConfig = (functionName, unitType = null) => {
  const config = {
    rampEnabled: false,
    presetEnabled: false,
    ledDisplayEnabled: true, // LED display is generally always available
    nightlightEnabled: true, // Nightlight is generally always available
    backlightEnabled: true, // Backlight is generally always available
    autoModeEnabled: true, // Auto mode is generally always available
    delayOffEnabled: false,
    multiGroupEnabled: false,
  };

  if (!functionName || functionName === "IP_UNUSED") {
    // All options disabled for unused function
    return {
      ...config,
      ledDisplayEnabled: false,
      nightlightEnabled: false,
      backlightEnabled: false,
      autoModeEnabled: false,
    };
  }

  // Check function groups to enable specific options
  if (isRampPresetGroupFunction(functionName)) {
    config.rampEnabled = true;
    config.presetEnabled = true;
  }

  if (isRampGroupFunction(functionName)) {
    config.rampEnabled = true;
  }

  if (isDelayOffGroupFunction(functionName)) {
    config.delayOffEnabled = true;
  }

  if (isMultipleGroupFunction(functionName)) {
    config.multiGroupEnabled = true;
  }

  return config;
};

export const hasSpecialInputs = (unitName) => {
  const unit = CONSTANTS.UNIT.TYPES.find((u) => u.name === unitName);
  if (!unit || !unit.inputFunctions) return false;

  // Check if any inputs have special function lists (not "ALL")
  return Object.keys(unit.inputFunctions).some(
    (key) => key !== "default" && unit.inputFunctions[key] !== "ALL"
  );
};

// RLC Options Constants (from WinForms RLC application)

// Ramp time options (in seconds)
export const RAMP_OPTIONS = [
  { value: 0, label: "Instant" },
  { value: 1, label: "1 secs" },
  { value: 4, label: "4 secs" },
  { value: 8, label: "8 secs" },
  { value: 12, label: "12 secs" },
  { value: 20, label: "20 secs" },
  { value: 30, label: "30 secs" },
  { value: 40, label: "40 secs" },
  { value: 60, label: "60 secs" },
  { value: 90, label: "90 secs" },
  { value: 120, label: "120 secs" },
  { value: 150, label: "150 secs" },
  { value: 180, label: "180 secs" },
  { value: 210, label: "210 secs" },
  { value: 240, label: "240 secs" },
  { value: 255, label: "255 secs" },
];

// LED Display modes
export const LED_DISPLAY_MODES = [
  { value: 0, label: "OFF", description: "LED always off" },
  { value: 1, label: "ON", description: "LED always on" },
  { value: 2, label: "ON/OFF", description: "LED shows on/off status" },
  { value: 3, label: "2 Colors", description: "LED shows 2-color status" },
];

// LED Status calculation flags
export const LED_STATUS_FLAGS = {
  NIGHTLIGHT: 16, // Add 16 if nightlight is enabled
  BACKLIGHT: 32, // Add 32 if backlight is enabled
};

// Delay time options for hours (0-18, with special limit at 18)
export const DELAY_HOUR_OPTIONS = Array.from({ length: 19 }, (_, i) => ({
  value: i,
  label: i.toString(),
}));

// Delay time options for minutes (0-59, but limited to 11 if hour is 18)
export const DELAY_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: i.toString(),
}));

// Delay time options for seconds (0-59)
export const DELAY_SECOND_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: i.toString(),
}));

// Helper function to get minute options based on selected hour
export function getDelayMinuteOptions(selectedHour) {
  const maxMinutes = selectedHour === 18 ? 12 : 60;
  return Array.from({ length: maxMinutes }, (_, i) => ({
    value: i,
    label: i.toString(),
  }));
}

// Helper function to calculate delay in seconds
export function calculateDelaySeconds(hours, minutes, seconds) {
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to parse delay seconds back to hours, minutes, seconds
export function parseDelaySeconds(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

// Helper function to calculate LED status value
export function calculateLedStatus(displayMode, nightlight, backlight) {
  let status = displayMode;
  if (nightlight) status += LED_STATUS_FLAGS.NIGHTLIGHT;
  if (backlight) status += LED_STATUS_FLAGS.BACKLIGHT;
  return status;
}

// Helper function to parse LED status value
export function parseLedStatus(ledStatus) {
  const backlight = ledStatus >= LED_STATUS_FLAGS.BACKLIGHT;
  let remaining = backlight
    ? ledStatus - LED_STATUS_FLAGS.BACKLIGHT
    : ledStatus;

  const nightlight = remaining >= LED_STATUS_FLAGS.NIGHTLIGHT;
  remaining = nightlight ? remaining - LED_STATUS_FLAGS.NIGHTLIGHT : remaining;

  const displayMode = remaining;

  return { displayMode, nightlight, backlight };
}
