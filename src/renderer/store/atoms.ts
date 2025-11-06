/**
 * Store de Jotai con atomos para gestión de estado
 * Incluye persistencia automática con electron-store
 */

import { atom } from 'jotai';
import type { App } from '../../shared/types';
import type { Note } from '../components/NotesList';
import type { Todo } from '../../ai/todoManager';
import type { Flashcard as EducationalFlashcard } from '../../ai/educational';
import type { CodeSnippet as CodeSnippetType } from '../../ai/codeSnippets';

// ============================================
// TIPOS
// ============================================

export interface PomodoroConfig {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  pomodorosUntilLongBreak: number;
}

export interface PomodoroState {
  state: 'idle' | 'working' | 'shortBreak' | 'longBreak';
  timeRemaining: number;
  currentPomodoro: number;
  totalPomodoros: number;
  phase: 'work' | 'break';
  startTime?: number;
  pausedAt?: number;
}

// Re-exportar el tipo de Flashcard desde educational para mantener consistencia
export type Flashcard = EducationalFlashcard;

export interface Quiz {
  id: string;
  name: string;
  questions: Array<{
    question: string;
    options: string[];
    correct: number;
  }>;
  category?: string;
}

// Re-exportar el tipo de CodeSnippet desde codeSnippets para mantener consistencia
export type Snippet = CodeSnippetType;

export interface AppConfig {
  favorites: string[];
  history: Array<{
    id: string;
    timestamp: number;
    appName: string;
  }>;
}

// ============================================
// ATOMOS BÁSICOS
// ============================================

// Apps
export const appsAtom = atom<App[]>([]);
export const appsLoadingAtom = atom<boolean>(false);

// Configuración de la app
export const favoritesAtom = atom<string[]>([]);
export const launchHistoryAtom = atom<Array<{ id: string; timestamp: number; appName: string }>>([]);

// Pomodoro
export const pomodoroConfigAtom = atom<PomodoroConfig>({
  workDuration: 25 * 60, // 25 minutos en segundos
  shortBreakDuration: 5 * 60, // 5 minutos
  longBreakDuration: 15 * 60, // 15 minutos
  pomodorosUntilLongBreak: 4
});

export const pomodoroStateAtom = atom<PomodoroState>({
  state: 'idle',
  timeRemaining: 0,
  currentPomodoro: 0,
  totalPomodoros: 0,
  phase: 'work'
});

// Flashcards
export const flashcardsAtom = atom<Flashcard[]>([]);

// Notes
export const notesAtom = atom<Note[]>([]);

// Todos
export const todosAtom = atom<Todo[]>([]);

// Snippets
export const snippetsAtom = atom<Snippet[]>([]);

// Quizzes
export const quizzesAtom = atom<Quiz[]>([]);

// ============================================
// ATOMOS DERIVADOS
// ============================================

// Atom para obtener favoritos filtrados
export const favoriteAppsAtom = atom((get) => {
  const apps = get(appsAtom);
  const favorites = get(favoritesAtom);
  return apps.filter(app => favorites.includes(app.id));
});

// Atom para obtener historial reciente
export const recentAppsAtom = atom((get) => {
  const apps = get(appsAtom);
  const history = get(launchHistoryAtom);
  const recentIds = history.slice(0, 10).map(h => h.id);
  return apps.filter(app => recentIds.includes(app.id));
});
