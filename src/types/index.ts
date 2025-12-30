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
    // Blob (web), string URL veya Electron’da { path } nesnesi
    blob: Blob | string | { path: string } | undefined;
  };
  // Tags for categorization
  tags?: string[];
  // Encryption support
  isEncrypted?: boolean;
  encryptedContent?: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  isPinned: boolean;
}

export interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize: number;
  listType: 'none' | 'bullet' | 'numbered';
}

