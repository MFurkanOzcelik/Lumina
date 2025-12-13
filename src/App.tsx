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
import { migrateFromLocalStorage } from './utils/storage';

function App() {
  const { theme, sidebarWidth, sidebarCollapsed, isHydrated: settingsHydrated, hydrate: hydrateSettings, setSidebarWidth, setSidebarCollapsed } =
    useSettingsStore();
  const { activeNoteId, isHydrated: notesHydrated, hydrate: hydrateNotes } = useNotesStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showOpenButton, setShowOpenButton] = useState(sidebarCollapsed);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize app: migrate data and hydrate stores
  useEffect(() => {
    const initialize = async () => {
      try {
        // First, migrate any existing LocalStorage data
        await migrateFromLocalStorage();
        
        // Then hydrate both stores from IndexedDB
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Open Sidebar Button - shown only after sidebar close animation completes */}
        <AnimatePresence>
          {showOpenButton && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ 
                scale: 1.1,
                x: 3,
                backgroundColor: 'var(--color-accentHover)'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarCollapsed(false)}
              className="absolute top-6 left-6 z-40 p-3 rounded-xl flex items-center justify-center shadow-xl"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                boxShadow: `0 8px 20px var(--color-shadow)`,
              }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeNoteId ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Editor />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <HomePage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;
