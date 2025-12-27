# Lumina v1.4.0 Release Notes

**Release Date:** December 27, 2025

## 🎯 Overview
Lumina v1.4.0 introduces a powerful Kanban Board with dynamic column management, advanced voice capabilities with Turkish language support, and enhanced editor features including split-screen view and persistent audio recordings.

---

## ✨ Major Features

### 🗂️ Dynamic Kanban Board (NEW)
- **Add/Delete Columns:** Create unlimited custom columns and delete them with one click
- **Auto-Scroll on Drag:** Smoothly scroll horizontally when dragging tasks near screen edges (100px threshold)
- **Task Management:** Add, edit, and delete tasks within any column
- **Persistent Storage:** All columns and tasks saved to localStorage
- **Horizontal Scrollbar:** Board automatically scrolls when content exceeds viewport width
- **Visual Feedback:** Color-coded drag states with smooth animations

**Technical Details:**
- Uses TypeScript interfaces for type-safe column/task structures
- Implements React hooks (useState, useRef, useEffect) for state management
- Features auto-scroll logic with configurable threshold (100px) and speed (10px/30ms)
- Framer Motion integration for smooth animations

---

### 🎙️ Advanced Voice Capabilities

#### Voice Dictation (Turkish Support)
- **Real-time Speech-to-Text:** Convert spoken words to text directly in the editor
- **Turkish Punctuation Mapping:**
  - "nokta" → "." (period)
  - "virgül" → "," (comma)
  - "soru işareti" → "?" (question mark)
  - "ünlem" → "!" (exclamation)
  - "tırnak" → "\"" (quote)
  - "kısaltma" → "'" (apostrophe)
  - "çizgi" → "-" (hyphen)
- **Auto-Capitalization:** First letter after punctuation automatically capitalized
- **Smart Focus Handling:** Automatically focuses editor and manages cursor position
- **Keyboard Shortcut Ready:** Infrastructure for future shortcut integration

#### Audio Recording
- **MediaRecorder Integration:** High-quality WebM audio capture
- **Persistent Storage:** Recordings encoded as base64 and embedded in notes
- **Auto-Naming:** Recordings named with timestamp (e.g., "Ses Kaydı 17:44")
- **Record Management:**
  - Rename recordings via context menu (3-dot menu)
  - Delete recordings with confirmation dialog
  - Visual separator between recordings and text
- **Block Layout:** Each recording takes full line with proper spacing
- **Auto-Newline:** Cursor automatically moves to next line after recording inserted

