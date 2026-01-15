import log from "electron-log/renderer";
/**
 * Read Sequence configurations from network unit and create them in database
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create sequences in
 * @param {Map} multiSceneAddressMap - Map of multi-scene addresses to multi-scene IDs
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<Array>} Created sequences
 */
export const readSequenceConfigurations = async (networkUnit, projectId, multiSceneAddressMap, unitId) => {
  const createdSequences = [];

  try {
    log.info("Reading Sequence configurations...");

    const result = await window.electronAPI.sequenceController.getAllSequencesInformation({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
    });

    if (result?.sequences && result.sequences.length > 0) {
      log.info(`Found ${result.sequences.length} sequences on network unit`);

      for (const networkSequence of result.sequences) {
        try {
          // Only process sequences with multi-scenes
          if (!networkSequence.multiSceneAddresses || networkSequence.multiSceneAddresses.length === 0) {
            log.info(`Skipping sequence ${networkSequence.index}: no multi-scenes`);
            continue;
          }

          // Create sequence in database
          const sequenceData = {
            name: `Sequence ${networkSequence.index}`,
            address: networkSequence.address.toString(),
            description: `Transferred from network unit ${networkUnit.ip_address}`,
            source_unit: unitId,
          };

          const createdSequence = await window.electronAPI.sequences.create(projectId, sequenceData);

          // Add multi-scenes to sequence
          for (let i = 0; i < networkSequence.multiSceneAddresses.length; i++) {
            const multiSceneAddress = networkSequence.multiSceneAddresses[i];
            const multiSceneId = multiSceneAddressMap.get(multiSceneAddress);
            if (multiSceneId) {
              try {
                await window.electronAPI.sequences.addMultiScene(
                  createdSequence.id,
                  multiSceneId,
                  i // multi_scene_order
                );
              } catch (error) {
                log.error(`Failed to add multi-scene ${multiSceneId} to sequence ${createdSequence.id}:`, error);
                // Continue with other multi-scenes
              }
            } else {
              log.warn(`Multi-scene with address ${multiSceneAddress} not found in created multi-scenes`);
            }
          }

          createdSequences.push(createdSequence);
          log.info(
            `Created sequence: ${createdSequence.name} (ID: ${createdSequence.id}) with ${networkSequence.multiSceneAddresses.length} multi-scenes`
          );

          // Add delay between sequence reads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          log.error(`Failed to process sequence ${networkSequence.index}:`, error);
          // Continue with other sequences
        }
      }
    }

    log.info(`Successfully created ${createdSequences.length} sequences`);
    return createdSequences;
  } catch (error) {
    log.error("Failed to read Sequence configurations:", error);
    return createdSequences;
  }
};
