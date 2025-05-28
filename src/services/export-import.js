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

      // Special handling for aircon category - export as cards
      if (category === 'aircon') {
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

    // Group items by address to form cards
    const cards = {};
    items.forEach(item => {
      if (!cards[item.address]) {
        cards[item.address] = {
          name: item.name,
          address: item.address,
          description: item.description
        };
      }
    });

    const headers = ['name', 'address', 'description'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    Object.values(cards).forEach(card => {
      const row = headers.map(header => {
        const value = card[header] || '';
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
