import { findOrCreateLightingByAddress, getCurtainTypeName } from "../utils/config-helpers";
import { UDP_READ_DELAY_MS } from "../constants";
import log from "electron-log/renderer";

/**
 * Read curtain configurations from network unit and create them in database
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create curtains in
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<Array>} Created curtains
 */
export const readCurtainConfigurations = async (networkUnit, projectId, unitId, itemCache = null) => {
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
          const openGroup = await findOrCreateLightingByAddress(networkCurtain.openGroup, projectId, itemCache);
          const closeGroup = await findOrCreateLightingByAddress(networkCurtain.closeGroup, projectId, itemCache);
          const stopGroup =
            networkCurtain.stopGroup && networkCurtain.stopGroup > 0
              ? await findOrCreateLightingByAddress(networkCurtain.stopGroup, projectId, itemCache)
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
          await new Promise((resolve) => setTimeout(resolve, UDP_READ_DELAY_MS));
        } catch (error) {
          // Continue with other curtains
        }
      }
    } else {
      log.info("No curtains found on network unit or invalid result structure");
    }

    log.info(`Successfully created ${createdCurtains.length} curtains`);
    return createdCurtains;
  } catch (error) {
    log.error("Failed to read curtain configurations:", error);
    return createdCurtains;
  }
};
