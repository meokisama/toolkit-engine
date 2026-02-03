import { findOrCreateDatabaseItemByNetworkItem, getObjectTypeFromValue } from "../utils/config-helpers";
import log from "electron-log/renderer";

/**
 * Read scene configurations from network unit and create them in database
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create scenes in
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<{createdScenes: Array, sceneAddressMap: Map}>} Created scenes and address mapping
 */
export const readSceneConfigurations = async (networkUnit, projectId, unitId) => {
  const createdScenes = [];
  const sceneAddressMap = new Map(); // Map network scene address to database scene ID

  try {
    log.info("Reading scene configurations...");

    const result = await window.electronAPI.sceneController.getAllScenesInformation({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
    });

    if (result?.scenes && result.scenes.length > 0) {
      log.info(`Found ${result.scenes.length} scenes on network unit`);

      for (const networkScene of result.scenes) {
        try {
          // Get detailed scene information including items
          const detailedScene = await window.electronAPI.sceneController.getSceneInformation({
            unitIp: networkUnit.ip_address,
            canId: networkUnit.id_can,
            sceneIndex: networkScene.index,
          });

          if (detailedScene) {
            // Create scene in database
            const sceneData = {
              name: networkScene.name || `Scene ${networkScene.index}`,
              address: networkScene.address.toString(),
              description: `Transferred from network unit ${networkUnit.ip_address}`,
              source_unit: unitId,
            };

            const createdScene = await window.electronAPI.scene.create(projectId, sceneData);

            // Map network address to database ID for schedule references
            sceneAddressMap.set(networkScene.address, createdScene.id);

            // Create scene items if they exist
            if (detailedScene.items && detailedScene.items.length > 0) {
              for (const item of detailedScene.items) {
                try {
                  // Map object_value to item_type and find or create corresponding database item
                  const result = await findOrCreateDatabaseItemByNetworkItem(item, projectId);
                  const { itemType, itemId, itemAddress } = result;

                  if (itemType) {
                    // Database stores item values in same format as network (0-255 for lighting)
                    const itemValue = item.itemValue;
                    const objectType = getObjectTypeFromValue(item.objectValue);

                    if (itemType === "spi") {
                      // SPI items don't have database entries, pass address directly
                      // For SPI, store effect index in command field (objectValue - 25 = effect index)
                      const effectIndex = item.objectValue - 25;
                      await window.electronAPI.scene.addItem(
                        createdScene.id,
                        itemType,
                        null, // itemId is null for SPI
                        itemValue.toString(),
                        effectIndex.toString(), // Store effect index in command
                        objectType,
                        item.itemAddress // Pass address directly for SPI
                      );
                    } else if (itemId) {
                      await window.electronAPI.scene.addItem(
                        createdScene.id,
                        itemType,
                        itemId,
                        itemValue.toString(),
                        null, // command
                        objectType
                      );
                    }
                  }
                } catch (error) {
                  log.error(`Failed to create scene item:`, error);
                  // Continue with other items
                }
              }
            }

            createdScenes.push(createdScene);
            log.info(`Created scene: ${createdScene.name} (ID: ${createdScene.id})`);
          }

          // Add delay between scene reads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          log.error(`Failed to process scene ${networkScene.index}:`, error);
          // Continue with other scenes
        }
      }
    }

    log.info(`Successfully created ${createdScenes.length} scenes`);
    return { createdScenes, sceneAddressMap };
  } catch (error) {
    log.error("Failed to read scene configurations:", error);
    return { createdScenes, sceneAddressMap };
  }
};
