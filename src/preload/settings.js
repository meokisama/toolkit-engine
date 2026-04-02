import { ipcRenderer } from "electron";

export const settings = {
  get: (key, defaultValue) => ipcRenderer.invoke("settings:get", key, defaultValue),
  set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
};
