/**
 * Utility functions for IP address operations
 */

/**
 * Convert IP address string to a comparable number
 * @param {string} ip - IP address string (e.g., "192.168.1.2")
 * @returns {number} - Numeric representation for comparison
 */
export function ipToNumber(ip) {
  if (!ip || typeof ip !== "string") {
    return 0;
  }

  const parts = ip.split(".");
  if (parts.length !== 4) {
    return 0;
  }

  return parts.reduce((acc, part, index) => {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) {
      return acc;
    }
    return acc + (num << (8 * (3 - index)));
  }, 0);
}

/**
 * Compare two IP addresses for sorting
 * @param {string} ipA - First IP address
 * @param {string} ipB - Second IP address
 * @returns {number} - Comparison result (-1, 0, 1)
 */
export function compareIpAddresses(ipA, ipB) {
  const numA = ipToNumber(ipA);
  const numB = ipToNumber(ipB);

  if (numA < numB) return -1;
  if (numA > numB) return 1;
  return 0;
}

/**
 * Sort an array of objects by IP address
 * @param {Array} items - Array of objects with ip_address property
 * @param {string} ipField - Field name containing IP address (default: 'ip_address')
 * @returns {Array} - Sorted array
 */
export function sortByIpAddress(items, ipField = "ip_address") {
  if (!Array.isArray(items)) {
    return items;
  }

  return [...items].sort((a, b) => {
    const ipA = a[ipField];
    const ipB = b[ipField];
    return compareIpAddresses(ipA, ipB);
  });
}
