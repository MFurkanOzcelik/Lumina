import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Type,
  Save,
  Trash2,
  ChevronDown,
  Paperclip,
  Download,
  X,
} from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../utils/translations';
import { Modal } from './Modal';
import { Toast } from './Toast';

export const Editor = () => {
  const { activeNoteId, notes, updateNote, deleteNote, setActiveNote } = useNotesStore();
  const language = useSettingsStore((state) => state.language);
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const t = useTranslation(language);

  const activeNote = notes.find((note) => note.id === activeNoteId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const isRestoringCursor = useRef(false);

  // Create and cleanup file URL for attachments
  useEffect(() => {
    if (activeNote?.attachment?.blob) {
      const url = URL.createObjectURL(activeNote.attachment.blob);
      setFileUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
        setFileUrl(null);
      };
    } else {
      setFileUrl(null);
    }
  }, [activeNote?.attachment]);

  // Helper function to get cursor position in contentEditable
  const getCursorPosition = (): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !contentRef.current) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(contentRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };

  // Helper function to set cursor position in contentEditable
  const setCursorPosition = (position: number) => {
    if (!contentRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    try {
      const range = document.createRange();
      let currentPos = 0;
      let found = false;

      const traverseNodes = (node: Node): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
          const textLength = node.textContent?.length || 0;
          if (currentPos + textLength >= position) {
            range.setStart(node, position - currentPos);
            range.collapse(true);
            found = true;
            return true;
          }
          currentPos += textLength;
        } else {
          for (let i = 0; i < node.childNodes.length; i++) {
            if (traverseNodes(node.childNodes[i])) return true;
          }
        }
        return false;
      };

      traverseNodes(contentRef.current);

      if (found) {
        selection.removeAllRanges();
        selection.addRange(range);
        contentRef.current.focus();
      }
    } catch (error) {
      console.error('Error restoring cursor position:', error);
      contentRef.current.focus();
    }
  };

  // Save cursor position when user interacts with editor
  const saveCursorPosition = () => {
    if (activeNoteId && !isRestoringCursor.current) {
      const position = getCursorPosition();
      updateNote(activeNoteId, { cursorPosition: position });
    }
  };

  // Only update innerHTML when switching notes, not on every content change
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      
      // Update the contentEditable div only when switching notes
      if (contentRef.current && contentRef.current.innerHTML !== activeNote.content) {
        contentRef.current.innerHTML = activeNote.content;
      }
      
      // Smart focus logic
      setTimeout(() => {
        const hasContent = activeNote.content.trim().length > 0;
        const hasSavedCursor = typeof activeNote.cursorPosition === 'number';
        
        if (hasContent && hasSavedCursor && activeNote.cursorPosition !== undefined) {
          // Restore cursor position in content
          isRestoringCursor.current = true;
          setCursorPosition(activeNote.cursorPosition);
          setTimeout(() => {
            isRestoringCursor.current = false;
          }, 100);
        } else {
          // Focus title for new/empty notes
          titleRef.current?.focus();
        }
      }, 100);
    }
  }, [activeNote?.id]); // Only trigger on note ID change

  const handleSave = () => {
    if (activeNoteId) {
      updateNote(activeNoteId, { title, content });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleDelete = () => {
    if (activeNoteId) {
      deleteNote(activeNoteId);
      setShowDeleteConfirm(false);
      setActiveNote(null);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  const fontSizes = Array.from({ length: 21 }, (_, i) => i + 10);

  // Fix font size to use inline styles instead of execCommand
  const handleFontSizeChange = (size: number) => {
    setCurrentFontSize(size);
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // No text selected
    
    // Extract selected content
    const selectedContent = range.extractContents();
    
    // Create span with inline font-size style
    const span = document.createElement('span');
    span.style.fontSize = `${size}px`;
    span.appendChild(selectedContent);
    
    // Insert the styled span
    range.insertNode(span);
    
    // Restore selection
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
    
    // Update content state
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
    
    setShowFontSize(false);
    contentRef.current?.focus();
  };

  if (!activeNote) {
    return null;
  }

  return (
    <>
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Toolbar - Fixed height */}
        <div
          className={`flex-none flex items-center justify-between py-4 border-b ${
            sidebarCollapsed ? 'pl-24 pr-6' : 'px-6'
          }`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bold */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                execCommand('bold');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('bold')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('bold') ? 'white' : 'var(--color-text)',
              }}
              title={t('bold')}
            >
              <Bold size={18} />
            </motion.button>

            {/* Italic */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                execCommand('italic');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('italic')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('italic') ? 'white' : 'var(--color-text)',
              }}
              title={t('italic')}
            >
              <Italic size={18} />
            </motion.button>

            {/* Underline */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                execCommand('underline');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('underline')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('underline') ? 'white' : 'var(--color-text)',
              }}
              title={t('underline')}
            >
              <Underline size={18} />
            </motion.button>

            {/* Strikethrough */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                execCommand('strikeThrough');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('strikeThrough')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('strikeThrough') ? 'white' : 'var(--color-text)',
              }}
              title={t('strikethrough')}
            >
              <Strikethrough size={18} />
            </motion.button>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Font Size */}
            <div className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFontSize(!showFontSize);
                }}
                className="p-2 rounded-lg flex items-center gap-1 transition-all"
                style={{
                  backgroundColor: 'var(--color-bgTertiary)',
                  color: 'var(--color-text)',
                }}
                title={t('fontSize')}
              >
                <Type size={18} />
                <span className="text-xs">{currentFontSize}</span>
                <ChevronDown size={14} />
              </motion.button>

              <AnimatePresence>
                {showFontSize && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 rounded-lg shadow-lg overflow-hidden z-10"
                    style={{
                      backgroundColor: 'var(--color-bgSecondary)',
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {fontSizes.map((size) => (
                        <motion.button
                          key={size}
                          type="button"
                          whileHover={{ backgroundColor: 'var(--color-bgTertiary)' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFontSizeChange(size);
                          }}
                          className="w-full px-4 py-2 text-left text-sm transition-colors"
                          style={{
                            color:
                              size === currentFontSize
                                ? 'var(--color-accent)'
                                : 'var(--color-text)',
                            fontWeight: size === currentFontSize ? 'bold' : 'normal',
                          }}
                        >
                          {size}px
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Bullet List */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                execCommand('insertUnorderedList');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('insertUnorderedList')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('insertUnorderedList')
                  ? 'white'
                  : 'var(--color-text)',
              }}
              title={t('bulletList')}
            >
              <List size={18} />
            </motion.button>

            {/* Numbered List */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                execCommand('insertOrderedList');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('insertOrderedList')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('insertOrderedList')
                  ? 'white'
                  : 'var(--color-text)',
              }}
              title={t('numberedList')}
            >
              <ListOrdered size={18} />
            </motion.button>
          </div>

          {/* Actions - aligned to the right */}
          <div className="flex items-center gap-2 ml-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              <Trash2 size={18} />
              {t('delete')}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-success)',
                color: 'white',
              }}
            >
              <Save size={18} />
              {t('save')}
            </motion.button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto h-full">
          {/* Title Input */}
          <div className="px-6 pt-6 pb-4 border-b-2" style={{ borderColor: 'var(--color-border)' }}>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (activeNoteId) {
                  updateNote(activeNoteId, { title: e.target.value });
                }
              }}
              placeholder={t('untitledNote')}
              className="w-full text-3xl font-bold bg-transparent outline-none"
              style={{ color: 'var(--color-text)' }}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('titleArea')}
            </p>
          </div>

          {/* File Attachment Display */}
          {activeNote?.attachment && fileUrl && (
            <div className="px-4 pt-4 pb-4 flex flex-col h-full" style={{ minHeight: 'calc(100vh - 150px)' }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden flex flex-col flex-1"
                style={{
                  backgroundColor: 'var(--color-bgSecondary)',
                  border: `1px solid var(--color-border)`,
                  minHeight: 'calc(100vh - 180px)',
                }}
              >
                {/* Attachment Header */}
                <div
                  className="flex-none px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-bgTertiary)' }}
                >
                  <div className="flex items-center gap-3">
                    <Paperclip size={20} style={{ color: 'var(--color-accent)' }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                        {activeNote.attachment.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-textSecondary)' }}>
                        {(activeNote.attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={fileUrl}
                      download={activeNote.attachment.name}
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                      }}
                      title="İndir"
                    >
                      <Download size={18} />
                    </motion.a>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (activeNoteId) {
                          updateNote(activeNoteId, { attachment: undefined });
                        }
                      }}
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-danger)',
                        color: 'white',
                      }}
                      title="Dosyayı Kaldır"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>
                </div>

                {/* File Preview (for PDFs and text files) */}
                {activeNote.attachment.type === 'application/pdf' && (
                  <div className="flex-1 w-full h-full" style={{ minHeight: 'calc(100vh - 250px)' }}>
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-none"
                      title={activeNote.attachment.name}
                      style={{ display: 'block', minHeight: 'calc(100vh - 250px)' }}
                    />
                  </div>
                )}
                {activeNote.attachment.type.startsWith('text/') && (
                  <div className="flex-1 w-full h-full" style={{ minHeight: 'calc(100vh - 250px)' }}>
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-none"
                      title={activeNote.attachment.name}
                      style={{ display: 'block', minHeight: 'calc(100vh - 250px)' }}
                    />
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Content Editor */}
          <div className="px-6 pb-6">
            <div
              ref={contentRef}
              contentEditable
              className="editor-content min-h-full outline-none pt-4 border-t-2"
              style={{
                color: 'var(--color-text)',
                fontSize: `${currentFontSize}px`,
                borderColor: 'var(--color-border)',
              }}
              onInput={(e) => {
                // Just update state, don't re-render the div
                setContent(e.currentTarget.innerHTML);
              }}
              onKeyDown={(e) => {
                // Handle Tab key to insert 4 spaces
                if (e.key === 'Tab') {
                  e.preventDefault();
                  document.execCommand('insertText', false, '    ');
                }
              }}
              onBlur={saveCursorPosition}
              onMouseUp={saveCursorPosition}
              onKeyUp={saveCursorPosition}
              suppressContentEditableWarning
            />
          </div>
        </div>

        {/* Saved Toast */}
        <Toast isVisible={showSaved} message={t('saved')} type="success" />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('confirmDelete')}
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--color-textSecondary)' }}>
            {t('confirmDeleteMessage')}
          </p>
          <div className="flex gap-3">
            <motion.button
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDelete}
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

