/**
 * Aircon Database Module
 * Contains all table schemas and methods related to air conditioner devices
 */

// Table creation SQL statements
export const airconTableSchemas = {
  createAirconItemsTable: `
    CREATE TABLE IF NOT EXISTS aircon (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT,
      address TEXT NOT NULL,
      description TEXT,
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,
};

// Aircon-related methods that will be mixed into DatabaseService
export const airconMethods = {
  // Get all aircon items for a project
  getAirconItems(projectId) {
    return this.getProjectItems(projectId, "aircon");
  },

  // Get aircon cards (each item is now a card)
  getAirconCards(projectId) {
    try {
      const items = this.db
        .prepare(
          "SELECT * FROM aircon WHERE project_id = ? ORDER BY CAST(address AS INTEGER) ASC"
        )
        .all(projectId);

      // Each item is now a card
      return items.map((item) => ({
        name: item.name,
        address: item.address,
        description: item.description,
        item: item,
      }));
    } catch (error) {
      console.error("Failed to get aircon cards:", error);
      throw error;
    }
  },

  // Create a new aircon card (creates 1 item with general aircon type)
  createAirconCard(projectId, cardData) {
    try {
      const { name, address, description } = cardData;

      // Ensure address is treated as string for consistency
      const addressStr = address.toString();

      // Check if address already exists for this project
      const existingItems = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM aircon WHERE project_id = ? AND address = ?"
        )
        .get(projectId, addressStr);

      if (existingItems.count > 0) {
        throw new Error(`Address ${addressStr} already exists.`);
      }

      // Create single aircon item
      const itemData = {
        name,
        address: addressStr,
        description,
        label: "Aircon",
      };

      const item = this.createProjectItem(projectId, itemData, "aircon");
      return [item]; // Return as array for compatibility
    } catch (error) {
      console.error("Failed to create aircon card:", error);
      throw error;
    }
  },

  // Create a simple aircon item (uses generic createProjectItem)
  createAirconItem(projectId, itemData) {
    return this.createProjectItem(projectId, itemData, "aircon");
  },

  // Update an aircon item
  updateAirconItem(id, itemData) {
    return this.updateProjectItem(id, itemData, "aircon");
  },

  // Delete an aircon item
  deleteAirconItem(id) {
    return this.deleteProjectItem(id, "aircon");
  },

  // Delete entire aircon card (all items with same address)
  deleteAirconCard(projectId, address) {
    try {
      const stmt = this.db.prepare(
        "DELETE FROM aircon WHERE project_id = ? AND address = ?"
      );
      const result = stmt.run(projectId, address);

      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error("Failed to delete aircon card:", error);
      throw error;
    }
  },

  // Duplicate an aircon item
  duplicateAirconItem(id) {
    return this.duplicateProjectItem(id, "aircon");
  },

  // Duplicate entire aircon card
  duplicateAirconCard(projectId, address) {
    try {
      const item = this.db
        .prepare("SELECT * FROM aircon WHERE project_id = ? AND address = ?")
        .get(projectId, address);

      if (!item) {
        throw new Error("Aircon card not found");
      }

      // Find a unique numeric address for the duplicated card in range 1-255
      const newAddress = this.findNextAvailableAddress(projectId, "aircon");

      const duplicatedItem = {
        name: item.name ? `${item.name} (Copy)` : null,
        address: newAddress,
        description: item.description,
        label: item.label,
      };

      const newItem = this.createProjectItem(
        projectId,
        duplicatedItem,
        "aircon"
      );
      return [newItem]; // Return as array for compatibility
    } catch (error) {
      console.error("Failed to duplicate aircon card:", error);
      throw error;
    }
  },
};
