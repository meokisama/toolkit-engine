import { RS485 } from "@/constants/rs485";
import { UNIT_TYPES } from "@/constants/unit";

/**
 * Create a default RS485 configuration
 */
export const createDefaultRS485Config = () => ({
  baudrate: 9600,
  parity: 0,
  stop_bit: 0,
  board_id: 1,
  config_type: 0,
  num_slave_devs: 0,
  reserved: [0, 0, 0, 0, 0],
  slave_cfg: Array.from({ length: RS485.SLAVE_MAX_DEVS }, () => ({
    slave_id: 1,
    slave_group: 0,
    num_indoors: 0,
    indoor_group: Array.from({ length: RS485.SLAVE_MAX_INDOORS }, () => 0),
  })),
});

/**
 * Create a default slave configuration
 */
export const createDefaultSlaveConfig = () => ({
  slave_id: 1,
  slave_group: 0,
  num_indoors: 0,
  indoor_group: Array.from({ length: RS485.SLAVE_MAX_INDOORS }, () => 0),
});

/**
 * Validate RS485 configuration
 */
export const validateRS485Config = (config) => {
  const errors = [];

  if (!config) {
    errors.push("Configuration is required");
    return errors;
  }

  // Validate baudrate
  const validBaudrates = RS485.BAUDRATES.map((b) => b.value);
  if (!validBaudrates.includes(config.baudrate)) {
    errors.push("Invalid baudrate");
  }

  // Validate parity
  if (config.parity < 0 || config.parity > 2) {
    errors.push("Invalid parity value");
  }

  // Validate stop bit
  if (config.stop_bit < 0 || config.stop_bit > 1) {
    errors.push("Invalid stop bit value");
  }

  // Validate board ID
  if (config.board_id < 1 || config.board_id > 255) {
    errors.push("Board ID must be between 1 and 255");
  }

  // Validate config type (0 = None/not selected, or valid RS485 type)
  const validTypes = [0, ...RS485.TYPES.map((t) => t.value)];
  if (!validTypes.includes(config.config_type)) {
    errors.push("Invalid RS485 type");
  }

  // Validate number of slave devices
  if (config.num_slave_devs < 0 || config.num_slave_devs > RS485.SLAVE_MAX_DEVS) {
    errors.push(`Number of slave devices must be between 0 and ${RS485.SLAVE_MAX_DEVS}`);
  }

  // Validate slave configurations
  if (config.slave_cfg && config.num_slave_devs > 0) {
    for (let i = 0; i < config.num_slave_devs; i++) {
      const slave = config.slave_cfg[i];
      if (!slave) {
        errors.push(`Slave ${i + 1} configuration is missing`);
        continue;
      }

      // Validate slave ID
      if (slave.slave_id < 1 || slave.slave_id > 255) {
        errors.push(`Slave ${i + 1} ID must be between 1 and 255`);
      }

      // Validate slave group
      if (slave.slave_group < 0 || slave.slave_group > 255) {
        errors.push(`Slave ${i + 1} group must be between 0 and 255`);
      }

      // Validate number of indoors
      if (slave.num_indoors < 0 || slave.num_indoors > RS485.SLAVE_MAX_INDOORS) {
        errors.push(`Slave ${i + 1} number of indoors must be between 0 and ${RS485.SLAVE_MAX_INDOORS}`);
      }

      // Validate indoor groups
      if (slave.indoor_group && slave.num_indoors > 0) {
        for (let j = 0; j < slave.num_indoors; j++) {
          const indoorGroup = slave.indoor_group[j];
          if (indoorGroup < 0 || indoorGroup > 255) {
            errors.push(`Slave ${i + 1} indoor ${j + 1} group must be between 0 and 255`);
          }
        }
      }
    }
  }

  return errors;
};

/**
 * Serialize RS485 configuration to string format (similar to C# implementation)
 */
export const serializeRS485Config = (configs) => {
  if (!configs || configs.length === 0) {
    return ["RS485,0"];
  }

  const result = [`RS485,${configs.length}`];

  configs.forEach((config, index) => {
    let configStr = `RS485-${index + 1}`;

    // Add main config fields
    configStr += `,${config.baudrate}`;
    configStr += `,${config.parity}`;
    configStr += `,${config.stop_bit}`;
    configStr += `,${config.board_id}`;
    configStr += `,${config.config_type}`;
    configStr += `,${config.num_slave_devs}`;

    // Add reserved bytes
    config.reserved.forEach((byte) => {
      configStr += `,${byte}`;
    });

    // Add slave configurations
    config.slave_cfg.forEach((slave) => {
      configStr += `,${slave.slave_id}`;
      configStr += `,${slave.slave_group}`;
      configStr += `,${slave.num_indoors}`;

      // Add indoor groups (ensure exactly 16 values)
      const indoorGroups = Array.isArray(slave.indoor_group) ? slave.indoor_group : Array.from({ length: RS485.SLAVE_MAX_INDOORS }, () => 0);

      // Ensure we have exactly 16 values
      for (let k = 0; k < RS485.SLAVE_MAX_INDOORS; k++) {
        const group = indoorGroups[k] || 0;
        configStr += `,${group}`;
      }
    });

    result.push(configStr);
  });

  return result;
};

