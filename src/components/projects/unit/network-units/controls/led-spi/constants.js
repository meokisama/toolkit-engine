// LED Modes
export const LED_MODES = [
  { value: 0, label: "Default" },
  { value: 1, label: "Artnet" },
];

// IC Types
export const IC_TYPES = {
  UCS2904: { value: 0, label: "UCS2904" },
  TM1934: { value: 1, label: "TM1934" },
  SK6812: { value: 2, label: "SK6812" },
};

// Color Types
export const COLOR_TYPES = {
  RGB: { value: 0, label: "RGB" },
  GRB: { value: 1, label: "GRB" },
  RGBW: { value: 2, label: "RGBW" },
};

// Direction Types
export const DIRECTION_TYPES = {
  FORWARD: { value: 0, label: "Xuôi" },
  REVERSE: { value: 1, label: "Ngược" },
};

// Effect Groups
export const EFFECT_GROUPS = {
  NO_COLOR_CONFIG: "no_color_config",
  COLOR_CONFIG: "color_config",
  FIXED_COLOR: "fixed_color",
};

// LED Effects
export const LED_EFFECTS = [
  { value: 0, name: "EFFECT_CONFETTI", label: "Confetti", group: EFFECT_GROUPS.NO_COLOR_CONFIG },
  { value: 1, name: "EFFECT_POLICE_STROBE", label: "Police Strobe", group: EFFECT_GROUPS.NO_COLOR_CONFIG },
  { value: 2, name: "EFFECT_RAINBOW_CYCLE", label: "Rainbow Cycle", group: EFFECT_GROUPS.NO_COLOR_CONFIG },
  { value: 3, name: "EFFECT_THEATER_CHASE", label: "Theater Chase", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 4, name: "EFFECT_CENTER_OUT", label: "Center Out", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 5, name: "EFFECT_CURTAIN_FILL", label: "Curtain Fill", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 6, name: "EFFECT_CYLON_BOUNCE", label: "Cylon Bounce", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 7, name: "EFFECT_METEOR_CIRCLE", label: "Meteor Circle", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 8, name: "EFFECT_STACK_FALLING", label: "Stack Falling", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 9, name: "EFFECT_SPARKLE", label: "Sparkle", group: EFFECT_GROUPS.FIXED_COLOR },
  { value: 10, name: "EFFECT_BREATHING_COLOR", label: "Breathing Color", group: EFFECT_GROUPS.FIXED_COLOR },
  { value: 11, name: "EFFECT_TEMPLATE_12", label: "Rainbow Wave", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 12, name: "EFFECT_TEMPLATE_13", label: "Multi-Layer Wave", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 13, name: "EFFECT_TEMPLATE_14", label: "Test Effect", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 14, name: "EFFECT_TEMPLATE_15", label: "Blue Star", group: EFFECT_GROUPS.COLOR_CONFIG },
  { value: 15, name: "EFFECT_TEMPLATE_16", label: "Effect 16", group: EFFECT_GROUPS.COLOR_CONFIG },
];

// Group labels for display
export const EFFECT_GROUP_LABELS = {
  [EFFECT_GROUPS.NO_COLOR_CONFIG]: "Hiệu ứng tự động",
  [EFFECT_GROUPS.COLOR_CONFIG]: "Hiệu ứng tùy chỉnh màu",
  [EFFECT_GROUPS.FIXED_COLOR]: "Hiệu ứng màu cố định",
};

// Validation limits
export const VALIDATION = {
  PIXEL_AMOUNT: { min: 0, max: 512 },
  SPEED: { min: 0, max: 255 },
  BRIGHTNESS: { min: 0, max: 255 },
  COLOR: { min: 0, max: 255 },
  BIT_TIME: { min: 0, max: 3180 },
  RESET_CYCLE: { min: 0, max: 65536 },
  START_UNIVERSE: { min: 0, max: 127 },
};

// Default channel state
export const DEFAULT_CHANNEL_STATE = {
  pixelAmount: 0,
  icType: IC_TYPES.UCS2904.value,
  colorType: COLOR_TYPES.RGB.value,
  direction: DIRECTION_TYPES.FORWARD.value,
  custom: false,
  bit0HighTime: 0,
  bit1HighTime: 0,
  overallBitTime: 0,
  resetCycle: 0,
};

// Default effect state
export const DEFAULT_EFFECT_STATE = {
  effect: 0,
  speed: 128,
  brightness: 255,
  color: { r: 255, g: 0, b: 0, w: 0 },
  mode: 0,
  startUniverse: 0,
};

// Helper to check if effect needs color config
export const effectNeedsColorConfig = (effectValue) => {
  const effect = LED_EFFECTS.find((e) => e.value === effectValue);
  return effect && effect.group === EFFECT_GROUPS.COLOR_CONFIG;
};

// Helper to check if effect has fixed color (no color picker)
export const effectHasFixedColor = (effectValue) => {
  const effect = LED_EFFECTS.find((e) => e.value === effectValue);
  return effect && effect.group === EFFECT_GROUPS.FIXED_COLOR;
};

// Helper to check if effect shows color picker
export const effectShowsColorPicker = (effectValue) => {
  const effect = LED_EFFECTS.find((e) => e.value === effectValue);
  return effect && effect.group === EFFECT_GROUPS.COLOR_CONFIG;
};
