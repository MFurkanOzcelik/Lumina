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

    console.log('🔴 [HomePage] UPLOAD RAW FILE:', file);
    console.log('🔴 [HomePage] FILE.NAME:', file.name);
    const filePath = window.electronAPI?.getPathForFile
      ? window.electronAPI.getPathForFile(file)
      : (file as any)?.path;
    console.log('🔴 [HomePage] FILE.PATH:', filePath);
    console.log('🔴 [HomePage] FILE.TYPE:', file.type);
    console.log('🔴 [HomePage] FILE.SIZE:', file.size);

    // Check file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      setToastMessage(t('fileTooLarge'));
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      if (!filePath) {
        alert('Hata: Dosya yolu (Path) bulunamadı. Electron güvenlik ayarı veya dosya sürükleme hatası.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      try {
        const noteId = createNote(null);
        updateNote(noteId, {
          title: file.name,
          content: '',
          attachment: {
            name: file.name,
            type: file.type || 'application/pdf',
            size: file.size,
            blob: { path: filePath },
          },
        });
        setActiveNote(noteId);

        setToastMessage(`${file.name} ${t('fileUploadSuccess')}`);
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch (error) {
        console.error('Error handling PDF upload:', error);
        setToastMessage(t('fileUploadError'));
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      return; // Prevent FileReader from processing binary PDF content
    }

    try {
      // Create new note for text-based content
      const noteId = createNote(null);
      console.log('🔴 [HomePage] NOTEID CREATED:', noteId);

      // Read file as text - only for non-PDF files
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        
        console.log('🔴 [HomePage] FILE READ SUCCESS, CONTENT LENGTH:', fileContent.length);
        
        // Update note with file content and name as title
        const updates = {
          title: file.name,
          content: `<p>${fileContent.replace(/\n/g, '</p><p>')}</p>`,
        };
        
        console.log('🔴 [HomePage] CALLING updateNote WITH:', { noteId, updates });
        updateNote(noteId, updates);
        console.log('🔴 [HomePage] updateNote CALLED');

        // Open the note
        setActiveNote(noteId);

        setToastMessage(`${file.name} ${t('fileUploadSuccess')}`);
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      };
      
      reader.onerror = () => {
        setToastMessage(t('fileUploadError'));
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setToastMessage(t('fileUploadError'));
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

