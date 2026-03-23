export const AIRCON = [
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
];
