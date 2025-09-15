/**
 * Service for comparing configurations between database units and network units
 */

/**
 * Helper function to get address from device_id by looking up in project items
 * @param {number} deviceId - Device ID from database
 * @param {string} deviceType - Device type (lighting/aircon)
 * @param {Object} projectItems - Project items cache
 * @returns {string|null} Address of the device
 */
async function getAddressFromDeviceId(deviceId, deviceType, projectItems = null) {
  if (!deviceId || !deviceType) return null;

  try {
    // If we have project items cache, use it
    if (projectItems && projectItems[deviceType]) {
      const item = projectItems[deviceType].find(item => item.id === deviceId);
      return item ? item.address : null;
    }

    // Otherwise, try to get from electronAPI if available
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI[deviceType]) {
      // This would require project ID, which we don't have in comparison context
      // For now, return null and handle in the comparison logic
      return null;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to get address for device ${deviceId}:`, error);
    return null;
  }
}

/**
 * Compare RS485 configurations between database and network unit
 * @param {Object} databaseRS485 - RS485 config from database unit
 * @param {Object} networkRS485 - RS485 config from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareRS485Config(databaseRS485, networkRS485) {
  const differences = [];

  if (!databaseRS485 && !networkRS485) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseRS485 || !networkRS485) {
    return {
      isEqual: false,
      differences: ['One unit has RS485 config while the other does not']
    };
  }

  // Compare basic RS485 settings for both channels
  // Note: Both database and network should have the same format after conversion
  for (let i = 0; i < Math.max(databaseRS485.length || 0, networkRS485.length || 0); i++) {
    const dbConfig = databaseRS485[i];
    const netConfig = networkRS485[i];

    if (!dbConfig && !netConfig) continue;

    if (!dbConfig || !netConfig) {
      differences.push(`RS485 Channel ${i + 1}: Configuration exists in only one unit`);
      continue;
    }

    // Compare basic settings (both should use database format after conversion)
    const fieldsToCompare = [
      { name: 'baudrate', label: 'Baudrate' },
      { name: 'parity', label: 'Parity' },
      { name: 'stop_bit', label: 'Stop Bit' },
      { name: 'board_id', label: 'Board ID' },
      { name: 'config_type', label: 'RS485 Type' },
      { name: 'num_slave_devs', label: 'Number of Slaves' }
    ];

    fieldsToCompare.forEach(field => {
      if (dbConfig[field.name] !== netConfig[field.name]) {
        differences.push(
          `RS485 CH${i + 1} ${field.label}: DB=${dbConfig[field.name]}, Network=${netConfig[field.name]}`
        );
      }
    });

    // Skip reserved array comparison as it's not meaningful

    // Compare slave configurations only if there are slaves
    if (dbConfig.num_slave_devs > 0 || netConfig.num_slave_devs > 0) {
      const dbSlaves = dbConfig.slave_cfg || [];
      const netSlaves = netConfig.slave_cfg || [];

      // Compare actual number of configured slaves
      const dbActiveSlaves = dbSlaves.filter(slave => slave && slave.slave_id > 0);
      const netActiveSlaves = netSlaves.filter(slave => slave && slave.slave_id > 0);

      if (dbActiveSlaves.length !== netActiveSlaves.length) {
        differences.push(`RS485 CH${i + 1} Active Slaves count: DB=${dbActiveSlaves.length}, Network=${netActiveSlaves.length}`);
      }

      // Compare each active slave
      const maxSlaves = Math.max(dbActiveSlaves.length, netActiveSlaves.length);
      for (let j = 0; j < maxSlaves; j++) {
        const dbSlave = dbActiveSlaves[j];
        const netSlave = netActiveSlaves[j];

        if (!dbSlave && !netSlave) continue;

        if (!dbSlave || !netSlave) {
          differences.push(`RS485 CH${i + 1} Slave ${j + 1}: Configuration exists in only one unit`);
          continue;
        }

        // Compare slave basic properties
        const slaveFields = [
          { name: 'slave_id', label: 'Slave ID' },
          { name: 'slave_group', label: 'Slave Group' },
          { name: 'num_indoors', label: 'Number of Indoors' }
        ];

        slaveFields.forEach(field => {
          if (dbSlave[field.name] !== netSlave[field.name]) {
            differences.push(
              `RS485 CH${i + 1} Slave ${j + 1} ${field.label}: DB=${dbSlave[field.name]}, Network=${netSlave[field.name]}`
            );
          }
        });

        // Compare indoor groups only if there are indoors
        if (dbSlave.num_indoors > 0 || netSlave.num_indoors > 0) {
          // Ensure indoor_group is always an array
          const dbIndoorGroups = Array.isArray(dbSlave.indoor_group) ? dbSlave.indoor_group : [];
          const netIndoorGroups = Array.isArray(netSlave.indoor_group) ? netSlave.indoor_group : [];

          // Only compare the actual number of indoors, not the full array
          const dbUsedIndoors = dbIndoorGroups.slice(0, dbSlave.num_indoors);
          const netUsedIndoors = netIndoorGroups.slice(0, netSlave.num_indoors);

          for (let k = 0; k < Math.max(dbUsedIndoors.length, netUsedIndoors.length); k++) {
            if (k < dbUsedIndoors.length && k < netUsedIndoors.length) {
              if (dbUsedIndoors[k] !== netUsedIndoors[k]) {
                differences.push(`RS485 CH${i + 1} Slave ${j + 1} Indoor ${k + 1} Group: DB=${dbUsedIndoors[k]}, Network=${netUsedIndoors[k]}`);
              }
            } else if (k < dbUsedIndoors.length) {
              differences.push(`RS485 CH${i + 1} Slave ${j + 1} Indoor ${k + 1}: Only in Database (Group=${dbUsedIndoors[k]})`);
            } else {
              differences.push(`RS485 CH${i + 1} Slave ${j + 1} Indoor ${k + 1}: Only in Network (Group=${netUsedIndoors[k]})`);
            }
          }
        }
      }
    }
  }

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare input configurations between database and network unit
 * @param {Object} databaseInputs - Input configs from database unit
 * @param {Object} networkInputs - Input configs from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareInputConfigs(databaseInputs, networkInputs) {
  const differences = [];

  if (!databaseInputs && !networkInputs) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseInputs || !networkInputs) {
    return {
      isEqual: false,
      differences: ['One unit has input configs while the other does not']
    };
  }

  const dbInputs = databaseInputs.inputs || [];
  const netInputs = networkInputs.inputs || [];

  for (let i = 0; i < Math.max(dbInputs.length, netInputs.length); i++) {
    const dbInput = dbInputs[i];
    const netInput = netInputs[i];

    if (!dbInput && !netInput) continue;

    if (!dbInput || !netInput) {
      differences.push(`Input ${i + 1}: Configuration exists in only one unit`);
      continue;
    }

    // Compare input properties based on actual structure from transfer function
    const fieldsToCompare = [
      { name: 'index', label: 'Index' },
      { name: 'function_value', label: 'Function Value' },
      { name: 'lighting_id', label: 'Lighting ID' }
    ];

    fieldsToCompare.forEach(field => {
      if (dbInput[field.name] !== netInput[field.name]) {
        differences.push(
          `Input ${i + 1} ${field.label}: DB=${dbInput[field.name]}, Network=${netInput[field.name]}`
        );
      }
    });

    // Compare multi_group_config arrays - both should be arrays of objects with {groupId, presetBrightness}
    const dbGroups = dbInput.multi_group_config || [];
    const netGroups = netInput.multi_group_config || [];

    // Filter out invalid/empty groups (groups with groupId > 0)
    const dbActiveGroups = dbGroups.filter(group =>
      group && typeof group === 'object' && group.groupId > 0
    );
    const netActiveGroups = netGroups.filter(group =>
      group && typeof group === 'object' && group.groupId > 0
    );

    if (dbActiveGroups.length !== netActiveGroups.length) {
      differences.push(`Input ${i + 1} Active Multi-Group Count: DB=${dbActiveGroups.length}, Network=${netActiveGroups.length}`);
    } else {
      // Sort both arrays by groupId for consistent comparison
      const sortedDbGroups = [...dbActiveGroups].sort((a, b) => a.groupId - b.groupId);
      const sortedNetGroups = [...netActiveGroups].sort((a, b) => a.groupId - b.groupId);

      for (let j = 0; j < sortedDbGroups.length; j++) {
        const dbGroup = sortedDbGroups[j];
        const netGroup = sortedNetGroups[j];

        if (dbGroup.groupId !== netGroup.groupId) {
          differences.push(`Input ${i + 1} Multi-Group[${j}] Group ID: DB=${dbGroup.groupId}, Network=${netGroup.groupId}`);
        }

        if (dbGroup.presetBrightness !== netGroup.presetBrightness) {
          differences.push(`Input ${i + 1} Multi-Group[${j}] Preset Brightness: DB=${dbGroup.presetBrightness}, Network=${netGroup.presetBrightness}`);
        }
      }
    }

    // Compare rlc_config object
    const dbRlc = dbInput.rlc_config || {};
    const netRlc = netInput.rlc_config || {};

    const rlcFields = [
      { name: 'ramp', label: 'Ramp' },
      { name: 'preset', label: 'Preset' },
      { name: 'ledStatus', label: 'LED Status' },
      { name: 'autoMode', label: 'Auto Mode' },
      { name: 'delayOff', label: 'Delay Off' },
      { name: 'delayOn', label: 'Delay On' }
    ];

    rlcFields.forEach(field => {
      if (dbRlc[field.name] !== netRlc[field.name]) {
        differences.push(
          `Input ${i + 1} RLC ${field.label}: DB=${dbRlc[field.name]}, Network=${netRlc[field.name]}`
        );
      }
    });
  }

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare output configurations between database and network unit
 * @param {Object} databaseOutputs - Output configs from database unit
 * @param {Object} networkOutputs - Output configs from network unit
 * @param {Object} projectItems - Project items for device_id to address lookup
 * @returns {Object} Comparison result with differences
 */
export function compareOutputConfigs(databaseOutputs, networkOutputs, projectItems = null) {
  const differences = [];

  if (!databaseOutputs && !networkOutputs) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseOutputs || !networkOutputs) {
    return {
      isEqual: false,
      differences: ['One unit has output configs while the other does not']
    };
  }

  const dbOutputs = databaseOutputs.outputs || [];
  const netOutputs = networkOutputs.outputs || [];

  for (let i = 0; i < Math.max(dbOutputs.length, netOutputs.length); i++) {
    const dbOutput = dbOutputs[i];
    const netOutput = netOutputs[i];

    if (!dbOutput && !netOutput) continue;

    if (!dbOutput || !netOutput) {
      differences.push(`Output ${i + 1}: Configuration exists in only one unit`);
      continue;
    }

    // Compare output properties (skip device_id and name as they are not meaningful for comparison)
    const fieldsToCompare = [
      { name: 'index', label: 'Index' },
      { name: 'type', label: 'Type' },
      { name: 'device_type', label: 'Device Type' }
    ];

    fieldsToCompare.forEach(field => {
      if (dbOutput[field.name] !== netOutput[field.name]) {
        differences.push(
          `Output ${i + 1} ${field.label}: DB=${dbOutput[field.name]}, Network=${netOutput[field.name]}`
        );
      }
    });

    // Compare addresses - convert database device_id to address for comparison
    let dbAddress = null;
    let netAddress = null;

    // Get database address from device_id
    if (dbOutput.device_id && projectItems) {
      const deviceType = dbOutput.device_type === 'aircon' ? 'aircon' : 'lighting';
      if (projectItems[deviceType]) {
        const item = projectItems[deviceType].find(item => item.id === dbOutput.device_id);
        dbAddress = item ? parseInt(item.address) : null;

        // Debug logging for AC outputs
        if (dbOutput.type === 'ac') {
          console.log(`AC Output ${i + 1} device_id lookup:`, {
            device_id: dbOutput.device_id,
            deviceType,
            availableItems: projectItems[deviceType]?.length || 0,
            foundItem: !!item,
            itemAddress: item?.address,
            resolvedAddress: dbAddress
          });
        }
      }
    }

    // Get network address based on output type
    if (dbOutput.type === 'ac' || netOutput.type === 'ac') {
      // For AC outputs, address comes from AC config, not from assignment
      netAddress = netOutput.config?.address || 0;
    } else {
      // For lighting outputs, address comes from config
      netAddress = netOutput.config?.address;
    }

    // Convert addresses for comparison
    // For both AC and lighting: treat 0 and null as equivalent (unassigned)
    const dbAddressStr = dbAddress && dbAddress > 0 ? dbAddress.toString() : '0';
    const netAddressStr = netAddress && netAddress > 0 ? netAddress.toString() : '0';

    // Only report address differences if they are meaningful
    if (dbAddressStr !== netAddressStr) {
      if (dbOutput.type === 'ac' || netOutput.type === 'ac') {
        // For AC outputs, show AC Address comparison
        const dbDisplayValue = dbAddressStr === '0' ? 'unassigned' : dbAddressStr;
        const netDisplayValue = netAddressStr === '0' ? 'unassigned' : netAddressStr;
        differences.push(
          `Output ${i + 1} AC Address: DB=${dbDisplayValue}, Network=${netDisplayValue}`
        );
      } else {
        // For lighting outputs, only report if both are not unassigned (0)
        // Skip reporting if both DB and Network are unassigned (0)
        if (!(dbAddressStr === '0' && netAddressStr === '0')) {
          const dbDisplayValue = dbAddressStr === '0' ? 'unassigned' : dbAddressStr;
          const netDisplayValue = netAddressStr === '0' ? 'unassigned' : netAddressStr;
          differences.push(
            `Output ${i + 1} Address: DB=${dbDisplayValue} (device_id=${dbOutput.device_id}), Network=${netDisplayValue}`
          );
        }
      }
    }

    // Compare config object based on output type
    const dbConfig = dbOutput.config || {};
    const netConfig = netOutput.config || {};

    if (dbOutput.type === 'ac' || netOutput.type === 'ac') {
      // Compare aircon-specific config fields (address is handled separately above)
      const acConfigFields = [
        { name: 'enable', label: 'Enable' },
        { name: 'windowMode', label: 'Window Mode' },
        { name: 'fanType', label: 'Fan Type' },
        { name: 'tempType', label: 'Temp Type' },
        { name: 'tempUnit', label: 'Temp Unit' },
        { name: 'valveContact', label: 'Valve Contact' },
        { name: 'valveType', label: 'Valve Type' },
        { name: 'deadband', label: 'Deadband' },
        { name: 'lowFCU_Group', label: 'Low FCU Group' },
        { name: 'medFCU_Group', label: 'Med FCU Group' },
        { name: 'highFCU_Group', label: 'High FCU Group' },
        { name: 'fanAnalogGroup', label: 'Fan Analog Group' },
        { name: 'analogCoolGroup', label: 'Analog Cool Group' },
        { name: 'analogHeatGroup', label: 'Analog Heat Group' },
        { name: 'valveCoolOpenGroup', label: 'Valve Cool Open Group' },
        { name: 'valveCoolCloseGroup', label: 'Valve Cool Close Group' },
        { name: 'valveHeatOpenGroup', label: 'Valve Heat Open Group' },
        { name: 'valveHeatCloseGroup', label: 'Valve Heat Close Group' },
        { name: 'windowBypass', label: 'Window Bypass' },
        { name: 'setPointOffset', label: 'Set Point Offset' },
        { name: 'unoccupyPower', label: 'Unoccupy Power' },
        { name: 'occupyPower', label: 'Occupy Power' },
        { name: 'standbyPower', label: 'Standby Power' },
        { name: 'unoccupyMode', label: 'Unoccupy Mode' },
        { name: 'occupyMode', label: 'Occupy Mode' },
        { name: 'standbyMode', label: 'Standby Mode' },
        { name: 'unoccupyFanSpeed', label: 'Unoccupy Fan Speed' },
        { name: 'occupyFanSpeed', label: 'Occupy Fan Speed' },
        { name: 'standbyFanSpeed', label: 'Standby Fan Speed' },
        { name: 'unoccupyCoolSetPoint', label: 'Unoccupy Cool Set Point' },
        { name: 'occupyCoolSetPoint', label: 'Occupy Cool Set Point' },
        { name: 'standbyCoolSetPoint', label: 'Standby Cool Set Point' },
        { name: 'unoccupyHeatSetPoint', label: 'Unoccupy Heat Set Point' },
        { name: 'occupyHeatSetPoint', label: 'Occupy Heat Set Point' },
        { name: 'standbyHeatSetPoint', label: 'Standby Heat Set Point' }
      ];

      acConfigFields.forEach(field => {
        if (dbConfig[field.name] !== netConfig[field.name]) {
          differences.push(
            `Output ${i + 1} AC ${field.label}: DB=${dbConfig[field.name]}, Network=${netConfig[field.name]}`
          );
        }
      });
    } else {
      // Compare lighting/relay/dimmer config fields
      const lightingConfigFields = [
        { name: 'autoTrigger', label: 'Auto Trigger' },
        { name: 'delayOffHours', label: 'Delay Off Hours' },
        { name: 'delayOffMinutes', label: 'Delay Off Minutes' },
        { name: 'delayOffSeconds', label: 'Delay Off Seconds' },
        { name: 'delayOnHours', label: 'Delay On Hours' },
        { name: 'delayOnMinutes', label: 'Delay On Minutes' },
        { name: 'delayOnSeconds', label: 'Delay On Seconds' },
        { name: 'scheduleOnHour', label: 'Schedule On Hour' },
        { name: 'scheduleOnMinute', label: 'Schedule On Minute' },
        { name: 'scheduleOffHour', label: 'Schedule Off Hour' },
        { name: 'scheduleOffMinute', label: 'Schedule Off Minute' },
        { name: 'minDim', label: 'Min Dim' },
        { name: 'maxDim', label: 'Max Dim' }
      ];

      lightingConfigFields.forEach(field => {
        if (dbConfig[field.name] !== netConfig[field.name]) {
          differences.push(
            `Output ${i + 1} Lighting ${field.label}: DB=${dbConfig[field.name]}, Network=${netConfig[field.name]}`
          );
        }
      });
    }
  }

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare scene configurations between database and network unit
 * @param {Array} databaseScenes - Scenes from database unit
 * @param {Array} networkScenes - Scenes from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareScenes(databaseScenes, networkScenes) {
  const differences = [];

  if (!databaseScenes && !networkScenes) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseScenes || !networkScenes) {
    return {
      isEqual: false,
      differences: ['One unit has scenes while the other does not']
    };
  }

  const dbScenes = Array.isArray(databaseScenes) ? databaseScenes : [];
  const netScenes = Array.isArray(networkScenes) ? networkScenes : [];

  // Create maps for easier comparison by address
  const dbSceneMap = new Map();
  const netSceneMap = new Map();

  dbScenes.forEach(scene => {
    if (scene.address !== undefined) {
      dbSceneMap.set(scene.address, scene);
    }
  });

  netScenes.forEach(scene => {
    if (scene.address !== undefined) {
      netSceneMap.set(scene.address, scene);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbSceneMap.keys(), ...netSceneMap.keys()]);

  // Compare scene count
  if (dbScenes.length !== netScenes.length) {
    differences.push(`Scene count: DB=${dbScenes.length}, Network=${netScenes.length}`);
  }

  // Compare scenes by address
  allAddresses.forEach(address => {
    const dbScene = dbSceneMap.get(address);
    const netScene = netSceneMap.get(address);

    if (!dbScene && !netScene) return;

    if (!dbScene) {
      differences.push(`Scene Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netScene) {
      differences.push(`Scene Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare scene properties
    if (dbScene.name !== netScene.name) {
      differences.push(`Scene ${address} Name: DB="${dbScene.name}", Network="${netScene.name}"`);
    }

    // Compare scene items in detail
    const dbItems = dbScene.items || [];
    const netItems = netScene.items || [];

    if (dbItems.length !== netItems.length) {
      differences.push(`Scene ${address} Item count: DB=${dbItems.length}, Network=${netItems.length}`);
    } else {
      // Compare individual scene items
      for (let i = 0; i < dbItems.length; i++) {
        const dbItem = dbItems[i];
        const netItem = netItems[i];

        if (!dbItem && !netItem) continue;

        if (!dbItem || !netItem) {
          differences.push(`Scene ${address} Item ${i + 1}: Exists in only one unit`);
          continue;
        }

        // Compare scene item properties
        const itemFields = [
          { name: 'object_type', label: 'Object Type' },
          { name: 'object_address', label: 'Object Address' },
          { name: 'object_value', label: 'Object Value' },
          { name: 'delay', label: 'Delay' }
        ];

        itemFields.forEach(field => {
          if (dbItem[field.name] !== netItem[field.name]) {
            differences.push(
              `Scene ${address} Item ${i + 1} ${field.label}: DB=${dbItem[field.name]}, Network=${netItem[field.name]}`
            );
          }
        });
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare schedule configurations between database and network unit
 * @param {Array} databaseSchedules - Schedules from database unit
 * @param {Array} networkSchedules - Schedules from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareSchedules(databaseSchedules, networkSchedules) {
  const differences = [];

  if (!databaseSchedules && !networkSchedules) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseSchedules || !networkSchedules) {
    return {
      isEqual: false,
      differences: ['One unit has schedules while the other does not']
    };
  }

  const dbSchedules = Array.isArray(databaseSchedules) ? databaseSchedules : [];
  const netSchedules = Array.isArray(networkSchedules) ? networkSchedules : [];

  // Create maps for easier comparison by address
  const dbScheduleMap = new Map();
  const netScheduleMap = new Map();

  dbSchedules.forEach(schedule => {
    if (schedule.address !== undefined) {
      dbScheduleMap.set(schedule.address, schedule);
    }
  });

  netSchedules.forEach(schedule => {
    if (schedule.address !== undefined) {
      netScheduleMap.set(schedule.address, schedule);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbScheduleMap.keys(), ...netScheduleMap.keys()]);

  // Compare schedule count
  if (dbSchedules.length !== netSchedules.length) {
    differences.push(`Schedule count: DB=${dbSchedules.length}, Network=${netSchedules.length}`);
  }

  // Compare schedules by address
  allAddresses.forEach(address => {
    const dbSchedule = dbScheduleMap.get(address);
    const netSchedule = netScheduleMap.get(address);

    if (!dbSchedule && !netSchedule) return;

    if (!dbSchedule) {
      differences.push(`Schedule Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netSchedule) {
      differences.push(`Schedule Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare schedule properties
    const scheduleFields = [
      { name: 'name', label: 'Name' },
      { name: 'enabled', label: 'Enabled' },
      { name: 'repeat_type', label: 'Repeat Type' },
      { name: 'start_date', label: 'Start Date' },
      { name: 'end_date', label: 'End Date' },
      { name: 'days_of_week', label: 'Days of Week' },
      { name: 'time_slots', label: 'Time Slots' }
    ];

    scheduleFields.forEach(field => {
      if (field.name === 'days_of_week' || field.name === 'time_slots') {
        // Compare arrays
        const dbArray = dbSchedule[field.name] || [];
        const netArray = netSchedule[field.name] || [];

        if (JSON.stringify(dbArray) !== JSON.stringify(netArray)) {
          differences.push(
            `Schedule ${address} ${field.label}: DB=${JSON.stringify(dbArray)}, Network=${JSON.stringify(netArray)}`
          );
        }
      } else {
        if (dbSchedule[field.name] !== netSchedule[field.name]) {
          differences.push(
            `Schedule ${address} ${field.label}: DB="${dbSchedule[field.name]}", Network="${netSchedule[field.name]}"`
          );
        }
      }
    });

    // Compare schedule scenes
    const dbScenes = dbSchedule.scenes || [];
    const netScenes = netSchedule.scenes || [];

    if (dbScenes.length !== netScenes.length) {
      differences.push(`Schedule ${address} Scene count: DB=${dbScenes.length}, Network=${netScenes.length}`);
    } else {
      for (let i = 0; i < dbScenes.length; i++) {
        const dbScene = dbScenes[i];
        const netScene = netScenes[i];

        if (dbScene.scene_address !== netScene.scene_address) {
          differences.push(
            `Schedule ${address} Scene ${i + 1} Address: DB=${dbScene.scene_address}, Network=${netScene.scene_address}`
          );
        }
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare curtain configurations between database and network unit
 * @param {Array} databaseCurtains - Curtains from database unit
 * @param {Array} networkCurtains - Curtains from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareCurtains(databaseCurtains, networkCurtains) {
  const differences = [];

  if (!databaseCurtains && !networkCurtains) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseCurtains || !networkCurtains) {
    return {
      isEqual: false,
      differences: ['One unit has curtains while the other does not']
    };
  }

  const dbCurtains = Array.isArray(databaseCurtains) ? databaseCurtains : [];
  const netCurtains = Array.isArray(networkCurtains) ? networkCurtains : [];

  // Filter out disabled curtains (type = 0) from both database and network
  // This matches the behavior for other disabled configurations
  const validDbCurtains = dbCurtains.filter(curtain => curtain.type !== 0);
  const validNetCurtains = netCurtains.filter(curtain => curtain.type !== 0);

  // Create maps for easier comparison by address
  const dbCurtainMap = new Map();
  const netCurtainMap = new Map();

  validDbCurtains.forEach(curtain => {
    if (curtain.address !== undefined) {
      dbCurtainMap.set(curtain.address, curtain);
    }
  });

  validNetCurtains.forEach(curtain => {
    if (curtain.address !== undefined) {
      netCurtainMap.set(curtain.address, curtain);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbCurtainMap.keys(), ...netCurtainMap.keys()]);

  // Compare curtain count (using filtered arrays)
  if (validDbCurtains.length !== validNetCurtains.length) {
    differences.push(`Curtain count: DB=${validDbCurtains.length}, Network=${validNetCurtains.length}`);
  }

  // Compare curtains by address
  allAddresses.forEach(address => {
    const dbCurtain = dbCurtainMap.get(address);
    const netCurtain = netCurtainMap.get(address);

    if (!dbCurtain && !netCurtain) return;

    if (!dbCurtain) {
      differences.push(`Curtain Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netCurtain) {
      differences.push(`Curtain Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare curtain properties (skip name as it's not meaningful for comparison)
    const fieldsToCompare = [
      { name: 'type', label: 'Type' },
      { name: 'runtime', label: 'Runtime' }
    ];

    fieldsToCompare.forEach(field => {
      if (dbCurtain[field.name] !== netCurtain[field.name]) {
        differences.push(
          `Curtain ${address} ${field.label}: DB=${dbCurtain[field.name]}, Network=${netCurtain[field.name]}`
        );
      }
    });
  });

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare multi scene configurations between database and network unit
 * @param {Array} databaseMultiScenes - Multi scenes from database
 * @param {Array} networkMultiScenes - Multi scenes from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareMultiScenes(databaseMultiScenes, networkMultiScenes) {
  const differences = [];

  if (!databaseMultiScenes && !networkMultiScenes) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseMultiScenes || !networkMultiScenes) {
    return {
      isEqual: false,
      differences: ['One unit has multi scenes while the other does not']
    };
  }

  const dbMultiScenes = Array.isArray(databaseMultiScenes) ? databaseMultiScenes : [];
  const netMultiScenes = Array.isArray(networkMultiScenes) ? networkMultiScenes : [];

  // Create maps for easier comparison by address
  const dbMultiSceneMap = new Map();
  const netMultiSceneMap = new Map();

  dbMultiScenes.forEach(multiScene => {
    if (multiScene.address !== undefined) {
      dbMultiSceneMap.set(multiScene.address, multiScene);
    }
  });

  netMultiScenes.forEach(multiScene => {
    if (multiScene.address !== undefined) {
      netMultiSceneMap.set(multiScene.address, multiScene);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbMultiSceneMap.keys(), ...netMultiSceneMap.keys()]);

  // Compare multi scene count
  if (dbMultiScenes.length !== netMultiScenes.length) {
    differences.push(`Multi Scene count: DB=${dbMultiScenes.length}, Network=${netMultiScenes.length}`);
  }

  // Compare multi scenes by address
  allAddresses.forEach(address => {
    const dbMultiScene = dbMultiSceneMap.get(address);
    const netMultiScene = netMultiSceneMap.get(address);

    if (!dbMultiScene && !netMultiScene) return;

    if (!dbMultiScene) {
      differences.push(`Multi Scene Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netMultiScene) {
      differences.push(`Multi Scene Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare multi scene properties
    const multiSceneFields = [
      { name: 'name', label: 'Name' },
      { name: 'type', label: 'Type' }
    ];

    multiSceneFields.forEach(field => {
      if (dbMultiScene[field.name] !== netMultiScene[field.name]) {
        differences.push(
          `Multi Scene ${address} ${field.label}: DB="${dbMultiScene[field.name]}", Network="${netMultiScene[field.name]}"`
        );
      }
    });

    // Compare multi scene scenes
    const dbScenes = dbMultiScene.scenes || [];
    const netScenes = netMultiScene.scenes || [];

    if (dbScenes.length !== netScenes.length) {
      differences.push(`Multi Scene ${address} Scene count: DB=${dbScenes.length}, Network=${netScenes.length}`);
    } else {
      for (let i = 0; i < dbScenes.length; i++) {
        const dbScene = dbScenes[i];
        const netScene = netScenes[i];

        if (dbScene.scene_address !== netScene.scene_address) {
          differences.push(
            `Multi Scene ${address} Scene ${i + 1} Address: DB=${dbScene.scene_address}, Network=${netScene.scene_address}`
          );
        }
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare sequence configurations between database and network unit
 * @param {Array} databaseSequences - Sequences from database
 * @param {Array} networkSequences - Sequences from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareSequences(databaseSequences, networkSequences) {
  const differences = [];

  if (!databaseSequences && !networkSequences) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseSequences || !networkSequences) {
    return {
      isEqual: false,
      differences: ['One unit has sequences while the other does not']
    };
  }

  const dbSequences = Array.isArray(databaseSequences) ? databaseSequences : [];
  const netSequences = Array.isArray(networkSequences) ? networkSequences : [];

  // Create maps for easier comparison by address
  const dbSequenceMap = new Map();
  const netSequenceMap = new Map();

  dbSequences.forEach(sequence => {
    if (sequence.address !== undefined) {
      dbSequenceMap.set(sequence.address, sequence);
    }
  });

  netSequences.forEach(sequence => {
    if (sequence.address !== undefined) {
      netSequenceMap.set(sequence.address, sequence);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbSequenceMap.keys(), ...netSequenceMap.keys()]);

  // Compare sequence count
  if (dbSequences.length !== netSequences.length) {
    differences.push(`Sequence count: DB=${dbSequences.length}, Network=${netSequences.length}`);
  }

  // Compare sequences by address
  allAddresses.forEach(address => {
    const dbSequence = dbSequenceMap.get(address);
    const netSequence = netSequenceMap.get(address);

    if (!dbSequence && !netSequence) return;

    if (!dbSequence) {
      differences.push(`Sequence Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netSequence) {
      differences.push(`Sequence Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare sequence properties
    if (dbSequence.name !== netSequence.name) {
      differences.push(`Sequence ${address} Name: DB="${dbSequence.name}", Network="${netSequence.name}"`);
    }

    // Compare sequence multi scenes
    const dbMultiScenes = dbSequence.multiScenes || [];
    const netMultiScenes = netSequence.multiScenes || [];

    if (dbMultiScenes.length !== netMultiScenes.length) {
      differences.push(`Sequence ${address} Multi Scene count: DB=${dbMultiScenes.length}, Network=${netMultiScenes.length}`);
    } else {
      for (let i = 0; i < dbMultiScenes.length; i++) {
        const dbMultiScene = dbMultiScenes[i];
        const netMultiScene = netMultiScenes[i];

        if (dbMultiScene.multi_scene_address !== netMultiScene.multi_scene_address) {
          differences.push(
            `Sequence ${address} Multi Scene ${i + 1} Address: DB=${dbMultiScene.multi_scene_address}, Network=${netMultiScene.multi_scene_address}`
          );
        }
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Compare KNX configurations between database and network unit
 * @param {Array} databaseKnx - KNX configs from database
 * @param {Array} networkKnx - KNX configs from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareKnx(databaseKnx, networkKnx) {
  const differences = [];

  if (!databaseKnx && !networkKnx) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseKnx || !networkKnx) {
    return {
      isEqual: false,
      differences: ['One unit has KNX configs while the other does not']
    };
  }

  const dbKnx = Array.isArray(databaseKnx) ? databaseKnx : [];
  const netKnx = Array.isArray(networkKnx) ? networkKnx : [];

  // Filter out disabled KNX configs (type = 0) from both database and network
  // This matches the behavior in KNX Control dialog
  const validDbKnx = dbKnx.filter(knx => knx.type !== 0);
  const validNetKnx = netKnx.filter(knx => knx.type !== 0);

  // Create maps for easier comparison by address
  const dbKnxMap = new Map();
  const netKnxMap = new Map();

  validDbKnx.forEach(knx => {
    if (knx.address !== undefined) {
      dbKnxMap.set(knx.address, knx);
    }
  });

  validNetKnx.forEach(knx => {
    if (knx.address !== undefined) {
      netKnxMap.set(knx.address, knx);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbKnxMap.keys(), ...netKnxMap.keys()]);

  // Compare KNX count (using filtered arrays)
  if (validDbKnx.length !== validNetKnx.length) {
    differences.push(`KNX count: DB=${validDbKnx.length}, Network=${validNetKnx.length}`);
  }

  // Compare KNX configs by address
  allAddresses.forEach(address => {
    const dbKnxConfig = dbKnxMap.get(address);
    const netKnxConfig = netKnxMap.get(address);

    if (!dbKnxConfig && !netKnxConfig) return;

    if (!dbKnxConfig) {
      differences.push(`KNX Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netKnxConfig) {
      differences.push(`KNX Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare KNX properties (skip name as it's not meaningful for comparison)
    const knxFields = [
      { name: 'type', label: 'Type' },
      { name: 'factor', label: 'Factor' },
      { name: 'feedback', label: 'Feedback' },
      { name: 'knx_switch_group', label: 'KNX Switch Group' },
      { name: 'knx_dimming_group', label: 'KNX Dimming Group' },
      { name: 'knx_value_group', label: 'KNX Value Group' }
    ];

    knxFields.forEach(field => {
      // Handle different field names between database and network
      let dbValue = dbKnxConfig[field.name];
      let netValue = netKnxConfig[field.name];

      // Map network field names to database field names
      if (field.name === 'knx_switch_group' && netValue === undefined) {
        netValue = netKnxConfig.knxSwitchGroup;
      }
      if (field.name === 'knx_dimming_group' && netValue === undefined) {
        netValue = netKnxConfig.knxDimmingGroup;
      }
      if (field.name === 'knx_value_group' && netValue === undefined) {
        netValue = netKnxConfig.knxValueGroup;
      }

      // For KNX group fields, treat null and empty string as equivalent
      if (field.name.includes('knx_') && field.name.includes('_group')) {
        // Normalize values: treat null, undefined, and empty string as equivalent
        const normalizeGroupValue = (value) => {
          if (value === null || value === undefined || value === '' || value === 'null') {
            return '';
          }
          return value;
        };

        dbValue = normalizeGroupValue(dbValue);
        netValue = normalizeGroupValue(netValue);
      }

      if (dbValue !== netValue) {
        differences.push(
          `KNX ${address} ${field.label}: DB="${dbValue}", Network="${netValue}"`
        );
      }
    });

    // Compare RCU group - need to handle the relationship
    // Database stores rcu_group_id, network stores rcuGroup address
    if (dbKnxConfig.rcu_group_id && netKnxConfig.rcuGroup) {
      // This would require looking up the RCU group address from the database
      // For now, we'll skip this comparison or implement it later
    }
  });

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Find matching units between database and network based on board type, CAN ID, and IP address
 * @param {Array} databaseUnits - Units from database
 * @param {Array} networkUnits - Units from network
 * @returns {Array} Array of matching unit pairs
 */
export function findMatchingUnits(databaseUnits, networkUnits) {
  const matches = [];

  databaseUnits.forEach(dbUnit => {
    const matchingNetworkUnit = networkUnits.find(netUnit =>
      dbUnit.type === netUnit.type &&
      dbUnit.id_can === netUnit.id_can &&
      dbUnit.ip_address === netUnit.ip_address
    );

    if (matchingNetworkUnit) {
      matches.push({
        databaseUnit: dbUnit,
        networkUnit: matchingNetworkUnit,
        matchType: 'exact'
      });
    }
  });

  return matches;
}

/**
 * Compare all configurations between a database unit and network unit
 * @param {Object} databaseUnit - Database unit with all configurations
 * @param {Object} networkUnit - Network unit with all configurations
 * @param {Object} projectItems - Project items for device_id to address lookup
 * @param {Object} databaseConfigs - Database configurations (scenes, schedules, curtains, knx, multiScenes, sequences)
 * @returns {Object} Complete comparison result
 */
export async function compareUnitConfigurations(databaseUnit, networkUnit, projectItems = null, databaseConfigs = null) {
  const allDifferences = [];
  let hasAnyDifferences = false;

  // Compare basic unit properties (skip CAN Load and Recovery Mode as they are equivalent)
  const basicFields = [
    { name: 'type', label: 'Board Type' },
    { name: 'id_can', label: 'CAN ID' },
    { name: 'ip_address', label: 'IP Address' },
    { name: 'mode', label: 'Mode' }
  ];

  basicFields.forEach(field => {
    if (databaseUnit[field.name] !== networkUnit[field.name]) {
      allDifferences.push(`${field.label}: DB=${databaseUnit[field.name]}, Network=${networkUnit[field.name]}`);
      hasAnyDifferences = true;
    }
  });

  // Special handling for CAN Load (0 == false, 1 == true)
  const dbCanLoad = databaseUnit.can_load;
  const netCanLoad = networkUnit.can_load;
  if ((dbCanLoad === 0 || dbCanLoad === false) !== (netCanLoad === 0 || netCanLoad === false)) {
    allDifferences.push(`CAN Load: DB=${dbCanLoad}, Network=${netCanLoad}`);
    hasAnyDifferences = true;
  }

  // Special handling for Recovery Mode (0 == false, 1 == true)
  const dbRecoveryMode = databaseUnit.recovery_mode;
  const netRecoveryMode = networkUnit.recovery_mode;
  if ((dbRecoveryMode === 0 || dbRecoveryMode === false) !== (netRecoveryMode === 0 || netRecoveryMode === false)) {
    allDifferences.push(`Recovery Mode: DB=${dbRecoveryMode}, Network=${netRecoveryMode}`);
    hasAnyDifferences = true;
  }

  // Compare RS485 configurations
  const rs485Comparison = compareRS485Config(databaseUnit.rs485_config, networkUnit.rs485_config);
  if (!rs485Comparison.isEqual) {
    allDifferences.push(...rs485Comparison.differences.map(diff => `RS485: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare input configurations
  const inputComparison = compareInputConfigs(databaseUnit.input_configs, networkUnit.input_configs);
  if (!inputComparison.isEqual) {
    allDifferences.push(...inputComparison.differences.map(diff => `Input: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare output configurations
  const outputComparison = compareOutputConfigs(databaseUnit.output_configs, networkUnit.output_configs, projectItems);
  if (!outputComparison.isEqual) {
    allDifferences.push(...outputComparison.differences.map(diff => `Output: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare scenes (use databaseConfigs instead of databaseUnit.scenes)
  const sceneComparison = compareScenes(databaseConfigs?.scenes, networkUnit.scenes);
  if (!sceneComparison.isEqual) {
    allDifferences.push(...sceneComparison.differences.map(diff => `Scene: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare schedules (use databaseConfigs instead of databaseUnit.schedules)
  const scheduleComparison = compareSchedules(databaseConfigs?.schedules, networkUnit.schedules);
  if (!scheduleComparison.isEqual) {
    allDifferences.push(...scheduleComparison.differences.map(diff => `Schedule: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare curtains (use databaseConfigs instead of databaseUnit.curtains)
  const curtainComparison = compareCurtains(databaseConfigs?.curtains, networkUnit.curtains);
  if (!curtainComparison.isEqual) {
    allDifferences.push(...curtainComparison.differences.map(diff => `Curtain: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare multi scenes
  const multiSceneComparison = compareMultiScenes(databaseConfigs?.multiScenes, networkUnit.multiScenes);
  if (!multiSceneComparison.isEqual) {
    allDifferences.push(...multiSceneComparison.differences.map(diff => `Multi Scene: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare sequences
  const sequenceComparison = compareSequences(databaseConfigs?.sequences, networkUnit.sequences);
  if (!sequenceComparison.isEqual) {
    allDifferences.push(...sequenceComparison.differences.map(diff => `Sequence: ${diff}`));
    hasAnyDifferences = true;
  }

  // Compare KNX configurations
  const knxComparison = compareKnx(databaseConfigs?.knx, networkUnit.knxConfigs);
  if (!knxComparison.isEqual) {
    allDifferences.push(...knxComparison.differences.map(diff => `KNX: ${diff}`));
    hasAnyDifferences = true;
  }

  return {
    isEqual: !hasAnyDifferences,
    differences: allDifferences,
    comparisonDetails: {
      basic: { isEqual: allDifferences.filter(d => !d.includes(':')).length === 0 },
      rs485: rs485Comparison,
      input: inputComparison,
      output: outputComparison,
      scenes: sceneComparison,
      schedules: scheduleComparison,
      curtains: curtainComparison,
      multiScenes: multiSceneComparison,
      sequences: sequenceComparison,
      knx: knxComparison
    }
  };
}
