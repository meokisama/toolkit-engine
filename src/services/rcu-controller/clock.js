import { UDP_PORT, PROTOCOL } from "./constants.js";
import { validators } from "./validators.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

// Clock Control Functions

// Sync Clock function - sets the unit's clock
async function syncClock(unitIp, canId, clockData) {
  if (!clockData) {
    throw new Error("Clock data is required");
  }

  const { year, month, day, dayOfWeek, hour, minute, second } = clockData;

  // Validate all clock data
  validators.year(year);
  validators.month(month);
  validators.day(day);
  validators.dayOfWeek(dayOfWeek);
  validators.hour(hour);
  validators.minute(minute);
  validators.second(second);

  const idAddress = convertCanIdToInt(canId);
  const data = [year, month, day, dayOfWeek, hour, minute, second];

  return sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.GENERAL.CMD1, PROTOCOL.GENERAL.CMD2.SYNC_CLOCK, data);
}

// Get Clock function - retrieves the unit's current clock
async function getClock(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for getting clock
  const data = [];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_CLOCK,
    data,
    true // Skip status check for GET_CLOCK
  );

  if (response && response.msg && response.msg.length >= 15) {
    // Expected response: header (8 bytes) + clock data (7 bytes)
    const clockData = response.msg.slice(8); // Skip header

    if (clockData.length >= 7) {
      return {
        year: clockData[0], // 0-99 (2000-2099)
        month: clockData[1], // 1-12
        day: clockData[2], // 1-31
        dayOfWeek: clockData[3], // 1-7 (Sunday-Saturday)
        hour: clockData[4], // 0-23
        minute: clockData[5], // 0-59
        second: clockData[6], // 0-59
        // Convert to full year for display
        fullYear: 2000 + clockData[0],
        // Convert day of week to string
        dayOfWeekString:
          [
            "Unknown", // Index 0 (not used)
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ][clockData[3]] || "Unknown",
      };
    }
  }

  throw new Error("Invalid response from get clock command");
}

export { syncClock, getClock };
