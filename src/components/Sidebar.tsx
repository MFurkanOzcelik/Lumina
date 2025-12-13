import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderPlus, Trash2, ChevronRight, ChevronDown, FileText, ChevronLeft, GripVertical, Settings } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../utils/translations';
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { Modal } from './Modal';
import { ContextMenu } from './ContextMenu';
import { MoveFolderModal } from './MoveFolderModal';

interface SidebarProps {
  width: number;
  onResize: (width: number) => void;
  collapsed: boolean;
  onSettingsClick: () => void;
}

const DraggableNote = ({ noteId, title, isActive, onClick, onDelete, onRename, onMove }: any) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: noteId,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  // Display "Untitled Note" if title is empty
  const displayTitle = title.trim() === '' ? 'Untitled Note' : title;

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = () => {
    setIsRenaming(true);
    setRenameValue(title);
  };

  const saveRename = () => {
    if (renameValue.trim() !== title) {
      onRename(renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue(title);
    }
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        whileHover={{ x: 4 }}
        className="group relative"
        onContextMenu={handleContextMenu}
      >
        <div
          className="px-3 py-2 rounded-lg flex items-center justify-between transition-all"
          style={{
            backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
            color: isActive ? 'white' : 'var(--color-text)',
          }}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity mr-1"
            style={{ color: isActive ? 'white' : 'var(--color-textSecondary)' }}
          >
            <GripVertical size={14} />
          </div>

          {/* Clickable Note Content */}
          <div
            onClick={() => {
              if (!isRenaming) {
                onClick();
              }
            }}
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          >
            <FileText size={16} className="flex-shrink-0" />
            {isRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={saveRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-sm rounded outline-none"
                style={{
                  backgroundColor: 'var(--color-bgTertiary)',
                  color: 'var(--color-text)',
                  border: `1px solid var(--color-accent)`,
                }}
              />
            ) : (
              <span className="truncate text-sm" style={{ 
                fontStyle: title.trim() === '' ? 'italic' : 'normal',
                opacity: title.trim() === '' ? 0.7 : 1
              }}>
              {displayTitle}
            </span>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu !== null}
        position={contextMenu || { x: 0, y: 0 }}
        onClose={() => setContextMenu(null)}
        onRename={handleRename}
        onDelete={() => setShowDeleteConfirm(true)}
        onMove={onMove}
        type="note"
      />
      
      {/* Delete Note Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Emin misiniz?"
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--color-textSecondary)' }}>
            Not kalıcı olarak silinecektir.
          </p>
          <div className="flex gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
              }}
            >
              İptal
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              Sil
            </motion.button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const DroppableFolder = ({ folderId, name, notes, activeNoteId, onNoteClick, onNoteDelete, onFolderDelete, onFolderRename, onNoteRename, onNoteMove }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  const { setNodeRef, isOver } = useDroppable({
    id: folderId,
  });

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = () => {
    setIsRenaming(true);
    setRenameValue(name);
  };

  const saveRename = () => {
    if (renameValue.trim() !== '' && renameValue.trim() !== name) {
      onFolderRename(renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue(name);
    }
  };

  return (
    <>
      <div ref={setNodeRef}>
        <motion.div
          whileHover={{ x: 2 }}
          className="px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 mb-1 group"
          style={{
            backgroundColor: isOver ? 'var(--color-accentHover)' : 'var(--color-bgTertiary)',
            color: isOver ? 'white' : 'var(--color-text)',
          }}
          onContextMenu={handleContextMenu}
        >
          <div onClick={() => !isRenaming && setIsOpen(!isOpen)} className="flex items-center gap-2 flex-1">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {isRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={saveRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-sm rounded outline-none"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: `1px solid var(--color-accent)`,
                }}
              />
            ) : (
              <span className="font-medium text-sm">{name}</span>
            )}
            <span className="ml-auto text-xs opacity-70">{notes.length}</span>
          </div>
          {!isRenaming && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
              style={{ color: isOver ? 'white' : 'var(--color-danger)' }}
            >
              <Trash2 size={14} />
            </motion.button>
          )}
        </motion.div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-4 space-y-1"
            >
            {notes.map((note: any) => (
              <DraggableNote
                key={note.id}
                noteId={note.id}
                title={note.title}
                isActive={note.id === activeNoteId}
                onClick={() => onNoteClick(note.id)}
                onDelete={() => onNoteDelete(note.id)}
                onRename={(newTitle: string) => onNoteRename(note.id, newTitle)}
                onMove={() => onNoteMove(note.id)}
              />
            ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu !== null}
        position={contextMenu || { x: 0, y: 0 }}
        onClose={() => setContextMenu(null)}
        onRename={handleRename}
        onDelete={() => setShowDeleteConfirm(true)}
        type="folder"
      />
      
      {/* Delete Folder Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Emin misiniz?"
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--color-textSecondary)' }}>
            Klasör silinecek ve tüm notlar klasörsüz notlara taşınacaktır.
          </p>
          <div className="flex gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
              }}
            >
              İptal
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onFolderDelete();
                setShowDeleteConfirm(false);
              }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              Sil
            </motion.button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const Sidebar = ({ width, onResize, collapsed, onSettingsClick }: SidebarProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveNoteId, setMoveNoteId] = useState<string | null>(null);

  const { notes, folders, activeNoteId, setActiveNote, deleteNote, updateNote, createFolder, updateFolder, deleteFolder, moveNoteToFolder } =
    useNotesStore();
  const { setSidebarCollapsed } = useSettingsStore();
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);

  const handleNoteRename = (noteId: string, newTitle: string) => {
    updateNote(noteId, { title: newTitle });
  };

  const handleFolderRename = (folderId: string, newName: string) => {
    updateFolder(folderId, newName);
  };

  const handleNoteMove = (noteId: string) => {
    setMoveNoteId(noteId);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      onResize(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const folderlessNotes = filteredNotes.filter((note) => !note.folderId);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderInput(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const noteId = active.id as string;
      const folderId = over.id === 'folderless' ? null : (over.id as string);
      moveNoteToFolder(noteId, folderId);
    }
  };

  if (collapsed) {
    return null;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ x: -width }}
        animate={{ x: 0, transition: { duration: 0.75, ease: "easeInOut" } }}
        exit={{ x: -width, transition: { duration: 0.75, ease: "easeInOut" } }}
        className="relative h-full flex flex-col"
        style={{
          width: `${width}px`,
          backgroundColor: 'var(--color-bgSecondary)',
          borderRight: `1px solid var(--color-border)`,
        }}
      >
        {/* Logo - Click to return home */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => setActiveNote(null)}
          className="flex-none flex items-center cursor-pointer hover:opacity-80 transition-all p-6 rounded-xl gap-4"
          title="Ana Sayfaya Dön"
        >
          <img 
            src="./logo.png" 
            alt="Lumina Logo" 
            className="w-10 h-10 flex-shrink-0 object-contain" 
            style={{ minWidth: '40px', minHeight: '40px' }}
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          <span 
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            Lumina
          </span>
        </motion.div>

        {/* Fixed Header: Search Bar */}
        <div className="flex-none px-4 pb-4">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bgTertiary)',
              border: `1px solid var(--color-border)`,
            }}
          >
            <Search size={18} style={{ color: 'var(--color-textSecondary)' }} />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* Scrollable Middle: Notes List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          {/* Folders Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-textSecondary)' }}
              >
                {t('folders')}
              </h3>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFolderInput(!showFolderInput)}
                  className="p-1 rounded"
                  style={{ color: 'var(--color-accent)' }}
                  title={t('createFolder')}
                >
                  <FolderPlus size={16} />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ 
                    scale: 1.1,
                    x: -3,
                    backgroundColor: 'var(--color-accent)',
                    color: 'white'
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-2 rounded-lg transition-all"
                  style={{ 
                    color: 'var(--color-textSecondary)',
                    backgroundColor: 'var(--color-bgTertiary)'
                  }}
                  title={t('closeSidebar')}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronLeft size={18} />
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {showFolderInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-2"
                >
                  <input
                    type="text"
                    placeholder={t('enterFolderName')}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bgTertiary)',
                      color: 'var(--color-text)',
                      border: `1px solid var(--color-border)`,
                    }}
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="space-y-1"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  <DroppableFolder
                    folderId={folder.id}
                    name={folder.name}
                    notes={filteredNotes.filter((note) => note.folderId === folder.id)}
                    activeNoteId={activeNoteId}
                    onNoteClick={setActiveNote}
                    onNoteDelete={deleteNote}
                    onFolderDelete={() => deleteFolder(folder.id)}
                    onFolderRename={(newName: string) => handleFolderRename(folder.id, newName)}
                    onNoteRename={handleNoteRename}
                    onNoteMove={handleNoteMove}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Folderless Notes */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-textSecondary)' }}
            >
              {t('folderlessNotes')}
            </h3>
            <DroppableFolderlessArea
              notes={folderlessNotes}
              activeNoteId={activeNoteId}
              onNoteClick={setActiveNote}
              onNoteDelete={deleteNote}
              onNoteRename={handleNoteRename}
              onNoteMove={handleNoteMove}
            />
          </div>
        </div>

        {/* Fixed Footer: Settings Button */}
        <div
          className="flex-none border-t p-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSettingsClick}
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all"
            style={{
              backgroundColor: 'var(--color-bgTertiary)',
              color: 'var(--color-text)',
            }}
          >
            <Settings size={20} />
            <span className="font-medium">{t('settings')}</span>
          </motion.button>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
          style={{
            backgroundColor: isResizing ? 'var(--color-accent)' : 'transparent',
          }}
        />
      </motion.div>
      
      {/* Move Note to Folder Modal */}
      {moveNoteId && (
        <MoveFolderModal
          isOpen={moveNoteId !== null}
          onClose={() => setMoveNoteId(null)}
          noteId={moveNoteId}
        />
      )}
    </DndContext>
  );
};

