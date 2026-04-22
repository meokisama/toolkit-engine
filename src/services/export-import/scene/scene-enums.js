// Enum ↔ CSV mappings used by scene import/export.
// These are intrinsic to the scene format (TYPE column values like "LIGHTING",
// "AC_POWER", "CURTAIN") and have no equivalent in the generic engine.

const AC_MODE_MAP = { 0: "Cool", 1: "Heat", 2: "Ventilation", 3: "Dry", 4: "Auto" };
const AC_FAN_MAP = { 0: "Low", 1: "Medium", 2: "High", 3: "Auto", 4: "Off" };
const AC_SWING_MAP = { 0: "B1", 1: "B2", 2: "B3", 3: "B4", 4: "B5", 5: "Auto" };

const AC_MODE_REVERSE = { cool: "0", heat: "1", ventilation: "2", dry: "3", auto: "4" };
const AC_FAN_REVERSE = { low: "0", medium: "1", high: "2", auto: "3", off: "4" };
const AC_SWING_REVERSE = { b1: "0", b2: "1", b3: "2", b4: "3", b5: "4", auto: "5" };

export function parseItemTypeFromCSV(csvType) {
  if (!csvType) return "lighting";
  const type = csvType.toUpperCase();
  if (type === "LIGHTING") return "lighting";
  if (type === "CURTAIN") return "curtain";
  if (type.startsWith("AC_")) return "aircon";
  return "lighting";
}

export function parseItemValueFromCSV(csvType, csvValue) {
  if (!csvValue || !csvValue.trim()) {
    return csvType?.toUpperCase() === "LIGHTING" ? "255" : "";
  }
  const type = csvType?.toUpperCase();
  const value = csvValue.trim();

  if (type === "LIGHTING") {
    const numValue = parseInt(value.replace("%", "").trim(), 10);
    if (Number.isNaN(numValue)) return "128";
    const value255 = Math.round((numValue * 255) / 100);
    return Math.min(255, Math.max(0, value255)).toString();
  }
  if (type === "AC_POWER") return value.toLowerCase() === "on" ? "1" : "0";
  if (type === "AC_MODE") return AC_MODE_REVERSE[value.toLowerCase()] || "0";
  if (type === "AC_FAN_SPEED") return AC_FAN_REVERSE[value.toLowerCase()] || "0";
  if (type === "AC_TEMPERATURE") {
    const tempValue = parseInt(value.replace("°C", "").replace("°", ""), 10);
    return Number.isNaN(tempValue) ? "25" : tempValue.toString();
  }
  if (type === "AC_SWING") return AC_SWING_REVERSE[value.toLowerCase()] || "0";
  if (type === "CURTAIN") return value.toLowerCase() === "open" ? "1" : "0";

  return value;
}

export function getCommandFromType(csvType) {
  if (!csvType) return null;
  const type = csvType.toUpperCase();
  if (type === "AC_POWER") return "power";
  if (type === "AC_MODE") return "mode";
  if (type === "AC_FAN_SPEED") return "fan_speed";
  if (type === "AC_TEMPERATURE") return "temperature";
  if (type === "AC_SWING") return "swing";
  return null;
}

export function getObjectTypeFromType(csvType) {
  if (!csvType) return null;
  const type = csvType.toUpperCase();
  if (type === "LIGHTING") return "OBJ_LIGHTING";
  if (type === "CURTAIN") return "OBJ_CURTAIN";
  if (type === "AC_POWER") return "OBJ_AC_POWER";
  if (type === "AC_MODE") return "OBJ_AC_MODE";
  if (type === "AC_FAN_SPEED") return "OBJ_AC_FAN_SPEED";
  if (type === "AC_TEMPERATURE") return "OBJ_AC_TEMPERATURE";
  if (type === "AC_SWING") return "OBJ_AC_SWING";
  return null;
}

export function formatItemTypeForExport(itemType, objectType, command) {
  if (itemType === "lighting") return "LIGHTING";
  if (itemType === "curtain") return "CURTAIN";
  if (itemType === "aircon") {
    if (objectType === "OBJ_AC_POWER" || command === "power") return "AC_POWER";
    if (objectType === "OBJ_AC_MODE" || command === "mode") return "AC_MODE";
    if (objectType === "OBJ_AC_FAN_SPEED" || command === "fan_speed") return "AC_FAN_SPEED";
    if (objectType === "OBJ_AC_TEMPERATURE" || command === "temperature") return "AC_TEMPERATURE";
    if (objectType === "OBJ_AC_SWING" || command === "swing") return "AC_SWING";
    return "AC_POWER";
  }
  return String(itemType || "").toUpperCase();
}

export function formatItemValueForExport(itemType, itemValue, command, objectType) {
  if (!itemValue) return "";
  if (itemType === "lighting") {
    const value = parseInt(itemValue, 10);
    return Number.isNaN(value) ? itemValue : `${value}%`;
  }
  if (itemType === "aircon") {
    if (objectType === "OBJ_AC_POWER" || command === "power") {
      return itemValue === "1" || itemValue === 1 ? "On" : "Off";
    }
    if (objectType === "OBJ_AC_MODE" || command === "mode") return AC_MODE_MAP[itemValue] || itemValue;
    if (objectType === "OBJ_AC_FAN_SPEED" || command === "fan_speed") return AC_FAN_MAP[itemValue] || itemValue;
    if (objectType === "OBJ_AC_TEMPERATURE" || command === "temperature") return `${itemValue}°C`;
    if (objectType === "OBJ_AC_SWING" || command === "swing") return AC_SWING_MAP[itemValue] || itemValue;
  }
  if (itemType === "curtain") {
    if (itemValue === "1" || itemValue === 1) return "Open";
    if (itemValue === "0" || itemValue === 0) return "Close";
  }
  return itemValue;
}
