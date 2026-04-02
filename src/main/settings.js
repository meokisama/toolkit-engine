export function registerSettingsHandlers(ipcMain, dbService) {
  ipcMain.handle("settings:get", async (event, key, defaultValue) => {
    return dbService.getSetting(key, defaultValue ?? null);
  });

  ipcMain.handle("settings:set", async (event, key, value) => {
    return dbService.setSetting(key, value);
  });
}
