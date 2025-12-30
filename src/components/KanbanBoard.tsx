import { useEffect, useState, useRef } from 'react';
import { Edit2, Trash2, GripVertical, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../utils/translations';
import { useSettingsStore } from '../store/useSettingsStore';

interface Card {
  id: string;
  text: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Card[];
}

const STORAGE_KEY = 'kanban-columns-v2';

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const KanbanBoard = () => {
  const language = useSettingsStore((state) => state.language);
  const t = useTranslation(language);
  
  const DEFAULT_COLUMNS: Column[] = [
    { id: 'todo', title: t('todoColumn'), tasks: [] },
    { id: 'inProgress', title: t('inProgressColumn'), tasks: [] },
    { id: 'done', title: t('doneColumn'), tasks: [] },
  ];
  
  const [columns, setColumns] = useState<Column[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : DEFAULT_COLUMNS;
      }
    } catch {
      /* yut */
    }
    return DEFAULT_COLUMNS;
  });

  const [newTask, setNewTask] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState('');
  // Kart bazında vurguyu kaldırdığımız için state'e gerek yok
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null); // Sürüklenen kart hangi sütunda

  // Auto-scroll için ref'ler
  const boardRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);

  const SCROLL_THRESHOLD = 100; // Edge'ten itibaren piksel
  const SCROLL_SPEED = 10; // Her interval'de kaydırılacak piksel

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  // Auto-scroll interval
  useEffect(() => {
    if (scrollDirection && boardRef.current) {
      // Eğer zaten interval varsa temizle
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }

      scrollIntervalRef.current = setInterval(() => {
        if (boardRef.current) {
          if (scrollDirection === 'left') {
            boardRef.current.scrollLeft -= SCROLL_SPEED;
          } else if (scrollDirection === 'right') {
            boardRef.current.scrollLeft += SCROLL_SPEED;
          }
        }
      }, 30);
    } else {
      // Scroll yok, interval'i temizle
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [scrollDirection]);

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: `col-${createId()}`,
      title: t('newColumnDefaultTitle'),
      tasks: [],
    };
    setColumns((prev) => [...prev, newColumn]);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (window.confirm(t('deleteColumnConfirm'))) {
      setColumns((prev) => prev.filter((col) => col.id !== columnId));
    }
  };

  const handleAddTask = (columnId: string) => {
    const text = newTask.trim();
    if (!text) return;

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, { id: createId(), text }] }
          : col
      )
    );
    setNewTask('');
  };

  const handleDeleteTask = (columnId: string, taskId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          : col
      )
    );
  };

  const handleColumnEditStart = (columnId: string, title: string) => {
    setEditingColumnId(columnId);
    setEditingColumnTitle(title);
  };

  const handleColumnEditSave = (columnId: string) => {
    const newTitle = editingColumnTitle.trim();
    if (newTitle) {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, title: newTitle } : col
        )
      );
    }
    setEditingColumnId(null);
    setEditingColumnTitle('');
  };

  const handleTaskEditStart = (taskId: string, taskText: string) => {
    setEditingTaskId(taskId);
    setEditingTaskValue(taskText);
  };

  const handleTaskEditSave = (columnId: string, taskId: string) => {
    const newText = editingTaskValue.trim();
    if (newText) {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? {
                ...col,
                tasks: col.tasks.map((t) =>
                  t.id === taskId ? { ...t, text: newText } : t
                ),
              }
            : col
        )
      );
    }
    setEditingTaskId(null);
    setEditingTaskValue('');
  };

  const parsePayload = (e: React.DragEvent<HTMLDivElement>) => {
    const payload = e.dataTransfer.getData('text/plain');
    if (!payload) return null;

    try {
      return JSON.parse(payload) as { columnId: string; taskId: string };
    } catch {
      return null;
    }
  };

  const moveCard = (
    sourceColumnId: string,
    targetColumnId: string,
    taskId: string,
    targetTaskId?: string
  ) => {
    setColumns((prev) => {
      const sourceColumn = prev.find((c) => c.id === sourceColumnId);
      const targetColumn = prev.find((c) => c.id === targetColumnId);

      if (!sourceColumn || !targetColumn) return prev;

      const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const task = sourceColumn.tasks[taskIndex];
      const sourceTasks = sourceColumn.tasks.filter((t) => t.id !== taskId);

      if (sourceColumnId === targetColumnId) {
        // Aynı sütun içinde yeniden sıralama
        const targetIndex = targetTaskId
          ? targetColumn.tasks.findIndex((t) => t.id === targetTaskId)
          : -1;

        const reordered = [...sourceTasks];
        reordered.splice(targetIndex >= 0 ? targetIndex : reordered.length, 0, task);

        return prev.map((col) =>
          col.id === sourceColumnId ? { ...col, tasks: reordered } : col
        );
      } else {
        // Farklı sütunlar arasında taşıma
        const targetIndex = targetTaskId
          ? targetColumn.tasks.findIndex((t) => t.id === targetTaskId)
          : -1;

        const targetTasks = [...targetColumn.tasks];
        targetTasks.splice(targetIndex >= 0 ? targetIndex : targetTasks.length, 0, task);

        return prev.map((col) => {
          if (col.id === sourceColumnId) return { ...col, tasks: sourceTasks };
          if (col.id === targetColumnId) return { ...col, tasks: targetTasks };
          return col;
        });
      }
    });
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, columnId: string, taskId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ columnId, taskId }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCardId(taskId);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Auto-scroll mantığı
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const distanceFromLeft = e.clientX - rect.left;
      const distanceFromRight = rect.right - e.clientX;

      // Sol kenardan yakınsa - sola kaydır
      if (distanceFromLeft < SCROLL_THRESHOLD) {
        setScrollDirection('left');
      }
      // Sağ kenardan yakınsa - sağa kaydır
      else if (distanceFromRight < SCROLL_THRESHOLD) {
        setScrollDirection('right');
      }
      // Ortadaysa kaydırmayı durdur
      else {
        setScrollDirection(null);
      }
    }
  };

  const onContainerDragLeave = () => {
    setScrollDirection(null);
  };

  const onCardDragEnter = (_e: React.DragEvent<HTMLDivElement>, _taskId: string) => {
    // Kart vurgusu yok - sadece sürükleme akışı için gerekli preventDefault üst seviye eventlerde var
  };

  const onCardDragLeave = (_e: React.DragEvent<HTMLDivElement>) => {
    // Kart vurgusu yok
  };

  const onCardDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetColumnId: string,
    targetTaskId?: string
  ) => {
    e.preventDefault();
    const payload = parsePayload(e);
    if (!payload) return;

    const { columnId: sourceColumnId, taskId } = payload;
    moveCard(sourceColumnId, targetColumnId, taskId, targetTaskId);

    setDraggedCardId(null);
    setDragOverColumnId(null);
    setScrollDirection(null); // Drag bittikten sonra kaydırmayı durdur
  };

  return (
    <div
      className="kanban-board-wrapper"
      style={{
        backgroundColor: 'var(--kanban-bg)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        ref={boardRef}
        className="kanban-board-container"
        onDragOver={onDragOver}
        onDragLeave={onContainerDragLeave}
      >
        {/* Sütunları oluştur */}
        {columns.map((column) => (
          <div
            key={column.id}
            className={`kanban-column ${dragOverColumnId === column.id ? 'drag-over-column' : ''}`}
            onDragOver={onDragOver}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOverColumnId(column.id); // Hedef sütunu vurgula
            }}
            onDragLeave={(e) => {
              // Yalnızca sütun dışına çıkınca vurguyu kaldır
              if (e.currentTarget === e.target) {
                setDragOverColumnId(null);
              }
            }}
            onDrop={(e) => {
              onCardDrop(e, column.id);
              setDragOverColumnId(null);
            }}
          >
            {/* Sütun Başlığı */}
            <div className="kanban-column-header">
              {editingColumnId === column.id ? (
                <input
                  type="text"
                  value={editingColumnTitle}
                  onChange={(e) => setEditingColumnTitle(e.target.value)}
                  onBlur={() => handleColumnEditSave(column.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleColumnEditSave(column.id);
                    } else if (e.key === 'Escape') {
                      setEditingColumnId(null);
                    }
                  }}
                  className="kanban-column-input"
                  autoFocus
                />
              ) : (
                <div className="kanban-column-title-row">
                  <h3 className="kanban-column-title">{column.title}</h3>
                  <button
                    type="button"
                    onClick={() => handleColumnEditStart(column.id, column.title)}
                    className="kanban-icon-btn"
                    title={t('editColumnTitle')}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteColumn(column.id)}
                    className="kanban-icon-btn kanban-delete-btn"
                    title={t('deleteColumnTitle')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              <span className="kanban-task-count">{column.tasks.length}</span>
            </div>

            {/* Yeni Görev Ekle - Sadece ilk sütunda */}
            {column.id === 'todo' && (
              <div className="kanban-add-task-form">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask(column.id)}
                  className="kanban-task-input"
                  placeholder={t('newTaskPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => handleAddTask(column.id)}
                  className="kanban-add-btn"
                >
                  {t('addTaskBtn')}
                </button>
              </div>
            )}

            {/* Görev Listesi */}
            <div className="kanban-tasks-list">
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => onDragStart(e as any, column.id, task.id)}
                  onDragEnter={(e) => onCardDragEnter(e as any, task.id)}
                  onDragLeave={(e) => onCardDragLeave(e as any)}
                  onDrop={(e) => onCardDrop(e as any, column.id, task.id)}
                  className="kanban-card"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: `1px solid var(--border-color)`,
                    color: 'var(--text-primary)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    opacity: draggedCardId === task.id ? 0.6 : 1, // Sürüklemede hafif transparan
                    transform: draggedCardId === task.id ? 'scale(0.995)' : 'none',
                  }}
                >
                  {/* Sürükleme İkonu */}
                  <div
                    className="kanban-drag-handle"
                    style={{
                      color: draggedCardId === task.id ? 'white' : 'var(--text-primary)',
                    }}
                  >
                    <GripVertical size={16} />
                  </div>

                  {/* Görev Metni */}
                  <div className="kanban-task-text-wrapper">
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editingTaskValue}
                        onChange={(e) => setEditingTaskValue(e.target.value)}
                        onBlur={() => handleTaskEditSave(column.id, task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTaskEditSave(column.id, task.id);
                          } else if (e.key === 'Escape') {
                            setEditingTaskId(null);
                          }
                        }}
                        className="kanban-task-edit-input"
                      />
                    ) : (
                      <span className="kanban-task-text">{task.text}</span>
                    )}
                  </div>

                  {/* Eylem Butonları */}
                  <div className="kanban-task-actions">
                    {editingTaskId !== task.id && (
                      <button
                        type="button"
                        onClick={() => handleTaskEditStart(task.id, task.text)}
                        className="kanban-icon-btn"
                        title={t('editTaskTitle')}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(column.id, task.id)}
                      className="kanban-icon-btn kanban-delete-btn"
                      title={t('deleteTaskTitle')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sütun Ekle Butonu */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="kanban-add-column-placeholder"
        >
          <button
            type="button"
            onClick={handleAddColumn}
            className="kanban-add-column-btn"
            title={t('addColumnBtn')}
          >
            <Plus size={32} />
            <span>{t('addColumnBtn')}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};
