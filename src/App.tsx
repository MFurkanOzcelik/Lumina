import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { Editor } from './components/Editor';
import { KanbanBoard } from './components/KanbanBoard';
import { UpdateNotification } from './components/UpdateNotification';
import { useSettingsStore } from './store/useSettingsStore';
import { useNotesStore } from './store/useNotesStore';
import { applyTheme } from './utils/themes';
import { migrateFromLocalStorage, migrateToFileStorage } from './utils/storage';
import { useTranslation } from './utils/translations';
import { useNotesStore as useNotesStoreSingleton } from './store/useNotesStore';

// File open handler types (storage types are in electron.d.ts)

function App() {
  const { theme, language, sidebarWidth, sidebarCollapsed, isHydrated: settingsHydrated, hydrate: hydrateSettings, setSidebarWidth, setSidebarCollapsed } =
    useSettingsStore();
  const notes = useNotesStore((s) => s.notes);
  const { activeNoteId, isHydrated: notesHydrated, hydrate: hydrateNotes, createNote, setActiveNote, saveImmediately } = useNotesStore();
  
  // Session persistence for expanded folders - read from localStorage on mount
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('app-expandedFolderIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showOpenButton, setShowOpenButton] = useState(sidebarCollapsed);
  const [isInitializing, setIsInitializing] = useState(true);
  const [viewMode, setViewMode] = useState<'editor' | 'kanban'>('editor');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [secondaryNoteId, setSecondaryNoteId] = useState<string | null>(null);
  // Bölünebilir paneller ve akıllı sürükle-bırak durumları
  const [splitPosition, setSplitPosition] = useState<number>(50); // yüzde olarak sol panel genişliği
  type DragHighlight = 'none' | 'main' | 'left-edge' | 'right-edge' | 'left-pane' | 'right-pane';
  const [dragHighlight, setDragHighlight] = useState<DragHighlight>('none');
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const t = useTranslation(language);

  // Not seçildiğinde otomatik olarak Editor görünümüne geç
  const handleNoteSelect = (noteId: string) => {
    setActiveNote(noteId);
    // Kanban modundaysak Editor'a otomatik geç
    if (viewMode === 'kanban') {
      setViewMode('editor');
    }
  };

  // Bölünmüş görünümde yan tarafta dosya açma
  const handleOpenInSplitView = (noteId: string) => {
    setSecondaryNoteId(noteId);
    // Editor moduna geç
    if (viewMode === 'kanban') {
      setViewMode('editor');
    }
  };

  // Yan paneli kapat
  const handleCloseSecondaryPane = () => {
    setSecondaryNoteId(null);
  };

  // Ana konteyner Drag Over - hedef bölgeyi belirle
  const handleMainDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!secondaryNoteId) {
      // Tek görünümde sol/sağ kenar algılama - containerRef'e göre relative
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const containerWidth = rect.width;

      if (relativeX < containerWidth * 0.25) {
        setDragHighlight('left-edge');
      } else if (relativeX > containerWidth * 0.75) {
        setDragHighlight('right-edge');
      } else {
        setDragHighlight('main');
      }
    } else {
      // Split görünümde sol/sağ panel algılama
      const lp = leftPaneRef.current?.getBoundingClientRect();
      const rp = rightPaneRef.current?.getBoundingClientRect();

      if (lp && e.clientX <= lp.right && e.clientY >= lp.top && e.clientY <= lp.bottom) {
        setDragHighlight('left-pane');
      } else if (rp && e.clientX >= rp.left && e.clientY >= rp.top && e.clientY <= rp.bottom) {
        setDragHighlight('right-pane');
      } else {
        setDragHighlight('none');
      }
    }
  };

  const handleMainDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData('application/lumina-note') ||
      e.dataTransfer.getData('file');

    if (!raw) {
      setDragHighlight('none');
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      setDragHighlight('none');
      return;
    }

    const noteId = payload?.id;
    if (!noteId) {
      setDragHighlight('none');
      return;
    }

    if (dragHighlight === 'left-edge') {
      // Sol tarafa bırakıldı - ana panele aç
      setActiveNote(noteId);
      if (viewMode === 'kanban') setViewMode('editor');
      // Split varsa kapat
      if (secondaryNoteId) {
        setSecondaryNoteId(null);
      }
    } else if (dragHighlight === 'right-edge') {
      // Otomatik böl ve sağda aç
      setSecondaryNoteId(noteId);
      if (viewMode === 'kanban') setViewMode('editor');
    } else if (dragHighlight === 'right-pane') {
      setSecondaryNoteId(noteId);
    } else {
      // 'left-pane' veya 'main'
      setActiveNote(noteId);
      if (viewMode === 'kanban') setViewMode('editor');
    }

    setDragHighlight('none');
  };

  const handleMainDragLeave = () => {
    setDragHighlight('none');
  };

  // Resizer - sürükleme ile genişlik ayarı
  const handleResizerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let percent = Math.round((x / rect.width) * 100);
      percent = Math.max(20, Math.min(80, percent)); // 20%-80% aralığı
      setSplitPosition(percent);
    };

    const onMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

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

  // Opsiyonel: Geçersiz attachment verilerini tek seferlik temizle (manuel tetiklemeli)
  useEffect(() => {
    if (localStorage.getItem('RESET_INVALID_ATTACHMENTS') === 'true') {
      const store = useNotesStoreSingleton.getState();
      notes.forEach((n) => {
        const fileLike: any = (n as any)?.attachment?.blob;
        const isValid =
          fileLike == null ||
          (typeof Blob !== 'undefined' && (fileLike instanceof Blob || fileLike instanceof File)) ||
          typeof fileLike === 'string' ||
          (fileLike && typeof fileLike === 'object' && 'path' in fileLike && typeof fileLike.path === 'string');
        if (!isValid) {
          console.warn('[App] Geçersiz attachment tespit edildi, kaldırılıyor:', n.id);
          store.updateNote(n.id, { attachment: undefined });
        }
      });
      localStorage.removeItem('RESET_INVALID_ATTACHMENTS');
    }
  }, [notes]);

  // Validate and restore activeNoteId AFTER notes are loaded
  useEffect(() => {
    // Only run validation after initialization is complete AND notes are hydrated
    if (isInitializing || !notesHydrated) {
      return;
    }

    const savedActiveId = localStorage.getItem('app-activeNoteId');
    
    if (savedActiveId) {
      // Check if the note still exists in the loaded notes array
      const exists = notes.find((n) => n.id === savedActiveId);
      
      if (exists) {
        // Note exists - restore it in the store
        console.log('[App] Restored active note:', savedActiveId);
        setActiveNote(savedActiveId);
      } else {
        // Note doesn't exist - clear it
        console.log('[App] Saved note no longer exists, clearing state');
        setActiveNote(null);
        localStorage.removeItem('app-activeNoteId');
      }
    }
  }, [isInitializing, notesHydrated, notes.length]); // Run when notes are loaded

  // Persist activeNoteId to localStorage immediately on change
  useEffect(() => {
    // Don't persist during initial hydration to avoid overwriting
    if (isInitializing || !notesHydrated) {
      return;
    }

    try {
      if (activeNoteId) {
        localStorage.setItem('app-activeNoteId', activeNoteId);
        console.log('[App] Saved activeNoteId to localStorage:', activeNoteId);
      } else {
        localStorage.removeItem('app-activeNoteId');
        console.log('[App] Cleared activeNoteId from localStorage');
      }
    } catch (error) {
      console.warn('[App] Failed to save activeNoteId to localStorage:', error);
    }
  }, [activeNoteId, isInitializing, notesHydrated]);

  // Persist expandedFolderIds to localStorage immediately on change
  useEffect(() => {
    try {
      localStorage.setItem('app-expandedFolderIds', JSON.stringify(expandedFolderIds));
    } catch (error) {
      console.warn('[App] Failed to save expandedFolderIds to localStorage:', error);
    }
  }, [expandedFolderIds]);

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

  // Handle external file opening (txt, md, json, lum, pdf) from "Open with Lumina"
  useEffect(() => {
    if (window.electronAPI?.onOpenExternalFile) {
      window.electronAPI.onOpenExternalFile((data: any) => {
        const { fileName, content, fileType, filePath, isPdf } = data;
        
        console.log('[App] Dış dosya açılıyor:', fileName, fileType, 'isPdf:', isPdf);
        
        // Create a new note
        const newNoteId = createNote(null);
        
        // For PDF files, attach the file
        if (isPdf && filePath) {
          setTimeout(() => {
            const notesStore = useNotesStore.getState();
            
            // Read the PDF file as blob
            fetch(`file:///${filePath.replace(/\\/g, '/')}`)
              .then(res => res.blob())
              .then(blob => {
                notesStore.updateNote(newNoteId, { 
                  title: fileName,
                  content: '',
                  attachment: {
                    name: fileName + '.pdf',
                    type: 'application/pdf',
                    size: blob.size,
                    blob: blob
                  }
                });
                setActiveNote(newNoteId);
              })
              .catch(err => {
                console.error('[App] PDF yüklenirken hata:', err);
                // Fallback: just set title
                notesStore.updateNote(newNoteId, { 
                  title: fileName,
                  content: `<p>PDF dosyası: ${fileName}.pdf</p>`
                });
                setActiveNote(newNoteId);
              });
          }, 100);
          return;
        }
        
        // Parse content based on file type for text files
        let noteContent = content;
        let noteTitle = fileName;
        
        // For .lum files, try to extract title (same as markdown)
        if (fileType === '.lum') {
          const titleMatch = content.match(/^#\s+(.+)\n/);
          if (titleMatch) {
            noteTitle = titleMatch[1];
            noteContent = content.substring(titleMatch[0].length).trim();
          }
        }
        
        // For markdown files, try to extract title
        if (fileType === '.md') {
          const titleMatch = content.match(/^#\s+(.+)\n/);
          if (titleMatch) {
            noteTitle = titleMatch[1];
            noteContent = content.substring(titleMatch[0].length).trim();
          }
        }
        
        // For JSON files, try to format nicely
        if (fileType === '.json') {
          try {
            const parsed = JSON.parse(content);
            noteContent = `<pre><code>${JSON.stringify(parsed, null, 2)}</code></pre>`;
          } catch (e) {
            // If parsing fails, use raw content
            noteContent = `<pre><code>${content}</code></pre>`;
          }
        }
        
        // For plain text, wrap in paragraph
        if (fileType === '.txt') {
          // Convert line breaks to HTML
          noteContent = content.split('\n').map((line: string) => `<p>${line || '<br>'}</p>`).join('');
        }
        
        // Update the note with title and content
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
        if (window.electronAPI?.removeOpenExternalFileListener) {
          window.electronAPI.removeOpenExternalFileListener();
        }
      };
    }
  }, [createNote, setActiveNote]);

  // Handle Ctrl+S keyboard shortcut to save current note
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Prevent browser's default save dialog
        
        if (activeNoteId) {
          console.log('Ctrl+S pressed, saving note:', activeNoteId);
          
          try {
            await saveImmediately();
            
            // Show save notification
            setShowSaveNotification(true);
            setTimeout(() => {
              setShowSaveNotification(false);
            }, 2000);
            
            console.log('Note saved successfully');
          } catch (error) {
            console.error('Error saving note:', error);
          }
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeNoteId, saveImmediately]);

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
            expandedFolderIds={expandedFolderIds}
            onToggleFolder={(folderId: string, isOpen: boolean) => {
              setExpandedFolderIds((prev) =>
                isOpen ? Array.from(new Set([...prev, folderId])) : prev.filter((id) => id !== folderId)
              );
            }}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onNoteSelect={handleNoteSelect}
            onOpenInSplitView={handleOpenInSplitView}
          />
        )}
      </AnimatePresence>

      <motion.div 
        ref={containerRef}
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
        onDragOver={handleMainDragOver}
        onDrop={handleMainDrop}
        onDragLeave={handleMainDragLeave}
      >
        {/* Tek görünümde drag highlight */}
        {dragHighlight === 'main' && (
          <div className="drag-overlay" style={{ position: 'absolute', inset: 0 }} />
        )}
        {dragHighlight === 'left-edge' && (
          <div className="drag-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '25%', height: '100%' }} />
        )}
        {dragHighlight === 'right-edge' && (
          <div className="drag-overlay" style={{ position: 'absolute', top: 0, right: 0, width: '25%', height: '100%' }} />
        )}
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

        {/* Bölünmüş Ekran veya Normal Görünüm */}
        {secondaryNoteId ? (
          // Split Screen - yeniden boyutlandırılabilir
          <div className="split-container relative">
            {/* Sol Panel */}
            <div
              ref={leftPaneRef}
              className="split-pane"
              style={{ flexBasis: `${splitPosition}%`, flexGrow: 0, flexShrink: 0 }}
            >
              {/* Sol panel drag highlight */}
              {dragHighlight === 'left-pane' && (
                <div className="drag-overlay" style={{ position: 'absolute', inset: 0 }} />
              )}
              <AnimatePresence mode="wait">
                {viewMode === 'kanban' ? (
                  <motion.div
                    key="kanban-left"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <KanbanBoard />
                  </motion.div>
                ) : activeNoteId ? (
                  <motion.div
                    key="editor-left"
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
                    key="home-left"
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
            </div>

            {/* Ayırıcı (Resizer) */}
            <div
              className="resizer"
              onMouseDown={handleResizerMouseDown}
            />

            {/* Sağ Panel */}
            <div
              ref={rightPaneRef}
              className="split-pane"
              style={{ flexBasis: `${100 - splitPosition}%`, flexGrow: 0, flexShrink: 0 }}
            >
              {/* Sağ panel drag highlight */}
              {dragHighlight === 'right-pane' && (
                <div className="drag-overlay" style={{ position: 'absolute', inset: 0 }} />
              )}
              {/* Başlık Çubuğu - Kapat Butonu */}
              <div
                className="flex-none flex items-center justify-between px-4 py-2 border-b"
                style={{
                  backgroundColor: 'var(--color-bgSecondary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {notes.find(n => n.id === secondaryNoteId)?.title || 'Untitled Note'}
                </h3>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseSecondaryPane}
                  className="p-1 rounded transition-all"
                  style={{
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bgTertiary)',
                  }}
                  title="Yan paneli kapat"
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Editor İçeriği */}
              <div className="flex-1 overflow-hidden">
                <Editor noteIdOverride={secondaryNoteId} />
              </div>
            </div>
          </div>
        ) : (
          // Normal Görünüm
          <AnimatePresence mode="wait">
            {viewMode === 'kanban' ? (
              <motion.div
                key="kanban"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <KanbanBoard />
              </motion.div>
            ) : activeNoteId ? (
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
        )}
      </motion.div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <UpdateNotification />
      
      {/* Save Notification */}
      <AnimatePresence>
        {showSaveNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 px-6 py-3 rounded-lg shadow-lg z-50"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">{t('noteSaved')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
