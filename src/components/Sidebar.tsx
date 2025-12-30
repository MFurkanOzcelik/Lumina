import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderPlus, Trash2, ChevronRight, ChevronDown, FileText, ChevronLeft, GripVertical, Settings, Tag, X, Plus, Pin, Lock } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../utils/translations';
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { Modal } from './Modal';
import { ContextMenu } from './ContextMenu';
import { MoveFolderModal } from './MoveFolderModal';
import { ExportModal } from './ExportModal';
import TurndownService from 'turndown';
import { getTagColor } from '../utils/tagUtils';
import './Sidebar.css';
// @ts-ignore html2pdf.js için tip bulunmuyor
import html2pdf from 'html2pdf.js';

interface SidebarProps {
  width: number;
  onResize: (width: number) => void;
  collapsed: boolean;
  onSettingsClick: () => void;
  expandedFolderIds?: string[];
  onToggleFolder?: (folderId: string, isOpen: boolean) => void;
  viewMode: 'editor' | 'kanban';
  setViewMode: (mode: 'editor' | 'kanban') => void;
  onNoteSelect?: (noteId: string) => void;
  onOpenInSplitView?: (noteId: string) => void;
}

const DraggableNote = ({ noteId, title, isActive, isEncrypted, onClick, onDelete, onRename, onMove, onExport, onOpenInSplitView }: any) => {
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  
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
  const displayTitle = title.trim() === '' ? t('untitledNote') : title;

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // Handle keyboard shortcuts for active note
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key - show delete confirmation
      if (e.key === 'Delete' && !isRenaming) {
        e.preventDefault();
        setShowDeleteConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isRenaming]);

  // Focus delete button when modal opens
  useEffect(() => {
    if (showDeleteConfirm && deleteButtonRef.current) {
      deleteButtonRef.current.focus();
    }
  }, [showDeleteConfirm]);

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
          draggable={true}
          onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
            // Split Screen için HTML5 drag payload
            const payload = { id: noteId, title };
            e.dataTransfer.setData('application/lumina-note', JSON.stringify(payload));
            e.dataTransfer.effectAllowed = 'copy';
          }}
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
              <span className="truncate text-sm flex items-center gap-1.5" style={{ 
                fontStyle: title.trim() === '' ? 'italic' : 'normal',
                opacity: title.trim() === '' ? 0.7 : 1
              }}>
                {displayTitle}
                {isEncrypted && (
                  <Lock size={12} className="flex-shrink-0" style={{ opacity: 0.7 }} />
                )}
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
        onExport={onExport}
        onOpenInSplitView={() => {
          onOpenInSplitView?.(noteId);
          setContextMenu(null);
        }}
        type="note"
      />
      
      {/* Delete Note Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--color-textSecondary)' }}>
            {t('noteWillBeDeleted')}
          </p>
          <div className="flex gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteConfirm(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowDeleteConfirm(false);
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
              }}
            >
              {t('cancel')}
            </motion.button>
            <motion.button
              ref={deleteButtonRef}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onDelete();
                  setShowDeleteConfirm(false);
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              {t('delete')}
            </motion.button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const DroppableFolder = ({ folderId, name, notes, activeNoteId, isPinned, onNoteClick, onNoteDelete, onFolderDelete, onFolderRename, onNoteRename, onNoteMove, onNoteExport, onTogglePin, initialOpen = true, onToggle, onOpenInSplitView }: any) => {
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen ?? true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setIsOpen(initialOpen ?? true);
  }, [initialOpen]);

  // Notify parent when open state changes
  useEffect(() => {
    onToggle?.(folderId, isOpen);
  }, [isOpen, folderId, onToggle]);
  
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
            <div className="flex items-center gap-1">
              {/* Pin Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                className={`p-1 rounded transition-all ${isPinned ? '' : 'opacity-0 group-hover:opacity-100'}`}
                style={{ 
                  color: isPinned ? 'var(--color-accent)' : 'var(--color-textSecondary)',
                }}
                title={isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
              >
                <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
              </motion.button>
              
              {/* Delete Button */}
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
            </div>
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
                isEncrypted={note.isEncrypted || false}
                onClick={() => onNoteClick(note.id)}
                onDelete={() => onNoteDelete(note.id)}
                onRename={(newTitle: string) => onNoteRename(note.id, newTitle)}
                onMove={() => onNoteMove(note.id)}
                onExport={() => onNoteExport(note.id)}
                onOpenInSplitView={onOpenInSplitView}
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
        onTogglePin={onTogglePin}
        isPinned={isPinned}
        type="folder"
      />
      
      {/* Delete Folder Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--color-textSecondary)' }}>
            {t('folderWillBeDeleted')}
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
              {t('cancel')}
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
              {t('delete')}
            </motion.button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const Sidebar = ({ width, onResize, collapsed, onSettingsClick, expandedFolderIds = [], onToggleFolder, viewMode, setViewMode, onNoteSelect, onOpenInSplitView }: SidebarProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveNoteId, setMoveNoteId] = useState<string | null>(null);
  const [exportNoteId, setExportNoteId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPanel, setShowTagPanel] = useState(true);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const { notes, folders, activeNoteId, setActiveNote, deleteNote, updateNote, createNote, createFolder, updateFolder, deleteFolder, moveNoteToFolder, togglePinFolder } =
    useNotesStore();
  const { setSidebarCollapsed } = useSettingsStore();
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);

  // Not seçildiğinde - önce onNoteSelect callback'i çağır (otomatik Editor geçişi)
  // Sonra not seçimini yap
  const handleNoteClick = (noteId: string) => {
    if (onNoteSelect) {
      onNoteSelect(noteId);
    } else {
      setActiveNote(noteId);
    }
  };

  const handleNoteRename = (noteId: string, newTitle: string) => {
    updateNote(noteId, { title: newTitle });
  };

  const handleFolderRename = (folderId: string, newName: string) => {
    updateFolder(folderId, newName);
  };

  const handleNoteMove = (noteId: string) => {
    setMoveNoteId(noteId);
  };

  const handleNoteExport = (noteId: string) => {
    setExportNoteId(noteId);
  };

  const handleExportAsLum = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    
    // Initialize Turndown service
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });
    
    // Add custom rule for code blocks
    turndownService.addRule('codeBlock', {
      filter: (node: HTMLElement) => {
        return node.nodeName === 'PRE' && node.querySelector('code') !== null;
      },
      replacement: (_content: string, node: HTMLElement) => {
        const codeElement = node.querySelector('code');
        const code = codeElement?.textContent || '';
        return '\n```\n' + code + '\n```\n';
      }
    });
    
    // Add custom rule for inline code
    turndownService.addRule('inlineCode', {
      filter: (node: HTMLElement) => {
        return node.nodeName === 'CODE' && node.parentElement?.nodeName !== 'PRE';
      },
      replacement: (content: string) => {
        return '`' + content + '`';
      }
    });
    
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(note.content);
    
    // Create markdown content with title
    const fullMarkdown = `# ${note.title || t('untitledNote')}\n\n${markdown}`;
    
    // Create blob and download with .lum extension
    const blob = new Blob([fullMarkdown], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title || t('untitledNote')}.lum`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAsPdf = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) {
      alert('PDF oluşturulamadı: not bulunamadı.');
      return;
    }

    const element = document.getElementById('editor-content');
    if (!element) {
      alert('PDF oluşturulamadı: içerik bulunamadı.');
      return;
    }

    const opt = {
      margin: 10,
      filename: `${note.title || t('untitledNote')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    html2pdf().set(opt).from(element).save();
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

  // Get all unique tags from all notes
  const allTags = Array.from(
    new Set(
      notes.flatMap((note) => note.tags || [])
    )
  ).sort();

  // Filter tags based on tag search query
  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  // Filter notes by search query and selected tags
  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => note.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const folderlessNotes = filteredNotes.filter((note) => !note.folderId);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all tag filters
  const clearTagFilters = () => {
    setSelectedTags([]);
  };

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
          className="sidebar-logo-container flex-none flex items-center cursor-pointer hover:opacity-80 transition-all px-4 py-4 gap-3"
          title="Ana Sayfaya Dön"
        >
          <img 
            src="./logo.png" 
            alt="Lumina Logo" 
            className="w-9 h-9 flex-shrink-0 object-contain" 
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          <span 
            className="text-lg font-bold tracking-tight"
            style={{ 
              color: 'var(--color-text)',
            }}
          >
            Lumina
          </span>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-2 pb-3 flex gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('editor')}
            className="flex-1 px-3 py-2 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: viewMode === 'editor' ? 'var(--color-accent)' : 'var(--color-bgTertiary)',
              color: viewMode === 'editor' ? 'white' : 'var(--color-text)',
              border: `1px solid ${viewMode === 'editor' ? 'var(--color-accent)' : 'var(--color-border)'}`,
            }}
          >
            📝 {t('home')}
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('kanban')}
            className="flex-1 px-3 py-2 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: viewMode === 'kanban' ? 'var(--color-accent)' : 'var(--color-bgTertiary)',
              color: viewMode === 'kanban' ? 'white' : 'var(--color-text)',
              border: `1px solid ${viewMode === 'kanban' ? 'var(--color-accent)' : 'var(--color-border)'}`,
            }}
          >
            📋 {t('kanbanTitle')}
          </motion.button>
        </div>

        {/* Fixed Header: Search Bar */}
        <div className="flex-none px-4 pb-2">
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

        {/* Tag Filter Panel */}
        {allTags.length > 0 && (
          <div className="flex-none px-4 pb-4">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                border: `1px solid var(--color-border)`,
              }}
            >
              {/* Panel Header */}
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowTagPanel(!showTagPanel)}
              >
                <div className="flex items-center gap-2">
                  <Tag size={16} style={{ color: 'var(--color-accent)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t('filterByTags')} {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: showTagPanel ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} style={{ color: 'var(--color-textSecondary)' }} />
                </motion.div>
              </div>

              {/* Panel Content */}
              <AnimatePresence>
                {showTagPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1">
                      {/* Tag Search Bar */}
                      <div className="mb-2">
                        <div
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                          style={{
                            backgroundColor: 'var(--color-bg)',
                            border: `1px solid var(--color-border)`,
                          }}
                        >
                          <Search size={14} style={{ color: 'var(--color-textSecondary)' }} />
                          <input
                            type="text"
                            placeholder="Search tags..."
                            value={tagSearchQuery}
                            onChange={(e) => setTagSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-xs"
                            style={{ color: 'var(--color-text)' }}
                          />
                          {tagSearchQuery && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setTagSearchQuery('')}
                              className="p-0.5 rounded hover:bg-opacity-20"
                              style={{ color: 'var(--color-textSecondary)' }}
                            >
                              <X size={12} />
                            </motion.button>
                          )}
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      {selectedTags.length > 0 && (
                        <motion.button
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={clearTagFilters}
                          className="w-full mb-2 px-2 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                          style={{
                            backgroundColor: 'var(--color-danger)',
                            color: 'white',
                          }}
                        >
                          <X size={14} />
                          {t('clearFilters')}
                        </motion.button>
                      )}

                      {/* Tags Grid */}
                      <div className="flex flex-wrap gap-1.5">
                        {filteredTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          const colorClass = getTagColor(tag);
                          
                          return (
                            <motion.button
                              key={tag}
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleTag(tag)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${colorClass}`}
                              style={{
                                opacity: isSelected ? 1 : 0.6,
                                boxShadow: isSelected 
                                  ? '0 2px 8px rgba(0,0,0,0.15)' 
                                  : '0 1px 3px rgba(0,0,0,0.1)',
                                outline: isSelected 
                                  ? '1px solid currentColor' 
                                  : 'none',
                                outlineOffset: '1px',
                                filter: isSelected ? 'brightness(1.05) saturate(1.2)' : 'brightness(0.95) saturate(0.9)',
                              }}
                            >
                              {tag}
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Tag Count Info */}
                      <div className="mt-2 text-xs text-center" style={{ color: 'var(--color-textSecondary)' }}>
                        {filteredTags.length > 0 ? (
                          <>
                            {filteredTags.length} {filteredTags.length !== 1 ? t('tagsAvailable') : t('tagAvailable')}
                            {tagSearchQuery && filteredTags.length !== allTags.length && (
                              <span className="opacity-70"> (of {allTags.length})</span>
                            )}
                          </>
                        ) : (
                          <span className="opacity-70">No tags found</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

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
                {/* Create New Note Button - Minimal */}
                <motion.button
                  type="button"
                  whileTap={{ 
                    scale: 0.9,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                  }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 500,
                    damping: 15
                  }}
                  onClick={() => {
                    const newNoteId = createNote(null);
                    handleNoteClick(newNoteId);
                  }}
                  className="flex items-center justify-center rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    width: '24px',
                    height: '24px',
                    minWidth: '24px',
                    minHeight: '24px',
                    padding: 0,
                    border: 'none',
                    margin: 0,
                    position: 'relative'
                  }}
                  title={t('createNewNote')}
                >
                  <Plus 
                    size={12} 
                    strokeWidth={2.5} 
                    style={{ 
                      display: 'block', 
                      flexShrink: 0,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }} 
                  />
                </motion.button>

                {/* Create Folder Button */}
                <motion.button
                  type="button"
                  whileHover={{ 
                    scale: 1.1,
                    backgroundColor: 'var(--color-bgTertiary)'
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFolderInput(!showFolderInput)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ 
                    color: 'var(--color-accent)',
                    backgroundColor: 'transparent'
                  }}
                  title={t('createFolder')}
                  transition={{ 
                    type: 'spring',
                    stiffness: 400,
                    damping: 17
                  }}
                >
                  <FolderPlus size={16} />
                </motion.button>

                {/* Close Sidebar Button */}
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
              {[...folders]
                .sort((a, b) => {
                  // Pinned folders first
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  // Then by creation date
                  return a.createdAt - b.createdAt;
                })
                .map((folder) => (
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
                    isPinned={folder.isPinned}
                    notes={filteredNotes.filter((note) => note.folderId === folder.id)}
                    activeNoteId={activeNoteId}
                    onNoteClick={handleNoteClick}
                    onNoteDelete={deleteNote}
                    onFolderDelete={() => deleteFolder(folder.id)}
                    onFolderRename={(newName: string) => handleFolderRename(folder.id, newName)}
                    onNoteRename={handleNoteRename}
                    onNoteMove={handleNoteMove}
                    onNoteExport={handleNoteExport}
                    onTogglePin={() => togglePinFolder(folder.id)}
                    initialOpen={expandedFolderIds.includes(folder.id)}
                    onToggle={(id: string, open: boolean) => onToggleFolder?.(id, open)}
                    onOpenInSplitView={onOpenInSplitView}
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
              onNoteClick={handleNoteClick}
              onNoteDelete={deleteNote}
              onNoteRename={handleNoteRename}
              onNoteMove={handleNoteMove}
              onNoteExport={handleNoteExport}
              onOpenInSplitView={onOpenInSplitView}
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

      {/* Export Format Modal */}
      {exportNoteId && (
        <ExportModal
          isOpen={exportNoteId !== null}
          onClose={() => setExportNoteId(null)}
          onExportLum={() => handleExportAsLum(exportNoteId)}
          onExportPdf={() => handleExportAsPdf(exportNoteId)}
          noteTitle={notes.find((n) => n.id === exportNoteId)?.title || t('untitledNote')}
        />
      )}
    </DndContext>
  );
};

const DroppableFolderlessArea = ({ notes, activeNoteId, onNoteClick, onNoteDelete, onNoteRename, onNoteMove, onNoteExport, onOpenInSplitView }: any) => {
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);
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
                isEncrypted={note.isEncrypted || false}
                onClick={() => onNoteClick(note.id)}
                onDelete={() => onNoteDelete(note.id)}
                onRename={(newTitle: string) => onNoteRename(note.id, newTitle)}
                onMove={() => onNoteMove(note.id)}
                onExport={() => onNoteExport(note.id)}
                onOpenInSplitView={onOpenInSplitView}
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
            {isOver ? t('dropHere') : t('noFolderlessNotes')}
          </div>
        )}
      </motion.div>
    </div>
  );
};

