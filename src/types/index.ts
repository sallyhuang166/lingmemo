export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  folderId: string | null;
  title: string;
  content: string;
  isDeleted: boolean;
  isFavorite: boolean;
  tags: string[];
  aiSummary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteSearchResult {
  note: Note;
  matches: string[];
}
