// Table creation SQL statements
export const roomTableSchemas = {
  // Room General Config Table - stores general room configuration for each project and unit
  createRoomGeneralConfigTable: `
    CREATE TABLE IF NOT EXISTS room_general_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      source_unit INTEGER,
      room_mode INTEGER NOT NULL DEFAULT 0,
      room_amount INTEGER NOT NULL DEFAULT 1,
      tcp_mode INTEGER NOT NULL DEFAULT 0,
      port INTEGER NOT NULL DEFAULT 5000,
      slave_amount INTEGER NOT NULL DEFAULT 1,
      slave_ips TEXT,
      client_mode INTEGER NOT NULL DEFAULT 0,
      client_ip TEXT,
      client_port INTEGER NOT NULL DEFAULT 8080,
      knx_address TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (source_unit) REFERENCES unit (id) ON DELETE SET NULL
    )
  `,

  // Create unique index for room_general_config to handle NULL source_unit properly
  createRoomGeneralConfigUniqueIndex: `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_room_general_config_unique
    ON room_general_config(project_id, IFNULL(source_unit, 0))
  `,

  // Room Detail Config Table - stores individual room configurations with 7 states
  createRoomDetailConfigTable: `
    CREATE TABLE IF NOT EXISTS room_detail_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      general_config_id INTEGER NOT NULL,
      room_address INTEGER NOT NULL,
      occupancy_type INTEGER NOT NULL DEFAULT 0,
      occupancy_scene_type INTEGER DEFAULT 0,
      enable_welcome_night INTEGER DEFAULT 0,
      period INTEGER DEFAULT 0,
      pir_init_time INTEGER DEFAULT 0,
      pir_verify_time INTEGER DEFAULT 0,
      unrent_period INTEGER DEFAULT 0,
      standby_time INTEGER DEFAULT 15,
      unrent_aircon_active BOOLEAN DEFAULT 0,
      unrent_aircon_mode INTEGER DEFAULT 0,
      unrent_aircon_fan_speed INTEGER DEFAULT 0,
      unrent_aircon_cool_setpoint INTEGER DEFAULT 24,
      unrent_aircon_heat_setpoint INTEGER DEFAULT 20,
      unrent_scene_amount INTEGER DEFAULT 0,
      unrent_scenes TEXT DEFAULT '',
      unoccupy_aircon_active BOOLEAN DEFAULT 0,
      unoccupy_aircon_mode INTEGER DEFAULT 0,
      unoccupy_aircon_fan_speed INTEGER DEFAULT 0,
      unoccupy_aircon_cool_setpoint INTEGER DEFAULT 24,
      unoccupy_aircon_heat_setpoint INTEGER DEFAULT 20,
      unoccupy_scene_amount INTEGER DEFAULT 0,
      unoccupy_scenes TEXT DEFAULT '',
      checkin_aircon_active BOOLEAN DEFAULT 0,
      checkin_aircon_mode INTEGER DEFAULT 0,
      checkin_aircon_fan_speed INTEGER DEFAULT 0,
      checkin_aircon_cool_setpoint INTEGER DEFAULT 24,
      checkin_aircon_heat_setpoint INTEGER DEFAULT 20,
      checkin_scene_amount INTEGER DEFAULT 0,
      checkin_scenes TEXT DEFAULT '',
      welcome_aircon_active BOOLEAN DEFAULT 0,
      welcome_aircon_mode INTEGER DEFAULT 0,
      welcome_aircon_fan_speed INTEGER DEFAULT 0,
      welcome_aircon_cool_setpoint INTEGER DEFAULT 24,
      welcome_aircon_heat_setpoint INTEGER DEFAULT 20,
      welcome_scene_amount INTEGER DEFAULT 0,
      welcome_scenes TEXT DEFAULT '',
      welcome_night_aircon_active BOOLEAN DEFAULT 0,
      welcome_night_aircon_mode INTEGER DEFAULT 0,
      welcome_night_aircon_fan_speed INTEGER DEFAULT 0,
      welcome_night_aircon_cool_setpoint INTEGER DEFAULT 24,
      welcome_night_aircon_heat_setpoint INTEGER DEFAULT 20,
      welcome_night_scene_amount INTEGER DEFAULT 0,
      welcome_night_scenes TEXT DEFAULT '',
      staff_aircon_active BOOLEAN DEFAULT 0,
      staff_aircon_mode INTEGER DEFAULT 0,
      staff_aircon_fan_speed INTEGER DEFAULT 0,
      staff_aircon_cool_setpoint INTEGER DEFAULT 24,
      staff_aircon_heat_setpoint INTEGER DEFAULT 20,
      staff_scene_amount INTEGER DEFAULT 0,
      staff_scenes TEXT DEFAULT '',
      out_of_service_aircon_active BOOLEAN DEFAULT 0,
      out_of_service_aircon_mode INTEGER DEFAULT 0,
      out_of_service_aircon_fan_speed INTEGER DEFAULT 0,
      out_of_service_aircon_cool_setpoint INTEGER DEFAULT 24,
      out_of_service_aircon_heat_setpoint INTEGER DEFAULT 20,
      out_of_service_scene_amount INTEGER DEFAULT 0,
      out_of_service_scenes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (general_config_id) REFERENCES room_general_config (id) ON DELETE CASCADE,
      UNIQUE(general_config_id, room_address)
    )
  `,
};

