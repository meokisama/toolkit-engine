import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import DatabaseService from './services/database.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Initialize database service
let dbService;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#fafafa',
    },
    icon: path.join(__dirname, '/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
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
app.whenReady().then(() => {
  // Initialize database
  dbService = new DatabaseService();

  // Setup IPC handlers
  setupIpcHandlers();

  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Close database connection before quitting
    if (dbService) {
      dbService.close();
    }
    app.quit();
  }
});

// Setup IPC handlers for database operations
function setupIpcHandlers() {
  // Get all projects
  ipcMain.handle('projects:getAll', async () => {
    try {
      return await dbService.getAllProjects();
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  });

  // Get project by ID
  ipcMain.handle('projects:getById', async (event, id) => {
    try {
      return await dbService.getProjectById(id);
    } catch (error) {
      console.error('Error getting project by ID:', error);
      throw error;
    }
  });

  // Create project
  ipcMain.handle('projects:create', async (event, projectData) => {
    try {
      return await dbService.createProject(projectData);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  });

  // Update project
  ipcMain.handle('projects:update', async (event, id, projectData) => {
    try {
      return await dbService.updateProject(id, projectData);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  });

  // Delete project
  ipcMain.handle('projects:delete', async (event, id) => {
    try {
      return await dbService.deleteProject(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  });

  // Duplicate project
  ipcMain.handle('projects:duplicate', async (event, id) => {
    try {
      return await dbService.duplicateProject(id);
    } catch (error) {
      console.error('Error duplicating project:', error);
      throw error;
    }
  });

  // Get all project items in one call (optimized)
  ipcMain.handle('projects:getAllItems', async (event, projectId) => {
    try {
      return await dbService.getAllProjectItems(projectId);
    } catch (error) {
      console.error('Error getting all project items:', error);
      throw error;
    }
  });

  // Lighting items
  ipcMain.handle('lighting:getAll', async (event, projectId) => {
    try {
      return await dbService.getLightingItems(projectId);
    } catch (error) {
      console.error('Error getting lighting items:', error);
      throw error;
    }
  });

  ipcMain.handle('lighting:create', async (event, projectId, itemData) => {
    try {
      return await dbService.createLightingItem(projectId, itemData);
    } catch (error) {
      console.error('Error creating lighting item:', error);
      throw error;
    }
  });

  ipcMain.handle('lighting:update', async (event, id, itemData) => {
    try {
      return await dbService.updateLightingItem(id, itemData);
    } catch (error) {
      console.error('Error updating lighting item:', error);
      throw error;
    }
  });

  ipcMain.handle('lighting:delete', async (event, id) => {
    try {
      return await dbService.deleteLightingItem(id);
    } catch (error) {
      console.error('Error deleting lighting item:', error);
      throw error;
    }
  });

  ipcMain.handle('lighting:duplicate', async (event, id) => {
    try {
      return await dbService.duplicateLightingItem(id);
    } catch (error) {
      console.error('Error duplicating lighting item:', error);
      throw error;
    }
  });

  // Aircon items
  ipcMain.handle('aircon:getAll', async (event, projectId) => {
    try {
      return await dbService.getAirconItems(projectId);
    } catch (error) {
      console.error('Error getting aircon items:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:create', async (event, projectId, itemData) => {
    try {
      return await dbService.createAirconItem(projectId, itemData);
    } catch (error) {
      console.error('Error creating aircon item:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:update', async (event, id, itemData) => {
    try {
      return await dbService.updateAirconItem(id, itemData);
    } catch (error) {
      console.error('Error updating aircon item:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:delete', async (event, id) => {
    try {
      return await dbService.deleteAirconItem(id);
    } catch (error) {
      console.error('Error deleting aircon item:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:duplicate', async (event, id) => {
    try {
      return await dbService.duplicateAirconItem(id);
    } catch (error) {
      console.error('Error duplicating aircon item:', error);
      throw error;
    }
  });

  // Aircon cards
  ipcMain.handle('aircon:getCards', async (event, projectId) => {
    try {
      return await dbService.getAirconCards(projectId);
    } catch (error) {
      console.error('Error getting aircon cards:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:createCard', async (event, projectId, cardData) => {
    try {
      return await dbService.createAirconCard(projectId, cardData);
    } catch (error) {
      console.error('Error creating aircon card:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:deleteCard', async (event, projectId, address) => {
    try {
      return await dbService.deleteAirconCard(projectId, address);
    } catch (error) {
      console.error('Error deleting aircon card:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:duplicateCard', async (event, projectId, address) => {
    try {
      return await dbService.duplicateAirconCard(projectId, address);
    } catch (error) {
      console.error('Error duplicating aircon card:', error);
      throw error;
    }
  });

  // Unit items
  ipcMain.handle('unit:getAll', async (event, projectId) => {
    try {
      return await dbService.getUnitItems(projectId);
    } catch (error) {
      console.error('Error getting unit items:', error);
      throw error;
    }
  });

  ipcMain.handle('unit:create', async (event, projectId, itemData) => {
    try {
      return await dbService.createUnitItem(projectId, itemData);
    } catch (error) {
      console.error('Error creating unit item:', error);
      throw error;
    }
  });

  ipcMain.handle('unit:update', async (event, id, itemData) => {
    try {
      return await dbService.updateUnitItem(id, itemData);
    } catch (error) {
      console.error('Error updating unit item:', error);
      throw error;
    }
  });

  ipcMain.handle('unit:delete', async (event, id) => {
    try {
      return await dbService.deleteUnitItem(id);
    } catch (error) {
      console.error('Error deleting unit item:', error);
      throw error;
    }
  });

  ipcMain.handle('unit:duplicate', async (event, id) => {
    try {
      return await dbService.duplicateUnitItem(id);
    } catch (error) {
      console.error('Error duplicating unit item:', error);
      throw error;
    }
  });

  // Curtain items
  ipcMain.handle('curtain:getAll', async (event, projectId) => {
    try {
      return await dbService.getCurtainItems(projectId);
    } catch (error) {
      console.error('Error getting curtain items:', error);
      throw error;
    }
  });

  ipcMain.handle('curtain:create', async (event, projectId, itemData) => {
    try {
      return await dbService.createCurtainItem(projectId, itemData);
    } catch (error) {
      console.error('Error creating curtain item:', error);
      throw error;
    }
  });

  ipcMain.handle('curtain:update', async (event, id, itemData) => {
    try {
      return await dbService.updateCurtainItem(id, itemData);
    } catch (error) {
      console.error('Error updating curtain item:', error);
      throw error;
    }
  });

  ipcMain.handle('curtain:delete', async (event, id) => {
    try {
      return await dbService.deleteCurtainItem(id);
    } catch (error) {
      console.error('Error deleting curtain item:', error);
      throw error;
    }
  });

  ipcMain.handle('curtain:duplicate', async (event, id) => {
    try {
      return await dbService.duplicateCurtainItem(id);
    } catch (error) {
      console.error('Error duplicating curtain item:', error);
      throw error;
    }
  });

  // Scene items
  ipcMain.handle('scene:getAll', async (event, projectId) => {
    try {
      return await dbService.getSceneItems(projectId);
    } catch (error) {
      console.error('Error getting scene items:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:create', async (event, projectId, itemData) => {
    try {
      return await dbService.createSceneItem(projectId, itemData);
    } catch (error) {
      console.error('Error creating scene item:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:update', async (event, id, itemData) => {
    try {
      return await dbService.updateSceneItem(id, itemData);
    } catch (error) {
      console.error('Error updating scene item:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:delete', async (event, id) => {
    try {
      return await dbService.deleteSceneItem(id);
    } catch (error) {
      console.error('Error deleting scene item:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:duplicate', async (event, id) => {
    try {
      return await dbService.duplicateSceneItem(id);
    } catch (error) {
      console.error('Error duplicating scene item:', error);
      throw error;
    }
  });

  // Scene Items Management
  ipcMain.handle('scene:getItemsWithDetails', async (event, sceneId) => {
    try {
      return await dbService.getSceneItemsWithDetails(sceneId);
    } catch (error) {
      console.error('Error getting scene items with details:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:addItem', async (event, sceneId, itemType, itemId, itemValue) => {
    try {
      return await dbService.addItemToScene(sceneId, itemType, itemId, itemValue);
    } catch (error) {
      console.error('Error adding item to scene:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:removeItem', async (event, sceneItemId) => {
    try {
      return await dbService.removeItemFromScene(sceneItemId);
    } catch (error) {
      console.error('Error removing item from scene:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:updateItemValue', async (event, sceneItemId, itemValue) => {
    try {
      return await dbService.updateSceneItemValue(sceneItemId, itemValue);
    } catch (error) {
      console.error('Error updating scene item value:', error);
      throw error;
    }
  });

  // Import project
  ipcMain.handle('projects:import', async (event, projectData, itemsData) => {
    try {
      return await dbService.importProject(projectData, itemsData);
    } catch (error) {
      console.error('Error importing project:', error);
      throw error;
    }
  });

  // Bulk import items for each category
  ipcMain.handle('lighting:bulkImport', async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, 'lighting');
    } catch (error) {
      console.error('Error bulk importing lighting items:', error);
      throw error;
    }
  });

  ipcMain.handle('aircon:bulkImport', async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, 'aircon');
    } catch (error) {
      console.error('Error bulk importing aircon items:', error);
      throw error;
    }
  });

  ipcMain.handle('unit:bulkImport', async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, 'unit');
    } catch (error) {
      console.error('Error bulk importing unit items:', error);
      throw error;
    }
  });

  ipcMain.handle('curtain:bulkImport', async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, 'curtain');
    } catch (error) {
      console.error('Error bulk importing curtain items:', error);
      throw error;
    }
  });

  ipcMain.handle('scene:bulkImport', async (event, projectId, items) => {
    try {
      return await dbService.bulkImportItems(projectId, items, 'scene');
    } catch (error) {
      console.error('Error bulk importing scene items:', error);
      throw error;
    }
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
