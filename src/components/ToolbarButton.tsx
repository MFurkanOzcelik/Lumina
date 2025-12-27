import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const ToolbarButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  disabled = false,
}: ToolbarButtonProps) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onMouseDown={(e) => {
        e.preventDefault(); // Editörden focus kaybını engelle
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          onClick();
        }
      }}
      disabled={disabled}
      className="p-2 rounded-lg transition-all"
      style={{
        backgroundColor: isActive
          ? 'var(--color-accent)'
          : 'var(--color-bgTertiary)',
        color: isActive ? 'white' : 'var(--color-text)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={label}
    >
      <Icon size={18} />
    </motion.button>
  );
};
