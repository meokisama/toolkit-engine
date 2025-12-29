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
    ];

    scheduleFields.forEach((field) => {
      if (dbSchedule[field.name] !== netSchedule[field.name]) {
        differences.push(`Schedule ${address} ${field.label}: DB="${dbSchedule[field.name]}", Network="${netSchedule[field.name]}"`);
      }
    });

    // Compare time (database stores as "HH:MM", network has hour and minute)
    if (dbSchedule.time) {
      const [dbHour, dbMinute] = dbSchedule.time.split(":").map((n) => parseInt(n));
      const netHour = netSchedule.hour || 0;
      const netMinute = netSchedule.minute || 0;

      if (dbHour !== netHour || dbMinute !== netMinute) {
        differences.push(`Schedule ${address} Time: DB="${dbSchedule.time}", Network="${String(netHour).padStart(2, "0")}:${String(netMinute).padStart(2, "0")}"`);
      }
    }

    // Compare days of week
    // Database stores as JSON array of day names, network stores as boolean array
    try {
      const dbDays = dbSchedule.days_of_week || dbSchedule.days || [];
      const dbDaysArray = typeof dbDays === "string" ? JSON.parse(dbDays) : dbDays;
      const netDaysArray = netSchedule.weekDays || [];

      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayNamesLower = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

      // Convert database day names to boolean array
      const dbDaysBoolArray = dayNames.map((day, index) =>
        dbDaysArray.some((d) => d.toLowerCase() === dayNamesLower[index])
      );

      // Compare the boolean arrays
      if (JSON.stringify(dbDaysBoolArray) !== JSON.stringify(netDaysArray)) {
        const dbDaysStr = dayNames.filter((_, i) => dbDaysBoolArray[i]).join(", ");
        const netDaysStr = dayNames.filter((_, i) => netDaysArray[i]).join(", ");
        differences.push(`Schedule ${address} Days: DB="${dbDaysStr}", Network="${netDaysStr}"`);
      }
    } catch (error) {
      console.error(`Failed to compare days for schedule ${address}:`, error);
    }

    // Compare schedule scenes as a SET (order doesn't matter in schedule)
    const dbScenes = dbSchedule.scenes || [];
    const netScenes = netSchedule.sceneAddresses || [];

    // Extract scene addresses from database scenes
    const dbSceneAddresses = dbScenes.map((s) => parseInt(s.scene_address)).sort((a, b) => a - b);
    const netSceneAddresses = netScenes.map((s) => parseInt(s)).sort((a, b) => a - b);

    if (dbSceneAddresses.length !== netSceneAddresses.length) {
      differences.push(`Schedule ${address} Scene count: DB=${dbSceneAddresses.length}, Network=${netSceneAddresses.length}`);
    } else {
      // Compare sorted arrays
      for (let i = 0; i < dbSceneAddresses.length; i++) {
        if (dbSceneAddresses[i] !== netSceneAddresses[i]) {
          differences.push(`Schedule ${address} Scenes: DB=[${dbSceneAddresses.join(", ")}], Network=[${netSceneAddresses.join(", ")}]`);
          break;
        }
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
