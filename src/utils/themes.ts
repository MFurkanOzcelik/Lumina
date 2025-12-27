import type { Theme } from '../types';

export const themes = {
  light: {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#e2e8f0',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    warningBg: '#fef3c7',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    border: '#334155',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    warningBg: '#451a03',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  ocean: {
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#0c4a6e',
    text: '#e0f2fe',
    textSecondary: '#7dd3fc',
    border: '#0e7490',
    accent: '#06b6d4',
    accentHover: '#0891b2',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    warningBg: '#0c4a6e',
    shadow: 'rgba(6, 182, 212, 0.2)',
  },
  sakura: {
    bg: '#fdf2f8',
    bgSecondary: '#fce7f3',
    bgTertiary: '#fbcfe8',
    text: '#831843',
    textSecondary: '#9f1239',
    border: '#f9a8d4',
    accent: '#db2777',
    accentHover: '#be185d',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    warningBg: '#fef3c7',
    shadow: 'rgba(219, 39, 119, 0.15)',
  },
};

const kanbanThemes: Record<Theme, { bg: string; column: string; card: string; text: string; border: string }> = {
  light: {
    bg: '#f3f4f6',
    column: '#e5e7eb',
    card: '#ffffff',
    text: '#111827',
    border: '#d1d5db',
  },
  dark: {
    bg: '#1e1e1e',
    column: '#2d2d2d',
    card: '#3e3e3e',
    text: '#ffffff',
    border: '#444444',
  },
  ocean: {
    bg: '#0b1726',
    column: '#0f2539',
    card: '#103049',
    text: '#e0f2fe',
    border: '#0e7490',
  },
  sakura: {
    bg: '#fce7f3',
    column: '#fbcfe8',
    card: '#fff7fb',
    text: '#831843',
    border: '#f9a8d4',
  },
};

export const applyTheme = (theme: Theme) => {
  const colors = themes[theme];
  const root = document.documentElement;
  
  // Light tema için Kanban değişkenlerini CSS üzerinden override edebilmek adına sınıfı ekle/çıkar
  root.classList.toggle('light-mode', theme === 'light');

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  const kanban = kanbanThemes[theme];
  if (kanban) {
    root.style.setProperty('--kanban-bg', kanban.bg);
    root.style.setProperty('--column-bg', kanban.column);
    root.style.setProperty('--card-bg', kanban.card);
    root.style.setProperty('--text-primary', kanban.text);
    root.style.setProperty('--border-color', kanban.border);
  }
};

