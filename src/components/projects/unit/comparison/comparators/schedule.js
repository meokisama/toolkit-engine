import log from "electron-log/renderer";
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

  // Filter valid schedules (same logic as schedule control dialog)
  // Schedule is valid if NOT (enabled === false AND sceneCount === 0)
  const validDbSchedules = dbSchedules.filter((schedule) => {
    const sceneCount = schedule.scenes?.length || 0;
    return !(schedule.enabled === false && sceneCount === 0);
  });

  const validNetSchedules = netSchedules.filter((schedule) => {
    const sceneCount = schedule.sceneAddresses?.length || 0;
    return !(schedule.enabled === false && sceneCount === 0);
  });

  // Create maps for easier comparison by schedule index
  const dbScheduleMap = new Map();
  const netScheduleMap = new Map();

  validDbSchedules.forEach((schedule) => {
    // Extract schedule index from name pattern "Schedule {number}"
    const match = schedule.name?.match(/Schedule (\d+)/);
    if (match) {
      const scheduleIndex = parseInt(match[1]);
      dbScheduleMap.set(scheduleIndex, schedule);
    }
  });

  validNetSchedules.forEach((schedule) => {
    // Network schedules use scheduleIndex field
    if (schedule.scheduleIndex !== undefined) {
      netScheduleMap.set(schedule.scheduleIndex, schedule);
    }
  });

  // Get all unique schedule indices
  const allIndices = new Set([...dbScheduleMap.keys(), ...netScheduleMap.keys()]);

  // Compare valid schedule count
  if (validDbSchedules.length !== validNetSchedules.length) {
    differences.push(`Valid Schedule count: DB=${validDbSchedules.length}, Network=${validNetSchedules.length}`);
  }

  // Compare schedules by schedule index
  allIndices.forEach((scheduleIndex) => {
    const dbSchedule = dbScheduleMap.get(scheduleIndex);
    const netSchedule = netScheduleMap.get(scheduleIndex);

    if (!dbSchedule && !netSchedule) return;

    if (!dbSchedule) {
      differences.push(`Schedule ${scheduleIndex}: Only exists in Network unit`);
      return;
    }

    if (!netSchedule) {
      differences.push(`Schedule ${scheduleIndex}: Only exists in Database unit`);
      return;
    }

    // Compare enabled status (database stores as 0/1, network as true/false)
    const dbEnabled = Boolean(dbSchedule.enabled);
    const netEnabled = Boolean(netSchedule.enabled);

    if (dbEnabled !== netEnabled) {
      differences.push(`Schedule ${scheduleIndex} Enabled: DB=${dbEnabled}, Network=${netEnabled}`);
    }

    // Compare time (database stores as "HH:MM", network has hour and minute)
    if (dbSchedule.time) {
      const [dbHour, dbMinute] = dbSchedule.time.split(":").map((n) => parseInt(n));
      const netHour = netSchedule.hour || 0;
      const netMinute = netSchedule.minute || 0;

      if (dbHour !== netHour || dbMinute !== netMinute) {
        differences.push(
          `Schedule ${scheduleIndex} Time: DB="${dbSchedule.time}", Network="${String(netHour).padStart(2, "0")}:${String(netMinute).padStart(2, "0")}"`
        );
      }
    }

    // Compare days of week
    // Database stores as JSON array of day names ["monday", "tuesday", ...], network stores as boolean array
    try {
      const dbDays = dbSchedule.days || [];
      const dbDaysArray = typeof dbDays === "string" ? JSON.parse(dbDays) : dbDays;
      const netDaysArray = netSchedule.weekDays || [];

      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayNamesLower = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

      // Convert database day names to boolean array
      // Database has array like ["monday", "friday"] -> convert to [true, false, false, false, true, false, false]
      const dbDaysBoolArray = dayNamesLower.map((dayName) => dbDaysArray.some((d) => d.toLowerCase() === dayName));

      // Compare the boolean arrays
      if (JSON.stringify(dbDaysBoolArray) !== JSON.stringify(netDaysArray)) {
        const dbDaysStr = dayNames.filter((_, i) => dbDaysBoolArray[i]).join(", ");
        const netDaysStr = dayNames.filter((_, i) => netDaysArray[i]).join(", ");
        differences.push(`Schedule ${scheduleIndex} Days: DB="${dbDaysStr}", Network="${netDaysStr}"`);
      }
    } catch (error) {
      log.error(`Failed to compare days for schedule ${scheduleIndex}:`, error);
    }

    // Compare schedule scenes - only check count and if equal, check if addresses match
    const dbScenes = dbSchedule.scenes || [];
    const netScenes = netSchedule.sceneAddresses || [];

    // Extract scene addresses from database scenes
    const dbSceneAddresses = dbScenes.map((s) => parseInt(s.scene_address)).sort((a, b) => a - b);
    const netSceneAddresses = netScenes.map((s) => parseInt(s)).sort((a, b) => a - b);

    if (dbSceneAddresses.length !== netSceneAddresses.length) {
      differences.push(`Schedule ${scheduleIndex} Scene count: DB=${dbSceneAddresses.length}, Network=${netSceneAddresses.length}`);
    } else if (dbSceneAddresses.length > 0) {
      // If counts are equal, check if all scene addresses are the same
      const dbAddressesSet = new Set(dbSceneAddresses);
      const netAddressesSet = new Set(netSceneAddresses);

      // Check if all addresses match (as sets, order doesn't matter)
      const allMatch = dbSceneAddresses.every((addr) => netAddressesSet.has(addr)) && netSceneAddresses.every((addr) => dbAddressesSet.has(addr));

      if (!allMatch) {
        differences.push(`Schedule ${scheduleIndex} Scenes: DB=[${dbSceneAddresses.join(", ")}], Network=[${netSceneAddresses.join(", ")}]`);
      }
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
