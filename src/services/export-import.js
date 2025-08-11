// Export/Import service for projects and project items
// This file now acts as a proxy to the modular export-import folder
// Maintains backward compatibility while using the new modular structure

import { exportImportService as modularService } from './export-import/index.js';

class ExportImportService {
  // Export project to JSON
  async exportProject(project, projectItems) {
    return modularService.exportProject(project, projectItems);
  }

  // Import project from JSON file
  async importProjectFromFile() {
    return modularService.importProjectFromFile();
  }

  // Validate project import data
  validateProjectImportData(data) {
    return modularService.validateProjectImportData(data);
  }

  // Export project items to CSV
  async exportItemsToCSV(items, category, projectName) {
    return modularService.exportItemsToCSV(items, category, projectName);
  }

  // Convert items to CSV format
  convertItemsToCSV(items, category) {
    return modularService.convertItemsToCSV(items, category);
  }

  // Convert aircon items to cards CSV format
  convertAirconItemsToCardsCSV(items) {
    return modularService.convertAirconItemsToCardsCSV(items);
  }

  // Import items from CSV file
  async importItemsFromCSV(category, sceneImportType = null) {
    return modularService.importItemsFromCSV(category, sceneImportType);
  }

  // Parse CSV content to items array
  parseCSVToItems(csvContent, category, sceneImportType = null) {
    return modularService.parseCSVToItems(csvContent, category, sceneImportType);
  }

  // Parse aircon cards CSV content
  parseAirconCardsCSV(csvContent) {
    return modularService.parseAirconCardsCSV(csvContent);
  }

  // Convert scenes with scene items to CSV format
  async convertScenesToCSV(scenes) {
    return modularService.convertScenesToCSV(scenes);
  }

  // Get item type for export based on item_type and other properties
  getItemTypeForExport(itemType, objectType, command) {
    return modularService.getItemTypeForExport(itemType, objectType, command);
  }

  // Get item value for export
  getItemValueForExport(itemType, itemValue, command, objectType) {
    return modularService.getItemValueForExport(itemType, itemValue, command, objectType);
  }

  // Update scene names to add part numbers when needed
  updateSceneNamesForParts(scenes) {
    return modularService.updateSceneNamesForParts(scenes);
  }

  // Parse item type from CSV
  parseItemTypeFromCSV(csvType) {
    return modularService.parseItemTypeFromCSV(csvType);
  }

  // Parse item value from CSV
  parseItemValueFromCSV(csvType, csvValue) {
    return modularService.parseItemValueFromCSV(csvType, csvValue);
  }

  // Get command from type
  getCommandFromType(csvType) {
    return modularService.getCommandFromType(csvType);
  }

  // Get object type from type
  getObjectTypeFromType(csvType) {
    return modularService.getObjectTypeFromType(csvType);
  }

  // Parse a single CSV line handling quotes and commas
  parseCSVLine(line) {
    return modularService.parseCSVLine(line);
  }

  // Auto-detect and parse scenes CSV format
  detectAndParseScenesCSV(csvContent) {
    return modularService.detectAndParseScenesCSV(csvContent);
  }

  // Parse scenes CSV - Template 1 (vertical list format)
  parseScenesTemplate1CSV(csvContent) {
    return modularService.parseScenesTemplate1CSV(csvContent);
  }

  // Parse scenes CSV - Template 2 (horizontal layout)
  parseScenesTemplate2CSV(csvContent) {
    return modularService.parseScenesTemplate2CSV(csvContent);
  }


}

export const exportImportService = new ExportImportService();
