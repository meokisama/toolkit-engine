/**
 * Lighting Database Module
 * Contains all table schemas and methods related to lighting devices
 */

// Table creation SQL statements
export const lightingTableSchemas = {
  createLightingTable: `
    CREATE TABLE IF NOT EXISTS lighting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT,
      address TEXT NOT NULL,
      description TEXT,
      object_type TEXT DEFAULT 'OBJ_LIGHTING',
      object_value INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,
};

// Lighting-related methods that will be mixed into DatabaseService
export const lightingMethods = {
  // Get all lighting items for a project
  getLightingItems(projectId) {
    return this.getProjectItems(projectId, "lighting");
  },

  // Create a lighting item
  createLightingItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "lighting");
  },

  // Update a lighting item
  updateLightingItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "lighting");
  },

  // Delete a lighting item
  deleteLightingItem(id) {
    return this.deleteProjectItem(id, "lighting");
  },

  // Duplicate a lighting item
  duplicateLightingItem(id) {
    return this.duplicateProjectItem(id, "lighting");
  },
};
