import { ipcRenderer } from "electron";

// LED SPI Controller - Network Operations
export const ledSpiController = {
  // Set hardware configuration for selected channels
  setHardwareConfig: (unitIp, canId, channel, config) =>
    ipcRenderer.invoke("rcu:setLedSpiHardwareConfig", unitIp, canId, channel, config),

  // Set effect control for selected channels
  setEffectControl: (unitIp, canId, channel, effect) =>
    ipcRenderer.invoke("rcu:setLedSpiEffectControl", unitIp, canId, channel, effect),

  // Get LED configuration (both hardware and effect)
  getLedConfig: (unitIp, canId, channel) =>
    ipcRenderer.invoke("rcu:getLedSpiConfig", unitIp, canId, channel),

  // Trigger LED on/off
  triggerLed: (unitIp, canId, channel, enabled) =>
    ipcRenderer.invoke("rcu:triggerLedSpi", unitIp, canId, channel, enabled),

  // Change LED mode (0 = Default, 1 = Artnet)
  changeLedMode: (unitIp, canId, channel, mode) =>
    ipcRenderer.invoke("rcu:changeLedSpiMode", unitIp, canId, channel, mode),
};
