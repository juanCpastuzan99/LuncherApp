/**
 * Servicio de Sincronización con Firebase
 * Sincroniza datos entre dispositivos en tiempo real
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { firebaseAuth } from './auth';
import type { Flashcard } from '../renderer/store/atoms';
import type { Note } from '../renderer/components/NotesList';
import type { Todo } from '../ai/todoManager';
import type { CodeSnippet } from '../ai/codeSnippets';
import type { Quiz } from '../renderer/store/atoms';

export class FirebaseSync {
  /**
   * Obtener ID del usuario actual
   */
  private getUserId(): string | null {
    return firebaseAuth.getCurrentUserId();
  }

  /**
   * Verificar autenticación
   */
  private ensureAuthenticated(): string {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
    }
    return userId;
  }

  // ============================================
  // FLASHCARDS
  // ============================================

  /**
   * Sincronizar todas las flashcards con Firebase
   */
  async syncFlashcards(flashcards: Flashcard[]): Promise<void> {
    const userId = this.ensureAuthenticated();
    const flashcardsRef = collection(db, `users/${userId}/flashcards`);

    try {
      const batch = writeBatch(db);
      
      flashcards.forEach((flashcard) => {
        const flashcardRef = doc(flashcardsRef, flashcard.id);
        batch.set(flashcardRef, {
          ...flashcard,
          updatedAt: serverTimestamp(),
          syncedAt: Date.now()
        }, { merge: true });
      });

      await batch.commit();
      console.log('✅ Flashcards sincronizadas con Firebase');
    } catch (error) {
      console.error('❌ Error sincronizando flashcards:', error);
      throw error;
    }
  }

  /**
   * Sincronizar una flashcard individual
   */
  async syncFlashcard(flashcard: Flashcard): Promise<void> {
    const userId = this.ensureAuthenticated();
    const flashcardRef = doc(db, `users/${userId}/flashcards/${flashcard.id}`);

    try {
      await setDoc(flashcardRef, {
        ...flashcard,
        updatedAt: serverTimestamp(),
        syncedAt: Date.now()
      }, { merge: true });
      console.log(`✅ Flashcard ${flashcard.id} sincronizada`);
    } catch (error) {
      console.error('❌ Error sincronizando flashcard:', error);
      throw error;
    }
  }

  /**
   * Eliminar flashcard de Firebase
   */
  async deleteFlashcard(flashcardId: string): Promise<void> {
    const userId = this.ensureAuthenticated();
    const flashcardRef = doc(db, `users/${userId}/flashcards/${flashcardId}`);

    try {
      await deleteDoc(flashcardRef);
      console.log(`✅ Flashcard ${flashcardId} eliminada de Firebase`);
    } catch (error) {
      console.error('❌ Error eliminando flashcard:', error);
      throw error;
    }
  }

  /**
   * Cargar flashcards desde Firebase
   */
  async loadFlashcards(): Promise<Flashcard[]> {
    const userId = this.ensureAuthenticated();
    const flashcardsRef = collection(db, `users/${userId}/flashcards`);

    try {
      const snapshot = await getDocs(flashcardsRef);
      const flashcards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flashcard[];

      console.log(`✅ ${flashcards.length} flashcards cargadas desde Firebase`);
      return flashcards;
    } catch (error) {
      console.error('❌ Error cargando flashcards:', error);
      throw error;
    }
  }

  /**
   * Escuchar cambios en flashcards en tiempo real
   */
  subscribeToFlashcards(callback: (flashcards: Flashcard[]) => void): () => void {
    const userId = this.getUserId();
    if (!userId) {
      console.warn('⚠️ Usuario no autenticado, no se puede suscribir a flashcards');
      return () => {};
    }

    const flashcardsRef = collection(db, `users/${userId}/flashcards`);
    
    return onSnapshot(flashcardsRef, (snapshot) => {
      const flashcards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flashcard[];
      
      console.log(`🔄 ${flashcards.length} flashcards actualizadas desde Firebase`);
      callback(flashcards);
    }, (error) => {
      console.error('❌ Error en suscripción de flashcards:', error);
    });
  }

  // ============================================
  // NOTES
  // ============================================

  async syncNotes(notes: Note[]): Promise<void> {
    const userId = this.ensureAuthenticated();
    const notesRef = collection(db, `users/${userId}/notes`);

    try {
      const batch = writeBatch(db);
      
      notes.forEach((note) => {
        const noteRef = doc(notesRef, note.id);
        batch.set(noteRef, {
          ...note,
          updatedAt: serverTimestamp(),
          syncedAt: Date.now()
        }, { merge: true });
      });

      await batch.commit();
      console.log('✅ Notes sincronizadas con Firebase');
    } catch (error) {
      console.error('❌ Error sincronizando notes:', error);
      throw error;
    }
  }

  async syncNote(note: Note): Promise<void> {
    const userId = this.ensureAuthenticated();
    const noteRef = doc(db, `users/${userId}/notes/${note.id}`);

    try {
      await setDoc(noteRef, {
        ...note,
        updatedAt: serverTimestamp(),
        syncedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error sincronizando note:', error);
      throw error;
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    const userId = this.ensureAuthenticated();
    const noteRef = doc(db, `users/${userId}/notes/${noteId}`);
    await deleteDoc(noteRef);
  }

  async loadNotes(): Promise<Note[]> {
    const userId = this.ensureAuthenticated();
    const notesRef = collection(db, `users/${userId}/notes`);

    const snapshot = await getDocs(notesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Note[];
  }

  subscribeToNotes(callback: (notes: Note[]) => void): () => void {
    const userId = this.getUserId();
    if (!userId) return () => {};

    const notesRef = collection(db, `users/${userId}/notes`);
    
    return onSnapshot(notesRef, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      callback(notes);
    });
  }

  // ============================================
  // TODOS
  // ============================================

  async syncTodos(todos: Todo[]): Promise<void> {
    const userId = this.ensureAuthenticated();
    const todosRef = collection(db, `users/${userId}/todos`);

    const batch = writeBatch(db);
    todos.forEach((todo) => {
      const todoRef = doc(todosRef, todo.id);
      batch.set(todoRef, {
        ...todo,
        updatedAt: serverTimestamp(),
        syncedAt: Date.now()
      }, { merge: true });
    });

    await batch.commit();
  }

  async syncTodo(todo: Todo): Promise<void> {
    const userId = this.ensureAuthenticated();
    const todoRef = doc(db, `users/${userId}/todos/${todo.id}`);

    await setDoc(todoRef, {
      ...todo,
      updatedAt: serverTimestamp(),
      syncedAt: Date.now()
    }, { merge: true });
  }

  async deleteTodo(todoId: string): Promise<void> {
    const userId = this.ensureAuthenticated();
    const todoRef = doc(db, `users/${userId}/todos/${todoId}`);
    await deleteDoc(todoRef);
  }

  async loadTodos(): Promise<Todo[]> {
    const userId = this.ensureAuthenticated();
    const todosRef = collection(db, `users/${userId}/todos`);

    const snapshot = await getDocs(todosRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Todo[];
  }

  subscribeToTodos(callback: (todos: Todo[]) => void): () => void {
    const userId = this.getUserId();
    if (!userId) return () => {};

    const todosRef = collection(db, `users/${userId}/todos`);
    
    return onSnapshot(todosRef, (snapshot) => {
      const todos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Todo[];
      callback(todos);
    });
  }

  // ============================================
  // SNIPPETS
  // ============================================

  async syncSnippets(snippets: CodeSnippet[]): Promise<void> {
    const userId = this.ensureAuthenticated();
    const snippetsRef = collection(db, `users/${userId}/snippets`);

    const batch = writeBatch(db);
    snippets.forEach((snippet) => {
      const snippetRef = doc(snippetsRef, snippet.id);
      batch.set(snippetRef, {
        ...snippet,
        updatedAt: serverTimestamp(),
        syncedAt: Date.now()
      }, { merge: true });
    });

    await batch.commit();
  }

  async syncSnippet(snippet: CodeSnippet): Promise<void> {
    const userId = this.ensureAuthenticated();
    const snippetRef = doc(db, `users/${userId}/snippets/${snippet.id}`);

    try {
      await setDoc(snippetRef, {
        ...snippet,
        updatedAt: serverTimestamp(),
        syncedAt: Date.now()
      }, { merge: true });
      console.log(`✅ Snippet ${snippet.id} sincronizado`);
    } catch (error) {
      console.error('❌ Error sincronizando snippet:', error);
      throw error;
    }
  }

  async deleteSnippet(snippetId: string): Promise<void> {
    const userId = this.ensureAuthenticated();
    const snippetRef = doc(db, `users/${userId}/snippets/${snippetId}`);

    try {
      await deleteDoc(snippetRef);
      console.log(`✅ Snippet ${snippetId} eliminado de Firebase`);
    } catch (error) {
      console.error('❌ Error eliminando snippet:', error);
      throw error;
    }
  }

  subscribeToSnippets(callback: (snippets: CodeSnippet[]) => void): () => void {
    const userId = this.getUserId();
    if (!userId) return () => {};

    const snippetsRef = collection(db, `users/${userId}/snippets`);
    
    return onSnapshot(snippetsRef, (snapshot) => {
      const snippets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CodeSnippet[];
      callback(snippets);
    });
  }

  // ============================================
  // QUIZZES
  // ============================================

  async syncQuizzes(quizzes: Quiz[]): Promise<void> {
    const userId = this.ensureAuthenticated();
    const quizzesRef = collection(db, `users/${userId}/quizzes`);

    const batch = writeBatch(db);
    quizzes.forEach((quiz) => {
      const quizRef = doc(quizzesRef, quiz.id);
      batch.set(quizRef, {
        ...quiz,
        updatedAt: serverTimestamp(),
        syncedAt: Date.now()
      }, { merge: true });
    });

    await batch.commit();
  }

  async syncQuiz(quiz: Quiz): Promise<void> {
    const userId = this.ensureAuthenticated();
    const quizRef = doc(db, `users/${userId}/quizzes/${quiz.id}`);

    try {
      await setDoc(quizRef, {
        ...quiz,
        updatedAt: serverTimestamp(),
        syncedAt: Date.now()
      }, { merge: true });
      console.log(`✅ Quiz ${quiz.id} sincronizado`);
    } catch (error) {
      console.error('❌ Error sincronizando quiz:', error);
      throw error;
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    const userId = this.ensureAuthenticated();
    const quizRef = doc(db, `users/${userId}/quizzes/${quizId}`);

    try {
      await deleteDoc(quizRef);
      console.log(`✅ Quiz ${quizId} eliminado de Firebase`);
    } catch (error) {
      console.error('❌ Error eliminando quiz:', error);
      throw error;
    }
  }

  subscribeToQuizzes(callback: (quizzes: Quiz[]) => void): () => void {
    const userId = this.getUserId();
    if (!userId) return () => {};

    const quizzesRef = collection(db, `users/${userId}/quizzes`);
    
    return onSnapshot(quizzesRef, (snapshot) => {
      const quizzes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quiz[];
      callback(quizzes);
    });
  }

  // ============================================
  // POMODORO STATS
  // ============================================

  async syncPomodoroStats(date: string, stats: {
    totalPomodoros: number;
    totalWorkTime: number;
    sessions: Array<{
      startTime: number;
      endTime: number;
      duration: number;
      type: 'work' | 'shortBreak' | 'longBreak';
    }>;
  }): Promise<void> {
    const userId = this.ensureAuthenticated();
    const statsRef = doc(db, `users/${userId}/pomodoro/stats/${date}`);

    await setDoc(statsRef, {
      ...stats,
      date,
      updatedAt: serverTimestamp(),
      syncedAt: Date.now()
    }, { merge: true });
  }

  async loadPomodoroStats(date: string): Promise<any> {
    const userId = this.ensureAuthenticated();
    const statsRef = doc(db, `users/${userId}/pomodoro/stats/${date}`);
    
    const docSnap = await getDoc(statsRef);
    return docSnap.exists() ? docSnap.data() : null;
  }
}

export const firebaseSync = new FirebaseSync();