/**
 * Deserialize RS485 configuration from string format
 */
export const deserializeRS485Config = (configStrings) => {
  if (!configStrings || configStrings.length === 0) {
    return [];
  }

  const firstLine = configStrings[0];
  if (!firstLine.startsWith("RS485,")) {
    throw new Error("Invalid RS485 configuration format");
  }

  const numConfigs = parseInt(firstLine.split(",")[1]);
  if (numConfigs === 0) {
    return [];
  }

  const configs = [];

  for (let i = 1; i <= numConfigs && i < configStrings.length; i++) {
    const configStr = configStrings[i];
    const parts = configStr.split(",");

    if (parts.length < 7) {
      throw new Error(`Invalid RS485-${i} configuration format`);
    }

    let index = 1; // Skip "RS485-X" part

    const config = {
      baudrate: parseInt(parts[index++]),
      parity: parseInt(parts[index++]),
      stop_bit: parseInt(parts[index++]),
      board_id: parseInt(parts[index++]),
      config_type: parseInt(parts[index++]),
      num_slave_devs: parseInt(parts[index++]),
      reserved: [],
      slave_cfg: [],
    };

    // Read reserved bytes
    for (let j = 0; j < 5; j++) {
      config.reserved.push(parseInt(parts[index++]));
    }

    // Read slave configurations
    for (let j = 0; j < RS485.SLAVE_MAX_DEVS; j++) {
      const slave = {
        slave_id: parseInt(parts[index++]),
        slave_group: parseInt(parts[index++]),
        num_indoors: parseInt(parts[index++]),
        indoor_group: [],
      };

      // Read indoor groups
      for (let k = 0; k < RS485.SLAVE_MAX_INDOORS; k++) {
        slave.indoor_group.push(parseInt(parts[index++]));
      }

      config.slave_cfg.push(slave);
    }

    configs.push(config);
  }

  return configs;
};

/**
 * Check if a unit type supports RS485
 */
// Derived from UNIT_TYPES: by default a unit supports RS485 (`rs485: false` to opt out)
// and is not slave-only (`slaveOnly: true` to opt in).
const RS485_SUPPORTED = new Set(UNIT_TYPES.filter((u) => u.rs485 !== false).map((u) => u.name));
export const supportsRS485 = (unitType) => RS485_SUPPORTED.has(unitType);
/**
 * Check if a unit type is forced to Slave mode only
 */
const SLAVE_ONLY = new Set(UNIT_TYPES.filter((u) => u.slaveOnly).map((u) => u.name));
export const isSlaveOnlyUnit = (unitType) => SLAVE_ONLY.has(unitType);
/**
 * Get RS485 type label by value
 */
export const getRS485TypeLabel = (value) => {
  if (value === 0) {
    return "None";
  }
  const type = RS485.TYPES.find((t) => t.value === value);
  return type ? type.label : "Unknown";
};

/**
 * Check if RS485 type is slave
 */
export const isSlaveType = (configType) => {
  const type = RS485.TYPES.find((t) => t.value === configType);
  return type ? type.label.includes("SLAVE") : false;
};

/**
 * Check if RS485 type is none (not selected)
 * When no RS485 type is selected, config_type defaults to 0
 */
export const isNoneType = (configType) => {
  return configType === 0;
};

/**
 * Get unit type constraints for mode selection and checkboxes
 * Based on C# WinForms Add_Unit logic
 */
export const getUnitTypeConstraints = (unitType) => {
  const isSlaveOnly = isSlaveOnlyUnit(unitType);

  return {
    // Mode constraints
    modes: {
      master: !isSlaveOnly,
      slave: true,
      standAlone: !isSlaveOnly,
    },
    // Default mode when unit type is selected
    defaultMode: isSlaveOnly ? "Slave" : "Stand-Alone",
    // Checkbox constraints
    checkboxes: {
      canLoad: !isSlaveOnly, // Enabled for non-slave-only units
      recovery: !isSlaveOnly, // Enabled for non-slave-only units
    },
    // Default checkbox values for slave-only units
    defaultValues: isSlaveOnly
      ? {
          canLoad: false,
          recovery: false,
        }
      : null,
  };
};

/**
 * Get mode-specific constraints for checkboxes
 * Based on C# WinForms rbtn_*_CheckedChanged logic
 */
export const getModeConstraints = (mode) => {
  switch (mode) {
    case "Master":
      return {
        canLoad: {
          enabled: false,
          value: true,
        },
        recovery: {
          enabled: true,
          value: null, // Keep current value
        },
      };
    case "Slave":
      return {
        canLoad: {
          enabled: true,
          value: false,
        },
        recovery: {
          enabled: true,
          value: null, // Keep current value
        },
      };
    case "Stand-Alone":
      return {
        canLoad: {
          enabled: true,
          value: false,
        },
        recovery: {
          enabled: true,
          value: null, // Keep current value
        },
      };
    default:
      return {
        canLoad: {
          enabled: true,
          value: null,
        },
        recovery: {
          enabled: true,
          value: null,
        },
      };
  }
};
