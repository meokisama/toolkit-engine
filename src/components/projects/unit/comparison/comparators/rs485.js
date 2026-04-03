import { createDiff, nullCheck } from "./helpers";

export function compareRS485Config(databaseRS485, networkRS485) {
  const early = nullCheck(databaseRS485, networkRS485, "rs485");
  if (early) return early;

  const differences = [];

  for (let i = 0; i < Math.max(databaseRS485.length || 0, networkRS485.length || 0); i++) {
    const dbConfig = databaseRS485[i];
    const netConfig = networkRS485[i];

    if (!dbConfig && !netConfig) continue;

    if (!dbConfig || !netConfig) {
      differences.push(createDiff("rs485", `Channel ${i + 1}`, dbConfig ? "present" : "missing", netConfig ? "present" : "missing"));
      continue;
    }

    const ch = `CH${i + 1}`;
    const fields = [
      { name: "baudrate", label: `${ch} Baudrate` },
      { name: "parity", label: `${ch} Parity` },
      { name: "stop_bit", label: `${ch} Stop Bit` },
      { name: "board_id", label: `${ch} Board ID` },
      { name: "config_type", label: `${ch} Type` },
      { name: "num_slave_devs", label: `${ch} Slave Count` },
    ];

    fields.forEach(({ name, label }) => {
      if (dbConfig[name] !== netConfig[name]) {
        differences.push(createDiff("rs485", label, dbConfig[name], netConfig[name]));
      }
    });

    if (dbConfig.num_slave_devs > 0 || netConfig.num_slave_devs > 0) {
      const dbActiveSlaves = (dbConfig.slave_cfg || []).filter((s) => s && s.slave_id > 0);
      const netActiveSlaves = (netConfig.slave_cfg || []).filter((s) => s && s.slave_id > 0);

      if (dbActiveSlaves.length !== netActiveSlaves.length) {
        differences.push(createDiff("rs485", `${ch} Active Slaves`, dbActiveSlaves.length, netActiveSlaves.length));
      }

      for (let j = 0; j < Math.max(dbActiveSlaves.length, netActiveSlaves.length); j++) {
        const dbSlave = dbActiveSlaves[j];
        const netSlave = netActiveSlaves[j];
        const sl = `${ch} Slave ${j + 1}`;

        if (!dbSlave || !netSlave) {
          differences.push(createDiff("rs485", sl, dbSlave ? "present" : "missing", netSlave ? "present" : "missing"));
          continue;
        }

        [
          { name: "slave_id", label: `${sl} ID` },
          { name: "slave_group", label: `${sl} Group` },
          { name: "num_indoors", label: `${sl} Indoor Count` },
        ].forEach(({ name, label }) => {
          if (dbSlave[name] !== netSlave[name]) {
            differences.push(createDiff("rs485", label, dbSlave[name], netSlave[name]));
          }
        });

        if (dbSlave.num_indoors > 0 || netSlave.num_indoors > 0) {
          const dbIndoors = Array.isArray(dbSlave.indoor_group) ? dbSlave.indoor_group.slice(0, dbSlave.num_indoors) : [];
          const netIndoors = Array.isArray(netSlave.indoor_group) ? netSlave.indoor_group.slice(0, netSlave.num_indoors) : [];

          for (let k = 0; k < Math.max(dbIndoors.length, netIndoors.length); k++) {
            if (dbIndoors[k] !== netIndoors[k]) {
              differences.push(createDiff("rs485", `${sl} Indoor ${k + 1} Group`, dbIndoors[k], netIndoors[k]));
            }
          }
        }
      }
    }
  }

  return { isEqual: differences.length === 0, differences };
}
