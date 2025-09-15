import { CONSTANTS } from "@/constants";

const { UDP_PORT } = CONSTANTS.UNIT.UDP_CONFIG;

// Configuration flag to control whether to send name in multi-scene packets
const isSendName = false;

const PROTOCOL = {
  GENERAL: {
    CMD1: 1,
    CMD2: {
      REQUEST_UNIT: 1,
      UPDATE_FIRMWARE: 6,
      CHANGE_IP: 7,
      CHANGE_ID: 8,
      SYNC_CLOCK: 9,
      GET_CLOCK: 10,
      HARDWARE_CONFIG: 12,
      GET_RS485_CH1_CONFIG: 13,
      GET_RS485_CH2_CONFIG: 14,
      SET_RS485_CH1_CONFIG: 15,
      SET_RS485_CH2_CONFIG: 16,
      SETUP_SCENE: 19,
      GET_SCENE_INFOR: 20,
      SETUP_SCHEDULE: 21,
      GET_SCHEDULE_INFOR: 22,
      TRIGGER_SCENE: 23,
      SETUP_MULTI_SCENE: 24,
      GET_MULTI_SCENE: 25,
      TRIGGER_MULTI_SCENE: 26,
      SETUP_SEQUENCE: 27,
      GET_SEQUENCE: 28,
      TRIGGER_SEQUENCE: 29,
      CLEAR_SCENE: 30,
      CLEAR_MULTI_SCENE: 31,
      CLEAR_SEQUENCE: 32,
      CLEAR_SCHEDULE: 33,
    },
  },
  LIGHTING: {
    CMD1: 10,
    CMD2: {
      SETUP_INPUT: 0,
      GET_INPUT_CONFIG: 9,
      SET_OUTPUT_ASSIGN: 20,
      GET_OUTPUT_ASSIGN: 31,
      SET_OUTPUT_DELAY_OFF: 32,
      SET_OUTPUT_DELAY_ON: 33,
      GET_OUTPUT_CONFIG: 34,
      SET_OUTPUT_CONFIG: 35,
      SET_OUTPUT_STATE: 61,
      GET_OUTPUT_STATE: 64,
      SET_GROUP_STATE: 62,
      GET_GROUP_STATE: 65,
      SET_INPUT_STATE: 60,
      GET_INPUT_STATE: 63,
    },
  },
  AC: {
    CMD1: 30,
    CMD2: {
      GET_LOCAL_AC_CONFIG: 0,
      SET_LOCAL_AC_CONFIG: 1,
      GET_AC_GROUP: 14,
      GET_ROOM_TEMP: 21,
      SET_SETTING_ROOM_TEMP: 22,
      GET_SETTING_ROOM_TEMP: 23,
      SET_FAN_MODE: 24,
      GET_FAN_MODE: 25,
      SET_POWER_MODE: 28,
      GET_POWER_MODE: 29,
      SET_OPERATE_MODE: 30,
      GET_OPERATE_MODE: 31,
      SET_ECO_MODE: 32,
      GET_ECO_MODE: 33,
    },
  },
  CURTAIN: {
    CMD1: 40,
    CMD2: {
      GET_CURTAIN_CONFIG: 0,
      SET_CURTAIN_CONFIG: 1,
      SET_CURTAIN: 2,
      CLEAR_CURTAIN: 4,
    },
  },
  KNX: {
    CMD1: 50,
    CMD2: {
      GET_KNX_OUT_CONFIG: 0,
      SET_KNX_OUT_CONFIG: 1,
      SET_KNX_OUT: 2,
      CLEAR_KNX: 8,
    },
  },
};

// Error codes mapping based on RCU protocol
const ERROR_CODES = {
  0: "SUCCESS",
  1: "ERR_CRC",
  2: "NO_SUPPORT",
  3: "LIMIT_FRAME_LEN",
  4: "LIMIT_INPUT_NUMBER",
  5: "LIMIT_OUTPUT_NUMBER",
  6: "LIMIT_GROUP_PER_INPUT",
  7: "ABSENT_UNIT",
  8: "SLAVE_UNIT",
  9: "LOWER_FIRMWARE",
  10: "LICENSE_FAIL",
  11: "HEX_FILE_CRC",
  254: "TRANSFERED_FAILED",
  255: "OTHER",
};

export { UDP_PORT, isSendName, PROTOCOL, ERROR_CODES };
