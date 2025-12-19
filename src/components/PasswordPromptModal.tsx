import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { useSettingsStore } from '../store/useSettingsStore';

interface PasswordPromptModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  showHint?: boolean;
}

export const PasswordPromptModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  showHint = true,
}: PasswordPromptModalProps) => {
  const language = useSettingsStore((state) => state.language);
  const security = useSettingsStore((state) => state.security);
  const t = useTranslation(language);
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    console.log('[PASSWORD_MODAL] Confirm clicked');
    console.log('[PASSWORD_MODAL] Password length:', password.length);
    
    if (!password.trim()) {
      setError(t('enterPassword'));
      return;
    }

    console.log('[PASSWORD_MODAL] Calling onConfirm with password');
    onConfirm(password);
  };

  const handleCancel = () => {
    console.log('[PASSWORD_MODAL] Cancel clicked');
    setPassword('');
    setError('');
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            style={{ zIndex: 9999 }}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ zIndex: 10000 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md rounded-2xl shadow-2xl p-6"
              style={{
                backgroundColor: 'var(--color-bgPrimary)',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: 'var(--color-bgTertiary)' }}
                >
                  <Lock size={32} style={{ color: 'var(--color-accent)' }} />
                </div>
              </div>

              {/* Title */}
              <h2
                className="text-xl font-bold text-center mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                {title || t('enterPassword')}
              </h2>

              {/* Message */}
              {message && (
                <p
                  className="text-center mb-4 text-sm"
                  style={{ color: 'var(--color-textSecondary)' }}
                >
                  {message}
                </p>
              )}

              {/* Password Hint */}
              {showHint && security.passwordHint && (
                <div
                  className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
                  style={{
                    backgroundColor: 'var(--color-bgTertiary)',
                    color: 'var(--color-textSecondary)',
                  }}
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{t('passwordHint')}: </span>
                    {security.passwordHint}
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder={t('enterPassword')}
                    className="w-full px-4 py-3 pr-12 rounded-xl outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--color-bgTertiary)',
                      color: 'var(--color-text)',
                      border: `2px solid ${error ? 'var(--color-danger)' : 'transparent'}`,
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-textSecondary)' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
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
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                  }}
                >
                  {t('unlock')}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

