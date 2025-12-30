import { get, set, del, clear } from 'idb-keyval';

// Storage keys for IndexedDB (for migration only)
const NOTES_KEY = 'not-app-notes';
const FOLDERS_KEY = 'not-app-folders';
const SETTINGS_KEY = 'not-app-settings';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.storage;

// IndexedDB storage (fallback for web or migration)
const idbStorage = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await get(key);
    } catch (error) {
      console.error(`Error getting ${key} from IndexedDB:`, error);
      return undefined;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await set(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in IndexedDB:`, error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await del(key);
    } catch (error) {
      console.error(`Error deleting ${key} from IndexedDB:`, error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await clear();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  },
};

// File-based storage for Electron
const fileStorage = {
  async getNotes(): Promise<any[]> {
    try {
      if (!window.electronAPI) return [];
      return await window.electronAPI.storage.getNotes();
    } catch (error) {
      console.error('Error getting notes from file storage:', error);
      return [];
    }
  },

  async saveNotes(notes: any[]): Promise<void> {
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.storage.saveNotes(notes);
    } catch (error) {
      console.error('Error saving notes to file storage:', error);
    }
  },

  async getFolders(): Promise<any[]> {
    try {
      if (!window.electronAPI) return [];
      return await window.electronAPI.storage.getFolders();
    } catch (error) {
      console.error('Error getting folders from file storage:', error);
      return [];
    }
  },

  async saveFolders(folders: any[]): Promise<void> {
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.storage.saveFolders(folders);
    } catch (error) {
      console.error('Error saving folders to file storage:', error);
    }
  },

  async getSettings(): Promise<any> {
    try {
      if (!window.electronAPI) return null;
      return await window.electronAPI.storage.getSettings();
    } catch (error) {
      console.error('Error getting settings from file storage:', error);
      return null;
    }
  },

  async saveSettings(settings: any): Promise<void> {
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.storage.saveSettings(settings);
    } catch (error) {
      console.error('Error saving settings to file storage:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.storage.clearAll();
    } catch (error) {
      console.error('Error clearing file storage:', error);
    }
  },
};

// Main storage API - uses file storage in Electron, IndexedDB as fallback
export const notesStorage = {
  async getNotes(): Promise<any[]> {
    let notes: any[] = [];
    if (isElectron) {
      notes = await fileStorage.getNotes();
    } else {
      const idbNotes = await idbStorage.get<any[]>(NOTES_KEY);
      notes = idbNotes || [];
    }

    // Return notes as-is without PDF special handling
    return notes;
  },

  async saveNotes(notes: any[]): Promise<void> {
    // Serileştirme güvenliği: Blob/File içeren attachment'ları temizle
    const sanitizedNotes = (notes || []).map((n: any) => {
      if (!n?.attachment) return n;
      const a = n.attachment;
      const blobLike: any = a.blob;

      // Blob/File serileştirilemez; metadata kalsın, blob'ı çıkar
      if (typeof Blob !== 'undefined' && (blobLike instanceof Blob || blobLike instanceof File)) {
        return {
          ...n,
          attachment: {
            name: a.name,
            type: a.type,
            size: a.size ?? 0,
            blob: undefined,
          },
        };
      }

      // Zaten string URL veya { path } ise dokunma
      return n;
    });

    if (isElectron) {
      await fileStorage.saveNotes(sanitizedNotes);
    } else {
      await idbStorage.set(NOTES_KEY, sanitizedNotes);
    }
  },

  async getFolders(): Promise<any[]> {
    let folders: any[] = [];
    
    if (isElectron) {
      folders = await fileStorage.getFolders();
    } else {
      const storedFolders = await idbStorage.get<any[]>(FOLDERS_KEY);
      folders = storedFolders || [];
    }
    
    // Migrate old folders without isPinned property
    const migratedFolders = folders.map(folder => ({
      ...folder,
      isPinned: folder.isPinned !== undefined ? folder.isPinned : false,
    }));
    
    // Save migrated folders if any changes were made
    if (migratedFolders.some((f, i) => f.isPinned !== folders[i]?.isPinned)) {
      await this.saveFolders(migratedFolders);
    }
    
    return migratedFolders;
  },

  async saveFolders(folders: any[]): Promise<void> {
    if (isElectron) {
      await fileStorage.saveFolders(folders);
    } else {
      await idbStorage.set(FOLDERS_KEY, folders);
    }
  },

  async getSettings(): Promise<any> {
    if (isElectron) {
      return await fileStorage.getSettings();
    } else {
      const settings = await idbStorage.get<any>(SETTINGS_KEY);
      return settings || null;
    }
  },

  async saveSettings(settings: any): Promise<void> {
    if (isElectron) {
      await fileStorage.saveSettings(settings);
    } else {
      await idbStorage.set(SETTINGS_KEY, settings);
    }
  },

  async clearAllData(): Promise<void> {
    if (isElectron) {
      await fileStorage.clearAll();
    } else {
      await idbStorage.clearAll();
    }
  },
};

// Debounce utility for auto-save
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Migration utility: Move data from IndexedDB to file storage (Electron)
export async function migrateToFileStorage(): Promise<void> {
  if (!isElectron) {
    console.log('Not running in Electron, skipping file storage migration');
    return;
  }

  try {
    console.log('Starting migration from IndexedDB to file storage...');
    
    // Check if file storage already has data
    const existingNotes = await fileStorage.getNotes();
    if (existingNotes && existingNotes.length > 0) {
      console.log('File storage already has data, skipping migration');
      return;
    }

    // Get data from IndexedDB
    const idbNotes = await idbStorage.get<any[]>(NOTES_KEY);
    const idbFolders = await idbStorage.get<any[]>(FOLDERS_KEY);
    const idbSettings = await idbStorage.get<any>(SETTINGS_KEY);

    // Migrate notes
    if (idbNotes && idbNotes.length > 0) {
      await fileStorage.saveNotes(idbNotes);
      console.log(`Migrated ${idbNotes.length} notes from IndexedDB to file storage`);
    }

    // Migrate folders
    if (idbFolders && idbFolders.length > 0) {
      await fileStorage.saveFolders(idbFolders);
      console.log(`Migrated ${idbFolders.length} folders from IndexedDB to file storage`);
    }

    // Migrate settings
    if (idbSettings) {
      await fileStorage.saveSettings(idbSettings);
      console.log('Migrated settings from IndexedDB to file storage');
    }

    // Clear IndexedDB after successful migration
    await idbStorage.clearAll();
    console.log('Migration completed successfully, IndexedDB cleared');

    // Log storage location
    if (window.electronAPI) {
      const userDataPath = await window.electronAPI.storage.getUserDataPath();
      console.log('Data is now stored in:', userDataPath);
    }
  } catch (error) {
    console.error('Error during migration to file storage:', error);
  }
}

// Legacy migration: Move data from LocalStorage to current storage
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // Check if data exists in LocalStorage
    const localNotes = localStorage.getItem('not-app-notes');
    const localSettings = localStorage.getItem('not-app-settings');

    if (!localNotes && !localSettings) {
      return; // No data to migrate
    }

    console.log('Starting migration from LocalStorage...');

    // Migrate notes
    if (localNotes) {
      const parsedNotes = JSON.parse(localNotes);
      if (parsedNotes?.state?.notes) {
        await notesStorage.saveNotes(parsedNotes.state.notes);
        console.log('Migrated notes from LocalStorage');
      }
      if (parsedNotes?.state?.folders) {
        await notesStorage.saveFolders(parsedNotes.state.folders);
        console.log('Migrated folders from LocalStorage');
      }
    }

    // Migrate settings
    if (localSettings) {
      const parsedSettings = JSON.parse(localSettings);
      if (parsedSettings?.state) {
        await notesStorage.saveSettings(parsedSettings.state);
        console.log('Migrated settings from LocalStorage');
      }
    }

    // Clear LocalStorage after successful migration
    localStorage.removeItem('not-app-notes');
    localStorage.removeItem('not-app-folders');
    localStorage.removeItem('not-app-settings');
    console.log('LocalStorage migration completed successfully');
  } catch (error) {
    console.error('Error during LocalStorage migration:', error);
  }
}

