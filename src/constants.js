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

  MULTI_SCENES: {
    TYPES: [
      { value: 0, name: "TRIGGER", label: "Trigger" },
      { value: 1, name: "SEQUENCE", label: "Sequence" },
    ],
  },

  RS485: {
    MAX_CONFIG: 2,
    SLAVE_MAX_DEVS: 10,
    SLAVE_MAX_INDOORS: 16,

    TYPES: [
      { value: 0, label: "None" },
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

// Input function types organized by categories for unit configuration
export const INPUT_TYPES = {
  ROOM: [
    { value: 4, name: "KEY_CARD", label: "Key Card" },
    { value: 31, name: "DOOR_SWITCH", label: "Door Switch" },
    { value: 32, name: "MOTION_SENSOR", label: "Motion Sensor" },
  ],
  LIGHTING: [
    { value: 0, name: "IP_UNUSED", label: "Unused" },
    { value: 1, name: "BELL", label: "Bell" },
    { value: 2, name: "DO_NOT_DISTURB", label: "Do Not Disturb" },
    { value: 3, name: "MAKE_UP_ROOM", label: "Make Up Room" },
    { value: 5, name: "IP_ON", label: "Input On" },
    { value: 6, name: "IP_OFF", label: "Input Off" },
    { value: 7, name: "IP_ON_OFF", label: "Input On/Off" },
    { value: 8, name: "IP_SWITCH", label: "Switch" },
    { value: 9, name: "IP_SWITCH_INVERT", label: "Switch Invert" },
    { value: 10, name: "IP_DIM_TOGGLE", label: "Dim Toggle" },
    { value: 11, name: "IP_DIM_MEM", label: "Dim Mem" },
    { value: 12, name: "IP_ON_UP", label: "On Up" },
    { value: 13, name: "IP_OFF_DOWN", label: "Off Down" },
    { value: 14, name: "IP_TIMER_TOGGLE", label: "Timer Toggle" },
    { value: 15, name: "IP_TIMER_RETRIGGER", label: "Timer Retrigger" },
    { value: 16, name: "IP_DIM_UP", label: "Dim Up" },
    { value: 17, name: "IP_DIM_DOWN", label: "Dim Down" },
    { value: 18, name: "IP_SOFT_UP", label: "Soft Up" },
    { value: 19, name: "IP_SOFT_DOWN", label: "Soft Down" },
    { value: 20, name: "SCENE_LIGHTING", label: "Scene Lighting" },
    { value: 21, name: "CURTAIN", label: "Curtain" },
    { value: 22, name: "RETURN", label: "Return" },
    { value: 23, name: "IP_TOGGLE", label: "Toggle" },
    {
      value: 24,
      name: "SCENE_LIGHTING_SEQUENCE",
      label: "Scene Lighting Sequence",
    },
    { value: 25, name: "SCENE_LIGHTING_OFF", label: "Scene Lighting Off" },
    { value: 26, name: "SCENE_LIGHTING_ON", label: "Scene Lighting On" },
    { value: 27, name: "SCENE_WELCOME", label: "Scene Welcome" },
    { value: 28, name: "SCENE_UNOCCUPIED", label: "Scene Unoccupied" },
    {
      value: 29,
      name: "SCENE_LIGHTING_TOGGLE",
      label: "Scene Lighting Toggle",
    },
    { value: 30, name: "KEYLESS", label: "Keyless" },
    { value: 33, name: "BLIND", label: "Blind" },
    { value: 34, name: "FAN_LMH", label: "Fan LMH" },
    { value: 35, name: "FAN_LMHO", label: "Fan LMHO" },
    { value: 36, name: "IP_CIRCLE_UP", label: "Circle Up" },
    { value: 37, name: "IP_CIRCLE_DOWN", label: "Circle Down" },
    { value: 38, name: "IP_CIRCLE_UP_OFF", label: "Circle Up Off" },
    { value: 39, name: "IP_CIRCLE_DOWN_OFF", label: "Circle Down Off" },
    { value: 40, name: "IP_VOL_UP", label: "Vol Up" },
    { value: 41, name: "IP_VOL_DOWN", label: "Vol Down" },
    { value: 42, name: "SCENE_WELCOME_NIGHT", label: "Scene Welcome Night" },
    { value: 80, name: "TIME_HOUR", label: "Time Hour" },
    { value: 81, name: "TIME_MINUTE", label: "Time Minute" },
    { value: 82, name: "TIME_ALARM", label: "Time Alarm" },
    { value: 83, name: "TIME_ZONE", label: "Time Zone" },
    { value: 84, name: "TIME_SETT", label: "Time Sett" },
    { value: 90, name: "MOTION_SET_SCENE", label: "Motion Set Scene" },
    {
      value: 91,
      name: "TOGGLE_SCENE_LIGHTING",
      label: "Toggle Scene Lighting",
    },
    {
      value: 92,
      name: "TOGGLE_SCENE_LIGHTING_OFF",
      label: "Toggle Scene Lighting Off",
    },
    {
      value: 93,
      name: "TOGGLE_SCENE_LIGHTING_ON",
      label: "Toggle Scene Lighting On",
    },
    {
      value: 94,
      name: "TOGGLE_SCENE_LIGHTING_SEQUENCE",
      label: "Toggle Scene Lighting Sequence",
    },
    {
      value: 95,
      name: "TOGGLE_SCENE_LIGHTING_GROUP",
      label: "Toggle Scene Lighting Group",
    },
    { value: 96, name: "TOGGLE_DND", label: "Toggle DND" },
    { value: 97, name: "TOGGLE_MUR", label: "Toggle MUR" },
    { value: 255, name: "CUSTOM", label: "Custom" },
  ],
  AIR_CONDITIONER: [
    { value: 50, name: "AC_FAN_LMH", label: "AC Fan LMH" },
    { value: 51, name: "AC_FAN_OLMH", label: "AC Fan OMLH" },
    { value: 52, name: "AC_FAN_LOW", label: "AC Fan Low" },
    { value: 53, name: "AC_FAN_MED", label: "AC Fan Med" },
    { value: 54, name: "AC_FAN_HIGH", label: "AC Fan High" },
    { value: 55, name: "AC_TEMP_DOWN", label: "AC Temp Down" },
    { value: 56, name: "AC_TEMP_UP", label: "AC Temp Up" },
    { value: 57, name: "AC_TEMP_TYPE", label: "AC Temp Type" },
    { value: 58, name: "AC_POWER", label: "AC Power" },
    { value: 59, name: "AC_MODE", label: "AC Mode" },
    { value: 60, name: "AC_FAN_SPEED", label: "AC Fan Speed" },
    { value: 70, name: "SW_INV_AC_OFF", label: "SW Inv AC Off" },
    { value: 71, name: "SW_INV_AC_ECO", label: "SW Inv AC Eco" },
  ],
  CURTAIN: [{ value: 49, name: "CURTAIN_OBJECT_IP", label: "Curtain Object" }],
  SCENE: [
    { value: 43, name: "SCENE_OBJECT_TRIGGER", label: "Scene Object Trigger" },
    { value: 44, name: "SCENE_OBJECT_TOGGLE", label: "Scene Object Toggle" },
    {
      value: 45,
      name: "SCENE_OBJECT_SEQUENCE",
      label: "Scene Object Sequence",
    },
    { value: 100, name: "SCENE_TRIGGER", label: "Scene Trigger" },
    { value: 101, name: "SCENE_ON", label: "Scene On" },
    { value: 102, name: "SCENE_OFF", label: "Scene Off" },
    {
      value: 105,
      name: "TOGGLE_SCENE_TRIGGER",
      label: "Toggle Scene Trigger",
    },
    { value: 106, name: "TOGGLE_SCENE_ON", label: "Toggle Scene On" },
    { value: 107, name: "TOGGLE_SCENE_OFF", label: "Toggle Scene Off" },
  ],
  MULTI_SCENES: [
    { value: 103, name: "MULTI_SCENE", label: "Multi-Scene" },
    { value: 108, name: "TOGGLE_MULTI_SCENE", label: "Toggle-Multi Scene" },
  ],
  SEQUENCE: [
    { value: 104, name: "MULTI_SCENE_SEQ", label: "Multi-Scene Seq" },
    {
      value: 109,
      name: "TOGGLE_MULTI_SCENE_SEQ",
      label: "Toggle-Multi Scene Seq",
    },
  ],
};

// Input function lists for specific input types
const INPUT_FUNCTION_LISTS = {
  KEY_CARD_INPUT: [
    { value: 0, name: "IP_UNUSED", label: "Unused" },
    { value: 4, name: "KEY_CARD", label: "Key Card" },
    { value: 30, name: "KEYLESS", label: "Keyless" },
  ],
  BELL_INPUT: [
    { value: 0, name: "IP_UNUSED", label: "Unused" },
    { value: 1, name: "BELL", label: "Bell" },
  ],
  DND_INPUT: [
    { value: 0, name: "IP_UNUSED", label: "Unused" },
    { value: 2, name: "DO_NOT_DISTURB", label: "Do Not Disturb" },
    { value: 96, name: "TOGGLE_DND", label: "Toggle DND" },
  ],
  MUR_INPUT: [
    { value: 0, name: "IP_UNUSED", label: "Unused" },
    { value: 3, name: "MAKE_UP_ROOM", label: "Make Up Room" },
    { value: 97, name: "TOGGLE_MUR", label: "Toggle MUR" },
  ],
  ALL: [
    ...INPUT_TYPES.ROOM,
    ...INPUT_TYPES.LIGHTING,
    ...INPUT_TYPES.AIR_CONDITIONER,
    ...INPUT_TYPES.CURTAIN,
    ...INPUT_TYPES.SCENE,
    ...INPUT_TYPES.MULTI_SCENES,
    ...INPUT_TYPES.SEQUENCE,
  ],
};

// Helper functions for input functions (proper mapping)
export const getInputFunctions = (unitName, inputIndex) => {
  const unit = CONSTANTS.UNIT.TYPES.find((u) => u.name === unitName);
  if (!unit || !unit.inputFunctions) return INPUT_FUNCTION_LISTS.ALL;

  // Check if this specific input has a custom function list
  if (unit.inputFunctions[inputIndex]) {
    const functionListKey = unit.inputFunctions[inputIndex];
    return INPUT_FUNCTION_LISTS[functionListKey] || INPUT_FUNCTION_LISTS.ALL;
  }

  // Use default function list
  if (unit.inputFunctions.default) {
    const functionListKey = unit.inputFunctions.default;
    return INPUT_FUNCTION_LISTS[functionListKey] || INPUT_FUNCTION_LISTS.ALL;
  }

  return INPUT_FUNCTION_LISTS.ALL;
};

export const getInputFunctionByValue = (value) => {
  // Search through all function lists to find function by value
  for (const functionList of Object.values(INPUT_FUNCTION_LISTS)) {
    const found = functionList.find((func) => func.value === value);
    if (found) return found;
  }
  return null;
};

export const isMultipleGroupFunction = (functionName) => {
  // Simplified check - most functions support multiple groups
  return functionName && functionName !== "IP_UNUSED";
};

// RLC Options Constants (simplified versions)
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

export const LED_DISPLAY_MODES = [
  { value: 0, label: "OFF", description: "LED always off" },
  { value: 1, label: "ON", description: "LED always on" },
  { value: 2, label: "ON/OFF", description: "LED shows on/off status" },
  { value: 3, label: "2 Colors", description: "LED shows 2-color status" },
];

// Helper functions for delay and LED calculations
export function calculateDelaySeconds(hours, minutes, seconds) {
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseDelaySeconds(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export function calculateLedStatus(displayMode, nightlight, backlight) {
  let status = displayMode;
  if (nightlight) status += 16; // NIGHTLIGHT flag
  if (backlight) status += 32; // BACKLIGHT flag
  return status;
}

export function parseLedStatus(ledStatus) {
  const backlight = ledStatus >= 32;
  let remaining = backlight ? ledStatus - 32 : ledStatus;

  const nightlight = remaining >= 16;
  remaining = nightlight ? remaining - 16 : remaining;

  const displayMode = remaining;

  return { displayMode, nightlight, backlight };
}

export const getRlcOptionsConfig = (functionName, unitType = null) => {
  // Simplified RLC options configuration
  const config = {
    rampEnabled: true,
    presetEnabled: true,
    ledDisplayEnabled: true,
    nightlightEnabled: true,
    backlightEnabled: true,
    autoModeEnabled: true,
    delayOffEnabled: true,
    multiGroupEnabled: true,
  };

  if (!functionName || functionName === "IP_UNUSED") {
    // All options disabled for unused function
    return {
      ...config,
      rampEnabled: false,
      presetEnabled: false,
      ledDisplayEnabled: false,
      nightlightEnabled: false,
      backlightEnabled: false,
      autoModeEnabled: false,
      delayOffEnabled: false,
      multiGroupEnabled: false,
    };
  }

  return config;
};
