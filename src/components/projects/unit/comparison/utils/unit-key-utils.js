/**
 * Unit key utilities - generates cache keys for units
 */

/**
 * Generate cache key for network unit
 * @param {Object} unit - Unit object with ip_address and id_can
 * @returns {string} Cache key
 */
export function getNetworkUnitCacheKey(unit) {
  return `${unit.ip_address}_${unit.id_can}`;
}

/**
 * Generate key for database unit
 * @param {Object} unit - Unit object with id
 * @returns {string} Unit key
 */
export function getDatabaseUnitKey(unit) {
  return `db_${unit.id}`;
}

/**
 * Generate key for network unit
 * @param {Object} unit - Unit object with ip_address and id_can
 * @returns {string} Unit key
 */
export function getNetworkUnitKey(unit) {
  return `net_${unit.ip_address}_${unit.id_can}`;
}
