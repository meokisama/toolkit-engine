import { findOrCreateDatabaseItemByNetworkItem, getObjectTypeFromValue } from "./config-helpers";

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
    console.log("Reading scene configurations...");

    const result = await window.electronAPI.sceneController.getAllScenesInformation({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
    });

    if (result?.scenes && result.scenes.length > 0) {
      console.log(`Found ${result.scenes.length} scenes on network unit`);

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
                  const { itemType, itemId } = await findOrCreateDatabaseItemByNetworkItem(item, projectId);

                  if (itemType && itemId) {
                    // Convert network item value to database format
                    let itemValue = item.itemValue;
                    if (item.objectValue === 1) {
                      // LIGHTING: Convert from 0-255 to 0-100
                      itemValue = Math.round((item.itemValue / 255) * 100);
                    }

                    await window.electronAPI.scene.addItem(
                      createdScene.id,
                      itemType,
                      itemId,
                      itemValue.toString(),
                      null, // command
                      getObjectTypeFromValue(item.objectValue)
                    );
                  }
                } catch (error) {
                  console.error(`Failed to create scene item:`, error);
                  // Continue with other items
                }
              }
            }

            createdScenes.push(createdScene);
            console.log(`Created scene: ${createdScene.name} (ID: ${createdScene.id})`);
          }

          // Add delay between scene reads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Failed to process scene ${networkScene.index}:`, error);
          // Continue with other scenes
        }
      }
    }

    console.log(`Successfully created ${createdScenes.length} scenes`);
    return { createdScenes, sceneAddressMap };
  } catch (error) {
    console.error("Failed to read scene configurations:", error);
    return { createdScenes, sceneAddressMap };
  }
};
