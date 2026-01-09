/**
 * Migration 3: Add mode, interval_time, and dmx_duration columns to schedule table
 */

export const migration3 = {
  version: 3,
  name: "Add mode, interval_time, and dmx_duration columns to schedule",

  up(db) {
    console.log("Running migration 3: Adding mode, interval_time, and dmx_duration columns to schedule...");

    // Helper function to check if column exists
    const columnExists = (tableName, columnName) => {
      const columns = db.pragma(`table_info(${tableName})`);
      return columns.some((col) => col.name === columnName);
    };

    // Add mode column to schedule table
    if (!columnExists("schedule", "mode")) {
      db.exec(`
        ALTER TABLE schedule ADD COLUMN mode INTEGER DEFAULT 0;
      `);
      console.log("Added mode column to schedule table");
    }

    // Add interval_time column to schedule table
    if (!columnExists("schedule", "interval_time")) {
      db.exec(`
        ALTER TABLE schedule ADD COLUMN interval_time INTEGER;
      `);
      console.log("Added interval_time column to schedule table");
    }

    // Add dmx_duration column to schedule table
    if (!columnExists("schedule", "dmx_duration")) {
      db.exec(`
        ALTER TABLE schedule ADD COLUMN dmx_duration INTEGER;
      `);
      console.log("Added dmx_duration column to schedule table");
    }

    console.log("Migration 3 completed successfully");
  }
};
