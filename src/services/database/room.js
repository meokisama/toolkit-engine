/**
 * Room Configuration Database Module
 * Contains all table schemas and methods related to room configurations
 */

// Table creation SQL statements
export const roomTableSchemas = {
  // Room General Config Table - stores general room configuration for each project
  createRoomGeneralConfigTable: `
    CREATE TABLE IF NOT EXISTS room_general_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL UNIQUE,
      room_mode INTEGER NOT NULL DEFAULT 0,
      room_amount INTEGER NOT NULL DEFAULT 1,
      tcp_mode INTEGER NOT NULL DEFAULT 0,
      port INTEGER NOT NULL DEFAULT 5000,
      slave_amount INTEGER NOT NULL DEFAULT 1,
      slave_ips TEXT,
      client_mode INTEGER NOT NULL DEFAULT 0,
      client_ip TEXT,
      client_port INTEGER NOT NULL DEFAULT 8080,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,

  // Room Config Table - stores individual room configurations with 7 states
  createRoomConfigTable: `
    CREATE TABLE IF NOT EXISTS room_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
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
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, room_address)
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
   * Get room general config for a project
   */
  getRoomGeneralConfig(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_general_config WHERE project_id = ?
      `);

      const config = stmt.get(projectId);

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
   * Create or update room general config
   */
  createOrUpdateRoomGeneralConfig(projectId, config) {
    try {
      const existing = this.getRoomGeneralConfig(projectId);

      if (existing) {
        // Update existing
        const stmt = this.db.prepare(`
          UPDATE room_general_config
          SET room_mode = ?, room_amount = ?, tcp_mode = ?, port = ?,
              slave_amount = ?, slave_ips = ?, client_mode = ?,
              client_ip = ?, client_port = ?, updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ?
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
          projectId
        );

        return this.getRoomGeneralConfig(projectId);
      } else {
        // Create new
        const stmt = this.db.prepare(`
          INSERT INTO room_general_config (
            project_id, room_mode, room_amount, tcp_mode, port,
            slave_amount, slave_ips, client_mode, client_ip, client_port
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          projectId,
          config.roomMode ?? 0,
          config.roomAmount ?? 1,
          config.tcpMode ?? 0,
          config.port ?? 5000,
          config.slaveAmount ?? 1,
          (config.slaveIPs || []).join(","),
          config.clientMode ?? 0,
          config.clientIP ?? "",
          config.clientPort ?? 8080
        );

        return this.getRoomGeneralConfig(projectId);
      }
    } catch (error) {
      console.error("Failed to create/update room general config:", error);
      throw error;
    }
  },

  /**
   * Get room config for a specific room address
   */
  getRoomConfig(projectId, roomAddress) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_config
        WHERE project_id = ? AND room_address = ?
      `);

      const config = stmt.get(projectId, roomAddress);

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
   * Get all room configs for a project
   */
  getAllRoomConfigs(projectId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM room_config
        WHERE project_id = ?
        ORDER BY room_address
      `);

      const configs = stmt.all(projectId);

      // Parse states for each config
      return configs.map((config) => {
        const roomAddress = config.room_address;
        return this.getRoomConfig(projectId, roomAddress);
      });
    } catch (error) {
      console.error("Failed to get all room configs:", error);
      throw error;
    }
  },

  /**
   * Create or update room config
   */
  createOrUpdateRoomConfig(projectId, roomAddress, config) {
    try {
      const existing = this.getRoomConfig(projectId, roomAddress);
      const states = config.states || {};

      if (existing) {
        // Update existing
        const stmt = this.db.prepare(`
          UPDATE room_config
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
          WHERE project_id = ? AND room_address = ?
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
          projectId,
          roomAddress
        );
      } else {
        // Create new
        const stmt = this.db.prepare(`
          INSERT INTO room_config (
            project_id, room_address, occupancy_type, occupancy_scene_type, enable_welcome_night,
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
          projectId,
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

      return this.getRoomConfig(projectId, roomAddress);
    } catch (error) {
      console.error("Failed to create/update room config:", error);
      throw error;
    }
  },

  /**
   * Delete room config
   */
  deleteRoomConfig(projectId, roomAddress) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM room_config
        WHERE project_id = ? AND room_address = ?
      `);

      const result = stmt.run(projectId, roomAddress);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("Failed to delete room config:", error);
      throw error;
    }
  },

  /**
   * Delete all room configs for a project
   */
  deleteAllRoomConfigs(projectId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM room_config WHERE project_id = ?
      `);

      const result = stmt.run(projectId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("Failed to delete all room configs:", error);
      throw error;
    }
  },
};
