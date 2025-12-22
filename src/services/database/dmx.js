/**
 * DMX Database Module
 * Contains all table schemas and methods related to DMX devices
 */

// Table creation SQL statements
export const dmxTableSchemas = {
  createDmxTable: `
    CREATE TABLE IF NOT EXISTS dmx (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT,
      address TEXT,
      description TEXT,
      color1 TEXT,
      color2 TEXT,
      color3 TEXT,
      color4 TEXT,
      color5 TEXT,
      color6 TEXT,
      color7 TEXT,
      color8 TEXT,
      color9 TEXT,
      color10 TEXT,
      color11 TEXT,
      color12 TEXT,
      color13 TEXT,
      color14 TEXT,
      color15 TEXT,
      color16 TEXT,
      source_unit INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (source_unit) REFERENCES unit (id) ON DELETE SET NULL
    )
  `,
};

// DMX-related methods that will be mixed into DatabaseService
export const dmxMethods = {
  // Get all DMX items for a project
  getDmxItems(projectId) {
    return this.getProjectItems(projectId, "dmx");
  },

  // Create a DMX item
  createDmxItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "dmx");
  },

  // Update a DMX item
  updateDmxItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "dmx");
  },

  // Delete a DMX item
  deleteDmxItem(id) {
    return this.deleteProjectItem(id, "dmx");
  },

  // Duplicate a DMX item
  duplicateDmxItem(id) {
    return this.duplicateProjectItem(id, "dmx");
  },
};