// Room-related methods that will be mixed into DatabaseService
export const roomMethods = {
  /**
   * Helper: Parse scenes string to array
   */
  parseScenesString(scenesStr) {
    if (!scenesStr) return [];
    return scenesStr
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  },

  /**
   * Helper: Format scenes array to string
   */
  formatScenesString(scenesArray) {
    if (!scenesArray || scenesArray.length === 0) return "";
    return scenesArray.join(",");
  },

  /**
   * Helper: Get scene amount from array
   */
  getSceneAmount(scenesArray) {
    if (!scenesArray || scenesArray.length === 0) return 0;
    return scenesArray.length;
  },

  /**
   * Get room general config for a project and source unit
   * @param {number} projectId - The project ID
   * @param {number|null} sourceUnit - The source unit ID (null for default)
   */
  getRoomGeneralConfig(projectId, sourceUnit = null) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_general_config
        WHERE project_id = ? AND (source_unit IS ? OR (source_unit IS NULL AND ? IS NULL))
      `);

      const config = stmt.get(projectId, sourceUnit, sourceUnit);

      if (config) {
        // Parse slave IPs from string to array
        config.slaveIPs = config.slave_ips ? config.slave_ips.split(",") : [];
        delete config.slave_ips;
      }

      return config;
    } catch (error) {
      console.error("Failed to get room general config:", error);
      throw error;
    }
  },

  /**
   * Get all room general configs for a project (all units)
   */
  getAllRoomGeneralConfigs(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_general_config WHERE project_id = ?
        ORDER BY source_unit
      `);

      const configs = stmt.all(projectId);

      return configs.map((config) => {
        config.slaveIPs = config.slave_ips ? config.slave_ips.split(",") : [];
        delete config.slave_ips;
        return config;
      });
    } catch (error) {
      console.error("Failed to get all room general configs:", error);
      throw error;
    }
  },

  /**
   * Create or update room general config
   * @param {number} projectId - The project ID
   * @param {object} config - The configuration object
   * @param {number|null} sourceUnit - The source unit ID (null for default)
   */
  createOrUpdateRoomGeneralConfig(projectId, config, sourceUnit = null) {
    try {
      const existing = this.getRoomGeneralConfig(projectId, sourceUnit);

      if (existing) {
        // Update existing
        const stmt = this.db.prepare(`
          UPDATE room_general_config
          SET room_mode = ?, room_amount = ?, tcp_mode = ?, port = ?,
              slave_amount = ?, slave_ips = ?, client_mode = ?,
              client_ip = ?, client_port = ?, knx_address = ?, updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ? AND (source_unit IS ? OR (source_unit IS NULL AND ? IS NULL))
        `);

        stmt.run(
          config.roomMode ?? 0,
          config.roomAmount ?? 1,
          config.tcpMode ?? 0,
          config.port ?? 5000,
          config.slaveAmount ?? 1,
          (config.slaveIPs || []).join(","),
          config.clientMode ?? 0,
          config.clientIP ?? "",
          config.clientPort ?? 8080,
          config.knxAddress || null,
          projectId,
          sourceUnit,
          sourceUnit
        );

        return this.getRoomGeneralConfig(projectId, sourceUnit);
      } else {
        // Create new
        const stmt = this.db.prepare(`
          INSERT INTO room_general_config (
            project_id, source_unit, room_mode, room_amount, tcp_mode, port,
            slave_amount, slave_ips, client_mode, client_ip, client_port, knx_address
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          projectId,
          sourceUnit,
          config.roomMode ?? 0,
          config.roomAmount ?? 1,
          config.tcpMode ?? 0,
          config.port ?? 5000,
          config.slaveAmount ?? 1,
          (config.slaveIPs || []).join(","),
          config.clientMode ?? 0,
          config.clientIP ?? "",
          config.clientPort ?? 8080,
          config.knxAddress || null
        );

        return this.getRoomGeneralConfig(projectId, sourceUnit);
      }
    } catch (error) {
      console.error("Failed to create/update room general config:", error);
      throw error;
    }
  },

  /**
   * Get room detail config for a specific room address
   * @param {number} generalConfigId - The general config ID
   * @param {number} roomAddress - The room address (1-5)
   */
  getRoomDetailConfig(generalConfigId, roomAddress) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_detail_config
        WHERE general_config_id = ? AND room_address = ?
      `);

      const config = stmt.get(generalConfigId, roomAddress);

      if (config) {
        // Parse states from flat columns to nested object
        config.states = {
          Unrent: {
            airconActive: Boolean(config.unrent_aircon_active),
            airconMode: config.unrent_aircon_mode,
            airconFanSpeed: config.unrent_aircon_fan_speed,
            airconCoolSetpoint: config.unrent_aircon_cool_setpoint,
            airconHeatSetpoint: config.unrent_aircon_heat_setpoint,
            sceneAmount: config.unrent_scene_amount,
            scenesList: this.parseScenesString(config.unrent_scenes),
          },
          Unoccupy: {
            airconActive: Boolean(config.unoccupy_aircon_active),
            airconMode: config.unoccupy_aircon_mode,
            airconFanSpeed: config.unoccupy_aircon_fan_speed,
            airconCoolSetpoint: config.unoccupy_aircon_cool_setpoint,
            airconHeatSetpoint: config.unoccupy_aircon_heat_setpoint,
            sceneAmount: config.unoccupy_scene_amount,
            scenesList: this.parseScenesString(config.unoccupy_scenes),
          },
          Checkin: {
            airconActive: Boolean(config.checkin_aircon_active),
            airconMode: config.checkin_aircon_mode,
            airconFanSpeed: config.checkin_aircon_fan_speed,
            airconCoolSetpoint: config.checkin_aircon_cool_setpoint,
            airconHeatSetpoint: config.checkin_aircon_heat_setpoint,
            sceneAmount: config.checkin_scene_amount,
            scenesList: this.parseScenesString(config.checkin_scenes),
          },
          Welcome: {
            airconActive: Boolean(config.welcome_aircon_active),
            airconMode: config.welcome_aircon_mode,
            airconFanSpeed: config.welcome_aircon_fan_speed,
            airconCoolSetpoint: config.welcome_aircon_cool_setpoint,
            airconHeatSetpoint: config.welcome_aircon_heat_setpoint,
            sceneAmount: config.welcome_scene_amount,
            scenesList: this.parseScenesString(config.welcome_scenes),
          },
          WelcomeNight: {
            airconActive: Boolean(config.welcome_night_aircon_active),
            airconMode: config.welcome_night_aircon_mode,
            airconFanSpeed: config.welcome_night_aircon_fan_speed,
            airconCoolSetpoint: config.welcome_night_aircon_cool_setpoint,
            airconHeatSetpoint: config.welcome_night_aircon_heat_setpoint,
            sceneAmount: config.welcome_night_scene_amount,
            scenesList: this.parseScenesString(config.welcome_night_scenes),
          },
          Staff: {
            airconActive: Boolean(config.staff_aircon_active),
            airconMode: config.staff_aircon_mode,
            airconFanSpeed: config.staff_aircon_fan_speed,
            airconCoolSetpoint: config.staff_aircon_cool_setpoint,
            airconHeatSetpoint: config.staff_aircon_heat_setpoint,
            sceneAmount: config.staff_scene_amount,
            scenesList: this.parseScenesString(config.staff_scenes),
          },
          OutOfService: {
            airconActive: Boolean(config.out_of_service_aircon_active),
            airconMode: config.out_of_service_aircon_mode,
            airconFanSpeed: config.out_of_service_aircon_fan_speed,
            airconCoolSetpoint: config.out_of_service_aircon_cool_setpoint,
            airconHeatSetpoint: config.out_of_service_aircon_heat_setpoint,
            sceneAmount: config.out_of_service_scene_amount,
            scenesList: this.parseScenesString(config.out_of_service_scenes),
          },
        };
      }

      return config;
    } catch (error) {
      console.error("Failed to get room config:", error);
      throw error;
    }
  },

  /**
   * Get all room detail configs for a general config
   * @param {number} generalConfigId - The general config ID
   */
  getAllRoomDetailConfigs(generalConfigId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_detail_config
        WHERE general_config_id = ?
        ORDER BY room_address
      `);

      const configs = stmt.all(generalConfigId);

      // Parse states for each config
      return configs.map((config) => {
        const roomAddress = config.room_address;
        return this.getRoomDetailConfig(generalConfigId, roomAddress);
      });
    } catch (error) {
      console.error("Failed to get all room detail configs:", error);
      throw error;
    }
  },

  /**
   * Get all room detail configs for a project and source unit
   * @param {number} projectId - The project ID
   * @param {number|null} sourceUnit - The source unit ID (null for default)
   */
  getAllRoomDetailConfigsByProjectAndUnit(projectId, sourceUnit = null) {
    try {
      // First get the general config
      const generalConfig = this.getRoomGeneralConfig(projectId, sourceUnit);
      if (!generalConfig) {
        return [];
      }

      // Then get all room detail configs for this general config
      return this.getAllRoomDetailConfigs(generalConfig.id);
    } catch (error) {
      console.error("Failed to get all room detail configs by project and unit:", error);
      throw error;
    }
  },

  /**
   * Create or update room detail config
   * @param {number} generalConfigId - The general config ID
   * @param {number} roomAddress - The room address (1-5)
   * @param {object} config - The configuration object
   */
  createOrUpdateRoomDetailConfig(generalConfigId, roomAddress, config) {
    try {
      if (!config) {
        throw new Error("Config object is required");
      }

      const existing = this.getRoomDetailConfig(generalConfigId, roomAddress);
      const states = config.states || {};

      if (existing) {
        // Update existing
        const stmt = this.db.prepare(`
          UPDATE room_detail_config
          SET occupancy_type = ?, occupancy_scene_type = ?, enable_welcome_night = ?,
              period = ?, pir_init_time = ?, pir_verify_time = ?, unrent_period = ?,
              standby_time = ?,
              unrent_aircon_active = ?, unrent_aircon_mode = ?,
              unrent_aircon_fan_speed = ?, unrent_aircon_cool_setpoint = ?,
              unrent_aircon_heat_setpoint = ?, unrent_scene_amount = ?,
              unrent_scenes = ?,
              unoccupy_aircon_active = ?, unoccupy_aircon_mode = ?,
              unoccupy_aircon_fan_speed = ?, unoccupy_aircon_cool_setpoint = ?,
              unoccupy_aircon_heat_setpoint = ?, unoccupy_scene_amount = ?,
              unoccupy_scenes = ?,
              checkin_aircon_active = ?, checkin_aircon_mode = ?,
              checkin_aircon_fan_speed = ?, checkin_aircon_cool_setpoint = ?,
              checkin_aircon_heat_setpoint = ?, checkin_scene_amount = ?,
              checkin_scenes = ?,
              welcome_aircon_active = ?, welcome_aircon_mode = ?,
              welcome_aircon_fan_speed = ?, welcome_aircon_cool_setpoint = ?,
              welcome_aircon_heat_setpoint = ?, welcome_scene_amount = ?,
              welcome_scenes = ?,
              welcome_night_aircon_active = ?, welcome_night_aircon_mode = ?,
              welcome_night_aircon_fan_speed = ?, welcome_night_aircon_cool_setpoint = ?,
              welcome_night_aircon_heat_setpoint = ?, welcome_night_scene_amount = ?,
              welcome_night_scenes = ?,
              staff_aircon_active = ?, staff_aircon_mode = ?,
              staff_aircon_fan_speed = ?, staff_aircon_cool_setpoint = ?,
              staff_aircon_heat_setpoint = ?, staff_scene_amount = ?,
              staff_scenes = ?,
              out_of_service_aircon_active = ?, out_of_service_aircon_mode = ?,
              out_of_service_aircon_fan_speed = ?, out_of_service_aircon_cool_setpoint = ?,
              out_of_service_aircon_heat_setpoint = ?, out_of_service_scene_amount = ?,
              out_of_service_scenes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE general_config_id = ? AND room_address = ?
        `);

        stmt.run(
          config.occupancyType ?? 0,
          config.occupancySceneType ?? 0,
          config.enableWelcomeNight ?? 0,
          config.period ?? 0,
          config.pirInitTime ?? 0,
          config.pirVerifyTime ?? 0,
          config.unrentPeriod ?? 0,
          config.standbyTime ?? 15,
          // Unrent
          states.Unrent?.airconActive ? 1 : 0,
          states.Unrent?.airconMode ?? 0,
          states.Unrent?.airconFanSpeed ?? 0,
          states.Unrent?.airconCoolSetpoint ?? 24,
          states.Unrent?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unrent?.scenesList),
          this.formatScenesString(states.Unrent?.scenesList),
          // Unoccupy
          states.Unoccupy?.airconActive ? 1 : 0,
          states.Unoccupy?.airconMode ?? 0,
          states.Unoccupy?.airconFanSpeed ?? 0,
          states.Unoccupy?.airconCoolSetpoint ?? 24,
          states.Unoccupy?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unoccupy?.scenesList),
          this.formatScenesString(states.Unoccupy?.scenesList),
          // Checkin
          states.Checkin?.airconActive ? 1 : 0,
          states.Checkin?.airconMode ?? 0,
          states.Checkin?.airconFanSpeed ?? 0,
          states.Checkin?.airconCoolSetpoint ?? 24,
          states.Checkin?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Checkin?.scenesList),
          this.formatScenesString(states.Checkin?.scenesList),
          // Welcome
          states.Welcome?.airconActive ? 1 : 0,
          states.Welcome?.airconMode ?? 0,
          states.Welcome?.airconFanSpeed ?? 0,
          states.Welcome?.airconCoolSetpoint ?? 24,
          states.Welcome?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Welcome?.scenesList),
          this.formatScenesString(states.Welcome?.scenesList),
          // WelcomeNight
          states.WelcomeNight?.airconActive ? 1 : 0,
          states.WelcomeNight?.airconMode ?? 0,
          states.WelcomeNight?.airconFanSpeed ?? 0,
          states.WelcomeNight?.airconCoolSetpoint ?? 24,
          states.WelcomeNight?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.WelcomeNight?.scenesList),
          this.formatScenesString(states.WelcomeNight?.scenesList),
          // Staff
          states.Staff?.airconActive ? 1 : 0,
          states.Staff?.airconMode ?? 0,
          states.Staff?.airconFanSpeed ?? 0,
          states.Staff?.airconCoolSetpoint ?? 24,
          states.Staff?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Staff?.scenesList),
          this.formatScenesString(states.Staff?.scenesList),
          // OutOfService
          states.OutOfService?.airconActive ? 1 : 0,
          states.OutOfService?.airconMode ?? 0,
          states.OutOfService?.airconFanSpeed ?? 0,
          states.OutOfService?.airconCoolSetpoint ?? 24,
          states.OutOfService?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.OutOfService?.scenesList),
          this.formatScenesString(states.OutOfService?.scenesList),
          generalConfigId,
          roomAddress
        );
      } else {
        // Create new
        const stmt = this.db.prepare(`
          INSERT INTO room_detail_config (
            general_config_id, room_address, occupancy_type, occupancy_scene_type, enable_welcome_night,
            period, pir_init_time, pir_verify_time, unrent_period, standby_time,
            unrent_aircon_active, unrent_aircon_mode, unrent_aircon_fan_speed,
            unrent_aircon_cool_setpoint, unrent_aircon_heat_setpoint,
            unrent_scene_amount, unrent_scenes,
            unoccupy_aircon_active, unoccupy_aircon_mode, unoccupy_aircon_fan_speed,
            unoccupy_aircon_cool_setpoint, unoccupy_aircon_heat_setpoint,
            unoccupy_scene_amount, unoccupy_scenes,
            checkin_aircon_active, checkin_aircon_mode, checkin_aircon_fan_speed,
            checkin_aircon_cool_setpoint, checkin_aircon_heat_setpoint,
            checkin_scene_amount, checkin_scenes,
            welcome_aircon_active, welcome_aircon_mode, welcome_aircon_fan_speed,
            welcome_aircon_cool_setpoint, welcome_aircon_heat_setpoint,
            welcome_scene_amount, welcome_scenes,
            welcome_night_aircon_active, welcome_night_aircon_mode, welcome_night_aircon_fan_speed,
            welcome_night_aircon_cool_setpoint, welcome_night_aircon_heat_setpoint,
            welcome_night_scene_amount, welcome_night_scenes,
            staff_aircon_active, staff_aircon_mode, staff_aircon_fan_speed,
            staff_aircon_cool_setpoint, staff_aircon_heat_setpoint,
            staff_scene_amount, staff_scenes,
            out_of_service_aircon_active, out_of_service_aircon_mode, out_of_service_aircon_fan_speed,
            out_of_service_aircon_cool_setpoint, out_of_service_aircon_heat_setpoint,
            out_of_service_scene_amount, out_of_service_scenes
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )
        `);

        stmt.run(
          generalConfigId,
          roomAddress,
          config.occupancyType ?? 0,
          config.occupancySceneType ?? 0,
          config.enableWelcomeNight ?? 0,
          config.period ?? 0,
          config.pirInitTime ?? 0,
          config.pirVerifyTime ?? 0,
          config.unrentPeriod ?? 0,
          config.standbyTime ?? 15,
          // Unrent
          states.Unrent?.airconActive ? 1 : 0,
          states.Unrent?.airconMode ?? 0,
          states.Unrent?.airconFanSpeed ?? 0,
          states.Unrent?.airconCoolSetpoint ?? 24,
          states.Unrent?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unrent?.scenesList),
          this.formatScenesString(states.Unrent?.scenesList),
          // Unoccupy
          states.Unoccupy?.airconActive ? 1 : 0,
          states.Unoccupy?.airconMode ?? 0,
          states.Unoccupy?.airconFanSpeed ?? 0,
          states.Unoccupy?.airconCoolSetpoint ?? 24,
          states.Unoccupy?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Unoccupy?.scenesList),
          this.formatScenesString(states.Unoccupy?.scenesList),
          // Checkin
          states.Checkin?.airconActive ? 1 : 0,
          states.Checkin?.airconMode ?? 0,
          states.Checkin?.airconFanSpeed ?? 0,
          states.Checkin?.airconCoolSetpoint ?? 24,
          states.Checkin?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Checkin?.scenesList),
          this.formatScenesString(states.Checkin?.scenesList),
          // Welcome
          states.Welcome?.airconActive ? 1 : 0,
          states.Welcome?.airconMode ?? 0,
          states.Welcome?.airconFanSpeed ?? 0,
          states.Welcome?.airconCoolSetpoint ?? 24,
          states.Welcome?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Welcome?.scenesList),
          this.formatScenesString(states.Welcome?.scenesList),
          // WelcomeNight
          states.WelcomeNight?.airconActive ? 1 : 0,
          states.WelcomeNight?.airconMode ?? 0,
          states.WelcomeNight?.airconFanSpeed ?? 0,
          states.WelcomeNight?.airconCoolSetpoint ?? 24,
          states.WelcomeNight?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.WelcomeNight?.scenesList),
          this.formatScenesString(states.WelcomeNight?.scenesList),
          // Staff
          states.Staff?.airconActive ? 1 : 0,
          states.Staff?.airconMode ?? 0,
          states.Staff?.airconFanSpeed ?? 0,
          states.Staff?.airconCoolSetpoint ?? 24,
          states.Staff?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.Staff?.scenesList),
          this.formatScenesString(states.Staff?.scenesList),
          // OutOfService
          states.OutOfService?.airconActive ? 1 : 0,
          states.OutOfService?.airconMode ?? 0,
          states.OutOfService?.airconFanSpeed ?? 0,
          states.OutOfService?.airconCoolSetpoint ?? 24,
          states.OutOfService?.airconHeatSetpoint ?? 20,
          this.getSceneAmount(states.OutOfService?.scenesList),
          this.formatScenesString(states.OutOfService?.scenesList)
        );
      }

      return this.getRoomDetailConfig(generalConfigId, roomAddress);
    } catch (error) {
      console.error("Failed to create/update room detail config:", error);
      throw error;
    }
  },

  /**
   * Delete room detail config
   */
  deleteRoomDetailConfig(generalConfigId, roomAddress) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM room_detail_config
        WHERE general_config_id = ? AND room_address = ?
      `);

      const result = stmt.run(generalConfigId, roomAddress);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("Failed to delete room detail config:", error);
      throw error;
    }
  },

  /**
   * Delete all room detail configs for a general config
   */
  deleteAllRoomDetailConfigs(generalConfigId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM room_detail_config WHERE general_config_id = ?
      `);

      const result = stmt.run(generalConfigId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("Failed to delete all room detail configs:", error);
      throw error;
    }
  },

  /**
   * Delete room general config and all its room configs
   */
  deleteRoomGeneralConfig(projectId, sourceUnit = null) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM room_general_config
        WHERE project_id = ? AND (source_unit IS ? OR (source_unit IS NULL AND ? IS NULL))
      `);

      const result = stmt.run(projectId, sourceUnit, sourceUnit);
      // Room detail configs will be deleted automatically due to CASCADE
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("Failed to delete room general config:", error);
      throw error;
    }
  },
};
