import { create } from 'zustand';
import type { Folder, Note } from '../types';
import { folderApi, noteApi, aiApi } from '../utils/api';
import { folderOperations, noteOperations } from '../utils/db';
import { getAuthToken } from '../utils/api';

interface NoteStore {
  // Data
  folders: Folder[];
  notes: Note[];
  currentFolderId: string | null;
  currentNoteId: string | null;
  searchQuery: string;
  searchResults: Note[];

  // UI State
  isLoading: boolean;
  showCommandPalette: boolean;
  showTrash: boolean;
  useLocal: boolean; // Use local storage if not logged in

  // Actions
  initialize: () => Promise<void>;

  // Folder actions
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setCurrentFolder: (id: string | null) => void;

  // Note actions
  createNote: (folderId?: string | null) => Promise<Note>;
  updateNote: (id: string, changes: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  moveNote: (noteId: string, folderId: string) => Promise<void>;
  setCurrentNote: (id: string | null) => void;

  // Search
  setSearchQuery: (query: string) => void;
  search: (query: string) => Promise<void>;

  // AI
  generateSummary: (noteId: string) => Promise<string>;

  // UI actions
  setShowCommandPalette: (show: boolean) => void;
  setShowTrash: (show: boolean) => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  // Initial state
  folders: [],
  notes: [],
  currentFolderId: null,
  currentNoteId: null,
  searchQuery: '',
  searchResults: [],
  isLoading: true,
  showCommandPalette: false,
  showTrash: false,
  useLocal: true,

  initialize: async () => {
    set({ isLoading: true });

    const token = getAuthToken();
    const useLocal = !token;

    set({ useLocal });

    try {
      if (useLocal) {
        // Use local storage
        const [folders, notes] = await Promise.all([
          folderOperations.getAll(),
          noteOperations.getAll(),
        ]);
        set({ folders, notes, isLoading: false });

        // Create default folder if none exists
        if (folders.length === 0) {
          const defaultFolder = await get().createFolder('我的笔记');
          set({ currentFolderId: defaultFolder.id });
        }
      } else {
        // Use API
        const [foldersRes, notesRes] = await Promise.all([
          folderApi.getAll(),
          noteApi.getAll(),
        ]);
        set({
          folders: foldersRes.folders,
          notes: notesRes.notes as Note[],
          isLoading: false
        });

        // Set current folder
        if (foldersRes.folders.length > 0) {
          set({ currentFolderId: foldersRes.folders[0].id });
        }
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      // Fallback to local storage
      set({ useLocal: true, isLoading: false });
    }
  },

  // Folder actions
  createFolder: async (name, parentId = null) => {
    const { useLocal } = get();

    if (useLocal) {
      const folder: Folder = {
        id: crypto.randomUUID(),
        name,
        parentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await folderOperations.create(folder);
      set(state => ({ folders: [...state.folders, folder] }));
      return folder;
    } else {
      const { folder } = await folderApi.create(name, parentId || undefined);
      set(state => ({ folders: [...state.folders, folder] }));
      return folder;
    }
  },

  updateFolder: async (id, name) => {
    const { useLocal } = get();

    if (useLocal) {
      await folderOperations.update(id, { name });
      set(state => ({
        folders: state.folders.map(f =>
          f.id === id ? { ...f, name, updatedAt: Date.now() } : f
        ),
      }));
    } else {
      const { folder } = await folderApi.update(id, name);
      set(state => ({
        folders: state.folders.map(f => f.id === id ? folder : f),
      }));
    }
  },

  deleteFolder: async (id) => {
    const { useLocal, folders, currentFolderId } = get();

    // Get all folder IDs to delete (including children)
    const getChildIds = (parentId: string): string[] => {
      const children = folders.filter(f => f.parentId === parentId);
      return children.flatMap(c => [c.id, ...getChildIds(c.id)]);
    };
    const allIds = [id, ...getChildIds(id)];

    if (useLocal) {
      await folderOperations.delete(id);
      set(state => ({
        folders: state.folders.filter(f => !allIds.includes(f.id)),
        notes: state.notes.map(n =>
          allIds.includes(n.folderId || '') ? { ...n, folderId: '' } : n
        ),
        currentFolderId: allIds.includes(currentFolderId || '') ? null : currentFolderId,
      }));
    } else {
      await folderApi.delete(id);
      // Remove folder and children from local state
      set(state => ({
        folders: state.folders.filter(f => !allIds.includes(f.id)),
        notes: state.notes.map(n =>
          allIds.includes(n.folderId || '') ? { ...n, folderId: null } : n
        ),
        currentFolderId: allIds.includes(currentFolderId || '') ? null : currentFolderId,
      }));
    }
  },

  setCurrentFolder: (id) => {
    set({ currentFolderId: id, currentNoteId: null });
  },

  // Note actions
  createNote: async (folderId = null) => {
    const { useLocal, currentFolderId } = get();
    const targetFolderId = folderId ?? currentFolderId ?? '';

    if (useLocal) {
      const note: Note = {
        id: crypto.randomUUID(),
        folderId: targetFolderId,
        title: '无标题笔记',
        content: '',
        isDeleted: false,
        isFavorite: false,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await noteOperations.create(note);
      set(state => ({
        notes: [...state.notes, note],
        currentNoteId: note.id,
      }));
      return note;
    } else {
      const { note } = await noteApi.create(targetFolderId || undefined);
      set(state => ({
        notes: [...state.notes, note as Note],
        currentNoteId: note.id,
      }));
      return note as Note;
    }
  },

  updateNote: async (id, changes) => {
    const { useLocal } = get();

    if (useLocal) {
      await noteOperations.update(id, changes);
      set(state => ({
        notes: state.notes.map(n =>
          n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n
        ),
      }));
    } else {
      const { note } = await noteApi.update(id, changes);
      set(state => ({
        notes: state.notes.map(n => n.id === id ? (note as Note) : n),
      }));
    }
  },

  deleteNote: async (id) => {
    const { useLocal } = get();

    if (useLocal) {
      await noteOperations.delete(id);
      set(state => ({
        notes: state.notes.map(n =>
          n.id === id ? { ...n, isDeleted: true, updatedAt: Date.now() } : n
        ),
        currentNoteId: state.currentNoteId === id ? null : state.currentNoteId,
      }));
    } else {
      await noteApi.delete(id);
      set(state => ({
        notes: state.notes.map(n =>
          n.id === id ? { ...n, isDeleted: true } : n
        ),
        currentNoteId: state.currentNoteId === id ? null : state.currentNoteId,
      }));
    }
  },

  restoreNote: async (id) => {
    const { useLocal } = get();

    if (useLocal) {
      await noteOperations.restore(id);
      set(state => ({
        notes: state.notes.map(n =>
          n.id === id ? { ...n, isDeleted: false, updatedAt: Date.now() } : n
        ),
      }));
    } else {
      await noteApi.restore(id);
      set(state => ({
        notes: state.notes.map(n =>
          n.id === id ? { ...n, isDeleted: false } : n
        ),
      }));
    }
  },

  permanentlyDeleteNote: async (id) => {
    const { useLocal } = get();

    if (useLocal) {
      await noteOperations.permanentlyDelete(id);
      set(state => ({
        notes: state.notes.filter(n => n.id !== id),
      }));
    } else {
      await noteApi.permanentDelete(id);
      set(state => ({
        notes: state.notes.filter(n => n.id !== id),
      }));
    }
  },

  toggleFavorite: async (id) => {
    const note = get().notes.find(n => n.id === id);
    if (note) {
      await get().updateNote(id, { isFavorite: !note.isFavorite });
    }
  },

  moveNote: async (noteId, folderId) => {
    await get().updateNote(noteId, { folderId });
  },

  setCurrentNote: (id) => {
    set({ currentNoteId: id });
  },

  // Search
  setSearchQuery: (query) => {
    set({ searchQuery: query });

    // Debounce search
    if ((get() as any).searchTimeout) {
      clearTimeout((get() as any).searchTimeout);
    }

    if (!query) {
      set({ searchResults: [] });
      return;
    }

    (get() as any).searchTimeout = setTimeout(() => {
      get().search(query);
    }, 300);
  },

  search: async (query) => {
    const { useLocal } = get();

    if (useLocal) {
      const results = await noteOperations.search(query);
      set({ searchResults: results });
    } else {
      const { notes } = await noteApi.search(query);
      set({ searchResults: notes as Note[] });
    }
  },

  // AI
  generateSummary: async (noteId) => {
    const { useLocal, notes } = get();
    const note = notes.find(n => n.id === noteId);

    if (!note) return '笔记不存在';

    if (useLocal) {
      // Use local AI
      const { generateSummary } = await import('../utils/ai');
      const summary = await generateSummary(note.content);
      await get().updateNote(noteId, { aiSummary: summary });
      return summary;
    } else {
      // Use API
      const { summary } = await aiApi.generateSummary(noteId);
      // Update local state
      set(state => ({
        notes: state.notes.map(n =>
          n.id === noteId ? { ...n, aiSummary: summary } : n
        ),
      }));
      return summary;
    }
  },

  // UI actions
  setShowCommandPalette: (show) => {
    set({ showCommandPalette: show });
  },

  setShowTrash: (show) => {
    set({ showTrash: show, currentFolderId: null, currentNoteId: null });
  },
}));
