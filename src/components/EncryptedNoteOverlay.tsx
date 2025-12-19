import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { useSettingsStore } from '../store/useSettingsStore';

interface EncryptedNoteOverlayProps {
  onUnlock: (password: string) => Promise<boolean>;
  passwordHint?: string | null;
}

export const EncryptedNoteOverlay = ({ onUnlock, passwordHint }: EncryptedNoteOverlayProps) => {
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError(t('enterPassword'));
      return;
    }

    setIsUnlocking(true);
    setError('');

    const success = await onUnlock(password);

    if (!success) {
      setError(t('passwordIncorrect'));
      setPassword('');
      setIsUnlocking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundColor: 'var(--color-bgSecondary)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl"
        style={{
          backgroundColor: 'var(--color-bgPrimary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="p-4 rounded-full"
            style={{ backgroundColor: 'var(--color-bgTertiary)' }}
          >
            <Lock size={48} style={{ color: 'var(--color-accent)' }} />
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ color: 'var(--color-text)' }}
        >
          {t('noteIsEncrypted')}
        </h2>

        {/* Description */}
        <p
          className="text-center mb-6"
          style={{ color: 'var(--color-textSecondary)' }}
        >
          {t('enterPasswordToView')}
        </p>

        {/* Password Hint */}
        {passwordHint && (
          <div
            className="mb-4 p-3 rounded-xl text-sm"
            style={{
              backgroundColor: 'var(--color-bgTertiary)',
              color: 'var(--color-textSecondary)',
            }}
          >
            <span className="font-semibold">{t('passwordHint')}: </span>
            {passwordHint}
          </div>
        )}

        {/* Password Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder={t('enterPassword')}
              disabled={isUnlocking}
              className="w-full px-4 py-3 pr-12 rounded-xl outline-none transition-all"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                border: `2px solid ${error ? 'var(--color-danger)' : 'transparent'}`,
              }}
              autoFocus
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--color-textSecondary)' }}
              disabled={isUnlocking}
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

        {/* Unlock Button */}
        <motion.button
          whileHover={{ scale: isUnlocking ? 1 : 1.02 }}
          whileTap={{ scale: isUnlocking ? 1 : 0.98 }}
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: isUnlocking ? 'var(--color-bgTertiary)' : 'var(--color-accent)',
            color: 'white',
            opacity: isUnlocking ? 0.6 : 1,
            cursor: isUnlocking ? 'not-allowed' : 'pointer',
          }}
        >
          {isUnlocking ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Lock size={18} />
              </motion.div>
              {t('unlock')}...
            </>
          ) : (
            <>
              <Lock size={18} />
              {t('unlock')}
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

