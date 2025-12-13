# Storage API Reference

## Quick Reference for Working with IndexedDB Storage

---

## 📚 Import

```typescript
import { notesStorage, storage, debounce } from '../utils/storage';
```

---

## 🔧 Generic Storage API

### Get Data
```typescript
const data = await storage.get<YourType>('your-key');
// Returns: YourType | undefined
```

### Set Data
```typescript
await storage.set('your-key', yourData);
// Returns: Promise<void>
```

### Delete Data
```typescript
await storage.delete('your-key');
// Returns: Promise<void>
```

### Clear All
```typescript
await storage.clearAll();
// Returns: Promise<void>
```

---

## 📝 Notes Storage API

### Get All Notes
```typescript
const notes = await notesStorage.getNotes();
// Returns: Note[]
```

### Save Notes
```typescript
await notesStorage.saveNotes(notesArray);
// Returns: Promise<void>
```

### Get All Folders
```typescript
const folders = await notesStorage.getFolders();
// Returns: Folder[]
```

### Save Folders
```typescript
await notesStorage.saveFolders(foldersArray);
// Returns: Promise<void>
```

### Get Settings
```typescript
const settings = await notesStorage.getSettings();
// Returns: any | null
```

### Save Settings
```typescript
await notesStorage.saveSettings(settingsObject);
// Returns: Promise<void>
```

### Clear All Data
```typescript
await notesStorage.clearAllData();
// Returns: Promise<void>
```

---

## ⏱️ Debounce Utility

### Create Debounced Function
```typescript
const debouncedSave = debounce(async (data) => {
  await storage.set('key', data);
}, 1000); // Wait 1 second

// Use it
debouncedSave(myData); // Saves after 1s of inactivity
```

---

## 🗂️ Working with File Attachments

### Store a File
```typescript
const file = event.target.files[0];

const attachment = {
  name: file.name,
  type: file.type,
  size: file.size,
  blob: file, // Store Blob directly
};

// Add to note
updateNote(noteId, { attachment });
```

### Retrieve and Display File
```typescript
const note = getActiveNote();

if (note.attachment) {
  // Create URL for display
  const url = URL.createObjectURL(note.attachment.blob);
  
  // Use in iframe
  <iframe src={url} />
  
  // Or download link
  <a href={url} download={note.attachment.name}>
    Download {note.attachment.name}
  </a>
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);
}
```

### Check File Type
```typescript
if (note.attachment) {
  const isPDF = note.attachment.type === 'application/pdf';
  const isWord = note.attachment.type.includes('word');
  const isText = note.attachment.type === 'text/plain';
}
```

---

## 🔄 Zustand Store Integration

### Hydrate Store
```typescript
// In your store
hydrate: async () => {
  const notes = await notesStorage.getNotes();
  set({ notes, isHydrated: true });
}

// In component
useEffect(() => {
  useNotesStore.getState().hydrate();
}, []);
```

### Auto-Save on Change
```typescript
// Create debounced save
const debouncedSave = debounce(async (notes) => {
  await notesStorage.saveNotes(notes);
}, 1000);

// In your action
createNote: (folderId) => {
  set((state) => {
    const newNotes = [...state.notes, newNote];
    debouncedSave(newNotes); // Auto-save
    return { notes: newNotes };
  });
}
```

---

## 🚨 Error Handling

All storage functions include try-catch blocks and log errors to console:

```typescript
try {
  await storage.set('key', data);
} catch (error) {
  console.error('Error setting key in IndexedDB:', error);
  // Function won't throw, just logs error
}
```

---

## 💡 Best Practices

### 1. Always Use Debouncing for Frequent Updates
```typescript
// ❌ Bad: Saves on every keystroke
onChange={(e) => {
  setTitle(e.target.value);
  await notesStorage.saveNotes(notes); // Too frequent!
}}

// ✅ Good: Debounced save
const debouncedSave = debounce(saveNotes, 1000);
onChange={(e) => {
  setTitle(e.target.value);
  debouncedSave(notes); // Efficient!
}}
```

### 2. Check Hydration Before Using Data
```typescript
const { notes, isHydrated } = useNotesStore();

if (!isHydrated) {
  return <LoadingSpinner />;
}

// Now safe to use notes
```

### 3. Clean Up Object URLs
```typescript
useEffect(() => {
  if (note.attachment) {
    const url = URL.createObjectURL(note.attachment.blob);
    setFileUrl(url);
    
    // Clean up on unmount
    return () => URL.revokeObjectURL(url);
  }
}, [note.attachment]);
```

### 4. Handle Large Files Gracefully
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const handleFileUpload = (file: File) => {
  if (file.size > MAX_FILE_SIZE) {
    alert('File too large! Maximum size is 50MB');
    return;
  }
  
  // Proceed with upload
};
```

---

## 🔍 Debugging

### Check What's Stored
```typescript
// In browser console
const notes = await notesStorage.getNotes();
console.log('Stored notes:', notes);

const folders = await notesStorage.getFolders();
console.log('Stored folders:', folders);
```

### View in DevTools
1. Open DevTools (F12)
2. Application tab → IndexedDB → keyval-store
3. View all stored data

### Clear Data for Testing
```typescript
await notesStorage.clearAllData();
location.reload(); // Refresh app
```

---

## 📊 Storage Limits

### Browser Limits (Approximate):
- **Chrome/Edge:** ~60% of available disk space
- **Firefox:** ~50% of available disk space
- **Safari:** 1GB (can request more)

### Practical Limits:
- Single note with 50MB PDF: ✅ Works fine
- 100 notes with 10MB each: ✅ Works fine
- 1000+ notes: ✅ Works fine (IndexedDB is fast)

---

## 🎯 Common Patterns

### Pattern 1: Load Data on Mount
```typescript
useEffect(() => {
  const loadData = async () => {
    const notes = await notesStorage.getNotes();
    setNotes(notes);
  };
  loadData();
}, []);
```

### Pattern 2: Save on Unmount
```typescript
useEffect(() => {
  return () => {
    // Save before leaving
    notesStorage.saveNotes(notes);
  };
}, [notes]);
```

### Pattern 3: Optimistic Updates
```typescript
const deleteNote = async (id: string) => {
  // Update UI immediately
  setNotes(notes.filter(n => n.id !== id));
  
  // Save to IndexedDB in background
  await notesStorage.saveNotes(notes.filter(n => n.id !== id));
};
```

---

## ⚡ Performance Tips

1. **Batch Updates:** Save multiple changes at once instead of individually
2. **Debounce Writes:** Use 500ms-1000ms debounce for auto-save
3. **Lazy Load Files:** Only create Object URLs when needed
4. **Clean Up URLs:** Always revoke Object URLs to prevent memory leaks
5. **Use Transactions:** IndexedDB handles this automatically with `idb-keyval`

---

## 🔗 Related Files

- `src/utils/storage.ts` - Storage implementation
- `src/store/useNotesStore.ts` - Notes store with IndexedDB
- `src/store/useSettingsStore.ts` - Settings store with IndexedDB
- `src/types/index.ts` - Type definitions including Note with attachment

---

**Happy coding!** 🚀

