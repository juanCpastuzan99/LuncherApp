/**
 * Funciones de consulta optimizadas para Firestore
 * Utilizan los índices configurados para mejor rendimiento
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from './config';
import { firebaseAuth } from './auth';
import type { Flashcard } from '../renderer/store/atoms';
import type { Note } from '../renderer/components/NotesList';
import type { Todo } from '../ai/todoManager';
import type { CodeSnippet } from '../ai/codeSnippets';
import type { Quiz } from '../renderer/store/atoms';

/**
 * Obtener ID del usuario actual
 */
function getUserId(): string {
  const userId = firebaseAuth.getCurrentUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  return userId;
}

// ============================================
// CONSULTAS DE FLASHCARDS
// ============================================

/**
 * Obtener flashcards por categoría ordenadas por próxima revisión
 * Usa índice: category (ASC) + nextReview (ASC)
 */
export async function getFlashcardsByCategory(category: string): Promise<Flashcard[]> {
  const userId = getUserId();
  const flashcardsRef = collection(db, `users/${userId}/flashcards`);
  
  const q = query(
    flashcardsRef,
    where('category', '==', category),
    orderBy('nextReview', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Flashcard[];
}

/**
 * Obtener flashcards pendientes de revisar (ordenadas por próxima revisión)
 * Usa índice: nextReview (ASC) + difficulty (ASC)
 */
export async function getFlashcardsToReview(): Promise<Flashcard[]> {
  const userId = getUserId();
  const flashcardsRef = collection(db, `users/${userId}/flashcards`);
  
  const now = Date.now();
  const q = query(
    flashcardsRef,
    where('nextReview', '<=', now),
    orderBy('nextReview', 'asc'),
    orderBy('difficulty', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Flashcard[];
}

/**
 * Obtener flashcards recientemente revisadas por categoría
 * Usa índice: category (ASC) + lastReviewed (DESC)
 */
export async function getRecentFlashcardsByCategory(category: string, limitCount: number = 10): Promise<Flashcard[]> {
  const userId = getUserId();
  const flashcardsRef = collection(db, `users/${userId}/flashcards`);
  
  const q = query(
    flashcardsRef,
    where('category', '==', category),
    orderBy('lastReviewed', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Flashcard[];
}

// ============================================
// CONSULTAS DE NOTES
// ============================================

/**
 * Obtener notes por categoría ordenadas por última actualización
 * Usa índice: category (ASC) + updatedAt (DESC)
 */
export async function getNotesByCategory(category: string): Promise<Note[]> {
  const userId = getUserId();
  const notesRef = collection(db, `users/${userId}/notes`);
  
  const q = query(
    notesRef,
    where('category', '==', category),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Note[];
}

/**
 * Obtener notes por tag
 * Usa índice: tags (array-contains) + updatedAt (DESC)
 */
export async function getNotesByTag(tag: string): Promise<Note[]> {
  const userId = getUserId();
  const notesRef = collection(db, `users/${userId}/notes`);
  
  const q = query(
    notesRef,
    where('tags', 'array-contains', tag),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Note[];
}

/**
 * Obtener notes recientes por categoría
 * Usa índice: category (ASC) + createdAt (DESC)
 */
export async function getRecentNotesByCategory(category: string, limitCount: number = 20): Promise<Note[]> {
  const userId = getUserId();
  const notesRef = collection(db, `users/${userId}/notes`);
  
  const q = query(
    notesRef,
    where('category', '==', category),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Note[];
}

// ============================================
// CONSULTAS DE TODOS
// ============================================

/**
 * Obtener todos pendientes ordenados por fecha de creación
 * Usa índice: completed (ASC) + createdAt (DESC)
 */
export async function getPendingTodos(): Promise<Todo[]> {
  const userId = getUserId();
  const todosRef = collection(db, `users/${userId}/todos`);
  
  const q = query(
    todosRef,
    where('completed', '==', false),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Todo[];
}

/**
 * Obtener todos pendientes ordenados por fecha de vencimiento
 * Usa índice: completed (ASC) + dueDate (ASC)
 */
export async function getTodosByDueDate(): Promise<Todo[]> {
  const userId = getUserId();
  const todosRef = collection(db, `users/${userId}/todos`);
  
  const q = query(
    todosRef,
    where('completed', '==', false),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Todo[];
}

/**
 * Obtener todos por prioridad y fecha de vencimiento
 * Usa índice: priority (ASC) + dueDate (ASC)
 */
export async function getTodosByPriority(priority: 'low' | 'medium' | 'high'): Promise<Todo[]> {
  const userId = getUserId();
  const todosRef = collection(db, `users/${userId}/todos`);
  
  const q = query(
    todosRef,
    where('priority', '==', priority),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Todo[];
}

// ============================================
// CONSULTAS DE SNIPPETS
// ============================================

/**
 * Obtener snippets por lenguaje
 * Usa índice: language (ASC) + createdAt (DESC)
 */
export async function getSnippetsByLanguage(language: string): Promise<CodeSnippet[]> {
  const userId = getUserId();
  const snippetsRef = collection(db, `users/${userId}/snippets`);
  
  const q = query(
    snippetsRef,
    where('language', '==', language),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CodeSnippet[];
}

/**
 * Obtener snippets públicos por lenguaje
 * Usa índice: isPublic (ASC) + language (ASC) + createdAt (DESC)
 */
export async function getPublicSnippetsByLanguage(language: string, limitCount: number = 50): Promise<CodeSnippet[]> {
  const userId = getUserId();
  const snippetsRef = collection(db, `users/${userId}/snippets`);
  
  const q = query(
    snippetsRef,
    where('isPublic', '==', true),
    where('language', '==', language),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CodeSnippet[];
}

/**
 * Obtener snippets por tag
 * Usa índice: tags (array-contains) + createdAt (DESC)
 */
export async function getSnippetsByTag(tag: string): Promise<CodeSnippet[]> {
  const userId = getUserId();
  const snippetsRef = collection(db, `users/${userId}/snippets`);
  
  const q = query(
    snippetsRef,
    where('tags', 'array-contains', tag),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CodeSnippet[];
}

// ============================================
// CONSULTAS DE QUIZZES
// ============================================

/**
 * Obtener quizzes por categoría
 * Usa índice: category (ASC) + createdAt (DESC)
 */
export async function getQuizzesByCategory(category: string): Promise<Quiz[]> {
  const userId = getUserId();
  const quizzesRef = collection(db, `users/${userId}/quizzes`);
  
  const q = query(
    quizzesRef,
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Quiz[];
}

/**
 * Obtener quizzes públicos por categoría
 * Usa índice: isPublic (ASC) + category (ASC) + createdAt (DESC)
 */
export async function getPublicQuizzesByCategory(category: string, limitCount: number = 20): Promise<Quiz[]> {
  const userId = getUserId();
  const quizzesRef = collection(db, `users/${userId}/quizzes`);
  
  const q = query(
    quizzesRef,
    where('isPublic', '==', true),
    where('category', '==', category),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Quiz[];
}

// ============================================
// CONSULTAS DE POMODORO STATS
// ============================================

/**
 * Obtener estadísticas de Pomodoro ordenadas por fecha
 * Usa índice: date (DESC)
 */
export async function getPomodoroStats(limitCount: number = 30): Promise<any[]> {
  const userId = getUserId();
  const statsRef = collection(db, `users/${userId}/pomodoro/stats`);
  
  const q = query(
    statsRef,
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Obtener días con más pomodoros
 * Usa índice: totalPomodoros (DESC) + date (DESC)
 */
export async function getTopPomodoroDays(limitCount: number = 10): Promise<any[]> {
  const userId = getUserId();
  const statsRef = collection(db, `users/${userId}/pomodoro/stats`);
  
  const q = query(
    statsRef,
    orderBy('totalPomodoros', 'desc'),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

