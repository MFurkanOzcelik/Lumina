import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: ButtonProps) => {
  const variants = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'var(--color-bgTertiary)',
      color: 'var(--color-text)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'white',
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'white',
    },
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-medium transition-all ${sizes[size]} ${className}`}
      style={{
        ...variants[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 12px var(--color-shadow)`,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.button>
  );
};

