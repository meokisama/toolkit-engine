import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { AIRCON_OBJECT_TYPES, AIRCON_OBJECT_LABELS } from '../constants.js';

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    try {
      // Dynamic import for better-sqlite3
      const Database = require('better-sqlite3');

      // Tạo đường dẫn database trong documents directory
      const documentsPath = app.getPath('documents')
      const toolkitPath = path.join(documentsPath, 'Toolkit Engine')

      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(toolkitPath)) {
        fs.mkdirSync(toolkitPath, { recursive: true })
      }

      // Tạo đường dẫn database
      const dbPath = path.join(toolkitPath, 'projects.db')

      // Khởi tạo database
      this.db = new Database(dbPath);

      // Tạo bảng projects nếu chưa tồn tại
      this.createTables();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  createTables() {
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createLightingTable = `
      CREATE TABLE IF NOT EXISTS lighting (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        address TEXT NOT NULL,
        description TEXT,
        object_type TEXT DEFAULT 'OBJ_LIGHTING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createAirconItemsTable = `
      CREATE TABLE IF NOT EXISTS aircon_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        address TEXT NOT NULL,
        description TEXT,
        object_type TEXT NOT NULL,
        label TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createUnitTable = `
      CREATE TABLE IF NOT EXISTS unit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        type TEXT,
        serial_no TEXT,
        ip_address TEXT,
        id_can TEXT,
        mode TEXT,
        firmware_version TEXT,
        hardware_version TEXT,
        manufacture_date TEXT,
        can_load BOOLEAN DEFAULT 0,
        recovery_mode BOOLEAN DEFAULT 0,
        description TEXT,
        discovered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createCurtainTable = `
      CREATE TABLE IF NOT EXISTS curtain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        address TEXT NOT NULL,
        description TEXT,
        object_type TEXT DEFAULT 'OBJ_CURTAIN',
        curtain_type TEXT DEFAULT 'CURTAIN_PULSE_2P',
        open_group TEXT,
        close_group TEXT,
        stop_group TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createSceneTable = `
      CREATE TABLE IF NOT EXISTS scene (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        address TEXT,
        description TEXT,
        object_type TEXT DEFAULT 'OBJ_SCENE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createSceneItemsTable = `
      CREATE TABLE IF NOT EXISTS scene_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_value TEXT,
        command TEXT,
        object_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scene_id) REFERENCES scene (id) ON DELETE CASCADE
      )
    `;

    try {
      this.db.exec(createProjectsTable);
      this.db.exec(createLightingTable);
      this.db.exec(createAirconItemsTable);
      this.db.exec(createUnitTable);
      this.db.exec(createCurtainTable);
      this.db.exec(createSceneTable);
      this.db.exec(createSceneItemsTable);
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }



  // CRUD Operations
  getAllProjects() {
    try {
      const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
      return stmt.all();
    } catch (error) {
      console.error('Failed to get all projects:', error);
      throw error;
    }
  }

  getProjectById(id) {
    try {
      const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      console.error('Failed to get project by id:', error);
      throw error;
    }
  }

  createProject(projectData) {
    try {
      const { name, description } = projectData;

      const stmt = this.db.prepare(`
        INSERT INTO projects (name, description)
        VALUES (?, ?)
      `);

      const result = stmt.run(name, description);
      return this.getProjectById(result.lastInsertRowid);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  updateProject(id, projectData) {
    try {
      const { name, description } = projectData;

      const stmt = this.db.prepare(`
        UPDATE projects
        SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(name, description, id);

      if (result.changes === 0) {
        throw new Error('Project not found');
      }

      return this.getProjectById(id);
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  deleteProject(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error('Project not found');
      }

      return { success: true, deletedId: id };
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  duplicateProject(id) {
    try {
      const originalProject = this.getProjectById(id);

      if (!originalProject) {
        throw new Error('Project not found');
      }

      // Start transaction for atomic operation
      const transaction = this.db.transaction(() => {
        // Create the new project
        const duplicatedProject = {
          name: `${originalProject.name} (Copy)`,
          description: originalProject.description
        };

        const newProject = this.createProject(duplicatedProject);

        // Get all items from the original project
        const originalItems = this.getAllProjectItems(id);

        // Copy all items to the new project
        this.copyProjectItems(originalItems, newProject.id);

        return newProject;
      });

      return transaction();
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      throw error;
    }
  }

  // Helper method to copy all project items to a new project
  copyProjectItems(originalItems, newProjectId) {
    const categories = ['lighting', 'aircon', 'unit', 'curtain', 'scene'];

    categories.forEach(category => {
      const items = originalItems[category] || [];

      items.forEach(item => {
        if (category === 'unit') {
          // Special handling for unit items
          const itemData = {
            name: item.name,
            type: item.type,
            serial_no: item.serial_no,
            ip_address: item.ip_address,
            id_can: item.id_can,
            mode: item.mode,
            firmware_version: item.firmware_version,
            description: item.description
          };
          this.createUnitItem(newProjectId, itemData);
        } else if (category === 'aircon') {
          // Special handling for aircon items (use aircon_items table)
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            object_type: item.object_type
          };
          this.createProjectItem(newProjectId, itemData, 'aircon_items');
        } else if (category === 'curtain') {
          // Special handling for curtain items
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            object_type: item.object_type,
            curtain_type: item.curtain_type,
            open_group: item.open_group,
            close_group: item.close_group,
            stop_group: item.stop_group
          };
          this.createProjectItem(newProjectId, itemData, category);
        } else {
          // Standard handling for other categories
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description,
            object_type: item.object_type
          };
          this.createProjectItem(newProjectId, itemData, category);
        }
      });
    });
  }

  // Get all project items in one optimized call
  getAllProjectItems(projectId) {
    try {
      const lighting = this.db.prepare('SELECT * FROM lighting WHERE project_id = ? ORDER BY address ASC').all(projectId);
      const aircon = this.db.prepare('SELECT * FROM aircon_items WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
      const unit = this.db.prepare('SELECT * FROM unit WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
      const curtain = this.db.prepare('SELECT * FROM curtain WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
      const scene = this.db.prepare('SELECT * FROM scene WHERE project_id = ? ORDER BY created_at DESC').all(projectId);

      return {
        lighting,
        aircon,
        unit,
        curtain,
        scene
      };
    } catch (error) {
      console.error('Failed to get all project items:', error);
      throw error;
    }
  }

  // Generic CRUD operations for project items
  getProjectItems(projectId, tableName) {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY created_at DESC`);
      return stmt.all(projectId);
    } catch (error) {
      console.error(`Failed to get ${tableName} items:`, error);
      throw error;
    }
  }

  getProjectItemById(id, tableName) {
    try {
      console.log(`Getting ${tableName} item by id:`, id, 'tableName:', tableName);
      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      return stmt.get(id);
    } catch (error) {
      console.error(`Failed to get ${tableName} item by id:`, error);
      console.error('Parameters:', { id, tableName });
      throw error;
    }
  }

  createProjectItem(projectId, itemData, tableName) {
    try {
      const { name, address, description, object_type, label, curtain_type, open_group, close_group, stop_group } = itemData;

      // Special validation for lighting to prevent duplicate addresses
      if (tableName === 'lighting' && address) {
        const existingItems = this.db.prepare('SELECT COUNT(*) as count FROM lighting WHERE project_id = ? AND address = ?').get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`Address ${address} already exists.`);
        }
      }

      // Special validation for curtain to prevent duplicate addresses
      if (tableName === 'curtain' && address) {
        const existingItems = this.db.prepare('SELECT COUNT(*) as count FROM curtain WHERE project_id = ? AND address = ?').get(projectId, address);
        if (existingItems.count > 0) {
          throw new Error(`Address ${address} already exists.`);
        }
      }

      // For aircon_items table, include label column
      if (tableName === 'aircon_items') {
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, object_type, label)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description, object_type, label);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else if (tableName === 'curtain') {
        // For curtain table, include curtain-specific fields
        // Address is required for curtain items
        if (!address) {
          throw new Error('Address is required for curtain items.');
        }
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, object_type, curtain_type, open_group, close_group, stop_group)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description, object_type, curtain_type, open_group || null, close_group || null, stop_group || null);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      } else {
        // For other tables, use original structure
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (project_id, name, address, description, object_type)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(projectId, name, address, description, object_type);
        return this.getProjectItemById(result.lastInsertRowid, tableName);
      }
    } catch (error) {
      console.error(`Failed to create ${tableName} item:`, error);
      throw error;
    }
  }

  updateProjectItem(id, itemData, tableName) {
    try {
      const { name, address, description, object_type, label, curtain_type, open_group, close_group, stop_group } = itemData;

      // Special validation for aircon_items to prevent duplicate addresses
      if (tableName === 'aircon_items' && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db.prepare('SELECT COUNT(*) as count FROM aircon_items WHERE project_id = ? AND address = ? AND address != ?').get(currentItem.project_id, address, currentItem.address);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for lighting to prevent duplicate addresses
      if (tableName === 'lighting' && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db.prepare('SELECT COUNT(*) as count FROM lighting WHERE project_id = ? AND address = ? AND id != ?').get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // Special validation for curtain to prevent duplicate addresses
      if (tableName === 'curtain' && address) {
        const currentItem = this.getProjectItemById(id, tableName);
        if (currentItem && currentItem.address !== address) {
          // Check if new address already exists for this project (excluding current item's address)
          const existingItems = this.db.prepare('SELECT COUNT(*) as count FROM curtain WHERE project_id = ? AND address = ? AND id != ?').get(currentItem.project_id, address, id);
          if (existingItems.count > 0) {
            throw new Error(`Address ${address} already exists.`);
          }
        }
      }

      // For aircon_items table, include label column
      if (tableName === 'aircon_items') {
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, object_type = ?, label = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, object_type, label, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else if (tableName === 'curtain') {
        // For curtain table, include curtain-specific fields
        // Address is required for curtain items
        if (!address) {
          throw new Error('Address is required for curtain items.');
        }
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, object_type = ?, curtain_type = ?, open_group = ?, close_group = ?, stop_group = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, object_type, curtain_type, open_group || null, close_group || null, stop_group || null, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      } else {
        // For other tables, use original structure
        const stmt = this.db.prepare(`
          UPDATE ${tableName}
          SET name = ?, address = ?, description = ?, object_type = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        const result = stmt.run(name, address, description, object_type, id);

        if (result.changes === 0) {
          throw new Error(`${tableName} item not found`);
        }
      }

      return this.getProjectItemById(id, tableName);
    } catch (error) {
      console.error(`Failed to update ${tableName} item:`, error);
      throw error;
    }
  }

  deleteProjectItem(id, tableName) {
    try {
      const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error(`${tableName} item not found`);
      }

      return { success: true, deletedId: id };
    } catch (error) {
      console.error(`Failed to delete ${tableName} item:`, error);
      throw error;
    }
  }

  duplicateProjectItem(id, tableName) {
    try {
      const originalItem = this.getProjectItemById(id, tableName);

      if (!originalItem) {
        throw new Error(`${tableName} item not found`);
      }

      const duplicatedItem = {
        name: originalItem.name ? `${originalItem.name} (Copy)` : null,
        address: originalItem.address,
        description: originalItem.description,
        object_type: originalItem.object_type
      };

      // For lighting, find a unique address in range 1-255
      if (tableName === 'lighting' && originalItem.address) {
        const existingAddresses = this.db.prepare('SELECT DISTINCT address FROM lighting WHERE project_id = ?').all(originalItem.project_id);
        const addressNumbers = existingAddresses
          .map(item => parseInt(item.address))
          .filter(num => !isNaN(num) && num >= 1 && num <= 255)
          .sort((a, b) => a - b);

        // Find the first available address in range 1-255
        let newAddress = 1;
        for (const num of addressNumbers) {
          if (newAddress < num) {
            break;
          }
          newAddress = num + 1;
        }

        // If we've exceeded 255, find a gap in the existing addresses
        if (newAddress > 255) {
          newAddress = null;
          for (let i = 1; i <= 255; i++) {
            if (!addressNumbers.includes(i)) {
              newAddress = i;
              break;
            }
          }

          if (newAddress === null) {
            throw new Error('No available addresses in range 1-255 for lighting item duplication');
          }
        }

        duplicatedItem.address = newAddress.toString();
      }

      // For aircon_items, include label
      if (tableName === 'aircon_items') {
        duplicatedItem.label = originalItem.label;
      }

      // For curtain, find a unique address in range 1-255 and include curtain-specific fields
      if (tableName === 'curtain' && originalItem.address) {
        const existingAddresses = this.db.prepare('SELECT DISTINCT address FROM curtain WHERE project_id = ?').all(originalItem.project_id);
        const addressNumbers = existingAddresses
          .map(item => parseInt(item.address))
          .filter(num => !isNaN(num) && num >= 1 && num <= 255)
          .sort((a, b) => a - b);

        // Find the first available address in range 1-255
        let newAddress = 1;
        for (const num of addressNumbers) {
          if (newAddress < num) {
            break;
          }
          newAddress = num + 1;
        }

        // If we've exceeded 255, find a gap in the existing addresses
        if (newAddress > 255) {
          newAddress = null;
          for (let i = 1; i <= 255; i++) {
            if (!addressNumbers.includes(i)) {
              newAddress = i;
              break;
            }
          }

          if (newAddress === null) {
            throw new Error('No available addresses in range 1-255 for curtain item duplication');
          }
        }

        duplicatedItem.address = newAddress.toString();
        duplicatedItem.curtain_type = originalItem.curtain_type || 'CURTAIN_PULSE_2P';
        duplicatedItem.open_group = originalItem.open_group || null;
        duplicatedItem.close_group = originalItem.close_group || null;
        duplicatedItem.stop_group = originalItem.stop_group || null;
      }

      return this.createProjectItem(originalItem.project_id, duplicatedItem, tableName);
    } catch (error) {
      console.error(`Failed to duplicate ${tableName} item:`, error);
      throw error;
    }
  }

  // Import project with all items
  importProject(projectData, itemsData) {
    try {
      // Start transaction
      const transaction = this.db.transaction(() => {
        // Create project
        const project = this.createProject(projectData);

        // Import items for each category
        const categories = ['lighting', 'aircon', 'unit', 'curtain', 'scene'];
        const importedCounts = {};

        categories.forEach(category => {
          const items = itemsData[category] || [];
          importedCounts[category] = 0;

          items.forEach(itemData => {
            if (category === 'unit') {
              this.createUnitItem(project.id, itemData);
            } else if (category === 'aircon') {
              // Ensure label is set for aircon items
              if (!itemData.label && itemData.object_type) {
                itemData.label = AIRCON_OBJECT_LABELS[itemData.object_type];
              }
              this.createProjectItem(project.id, itemData, 'aircon_items');
            } else {
              this.createProjectItem(project.id, itemData, category);
            }
            importedCounts[category]++;
          });
        });

        return { project, importedCounts };
      });

      return transaction();
    } catch (error) {
      console.error('Failed to import project:', error);
      throw error;
    }
  }

  // Bulk import items for a specific category
  bulkImportItems(projectId, items, category) {
    try {
      const transaction = this.db.transaction(() => {
        const importedItems = [];

        items.forEach(itemData => {
          let item;
          if (category === 'unit') {
            item = this.createUnitItem(projectId, itemData);
          } else if (category === 'aircon') {
            item = this.createProjectItem(projectId, itemData, 'aircon_items');
          } else {
            item = this.createProjectItem(projectId, itemData, category);
          }
          importedItems.push(item);
        });

        return importedItems;
      });

      return transaction();
    } catch (error) {
      console.error(`Failed to bulk import ${category} items:`, error);
      throw error;
    }
  }

  // Specific methods for each category
  // Lighting
  getLightingItems(projectId) {
    return this.getProjectItems(projectId, 'lighting');
  }

  createLightingItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, 'lighting');
  }

  updateLightingItem(id, itemData) {
    return this.updateProjectItem(id, itemData, 'lighting');
  }

  deleteLightingItem(id) {
    return this.deleteProjectItem(id, 'lighting');
  }

  duplicateLightingItem(id) {
    return this.duplicateProjectItem(id, 'lighting');
  }

  // Aircon - Special handling for aircon cards and items
  getAirconItems(projectId) {
    return this.getProjectItems(projectId, 'aircon_items');
  }

  // Get aircon items grouped by address (for card display)
  getAirconCards(projectId) {
    try {
      const items = this.db.prepare('SELECT * FROM aircon_items WHERE project_id = ? ORDER BY address, object_type').all(projectId);

      // Group items by address
      const cards = {};
      items.forEach(item => {
        if (!cards[item.address]) {
          cards[item.address] = {
            name: item.name,
            address: item.address,
            description: item.description,
            items: []
          };
        }
        cards[item.address].items.push(item);
      });

      return Object.values(cards);
    } catch (error) {
      console.error('Failed to get aircon cards:', error);
      throw error;
    }
  }

  // Create a new aircon card (creates 5 items with different object types)
  createAirconCard(projectId, cardData) {
    try {
      const { name, address, description } = cardData;

      // Check if address already exists for this project
      const existingItems = this.db.prepare('SELECT COUNT(*) as count FROM aircon_items WHERE project_id = ? AND address = ?').get(projectId, address);
      if (existingItems.count > 0) {
        throw new Error(`Address ${address} already exists.`);
      }

      const transaction = this.db.transaction(() => {
        const createdItems = [];

        AIRCON_OBJECT_TYPES.forEach(objectType => {
          const itemData = {
            name,
            address,
            description,
            object_type: objectType,
            label: AIRCON_OBJECT_LABELS[objectType]
          };

          const item = this.createProjectItem(projectId, itemData, 'aircon_items');
          createdItems.push(item);
        });

        return createdItems;
      });

      return transaction();
    } catch (error) {
      console.error('Failed to create aircon card:', error);
      throw error;
    }
  }

  createAirconItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, 'aircon_items');
  }

  updateAirconItem(id, itemData) {
    return this.updateProjectItem(id, itemData, 'aircon_items');
  }

  deleteAirconItem(id) {
    return this.deleteProjectItem(id, 'aircon_items');
  }

  // Delete entire aircon card (all items with same address)
  deleteAirconCard(projectId, address) {
    try {
      const stmt = this.db.prepare('DELETE FROM aircon_items WHERE project_id = ? AND address = ?');
      const result = stmt.run(projectId, address);

      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error('Failed to delete aircon card:', error);
      throw error;
    }
  }

  duplicateAirconItem(id) {
    return this.duplicateProjectItem(id, 'aircon_items');
  }

  // Duplicate entire aircon card
  duplicateAirconCard(projectId, address) {
    try {
      const items = this.db.prepare('SELECT * FROM aircon_items WHERE project_id = ? AND address = ?').all(projectId, address);

      if (items.length === 0) {
        throw new Error('Aircon card not found');
      }

      // Find a unique numeric address for the duplicated card
      // Get all existing addresses for this project
      const existingAddresses = this.db.prepare('SELECT DISTINCT address FROM aircon_items WHERE project_id = ?').all(projectId);
      const addressNumbers = existingAddresses
        .map(item => parseInt(item.address))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);

      // Find the first gap or next number after the highest
      let newAddress = 1;
      for (const num of addressNumbers) {
        if (newAddress < num) {
          break;
        }
        newAddress = num + 1;
      }

      // Convert to string for consistency
      newAddress = newAddress.toString();

      const transaction = this.db.transaction(() => {
        const duplicatedItems = [];

        items.forEach(item => {
          const duplicatedItem = {
            name: item.name ? `${item.name} (Copy)` : null,
            address: newAddress,
            description: item.description,
            object_type: item.object_type,
            label: item.label
          };

          const newItem = this.createProjectItem(projectId, duplicatedItem, 'aircon_items');
          duplicatedItems.push(newItem);
        });

        return duplicatedItems;
      });

      return transaction();
    } catch (error) {
      console.error('Failed to duplicate aircon card:', error);
      throw error;
    }
  }

  // Unit - Special handling for unit table structure
  getUnitItems(projectId) {
    return this.getProjectItems(projectId, 'unit');
  }

  createUnitItem(projectId, itemData) {
    try {
      const {
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load,
        recovery_mode,
        description,
        discovered_at
      } = itemData;

      const stmt = this.db.prepare(`
        INSERT INTO unit (
          project_id, type, serial_no, ip_address,
          id_can, mode, firmware_version, hardware_version,
          manufacture_date, can_load, recovery_mode, description, discovered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        projectId, type, serial_no, ip_address,
        id_can, mode, firmware_version, hardware_version,
        manufacture_date, can_load ? 1 : 0, recovery_mode ? 1 : 0, description, discovered_at
      );

      return this.getProjectItemById(result.lastInsertRowid, 'unit');
    } catch (error) {
      console.error('Failed to create unit item:', error);
      throw error;
    }
  }

  updateUnitItem(id, itemData) {
    try {
      const {
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load,
        recovery_mode,
        description,
        discovered_at
      } = itemData;

      const stmt = this.db.prepare(`
        UPDATE unit
        SET type = ?, serial_no = ?, ip_address = ?,
            id_can = ?, mode = ?, firmware_version = ?, hardware_version = ?,
            manufacture_date = ?, can_load = ?, recovery_mode = ?, description = ?,
            discovered_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        type, serial_no, ip_address,
        id_can, mode, firmware_version, hardware_version,
        manufacture_date, can_load ? 1 : 0, recovery_mode ? 1 : 0, description,
        discovered_at, id
      );

      if (result.changes === 0) {
        throw new Error('Unit item not found');
      }

      return this.getProjectItemById(id, 'unit');
    } catch (error) {
      console.error('Failed to update unit item:', error);
      throw error;
    }
  }

  deleteUnitItem(id) {
    return this.deleteProjectItem(id, 'unit');
  }

  duplicateUnitItem(id) {
    try {
      const originalItem = this.getProjectItemById(id, 'unit');

      if (!originalItem) {
        throw new Error('Unit item not found');
      }

      const duplicatedItem = {
        type: originalItem.type,
        serial_no: originalItem.serial_no,
        ip_address: originalItem.ip_address,
        id_can: originalItem.id_can,
        mode: originalItem.mode,
        firmware_version: originalItem.firmware_version,
        description: originalItem.description
      };

      return this.createUnitItem(originalItem.project_id, duplicatedItem);
    } catch (error) {
      console.error('Failed to duplicate unit item:', error);
      throw error;
    }
  }

  // Curtain
  getCurtainItems(projectId) {
    return this.getProjectItems(projectId, 'curtain');
  }

  createCurtainItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, 'curtain');
  }

  updateCurtainItem(id, itemData) {
    return this.updateProjectItem(id, itemData, 'curtain');
  }

  deleteCurtainItem(id) {
    return this.deleteProjectItem(id, 'curtain');
  }

  duplicateCurtainItem(id) {
    return this.duplicateProjectItem(id, 'curtain');
  }

  // Scene
  getSceneItems(projectId) {
    return this.getProjectItems(projectId, 'scene');
  }

  createSceneItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, 'scene');
  }

  updateSceneItem(id, itemData) {
    return this.updateProjectItem(id, itemData, 'scene');
  }

  deleteSceneItem(id) {
    return this.deleteProjectItem(id, 'scene');
  }

  duplicateSceneItem(id) {
    try {
      // Start transaction
      const transaction = this.db.transaction(() => {
        // Duplicate the scene
        const duplicatedScene = this.duplicateProjectItem(id, 'scene');

        // Get original scene items
        const originalSceneItems = this.getSceneItemsWithDetails(id);

        // Duplicate scene items
        for (const sceneItem of originalSceneItems) {
          this.addItemToScene(
            duplicatedScene.id,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type
          );
        }

        return duplicatedScene;
      });

      return transaction();
    } catch (error) {
      console.error('Failed to duplicate scene with items:', error);
      throw error;
    }
  }

  // Scene Items Management
  getSceneItemsWithDetails(sceneId) {
    try {
      const stmt = this.db.prepare(`
        SELECT
          si.*,
          CASE
            WHEN si.item_type = 'lighting' THEN l.name
            WHEN si.item_type = 'aircon' THEN ai.name
            WHEN si.item_type = 'curtain' THEN c.name
          END as item_name,
          CASE
            WHEN si.item_type = 'lighting' THEN l.address
            WHEN si.item_type = 'aircon' THEN ai.address
            WHEN si.item_type = 'curtain' THEN c.address
          END as item_address,
          CASE
            WHEN si.item_type = 'lighting' THEN l.description
            WHEN si.item_type = 'aircon' THEN ai.description
            WHEN si.item_type = 'curtain' THEN c.description
          END as item_description,
          CASE
            WHEN si.item_type = 'lighting' THEN l.object_type
            WHEN si.item_type = 'aircon' THEN ai.object_type
            WHEN si.item_type = 'curtain' THEN c.object_type
            ELSE NULL
          END as object_type,
          CASE
            WHEN si.item_type = 'aircon' THEN ai.label
            ELSE NULL
          END as label
        FROM scene_items si
        LEFT JOIN lighting l ON si.item_type = 'lighting' AND si.item_id = l.id
        LEFT JOIN aircon_items ai ON si.item_type = 'aircon' AND si.item_id = ai.id
        LEFT JOIN curtain c ON si.item_type = 'curtain' AND si.item_id = c.id
        WHERE si.scene_id = ?
        ORDER BY si.created_at ASC
      `);

      return stmt.all(sceneId);
    } catch (error) {
      console.error('Failed to get scene items with details:', error);
      throw error;
    }
  }

  addItemToScene(sceneId, itemType, itemId, itemValue = null, command = null, objectType = null) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO scene_items (scene_id, item_type, item_id, item_value, command, object_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(sceneId, itemType, itemId, itemValue, command, objectType);

      // Return the created scene item with details
      const getStmt = this.db.prepare('SELECT * FROM scene_items WHERE id = ?');
      return getStmt.get(result.lastInsertRowid);
    } catch (error) {
      console.error('Failed to add item to scene:', error);
      throw error;
    }
  }

  removeItemFromScene(sceneItemId) {
    try {
      const stmt = this.db.prepare('DELETE FROM scene_items WHERE id = ?');
      const result = stmt.run(sceneItemId);

      return result.changes > 0;
    } catch (error) {
      console.error('Failed to remove item from scene:', error);
      throw error;
    }
  }

  updateSceneItemValue(sceneItemId, itemValue, command = null) {
    try {
      const stmt = this.db.prepare(`
        UPDATE scene_items
        SET item_value = ?, command = ?
        WHERE id = ?
      `);

      const result = stmt.run(itemValue, command, sceneItemId);

      if (result.changes === 0) {
        throw new Error('Scene item not found');
      }

      // Return updated scene item
      const getStmt = this.db.prepare('SELECT * FROM scene_items WHERE id = ?');
      return getStmt.get(sceneItemId);
    } catch (error) {
      console.error('Failed to update scene item value:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

export default DatabaseService;
