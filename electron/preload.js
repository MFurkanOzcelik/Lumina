const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  platform: process.platform,
  isElectron: true,
  // Listen for file open events
  onOpenLumFile: (callback) => {
    ipcRenderer.on('open-lum-file', (event, data) => callback(data));
  },
  // Remove listener
  removeOpenLumFileListener: () => {
    ipcRenderer.removeAllListeners('open-lum-file');
  }
});

