import { create } from 'zustand';
import type { Theme, Language } from '../types';
import { notesStorage, debounce } from '../utils/storage';

interface SettingsState {
  theme: Theme;
  language: Language;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  resetAll: () => void;
}

const initialState = {
  theme: 'light' as Theme,
  language: 'en' as Language,
  sidebarWidth: 280,
  sidebarCollapsed: false,
};

// Debounced save for settings
const debouncedSaveSettings = debounce(async (settings: any) => {
  await notesStorage.saveSettings(settings);
}, 500);

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...initialState,
  isHydrated: false,

  // Hydrate settings from IndexedDB
  hydrate: async () => {
    try {
      const settings = await notesStorage.getSettings();
      if (settings) {
        set({
          ...settings,
          sidebarCollapsed: false, // Always start with sidebar open
          isHydrated: true,
        });
        console.log('Settings hydrated from IndexedDB');
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error('Error hydrating settings:', error);
      set({ isHydrated: true });
    }
  },

  setTheme: (theme) => {
    set({ theme });
    const state = get();
    debouncedSaveSettings({
      theme: state.theme,
      language: state.language,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
    });
  },

  setLanguage: (language) => {
    set({ language });
    const state = get();
    debouncedSaveSettings({
      theme: state.theme,
      language: state.language,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
    });
  },

  setSidebarWidth: (sidebarWidth) => {
    set({ sidebarWidth });
    const state = get();
    debouncedSaveSettings({
      theme: state.theme,
      language: state.language,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
    });
  },

  setSidebarCollapsed: (sidebarCollapsed) => {
    set({ sidebarCollapsed });
    const state = get();
    debouncedSaveSettings({
      theme: state.theme,
      language: state.language,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
    });
  },

  resetAll: () => set(initialState),
}));

