/**
 * Validate write configuration for database unit
 * @param {string} selectedDatabaseUnitId - Selected database unit ID
 * @param {Array} selectedUnitIds - Selected network unit IDs
 * @param {Array} databaseUnits - All database units
 * @param {Object} networkUnitSelectorRef - Reference to NetworkUnitSelector
 * @returns {Array} Array of validation error messages
 */
export const validateWriteConfiguration = (selectedDatabaseUnitId, selectedUnitIds, databaseUnits, networkUnitSelectorRef) => {
  const errors = [];

  if (!selectedDatabaseUnitId) {
    return errors; // No validation needed if no database unit selected
  }

  if (selectedUnitIds.length === 0) {
    errors.push("Please select at least one network unit");
    return errors;
  }

  if (selectedUnitIds.length > 1) {
    errors.push("Please select only one network unit when writing database configuration");
    return errors;
  }

  const databaseUnit = databaseUnits.find((unit) => unit.id === selectedDatabaseUnitId);
  if (!databaseUnit) {
    errors.push("Selected database unit not found");
    return errors;
  }

  const selectedNetworkUnits = networkUnitSelectorRef.current?.getSelectedUnits() || [];
  if (selectedNetworkUnits.length === 0) {
    errors.push("Selected network unit not found");
    return errors;
  }

  const networkUnit = selectedNetworkUnits[0];

  // Validate board type match
  if (databaseUnit.type !== networkUnit.type) {
    errors.push(`Board type mismatch: Database unit is ${databaseUnit.type}, Network unit is ${networkUnit.type}`);
  }

  // Get all network units for duplicate checking
  const allNetworkUnits = networkUnitSelectorRef.current?.getAllUnits() || [];

  // Check for duplicate IP address
  const duplicateIpUnits = allNetworkUnits.filter((unit) => unit.ip_address === databaseUnit.ip_address && unit.id !== networkUnit.id);
  if (duplicateIpUnits.length > 0) {
    errors.push(`IP address ${databaseUnit.ip_address} already exists on another network unit`);
  }

  // Check for duplicate CAN ID (excluding Stand Alone units)
  if (databaseUnit.mode !== "Stand-Alone") {
    const duplicateCanUnits = allNetworkUnits.filter(
      (unit) => unit.id_can === databaseUnit.id_can && unit.id !== networkUnit.id && unit.mode !== "Stand-Alone"
    );
    if (duplicateCanUnits.length > 0) {
      errors.push(`CAN ID ${databaseUnit.id_can} already exists on another network unit (excluding Stand-Alone units)`);
    }
  }

  // Check for multiple Masters on same CAN network
  if (databaseUnit.mode === "Master") {
    const canPrefix = databaseUnit.id_can.split(".").slice(0, 3).join(".");
    const masterUnits = allNetworkUnits.filter((unit) => unit.mode === "Master" && unit.id_can.startsWith(canPrefix) && unit.id !== networkUnit.id);
    if (masterUnits.length > 0) {
      errors.push(`Another Master unit already exists on CAN network ${canPrefix}.x`);
    }
  }

  return errors;
};
