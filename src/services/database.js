import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

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
        name TEXT NOT NULL,
        address TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createAirconTable = `
      CREATE TABLE IF NOT EXISTS aircon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createUnitTable = `
      CREATE TABLE IF NOT EXISTS unit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT,
        serial_no TEXT,
        ip_address TEXT,
        id_can TEXT,
        mode TEXT,
        firmware_version TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createCurtainTable = `
      CREATE TABLE IF NOT EXISTS curtain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    const createSceneTable = `
      CREATE TABLE IF NOT EXISTS scene (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

    try {
      this.db.exec(createProjectsTable);
      this.db.exec(createLightingTable);
      this.db.exec(createAirconTable);
      this.db.exec(createUnitTable);
      this.db.exec(createCurtainTable);
      this.db.exec(createSceneTable);
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
        } else {
          // Standard handling for other categories
          const itemData = {
            name: item.name,
            address: item.address,
            description: item.description
          };
          this.createProjectItem(newProjectId, itemData, category);
        }
      });
    });
  }

  // Get all project items in one optimized call
  getAllProjectItems(projectId) {
    try {
      const lighting = this.db.prepare('SELECT * FROM lighting WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
      const aircon = this.db.prepare('SELECT * FROM aircon WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
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
      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      return stmt.get(id);
    } catch (error) {
      console.error(`Failed to get ${tableName} item by id:`, error);
      throw error;
    }
  }

  createProjectItem(projectId, itemData, tableName) {
    try {
      const { name, address, description } = itemData;

      const stmt = this.db.prepare(`
        INSERT INTO ${tableName} (project_id, name, address, description)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(projectId, name, address, description);
      return this.getProjectItemById(result.lastInsertRowid, tableName);
    } catch (error) {
      console.error(`Failed to create ${tableName} item:`, error);
      throw error;
    }
  }

  updateProjectItem(id, itemData, tableName) {
    try {
      const { name, address, description } = itemData;

      const stmt = this.db.prepare(`
        UPDATE ${tableName}
        SET name = ?, address = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(name, address, description, id);

      if (result.changes === 0) {
        throw new Error(`${tableName} item not found`);
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
        name: `${originalItem.name} (Copy)`,
        address: originalItem.address,
        description: originalItem.description
      };

      return this.createProjectItem(originalItem.project_id, duplicatedItem, tableName);
    } catch (error) {
      console.error(`Failed to duplicate ${tableName} item:`, error);
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

  // Aircon
  getAirconItems(projectId) {
    return this.getProjectItems(projectId, 'aircon');
  }

  createAirconItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, 'aircon');
  }

  updateAirconItem(id, itemData) {
    return this.updateProjectItem(id, itemData, 'aircon');
  }

  deleteAirconItem(id) {
    return this.deleteProjectItem(id, 'aircon');
  }

  duplicateAirconItem(id) {
    return this.duplicateProjectItem(id, 'aircon');
  }

  // Unit - Special handling for unit table structure
  getUnitItems(projectId) {
    return this.getProjectItems(projectId, 'unit');
  }

  createUnitItem(projectId, itemData) {
    try {
      const {
        name,
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        description
      } = itemData;

      const stmt = this.db.prepare(`
        INSERT INTO unit (
          project_id, name, type, serial_no, ip_address,
          id_can, mode, firmware_version, description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        projectId, name, type, serial_no, ip_address,
        id_can, mode, firmware_version, description
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
        name,
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        description
      } = itemData;

      const stmt = this.db.prepare(`
        UPDATE unit
        SET name = ?, type = ?, serial_no = ?, ip_address = ?,
            id_can = ?, mode = ?, firmware_version = ?, description = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        name, type, serial_no, ip_address,
        id_can, mode, firmware_version, description, id
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
        name: `${originalItem.name} (Copy)`,
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
    return this.duplicateProjectItem(id, 'scene');
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

export default DatabaseService;
