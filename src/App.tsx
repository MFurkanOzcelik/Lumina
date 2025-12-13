import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { Editor } from './components/Editor';
import { useSettingsStore } from './store/useSettingsStore';
import { useNotesStore } from './store/useNotesStore';
import { applyTheme } from './utils/themes';
import { migrateFromLocalStorage, migrateToFileStorage } from './utils/storage';

// File open handler types (storage types are in electron.d.ts)

function App() {
  const { theme, sidebarWidth, sidebarCollapsed, isHydrated: settingsHydrated, hydrate: hydrateSettings, setSidebarWidth, setSidebarCollapsed } =
    useSettingsStore();
  const { activeNoteId, isHydrated: notesHydrated, hydrate: hydrateNotes, createNote, setActiveNote } = useNotesStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showOpenButton, setShowOpenButton] = useState(sidebarCollapsed);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize app: migrate data and hydrate stores
  useEffect(() => {
    const initialize = async () => {
      try {
        // Step 1: Migrate any existing LocalStorage data to IndexedDB (legacy)
        await migrateFromLocalStorage();
        
        // Step 2: If running in Electron, migrate IndexedDB to file storage
        await migrateToFileStorage();
        
        // Step 3: Hydrate both stores from persistent storage
        await Promise.all([
          hydrateSettings(),
          hydrateNotes(),
        ]);
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [hydrateSettings, hydrateNotes]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (sidebarCollapsed) {
      // Wait for sidebar close animation to complete (0.75s)
      const timer = setTimeout(() => {
        setShowOpenButton(true);
      }, 750);
      return () => clearTimeout(timer);
    } else {
      setShowOpenButton(false);
    }
  }, [sidebarCollapsed]);

  // Handle .lum file opening from Electron
  useEffect(() => {
    if (window.electronAPI?.onOpenLumFile) {
      window.electronAPI.onOpenLumFile((data) => {
        const { fileName, content } = data;
        
        // Parse markdown content (remove title if it exists)
        let noteContent = content;
        let noteTitle = fileName;
        
        // If content starts with # title, extract it
        const titleMatch = content.match(/^#\s+(.+)\n\n/);
        if (titleMatch) {
          noteTitle = titleMatch[1];
          noteContent = content.substring(titleMatch[0].length);
        }
        
        // Create a new note with the imported content
        const newNoteId = createNote(null);
        
        // Update the note with title and content
        // We need to wait a bit for the note to be created
        setTimeout(() => {
          const notesStore = useNotesStore.getState();
          notesStore.updateNote(newNoteId, { 
            title: noteTitle,
            content: noteContent 
          });
          setActiveNote(newNoteId);
        }, 100);
      });
      
      return () => {
        if (window.electronAPI?.removeOpenLumFileListener) {
          window.electronAPI.removeOpenLumFileListener();
        }
      };
    }
  }, [createNote, setActiveNote]);


  // Show loading screen while initializing
  if (isInitializing || !settingsHydrated || !notesHydrated) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: 'var(--color-accent)' }}
          />
          <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
            Yükleniyor...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <AnimatePresence>
        {!sidebarCollapsed && (
          <Sidebar
            width={sidebarWidth}
            onResize={setSidebarWidth}
            collapsed={sidebarCollapsed}
            onSettingsClick={() => setShowSettings(true)}
          />
        )}
      </AnimatePresence>

      <motion.div 
        className="flex-1 flex flex-col h-screen overflow-hidden relative"
        initial={false}
        animate={{ 
          marginLeft: sidebarCollapsed ? 0 : 0,
          width: '100%'
        }}
        transition={{ 
          duration: 0.75, 
          ease: "easeInOut" 
        }}
        style={{
          transition: 'all 0.75s ease-in-out'
        }}
      >
        {/* Open Sidebar Button - shown only after sidebar close animation completes */}
        <AnimatePresence>
          {showOpenButton && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ 
                scale: 1.05,
                backgroundColor: 'var(--color-accentHover)'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarCollapsed(false)}
              className="absolute left-6 z-40 p-2 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                top: '1rem', // Align with toolbar buttons (py-4 = 1rem top padding)
              }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeNoteId ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Editor />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <HomePage />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;
