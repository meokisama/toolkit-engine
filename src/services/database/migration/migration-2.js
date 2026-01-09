/**
 * Migration 2: Add knx_address column to room_general_config table
 */

export const migration2 = {
  version: 2,
  name: "Add knx_address column to room_general_config",

  up(db) {
    console.log("Running migration 2: Adding knx_address column to room_general_config...");

    // Helper function to check if column exists
    const columnExists = (tableName, columnName) => {
      const columns = db.pragma(`table_info(${tableName})`);
      return columns.some((col) => col.name === columnName);
    };

    // Add knx_address column to room_general_config table
    if (!columnExists("room_general_config", "knx_address")) {
      db.exec(`
        ALTER TABLE room_general_config ADD COLUMN knx_address TEXT DEFAULT '0/0/0';
      `);
      console.log("Added knx_address column to room_general_config table");
    }

    console.log("Migration 2 completed successfully");
  }
};
