import { motion } from 'framer-motion';
import { Folder, FolderOpen } from 'lucide-react';
import { Modal } from './Modal';
import { useNotesStore } from '../store/useNotesStore';

interface MoveFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
}

export const MoveFolderModal = ({ isOpen, onClose, noteId }: MoveFolderModalProps) => {
  const { folders, moveNoteToFolder } = useNotesStore();

  const handleMoveToFolder = (folderId: string | null) => {
    moveNoteToFolder(noteId, folderId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Klasör Seç">
      <div className="space-y-2">
        {/* No Folder Option */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleMoveToFolder(null)}
          className="w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 transition-all"
          style={{
            backgroundColor: 'var(--color-bgTertiary)',
            color: 'var(--color-text)',
          }}
        >
          <FolderOpen size={20} />
          <span className="font-medium">Klasörsüz Notlar</span>
        </motion.button>

        {/* Folder List */}
        {folders.length > 0 ? (
          folders.map((folder) => (
            <motion.button
              key={folder.id}
              type="button"
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMoveToFolder(folder.id)}
              className="w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 transition-all"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
              }}
            >
              <Folder size={20} />
              <span className="font-medium">{folder.name}</span>
            </motion.button>
          ))
        ) : (
          <p
            className="text-center py-4 text-sm italic"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            Henüz klasör yok
          </p>
        )}
      </div>
    </Modal>
  );
};

