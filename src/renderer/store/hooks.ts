/**
 * Hooks personalizados para usar los atomos de Jotai
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import {
  appsAtom,
  appsLoadingAtom,
  favoritesAtom,
  launchHistoryAtom,
  pomodoroConfigAtom,
  pomodoroStateAtom,
  flashcardsAtom,
  notesAtom,
  todosAtom,
  snippetsAtom,
  quizzesAtom,
  favoriteAppsAtom,
  recentAppsAtom
} from './atoms';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './persistence';
import { firebaseSync } from '../../firebase/sync';
import { firebaseAuth } from '../../firebase/auth';

// ============================================
// HOOKS PARA APPS
// ============================================

export function useApps() {
  const [apps, setApps] = useAtom(appsAtom);
  const [isLoading, setIsLoading] = useAtom(appsLoadingAtom);

  // Cargar apps al montar
  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    const storedApps = await loadFromStorage(STORAGE_KEYS.apps, []);
    if (storedApps.length > 0) {
      setApps(storedApps);
    }
  };

  const saveApps = async (newApps: typeof apps) => {
    setApps(newApps);
    await saveToStorage(STORAGE_KEYS.apps, newApps);
  };

  return { apps, isLoading, setIsLoading, setApps: saveApps };
}

// ============================================
// HOOKS PARA CONFIGURACIÓN
// ============================================

export function useFavorites() {
  const [favorites, setFavorites] = useAtom(favoritesAtom);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.favorites, []);
    setFavorites(stored);
  };

  const addFavorite = async (appId: string) => {
    const updated = [...favorites, appId];
    setFavorites(updated);
    await saveToStorage(STORAGE_KEYS.favorites, updated);
  };

  const removeFavorite = async (appId: string) => {
    const updated = favorites.filter(id => id !== appId);
    setFavorites(updated);
    await saveToStorage(STORAGE_KEYS.favorites, updated);
  };

  return { favorites, addFavorite, removeFavorite };
}

export function useLaunchHistory() {
  const [history, setHistory] = useAtom(launchHistoryAtom);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.launchHistory, []);
    setHistory(stored);
  };

  const addToHistory = async (entry: { id: string; timestamp: number; appName: string }) => {
    const updated = [entry, ...history].slice(0, 100); // Limitar a 100
    setHistory(updated);
    await saveToStorage(STORAGE_KEYS.launchHistory, updated);
  };

  return { history, addToHistory };
}

// ============================================
// HOOKS PARA POMODORO
// ============================================

export function usePomodoroConfig() {
  const [config, setConfig] = useAtom(pomodoroConfigAtom);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.pomodoroConfig, config);
    setConfig(stored);
  };

  const updateConfig = async (newConfig: typeof config) => {
    setConfig(newConfig);
    await saveToStorage(STORAGE_KEYS.pomodoroConfig, newConfig);
  };

  return { config, updateConfig };
}

export function usePomodoroState() {
  const [state, setState] = useAtom(pomodoroStateAtom);

  const updateState = async (newState: typeof state) => {
    setState(newState);
    await saveToStorage(STORAGE_KEYS.pomodoroState, newState);
  };

  return { state, updateState };
}

// ============================================
// HOOKS PARA FLASHCARDS
// ============================================

export function useFlashcards() {
  const [flashcards, setFlashcards] = useAtom(flashcardsAtom);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.flashcards, []);
    setFlashcards(stored);
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return firebaseAuth.isAuthenticated();
  };

  const addFlashcard = async (flashcard: typeof flashcards[0]) => {
    const updated = [...flashcards, flashcard];
    setFlashcards(updated);
    await saveToStorage(STORAGE_KEYS.flashcards, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncFlashcard(flashcard);
        console.log('✅ Flashcard guardada en Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando flashcard con Firestore:', error);
        // No lanzamos el error para que la app funcione sin Firebase
      }
    }
  };

  const updateFlashcards = async (updated: typeof flashcards) => {
    setFlashcards(updated);
    await saveToStorage(STORAGE_KEYS.flashcards, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncFlashcards(updated);
        console.log('✅ Flashcards sincronizadas con Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando flashcards con Firestore:', error);
        // No lanzamos el error para que la app funcione sin Firebase
      }
    }
  };

  const deleteFlashcard = async (flashcardId: string) => {
    const updated = flashcards.filter(f => f.id !== flashcardId);
    setFlashcards(updated);
    await saveToStorage(STORAGE_KEYS.flashcards, updated);
    
    // Eliminar de Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.deleteFlashcard(flashcardId);
        console.log('✅ Flashcard eliminada de Firestore');
      } catch (error) {
        console.error('⚠️ Error eliminando flashcard de Firestore:', error);
      }
    }
  };

  return { flashcards, addFlashcard, updateFlashcards, deleteFlashcard };
}

// ============================================
// HOOKS PARA NOTES
// ============================================

export function useNotes() {
  const [notes, setNotes] = useAtom(notesAtom);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.notes, []);
    setNotes(stored);
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return firebaseAuth.isAuthenticated();
  };

  const addNote = async (note: typeof notes[0]) => {
    const updated = [...notes, note];
    setNotes(updated);
    await saveToStorage(STORAGE_KEYS.notes, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncNote(note);
        console.log('✅ Nota guardada en Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando nota con Firestore:', error);
      }
    }
  };

  const updateNote = async (id: string, updates: Partial<typeof notes[0]>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    setNotes(updated);
    await saveToStorage(STORAGE_KEYS.notes, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        const updatedNote = updated.find(n => n.id === id);
        if (updatedNote) {
          await firebaseSync.syncNote(updatedNote);
          console.log('✅ Nota actualizada en Firestore');
        }
      } catch (error) {
        console.error('⚠️ Error actualizando nota en Firestore:', error);
      }
    }
  };

  const deleteNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await saveToStorage(STORAGE_KEYS.notes, updated);
    
    // Eliminar de Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.deleteNote(id);
        console.log('✅ Nota eliminada de Firestore');
      } catch (error) {
        console.error('⚠️ Error eliminando nota de Firestore:', error);
      }
    }
  };

  const updateNotes = async (updated: typeof notes) => {
    setNotes(updated);
    await saveToStorage(STORAGE_KEYS.notes, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncNotes(updated);
        console.log('✅ Notas sincronizadas con Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando notas con Firestore:', error);
      }
    }
  };

  return { notes, addNote, updateNote, deleteNote, updateNotes };
}

// ============================================
// HOOKS PARA TODOS
// ============================================

export function useTodos() {
  const [todos, setTodos] = useAtom(todosAtom);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.todos, []);
    setTodos(stored);
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return firebaseAuth.isAuthenticated();
  };

  const addTodo = async (todo: typeof todos[0]) => {
    const updated = [...todos, todo];
    setTodos(updated);
    await saveToStorage(STORAGE_KEYS.todos, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncTodo(todo);
        console.log('✅ Tarea guardada en Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando tarea con Firestore:', error);
      }
    }
  };

  const updateTodo = async (id: string, updates: Partial<typeof todos[0]>) => {
    const updated = todos.map(t => t.id === id ? { ...t, ...updates } : t);
    setTodos(updated);
    await saveToStorage(STORAGE_KEYS.todos, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        const updatedTodo = updated.find(t => t.id === id);
        if (updatedTodo) {
          await firebaseSync.syncTodo(updatedTodo);
          console.log('✅ Tarea actualizada en Firestore');
        }
      } catch (error) {
        console.error('⚠️ Error actualizando tarea en Firestore:', error);
      }
    }
  };

  const deleteTodo = async (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    await saveToStorage(STORAGE_KEYS.todos, updated);
    
    // Eliminar de Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.deleteTodo(id);
        console.log('✅ Tarea eliminada de Firestore');
      } catch (error) {
        console.error('⚠️ Error eliminando tarea de Firestore:', error);
      }
    }
  };

  const updateTodos = async (updated: typeof todos) => {
    setTodos(updated);
    await saveToStorage(STORAGE_KEYS.todos, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncTodos(updated);
        console.log('✅ Tareas sincronizadas con Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando tareas con Firestore:', error);
      }
    }
  };

  return { todos, addTodo, updateTodo, deleteTodo, updateTodos };
}

// ============================================
// HOOKS PARA SNIPPETS
// ============================================

export function useSnippets() {
  const [snippets, setSnippets] = useAtom(snippetsAtom);

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.snippets, []);
    setSnippets(stored);
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return firebaseAuth.isAuthenticated();
  };

  const addSnippet = async (snippet: typeof snippets[0]) => {
    const updated = [...snippets, snippet];
    setSnippets(updated);
    await saveToStorage(STORAGE_KEYS.snippets, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncSnippet(snippet);
        console.log('✅ Snippet guardado en Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando snippet con Firestore:', error);
      }
    }
  };

  const updateSnippets = async (updated: typeof snippets) => {
    setSnippets(updated);
    await saveToStorage(STORAGE_KEYS.snippets, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncSnippets(updated);
        console.log('✅ Snippets sincronizados con Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando snippets con Firestore:', error);
      }
    }
  };

  const deleteSnippet = async (snippetId: string) => {
    const updated = snippets.filter(s => s.id !== snippetId);
    setSnippets(updated);
    await saveToStorage(STORAGE_KEYS.snippets, updated);
    
    // Eliminar de Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.deleteSnippet(snippetId);
        console.log('✅ Snippet eliminado de Firestore');
      } catch (error) {
        console.error('⚠️ Error eliminando snippet de Firestore:', error);
      }
    }
  };

  return { snippets, addSnippet, updateSnippets, deleteSnippet };
}

// ============================================
// HOOKS PARA QUIZZES
// ============================================

export function useQuizzes() {
  const [quizzes, setQuizzes] = useAtom(quizzesAtom);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    const stored = await loadFromStorage(STORAGE_KEYS.quizzes, []);
    setQuizzes(stored);
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return firebaseAuth.isAuthenticated();
  };

  const addQuiz = async (quiz: typeof quizzes[0]) => {
    const updated = [...quizzes, quiz];
    setQuizzes(updated);
    await saveToStorage(STORAGE_KEYS.quizzes, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncQuiz(quiz);
        console.log('✅ Quiz guardado en Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando quiz con Firestore:', error);
      }
    }
  };

  const updateQuizzes = async (updated: typeof quizzes) => {
    setQuizzes(updated);
    await saveToStorage(STORAGE_KEYS.quizzes, updated);
    
    // Sincronizar con Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.syncQuizzes(updated);
        console.log('✅ Quizzes sincronizados con Firestore');
      } catch (error) {
        console.error('⚠️ Error sincronizando quizzes con Firestore:', error);
      }
    }
  };

  const deleteQuiz = async (quizId: string) => {
    const updated = quizzes.filter(q => q.id !== quizId);
    setQuizzes(updated);
    await saveToStorage(STORAGE_KEYS.quizzes, updated);
    
    // Eliminar de Firestore si está autenticado
    if (isAuthenticated()) {
      try {
        await firebaseSync.deleteQuiz(quizId);
        console.log('✅ Quiz eliminado de Firestore');
      } catch (error) {
        console.error('⚠️ Error eliminando quiz de Firestore:', error);
      }
    }
  };

  return { quizzes, addQuiz, updateQuizzes, deleteQuiz };
}

// ============================================
// HOOKS DERIVADOS
// ============================================

export function useFavoriteApps() {
  return useAtomValue(favoriteAppsAtom);
}

export function useRecentApps() {
  return useAtomValue(recentAppsAtom);
}

