const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  platform: process.platform,
  isElectron: true,
  
  // Listen for file open events (legacy .lum files)
  onOpenLumFile: (callback) => {
    ipcRenderer.on('open-lum-file', (event, data) => callback(data));
  },
  // Listen for external file open events (txt, md, json, etc.)
  onOpenExternalFile: (callback) => {
    ipcRenderer.on('open-external-file', (event, data) => callback(data));
  },
  // Remove listeners
  removeOpenLumFileListener: () => {
    ipcRenderer.removeAllListeners('open-lum-file');
  },
  removeOpenExternalFileListener: () => {
    ipcRenderer.removeAllListeners('open-external-file');
  },
  
  // Auto-updater events
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, error) => callback(error));
  },
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Storage API
  storage: {
    getNotes: () => ipcRenderer.invoke('storage:getNotes'),
    saveNotes: (notes) => ipcRenderer.invoke('storage:saveNotes', notes),
    getFolders: () => ipcRenderer.invoke('storage:getFolders'),
    saveFolders: (folders) => ipcRenderer.invoke('storage:saveFolders', folders),
    getSettings: () => ipcRenderer.invoke('storage:getSettings'),
    saveSettings: (settings) => ipcRenderer.invoke('storage:saveSettings', settings),
    clearAll: () => ipcRenderer.invoke('storage:clearAll'),
    getUserDataPath: () => ipcRenderer.invoke('storage:getUserDataPath')
  }
});

