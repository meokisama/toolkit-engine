// Generic schema-driven CSV serialize/parse.
//
// A schema is an object:
//   {
//     category: "knx",
//     filenameSuffix: "knx",
//     columns: [Column, ...],
//     defaults?: { [key]: value },           // seeded onto every parsed item — use for
//                                            // fields that are constant per category
//                                            // (e.g. lighting always has OBJ_LIGHTING),
//                                            // so they don't need a CSV column.
//     validateRow?: (row, ctx) => boolean,   // applied after parse, before inclusion
//   }
//
// A column is an object:
//   {
//     key:    "rcu_group_id",             // property name on the item object
//     csv?:   "rcu_group_address",        // CSV header override (defaults to key)
//     type?:  "string" | "int" | "bool",  // coercion applied by default (de)serializer
//     default?: any,                      // fallback value on parse when cell is empty
//     format?: (item, ctx) => cellValue,  // custom serializer (wins over key/type)
//     parse?:  (cellValue, row, ctx) => value, // custom parser (wins over key/type)
//   }
//
// ctx is an arbitrary object the facade builds (e.g. lookup tables for FKs).
// Columns can be "derived" — a column may have a format/parse hook that doesn't
// correspond to a single item key; see curtain schema for FK examples.

import { detectDelimiter, parseCSVLine, escapeCSVValue, splitCSVLines } from "./parser.js";

function headerOf(column) {
  return column.csv || column.key;
}

function coerceOut(value, type) {
  if (value === null || value === undefined) return "";
  if (type === "bool") return value ? "1" : "0";
  return value;
}

function coerceIn(raw, type, fallback) {
  const empty = raw === "" || raw === null || raw === undefined;
  if (empty) return fallback !== undefined ? fallback : type === "int" ? null : type === "bool" ? 0 : "";
  if (type === "int") {
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? (fallback !== undefined ? fallback : null) : n;
  }
  if (type === "bool") {
    const s = String(raw).trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes" ? 1 : 0;
  }
  return String(raw);
}

export function serializeItems(items, schema, ctx = {}) {
  if (!Array.isArray(items) || items.length === 0) return "";

  const headers = schema.columns.map(headerOf);
  const rows = [headers.map(escapeCSVValue).join(",")];

  for (const item of items) {
    const row = schema.columns.map((col) => {
      const raw = col.format ? col.format(item, ctx) : coerceOut(item[col.key], col.type);
      return escapeCSVValue(raw);
    });
    rows.push(row.join(","));
  }
  return rows.join("\n");
}

export function parseItems(csvContent, schema, ctx = {}) {
  const lines = splitCSVLines(csvContent);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCSVLine(lines[0], delimiter).map((h) => h.replace(/"/g, "").trim());

  // Build header index so callers can pass columns in any order / skip optional ones.
  const headerIndex = new Map();
  rawHeaders.forEach((h, i) => headerIndex.set(h, i));

  // Required = columns without format/default. A column with a format hook is a
  // derived export-only column by default, but if it also has `parse` it's
  // bidirectional; so we only require keys that have neither format nor parse.
  const missing = schema.columns
    .filter((c) => c.required && !headerIndex.has(headerOf(c)))
    .map(headerOf);
  if (missing.length) {
    throw new Error(`Missing required CSV columns for ${schema.category}: ${missing.join(", ")}`);
  }

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.every((v) => v === "")) continue;

    const row = {};
    rawHeaders.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : "";
    });

    const item = { ...(schema.defaults || {}) };
    for (const col of schema.columns) {
      const header = headerOf(col);
      const cell = row[header];
      if (col.parse) {
        const parsed = col.parse(cell, row, ctx);
        if (parsed !== undefined) item[col.key] = parsed;
      } else {
        item[col.key] = coerceIn(cell, col.type, col.default);
      }
    }

    if (schema.validateRow && !schema.validateRow(item, ctx)) continue;
    items.push(item);
  }
  return items;
}
