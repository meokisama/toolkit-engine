/**
 * Get project configurations based on selected config types and source unit
 * @param {Object} selectedProject - Selected project object
 * @param {Object} configTypes - Object with config type flags
 * @param {string} selectedSourceUnitId - Selected source unit ID or "all"
 * @returns {Promise<Object>} Object containing filtered configurations
 */
export const getProjectConfigurations = async (selectedProject, configTypes, selectedSourceUnitId) => {
  try {
    if (!selectedProject) {
      throw new Error("No project selected");
    }

    const configs = {};

    // Helper function to filter items by source unit
    const filterBySourceUnit = (items) => {
      if (selectedSourceUnitId === "all") {
        return items;
      }
      const sourceUnitIdNum = parseInt(selectedSourceUnitId);
      return items.filter((item) => item.source_unit === sourceUnitIdNum);
    };

    if (configTypes.scenes) {
      const scenes = await window.electronAPI.scene.getAll(selectedProject.id);
      // Filter by source unit, then add calculated index
      const filteredScenes = filterBySourceUnit(scenes);
      configs.scenes = filteredScenes.map((scene, index) => ({
        ...scene,
        calculatedIndex: index,
      }));
    }
    if (configTypes.schedules) {
      const schedules = await window.electronAPI.schedule.getAll(selectedProject.id);
      // Filter by source unit, then add calculated index
      const filteredSchedules = filterBySourceUnit(schedules);
      configs.schedules = filteredSchedules.map((schedule, index) => ({
        ...schedule,
        calculatedIndex: index,
      }));
    }
    if (configTypes.multiScenes) {
      const multiScenes = await window.electronAPI.multiScenes.getAll(selectedProject.id);
      // Filter by source unit, then add calculated index
      const filteredMultiScenes = filterBySourceUnit(multiScenes);
      configs.multiScenes = filteredMultiScenes.map((multiScene, index) => ({
        ...multiScene,
        calculatedIndex: index,
      }));
    }
    if (configTypes.sequences) {
      const sequences = await window.electronAPI.sequences.getAll(selectedProject.id);
      // Filter by source unit, then add calculated index
      const filteredSequences = filterBySourceUnit(sequences);
      configs.sequences = filteredSequences.map((sequence, index) => ({
        ...sequence,
        calculatedIndex: index,
      }));
    }
    if (configTypes.knx) {
      const knx = await window.electronAPI.knx.getAll(selectedProject.id);
      // Filter by source unit (knx doesn't need calculatedIndex)
      configs.knx = filterBySourceUnit(knx);
    }
    if (configTypes.curtain) {
      const curtains = await window.electronAPI.curtain.getAll(selectedProject.id);
      // Filter by source unit, then add calculated index
      const filteredCurtains = filterBySourceUnit(curtains);
      configs.curtain = filteredCurtains.map((curtain, index) => ({
        ...curtain,
        calculatedIndex: index,
      }));
    }

    return configs;
  } catch (error) {
    console.error("Failed to get project configurations:", error);
    throw error;
  }
};