**Technical Implementation:**
- Base64 encoding for permanent storage (solves blob:// URL persistence issue)
- FileReader API for Blob-to-DataURL conversion
- Dropdown menu UI with smooth animations
- Supports multiple recordings per note

---

### 🔄 Split-Screen with Resizable Panes

#### Features
- **50/50 Split Layout:** Divide editor into left and right panes
- **Resizable Divider:** Drag to adjust pane widths (20-80% range)
- **Smart Drag & Drop:** Drop items to specific panes
- **Edge Detection:** 
  - Left edge (< 25%): Open note on left, close split if active
  - Right edge (> 75%): Auto-split and open on right
  - Center: Main view with drag overlay feedback
  - Split panes: Replace pane content on drop

#### Visual Feedback
- Soft blue overlay (0.1 opacity) for drop zones
- Visible resizer handle with 2x24px blue indicator
- Six drag highlight states for different zones
- Smooth transitions with Framer Motion

**Technical Architecture:**
- Container-relative position calculations for accurate edge detection
- HTML5 Drag & Drop API with custom payload format
- Window event listeners for resizer mouse tracking
- useEffect cleanup for proper resource management

---

### 🎨 Enhanced Editor Features

#### Rich Text Editing
- Contenteditable div with full formatting support
- Syntax-highlighted code blocks (highlight.js integration)
- Turndown service for Markdown conversion
- Auto-save functionality with visual feedback

#### Encryption Support
- AES-256 encryption for sensitive notes
- Password-hint system
- Encrypted overlay with unlock prompt
- Secure storage in localStorage

#### File Attachments
- Drag-and-drop file support
- Document preview with external link
- Size tracking and display

---

## 🐛 Bug Fixes
- **Audio Persistence:** Fixed blob:// URL expiration by implementing base64 encoding
- **Drag Position Calculation:** Corrected edge detection by using container-relative coordinates instead of window coordinates
- **Dictation Focus:** Added explicit focus() and selection fallback for improved reliability
- **Memory Leaks:** Proper cleanup of intervals and event listeners in auto-scroll functionality

---

## 📁 Updated/New Files

### Core Components
- **`src/components/KanbanBoard.tsx`** - Complete Kanban Board implementation with auto-scroll
- **`src/components/Editor.tsx`** - Enhanced with voice dictation, audio recording, split-screen support
- **`src/App.tsx`** - Split-screen orchestration and drag-drop event handling

### Styling
- **`src/index.css`** - New Kanban styles (.kanban-*), drag overlay styles, resizer handle styling

### Configuration
- **`package.json`** - Version updated to 1.4.0

---

## 🎮 User Interface Improvements

### Kanban Board UI
- Compact column design (300px width)
- Add Column button with ghost styling and "+" icon
- Column header with edit (pencil) and delete (trash) icons
- Task count display
- Smooth hover animations

### Voice Controls
- Microphone and recording icons in editor toolbar
- Pulsing red animation for active dictation/recording
- Context menu (3-dot button) for audio management
- Inline delete confirmation dialogs

### Editor Enhancements
- Improved toolbar organization
- Better visual hierarchy for split-screen divider
- Soft shadows and rounded corners for modern look
- Theme-aware color variables

---

## 🔧 Technical Improvements

### Performance Optimizations
- Code splitting opportunities identified (current main chunk: 612KB)
- Dynamic import support for encryption module
- Efficient drag-and-drop event handling
- Optimized auto-scroll interval (30ms tick rate)

### Type Safety
- Full TypeScript support for Kanban structures
- Proper typing for React event handlers
- Interface definitions for Column and Card objects

### Browser APIs Used
- **Web Speech API:** Speech Recognition (tr-TR)
- **MediaRecorder API:** Audio capture
- **FileReader API:** Blob processing
- **HTML5 Drag & Drop:** Cross-component drag handling
- **localStorage:** Data persistence
- **Electron IPC:** Cross-process communication

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Version | 1.4.0 |
| Build Output | dist/ (HTML: 0.63KB, CSS: 29.07KB, JS: 612.58KB) |
| TypeScript Compilation | ✅ Passed |
| Electron Builder | ✅ Success (NSIS installer created) |
| New Components | 1 (KanbanBoard.tsx) |
| Modified Components | 2 (Editor.tsx, App.tsx) |
| CSS Classes Added | 35+ Kanban-related classes |
| Supported Languages | Turkish, English |

---

## 🚀 Installation

### Windows
Download `Lumina Setup 1.4.0.exe` from the releases page and run the installer.

### macOS / Linux
Build from source:
```bash
npm install
npm run electron:build:mac  # or :linux
```

---

## 🎯 Known Limitations

1. **Chunk Size:** Main JavaScript bundle is 612.58KB (>500KB warning)
2. **Dynamic Import:** encryption.ts imported both dynamically and statically
3. **Audio Format:** Limited to WebM format (browser-dependent)
4. **Browser Support:** Voice features require modern browser with Web Speech API support

---

## 📝 Migration Notes

### For v1.3.0 Users
- ✅ All existing notes automatically compatible
- ✅ localStorage data preserved
- ✅ No manual action required
- New Kanban data stored separately in `kanban-columns-v2` key

---

## 🙏 Credits

**Development Team:** Lumina Team

**Key Technologies:**
- React 18 + TypeScript
- Electron 39
- Tailwind CSS
- Framer Motion
- Lucide Icons
- highlight.js
- Turndown (Markdown)
- Web Speech API
- MediaRecorder API

---

## 📢 Future Roadmap

- [ ] Cloud sync for notes and Kanban boards
- [ ] Collaborative editing
- [ ] Mobile app (iOS/Android)
- [ ] PDF annotation tools
- [ ] Custom themes and plugins
- [ ] Keyboard shortcuts editor
- [ ] Export to multiple formats (PDF, DOCX, etc.)
- [ ] Advanced search with filters
- [ ] Note templates

---

## 🐞 Bug Reports & Feedback

Found an issue? Report it on [GitHub Issues](https://github.com/MFurkanOzcelik/Lumina/issues)

---

**Thank you for using Lumina! 🎉**
