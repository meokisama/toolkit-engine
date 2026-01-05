// CSV parsing utilities

export class CSVParser {
  // Detect CSV delimiter from the first line
  static detectDelimiter(line) {
    // Count occurrences of potential delimiters
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;

    // Return the delimiter with more occurrences, default to comma
    return semicolonCount > commaCount ? ";" : ",";
  }

  // Parse a single CSV line handling quotes and delimiters
  static parseCSVLine(line, delimiter = null) {
    // Auto-detect delimiter if not provided
    if (!delimiter) {
      delimiter = this.detectDelimiter(line);
    }

    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // Parse item type from CSV
  static parseItemTypeFromCSV(csvType) {
    if (!csvType) return "lighting";

    const type = csvType.toUpperCase();
    if (type === "LIGHTING") return "lighting";
    if (type === "CURTAIN") return "curtain";
    if (type.startsWith("AC_")) return "aircon";

    return "lighting"; // Default
  }

  // Parse item value from CSV
  static parseItemValueFromCSV(csvType, csvValue) {
    if (!csvValue || !csvValue.trim()) {
      // Default value for lighting if empty (100% = 255)
      const type = csvType?.toUpperCase();
      if (type === "LIGHTING") {
        return "255";
      }
      return "";
    }

    const type = csvType?.toUpperCase();
    const value = csvValue.trim();

    if (type === "LIGHTING") {
      // Remove % sign and convert percentage (0-100) to 0-255 value
      const numValue = parseInt(value.replace("%", "").trim());
      if (isNaN(numValue)) return "128"; // Default 50% = 128

      // Convert from percentage (0-100) to 0-255
      const value255 = Math.round((numValue * 255) / 100);
      // Clamp to 0-255 range
      return Math.min(255, Math.max(0, value255)).toString();
    } else if (type === "AC_POWER") {
      return value.toLowerCase() === "on" ? "1" : "0";
    } else if (type === "AC_MODE") {
      const modeMap = {
        cool: "0",
        heat: "1",
        ventilation: "2",
        dry: "3",
        auto: "4",
      };
      return modeMap[value.toLowerCase()] || "0";
    } else if (type === "AC_FAN_SPEED") {
      const fanMap = {
        low: "0",
        medium: "1",
        high: "2",
        auto: "3",
        off: "4",
      };
      return fanMap[value.toLowerCase()] || "0";
    } else if (type === "AC_TEMPERATURE") {
      const tempValue = parseInt(value.replace("°C", "").replace("°", ""));
      return isNaN(tempValue) ? "25" : tempValue.toString();
    } else if (type === "AC_SWING") {
      const swingMap = {
        b1: "0",
        b2: "1",
        b3: "2",
        b4: "3",
        b5: "4",
        auto: "5",
      };
      return swingMap[value.toLowerCase()] || "0";
    } else if (type === "CURTAIN") {
      return value.toLowerCase() === "open" ? "1" : "0";
    }

    return value;
  }

  // Get command from type
  static getCommandFromType(csvType) {
    if (!csvType) return null;

    const type = csvType.toUpperCase();
    if (type === "AC_POWER") return "power";
    if (type === "AC_MODE") return "mode";
    if (type === "AC_FAN_SPEED") return "fan_speed";
    if (type === "AC_TEMPERATURE") return "temperature";
    if (type === "AC_SWING") return "swing";

    return null;
  }

  // Get object type from type
  static getObjectTypeFromType(csvType) {
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

  // Escape CSV value
  static escapeCSVValue(value) {
    if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
