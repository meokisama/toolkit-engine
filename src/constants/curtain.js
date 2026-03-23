export const CURTAIN = {
  TYPES: [
    { value: 0, name: "", label: "Select curtain type" },
    { value: 1, name: "CURTAIN_PULSE_1G_2P", label: "1-Gang 2-Point Pulse" },
    { value: 2, name: "CURTAIN_PULSE_1G_3P", label: "1-Gang 3-Point Pulse" },
    { value: 3, name: "CURTAIN_PULSE_2P", label: "2-Point Pulse" },
    { value: 4, name: "CURTAIN_PULSE_3P", label: "3-Point Pulse" },
    { value: 5, name: "CURTAIN_HOLD_1G", label: "1-Gang Hold" },
    { value: 6, name: "CURTAIN_HOLD", label: "Hold" },
    { value: 7, name: "CURTAIN_RS485", label: "RS485" },
  ],
  VALUES: [
    { value: 0, label: "Stop" },
    { value: 1, label: "Open" },
    { value: 2, label: "Close" },
  ],
};

export const CURTAIN_TYPES = CURTAIN.TYPES;
export const CURTAIN_VALUES = CURTAIN.VALUES;
