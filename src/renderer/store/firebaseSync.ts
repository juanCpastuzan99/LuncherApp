/**
 * Hook para sincronización automática con Firebase
 * Sincroniza datos entre dispositivos en tiempo real
 */

import { useEffect, useState } from 'react';
import { firebaseSync } from '../../firebase/sync';
import { firebaseAuth } from '../../firebase/auth';
import { useFlashcards } from './hooks';
import { useNotes } from './hooks';
import { useTodos } from './hooks';
import { useSnippets } from './hooks';
import { useQuizzes } from './hooks';

/**
 * Hook principal para sincronización multi-dispositivo
 */
export function useFirebaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { flashcards, updateFlashcards } = useFlashcards();
  const { notes, updateNotes } = useNotes();
  const { todos, updateTodos } = useTodos();
  const { snippets, updateSnippets } = useSnippets();
  const { quizzes, updateQuizzes } = useQuizzes();

  // Verificar estado de autenticación
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      if (user) {
        console.log('✅ Usuario autenticado:', user.email);
        // Iniciar sincronización cuando se autentica
        startSync();
      } else {
        console.log('⚠️ Usuario no autenticado');
      }
    });

    return unsubscribe;
  }, []);

  // Sincronizar flashcards al cambiar
  useEffect(() => {
    if (isAuthenticated && flashcards.length > 0) {
      syncFlashcards();
    }
  }, [flashcards, isAuthenticated]);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!isAuthenticated) return;

    // Suscribirse a cambios en tiempo real
    const unsubscribeFlashcards = firebaseSync.subscribeToFlashcards((firebaseFlashcards) => {
      // Solo actualizar si hay diferencias
      const hasChanges = JSON.stringify(firebaseFlashcards) !== JSON.stringify(flashcards);
      if (hasChanges) {
        console.log('🔄 Sincronizando flashcards desde otro dispositivo');
        updateFlashcards(firebaseFlashcards);
      }
    });

    const unsubscribeNotes = firebaseSync.subscribeToNotes((firebaseNotes) => {
      const hasChanges = JSON.stringify(firebaseNotes) !== JSON.stringify(notes);
      if (hasChanges) {
        console.log('🔄 Sincronizando notes desde otro dispositivo');
        updateNotes(firebaseNotes);
      }
    });

    const unsubscribeTodos = firebaseSync.subscribeToTodos((firebaseTodos) => {
      const hasChanges = JSON.stringify(firebaseTodos) !== JSON.stringify(todos);
      if (hasChanges) {
        console.log('🔄 Sincronizando todos desde otro dispositivo');
        updateTodos(firebaseTodos);
      }
    });

    const unsubscribeSnippets = firebaseSync.subscribeToSnippets((firebaseSnippets) => {
      const hasChanges = JSON.stringify(firebaseSnippets) !== JSON.stringify(snippets);
      if (hasChanges) {
        console.log('🔄 Sincronizando snippets desde otro dispositivo');
        updateSnippets(firebaseSnippets);
      }
    });

    const unsubscribeQuizzes = firebaseSync.subscribeToQuizzes((firebaseQuizzes) => {
      const hasChanges = JSON.stringify(firebaseQuizzes) !== JSON.stringify(quizzes);
      if (hasChanges) {
        console.log('🔄 Sincronizando quizzes desde otro dispositivo');
        updateQuizzes(firebaseQuizzes);
      }
    });

    return () => {
      unsubscribeFlashcards();
      unsubscribeNotes();
      unsubscribeTodos();
      unsubscribeSnippets();
      unsubscribeQuizzes();
    };
  }, [isAuthenticated, flashcards, notes, todos, snippets, quizzes]);

  /**
   * Iniciar sincronización completa
   */
  const startSync = async () => {
    if (!isAuthenticated) {
      setSyncError('Usuario no autenticado');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Cargar datos desde Firebase primero
      console.log('📥 Cargando datos desde Firebase...');
      
      const [firebaseFlashcards, firebaseNotes, firebaseTodos] = await Promise.all([
        firebaseSync.loadFlashcards().catch(() => []),
        firebaseSync.loadNotes().catch(() => []),
        firebaseSync.loadTodos().catch(() => [])
      ]);

      // Actualizar con datos de Firebase (merge inteligente)
      if (firebaseFlashcards.length > 0) {
        updateFlashcards(firebaseFlashcards);
      }
      if (firebaseNotes.length > 0) {
        updateNotes(firebaseNotes);
      }
      if (firebaseTodos.length > 0) {
        updateTodos(firebaseTodos);
      }

      // Sincronizar datos locales con Firebase
      console.log('📤 Sincronizando datos locales con Firebase...');
      await Promise.all([
        firebaseSync.syncFlashcards(flashcards.length > 0 ? flashcards : firebaseFlashcards),
        firebaseSync.syncNotes(notes.length > 0 ? notes : firebaseNotes),
        firebaseSync.syncTodos(todos.length > 0 ? todos : firebaseTodos)
      ]);

      console.log('✅ Sincronización completa');
    } catch (error: any) {
      console.error('❌ Error en sincronización:', error);
      setSyncError(error.message || 'Error de sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Sincronizar flashcards manualmente
   */
  const syncFlashcards = async () => {
    if (!isAuthenticated || flashcards.length === 0) return;

    try {
      await firebaseSync.syncFlashcards(flashcards);
    } catch (error: any) {
      console.error('Error sincronizando flashcards:', error);
      setSyncError(error.message);
    }
  };

  return {
    isSyncing,
    syncError,
    isAuthenticated,
    startSync,
    syncFlashcards
  };
}

