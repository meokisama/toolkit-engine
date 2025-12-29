import { findOrCreateLightingByAddress, getCurtainTypeName } from "../utils/config-helpers";

/**
 * Read curtain configurations from network unit and create them in database
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create curtains in
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<Array>} Created curtains
 */
export const readCurtainConfigurations = async (networkUnit, projectId, unitId) => {
  const createdCurtains = [];

  try {
    const result = await window.electronAPI.curtainController.getCurtainConfig({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
      curtainIndex: null, // Get all curtains
    });

    if (result?.curtains && result.curtains.length > 0) {
      for (const networkCurtain of result.curtains) {
        try {
          // Only process curtains with valid type (not 0)
          if (networkCurtain.curtainType === 0) {
            continue;
          }
          const openGroup = await findOrCreateLightingByAddress(networkCurtain.openGroup, projectId);
          const closeGroup = await findOrCreateLightingByAddress(networkCurtain.closeGroup, projectId);
          const stopGroup =
            networkCurtain.stopGroup && networkCurtain.stopGroup > 0
              ? await findOrCreateLightingByAddress(networkCurtain.stopGroup, projectId)
              : null;

          // Create curtain in database
          const curtainTypeName = getCurtainTypeName(networkCurtain.curtainType);

          const curtainData = {
            name: `Curtain ${networkCurtain.address}`,
            address: networkCurtain.address.toString(),
            description: `Transferred from network unit ${networkUnit.ip_address}`,
            object_type: "OBJ_CURTAIN",
            object_value: 2, // CURTAIN object value
            curtain_type: curtainTypeName,
            curtain_value: networkCurtain.curtainType,
            open_group_id: openGroup?.id || null,
            close_group_id: closeGroup?.id || null,
            stop_group_id: stopGroup?.id || null,
            pause_period: networkCurtain.pausePeriod || 0,
            transition_period: networkCurtain.transitionPeriod || 0,
            source_unit: unitId,
          };

          const createdCurtain = await window.electronAPI.curtain.create(projectId, curtainData);

          createdCurtains.push(createdCurtain);

          // Add delay between curtain reads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          // Continue with other curtains
        }
      }
    } else {
      console.log("No curtains found on network unit or invalid result structure");
    }

    console.log(`Successfully created ${createdCurtains.length} curtains`);
    return createdCurtains;
  } catch (error) {
    console.error("Failed to read curtain configurations:", error);
    return createdCurtains;
  }
};
