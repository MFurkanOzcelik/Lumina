export type Theme = 'light' | 'dark' | 'ocean' | 'sakura';
export type Language = 'en' | 'tr';

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  // Cursor position for restoring user's place in the note
  cursorPosition?: number;
  // File attachment support (stored as Blob in IndexedDB)
  attachment?: {
    name: string;
    type: string;
    size: number;
    blob: Blob;
  };
  // Tags for categorization
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize: number;
  listType: 'none' | 'bullet' | 'numbered';
}

