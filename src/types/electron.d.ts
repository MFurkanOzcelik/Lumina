interface ElectronStorage {
  getNotes: () => Promise<any[]>
  saveNotes: (notes: any[]) => Promise<boolean>
  getFolders: () => Promise<any[]>
  saveFolders: (folders: any[]) => Promise<boolean>
  getSettings: () => Promise<any>
  saveSettings: (settings: any) => Promise<boolean>
  clearAll: () => Promise<boolean>
  getUserDataPath: () => Promise<string>
}

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  platform: string;
  isElectron: boolean;
  storage: ElectronStorage;
  onOpenLumFile?: (callback: (data: { fileName: string; content: string; filePath: string }) => void) => void;
  removeOpenLumFileListener?: () => void;
  // Auto-updater
  onUpdateAvailable?: (callback: (info: UpdateInfo) => void) => void;
  onUpdateDownloaded?: (callback: (info: UpdateInfo) => void) => void;
  onDownloadProgress?: (callback: (progress: DownloadProgress) => void) => void;
  onUpdateError?: (callback: (error: string) => void) => void;
  installUpdate?: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

