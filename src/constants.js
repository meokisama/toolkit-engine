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

