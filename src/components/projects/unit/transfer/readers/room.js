import log from "electron-log/renderer";

/**
 * Read room configuration (general + per-room details) from network unit
 * and persist them to the database scoped to this unit.
 *
 * RCU response shape (snake_case) is converted to the camelCase shape
 * expected by room.setGeneralConfig / room.setRoomConfig.
 *
 * @param {Object} networkUnit - The network unit to read from
 * @param {string} projectId - The project ID
 * @param {number} unitId - The database unit ID used as source_unit
 * @returns {Promise<{ generalConfig: Object|null, rooms: number }>}
 */
export const readRoomConfigurations = async (networkUnit, projectId, unitId) => {
  const result = { generalConfig: null, rooms: 0 };

  try {
    const roomData = await window.electronAPI.roomController.getRoomConfiguration(
      networkUnit.ip_address,
      networkUnit.id_can
    );

    if (!roomData) {
      log.info("No room configuration returned from network unit");
      return result;
    }

    const { generalConfig: networkGeneral, rooms: networkRooms = [] } = roomData;

    if (networkGeneral) {
      const dbGeneralConfig = {
        roomMode: networkGeneral.room_mode,
        roomAmount: networkGeneral.room_amount,
        tcpMode: networkGeneral.tcp_mode,
        port: networkGeneral.port,
        slaveAmount: networkGeneral.slave_amount,
        slaveIPs: networkGeneral.slaveIPs || [],
        clientMode: networkGeneral.client_mode,
        clientIP: networkGeneral.client_ip,
        clientPort: networkGeneral.client_port,
        knxAddress: networkGeneral.knx_address,
      };

      await window.electronAPI.room.setGeneralConfig(projectId, dbGeneralConfig, unitId);
      result.generalConfig = dbGeneralConfig;
      log.info(`Saved room general config for unit ${networkUnit.ip_address}`);
    }

    for (const networkRoom of networkRooms) {
      try {
        const dbRoomConfig = {
          occupancyType: networkRoom.occupancy_type,
          occupancySceneType: networkRoom.occupancy_scene_type,
          enableWelcomeNight: networkRoom.enable_welcome_night,
          period: networkRoom.period,
          pirInitTime: networkRoom.pir_init_time,
          pirVerifyTime: networkRoom.pir_verify_time,
          unrentPeriod: networkRoom.unrent_period,
          standbyTime: networkRoom.standby_time,
          states: networkRoom.states || {},
        };

        await window.electronAPI.room.setRoomConfig(
          projectId,
          unitId,
          networkRoom.room_address,
          dbRoomConfig
        );
        result.rooms++;
      } catch (error) {
        log.error(`Failed to save room ${networkRoom.room_address}:`, error);
        // Continue with other rooms
      }
    }

    log.info(`Successfully created ${result.rooms} room detail config(s)`);
    return result;
  } catch (error) {
    log.error("Failed to read room configurations:", error);
    return result;
  }
};
