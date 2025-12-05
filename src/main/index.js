/**
 * Main IPC Handlers
 * Tập hợp tất cả các handlers cho các module khác nhau
 */

import { registerSceneHandlers } from "./scene.js";
import { registerSequenceHandlers } from "./sequence.js";
import { registerDaliHandlers } from "./dali.js";
import { registerLightingHandlers } from "./lighting.js";
import { registerAirconHandlers } from "./aircon.js";
import { registerCurtainHandlers } from "./curtain.js";
import { registerScheduleHandlers } from "./schedule.js";
import { registerMultiSceneHandlers } from "./multi-scene.js";
import { registerKnxHandlers } from "./knx.js";
import { registerUnitHandlers } from "./unit.js";

/**
 * Đăng ký tất cả IPC handlers
 * @param {Electron.IpcMain} ipcMain - Electron IPC Main instance
 * @param {DatabaseService} dbService - Database service instance
 * @param {Object} rcu - RCU controller service
 */
export function registerAllHandlers(ipcMain, dbService, rcu) {
  registerLightingHandlers(ipcMain, dbService);
  registerAirconHandlers(ipcMain, dbService);
  registerCurtainHandlers(ipcMain, dbService);
  registerUnitHandlers(ipcMain, dbService);
  registerKnxHandlers(ipcMain, dbService);
  registerSceneHandlers(ipcMain, dbService);
  registerSequenceHandlers(ipcMain, dbService);
  registerScheduleHandlers(ipcMain, dbService, rcu);
  registerMultiSceneHandlers(ipcMain, dbService);
  registerDaliHandlers(ipcMain, dbService);
}
