export const CONSTANTS = {
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

  UNIT: {
    TYPES: [
      { name: "Room Logic Controller", barcode: "8930000000019" },
      { name: "Bedside-17T", barcode: "8930000000200" },
      { name: "Bedside-12T", barcode: "8930000100214" },
      { name: "BSP_R14_OL", barcode: "8930000100221" },
      { name: "RLC-I16", barcode: "8930000000026" },
      { name: "RLC-I20", barcode: "8930000000033" },
      { name: "RCU-32AO", barcode: "8930000200013" },
      { name: "RCU-8RL-24AO", barcode: "8930000200020" },
      { name: "RCU-16RL-16AO", barcode: "8930000200037" },
      { name: "RCU-24RL-8AO", barcode: "8930000200044" },
      { name: "RCU-11IN-4RL", barcode: "8930000210005" },
      { name: "RCU-21IN-10RL", barcode: "8930000210012" },
      { name: "RCU-30IN-10RL", barcode: "8930000210036" },
      { name: "RCU-48IN-16RL", barcode: "8930000210043" },
      { name: "RCU-48IN-16RL-4AO", barcode: "8930000210050" },
      { name: "RCU-48IN-16RL-4AI", barcode: "8930000210067" },
      { name: "RCU-48IN-16RL-K", barcode: "8930000210074" },
      { name: "RCU-48IN-16RL-DL", barcode: "8930000210081" },
      { name: "RCU-21IN-8RL", barcode: "8930000210111" },
      { name: "RCU-21IN-8RL-4AO", barcode: "8930000210128" },
      { name: "RCU-21IN-8RL-4AI", barcode: "8930000210135" },
      { name: "RCU-21IN-8RL-K", barcode: "8930000210142" },
      { name: "RCU-21IN-10RL-T", barcode: "8930000210159" },
      { name: "GNT-EXT-6RL", barcode: "8930000200051" },
      { name: "GNT-EXT-8RL", barcode: "8930000200068" },
      { name: "GNT-EXT-10AO", barcode: "8930000200075" },
      { name: "GNT-EXT-28AO", barcode: "8930000200082" },
      { name: "GNT-EXT-12RL", barcode: "8930000200105" },
      { name: "GNT-EXT-20RL", barcode: "8930000200112" },
      { name: "GNT-EXT-12RL-12AO", barcode: "8930000200099" },
      { name: "GNT-EXT-24IN", barcode: "8930000220011" },
      { name: "GNT-EXT-48IN", barcode: "8930000220028" },
      { name: "GNT-ETH2KDL", barcode: "8930000230003" }
    ],
    MODES: ["Slave", "Master", "Stand-Alone"],
    UDP_CONFIG: {
      UDP_PORT: 1234,
      LOCAL_UDP_PORT: 5678,
      BROADCAST_IP: "255.255.255.255",
      RECEIVE_TIMEOUT: 3000,
      SCAN_TIMEOUT: 5000,
      MAX_RETRY: 3
    }
  },

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
      { value: 255, label: "RS485_OTHER" }
    ],

    BAUDRATES: [
      { value: 4800, label: "4800" },
      { value: 9600, label: "9600" },
      { value: 19200, label: "19200" },
      { value: 38400, label: "38400" },
      { value: 57600, label: "57600" },
      { value: 115200, label: "115200" },
      { value: 128000, label: "128000" },
      { value: 256000, label: "256000" }
    ],

    PARITY: [
      { value: 0, label: "None" },
      { value: 1, label: "Odd" },
      { value: 2, label: "Even" }
    ],

    STOP_BITS: [
      { value: 0, label: "1" },
      { value: 1, label: "2" }
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
      values: []
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