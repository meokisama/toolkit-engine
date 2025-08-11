// Export/Import service for projects and project items
import { ProjectExporter } from "./project-export.js";
import { ProjectImporter } from "./project-import.js";
import { CSVExporter } from "./csv-export.js";
import { CSVImporter } from "./csv-import.js";
import { CSVParser } from "./csv-parser.js";
import { Validators } from "./validators.js";

class ExportImportService {
  // Export project to JSON
  async exportProject(project, projectItems) {
    return ProjectExporter.exportProject(project, projectItems);
  }

  // Import project from JSON file
  async importProjectFromFile() {
    return ProjectImporter.importProjectFromFile();
  }

  // Validate project import data
  validateProjectImportData(data) {
    return Validators.validateProjectImportData(data);
  }

  // Export project items to CSV
  async exportItemsToCSV(items, category, projectName) {
    return CSVExporter.exportItemsToCSV(items, category, projectName);
  }

  // Convert items to CSV format
  convertItemsToCSV(items, category) {
    return CSVExporter.convertItemsToCSV(items, category);
  }

  // Convert aircon items to cards CSV format
  convertAirconItemsToCardsCSV(items) {
    return CSVExporter.convertAirconItemsToCardsCSV(items);
  }

  // Import items from CSV file
  async importItemsFromCSV(category, sceneImportType = null) {
    return CSVImporter.importItemsFromCSV(category, sceneImportType);
  }

  // Parse CSV content to items array
  parseCSVToItems(csvContent, category, sceneImportType = null) {
    return CSVImporter.parseCSVToItems(csvContent, category, sceneImportType);
  }

  // Parse aircon cards CSV content
  parseAirconCardsCSV(csvContent) {
    return CSVImporter.parseAirconCardsCSV(csvContent);
  }

  // Convert scenes with scene items to CSV format
  async convertScenesToCSV(scenes) {
    return CSVExporter.convertScenesToCSV(scenes);
  }

  // Get item type for export based on item_type and other properties
  getItemTypeForExport(itemType, objectType, command) {
    return CSVExporter.getItemTypeForExport(itemType, objectType, command);
  }

  // Get item value for export
  getItemValueForExport(itemType, itemValue, command, objectType) {
    return CSVExporter.getItemValueForExport(itemType, itemValue, command, objectType);
  }

  // Parse scenes CSV format
  parseScenesCSV(csvContent) {
    return CSVImporter.parseScenesCSV(csvContent);
  }

  // Update scene names to add part numbers when needed
  updateSceneNamesForParts(scenes) {
    return CSVImporter.updateSceneNamesForParts(scenes);
  }

  // Parse item type from CSV
  parseItemTypeFromCSV(csvType) {
    return CSVParser.parseItemTypeFromCSV(csvType);
  }

  // Parse item value from CSV
  parseItemValueFromCSV(csvType, csvValue) {
    return CSVParser.parseItemValueFromCSV(csvType, csvValue);
  }

  // Get command from type
  getCommandFromType(csvType) {
    return CSVParser.getCommandFromType(csvType);
  }

  // Get object type from type
  getObjectTypeFromType(csvType) {
    return CSVParser.getObjectTypeFromType(csvType);
  }

  // Parse a single CSV line handling quotes and commas
  parseCSVLine(line) {
    return CSVParser.parseCSVLine(line);
  }

  // Auto-detect and parse scenes CSV format
  detectAndParseScenesCSV(csvContent) {
    return CSVImporter.detectAndParseScenesCSV(csvContent);
  }

  // Parse scenes CSV in template format (horizontal layout)
  parseScenesTemplateCSV(csvContent) {
    return CSVImporter.parseScenesTemplateCSV(csvContent);
  }
}

export const exportImportService = new ExportImportService();
