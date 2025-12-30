import { contextBridge, ipcRenderer, webUtils } from 'electron'

// Renderer'a güvenli API köprüsü
contextBridge.exposeInMainWorld('electronAPI', {
  // Uygulama bilgileri
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  getAppPath: (): Promise<string> => ipcRenderer.invoke('get-app-path'),
  platform: process.platform,
  isElectron: true,
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Dosya açma olayları
  onOpenLumFile: (callback: (data: { fileName: string; content: string; filePath: string }) => void) => {
    ipcRenderer.on('open-lum-file', (_event, data) => callback(data))
  },
  onOpenExternalFile: (callback: (data: { fileName: string; content: string; fileType: string; filePath?: string; isPdf?: boolean }) => void) => {
    ipcRenderer.on('open-external-file', (_event, data) => callback(data))
  },
  removeOpenLumFileListener: () => {
    ipcRenderer.removeAllListeners('open-lum-file')
  },
  removeOpenExternalFileListener: () => {
    ipcRenderer.removeAllListeners('open-external-file')
  },

  // Auto-updater olayları
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info))
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_event, error) => callback(error))
  },
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Storage API
  storage: {
    getNotes: () => ipcRenderer.invoke('storage:getNotes'),
    saveNotes: (notes: any[]) => ipcRenderer.invoke('storage:saveNotes', notes),
    getFolders: () => ipcRenderer.invoke('storage:getFolders'),
    saveFolders: (folders: any[]) => ipcRenderer.invoke('storage:saveFolders', folders),
    getSettings: () => ipcRenderer.invoke('storage:getSettings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('storage:saveSettings', settings),
    clearAll: () => ipcRenderer.invoke('storage:clearAll'),
    getUserDataPath: () => ipcRenderer.invoke('storage:getUserDataPath'),
  },

  // Export API (artık html2pdf.js kullanıyoruz; yine de geriye dönük uyumluluk)
  exportToPdf: (title: string, htmlContent: string) => ipcRenderer.invoke('export:pdf', { title, htmlContent }),
})

