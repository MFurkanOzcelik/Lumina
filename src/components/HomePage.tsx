import { motion } from 'framer-motion';
import { FileText, FolderPlus } from 'lucide-react';
import { useRef } from 'react';
import { Clock } from './Clock';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotesStore } from '../store/useNotesStore';
import { useTranslation } from '../utils/translations';
import { Toast } from './Toast';
import { useState } from 'react';

export const HomePage = () => {
  const language = useSettingsStore((state) => state.language);
  const { createNote, updateNote, setActiveNote } = useNotesStore();
  const t = useTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleCreateNote = () => {
    createNote(null);
  };

  const handleAddDocumentClick = () => {
    // Trigger hidden file input
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      setToastMessage('Dosya çok büyük! Maksimum boyut 50MB.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      // Create new note with file attachment
      const noteId = createNote(null);
      
      // Add file attachment to the note
      const attachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        blob: file,
      };

      // Update note with attachment and set title to filename
      updateNote(noteId, {
        title: file.name,
        attachment,
      });

      // Open the note
      setActiveNote(noteId);

      setToastMessage(`${file.name} başarıyla yüklendi!`);
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setToastMessage('Dosya yüklenirken hata oluştu.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="h-full flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-10 max-w-2xl w-full pb-20"
      >
        {/* Clock */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Clock />
        </motion.div>
        
        {/* Welcome Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-bold text-center"
          style={{ color: 'var(--color-text)' }}
        >
          {t('welcome')} 👋
        </motion.h1>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-6 w-full justify-center mt-4"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateNote}
            className="px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              boxShadow: `0 10px 30px var(--color-shadow)`,
            }}
          >
            <FileText size={26} />
            {t('createNewNote')}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddDocumentClick}
            className="px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl"
            style={{
              backgroundColor: 'var(--color-bgTertiary)',
              color: 'var(--color-text)',
              boxShadow: `0 10px 30px var(--color-shadow)`,
            }}
          >
            <FolderPlus size={26} />
            {t('addDocument')}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Toast notification */}
      <Toast isVisible={showToast} message={toastMessage} type={toastType} />
    </div>
  );
};

