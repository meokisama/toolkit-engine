// Table creation SQL statements
export const zigbeeTableSchemas = {
  createZigbeeDevicesTable: `
    CREATE TABLE IF NOT EXISTS zigbee_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      unit_ip TEXT NOT NULL,
      unit_can_id TEXT NOT NULL,
      ieee_address TEXT NOT NULL,
      device_type INTEGER NOT NULL,
      device_name TEXT,
      num_endpoints INTEGER NOT NULL DEFAULT 0,
      endpoint1_id INTEGER DEFAULT 0,
      endpoint1_value INTEGER DEFAULT 0,
      endpoint1_address INTEGER DEFAULT 0,
      endpoint1_name TEXT,
      endpoint2_id INTEGER DEFAULT 0,
      endpoint2_value INTEGER DEFAULT 0,
      endpoint2_address INTEGER DEFAULT 0,
      endpoint2_name TEXT,
      endpoint3_id INTEGER DEFAULT 0,
      endpoint3_value INTEGER DEFAULT 0,
      endpoint3_address INTEGER DEFAULT 0,
      endpoint3_name TEXT,
      endpoint4_id INTEGER DEFAULT 0,
      endpoint4_value INTEGER DEFAULT 0,
      endpoint4_address INTEGER DEFAULT 0,
      endpoint4_name TEXT,
      rssi INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, unit_ip, ieee_address)
    )
  `,
};

// Zigbee-related methods that will be mixed into DatabaseService
export const zigbeeMethods = {
  // Get all Zigbee devices for a project, optionally filtered by unit IP
  getZigbeeDevices(projectId, unitIp = null) {
    try {
      let query = `
        SELECT * FROM zigbee_devices
        WHERE project_id = ?
      `;
      const params = [projectId];

      if (unitIp) {
        query += ` AND unit_ip = ?`;
        params.push(unitIp);
      }

      query += ` ORDER BY created_at DESC`;

      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error("Failed to get zigbee devices:", error);
      throw error;
    }
  },

  // Create a new Zigbee device
  createZigbeeDevice(projectId, deviceData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO zigbee_devices (
          project_id, unit_ip, unit_can_id, ieee_address, device_type, num_endpoints,
          endpoint1_id, endpoint1_value, endpoint1_address,
          endpoint2_id, endpoint2_value, endpoint2_address,
          endpoint3_id, endpoint3_value, endpoint3_address,
          endpoint4_id, endpoint4_value, endpoint4_address,
          rssi, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        projectId,
        deviceData.unit_ip,
        deviceData.unit_can_id,
        deviceData.ieee_address,
        deviceData.device_type,
        deviceData.num_endpoints || 0,
        deviceData.endpoint1_id || 0,
        deviceData.endpoint1_value || 0,
        deviceData.endpoint1_address || 0,
        deviceData.endpoint2_id || 0,
        deviceData.endpoint2_value || 0,
        deviceData.endpoint2_address || 0,
        deviceData.endpoint3_id || 0,
        deviceData.endpoint3_value || 0,
        deviceData.endpoint3_address || 0,
        deviceData.endpoint4_id || 0,
        deviceData.endpoint4_value || 0,
        deviceData.endpoint4_address || 0,
        deviceData.rssi || 0,
        deviceData.status || 0
      );

      // Return the created device
      const getStmt = this.db.prepare("SELECT * FROM zigbee_devices WHERE id = ?");
      return getStmt.get(result.lastInsertRowid);
    } catch (error) {
      console.error("Failed to create zigbee device:", error);
      throw error;
    }
  },

  // Update a Zigbee device
  updateZigbeeDevice(id, deviceData) {
    try {
      // Build dynamic update query - only update fields that are provided
      const updates = [];
      const values = [];

      // Define all possible fields that can be updated
      const allowedFields = [
        "device_type",
        "device_name",
        "num_endpoints",
        "endpoint1_id",
        "endpoint1_value",
        "endpoint1_address",
        "endpoint1_name",
        "endpoint2_id",
        "endpoint2_value",
        "endpoint2_address",
        "endpoint2_name",
        "endpoint3_id",
        "endpoint3_value",
        "endpoint3_address",
        "endpoint3_name",
        "endpoint4_id",
        "endpoint4_value",
        "endpoint4_address",
        "endpoint4_name",
        "rssi",
        "status",
      ];

      // Build SET clause dynamically based on provided fields
      for (const field of allowedFields) {
        if (field in deviceData) {
          updates.push(`${field} = ?`);
          // Handle null values for optional fields
          if (field.endsWith("_name") || field === "device_name") {
            values.push(deviceData[field] || null);
          } else {
            values.push(deviceData[field]);
          }
        }
      }

      // If no fields to update, throw error
      if (updates.length === 0) {
        throw new Error("No fields provided for update");
      }

      // Always update the updated_at timestamp
      updates.push("updated_at = CURRENT_TIMESTAMP");

      // Build and execute the query
      const sql = `
        UPDATE zigbee_devices
        SET ${updates.join(", ")}
        WHERE id = ?
      `;

      values.push(id);

      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        throw new Error("Zigbee device not found");
      }

      // Return updated device
      const getStmt = this.db.prepare("SELECT * FROM zigbee_devices WHERE id = ?");
      return getStmt.get(id);
    } catch (error) {
      console.error("Failed to update zigbee device:", error);
      throw error;
    }
  },

  // Delete a Zigbee device by ID
  deleteZigbeeDevice(id) {
    try {
      const stmt = this.db.prepare("DELETE FROM zigbee_devices WHERE id = ?");
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error("Zigbee device not found");
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to delete zigbee device:", error);
      throw error;
    }
  },

  // Delete all Zigbee devices for a specific unit
  deleteAllZigbeeDevicesForUnit(projectId, unitIp) {
    try {
      const stmt = this.db.prepare("DELETE FROM zigbee_devices WHERE project_id = ? AND unit_ip = ?");
      const result = stmt.run(projectId, unitIp);

      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error("Failed to delete zigbee devices for unit:", error);
      throw error;
    }
  },
};
