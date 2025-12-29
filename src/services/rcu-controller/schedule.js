import { UDP_PORT, PROTOCOL } from "./constants.js";
import { validators } from "./validators.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand, sendCommandMultipleResponses } from "./command-sender.js";

// Setup Schedule function
async function setupSchedule(unitIp, canId, scheduleConfig) {
  const { scheduleIndex, enabled, weekDays, hour, minute, sceneAddresses, mode = 0, intervalTime = 0, dmxDuration = 0 } = scheduleConfig;

  // Validations
  validators.scheduleIndex(scheduleIndex);
  validators.hour(hour);
  validators.minute(minute);

  if (sceneAddresses.length > 32) {
    throw new Error("Maximum 32 scenes allowed per schedule");
  }

  // Validate new fields
  if (mode < 0 || mode > 255) {
    throw new Error("Mode must be between 0 and 255");
  }
  if (dmxDuration < 0 || dmxDuration > 255) {
    throw new Error("DMX duration must be between 0 and 255");
  }
  if (intervalTime < 0 || intervalTime > 65535) {
    throw new Error("Interval time must be between 0 and 65535");
  }

  const idAddress = convertCanIdToInt(canId);

  // Pack interval_time as 2 bytes (little-endian)
  const intervalTimeLow = intervalTime & 0xFF;
  const intervalTimeHigh = (intervalTime >> 8) & 0xFF;

  const data = [
    scheduleIndex,
    enabled ? 1 : 0,
    mode,                    // Position 2: mode (1 byte)
    dmxDuration,            // Position 3: dmx_duration (1 byte)
    intervalTimeLow,        // Position 4: interval_time low byte
    intervalTimeHigh,       // Position 5: interval_time high byte
    ...Array(6).fill(0x00), // Position 6-11: reserved (6 bytes)
    ...weekDays.map((day) => (day ? 1 : 0)), // Week days (7 bytes)
    hour,
    minute,
    0, // Second (always 0)
    sceneAddresses.length,
    ...sceneAddresses.map((addr) => parseInt(addr) || 0),
  ];

  return sendCommand(unitIp, UDP_PORT, idAddress, PROTOCOL.GENERAL.CMD1, PROTOCOL.GENERAL.CMD2.SETUP_SCHEDULE, data);
}

// Get Schedule Information function
async function getScheduleInformation(unitIp, canId, scheduleIndex) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // Validate schedule index
  if (scheduleIndex < 0 || scheduleIndex > 31) {
    throw new Error("Schedule index must be between 0 and 31");
  }

  // Data is the schedule index (0-31 for protocol)
  const data = [scheduleIndex];

  const response = await sendCommand(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCHEDULE_INFOR,
    data,
    true // Skip status check for GET_SCHEDULE_INFOR
  );

  if (response && response.msg && response.msg.length >= 8) {
    const data = response.msg.slice(8); // Skip header

    // Debug logging
    console.log(
      "Schedule response raw data:",
      Array.from(data)
        .map((b) => "0x" + b.toString(16).padStart(2, "0"))
        .join(" ")
    );
    console.log("Schedule response data length:", data.length);

    if (data.length >= 23) {
      // Minimum data length for schedule

      // Extract new fields from reserved bytes
      const mode = data[2];
      const dmxDuration = data[3];
      const intervalTime = data[4] | (data[5] << 8); // Little-endian: low byte + high byte

      const scheduleInfo = {
        scheduleIndex: data[0], // Keep 0-31 range
        enabled: data[1] === 1,
        mode: mode,
        dmxDuration: dmxDuration,
        intervalTime: intervalTime,
        // Positions 6-11 are still reserved
        weekDays: [
          data[12] === 1, // Monday
          data[13] === 1, // Tuesday
          data[14] === 1, // Wednesday
          data[15] === 1, // Thursday
          data[16] === 1, // Friday
          data[17] === 1, // Saturday
          data[18] === 1, // Sunday
        ],
        hour: data[19],
        minute: data[20],
        second: data[21],
        sceneAmount: data[22],
        sceneAddresses: [],
      };

      // Extract scene addresses
      for (let i = 0; i < scheduleInfo.sceneAmount && i < 32; i++) {
        if (data.length > 23 + i) {
          scheduleInfo.sceneAddresses.push(data[23 + i]);
        }
      }

      console.log("Parsed schedule info:", scheduleInfo);

      return {
        success: true,
        data: scheduleInfo,
        rawData: Array.from(data),
      };
    }
  }

  throw new Error("No valid response received from get schedule information command");
}

// Get All Schedules Information function
async function getAllSchedulesInformation(unitIp, canId) {
  // Convert CAN ID to address format
  const idAddress = convertCanIdToInt(canId);

  // No data parameter for loading all schedules
  const data = [];

  const result = await sendCommandMultipleResponses(
    unitIp,
    UDP_PORT,
    idAddress,
    PROTOCOL.GENERAL.CMD1,
    PROTOCOL.GENERAL.CMD2.GET_SCHEDULE_INFOR,
    data,
    15000 // 15 second timeout
  );

  const { responses, successPacketReceived } = result;
  const schedules = [];

  for (const response of responses) {
    if (response && response.msg && response.msg.length >= 8) {
      const data = response.msg.slice(8); // Skip header

      // Debug logging for each schedule response
      console.log(
        "All schedules response raw data:",
        Array.from(data)
          .map((b) => "0x" + b.toString(16).padStart(2, "0"))
          .join(" ")
      );

      if (data.length >= 23) {
        // Minimum data length for schedule

        // Extract new fields from reserved bytes
        const mode = data[2];
        const dmxDuration = data[3];
        const intervalTime = data[4] | (data[5] << 8); // Little-endian: low byte + high byte

        const scheduleInfo = {
          scheduleIndex: data[0], // Keep 0-31 range
          enabled: data[1] === 1,
          mode: mode,
          dmxDuration: dmxDuration,
          intervalTime: intervalTime,
          // Positions 6-11 are still reserved
          weekDays: [
            data[12] === 1, // Monday
            data[13] === 1, // Tuesday
            data[14] === 1, // Wednesday
            data[15] === 1, // Thursday
            data[16] === 1, // Friday
            data[17] === 1, // Saturday
            data[18] === 1, // Sunday
          ],
          hour: data[19],
          minute: data[20],
          second: data[21],
          sceneAmount: data[22],
          sceneAddresses: [],
        };

        // Extract scene addresses
        for (let i = 0; i < scheduleInfo.sceneAmount && i < 32; i++) {
          if (data.length > 23 + i) {
            scheduleInfo.sceneAddresses.push(data[23 + i]);
          }
        }

        console.log("Parsed schedule info (all schedules):", scheduleInfo);
        schedules.push(scheduleInfo);
      }
    }
  }

  if (schedules.length > 0 || successPacketReceived) {
    // Sort schedules by index to ensure proper order
    schedules.sort((a, b) => a.scheduleIndex - b.scheduleIndex);

    return {
      success: successPacketReceived,
      data: schedules,
      totalSchedules: schedules.length,
      successPacketReceived: successPacketReceived,
      totalResponses: responses.length,
    };
  }

  throw new Error("No valid responses received from get all schedules information command");
}

export { setupSchedule, getScheduleInformation, getAllSchedulesInformation };
