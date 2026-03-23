export const KNX = {
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
};
