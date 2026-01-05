export const importExportOperations = {
  importProject(projectData, itemsData) {
    try {
      const transaction = this.db.transaction(() => {
        // 1. Create ID mappings for all tables
        const idMappings = {
          lighting: {},
          aircon: {},
          unit: {},
          curtain: {},
          knx: {},
          dmx: {},
          scene: {},
          schedule: {},
          multi_scenes: {},
          sequences: {},
        };

        // 2. Create project
        const project = this.createProject(projectData);
        console.log(`Created project: ${project.name} (ID: ${project.id})`);

        // 3. Import items in correct order (respecting dependencies)
        const importedCounts = {};

        // Phase 1: Import items without dependencies
        console.log("Phase 1: Importing items without dependencies...");

        // Unit items (no dependencies)
        importedCounts.unit = this.importCategory(project.id, itemsData.unit || [], "unit", idMappings);

        // Device items (no dependencies)
        importedCounts.lighting = this.importCategory(project.id, itemsData.lighting || [], "lighting", idMappings);
        importedCounts.aircon = this.importCategory(project.id, itemsData.aircon || [], "aircon", idMappings);
        importedCounts.dmx = this.importCategory(project.id, itemsData.dmx || [], "dmx", idMappings);

        // Phase 2: Import items with unit dependencies
        console.log("Phase 2: Importing items with unit dependencies...");

        // Curtain (may reference lighting groups, but we'll fix that later)
        importedCounts.curtain = this.importCategoryWithUnitRef(project.id, itemsData.curtain || [], "curtain", idMappings);

        // KNX (may reference RCU groups, but we'll fix that later)
        importedCounts.knx = this.importCategoryWithUnitRef(project.id, itemsData.knx || [], "knx", idMappings);

        // Phase 3: Import control items
        console.log("Phase 3: Importing control items...");

        importedCounts.scene = this.importCategoryWithUnitRef(project.id, itemsData.scene || [], "scene", idMappings);
        importedCounts.schedule = this.importScheduleItems(project.id, itemsData.schedule || [], idMappings);
        importedCounts.multi_scenes = this.importCategoryWithUnitRef(project.id, itemsData.multi_scenes || [], "multi_scenes", idMappings);
        importedCounts.sequences = this.importCategoryWithUnitRef(project.id, itemsData.sequences || [], "sequences", idMappings);

        // Phase 4: Import relationship tables
        console.log("Phase 4: Importing relationships...");
        this.importRelationships(itemsData, idMappings);

        // Phase 5: Fix cross-references (KNX RCU groups, Curtain lighting groups)
        console.log("Phase 5: Fixing cross-references...");
        this.fixKnxRcuGroupReferences(itemsData.knx || [], idMappings);
        this.fixCurtainLightingGroupReferences(itemsData.curtain || [], idMappings);

        // Phase 6: Import configuration tables
        console.log("Phase 6: Importing configurations...");
        this.importConfigurations(project.id, itemsData);

        console.log("Import completed successfully!");
        return { project, importedCounts };
      });

      return transaction();
    } catch (error) {
      console.error("Failed to import project:", error);
      throw error;
    }
  },

  /**
   * Import a category of items (simple case - no dependencies)
   */
  importCategory(projectId, items, category, idMappings) {
    let count = 0;

    items.forEach((item) => {
      const oldId = item.id;

      // Prepare item for import
      const itemData = { ...item };
      delete itemData.id; // Let database auto-increment
      delete itemData.project_id; // Will be set by create method
      delete itemData.created_at;
      delete itemData.updated_at;

      // Create item
      const newItem = this.createProjectItem(projectId, itemData, category);

      // Store ID mapping
      if (oldId) {
        idMappings[category][oldId] = newItem.id;
      }

      count++;
    });

    console.log(`  Imported ${count} ${category} items`);
    return count;
  },

  /**
   * Import category with source_unit reference
   */
  importCategoryWithUnitRef(projectId, items, category, idMappings) {
    let count = 0;

    items.forEach((item) => {
      const oldId = item.id;
      const oldSourceUnit = item.source_unit;

      // Prepare item for import
      const itemData = { ...item };
      delete itemData.id;
      delete itemData.project_id;
      delete itemData.created_at;
      delete itemData.updated_at;

      // Map source_unit if exists
      if (oldSourceUnit && idMappings.unit[oldSourceUnit]) {
        itemData.source_unit = idMappings.unit[oldSourceUnit];
      } else {
        itemData.source_unit = null;
      }

      // Create item
      const newItem = this.createProjectItem(projectId, itemData, category);

      // Store ID mapping
      if (oldId) {
        idMappings[category][oldId] = newItem.id;
      }

      count++;
    });

    console.log(`  Imported ${count} ${category} items`);
    return count;
  },

  /**
   * Import schedule items (special handling)
   */
  importScheduleItems(projectId, items, idMappings) {
    let count = 0;

    items.forEach((item) => {
      const oldId = item.id;
      const oldSourceUnit = item.source_unit;

      // Prepare item for import
      const itemData = {
        name: item.name,
        description: item.description,
        time: item.time,
        days: item.days,
        enabled: item.enabled,
        mode: item.mode,
        interval_time: item.interval_time,
        dmx_duration: item.dmx_duration,
      };

      // Map source_unit if exists
      if (oldSourceUnit && idMappings.unit[oldSourceUnit]) {
        itemData.source_unit = idMappings.unit[oldSourceUnit];
      }

      // Create schedule item
      const newItem = this.createScheduleItem(projectId, itemData);

      // Store ID mapping
      if (oldId) {
        idMappings.schedule[oldId] = newItem.id;
      }

      count++;
    });

    console.log(`  Imported ${count} schedule items`);
    return count;
  },

  /**
   * Import all relationship tables
   */
  importRelationships(itemsData, idMappings) {
    // Import scene_items
    const sceneItems = itemsData.scene_items || [];
    let sceneItemCount = 0;

    sceneItems.forEach((item) => {
      const newSceneId = idMappings.scene[item.scene_id];
      const newItemId = idMappings[item.item_type]?.[item.item_id];

      if (newSceneId && newItemId) {
        const stmt = this.db.prepare(`
          INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(newSceneId, item.item_type, newItemId, item.item_address, item.item_value, item.command, item.object_type, item.object_value);
        sceneItemCount++;
      }
    });

    console.log(`  Imported ${sceneItemCount} scene_items`);

    // Import schedule_scenes
    const scheduleScenes = itemsData.schedule_scenes || [];
    let scheduleScenesCount = 0;

    scheduleScenes.forEach((item) => {
      const newScheduleId = idMappings.schedule[item.schedule_id];
      const newSceneId = idMappings.scene[item.scene_id];

      if (newScheduleId && newSceneId) {
        const stmt = this.db.prepare(`
          INSERT INTO schedule_scenes (schedule_id, scene_id)
          VALUES (?, ?)
        `);
        stmt.run(newScheduleId, newSceneId);
        scheduleScenesCount++;
      }
    });

    console.log(`  Imported ${scheduleScenesCount} schedule_scenes`);

    // Import multi_scene_scenes
    const multiSceneScenes = itemsData.multi_scene_scenes || [];
    let multiSceneScenesCount = 0;

    multiSceneScenes.forEach((item) => {
      const newMultiSceneId = idMappings.multi_scenes[item.multi_scene_id];
      const newSceneId = idMappings.scene[item.scene_id];

      if (newMultiSceneId && newSceneId) {
        const stmt = this.db.prepare(`
          INSERT INTO multi_scene_scenes (multi_scene_id, scene_id, scene_order)
          VALUES (?, ?, ?)
        `);
        stmt.run(newMultiSceneId, newSceneId, item.scene_order);
        multiSceneScenesCount++;
      }
    });

    console.log(`  Imported ${multiSceneScenesCount} multi_scene_scenes`);

    // Import sequence_multi_scenes
    const sequenceMultiScenes = itemsData.sequence_multi_scenes || [];
    let sequenceMultiScenesCount = 0;

    sequenceMultiScenes.forEach((item) => {
      const newSequenceId = idMappings.sequences[item.sequence_id];
      const newMultiSceneId = idMappings.multi_scenes[item.multi_scene_id];

      if (newSequenceId && newMultiSceneId) {
        const stmt = this.db.prepare(`
          INSERT INTO sequence_multi_scenes (sequence_id, multi_scene_id, multi_scene_order)
          VALUES (?, ?, ?)
        `);
        stmt.run(newSequenceId, newMultiSceneId, item.multi_scene_order);
        sequenceMultiScenesCount++;
      }
    });

    console.log(`  Imported ${sequenceMultiScenesCount} sequence_multi_scenes`);
  },

  /**
   * Fix KNX RCU group references
   */
  fixKnxRcuGroupReferences(knxItems, idMappings) {
    let fixedCount = 0;

    knxItems.forEach((item) => {
      if (item.rcu_group_id && item.rcu_group_type) {
        const newRcuGroupId = idMappings[item.rcu_group_type]?.[item.rcu_group_id];

        if (newRcuGroupId) {
          const newKnxId = idMappings.knx[item.id];
          if (newKnxId) {
            const stmt = this.db.prepare(`
              UPDATE knx SET rcu_group_id = ? WHERE id = ?
            `);
            stmt.run(newRcuGroupId, newKnxId);
            fixedCount++;
          }
        }
      }
    });

    console.log(`  Fixed ${fixedCount} KNX RCU group references`);
  },

  /**
   * Fix Curtain lighting group references
   */
  fixCurtainLightingGroupReferences(curtainItems, idMappings) {
    let fixedCount = 0;

    curtainItems.forEach((item) => {
      const updates = {};

      if (item.open_group_id) {
        const newId = idMappings.lighting?.[item.open_group_id];
        if (newId) updates.open_group_id = newId;
      }

      if (item.close_group_id) {
        const newId = idMappings.lighting?.[item.close_group_id];
        if (newId) updates.close_group_id = newId;
      }

      if (item.stop_group_id) {
        const newId = idMappings.lighting?.[item.stop_group_id];
        if (newId) updates.stop_group_id = newId;
      }

      if (Object.keys(updates).length > 0) {
        const newCurtainId = idMappings.curtain[item.id];
        if (newCurtainId) {
          const setClause = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ");
          const values = Object.values(updates);

          const stmt = this.db.prepare(`
            UPDATE curtain SET ${setClause} WHERE id = ?
          `);
          stmt.run(...values, newCurtainId);
          fixedCount++;
        }
      }
    });

    console.log(`  Fixed ${fixedCount} Curtain lighting group references`);
  },

  /**
   * Import configuration tables
   */
  importConfigurations(projectId, itemsData) {
    // Import room general config
    if (itemsData.room_general_config) {
      const config = itemsData.room_general_config;
      const stmt = this.db.prepare(`
        INSERT INTO room_general_config (
          project_id, room_mode, room_amount, tcp_mode, port, slave_amount, slave_ips,
          client_mode, client_ip, client_port, knx_address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        projectId,
        config.room_mode,
        config.room_amount,
        config.tcp_mode,
        config.port,
        config.slave_amount,
        config.slave_ips,
        config.client_mode,
        config.client_ip,
        config.client_port,
        config.knx_address || "0/0/0"
      );
      console.log("  Imported room_general_config");
    }

    // Import room detail config
    const roomConfigs = itemsData.room_detail_config || [];
    roomConfigs.forEach((config) => {
      const stmt = this.db.prepare(`
        INSERT INTO room_detail_config (
          project_id, room_address, occupancy_type, occupancy_scene_type, enable_welcome_night,
          period, pir_init_time, pir_verify_time, unrent_period, standby_time,
          unrent_aircon_active, unrent_aircon_mode, unrent_aircon_fan_speed, unrent_aircon_cool_setpoint, unrent_aircon_heat_setpoint,
          unrent_scene_amount, unrent_scenes,
          unoccupy_aircon_active, unoccupy_aircon_mode, unoccupy_aircon_fan_speed, unoccupy_aircon_cool_setpoint, unoccupy_aircon_heat_setpoint,
          unoccupy_scene_amount, unoccupy_scenes,
          checkin_aircon_active, checkin_aircon_mode, checkin_aircon_fan_speed, checkin_aircon_cool_setpoint, checkin_aircon_heat_setpoint,
          checkin_scene_amount, checkin_scenes,
          welcome_aircon_active, welcome_aircon_mode, welcome_aircon_fan_speed, welcome_aircon_cool_setpoint, welcome_aircon_heat_setpoint,
          welcome_scene_amount, welcome_scenes,
          welcome_night_aircon_active, welcome_night_aircon_mode, welcome_night_aircon_fan_speed, welcome_night_aircon_cool_setpoint, welcome_night_aircon_heat_setpoint,
          welcome_night_scene_amount, welcome_night_scenes,
          staff_aircon_active, staff_aircon_mode, staff_aircon_fan_speed, staff_aircon_cool_setpoint, staff_aircon_heat_setpoint,
          staff_scene_amount, staff_scenes,
          out_of_service_aircon_active, out_of_service_aircon_mode, out_of_service_aircon_fan_speed, out_of_service_aircon_cool_setpoint, out_of_service_aircon_heat_setpoint,
          out_of_service_scene_amount, out_of_service_scenes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        projectId,
        config.room_address,
        config.occupancy_type,
        config.occupancy_scene_type,
        config.enable_welcome_night,
        config.period,
        config.pir_init_time,
        config.pir_verify_time,
        config.unrent_period,
        config.standby_time,
        config.unrent_aircon_active,
        config.unrent_aircon_mode,
        config.unrent_aircon_fan_speed,
        config.unrent_aircon_cool_setpoint,
        config.unrent_aircon_heat_setpoint,
        config.unrent_scene_amount,
        config.unrent_scenes,
        config.unoccupy_aircon_active,
        config.unoccupy_aircon_mode,
        config.unoccupy_aircon_fan_speed,
        config.unoccupy_aircon_cool_setpoint,
        config.unoccupy_aircon_heat_setpoint,
        config.unoccupy_scene_amount,
        config.unoccupy_scenes,
        config.checkin_aircon_active,
        config.checkin_aircon_mode,
        config.checkin_aircon_fan_speed,
        config.checkin_aircon_cool_setpoint,
        config.checkin_aircon_heat_setpoint,
        config.checkin_scene_amount,
        config.checkin_scenes,
        config.welcome_aircon_active,
        config.welcome_aircon_mode,
        config.welcome_aircon_fan_speed,
        config.welcome_aircon_cool_setpoint,
        config.welcome_aircon_heat_setpoint,
        config.welcome_scene_amount,
        config.welcome_scenes,
        config.welcome_night_aircon_active,
        config.welcome_night_aircon_mode,
        config.welcome_night_aircon_fan_speed,
        config.welcome_night_aircon_cool_setpoint,
        config.welcome_night_aircon_heat_setpoint,
        config.welcome_night_scene_amount,
        config.welcome_night_scenes,
        config.staff_aircon_active,
        config.staff_aircon_mode,
        config.staff_aircon_fan_speed,
        config.staff_aircon_cool_setpoint,
        config.staff_aircon_heat_setpoint,
        config.staff_scene_amount,
        config.staff_scenes,
        config.out_of_service_aircon_active,
        config.out_of_service_aircon_mode,
        config.out_of_service_aircon_fan_speed,
        config.out_of_service_aircon_cool_setpoint,
        config.out_of_service_aircon_heat_setpoint,
        config.out_of_service_scene_amount,
        config.out_of_service_scenes
      );
    });
    console.log(`  Imported ${roomConfigs.length} room_detail_config`);

    // Import DALI devices
    const daliDevices = itemsData.dali_devices || [];
    daliDevices.forEach((device) => {
      const stmt = this.db.prepare(`
        INSERT INTO dali_devices (
          project_id, address, name, mapped_device_name, mapped_device_type,
          mapped_device_index, mapped_device_address, lighting_group_address, color_feature
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        projectId,
        device.address,
        device.name,
        device.mapped_device_name,
        device.mapped_device_type,
        device.mapped_device_index,
        device.mapped_device_address,
        device.lighting_group_address,
        device.color_feature
      );
    });
    console.log(`  Imported ${daliDevices.length} dali_devices`);

    // Import DALI groups
    const daliGroups = itemsData.dali_groups || [];
    daliGroups.forEach((group) => {
      const stmt = this.db.prepare(`
        INSERT INTO dali_groups (project_id, group_id, name, lighting_group_address)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(projectId, group.group_id, group.name, group.lighting_group_address);
    });
    console.log(`  Imported ${daliGroups.length} dali_groups`);

    // Import DALI group devices
    const daliGroupDevices = itemsData.dali_group_devices || [];
    daliGroupDevices.forEach((item) => {
      const stmt = this.db.prepare(`
        INSERT INTO dali_group_devices (project_id, group_id, device_address)
        VALUES (?, ?, ?)
      `);
      stmt.run(projectId, item.group_id, item.device_address);
    });
    console.log(`  Imported ${daliGroupDevices.length} dali_group_devices`);

    // Import DALI scenes
    const daliScenes = itemsData.dali_scenes || [];
    daliScenes.forEach((scene) => {
      const stmt = this.db.prepare(`
        INSERT INTO dali_scenes (project_id, scene_id, name)
        VALUES (?, ?, ?)
      `);
      stmt.run(projectId, scene.scene_id, scene.name);
    });
    console.log(`  Imported ${daliScenes.length} dali_scenes`);

    // Import DALI scene devices
    const daliSceneDevices = itemsData.dali_scene_devices || [];
    daliSceneDevices.forEach((item) => {
      const stmt = this.db.prepare(`
        INSERT INTO dali_scene_devices (
          project_id, scene_id, device_address, active, brightness,
          color_temp, r, g, b, w
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(projectId, item.scene_id, item.device_address, item.active, item.brightness, item.color_temp, item.r, item.g, item.b, item.w);
    });
    console.log(`  Imported ${daliSceneDevices.length} dali_scene_devices`);

    // Import Zigbee devices
    const zigbeeDevices = itemsData.zigbee_devices || [];
    zigbeeDevices.forEach((device) => {
      const stmt = this.db.prepare(`
        INSERT INTO zigbee_devices (
          project_id, unit_ip, unit_can_id, ieee_address, device_type, device_name, num_endpoints,
          endpoint1_id, endpoint1_value, endpoint1_address, endpoint1_name,
          endpoint2_id, endpoint2_value, endpoint2_address, endpoint2_name,
          endpoint3_id, endpoint3_value, endpoint3_address, endpoint3_name,
          endpoint4_id, endpoint4_value, endpoint4_address, endpoint4_name,
          rssi, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        projectId,
        device.unit_ip,
        device.unit_can_id,
        device.ieee_address,
        device.device_type,
        device.device_name,
        device.num_endpoints,
        device.endpoint1_id,
        device.endpoint1_value,
        device.endpoint1_address,
        device.endpoint1_name,
        device.endpoint2_id,
        device.endpoint2_value,
        device.endpoint2_address,
        device.endpoint2_name,
        device.endpoint3_id,
        device.endpoint3_value,
        device.endpoint3_address,
        device.endpoint3_name,
        device.endpoint4_id,
        device.endpoint4_value,
        device.endpoint4_address,
        device.endpoint4_name,
        device.rssi,
        device.status
      );
    });
    console.log(`  Imported ${zigbeeDevices.length} zigbee_devices`);
  },
};
