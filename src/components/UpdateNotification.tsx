import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../utils/translations';

export const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);

  useEffect(() => {
    if (!window.electronAPI) return;

    // Listen for update available
    window.electronAPI.onUpdateAvailable?.((info: any) => {
      console.log('Update available:', info);
      setUpdateAvailable(true);
      setIsDownloading(true);
    });

    // Listen for download progress
    window.electronAPI.onDownloadProgress?.((progress: any) => {
      console.log('Download progress:', progress.percent);
      setDownloadProgress(Math.round(progress.percent));
    });

    // Listen for update downloaded
    window.electronAPI.onUpdateDownloaded?.((info: any) => {
      console.log('Update downloaded:', info);
      setUpdateDownloaded(true);
      setIsDownloading(false);
      setUpdateAvailable(false);
    });

    // Listen for update errors
    window.electronAPI.onUpdateError?.((error: string) => {
      console.error('Update error:', error);
      setIsDownloading(false);
      setUpdateAvailable(false);
    });
  }, []);

  const handleInstallUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const handleDismiss = () => {
    setUpdateDownloaded(false);
    setUpdateAvailable(false);
  };

  return (
    <AnimatePresence>
      {(updateAvailable || updateDownloaded) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          style={{ width: 'calc(100% - 2rem)', maxWidth: '500px' }}
        >
          <div
            className="rounded-xl shadow-2xl p-4 flex items-center gap-4"
            style={{
              backgroundColor: 'var(--color-bgSecondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
            >
              <Download size={20} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {isDownloading ? (
                <>
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {t('downloadingUpdate') || 'Downloading Update...'}
                  </h3>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--color-bgTertiary)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${downloadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    />
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--color-textSecondary)' }}
                  >
                    {downloadProgress}%
                  </p>
                </>
              ) : updateDownloaded ? (
                <>
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {t('updateReady') || 'Update Ready!'}
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--color-textSecondary)' }}
                  >
                    {t('updateReadyDescription') || 'Restart to install the latest version'}
                  </p>
                </>
              ) : null}
            </div>

            {/* Actions */}
            {updateDownloaded && (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstallUpdate}
                  className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                  }}
                >
                  {t('restartToUpdate') || 'Restart'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDismiss}
                  className="p-1 rounded-lg"
                  style={{
                    color: 'var(--color-textSecondary)',
                  }}
                >
                  <X size={18} />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

