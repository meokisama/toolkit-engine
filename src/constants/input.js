import { UNIT_TYPES } from "@/constants/unit";

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
    { value: 24, name: "SCENE_LIGHTING_SEQUENCE", label: "Scene Lighting Sequence" },
    { value: 25, name: "SCENE_LIGHTING_OFF", label: "Scene Lighting Off" },
    { value: 26, name: "SCENE_LIGHTING_ON", label: "Scene Lighting On" },
    { value: 27, name: "SCENE_WELCOME", label: "Scene Welcome" },
    { value: 28, name: "SCENE_UNOCCUPIED", label: "Scene Unoccupied" },
    { value: 29, name: "SCENE_LIGHTING_TOGGLE", label: "Scene Lighting Toggle" },
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
    { value: 91, name: "TOGGLE_SCENE_LIGHTING", label: "Toggle Scene Lighting" },
    { value: 92, name: "TOGGLE_SCENE_LIGHTING_OFF", label: "Toggle Scene Lighting Off" },
    { value: 93, name: "TOGGLE_SCENE_LIGHTING_ON", label: "Toggle Scene Lighting On" },
    { value: 94, name: "TOGGLE_SCENE_LIGHTING_SEQUENCE", label: "Toggle Scene Lighting Sequence" },
    { value: 95, name: "TOGGLE_SCENE_LIGHTING_GROUP", label: "Toggle Scene Lighting Group" },
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
    { value: 45, name: "SCENE_OBJECT_SEQUENCE", label: "Scene Object Sequence" },
    { value: 100, name: "SCENE_TRIGGER", label: "Scene Trigger" },
    { value: 101, name: "SCENE_TOGGLE", label: "Scene Toggle" },
    { value: 102, name: "SCENE_SEQUENCE", label: "Scene Sequence" },
    { value: 105, name: "TOGGLE_SCENE_TRIGGER", label: "Toggle Scene Trigger" },
    { value: 106, name: "TOGGLE_SCENE_TOGGLE", label: "Toggle Scene Toggle" },
    { value: 107, name: "TOGGLE_SCENE_SEQUENCE", label: "Toggle Scene Sequence" },
  ],
  MULTI_SCENES: [
    { value: 103, name: "MULTI_SCENE", label: "Multi-Scene" },
    { value: 108, name: "TOGGLE_MULTI_SCENE", label: "Toggle-Multi Scene" },
  ],
  SEQUENCE: [
    { value: 104, name: "MULTI_SCENE_SEQ", label: "Multi-Scene Seq" },
    { value: 109, name: "TOGGLE_MULTI_SCENE_SEQ", label: "Toggle-Multi Scene Seq" },
  ],
};

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

export const getInputFunctions = (unitName, inputIndex) => {
  const unit = UNIT_TYPES.find((u) => u.name === unitName);
  if (!unit || !unit.inputFunctions) return INPUT_FUNCTION_LISTS.ALL;

  if (unit.inputFunctions[inputIndex]) {
    const functionListKey = unit.inputFunctions[inputIndex];
    return INPUT_FUNCTION_LISTS[functionListKey] || INPUT_FUNCTION_LISTS.ALL;
  }

  if (unit.inputFunctions.default) {
    const functionListKey = unit.inputFunctions.default;
    return INPUT_FUNCTION_LISTS[functionListKey] || INPUT_FUNCTION_LISTS.ALL;
  }

  return INPUT_FUNCTION_LISTS.ALL;
};

export const getInputFunctionByValue = (value) => {
  for (const functionList of Object.values(INPUT_FUNCTION_LISTS)) {
    const found = functionList.find((func) => func.value === value);
    if (found) return found;
  }
  return null;
};

export const getRlcOptionsConfig = (functionName, unitType = null) => {
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

/**
 * Get input display name, with grouped naming if applicable
 * @param {string} unitType - The type of unit
 * @param {number} inputIndex - The input index (0-based)
 * @returns {string} The input display name
 *
 * For grouped inputs (48IN and 30IN units):
 * - Input 0, 1, 2 => Input 1.1, 1.2, 1.3
 * - Input 3, 4, 5 => Input 2.1, 2.2, 2.3
 * - etc.
 *
 * For non-grouped inputs:
 * - Input 0 => Input 1
 * - Input 1 => Input 2
 * - etc.
 */
export const getInputDisplayName = (unitType, inputIndex) => {
  const unit = UNIT_TYPES.find((u) => u.name === unitType);
  const isGrouped = unit?.groupedInputs === true;

  if (isGrouped) {
    return `Input ${Math.floor(inputIndex / 3) + 1}.${(inputIndex % 3) + 1}`;
  }
  return `Input ${inputIndex + 1}`;
};
