/**
 * Shared COM switch type definitions.
 * Used by both the renderer (UI components) and the main process (RCU controller service).
 * Keep in sync with the firmware's COMM_SWITCH_TYPE enum.
 */

export const SWITCH_TYPES = [
  { value: "SW_BELL", label: "Bell", inputCount: 1, enumValue: 0 },
  { value: "SW_KEYCARD", label: "Key Card", inputCount: 1, enumValue: 1 },
  { value: "SW_SERVICE", label: "Service", inputCount: 2, enumValue: 2 },
  { value: "SW_1GANG", label: "1 Gang", inputCount: 1, enumValue: 3 },
  { value: "SW_2GANG", label: "2 Gang", inputCount: 2, enumValue: 4 },
  { value: "SW_3GANG", label: "3 Gang", inputCount: 3, enumValue: 5 },
  { value: "SW_4GANG", label: "4 Gang", inputCount: 4, enumValue: 6 },
  { value: "SW_5GANG", label: "5 Gang", inputCount: 5, enumValue: 7 },
  { value: "SW_6GANG", label: "6 Gang", inputCount: 6, enumValue: 8 },
];

/** { "SW_1GANG": 1 } — input count per type string */
export const SWITCH_INPUT_COUNTS = Object.fromEntries(SWITCH_TYPES.map((t) => [t.value, t.inputCount]));

/** { "SW_1GANG": 3 } — C enum integer per type string (for protocol encoding) */
export const SWITCH_ENUM_BY_TYPE = Object.fromEntries(SWITCH_TYPES.map((t) => [t.value, t.enumValue]));

/** { 3: { value: "SW_1GANG", label: "1 Gang", inputCount: 1, enumValue: 3 } } — type info per C enum integer (for protocol decoding) */
export const SWITCH_TYPE_BY_ENUM = Object.fromEntries(SWITCH_TYPES.map((t) => [t.enumValue, t]));
