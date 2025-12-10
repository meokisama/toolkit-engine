import { ipcRenderer } from "electron";

export const firmware = {
  update: (unitIp, canId, hexContent, onProgress, unitType) => {
    // Set up progress listener
    if (onProgress) {
      const progressHandler = (event, { progress, status }) => {
        onProgress(progress, status);
      };
      ipcRenderer.on("firmware:progress", progressHandler);

      // Clean up listener when done
      const cleanup = () => {
        ipcRenderer.removeListener("firmware:progress", progressHandler);
      };

      return ipcRenderer
        .invoke("firmware:update", {
          unitIp,
          canId,
          hexContent,
          unitType,
        })
        .finally(cleanup);
    } else {
      return ipcRenderer.invoke("firmware:update", {
        unitIp,
        canId,
        hexContent,
        unitType,
      });
    }
  },
};
