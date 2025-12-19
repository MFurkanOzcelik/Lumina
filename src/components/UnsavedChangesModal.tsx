import { motion } from 'framer-motion';
import { AlertCircle, Save, XCircle } from 'lucide-react';
import { Modal } from './Modal';
import { useTranslation } from '../utils/translations';
import type { Language } from '../types';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  language: Language;
  onSave: () => void;
  onDontSave: () => void;
}

export const UnsavedChangesModal = ({
  isOpen,
  language,
  onSave,
  onDontSave,
}: UnsavedChangesModalProps) => {
  const t = useTranslation(language);

  // Prevent closing modal by clicking outside or ESC
  const handleClose = () => {
    // Do nothing - user must choose Save or Don't Save
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('unsavedChangesWarning')}>
      <div className="space-y-6">
        {/* Warning Icon and Message */}
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-full"
            style={{ backgroundColor: 'var(--color-warning-bg)' }}
          >
            <AlertCircle
              size={24}
              style={{ color: 'var(--color-warning)' }}
            />
          </div>
          <div className="flex-1">
            <p
              className="text-base font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              {t('changesNotSaved')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSave}
            className="flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
            }}
          >
            <Save size={18} />
            {t('save')}
          </motion.button>

          {/* Don't Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDontSave}
            className="flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: 'var(--color-danger)',
              color: 'white',
            }}
          >
            <XCircle size={18} />
            {t('dontSave')}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

