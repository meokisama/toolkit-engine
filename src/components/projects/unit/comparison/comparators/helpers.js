/**
 * Create a structured difference object
 * @param {string} category - Category for grouping (e.g. "rs485", "input", "scene")
 * @param {string} label - Human-readable field name
 * @param {*} dbValue - Value from database unit
 * @param {*} networkValue - Value from network unit
 * @returns {{ category: string, label: string, dbValue: *, networkValue: * }}
 */
export function createDiff(category, label, dbValue, networkValue) {
  return { category, label, dbValue, networkValue };
}

/**
 * Early-exit null check for comparator functions.
 * Returns a result object if one or both sides are missing, null if comparison should proceed.
 * @param {*} db - Database side data
 * @param {*} net - Network side data
 * @param {string} category - Category for the diff
 * @returns {{ isEqual: boolean, differences: Array }|null}
 */
export function nullCheck(db, net, category) {
  if (!db && !net) return { isEqual: true, differences: [] };
  if (!db || !net) {
    return {
      isEqual: false,
      differences: [createDiff(category, "Configuration", db ? "present" : "missing", net ? "present" : "missing")],
    };
  }
  return null;
}
