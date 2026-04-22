// Low-level CSV tokenization: delimiter detection, line parsing, value escaping.
// No business logic — any domain mapping (types, enums, FKs) lives in schemas or
// scene/scene-enums.js, never here.

export function detectDelimiter(line) {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

export function parseCSVLine(line, delimiter) {
  const delim = delimiter || detectDelimiter(line);
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delim && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function escapeCSVValue(value) {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  if (str.includes(",") || str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function splitCSVLines(csvContent) {
  return csvContent.split(/\r?\n/).filter((line) => line.trim());
}
