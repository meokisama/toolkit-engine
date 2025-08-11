// Export/Import service for projects and project items
import { toast } from "sonner";

class ExportImportService {
  // Export project to JSON
  async exportProject(project, projectItems) {
    try {
      const exportData = {
        project: {
          name: project.name,
          description: project.description,
        },
        items: projectItems,
        exportedAt: new Date().toISOString(),
        version: "1.0"
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create download link with event listeners
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;

      // Add event listener to show success message after download starts
      link.addEventListener('click', () => {
        // Small delay to ensure download dialog appears first
        setTimeout(() => {
          toast.success(`Project "${project.name}" export started`);
        }, 100);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Export project failed:', error);
      toast.error('Failed to export project');
      return false;
    }
  }

  // Import project from JSON file
  async importProjectFromFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // Validate import data structure
          if (!this.validateProjectImportData(data)) {
            toast.error('Invalid project file format');
            reject(new Error('Invalid file format'));
            return;
          }

          resolve(data);
        } catch (error) {
          console.error('Import project failed:', error);
          toast.error('Failed to read project file');
          reject(error);
        }
      };

      input.click();
    });
  }

  // Validate project import data
  validateProjectImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.project || typeof data.project !== 'object') return false;
    if (!data.project.name || typeof data.project.name !== 'string') return false;
    if (!data.items || typeof data.items !== 'object') return false;

    // Check if items has valid categories
    const validCategories = ['lighting', 'aircon', 'unit', 'curtain', 'scene'];
    for (const category of validCategories) {
      if (data.items[category] && !Array.isArray(data.items[category])) {
        return false;
      }
    }

    return true;
  }

  // Export project items to CSV
  async exportItemsToCSV(items, category, projectName) {
    try {
      if (!items || items.length === 0) {
        toast.error(`No ${category} items to export`);
        return false;
      }

      let csvContent;
      let filename;

      // Special handling for scene category - export with scene items
      if (category === 'scene') {
        csvContent = await this.convertScenesToCSV(items);
        filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scenes_export.csv`;
      } else if (category === 'aircon') {
        // Special handling for aircon category - export as cards
        csvContent = this.convertAirconItemsToCardsCSV(items);
        filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_aircon_cards_export.csv`;
      } else {
        csvContent = this.convertItemsToCSV(items, category);
        filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${category}_export.csv`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create download link with event listeners
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Add event listener to show success message after download starts
      link.addEventListener('click', () => {
        // Small delay to ensure download dialog appears first
        setTimeout(() => {
          toast.success(`${category} items export started`);
        }, 100);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Export items failed:', error);
      toast.error(`Failed to export ${category} items`);
      return false;
    }
  }

  // Convert items to CSV format
  convertItemsToCSV(items, category) {
    if (!items || items.length === 0) return '';

    // Define headers based on category
    let headers;
    if (category === 'unit') {
      headers = ['type', 'serial_no', 'ip_address', 'id_can', 'mode', 'firmware_version', 'description'];
    } else if (category === 'curtain') {
      headers = ['name', 'address', 'description', 'object_type', 'curtain_type', 'open_group', 'close_group', 'stop_group'];
    } else {
      headers = ['name', 'address', 'description', 'object_type'];
    }

    // Create CSV content
    const csvRows = [];
    csvRows.push(headers.join(','));

    items.forEach(item => {
      const row = headers.map(header => {
        const value = item[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Convert aircon items to cards CSV format
  convertAirconItemsToCardsCSV(items) {
    if (!items || items.length === 0) return '';

    // Each item is now a card (no need to group)
    const headers = ['name', 'address', 'description'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    items.forEach(item => {
      const row = headers.map(header => {
        const value = item[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Import items from CSV file
  async importItemsFromCSV(category) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const items = this.parseCSVToItems(text, category);

          if (!items || items.length === 0) {
            toast.error('No valid items found in CSV file');
            reject(new Error('No valid items'));
            return;
          }

          resolve(items);
        } catch (error) {
          console.error('Import items failed:', error);
          toast.error('Failed to read CSV file');
          reject(error);
        }
      };

      input.click();
    });
  }

  // Parse CSV content to items array
  parseCSVToItems(csvContent, category) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const items = [];

    // Special handling for scene category - expect scene format
    if (category === 'scene') {
      return this.parseScenesCSV(csvContent);
    }

    // Special handling for aircon category - expect card format
    if (category === 'aircon') {
      return this.parseAirconCardsCSV(csvContent);
    }

    // Validate headers based on category
    let expectedHeaders;
    if (category === 'unit') {
      expectedHeaders = ['type', 'serial_no', 'ip_address', 'id_can', 'mode', 'firmware_version', 'description'];
    } else if (category === 'curtain') {
      expectedHeaders = ['name', 'address', 'description', 'object_type', 'curtain_type', 'open_group', 'close_group', 'stop_group'];
    } else {
      expectedHeaders = ['name', 'address', 'description', 'object_type'];
    }

    const hasValidHeaders = expectedHeaders.every(header => headers.includes(header));
    if (!hasValidHeaders) {
      throw new Error(`Invalid CSV headers for ${category} items`);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });

      // Validate required fields based on category
      const isValid = category === 'unit'
        ? item.type && item.type.trim()
        : item.address && item.address.trim();

      if (isValid) {
        items.push(item);
      }
    }

    return items;
  }

  // Parse aircon cards CSV content
  parseAirconCardsCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const cards = [];

    // Validate headers for aircon cards
    const expectedHeaders = ['name', 'address', 'description'];
    const hasValidHeaders = expectedHeaders.every(header => headers.includes(header));
    if (!hasValidHeaders) {
      throw new Error('Invalid CSV headers for aircon cards. Expected: name, address, description');
    }

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const card = {};
      headers.forEach((header, index) => {
        card[header] = values[index] || '';
      });

      // Validate required fields
      if (card.address && card.address.trim()) {
        // Validate address is positive integer
        const addressNum = parseInt(card.address.trim());
        if (!isNaN(addressNum) && addressNum > 0) {
          cards.push({
            name: card.name.trim(),
            address: card.address.trim(),
            description: card.description.trim()
          });
        }
      }
    }

    return cards;
  }

  // Convert scenes with scene items to CSV format
  async convertScenesToCSV(scenes) {
    const csvRows = [];
    csvRows.push('SCENE NAME,ITEM NAME,TYPE,ADDRESS,VALUE');

    for (const scene of scenes) {
      try {
        // Get scene items with details
        const sceneItems = await window.electronAPI?.scene?.getItemsWithDetails(scene.id);

        if (sceneItems.length === 0) {
          // If scene has no items, still add the scene name row
          csvRows.push(`"${scene.name || ''}","","","",""`);
          continue;
        }

        // Add scene items
        for (let i = 0; i < sceneItems.length; i++) {
          const item = sceneItems[i];
          const sceneName = i === 0 ? (scene.name || '') : ''; // Only show scene name on first item
          const itemName = item.item_name || '';
          const itemType = this.getItemTypeForExport(item.item_type, item.object_type, item.command);
          const address = item.item_address || '';
          const value = this.getItemValueForExport(item.item_type, item.item_value, item.command, item.object_type);

          csvRows.push(`"${sceneName}","${itemName}","${itemType}","${address}","${value}"`);
        }
      } catch (error) {
        console.error(`Failed to get items for scene ${scene.id}:`, error);
        // Add scene name row even if items failed to load
        csvRows.push(`"${scene.name || ''}","","","",""`);
      }
    }

    return csvRows.join('\n');
  }

  // Get item type for export based on item_type and other properties
  getItemTypeForExport(itemType, objectType, command) {
    if (itemType === 'lighting') {
      return 'LIGHTING';
    } else if (itemType === 'curtain') {
      return 'CURTAIN';
    } else if (itemType === 'aircon') {
      // Determine aircon type based on object_type first, then command
      if (objectType === 'OBJ_AC_POWER' || command === 'power') {
        return 'AC_POWER';
      } else if (objectType === 'OBJ_AC_MODE' || command === 'mode') {
        return 'AC_MODE';
      } else if (objectType === 'OBJ_AC_FAN_SPEED' || command === 'fan_speed') {
        return 'AC_FAN_SPEED';
      } else if (objectType === 'OBJ_AC_TEMPERATURE' || command === 'temperature') {
        return 'AC_TEMPERATURE';
      } else if (objectType === 'OBJ_AC_SWING' || command === 'swing') {
        return 'AC_SWING';
      } else {
        return 'AC_POWER'; // Default to power
      }
    }
    return itemType.toUpperCase();
  }

  // Get item value for export
  getItemValueForExport(itemType, itemValue, command, objectType) {
    if (!itemValue) return '';

    if (itemType === 'lighting') {
      // Convert to percentage if needed
      const value = parseInt(itemValue);
      if (!isNaN(value)) {
        return `${value}%`;
      }
    } else if (itemType === 'aircon') {
      if (objectType === 'OBJ_AC_POWER' || command === 'power') {
        return itemValue === '1' || itemValue === 1 ? 'On' : 'Off';
      } else if (objectType === 'OBJ_AC_MODE' || command === 'mode') {
        // Map mode values to readable names
        const modeMap = {
          '0': 'Cool',
          '1': 'Heat',
          '2': 'Ventilation',
          '3': 'Dry',
          '4': 'Auto'
        };
        return modeMap[itemValue] || itemValue;
      } else if (objectType === 'OBJ_AC_FAN_SPEED' || command === 'fan_speed') {
        const fanMap = {
          '0': 'Low',
          '1': 'Medium',
          '2': 'High',
          '3': 'Auto',
          '4': 'Off'
        };
        return fanMap[itemValue] || itemValue;
      } else if (objectType === 'OBJ_AC_TEMPERATURE' || command === 'temperature') {
        return `${itemValue}°C`;
      } else if (objectType === 'OBJ_AC_SWING' || command === 'swing') {
        const swingMap = {
          '0': 'B1',
          '1': 'B2',
          '2': 'B3',
          '3': 'B4',
          '4': 'B5',
          '5': 'Auto'
        };
        return swingMap[itemValue] || itemValue;
      }
    } else if (itemType === 'curtain') {
      if (itemValue === '1' || itemValue === 1) {
        return 'Open';
      } else if (itemValue === '0' || itemValue === 0) {
        return 'Close';
      }
    }

    return itemValue;
  }

  // Parse scenes CSV format
  parseScenesCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Validate headers
    const expectedHeaders = ['SCENE NAME', 'ITEM NAME', 'TYPE', 'ADDRESS', 'VALUE'];
    const hasValidHeaders = expectedHeaders.every(header =>
      headers.some(h => h.toUpperCase() === header)
    );

    if (!hasValidHeaders) {
      throw new Error(`Invalid CSV headers for scenes. Expected: ${expectedHeaders.join(', ')}`);
    }

    const MAX_ITEMS_PER_SCENE = 60;
    const scenes = [];
    let currentScene = null;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header.toUpperCase().replace(/\s+/g, '_')] = values[index] || '';
      });

      const sceneName = row.SCENE_NAME?.trim();
      const itemName = row.ITEM_NAME?.trim();
      const itemType = row.TYPE?.trim();
      const address = row.ADDRESS?.trim();
      const value = row.VALUE?.trim();

      // If scene name is provided, start a new scene
      if (sceneName) {
        currentScene = {
          name: sceneName,
          originalName: sceneName, // Keep original name for splitting
          // Don't set address here - database service will find available address
          description: `Imported scene: ${sceneName}`,
          items: [],
          partNumber: 1 // Track part number for splitting
        };
        scenes.push(currentScene);
      }

      // Add item to current scene if we have item data
      if (currentScene && (itemName || itemType || address || value)) {
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
            partNumber: newPartNumber
          };
          scenes.push(currentScene);
        }

        const sceneItem = {
          itemName: itemName,
          itemType: this.parseItemTypeFromCSV(itemType),
          address: address,
          value: this.parseItemValueFromCSV(itemType, value),
          command: this.getCommandFromType(itemType),
          objectType: this.getObjectTypeFromType(itemType)
        };
        currentScene.items.push(sceneItem);
      }
    }

    // Update scene names for parts (only if there are multiple parts)
    this.updateSceneNamesForParts(scenes);

    return scenes;
  }

  // Update scene names to add part numbers when needed
  updateSceneNamesForParts(scenes) {
    // Group scenes by original name
    const sceneGroups = {};
    scenes.forEach(scene => {
      const originalName = scene.originalName || scene.name;
      if (!sceneGroups[originalName]) {
        sceneGroups[originalName] = [];
      }
      sceneGroups[originalName].push(scene);
    });

    // Update names for scenes that have multiple parts
    Object.keys(sceneGroups).forEach(originalName => {
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
      sceneParts.forEach(scene => {
        delete scene.originalName;
        delete scene.partNumber;
      });
    });
  }



  // Parse item type from CSV
  parseItemTypeFromCSV(csvType) {
    if (!csvType) return 'lighting';

    const type = csvType.toUpperCase();
    if (type === 'LIGHTING') return 'lighting';
    if (type === 'CURTAIN') return 'curtain';
    if (type.startsWith('AC_')) return 'aircon';

    return 'lighting'; // Default
  }

  // Parse item value from CSV
  parseItemValueFromCSV(csvType, csvValue) {
    if (!csvValue) return '';

    const type = csvType?.toUpperCase();
    const value = csvValue.trim();

    if (type === 'LIGHTING') {
      // Remove % sign and convert to number
      const numValue = parseInt(value.replace('%', ''));
      return isNaN(numValue) ? '50' : numValue.toString();
    } else if (type === 'AC_POWER') {
      return value.toLowerCase() === 'on' ? '1' : '0';
    } else if (type === 'AC_MODE') {
      const modeMap = {
        'cool': '0',
        'heat': '1',
        'ventilation': '2',
        'dry': '3',
        'auto': '4'
      };
      return modeMap[value.toLowerCase()] || '0';
    } else if (type === 'AC_FAN_SPEED') {
      const fanMap = {
        'low': '0',
        'medium': '1',
        'high': '2',
        'auto': '3',
        'off': '4'
      };
      return fanMap[value.toLowerCase()] || '0';
    } else if (type === 'AC_TEMPERATURE') {
      const tempValue = parseInt(value.replace('°C', '').replace('°', ''));
      return isNaN(tempValue) ? '25' : tempValue.toString();
    } else if (type === 'AC_SWING') {
      const swingMap = {
        'b1': '0',
        'b2': '1',
        'b3': '2',
        'b4': '3',
        'b5': '4',
        'auto': '5'
      };
      return swingMap[value.toLowerCase()] || '0';
    } else if (type === 'CURTAIN') {
      return value.toLowerCase() === 'open' ? '1' : '0';
    }

    return value;
  }

  // Get command from type
  getCommandFromType(csvType) {
    if (!csvType) return null;

    const type = csvType.toUpperCase();
    if (type === 'AC_POWER') return 'power';
    if (type === 'AC_MODE') return 'mode';
    if (type === 'AC_FAN_SPEED') return 'fan_speed';
    if (type === 'AC_TEMPERATURE') return 'temperature';
    if (type === 'AC_SWING') return 'swing';

    return null;
  }

  // Get object type from type
  getObjectTypeFromType(csvType) {
    if (!csvType) return null;

    const type = csvType.toUpperCase();
    if (type === 'LIGHTING') return 'OBJ_LIGHTING';
    if (type === 'CURTAIN') return 'OBJ_CURTAIN';
    if (type === 'AC_POWER') return 'OBJ_AC_POWER';
    if (type === 'AC_MODE') return 'OBJ_AC_MODE';
    if (type === 'AC_FAN_SPEED') return 'OBJ_AC_FAN_SPEED';
    if (type === 'AC_TEMPERATURE') return 'OBJ_AC_TEMPERATURE';
    if (type === 'AC_SWING') return 'OBJ_AC_SWING';

    return null;
  }

  // Parse a single CSV line handling quotes and commas
  parseCSVLine(line) {
    const result = [];
    let current = '';
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
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

export const exportImportService = new ExportImportService();
