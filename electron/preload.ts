import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  storage: {
    getNotes: () => ipcRenderer.invoke('storage:getNotes'),
    saveNotes: (notes: any[]) => ipcRenderer.invoke('storage:saveNotes', notes),
    getFolders: () => ipcRenderer.invoke('storage:getFolders'),
    saveFolders: (folders: any[]) => ipcRenderer.invoke('storage:saveFolders', folders),
    getSettings: () => ipcRenderer.invoke('storage:getSettings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('storage:saveSettings', settings),
    clearAll: () => ipcRenderer.invoke('storage:clearAll'),
    getUserDataPath: () => ipcRenderer.invoke('storage:getUserDataPath'),
  }
})

