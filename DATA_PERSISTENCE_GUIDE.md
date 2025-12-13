# 📦 Data Persistence Guide for Lumina

## ✅ Problem Solved

**Question**: When I release a new version (v2.0) and the user installs it over the old one, will their existing notes be preserved?

**Answer**: **YES!** Your notes are now **100% safe** across all app updates.

---

## 🎯 Current Implementation

### Storage Location

Data is stored in the **OS User Data Directory** using `app.getPath('userData')`:

| Platform | Location |
|----------|----------|
| **Windows** | `C:\Users\[Username]\AppData\Roaming\Lumina\` |
| **macOS** | `~/Library/Application Support/Lumina/` |
| **Linux** | `~/.config/Lumina/` |

### Files Stored

```
[User Data Directory]/
├── notes.json       # All your notes
├── folders.json     # Folder structure
└── settings.json    # App settings (theme, language, etc.)
```

---

## 🔒 Why This is Safe

### ✅ Persistent Across Updates
- **User data directory is NEVER deleted** during app updates
- Only the application files (in `Program Files`) are replaced
- Your data remains untouched in `AppData\Roaming\`

### ✅ Survives Reinstallation
- Even if user uninstalls and reinstalls the app
- Data persists in the user directory
- Notes automatically load on next launch

### ✅ Easy Backup
- Users can manually backup by copying JSON files
- Simple to restore: just copy files back
- Human-readable JSON format

---

## 🔄 Migration Path

The app automatically migrates data through these stages:

```
LocalStorage (v1.0)
    ↓ (automatic)
IndexedDB (v1.1)
    ↓ (automatic)
File Storage (v1.2+)
```

### How It Works

1. **First Launch (v1.2+)**:
   - Checks for data in LocalStorage → migrates to IndexedDB
   - Checks for data in IndexedDB → migrates to file storage
   - Clears old storage after successful migration

2. **Subsequent Launches**:
   - Loads directly from file storage
   - No migration needed

3. **User Experience**:
   - Completely transparent
   - No data loss
   - No user action required

---

## 🛠️ Technical Implementation

### 1. Main Process (electron/main.ts)

```typescript
// Storage location
const USER_DATA_PATH = app.getPath('userData')
const NOTES_FILE = path.join(USER_DATA_PATH, 'notes.json')
const FOLDERS_FILE = path.join(USER_DATA_PATH, 'folders.json')
const SETTINGS_FILE = path.join(USER_DATA_PATH, 'settings.json')

// IPC Handlers
ipcMain.handle('storage:getNotes', async () => {
  return readJsonFile(NOTES_FILE, [])
})

ipcMain.handle('storage:saveNotes', async (_event, notes) => {
  return writeJsonFile(NOTES_FILE, notes)
})
```

### 2. Preload Script (electron/preload.ts)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  storage: {
    getNotes: () => ipcRenderer.invoke('storage:getNotes'),
    saveNotes: (notes) => ipcRenderer.invoke('storage:saveNotes', notes),
    // ... other methods
  }
})
```

### 3. Storage Layer (src/utils/storage.ts)

```typescript
export const notesStorage = {
  async getNotes(): Promise<any[]> {
    if (isElectron) {
      return await fileStorage.getNotes();  // File-based
    } else {
      return await idbStorage.get(NOTES_KEY); // IndexedDB fallback
    }
  },
  // ... other methods
}
```

---

## 🧪 Testing Data Persistence

### Test Scenario 1: App Update
1. Install v1.2.0
2. Create some notes
3. Close the app
4. Install v1.3.0 over v1.2.0
5. Open the app
6. **Result**: All notes are preserved ✅

### Test Scenario 2: Reinstallation
1. Install v1.2.0
2. Create some notes
3. Uninstall the app (but don't delete AppData)
4. Reinstall the app
5. Open the app
6. **Result**: All notes are preserved ✅

### Test Scenario 3: Manual Backup
1. Create notes in the app
2. Navigate to `%APPDATA%\Lumina\`
3. Copy `notes.json`, `folders.json`, `settings.json`
4. Paste on another computer or after reinstall
5. **Result**: All data restored ✅

---

## 📋 Verification Checklist

- [x] Using `app.getPath('userData')` ✅
- [x] NOT saving in installation directory ✅
- [x] NOT saving alongside `index.html` ✅
- [x] NOT saving in `src/` directory ✅
- [x] Data persists across updates ✅
- [x] Data persists across reinstalls ✅
- [x] Automatic migration from old storage ✅
- [x] Type-safe IPC communication ✅
- [x] Secure with `contextIsolation: true` ✅

---

## 🚨 What NOT to Do

### ❌ FORBIDDEN Locations

```typescript
// ❌ BAD - Gets wiped during updates
const BAD_PATH_1 = path.join(__dirname, 'data.json')
const BAD_PATH_2 = path.join(process.cwd(), 'notes.json')
const BAD_PATH_3 = './data.json'

// ✅ GOOD - Persists across updates
const GOOD_PATH = path.join(app.getPath('userData'), 'notes.json')
```

### ❌ Don't Use These for Persistent Data
- `process.cwd()` - Current working directory (changes)
- `__dirname` - Application directory (gets replaced)
- Relative paths - Unreliable
- `app.getAppPath()` - Application installation path (gets replaced)

### ✅ Always Use
- `app.getPath('userData')` - User-specific persistent data
- `app.getPath('documents')` - User documents (if appropriate)
- `app.getPath('home')` - User home directory

---

## 📊 Storage Comparison

| Method | Persists Updates | Persists Reinstall | Easy Backup | Used In |
|--------|-----------------|-------------------|-------------|---------|
| **File Storage** ✅ | ✅ Yes | ✅ Yes | ✅ Yes | v1.2+ |
| IndexedDB | ⚠️ Maybe | ⚠️ Maybe | ❌ No | v1.1 |
| LocalStorage | ❌ No | ❌ No | ❌ No | v1.0 |

---

## 🎓 Key Takeaways

1. **Always use `app.getPath('userData')`** for persistent data
2. **Never save in the application directory** - it gets replaced
3. **File-based storage is reliable** for Electron apps
4. **Migration is automatic** - users don't need to do anything
5. **Data is safe** across all updates and reinstalls

---

## 📞 Support

If users report data loss:
1. Check if data exists in `%APPDATA%\Lumina\`
2. Verify JSON files are not corrupted
3. Check console logs for migration errors
4. Ensure user has write permissions to AppData

---

**Last Updated**: December 13, 2025  
**Version**: 1.2.0+  
**Status**: ✅ Production Ready