const DroppableFolderlessArea = ({ notes, activeNoteId, onNoteClick, onNoteDelete, onNoteRename, onNoteMove }: any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'folderless',
  });

  return (
    <div ref={setNodeRef}>
      <motion.div
        className="space-y-1 rounded-lg p-2 transition-colors"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.03,
            },
          },
        }}
        style={{
          backgroundColor: isOver ? 'var(--color-accentHover)' : 'transparent',
          border: isOver ? '2px dashed var(--color-accent)' : '2px dashed transparent',
        }}
      >
        {notes.length > 0 ? (
          notes.map((note: any) => (
            <motion.div
              key={note.id}
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 },
              }}
            >
              <DraggableNote
                noteId={note.id}
                title={note.title}
                isActive={note.id === activeNoteId}
                onClick={() => onNoteClick(note.id)}
                onDelete={() => onNoteDelete(note.id)}
                onRename={(newTitle: string) => onNoteRename(note.id, newTitle)}
                onMove={() => onNoteMove(note.id)}
              />
            </motion.div>
          ))
        ) : (
          <div
            className="px-3 py-4 text-center text-xs italic rounded-lg"
            style={{
              color: 'var(--color-textSecondary)',
              backgroundColor: isOver ? 'var(--color-bgTertiary)' : 'transparent',
            }}
          >
            {isOver ? 'Buraya bırak' : 'Henüz klasörsüz not yok'}
          </div>
        )}
      </motion.div>
    </div>
  );
};