/**
 * Send configuration to a specific unit
 * @param {Object} unit - Network unit object
 * @param {string} configType - Type of configuration (scenes, schedules, etc.)
 * @param {Array} configData - Configuration data to send
 * @param {Object} selectedProject - Selected project object
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendConfigToUnit = async (unit, configType, configData, selectedProject) => {
  try {
    switch (configType) {
      case "scenes":
        for (const scene of configData) {
          // Get scene items with details for each scene
          let sceneItems = [];
          try {
            sceneItems = await window.electronAPI.scene.getItemsWithDetails(scene.id);
          } catch (error) {
            console.error(`Failed to load items for scene ${scene.id}:`, error);
            // Skip scenes without items
            continue;
          }

          // Prepare scene items data for sending (same as manual send)
          const sceneItemsData = sceneItems.map((item) => ({
            object_value: item.object_value || 0,
            item_address: item.item_address || "0",
            item_value: item.item_value || "0",
          }));

          await window.electronAPI.sceneController.setupScene(unit.ip_address, unit.id_can, {
            sceneIndex: scene.calculatedIndex ?? 0,
            sceneName: scene.name,
            sceneAddress: scene.address,
            sceneItems: sceneItemsData,
          });
        }
        break;

      case "schedules":
        for (const schedule of configData) {
          // Get schedule data with scenes for each schedule (same as manual send)
          let scheduleData = null;
          try {
            scheduleData = await window.electronAPI.schedule.getForSending(schedule.id);
          } catch (error) {
            console.error(`Failed to load data for schedule ${schedule.id}:`, error);
            // Skip schedules without data
            continue;
          }

          await window.electronAPI.schedule.send({
            unitIp: unit.ip_address,
            canId: unit.id_can,
            scheduleIndex: schedule.calculatedIndex ?? 0,
            enabled: scheduleData.enabled,
            weekDays: scheduleData.parsedDays,
            hour: scheduleData.hour,
            minute: scheduleData.minute,
            sceneAddresses: scheduleData.sceneAddresses,
          });
        }
        break;

      case "multiScenes":
        for (const multiScene of configData) {
          // Get multi-scene scenes for each multi-scene (same as manual send)
          let multiSceneScenes = [];
          try {
            multiSceneScenes = await window.electronAPI.multiScenes.getScenes(multiScene.id);
          } catch (error) {
            console.error(`Failed to load scenes for multi-scene ${multiScene.id}:`, error);
            // Skip multi-scenes without scenes
            continue;
          }

          // Extract scene addresses (same as manual send)
          const sceneAddresses = multiSceneScenes.map((s) => s.scene_address);

          await window.electronAPI.multiScenesController.setupMultiScene(unit.ip_address, unit.id_can, {
            multiSceneIndex: multiScene.calculatedIndex ?? 0,
            multiSceneName: multiScene.name,
            multiSceneAddress: multiScene.address,
            multiSceneType: multiScene.type,
            sceneAddresses,
          });
        }
        break;

      case "sequences":
        for (const sequence of configData) {
          // Get sequence multi-scenes for each sequence (same as manual send)
          let sequenceMultiScenes = [];
          try {
            sequenceMultiScenes = await window.electronAPI.sequences.getMultiScenes(sequence.id);
          } catch (error) {
            console.error(`Failed to load multi-scenes for sequence ${sequence.id}:`, error);
            // Skip sequences without multi-scenes
            continue;
          }

          // Extract multi-scene addresses (same as manual send)
          const multiSceneAddresses = sequenceMultiScenes.map((s) => s.multi_scene_address);

          await window.electronAPI.sequenceController.setupSequence(unit.ip_address, unit.id_can, {
            sequenceIndex: sequence.calculatedIndex ?? 0,
            sequenceAddress: sequence.address,
            multiSceneAddresses,
          });
        }
        break;

      case "knx":
        // Get all project items for RCU group lookup
        const lightingItems = await window.electronAPI.lighting.getAll(selectedProject.id);
        const curtainItems = await window.electronAPI.curtain.getAll(selectedProject.id);
        const sceneItems = await window.electronAPI.scene.getAll(selectedProject.id);
        const multiSceneItems = await window.electronAPI.multiScenes.getAll(selectedProject.id);
        const sequenceItems = await window.electronAPI.sequences.getAll(selectedProject.id);
        const airconItems = await window.electronAPI.aircon.getAll(selectedProject.id);

        for (const knx of configData) {
          // Get RCU group based on KNX type
          let rcuGroup = null;

          switch (knx.type) {
            case 1: // Switch
            case 2: // Dimmer
              rcuGroup = lightingItems.find((item) => item.id === knx.rcu_group_id);
              break;
            case 3: // Curtain
              rcuGroup = curtainItems.find((item) => item.id === knx.rcu_group_id);
              break;
            case 4: // Scene
              rcuGroup = sceneItems.find((item) => item.id === knx.rcu_group_id);
              break;
            case 5: // Multi Scene
              rcuGroup = multiSceneItems.find((item) => item.id === knx.rcu_group_id);
              break;
            case 6: // Sequences
              rcuGroup = sequenceItems.find((item) => item.id === knx.rcu_group_id);
              break;
            case 7: // AC Power
            case 8: // AC Mode
            case 9: // AC Fan Speed
            case 10: // AC Swing
            case 11: // AC Set Point
              rcuGroup = airconItems.find((item) => item.id === knx.rcu_group_id);
              break;
            default:
              rcuGroup = lightingItems.find((item) => item.id === knx.rcu_group_id);
              break;
          }

          if (rcuGroup) {
            await window.electronAPI.knxController.setKnxConfig(
              unit.ip_address,
              unit.id_can,
              {
                address: knx.address,
                type: knx.type,
                factor: knx.factor || 1,
                feedback: knx.feedback || 0,
                rcuGroup: rcuGroup.address,
                knxSwitchGroup: knx.knx_switch_group || "",
                knxDimmingGroup: knx.knx_dimming_group || "",
                knxValueGroup: knx.knx_value_group || "",
                knxStatusGroup: knx.knx_status_group || "",
              },
              unit.type || "Unknown Unit" // Pass unit type for logging
            );
          }
        }
        break;

      case "curtain":
        // Get lighting items once for all curtain configs (optimization)
        const curtainLightingItems = await window.electronAPI.lighting.getAll(selectedProject.id);

        for (const curtain of configData) {
          // Get lighting groups for curtain
          const openGroup = curtainLightingItems.find((item) => item.id === curtain.open_group_id);
          const closeGroup = curtainLightingItems.find((item) => item.id === curtain.close_group_id);
          const stopGroup = curtainLightingItems.find((item) => item.id === curtain.stop_group_id);

          if (openGroup && closeGroup) {
            // Use curtain_value directly from database (more reliable than lookup)
            const curtainTypeValue = curtain.curtain_value || 0;

            await window.electronAPI.curtainController.setCurtainConfig(unit.ip_address, unit.id_can, {
              index: curtain.calculatedIndex ?? 0,
              address: parseInt(curtain.address),
              curtainType: curtainTypeValue,
              pausePeriod: curtain.pause_period || 0,
              transitionPeriod: curtain.transition_period || 0,
              openGroup: parseInt(openGroup.address),
              closeGroup: parseInt(closeGroup.address),
              stopGroup: stopGroup ? parseInt(stopGroup.address) : 0,
            });
          }
        }
        break;

      default:
        throw new Error(`Unknown config type: ${configType}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Failed to send ${configType} to unit ${unit.ip_address}:`, error);
    return { success: false, error: error.message };
  }
};
