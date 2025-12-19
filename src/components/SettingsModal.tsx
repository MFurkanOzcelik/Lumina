import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { Modal } from './Modal';
import { Toast } from './Toast';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotesStore } from '../store/useNotesStore';
import { useTranslation } from '../utils/translations';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/encryption';
import type { Theme, Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { 
    theme, 
    language, 
    security,
    setTheme, 
    setLanguage, 
    setMasterPassword,
    changeMasterPassword,
    disableSecurity,
    resetAll: resetSettings 
  } = useSettingsStore();
  const resetNotes = useNotesStore((state) => state.resetAll);
  const t = useTranslation(language);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Security state
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  const handleSetMasterPassword = async () => {
    // Validate password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      setToast({ message: validation.message, type: 'error' });
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setToast({ message: t('passwordsDoNotMatch'), type: 'error' });
      return;
    }

    try {
      const hash = await hashPassword(newPassword);
      setMasterPassword(hash, passwordHint);
      setToast({ message: t('passwordSet'), type: 'success' });
      setShowSecuritySetup(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('');
    } catch (error) {
      setToast({ message: t('encryptionError'), type: 'error' });
    }
  };

  const handleChangeMasterPassword = async () => {
    if (!security.masterPasswordHash) return;

    // Verify current password
    const isValid = await verifyPassword(currentPassword, security.masterPasswordHash);
    if (!isValid) {
      setToast({ message: t('passwordIncorrect'), type: 'error' });
      return;
    }

    // Validate new password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      setToast({ message: validation.message, type: 'error' });
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setToast({ message: t('passwordsDoNotMatch'), type: 'error' });
      return;
    }

    try {
      const hash = await hashPassword(newPassword);
      changeMasterPassword(hash, passwordHint);
      setToast({ message: t('passwordChanged'), type: 'success' });
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('');
    } catch (error) {
      setToast({ message: t('encryptionError'), type: 'error' });
    }
  };

  const handleDisableSecurity = () => {
    disableSecurity();
    setToast({ message: t('securityDisabled'), type: 'success' });
    setShowDisableConfirm(false);
  };

  const getPasswordStrengthColor = () => {
    if (!newPassword) return 'var(--color-textSecondary)';
    const validation = validatePasswordStrength(newPassword);
    if (validation.strength === 'weak') return 'var(--color-danger)';
    if (validation.strength === 'medium') return '#f59e0b';
    return '#10b981';
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

          {/* Security Section */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: 'var(--color-textSecondary)' }}
            >
              {t('security')}
            </label>
            
            {!security.isEnabled ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSecuritySetup(true)}
                className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                }}
              >
                <Lock size={18} />
                {t('setMasterPassword')}
              </motion.button>
            ) : (
              <div className="space-y-2">
                <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--color-bgTertiary)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={16} style={{ color: 'var(--color-accent)' }} />
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {t('masterPassword')}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    {security.passwordHint ? `${t('passwordHint')}: ${security.passwordHint}` : t('passwordSet')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowChangePassword(true)}
                    className="flex-1 px-4 py-2 rounded-xl font-medium text-sm"
                    style={{
                      backgroundColor: 'var(--color-bgTertiary)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {t('changeMasterPassword')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDisableConfirm(true)}
                    className="flex-1 px-4 py-2 rounded-xl font-medium text-sm"
                    style={{
                      backgroundColor: 'var(--color-bgTertiary)',
                      color: 'var(--color-danger)',
                    }}
                  >
                    {t('disableSecurity')}
                  </motion.button>
                </div>
              </div>
            )}
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

      {/* Set Master Password Modal */}
      <Modal
        isOpen={showSecuritySetup}
        onClose={() => {
          setShowSecuritySetup(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordHint('');
        }}
        title={t('setMasterPassword')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none pr-12"
                style={{
                  backgroundColor: 'var(--color-bgTertiary)',
                  color: 'var(--color-text)',
                  border: '2px solid transparent',
                }}
                placeholder={t('enterPassword')}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-textSecondary)' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 text-xs" style={{ color: getPasswordStrengthColor() }}>
                {validatePasswordStrength(newPassword).message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('confirmPassword')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                border: '2px solid transparent',
              }}
              placeholder={t('confirmPassword')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('passwordHint')}
            </label>
            <input
              type="text"
              value={passwordHint}
              onChange={(e) => setPasswordHint(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                border: '2px solid transparent',
              }}
              placeholder={t('passwordHint')}
            />
          </div>

          <p className="text-xs" style={{ color: 'var(--color-textSecondary)' }}>
            {t('passwordRequirements')}
          </p>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowSecuritySetup(false);
                setNewPassword('');
                setConfirmPassword('');
                setPasswordHint('');
              }}
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
              onClick={handleSetMasterPassword}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
            >
              {t('save')}
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Change Master Password Modal */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => {
          setShowChangePassword(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordHint('');
        }}
        title={t('changeMasterPassword')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('currentPassword')}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                border: '2px solid transparent',
              }}
              placeholder={t('enterPassword')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none pr-12"
                style={{
                  backgroundColor: 'var(--color-bgTertiary)',
                  color: 'var(--color-text)',
                  border: '2px solid transparent',
                }}
                placeholder={t('enterPassword')}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-textSecondary)' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 text-xs" style={{ color: getPasswordStrengthColor() }}>
                {validatePasswordStrength(newPassword).message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('confirmPassword')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                border: '2px solid transparent',
              }}
              placeholder={t('confirmPassword')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-textSecondary)' }}>
              {t('passwordHint')}
            </label>
            <input
              type="text"
              value={passwordHint}
              onChange={(e) => setPasswordHint(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                border: '2px solid transparent',
              }}
              placeholder={t('passwordHint')}
            />
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowChangePassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordHint('');
              }}
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
              onClick={handleChangeMasterPassword}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
            >
              {t('save')}
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Disable Security Confirmation Modal */}
      <Modal
        isOpen={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        title={t('confirmDisableSecurity')}
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--color-textSecondary)' }}>
            {t('confirmDisableSecurityMessage')}
          </p>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDisableConfirm(false)}
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
              onClick={handleDisableSecurity}
              className="flex-1 px-4 py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              {t('disableSecurity')}
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <Toast
        isVisible={toast !== null}
        message={toast?.message || ''}
        type={toast?.type || 'success'}
      />
    </>
  );
};

