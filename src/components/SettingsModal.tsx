import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotesStore } from '../store/useNotesStore';
import { useTranslation } from '../utils/translations';
import type { Theme, Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { theme, language, setTheme, setLanguage, resetAll: resetSettings } = useSettingsStore();
  const resetNotes = useNotesStore((state) => state.resetAll);
  const t = useTranslation(language);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const themes: { value: Theme; label: string }[] = [
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
    { value: 'ocean', label: t('ocean') },
    { value: 'sakura', label: t('sakura') },
  ];

  const languages: { value: Language; label: string }[] = [
    { value: 'en', label: t('english') },
    { value: 'tr', label: t('turkish') },
  ];

  const handleDeleteAll = () => {
    resetSettings();
    resetNotes();
    localStorage.clear();
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={t('settings')}>
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: 'var(--color-textSecondary)' }}
            >
              {t('theme')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((themeOption) => (
                <motion.button
                  key={themeOption.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(themeOption.value)}
                  className="px-4 py-3 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor:
                      theme === themeOption.value
                        ? 'var(--color-accent)'
                        : 'var(--color-bgTertiary)',
                    color:
                      theme === themeOption.value
                        ? 'white'
                        : 'var(--color-text)',
                    border: `2px solid ${
                      theme === themeOption.value
                        ? 'var(--color-accent)'
                        : 'transparent'
                    }`,
                  }}
                >
                  {themeOption.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: 'var(--color-textSecondary)' }}
            >
              {t('language')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((langOption) => (
                <motion.button
                  key={langOption.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLanguage(langOption.value)}
                  className="px-4 py-3 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor:
                      language === langOption.value
                        ? 'var(--color-accent)'
                        : 'var(--color-bgTertiary)',
                    color:
                      language === langOption.value
                        ? 'white'
                        : 'var(--color-text)',
                    border: `2px solid ${
                      language === langOption.value
                        ? 'var(--color-accent)'
                        : 'transparent'
                    }`,
                  }}
                >
                  {langOption.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Delete All Data */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              <Trash2 size={18} />
              {t('deleteAllData')}
            </motion.button>
          </div>
        </div>
      </Modal>

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
              onClick={handleDeleteAll}
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

