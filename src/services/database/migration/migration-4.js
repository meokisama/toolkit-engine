/**
 * Migration 4: Add knx_status_group column to knx table
 */

export const migration4 = {
  version: 4,
  name: "Add knx_status_group column to knx table",

  up(db) {
    console.log("Running migration 4: Adding knx_status_group column to knx table...");

    // Helper function to check if column exists
    const columnExists = (tableName, columnName) => {
      const columns = db.pragma(`table_info(${tableName})`);
      return columns.some((col) => col.name === columnName);
    };

    // Add knx_status_group column to knx table
    if (!columnExists("knx", "knx_status_group")) {
      db.exec(`
        ALTER TABLE knx ADD COLUMN knx_status_group TEXT;
      `);
      console.log("Added knx_status_group column to knx table");
    }

    console.log("Migration 4 completed successfully");
  }
};
