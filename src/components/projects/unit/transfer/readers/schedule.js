/**
 * Read schedule configurations from network unit and create them in database
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID to create schedules in
 * @param {Map} sceneAddressMap - Map of scene addresses to scene IDs
 * @param {number} unitId - The database unit ID to set as source_unit
 * @returns {Promise<Array>} Created schedules
 */
export const readScheduleConfigurations = async (networkUnit, projectId, sceneAddressMap, unitId) => {
  const createdSchedules = [];

  try {
    console.log("Reading schedule configurations...");

    const result = await window.electronAPI.scheduleController.getAllSchedulesInformation({
      unitIp: networkUnit.ip_address,
      canId: networkUnit.id_can,
    });

    if (result?.data && result.data.length > 0) {
      console.log(`Found ${result.data.length} schedules on network unit`);

      for (const networkSchedule of result.data) {
        try {
          // Only process schedules with scenes
          if (!networkSchedule.sceneAddresses || networkSchedule.sceneAddresses.length === 0) {
            console.log(`Skipping schedule ${networkSchedule.scheduleIndex}: no scenes`);
            continue;
          }

          // Convert weekDays array to days string format for database
          const daysArray = networkSchedule.weekDays || [false, false, false, false, false, false, false];
          const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
          const enabledDays = dayNames.filter((_, index) => daysArray[index]);

          // Format time as HH:MM
          const timeString = `${networkSchedule.hour.toString().padStart(2, "0")}:${networkSchedule.minute.toString().padStart(2, "0")}`;

          // Create schedule in database
          const scheduleData = {
            name: `Schedule ${networkSchedule.scheduleIndex}`,
            description: `Transferred from network unit ${networkUnit.ip_address}`,
            time: timeString,
            days: enabledDays,
            enabled: networkSchedule.enabled,
            source_unit: unitId,
          };

          const createdSchedule = await window.electronAPI.schedule.create(projectId, scheduleData);

          // Add scenes to schedule
          for (const sceneAddress of networkSchedule.sceneAddresses) {
            const sceneId = sceneAddressMap.get(sceneAddress);
            if (sceneId) {
              try {
                await window.electronAPI.schedule.addScene(createdSchedule.id, sceneId);
              } catch (error) {
                console.error(`Failed to add scene ${sceneId} to schedule ${createdSchedule.id}:`, error);
                // Continue with other scenes
              }
            } else {
              console.warn(`Scene with address ${sceneAddress} not found in created scenes`);
            }
          }

          createdSchedules.push(createdSchedule);
          console.log(`Created schedule: ${createdSchedule.name} (ID: ${createdSchedule.id}) with ${networkSchedule.sceneAddresses.length} scenes`);

          // Add delay between schedule reads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Failed to process schedule ${networkSchedule.scheduleIndex}:`, error);
          // Continue with other schedules
        }
      }
    }

    console.log(`Successfully created ${createdSchedules.length} schedules`);
    return createdSchedules;
  } catch (error) {
    console.error("Failed to read schedule configurations:", error);
    return createdSchedules;
  }
};
