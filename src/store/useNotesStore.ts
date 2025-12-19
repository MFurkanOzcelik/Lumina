import { create } from 'zustand';
import type { Note, Folder } from '../types';
import { notesStorage, debounce } from '../utils/storage';

interface NotesState {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  isHydrated: boolean;
  hasUnsavedChanges: boolean;
  hydrate: () => Promise<void>;
  createNote: (folderId?: string | null) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
  createFolder: (name: string) => string;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  togglePinFolder: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  getActiveNote: () => Note | null;
  resetAll: () => Promise<void>;
  saveImmediately: () => Promise<void>;
}

// Debounced save functions with unsaved change tracking
const debouncedSaveNotes = debounce(async (notes: Note[], callback?: () => void) => {
  await notesStorage.saveNotes(notes);
  callback?.();
}, 1000);

const debouncedSaveFolders = debounce(async (folders: Folder[], callback?: () => void) => {
  await notesStorage.saveFolders(folders);
  callback?.();
}, 1000);

export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  folders: [],
  activeNoteId: null,
  isHydrated: false,
  hasUnsavedChanges: false,

  // Hydrate store from IndexedDB on app startup
  hydrate: async () => {
    try {
      const [notes, folders] = await Promise.all([
        notesStorage.getNotes(),
        notesStorage.getFolders(),
      ]);

      set({
        notes,
        folders,
        isHydrated: true,
        hasUnsavedChanges: false,
      });

      console.log('Store hydrated from IndexedDB:', { notes: notes.length, folders: folders.length });
    } catch (error) {
      console.error('Error hydrating store:', error);
      set({ isHydrated: true });
    }
  },

  createNote: (folderId = null) => {
        const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNote: Note = {
          id,
          title: '',
          content: '',
          folderId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [], // Initialize with empty tags array
        };
        set((state) => {
          const newNotes = [...state.notes, newNote];
          debouncedSaveNotes(newNotes, () => set({ hasUnsavedChanges: false }));
          return {
            notes: newNotes,
            activeNoteId: id,
            hasUnsavedChanges: true,
          };
        });
        return id;
      },

      updateNote: (id, updates) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          );
          debouncedSaveNotes(updatedNotes, () => set({ hasUnsavedChanges: false }));
          return { notes: updatedNotes, hasUnsavedChanges: true };
        });
      },

      deleteNote: (id) => {
        set((state) => {
          const filteredNotes = state.notes.filter((note) => note.id !== id);
          debouncedSaveNotes(filteredNotes, () => set({ hasUnsavedChanges: false }));
          return {
            notes: filteredNotes,
            activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
            hasUnsavedChanges: true,
          };
        });
      },
      
      moveNoteToFolder: (noteId, folderId) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === noteId
              ? { ...note, folderId, updatedAt: Date.now() }
              : note
          );
          debouncedSaveNotes(updatedNotes, () => set({ hasUnsavedChanges: false }));
          return { notes: updatedNotes, hasUnsavedChanges: true };
        });
      },

      createFolder: (name) => {
        const id = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newFolder: Folder = {
          id,
          name,
          createdAt: Date.now(),
          isPinned: false,
        };
        set((state) => {
          const newFolders = [...state.folders, newFolder];
          debouncedSaveFolders(newFolders, () => set({ hasUnsavedChanges: false }));
          return { folders: newFolders, hasUnsavedChanges: true };
        });
        return id;
      },

      updateFolder: (id, name) => {
        set((state) => {
          const updatedFolders = state.folders.map((folder) =>
            folder.id === id ? { ...folder, name } : folder
          );
          debouncedSaveFolders(updatedFolders, () => set({ hasUnsavedChanges: false }));
          return { folders: updatedFolders, hasUnsavedChanges: true };
        });
      },

      deleteFolder: (id) => {
        set((state) => {
          const filteredFolders = state.folders.filter((folder) => folder.id !== id);
          const updatedNotes = state.notes.map((note) =>
            note.folderId === id ? { ...note, folderId: null } : note
          );
          debouncedSaveFolders(filteredFolders, () => set({ hasUnsavedChanges: false }));
          debouncedSaveNotes(updatedNotes, () => set({ hasUnsavedChanges: false }));
          return {
            folders: filteredFolders,
            notes: updatedNotes,
            hasUnsavedChanges: true,
          };
        });
      },

      togglePinFolder: (id) => {
        set((state) => {
          const updatedFolders = state.folders.map((folder) =>
            folder.id === id ? { ...folder, isPinned: !folder.isPinned } : folder
          );
          debouncedSaveFolders(updatedFolders, () => set({ hasUnsavedChanges: false }));
          return { folders: updatedFolders, hasUnsavedChanges: true };
        });
      },
      
      setActiveNote: async (id) => {
        const state = get();
        
        // Before switching, save the current note immediately if it exists
        if (state.activeNoteId && state.activeNoteId !== id) {
          // Force immediate save of current state before switching
          await Promise.all([
            notesStorage.saveNotes(state.notes),
            notesStorage.saveFolders(state.folders),
          ]);
        }
        
        set({ activeNoteId: id, hasUnsavedChanges: false });
      },

      getActiveNote: () => {
        const state = get();
        return state.notes.find((note) => note.id === state.activeNoteId) || null;
      },

      resetAll: async () => {
        await notesStorage.clearAllData();
        set({ notes: [], folders: [], activeNoteId: null, hasUnsavedChanges: false });
      },

      saveImmediately: async () => {
        const state = get();
        await Promise.all([
          notesStorage.saveNotes(state.notes),
          notesStorage.saveFolders(state.folders),
        ]);
        set({ hasUnsavedChanges: false });
      },
    }));

