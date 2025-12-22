/**
 * Main IPC Handlers
 * Tập hợp tất cả các handlers cho các module khác nhau
 */

import { registerProjectHandlers } from "./project.js";
import { registerSceneHandlers } from "./scene.js";
import { registerSequenceHandlers } from "./sequence.js";
import { registerDaliHandlers } from "./dali.js";
import { registerLightingHandlers } from "./lighting.js";
import { registerAirconHandlers } from "./aircon.js";
import { registerCurtainHandlers } from "./curtain.js";
import { registerDmxHandlers } from "./dmx.js";
import { registerScheduleHandlers } from "./schedule.js";
import { registerMultiSceneHandlers } from "./multi-scene.js";
import { registerKnxHandlers } from "./knx.js";
import { registerUnitHandlers } from "./unit.js";
import { registerRoomHandlers } from "./room.js";
import { registerZigbeeHandlers } from "./zigbee.js";
import { registerNetworkHandlers } from "./network.js";
import { registerFirmwareHandlers } from "./firmware.js";
import { registerIOConfigHandlers } from "./io-config.js";
import { registerDeviceConfigHandlers } from "./device-config.js";

/**
 * Đăng ký tất cả IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC Main instance
 * @param {DatabaseService} dbService - Database service instance
 * @param {Object} rcu - RCU controller service
 * @param {Object} loggerService - Logger service instance
 * @param {Object} networkInterfaceService - Network interface service instance
 */
export function registerAllHandlers(ipcMain, dbService, rcu, loggerService, networkInterfaceService) {
  registerProjectHandlers(ipcMain, dbService);
  registerLightingHandlers(ipcMain, dbService);
  registerAirconHandlers(ipcMain, dbService, rcu);
  registerCurtainHandlers(ipcMain, dbService, rcu);
  registerDmxHandlers(ipcMain, dbService);
  registerUnitHandlers(ipcMain, dbService);
  registerKnxHandlers(ipcMain, dbService, rcu, loggerService);
  registerSceneHandlers(ipcMain, dbService, rcu);
  registerSequenceHandlers(ipcMain, dbService, rcu);
  registerScheduleHandlers(ipcMain, dbService, rcu);
  registerMultiSceneHandlers(ipcMain, dbService, rcu);
  registerDaliHandlers(ipcMain, dbService, rcu);
  registerRoomHandlers(ipcMain, dbService, rcu);
  registerZigbeeHandlers(ipcMain, dbService, rcu);
  registerNetworkHandlers(ipcMain, networkInterfaceService);
  registerFirmwareHandlers(ipcMain, rcu);
  registerIOConfigHandlers(ipcMain, rcu);
  registerDeviceConfigHandlers(ipcMain, rcu);
}
