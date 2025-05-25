// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    projects: {
        getAll: () => ipcRenderer.invoke('projects:getAll'),
        getById: (id) => ipcRenderer.invoke('projects:getById', id),
        create: (projectData) => ipcRenderer.invoke('projects:create', projectData),
        update: (id, projectData) => ipcRenderer.invoke('projects:update', id, projectData),
        delete: (id) => ipcRenderer.invoke('projects:delete', id),
        duplicate: (id) => ipcRenderer.invoke('projects:duplicate', id),
        getAllItems: (projectId) => ipcRenderer.invoke('projects:getAllItems', projectId),
    },
    lighting: {
        getAll: (projectId) => ipcRenderer.invoke('lighting:getAll', projectId),
        create: (projectId, itemData) => ipcRenderer.invoke('lighting:create', projectId, itemData),
        update: (id, itemData) => ipcRenderer.invoke('lighting:update', id, itemData),
        delete: (id) => ipcRenderer.invoke('lighting:delete', id),
        duplicate: (id) => ipcRenderer.invoke('lighting:duplicate', id),
    },
    aircon: {
        getAll: (projectId) => ipcRenderer.invoke('aircon:getAll', projectId),
        create: (projectId, itemData) => ipcRenderer.invoke('aircon:create', projectId, itemData),
        update: (id, itemData) => ipcRenderer.invoke('aircon:update', id, itemData),
        delete: (id) => ipcRenderer.invoke('aircon:delete', id),
        duplicate: (id) => ipcRenderer.invoke('aircon:duplicate', id),
    },
    unit: {
        getAll: (projectId) => ipcRenderer.invoke('unit:getAll', projectId),
        create: (projectId, itemData) => ipcRenderer.invoke('unit:create', projectId, itemData),
        update: (id, itemData) => ipcRenderer.invoke('unit:update', id, itemData),
        delete: (id) => ipcRenderer.invoke('unit:delete', id),
        duplicate: (id) => ipcRenderer.invoke('unit:duplicate', id),
    },
    curtain: {
        getAll: (projectId) => ipcRenderer.invoke('curtain:getAll', projectId),
        create: (projectId, itemData) => ipcRenderer.invoke('curtain:create', projectId, itemData),
        update: (id, itemData) => ipcRenderer.invoke('curtain:update', id, itemData),
        delete: (id) => ipcRenderer.invoke('curtain:delete', id),
        duplicate: (id) => ipcRenderer.invoke('curtain:duplicate', id),
    },
    scene: {
        getAll: (projectId) => ipcRenderer.invoke('scene:getAll', projectId),
        create: (projectId, itemData) => ipcRenderer.invoke('scene:create', projectId, itemData),
        update: (id, itemData) => ipcRenderer.invoke('scene:update', id, itemData),
        delete: (id) => ipcRenderer.invoke('scene:delete', id),
        duplicate: (id) => ipcRenderer.invoke('scene:duplicate', id),
    }
});
