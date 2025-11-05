/**
 * Store de Zustand para gestión de tarjetas de estudio (Flashcards)
 */

import { create } from 'zustand';
import type { Flashcard } from '../../ai/educational';
import { 
  calculateNextReview, 
  getCardsToReview, 
  getFlashcardStats,
  createFlashcard as createCard
} from '../../ai/educational';

interface FlashcardState {
  flashcards: Flashcard[];
  currentCard: Flashcard | null;
  currentIndex: number;
  studyMode: 'review' | 'browse' | null;
  showAnswer: boolean;
  
  // Acciones
  loadFlashcards: () => Promise<void>;
  saveFlashcards: () => Promise<void>;
  addFlashcard: (question: string, answer: string, category: string) => void;
  deleteFlashcard: (id: string) => void;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  startStudySession: (category?: string) => void;
  nextCard: () => void;
  previousCard: () => void;
  revealAnswer: () => void;
  rateCard: (quality: number) => void;
  getStats: () => ReturnType<typeof getFlashcardStats>;
  getCardsToReview: (category?: string) => Flashcard[];
}

export const useFlashcardStore = create<FlashcardState>()((set, get) => ({
  flashcards: [],
  currentCard: null,
  currentIndex: 0,
  studyMode: null,
  showAnswer: false,
  
  loadFlashcards: async () => {
    try {
      const saved = await window.api.getFlashcards?.().catch(() => []);
      if (saved && Array.isArray(saved)) {
        set({ flashcards: saved });
      }
    } catch (error) {
      console.error('Error cargando tarjetas:', error);
    }
  },
  
  saveFlashcards: async () => {
    try {
      const { flashcards } = get();
      await window.api.saveFlashcards?.(flashcards).catch(() => {});
    } catch (error) {
      console.error('Error guardando tarjetas:', error);
    }
  },
  
  addFlashcard: (question, answer, category) => {
    const newCard = createCard(question, answer, category);
    const { flashcards } = get();
    set({ flashcards: [...flashcards, newCard] });
    get().saveFlashcards();
  },
  
  deleteFlashcard: (id) => {
    const { flashcards } = get();
    const filtered = flashcards.filter(c => c.id !== id);
    set({ flashcards: filtered });
    get().saveFlashcards();
  },
  
  updateFlashcard: (id, updates) => {
    const { flashcards } = get();
    const updated = flashcards.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    set({ flashcards: updated });
    get().saveFlashcards();
  },
  
  startStudySession: (category) => {
    const cardsToReview = getCardsToReview(get().flashcards, category);
    if (cardsToReview.length > 0) {
      set({
        studyMode: 'review',
        currentCard: cardsToReview[0],
        currentIndex: 0,
        showAnswer: false
      });
    }
  },
  
  nextCard: () => {
    const { flashcards, currentIndex, studyMode } = get();
    if (studyMode === 'review') {
      const cardsToReview = getCardsToReview(flashcards);
      const nextIndex = (currentIndex + 1) % cardsToReview.length;
      set({
        currentCard: cardsToReview[nextIndex],
        currentIndex: nextIndex,
        showAnswer: false
      });
    }
  },
  
  previousCard: () => {
    const { flashcards, currentIndex, studyMode } = get();
    if (studyMode === 'review') {
      const cardsToReview = getCardsToReview(flashcards);
      const prevIndex = (currentIndex - 1 + cardsToReview.length) % cardsToReview.length;
      set({
        currentCard: cardsToReview[prevIndex],
        currentIndex: prevIndex,
        showAnswer: false
      });
    }
  },
  
  revealAnswer: () => {
    set({ showAnswer: true });
  },
  
  rateCard: (quality) => {
    const { currentCard, flashcards } = get();
    if (!currentCard) return;
    
    const updated = calculateNextReview(currentCard, quality);
    const updatedList = flashcards.map(c => 
      c.id === updated.id ? updated : c
    );
    
    set({ flashcards: updatedList });
    get().saveFlashcards();
    
    // Avanzar a la siguiente tarjeta
    get().nextCard();
  },
  
  getStats: () => {
    return getFlashcardStats(get().flashcards);
  },
  
  getCardsToReview: (category) => {
    return getCardsToReview(get().flashcards, category);
  }
}));

