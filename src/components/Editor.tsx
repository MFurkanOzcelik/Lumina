import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Type,
  Save,
  Trash2,
  ChevronDown,
  Paperclip,
  Download,
  X,
  Code,
  FileDown,
} from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../utils/translations';
import { Modal } from './Modal';
import { Toast } from './Toast';
import { TagInput } from './TagInput';
import { ExportModal } from './ExportModal';
import TurndownService from 'turndown';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml'; // HTML
import sql from 'highlight.js/lib/languages/sql';
import csharp from 'highlight.js/lib/languages/csharp';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('csharp', csharp);

export const Editor = () => {
  const { activeNoteId, notes, updateNote, deleteNote, setActiveNote } = useNotesStore();
  const language = useSettingsStore((state) => state.language);
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const t = useTranslation(language);

  const activeNote = notes.find((note) => note.id === activeNoteId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [activeHeading, setActiveHeading] = useState<string | null>(null); // 'h1', 'h2', 'h3', or null
  const [isEditorFocused, setIsEditorFocused] = useState(false); // Track if editor has focus
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const isRestoringCursor = useRef(false);

  // Create and cleanup file URL for attachments
  useEffect(() => {
    if (activeNote?.attachment?.blob) {
      const url = URL.createObjectURL(activeNote.attachment.blob);
      setFileUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
        setFileUrl(null);
      };
    } else {
      setFileUrl(null);
    }
  }, [activeNote?.attachment]);

  // Helper function to get cursor position in contentEditable
  const getCursorPosition = (): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !contentRef.current) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(contentRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };

  // Helper function to set cursor position in contentEditable
  const setCursorPosition = (position: number) => {
    if (!contentRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    try {
      const range = document.createRange();
      let currentPos = 0;
      let found = false;

      const traverseNodes = (node: Node): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
          const textLength = node.textContent?.length || 0;
          if (currentPos + textLength >= position) {
            range.setStart(node, position - currentPos);
            range.collapse(true);
            found = true;
            return true;
          }
          currentPos += textLength;
        } else {
          for (let i = 0; i < node.childNodes.length; i++) {
            if (traverseNodes(node.childNodes[i])) return true;
          }
        }
        return false;
      };

      traverseNodes(contentRef.current);

      if (found) {
        selection.removeAllRanges();
        selection.addRange(range);
        contentRef.current.focus();
      }
    } catch (error) {
      console.error('Error restoring cursor position:', error);
      contentRef.current.focus();
    }
  };

  // Save cursor position when user interacts with editor
  const saveCursorPosition = () => {
    if (activeNoteId && !isRestoringCursor.current) {
      const position = getCursorPosition();
      updateNote(activeNoteId, { cursorPosition: position });
    }
  };

  // Only update innerHTML when switching notes, not on every content change
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setTags(activeNote.tags || []); // Load tags from active note
      
      // Update the contentEditable div only when switching notes
      if (contentRef.current && contentRef.current.innerHTML !== activeNote.content) {
        contentRef.current.innerHTML = activeNote.content;
      }
      
      // Smart focus logic
      setTimeout(() => {
        const hasContent = activeNote.content.trim().length > 0;
        const hasSavedCursor = typeof activeNote.cursorPosition === 'number';
        
        if (hasContent && hasSavedCursor && activeNote.cursorPosition !== undefined) {
          // Restore cursor position in content
          isRestoringCursor.current = true;
          setCursorPosition(activeNote.cursorPosition);
          setTimeout(() => {
            isRestoringCursor.current = false;
          }, 100);
        } else {
          // Focus title for new/empty notes
          titleRef.current?.focus();
        }
      }, 100);
    }
  }, [activeNote?.id]); // Only trigger on note ID change

  const handleSave = () => {
    if (activeNoteId) {
      updateNote(activeNoteId, { title, content, tags });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleDelete = () => {
    if (activeNoteId) {
      deleteNote(activeNoteId);
      setShowDeleteConfirm(false);
      setActiveNote(null);
    }
  };

  // Tag management functions
  const handleAddTag = (tag: string) => {
    if (!activeNoteId) return;
    
    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    updateNote(activeNoteId, { tags: updatedTags });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNoteId) return;
    
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    updateNote(activeNoteId, { tags: updatedTags });
  };

  // Export note as .lum (Markdown)
  const handleExportAsLum = () => {
    if (!activeNote) return;
    
    // Initialize Turndown service
    const turndownService = new TurndownService({
      headingStyle: 'atx', // Use # for headings
      codeBlockStyle: 'fenced', // Use ``` for code blocks
      bulletListMarker: '-', // Use - for bullet lists
    });
    
    // Add custom rule for code blocks with syntax highlighting
    turndownService.addRule('codeBlock', {
      filter: (node: HTMLElement) => {
        return node.nodeName === 'PRE' && node.querySelector('code') !== null;
      },
      replacement: (_content: string, node: HTMLElement) => {
        const codeElement = node.querySelector('code');
        const code = codeElement?.textContent || '';
        return '\n```\n' + code + '\n```\n';
      }
    });
    
    // Add custom rule for inline code
    turndownService.addRule('inlineCode', {
      filter: (node: HTMLElement) => {
        return node.nodeName === 'CODE' && node.parentElement?.nodeName !== 'PRE';
      },
      replacement: (content: string) => {
        return '`' + content + '`';
      }
    });
    
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(content);
    
    // Create markdown content with title
    const fullMarkdown = `# ${title || 'Untitled Note'}\n\n${markdown}`;
    
    // Create blob and download with .lum extension
    const blob = new Blob([fullMarkdown], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'Untitled Note'}.lum`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export note as PDF
  const handleExportAsPdf = async () => {
    if (!activeNote || !window.electronAPI?.exportToPdf) return;

    try {
      const result = await window.electronAPI.exportToPdf(title || 'Untitled Note', content);
      
      if (result.success) {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } else if (!result.canceled) {
        console.error('PDF export failed:', result.error);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  // Open export modal
  const handleExportNote = () => {
    setShowExportModal(true);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const isCommandActive = (command: string): boolean => {
    // Map command names to our format keys
    const formatMap: Record<string, string> = {
      'bold': 'bold',
      'italic': 'italic',
      'underline': 'underline',
      'strikeThrough': 'strikethrough',
      'insertUnorderedList': 'ul',
      'insertOrderedList': 'ol',
    };
    
    const formatKey = formatMap[command] || command;
    
    // For lists, also check the actual DOM state
    if (command === 'insertUnorderedList') {
      return activeFormats.has('ul') || isInsideList('ul');
    }
    if (command === 'insertOrderedList') {
      return activeFormats.has('ol') || isInsideList('ol');
    }
    
    return activeFormats.has(formatKey);
  };

  // Helper function to handle format button clicks with immediate feedback
  const handleFormatClick = (command: string, formatKey: string) => {
    // Toggle active state immediately
    const newFormats = new Set(activeFormats);
    if (newFormats.has(formatKey)) {
      newFormats.delete(formatKey);
    } else {
      newFormats.add(formatKey);
    }
    setActiveFormats(newFormats);
    
    // Apply the format
    execCommand(command);
  };

  // Helper function to check if cursor is inside a list
  const isInsideList = (listType: 'ul' | 'ol'): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    if (!node) return false;

    // Traverse up to find list element
    while (node && node !== contentRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as Element).tagName.toLowerCase();
        if (tagName === listType) {
          return true;
        }
      }
      node = node.parentNode;
    }
    
    return false;
  };

  // Helper function to handle list button clicks with proper toggle
  const handleListClick = (listType: 'ul' | 'ol') => {
    const formatKey = listType;
    const command = listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
    
    // Check if we're currently in this type of list
    const isActive = isInsideList(listType);
    
    if (isActive) {
      // We're in a list, so unwrap it by toggling the command
      // This will remove the list formatting
      document.execCommand(command, false);
      
      // Update state to reflect removal
      const newFormats = new Set(activeFormats);
      newFormats.delete(formatKey);
      setActiveFormats(newFormats);
    } else {
      // We're not in a list, so apply it
      document.execCommand(command, false);
      
      // Update state to reflect addition
      const newFormats = new Set(activeFormats);
      newFormats.add(formatKey);
      setActiveFormats(newFormats);
    }
    
    contentRef.current?.focus();
    
    // Update content state
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  };

  // Helper function to handle heading clicks with exclusive selection
  const handleHeadingClick = (headingLevel: 'h1' | 'h2' | 'h3') => {
    // If clicking the already active heading, revert to paragraph
    if (activeHeading === headingLevel) {
      document.execCommand('formatBlock', false, '<p>');
      setActiveHeading(null);
    } else {
      // Apply the new heading
      document.execCommand('formatBlock', false, `<${headingLevel}>`);
      setActiveHeading(headingLevel);
    }
    
    contentRef.current?.focus();
    
    // Update content state
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  };

  // Check if a heading is active at cursor position
  const isHeadingActive = (headingLevel: 'h1' | 'h2' | 'h3'): boolean => {
    return activeHeading === headingLevel;
  };

  // Update active heading and list states based on cursor position
  useEffect(() => {
    const updateFormattingState = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      let node = selection.anchorNode;
      if (!node) return;

      let foundHeading = false;
      let foundUL = false;
      let foundOL = false;
      
      // Traverse up to find heading or list elements
      let currentNode: Node | null = node;
      while (currentNode && currentNode !== contentRef.current) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const tagName = (currentNode as Element).tagName.toLowerCase();
          
          // Check for headings
          if (!foundHeading && (tagName === 'h1' || tagName === 'h2' || tagName === 'h3')) {
            setActiveHeading(tagName as 'h1' | 'h2' | 'h3');
            foundHeading = true;
          }
          
          // Check for lists
          if (tagName === 'ul') foundUL = true;
          if (tagName === 'ol') foundOL = true;
        }
        currentNode = currentNode.parentNode;
      }
      
      // Update heading state
      if (!foundHeading) {
        setActiveHeading(null);
      }
      
      // Update list states in activeFormats
      setActiveFormats(prev => {
        const newFormats = new Set(prev);
        
        if (foundUL) {
          newFormats.add('ul');
        } else {
          newFormats.delete('ul');
        }
        
        if (foundOL) {
          newFormats.add('ol');
        } else {
          newFormats.delete('ol');
        }
        
        return newFormats;
      });
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('keyup', updateFormattingState);
      contentElement.addEventListener('mouseup', updateFormattingState);
      contentElement.addEventListener('focus', updateFormattingState);
      
      return () => {
        contentElement.removeEventListener('keyup', updateFormattingState);
        contentElement.removeEventListener('mouseup', updateFormattingState);
        contentElement.removeEventListener('focus', updateFormattingState);
      };
    }
  }, []);

  const fontSizes = Array.from({ length: 21 }, (_, i) => i + 10);

  // Fix font size to use inline styles instead of execCommand
  const handleFontSizeChange = (size: number) => {
    setCurrentFontSize(size);
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // No text selected
    
    // Extract selected content
    const selectedContent = range.extractContents();
    
    // Create span with inline font-size style
    const span = document.createElement('span');
    span.style.fontSize = `${size}px`;
    span.appendChild(selectedContent);
    
    // Insert the styled span
    range.insertNode(span);
    
    // Restore selection
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
    
    // Update content state
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
    
    setShowFontSize(false);
    contentRef.current?.focus();
  };

  // Check if cursor is inside a code block
  const isInsideCodeBlock = (): HTMLPreElement | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;
    if (!node) return null;

    // Traverse up to find pre element (code block)
    while (node && node !== contentRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName === 'PRE') {
          return element as HTMLPreElement;
        }
      }
      node = node.parentNode;
    }
    
    return null;
  };

  // Handle code block insertion with toggle logic
  const handleCodeBlock = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Check if we're already inside a code block
    const existingCodeBlock = isInsideCodeBlock();
    
    if (existingCodeBlock) {
      // TOGGLE OFF: Convert code block back to paragraph
      const codeElement = existingCodeBlock.querySelector('code');
      const textContent = codeElement?.textContent || '';
      
      // Create a paragraph with the code content
      const p = document.createElement('p');
      p.textContent = textContent;
      
      // Replace the code block with the paragraph
      existingCodeBlock.parentNode?.replaceChild(p, existingCodeBlock);
      
      // Move cursor to the paragraph
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Update content
      if (contentRef.current) {
        setContent(contentRef.current.innerHTML);
      }
      
      contentRef.current?.focus();
      return;
    }

    // TOGGLE ON: Create new code block (only if not inside one)
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // Create code block element
    const pre = document.createElement('pre');
    pre.contentEditable = 'true'; // Make pre editable to prevent splitting
    pre.style.whiteSpace = 'pre'; // Preserve whitespace and newlines
    
    const code = document.createElement('code');
    code.className = 'hljs';
    code.setAttribute('spellcheck', 'false');
    
    // Only add selected text if there is any, otherwise leave empty for placeholder
    if (selectedText) {
      code.textContent = selectedText;
    } else {
      // Leave empty - CSS will show placeholder
      code.textContent = '';
      pre.setAttribute('data-placeholder', 'Enter code here...');
      pre.classList.add('is-empty');
    }
    
    pre.appendChild(code);
    
    // Insert the code block
    range.deleteContents();
    range.insertNode(pre);
    
    // Move cursor inside code block
    const newRange = document.createRange();
    newRange.selectNodeContents(code);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    // Add input listener to toggle placeholder visibility
    code.addEventListener('input', function handleInput() {
      const isEmpty = code.textContent?.trim() === '';
      if (isEmpty) {
        pre.classList.add('is-empty');
      } else {
        pre.classList.remove('is-empty');
      }
    });
    
    // Update content
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
    
    contentRef.current?.focus();
  };

  // Apply syntax highlighting to all code blocks
  const applyHighlighting = () => {
    if (!contentRef.current) return;
    
    const codeBlocks = contentRef.current.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      // Skip if currently being edited (has focus)
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        let node: Node | null = selection.anchorNode;
        while (node && node !== contentRef.current) {
          if (node === block) {
            // Don't highlight while user is typing in this block
            return;
          }
          node = node.parentNode;
        }
      }
      
      // Try to auto-detect language or use plain text
      try {
        const result = hljs.highlightAuto(block.textContent || '');
        block.innerHTML = result.value;
        block.className = `hljs ${result.language || ''}`;
        
        // Ensure contentEditable is maintained
        (block as HTMLElement).contentEditable = 'true';
        (block as HTMLElement).setAttribute('spellcheck', 'false');
      } catch (error) {
        console.error('Highlighting error:', error);
      }
    });
  };

  // Apply highlighting when content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      applyHighlighting();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [content]);

  // Handle comprehensive markdown shortcuts
  useEffect(() => {
    const handleMarkdownShortcut = (e: KeyboardEvent) => {
      // Only trigger on Space or Enter
      if (e.key !== ' ' && e.key !== 'Enter') return;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      
      if (textNode.nodeType !== Node.TEXT_NODE) return;
      
      const text = textNode.textContent || '';
      const cursorPos = range.startOffset;
      const textBeforeCursor = text.substring(0, cursorPos);
      
      // Check if we're at the start of a line (or after whitespace only)
      const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
      const lineText = textBeforeCursor.substring(lineStart);
      const trimmedLine = lineText.trim();
      
      // === HEADINGS ===
      // # + space → H1
      if (trimmedLine === '#' && e.key === ' ') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + text.substring(cursorPos);
        textNode.textContent = newText;
        
        // Move cursor to start of line
        range.setStart(textNode, lineStart);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Apply H1
        document.execCommand('formatBlock', false, '<h1>');
        return;
      }
      
      // ## + space → H2
      if (trimmedLine === '##' && e.key === ' ') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + text.substring(cursorPos);
        textNode.textContent = newText;
        
        range.setStart(textNode, lineStart);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.execCommand('formatBlock', false, '<h2>');
        return;
      }
      
      // ### + space → H3
      if (trimmedLine === '###' && e.key === ' ') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + text.substring(cursorPos);
        textNode.textContent = newText;
        
        range.setStart(textNode, lineStart);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.execCommand('formatBlock', false, '<h3>');
        return;
      }
      
      // === LISTS ===
      // - or * + space → Bullet List
      if ((trimmedLine === '-' || trimmedLine === '*') && e.key === ' ') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + text.substring(cursorPos);
        textNode.textContent = newText;
        
        range.setStart(textNode, lineStart);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.execCommand('insertUnorderedList', false);
        return;
      }
      
      // 1. + space → Ordered List
      if (/^\d+\.$/.test(trimmedLine) && e.key === ' ') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + text.substring(cursorPos);
        textNode.textContent = newText;
        
        range.setStart(textNode, lineStart);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.execCommand('insertOrderedList', false);
        return;
      }
      
      // === CODE BLOCK ===
      // ``` + space/enter → Code Block
      if (trimmedLine === '```' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + text.substring(cursorPos);
        textNode.textContent = newText;
        
        range.setStart(textNode, lineStart);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        handleCodeBlock();
        return;
      }
    };
    
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('keydown', handleMarkdownShortcut);
      return () => contentElement.removeEventListener('keydown', handleMarkdownShortcut);
    }
  }, []);

  if (!activeNote) {
    return null;
  }

  return (
    <>
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Toolbar - Fixed height */}
        <div
          className={`flex-none flex items-center justify-between py-4 border-b ${
            sidebarCollapsed ? 'pl-24 pr-6' : 'px-6'
          }`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bold */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus loss from editor
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFormatClick('bold', 'bold');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('bold')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('bold') ? 'white' : 'var(--color-text)',
              }}
              title={t('bold')}
            >
              <Bold size={18} />
            </motion.button>

            {/* Italic */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFormatClick('italic', 'italic');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('italic')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('italic') ? 'white' : 'var(--color-text)',
              }}
              title={t('italic')}
            >
              <Italic size={18} />
            </motion.button>

            {/* Underline */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFormatClick('underline', 'underline');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('underline')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('underline') ? 'white' : 'var(--color-text)',
              }}
              title={t('underline')}
            >
              <Underline size={18} />
            </motion.button>

            {/* Strikethrough */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFormatClick('strikeThrough', 'strikethrough');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('strikeThrough')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('strikeThrough') ? 'white' : 'var(--color-text)',
              }}
              title={t('strikethrough')}
            >
              <Strikethrough size={18} />
            </motion.button>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Font Size */}
            <div className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFontSize(!showFontSize);
                }}
                className="p-2 rounded-lg flex items-center gap-1 transition-all"
                style={{
                  backgroundColor: 'var(--color-bgTertiary)',
                  color: 'var(--color-text)',
                }}
                title={t('fontSize')}
              >
                <Type size={18} />
                <span className="text-xs">{currentFontSize}</span>
                <ChevronDown size={14} />
              </motion.button>

              <AnimatePresence>
                {showFontSize && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 rounded-lg shadow-lg overflow-hidden z-10"
                    style={{
                      backgroundColor: 'var(--color-bgSecondary)',
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {fontSizes.map((size) => (
                        <motion.button
                          key={size}
                          type="button"
                          whileHover={{ backgroundColor: 'var(--color-bgTertiary)' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFontSizeChange(size);
                          }}
                          className="w-full px-4 py-2 text-left text-sm transition-colors"
                          style={{
                            color:
                              size === currentFontSize
                                ? 'var(--color-accent)'
                                : 'var(--color-text)',
                            fontWeight: size === currentFontSize ? 'bold' : 'normal',
                          }}
                        >
                          {size}px
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* H1 */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleHeadingClick('h1');
              }}
              className="px-3 py-2 rounded-lg transition-all font-bold text-sm"
              style={{
                backgroundColor: isHeadingActive('h1')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isHeadingActive('h1') ? 'white' : 'var(--color-text)',
              }}
              title="Heading 1"
            >
              H1
            </motion.button>

            {/* H2 */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleHeadingClick('h2');
              }}
              className="px-3 py-2 rounded-lg transition-all font-bold text-sm"
              style={{
                backgroundColor: isHeadingActive('h2')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isHeadingActive('h2') ? 'white' : 'var(--color-text)',
              }}
              title="Heading 2"
            >
              H2
            </motion.button>

            {/* H3 */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleHeadingClick('h3');
              }}
              className="px-3 py-2 rounded-lg transition-all font-bold text-sm"
              style={{
                backgroundColor: isHeadingActive('h3')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isHeadingActive('h3') ? 'white' : 'var(--color-text)',
              }}
              title="Heading 3"
            >
              H3
            </motion.button>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Bullet List */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleListClick('ul');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('insertUnorderedList')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('insertUnorderedList')
                  ? 'white'
                  : 'var(--color-text)',
              }}
              title={t('bulletList')}
            >
              <List size={18} />
            </motion.button>

            {/* Numbered List */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleListClick('ol');
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: isCommandActive('insertOrderedList')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: isCommandActive('insertOrderedList')
                  ? 'white'
                  : 'var(--color-text)',
              }}
              title={t('numberedList')}
            >
              <ListOrdered size={18} />
            </motion.button>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Code Block */}
            <motion.button
              type="button"
              disabled={!isEditorFocused}
              whileHover={isEditorFocused ? { scale: 1.05 } : {}}
              whileTap={isEditorFocused ? { scale: 0.95 } : {}}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isEditorFocused) {
                  handleCodeBlock();
                }
              }}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                opacity: isEditorFocused ? 1 : 0.5,
                cursor: isEditorFocused ? 'pointer' : 'not-allowed',
              }}
              title={isEditorFocused ? "Code Block" : "Focus editor to use Code Block"}
            >
              <Code size={18} />
            </motion.button>
          </div>

          {/* Actions - aligned to the right */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Export Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                handleExportNote();
              }}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-bgTertiary)',
                color: 'var(--color-text)',
                border: `1px solid var(--color-border)`,
              }}
              title="Export as .lum file"
            >
              <FileDown size={18} />
              Export
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'white',
              }}
            >
              <Trash2 size={18} />
              {t('delete')}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-success)',
                color: 'white',
              }}
            >
              <Save size={18} />
              {t('save')}
            </motion.button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto h-full">
          {/* Title Input - Ghost Style */}
          <div className="px-6 pt-6 pb-4">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setTitle(newTitle);
                if (activeNoteId) {
                  updateNote(activeNoteId, { title: newTitle });
                }
              }}
              onFocus={() => setIsEditorFocused(false)}
              placeholder={t('untitledNote')}
              className="w-full text-3xl font-bold bg-transparent outline-none border-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)' }}
            />
          </div>

          {/* Tag Input Area */}
          {activeNote && (
            <div className="px-6 pb-4">
              <TagInput
                tags={tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </div>
          )}

          {/* Separator Line */}
          <div className="px-6">
            <hr style={{ borderColor: 'var(--color-border)', opacity: 0.3 }} />
          </div>

          {/* File Attachment Display */}
          {activeNote?.attachment && fileUrl && (
            <div className="px-4 pt-4 pb-4 flex flex-col h-full" style={{ minHeight: 'calc(100vh - 150px)' }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden flex flex-col flex-1"
                style={{
                  backgroundColor: 'var(--color-bgSecondary)',
                  border: `1px solid var(--color-border)`,
                  minHeight: 'calc(100vh - 180px)',
                }}
              >
                {/* Attachment Header */}
                <div
                  className="flex-none px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-bgTertiary)' }}
                >
                  <div className="flex items-center gap-3">
                    <Paperclip size={20} style={{ color: 'var(--color-accent)' }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                        {activeNote.attachment.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-textSecondary)' }}>
                        {(activeNote.attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={fileUrl}
                      download={activeNote.attachment.name}
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                      }}
                      title="İndir"
                    >
                      <Download size={18} />
                    </motion.a>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (activeNoteId) {
                          updateNote(activeNoteId, { attachment: undefined });
                        }
                      }}
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-danger)',
                        color: 'white',
                      }}
                      title="Dosyayı Kaldır"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>
                </div>

                {/* File Preview (for PDFs and text files) */}
                {activeNote.attachment.type === 'application/pdf' && (
                  <div className="flex-1 w-full h-full" style={{ minHeight: 'calc(100vh - 250px)' }}>
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-none"
                      title={activeNote.attachment.name}
                      style={{ display: 'block', minHeight: 'calc(100vh - 250px)' }}
                    />
                  </div>
                )}
                {activeNote.attachment.type.startsWith('text/') && (
                  <div className="flex-1 w-full h-full" style={{ minHeight: 'calc(100vh - 250px)' }}>
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-none"
                      title={activeNote.attachment.name}
                      style={{ display: 'block', minHeight: 'calc(100vh - 250px)' }}
                    />
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Content Editor */}
          <div className="px-6 pb-6 pt-4">
            <div
              ref={contentRef}
              contentEditable
              className="editor-content min-h-full outline-none"
              data-placeholder={t('startTyping')}
              style={{
                color: 'var(--color-text)',
                fontSize: `${currentFontSize}px`,
              }}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={(e) => {
                // Only set to false if focus is not moving to another element in the editor
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || !contentRef.current?.contains(relatedTarget)) {
                  setIsEditorFocused(false);
                }
                saveCursorPosition();
              }}
              onInput={(e) => {
                // Update local state and store immediately
                const newContent = e.currentTarget.innerHTML;
                setContent(newContent);
                
                // Update store immediately (debounced save will handle persistence)
                if (activeNoteId) {
                  updateNote(activeNoteId, { content: newContent });
                }
                
                // Handle inline markdown formatting (**bold**, *italic*, ~~strikethrough~~, `code`)
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                
                const range = selection.getRangeAt(0);
                const textNode = range.startContainer;
                
                if (textNode.nodeType !== Node.TEXT_NODE) return;
                
                const text = textNode.textContent || '';
                const cursorPos = range.startOffset;
                
                // **text** or __text__ → Bold
                const boldPattern1 = /\*\*([^\*]+)\*\*$/;
                const boldPattern2 = /__([^_]+)__$/;
                const textBeforeCursor = text.substring(0, cursorPos);
                
                const boldMatch1 = textBeforeCursor.match(boldPattern1);
                const boldMatch2 = textBeforeCursor.match(boldPattern2);
                
                if (boldMatch1) {
                  const matchText = boldMatch1[1];
                  const matchStart = cursorPos - boldMatch1[0].length;
                  
                  // Remove the markdown syntax
                  const newText = text.substring(0, matchStart) + matchText + text.substring(cursorPos);
                  textNode.textContent = newText;
                  
                  // Select the text
                  range.setStart(textNode, matchStart);
                  range.setEnd(textNode, matchStart + matchText.length);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  // Apply bold
                  document.execCommand('bold', false);
                  
                  // Move cursor to end
                  range.collapse(false);
                  return;
                }
                
                if (boldMatch2) {
                  const matchText = boldMatch2[1];
                  const matchStart = cursorPos - boldMatch2[0].length;
                  
                  const newText = text.substring(0, matchStart) + matchText + text.substring(cursorPos);
                  textNode.textContent = newText;
                  
                  range.setStart(textNode, matchStart);
                  range.setEnd(textNode, matchStart + matchText.length);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  document.execCommand('bold', false);
                  range.collapse(false);
                  return;
                }
                
                // *text* or _text_ → Italic (but not ** or __)
                const italicPattern1 = /(?<!\*)\*([^\*]+)\*(?!\*)$/;
                const italicPattern2 = /(?<!_)_([^_]+)_(?!_)$/;
                
                const italicMatch1 = textBeforeCursor.match(italicPattern1);
                const italicMatch2 = textBeforeCursor.match(italicPattern2);
                
                if (italicMatch1) {
                  const matchText = italicMatch1[1];
                  const matchStart = cursorPos - italicMatch1[0].length;
                  
                  const newText = text.substring(0, matchStart) + matchText + text.substring(cursorPos);
                  textNode.textContent = newText;
                  
                  range.setStart(textNode, matchStart);
                  range.setEnd(textNode, matchStart + matchText.length);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  document.execCommand('italic', false);
                  range.collapse(false);
                  return;
                }
                
                if (italicMatch2) {
                  const matchText = italicMatch2[1];
                  const matchStart = cursorPos - italicMatch2[0].length;
                  
                  const newText = text.substring(0, matchStart) + matchText + text.substring(cursorPos);
                  textNode.textContent = newText;
                  
                  range.setStart(textNode, matchStart);
                  range.setEnd(textNode, matchStart + matchText.length);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  document.execCommand('italic', false);
                  range.collapse(false);
                  return;
                }
                
                // ~~text~~ → Strikethrough
                const strikePattern = /~~([^~]+)~~$/;
                const strikeMatch = textBeforeCursor.match(strikePattern);
                
                if (strikeMatch) {
                  const matchText = strikeMatch[1];
                  const matchStart = cursorPos - strikeMatch[0].length;
                  
                  const newText = text.substring(0, matchStart) + matchText + text.substring(cursorPos);
                  textNode.textContent = newText;
                  
                  range.setStart(textNode, matchStart);
                  range.setEnd(textNode, matchStart + matchText.length);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  document.execCommand('strikeThrough', false);
                  range.collapse(false);
                  return;
                }
                
                // `text` → Inline Code (wrapped in <code> tag)
                const codePattern = /`([^`]+)`$/;
                const codeMatch = textBeforeCursor.match(codePattern);
                
                if (codeMatch) {
                  const matchText = codeMatch[1];
                  const matchStart = cursorPos - codeMatch[0].length;
                  
                  const newText = text.substring(0, matchStart) + matchText + text.substring(cursorPos);
                  textNode.textContent = newText;
                  
                  // Create a <code> element for inline code
                  const codeElement = document.createElement('code');
                  codeElement.textContent = matchText;
                  codeElement.style.backgroundColor = '#1e293b';
                  codeElement.style.color = '#e2e8f0';
                  codeElement.style.padding = '2px 6px';
                  codeElement.style.borderRadius = '4px';
                  codeElement.style.fontFamily = "'Fira Code', 'Courier New', monospace";
                  codeElement.style.fontSize = '0.9em';
                  
                  // Replace the text with the code element
                  range.setStart(textNode, matchStart);
                  range.setEnd(textNode, matchStart + matchText.length);
                  range.deleteContents();
                  range.insertNode(codeElement);
                  
                  // Move cursor after the code element
                  range.setStartAfter(codeElement);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  // Add a space after for better UX
                  const spaceNode = document.createTextNode(' ');
                  range.insertNode(spaceNode);
                  range.setStartAfter(spaceNode);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  return;
                }
              }}
              onKeyDown={(e) => {
                // Handle Tab key to insert 4 spaces
                if (e.key === 'Tab') {
                  e.preventDefault();
                  document.execCommand('insertText', false, '    ');
                }

                // Helper function to check if cursor is inside a code block
                const isInCodeBlock = (): HTMLPreElement | null => {
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return null;
                  
                  let node = selection.anchorNode;
                  if (!node) return null;
                  
                  let currentNode: Node | null = node;
                  while (currentNode && currentNode !== contentRef.current) {
                    if (currentNode.nodeType === Node.ELEMENT_NODE) {
                      const element = currentNode as HTMLElement;
                      if (element.tagName === 'PRE') {
                        return element as HTMLPreElement;
                      }
                    }
                    currentNode = currentNode.parentNode;
                  }
                  return null;
                };

                // Helper function to check if cursor is at the end of the code block
                const isCursorAtEndOfCodeBlock = (preElement: HTMLPreElement): boolean => {
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return false;
                  
                  const range = selection.getRangeAt(0);
                  const codeElement = preElement.querySelector('code');
                  if (!codeElement) return false;
                  
                  // Get the text content and cursor position
                  const textContent = codeElement.textContent || '';
                  const preCaretRange = range.cloneRange();
                  preCaretRange.selectNodeContents(codeElement);
                  preCaretRange.setEnd(range.endContainer, range.endOffset);
                  const caretPosition = preCaretRange.toString().length;
                  
                  // Check if cursor is at the very end
                  return caretPosition >= textContent.length;
                };

                // Helper function to insert a paragraph after the code block and focus it
                const exitCodeBlock = (preElement: HTMLPreElement) => {
                  e.preventDefault();
                  
                  // Create a new paragraph
                  const newParagraph = document.createElement('p');
                  newParagraph.innerHTML = '<br>'; // Add a br to make it visible and focusable
                  
                  // Insert the paragraph after the code block
                  if (preElement.parentNode) {
                    preElement.parentNode.insertBefore(newParagraph, preElement.nextSibling);
                    
                    // Move cursor to the new paragraph
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.setStart(newParagraph, 0);
                    range.collapse(true);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                    
                    // Update content state
                    if (contentRef.current) {
                      setContent(contentRef.current.innerHTML);
                    }
                  }
                };

                // Handle Enter key for code blocks FIRST (before Shift+Enter)
                if (e.key === 'Enter') {
                  const codeBlock = isInCodeBlock();
                  if (codeBlock) {
                    // ALWAYS prevent default to stop block splitting
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (e.shiftKey) {
                      // Shift+Enter: Break out of code block
                      exitCodeBlock(codeBlock);
                      return;
                    } else {
                      // Normal Enter: Insert newline inside the block
                      const selection = window.getSelection();
                      if (!selection || selection.rangeCount === 0) return;
                      
                      const range = selection.getRangeAt(0);
                      
                      // Find the <code> element inside the <pre>
                      const codeElement = codeBlock.querySelector('code');
                      if (!codeElement) return;
                      
                      // Delete any selected content first
                      range.deleteContents();
                      
                      // Create a newline text node
                      const newline = document.createTextNode('\n');
                      range.insertNode(newline);
                      
                      // Move cursor after the newline
                      range.setStartAfter(newline);
                      range.setEndAfter(newline);
                      range.collapse(false);
                      
                      selection.removeAllRanges();
                      selection.addRange(range);
                      
                      // Force focus back to the code element
                      codeElement.focus();
                      
                      // Update content state
                      if (contentRef.current) {
                        setContent(contentRef.current.innerHTML);
                      }
                      
                      // Trigger a manual input event to update the state
                      const inputEvent = new Event('input', { bubbles: true });
                      contentRef.current?.dispatchEvent(inputEvent);
                      
                      return;
                    }
                  }
                }

                // Handle Arrow Down to exit code block when at the end
                if (e.key === 'ArrowDown') {
                  const codeBlock = isInCodeBlock();
                  if (codeBlock && isCursorAtEndOfCodeBlock(codeBlock)) {
                    // Check if there's a next sibling
                    const nextSibling = codeBlock.nextSibling;
                    if (!nextSibling) {
                      // No next sibling, create a new paragraph
                      exitCodeBlock(codeBlock);
                    } else {
                      // There's a next sibling, let the default behavior handle it
                      // But we need to ensure the cursor moves to it
                      e.preventDefault();
                      const range = document.createRange();
                      const sel = window.getSelection();
                      
                      // Try to set cursor at the start of the next sibling
                      if (nextSibling.nodeType === Node.TEXT_NODE) {
                        range.setStart(nextSibling, 0);
                      } else if (nextSibling.nodeType === Node.ELEMENT_NODE) {
                        range.setStart(nextSibling, 0);
                      }
                      range.collapse(true);
                      sel?.removeAllRanges();
                      sel?.addRange(range);
                    }
                    return;
                  }
                }
                
                // Handle Enter key for lists - allow empty list items
                if (e.key === 'Enter') {
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return;
                  
                  let node = selection.anchorNode;
                  if (!node) return;
                  
                  // Find the parent list item
                  let listItem: HTMLElement | null = null;
                  let currentNode: Node | null = node;
                  
                  while (currentNode && currentNode !== contentRef.current) {
                    if (currentNode.nodeType === Node.ELEMENT_NODE) {
                      const element = currentNode as HTMLElement;
                      if (element.tagName === 'LI') {
                        listItem = element;
                        break;
                      }
                    }
                    currentNode = currentNode.parentNode;
                  }
                  
                  // If we're inside a list item
                  if (listItem) {
                    // Check if the list item is empty or only contains whitespace/br
                    const textContent = listItem.textContent?.trim() || '';
                    const hasOnlyBr = listItem.innerHTML.trim() === '<br>' || listItem.innerHTML.trim() === '';
                    
                    if (textContent === '' || hasOnlyBr) {
                      // Prevent default behavior (which would exit the list)
                      e.preventDefault();
                      
                      // Create a new empty list item
                      const newListItem = document.createElement('li');
                      newListItem.innerHTML = '<br>'; // Add a br to make it visible
                      
                      // Insert the new list item after the current one
                      if (listItem.parentNode) {
                        listItem.parentNode.insertBefore(newListItem, listItem.nextSibling);
                        
                        // Move cursor to the new list item
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.setStart(newListItem, 0);
                        range.collapse(true);
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                        
                        // Update content state
                        if (contentRef.current) {
                          setContent(contentRef.current.innerHTML);
                        }
                      }
                    }
                  }
                }
              }}
              onMouseUp={saveCursorPosition}
              onKeyUp={saveCursorPosition}
              suppressContentEditableWarning
            />
          </div>
        </div>

        {/* Saved Toast */}
        <Toast isVisible={showSaved} message={t('saved')} type="success" />
      </div>

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
              onClick={handleDelete}
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

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportLum={handleExportAsLum}
        onExportPdf={handleExportAsPdf}
        noteTitle={title}
      />
    </>
  );
};

