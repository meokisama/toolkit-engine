/**
 * Migration 5: Add switch_configs column to unit table
 */

export const migration5 = {
  version: 5,
  name: "Add switch_configs column to unit table",

  up(db) {
    console.log("Running migration 5: Adding switch_configs column to unit table...");

    const columnExists = (tableName, columnName) => {
      const columns = db.pragma(`table_info(${tableName})`);
      return columns.some((col) => col.name === columnName);
    };

    if (!columnExists("unit", "switch_configs")) {
      db.exec(`
        ALTER TABLE unit ADD COLUMN switch_configs TEXT;
      `);
      console.log("Added switch_configs column to unit table");
    }

    console.log("Migration 5 completed successfully");
  }
};
