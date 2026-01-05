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
      differences: ["One unit has output configs while the other does not"],
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
      { name: "index", label: "Index" },
      { name: "type", label: "Type" },
      { name: "device_type", label: "Device Type" },
    ];

    fieldsToCompare.forEach((field) => {
      if (dbOutput[field.name] !== netOutput[field.name]) {
        differences.push(`Output ${i + 1} ${field.label}: DB=${dbOutput[field.name]}, Network=${netOutput[field.name]}`);
      }
    });

    // Compare addresses - convert database device_id to address for comparison
    let dbAddress = null;
    let netAddress = null;

    // Get database address from device_id
    if (dbOutput.device_id && projectItems) {
      const deviceType = dbOutput.device_type === "aircon" ? "aircon" : "lighting";
      if (projectItems[deviceType]) {
        const item = projectItems[deviceType].find((item) => item.id === dbOutput.device_id);
        dbAddress = item ? parseInt(item.address) : null;

        // Debug logging for AC outputs
        if (dbOutput.type === "ac") {
          console.log(`AC Output ${i + 1} device_id lookup:`, {
            device_id: dbOutput.device_id,
            deviceType,
            availableItems: projectItems[deviceType]?.length || 0,
            foundItem: !!item,
            itemAddress: item?.address,
            resolvedAddress: dbAddress,
          });
        }
      }
    }

    // Get network address based on output type
    if (dbOutput.type === "ac" || netOutput.type === "ac") {
      // For AC outputs, address comes from AC config, not from assignment
      netAddress = netOutput.config?.address || 0;
    } else {
      // For lighting outputs, address comes from config
      netAddress = netOutput.config?.address;
    }

    // Convert addresses for comparison
    // For both AC and lighting: treat 0 and null as equivalent (unassigned)
    const dbAddressStr = dbAddress && dbAddress > 0 ? dbAddress.toString() : "0";
    const netAddressStr = netAddress && netAddress > 0 ? netAddress.toString() : "0";

    // Only report address differences if they are meaningful
    if (dbAddressStr !== netAddressStr) {
      if (dbOutput.type === "ac" || netOutput.type === "ac") {
        // For AC outputs, show AC Address comparison
        const dbDisplayValue = dbAddressStr === "0" ? "unassigned" : dbAddressStr;
        const netDisplayValue = netAddressStr === "0" ? "unassigned" : netAddressStr;
        differences.push(`Output ${i + 1} AC Address: DB=${dbDisplayValue}, Network=${netDisplayValue}`);
      } else {
        // For lighting outputs, only report if both are not unassigned (0)
        // Skip reporting if both DB and Network are unassigned (0)
        if (!(dbAddressStr === "0" && netAddressStr === "0")) {
          const dbDisplayValue = dbAddressStr === "0" ? "unassigned" : dbAddressStr;
          const netDisplayValue = netAddressStr === "0" ? "unassigned" : netAddressStr;
          differences.push(`Output ${i + 1} Address: DB=${dbDisplayValue} (device_id=${dbOutput.device_id}), Network=${netDisplayValue}`);
        }
      }
    }

    // Compare config object based on output type
    const dbConfig = dbOutput.config || {};
    const netConfig = netOutput.config || {};

    if (dbOutput.type === "ac" || netOutput.type === "ac") {
      // Compare aircon-specific config fields (address is handled separately above)
      const acConfigFields = [
        { name: "enable", label: "Enable" },
        { name: "windowMode", label: "Window Mode" },
        { name: "fanType", label: "Fan Type" },
        { name: "tempType", label: "Temp Type" },
        { name: "tempUnit", label: "Temp Unit" },
        { name: "valveContact", label: "Valve Contact" },
        { name: "valveType", label: "Valve Type" },
        { name: "deadband", label: "Deadband" },
        { name: "lowFCU_Group", label: "Low FCU Group" },
        { name: "medFCU_Group", label: "Med FCU Group" },
        { name: "highFCU_Group", label: "High FCU Group" },
        { name: "fanAnalogGroup", label: "Fan Analog Group" },
        { name: "analogCoolGroup", label: "Analog Cool Group" },
        { name: "analogHeatGroup", label: "Analog Heat Group" },
        { name: "valveCoolOpenGroup", label: "Valve Cool Open Group" },
        { name: "valveCoolCloseGroup", label: "Valve Cool Close Group" },
        { name: "valveHeatOpenGroup", label: "Valve Heat Open Group" },
        { name: "valveHeatCloseGroup", label: "Valve Heat Close Group" },
        { name: "windowBypass", label: "Window Bypass" },
        { name: "setPointOffset", label: "Set Point Offset" },
        { name: "unoccupyPower", label: "Unoccupy Power" },
        { name: "occupyPower", label: "Occupy Power" },
        { name: "standbyPower", label: "Standby Power" },
        { name: "unoccupyMode", label: "Unoccupy Mode" },
        { name: "occupyMode", label: "Occupy Mode" },
        { name: "standbyMode", label: "Standby Mode" },
        { name: "unoccupyFanSpeed", label: "Unoccupy Fan Speed" },
        { name: "occupyFanSpeed", label: "Occupy Fan Speed" },
        { name: "standbyFanSpeed", label: "Standby Fan Speed" },
        { name: "unoccupyCoolSetPoint", label: "Unoccupy Cool Set Point" },
        { name: "occupyCoolSetPoint", label: "Occupy Cool Set Point" },
        { name: "standbyCoolSetPoint", label: "Standby Cool Set Point" },
        { name: "unoccupyHeatSetPoint", label: "Unoccupy Heat Set Point" },
        { name: "occupyHeatSetPoint", label: "Occupy Heat Set Point" },
        { name: "standbyHeatSetPoint", label: "Standby Heat Set Point" },
      ];

      acConfigFields.forEach((field) => {
        if (dbConfig[field.name] !== netConfig[field.name]) {
          differences.push(`Output ${i + 1} AC ${field.label}: DB=${dbConfig[field.name]}, Network=${netConfig[field.name]}`);
        }
      });
    } else {
      // Compare lighting/relay/dimmer config fields
      const lightingConfigFields = [
        { name: "autoTrigger", label: "Auto Trigger" },
        { name: "delayOffHours", label: "Delay Off Hours" },
        { name: "delayOffMinutes", label: "Delay Off Minutes" },
        { name: "delayOffSeconds", label: "Delay Off Seconds" },
        { name: "delayOnHours", label: "Delay On Hours" },
        { name: "delayOnMinutes", label: "Delay On Minutes" },
        { name: "delayOnSeconds", label: "Delay On Seconds" },
        { name: "scheduleOnHour", label: "Schedule On Hour" },
        { name: "scheduleOnMinute", label: "Schedule On Minute" },
        { name: "scheduleOffHour", label: "Schedule Off Hour" },
        { name: "scheduleOffMinute", label: "Schedule Off Minute" },
        { name: "minDim", label: "Min Dim" },
        { name: "maxDim", label: "Max Dim" },
      ];

      lightingConfigFields.forEach((field) => {
        if (dbConfig[field.name] !== netConfig[field.name]) {
          differences.push(`Output ${i + 1} Lighting ${field.label}: DB=${dbConfig[field.name]}, Network=${netConfig[field.name]}`);
        }
      });
    }
  }

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
