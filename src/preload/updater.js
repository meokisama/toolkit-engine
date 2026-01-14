import { ipcRenderer } from "electron";

export const updater = {
  // Check for updates via GitHub API
  check: () => {
    return ipcRenderer.invoke("updater:check");
  },

  // Download update
  download: (callbacks = {}) => {
    const { onError, onChecking, onAvailable, onNotAvailable, onDownloaded } = callbacks;

    // Set up event listeners
    if (onError) {
      const errorHandler = (event, data) => onError(data);
      ipcRenderer.on("updater:error", errorHandler);
    }

    if (onChecking) {
      const checkingHandler = () => onChecking();
      ipcRenderer.on("updater:checking", checkingHandler);
    }

    if (onAvailable) {
      const availableHandler = () => onAvailable();
      ipcRenderer.on("updater:update-available", availableHandler);
    }

    if (onNotAvailable) {
      const notAvailableHandler = () => onNotAvailable();
      ipcRenderer.on("updater:update-not-available", notAvailableHandler);
    }

    if (onDownloaded) {
      const downloadedHandler = (event, data) => onDownloaded(data);
      ipcRenderer.on("updater:downloaded", downloadedHandler);
    }

    return ipcRenderer.invoke("updater:download");
  },

  // Install downloaded update (quit and install)
  install: () => {
    return ipcRenderer.invoke("updater:install");
  },

  // Remove all update listeners (call this when component unmounts)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("updater:error");
    ipcRenderer.removeAllListeners("updater:checking");
    ipcRenderer.removeAllListeners("updater:update-available");
    ipcRenderer.removeAllListeners("updater:update-not-available");
    ipcRenderer.removeAllListeners("updater:downloaded");
  },
};
