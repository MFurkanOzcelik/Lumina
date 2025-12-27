import { useState, useRef, useEffect, useReducer } from 'react';
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
  Lock,
  Unlock,
  Mic,
  Square,
} from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from '../utils/translations';
import { Modal } from './Modal';
import { Toast } from './Toast';
import { TagInput } from './TagInput';
import { ExportModal } from './ExportModal';
import { EncryptedNoteOverlay } from './EncryptedNoteOverlay';
import { PasswordPromptModal } from './PasswordPromptModal';
import { ToolbarButton } from './ToolbarButton';
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

export const Editor = ({ noteIdOverride }: { noteIdOverride?: string | null } = {}) => {
  const { 
    activeNoteId, 
    notes, 
    updateNote, 
    deleteNote, 
    setActiveNote,
    encryptNote,
    decryptNote,
    lockNote,
    getDecryptedContent,
  } = useNotesStore();
  const { language, security } = useSettingsStore();
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const t = useTranslation(language);

  // Use noteIdOverride if provided, otherwise use activeNoteId (for split view support)
  const effectiveNoteId = noteIdOverride ?? activeNoteId;
  const activeNote = notes.find((note) => note.id === effectiveNoteId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(() => {
    const saved = localStorage.getItem('editor-font-size');
    return saved ? parseInt(saved, 10) : 16;
  });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0); // Toolbar senkronu için render tetikleyici
  const [isEditorFocused, setIsEditorFocused] = useState(false); // Track if editor has focus
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const isRestoringCursor = useRef(false);
  
  // Ses özellikleri için state'ler ve ref'ler
  const [isDictating, setIsDictating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Encryption state
  const isNoteEncrypted = activeNote?.isEncrypted || false;
  const isNoteUnlocked = activeNote ? getDecryptedContent(activeNote.id) !== null : false;

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
    if (effectiveNoteId && !isRestoringCursor.current) {
      const position = getCursorPosition();
      updateNote(effectiveNoteId, { cursorPosition: position });
    }
  };

  // Only update innerHTML when switching notes, not on every content change
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      
      // Handle encrypted vs plain text content
      if (activeNote.isEncrypted) {
        const decryptedContent = getDecryptedContent(activeNote.id);
        if (decryptedContent) {
          // Note is encrypted but unlocked - show decrypted content
          setContent(decryptedContent);
          if (contentRef.current && contentRef.current.innerHTML !== decryptedContent) {
            contentRef.current.innerHTML = decryptedContent;
          }
        } else {
          // Note is encrypted and locked - clear content
          setContent('');
          if (contentRef.current) {
            contentRef.current.innerHTML = '';
          }
        }
      } else {
        // Note is not encrypted - show plain content
        setContent(activeNote.content);
        if (contentRef.current && contentRef.current.innerHTML !== activeNote.content) {
          contentRef.current.innerHTML = activeNote.content;
        }
      }
      
      setTags(activeNote.tags || []); // Load tags from active note
      
      // Smart focus logic (only if note is not encrypted or is unlocked)
      if (!activeNote.isEncrypted || getDecryptedContent(activeNote.id)) {
        setTimeout(() => {
          const hasContent = (activeNote.content || getDecryptedContent(activeNote.id) || '').trim().length > 0;
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
    }
  }, [effectiveNoteId, isNoteUnlocked]); // Only trigger on note ID change

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Ses kaydı menülerini dışarıdan tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menus = document.querySelectorAll('.audio-menu');
      menus.forEach((menu) => {
        const button = (menu as HTMLElement).previousElementSibling;
        if (button && !button.contains(e.target as Node) && !menu.contains(e.target as Node)) {
          (menu as HTMLElement).style.display = 'none';
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (effectiveNoteId) {
      updateNote(effectiveNoteId, { title, content, tags });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleDelete = () => {
    if (effectiveNoteId) {
      deleteNote(effectiveNoteId);
      setShowDeleteConfirm(false);
      // Only clear active note if deleting the main active note
      if (effectiveNoteId === activeNoteId) {
        setActiveNote(null);
      }
    }
  };

  // Encryption handlers
  const handleLockNote = () => {
    console.log('[EDITOR] Lock Note clicked');
    console.log('[EDITOR] Effective Note ID:', effectiveNoteId);
    console.log('[EDITOR] Security Enabled:', security.isEnabled);
    console.log('[EDITOR] Master Password Hash exists:', !!security.masterPasswordHash);
    
    if (!effectiveNoteId || !security.isEnabled || !security.masterPasswordHash) {
      console.log('[EDITOR] Cannot lock - missing requirements');
      setToast({ message: t('setMasterPassword'), type: 'error' });
      return;
    }

    // CRITICAL FIX: Save current content to note before encrypting
    console.log('[EDITOR] Saving current content before encryption...');
    console.log('[EDITOR] Current content length:', content.length);
    console.log('[EDITOR] Current title:', title);
    
    // Update the note with current editor content first
    updateNote(effectiveNoteId, { title, content, tags });
    
    // Show password prompt modal
    console.log('[EDITOR] Opening password prompt modal');
    setShowPasswordPrompt(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    console.log('[EDITOR] Password confirmed from modal');
    console.log('[EDITOR] Password length:', password.length);
    
    // Close the modal
    setShowPasswordPrompt(false);
    
    if (!effectiveNoteId) {
      console.log('[EDITOR] No note ID to encrypt');
      return;
    }

    console.log('[EDITOR] Verifying password...');
    // Verify the password against the stored hash
    const { verifyPassword } = await import('../utils/encryption');
    const isValid = await verifyPassword(password, security.masterPasswordHash!);
    
    if (!isValid) {
      console.log('[EDITOR] Password verification failed');
      setToast({ message: t('passwordIncorrect'), type: 'error' });
      return;
    }

    console.log('[EDITOR] Password verified, encrypting note...');
    // Encrypt the note
    const success = await encryptNote(effectiveNoteId, password);
    console.log('[EDITOR] Encryption result:', success);
    
    if (success) {
      setToast({ message: t('noteEncrypted'), type: 'success' });
      // Clear the editor content display
      setContent('');
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }
    } else {
      setToast({ message: t('encryptionError'), type: 'error' });
    }
  };

  const handlePasswordCancel = () => {
    console.log('[EDITOR] Password prompt cancelled');
    setShowPasswordPrompt(false);
  };

  const handleUnlockNote = async (password: string): Promise<boolean> => {
    if (!effectiveNoteId) return false;

    const success = await decryptNote(effectiveNoteId, password);
    if (success) {
      setToast({ message: t('noteDecrypted'), type: 'success' });
      // Refresh the content display
      const decryptedContent = getDecryptedContent(effectiveNoteId);
      if (decryptedContent) {
        setContent(decryptedContent);
        if (contentRef.current) {
          contentRef.current.innerHTML = decryptedContent;
        }
      }
      return true;
    } else {
      return false;
    }
  };

  const handleLockNoteManually = () => {
    if (!effectiveNoteId) return;
    lockNote(effectiveNoteId);
    setContent('');
    if (contentRef.current) {
      contentRef.current.innerHTML = '';
    }
  };

  // Tag management functions
  const handleAddTag = (tag: string) => {
    if (!effectiveNoteId) return;
    
    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    updateNote(effectiveNoteId, { tags: updatedTags });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!effectiveNoteId) return;
    
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    updateNote(effectiveNoteId, { tags: updatedTags });
  };

  // Türkçe noktalama işaretlerini değiştir ve ilk harfi büyük yap
  const processDictationText = (text: string): string => {
    let processed = text;

    // Noktalama işaretlerini değiştir (büyük/küçük harf duyarsız)
    processed = processed.replace(/\s+nokta\.?/gi, '.');
    processed = processed.replace(/\s+virgül/gi, ',');
    processed = processed.replace(/\s+soru\s+işareti/gi, '?');
    processed = processed.replace(/\s+ünlem/gi, '!');
    processed = processed.replace(/\s+(yeni|alt)\s+satır/gi, '\n');
    processed = processed.replace(/\s+iki\s+nokta/gi, ':');
    processed = processed.replace(/\s+noktalı\s+virgül/gi, ';');

    // Noktalama işaretinden sonra ilk harfi büyük yap
    processed = processed.replace(/([.?!])\s+([a-zçğıöşü])/g, (_match, punct, letter) => {
      return `${punct} ${letter.toUpperCase()}`;
    });

    // Cümle başını büyük harfle başlat
    if (processed.length > 0) {
      processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    }

    return processed;
  };

  // Dikte başlat/durdur
  const toggleDictation = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setToast({ message: 'Tarayıcınız ses tanımayı desteklemiyor', type: 'error' });
      return;
    }

    if (isDictating) {
      // Durdur
      console.log('[Dikte] Durduruluyor...');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
    } else {
      // Başlat
      console.log('[Dikte] Başlatılıyor...');
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'tr-TR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        console.log('[Dikte] Başladı');
        setIsDictating(true);
        setToast({ message: 'Dikte başladı - konuşmaya başlayın', type: 'success' });
      };

      recognition.onresult = (event: any) => {
        console.log('[Dikte] Sonuç alındı, resultIndex:', event.resultIndex);
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log('[Dikte] Transcript:', transcript, 'isFinal:', event.results[i].isFinal);
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Final transcript varsa noktalama dönüşümü yap ve ekle
        if (finalTranscript) {
          console.log('[Dikte] Final transcript:', finalTranscript);
          const processedText = processDictationText(finalTranscript);
          console.log('[Dikte] Processed text:', processedText);
          
          // ContentEditable'a ekle
          if (contentRef.current) {
            // Editöre focus ver
            contentRef.current.focus();

            const selection = window.getSelection();
            if (selection) {
              let range: Range;
              
              if (selection.rangeCount > 0) {
                range = selection.getRangeAt(0);
              } else {
                // Eğer selection yoksa, content'in sonuna range oluştur
                range = document.createRange();
                range.selectNodeContents(contentRef.current);
                range.collapse(false); // Sona git
                selection.addRange(range);
              }

              range.deleteContents();
              
              const textNode = document.createTextNode(processedText);
              range.insertNode(textNode);
              
              // İmleci metnin sonuna taşı
              range.setStartAfter(textNode);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);

              // İçeriği güncelle
              const newContent = contentRef.current.innerHTML;
              setContent(newContent);
              if (effectiveNoteId) {
                updateNote(effectiveNoteId, { content: newContent });
              }
              
              console.log('[Dikte] Metin eklendi');
            } else {
              console.error('[Dikte] Selection alınamadı');
            }
          } else {
            console.error('[Dikte] contentRef bulunamadı');
          }
        }

        // Interim sonuçları da göster (opsiyonel - şu an sadece log)
        if (interimTranscript) {
          console.log('[Dikte] Interim:', interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[Dikte] Hata:', event.error);
        setToast({ message: `Dikte hatası: ${event.error}`, type: 'error' });
        setIsDictating(false);
      };

      recognition.onend = () => {
        console.log('[Dikte] Sona erdi');
        setIsDictating(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  // Ses kaydetme başlat/durdur
  const toggleRecording = async () => {
    if (isRecording) {
      // Kaydı durdur
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } else {
      // Kayıt başlat
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioId = `audio-${Date.now()}`;
          const defaultName = `Ses Kaydı ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

          // Blob'u base64'e çevir (kalıcılık için)
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;

            // Audio konteyner HTML'i - ayırıcı, başlık, 3 nokta menü ve audio player
            const audioHTML = `
              <div class="audio-container" data-audio-id="${audioId}" style="
                border-top: 2px solid var(--color-border);
                padding: 1rem 0;
                margin: 1rem 0;
                overflow: visible;
              ">
                <div style="
                  display: flex; 
                  align-items: center; 
                  justify-content: space-between; 
                  margin-bottom: 0.5rem;
                  background: var(--color-surface);
                  padding: 0.5rem;
                  border-radius: 6px;
                ">
                  <span 
                    class="audio-title" 
                    contenteditable="false"
                    style="
                      flex: 1;
                      color: var(--color-text);
                      font-weight: 600;
                      font-size: 0.9rem;
                      padding: 0.25rem 0.5rem;
                      user-select: none;
                    "
                  >${defaultName}</span>
                  <div style="position: relative; display: inline-block; z-index: 100;">
                    <button 
                      class="audio-menu-btn"
                      onclick="
                        event.preventDefault();
                        event.stopPropagation();
                        const menu = this.nextElementSibling;
                        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                      "
                      style="
                        background: transparent;
                        color: var(--color-text);
                        border: none;
                        cursor: pointer;
                        font-size: 1.2rem;
                        padding: 0.25rem 0.5rem;
                        line-height: 1;
                        transition: all 0.2s;
                      "
                      onmouseover="this.style.background='var(--color-hover)';"
                      onmouseout="this.style.background='transparent';"
                    >⋮</button>
                    <div 
                      class="audio-menu" 
                      style="
                        display: none;
                        position: absolute;
                        right: 0;
                        top: 100%;
                        background: var(--color-surface);
                        border: 1px solid var(--color-border);
                        border-radius: 6px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        min-width: 150px;
                        z-index: 10000;
                        margin-top: 4px;
                        pointer-events: auto;
                      "
                    >
                      <button
                        onclick="
                          event.preventDefault();
                          event.stopPropagation();
                          const container = this.closest('.audio-container');
                          const titleSpan = container.querySelector('.audio-title');
                          const newName = prompt('Yeni isim:', titleSpan.textContent);
                          if (newName && newName.trim()) {
                            titleSpan.textContent = newName.trim();
                            // İçeriği güncelle
                            const editor = document.querySelector('[contenteditable=true]');
                            if (editor) {
                              const event = new Event('input', { bubbles: true });
                              editor.dispatchEvent(event);
                            }
                          }
                          this.closest('.audio-menu').style.display = 'none';
                        "
                        style="
                          width: 100%;
                          text-align: left;
                          padding: 0.6rem 1rem;
                          background: transparent;
                          color: var(--color-text);
                          border: none;
                          cursor: pointer;
                          font-size: 0.85rem;
                          transition: all 0.2s;
                        "
                        onmouseover="this.style.background='var(--color-hover)';"
                        onmouseout="this.style.background='transparent';"
                      >Yeniden Adlandır</button>
                      <button
                        onclick="
                          event.preventDefault();
                          event.stopPropagation();
                          const container = this.closest('.audio-container');
                          if (confirm('Ses kaydını silmek istediğinizden emin misiniz?')) {
                            container.remove();
                            // İçeriği güncelle
                            const editor = document.querySelector('[contenteditable=true]');
                            if (editor) {
                              const event = new Event('input', { bubbles: true });
                              editor.dispatchEvent(event);
                            }
                          }
                        "
                        style="
                          width: 100%;
                          text-align: left;
                          padding: 0.6rem 1rem;
                          background: transparent;
                          color: var(--color-danger);
                          border: none;
                          cursor: pointer;
                          font-size: 0.85rem;
                          transition: all 0.2s;
                          border-top: 1px solid var(--color-border);
                        "
                        onmouseover="this.style.background='var(--color-hover)';"
                        onmouseout="this.style.background='transparent';"
                      >Sil</button>
                    </div>
                  </div>
                </div>
                <audio 
                  controls 
                  src="${base64Audio}" 
                  style="
                    width: 100%;
                    max-width: 100%;
                    margin: 0;
                    border-radius: 8px;
                  "
                ></audio>
              </div>
            `;
            
            if (contentRef.current) {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = audioHTML.trim();
                const audioContainer = tempDiv.firstChild;

                if (audioContainer) {
                  // Audio bloğunu ekle
                  range.insertNode(audioContainer);

                  // Alt satır için boş paragraf ekle ve caret'i oraya taşı
                  const paragraph = document.createElement('p');
                  paragraph.appendChild(document.createElement('br'));

                  const parent = audioContainer.parentNode;
                  if (parent) {
                    parent.insertBefore(paragraph, audioContainer.nextSibling);
                  }

                  const caretRange = document.createRange();
                  caretRange.setStart(paragraph, paragraph.childNodes.length);
                  caretRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(caretRange);

                  const newContent = contentRef.current.innerHTML;
                  setContent(newContent);
                  if (effectiveNoteId) {
                    updateNote(effectiveNoteId, { content: newContent });
                  }
                }
              }
            }
          };

          reader.readAsDataURL(audioBlob);

          // Stream'i durdur ve durumu güncelle
          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);
          setToast({ message: 'Ses kaydı eklendi', type: 'success' });
        };

        mediaRecorder.start();
        setIsRecording(true);
        setToast({ message: 'Ses kaydediliyor...', type: 'success' });
      } catch (error) {
        console.error('Mikrofon erişim hatası:', error);
        setToast({ message: 'Mikrofon erişimi reddedildi', type: 'error' });
      }
    }
  };

  // Bileşen unmount olduğunda ses işlemlerini temizle
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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

  // Gerçek zamanlı format kontrolü - DOM'u direkt sorgula
  const checkFormatActive = (formatType: 'bold' | 'italic' | 'underline' | 'strikethrough'): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    if (!node) return false;

    // Text node ise parent'ını al
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    // Parent chain'de formatın olup olmadığını kontrol et
    let currentNode: Node | null = node;
    while (currentNode && currentNode !== contentRef.current) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const style = window.getComputedStyle(element);

        switch (formatType) {
          case 'bold':
            if (tagName === 'strong' || tagName === 'b' || parseInt(style.fontWeight) >= 700) {
              return true;
            }
            break;
          case 'italic':
            if (tagName === 'em' || tagName === 'i' || style.fontStyle === 'italic') {
              return true;
            }
            break;
          case 'underline':
            if (tagName === 'u' || style.textDecoration.includes('underline')) {
              return true;
            }
            break;
          case 'strikethrough':
            if (tagName === 's' || tagName === 'strike' || tagName === 'del' || 
                style.textDecoration.includes('line-through')) {
              return true;
            }
            break;
        }
      }
      currentNode = currentNode.parentNode;
    }

    return false;
  };

  // Format butonlarına tıklama - sadece komutu çalıştır, state otomatik güncellenecek
  const handleFormatClick = (command: string) => {
    document.execCommand(command, false);
    contentRef.current?.focus();
    
    // İçeriği güncelle
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
      if (activeNoteId) {
        updateNote(activeNoteId, { content: contentRef.current.innerHTML });
      }
    }
    
    // Format state'ini hemen güncelle
    updateFormatState();
  };

  // Liste kontrolü
  const checkListActive = (listType: 'ul' | 'ol'): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    if (!node) return false;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    let currentNode: Node | null = node;
    while (currentNode && currentNode !== contentRef.current) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = (currentNode as Element).tagName.toLowerCase();
        if (tagName === listType) {
          return true;
        }
      }
      currentNode = currentNode.parentNode;
    }

    return false;
  };

  // Liste butonu tıklama
  const handleListClick = (listType: 'ul' | 'ol') => {
    const command = listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(command, false);
    contentRef.current?.focus();
    
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
      if (activeNoteId) {
        updateNote(activeNoteId, { content: contentRef.current.innerHTML });
      }
    }
    
    updateFormatState();
  };

  // Heading kontrolü
  const checkHeadingActive = (headingLevel: 'h1' | 'h2' | 'h3'): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    if (!node) return false;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    let currentNode: Node | null = node;
    while (currentNode && currentNode !== contentRef.current) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        if (element.tagName.toLowerCase() === headingLevel) {
          return true;
        }
      }
      currentNode = currentNode.parentNode;
    }

    return false;
  };

  // Heading butonu tıklama
  const handleHeadingClick = (headingLevel: 'h1' | 'h2' | 'h3') => {
    const isActive = checkHeadingActive(headingLevel);
    
    if (isActive) {
      // Aktifse, normal paragrafa dönüştür
      document.execCommand('formatBlock', false, '<p>');
    } else {
      // Aktif değilse, heading'e dönüştür
      document.execCommand('formatBlock', false, `<${headingLevel}>`);
    }
    
    contentRef.current?.focus();
    
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
      if (activeNoteId) {
        updateNote(activeNoteId, { content: contentRef.current.innerHTML });
      }
    }
    
    updateFormatState();
  };

  // Format state'ini güncelle - tüm event'lerde çalışacak
  const updateFormatState = () => {
    // React render'ını zorla tetikle
    forceUpdate();
  };

  // Event listener'ları ekle - HER değişiklikte format state'ini güncelle
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    // Tüm kritik event'leri dinle (klavye kısayolları ve seçim değişimi dahil)
    const events = [
      'keydown',
      'keyup',
      'mouseup',
      'click',
      'focus',
      'select',
      'input',
    ];

    events.forEach(event => {
      contentElement.addEventListener(event, updateFormatState);
    });

    // Global seçim değişimini yakala (metin seçimi değiştiğinde)
    document.addEventListener('selectionchange', updateFormatState);

    // MutationObserver - DOM değişikliklerini yakala
    const observer = new MutationObserver(updateFormatState);
    
    observer.observe(contentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        contentElement.removeEventListener(event, updateFormatState);
      });
      document.removeEventListener('selectionchange', updateFormatState);
      observer.disconnect();
    };
  }, []);

  // Font boyutu değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('editor-font-size', currentFontSize.toString());
  }, [currentFontSize]);

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
            <ToolbarButton
              icon={Bold}
              label={t('bold')}
              isActive={checkFormatActive('bold')}
              onClick={() => handleFormatClick('bold')}
            />

            {/* Italic */}
            <ToolbarButton
              icon={Italic}
              label={t('italic')}
              isActive={checkFormatActive('italic')}
              onClick={() => handleFormatClick('italic')}
            />

            {/* Underline */}
            <ToolbarButton
              icon={Underline}
              label={t('underline')}
              isActive={checkFormatActive('underline')}
              onClick={() => handleFormatClick('underline')}
            />

            {/* Strikethrough */}
            <ToolbarButton
              icon={Strikethrough}
              label={t('strikethrough')}
              isActive={checkFormatActive('strikethrough')}
              onClick={() => handleFormatClick('strikeThrough')}
            />

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
              className={`toolbar-btn px-3 py-2 rounded-lg transition-all font-bold text-sm ${
                checkHeadingActive('h1') ? 'is-active' : ''
              }`}
              style={{
                backgroundColor: checkHeadingActive('h1')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: checkHeadingActive('h1') ? 'white' : 'var(--color-text)',
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
              className={`toolbar-btn px-3 py-2 rounded-lg transition-all font-bold text-sm ${
                checkHeadingActive('h2') ? 'is-active' : ''
              }`}
              style={{
                backgroundColor: checkHeadingActive('h2')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: checkHeadingActive('h2') ? 'white' : 'var(--color-text)',
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
              className={`toolbar-btn px-3 py-2 rounded-lg transition-all font-bold text-sm ${
                checkHeadingActive('h3') ? 'is-active' : ''
              }`}
              style={{
                backgroundColor: checkHeadingActive('h3')
                  ? 'var(--color-accent)'
                  : 'var(--color-bgTertiary)',
                color: checkHeadingActive('h3') ? 'white' : 'var(--color-text)',
              }}
              title="Heading 3"
            >
              H3
            </motion.button>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Bullet List */}
            <ToolbarButton
              icon={List}
              label={t('bulletList')}
              isActive={checkListActive('ul')}
              onClick={() => handleListClick('ul')}
            />

            {/* Numbered List */}
            <ToolbarButton
              icon={ListOrdered}
              label={t('numberedList')}
              isActive={checkListActive('ol')}
              onClick={() => handleListClick('ol')}
            />

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

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Dikte Butonu */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDictation}
              className="p-2 rounded-lg transition-all relative"
              style={{
                backgroundColor: isDictating ? '#ef4444' : 'var(--color-bgTertiary)',
                color: isDictating ? 'white' : 'var(--color-text)',
              }}
              title={isDictating ? 'Dikteyi Durdur' : 'Dikte Başlat'}
            >
              <Mic size={18} />
              {isDictating && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(239, 68, 68, 0.7)',
                      '0 0 0 10px rgba(239, 68, 68, 0)',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.button>

            {/* Ses Kaydetme Butonu */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className="p-2 rounded-lg transition-all relative"
              style={{
                backgroundColor: isRecording ? '#ef4444' : 'var(--color-bgTertiary)',
                color: isRecording ? 'white' : 'var(--color-text)',
              }}
              title={isRecording ? 'Kaydı Durdur' : 'Ses Kaydet'}
            >
              <Square size={18} fill={isRecording ? 'white' : 'none'} />
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(239, 68, 68, 0.7)',
                      '0 0 0 10px rgba(239, 68, 68, 0)',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.button>
          </div>

          {/* Actions - aligned to the right */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Export Button */}
            {/* Lock/Unlock Button - Only show if security is enabled */}
            {security.isEnabled && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  if (isNoteEncrypted && isNoteUnlocked) {
                    handleLockNoteManually();
                  } else if (!isNoteEncrypted) {
                    handleLockNote();
                  }
                }}
                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                style={{
                  backgroundColor: isNoteEncrypted ? '#f59e0b' : 'var(--color-accent)',
                  color: 'white',
                }}
                title={isNoteEncrypted && isNoteUnlocked ? t('lockNote') : t('lockNote')}
              >
                {isNoteEncrypted && isNoteUnlocked ? (
                  <>
                    <Lock size={18} />
                    {t('lockNote')}
                  </>
                ) : isNoteEncrypted ? (
                  <>
                    <Lock size={18} />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock size={18} />
                    {t('lockNote')}
                  </>
                )}
              </motion.button>
            )}

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
        <div className="flex-1 overflow-y-auto h-full relative">
          {/* Encrypted Note Overlay */}
          {isNoteEncrypted && !isNoteUnlocked && (
            <EncryptedNoteOverlay
              onUnlock={handleUnlockNote}
              passwordHint={security.passwordHint}
            />
          )}

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
                  } else {
                    // Normal text (not in list or code block) - Clear inline formatting after Enter
                    // Kullanıcı Enter bastığında, seçili araçların formatını kaldırması için
                    // Scheduling to next tick ensures the newline is created first
                    setTimeout(() => {
                      const inlineFormats = ['bold', 'italic', 'underline', 'strikethrough'];
                      inlineFormats.forEach(format => {
                        const commandMap: Record<string, string> = {
                          'bold': 'bold',
                          'italic': 'italic',
                          'underline': 'underline',
                          'strikethrough': 'strikeThrough'
                        };
                        const cmd = commandMap[format];

                        // Sadece aktifse kapat
                        if (document.queryCommandState(cmd)) {
                          document.execCommand(cmd, false);
                        }
                      });
                    }, 0);
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

      {/* Password Prompt Modal for Encryption */}
      <PasswordPromptModal
        isOpen={showPasswordPrompt}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        title={t('enterPassword')}
        message={t('lockNote')}
        showHint={true}
      />

      {/* Encryption Toast Notifications */}
      <Toast
        isVisible={toast !== null}
        message={toast?.message || ''}
        type={toast?.type || 'success'}
      />
    </>
  );
};

