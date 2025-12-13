export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {}

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

interface ElectronAPI {
  storage: ElectronStorage
  onOpenLumFile?: (callback: (data: { fileName: string; content: string; filePath: string }) => void) => void
  removeOpenLumFileListener?: () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
};

