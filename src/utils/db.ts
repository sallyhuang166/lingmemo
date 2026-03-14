import Dexie, { type Table } from 'dexie';
import type { Folder, Note } from '../types';

class LingMemoDB extends Dexie {
  folders!: Table<Folder>;
  notes!: Table<Note>;

  constructor() {
    super('LingMemoDB');
    this.version(1).stores({
      folders: 'id, parentId, name, createdAt',
      notes: 'id, folderId, title, isDeleted, isFavorite, *tags, createdAt, updatedAt',
    });
  }
}

export const db = new LingMemoDB();

// Folder operations
export const folderOperations = {
  async getAll(): Promise<Folder[]> {
    return db.folders.toArray();
  },

  async getById(id: string): Promise<Folder | undefined> {
    return db.folders.get(id);
  },

  async getByParentId(parentId: string | null): Promise<Folder[]> {
    return db.folders.where('parentId').equals(parentId ?? '').toArray();
  },

  async create(folder: Folder): Promise<string> {
    return db.folders.add(folder);
  },

  async update(id: string, changes: Partial<Folder>): Promise<number> {
    return db.folders.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    // Get all child folders recursively
    const getAllChildFolderIds = async (parentId: string): Promise<string[]> => {
      const children = await db.folders.where('parentId').equals(parentId).toArray();
      let ids: string[] = [];
      for (const child of children) {
        ids.push(child.id);
        ids = ids.concat(await getAllChildFolderIds(child.id));
      }
      return ids;
    };

    const folderIds = [id, ...await getAllChildFolderIds(id)];

    // Move notes in these folders to root (null folderId)
    await db.notes.where('folderId').anyOf(folderIds).modify({ folderId: '' });

    // Delete folders
    await db.folders.bulkDelete(folderIds);
  },
};

// Note operations
export const noteOperations = {
  async getAll(): Promise<Note[]> {
    return db.notes.where('isDeleted').equals(0).toArray();
  },

  async getById(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  },

  async getByFolderId(folderId: string): Promise<Note[]> {
    return db.notes.where('folderId').equals(folderId).and(n => !n.isDeleted).toArray();
  },

  async getFavorites(): Promise<Note[]> {
    return db.notes.where('isFavorite').equals(1).and(n => !n.isDeleted).toArray();
  },

  async getDeleted(): Promise<Note[]> {
    return db.notes.where('isDeleted').equals(1).toArray();
  },

  async create(note: Note): Promise<string> {
    return db.notes.add(note);
  },

  async update(id: string, changes: Partial<Note>): Promise<number> {
    return db.notes.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.notes.update(id, { isDeleted: true, updatedAt: Date.now() });
  },

  async permanentlyDelete(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  async restore(id: string): Promise<void> {
    await db.notes.update(id, { isDeleted: false, updatedAt: Date.now() });
  },

  async search(query: string): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    const allNotes = await db.notes.where('isDeleted').equals(0).toArray();
    return allNotes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  },
};
