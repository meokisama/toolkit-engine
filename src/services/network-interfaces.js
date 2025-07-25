import os from 'os';

/**
 * Network Interface Detection and Management Service
 * Provides utilities for discovering network interfaces and calculating broadcast addresses
 */
class NetworkInterfaceService {
  constructor() {
    this.cachedInterfaces = null;
    this.cacheTimestamp = null;
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Get all available network interfaces with their details
   * @param {boolean} forceRefresh - Force refresh of cached data
   * @returns {Array} Array of network interface objects
   */
  getNetworkInterfaces(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && this.cachedInterfaces && 
        this.cacheTimestamp && (now - this.cacheTimestamp) < this.cacheTimeout) {
      return this.cachedInterfaces;
    }

    const interfaces = os.networkInterfaces();
    const result = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
      // Skip loopback and non-IPv4 interfaces
      const ipv4Addresses = addresses.filter(addr => 
        addr.family === 'IPv4' && !addr.internal
      );

      for (const addr of ipv4Addresses) {
        const interfaceInfo = {
          name: name,
          address: addr.address,
          netmask: addr.netmask,
          mac: addr.mac,
          cidr: addr.cidr,
          broadcast: this.calculateBroadcastAddress(addr.address, addr.netmask),
          network: this.calculateNetworkAddress(addr.address, addr.netmask),
          isUp: !addr.internal,
          family: addr.family
        };

        result.push(interfaceInfo);
      }
    }

    // Cache the results
    this.cachedInterfaces = result;
    this.cacheTimestamp = now;

    console.log(`Found ${result.length} active IPv4 network interfaces:`, 
      result.map(iface => `${iface.name}: ${iface.address}/${this.cidrFromNetmask(iface.netmask)} -> ${iface.broadcast}`));

    return result;
  }

  /**
   * Calculate broadcast address from IP and netmask
   * @param {string} ip - IP address
   * @param {string} netmask - Subnet mask
   * @returns {string} Broadcast address
   */
  calculateBroadcastAddress(ip, netmask) {
    const ipParts = ip.split('.').map(Number);
    const maskParts = netmask.split('.').map(Number);
    
    const broadcastParts = ipParts.map((ipPart, index) => {
      const maskPart = maskParts[index];
      return ipPart | (255 - maskPart);
    });
    
    return broadcastParts.join('.');
  }

  /**
   * Calculate network address from IP and netmask
   * @param {string} ip - IP address
   * @param {string} netmask - Subnet mask
   * @returns {string} Network address
   */
  calculateNetworkAddress(ip, netmask) {
    const ipParts = ip.split('.').map(Number);
    const maskParts = netmask.split('.').map(Number);
    
    const networkParts = ipParts.map((ipPart, index) => {
      const maskPart = maskParts[index];
      return ipPart & maskPart;
    });
    
    return networkParts.join('.');
  }

  /**
   * Convert netmask to CIDR notation
   * @param {string} netmask - Subnet mask (e.g., "255.255.255.0")
   * @returns {number} CIDR prefix length (e.g., 24)
   */
  cidrFromNetmask(netmask) {
    const maskParts = netmask.split('.').map(Number);
    let cidr = 0;
    
    for (const part of maskParts) {
      let temp = part;
      while (temp > 0) {
        if (temp & 1) cidr++;
        temp = temp >> 1;
      }
    }
    
    return cidr;
  }

  /**
   * Get broadcast addresses for all active interfaces
   * @param {boolean} forceRefresh - Force refresh of interface data
   * @returns {Array} Array of broadcast addresses
   */
  getBroadcastAddresses(forceRefresh = false) {
    const interfaces = this.getNetworkInterfaces(forceRefresh);
    return interfaces.map(iface => iface.broadcast);
  }

  /**
   * Get network interfaces grouped by subnet
   * @param {boolean} forceRefresh - Force refresh of interface data
   * @returns {Object} Object with network addresses as keys and interfaces as values
   */
  getInterfacesBySubnet(forceRefresh = false) {
    const interfaces = this.getNetworkInterfaces(forceRefresh);
    const subnets = {};
    
    for (const iface of interfaces) {
      const subnetKey = `${iface.network}/${this.cidrFromNetmask(iface.netmask)}`;
      if (!subnets[subnetKey]) {
        subnets[subnetKey] = [];
      }
      subnets[subnetKey].push(iface);
    }
    
    return subnets;
  }

  /**
   * Check if an IP address is on the same subnet as any local interface
   * @param {string} targetIp - IP address to check
   * @returns {Object|null} Interface info if found, null otherwise
   */
  findInterfaceForTarget(targetIp) {
    const interfaces = this.getNetworkInterfaces();
    const targetParts = targetIp.split('.').map(Number);
    
    for (const iface of interfaces) {
      const ifaceParts = iface.address.split('.').map(Number);
      const maskParts = iface.netmask.split('.').map(Number);
      
      // Check if target IP is in the same subnet
      let sameSubnet = true;
      for (let i = 0; i < 4; i++) {
        if ((targetParts[i] & maskParts[i]) !== (ifaceParts[i] & maskParts[i])) {
          sameSubnet = false;
          break;
        }
      }
      
      if (sameSubnet) {
        return iface;
      }
    }
    
    return null;
  }

  /**
   * Get the best interface for communicating with a specific IP
   * @param {string} targetIp - Target IP address
   * @returns {Object|null} Best interface or null if none found
   */
  getBestInterfaceForTarget(targetIp) {
    // First try to find an interface on the same subnet
    const sameSubnetInterface = this.findInterfaceForTarget(targetIp);
    if (sameSubnetInterface) {
      return sameSubnetInterface;
    }
    
    // If no same-subnet interface found, return the first available interface
    const interfaces = this.getNetworkInterfaces();
    return interfaces.length > 0 ? interfaces[0] : null;
  }

  /**
   * Clear the interface cache
   */
  clearCache() {
    this.cachedInterfaces = null;
    this.cacheTimestamp = null;
  }

  /**
   * Get summary information about network interfaces
   * @returns {Object} Summary object with interface count and details
   */
  getSummary() {
    const interfaces = this.getNetworkInterfaces();
    const subnets = this.getInterfacesBySubnet();
    
    return {
      totalInterfaces: interfaces.length,
      totalSubnets: Object.keys(subnets).length,
      interfaces: interfaces.map(iface => ({
        name: iface.name,
        address: iface.address,
        cidr: `${iface.address}/${this.cidrFromNetmask(iface.netmask)}`,
        broadcast: iface.broadcast,
        network: iface.network
      })),
      subnets: Object.keys(subnets)
    };
  }
}

// Export singleton instance
export const networkInterfaceService = new NetworkInterfaceService();

// Export class for testing
export { NetworkInterfaceService };