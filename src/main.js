import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import DatabaseService from "./services/database.js";
import * as rcu from "./services/rcu-controller.js";
import { networkInterfaceService } from "./services/network-interfaces.js";
import { registerAllHandlers } from "./main/index.js";
import log from "electron-log/main";

// Initialize the logger to be available in renderer process
log.initialize();
// Custom log file path
log.transports.file.resolvePathFn = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return path.join(app.getPath("documents"), "Toolkit Engine", "Logs", `${dd}-${mm}-${yyyy}.log`);
};
// Override console functions to write all log to file
Object.assign(console, log.functions);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Initialize services
let dbService;
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    icon: path.join(__dirname, "/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Window control IPC handlers
  ipcMain.on("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    mainWindow?.close();
  });

  ipcMain.handle("window:isMaximized", () => {
    return mainWindow?.isMaximized();
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize services
  dbService = new DatabaseService();

  // Setup IPC handlers
  registerAllHandlers(ipcMain, dbService, rcu, networkInterfaceService);

  createWindow();

  // Listen for DALI device count changed events
  rcu.daliEvents.on("deviceCountChanged", (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("dali:deviceCountChanged", data);
    }
  });

  // Listen for DALI address conflict events
  rcu.daliEvents.on("addressConflict", (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("dali:addressConflict", data);
    }
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Close database connection before quitting
    if (dbService) {
      dbService.close();
    }
    app.quit();
  }
});
