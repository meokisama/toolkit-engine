// Public facade for project- and item-level import/export.
//
// Standard item categories (lighting / curtain / knx / dmx / unit / aircon) are
// schema-driven: adding a new category = drop a schema in ./export-import/schemas/.
// Scene is an exception — it has its own vertical/horizontal templates and
// multiplex rows — so it lives in its own module under ./export-import/scene/.
//
// Callers keep the same entry points they used before; the engine, schemas, and
// scene module are internal.

import { ProjectExporter } from "./export-import/project/project-export.js";
import { ProjectImporter } from "./export-import/project/project-import.js";

import { serializeItems, parseItems } from "./export-import/csv/engine.js";
import { downloadCsv, pickCsvFile, sanitizeFilename } from "./export-import/csv/file-io.js";
import { getSchema, buildLookupContext } from "./export-import/schemas/index.js";
import { parseCSVLine } from "./export-import/csv/parser.js";

import { convertScenesToCSV } from "./export-import/scene/scene-export.js";
import {
  parseScenesCSV,
  detectAndParseScenesCSV,
  renameSceneParts,
} from "./export-import/scene/scene-import.js";
import {
  parseItemTypeFromCSV,
  parseItemValueFromCSV,
  getCommandFromType,
  getObjectTypeFromType,
  formatItemTypeForExport,
  formatItemValueForExport,
} from "./export-import/scene/scene-enums.js";
import {
  downloadSceneTemplate1,
  downloadSceneTemplate2,
  downloadBothSceneTemplates,
} from "./export-import/scene/scene-templates.js";

import { toast } from "sonner";

function normalizeCtx(ctxOrProjectItems) {
  if (!ctxOrProjectItems) return { lookupByAddress: () => null, lookupById: () => "" };
  // Allow callers to pass either a prebuilt ctx or a raw projectItems bag.
  if (typeof ctxOrProjectItems.lookupByAddress === "function") return ctxOrProjectItems;
  if (ctxOrProjectItems.projectItems) return buildLookupContext(ctxOrProjectItems.projectItems);
  return buildLookupContext(ctxOrProjectItems);
}

class ExportImportService {
  // ---------------- Project-level (JSON) ----------------

  async exportProject(project, projectItems) {
    return ProjectExporter.exportProject(project, projectItems);
  }

  async importProjectFromFile() {
    return ProjectImporter.importProjectFromFile();
  }

  validateProjectImportData(data) {
    return ProjectImporter.validateProjectImportData(data);
  }

  getImportStats(data) {
    return ProjectImporter.getImportStats(data);
  }

  // ---------------- Item-level (CSV) ----------------

  async exportItemsToCSV(items, category, projectName, ctxOrProjectItems) {
    try {
      if (!items || items.length === 0) {
        toast.error(`No ${category} items to export`);
        return false;
      }

      const base = sanitizeFilename(projectName);
      let csvContent;
      let filename;

      if (category === "scene") {
        csvContent = await convertScenesToCSV(items);
        filename = `${base}_scenes_export.csv`;
      } else {
        const schema = getSchema(category);
        if (!schema) throw new Error(`No export schema registered for ${category}`);
        const ctx = normalizeCtx(ctxOrProjectItems);
        csvContent = serializeItems(items, schema, ctx);
        filename = `${base}_${schema.filenameSuffix}_export.csv`;
      }

      downloadCsv(csvContent, filename);
      setTimeout(() => toast.success(`${category} items export started`), 100);
      return true;
    } catch (error) {
      console.error("Export items failed:", error);
      toast.error(error.message || `Failed to export ${category} items`);
      return false;
    }
  }

  convertItemsToCSV(items, category, ctxOrProjectItems) {
    const schema = getSchema(category);
    if (!schema) return "";
    return serializeItems(items, schema, normalizeCtx(ctxOrProjectItems));
  }

  convertAirconItemsToCardsCSV(items) {
    return this.convertItemsToCSV(items, "aircon");
  }

  async convertScenesToCSV(scenes) {
    return convertScenesToCSV(scenes);
  }

  async importItemsFromCSV(category, sceneImportType = null, ctxOrProjectItems) {
    try {
      const text = await pickCsvFile();
      if (!text) return null;
      const items = this.parseCSVToItems(text, category, sceneImportType, ctxOrProjectItems);
      if (!items || items.length === 0) {
        toast.error("No valid items found in CSV file");
        throw new Error("No valid items");
      }
      return items;
    } catch (error) {
      console.error("Import items failed:", error);
      if (error.message !== "No valid items") toast.error("Failed to read CSV file");
      throw error;
    }
  }

  parseCSVToItems(csvContent, category, sceneImportType = null, ctxOrProjectItems) {
    if (category === "scene") return parseScenesCSV(csvContent, sceneImportType);
    const schema = getSchema(category);
    if (!schema) throw new Error(`No import schema registered for ${category}`);
    return parseItems(csvContent, schema, normalizeCtx(ctxOrProjectItems));
  }

  parseAirconCardsCSV(csvContent) {
    return this.parseCSVToItems(csvContent, "aircon");
  }

  // ---------------- Scene helpers (kept for backward compat) ----------------

  detectAndParseScenesCSV(csvContent) {
    return detectAndParseScenesCSV(csvContent);
  }

  parseScenesTemplate1CSV(csvContent) {
    return parseScenesCSV(csvContent, "template1");
  }

  parseScenesTemplate2CSV(csvContent) {
    return parseScenesCSV(csvContent, "template2");
  }

  updateDaliSceneNamesForParts(scenes) {
    return renameSceneParts(scenes);
  }

  getItemTypeForExport(itemType, objectType, command) {
    return formatItemTypeForExport(itemType, objectType, command);
  }

  getItemValueForExport(itemType, itemValue, command, objectType) {
    return formatItemValueForExport(itemType, itemValue, command, objectType);
  }

  parseItemTypeFromCSV(csvType) {
    return parseItemTypeFromCSV(csvType);
  }

  parseItemValueFromCSV(csvType, csvValue) {
    return parseItemValueFromCSV(csvType, csvValue);
  }

  getCommandFromType(csvType) {
    return getCommandFromType(csvType);
  }

  getObjectTypeFromType(csvType) {
    return getObjectTypeFromType(csvType);
  }

  parseCSVLine(line) {
    return parseCSVLine(line);
  }

  // ---------------- Templates ----------------

  downloadSceneTemplate1() {
    return downloadSceneTemplate1();
  }

  downloadSceneTemplate2() {
    return downloadSceneTemplate2();
  }

  downloadBothSceneTemplates() {
    return downloadBothSceneTemplates();
  }
}

export const exportImportService = new ExportImportService();
