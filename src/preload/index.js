/**
 * Preload API Exports
 * Tập hợp tất cả các API modules
 */

import { projects } from "./projects.js";
import { lighting } from "./lighting.js";
import { aircon, airconController } from "./aircon.js";
import { unit } from "./unit.js";
import { curtain, curtainController } from "./curtain.js";
import { dmx, dmxController } from "./dmx.js";
import { knx, knxController } from "./knx.js";
import { scene, sceneController } from "./scene.js";
import { schedule, scheduleController } from "./schedule.js";
import { multiScenes, multiScenesController } from "./multi-scenes.js";
import { sequenceController, sequences } from "./sequences.js";
import { firmware } from "./firmware.js";
import { scanUDPNetwork, networkInterfaces } from "./network.js";
import { dali, daliController } from "./dali.js";
import { ioController } from "./io-config.js";
import { zigbee, zigbeeController } from "./zigbee.js";
import { room, roomController } from "./room.js";
import { deviceController } from "./device-config.js";

export const electronAPI = {
  projects,
  lighting,
  aircon,
  airconController,
  unit,
  curtain,
  curtainController,
  dmx,
  dmxController,
  knx,
  knxController,
  scene,
  sceneController,
  schedule,
  scheduleController,
  multiScenes,
  multiScenesController,
  sequences,
  sequenceController,
  firmware,
  scanUDPNetwork,
  networkInterfaces,
  ioController,
  zigbee,
  zigbeeController,
  dali,
  daliController,
  room,
  roomController,
  deviceController,
};
