/**
 * Unit Database Module
 * Contains all table schemas and methods related to unit devices and their I/O configurations
 */

// Table creation SQL statements
export const unitTableSchemas = {
  createUnitTable: `
    CREATE TABLE IF NOT EXISTS unit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      type TEXT,
      serial_no TEXT,
      ip_address TEXT,
      id_can TEXT,
      mode TEXT,
      firmware_version TEXT,
      hardware_version TEXT,
      manufacture_date TEXT,
      can_load BOOLEAN DEFAULT 0,
      recovery_mode BOOLEAN DEFAULT 0,
      description TEXT,
      discovered_at DATETIME,
      rs485_config TEXT, -- JSON string for RS485 configuration
      input_configs TEXT, -- JSON string for ALL input configurations
      output_configs TEXT, -- JSON string for ALL output configurations
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,
};

// Unit-related methods that will be mixed into DatabaseService
export const unitMethods = {
  // Get all unit items for a project
  getUnitItems(projectId) {
    return this.getProjectItems(projectId, "unit");
  },

  // Create a unit item
  createUnitItem(projectId, itemData) {
    try {
      const {
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load,
        recovery_mode,
        description,
        discovered_at,
        rs485_config,
        input_configs,
        output_configs,
      } = itemData;

      const stmt = this.db.prepare(`
        INSERT INTO unit (
          project_id, type, serial_no, ip_address,
          id_can, mode, firmware_version, hardware_version,
          manufacture_date, can_load, recovery_mode, description, discovered_at, rs485_config, input_configs, output_configs
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        projectId,
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load ? 1 : 0,
        recovery_mode ? 1 : 0,
        description,
        discovered_at,
        rs485_config ? JSON.stringify(rs485_config) : null,
        input_configs ? JSON.stringify(input_configs) : null,
        output_configs ? JSON.stringify(output_configs) : null
      );

      return this.getProjectItemById(result.lastInsertRowid, "unit");
    } catch (error) {
      console.error("Failed to create unit item:", error);
      throw error;
    }
  },

  // Update a unit item
  updateUnitItem(id, itemData) {
    try {
      const {
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load,
        recovery_mode,
        description,
        discovered_at,
        rs485_config,
        input_configs,
        output_configs,
      } = itemData;

      const stmt = this.db.prepare(`
        UPDATE unit
        SET type = ?, serial_no = ?, ip_address = ?,
            id_can = ?, mode = ?, firmware_version = ?, hardware_version = ?,
            manufacture_date = ?, can_load = ?, recovery_mode = ?, description = ?,
            discovered_at = ?, rs485_config = ?, input_configs = ?, output_configs = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        type,
        serial_no,
        ip_address,
        id_can,
        mode,
        firmware_version,
        hardware_version,
        manufacture_date,
        can_load ? 1 : 0,
        recovery_mode ? 1 : 0,
        description,
        discovered_at,
        rs485_config ? JSON.stringify(rs485_config) : null,
        input_configs ? JSON.stringify(input_configs) : null,
        output_configs ? JSON.stringify(output_configs) : null,
        id
      );

      if (result.changes === 0) {
        throw new Error("Unit item not found");
      }

      return this.getProjectItemById(id, "unit");
    } catch (error) {
      console.error("Failed to update unit item:", error);
      throw error;
    }
  },

  // Delete a unit item
  deleteUnitItem(id) {
    return this.deleteProjectItem(id, "unit");
  },

  // Unit I/O Configuration methods (JSON-based)
  getUnitInputConfig(unitId, inputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.input_configs) {
        return null;
      }

      const inputConfigs = unit.input_configs;
      const inputConfig = inputConfigs.inputs?.find((input) => input.index === inputIndex);

      if (inputConfig) {
        return {
          unit_id: unitId,
          input_index: inputIndex,
          function_value: inputConfig.function_value || 0,
          lighting_id: inputConfig.lighting_id || null,
          multi_group_config: inputConfig.multi_group_config || [],
          rlc_config: inputConfig.rlc_config || {},
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get unit input config:", error);
      throw error;
    }
  },

  getUnitOutputConfig(unitId, outputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.output_configs) {
        return null;
      }

      const outputConfigs = unit.output_configs;
      const outputConfig = outputConfigs.outputs?.find((output) => output.index === outputIndex);

      if (outputConfig) {
        return {
          unit_id: unitId,
          output_index: outputIndex,
          output_type: outputConfig.type,
          config_data: outputConfig.config || {},
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get unit output config:", error);
      throw error;
    }
  },

  saveUnitInputConfig(unitId, inputIndex, functionValue, lightingId, multiGroupConfig, rlcConfig) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit) {
        throw new Error("Unit not found");
      }

      // Get current input configs or create new structure
      let inputConfigs = unit.input_configs || { inputs: [] };

      // Find existing input config or create new one
      const existingIndex = inputConfigs.inputs.findIndex((input) => input.index === inputIndex);
      const inputConfig = {
        index: inputIndex,
        function_value: functionValue || 0,
        lighting_id: lightingId || null,
        multi_group_config: multiGroupConfig || [],
        rlc_config: rlcConfig || {},
      };

      if (existingIndex >= 0) {
        inputConfigs.inputs[existingIndex] = inputConfig;
      } else {
        inputConfigs.inputs.push(inputConfig);
      }

      // Sort by index
      inputConfigs.inputs.sort((a, b) => a.index - b.index);

      // Update unit with new input configs
      this.updateUnitItem(unitId, {
        ...unit,
        input_configs: inputConfigs,
      });

      return this.getUnitInputConfig(unitId, inputIndex);
    } catch (error) {
      console.error("Failed to save unit input config:", error);
      throw error;
    }
  },

  saveUnitOutputConfig(unitId, outputIndex, outputType, configData) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit) {
        throw new Error("Unit not found");
      }

      // Get current output configs or create new structure
      let outputConfigs = unit.output_configs || { outputs: [] };

      // Find existing output config or create new one
      const existingIndex = outputConfigs.outputs.findIndex((output) => output.index === outputIndex);

      // Remove deviceId, deviceType, and address from config data to avoid duplication
      // For AC outputs, address is equivalent to deviceId and should be stored at output level
      const { deviceId, deviceType, address, ...cleanConfigData } = configData;

      const outputConfig = {
        index: outputIndex,
        type: outputType,
        device_id: deviceId || null,
        device_type: deviceType || (outputType === "ac" ? "aircon" : "lighting"),
        name: cleanConfigData.name || `${outputType} ${outputIndex + 1}`,
        config: cleanConfigData,
      };

      if (existingIndex >= 0) {
        outputConfigs.outputs[existingIndex] = outputConfig;
      } else {
        outputConfigs.outputs.push(outputConfig);
      }

      // Sort by index
      outputConfigs.outputs.sort((a, b) => a.index - b.index);

      // Update unit with new output configs
      this.updateUnitItem(unitId, {
        ...unit,
        output_configs: outputConfigs,
      });

      return this.getUnitOutputConfig(unitId, outputIndex);
    } catch (error) {
      console.error("Failed to save unit output config:", error);
      throw error;
    }
  },

  getAllUnitInputConfigs(unitId) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.input_configs) {
        return [];
      }

      const inputConfigs = unit.input_configs;
      return (inputConfigs.inputs || []).map((input) => ({
        unit_id: unitId,
        input_index: input.index,
        function_value: input.function_value || 0,
        lighting_id: input.lighting_id || null,
        multi_group_config: input.multi_group_config || [],
        rlc_config: input.rlc_config || {},
      }));
    } catch (error) {
      console.error("Failed to get all unit input configs:", error);
      throw error;
    }
  },

  getAllUnitOutputConfigs(unitId) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.output_configs) {
        return [];
      }

      const outputConfigs = unit.output_configs;
      return (outputConfigs.outputs || []).map((output) => ({
        unit_id: unitId,
        output_index: output.index,
        output_type: output.type,
        device_id: output.device_id,
        device_type: output.device_type,
        config_data: output.config || {},
      }));
    } catch (error) {
      console.error("Failed to get all unit output configs:", error);
      throw error;
    }
  },

  deleteUnitInputConfig(unitId, inputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.input_configs) {
        return false;
      }

      let inputConfigs = unit.input_configs;
      const originalLength = inputConfigs.inputs?.length || 0;

      // Remove the input config
      inputConfigs.inputs = (inputConfigs.inputs || []).filter((input) => input.index !== inputIndex);

      if (inputConfigs.inputs.length < originalLength) {
        // Update unit with new input configs
        this.updateUnitItem(unitId, {
          ...unit,
          input_configs: inputConfigs,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete unit input config:", error);
      throw error;
    }
  },

  deleteUnitOutputConfig(unitId, outputIndex) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit || !unit.output_configs) {
        return false;
      }

      let outputConfigs = unit.output_configs;
      const originalLength = outputConfigs.outputs?.length || 0;

      // Remove the output config
      outputConfigs.outputs = (outputConfigs.outputs || []).filter((output) => output.index !== outputIndex);

      if (outputConfigs.outputs.length < originalLength) {
        // Update unit with new output configs
        this.updateUnitItem(unitId, {
          ...unit,
          output_configs: outputConfigs,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete unit output config:", error);
      throw error;
    }
  },

  // Clear all I/O configurations for a unit (used when unit type changes)
  clearAllUnitIOConfigs(unitId) {
    try {
      const unit = this.getProjectItemById(unitId, "unit");
      if (!unit) {
        return false;
      }

      // Clear both input and output configs
      this.updateUnitItem(unitId, {
        ...unit,
        input_configs: null,
        output_configs: null,
      });

      return true;
    } catch (error) {
      console.error("Failed to clear all unit I/O configs:", error);
      throw error;
    }
  },

  duplicateUnitItem(id) {
    try {
      const originalItem = this.getProjectItemById(id, "unit");

      if (!originalItem) {
        throw new Error("Unit item not found");
      }

      const duplicatedItem = {
        type: originalItem.type,
        serial_no: originalItem.serial_no,
        ip_address: originalItem.ip_address,
        id_can: originalItem.id_can,
        mode: originalItem.mode,
        firmware_version: originalItem.firmware_version,
        description: originalItem.description,
      };

      return this.createUnitItem(originalItem.project_id, duplicatedItem);
    } catch (error) {
      console.error("Failed to duplicate unit item:", error);
      throw error;
    }
  },
};
