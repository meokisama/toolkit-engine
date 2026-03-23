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
    // TIMER: { obj_name: "OBJ_TIMER", obj_value: 8 },
    DMX_COLOR1: { obj_name: "OBJ_DMX_COLOR1", obj_value: 9 },
    DMX_COLOR2: { obj_name: "OBJ_DMX_COLOR2", obj_value: 10 },
    DMX_COLOR3: { obj_name: "OBJ_DMX_COLOR3", obj_value: 11 },
    DMX_COLOR4: { obj_name: "OBJ_DMX_COLOR4", obj_value: 12 },
    DMX_COLOR5: { obj_name: "OBJ_DMX_COLOR5", obj_value: 13 },
    DMX_COLOR6: { obj_name: "OBJ_DMX_COLOR6", obj_value: 14 },
    DMX_COLOR7: { obj_name: "OBJ_DMX_COLOR7", obj_value: 15 },
    DMX_COLOR8: { obj_name: "OBJ_DMX_COLOR8", obj_value: 16 },
    DMX_COLOR9: { obj_name: "OBJ_DMX_COLOR9", obj_value: 17 },
    DMX_COLOR10: { obj_name: "OBJ_DMX_COLOR10", obj_value: 18 },
    DMX_COLOR11: { obj_name: "OBJ_DMX_COLOR11", obj_value: 19 },
    DMX_COLOR12: { obj_name: "OBJ_DMX_COLOR12", obj_value: 20 },
    DMX_COLOR13: { obj_name: "OBJ_DMX_COLOR13", obj_value: 21 },
    DMX_COLOR14: { obj_name: "OBJ_DMX_COLOR14", obj_value: 22 },
    DMX_COLOR15: { obj_name: "OBJ_DMX_COLOR15", obj_value: 23 },
    DMX_COLOR16: { obj_name: "OBJ_DMX_COLOR16", obj_value: 24 },
    // LED SPI Effects (for scene control)
    LED_SPI_EFFECT1: { obj_name: "OBJ_LED_SPI_EFFECT1", obj_value: 25 },
    LED_SPI_EFFECT2: { obj_name: "OBJ_LED_SPI_EFFECT2", obj_value: 26 },
    LED_SPI_EFFECT3: { obj_name: "OBJ_LED_SPI_EFFECT3", obj_value: 27 },
    LED_SPI_EFFECT4: { obj_name: "OBJ_LED_SPI_EFFECT4", obj_value: 28 },
    LED_SPI_EFFECT5: { obj_name: "OBJ_LED_SPI_EFFECT5", obj_value: 29 },
    LED_SPI_EFFECT6: { obj_name: "OBJ_LED_SPI_EFFECT6", obj_value: 30 },
    LED_SPI_EFFECT7: { obj_name: "OBJ_LED_SPI_EFFECT7", obj_value: 31 },
    LED_SPI_EFFECT8: { obj_name: "OBJ_LED_SPI_EFFECT8", obj_value: 32 },
    LED_SPI_EFFECT9: { obj_name: "OBJ_LED_SPI_EFFECT9", obj_value: 33 },
    LED_SPI_EFFECT10: { obj_name: "OBJ_LED_SPI_EFFECT10", obj_value: 34 },
    LED_SPI_EFFECT11: { obj_name: "OBJ_LED_SPI_EFFECT11", obj_value: 35 },
    LED_SPI_EFFECT12: { obj_name: "OBJ_LED_SPI_EFFECT12", obj_value: 36 },
    LED_SPI_EFFECT13: { obj_name: "OBJ_LED_SPI_EFFECT13", obj_value: 37 },
    LED_SPI_EFFECT14: { obj_name: "OBJ_LED_SPI_EFFECT14", obj_value: 38 },
    LED_SPI_EFFECT15: { obj_name: "OBJ_LED_SPI_EFFECT15", obj_value: 39 },
    LED_SPI_EFFECT16: { obj_name: "OBJ_LED_SPI_EFFECT16", obj_value: 40 },
  },

  UNIT: {
    TYPES: [
      {
        name: "Room Logic Controller",
        barcode: "8930000000019",
        inputs: 48,
        groupedInputs: true,
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
        groupedInputs: true,
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
        groupedInputs: true,
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
        groupedInputs: true,
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
        groupedInputs: true,
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
        groupedInputs: true,
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
        name: "RCU-48IN-16RL-DL",
        barcode: "8930000210081",
        inputs: 48,
        groupedInputs: true,
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

  KNX: {
    KNX_OUTPUT_TYPES: [
      { value: 0, name: "KNX_OUTPUT_DISABLE", label: "Disable", resource: null },
      { value: 1, name: "KNX_OUTPUT_SWITCH", label: "Switch", resource: "lighting" },
      { value: 2, name: "KNX_OUTPUT_DIMMER", label: "Dimmer", resource: "lighting" },
      { value: 3, name: "KNX_OUTPUT_CURTAIN", label: "Curtain", resource: "curtain" },
      { value: 4, name: "KNX_OUTPUT_SCENE", label: "Scene", resource: "scene" },
      { value: 5, name: "KNX_OUTPUT_MULTI_SCENE", label: "Multi Scene", resource: "multi_scenes" },
      { value: 6, name: "KNX_OUTPUT_MULTI_SCENE_SEQ", label: "Sequence", resource: "sequences" },
      { value: 7, name: "KNX_AC_POWER", label: "AC Power", resource: "aircon" },
      { value: 8, name: "KNX_AC_MODE", label: "AC Mode", resource: "aircon" },
      { value: 9, name: "KNX_AC_FAN_SPEED", label: "AC Fan Speed", resource: "aircon" },
      { value: 10, name: "KNX_AC_SWING", label: "AC Swing", resource: "aircon" },
      { value: 11, name: "KNX_AC_SET_POINT", label: "AC Set Point", resource: "aircon" },
      { value: 12, name: "KNX_AC_ROOM_TEMP", label: "AC Room Temp", resource: "aircon" },
    ],

    KNX_FEEDBACK_TYPES: [
      { value: 0, name: "KNX_FB_DISABLE", label: "Disable" },
      { value: 1, name: "KNX_FB_PASSIVE", label: "Passive" },
      { value: 2, name: "KNX_FB_ACTIVE", label: "Active" },
    ],
  },

  MULTI_SCENES: {
    TYPES: [
      { value: 0, name: "TRIGGER", label: "Trigger" },
      { value: 1, name: "SEQUENCE", label: "Sequence" },
    ],
  },

  ZIGBEE: {
    DEVICE_TYPE: [
      { value: 0, name: "SWITCH_1", label: "1-Gang Switch" },
      { value: 1, name: "SWITCH_2", label: "2-Gang Switch" },
      { value: 2, name: "SWITCH_3", label: "3-Gang Switch" },
      { value: 3, name: "SWITCH_4", label: "4-Gang Switch" },
      { value: 4, name: "CURTAIN_1", label: "1-Gang Curtain" },
      { value: 5, name: "CURTAIN_2", label: "2-Gang Curtain" },
      { value: 6, name: "DIMMER", label: "Dimmer" },
      { value: 7, name: "MOTION_SENSOR", label: "Motion Sensor" },
      { value: 8, name: "THERMOSTAT", label: "Thermostat" },
      { value: 9, name: "DOOR_CONTACT", label: "Door Contact" },
      { value: 10, name: "ANALOG_INPUT", label: "Analog Input" },
    ],
    SEND_CMD_TYPE: [
      { value: 0, name: "OFF", label: "Off" },
      { value: 1, name: "ON", label: "On" },
      { value: 2, name: "TOGGLE", label: "Toggle" },
    ],
  },
};

// Export individual parts for easier access
export const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;
export const UNIT_TYPES = CONSTANTS.UNIT.TYPES;
export const UNIT_MODES = CONSTANTS.UNIT.MODES;

// Helper functions for unit I/O specifications
export const getUnitIOSpec = (unitName) => {
  const unit = CONSTANTS.UNIT.TYPES.find((u) => u.name === unitName);
  return unit
    ? {
        inputs: unit.inputs,
        outputs: unit.outputs,
        totalOutputs: unit.outputs.relay + unit.outputs.dimmer + unit.outputs.ao + unit.outputs.ac,
      }
    : null;
};

export const getUnitByBarcode = (barcode) => {
  return CONSTANTS.UNIT.TYPES.find((u) => u.barcode === barcode);
};

export const getOutputTypes = (unitName) => {
  const spec = getUnitIOSpec(unitName);
  if (!spec) return [];

  const types = [];
  if (spec.outputs.relay > 0) types.push({ type: "relay", count: spec.outputs.relay });
  if (spec.outputs.dimmer > 0) types.push({ type: "dimmer", count: spec.outputs.dimmer });
  if (spec.outputs.ao > 0) types.push({ type: "ao", count: spec.outputs.ao });
  if (spec.outputs.ac > 0) types.push({ type: "ac", count: spec.outputs.ac });

  return types;
};

