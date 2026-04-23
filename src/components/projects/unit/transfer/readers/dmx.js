import log from "electron-log/renderer";

/**
 * Read DMX color configurations from network unit and create them in database.
 * Each device becomes a DMX item with 16 color slots (RGBW strings).
 *
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create DMX items in
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<Array>} Created DMX items
 */
export const readDmxConfigurations = async (networkUnit, projectId, unitId) => {
  const createdDmxItems = [];

  try {
    const devices = await window.electronAPI.dmxController.getDmxColor(
      networkUnit.ip_address,
      networkUnit.id_can
    );

    if (!devices || devices.length === 0) {
      log.info("No DMX devices found on network unit");
      return createdDmxItems;
    }

    log.info(`Found ${devices.length} DMX device(s) on network unit`);

    for (const device of devices) {
      try {
        const address = String(device.deviceIndex + 1);

        const dmxData = {
          name: `DMX ${address}`,
          address,
          description: `Transferred from network unit ${networkUnit.ip_address}`,
          source_unit: unitId,
        };

        // Map 16 colors to color1..color16 (RGBW string format)
        (device.colors || []).forEach((color, i) => {
          if (i < 16) {
            dmxData[`color${i + 1}`] = color.colorString;
          }
        });

        const createdDmx = await window.electronAPI.dmx.create(projectId, dmxData);
        createdDmxItems.push(createdDmx);
      } catch (error) {
        log.error(`Failed to create DMX device ${device.deviceIndex}:`, error);
        // Continue with other devices
      }
    }

    log.info(`Successfully created ${createdDmxItems.length} DMX items`);
    return createdDmxItems;
  } catch (error) {
    log.error("Failed to read DMX configurations:", error);
    return createdDmxItems;
  }
};
