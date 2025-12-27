# Lumina v1.4.0 - GitHub Release

## 🚀 Release Title
**Lumina v1.4.0: Kanban Board, Auto-Scroll, Voice Features & Split-Screen**

## 📝 Release Description

Lumina v1.4.0 introduces powerful project management and productivity features with a fully dynamic Kanban Board, advanced Turkish voice capabilities, and enhanced split-screen editing.

---

## ✨ What's New

### 🗂️ Dynamic Kanban Board (NEW)
- Create unlimited columns with one click
- Full task management (CRUD operations)
- **Smart Auto-Scroll:** Automatically scrolls when dragging near edges
- Persistent storage with localStorage
- Modern drag-and-drop with visual feedback
- Edit/Delete columns with confirmation

**Auto-Scroll Details:**
- Activates within 100px of container edges
- Scrolls at 10px per 30ms interval
- Smooth deceleration when cursor leaves edge
- Works seamlessly with task dragging

### 🎙️ Advanced Voice Capabilities
- **Turkish Speech Recognition:** Convert speech to text in real-time
- **Smart Punctuation Mapping:** 7 Turkish punctuation rules
  - "nokta" → "." | "virgül" → "," | "soru işareti" → "?"
  - "ünlem" → "!" | "tırnak" → "\"" | "kısaltma" → "'" | "çizgi" → "-"
- **Auto-Capitalization:** First letter after punctuation capitalized automatically
- **Audio Recording:** High-quality WebM with MediaRecorder API
- **Persistent Storage:** Base64 encoded directly in notes (no blob:// URLs)
- **Recording Management:** Rename, delete, and organize recordings with 3-dot menu

### 🔄 Enhanced Split-Screen
- **Resizable Panes:** 50/50 split with adjustable widths (20-80%)
- **Smart Drag Detection:** Drop notes to specific panes
- **Visual Feedback:** Soft blue overlays show drop zones
- **Smooth Animations:** Framer Motion transitions
- **Container-Relative Calculations:** Accurate edge detection

---

## 🐛 Bug Fixes & Improvements

| Issue | Fix |
|-------|-----|
| Audio Persistence | Implemented Base64 encoding (blob:// → data:// URLs) |
| Drag Position | Corrected edge detection (window → container-relative coords) |
| Dictation Focus | Added explicit focus() and selection fallback |
| Memory Leaks | Proper interval cleanup and event listener removal |
| Scroll Reset | Auto-scroll stops immediately after drag completes |

---

## 📊 Release Statistics

```
Version:        1.4.0
Build Output:   dist/ (JS: 612.58KB, CSS: 29.07KB, HTML: 0.63KB)
Files Changed:  14
Lines Added:    +2427
Lines Removed:  -362
Commits:        4 (including release docs)
Build Time:     ~5 seconds
```

---

## 🎯 Key Technologies

- **React 18** with TypeScript
- **Web Speech API** (Turkish language support)
- **MediaRecorder API** (Audio capture)
- **HTML5 Drag & Drop** (Task movement)
- **Electron** (Desktop app)
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations)

---

## 📥 Installation

### Windows
Download `Lumina Setup 1.4.0.exe` and run the installer.

### macOS / Linux
Build from source:
```bash
git clone https://github.com/MFurkanOzcelik/Lumina.git
cd Lumina
npm install
npm run electron:build:mac  # or :linux
```

---

## 📖 Documentation

- **Full Release Notes:** [RELEASE_NOTES_v1.4.0.md](RELEASE_NOTES_v1.4.0.md)
- **Turkish Summary:** [UPDATE_SUMMARY_v1.4.0.md](UPDATE_SUMMARY_v1.4.0.md)
- **Completion Report:** [COMPLETION_REPORT_v1.4.0.md](COMPLETION_REPORT_v1.4.0.md)

---

## 🚀 Usage Guide

### Kanban Board
1. Click "Sütun Ekle" (Add Column) button
2. Enter column name
3. Add tasks with the input field
4. Drag tasks between columns
5. Board auto-scrolls near edges

### Voice Dictation
1. Click 🎤 microphone icon
2. Speak in Turkish
3. Punctuation automatically inserted
4. Press to stop

### Audio Recording
1. Click ⏺️ square icon
2. Speak or play audio
3. Recording saves automatically
4. Use ⋮ menu to rename/delete

### Split-Screen
1. Drag note to right edge → Auto-split
2. Drag to left edge → Open in left pane
3. Drag divider → Adjust pane widths
4. Drag to center → Main view

---

## ⚠️ Known Limitations

1. **Chunk Size:** Main JS bundle is 612KB (>500KB threshold)
2. **Browser Support:** Voice features require modern browser
3. **Audio Format:** WebM format only
4. **Dynamic Imports:** encryption.ts imported both ways

---

## 🎉 Migration from v1.3.0

✅ Fully backward compatible  
✅ All existing notes preserved  
✅ No manual data migration needed  
✅ New Kanban data stored separately

---

## 🤝 Contributing

Found a bug? Have a feature request?  
[Open an Issue](https://github.com/MFurkanOzcelik/Lumina/issues)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Credits

**Development:** Lumina Team  
**Contributors:** Special thanks to the community

---

## 📞 Support

- **GitHub Issues:** [Report bugs](https://github.com/MFurkanOzcelik/Lumina/issues)
- **Documentation:** [README.md](README.md)
- **Roadmap:** [ROADMAP.md](ROADMAP.md)

---

**Happy note-taking! 📝✨**

Release Date: December 27, 2025  
Commit: d1de995  
Branch: main
