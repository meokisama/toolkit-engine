import log from "electron-log/renderer";
/**
 * Read Multi-Scene configurations from network unit and create them in database
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create multi-scenes in
 * @param {Map} sceneAddressMap - Map of scene addresses to scene IDs
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<{createdMultiScenes: Array, multiSceneAddressMap: Map}>} Created multi-scenes and address mapping
 */
export const readMultiSceneConfigurations = async (networkUnit, projectId, sceneAddressMap, unitId) => {
  const createdMultiScenes = [];
  const multiSceneAddressMap = new Map(); // Map network multi-scene address to database multi-scene ID

  try {
    log.info("Reading Multi-Scene configurations...");

    const result = await window.electronAPI.multiScenesController.getAllMultiScenesInformation({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
    });

    if (result?.multiScenes && result.multiScenes.length > 0) {
      log.info(`Found ${result.multiScenes.length} multi-scenes on network unit`);

      for (const networkMultiScene of result.multiScenes) {
        try {
          // Only process multi-scenes with scenes
          if (!networkMultiScene.sceneAddresses || networkMultiScene.sceneAddresses.length === 0) {
            log.info(`Skipping multi-scene ${networkMultiScene.multiSceneIndex}: no scenes`);
            continue;
          }

          // Create multi-scene in database
          const multiSceneData = {
            name: networkMultiScene.multiSceneName || `Multi-Scene ${networkMultiScene.multiSceneIndex}`,
            address: networkMultiScene.multiSceneAddress.toString(),
            type: networkMultiScene.multiSceneType || 0,
            description: `Transferred from network unit ${networkUnit.ip_address}`,
            source_unit: unitId,
          };

          const createdMultiScene = await window.electronAPI.multiScenes.create(projectId, multiSceneData);

          // Map network address to database ID for sequence references
          multiSceneAddressMap.set(networkMultiScene.multiSceneAddress, createdMultiScene.id);

          // Add scenes to multi-scene
          for (let i = 0; i < networkMultiScene.sceneAddresses.length; i++) {
            const sceneAddress = networkMultiScene.sceneAddresses[i];
            const sceneId = sceneAddressMap.get(sceneAddress);
            if (sceneId) {
              try {
                await window.electronAPI.multiScenes.addScene(
                  createdMultiScene.id,
                  sceneId,
                  i // scene_order
                );
              } catch (error) {
                log.error(`Failed to add scene ${sceneId} to multi-scene ${createdMultiScene.id}:`, error);
                // Continue with other scenes
              }
            } else {
              log.warn(`Scene with address ${sceneAddress} not found in created scenes`);
            }
          }

          createdMultiScenes.push(createdMultiScene);
          log.info(
            `Created multi-scene: ${createdMultiScene.name} (ID: ${createdMultiScene.id}) with ${networkMultiScene.sceneAddresses.length} scenes`
          );

          // Add delay between multi-scene reads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          log.error(`Failed to process multi-scene ${networkMultiScene.multiSceneIndex}:`, error);
          // Continue with other multi-scenes
        }
      }
    }

    log.info(`Successfully created ${createdMultiScenes.length} multi-scenes`);
    return { createdMultiScenes, multiSceneAddressMap };
  } catch (error) {
    log.error("Failed to read Multi-Scene configurations:", error);
    return { createdMultiScenes, multiSceneAddressMap };
  }
};
