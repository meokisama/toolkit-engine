import { shell } from "electron";

export function registerShellHandlers(ipcMain) {
  ipcMain.handle("shell:openExternal", async (_, url) => {
    return shell.openExternal(url);
  });
}
