import { app, autoUpdater } from "electron";

const GITHUB_REPO = "meokisama/toolkit-engine";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Compare semantic versions, returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareVersions(v1, v2) {
  const parts1 = v1.replace(/^v/, "").split(".").map(Number);
  const parts2 = v2.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function registerUpdaterHandlers(ipcMain) {
  let updateDownloaded = false;

  // Check for updates via GitHub API
  ipcMain.handle("updater:check", async () => {
    try {
      const currentVersion = app.getVersion();

      const response = await fetch(GITHUB_API_URL, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "toolkit-engine-updater",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, "");
      const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseNotes: release.body || "",
        releaseName: release.name || `v${latestVersion}`,
        publishedAt: release.published_at,
      };
    } catch (error) {
      console.error("Error checking for updates:", error);
      throw error;
    }
  });

  // Download update using autoUpdater
  ipcMain.handle("updater:download", async (event) => {
    try {
      const platform = process.platform === "darwin" ? "darwin" : "win32";
      const arch = process.arch;
      const currentVersion = app.getVersion();
      const sender = event.sender;

      // Set the feed URL for update.electronjs.org
      const feedURL = `https://update.electronjs.org/${GITHUB_REPO}/${platform}-${arch}/${currentVersion}`;
      autoUpdater.setFeedURL({ url: feedURL });

      // Remove existing listeners to avoid duplicates
      autoUpdater.removeAllListeners();

      // Set up event listeners
      autoUpdater.on("error", (error) => {
        console.error("AutoUpdater error:", error);
        sender.send("updater:error", { message: error.message });
      });

      autoUpdater.on("checking-for-update", () => {
        sender.send("updater:checking");
      });

      autoUpdater.on("update-available", () => {
        sender.send("updater:update-available");
      });

      autoUpdater.on("update-not-available", () => {
        sender.send("updater:update-not-available");
      });

      autoUpdater.on("update-downloaded", (releaseEvent, releaseNotes, releaseName) => {
        updateDownloaded = true;
        sender.send("updater:downloaded", { releaseNotes, releaseName });
      });

      // Start checking and downloading
      autoUpdater.checkForUpdates();

      return { started: true };
    } catch (error) {
      console.error("Error starting download:", error);
      throw error;
    }
  });

  // Install update (quit and install)
  ipcMain.handle("updater:install", async () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall();
      return { success: true };
    }
    return { success: false, message: "No update downloaded" };
  });
}
