# 🏗️ Architecture Overview

## Component Hierarchy

```
App.tsx (Main Container)
├── Sidebar.tsx (Left Panel)
│   ├── Search Bar
│   ├── Folders Section
│   │   ├── DroppableFolder (Drag & Drop Target)
│   │   │   └── DraggableNote (Draggable Items)
│   │   └── Create Folder Button
│   └── Folderless Notes
│       └── DraggableNote (Draggable Items)
│
├── HomePage.tsx (Welcome Screen)
│   ├── Clock.tsx (Real-time Clock)
│   └── Action Buttons
│
├── Editor.tsx (Note Editor)
│   ├── Toolbar (Formatting Controls)
│   │   ├── Bold, Italic, Underline, Strikethrough
│   │   ├── Font Size Dropdown
│   │   └── List Controls
│   ├── Title Input
│   ├── Content Editor (contentEditable)
│   └── Toast.tsx (Save Notification)
│
├── FloatingControls.tsx (Top Right)
│   ├── Settings Button
│   └── Home Button
│
└── SettingsModal.tsx (Settings Overlay)
    ├── Modal.tsx (Base Modal)
    ├── Theme Selector
    ├── Language Selector
    └── Delete All Data Button
        └── Confirmation Modal
```

## State Management (Zustand)

### useSettingsStore
```typescript
{
  theme: 'light' | 'dark' | 'ocean' | 'sakura'
  language: 'en' | 'tr'
  sidebarWidth: number
  sidebarCollapsed: boolean
  // Actions: setTheme, setLanguage, setSidebarWidth, etc.
}
```

### useNotesStore
```typescript
{
  notes: Note[]
  folders: Folder[]
  activeNoteId: string | null
  // Actions: createNote, updateNote, deleteNote, moveNoteToFolder, etc.
}
```

## Data Flow

### Creating a Note
```
HomePage → createNote() → useNotesStore
  ↓
Store updates notes array
  ↓
Sets activeNoteId
  ↓
App.tsx detects change → Shows Editor
```

### Saving a Note
```
Editor → User types → onInput/onBlur
  ↓
updateNote(id, { title, content })
  ↓
useNotesStore updates note
  ↓
LocalStorage persists data
  ↓
Toast notification appears
```

### Drag & Drop
```
User drags note → DraggableNote
  ↓
Hovers over folder → DroppableFolder
  ↓
onDragEnd event → moveNoteToFolder()
  ↓
useNotesStore updates note.folderId
  ↓
UI updates with animation
```

### Theme Switching
```
SettingsModal → setTheme('sakura')
  ↓
useSettingsStore updates theme
  ↓
App.tsx useEffect detects change
  ↓
applyTheme() updates CSS variables
  ↓
All components re-render with new colors
```

## Utility Functions

### themes.ts
- `themes` object with color definitions
- `applyTheme()` applies CSS variables to document root

### translations.ts
- `translations` object with en/tr text
- `useTranslation()` hook returns translation function

## Animation Strategy

### Framer Motion Usage

**Page Transitions**
- `initial`, `animate`, `exit` props
- Smooth opacity and position changes

**Button Interactions**
- `whileHover`: Scale up, lift
- `whileTap`: Scale down
- Spring physics for natural feel

**List Animations**
- Stagger children for cascading effect
- Fade + slide for list items

**Modal Animations**
- Backdrop fade in
- Content spring animation
- Exit animations

## Styling Approach

### CSS Variables (Theme System)
```css
:root {
  --color-bg: #ffffff;
  --color-text: #0f172a;
  --color-accent: #3b82f6;
  /* etc... */
}
```

### Tailwind CSS
- Utility classes for layout
- Responsive design
- Custom scrollbar styles

### Inline Styles
- Dynamic theme colors via CSS variables
- Component-specific styles
- Animation-related styles

## LocalStorage Schema

### Key: `not-app-settings`
```json
{
  "state": {
    "theme": "light",
    "language": "en",
    "sidebarWidth": 280,
    "sidebarCollapsed": false
  },
  "version": 0
}
```

### Key: `not-app-notes`
```json
{
  "state": {
    "notes": [
      {
        "id": "note-123...",
        "title": "My Note",
        "content": "<p>Note content...</p>",
        "folderId": "folder-456..." | null,
        "createdAt": 1234567890,
        "updatedAt": 1234567890
      }
    ],
    "folders": [
      {
        "id": "folder-456...",
        "name": "My Folder",
        "createdAt": 1234567890
      }
    ],
    "activeNoteId": "note-123..." | null
  },
  "version": 0
}
```

## Performance Optimizations

1. **Zustand Selectors**: Only re-render when specific state changes
2. **Framer Motion**: Hardware-accelerated animations
3. **LocalStorage**: Persisted by Zustand middleware automatically
4. **Lazy Evaluation**: Components only render when needed
5. **Event Delegation**: Efficient event handling in lists

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020 JavaScript features
- CSS Grid and Flexbox
- LocalStorage API
- contentEditable API

## Build Output

### Development
- Vite dev server with HMR
- Fast refresh for React
- Source maps for debugging

### Production
- Optimized bundle
- Code splitting
- Minified CSS and JS
- Tree shaking

## File Size (Approximate)

- **Components**: ~15KB total
- **Stores**: ~3KB
- **Utils**: ~2KB
- **Styles**: ~5KB
- **Dependencies**: ~200KB (minified)
- **Total Bundle**: ~225KB (gzipped: ~75KB)

## Extension Points

Want to add features? Here's where to start:

### Add a new theme
1. Add colors to `themes.ts`
2. Add name to `Theme` type
3. Add translation keys
4. Add button to SettingsModal

### Add formatting option
1. Add button to Editor toolbar
2. Call `execCommand()` with command
3. Add translation keys
4. Style active state

### Add new storage location
1. Create new Zustand store
2. Add persist middleware
3. Import in App.tsx
4. Use in components

---

**This architecture prioritizes:**
- 🎨 Beautiful, smooth UX
- 🚀 Fast performance
- 🔧 Easy maintenance
- 📦 Small bundle size
- 🎯 Student-focused features

