/**
 * Hook para inicializar el store desde persistencia
 * Se ejecuta al montar la aplicación
 */

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import {
  favoritesAtom,
  launchHistoryAtom,
  pomodoroConfigAtom,
  pomodoroStateAtom,
  flashcardsAtom,
  notesAtom,
  todosAtom,
  snippetsAtom,
  quizzesAtom
} from './atoms';
import { loadFromStorage, STORAGE_KEYS } from './persistence';

export function useStoreInit() {
  const setFavorites = useSetAtom(favoritesAtom);
  const setLaunchHistory = useSetAtom(launchHistoryAtom);
  const setPomodoroConfig = useSetAtom(pomodoroConfigAtom);
  const setPomodoroState = useSetAtom(pomodoroStateAtom);
  const setFlashcards = useSetAtom(flashcardsAtom);
  const setNotes = useSetAtom(notesAtom);
  const setTodos = useSetAtom(todosAtom);
  const setSnippets = useSetAtom(snippetsAtom);
  const setQuizzes = useSetAtom(quizzesAtom);

  useEffect(() => {
    const initializeStore = async () => {
      console.log('📦 Inicializando store desde persistencia...');
      
      try {
        // Cargar todos los datos en paralelo
        const [
          favorites,
          history,
          pomodoroConfig,
          pomodoroState,
          flashcards,
          notes,
          todos,
          snippets,
          quizzes
        ] = await Promise.all([
          loadFromStorage(STORAGE_KEYS.favorites, []),
          loadFromStorage(STORAGE_KEYS.launchHistory, []),
          loadFromStorage(STORAGE_KEYS.pomodoroConfig, {
            workDuration: 25 * 60,
            shortBreakDuration: 5 * 60,
            longBreakDuration: 15 * 60,
            pomodorosUntilLongBreak: 4
          }),
          loadFromStorage(STORAGE_KEYS.pomodoroState, {
            state: 'idle',
            timeRemaining: 0,
            currentPomodoro: 0,
            totalPomodoros: 0,
            phase: 'work'
          }),
          loadFromStorage(STORAGE_KEYS.flashcards, []),
          loadFromStorage(STORAGE_KEYS.notes, []),
          loadFromStorage(STORAGE_KEYS.todos, []),
          loadFromStorage(STORAGE_KEYS.snippets, []),
          loadFromStorage(STORAGE_KEYS.quizzes, [])
        ]);

        // Actualizar todos los atomos
        setFavorites(favorites);
        setLaunchHistory(history);
        setPomodoroConfig(pomodoroConfig);
        setPomodoroState(pomodoroState);
        setFlashcards(flashcards);
        setNotes(notes);
        setTodos(todos);
        setSnippets(snippets);
        setQuizzes(quizzes);

        console.log('✅ Store inicializado correctamente');
      } catch (error) {
        console.error('❌ Error inicializando store:', error);
      }
    };

    initializeStore();
  }, [
    setFavorites,
    setLaunchHistory,
    setPomodoroConfig,
    setPomodoroState,
    setFlashcards,
    setNotes,
    setTodos,
    setSnippets,
    setQuizzes
  ]);
}

