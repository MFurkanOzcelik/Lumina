import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, FolderInput, FileDown, Pin, PinOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove?: () => void;
  onExport?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  type: 'note' | 'folder';
}

export const ContextMenu = ({
  isOpen,
  position,
  onClose,
  onRename,
  onDelete,
  onMove,
  onExport,
  onTogglePin,
  isPinned,
  type,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[100] rounded-xl shadow-2xl overflow-hidden"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          backgroundColor: 'var(--color-bgSecondary)',
          border: `1px solid var(--color-border)`,
          minWidth: '180px',
        }}
      >
        <div className="py-2">
          {/* Rename Option */}
          <motion.button
            type="button"
            whileHover={{ backgroundColor: 'var(--color-bgTertiary)' }}
            onClick={() => {
              onRename();
              onClose();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            <Edit2 size={16} />
            <span className="text-sm font-medium">Yeniden Adlandır</span>
          </motion.button>

          {/* Move Option - Only for notes */}
          {type === 'note' && onMove && (
            <motion.button
              type="button"
              whileHover={{ backgroundColor: 'var(--color-bgTertiary)' }}
              onClick={() => {
                onMove();
                onClose();
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors"
              style={{ color: 'var(--color-text)' }}
            >
              <FolderInput size={16} />
              <span className="text-sm font-medium">Taşı</span>
            </motion.button>
          )}

          {/* Export Option - Only for notes */}
          {type === 'note' && onExport && (
            <motion.button
              type="button"
              whileHover={{ backgroundColor: 'var(--color-bgTertiary)' }}
              onClick={() => {
                onExport();
                onClose();
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors"
              style={{ color: 'var(--color-text)' }}
            >
              <FileDown size={16} />
              <span className="text-sm font-medium">Export (.lum)</span>
            </motion.button>
          )}

          {/* Pin/Unpin Option - Only for folders */}
          {type === 'folder' && onTogglePin && (
            <motion.button
              type="button"
              whileHover={{ backgroundColor: 'var(--color-bgTertiary)' }}
              onClick={() => {
                onTogglePin();
                onClose();
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors"
              style={{ color: isPinned ? 'var(--color-accent)' : 'var(--color-text)' }}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              <span className="text-sm font-medium">
                {isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
              </span>
            </motion.button>
          )}

          {/* Divider */}
          <div
            className="my-2 h-px"
            style={{ backgroundColor: 'var(--color-border)' }}
          />

          {/* Delete Option */}
          <motion.button
            type="button"
            whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 size={16} />
            <span className="text-sm font-medium">Sil</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

