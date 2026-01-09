/**
 * Migration 1: Add source_unit column to tables
 * Adds source_unit column to: curtain, knx, scene, multi_scenes, sequences, schedule
 */

export const migration1 = {
  version: 1,
  name: "Add source_unit column to tables",

  up(db) {
    console.log("Running migration 1: Adding source_unit column to tables...");

    // Helper function to check if column exists
    const columnExists = (tableName, columnName) => {
      const columns = db.pragma(`table_info(${tableName})`);
      return columns.some((col) => col.name === columnName);
    };

    // Add source_unit column to curtain table
    if (!columnExists("curtain", "source_unit")) {
      db.exec(`
        ALTER TABLE curtain ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
      `);
      console.log("Added source_unit column to curtain table");
    }

    // Add source_unit column to knx table
    if (!columnExists("knx", "source_unit")) {
      db.exec(`
        ALTER TABLE knx ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
      `);
      console.log("Added source_unit column to knx table");
    }

    // Add source_unit column to scene table
    if (!columnExists("scene", "source_unit")) {
      db.exec(`
        ALTER TABLE scene ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
      `);
      console.log("Added source_unit column to scene table");
    }

    // Add source_unit column to multi_scenes table
    if (!columnExists("multi_scenes", "source_unit")) {
      db.exec(`
        ALTER TABLE multi_scenes ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
      `);
      console.log("Added source_unit column to multi_scenes table");
    }

    // Add source_unit column to sequences table
    if (!columnExists("sequences", "source_unit")) {
      db.exec(`
        ALTER TABLE sequences ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
      `);
      console.log("Added source_unit column to sequences table");
    }

    // Add source_unit column to schedule table
    if (!columnExists("schedule", "source_unit")) {
      db.exec(`
        ALTER TABLE schedule ADD COLUMN source_unit INTEGER REFERENCES unit(id) ON DELETE SET NULL;
      `);
      console.log("Added source_unit column to schedule table");
    }

    console.log("Migration 1 completed successfully");
  }
};
