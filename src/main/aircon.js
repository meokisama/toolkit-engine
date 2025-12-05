/**
 * Aircon IPC Handlers
 * Xử lý các tương tác với aircon items và cards
 */

export function registerAirconHandlers(ipcMain, dbService) {
  // Aircon items CRUD operations
  ipcMain.handle("aircon:getAll", async (event, projectId) => {
    try {
      return await dbService.getAirconItems(projectId);
    } catch (error) {
      console.error("Error getting aircon items:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:create", async (event, projectId, itemData) => {
    try {
      return await dbService.createAirconItem(projectId, itemData);
    } catch (error) {
      console.error("Error creating aircon item:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:update", async (event, id, itemData) => {
    try {
      return await dbService.updateAirconItem(id, itemData);
    } catch (error) {
      console.error("Error updating aircon item:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:delete", async (event, id) => {
    try {
      return await dbService.deleteAirconItem(id);
    } catch (error) {
      console.error("Error deleting aircon item:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:duplicate", async (event, id) => {
    try {
      return await dbService.duplicateAirconItem(id);
    } catch (error) {
      console.error("Error duplicating aircon item:", error);
      throw error;
    }
  });

  // Aircon cards operations
  ipcMain.handle("aircon:getCards", async (event, projectId) => {
    try {
      return await dbService.getAirconCards(projectId);
    } catch (error) {
      console.error("Error getting aircon cards:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:createCard", async (event, projectId, cardData) => {
    try {
      return await dbService.createAirconCard(projectId, cardData);
    } catch (error) {
      console.error("Error creating aircon card:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:deleteCard", async (event, projectId, address) => {
    try {
      return await dbService.deleteAirconCard(projectId, address);
    } catch (error) {
      console.error("Error deleting aircon card:", error);
      throw error;
    }
  });

  ipcMain.handle("aircon:duplicateCard", async (event, projectId, address) => {
    try {
      return await dbService.duplicateAirconCard(projectId, address);
    } catch (error) {
      console.error("Error duplicating aircon card:", error);
      throw error;
    }
  });
}
