import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  isVisible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export const Toast = ({ isVisible, message, type = 'success' }: ToastProps) => {
  const icons = {
    success: <Check size={20} />,
    error: <X size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  const colors = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    warning: '#f59e0b',
    info: 'var(--color-accent)',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50"
          style={{
            backgroundColor: colors[type],
            color: 'white',
            boxShadow: `0 10px 40px ${colors[type]}40`,
          }}
        >
          {icons[type]}
          <span className="font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

