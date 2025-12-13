# Setup Instructions

## Prerequisites

Make sure you have Node.js installed (version 16 or higher recommended).

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - The app will be available at `http://localhost:5173`
   - Or the URL shown in your terminal

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
not-app/
├── src/
│   ├── components/       # React components
│   │   ├── Button.tsx
│   │   ├── Clock.tsx
│   │   ├── Editor.tsx
│   │   ├── FloatingControls.tsx
│   │   ├── HomePage.tsx
│   │   ├── Modal.tsx
│   │   ├── PageTransition.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── Sidebar.tsx
│   │   └── Toast.tsx
│   ├── store/           # Zustand state management
│   │   ├── useNotesStore.ts
│   │   └── useSettingsStore.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── themes.ts
│   │   └── translations.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Features Implemented

✅ **4 Theme Modes**: Light, Dark, Ocean, Sakura
✅ **Bilingual Support**: English & Turkish
✅ **Rich Text Editor**: Full formatting toolbar
✅ **Drag & Drop**: Organize notes into folders
✅ **Real-time Search**: Filter notes instantly
✅ **Resizable Sidebar**: Customize your workspace
✅ **LocalStorage Persistence**: All data saved locally
✅ **Smooth Animations**: Framer Motion throughout
✅ **Factory Reset**: Clear all data option
✅ **Auto-save**: Notes save automatically
✅ **Responsive Design**: Works on all screen sizes

## Tips

- All data is stored in LocalStorage
- Notes auto-save when you blur the editor
- Drag notes from "Folderless Notes" into folders
- Use the settings gear icon to change themes and language
- The home icon returns you to the welcome screen
- Font size panel shows 6 items at a time with scroll

## Troubleshooting

If you encounter any issues:

1. Clear your browser cache
2. Delete `node_modules` and run `npm install` again
3. Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
4. Check the browser console for any errors

Enjoy your new note-taking experience! 📝✨

