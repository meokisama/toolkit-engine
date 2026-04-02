const settingsTableSchemas = {
  createAppSettingsTable: `
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `,
};

const settingsMethods = {
  getSetting(key, defaultValue = null) {
    const row = this.db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key);
    return row ? row.value : defaultValue;
  },

  setSetting(key, value) {
    this.db
      .prepare("INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(key, String(value));
    return true;
  },
};

export { settingsTableSchemas, settingsMethods };
