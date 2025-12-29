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
      differences: ["One unit has RS485 config while the other does not"],
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
      { name: "baudrate", label: "Baudrate" },
      { name: "parity", label: "Parity" },
      { name: "stop_bit", label: "Stop Bit" },
      { name: "board_id", label: "Board ID" },
      { name: "config_type", label: "RS485 Type" },
      { name: "num_slave_devs", label: "Number of Slaves" },
    ];

    fieldsToCompare.forEach((field) => {
      if (dbConfig[field.name] !== netConfig[field.name]) {
        differences.push(`RS485 CH${i + 1} ${field.label}: DB=${dbConfig[field.name]}, Network=${netConfig[field.name]}`);
      }
    });

    // Skip reserved array comparison as it's not meaningful

    // Compare slave configurations only if there are slaves
    if (dbConfig.num_slave_devs > 0 || netConfig.num_slave_devs > 0) {
      const dbSlaves = dbConfig.slave_cfg || [];
      const netSlaves = netConfig.slave_cfg || [];

      // Compare actual number of configured slaves
      const dbActiveSlaves = dbSlaves.filter((slave) => slave && slave.slave_id > 0);
      const netActiveSlaves = netSlaves.filter((slave) => slave && slave.slave_id > 0);

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
          { name: "slave_id", label: "Slave ID" },
          { name: "slave_group", label: "Slave Group" },
          { name: "num_indoors", label: "Number of Indoors" },
        ];

        slaveFields.forEach((field) => {
          if (dbSlave[field.name] !== netSlave[field.name]) {
            differences.push(`RS485 CH${i + 1} Slave ${j + 1} ${field.label}: DB=${dbSlave[field.name]}, Network=${netSlave[field.name]}`);
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
    differences,
  };
}
