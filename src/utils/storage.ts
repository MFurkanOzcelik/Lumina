import { get, set, del, clear } from 'idb-keyval';

// Storage keys
const NOTES_KEY = 'not-app-notes';
const FOLDERS_KEY = 'not-app-folders';
const SETTINGS_KEY = 'not-app-settings';

// Generic storage functions
export const storage = {
  // Get data from IndexedDB
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await get(key);
    } catch (error) {
      console.error(`Error getting ${key} from IndexedDB:`, error);
      return undefined;
    }
  },

  // Set data in IndexedDB
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await set(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in IndexedDB:`, error);
    }
  },

  // Delete data from IndexedDB
  async delete(key: string): Promise<void> {
    try {
      await del(key);
    } catch (error) {
      console.error(`Error deleting ${key} from IndexedDB:`, error);
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await clear();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  },
};

// Specific storage functions for the app
export const notesStorage = {
  async getNotes(): Promise<any[]> {
    const notes = await storage.get<any[]>(NOTES_KEY);
    return notes || [];
  },

  async saveNotes(notes: any[]): Promise<void> {
    await storage.set(NOTES_KEY, notes);
  },

  async getFolders(): Promise<any[]> {
    const folders = await storage.get<any[]>(FOLDERS_KEY);
    return folders || [];
  },

  async saveFolders(folders: any[]): Promise<void> {
    await storage.set(FOLDERS_KEY, folders);
  },

  async getSettings(): Promise<any> {
    const settings = await storage.get<any>(SETTINGS_KEY);
    return settings || null;
  },

  async saveSettings(settings: any): Promise<void> {
    await storage.set(SETTINGS_KEY, settings);
  },

  async clearAllData(): Promise<void> {
    await storage.clearAll();
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

// Migration utility: Move data from LocalStorage to IndexedDB
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // Check if data exists in LocalStorage
    const localNotes = localStorage.getItem('not-app-notes');
    const localSettings = localStorage.getItem('not-app-settings');

    // Migrate notes
    if (localNotes) {
      const parsedNotes = JSON.parse(localNotes);
      if (parsedNotes?.state?.notes) {
        await notesStorage.saveNotes(parsedNotes.state.notes);
        console.log('Migrated notes from LocalStorage to IndexedDB');
      }
      if (parsedNotes?.state?.folders) {
        await notesStorage.saveFolders(parsedNotes.state.folders);
        console.log('Migrated folders from LocalStorage to IndexedDB');
      }
    }

    // Migrate settings
    if (localSettings) {
      const parsedSettings = JSON.parse(localSettings);
      if (parsedSettings?.state) {
        await notesStorage.saveSettings(parsedSettings.state);
        console.log('Migrated settings from LocalStorage to IndexedDB');
      }
    }

    // Clear LocalStorage after successful migration
    localStorage.removeItem('not-app-notes');
    localStorage.removeItem('not-app-folders');
    localStorage.removeItem('not-app-settings');
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

