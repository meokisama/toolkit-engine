// CSV import functionality
import { toast } from "sonner";
import { Validators } from "./validators.js";
import { CSVParser } from "./csv-parser.js";

export class CSVImporter {
  // Import items from CSV file
  static async importItemsFromCSV(category, sceneImportType = null) {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const items = this.parseCSVToItems(text, category, sceneImportType);

          if (!items || items.length === 0) {
            toast.error("No valid items found in CSV file");
            reject(new Error("No valid items"));
            return;
          }

          resolve(items);
        } catch (error) {
          console.error("Import items failed:", error);
          toast.error("Failed to read CSV file");
          reject(error);
        }
      };

      input.click();
    });
  }

  // Parse CSV content to items array
  static parseCSVToItems(csvContent, category, sceneImportType = null) {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Detect delimiter from first line
    const delimiter = CSVParser.detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ""));
    const items = [];

    // Special handling for scene category - expect scene format
    if (category === "scene") {
      if (sceneImportType === "template2") {
        return this.parseScenesTemplate2CSV(csvContent);
      } else if (sceneImportType === "template1") {
        return this.parseScenesTemplate1CSV(csvContent);
      } else {
        // Auto-detect format
        return this.detectAndParseScenesCSV(csvContent);
      }
    }

    // Special handling for aircon category - expect card format
    if (category === "aircon") {
      return this.parseAirconCardsCSV(csvContent);
    }

    // Validate headers based on category
    if (!Validators.validateCSVHeaders(headers, category)) {
      throw new Error(`Invalid CSV headers for ${category} items`);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = CSVParser.parseCSVLine(lines[i], delimiter);
      if (values.length !== headers.length) continue;

      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || "";
      });

      // Validate required fields based on category
      if (Validators.validateItem(item, category)) {
        items.push(item);
      }
    }

    return items;
  }

  // Parse aircon cards CSV content
  static parseAirconCardsCSV(csvContent) {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Detect delimiter from first line
    const delimiter = CSVParser.detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ""));
    const cards = [];

    // Validate headers for aircon cards
    const expectedHeaders = ["name", "address", "description"];
    const hasValidHeaders = expectedHeaders.every((header) => headers.includes(header));
    if (!hasValidHeaders) {
      throw new Error("Invalid CSV headers for aircon cards. Expected: name, address, description");
    }

    for (let i = 1; i < lines.length; i++) {
      const values = CSVParser.parseCSVLine(lines[i], delimiter);
      if (values.length !== headers.length) continue;

      const card = {};
      headers.forEach((header, index) => {
        card[header] = values[index] || "";
      });

      // Validate required fields
      if (card.address && card.address.trim()) {
        // Validate address is positive integer
        const addressNum = parseInt(card.address.trim());
        if (!isNaN(addressNum) && addressNum > 0) {
          cards.push({
            name: card.name.trim(),
            address: card.address.trim(),
            description: card.description.trim(),
          });
        }
      }
    }

    return cards;
  }

  // Parse scenes CSV format - Template 1 (vertical list format)
  static parseScenesTemplate1CSV(csvContent) {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Detect delimiter from first line
    const delimiter = CSVParser.detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ""));

    // Validate headers
    const expectedHeaders = ["SCENE NAME", "ITEM NAME", "TYPE", "ADDRESS", "VALUE"];
    const hasValidHeaders = expectedHeaders.every((header) => headers.some((h) => h.toUpperCase() === header));

    if (!hasValidHeaders) {
      throw new Error(`Invalid CSV headers for scenes. Expected: ${expectedHeaders.join(", ")}`);
    }

    const MAX_ITEMS_PER_SCENE = 60;
    const scenes = [];
    let currentScene = null;
    let isFirstDataRow = true;

    for (let i = 1; i < lines.length; i++) {
      const values = CSVParser.parseCSVLine(lines[i], delimiter);
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header.toUpperCase().replace(/\s+/g, "_")] = values[index] || "";
      });

      const sceneName = row.SCENE_NAME?.trim();
      const itemName = row.ITEM_NAME?.trim();
      const itemType = row.TYPE?.trim();
      const address = row.ADDRESS?.trim();
      const value = row.VALUE?.trim();

      // Handle first data row logic
      if (isFirstDataRow) {
        isFirstDataRow = false;

        // If first row has empty scene name, create a default scene
        if (!sceneName && itemType && address) {
          currentScene = {
            name: "Scene 1",
            originalName: "Scene 1",
            description: "Imported scene: Scene 1",
            items: [],
            partNumber: 1,
          };
          scenes.push(currentScene);
        }
      }

      // If scene name is provided, start a new scene
      if (sceneName) {
        currentScene = {
          name: sceneName,
          originalName: sceneName, // Keep original name for splitting
          // Don't set address here - database service will find available address
          description: `Imported scene: ${sceneName}`,
          items: [],
          partNumber: 1, // Track part number for splitting
        };
        scenes.push(currentScene);
      }

      // Add item to current scene if we have required item data (itemType and address are required)
      if (currentScene && itemType && address) {
        // Check if current scene has reached max items limit
        if (currentScene.items.length >= MAX_ITEMS_PER_SCENE) {
          // Create a new part of the same scene
          const newPartNumber = currentScene.partNumber + 1;
          const newSceneName = `${currentScene.originalName} (Part ${newPartNumber})`;

          currentScene = {
            name: newSceneName,
            originalName: currentScene.originalName,
            description: `Imported scene: ${newSceneName}`,
            items: [],
            partNumber: newPartNumber,
          };
          scenes.push(currentScene);
        }

        const sceneItem = {
          itemName: itemName || `Group ${address}`, // Auto-generate name if empty
          itemType: CSVParser.parseItemTypeFromCSV(itemType),
          address: address,
          value: CSVParser.parseItemValueFromCSV(itemType, value),
          command: CSVParser.getCommandFromType(itemType),
          objectType: CSVParser.getObjectTypeFromType(itemType),
        };
        currentScene.items.push(sceneItem);
      }
    }

    // Update scene names for parts (only if there are multiple parts)
    this.updateDaliSceneNamesForParts(scenes);

    return scenes;
  }

  // Update scene names to add part numbers when needed
  static updateDaliSceneNamesForParts(scenes) {
    // Group scenes by original name
    const sceneGroups = {};
    scenes.forEach((scene) => {
      const originalName = scene.originalName || scene.name;
      if (!sceneGroups[originalName]) {
        sceneGroups[originalName] = [];
      }
      sceneGroups[originalName].push(scene);
    });

    // Update names for scenes that have multiple parts
    Object.keys(sceneGroups).forEach((originalName) => {
      const sceneParts = sceneGroups[originalName];
      if (sceneParts.length > 1) {
        // Multiple parts - add part numbers to all
        sceneParts.forEach((scene, index) => {
          const partNumber = index + 1;
          scene.name = `${originalName} (Part ${partNumber})`;
          scene.description = `Imported scene: ${scene.name}`;
        });
      } else {
        // Single part - use original name
        const scene = sceneParts[0];
        scene.name = originalName;
        scene.description = `Imported scene: ${originalName}`;
      }

      // Clean up temporary properties
      sceneParts.forEach((scene) => {
        delete scene.originalName;
        delete scene.partNumber;
      });
    });
  }

  // Auto-detect and parse scenes CSV format
  static detectAndParseScenesCSV(csvContent) {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Detect delimiter from first line
    const delimiter = CSVParser.detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ""));

    // Check if it's template2 format (ITEM NAME, TYPE, ADDRESS, Scene1, Scene2, ...)
    const isTemplate2Format =
      headers.length >= 4 &&
      headers[0].toUpperCase().includes("ITEM") &&
      headers[1].toUpperCase().includes("TYPE") &&
      headers[2].toUpperCase().includes("ADDRESS");

    if (isTemplate2Format) {
      return this.parseScenesTemplate2CSV(csvContent);
    } else {
      return this.parseScenesTemplate1CSV(csvContent);
    }
  }

  // Parse scenes CSV in template format - Template 2 (horizontal layout)
  static parseScenesTemplate2CSV(csvContent) {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Detect delimiter from first line
    const delimiter = CSVParser.detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/"/g, ""));

    // Validate template format headers
    if (headers.length < 4) {
      throw new Error("Invalid template format. Expected at least 4 columns: ITEM NAME, TYPE, ADDRESS, Scene1, ...");
    }

    const itemNameCol = headers.findIndex((h) => h.toUpperCase().includes("ITEM"));
    const typeCol = headers.findIndex((h) => h.toUpperCase().includes("TYPE"));
    const addressCol = headers.findIndex((h) => h.toUpperCase().includes("ADDRESS"));

    if (itemNameCol === -1 || typeCol === -1 || addressCol === -1) {
      throw new Error("Invalid template format. Required columns: ITEM NAME, TYPE, ADDRESS");
    }

    // Scene columns start from index 3 (or after ADDRESS column)
    const sceneColumns = headers.slice(Math.max(3, addressCol + 1));

    if (sceneColumns.length === 0) {
      throw new Error("No scene columns found in template format");
    }

    const MAX_ITEMS_PER_SCENE = 60;
    const sceneGroups = {}; // Group scenes by original name

    // Initialize scene groups from column headers
    sceneColumns.forEach((sceneName) => {
      if (sceneName.trim()) {
        sceneGroups[sceneName.trim()] = [];
      }
    });

    // Parse items and add to scene groups
    for (let i = 1; i < lines.length; i++) {
      const values = CSVParser.parseCSVLine(lines[i], delimiter);
      if (values.length < headers.length) continue;

      const itemName = values[itemNameCol]?.trim();
      const itemType = values[typeCol]?.trim();
      const address = values[addressCol]?.trim();

      // Skip if missing required fields (itemName can be empty, will be auto-generated)
      if (!itemType || !address) continue;

      // Add item to each scene with corresponding value
      sceneColumns.forEach((sceneName, sceneIndex) => {
        const sceneValueIndex = Math.max(3, addressCol + 1) + sceneIndex;
        const itemValue = values[sceneValueIndex]?.trim();

        // Skip if no value for this scene
        // if (!itemValue) return;

        const sceneKey = sceneName.trim();
        if (!sceneGroups[sceneKey]) return;

        // Find the current scene part (might be split into parts)
        let targetScene = sceneGroups[sceneKey].find((s) => s.items.length < MAX_ITEMS_PER_SCENE);

        // If no available scene part or all are full, create a new part
        if (!targetScene) {
          const newPartNumber = sceneGroups[sceneKey].length + 1;
          const newSceneName = newPartNumber === 1 ? sceneKey : `${sceneKey} (Part ${newPartNumber})`;

          targetScene = {
            name: newSceneName,
            originalName: sceneKey,
            description: `Imported scene: ${newSceneName}`,
            items: [],
            partNumber: newPartNumber,
          };
          sceneGroups[sceneKey].push(targetScene);
        }

        const sceneItem = {
          itemName: itemName || `Group ${address}`, // Auto-generate name if empty
          itemType: CSVParser.parseItemTypeFromCSV(itemType),
          address: address,
          value: CSVParser.parseItemValueFromCSV(itemType, itemValue),
          command: CSVParser.getCommandFromType(itemType),
          objectType: CSVParser.getObjectTypeFromType(itemType),
        };

        targetScene.items.push(sceneItem);
      });
    }

    // Flatten scene groups into a single array, maintaining scene grouping
    const scenes = [];
    sceneColumns.forEach((sceneName) => {
      const sceneKey = sceneName.trim();
      if (sceneGroups[sceneKey]) {
        scenes.push(...sceneGroups[sceneKey]);
      }
    });

    // Filter out empty scenes and update names for parts
    const nonEmptyScenes = scenes.filter((scene) => scene.items.length > 0);
    this.updateDaliSceneNamesForParts(nonEmptyScenes);

    return nonEmptyScenes;
  }
}
