import { create } from 'zustand';
import type { Theme, Language } from '../types';
import { notesStorage, debounce } from '../utils/storage';

interface SecuritySettings {
  masterPasswordHash: string | null;
  passwordHint: string | null;
  isEnabled: boolean;
}

interface SettingsState {
  theme: Theme;
  language: Language;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  security: SecuritySettings;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMasterPassword: (passwordHash: string, hint?: string) => void;
  changeMasterPassword: (newPasswordHash: string, hint?: string) => void;
  disableSecurity: () => void;
  resetAll: () => void;
}

const initialState = {
  theme: 'light' as Theme,
  language: 'en' as Language,
  sidebarWidth: 280,
  sidebarCollapsed: false,
  security: {
    masterPasswordHash: null,
    passwordHint: null,
    isEnabled: false,
  },
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
      security: state.security,
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
      security: state.security,
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
      security: state.security,
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
      security: state.security,
    });
  },

  setMasterPassword: (passwordHash, hint) => {
    set({
      security: {
        masterPasswordHash: passwordHash,
        passwordHint: hint || null,
        isEnabled: true,
      },
    });
    const state = get();
    debouncedSaveSettings({
      theme: state.theme,
      language: state.language,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
      security: state.security,
    });
  },

  changeMasterPassword: (newPasswordHash, hint) => {
    set({
      security: {
        masterPasswordHash: newPasswordHash,
        passwordHint: hint || null,
        isEnabled: true,
      },
    });
    const state = get();
    debouncedSaveSettings({
      theme: state.theme,
      language: state.language,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
      security: state.security,
    });
  },

  disableSecurity: () => {
    set({
      security: {
        masterPasswordHash: null,
        passwordHint: null,
        isEnabled: false,
      },
    });
    const state = get();
    debouncedSaveSettings({
      theme: state.theme,
      language: state.language,
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
      security: state.security,
    });
  },

  resetAll: () => set(initialState),
}));

