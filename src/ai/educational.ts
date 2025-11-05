/**
 * Funciones educativas: Algoritmo de repetición espaciada (SM-2)
 * Para sistema de tarjetas de estudio
 */

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: number; // 0-5 (0 = nueva, 5 = fácil)
  lastReviewed: number; // timestamp
  nextReview: number; // timestamp
  reviewCount: number;
  correctCount: number;
  easeFactor: number; // Factor de facilidad (default 2.5)
}

/**
 * Algoritmo SM-2 para repetición espaciada
 * Calcula cuándo revisar una tarjeta basándose en el rendimiento
 */
export function calculateNextReview(
  flashcard: Flashcard,
  quality: number // 0-5 (0 = olvidado, 5 = fácil)
): Flashcard {
  const updated = { ...flashcard };
  const now = Date.now();
  
  // Si es la primera vez (reviewCount = 0)
  if (updated.reviewCount === 0) {
    if (quality >= 3) {
      updated.reviewCount = 1;
      updated.nextReview = now + (1 * 24 * 60 * 60 * 1000); // 1 día
      updated.easeFactor = 2.5;
    } else {
      updated.nextReview = now + (1 * 60 * 60 * 1000); // 1 hora
    }
  } else {
    // Actualizar ease factor
    updated.easeFactor = Math.max(
      1.3,
      updated.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    
    // Calcular intervalo
    if (quality < 3) {
      // Resetear si falló
      updated.reviewCount = 0;
      updated.nextReview = now + (1 * 60 * 60 * 1000); // 1 hora
    } else {
      const interval = updated.reviewCount === 1 
        ? 1 // 1 día
        : updated.reviewCount === 2
        ? 6 // 6 días
        : Math.round(updated.reviewCount * updated.easeFactor); // días
      
      updated.nextReview = now + (interval * 24 * 60 * 60 * 1000);
      updated.reviewCount += 1;
    }
  }
  
  // Actualizar estadísticas
  if (quality >= 3) {
    updated.correctCount += 1;
  }
  updated.lastReviewed = now;
  updated.difficulty = quality;
  
  return updated;
}

/**
 * Obtiene tarjetas que necesitan revisión
 */
export function getCardsToReview(
  flashcards: Flashcard[],
  category?: string
): Flashcard[] {
  const now = Date.now();
  const filtered = category
    ? flashcards.filter(c => c.category === category)
    : flashcards;
  
  return filtered
    .filter(card => card.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview);
}

/**
 * Obtiene estadísticas de tarjetas
 */
export function getFlashcardStats(flashcards: Flashcard[]) {
  const total = flashcards.length;
  const due = flashcards.filter(c => c.nextReview <= Date.now()).length;
  const mastered = flashcards.filter(c => c.reviewCount > 10 && c.correctCount / c.reviewCount > 0.8).length;
  const categories = new Set(flashcards.map(c => c.category));
  
  return {
    total,
    due,
    mastered,
    categories: Array.from(categories),
    avgCorrectRate: total > 0
      ? flashcards.reduce((sum, c) => sum + (c.correctCount / Math.max(c.reviewCount, 1)), 0) / total
      : 0
  };
}

/**
 * Crear nueva tarjeta
 */
export function createFlashcard(
  question: string,
  answer: string,
  category: string = 'general'
): Flashcard {
  const now = Date.now();
  return {
    id: `flashcard-${now}-${Math.random().toString(36).substr(2, 9)}`,
    question: question.trim(),
    answer: answer.trim(),
    category: category.toLowerCase(),
    difficulty: 0,
    lastReviewed: 0,
    nextReview: now, // Revisar inmediatamente
    reviewCount: 0,
    correctCount: 0,
    easeFactor: 2.5
  };
}

