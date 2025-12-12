// Import/Export operations for database projects

export const importExportOperations = {
  // Import project with all items
  importProject(projectData, itemsData) {
    try {
      // Start transaction
      const transaction = this.db.transaction(() => {
        // Create project
        const project = this.createProject(projectData);

        // Import items for each category
        const categories = ["lighting", "aircon", "unit", "curtain", "knx", "scene", "schedule", "multi_scenes", "sequences"];
        const importedCounts = {};
        const idMappings = {
          scene: {},
          schedule: {},
          multi_scenes: {},
          sequences: {},
        };

        categories.forEach((category) => {
          const items = itemsData[category] || [];
          importedCounts[category] = 0;

          items.forEach((itemData) => {
            let newItem;

            if (category === "unit") {
              newItem = this.createUnitItem(project.id, itemData);
            } else if (category === "aircon") {
              // Ensure label is set for aircon items
              if (!itemData.label) {
                itemData.label = "Aircon";
              }
              newItem = this.createProjectItem(project.id, itemData, "aircon");
            } else if (category === "schedule") {
              newItem = this.createScheduleItem(project.id, itemData);
            } else if (category === "knx") {
              // Handle KNX items with special logic for RCU group references
              newItem = this.createKnxItem(project.id, itemData);
            } else if (category === "curtain") {
              // Handle Curtain items with special logic for lighting group references
              newItem = this.createCurtainItem(project.id, itemData);
            } else {
              newItem = this.createProjectItem(project.id, itemData, category);
            }

            // Store ID mapping for relationships
            if (["scene", "schedule", "multi_scenes", "sequences"].includes(category)) {
              idMappings[category][itemData.id] = newItem.id;
            }

            importedCounts[category]++;
          });
        });

        // Import relationship tables after all main items are created
        this.importProjectRelationships(itemsData, project.id, idMappings);

        // Update KNX items to resolve RCU group addresses to new IDs
        this.updateKnxRcuGroupReferences(project.id, itemsData);

        return { project, importedCounts };
      });

      return transaction();
    } catch (error) {
      console.error("Failed to import project:", error);
      throw error;
    }
  },

  // Helper method to import all relationship tables
  importProjectRelationships(itemsData, newProjectId, idMappings) {
    try {
      // Import scene_items
      const sceneItems = itemsData.scene_items || [];
      sceneItems.forEach((sceneItem) => {
        let newSceneId = null;
        let newItemId = null;

        // Handle both old format (scene_id) and new format (scene_address)
        if (sceneItem.scene_address) {
          newSceneId = this.findSceneIdByAddress(newProjectId, sceneItem.scene_address);
        } else if (sceneItem.scene_id) {
          newSceneId = idMappings.scene[sceneItem.scene_id]; // Backward compatibility
        }

        // Handle both old format (item_id) and new format (item_address)
        if (sceneItem.item_address && sceneItem.item_type) {
          newItemId = this.findItemIdByAddress(newProjectId, sceneItem.item_address, sceneItem.item_type);
        } else if (sceneItem.item_id) {
          newItemId = sceneItem.item_id; // Backward compatibility - may not work cross-machine
        }

        if (newSceneId && newItemId) {
          const stmt = this.db.prepare(`
            INSERT INTO scene_items (scene_id, item_type, item_id, item_address, item_value, command, object_type, object_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            newSceneId,
            sceneItem.item_type,
            newItemId,
            sceneItem.item_address,
            sceneItem.item_value,
            sceneItem.command,
            sceneItem.object_type,
            sceneItem.object_value
          );
        }
      });

      // Import scene_address_items
      const sceneAddressItems = itemsData.scene_address_items || [];
      sceneAddressItems.forEach((addressItem) => {
        const stmt = this.db.prepare(`
          INSERT INTO scene_address_items (project_id, address, item_type, item_id, object_type, object_value)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(newProjectId, addressItem.address, addressItem.item_type, addressItem.item_id, addressItem.object_type, addressItem.object_value);
      });

      // Import schedule_scenes
      const scheduleScenes = itemsData.schedule_scenes || [];
      scheduleScenes.forEach((scheduleScene) => {
        let newScheduleId = null;
        let newSceneId = null;

        // Handle both old format (schedule_id) and new format (schedule_identifier)
        if (scheduleScene.schedule_identifier) {
          newScheduleId = this.findScheduleIdByIdentifier(newProjectId, scheduleScene.schedule_identifier);
        } else if (scheduleScene.schedule_id) {
          newScheduleId = idMappings.schedule[scheduleScene.schedule_id]; // Backward compatibility
        }

        // Handle both old format (scene_id) and new format (scene_address)
        if (scheduleScene.scene_address) {
          newSceneId = this.findSceneIdByAddress(newProjectId, scheduleScene.scene_address);
        } else if (scheduleScene.scene_id) {
          newSceneId = idMappings.scene[scheduleScene.scene_id]; // Backward compatibility
        }

        if (newScheduleId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO schedule_scenes (schedule_id, scene_id)
            VALUES (?, ?)
          `);
          stmt.run(newScheduleId, newSceneId);
        }
      });

      // Import multi_scene_scenes
      const multiSceneScenes = itemsData.multi_scene_scenes || [];
      multiSceneScenes.forEach((multiSceneScene) => {
        let newMultiSceneId = null;
        let newSceneId = null;

        // Handle both old format (multi_scene_id) and new format (multi_scene_address)
        if (multiSceneScene.multi_scene_address) {
          newMultiSceneId = this.findMultiSceneIdByAddress(newProjectId, multiSceneScene.multi_scene_address);
        } else if (multiSceneScene.multi_scene_id) {
          newMultiSceneId = idMappings.multi_scenes[multiSceneScene.multi_scene_id]; // Backward compatibility
        }

        // Handle both old format (scene_id) and new format (scene_address)
        if (multiSceneScene.scene_address) {
          newSceneId = this.findSceneIdByAddress(newProjectId, multiSceneScene.scene_address);
        } else if (multiSceneScene.scene_id) {
          newSceneId = idMappings.scene[multiSceneScene.scene_id]; // Backward compatibility
        }

        if (newMultiSceneId && newSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO multi_scene_scenes (multi_scene_id, scene_id, scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(newMultiSceneId, newSceneId, multiSceneScene.scene_order);
        }
      });

      // Import sequence_multi_scenes
      const sequenceMultiScenes = itemsData.sequence_multi_scenes || [];
      sequenceMultiScenes.forEach((sequenceMultiScene) => {
        let newSequenceId = null;
        let newMultiSceneId = null;

        // Handle both old format (sequence_id) and new format (sequence_address)
        if (sequenceMultiScene.sequence_address) {
          newSequenceId = this.findSequenceIdByAddress(newProjectId, sequenceMultiScene.sequence_address);
        } else if (sequenceMultiScene.sequence_id) {
          newSequenceId = idMappings.sequences[sequenceMultiScene.sequence_id]; // Backward compatibility
        }

        // Handle both old format (multi_scene_id) and new format (multi_scene_address)
        if (sequenceMultiScene.multi_scene_address) {
          newMultiSceneId = this.findMultiSceneIdByAddress(newProjectId, sequenceMultiScene.multi_scene_address);
        } else if (sequenceMultiScene.multi_scene_id) {
          newMultiSceneId = idMappings.multi_scenes[sequenceMultiScene.multi_scene_id]; // Backward compatibility
        }

        if (newSequenceId && newMultiSceneId) {
          const stmt = this.db.prepare(`
            INSERT INTO sequence_multi_scenes (sequence_id, multi_scene_id, multi_scene_order)
            VALUES (?, ?, ?)
          `);
          stmt.run(newSequenceId, newMultiSceneId, sequenceMultiScene.multi_scene_order);
        }
      });

      // Import room general config
      if (itemsData.room_general_config) {
        const roomGeneralConfig = itemsData.room_general_config;
        const stmt = this.db.prepare(`
          INSERT INTO room_general_config (
            project_id, room_mode, room_amount, tcp_mode, port, slave_amount, slave_ips,
            client_mode, client_ip, client_port
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          roomGeneralConfig.room_mode,
          roomGeneralConfig.room_amount,
          roomGeneralConfig.tcp_mode,
          roomGeneralConfig.port,
          roomGeneralConfig.slave_amount,
          roomGeneralConfig.slave_ips,
          roomGeneralConfig.client_mode,
          roomGeneralConfig.client_ip,
          roomGeneralConfig.client_port
        );
      }

      // Import room config
      const roomConfigs = itemsData.room_config || [];
      roomConfigs.forEach((roomConfig) => {
        const stmt = this.db.prepare(`
          INSERT INTO room_config (
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
          newProjectId,
          roomConfig.room_address,
          roomConfig.occupancy_type,
          roomConfig.occupancy_scene_type,
          roomConfig.enable_welcome_night,
          roomConfig.period,
          roomConfig.pir_init_time,
          roomConfig.pir_verify_time,
          roomConfig.unrent_period,
          roomConfig.standby_time,
          roomConfig.unrent_aircon_active,
          roomConfig.unrent_aircon_mode,
          roomConfig.unrent_aircon_fan_speed,
          roomConfig.unrent_aircon_cool_setpoint,
          roomConfig.unrent_aircon_heat_setpoint,
          roomConfig.unrent_scene_amount,
          roomConfig.unrent_scenes,
          roomConfig.unoccupy_aircon_active,
          roomConfig.unoccupy_aircon_mode,
          roomConfig.unoccupy_aircon_fan_speed,
          roomConfig.unoccupy_aircon_cool_setpoint,
          roomConfig.unoccupy_aircon_heat_setpoint,
          roomConfig.unoccupy_scene_amount,
          roomConfig.unoccupy_scenes,
          roomConfig.checkin_aircon_active,
          roomConfig.checkin_aircon_mode,
          roomConfig.checkin_aircon_fan_speed,
          roomConfig.checkin_aircon_cool_setpoint,
          roomConfig.checkin_aircon_heat_setpoint,
          roomConfig.checkin_scene_amount,
          roomConfig.checkin_scenes,
          roomConfig.welcome_aircon_active,
          roomConfig.welcome_aircon_mode,
          roomConfig.welcome_aircon_fan_speed,
          roomConfig.welcome_aircon_cool_setpoint,
          roomConfig.welcome_aircon_heat_setpoint,
          roomConfig.welcome_scene_amount,
          roomConfig.welcome_scenes,
          roomConfig.welcome_night_aircon_active,
          roomConfig.welcome_night_aircon_mode,
          roomConfig.welcome_night_aircon_fan_speed,
          roomConfig.welcome_night_aircon_cool_setpoint,
          roomConfig.welcome_night_aircon_heat_setpoint,
          roomConfig.welcome_night_scene_amount,
          roomConfig.welcome_night_scenes,
          roomConfig.staff_aircon_active,
          roomConfig.staff_aircon_mode,
          roomConfig.staff_aircon_fan_speed,
          roomConfig.staff_aircon_cool_setpoint,
          roomConfig.staff_aircon_heat_setpoint,
          roomConfig.staff_scene_amount,
          roomConfig.staff_scenes,
          roomConfig.out_of_service_aircon_active,
          roomConfig.out_of_service_aircon_mode,
          roomConfig.out_of_service_aircon_fan_speed,
          roomConfig.out_of_service_aircon_cool_setpoint,
          roomConfig.out_of_service_aircon_heat_setpoint,
          roomConfig.out_of_service_scene_amount,
          roomConfig.out_of_service_scenes
        );
      });

      // Import DALI devices
      const daliDevices = itemsData.dali_devices || [];
      daliDevices.forEach((daliDevice) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_devices (
            project_id, address, name, mapped_device_name, mapped_device_type,
            mapped_device_index, mapped_device_address, lighting_group_address, color_feature
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          daliDevice.address,
          daliDevice.name,
          daliDevice.mapped_device_name,
          daliDevice.mapped_device_type,
          daliDevice.mapped_device_index,
          daliDevice.mapped_device_address,
          daliDevice.lighting_group_address,
          daliDevice.color_feature
        );
      });

      // Import DALI groups
      const daliGroups = itemsData.dali_groups || [];
      daliGroups.forEach((daliGroup) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_groups (project_id, group_id, name, lighting_group_address)
          VALUES (?, ?, ?, ?)
        `);
        stmt.run(newProjectId, daliGroup.group_id, daliGroup.name, daliGroup.lighting_group_address);
      });

      // Import DALI group devices
      const daliGroupDevices = itemsData.dali_group_devices || [];
      daliGroupDevices.forEach((daliGroupDevice) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_group_devices (project_id, group_id, device_address)
          VALUES (?, ?, ?)
        `);
        stmt.run(newProjectId, daliGroupDevice.group_id, daliGroupDevice.device_address);
      });

      // Import DALI scenes
      const daliScenes = itemsData.dali_scenes || [];
      daliScenes.forEach((daliScene) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_scenes (project_id, scene_id, name)
          VALUES (?, ?, ?)
        `);
        stmt.run(newProjectId, daliScene.scene_id, daliScene.name);
      });

      // Import DALI scene devices
      const daliSceneDevices = itemsData.dali_scene_devices || [];
      daliSceneDevices.forEach((daliSceneDevice) => {
        const stmt = this.db.prepare(`
          INSERT INTO dali_scene_devices (
            project_id, scene_id, device_address, active, brightness,
            color_temp, r, g, b, w
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          newProjectId,
          daliSceneDevice.scene_id,
          daliSceneDevice.device_address,
          daliSceneDevice.active,
          daliSceneDevice.brightness,
          daliSceneDevice.color_temp,
          daliSceneDevice.r,
          daliSceneDevice.g,
          daliSceneDevice.b,
          daliSceneDevice.w
        );
      });

      // Import Zigbee devices
      const zigbeeDevices = itemsData.zigbee_devices || [];
      zigbeeDevices.forEach((zigbeeDevice) => {
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
          newProjectId,
          zigbeeDevice.unit_ip,
          zigbeeDevice.unit_can_id,
          zigbeeDevice.ieee_address,
          zigbeeDevice.device_type,
          zigbeeDevice.device_name,
          zigbeeDevice.num_endpoints,
          zigbeeDevice.endpoint1_id,
          zigbeeDevice.endpoint1_value,
          zigbeeDevice.endpoint1_address,
          zigbeeDevice.endpoint1_name,
          zigbeeDevice.endpoint2_id,
          zigbeeDevice.endpoint2_value,
          zigbeeDevice.endpoint2_address,
          zigbeeDevice.endpoint2_name,
          zigbeeDevice.endpoint3_id,
          zigbeeDevice.endpoint3_value,
          zigbeeDevice.endpoint3_address,
          zigbeeDevice.endpoint3_name,
          zigbeeDevice.endpoint4_id,
          zigbeeDevice.endpoint4_value,
          zigbeeDevice.endpoint4_address,
          zigbeeDevice.endpoint4_name,
          zigbeeDevice.rssi,
          zigbeeDevice.status
        );
      });
    } catch (error) {
      console.error("Failed to import project relationships:", error);
      throw error;
    }
  },

  // Find item ID by address and type in the new project
  findItemIdByAddress(projectId, address, itemType) {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM ${itemType}
        WHERE project_id = ? AND address = ?
      `);
      const result = stmt.get(projectId, address);
      return result ? result.id : null;
    } catch (error) {
      console.error(`Failed to find ${itemType} ID for address ${address}:`, error);
      return null;
    }
  },

  // Bulk import items for a specific category
  bulkImportItems(projectId, items, category) {
    try {
      const transaction = this.db.transaction(() => {
        const importedItems = [];

        items.forEach((itemData) => {
          let item;
          if (category === "unit") {
            item = this.createUnitItem(projectId, itemData);
          } else if (category === "aircon") {
            item = this.createProjectItem(projectId, itemData, "aircon");
          } else if (category === "schedule") {
            item = this.createScheduleItem(projectId, itemData);
          } else if (category === "scene") {
            item = this.bulkImportSingleScene(projectId, itemData);
          } else {
            item = this.createProjectItem(projectId, itemData, category);
          }
          importedItems.push(item);
        });

        return importedItems;
      });

      return transaction();
    } catch (error) {
      console.error(`Failed to bulk import ${category} items:`, error);
      throw error;
    }
  },
};
