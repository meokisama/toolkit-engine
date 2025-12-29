/**
 * Compare schedule configurations between database and network unit
 * @param {Array} databaseSchedules - Schedules from database unit
 * @param {Array} networkSchedules - Schedules from network unit
 * @returns {Object} Comparison result with differences
 */
export function compareSchedules(databaseSchedules, networkSchedules) {
  const differences = [];

  if (!databaseSchedules && !networkSchedules) {
    return { isEqual: true, differences: [] };
  }

  if (!databaseSchedules || !networkSchedules) {
    return {
      isEqual: false,
      differences: ["One unit has schedules while the other does not"],
    };
  }

  const dbSchedules = Array.isArray(databaseSchedules) ? databaseSchedules : [];
  const netSchedules = Array.isArray(networkSchedules) ? networkSchedules : [];

  // Create maps for easier comparison by address
  const dbScheduleMap = new Map();
  const netScheduleMap = new Map();

  dbSchedules.forEach((schedule) => {
    if (schedule.address !== undefined) {
      dbScheduleMap.set(schedule.address, schedule);
    }
  });

  netSchedules.forEach((schedule) => {
    if (schedule.address !== undefined) {
      netScheduleMap.set(schedule.address, schedule);
    }
  });

  // Get all unique addresses
  const allAddresses = new Set([...dbScheduleMap.keys(), ...netScheduleMap.keys()]);

  // Compare schedule count
  if (dbSchedules.length !== netSchedules.length) {
    differences.push(`Schedule count: DB=${dbSchedules.length}, Network=${netSchedules.length}`);
  }

  // Compare schedules by address
  allAddresses.forEach((address) => {
    const dbSchedule = dbScheduleMap.get(address);
    const netSchedule = netScheduleMap.get(address);

    if (!dbSchedule && !netSchedule) return;

    if (!dbSchedule) {
      differences.push(`Schedule Address ${address}: Only exists in Network unit`);
      return;
    }

    if (!netSchedule) {
      differences.push(`Schedule Address ${address}: Only exists in Database unit`);
      return;
    }

    // Compare schedule properties
    const scheduleFields = [
      { name: "name", label: "Name" },
      { name: "enabled", label: "Enabled" },
      { name: "repeat_type", label: "Repeat Type" },
      { name: "start_date", label: "Start Date" },
      { name: "end_date", label: "End Date" },
      { name: "days_of_week", label: "Days of Week" },
      { name: "time_slots", label: "Time Slots" },
    ];

    scheduleFields.forEach((field) => {
      if (field.name === "days_of_week" || field.name === "time_slots") {
        // Compare arrays
        const dbArray = dbSchedule[field.name] || [];
        const netArray = netSchedule[field.name] || [];

        if (JSON.stringify(dbArray) !== JSON.stringify(netArray)) {
          differences.push(`Schedule ${address} ${field.label}: DB=${JSON.stringify(dbArray)}, Network=${JSON.stringify(netArray)}`);
        }
      } else {
        if (dbSchedule[field.name] !== netSchedule[field.name]) {
          differences.push(`Schedule ${address} ${field.label}: DB="${dbSchedule[field.name]}", Network="${netSchedule[field.name]}"`);
        }
      }
    });

    // Compare schedule scenes
    const dbScenes = dbSchedule.scenes || [];
    const netScenes = netSchedule.scenes || [];

    if (dbScenes.length !== netScenes.length) {
      differences.push(`Schedule ${address} Scene count: DB=${dbScenes.length}, Network=${netScenes.length}`);
    } else {
      for (let i = 0; i < dbScenes.length; i++) {
        const dbScene = dbScenes[i];
        const netScene = netScenes[i];

        if (dbScene.scene_address !== netScene.scene_address) {
          differences.push(`Schedule ${address} Scene ${i + 1} Address: DB=${dbScene.scene_address}, Network=${netScene.scene_address}`);
        }
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
