import { createDiff, nullCheck } from "./helpers";
import log from "electron-log/renderer";

export function compareSchedules(databaseSchedules, networkSchedules) {
  const early = nullCheck(databaseSchedules, networkSchedules, "schedule");
  if (early) return early;

  const differences = [];
  const dbSchedules = Array.isArray(databaseSchedules) ? databaseSchedules : [];
  const netSchedules = Array.isArray(networkSchedules) ? networkSchedules : [];

  // Assign 0-based index BEFORE filtering, to match how send flows compute
  // calculatedIndex (see send-all-config-dialog/project-config.js and schedule-table.jsx).
  const dbSchedulesWithIndex = dbSchedules.map((s, index) => ({ ...s, _index: index }));

  const validDbSchedules = dbSchedulesWithIndex.filter((s) => {
    const sceneCount = s.scenes?.length || 0;
    return !(s.enabled === false && sceneCount === 0);
  });

  const validNetSchedules = netSchedules.filter((s) => {
    const sceneCount = s.sceneAddresses?.length || 0;
    return !(s.enabled === false && sceneCount === 0);
  });

  if (validDbSchedules.length !== validNetSchedules.length) {
    differences.push(createDiff("schedule", "Valid Schedule Count", validDbSchedules.length, validNetSchedules.length));
  }

  const dbScheduleMap = new Map();
  const netScheduleMap = new Map();

  validDbSchedules.forEach((schedule) => {
    dbScheduleMap.set(schedule._index, schedule);
  });

  validNetSchedules.forEach((schedule) => {
    if (schedule.scheduleIndex !== undefined) {
      netScheduleMap.set(schedule.scheduleIndex, schedule);
    }
  });

  const allIndices = new Set([...dbScheduleMap.keys(), ...netScheduleMap.keys()]);

  allIndices.forEach((scheduleIndex) => {
    const dbSchedule = dbScheduleMap.get(scheduleIndex);
    const netSchedule = netScheduleMap.get(scheduleIndex);
    const label = `Schedule ${scheduleIndex}`;

    if (!dbSchedule) {
      differences.push(createDiff("schedule", label, "missing", "present"));
      return;
    }
    if (!netSchedule) {
      differences.push(createDiff("schedule", label, "present", "missing"));
      return;
    }

    // Enabled (DB: 0/1, Network: true/false)
    if (Boolean(dbSchedule.enabled) !== Boolean(netSchedule.enabled)) {
      differences.push(createDiff("schedule", `${label} Enabled`, Boolean(dbSchedule.enabled), Boolean(netSchedule.enabled)));
    }

    // Time (DB: "HH:MM", Network: { hour, minute })
    if (dbSchedule.time) {
      const [dbHour, dbMinute] = dbSchedule.time.split(":").map(Number);
      const netHour = netSchedule.hour || 0;
      const netMinute = netSchedule.minute || 0;

      if (dbHour !== netHour || dbMinute !== netMinute) {
        const netTimeStr = `${String(netHour).padStart(2, "0")}:${String(netMinute).padStart(2, "0")}`;
        differences.push(createDiff("schedule", `${label} Time`, dbSchedule.time, netTimeStr));
      }
    }

    // Days of week
    try {
      const dbDays = dbSchedule.days || [];
      const dbDaysArray = typeof dbDays === "string" ? JSON.parse(dbDays) : dbDays;
      const netDaysArray = netSchedule.weekDays || [];
      const dayNamesLower = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const dayNamesDisplay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      const dbDaysBool = dayNamesLower.map((d) => dbDaysArray.some((x) => x.toLowerCase() === d));

      if (JSON.stringify(dbDaysBool) !== JSON.stringify(netDaysArray)) {
        const dbDaysStr = dayNamesDisplay.filter((_, i) => dbDaysBool[i]).join(", ") || "none";
        const netDaysStr = dayNamesDisplay.filter((_, i) => netDaysArray[i]).join(", ") || "none";
        differences.push(createDiff("schedule", `${label} Days`, dbDaysStr, netDaysStr));
      }
    } catch (error) {
      log.error(`Failed to compare days for schedule ${scheduleIndex}:`, error);
    }

    // Scene addresses
    const dbSceneAddresses = (dbSchedule.scenes || []).map((s) => parseInt(s.scene_address)).sort((a, b) => a - b);
    const netSceneAddresses = (netSchedule.sceneAddresses || []).map((s) => parseInt(s)).sort((a, b) => a - b);

    if (dbSceneAddresses.length !== netSceneAddresses.length) {
      differences.push(createDiff("schedule", `${label} Scene Count`, dbSceneAddresses.length, netSceneAddresses.length));
    } else if (dbSceneAddresses.length > 0) {
      const dbSet = new Set(dbSceneAddresses);
      const netSet = new Set(netSceneAddresses);
      const allMatch = dbSceneAddresses.every((a) => netSet.has(a)) && netSceneAddresses.every((a) => dbSet.has(a));
      if (!allMatch) {
        differences.push(createDiff("schedule", `${label} Scenes`, dbSceneAddresses.join(", "), netSceneAddresses.join(", ")));
      }
    }
  });

  return { isEqual: differences.length === 0, differences };
}
