import { create } from 'zustand';
import type { Note, Folder } from '../types';
import { notesStorage, debounce } from '../utils/storage';

interface NotesState {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  createNote: (folderId?: string | null) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
  createFolder: (name: string) => string;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  getActiveNote: () => Note | null;
  resetAll: () => Promise<void>;
}

// Debounced save functions
const debouncedSaveNotes = debounce(async (notes: Note[]) => {
  await notesStorage.saveNotes(notes);
}, 1000);

const debouncedSaveFolders = debounce(async (folders: Folder[]) => {
  await notesStorage.saveFolders(folders);
}, 1000);

export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  folders: [],
  activeNoteId: null,
  isHydrated: false,

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
        };
        set((state) => {
          const newNotes = [...state.notes, newNote];
          debouncedSaveNotes(newNotes);
          return {
            notes: newNotes,
            activeNoteId: id,
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
          debouncedSaveNotes(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      deleteNote: (id) => {
        set((state) => {
          const filteredNotes = state.notes.filter((note) => note.id !== id);
          debouncedSaveNotes(filteredNotes);
          return {
            notes: filteredNotes,
            activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
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
          debouncedSaveNotes(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      createFolder: (name) => {
        const id = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newFolder: Folder = {
          id,
          name,
          createdAt: Date.now(),
        };
        set((state) => {
          const newFolders = [...state.folders, newFolder];
          debouncedSaveFolders(newFolders);
          return { folders: newFolders };
        });
        return id;
      },

      updateFolder: (id, name) => {
        set((state) => {
          const updatedFolders = state.folders.map((folder) =>
            folder.id === id ? { ...folder, name } : folder
          );
          debouncedSaveFolders(updatedFolders);
          return { folders: updatedFolders };
        });
      },

      deleteFolder: (id) => {
        set((state) => {
          const filteredFolders = state.folders.filter((folder) => folder.id !== id);
          const updatedNotes = state.notes.map((note) =>
            note.folderId === id ? { ...note, folderId: null } : note
          );
          debouncedSaveFolders(filteredFolders);
          debouncedSaveNotes(updatedNotes);
          return {
            folders: filteredFolders,
            notes: updatedNotes,
          };
        });
      },
      
      setActiveNote: (id) => set({ activeNoteId: id }),

      getActiveNote: () => {
        const state = get();
        return state.notes.find((note) => note.id === state.activeNoteId) || null;
      },

      resetAll: async () => {
        await notesStorage.clearAllData();
        set({ notes: [], folders: [], activeNoteId: null });
      },
    }));

