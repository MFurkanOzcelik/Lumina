import { motion } from 'framer-motion';
import { FileDown, FileText, X } from 'lucide-react';
import { Modal } from './Modal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportLum: () => void;
  onExportPdf: () => void;
  noteTitle: string;
}

export const ExportModal = ({
  isOpen,
  onClose,
  onExportLum,
  onExportPdf,
  noteTitle,
}: ExportModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Note">
      <div className="space-y-4">
        <p style={{ color: 'var(--color-textSecondary)', fontSize: '0.875rem' }}>
          Choose the format you want to export "{noteTitle || 'Untitled Note'}" as:
        </p>

        <div className="grid grid-cols-1 gap-3">
          {/* Export */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onExportLum();
              onClose();
            }}
            className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
            style={{
              backgroundColor: 'var(--color-bgTertiary)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
            >
              <FileDown size={24} />
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold text-base mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Export (.lum)
              </h3>
              <p
                className="text-xs"
                style={{ color: 'var(--color-textSecondary)' }}
              >
                Native format with full markdown support. Can be re-imported later.
              </p>
            </div>
          </motion.button>

          {/* Export as PDF */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onExportPdf();
              onClose();
            }}
            className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
            style={{
              backgroundColor: 'var(--color-bgTertiary)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold text-base mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                Export as PDF
              </h3>
              <p
                className="text-xs"
                style={{ color: 'var(--color-textSecondary)' }}
              >
                Professional document format. Perfect for sharing and printing.
              </p>
            </div>
          </motion.button>
        </div>

        {/* Cancel Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--color-bgTertiary)',
            color: 'var(--color-text)',
          }}
        >
          <X size={18} />
          Cancel
        </motion.button>
      </div>
    </Modal>
  );
};

