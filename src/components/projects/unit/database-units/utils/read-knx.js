import { findOrCreateLightingByAddress } from "./config-helpers";

/**
 * Read KNX configurations from network unit and create them in database
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create KNX configs in
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<Array>} Created KNX configurations
 */
export const readKnxConfigurations = async (networkUnit, projectId, unitId) => {
  const createdKnxConfigs = [];

  try {
    console.log("Reading KNX configurations...");

    const result = await window.electronAPI.knxController.getKnxConfig({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
      knxAddress: null, // Get all KNX configs
    });

    if (result?.knxConfigs && result.knxConfigs.length > 0) {
      console.log(`Found ${result.knxConfigs.length} KNX configs on network unit`);

      for (const networkKnx of result.knxConfigs) {
        try {
          // Only process KNX configs with valid type (not 0)
          if (networkKnx.type === 0) {
            console.log(`Skipping KNX address ${networkKnx.address}: invalid type`);
            continue;
          }

          // Find or create corresponding RCU group (lighting item)
          const rcuGroup = await findOrCreateLightingByAddress(networkKnx.rcuGroup, projectId);

          // Create KNX config in database
          const knxData = {
            name: `KNX ${networkKnx.address}`,
            address: networkKnx.address,
            type: networkKnx.type,
            factor: networkKnx.factor || 1,
            feedback: networkKnx.feedback || 0,
            rcu_group_id: rcuGroup?.id || null,
            knx_switch_group: networkKnx.knxSwitchGroup || "",
            knx_dimming_group: networkKnx.knxDimmingGroup || "",
            knx_value_group: networkKnx.knxValueGroup || "",
            description: `Transferred from network unit ${networkUnit.ip_address}`,
            source_unit: unitId,
          };

          const createdKnx = await window.electronAPI.knx.create(projectId, knxData);

          createdKnxConfigs.push(createdKnx);
          console.log(`Created KNX config: ${createdKnx.name} (ID: ${createdKnx.id})`);

          // Add delay between KNX reads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Failed to process KNX address ${networkKnx.address}:`, error);
          // Continue with other KNX configs
        }
      }
    }

    console.log(`Successfully created ${createdKnxConfigs.length} KNX configs`);
    return createdKnxConfigs;
  } catch (error) {
    console.error("Failed to read KNX configurations:", error);
    return createdKnxConfigs;
  }
};
