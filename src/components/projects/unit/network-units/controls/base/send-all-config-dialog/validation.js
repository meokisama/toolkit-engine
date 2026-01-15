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

  // Check for duplicate IP + CAN ID combination (units are identified by both IP and CAN ID)
  const duplicateUnits = allNetworkUnits.filter(
    (unit) => unit.ip_address === databaseUnit.ip_address && unit.id_can === databaseUnit.id_can && unit.id !== networkUnit.id
  );
  if (duplicateUnits.length > 0) {
    errors.push(`IP address ${databaseUnit.ip_address} with CAN ID ${databaseUnit.id_can} already exists on another network unit`);
  }

  return errors;
};
