import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getTagColor } from '../utils/tagUtils';

interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const TagInput = ({ tags, onAddTag, onRemoveTag }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const trimmedValue = inputValue.trim();
      
      // Prevent empty tags
      if (!trimmedValue) {
        return;
      }
      
      // Prevent duplicate tags (case-insensitive)
      const isDuplicate = tags.some(
        tag => tag.toLowerCase() === trimmedValue.toLowerCase()
      );
      
      if (isDuplicate) {
        setInputValue('');
        return;
      }
      
      // Add the tag
      onAddTag(trimmedValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Existing Tags */}
      {tags.map((tag) => {
        const colorClasses = getTagColor(tag);
        return (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colorClasses}`}
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="ml-1 hover:opacity-70 transition-opacity"
              aria-label={`Remove ${tag} tag`}
            >
              <X size={14} />
            </button>
          </motion.div>
        );
      })}
      
      {/* Tag Input Field */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag..."
        className="flex-shrink-0 px-3 py-1 text-sm rounded-full bg-transparent outline-none border focus:outline-none focus:ring-1"
        style={{
          color: 'var(--color-text)',
          borderColor: 'var(--color-border)',
          minWidth: '120px',
        }}
      />
    </div>
  );
};

